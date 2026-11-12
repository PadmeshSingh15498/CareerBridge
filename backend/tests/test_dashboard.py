import pytest
from app.api.v1.dashboard import (
    get_student_dashboard,
    get_recruiter_dashboard,
    get_admin_dashboard
)
from app.services.dashboard_service import DashboardService


def test_student_dashboard_service(db_session):
    data = DashboardService.get_student_dashboard(db_session)
    assert bool(data.student_name)
    assert data.career_readiness_score > 0
    assert data.resume_health.ats_score > 0
    assert isinstance(data.recommended_jobs, list)
    assert data.skill_gap_summary.target_role is not None
    assert len(data.career_roadmap.milestones) > 0
    assert isinstance(data.active_applications, list)
    assert len(data.upcoming_interviews) > 0


def test_recruiter_dashboard_service(db_session):
    data = DashboardService.get_recruiter_dashboard(db_session)
    assert bool(data.company_name)
    assert data.stats.active_jobs_count >= 1
    assert data.pipeline.applied > 0
    assert len(data.active_jobs) >= 1
    assert len(data.recent_applications) >= 1
    assert data.job_performance.total_views > 0
    assert len(data.candidate_matching_insights) > 0


def test_admin_dashboard_service(db_session):
    data = DashboardService.get_admin_dashboard(db_session)
    assert "National Institute" in data.institution_name
    assert data.stats.total_students > 0
    assert data.stats.placement_rate_percent >= 0
    assert len(data.department_stats) >= 1
    assert len(data.company_recruitment) >= 1
    assert len(data.placement_drives) >= 1
    assert data.pending_actions.pending_jobs_count >= 0


def test_dashboard_endpoint_handlers(db_session):
    # Test FastAPI endpoint handler functions directly
    student_res = get_student_dashboard(demo=True, db=db_session, user=None)
    assert bool(student_res.student_name)

    recruiter_res = get_recruiter_dashboard(demo=True, db=db_session, user=None)
    assert bool(recruiter_res.company_name)

    admin_res = get_admin_dashboard(db=db_session)
    assert "National Institute" in admin_res.institution_name
