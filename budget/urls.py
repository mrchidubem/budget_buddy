from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('home/', views.home_view, name='home_page'),
    
    path('', views.budget_view, name='budget'),  # Legacy endpoint
    path('api/', views.budget_api, name='budget_api'),  # New API endpoint
    path('calculate/', views.budget_api, name='budget_calculate'),  # Alias for calculation
    path('save/', views.budget_api, name='budget_save'),  # Alias for saving
]