from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ScoringWeightsInput(BaseModel):
    structure: Optional[float] = Field(None, ge=0.0, le=100.0)
    technical_skills: Optional[float] = Field(None, ge=0.0, le=100.0)
    projects: Optional[float] = Field(None, ge=0.0, le=100.0)
    experience: Optional[float] = Field(None, ge=0.0, le=100.0)
    education: Optional[float] = Field(None, ge=0.0, le=100.0)
    achievements: Optional[float] = Field(None, ge=0.0, le=100.0)
    readability: Optional[float] = Field(None, ge=0.0, le=100.0)


class JobSpecificAnalysisRequest(BaseModel):
    job_id: str = Field(..., min_length=36, max_length=36, description="Target job requisition ID")
    weights: Optional[ScoringWeightsInput] = None


class ActionVerbSuggestion(BaseModel):
    original: str
    replacement: str
    context_snippet: Optional[str] = None
    reason: str


class QuantificationSuggestion(BaseModel):
    original_statement: str
    recommendation: str
    example_addition: str


class ProjectRewriteSuggestion(BaseModel):
    project_title: Optional[str] = None
    current_description: str
    enhanced_description: str
    reasoning: str


class SuggestedEditsResponse(BaseModel):
    action_verbs: List[ActionVerbSuggestion] = []
    quantification: List[QuantificationSuggestion] = []
    project_rewrites: List[ProjectRewriteSuggestion] = []


class JobRelevanceDetailResponse(BaseModel):
    job_title: str
    job_relevance_score: float
    matched_skills_count: int
    missing_keywords_count: int
    relevant_skills: List[str] = []
    missing_keywords: List[str] = []
    weakly_represented_requirements: List[Dict[str, Any]] = []
    relevant_project_evidence: List[Dict[str, Any]] = []
    targeted_improvements: List[str] = []


class ResumeAnalysisDetailResponse(BaseModel):
    id: Optional[str] = None
    resume_id: str
    overall_score: int
    weights: Dict[str, float]
    category_scores: Dict[str, float]
    category_max: Dict[str, float]
    category_explanations: Dict[str, str]
    contact_info: Dict[str, Optional[str]]
    skills_extracted: List[str] = []
    strengths: List[str] = []
    weaknesses: List[str] = []
    missing_sections: List[str] = []
    suggested_edits: SuggestedEditsResponse
    job_analysis: Optional[JobRelevanceDetailResponse] = None
    engine_type: str = "nlp_intelligence"
    disclaimer: str
    created_at: datetime


class AnalysisHistoryItemResponse(BaseModel):
    id: str
    resume_id: str
    target_job_id: Optional[str] = None
    job_title: Optional[str] = None
    overall_score: int
    category_scores: Dict[str, float]
    engine_type: str
    created_at: datetime

