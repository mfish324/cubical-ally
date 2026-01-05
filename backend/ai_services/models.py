"""
AI interaction logging models.
"""
import uuid
import hashlib

from django.db import models
from django.conf import settings


class AIInteractionLog(models.Model):
    """Track AI usage for debugging and cost monitoring."""

    INTERACTION_TYPES = [
        ('title_interpretation', 'Title Interpretation'),
        ('evidence_enhancement', 'Evidence Enhancement'),
        ('gap_coaching', 'Gap Coaching'),
        ('doc_generation', 'Document Generation'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_interactions',
        null=True,
        blank=True
    )

    interaction_type = models.CharField(max_length=50, choices=INTERACTION_TYPES)
    input_hash = models.CharField(
        max_length=64,
        help_text='SHA256 hash of input for privacy'
    )
    tokens_input = models.PositiveIntegerField()
    tokens_output = models.PositiveIntegerField()
    model_used = models.CharField(max_length=50)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_interaction_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.interaction_type} - {self.created_at}"

    @staticmethod
    def hash_input(input_text: str) -> str:
        """Create a privacy-preserving hash of the input."""
        return hashlib.sha256(input_text.encode()).hexdigest()
