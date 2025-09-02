from django.http import JsonResponse, HttpRequest, HttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views import View
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db.models import Sum
import json
import logging
from supabase import create_client, Client
from typing import Dict, Any, Optional
import os
import requests

logger = logging.getLogger(__name__)

class SupabaseManager:
    """Manages Supabase client and operations"""
    
    def __init__(self):
        # Only create Supabase client if credentials are available
        if settings.SUPABASE_ANON_KEY:
            self.supabase: Client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_ANON_KEY
            )
        else:
            self.supabase = None
    
    def get_user_budgets(self, user_id: str) -> list:
        """Fetch budgets for a specific user"""
        if not self.supabase:
            logger.warning("Supabase not configured, returning empty list")
            return []
        try:
            response = self.supabase.table('budgets').select('*').eq('user_id', user_id).execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Error fetching budgets: {e}")
            return []
    
    def create_budget(self, budget_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new budget entry"""
        if not self.supabase:
            logger.warning("Supabase not configured, cannot create budget")
            return None
        try:
            response = self.supabase.table('budgets').insert(budget_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error creating budget: {e}")
            return None
    
    def update_budget(self, budget_id: str, budget_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an existing budget"""
        if not self.supabase:
            logger.warning("Supabase not configured, cannot update budget")
            return None
        try:
            response = self.supabase.table('budgets').update(budget_data).eq('id', budget_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error updating budget: {e}")
            return None
    
    def delete_budget(self, budget_id: str) -> bool:
        """Delete a budget entry"""
        if not self.supabase:
            logger.warning("Supabase not configured, cannot delete budget")
            return False
        try:
            self.supabase.table('budgets').delete().eq('id', budget_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting budget: {e}")
            return False

# Initialize Supabase manager
supabase_manager = SupabaseManager()


# ----------------------------- AUTH VIEWS -----------------------------------
@require_http_methods(["GET", "POST"]) 
def signup_view(request: HttpRequest) -> HttpResponse:
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '').strip()
        country_code = request.POST.get('country', 'US').upper()

        if not username or not email or not password:
            return render(request, 'signup.html', {'error': 'All fields are required.'})
        if User.objects.filter(username=username).exists():
            return render(request, 'signup.html', {'error': 'Username already taken.'})
        if User.objects.filter(email=email).exists():
            return render(request, 'signup.html', {'error': 'Email already registered.'})

        user = User.objects.create_user(username=username, email=email, password=password)
        # Create default profile, budget
        from .models import UserProfile, Budget
        currency_map = {
            'US': '$', 'GB': '£', 'EU': '€', 'NG': '₦', 'GH': '₵', 'KE': 'KSh', 'ZA': 'R', 'IN': '₹',
        }
        UserProfile.objects.create(user=user, country_code=country_code, currency_symbol=currency_map.get(country_code, '$'))
        Budget.objects.get_or_create(user=user, defaults={'goal_amount': 0})

        login(request, user)
        return redirect('home_page')
    return render(request, 'signup.html')


@require_http_methods(["GET", "POST"]) 
def login_view(request: HttpRequest) -> HttpResponse:
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '').strip()
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('home_page')
        return render(request, 'login.html', {'error': 'Invalid credentials.'})
    return render(request, 'login.html')


def logout_view(request: HttpRequest) -> HttpResponse:
    logout(request)
    return redirect('login')


@login_required
def home_view(request: HttpRequest) -> HttpResponse:
    from .models import Budget, Expense
    budget = Budget.objects.filter(user=request.user).first()
    total_spent = Expense.objects.filter(user=request.user).aggregate(total=Sum('amount'))['total'] or 0
    goal = budget.goal_amount if budget else 0
    # Progress and status
    progress = float(total_spent) / float(goal) * 100 if goal and goal > 0 else 0.0
    status = "You're on track 🎯" if progress < 50 else ("Caution ⚠️, watch your spending" if progress < 80 else ("Alert 🚨 You are close to your budget limit!" if progress <= 100 else "Over budget ❌"))
    profile = getattr(request.user, 'profile', None)
    currency = profile.currency_symbol if profile else '$'
    return render(request, 'home.html', {
        'username': request.user.username,
        'total_spent': total_spent,
        'goal': goal,
        'progress': round(progress, 2),
        'status': status,
        'currency': currency,
    })


@login_required
@require_http_methods(["POST"])
def set_budget_goal_view(request: HttpRequest) -> HttpResponse:
    from .models import Budget
    try:
        goal_raw = request.POST.get('goal_amount', '0').strip()
        goal_amount = float(goal_raw)
    except ValueError:
        return redirect('home_page')
    budget, _ = Budget.objects.get_or_create(user=request.user)
    budget.goal_amount = goal_amount
    budget.save()
    return redirect('home_page')


@login_required
@require_http_methods(["POST"])
def add_expense_view(request: HttpRequest) -> HttpResponse:
    from .models import Expense
    amount_raw = request.POST.get('amount', '0').strip()
    description = request.POST.get('description', '').strip()
    try:
        amount = float(amount_raw)
    except ValueError:
        return redirect('home_page')
    if amount <= 0:
        return redirect('home_page')
    Expense.objects.create(user=request.user, amount=amount, description=description)
    return redirect('home_page')

@ensure_csrf_cookie
@require_http_methods(["GET", "POST"])
def budget_api(request):
    """Main budget API endpoint"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            action = data.get('action')
            
            if action == 'calculate':
                return handle_budget_calculation(data)
            elif action == 'save':
                return handle_budget_save(data)
            elif action == 'update':
                return handle_budget_update(data)
            elif action == 'delete':
                return handle_budget_delete(data)
            else:
                return JsonResponse({'error': 'Invalid action'}, status=400)
                
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return JsonResponse({'error': 'Internal server error'}, status=500)
    
    elif request.method == 'GET':
        # Handle GET requests for fetching budgets
        user_id = request.GET.get('user_id')
        if user_id:
            budgets = supabase_manager.get_user_budgets(user_id)
            return JsonResponse({'budgets': budgets})
        else:
            return JsonResponse({'error': 'User ID required'}, status=400)

def handle_budget_calculation(data: Dict[str, Any]) -> JsonResponse:
    """Handle budget calculation logic"""
    try:
        income = float(data.get('income', 0))
        expenses = data.get('expenses', [])
        savings_goal = float(data.get('savings_goal', 0))
        
        # Calculate totals
        total_expenses = sum(float(exp.get('amount', 0)) for exp in expenses)
        savings = income - total_expenses
        savings_rate = (savings / income * 100) if income > 0 else 0
        
        # Calculate category breakdown
        category_totals = {}
        for expense in expenses:
            category = expense.get('category', 'other')
            amount = float(expense.get('amount', 0))
            category_totals[category] = category_totals.get(category, 0) + amount
        
        # Generate financial advice
        advice = generate_financial_advice(income, total_expenses, savings, savings_rate, savings_goal)
        
        result = {
            'income': income,
            'total_expenses': total_expenses,
            'savings': savings,
            'savings_rate': round(savings_rate, 2),
            'category_breakdown': category_totals,
            'advice': advice,
            'goal_achieved': savings >= savings_goal if savings_goal > 0 else None
        }
        
        return JsonResponse(result)
        
    except (ValueError, TypeError) as e:
        return JsonResponse({'error': f'Invalid data format: {str(e)}'}, status=400)
    except Exception as e:
        logger.error(f"Calculation error: {e}")
        return JsonResponse({'error': 'Calculation failed'}, status=500)

def handle_budget_save(data: Dict[str, Any]) -> JsonResponse:
    """Handle saving budget to Supabase"""
    try:
        budget_data = {
            'user_id': data.get('user_id', 'anonymous'),
            'income': data.get('income'),
            'expenses': data.get('expenses'),
            'savings': data.get('savings'),
            'savings_rate': data.get('savings_rate'),
            'savings_goal': data.get('savings_goal'),
            'category_breakdown': data.get('category_breakdown'),
            'advice': data.get('advice'),
            'created_at': data.get('created_at')
        }
        
        saved_budget = supabase_manager.create_budget(budget_data)
        if saved_budget:
            return JsonResponse({
                'success': True,
                'budget_id': saved_budget.get('id'),
                'message': 'Budget saved successfully'
            })
        else:
            return JsonResponse({'error': 'Failed to save budget'}, status=500)
            
    except Exception as e:
        logger.error(f"Save error: {e}")
        return JsonResponse({'error': 'Save failed'}, status=500)

def handle_budget_update(data: Dict[str, Any]) -> JsonResponse:
    """Handle updating existing budget"""
    try:
        budget_id = data.get('budget_id')
        if not budget_id:
            return JsonResponse({'error': 'Budget ID required'}, status=400)
        
        update_data = {k: v for k, v in data.items() if k != 'budget_id' and k != 'action'}
        updated_budget = supabase_manager.update_budget(budget_id, update_data)
        
        if updated_budget:
            return JsonResponse({
                'success': True,
                'message': 'Budget updated successfully'
            })
        else:
            return JsonResponse({'error': 'Failed to update budget'}, status=500)
            
    except Exception as e:
        logger.error(f"Update error: {e}")
        return JsonResponse({'error': 'Update failed'}, status=500)

def handle_budget_delete(data: Dict[str, Any]) -> JsonResponse:
    """Handle deleting budget"""
    try:
        budget_id = data.get('budget_id')
        if not budget_id:
            return JsonResponse({'error': 'Budget ID required'}, status=400)
        
        if supabase_manager.delete_budget(budget_id):
            return JsonResponse({
                'success': True,
                'message': 'Budget deleted successfully'
            })
        else:
            return JsonResponse({'error': 'Failed to delete budget'}, status=500)
            
    except Exception as e:
        logger.error(f"Delete error: {e}")
        return JsonResponse({'error': 'Delete failed'}, status=500)

def generate_financial_advice(income: float, expenses: float, savings: float, 
                            savings_rate: float, savings_goal: float) -> str:
    """Generate personalized financial advice"""
    if savings < 0:
        base_advice = "Your expenses exceed your income. Focus on reducing non-essential expenses."
    elif savings_rate < 10:
        base_advice = "Great job staying within budget! Consider increasing your savings rate to 20%."
    elif savings_rate < 30:
        base_advice = "Excellent savings rate! You're building a solid financial foundation."
    else:
        base_advice = "Outstanding financial discipline! Consider consulting a financial advisor."
    
    if savings_goal > 0:
        if savings >= savings_goal:
            goal_advice = " Congratulations! You've reached your savings goal."
        else:
            remaining = savings_goal - savings
            goal_advice = f" You're ${remaining:.2f} away from your monthly savings goal."
        return base_advice + goal_advice
    
    return base_advice

# Legacy view for backward compatibility
@ensure_csrf_cookie
def budget_view(request):
    """Legacy budget view - redirects to new API"""
    return budget_api(request)