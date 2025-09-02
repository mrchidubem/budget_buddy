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


class UserProfile(models.Model):
    """Additional per-user info such as country and currency preferences."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    country_code = models.CharField(max_length=2, default='US')
    currency_symbol = models.CharField(max_length=5, default='$')

    def __str__(self) -> str:
        return f"Profile({self.user.username})"


class Budget(models.Model):
    """Per-user budget goal."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='budget')
    goal_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self) -> str:
        return f"Budget({self.user.username}: {self.goal_amount})"


class Expense(models.Model):
    """Expense entries per user."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    date = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-id']

    def __str__(self) -> str:
        return f"Expense({self.user.username}: {self.amount} on {self.date})"
