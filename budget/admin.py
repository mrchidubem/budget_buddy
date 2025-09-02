from django.contrib import admin
from .models import UserProfile, Budget, Expense, BudgetCategory, BudgetTemplate


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "country_code", "currency_symbol")
    search_fields = ("user__username", "country_code")


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ("user", "goal_amount")
    search_fields = ("user__username",)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("user", "amount", "description", "date")
    search_fields = ("user__username", "description")
    list_filter = ("date",)


@admin.register(BudgetCategory)
class BudgetCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "icon", "color")
    search_fields = ("name",)


@admin.register(BudgetTemplate)
class BudgetTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at", "updated_at")
    search_fields = ("name",)
