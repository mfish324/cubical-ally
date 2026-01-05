"""
Views for User-related endpoints.
"""
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserProfile
from .serializers import (
    UserSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    CheckinSettingsSerializer,
)


class CurrentUserView(APIView):
    """Get or update the current authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return the current user with profile."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        """Update current user's basic info."""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    """Get or update the current user's profile."""

    permission_classes = [IsAuthenticated]

    def get_profile(self, user):
        """Get or create profile for user."""
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return profile

    def get(self, request):
        """Return the current user's profile."""
        profile = self.get_profile(request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        """Update the current user's profile."""
        profile = self.get_profile(request.user)
        serializer = UserProfileUpdateSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CheckinSettingsView(APIView):
    """Get or update check-in settings."""

    permission_classes = [IsAuthenticated]

    def get_profile(self, user):
        """Get or create profile for user."""
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return profile

    def get(self, request):
        """Return check-in settings."""
        profile = self.get_profile(request.user)
        serializer = CheckinSettingsSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        """Update check-in settings."""
        profile = self.get_profile(request.user)
        serializer = CheckinSettingsSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
