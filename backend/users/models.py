"""
User models for CubicleAlly.
"""
import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with UUID primary key and subscription tracking."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Override username to make it optional (we use email for auth)
    username = models.CharField(max_length=150, blank=True, null=True, unique=False)

    # Make email required and unique
    email = models.EmailField('email address', unique=True)

    SUBSCRIPTION_CHOICES = [
        ('free', 'Free'),
        ('pro', 'Pro'),
    ]
    subscription_tier = models.CharField(
        max_length=20,
        choices=SUBSCRIPTION_CHOICES,
        default='free'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Use email as the unique identifier
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # No additional required fields beyond email

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return self.email or str(self.id)


class UserProfile(models.Model):
    """Extended user profile with career planning details."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )

    # Current role
    current_occupation_code = models.CharField(max_length=20, blank=True)
    current_occupation_title = models.CharField(max_length=200, blank=True)

    # Target role
    target_occupation_code = models.CharField(max_length=20, blank=True)
    target_occupation_title = models.CharField(max_length=200, blank=True)

    # Optional context
    industry = models.CharField(max_length=100, blank=True)
    years_in_current_role = models.PositiveIntegerField(null=True, blank=True)

    # Check-in preferences
    checkin_enabled = models.BooleanField(default=False)
    checkin_day = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text='Day of week: 0=Monday, 6=Sunday'
    )
    checkin_time = models.TimeField(null=True, blank=True)
    last_checkin_at = models.DateTimeField(null=True, blank=True)

    # Computed/cached readiness score
    readiness_score = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text='Cached readiness score 0-100'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profiles'

    def __str__(self):
        return f"Profile for {self.user}"

    @property
    def has_current_role(self):
        return bool(self.current_occupation_code)

    @property
    def has_target_role(self):
        return bool(self.target_occupation_code)
