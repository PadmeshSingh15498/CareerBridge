"""
Comprehensive Unit & Integration Test Suite for Phase 10:
AI Skill Gap Analyzer, Personalized Career Roadmaps, and Career Readiness Index (CRI).
"""

import pytest
from datetime import datetime
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.user import User, UserRole
from app.models.student import (
    StudentProfile, AcademicRecord, StudentSkill, Skill, SkillCategoryEnum,
    ProficiencyLevelEnum, StudentProject, StudentCertification, StudentExperience
)
from app.models.resume import Resume, ResumeAnalysis
from app.models.ai import (
    SkillGapAnalysis, CareerRoadmap, RoadmapItem, RoadmapStatusEnum,
    TargetRoleRequirement, CareerReadinessHistory
)
from app.ai.career_intelligence import (
    CURATED_TARGET_ROLES,
    get_curated_target_role,
    generate_custom_role_profile,
    evaluate_skill_gap,
    generate_personalized_roadmap,
    compute_career_readiness_index,
    CRIWeights
)
from app.services.career_intelligence_service import CareerIntelligenceService


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_client(db_session):
    from app.core.database import get_db
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def student_auth_headers(db_session):
    student_user = db_session.query(User).filter(User.role == UserRole.STUDENT).first()
    if not student_user:
        student_user = User(
            email="test_student_p10@careerbridge.com",
            hashed_password="hash",
            full_name="Aditya Test",
            role=UserRole.STUDENT,
            is_active=True
        )
        db_session.add(student_user)
        db_session.commit()
        db_session.refresh(student_user)

    token = create_access_token(subject=student_user.id, role=student_user.role.value)
    return {"Authorization": f"Bearer {token}"}


# =====================================================================
# 1. CURATED ROLES & TAXONOMY TESTS
# =====================================================================

def test_all_9_curated_roles_defined_with_rich_structure():
    """Verifies all 9 mandatory target roles exist with complete 6-stage curricula."""
    expected_roles = [
        "Software Developer",
        "Java Developer",
        "Python Developer",
        "Data Analyst",
        "Data Scientist",
        "Machine Learning Engineer",
        "AI Engineer",
        "Web Developer",
        "Full Stack Developer"
    ]
    
    for role_name in expected_roles:
        role = get_curated_target_role(role_name)
        assert role is not None, f"Role {role_name} should be curated."
        assert len(role["core_skills"]) >= 4, f"{role_name} must have at least 4 core skills."
        assert len(role["curated_stages"]) == 6, f"{role_name} must have exactly 6 structured stages."
        
        # Verify every stage has valid structure
        for stage in role["curated_stages"]:
            assert "stage" in stage
            assert "title" in stage
            assert "skill" in stage
            assert "priority" in stage
            assert "estimated_time" in stage
            assert "description" in stage
            assert "learning_resources" in stage
            assert len(stage["learning_resources"]) >= 1
            for res in stage["learning_resources"]:
                assert res["url"].startswith("http")
            assert "practical_exercise" in stage and len(stage["practical_exercise"]) > 10


def test_custom_target_role_algorithmic_synthesis():
    """Tests creating a bespoke target role with automatic 6-stage curriculum."""
    custom_role = generate_custom_role_profile(
        role_name="Cloud Platform Architect",
        requested_skills=["AWS", "Terraform", "Kubernetes", "Linux", "Docker", "Python", "CI/CD"]
    )
    
    assert custom_role["role_name"] == "Cloud Platform Architect"
    assert custom_role["is_curated"] is False
    assert len(custom_role["core_skills"]) >= 5
    assert len(custom_role["curated_stages"]) == 6
    assert any("Kubernetes" in s["skill"] or "AWS" in s["skill"] for s in custom_role["curated_stages"])


# =====================================================================
# 2. SKILL GAP EVALUATION TESTS
# =====================================================================

def test_skill_gap_categorization_and_weights():
    """
    Tests skill gap analyzer with multiple student competency levels
    verifying Already Proficient, Needs Improvement, Not Yet Learned, and Unknown.
    """
    role = get_curated_target_role("Machine Learning Engineer")
    
    # 1. Beginner profile: knows Python only
    beginner_student = {
        "full_name": "Beginner Student",
        "skills": [
            {"name": "Python", "proficiency_level": "beginner", "is_verified": False}
        ],
        "projects": [],
        "academic": {"cgpa": 7.0, "backlogs_count": 0}
    }
    gap_beginner = evaluate_skill_gap(beginner_student, role)
    assert gap_beginner["readiness_percentage"] < 35.0
    assert len(gap_beginner["critical_missing_skills"]) >= 3
    # Python is beginner, but MLE requires advanced -> needs_improvement
    assert any(s["skill_name"] == "Python" for s in gap_beginner["needs_improvement_skills"])
    # Machine Learning is not present -> not_yet_learned
    assert any(s["skill_name"] == "Machine Learning" for s in gap_beginner["not_yet_learned_skills"])

    # 2. Advanced profile: knows Python, ML, PyTorch, Docker, FastAPI
    advanced_student = {
        "full_name": "Advanced Student",
        "skills": [
            {"name": "Python", "proficiency_level": "advanced", "is_verified": True},
            {"name": "Machine Learning", "proficiency_level": "advanced", "is_verified": True},
            {"name": "Deep Learning", "proficiency_level": "intermediate", "is_verified": True},
            {"name": "PyTorch", "proficiency_level": "intermediate", "is_verified": True},
            {"name": "Docker", "proficiency_level": "intermediate", "is_verified": True},
            {"name": "FastAPI", "proficiency_level": "intermediate", "is_verified": True},
        ],
        "projects": [
            {"title": "Vision AI", "technologies_used": ["Python", "PyTorch", "Docker"], "github_url": "https://github.com/test"}
        ],
        "academic": {"cgpa": 9.2, "backlogs_count": 0}
    }
    gap_advanced = evaluate_skill_gap(advanced_student, role)
    assert gap_advanced["readiness_percentage"] >= 75.0
    assert len(gap_advanced["already_proficient_skills"]) >= 4
    assert len(gap_advanced["critical_missing_skills"]) < len(gap_beginner["critical_missing_skills"])


def test_constellation_nodes_generation():
    """Verifies constellation nodes formatting for frontend visualization."""
    role = get_curated_target_role("Full Stack Developer")
    student = {
        "skills": [
            {"name": "JavaScript", "proficiency_level": "advanced", "is_verified": True},
            {"name": "React", "proficiency_level": "advanced", "is_verified": True},
            {"name": "Python", "proficiency_level": "intermediate", "is_verified": True}
        ],
        "projects": []
    }
    gap = evaluate_skill_gap(student, role)
    nodes = gap["constellation_nodes"]
    assert len(nodes) >= 6
    for node in nodes:
        assert "name" in node
        assert "category" in node
        assert node["category"] in ["languages", "backend", "cloud", "data_ai", "fundamentals", "tools"]
        assert "status" in node
        assert node["status"] in ["already_proficient", "needs_improvement", "not_yet_learned", "unknown_proficiency"]
        assert "frequency" in node


# =====================================================================
# 3. CAREER ROADMAP GENERATION & PROGRESS TRACKING TESTS
# =====================================================================

def test_personalized_roadmap_milestones_and_acceleration():
    """Tests roadmap generator personalizes based on existing skills."""
    student = {
        "full_name": "Aditya Sharma",
        "skills": [
            {"name": "Python", "proficiency_level": "advanced", "is_verified": True},
            {"name": "FastAPI", "proficiency_level": "intermediate", "is_verified": True}
        ],
        "projects": []
    }
    roadmap = generate_personalized_roadmap(student, "Python Developer")
    assert roadmap["total_weeks"] == 6
    assert len(roadmap["items"]) == 6
    
    # Milestone 1 is Python -> student is advanced -> initial status is completed
    m1 = roadmap["items"][0]
    assert m1["skill_name"] == "Python"
    assert m1["completion_status"] == "completed"
    assert m1["is_completed"] is True
    
    # Later milestones (e.g. Docker / Redis) not completed
    m_unlearned = [i for i in roadmap["items"] if not i["is_completed"]]
    assert len(m_unlearned) >= 2


def test_milestone_evidence_and_anti_cheat_rigor(db_session):
    """
    Tests milestone progress update enforcing evidence:
    clicking complete tracks progress; submitting repo/demo URL attaches verification.
    """
    student = db_session.query(StudentProfile).first()
    assert student is not None, "A student profile must exist in test database."
    
    # Generate roadmap in DB
    roadmap_dict = CareerIntelligenceService.generate_or_get_roadmap(
        db_session, student.id, "Web Developer", force_regenerate=True
    )
    items = roadmap_dict["items"]
    target_item = items[0]
    
    # 1. Update notes and mark in_progress
    updated_1 = CareerIntelligenceService.update_milestone_progress(
        db=db_session,
        student_id=student.id,
        item_id=target_item["id"],
        status="in_progress",
        notes="Reviewed MDN Flexbox and CSS Grid patterns."
    )
    refreshed_item = next(i for i in updated_1["items"] if i["id"] == target_item["id"])
    assert refreshed_item["completion_status"] == "in_progress"
    assert "MDN Flexbox" in refreshed_item["student_notes"]
    assert refreshed_item["is_verified"] is False
    
    # 2. Submit project evidence URL
    updated_2 = CareerIntelligenceService.update_milestone_progress(
        db=db_session,
        student_id=student.id,
        item_id=target_item["id"],
        status="completed",
        evidence_url="https://github.com/student/accessible-landing-page",
        evidence_notes="Built dark/light mode landing page scoring 100 on accessibility.",
        is_completed=True
    )
    verified_item = next(i for i in updated_2["items"] if i["id"] == target_item["id"])
    assert verified_item["is_completed"] is True
    assert verified_item["completion_status"] == "completed"
    assert verified_item["is_verified"] is True
    assert verified_item["verification_type"] == "Evidence Verified"
    assert verified_item["evidence_url"] == "https://github.com/student/accessible-landing-page"


# =====================================================================
# 4. CAREER READINESS INDEX (CRI) 6-PILLAR TESTS
# =====================================================================

def test_cri_formula_and_weights_sum_to_one():
    """Validates the 6 configured CRI weights strictly equal 1.0."""
    weights = CRIWeights()
    weights.validate_sum()
    assert weights.technical_skills == 0.30
    assert weights.projects == 0.20
    assert weights.resume_quality == 0.15
    assert weights.academic_eligibility == 0.15
    assert weights.interview_preparation == 0.10
    assert weights.certifications_experience == 0.10


def test_cri_handling_missing_information_and_opportunities():
    """
    Tests CRI computation when key dimensions are missing:
    verifies explicit missing data notices and dynamic ROI improvement actions.
    """
    empty_student = {
        "skills": [],
        "projects": [],
        "resume_analysis": None,
        "academic": None,
        "interview_sessions": [],
        "certifications": [],
        "experiences": []
    }
    cri_empty = compute_career_readiness_index(empty_student)
    assert cri_empty["overall_score"] <= 20.0
    assert cri_empty["tier"] == "Foundational Development"
    assert len(cri_empty["missing_data"]) >= 4
    
    # Check that missing data mentions mock interviews and projects
    missing_categories = [m["category"] for m in cri_empty["missing_data"]]
    assert "Technical Skills" in missing_categories
    assert "Projects" in missing_categories
    assert "Resume Quality" in missing_categories
    assert "Interview Preparation" in missing_categories
    
    # Improvement opportunities sorted by highest gain
    opps = cri_empty["improvement_opportunities"]
    assert len(opps) >= 3
    assert opps[0]["potential_gain"] >= opps[1]["potential_gain"]


def test_cri_persistence_and_snapshot_history(db_session):
    """Tests calculating CRI for actual student in DB and recording snapshot history."""
    student = db_session.query(StudentProfile).first()
    assert student is not None
    
    cri = CareerIntelligenceService.calculate_and_record_readiness(
        db=db_session,
        student_id=student.id,
        save_snapshot=True
    )
    assert 10.0 <= cri["overall_score"] <= 100.0
    assert "category_scores" in cri
    assert "formula" in cri
    
    # Retrieve history
    history = CareerIntelligenceService.get_readiness_history(db_session, student.id, limit=5)
    assert len(history) >= 1
    latest_hist = history[0]
    assert latest_hist["overall_score"] == cri["overall_score"]


# =====================================================================
# 5. REST API ROUTER INTEGRATION TESTS
# =====================================================================

def test_api_list_roles_and_detail(db_session):
    """Tests GET /api/v1/career-intelligence/roles and detail via router function."""
    from app.api.v1.career_intelligence import list_target_roles, get_target_role_detail
    res = list_target_roles(category=None, db=db_session)
    assert res.success is True
    assert len(res.data) >= 9

    # Detail
    detail_res = get_target_role_detail(role_name="Java Developer", db=db_session)
    assert detail_res.success is True
    assert detail_res.data["role_name"] == "Java Developer"
    assert len(detail_res.data["curated_stages"]) == 6


def test_api_skill_gap_analysis(db_session, student_auth_headers):
    """Tests POST /api/v1/career-intelligence/skill-gap/analyze via router function."""
    from app.api.v1.career_intelligence import analyze_skill_gap, SkillGapRequest
    student_user = db_session.query(User).filter(User.role == UserRole.STUDENT).first()
    assert student_user is not None

    req = SkillGapRequest(target_role="Python Developer")
    res = analyze_skill_gap(payload=req, current_user=student_user, db=db_session)
    assert res.success is True
    assert res.data["target_role"] == "Python Developer"
    assert "readiness_percentage" in res.data
    assert "constellation_nodes" in res.data


def test_api_roadmap_generation_and_item_patch(db_session):
    """Tests POST generate roadmap and PATCH milestone item via router functions."""
    from app.api.v1.career_intelligence import generate_roadmap, update_milestone_item, RoadmapGenerateRequest, MilestoneUpdateRequest
    student_user = db_session.query(User).filter(User.role == UserRole.STUDENT).first()
    assert student_user is not None

    req = RoadmapGenerateRequest(target_role="Data Analyst", force_regenerate=True)
    res = generate_roadmap(payload=req, current_user=student_user, db=db_session)
    assert res.success is True
    roadmap = res.data
    assert roadmap["target_role"] == "Data Analyst"
    assert len(roadmap["items"]) == 6

    first_item = roadmap["items"][0]

    # PATCH
    patch_req = MilestoneUpdateRequest(
        status="completed",
        notes="Completed advanced window functions exercise with CTEs.",
        evidence_url="https://github.com/test/sql-analytics",
        evidence_notes="Repository with complex queries on mock database.",
        is_completed=True
    )
    patch_res = update_milestone_item(
        item_id=first_item["id"],
        payload=patch_req,
        current_user=student_user,
        db=db_session
    )
    assert patch_res.success is True
    updated_roadmap = patch_res.data
    item_updated = next(i for i in updated_roadmap["items"] if i["id"] == first_item["id"])
    assert item_updated["is_completed"] is True
    assert item_updated["is_verified"] is True
    assert item_updated["evidence_url"] == "https://github.com/test/sql-analytics"


def test_api_readiness_index_and_history(db_session):
    """Tests GET /api/v1/career-intelligence/readiness-index and history via router functions."""
    from app.api.v1.career_intelligence import get_career_readiness_index, get_readiness_history
    student_user = db_session.query(User).filter(User.role == UserRole.STUDENT).first()
    assert student_user is not None

    res = get_career_readiness_index(record_snapshot=True, current_user=student_user, db=db_session)
    assert res.success is True
    cri = res.data
    assert "overall_score" in cri
    assert "tier" in cri
    assert "category_scores" in cri
    assert "improvement_opportunities" in cri

    # History
    res_hist = get_readiness_history(limit=10, current_user=student_user, db=db_session)
    assert res_hist.success is True
    assert isinstance(res_hist.data, list)
    assert len(res_hist.data) >= 1

