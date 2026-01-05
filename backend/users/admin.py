"""
Admin configuration for users app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, UserProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin for custom User model."""

    list_display = ['email', 'username', 'subscription_tier', 'is_staff', 'created_at']
    list_filter = ['subscription_tier', 'is_staff', 'is_superuser', 'is_active']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Subscription', {'fields': ('subscription_tier',)}),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin for UserProfile model."""

    list_display = [
        'user',
        'current_occupation_title',
        'target_occupation_title',
        'readiness_score',
        'checkin_enabled',
    ]
    list_filter = ['checkin_enabled', 'industry']
    search_fields = [
        'user__email',
        'current_occupation_title',
        'target_occupation_title',
    ]
    readonly_fields = ['readiness_score', 'last_checkin_at']
