"""
Admin configuration for progress app.
"""
from django.contrib import admin

from .models import UserSkill, Evidence, GapAnalysis, CheckinLog


@admin.register(UserSkill)
class UserSkillAdmin(admin.ModelAdmin):
    """Admin for UserSkill model."""

    list_display = ['user', 'skill_name', 'proficiency', 'is_custom', 'updated_at']
    list_filter = ['proficiency', 'is_custom']
    search_fields = ['user__email', 'skill_name', 'skill__name']
    autocomplete_fields = ['user', 'skill']


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    """Admin for Evidence model."""

    list_display = ['user', 'skill', 'action_preview', 'date', 'created_at']
    list_filter = ['skill__category', 'created_at']
    search_fields = ['user__email', 'action', 'result']
    autocomplete_fields = ['user', 'skill']
    readonly_fields = ['ai_enhanced_version']

    def action_preview(self, obj):
        """Show truncated action text."""
        return obj.action[:50] + '...' if len(obj.action) > 50 else obj.action
    action_preview.short_description = 'Action'


@admin.register(GapAnalysis)
class GapAnalysisAdmin(admin.ModelAdmin):
    """Admin for GapAnalysis model."""

    list_display = ['user', 'target_occupation', 'readiness_score', 'computed_at']
    list_filter = ['computed_at']
    search_fields = ['user__email', 'target_occupation__title']
    readonly_fields = ['computed_at', 'strengths', 'gaps', 'partial_matches']


@admin.register(CheckinLog)
class CheckinLogAdmin(admin.ModelAdmin):
    """Admin for CheckinLog model."""

    list_display = [
        'user',
        'scheduled_at',
        'completed_at',
        'skipped',
        'wins_added',
        'skills_updated',
    ]
    list_filter = ['skipped', 'scheduled_at']
    search_fields = ['user__email', 'notes']
