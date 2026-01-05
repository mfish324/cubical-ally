"""
Views for Progress app.
"""
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from skills.models import Occupation, Skill
from .models import UserSkill, Evidence, GapAnalysis, CheckinLog
from .serializers import (
    UserSkillSerializer,
    UserSkillCreateSerializer,
    EvidenceSerializer,
    EvidenceCreateSerializer,
    GapAnalysisSerializer,
    FullGapAnalysisSerializer,
    CheckinLogSerializer,
    CheckinSubmitSerializer,
)
from .services import compute_gap_analysis, get_detailed_gap_analysis


class UserSkillListCreateView(generics.ListCreateAPIView):
    """
    List and create user skills.
    GET /api/profile/skills/
    POST /api/profile/skills/
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserSkill.objects.filter(
            user=self.request.user
        ).select_related('skill')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserSkillCreateSerializer
        return UserSkillSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class UserSkillDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Get, update, or delete a user skill.
    GET/PATCH/DELETE /api/profile/skills/{id}/
    """

    permission_classes = [IsAuthenticated]
    serializer_class = UserSkillSerializer

    def get_queryset(self):
        return UserSkill.objects.filter(user=self.request.user)


class BulkUserSkillView(APIView):
    """
    Bulk update user skills (for onboarding flow).
    POST /api/profile/skills/bulk/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Create or update multiple skills at once."""
        skills_data = request.data.get('skills', [])

        if not skills_data:
            return Response(
                {'error': 'No skills provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_count = 0
        updated_count = 0

        for skill_data in skills_data:
            serializer = UserSkillCreateSerializer(data=skill_data)
            if serializer.is_valid():
                skill_id = serializer.validated_data.get('skill')

                if skill_id:
                    # Update existing or create new
                    obj, created = UserSkill.objects.update_or_create(
                        user=request.user,
                        skill=skill_id,
                        defaults={
                            'skill_name': serializer.validated_data.get('skill_name', skill_id.name),
                            'proficiency': serializer.validated_data['proficiency'],
                            'is_custom': serializer.validated_data.get('is_custom', False),
                        }
                    )
                else:
                    # Custom skill
                    obj = UserSkill.objects.create(
                        user=request.user,
                        **serializer.validated_data
                    )
                    created = True

                if created:
                    created_count += 1
                else:
                    updated_count += 1

        return Response({
            'created': created_count,
            'updated': updated_count,
        })


class EvidenceListCreateView(generics.ListCreateAPIView):
    """
    List and create evidence.
    GET /api/evidence/
    POST /api/evidence/
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Evidence.objects.filter(
            user=self.request.user
        ).select_related('skill')

        # Optional filtering by skill
        skill_id = self.request.query_params.get('skill')
        if skill_id:
            queryset = queryset.filter(skill_id=skill_id)

        return queryset

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EvidenceCreateSerializer
        return EvidenceSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class EvidenceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Get, update, or delete evidence.
    GET/PATCH/DELETE /api/evidence/{id}/
    """

    permission_classes = [IsAuthenticated]
    serializer_class = EvidenceSerializer

    def get_queryset(self):
        return Evidence.objects.filter(user=self.request.user)


class EvidenceEnhanceView(APIView):
    """
    AI-enhance evidence.
    POST /api/evidence/{id}/enhance/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        from ai_services.ratelimit import check_rate_limit, rate_limit_response

        # Rate limit check
        allowed, remaining, reset_time = check_rate_limit(request, 'ai_enhance')
        if not allowed:
            return rate_limit_response('ai_enhance', remaining, reset_time)

        evidence = get_object_or_404(
            Evidence,
            pk=pk,
            user=request.user
        )

        # Import here to avoid circular imports
        from ai_services.services import enhance_evidence

        try:
            result = enhance_evidence(evidence)
            evidence.ai_enhanced_version = result['enhanced']
            evidence.save(update_fields=['ai_enhanced_version', 'updated_at'])

            return Response({
                'enhanced': result['enhanced'],
                'placeholders': result.get('placeholders', []),
                'tip': result.get('tip', ''),
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GapAnalysisView(APIView):
    """
    Get gap analysis for current target role.
    GET /api/analysis/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
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

        result = get_detailed_gap_analysis(request.user, target)
        serializer = FullGapAnalysisSerializer(result)
        return Response(serializer.data)


class GapAnalysisRefreshView(APIView):
    """
    Recompute gap analysis.
    POST /api/analysis/refresh/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
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

        result = get_detailed_gap_analysis(request.user, target)
        serializer = FullGapAnalysisSerializer(result)
        return Response(serializer.data)


class GapCoachingView(APIView):
    """
    Get AI coaching for a gap skill.
    GET /api/analysis/coaching/{skill_id}/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, skill_id):
        from ai_services.ratelimit import check_rate_limit, rate_limit_response

        # Rate limit check
        allowed, remaining, reset_time = check_rate_limit(request, 'ai_coaching')
        if not allowed:
            return rate_limit_response('ai_coaching', remaining, reset_time)

        skill = get_object_or_404(Skill, pk=skill_id)

        profile = getattr(request.user, 'profile', None)
        if not profile:
            return Response(
                {'error': 'Profile not found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Import here to avoid circular imports
        from ai_services.services import get_gap_coaching

        try:
            result = get_gap_coaching(
                skill=skill,
                current_role=profile.current_occupation_title,
                target_role=profile.target_occupation_title,
                industry=profile.industry,
            )
            return Response(result)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CheckinListView(generics.ListAPIView):
    """
    List check-in history.
    GET /api/checkins/
    """

    permission_classes = [IsAuthenticated]
    serializer_class = CheckinLogSerializer

    def get_queryset(self):
        return CheckinLog.objects.filter(user=self.request.user)


class CheckinSubmitView(APIView):
    """
    Submit a check-in.
    POST /api/checkins/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckinSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        wins_data = data.get('wins', [])
        skill_updates = data.get('skill_updates', [])
        notes = data.get('notes', '')

        # Create evidence entries for wins
        wins_added = 0
        for win_data in wins_data:
            Evidence.objects.create(user=request.user, **win_data)
            wins_added += 1

        # Update skills
        skills_updated = 0
        for skill_data in skill_updates:
            skill_serializer = UserSkillCreateSerializer(data=skill_data)
            if skill_serializer.is_valid():
                skill_id = skill_serializer.validated_data.get('skill')
                if skill_id:
                    UserSkill.objects.update_or_create(
                        user=request.user,
                        skill=skill_id,
                        defaults=skill_serializer.validated_data
                    )
                    skills_updated += 1

        # Get current readiness score
        profile = getattr(request.user, 'profile', None)
        readiness_score = profile.readiness_score if profile else None

        # Create check-in log
        checkin = CheckinLog.objects.create(
            user=request.user,
            scheduled_at=timezone.now(),
            completed_at=timezone.now(),
            wins_added=wins_added,
            skills_updated=skills_updated,
            notes=notes,
            readiness_score_snapshot=readiness_score,
        )

        # Update last check-in timestamp
        if profile:
            profile.last_checkin_at = timezone.now()
            profile.save(update_fields=['last_checkin_at'])

        return Response(CheckinLogSerializer(checkin).data, status=status.HTTP_201_CREATED)
