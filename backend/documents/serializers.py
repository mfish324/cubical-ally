"""
Serializers for Documents app.
"""
from rest_framework import serializers

from .models import GeneratedDocument


class GeneratedDocumentSerializer(serializers.ModelSerializer):
    """Serializer for GeneratedDocument model."""

    target_occupation_title = serializers.CharField(
        source='target_occupation.title',
        read_only=True
    )

    class Meta:
        model = GeneratedDocument
        fields = [
            'id',
            'target_occupation',
            'target_occupation_title',
            'tone',
            'audience',
            'content_markdown',
            'version',
            'generated_at',
        ]
        read_only_fields = ['id', 'content_markdown', 'version', 'generated_at']


class DocumentGenerateRequestSerializer(serializers.Serializer):
    """Request serializer for document generation."""

    AUDIENCE_CHOICES = [
        ('manager', 'My direct manager'),
        ('hr', 'HR or promotion committee'),
        ('skip_level', 'Skip-level manager'),
        ('unknown', "I'm not sure yet"),
    ]

    TONE_CHOICES = [
        ('formal', 'Formal and polished'),
        ('conversational', 'Conversational but professional'),
        ('concise', 'Direct and concise'),
    ]

    audience = serializers.ChoiceField(choices=AUDIENCE_CHOICES)
    tone = serializers.ChoiceField(choices=TONE_CHOICES)
    emphasis = serializers.CharField(required=False, allow_blank=True)


class DocumentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for document lists."""

    target_occupation_title = serializers.CharField(
        source='target_occupation.title',
        read_only=True
    )

    class Meta:
        model = GeneratedDocument
        fields = [
            'id',
            'target_occupation_title',
            'tone',
            'audience',
            'version',
            'generated_at',
        ]
