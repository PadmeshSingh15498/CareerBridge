from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class InterviewStartRequest(BaseModel):
    target_role: str = Field(..., description="Target job role, e.g. Software Engineer, Data Scientist")
    company_target: Optional[str] = Field("General Tech", description="Target company or tier, e.g. Google, Microsoft, Startup")
    interview_type: str = Field("technical", description="technical | coding | hr | behavioral | aptitude")
    difficulty: str = Field("intermediate", description="entry_level | intermediate | senior")
    topics: Optional[List[str]] = Field(default_factory=list, description="Specific topics to focus on")
    total_questions: int = Field(5, ge=1, le=10, description="Total questions for this mock session")


class InterviewQuestionItem(BaseModel):
    question_id: int
    question_text: str
    interview_type: str
    topic: str
    difficulty: str
    hints: List[str] = []


class InterviewAnswerSubmitRequest(BaseModel):
    question_id: int
    answer_text: str = Field(..., min_length=2, description="Candidate's text response")
    audio_transcript: Optional[str] = None


class DimensionScores(BaseModel):
    technical_accuracy: int = Field(..., ge=0, le=100)
    relevance: int = Field(..., ge=0, le=100)
    completeness: int = Field(..., ge=0, le=100)
    conceptual_understanding: int = Field(..., ge=0, le=100)
    communication: int = Field(..., ge=0, le=100)
    problem_solving: int = Field(..., ge=0, le=100)


class AnswerEvaluationResponse(BaseModel):
    question_id: int
    overall_score: int
    dimension_scores: DimensionScores
    missing_concepts: List[str]
    improvements: List[str]
    follow_up_question: Optional[str] = None
    feedback_summary: str
    is_last_question: bool
    disclaimer: str = "AI-generated practice feedback, not an actual employer evaluation."


class InterviewSessionItem(BaseModel):
    id: str
    target_role: str
    company_target: str
    interview_type: str
    difficulty: str
    topics: List[str] = []
    current_question_index: int
    total_questions: int
    status: str
    overall_score: Optional[int] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class InterviewSessionDetailResponse(BaseModel):
    id: str
    target_role: str
    company_target: str
    interview_type: str
    difficulty: str
    topics: List[str] = []
    current_question_index: int
    total_questions: int
    status: str
    overall_score: Optional[int] = None
    detailed_scores: Optional[DimensionScores] = None
    missing_concepts: Optional[List[str]] = None
    improvements: Optional[List[str]] = None
    weak_topics: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    questions: List[Dict[str, Any]] = []
    answers: List[Dict[str, Any]] = []
    feedback: List[Dict[str, Any]] = []
    created_at: datetime
    completed_at: Optional[datetime] = None
    disclaimer: str = "AI-generated practice feedback, not an actual employer evaluation."


class ImprovementTrendPoint(BaseModel):
    session_id: str
    date: str
    target_role: str
    score: int


class InterviewHistoryResponse(BaseModel):
    total_sessions: int
    completed_sessions: int
    average_score: float
    sessions: List[InterviewSessionItem]
    improvement_trends: List[ImprovementTrendPoint]
    weak_topics: List[str]
    recommended_revisions: List[str]

