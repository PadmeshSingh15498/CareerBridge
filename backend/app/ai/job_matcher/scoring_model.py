"""
Configurable Scoring Model and Categorization for CareerBridge Job Matcher.
Enforces mathematical weight normalization and categorizes recommendation tiers.
"""

import enum
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from app.ai.job_matcher.eligibility_evaluator import EligibilityStatus


class RecommendationCategory(str, enum.Enum):
    EXCELLENT_MATCH = "Excellent Match"
    GOOD_MATCH = "Good Match"
    SKILL_DEVELOPMENT_NEEDED = "Skill Development Needed"
    NOT_ELIGIBLE = "Not Eligible"
    INSUFFICIENT_PROFILE_INFO = "Insufficient Profile Information"


class MatchingWeights(BaseModel):
    """
    Configurable weights model for composite job matching.
    Default weights:
        - Required skills match: 40% (0.40)
        - Semantic similarity: 25% (0.25)
        - Relevant project and experience match: 15% (0.15)
        - Preferred skills match: 10% (0.10)
        - Career preferences match: 10% (0.10)
    """
    required_skills: float = Field(default=0.40, ge=0.0, le=1.0)
    semantic_similarity: float = Field(default=0.25, ge=0.0, le=1.0)
    project_experience: float = Field(default=0.15, ge=0.0, le=1.0)
    preferred_skills: float = Field(default=0.10, ge=0.0, le=1.0)
    career_preference: float = Field(default=0.10, ge=0.0, le=1.0)

    def normalize(self) -> "MatchingWeights":
        """Normalizes all components so their exact sum equals 1.0."""
        total = (
            self.required_skills
            + self.semantic_similarity
            + self.project_experience
            + self.preferred_skills
            + self.career_preference
        )
        if total <= 0:
            return DEFAULT_MATCHING_WEIGHTS

        return MatchingWeights(
            required_skills=round(self.required_skills / total, 4),
            semantic_similarity=round(self.semantic_similarity / total, 4),
            project_experience=round(self.project_experience / total, 4),
            preferred_skills=round(self.preferred_skills / total, 4),
            career_preference=round(self.career_preference / total, 4),
        )


DEFAULT_MATCHING_WEIGHTS = MatchingWeights()


def classify_recommendation(
    match_score: int,
    eligibility_status: EligibilityStatus,
    has_sufficient_profile_info: bool = True
) -> RecommendationCategory:
    """
    Categorizes job recommendation according to business rules:
    - If hard requirement fails -> Not Eligible
    - If critical student profile info is missing -> Insufficient Profile Information
    - If score >= 80 -> Excellent Match
    - If score >= 60 -> Good Match
    - If score < 60 -> Skill Development Needed
    """
    if eligibility_status == EligibilityStatus.NOT_ELIGIBLE:
        return RecommendationCategory.NOT_ELIGIBLE

    if not has_sufficient_profile_info:
        return RecommendationCategory.INSUFFICIENT_PROFILE_INFO

    if match_score >= 80:
        return RecommendationCategory.EXCELLENT_MATCH
    elif match_score >= 60:
        return RecommendationCategory.GOOD_MATCH
    else:
        return RecommendationCategory.SKILL_DEVELOPMENT_NEEDED

