"""
Serializers for Skills app.
"""
from rest_framework import serializers

from .models import Occupation, Skill, OccupationSkill, PromotionPath, TitleAlias


class SkillSerializer(serializers.ModelSerializer):
    """Serializer for Skill model."""

    class Meta:
        model = Skill
        fields = ['id', 'element_id', 'name', 'description', 'category']


class OccupationSkillSerializer(serializers.ModelSerializer):
    """Serializer for occupation-skill relationships."""

    skill = SkillSerializer(read_only=True)

    class Meta:
        model = OccupationSkill
        fields = ['skill', 'importance', 'level']


class OccupationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for occupation lists/search results."""

    class Meta:
        model = Occupation
        fields = ['onet_soc_code', 'title', 'description', 'job_zone']


class OccupationDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single occupation view."""

    skills = serializers.SerializerMethodField()

    class Meta:
        model = Occupation
        fields = ['onet_soc_code', 'title', 'description', 'job_zone', 'skills']

    def get_skills(self, obj):
        """Get skills sorted by importance."""
        occupation_skills = obj.occupation_skills.select_related('skill').all()
        return OccupationSkillSerializer(occupation_skills, many=True).data


class PromotionPathSerializer(serializers.ModelSerializer):
    """Serializer for promotion paths."""

    target_occupation = OccupationListSerializer(read_only=True)
    transition_percentage = serializers.SerializerMethodField()

    class Meta:
        model = PromotionPath
        fields = [
            'id',
            'target_occupation',
            'frequency',
            'sector',
            'region',
            'confidence_score',
            'transition_percentage',
        ]

    def get_transition_percentage(self, obj):
        """Calculate percentage representation of frequency."""
        # This would normally be calculated against total transitions
        # For now, return the frequency as a rough indicator
        return min(100, obj.frequency // 10)


class TitleAliasSerializer(serializers.ModelSerializer):
    """Serializer for title aliases."""

    occupation = OccupationListSerializer(source='canonical_occupation', read_only=True)

    class Meta:
        model = TitleAlias
        fields = ['id', 'alias', 'occupation', 'source']


class OccupationSearchResultSerializer(serializers.Serializer):
    """Serializer for search results with match score."""

    occupation = OccupationListSerializer()
    match_score = serializers.FloatField()
    matched_alias = serializers.CharField(required=False)


class TitleInterpretationRequestSerializer(serializers.Serializer):
    """Request serializer for AI title interpretation."""

    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)


class TitleInterpretationResultSerializer(serializers.Serializer):
    """Response serializer for AI title interpretation."""

    occupation = OccupationListSerializer()
    confidence = serializers.IntegerField(min_value=0, max_value=100)
    explanation = serializers.CharField()
