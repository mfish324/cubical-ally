"""
Document generation models for CubicleAlly.
"""
import uuid

from django.db import models
from django.conf import settings

from skills.models import Occupation


class GeneratedDocument(models.Model):
    """Saved promotion case documents."""

    TONE_CHOICES = [
        ('formal', 'Formal'),
        ('conversational', 'Conversational'),
        ('concise', 'Concise'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    target_occupation = models.ForeignKey(
        Occupation,
        on_delete=models.CASCADE,
        related_name='generated_documents'
    )

    tone = models.CharField(max_length=20, choices=TONE_CHOICES)
    audience = models.CharField(max_length=50, blank=True)

    content_markdown = models.TextField()
    version = models.PositiveSmallIntegerField(default=1)

    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'generated_documents'
        ordering = ['-generated_at']

    def __str__(self):
        return f"{self.user} - {self.target_occupation.title} v{self.version}"
