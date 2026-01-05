"""
Serializers for User models.
"""
from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer

from .models import User, UserProfile


class CustomRegisterSerializer(RegisterSerializer):
    """Custom registration serializer that doesn't require username."""

    username = None  # Remove username field entirely

    def get_cleaned_data(self):
        return {
            'email': self.validated_data.get('email', ''),
            'password1': self.validated_data.get('password1', ''),
        }

    def save(self, request):
        user = super().save(request)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""

    class Meta:
        model = UserProfile
        fields = [
            'id',
            'current_occupation_code',
            'current_occupation_title',
            'target_occupation_code',
            'target_occupation_title',
            'industry',
            'years_in_current_role',
            'checkin_enabled',
            'checkin_day',
            'checkin_time',
            'last_checkin_at',
            'readiness_score',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'readiness_score', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with nested profile."""

    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'subscription_tier',
            'profile',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'email', 'subscription_tier', 'created_at', 'updated_at']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""

    class Meta:
        model = UserProfile
        fields = [
            'current_occupation_code',
            'current_occupation_title',
            'target_occupation_code',
            'target_occupation_title',
            'industry',
            'years_in_current_role',
            'checkin_enabled',
            'checkin_day',
            'checkin_time',
        ]


class CheckinSettingsSerializer(serializers.ModelSerializer):
    """Serializer for check-in settings only."""

    class Meta:
        model = UserProfile
        fields = [
            'checkin_enabled',
            'checkin_day',
            'checkin_time',
        ]
