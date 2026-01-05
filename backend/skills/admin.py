"""
Admin configuration for skills app.
"""
from django.contrib import admin

from .models import Occupation, Skill, OccupationSkill, PromotionPath, TitleAlias


@admin.register(Occupation)
class OccupationAdmin(admin.ModelAdmin):
    """Admin for Occupation model."""

    list_display = ['onet_soc_code', 'title', 'job_zone', 'last_synced']
    list_filter = ['job_zone']
    search_fields = ['onet_soc_code', 'title', 'description']
    ordering = ['title']


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    """Admin for Skill model."""

    list_display = ['name', 'category', 'element_id']
    list_filter = ['category']
    search_fields = ['name', 'description', 'element_id']
    ordering = ['category', 'name']


@admin.register(OccupationSkill)
class OccupationSkillAdmin(admin.ModelAdmin):
    """Admin for OccupationSkill model."""

    list_display = ['occupation', 'skill', 'importance', 'level']
    list_filter = ['skill__category']
    search_fields = ['occupation__title', 'skill__name']
    autocomplete_fields = ['occupation', 'skill']


@admin.register(PromotionPath)
class PromotionPathAdmin(admin.ModelAdmin):
    """Admin for PromotionPath model."""

    list_display = [
        'source_occupation',
        'target_occupation',
        'frequency',
        'confidence_score',
        'sector',
    ]
    list_filter = ['sector', 'region']
    search_fields = [
        'source_occupation__title',
        'target_occupation__title',
    ]
    autocomplete_fields = ['source_occupation', 'target_occupation']


@admin.register(TitleAlias)
class TitleAliasAdmin(admin.ModelAdmin):
    """Admin for TitleAlias model."""

    list_display = ['alias', 'canonical_occupation', 'source']
    list_filter = ['source']
    search_fields = ['alias', 'canonical_occupation__title']
    autocomplete_fields = ['canonical_occupation']
