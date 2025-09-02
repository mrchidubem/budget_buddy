from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('home/', views.home_view, name='home_page'),
    path('set-goal/', views.set_budget_goal_view, name='set_budget_goal'),
    path('add-expense/', views.add_expense_view, name='add_expense'),
    
    path('', views.budget_view, name='budget'),  # Legacy endpoint
    path('api/', views.budget_api, name='budget_api'),  # New API endpoint
    path('calculate/', views.budget_api, name='budget_calculate'),  # Alias for calculation
    path('save/', views.budget_api, name='budget_save'),  # Alias for saving
    # JSON auth & dashboard (SPA)
    path('auth/status/', views.auth_status_json, name='auth_status_json'),
    path('auth/signup/', views.signup_json, name='signup_json'),
    path('auth/login/', views.login_json, name='login_json'),
    path('auth/logout/', views.logout_json, name='logout_json'),
    path('dashboard/', views.dashboard_json, name='dashboard_json'),
    path('dashboard/set-goal/', views.set_goal_json, name='set_goal_json'),
    path('dashboard/add-expense/', views.add_expense_json, name='add_expense_json'),
]