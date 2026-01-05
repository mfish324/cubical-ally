"""
Tests for the progress app.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from unittest.mock import patch, MagicMock


@pytest.mark.django_db
class TestUserSkillEndpoints:
    """Tests for user skill endpoints."""

    def test_list_user_skills_empty(self, auth_client):
        """Test listing skills when user has none."""
        url = '/api/profile/skills/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    def test_list_user_skills(self, auth_client, user_skill):
        """Test listing user skills."""
        url = '/api/profile/skills/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['skill_name'] == 'Critical Thinking'

    def test_create_user_skill(self, auth_client, skill):
        """Test creating a user skill."""
        url = '/api/profile/skills/'
        data = {
            'skill': str(skill.id),
            'skill_name': skill.name,
            'proficiency': 2,
        }
        response = auth_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['proficiency'] == 2

    def test_create_custom_skill(self, auth_client):
        """Test creating a custom skill."""
        url = '/api/profile/skills/'
        data = {
            'skill_name': 'Custom Skill',
            'proficiency': 3,
            'is_custom': True,
        }
        response = auth_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['is_custom'] is True

    def test_delete_user_skill(self, auth_client, user_skill):
        """Test deleting a user skill."""
        url = f'/api/profile/skills/{user_skill.id}/'
        response = auth_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_bulk_update_skills(self, auth_client, skills):
        """Test bulk updating skills."""
        url = '/api/profile/skills/bulk/'
        data = {
            'skills': [
                {'skill': str(skills[0].id), 'skill_name': skills[0].name, 'proficiency': 2},
                {'skill': str(skills[1].id), 'skill_name': skills[1].name, 'proficiency': 3},
            ]
        }
        response = auth_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['created'] == 2

    def test_bulk_update_skills_empty(self, auth_client):
        """Test bulk update with empty skills list."""
        url = '/api/profile/skills/bulk/'
        data = {'skills': []}
        response = auth_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestEvidenceEndpoints:
    """Tests for evidence endpoints."""

    def test_list_evidence_empty(self, auth_client):
        """Test listing evidence when user has none."""
        url = '/api/evidence/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    def test_list_evidence(self, auth_client, evidence):
        """Test listing user evidence."""
        url = '/api/evidence/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert 'Led the design' in response.data[0]['action']

    def test_create_evidence(self, auth_client, skill):
        """Test creating evidence."""
        url = '/api/evidence/'
        data = {
            'skill': str(skill.id),
            'situation': 'Team project deadline approaching',
            'action': 'Organized the team and created a sprint plan',
            'result': 'Delivered on time with 100% feature completion',
        }
        response = auth_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['result'] == 'Delivered on time with 100% feature completion'

    def test_create_evidence_action_only(self, auth_client):
        """Test creating evidence with only action field."""
        url = '/api/evidence/'
        data = {
            'action': 'Completed the annual report ahead of schedule',
        }
        response = auth_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_update_evidence(self, auth_client, evidence):
        """Test updating evidence."""
        url = f'/api/evidence/{evidence.id}/'
        data = {'result': 'Reduced processing time by 50%'}
        response = auth_client.patch(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['result'] == 'Reduced processing time by 50%'

    def test_delete_evidence(self, auth_client, evidence):
        """Test deleting evidence."""
        url = f'/api/evidence/{evidence.id}/'
        response = auth_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_evidence_isolation(self, auth_client, evidence, other_user):
        """Test that users can't see other users' evidence."""
        from progress.models import Evidence

        # Create evidence for other user
        Evidence.objects.create(
            user=other_user,
            action='Other user action'
        )

        url = '/api/evidence/'
        response = auth_client.get(url)
        # Should only see the authenticated user's evidence
        assert len(response.data) == 1
        assert response.data[0]['id'] == str(evidence.id)

    def test_filter_evidence_by_skill(self, auth_client, evidence, skill):
        """Test filtering evidence by skill."""
        url = f'/api/evidence/?skill={skill.id}'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    @patch('ai_services.services.enhance_evidence')
    def test_enhance_evidence(self, mock_enhance, auth_client, evidence):
        """Test AI evidence enhancement."""
        mock_enhance.return_value = {
            'enhanced': 'Spearheaded the design and implementation of a mission-critical feature',
            'placeholders': ['[specific feature name]', '[X% improvement]'],
            'tip': 'Add specific metrics to strengthen impact',
        }

        url = f'/api/evidence/{evidence.id}/enhance/'
        response = auth_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'Spearheaded' in response.data['enhanced']
        assert len(response.data['placeholders']) == 2


@pytest.mark.django_db
class TestGapAnalysisEndpoints:
    """Tests for gap analysis endpoints."""

    def test_get_analysis_no_target(self, auth_client, user):
        """Test getting analysis without target role."""
        from users.models import UserProfile
        UserProfile.objects.get_or_create(user=user)

        url = '/api/analysis/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'No target occupation' in response.data['error']

    def test_get_analysis_with_target(self, auth_client, user_with_profile, target_occupation, skills, occupation_skills):
        """Test getting gap analysis."""
        # Update profile to use our fixture occupation
        user_with_profile.profile.target_occupation_code = target_occupation.onet_soc_code
        user_with_profile.profile.save()

        # Create occupation skills for target
        from skills.models import OccupationSkill
        for skill in skills:
            OccupationSkill.objects.create(
                occupation=target_occupation,
                skill=skill,
                importance=4.0,
                level=5.0
            )

        url = '/api/analysis/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'readiness_score' in response.data
        assert 'gaps' in response.data
        assert 'strengths' in response.data

    @patch('ai_services.services.get_gap_coaching')
    def test_get_coaching(self, mock_coaching, auth_client, user_with_profile, skill):
        """Test getting AI coaching for a skill."""
        mock_coaching.return_value = {
            'why_it_matters': 'Critical thinking is essential for problem-solving',
            'develop_at_work': ['Take on complex debugging tasks', 'Lead code reviews'],
            'develop_independently': ['Practice with logic puzzles', 'Take online courses'],
            'how_to_demonstrate': ['Document problem-solving approaches', 'Present solutions'],
        }

        url = f'/api/analysis/coaching/{skill.id}/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'why_it_matters' in response.data
        assert len(response.data['develop_at_work']) == 2


@pytest.mark.django_db
class TestCheckinEndpoints:
    """Tests for check-in endpoints."""

    def test_list_checkins_empty(self, auth_client):
        """Test listing check-ins when user has none."""
        url = '/api/checkins/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['results'] == []

    def test_submit_checkin(self, auth_client, user_with_profile, skill):
        """Test submitting a check-in."""
        url = '/api/checkins/'
        data = {
            'wins': [
                {'action': 'Completed quarterly report'},
            ],
            'skill_updates': [
                {'skill': str(skill.id), 'skill_name': skill.name, 'proficiency': 3},
            ],
            'notes': 'Great week!',
        }
        response = auth_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['wins_added'] == 1
        assert response.data['skills_updated'] == 1
        assert response.data['notes'] == 'Great week!'


@pytest.mark.django_db
class TestEvidenceModel:
    """Tests for the Evidence model."""

    def test_evidence_str(self, evidence):
        """Test evidence string representation."""
        assert 'Critical Thinking' in str(evidence)
        assert 'Led the design' in str(evidence)

    def test_combined_text(self, evidence):
        """Test combined_text property."""
        combined = evidence.combined_text
        assert 'Working on a complex project' in combined
        assert 'Led the design' in combined
        assert 'Reduced processing time' in combined

    def test_combined_text_action_only(self, user):
        """Test combined_text with only action."""
        from progress.models import Evidence

        ev = Evidence.objects.create(
            user=user,
            action='Did something great'
        )
        assert ev.combined_text == 'Did something great'


@pytest.mark.django_db
class TestUserSkillModel:
    """Tests for the UserSkill model."""

    def test_user_skill_str(self, user_skill):
        """Test user skill string representation."""
        assert 'Critical Thinking' in str(user_skill)
        assert 'Sometimes' in str(user_skill)

    def test_proficiency_choices(self, user_skill):
        """Test proficiency display."""
        assert user_skill.get_proficiency_display() == 'Sometimes'

    def test_unique_constraint(self, user, skill):
        """Test unique constraint on user+skill."""
        from progress.models import UserSkill
        from django.db import IntegrityError

        UserSkill.objects.create(
            user=user,
            skill=skill,
            skill_name=skill.name,
            proficiency=2
        )

        with pytest.raises(IntegrityError):
            UserSkill.objects.create(
                user=user,
                skill=skill,
                skill_name=skill.name,
                proficiency=3
            )


@pytest.mark.django_db
class TestGapAnalysisModel:
    """Tests for the GapAnalysis model."""

    def test_gap_analysis_str(self, gap_analysis):
        """Test gap analysis string representation."""
        assert '65%' in str(gap_analysis)

    def test_unique_together(self, user, target_occupation):
        """Test unique constraint on user+target."""
        from progress.models import GapAnalysis
        from django.db import IntegrityError

        GapAnalysis.objects.create(
            user=user,
            target_occupation=target_occupation,
            readiness_score=50
        )

        with pytest.raises(IntegrityError):
            GapAnalysis.objects.create(
                user=user,
                target_occupation=target_occupation,
                readiness_score=60
            )
