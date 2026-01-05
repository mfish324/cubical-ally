"""
Gap analysis computation service.
"""
from decimal import Decimal
from typing import Dict, List, Optional, Tuple

from django.db.models import QuerySet
from django.utils import timezone

from skills.models import Occupation, OccupationSkill, Skill
from progress.models import UserSkill, GapAnalysis


def compute_gap_analysis(
    user,
    target_occupation: Occupation,
    save_result: bool = True
) -> Dict:
    """
    Compute gap analysis between user's skills and target occupation requirements.

    Returns a dictionary with:
    - readiness_score: 0-100 percentage
    - strengths: Skills user has that match target
    - gaps: Skills user is missing
    - partial_matches: Skills user has but at lower proficiency
    """
    # Get target occupation's required skills (importance >= 2.5)
    target_skills = OccupationSkill.objects.filter(
        occupation=target_occupation,
        importance__gte=Decimal('2.5')
    ).select_related('skill').order_by('-importance')

    # Get user's rated skills
    user_skills = UserSkill.objects.filter(user=user).select_related('skill')
    user_skill_map = {
        us.skill_id: us for us in user_skills if us.skill_id
    }

    strengths = []
    gaps = []
    partial_matches = []

    total_importance = Decimal('0')
    matched_importance = Decimal('0')

    for occ_skill in target_skills:
        skill = occ_skill.skill
        importance = occ_skill.importance
        required_level = occ_skill.level
        total_importance += importance

        user_skill = user_skill_map.get(skill.id)

        if user_skill:
            # Map proficiency (1-3) to level scale for comparison
            # Rarely=1 → ~2, Sometimes=2 → ~4, Regularly=3 → ~6
            user_level = user_skill.proficiency * 2

            if user_level >= float(required_level) * 0.7:
                # User has skill at adequate level
                strengths.append(str(skill.id))
                matched_importance += importance
            else:
                # User has skill but not at required level
                partial_matches.append(str(skill.id))
                # Partial credit
                matched_importance += importance * Decimal('0.5')
        else:
            # User doesn't have this skill
            priority = _determine_priority(importance)
            gaps.append({
                'skill_id': str(skill.id),
                'priority': priority,
                'importance': float(importance),
            })

    # Calculate readiness score
    if total_importance > 0:
        readiness_score = int((matched_importance / total_importance) * 100)
    else:
        readiness_score = 0

    # Sort gaps by importance (priority)
    gaps.sort(key=lambda x: x['importance'], reverse=True)

    result = {
        'readiness_score': readiness_score,
        'strengths': strengths,
        'gaps': gaps,
        'partial_matches': partial_matches,
        'target_occupation': target_occupation.onet_soc_code,
        'computed_at': timezone.now(),
    }

    if save_result:
        # Save or update the gap analysis
        GapAnalysis.objects.update_or_create(
            user=user,
            target_occupation=target_occupation,
            defaults={
                'readiness_score': readiness_score,
                'strengths': strengths,
                'gaps': gaps,
                'partial_matches': partial_matches,
            }
        )

        # Update user profile readiness score
        if hasattr(user, 'profile'):
            user.profile.readiness_score = readiness_score
            user.profile.save(update_fields=['readiness_score'])

    return result


def _determine_priority(importance: Decimal) -> str:
    """Determine priority level based on importance score."""
    if importance >= Decimal('4.0'):
        return 'high'
    elif importance >= Decimal('3.0'):
        return 'medium'
    else:
        return 'low'


def get_detailed_gap_analysis(user, target_occupation: Occupation) -> Dict:
    """
    Get detailed gap analysis with full skill information.
    """
    # First compute/refresh the analysis
    basic_result = compute_gap_analysis(user, target_occupation)

    # Get full skill details
    strength_skills = Skill.objects.filter(
        id__in=basic_result['strengths']
    )

    partial_skills = Skill.objects.filter(
        id__in=basic_result['partial_matches']
    )

    # Get gap skills with full details
    gap_skill_ids = [g['skill_id'] for g in basic_result['gaps']]
    gap_skills = Skill.objects.filter(id__in=gap_skill_ids)
    gap_skill_map = {str(s.id): s for s in gap_skills}

    # Get occupation skill requirements for gaps
    occ_skills = OccupationSkill.objects.filter(
        occupation=target_occupation,
        skill_id__in=gap_skill_ids
    ).select_related('skill')
    occ_skill_map = {str(os.skill_id): os for os in occ_skills}

    # Get user's current ratings for context
    user_skills = UserSkill.objects.filter(
        user=user,
        skill_id__in=gap_skill_ids
    )
    user_skill_map = {str(us.skill_id): us for us in user_skills}

    detailed_gaps = []
    for gap in basic_result['gaps']:
        skill_id = gap['skill_id']
        skill = gap_skill_map.get(skill_id)
        occ_skill = occ_skill_map.get(skill_id)
        user_skill = user_skill_map.get(skill_id)

        if skill and occ_skill:
            detailed_gaps.append({
                'skill': skill,
                'priority': gap['priority'],
                'importance': float(occ_skill.importance),
                'user_proficiency': user_skill.proficiency if user_skill else None,
                'required_level': float(occ_skill.level),
            })

    return {
        'readiness_score': basic_result['readiness_score'],
        'target_occupation': target_occupation.title,
        'computed_at': basic_result['computed_at'],
        'strengths': list(strength_skills),
        'gaps': detailed_gaps,
        'partial_matches': list(partial_skills),
        'total_target_skills': len(basic_result['strengths']) + len(basic_result['gaps']) + len(basic_result['partial_matches']),
        'matched_skills': len(basic_result['strengths']),
    }
