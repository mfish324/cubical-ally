"""
Serializers for Progress app.
"""
from rest_framework import serializers

from skills.serializers import SkillSerializer
from .models import UserSkill, Evidence, GapAnalysis, CheckinLog


class UserSkillSerializer(serializers.ModelSerializer):
    """Serializer for UserSkill model."""

    skill_detail = SkillSerializer(source='skill', read_only=True)
    proficiency_display = serializers.CharField(
        source='get_proficiency_display',
        read_only=True
    )

    class Meta:
        model = UserSkill
        fields = [
            'id',
            'skill',
            'skill_name',
            'skill_detail',
            'proficiency',
            'proficiency_display',
            'is_custom',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserSkillCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating UserSkill."""

    class Meta:
        model = UserSkill
        fields = ['skill', 'skill_name', 'proficiency', 'is_custom']

    def validate(self, data):
        """Ensure either skill or skill_name is provided."""
        if not data.get('skill') and not data.get('skill_name'):
            raise serializers.ValidationError(
                "Either 'skill' or 'skill_name' must be provided"
            )
        # If skill is provided, copy the name
        if data.get('skill') and not data.get('skill_name'):
            data['skill_name'] = data['skill'].name
        return data


class EvidenceSerializer(serializers.ModelSerializer):
    """Serializer for Evidence model."""

    skill_detail = SkillSerializer(source='skill', read_only=True)
    combined_text = serializers.CharField(read_only=True)

    class Meta:
        model = Evidence
        fields = [
            'id',
            'skill',
            'skill_detail',
            'situation',
            'action',
            'result',
            'date',
            'ai_enhanced_version',
            'combined_text',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'ai_enhanced_version', 'created_at', 'updated_at']


class EvidenceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Evidence."""

    class Meta:
        model = Evidence
        fields = ['skill', 'situation', 'action', 'result', 'date']

    def validate_action(self, value):
        """Ensure action field is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Action is required")
        return value.strip()


class GapAnalysisSerializer(serializers.ModelSerializer):
    """Serializer for GapAnalysis results."""

    target_occupation_title = serializers.CharField(
        source='target_occupation.title',
        read_only=True
    )

    class Meta:
        model = GapAnalysis
        fields = [
            'id',
            'target_occupation',
            'target_occupation_title',
            'computed_at',
            'readiness_score',
            'strengths',
            'gaps',
            'partial_matches',
        ]
        read_only_fields = ['id', 'computed_at']


class GapDetailSerializer(serializers.Serializer):
    """Serializer for detailed gap with skill info."""

    skill = SkillSerializer()
    priority = serializers.CharField()
    importance = serializers.FloatField()
    user_proficiency = serializers.IntegerField(allow_null=True)
    required_level = serializers.FloatField()


class FullGapAnalysisSerializer(serializers.Serializer):
    """Serializer for full gap analysis with skill details."""

    readiness_score = serializers.IntegerField()
    target_occupation = serializers.CharField()
    computed_at = serializers.DateTimeField()
    strengths = SkillSerializer(many=True)
    gaps = GapDetailSerializer(many=True)
    partial_matches = SkillSerializer(many=True)
    total_target_skills = serializers.IntegerField()
    matched_skills = serializers.IntegerField()


class CheckinLogSerializer(serializers.ModelSerializer):
    """Serializer for CheckinLog model."""

    class Meta:
        model = CheckinLog
        fields = [
            'id',
            'scheduled_at',
            'completed_at',
            'skipped',
            'wins_added',
            'skills_updated',
            'notes',
            'readiness_score_snapshot',
        ]
        read_only_fields = ['id', 'scheduled_at']


class CheckinSubmitSerializer(serializers.Serializer):
    """Serializer for submitting a check-in."""

    wins = EvidenceCreateSerializer(many=True, required=False)
    skill_updates = UserSkillCreateSerializer(many=True, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        """Validate check-in data."""
        wins = data.get('wins', [])
        skill_updates = data.get('skill_updates', [])
        notes = data.get('notes', '')

        # At least some activity should be recorded
        if not wins and not skill_updates and not notes:
            raise serializers.ValidationError(
                "Check-in must include at least one win, skill update, or note"
            )

        return data
