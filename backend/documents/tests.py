"""
Tests for the documents app.
"""
import pytest
from rest_framework import status
from unittest.mock import patch, MagicMock


@pytest.mark.django_db
class TestDocumentGenerate:
    """Tests for document generation endpoint."""

    @patch('ai_services.services.generate_document')
    def test_generate_document(self, mock_generate, auth_client, user_with_profile, target_occupation, skills):
        """Test generating a promotion document."""
        # Set up the profile target
        user_with_profile.profile.target_occupation_code = target_occupation.onet_soc_code
        user_with_profile.profile.target_occupation_title = target_occupation.title
        user_with_profile.profile.save()

        mock_generate.return_value = {
            'content': '# Promotion Case\n\nI am ready for this role...',
        }

        url = '/api/documents/generate/'
        data = {
            'audience': 'manager',
            'tone': 'conversational',
        }
        response = auth_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert 'content_markdown' in response.data
        assert response.data['tone'] == 'conversational'
        assert response.data['audience'] == 'manager'

    def test_generate_document_no_target(self, auth_client, user):
        """Test generating document without target role."""
        from users.models import UserProfile
        UserProfile.objects.get_or_create(user=user)

        url = '/api/documents/generate/'
        data = {
            'audience': 'manager',
            'tone': 'formal',
        }
        response = auth_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_generate_document_invalid_audience(self, auth_client, user_with_profile):
        """Test generating document with invalid audience."""
        url = '/api/documents/generate/'
        data = {
            'audience': 'invalid',
            'tone': 'formal',
        }
        response = auth_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestDocumentList:
    """Tests for document list endpoint."""

    def test_list_documents_empty(self, auth_client):
        """Test listing documents when user has none."""
        url = '/api/documents/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['results'] == []

    def test_list_documents(self, auth_client, user, target_occupation):
        """Test listing documents."""
        from documents.models import GeneratedDocument

        doc = GeneratedDocument.objects.create(
            user=user,
            target_occupation=target_occupation,
            tone='formal',
            audience='manager',
            content_markdown='# Test Document'
        )

        url = '/api/documents/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['id'] == str(doc.id)

    def test_documents_isolation(self, auth_client, user, other_user, target_occupation):
        """Test that users can't see other users' documents."""
        from documents.models import GeneratedDocument

        # Create document for authenticated user
        my_doc = GeneratedDocument.objects.create(
            user=user,
            target_occupation=target_occupation,
            tone='formal',
            audience='manager',
            content_markdown='# My Document'
        )

        # Create document for other user
        GeneratedDocument.objects.create(
            user=other_user,
            target_occupation=target_occupation,
            tone='formal',
            audience='hr',
            content_markdown='# Other Document'
        )

        url = '/api/documents/'
        response = auth_client.get(url)
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['id'] == str(my_doc.id)


@pytest.mark.django_db
class TestDocumentDetail:
    """Tests for document detail endpoint."""

    def test_get_document(self, auth_client, user, target_occupation):
        """Test getting document details."""
        from documents.models import GeneratedDocument

        doc = GeneratedDocument.objects.create(
            user=user,
            target_occupation=target_occupation,
            tone='conversational',
            audience='skip_level',
            content_markdown='# Promotion Case\n\nContent here...'
        )

        url = f'/api/documents/{doc.id}/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['tone'] == 'conversational'
        assert '# Promotion Case' in response.data['content_markdown']

    def test_get_document_not_found(self, auth_client):
        """Test getting non-existent document."""
        import uuid
        url = f'/api/documents/{uuid.uuid4()}/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_other_users_document(self, auth_client, other_user, target_occupation):
        """Test that user can't access another user's document."""
        from documents.models import GeneratedDocument

        doc = GeneratedDocument.objects.create(
            user=other_user,
            target_occupation=target_occupation,
            tone='formal',
            audience='manager',
            content_markdown='# Other Document'
        )

        url = f'/api/documents/{doc.id}/'
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestDocumentPDF:
    """Tests for document PDF export endpoint."""

    @patch('documents.views.HTML')
    def test_download_pdf(self, mock_html, auth_client, user, target_occupation):
        """Test downloading document as PDF."""
        from documents.models import GeneratedDocument

        doc = GeneratedDocument.objects.create(
            user=user,
            target_occupation=target_occupation,
            tone='formal',
            audience='manager',
            content_markdown='# Test Document'
        )

        # Mock WeasyPrint
        mock_html_instance = MagicMock()
        mock_html.return_value = mock_html_instance
        mock_html_instance.write_pdf.return_value = b'%PDF-1.4 fake pdf content'

        url = f'/api/documents/{doc.id}/pdf/'
        response = auth_client.get(url)
        # Either 200 (PDF generated) or 200 with markdown fallback
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestGeneratedDocumentModel:
    """Tests for the GeneratedDocument model."""

    def test_document_str(self, user, target_occupation):
        """Test document string representation."""
        from documents.models import GeneratedDocument

        doc = GeneratedDocument.objects.create(
            user=user,
            target_occupation=target_occupation,
            tone='formal',
            audience='manager',
            content_markdown='# Test'
        )
        assert str(user) in str(doc)
        assert target_occupation.title in str(doc)

    def test_document_version_auto_increment(self, user, target_occupation):
        """Test that document version auto-increments."""
        from documents.models import GeneratedDocument

        doc1 = GeneratedDocument.objects.create(
            user=user,
            target_occupation=target_occupation,
            tone='formal',
            audience='manager',
            content_markdown='# V1'
        )
        assert doc1.version == 1

        doc2 = GeneratedDocument.objects.create(
            user=user,
            target_occupation=target_occupation,
            tone='formal',
            audience='manager',
            content_markdown='# V2'
        )
        assert doc2.version == 2

    def test_document_tone_choices(self, user, target_occupation):
        """Test document tone choices."""
        from documents.models import GeneratedDocument

        for tone in ['formal', 'conversational', 'concise']:
            doc = GeneratedDocument.objects.create(
                user=user,
                target_occupation=target_occupation,
                tone=tone,
                audience='manager',
                content_markdown='# Test'
            )
            assert doc.tone == tone

    def test_document_audience_choices(self, user, target_occupation):
        """Test document audience choices."""
        from documents.models import GeneratedDocument

        for audience in ['manager', 'hr', 'skip_level', 'unknown']:
            doc = GeneratedDocument.objects.create(
                user=user,
                target_occupation=target_occupation,
                tone='formal',
                audience=audience,
                content_markdown='# Test'
            )
            assert doc.audience == audience
