"""
AI service functions for CubicleAlly.
"""
import logging
from typing import Dict, List, Optional

from .client import claude_client
from .models import AIInteractionLog
from .prompts import (
    TITLE_INTERPRETATION_SYSTEM,
    TITLE_INTERPRETATION_USER,
    EVIDENCE_ENHANCEMENT_SYSTEM,
    EVIDENCE_ENHANCEMENT_USER,
    GAP_COACHING_SYSTEM,
    GAP_COACHING_USER,
    DOC_GENERATION_SYSTEM,
    DOC_GENERATION_USER,
    CAREER_PATH_SYSTEM,
    CAREER_PATH_USER,
)

logger = logging.getLogger(__name__)


def log_interaction(
    user,
    interaction_type: str,
    input_text: str,
    tokens_input: int,
    tokens_output: int,
    model: str,
):
    """Log an AI interaction for monitoring."""
    AIInteractionLog.objects.create(
        user=user,
        interaction_type=interaction_type,
        input_hash=AIInteractionLog.hash_input(input_text),
        tokens_input=tokens_input,
        tokens_output=tokens_output,
        model_used=model,
    )


def interpret_job_title(
    user_title: str,
    description: str = '',
    candidate_occupations: Optional[List[Dict]] = None,
    user=None,
) -> List[Dict]:
    """
    Use AI to interpret a non-standard job title and match to O*NET occupations.

    Returns list of matches with confidence scores.
    Only returns matches for occupations that exist in our database.
    """
    from skills.models import Occupation

    # Always get ALL occupations from our database as candidates
    # This ensures AI can only return matches we actually have
    all_occupations = Occupation.objects.all()

    candidate_occupations = [
        {
            'code': occ.onet_soc_code,
            'title': occ.title,
            'description': occ.description[:200] if occ.description else '',
        }
        for occ in all_occupations
    ]

    # Build a lookup dict for validation
    valid_codes = {occ.onet_soc_code for occ in all_occupations}

    # Format candidates for prompt
    candidates_text = '\n'.join([
        f"- {c['code']}: {c['title']} - {c['description']}"
        for c in candidate_occupations
    ])

    additional_context = ""
    if description:
        additional_context = f"Additional context from user: {description}"

    prompt = TITLE_INTERPRETATION_USER.format(
        user_title=user_title,
        additional_context=additional_context,
        candidate_occupations=candidates_text,
    )

    try:
        result = claude_client.chat_json(
            system_prompt=TITLE_INTERPRETATION_SYSTEM,
            user_message=prompt,
            max_tokens=1000,
        )

        # Log the interaction
        if user:
            log_interaction(
                user=user,
                interaction_type='title_interpretation',
                input_text=prompt,
                tokens_input=result['tokens_input'],
                tokens_output=result['tokens_output'],
                model=claude_client.model,
            )

        # Filter results to only include occupations that exist in our database
        data = result['data']
        if 'matches' in data and data['matches']:
            data['matches'] = [
                match for match in data['matches']
                if match.get('code') in valid_codes
            ]

        return data

    except Exception as e:
        logger.error(f"Title interpretation failed: {e}")
        raise


def enhance_evidence(evidence, user=None) -> Dict:
    """
    Use AI to enhance evidence/accomplishment text.

    Returns dict with 'enhanced', 'placeholders', 'tip'.
    """
    skill_name = evidence.skill.name if evidence.skill else 'General'

    # Combine STAR components
    user_input = evidence.combined_text

    prompt = EVIDENCE_ENHANCEMENT_USER.format(
        user_input=user_input,
        skill_name=skill_name,
    )

    try:
        result = claude_client.chat_json(
            system_prompt=EVIDENCE_ENHANCEMENT_SYSTEM,
            user_message=prompt,
            max_tokens=500,
        )

        # Log the interaction
        log_user = user or evidence.user
        if log_user:
            log_interaction(
                user=log_user,
                interaction_type='evidence_enhancement',
                input_text=prompt,
                tokens_input=result['tokens_input'],
                tokens_output=result['tokens_output'],
                model=claude_client.model,
            )

        return result['data']

    except Exception as e:
        logger.error(f"Evidence enhancement failed: {e}")
        raise


def get_gap_coaching(
    skill,
    current_role: str,
    target_role: str,
    industry: str = '',
    user=None,
) -> Dict:
    """
    Get AI coaching for developing a gap skill.

    Returns dict with coaching content.
    """
    # Get importance from occupation skill if available
    from skills.models import OccupationSkill, Occupation

    importance = 4.0  # Default
    try:
        # Try to find the skill importance for the target role
        if target_role:
            occ = Occupation.objects.filter(title__icontains=target_role).first()
            if occ:
                occ_skill = OccupationSkill.objects.filter(
                    occupation=occ,
                    skill=skill
                ).first()
                if occ_skill:
                    importance = float(occ_skill.importance)
    except Exception:
        pass

    prompt = GAP_COACHING_USER.format(
        current_role=current_role or 'their current role',
        target_role=target_role or 'their target role',
        skill_name=skill.name,
        skill_description=skill.description,
        importance=importance,
        industry=industry or 'general',
    )

    try:
        result = claude_client.chat_json(
            system_prompt=GAP_COACHING_SYSTEM,
            user_message=prompt,
            max_tokens=1000,
        )

        # Log the interaction
        if user:
            log_interaction(
                user=user,
                interaction_type='gap_coaching',
                input_text=prompt,
                tokens_input=result['tokens_input'],
                tokens_output=result['tokens_output'],
                model=claude_client.model,
            )

        return result['data']

    except Exception as e:
        logger.error(f"Gap coaching failed: {e}")
        raise


def generate_document(context: Dict, user=None) -> str:
    """
    Generate a promotion case document.

    Returns markdown content.
    """
    from documents.services.generator import (
        format_strengths_for_prompt,
        format_gaps_for_prompt,
        format_evidence_for_prompt,
    )

    # Format the context for the prompt
    strengths_formatted = format_strengths_for_prompt(context.get('strengths', []))
    gaps_formatted = format_gaps_for_prompt(context.get('gaps', []))
    evidence_formatted = format_evidence_for_prompt(context.get('general_evidence', []))

    prompt = DOC_GENERATION_USER.format(
        current_role=context.get('current_role', 'Current Role'),
        target_role=context.get('target_role', 'Target Role'),
        years=context.get('years') or 'N/A',
        industry=context.get('industry') or 'General',
        audience=context.get('audience', 'manager'),
        tone=context.get('tone', 'conversational'),
        emphasis=context.get('emphasis', ''),
        strengths_formatted=strengths_formatted,
        evidence_formatted=evidence_formatted,
        gaps_formatted=gaps_formatted,
    )

    try:
        result = claude_client.chat(
            system_prompt=DOC_GENERATION_SYSTEM,
            user_message=prompt,
            max_tokens=2000,
            temperature=0.7,
        )

        # Log the interaction
        if user:
            log_interaction(
                user=user,
                interaction_type='doc_generation',
                input_text=prompt,
                tokens_input=result['tokens_input'],
                tokens_output=result['tokens_output'],
                model=claude_client.model,
            )

        return result['content']

    except Exception as e:
        logger.error(f"Document generation failed: {e}")
        raise


def suggest_career_paths(
    current_occupation,
    industry: str = '',
    user=None,
) -> Dict:
    """
    Use AI to suggest realistic career paths based on the user's current role.

    Considers:
    - Skill transferability
    - Common career progressions
    - Both vertical and lateral moves
    - Stepping stone opportunities
    """
    from skills.models import Occupation, OccupationSkill

    # Get the user's current skills from their occupation
    current_skills = OccupationSkill.objects.filter(
        occupation=current_occupation,
        importance__gte=3.0  # Focus on important skills
    ).select_related('skill').order_by('-importance')[:10]

    current_skills_text = ', '.join([
        os.skill.name for os in current_skills
    ]) if current_skills else 'general administrative and communication skills'

    # Get candidate occupations (all in our database except current)
    # Include relevant context about each
    candidates = Occupation.objects.exclude(
        onet_soc_code=current_occupation.onet_soc_code
    ).order_by('title')

    # Format candidates with enough info for AI to make good suggestions
    candidate_list = []
    for occ in candidates:
        # Get top skills for this occupation
        top_skills = OccupationSkill.objects.filter(
            occupation=occ,
            importance__gte=3.5
        ).select_related('skill').order_by('-importance')[:5]

        skills_text = ', '.join([os.skill.name for os in top_skills])

        candidate_list.append(
            f"- {occ.onet_soc_code}: {occ.title} (Job Zone {occ.job_zone}) - Key skills: {skills_text or 'various'}"
        )

    candidates_text = '\n'.join(candidate_list)

    prompt = CAREER_PATH_USER.format(
        current_role=current_occupation.title,
        current_skills=current_skills_text,
        industry=industry or 'general',
        candidate_occupations=candidates_text,
    )

    try:
        result = claude_client.chat_json(
            system_prompt=CAREER_PATH_SYSTEM,
            user_message=prompt,
            max_tokens=1500,
        )

        # Log the interaction
        if user:
            log_interaction(
                user=user,
                interaction_type='career_paths',
                input_text=prompt[:500],  # Truncate for logging
                tokens_input=result['tokens_input'],
                tokens_output=result['tokens_output'],
                model=claude_client.model,
            )

        # Validate that suggested occupations exist in our database
        data = result['data']
        if 'paths' in data:
            valid_codes = {o.onet_soc_code for o in Occupation.objects.all()}
            data['paths'] = [
                path for path in data['paths']
                if path.get('occupation_code') in valid_codes
            ]

            # Enrich with full occupation data
            for path in data['paths']:
                try:
                    occ = Occupation.objects.get(onet_soc_code=path['occupation_code'])
                    path['occupation'] = {
                        'onet_soc_code': occ.onet_soc_code,
                        'title': occ.title,
                        'description': occ.description,
                        'job_zone': occ.job_zone,
                    }
                except Occupation.DoesNotExist:
                    pass

        return data

    except Exception as e:
        logger.error(f"Career path suggestion failed: {e}")
        raise
