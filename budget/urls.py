from django.urls import path
from . import views

urlpatterns = [
    path('', views.budget_view, name='budget'),  # Legacy endpoint
    path('api/', views.budget_api, name='budget_api'),  # New API endpoint
    path('calculate/', views.budget_api, name='budget_calculate'),  # Alias for calculation
    path('save/', views.budget_api, name='budget_save'),  # Alias for saving
]