"""
Pydantic v2 Schemas for Resume Upload, Parsing, ATS Analysis, and Approval.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ResumeVersionResponse(BaseModel):
    id: int
    version_number: int
    changelog_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ResumeAnalysisResponse(BaseModel):
    ats_score: int
    section_score: int
    metric_score: int
    skill_score: int
    format_score: int
    extracted_skills: List[str]
    missing_recommended_skills: Optional[List[str]] = None
    improvements_json: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ExtractedResumeData(BaseModel):
    raw_text_length: int
    personal: Dict[str, Optional[str]]
    education: List[Dict[str, Any]]
    skills: List[Dict[str, str]]
    projects: List[Dict[str, Any]]
    experience: List[Dict[str, Any]]
    certifications: List[Dict[str, Any]]
    metrics: Dict[str, Any]


class ResumeDetailResponse(BaseModel):
    id: str
    student_id: str
    title: str
    file_name: str
    file_size_bytes: int
    mime_type: str
    is_default: bool
    current_version: int
    created_at: datetime
    updated_at: datetime
    versions: List[ResumeVersionResponse] = Field(default_factory=list)
    analysis: Optional[ResumeAnalysisResponse] = None
    extracted_data: Optional[ExtractedResumeData] = None

    class Config:
        from_attributes = True


class ResumeUploadResponse(BaseModel):
    id: str
    title: str
    file_name: str
    file_size_bytes: int
    mime_type: str
    version_number: int
    ats_score: int
    extracted_skills_count: int
    message: str


class ApplyExtractedDataRequest(BaseModel):
    apply_personal: bool = True
    apply_education: bool = True
    apply_skills: bool = True
    apply_projects: bool = True
    apply_experience: bool = True
    apply_certifications: bool = True
    overwrite_existing: bool = False  # Protect manual data by default


class ApplyExtractedDataResponse(BaseModel):
    success: bool
    message: str
    applied_sections: List[str]
    new_profile_completion: int

