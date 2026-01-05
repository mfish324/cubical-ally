"""
URL patterns for progress app.
"""
from django.urls import path

from .views import (
    UserSkillListCreateView,
    UserSkillDetailView,
    BulkUserSkillView,
    EvidenceListCreateView,
    EvidenceDetailView,
    EvidenceEnhanceView,
    GapAnalysisView,
    GapAnalysisRefreshView,
    GapCoachingView,
    CheckinListView,
    CheckinSubmitView,
)

urlpatterns = [
    # User skills
    path('profile/skills/', UserSkillListCreateView.as_view(), name='user-skill-list'),
    path('profile/skills/bulk/', BulkUserSkillView.as_view(), name='user-skill-bulk'),
    path('profile/skills/<uuid:pk>/', UserSkillDetailView.as_view(), name='user-skill-detail'),

    # Evidence
    path('evidence/', EvidenceListCreateView.as_view(), name='evidence-list'),
    path('evidence/<uuid:pk>/', EvidenceDetailView.as_view(), name='evidence-detail'),
    path('evidence/<uuid:pk>/enhance/', EvidenceEnhanceView.as_view(), name='evidence-enhance'),

    # Gap analysis
    path('analysis/', GapAnalysisView.as_view(), name='gap-analysis'),
    path('analysis/refresh/', GapAnalysisRefreshView.as_view(), name='gap-analysis-refresh'),
    path('analysis/coaching/<uuid:skill_id>/', GapCoachingView.as_view(), name='gap-coaching'),

    # Check-ins
    path('checkins/', CheckinListView.as_view(), name='checkin-list'),
]
