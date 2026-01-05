"""
Progress tracking models for CubicleAlly.
"""
import uuid

from django.db import models
from django.conf import settings

from skills.models import Skill, Occupation


class UserSkill(models.Model):
    """User's self-rated skills."""

    PROFICIENCY_CHOICES = [
        (1, 'Rarely'),
        (2, 'Sometimes'),
        (3, 'Regularly'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_skills'
    )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='user_ratings'
    )
    skill_name = models.CharField(
        max_length=200,
        help_text='Denormalized skill name, especially for custom skills'
    )
    proficiency = models.PositiveSmallIntegerField(choices=PROFICIENCY_CHOICES)
    is_custom = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_skills'
        unique_together = ['user', 'skill']

    def __str__(self):
        return f"{self.user} - {self.skill_name}: {self.get_proficiency_display()}"


class Evidence(models.Model):
    """Documented accomplishments in STAR format."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='evidence'
    )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='evidence'
    )

    # STAR format fields
    situation = models.TextField(blank=True, help_text='Optional context')
    action = models.TextField(help_text='What they did')
    result = models.TextField(blank=True, help_text='Outcome/impact')

    date = models.DateField(null=True, blank=True)

    # AI enhancement
    ai_enhanced_version = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'evidence'
        ordering = ['-created_at']
        verbose_name_plural = 'Evidence'

    def __str__(self):
        skill_name = self.skill.name if self.skill else 'General'
        return f"{self.user} - {skill_name}: {self.action[:50]}..."

    @property
    def combined_text(self):
        """Get the full evidence text combining all STAR components."""
        parts = []
        if self.situation:
            parts.append(self.situation)
        parts.append(self.action)
        if self.result:
            parts.append(self.result)
        return ' '.join(parts)


class GapAnalysis(models.Model):
    """Cached gap analysis results."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='gap_analyses'
    )
    target_occupation = models.ForeignKey(
        Occupation,
        on_delete=models.CASCADE,
        related_name='gap_analyses'
    )

    computed_at = models.DateTimeField(auto_now=True)
    readiness_score = models.PositiveSmallIntegerField(help_text='0-100')

    # Skill lists stored as JSON arrays of skill IDs
    strengths = models.JSONField(
        default=list,
        help_text='List of skill IDs user has'
    )
    gaps = models.JSONField(
        default=list,
        help_text='List of {skill_id, priority} objects'
    )
    partial_matches = models.JSONField(
        default=list,
        help_text='List of skill IDs user is building'
    )

    class Meta:
        db_table = 'gap_analyses'
        unique_together = ['user', 'target_occupation']
        verbose_name_plural = 'Gap analyses'

    def __str__(self):
        return f"{self.user} → {self.target_occupation.title}: {self.readiness_score}%"


class CheckinLog(models.Model):
    """Weekly check-in records."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='checkins'
    )

    scheduled_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    skipped = models.BooleanField(default=False)

    wins_added = models.PositiveSmallIntegerField(default=0)
    skills_updated = models.PositiveSmallIntegerField(default=0)
    notes = models.TextField(blank=True)

    readiness_score_snapshot = models.PositiveSmallIntegerField(null=True)

    class Meta:
        db_table = 'checkin_logs'
        ordering = ['-scheduled_at']

    def __str__(self):
        status = 'completed' if self.completed_at else ('skipped' if self.skipped else 'pending')
        return f"{self.user} - {self.scheduled_at.date()} ({status})"
