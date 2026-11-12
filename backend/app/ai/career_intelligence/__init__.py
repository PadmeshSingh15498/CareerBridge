"""
CareerBridge AI Career Intelligence & Roadmaps Engine.
"""

from app.ai.career_intelligence.curated_roles import (
    CURATED_TARGET_ROLES,
    get_curated_target_role,
    generate_custom_role_profile,
    PLATFORM_REQUIREMENT_DISCLAIMER
)
from app.ai.career_intelligence.skill_gap_analyzer import (
    evaluate_skill_gap
)
from app.ai.career_intelligence.roadmap_generator import (
    generate_personalized_roadmap
)
from app.ai.career_intelligence.career_readiness_index import (
    compute_career_readiness_index,
    CRIWeights,
    DEFAULT_CRI_WEIGHTS
)

__all__ = [
    "CURATED_TARGET_ROLES",
    "get_curated_target_role",
    "generate_custom_role_profile",
    "PLATFORM_REQUIREMENT_DISCLAIMER",
    "evaluate_skill_gap",
    "generate_personalized_roadmap",
    "compute_career_readiness_index",
    "CRIWeights",
    "DEFAULT_CRI_WEIGHTS",
]

