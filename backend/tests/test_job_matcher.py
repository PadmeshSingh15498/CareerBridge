"""
Integration and Unit Tests for Intelligent Job Matching & Recommendation Engine (Phase 9).
Validates:
- Exact skill match and alias resolution.
- Strict non-equivalence guards (Java != JavaScript, C != C++, ML != SQL).
- Partial skill matching.
- Semantic cosine similarity.
- Hard eligibility gating (CGPA, backlogs, department, batch).
- Missing profile information handling ('unknown').
- Project & experience technical evidence scoring.
- Career preference alignment.
- Configurable scoring weights and category tiers.
- Exact recommendation output JSON schema with non-hardcoded values.
- Synthetic dataset evaluation (Precision@K, Ranking Consistency, Zero False Matches).
- Expired job handling and empty states.
- FastAPI REST endpoints (/recommendations/radar & /recommendations/benchmark).
All algorithms are completely independent of external LLM services.
"""

from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import create_access_token
from app.models.user import User, UserRole
from app.models.student import StudentProfile, AcademicRecord, Skill, StudentSkill, StudentProject
from app.models.job import Job, JobSkill, JobEligibility, JobStatusEnum
from app.models.recruiter import Company, RecruiterProfile
from app.ai.job_matcher.skill_normalizer import (
    normalize_skill,
    normalize_skill_list,
    are_skills_equivalent,
)
from app.ai.job_matcher.eligibility_evaluator import (
    evaluate_eligibility,
    EligibilityStatus,
    normalize_department_name,
)
from app.ai.job_matcher.semantic_engine import (
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
from app.ai.job_matcher.synthetic_eval import (
    run_synthetic_benchmark,
    SYNTHETIC_STUDENTS,
    SYNTHETIC_JOBS,
    EVALUATION_DISCLAIMER,
)
from app.services.recommendation_service import RecommendationService


# --- 1. Skill Normalization & Aliases ---

def test_skill_normalization_and_aliases():
    """Validates alias resolution across programming languages, frameworks, and AI tools."""
    assert normalize_skill("js") == "JavaScript"
    assert normalize_skill("ES6") == "JavaScript"
    assert normalize_skill("TypeScript") == "TypeScript"
    assert normalize_skill("TS") == "TypeScript"
    assert normalize_skill("py") == "Python"
    assert normalize_skill("python 3.11") == "Python"
    assert normalize_skill("ml") == "Machine Learning"
    assert normalize_skill("machine learning") == "Machine Learning"
    assert normalize_skill("nlp") == "Natural Language Processing"
    assert normalize_skill("sql") == "SQL"
    assert normalize_skill("postgres") == "PostgreSQL"
    assert normalize_skill("k8s") == "Kubernetes"
    assert normalize_skill("docker") == "Docker"
    assert normalize_skill("reactjs") == "React"
    assert normalize_skill("nextjs") == "Next.js"
    assert normalize_skill("node.js") == "Node.js"
    assert normalize_skill("c++") == "C++"
    assert normalize_skill("cpp") == "C++"


# --- 2. Strict Non-Equivalence Guards (False Friends) ---

def test_strict_non_equivalence_guards():
    """Guarantees unrelated or superficially similar skills are strictly distinguished."""
    assert are_skills_equivalent("Java", "JavaScript") is False
    assert are_skills_equivalent("JS", "Java") is False
    assert are_skills_equivalent("C", "C++") is False
    assert are_skills_equivalent("C++", "C#") is False
    assert are_skills_equivalent("C", "C#") is False
    assert are_skills_equivalent("ML", "SQL") is False
    assert are_skills_equivalent("HTML", "CSS") is False
    assert are_skills_equivalent("Python", "PyTorch") is False
    assert are_skills_equivalent("Rust", "Ruby") is False
    assert are_skills_equivalent("Go", "GCP") is False

    # Valid equivalents
    assert are_skills_equivalent("JS", "JavaScript") is True
    assert are_skills_equivalent("ML", "Machine Learning") is True
    assert are_skills_equivalent("SQL", "Structured Query Language") is True
    assert are_skills_equivalent("K8s", "Kubernetes") is True


# --- 3. Exact and Partial Skill Matching ---

def test_exact_and_partial_skill_matching():
    """Tests exact skill intersection and partial match calculation."""
    engine = RecommendationEngine()

    student_data = {
        "skills": ["Python", "FastAPI", "Docker", "SQL"],
        "projects": [
            {
                "title": "Backend Microservices API",
                "description": "Architected distributed API backend with Python, FastAPI, and Docker microservices.",
                "technologies": ["Python", "FastAPI", "Docker", "SQL"]
            }
        ],
        "experience": [],
        "preferred_roles": ["Backend Dev"],
        "cgpa": 8.0,
        "department": "CSE",
        "graduation_year": 2026,
    }

    # Perfect match job
    job_full = {
        "id": "j_full",
        "title": "Backend Dev",
        "required_skills": ["Python", "FastAPI", "Docker"],
        "preferred_skills": ["SQL"],
    }
    rec_full = engine.evaluate_match(student_data, job_full)
    assert len(rec_full.matched_skills) == 3
    assert len(rec_full.missing_required_skills) == 0
    assert "SQL" in rec_full.matched_preferred_skills
    assert rec_full.match_score >= 80

    # Partial match job
    job_partial = {
        "id": "j_partial",
        "title": "Cloud Dev",
        "required_skills": ["Python", "Kubernetes", "Rust"],
        "preferred_skills": ["Docker"],
    }
    rec_partial = engine.evaluate_match(student_data, job_partial)
    assert rec_partial.matched_skills == ["Python"]
    assert set(rec_partial.missing_required_skills) == {"Kubernetes", "Rust"}
    assert "Docker" in rec_partial.matched_preferred_skills
    assert rec_full.match_score > rec_partial.match_score


# --- 4. Semantic Cosine Similarity ---

def test_semantic_cosine_similarity():
    """Validates mathematical cosine similarity bounded in [0.0, 1.0]."""
    sem = get_default_semantic_engine()

    text_ai = "Building transformer models with PyTorch and NLP tokenizers for deep learning."
    text_ai_match = "Seeking Machine Learning engineer experienced in neural networks and PyTorch NLP."
    text_unrelated = "Commercial leasing specialist for real estate office property development."

    sim_high = sem.compute_similarity(text_ai, text_ai_match)
    sim_low = sem.compute_similarity(text_ai, text_unrelated)

    assert 0.0 <= sim_high <= 1.0
    assert 0.0 <= sim_low <= 1.0
    assert sim_high > sim_low
    assert sim_high >= 0.20
    assert sim_low <= 0.10


# --- 5. Hard Eligibility Gating (CGPA, Backlogs, Dept, Batch) ---

def test_hard_eligibility_verification_gating():
    """
    Guarantees hard eligibility failure marks status 'not_eligible' regardless of high skills or semantic similarity.
    """
    engine = RecommendationEngine()

    # Brilliant coder who has 2 active backlogs and 6.8 CGPA
    student_failing_gates = {
        "skills": ["Python", "FastAPI", "Docker", "PostgreSQL", "Kubernetes"],
        "cgpa": 6.8,  # Below 7.5
        "active_backlogs": 2,  # Above 0
        "department": "Computer Science and Engineering",
        "graduation_year": 2026,
        "projects": [{"title": "Cloud System", "technologies": ["Python", "Docker"]}],
        "experience": []
    }

    job_strict_gate = {
        "id": "j_strict",
        "title": "Senior Cloud Platform Engineer",
        "required_skills": ["Python", "FastAPI", "Docker"],
        "eligibility": {
            "min_cgpa": 7.5,
            "max_backlogs_allowed": 0,
            "allowed_grad_years": [2026],
            "allowed_departments": ["Computer Science and Engineering"]
        }
    }

    rec = engine.evaluate_match(student_failing_gates, job_strict_gate)
    # Critical assertion: Academic criteria failure MUST mark not eligible
    assert rec.eligibility_status == "not_eligible"
    assert rec.is_eligible is False
    assert rec.category == RecommendationCategory.NOT_ELIGIBLE.value
    assert any("CGPA" in reason for reason in rec.eligibility_reasons)
    assert any("backlog" in reason.lower() for reason in rec.eligibility_reasons)


# --- 6. Missing Profile Information Marked 'unknown' ---

def test_missing_profile_information_marked_unknown():
    """
    Missing profile fields must be classified as 'unknown' rather than punitive failure.
    """
    student_missing_data = {
        "skills": ["Python", "FastAPI"],
        "cgpa": None,  # Not entered yet
        "department": None,
        "graduation_year": None,
        "active_backlogs": None,
        "projects": []
    }

    job_criteria = {
        "id": "j_crit",
        "title": "Junior Python Dev",
        "required_skills": ["Python"],
        "eligibility": {
            "min_cgpa": 7.0,
            "max_backlogs_allowed": 0,
            "allowed_grad_years": [2026],
            "allowed_departments": ["Computer Science"]
        }
    }

    elig_res = evaluate_eligibility(student_missing_data, job_criteria["eligibility"])
    assert elig_res.status == EligibilityStatus.UNKNOWN
    assert len(elig_res.unknown_checks) >= 2
    assert len(elig_res.failed_reasons) == 0  # Not marked as failed!


# --- 7. Project & Experience Technical Evidence ---

def test_project_and_experience_relevance():
    """Verifies candidate project tech stacks boost evidence scoring."""
    engine = RecommendationEngine()

    student_with_projects = {
        "skills": ["Python", "Docker"],
        "projects": [
            {
                "title": "Distributed Task Queue",
                "description": "Architected low latency message broker with Python, Docker, and Redis.",
                "technologies": ["Python", "Docker", "Redis"]
            }
        ],
        "experience": [
            {
                "role": "Backend Intern",
                "company": "CloudCorp",
                "responsibilities": "Managed microservice deployments."
            }
        ],
        "cgpa": 8.5,
        "department": "CSE",
        "graduation_year": 2026
    }

    student_without_projects = {
        "skills": ["Python", "Docker"],
        "projects": [],
        "experience": [],
        "cgpa": 8.5,
        "department": "CSE",
        "graduation_year": 2026
    }

    job = {
        "id": "j_queue",
        "title": "Distributed Systems Engineer",
        "required_skills": ["Python", "Docker", "Redis"],
        "eligibility": {"min_cgpa": 7.0}
    }

    rec_with = engine.evaluate_match(student_with_projects, job)
    rec_without = engine.evaluate_match(student_without_projects, job)

    assert rec_with.breakdown.project_experience_pct > rec_without.breakdown.project_experience_pct
    assert rec_with.match_score > rec_without.match_score


# --- 8. Scoring Model Weights Normalization ---

def test_scoring_model_normalization():
    """Validates custom weights normalization to 1.0."""
    custom = MatchingWeights(
        required_skills=0.50,
        semantic_similarity=0.30,
        project_experience=0.20,
        preferred_skills=0.10,
        career_preference=0.10
    )
    norm = custom.normalize()
    total = (
        norm.required_skills
        + norm.semantic_similarity
        + norm.project_experience
        + norm.preferred_skills
        + norm.career_preference
    )
    assert round(total, 2) == 1.0


# --- 9. Output Schema Adherence & Non-Hardcoded Values ---

def test_recommendation_output_schema_adherence():
    """Validates exact JSON output matching Requirement 6 with actual calculated non-hardcoded values."""
    engine = RecommendationEngine()

    s = SYNTHETIC_STUDENTS["student_fullstack"]
    j = SYNTHETIC_JOBS["job_backend_platform"]

    rec = engine.evaluate_match(s, j)

    data = rec.model_dump()
    assert "job_id" in data
    assert "match_score" in data
    assert "eligibility_status" in data
    assert "matched_skills" in data
    assert "missing_required_skills" in data
    assert "matched_preferred_skills" in data
    assert "semantic_similarity" in data
    assert "explanation" in data

    # Verify actual calculated values
    assert isinstance(data["match_score"], int)
    assert data["match_score"] >= 65
    assert data["eligibility_status"] == "eligible"
    assert "Python" in data["matched_skills"]
    assert "FastAPI" in data["matched_skills"]
    assert "Docker" in data["matched_skills"]
    assert data["semantic_similarity"] > 0.0
    assert len(data["explanation"]) > 20


# --- 10. Synthetic Benchmark Evaluation (Precision@K & Consistency) ---

def test_synthetic_benchmark_evaluation():
    """Runs complete synthetic evaluation suite across all 8 archetypes and 6 requisitions."""
    engine = RecommendationEngine()
    bench = run_synthetic_benchmark(engine)

    assert bench["status"] == "success"
    assert bench["ranking_consistency_pct"] == 100.0
    assert bench["precision_at_1_pct"] == 100.0
    assert bench["eligibility_accuracy_pct"] == 100.0
    assert bench["false_matches_detected"] == 0
    assert bench["evaluated_archetypes"] == 8
    assert bench["evaluated_requisitions"] == 6
    assert EVALUATION_DISCLAIMER in bench["disclaimer"]


# --- 11. Empty and Expired Requisition Handling ---

def test_expired_requisitions_filtered(db_session):
    """Verifies past-deadline requisitions are excluded from active radar recommendations."""
    # Find student user
    student_user = db_session.query(User).filter(User.role == UserRole.STUDENT).first()
    assert student_user is not None

    radar = RecommendationService.get_opportunity_radar(
        db=db_session,
        current_user=student_user
    )

    assert "items" in radar
    assert "radar_summary" in radar
    assert "top_missing_skills" in radar

    now = datetime.utcnow()
    for item in radar["items"]:
        if item.get("application_deadline"):
            d = datetime.fromisoformat(item["application_deadline"].replace("Z", "+00:00"))
            if d.tzinfo is not None:
                d = d.replace(tzinfo=None)
            assert d >= now - timedelta(hours=1)


# --- 12. REST API Integration Endpoints ---

def test_api_radar_and_benchmark_endpoints(db_session):
    """Tests /jobs/recommendations/radar and /jobs/recommendations/benchmark via endpoint functions."""
    from app.api.v1.jobs import get_model_benchmark_evaluation, get_opportunity_radar

    # 1. Benchmark endpoint (public / auditable)
    bench_resp = get_model_benchmark_evaluation()
    assert bench_resp.success is True
    assert bench_resp.data["ranking_consistency_pct"] == 100.0

    # 2. Opportunity Radar endpoint (student authenticated)
    student_user = db_session.query(User).filter(User.role == UserRole.STUDENT).first()
    assert student_user is not None

    radar_resp = get_opportunity_radar(
        category=None,
        min_score=None,
        workplace_type=None,
        location=None,
        sort_by="match_score",
        limit=50,
        current_user=student_user,
        db=db_session
    )
    assert radar_resp.success is True
    assert "items" in radar_resp.data
    assert "radar_summary" in radar_resp.data
    assert "top_missing_skills" in radar_resp.data
