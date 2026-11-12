"""
Core Intelligent Job Recommendation Engine for CareerBridge.
Orchestrates skill normalization, hard eligibility verification, semantic cosine similarity,
project evidence analysis, and career preference matching.
Produces transparent, deterministic, auditable recommendations without LLM dependency.
"""

from typing import Dict, Any, List, Optional, Set, Tuple
from pydantic import BaseModel, Field

from app.ai.job_matcher.skill_normalizer import (
    normalize_skill,
    normalize_skill_list,
    are_skills_equivalent,
)
from app.ai.job_matcher.eligibility_evaluator import (
    evaluate_eligibility,
    EligibilityResult,
    EligibilityStatus,
)
from app.ai.job_matcher.semantic_engine import (
    SemanticEngine,
    get_default_semantic_engine,
)
from app.ai.job_matcher.relevance_scorer import evaluate_project_experience_relevance
from app.ai.job_matcher.preference_matcher import evaluate_career_preferences
from app.ai.job_matcher.scoring_model import (
    MatchingWeights,
    DEFAULT_MATCHING_WEIGHTS,
    RecommendationCategory,
    classify_recommendation,
)


class BreakdownScores(BaseModel):
    required_skills_pct: float
    preferred_skills_pct: float
    semantic_similarity_pct: float
    project_experience_pct: float
    career_preference_pct: float


class JobRecommendationOutput(BaseModel):
    """
    Standard CareerBridge Recommendation Output Schema.
    Strictly adheres to specified requirement format with actual calculated metrics.
    """
    job_id: str
    match_score: int
    eligibility_status: str  # "eligible", "not_eligible", "unknown"
    matched_skills: List[str]
    missing_required_skills: List[str]
    matched_preferred_skills: List[str]
    semantic_similarity: float
    explanation: str

    # Extended Opportunity Radar metadata
    category: str
    is_eligible: bool
    eligibility_reasons: List[str] = Field(default_factory=list)
    breakdown: Optional[BreakdownScores] = None
    recommended_next_steps: List[str] = Field(default_factory=list)
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    location: Optional[str] = None
    workplace_type: Optional[str] = None
    salary_range: Optional[str] = None
    application_deadline: Optional[str] = None


class RecommendationEngine:
    """
    Evaluates students against target job postings using deterministic multi-tier algorithms.
    """

    def __init__(
        self,
        weights: Optional[MatchingWeights] = None,
        semantic_engine: Optional[SemanticEngine] = None
    ):
        self.weights = (weights or DEFAULT_MATCHING_WEIGHTS).normalize()
        self.semantic_engine = semantic_engine or get_default_semantic_engine()

    def evaluate_match(
        self,
        student_data: Dict[str, Any],
        job_data: Dict[str, Any]
    ) -> JobRecommendationOutput:
        """
        Executes complete multi-dimensional candidate evaluation for a specific job requisition.
        """
        job_id = str(job_data.get("id") or job_data.get("job_id") or "unspecified-id")

        # 1. Profile Completeness Check
        student_skills_raw = student_data.get("skills", [])
        student_projects = student_data.get("projects", [])
        has_sufficient_info = bool(student_skills_raw or student_projects)

        # Normalize Student Skills
        student_skills = set(normalize_skill_list(student_skills_raw))

        # Also incorporate skills evidenced in projects and certifications
        for p in student_projects:
            for t in p.get("technologies", []):
                student_skills.add(normalize_skill(str(t)))

        # Normalize Job Skills
        raw_req_skills = job_data.get("required_skills", [])
        raw_pref_skills = job_data.get("preferred_skills", [])

        # Support list of dicts or list of strings
        req_skill_names = [
            (s.get("name") if isinstance(s, dict) else str(s))
            for s in raw_req_skills if s
        ]
        pref_skill_names = [
            (s.get("name") if isinstance(s, dict) else str(s))
            for s in raw_pref_skills if s
        ]

        norm_req_skills = normalize_skill_list(req_skill_names)
        norm_pref_skills = normalize_skill_list(pref_skill_names)

        # 2. Exact & Weighted Skill Matching
        matched_required: List[str] = []
        missing_required: List[str] = []

        for req in norm_req_skills:
            if any(are_skills_equivalent(req, s) for s in student_skills):
                matched_required.append(req)
            else:
                missing_required.append(req)

        matched_preferred: List[str] = []
        for pref in norm_pref_skills:
            if any(are_skills_equivalent(pref, s) for s in student_skills):
                matched_preferred.append(pref)

        # Calculate Skill Scores [0.0, 1.0]
        if norm_req_skills:
            req_skill_score = len(matched_required) / len(norm_req_skills)
        else:
            req_skill_score = 1.0  # If no mandatory skills specified

        if norm_pref_skills:
            pref_skill_score = len(matched_preferred) / len(norm_pref_skills)
        else:
            pref_skill_score = 0.8  # Neutral if no preferred skills specified

        # 3. Semantic Cosine Similarity
        semantic_sim = self.semantic_engine.evaluate_student_job_similarity(
            student_data=student_data,
            job_data=job_data
        )
        semantic_sim = round(float(semantic_sim), 4)

        # 4. Project & Experience Evidence Scoring
        project_exp_score = evaluate_project_experience_relevance(
            student_data=student_data,
            job_data=job_data
        )

        # 5. Career Preferences Scoring
        career_pref_score = evaluate_career_preferences(
            student_data=student_data,
            job_data=job_data
        )

        # 6. Hard Eligibility Verification (Evaluated separately from match score)
        elig_result: EligibilityResult = evaluate_eligibility(
            student_profile=student_data,
            job_eligibility=job_data.get("eligibility")
        )

        # 7. Composite Match Calculation
        w = self.weights
        composite = (
            (w.required_skills * req_skill_score)
            + (w.semantic_similarity * semantic_sim)
            + (w.project_experience * project_exp_score)
            + (w.preferred_skills * pref_skill_score)
            + (w.career_preference * career_pref_score)
        )

        # Final calculated match score [0, 100]
        match_score = int(round(max(0.0, min(100.0, composite * 100.0))))

        # 8. Recommendation Categorization
        category = classify_recommendation(
            match_score=match_score,
            eligibility_status=elig_result.status,
            has_sufficient_profile_info=has_sufficient_info
        )

        # 9. Dynamic Explanation & Recommended Next Steps Generation
        explanation, next_steps = self._generate_explanation_and_steps(
            match_score=match_score,
            category=category,
            elig_result=elig_result,
            matched_required=matched_required,
            missing_required=missing_required,
            matched_preferred=matched_preferred,
            semantic_sim=semantic_sim,
            project_exp_score=project_exp_score,
            job_title=job_data.get("title", "Role")
        )

        # Build Job Metadata
        salary_str = None
        s_min = job_data.get("salary_min")
        s_max = job_data.get("salary_max")
        if s_min and s_max:
            salary_str = f"₹{s_min:,.0f} - ₹{s_max:,.0f}"
        elif s_min:
            salary_str = f"From ₹{s_min:,.0f}"

        return JobRecommendationOutput(
            job_id=job_id,
            match_score=match_score,
            eligibility_status=elig_result.status.value,
            matched_skills=matched_required,
            missing_required_skills=missing_required,
            matched_preferred_skills=matched_preferred,
            semantic_similarity=semantic_sim,
            explanation=explanation,
            category=category.value,
            is_eligible=elig_result.is_eligible,
            eligibility_reasons=elig_result.failed_reasons or elig_result.unknown_checks,
            breakdown=BreakdownScores(
                required_skills_pct=round(req_skill_score * 100, 1),
                preferred_skills_pct=round(pref_skill_score * 100, 1),
                semantic_similarity_pct=round(semantic_sim * 100, 1),
                project_experience_pct=round(project_exp_score * 100, 1),
                career_preference_pct=round(career_pref_score * 100, 1),
            ),
            recommended_next_steps=next_steps,
            job_title=job_data.get("title"),
            company_name=job_data.get("company_name"),
            location=job_data.get("location"),
            workplace_type=job_data.get("workplace_type"),
            salary_range=salary_str,
            application_deadline=str(job_data.get("application_deadline") or "")
        )

    def _generate_explanation_and_steps(
        self,
        match_score: int,
        category: RecommendationCategory,
        elig_result: EligibilityResult,
        matched_required: List[str],
        missing_required: List[str],
        matched_preferred: List[str],
        semantic_sim: float,
        project_exp_score: float,
        job_title: str
    ) -> Tuple[str, List[str]]:
        """
        Synthesizes objective, personalized explanation grounded in calculated signals.
        """
        explanation_parts = []
        next_steps = []

        # Eligibility note
        if elig_result.status == EligibilityStatus.NOT_ELIGIBLE:
            reasons_str = "; ".join(elig_result.failed_reasons)
            explanation_parts.append(f"Not Eligible: {reasons_str}.")
            next_steps.append("Review campus placement criteria or explore requisitions without strict branch/CGPA gating.")
        elif elig_result.status == EligibilityStatus.UNKNOWN:
            unknown_str = "; ".join(elig_result.unknown_checks)
            explanation_parts.append(f"Eligibility verification pending: {unknown_str}.")
            next_steps.append("Complete missing academic details (CGPA, active backlogs, department) in your profile.")

        # Skill alignment note
        if matched_required:
            skills_str = ", ".join(matched_required[:4])
            explanation_parts.append(f"Strong technical alignment in mandatory stack ({skills_str}).")
        else:
            explanation_parts.append("Few or no required technical competencies currently matched.")

        if missing_required:
            missing_str = ", ".join(missing_required[:3])
            explanation_parts.append(f"Key missing skills for this role: {missing_str}.")
            next_steps.append(f"Acquire foundation in {missing_required[0]} through coursework or capstone implementation.")

        # Evidence note
        if project_exp_score >= 0.6:
            explanation_parts.append("Candidate projects demonstrate strong practical application of target tools.")
        elif project_exp_score < 0.3:
            next_steps.append(f"Build a dedicated project featuring {missing_required[0] if missing_required else job_title} technologies.")

        # Preferred skills note
        if matched_preferred:
            explanation_parts.append(f"Additional advantage in preferred competencies ({', '.join(matched_preferred[:3])}).")

        # Semantic note
        if semantic_sim >= 0.75:
            explanation_parts.append(f"High semantic similarity ({int(semantic_sim * 100)}%) between your portfolio and requisition responsibilities.")

        if not next_steps:
            next_steps.append("Review company interview stages and prepare targeted questions for the recruiter.")

        explanation = " ".join(explanation_parts)
        return explanation, next_steps
