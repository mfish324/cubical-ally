"""
Skills and Occupation models for CubicleAlly.
Based on O*NET database structure.
"""
import uuid

from django.db import models


class Occupation(models.Model):
    """
    Reference data from O*NET database.
    Primary key is the O*NET-SOC code (e.g., "11-1011.00").
    """

    onet_soc_code = models.CharField(max_length=20, primary_key=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    job_zone = models.PositiveSmallIntegerField(
        help_text='Complexity level 1-5'
    )
    last_synced = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'occupations'
        ordering = ['title']

    def __str__(self):
        return f"{self.title} ({self.onet_soc_code})"


class Skill(models.Model):
    """
    Canonical skill list derived from O*NET.
    Includes knowledge, skills, abilities, and tools/technologies.
    """

    CATEGORY_CHOICES = [
        ('knowledge', 'Knowledge'),
        ('skill', 'Skill'),
        ('ability', 'Ability'),
        ('tool', 'Tool/Technology'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    element_id = models.CharField(
        max_length=20,
        unique=True,
        help_text="O*NET element ID"
    )
    name = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    parent_skill = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='children'
    )

    class Meta:
        db_table = 'skills'
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} ({self.category})"


class OccupationSkill(models.Model):
    """
    Maps skills to occupations with importance and level ratings.
    Junction table with additional attributes.
    """

    occupation = models.ForeignKey(
        Occupation,
        on_delete=models.CASCADE,
        related_name='occupation_skills'
    )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name='occupation_skills'
    )
    importance = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        help_text='Importance rating 1.00-5.00'
    )
    level = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        help_text='Required level 1.00-7.00'
    )

    class Meta:
        db_table = 'occupation_skills'
        unique_together = ['occupation', 'skill']
        ordering = ['-importance']

    def __str__(self):
        return f"{self.occupation.title} - {self.skill.name}"


class PromotionPath(models.Model):
    """
    Career transitions from CMap data.
    Represents common promotion/transition paths between occupations.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source_occupation = models.ForeignKey(
        Occupation,
        on_delete=models.CASCADE,
        related_name='paths_from'
    )
    target_occupation = models.ForeignKey(
        Occupation,
        on_delete=models.CASCADE,
        related_name='paths_to'
    )
    frequency = models.PositiveIntegerField(
        help_text='How common this transition is'
    )
    sector = models.CharField(max_length=100, blank=True)
    region = models.CharField(
        max_length=50,
        blank=True,
        help_text='US, UK, global, etc.'
    )
    confidence_score = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        help_text='Confidence in this path 0.00-1.00'
    )

    class Meta:
        db_table = 'promotion_paths'
        unique_together = ['source_occupation', 'target_occupation', 'sector', 'region']
        ordering = ['-frequency']

    def __str__(self):
        return f"{self.source_occupation.title} → {self.target_occupation.title}"


class TitleAlias(models.Model):
    """
    Fuzzy matching for user-entered job titles.
    Maps common variations to canonical occupations.
    """

    SOURCE_CHOICES = [
        ('onet', 'O*NET'),
        ('lightcast', 'Lightcast'),
        ('manual', 'Manual'),
        ('ai_generated', 'AI Generated'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    alias = models.CharField(max_length=200, db_index=True)
    canonical_occupation = models.ForeignKey(
        Occupation,
        on_delete=models.CASCADE,
        related_name='aliases'
    )
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES)

    class Meta:
        db_table = 'title_aliases'
        indexes = [
            models.Index(fields=['alias']),
        ]

    def __str__(self):
        return f"{self.alias} → {self.canonical_occupation.title}"
