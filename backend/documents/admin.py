"""
Admin configuration for documents app.
"""
from django.contrib import admin

from .models import GeneratedDocument


@admin.register(GeneratedDocument)
class GeneratedDocumentAdmin(admin.ModelAdmin):
    """Admin for GeneratedDocument model."""

    list_display = [
        'user',
        'target_occupation',
        'tone',
        'audience',
        'version',
        'generated_at',
    ]
    list_filter = ['tone', 'audience', 'generated_at']
    search_fields = ['user__email', 'target_occupation__title']
    readonly_fields = ['content_markdown', 'generated_at']
