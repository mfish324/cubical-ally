"""
Tests for the skills app.
"""
import pytest
from rest_framework import status
from unittest.mock import patch


@pytest.mark.django_db
class TestOccupationSearch:
    """Tests for occupation search endpoint."""

    def test_search_occupations(self, auth_client, occupation):
        """Test searching for occupations."""
        url = '/api/occupations/search/?q=software'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert 'Software' in response.data[0]['occupation']['title']

    def test_search_occupations_no_results(self, auth_client):
        """Test search with no matches."""
        url = '/api/occupations/search/?q=zzznomatch'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_search_occupations_empty_query(self, auth_client):
        """Test search with empty query."""
        url = '/api/occupations/search/?q='
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestOccupationDetail:
    """Tests for occupation detail endpoint."""

    def test_get_occupation(self, auth_client, occupation):
        """Test getting occupation details."""
        url = f'/api/occupations/{occupation.onet_soc_code}/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Software Developer'
        assert response.data['job_zone'] == 4

    def test_get_occupation_not_found(self, auth_client):
        """Test getting non-existent occupation."""
        url = '/api/occupations/99-9999.99/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestOccupationSkills:
    """Tests for occupation skills endpoint."""

    def test_get_occupation_skills(self, auth_client, occupation, occupation_skills):
        """Test getting skills for an occupation."""
        url = f'/api/occupations/{occupation.onet_soc_code}/skills/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

    def test_get_occupation_skills_filtered(self, auth_client, occupation, occupation_skills):
        """Test filtering skills by importance."""
        url = f'/api/occupations/{occupation.onet_soc_code}/skills/?min_importance=4.0'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        # Should filter out skills with importance < 4.0
        for skill_data in response.data:
            assert skill_data['importance'] >= 4.0


@pytest.mark.django_db
class TestOccupationPaths:
    """Tests for promotion paths endpoint."""

    def test_get_promotion_paths(self, auth_client, occupation):
        """Test getting promotion paths for an occupation."""
        from skills.models import PromotionPath, Occupation

        target = Occupation.objects.create(
            onet_soc_code='11-1011.00',
            title='Chief Executives',
            description='Determine and formulate policies.',
            job_zone=5
        )

        PromotionPath.objects.create(
            from_occupation=occupation,
            target_occupation=target,
            frequency=0.15,
            confidence_score=0.8,
            transition_percentage=15.0
        )

        url = f'/api/occupations/{occupation.onet_soc_code}/paths/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1


@pytest.mark.django_db
class TestOccupationInterpret:
    """Tests for title interpretation endpoint."""

    @patch('ai_services.services.interpret_job_title')
    def test_interpret_title(self, mock_interpret, auth_client, occupation):
        """Test interpreting a job title."""
        mock_interpret.return_value = [
            {
                'code': occupation.onet_soc_code,
                'title': occupation.title,
                'confidence': 0.9,
                'reasoning': 'Strong match for software development role',
            }
        ]

        url = '/api/occupations/interpret/'
        data = {'title': 'Senior Software Engineer'}
        response = auth_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert response.data[0]['code'] == occupation.onet_soc_code


@pytest.mark.django_db
class TestOccupationModel:
    """Tests for the Occupation model."""

    def test_occupation_str(self, occupation):
        """Test occupation string representation."""
        assert 'Software Developer' in str(occupation)

    def test_occupation_job_zone(self, occupation):
        """Test occupation job zone."""
        assert occupation.job_zone == 4


@pytest.mark.django_db
class TestSkillModel:
    """Tests for the Skill model."""

    def test_skill_str(self, skill):
        """Test skill string representation."""
        assert 'Critical Thinking' in str(skill)

    def test_skill_categories(self, skills):
        """Test skill categories."""
        categories = [s.category for s in skills]
        assert 'skill' in categories
        assert 'knowledge' in categories


@pytest.mark.django_db
class TestOccupationSkillModel:
    """Tests for the OccupationSkill model."""

    def test_occupation_skill_str(self, occupation_skills):
        """Test occupation skill string representation."""
        os = occupation_skills[0]
        assert occupation_skills[0].occupation.title in str(os)

    def test_importance_and_level(self, occupation_skills):
        """Test importance and level values."""
        for os in occupation_skills:
            assert 0 <= os.importance <= 5
            assert 0 <= os.level <= 7


@pytest.mark.django_db
class TestPromotionPathModel:
    """Tests for the PromotionPath model."""

    def test_promotion_path_str(self, occupation, target_occupation):
        """Test promotion path string representation."""
        from skills.models import PromotionPath

        path = PromotionPath.objects.create(
            from_occupation=occupation,
            target_occupation=target_occupation,
            frequency=0.2,
            confidence_score=0.85,
            transition_percentage=20.0
        )
        assert 'Software Developer' in str(path)
        assert 'Computer Systems Engineer' in str(path)
