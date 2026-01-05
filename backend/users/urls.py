"""
URL patterns for users app.
"""
from django.urls import path

from .views import CurrentUserView, ProfileView, CheckinSettingsView

urlpatterns = [
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('checkins/settings/', CheckinSettingsView.as_view(), name='checkin-settings'),
]
