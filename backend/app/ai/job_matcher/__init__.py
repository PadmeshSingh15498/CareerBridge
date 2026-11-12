"""
Intelligent Job Matching and Recommendation Engine package.
Provides deterministic, multi-dimensional candidate-job alignment,
skill normalization, hard eligibility gating, and semantic cosine similarity.
"""

from app.ai.job_matcher.skill_normalizer import (
    normalize_skill,
    normalize_skill_list,
    are_skills_equivalent,
    SKILL_TAXONOMY,
    SKILL_ALIASES,
)
from app.ai.job_matcher.eligibility_evaluator import (
    evaluate_eligibility,
    EligibilityResult,
    EligibilityStatus,
    normalize_department_name,
)
from app.ai.job_matcher.semantic_engine import (
    SemanticEngine,
    compute_cosine_similarity,
    get_default_semantic_engine,
)
from app.ai.job_matcher.scoring_model import (
    MatchingWeights,
    DEFAULT_MATCHING_WEIGHTS,
    RecommendationCategory,
    classify_recommendation,
)
from app.ai.job_matcher.recommendation_engine import (
    RecommendationEngine,
    JobRecommendationOutput,
)

__all__ = [
    "normalize_skill",
    "normalize_skill_list",
    "are_skills_equivalent",
    "SKILL_TAXONOMY",
    "SKILL_ALIASES",
    "evaluate_eligibility",
    "EligibilityResult",
    "EligibilityStatus",
    "normalize_department_name",
    "SemanticEngine",
    "compute_cosine_similarity",
    "get_default_semantic_engine",
    "MatchingWeights",
    "DEFAULT_MATCHING_WEIGHTS",
    "RecommendationCategory",
    "classify_recommendation",
    "RecommendationEngine",
    "JobRecommendationOutput",
]

