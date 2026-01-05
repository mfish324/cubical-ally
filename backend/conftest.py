"""
Pytest configuration and fixtures for CubicleAlly tests.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@pytest.fixture
def api_client():
    """Return a DRF API test client."""
    return APIClient()


@pytest.fixture
def user(db):
    """Create a test user."""
    return User.objects.create_user(
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )


@pytest.fixture
def other_user(db):
    """Create another test user for isolation tests."""
    return User.objects.create_user(
        email='other@example.com',
        password='testpass123',
        first_name='Other',
        last_name='User'
    )


@pytest.fixture
def auth_client(api_client, user):
    """Return an authenticated API client."""
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def user_with_profile(user):
    """Create a user with a complete profile."""
    from users.models import UserProfile

    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'current_occupation_code': '15-1252.00',
            'current_occupation_title': 'Software Developer',
            'target_occupation_code': '15-1299.08',
            'target_occupation_title': 'Computer Systems Engineer',
            'industry': 'Technology',
            'years_in_current_role': 3,
        }
    )
    return user


@pytest.fixture
def occupation(db):
    """Create a test occupation."""
    from skills.models import Occupation

    return Occupation.objects.create(
        onet_soc_code='15-1252.00',
        title='Software Developer',
        description='Develop, create, and modify general computer applications software or specialized utility programs.',
        job_zone=4
    )


@pytest.fixture
def target_occupation(db):
    """Create a target occupation."""
    from skills.models import Occupation

    return Occupation.objects.create(
        onet_soc_code='15-1299.08',
        title='Computer Systems Engineer',
        description='Design and develop solutions to complex applications problems, system administration issues, or network concerns.',
        job_zone=5
    )


@pytest.fixture
def skill(db):
    """Create a test skill."""
    from skills.models import Skill

    return Skill.objects.create(
        element_id='2.A.1.a',
        name='Critical Thinking',
        description='Using logic and reasoning to identify the strengths and weaknesses of alternative solutions.',
        category='skill'
    )


@pytest.fixture
def skills(db):
    """Create multiple test skills."""
    from skills.models import Skill

    return [
        Skill.objects.create(
            element_id='2.A.1.a',
            name='Critical Thinking',
            description='Using logic and reasoning.',
            category='skill'
        ),
        Skill.objects.create(
            element_id='2.A.1.b',
            name='Active Learning',
            description='Understanding the implications of new information.',
            category='skill'
        ),
        Skill.objects.create(
            element_id='2.B.1.a',
            name='Programming',
            description='Writing computer programs.',
            category='knowledge'
        ),
    ]


@pytest.fixture
def occupation_skills(occupation, skills):
    """Create occupation-skill relationships."""
    from skills.models import OccupationSkill

    return [
        OccupationSkill.objects.create(
            occupation=occupation,
            skill=skills[0],
            importance=4.0,
            level=5.0
        ),
        OccupationSkill.objects.create(
            occupation=occupation,
            skill=skills[1],
            importance=3.5,
            level=4.5
        ),
        OccupationSkill.objects.create(
            occupation=occupation,
            skill=skills[2],
            importance=4.5,
            level=6.0
        ),
    ]


@pytest.fixture
def user_skill(user, skill):
    """Create a user skill rating."""
    from progress.models import UserSkill

    return UserSkill.objects.create(
        user=user,
        skill=skill,
        skill_name=skill.name,
        proficiency=2
    )


@pytest.fixture
def evidence(user, skill):
    """Create test evidence."""
    from progress.models import Evidence

    return Evidence.objects.create(
        user=user,
        skill=skill,
        situation='Working on a complex project',
        action='Led the design and implementation of a new feature',
        result='Reduced processing time by 40%'
    )


@pytest.fixture
def gap_analysis(user, target_occupation, skills):
    """Create a gap analysis."""
    from progress.models import GapAnalysis

    return GapAnalysis.objects.create(
        user=user,
        target_occupation=target_occupation,
        readiness_score=65,
        strengths=[str(skills[0].id)],
        gaps=[{'skill_id': str(skills[1].id), 'priority': 'high'}],
        partial_matches=[str(skills[2].id)]
    )
