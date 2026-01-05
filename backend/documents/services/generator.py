"""
Document generation service.
"""
from typing import Dict, List, Optional

from django.conf import settings

from skills.models import Occupation, Skill
from progress.models import UserSkill, Evidence, GapAnalysis
from progress.services import compute_gap_analysis


def gather_document_context(user, target_occupation: Occupation) -> Dict:
    """
    Gather all context needed for document generation.
    """
    profile = getattr(user, 'profile', None)

    # Get gap analysis
    gap_analysis = compute_gap_analysis(user, target_occupation, save_result=False)

    # Get strength skills with details
    strength_ids = gap_analysis['strengths']
    strength_skills = list(Skill.objects.filter(id__in=strength_ids))

    # Get gap skills with details
    gap_skill_ids = [g['skill_id'] for g in gap_analysis['gaps']]
    gap_skills = list(Skill.objects.filter(id__in=gap_skill_ids))

    # Get evidence grouped by skill
    evidence = Evidence.objects.filter(user=user).select_related('skill')
    evidence_by_skill = {}
    general_evidence = []

    for ev in evidence:
        if ev.skill_id:
            skill_id = str(ev.skill_id)
            if skill_id not in evidence_by_skill:
                evidence_by_skill[skill_id] = []
            evidence_by_skill[skill_id].append({
                'situation': ev.situation,
                'action': ev.action,
                'result': ev.result,
                'enhanced': ev.ai_enhanced_version,
            })
        else:
            general_evidence.append({
                'situation': ev.situation,
                'action': ev.action,
                'result': ev.result,
                'enhanced': ev.ai_enhanced_version,
            })

    # Format strengths with evidence
    strengths_with_evidence = []
    for skill in strength_skills:
        skill_evidence = evidence_by_skill.get(str(skill.id), [])
        strengths_with_evidence.append({
            'skill': skill.name,
            'category': skill.category,
            'evidence': skill_evidence,
        })

    # Format gaps with status
    gaps_with_status = []
    for skill in gap_skills:
        gap_info = next(
            (g for g in gap_analysis['gaps'] if g['skill_id'] == str(skill.id)),
            {}
        )
        gaps_with_status.append({
            'skill': skill.name,
            'priority': gap_info.get('priority', 'medium'),
        })

    return {
        'current_role': profile.current_occupation_title if profile else '',
        'target_role': target_occupation.title,
        'years': profile.years_in_current_role if profile else None,
        'industry': profile.industry if profile else '',
        'readiness_score': gap_analysis['readiness_score'],
        'strengths': strengths_with_evidence,
        'gaps': gaps_with_status,
        'general_evidence': general_evidence,
    }


def format_evidence_for_prompt(evidence_list: List[Dict]) -> str:
    """Format evidence entries for the AI prompt."""
    if not evidence_list:
        return "No documented evidence yet."

    formatted = []
    for ev in evidence_list:
        # Prefer enhanced version if available
        text = ev.get('enhanced') or ev.get('action', '')
        if ev.get('result'):
            text += f" Result: {ev['result']}"
        formatted.append(f"- {text}")

    return '\n'.join(formatted)


def format_strengths_for_prompt(strengths: List[Dict]) -> str:
    """Format strengths with importance for the AI prompt."""
    if not strengths:
        return "No matching strengths identified."

    lines = []
    for s in strengths:
        evidence_text = format_evidence_for_prompt(s.get('evidence', []))
        lines.append(f"**{s['skill']}** ({s['category']})")
        if s.get('evidence'):
            lines.append(f"Evidence:\n{evidence_text}")
        lines.append("")

    return '\n'.join(lines)


def format_gaps_for_prompt(gaps: List[Dict]) -> str:
    """Format gaps with status for the AI prompt."""
    if not gaps:
        return "No significant skill gaps identified."

    lines = []
    for g in gaps:
        lines.append(f"- {g['skill']} (Priority: {g['priority']})")

    return '\n'.join(lines)
