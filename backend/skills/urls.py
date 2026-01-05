"""
URL patterns for skills app.
"""
from django.urls import path

from .views import (
    OccupationSearchView,
    OccupationDetailView,
    OccupationSkillsView,
    OccupationPathsView,
    OccupationInterpretView,
    SkillListView,
    SkillDetailView,
)

urlpatterns = [
    # Occupation endpoints
    path('occupations/search/', OccupationSearchView.as_view(), name='occupation-search'),
    path('occupations/interpret/', OccupationInterpretView.as_view(), name='occupation-interpret'),
    path('occupations/<str:code>/', OccupationDetailView.as_view(), name='occupation-detail'),
    path('occupations/<str:code>/skills/', OccupationSkillsView.as_view(), name='occupation-skills'),
    path('occupations/<str:code>/paths/', OccupationPathsView.as_view(), name='occupation-paths'),

    # Skill endpoints
    path('skills/', SkillListView.as_view(), name='skill-list'),
    path('skills/<uuid:pk>/', SkillDetailView.as_view(), name='skill-detail'),
]
