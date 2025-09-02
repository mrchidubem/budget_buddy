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
]