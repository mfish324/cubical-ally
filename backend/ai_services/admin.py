"""
Admin configuration for ai_services app.
"""
from django.contrib import admin

from .models import AIInteractionLog


@admin.register(AIInteractionLog)
class AIInteractionLogAdmin(admin.ModelAdmin):
    """Admin for AIInteractionLog model."""

    list_display = [
        'user',
        'interaction_type',
        'tokens_input',
        'tokens_output',
        'model_used',
        'created_at',
    ]
    list_filter = ['interaction_type', 'model_used', 'created_at']
    search_fields = ['user__email']
    readonly_fields = [
        'input_hash',
        'tokens_input',
        'tokens_output',
        'model_used',
        'created_at',
    ]
    date_hierarchy = 'created_at'
