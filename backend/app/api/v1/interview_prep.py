"""
REST API Router for AI Interview Preparation Studio.
Question Generation, Multi-Dimensional Rubric Evaluation, Voice Transcription,
and Performance History Analytics.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.student import StudentProfile
from app.schemas.common import APIResponse
from app.schemas.interview_prep import (
    InterviewStartRequest, InterviewAnswerSubmitRequest,
    InterviewSessionDetailResponse, InterviewHistoryResponse
)
from app.services.interview_prep_service import InterviewPrepService
from app.ai.interview_prep.speech_transcriber import SpeechTranscriber

router = APIRouter(prefix="/interview-prep", tags=["AI Interview Preparation"])


def get_current_student_profile(
    current_user: User = Depends(require_roles(["student", "admin", "tpo"])),
    db: Session = Depends(get_db)
) -> StudentProfile:
    """Helper to resolve current student's profile."""
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        # If admin/tpo testing, pick first student
        profile = db.query(StudentProfile).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found. Please complete profile setup."
        )
    return profile


@router.post("/sessions", response_model=APIResponse[Dict[str, Any]])
def start_interview_session(
    payload: InterviewStartRequest,
    student: StudentProfile = Depends(get_current_student_profile),
    db: Session = Depends(get_db)
):
    """Initializes a new tailored mock interview session and returns Question 1."""
    session_data = InterviewPrepService.start_session(
        db=db,
        student_id=student.id,
        payload=payload
    )
    return APIResponse(
        success=True,
        message="Interview session started.",
        data=session_data
    )


@router.post("/sessions/{session_id}/answer", response_model=APIResponse[Dict[str, Any]])
def submit_interview_answer(
    session_id: str,
    payload: InterviewAnswerSubmitRequest,
    student: StudentProfile = Depends(get_current_student_profile),
    db: Session = Depends(get_db)
):
    """
    Evaluates candidate's response across 6 dimensions, identifies missing concepts,
    suggests improvements, and serves the next question or completes the session.
    """
    result = InterviewPrepService.submit_answer(
        db=db,
        student_id=student.id,
        session_id=session_id,
        payload=payload
    )
    return APIResponse(
        success=True,
        message="Answer evaluated successfully.",
        data=result
    )


@router.get("/sessions/{session_id}", response_model=APIResponse[InterviewSessionDetailResponse])
def get_session_detail(
    session_id: str,
    student: StudentProfile = Depends(get_current_student_profile),
    db: Session = Depends(get_db)
):
    """Retrieves full interactive interview session dossier."""
    detail = InterviewPrepService.get_session_detail(
        db=db,
        student_id=student.id,
        session_id=session_id
    )
    return APIResponse(
        success=True,
        message="Session dossier retrieved.",
        data=detail
    )


@router.get("/history", response_model=APIResponse[InterviewHistoryResponse])
def get_interview_history(
    student: StudentProfile = Depends(get_current_student_profile),
    db: Session = Depends(get_db)
):
    """Returns candidate's past interview practice history, performance trends, and revision advice."""
    history = InterviewPrepService.get_performance_history(
        db=db,
        student_id=student.id
    )
    return APIResponse(
        success=True,
        message="Interview performance history retrieved.",
        data=history
    )


@router.post("/transcribe", response_model=APIResponse[Dict[str, str]])
def transcribe_audio(
    file: UploadFile = File(...),
    student: StudentProfile = Depends(get_current_student_profile)
):
    """Converts recorded voice response into transcribed text for AI evaluation."""
    audio_bytes = file.file.read()
    transcript = SpeechTranscriber.transcribe_audio_bytes(audio_bytes, filename=file.filename or "recording.webm")
    return APIResponse(
        success=True,
        message="Audio transcribed successfully.",
        data={"transcript": transcript}
    )
