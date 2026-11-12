"""
Career Roadmap Generation Engine for CareerBridge.
Synthesizes sequenced, multi-stage learning roadmaps with curated resources,
hands-on coding exercises, and LLM-assisted personalization with offline fallback.
"""

import os
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

from app.core.config import settings
from app.ai.career_intelligence.curated_roles import (
    CURATED_TARGET_ROLES,
    get_curated_target_role,
    generate_custom_role_profile
)
from app.ai.career_intelligence.skill_gap_analyzer import evaluate_skill_gap

logger = logging.getLogger("careerbridge.roadmap")


def generate_personalized_roadmap(
    student_data: Dict[str, Any],
    target_role_name: str,
    gap_analysis: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generates a personalized 6-stage career roadmap for the student.
    
    If gap_analysis is not provided, it is computed dynamically against student_data.
    """
    role_profile = get_curated_target_role(target_role_name)
    if not role_profile:
        role_profile = generate_custom_role_profile(target_role_name)

    if not gap_analysis:
        gap_analysis = evaluate_skill_gap(student_data, role_profile)

    proficient_skills = {
        s["skill_name"].lower() for s in gap_analysis.get("already_proficient_skills", [])
    }
    needs_imp_skills = {
        s["skill_name"].lower() for s in gap_analysis.get("needs_improvement_skills", [])
    }
    unlearned_skills = {
        s["skill_name"].lower() for s in gap_analysis.get("not_yet_learned_skills", [])
    }

    raw_stages = role_profile.get("curated_stages", [])
    items: List[Dict[str, Any]] = []

    completed_count = 0
    in_progress_count = 0

    for idx, stage in enumerate(raw_stages, start=1):
        skill_name = stage.get("skill", "")
        skill_key = skill_name.lower()

        # Determine initial status based on student's verified profile
        if skill_key in proficient_skills:
            initial_status = "completed"
            is_completed = True
            completed_at = datetime.utcnow().isoformat()
            completed_count += 1
            personal_note = "Proficiency verified from existing academic/project profile. Ready for mock interviews."
        elif skill_key in needs_imp_skills:
            initial_status = "in_progress"
            is_completed = False
            completed_at = None
            in_progress_count += 1
            personal_note = "Basic familiarity identified. Focus on advanced patterns and project evidence."
        else:
            initial_status = "not_started"
            is_completed = False
            completed_at = None
            personal_note = "High-priority gap. Review official resources and complete practical exercise."

        items.append({
            "stage_number": stage.get("stage", idx),
            "week_number": stage.get("week", idx),
            "milestone_title": stage.get("title", f"Stage {idx}"),
            "skill_name": skill_name,
            "priority": stage.get("priority", "mandatory"),
            "estimated_learning_time": stage.get("estimated_time", "2 weeks"),
            "description": stage.get("description", ""),
            "learning_resources": stage.get("learning_resources", []),
            "practical_exercise": stage.get("practical_exercise", stage.get("suggested_project", "")),
            "completion_status": initial_status,
            "is_completed": is_completed,
            "completed_at": completed_at,
            "student_notes": personal_note,
            "evidence_url": None,
            "evidence_notes": None,
            "is_verified": bool(is_completed and skill_key in proficient_skills),
            "verification_type": "Verified Profile Evidence" if is_completed else "Pending Evidence"
        })

    # Overall progress percentage
    total_milestones = len(items)
    progress_percentage = round((completed_count / max(1, total_milestones)) * 100.0, 1)

    # Personalization summary
    student_name = student_data.get("full_name") or "Student"
    personal_guidance = (
        f"Customized 6-stage roadmap for {student_name} targeting {role_profile.get('role_name')}. "
        f"{completed_count} of {total_milestones} milestones match existing competencies. "
        f"Prioritize Stage {next((item['stage_number'] for item in items if not item['is_completed']), 1)} to accelerate placement readiness."
    )

    return {
        "title": f"6-Week Career Roadmap: {role_profile.get('role_name')}",
        "target_role": role_profile.get("role_name"),
        "role_category": role_profile.get("category"),
        "total_weeks": 6,
        "total_milestones": total_milestones,
        "completed_milestones": completed_count,
        "in_progress_milestones": in_progress_count,
        "progress_percentage": progress_percentage,
        "personal_guidance": personal_guidance,
        "items": items,
        "disclaimer": (
            "Evidence-Backed Rigor Notice: Marking milestones complete tracks personal study progress. "
            "Formal skill verification on CareerBridge requires attaching verifiable project code (GitHub) "
            "or clearing an institutional mock interview."
        )
    }

