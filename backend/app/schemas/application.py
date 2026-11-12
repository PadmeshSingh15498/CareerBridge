from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ApplicationCreateRequest(BaseModel):
    job_id: str = Field(..., min_length=36, max_length=36)
    resume_id: str = Field(..., min_length=36, max_length=36)
    cover_letter: Optional[str] = Field(None, max_length=2000)


class ApplicationStatusUpdateRequest(BaseModel):
    new_status: str = Field(..., min_length=2, max_length=50)
    change_reason: Optional[str] = Field(None, max_length=255)


class ApplicationWithdrawRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=255)


class InterviewScheduleRequest(BaseModel):
    round_name: str = Field(..., min_length=2, max_length=100)
    scheduled_start: datetime
    scheduled_end: datetime
    meeting_link: Optional[str] = None
    venue: Optional[str] = None
    interviewer_name: Optional[str] = None


class StatusHistoryResponse(BaseModel):
    id: int
    previous_status: Optional[str] = None
    new_status: str
    change_reason: Optional[str] = None
    created_at: datetime


class InterviewResponse(BaseModel):
    id: str
    round_name: str
    scheduled_start: datetime
    scheduled_end: datetime
    meeting_link: Optional[str] = None
    venue: Optional[str] = None
    interviewer_name: Optional[str] = None
    status: str
    created_at: datetime


class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    student_id: str
    resume_id: str
    current_status: str
    composite_match_score: float
    cover_letter: Optional[str] = None
    applied_at: datetime
    # Job context
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    company_logo: Optional[str] = None
    job_location: Optional[str] = None
    job_type: Optional[str] = None
    salary_range: Optional[str] = None
    # Student context (for recruiter)
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_roll_number: Optional[str] = None
    candidate_cgpa: Optional[float] = None
    candidate_department: Optional[str] = None
    candidate_skills: List[str] = []
    # History & Interviews
    status_history: List[StatusHistoryResponse] = []
    interviews: List[InterviewResponse] = []

