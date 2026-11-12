from fastapi import APIRouter
from app.api.v1 import (
    auth, health, dashboard, students, resumes, jobs, applications,
    career_intelligence, bridge_ai, recruiter, admin, notifications, interview_prep
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard Intelligence"])
api_router.include_router(students.router, tags=["Student Profile Management"])
api_router.include_router(resumes.router, tags=["Resume Intelligence & Parsing"])
api_router.include_router(jobs.router, tags=["Job Discovery & Requisition Management"])
api_router.include_router(applications.router, tags=["Application Management & Pipeline"])
api_router.include_router(career_intelligence.router, tags=["AI Career Intelligence & Roadmaps"])
api_router.include_router(bridge_ai.router, tags=["BridgeAI Career Mentor"])
api_router.include_router(recruiter.router, tags=["Recruiter Workspace & Candidate Intelligence"])
api_router.include_router(admin.router, tags=["Placement Officer & University Administration"])
api_router.include_router(notifications.router, tags=["Notifications & Alerts"])
api_router.include_router(interview_prep.router, tags=["AI Interview Preparation"])


