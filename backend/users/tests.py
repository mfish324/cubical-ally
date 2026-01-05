"""
Tests for the users app.
"""
import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestUserRegistration:
    """Tests for user registration."""

    def test_register_user_success(self, api_client):
        """Test successful user registration."""
        url = '/api/auth/registration/'
        data = {
            'email': 'newuser@example.com',
            'password1': 'SecurePass123!',
            'password2': 'SecurePass123!',
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_register_user_password_mismatch(self, api_client):
        """Test registration fails with mismatched passwords."""
        url = '/api/auth/registration/'
        data = {
            'email': 'newuser@example.com',
            'password1': 'SecurePass123!',
            'password2': 'DifferentPass123!',
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_user_duplicate_email(self, api_client, user):
        """Test registration fails with duplicate email."""
        url = '/api/auth/registration/'
        data = {
            'email': user.email,
            'password1': 'SecurePass123!',
            'password2': 'SecurePass123!',
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUserLogin:
    """Tests for user login."""

    def test_login_success(self, api_client, user):
        """Test successful login."""
        url = '/api/auth/login/'
        data = {
            'email': 'test@example.com',
            'password': 'testpass123',
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_login_wrong_password(self, api_client, user):
        """Test login fails with wrong password."""
        url = '/api/auth/login/'
        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword',
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_nonexistent_user(self, api_client):
        """Test login fails for non-existent user."""
        url = '/api/auth/login/'
        data = {
            'email': 'nonexistent@example.com',
            'password': 'testpass123',
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestCurrentUser:
    """Tests for current user endpoint."""

    def test_get_current_user_authenticated(self, auth_client, user):
        """Test getting current user when authenticated."""
        url = '/api/auth/me/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email
        assert response.data['first_name'] == user.first_name

    def test_get_current_user_unauthenticated(self, api_client):
        """Test getting current user fails when not authenticated."""
        url = '/api/auth/me/'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestUserProfile:
    """Tests for user profile endpoints."""

    def test_get_profile(self, auth_client, user_with_profile):
        """Test getting user profile."""
        url = '/api/profile/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['current_occupation_title'] == 'Software Developer'
        assert response.data['target_occupation_title'] == 'Computer Systems Engineer'

    def test_get_profile_creates_if_not_exists(self, auth_client, user):
        """Test getting profile creates one if it doesn't exist."""
        url = '/api/profile/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        # Profile should be created with empty values
        assert response.data['current_occupation_title'] == ''

    def test_update_profile(self, auth_client, user_with_profile):
        """Test updating user profile."""
        url = '/api/profile/'
        data = {
            'industry': 'Finance',
            'years_in_current_role': 5,
        }
        response = auth_client.patch(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['industry'] == 'Finance'
        assert response.data['years_in_current_role'] == 5

    def test_update_profile_unauthenticated(self, api_client):
        """Test updating profile fails when not authenticated."""
        url = '/api/profile/'
        response = api_client.patch(url, {'industry': 'Finance'})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestCheckinSettings:
    """Tests for check-in settings endpoints."""

    def test_get_checkin_settings(self, auth_client, user_with_profile):
        """Test getting check-in settings."""
        url = '/api/checkins/settings/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'checkin_enabled' in response.data

    def test_update_checkin_settings(self, auth_client, user_with_profile):
        """Test updating check-in settings."""
        url = '/api/checkins/settings/'
        data = {
            'checkin_enabled': True,
            'checkin_day': 5,  # Friday
            'checkin_time': '09:00:00',
        }
        response = auth_client.patch(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['checkin_enabled'] is True
        assert response.data['checkin_day'] == 5


@pytest.mark.django_db
class TestUserModel:
    """Tests for the User model."""

    def test_user_str(self, user):
        """Test user string representation."""
        assert str(user) == 'test@example.com'

    def test_user_has_uuid_pk(self, user):
        """Test user has UUID primary key."""
        import uuid
        assert isinstance(user.id, uuid.UUID)

    def test_user_default_subscription(self, user):
        """Test user defaults to free subscription."""
        assert user.subscription_tier == 'free'

    def test_user_email_is_unique(self, db):
        """Test email uniqueness constraint."""
        from django.contrib.auth import get_user_model
        from django.db import IntegrityError

        User = get_user_model()
        User.objects.create_user(email='unique@example.com', password='test')

        with pytest.raises(IntegrityError):
            User.objects.create_user(email='unique@example.com', password='test')


@pytest.mark.django_db
class TestUserProfileModel:
    """Tests for the UserProfile model."""

    def test_profile_str(self, user_with_profile):
        """Test profile string representation."""
        profile = user_with_profile.profile
        assert 'Profile for' in str(profile)

    def test_has_current_role(self, user_with_profile):
        """Test has_current_role property."""
        profile = user_with_profile.profile
        assert profile.has_current_role is True

    def test_has_target_role(self, user_with_profile):
        """Test has_target_role property."""
        profile = user_with_profile.profile
        assert profile.has_target_role is True

    def test_no_current_role(self, user):
        """Test has_current_role when no role set."""
        from users.models import UserProfile

        profile = UserProfile.objects.create(user=user)
        assert profile.has_current_role is False
