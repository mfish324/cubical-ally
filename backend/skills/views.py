"""
Views for Skills app.
"""
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Occupation, Skill, OccupationSkill, PromotionPath, TitleAlias
from .serializers import (
    OccupationListSerializer,
    OccupationDetailSerializer,
    OccupationSkillSerializer,
    PromotionPathSerializer,
    SkillSerializer,
    TitleInterpretationRequestSerializer,
    TitleInterpretationResultSerializer,
)


class OccupationSearchView(APIView):
    """
    Search occupations by title with fuzzy matching.
    GET /api/occupations/search/?q=marketing
    """

    permission_classes = [AllowAny]

    def get_search_variants(self, text):
        """Get search variants for better matching (handle plurals, etc.)"""
        text = text.lower().strip()
        variants = {text}

        # Generate singular form
        if text.endswith('ies'):
            variants.add(text[:-3] + 'y')  # secretaries -> secretary
        elif text.endswith('es'):
            variants.add(text[:-2])  # coaches -> coach
        elif text.endswith('s') and not text.endswith('ss'):
            variants.add(text[:-1])  # managers -> manager

        # Generate plural forms
        if text.endswith('y') and len(text) > 1 and text[-2] not in 'aeiou':
            variants.add(text[:-1] + 'ies')  # secretary -> secretaries
        elif text.endswith(('s', 'x', 'z', 'ch', 'sh')):
            variants.add(text + 'es')  # coach -> coaches
        else:
            variants.add(text + 's')  # manager -> managers

        return variants

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if len(query) < 2:
            return Response([])

        limit = int(request.query_params.get('limit', 10))

        # Get all search variants (singular/plural)
        search_variants = self.get_search_variants(query)

        # Build Q object for all variants
        title_q = Q()
        for variant in search_variants:
            title_q |= Q(title__icontains=variant)

        # First, try matching with all variants
        exact_matches = Occupation.objects.filter(
            title_q | Q(onet_soc_code__startswith=query)
        )[:limit]

        # Also search title aliases with all variants
        alias_q = Q()
        for variant in search_variants:
            alias_q |= Q(alias__icontains=variant)

        alias_matches = TitleAlias.objects.filter(
            alias_q
        ).select_related('canonical_occupation')[:limit]

        # Combine results, avoiding duplicates
        seen_codes = set()
        results = []

        # Add exact occupation matches
        for occ in exact_matches:
            if occ.onet_soc_code not in seen_codes:
                seen_codes.add(occ.onet_soc_code)
                # Check for exact match (case-insensitive, considering variants)
                occ_variants = self.get_search_variants(occ.title)
                is_exact = bool(search_variants & occ_variants) or query.lower() == occ.title.lower()
                results.append({
                    'occupation': OccupationListSerializer(occ).data,
                    'match_score': 1.0 if is_exact else 0.8,
                })

        # Add alias matches
        for alias in alias_matches:
            occ = alias.canonical_occupation
            if occ.onet_soc_code not in seen_codes:
                seen_codes.add(occ.onet_soc_code)
                results.append({
                    'occupation': OccupationListSerializer(occ).data,
                    'match_score': 0.7,
                    'matched_alias': alias.alias,
                })

        # Sort by match score
        results.sort(key=lambda x: x['match_score'], reverse=True)

        return Response(results[:limit])


class OccupationDetailView(generics.RetrieveAPIView):
    """
    Get detailed occupation information.
    GET /api/occupations/{code}/
    """

    permission_classes = [AllowAny]
    queryset = Occupation.objects.all()
    serializer_class = OccupationDetailSerializer
    lookup_field = 'onet_soc_code'
    lookup_url_kwarg = 'code'


class OccupationSkillsView(APIView):
    """
    Get skills for an occupation.
    GET /api/occupations/{code}/skills/
    """

    permission_classes = [AllowAny]

    def get(self, request, code):
        try:
            occupation = Occupation.objects.get(onet_soc_code=code)
        except Occupation.DoesNotExist:
            return Response(
                {'error': 'Occupation not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get skills with minimum importance threshold
        min_importance = float(request.query_params.get('min_importance', 2.5))
        category = request.query_params.get('category', None)

        occupation_skills = occupation.occupation_skills.select_related('skill').filter(
            importance__gte=min_importance
        )

        if category:
            occupation_skills = occupation_skills.filter(skill__category=category)

        occupation_skills = occupation_skills.order_by('-importance')

        serializer = OccupationSkillSerializer(occupation_skills, many=True)
        return Response(serializer.data)


class OccupationPathsView(APIView):
    """
    Get promotion paths from an occupation.
    GET /api/occupations/{code}/paths/

    Falls back to AI-generated suggestions if no pre-defined paths exist.
    Use ?ai=true to force AI suggestions even if paths exist.
    """

    permission_classes = [AllowAny]

    def get(self, request, code):
        try:
            occupation = Occupation.objects.get(onet_soc_code=code)
        except Occupation.DoesNotExist:
            return Response(
                {'error': 'Occupation not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        limit = int(request.query_params.get('limit', 6))
        sector = request.query_params.get('sector', None)
        force_ai = request.query_params.get('ai', '').lower() == 'true'

        # First, try to get pre-defined paths
        paths = PromotionPath.objects.filter(
            source_occupation=occupation
        ).select_related('target_occupation')

        if sector:
            paths = paths.filter(sector=sector)

        paths = paths.order_by('-frequency')[:limit]

        # If we have pre-defined paths and not forcing AI, return them
        if paths.exists() and not force_ai:
            serializer = PromotionPathSerializer(paths, many=True)
            return Response({
                'source': 'database',
                'paths': serializer.data
            })

        # Otherwise, use AI to suggest career paths
        from ai_services.services import suggest_career_paths
        from ai_services.ratelimit import check_rate_limit, rate_limit_response

        # Rate limit check for AI path generation
        allowed, remaining, reset_time = check_rate_limit(request, 'ai_paths')
        if not allowed:
            return rate_limit_response('ai_paths', remaining, reset_time)

        try:
            industry = request.query_params.get('industry', '')
            user = request.user if request.user.is_authenticated else None

            ai_result = suggest_career_paths(
                current_occupation=occupation,
                industry=industry,
                user=user,
            )

            return Response({
                'source': 'ai',
                'paths': ai_result.get('paths', []),
                'encouragement': ai_result.get('encouragement', ''),
            })

        except Exception as e:
            # If AI fails, return empty with error message
            return Response({
                'source': 'error',
                'paths': [],
                'error': 'Could not generate career suggestions. Please try again.',
            })


class OccupationInterpretView(APIView):
    """
    Use AI to interpret a non-standard job title.
    POST /api/occupations/interpret/
    """

    permission_classes = [AllowAny]

    def post(self, request):
        from ai_services.ratelimit import check_rate_limit, rate_limit_response

        # Rate limit check
        allowed, remaining, reset_time = check_rate_limit(request, 'ai_interpret')
        if not allowed:
            return rate_limit_response('ai_interpret', remaining, reset_time)
        serializer = TitleInterpretationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        title = serializer.validated_data['title']
        description = serializer.validated_data.get('description', '')

        # Import here to avoid circular imports
        from ai_services.services import interpret_job_title

        try:
            results = interpret_job_title(title, description)
            return Response(results)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SkillListView(generics.ListAPIView):
    """
    List all skills, optionally filtered by category.
    GET /api/skills/
    """

    permission_classes = [AllowAny]
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    filterset_fields = ['category']
    search_fields = ['name', 'description']


class SkillDetailView(generics.RetrieveAPIView):
    """
    Get skill details.
    GET /api/skills/{id}/
    """

    permission_classes = [AllowAny]
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
