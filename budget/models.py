from django.db import models
from django.contrib.auth.models import User

class BudgetTemplate(models.Model):
    """Model for storing budget templates locally (optional fallback)"""
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']

class BudgetCategory(models.Model):
    """Model for budget categories (optional local fallback)"""
    name = models.CharField(max_length=50)
    icon = models.CharField(max_length=20, blank=True)
    color = models.CharField(max_length=7, default='#10b981')
    
    def __str__(self):
        return self.name
