"""
URL patterns for documents app.
"""
from django.urls import path

from .views import (
    DocumentGenerateView,
    DocumentListView,
    DocumentDetailView,
    DocumentPDFView,
)

urlpatterns = [
    path('documents/generate/', DocumentGenerateView.as_view(), name='document-generate'),
    path('documents/', DocumentListView.as_view(), name='document-list'),
    path('documents/<uuid:pk>/', DocumentDetailView.as_view(), name='document-detail'),
    path('documents/<uuid:pk>/pdf/', DocumentPDFView.as_view(), name='document-pdf'),
]
