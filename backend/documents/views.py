"""
Views for Documents app.
"""
from io import BytesIO

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from skills.models import Occupation
from .models import GeneratedDocument
from .serializers import (
    GeneratedDocumentSerializer,
    DocumentListSerializer,
    DocumentGenerateRequestSerializer,
)
from .services.generator import gather_document_context


class DocumentGenerateView(APIView):
    """
    Generate a promotion case document.
    POST /api/documents/generate/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        from ai_services.ratelimit import check_rate_limit, rate_limit_response

        # Rate limit check (stricter for document generation)
        allowed, remaining, reset_time = check_rate_limit(request, 'ai_document')
        if not allowed:
            return rate_limit_response('ai_document', remaining, reset_time)

        serializer = DocumentGenerateRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.target_occupation_code:
            return Response(
                {'error': 'No target occupation set'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            target = Occupation.objects.get(
                onet_soc_code=profile.target_occupation_code
            )
        except Occupation.DoesNotExist:
            return Response(
                {'error': 'Target occupation not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Gather context
        context = gather_document_context(request.user, target)
        context['audience'] = serializer.validated_data['audience']
        context['tone'] = serializer.validated_data['tone']
        context['emphasis'] = serializer.validated_data.get('emphasis', '')

        # Import here to avoid circular imports
        from ai_services.services import generate_document

        try:
            content = generate_document(context)

            # Determine version number
            existing_count = GeneratedDocument.objects.filter(
                user=request.user,
                target_occupation=target,
            ).count()

            # Save the document
            doc = GeneratedDocument.objects.create(
                user=request.user,
                target_occupation=target,
                tone=serializer.validated_data['tone'],
                audience=serializer.validated_data['audience'],
                content_markdown=content,
                version=existing_count + 1,
            )

            return Response(
                GeneratedDocumentSerializer(doc).data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentListView(generics.ListAPIView):
    """
    List saved documents.
    GET /api/documents/
    """

    permission_classes = [IsAuthenticated]
    serializer_class = DocumentListSerializer

    def get_queryset(self):
        return GeneratedDocument.objects.filter(
            user=self.request.user
        ).select_related('target_occupation')


class DocumentDetailView(generics.RetrieveAPIView):
    """
    Get document detail.
    GET /api/documents/{id}/
    """

    permission_classes = [IsAuthenticated]
    serializer_class = GeneratedDocumentSerializer

    def get_queryset(self):
        return GeneratedDocument.objects.filter(
            user=self.request.user
        ).select_related('target_occupation')


class DocumentPDFView(APIView):
    """
    Download document as PDF.
    GET /api/documents/{id}/pdf/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        doc = get_object_or_404(
            GeneratedDocument,
            pk=pk,
            user=request.user
        )

        try:
            # Try to use WeasyPrint for PDF generation
            from weasyprint import HTML, CSS
            import markdown

            # Convert markdown to HTML
            html_content = markdown.markdown(
                doc.content_markdown,
                extensions=['tables', 'fenced_code']
            )

            # Wrap in styled HTML
            full_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {{
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        max-width: 800px;
                        margin: 40px auto;
                        padding: 20px;
                        color: #1f2937;
                    }}
                    h1 {{ color: #6366f1; margin-bottom: 0.5em; }}
                    h2 {{ color: #4f46e5; margin-top: 1.5em; }}
                    h3 {{ color: #6b7280; }}
                    ul, ol {{ margin-left: 20px; }}
                    li {{ margin-bottom: 0.5em; }}
                    strong {{ color: #1f2937; }}
                </style>
            </head>
            <body>
                {html_content}
            </body>
            </html>
            """

            # Generate PDF
            pdf_buffer = BytesIO()
            HTML(string=full_html).write_pdf(pdf_buffer)
            pdf_buffer.seek(0)

            response = HttpResponse(
                pdf_buffer.read(),
                content_type='application/pdf'
            )
            filename = f"promotion_case_{doc.target_occupation.title.replace(' ', '_')}_v{doc.version}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

        except ImportError:
            # WeasyPrint not available, return markdown as text
            response = HttpResponse(
                doc.content_markdown,
                content_type='text/markdown'
            )
            response['Content-Disposition'] = f'attachment; filename="promotion_case.md"'
            return response

        except Exception as e:
            return Response(
                {'error': f'PDF generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
