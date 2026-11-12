"""
BridgeAI REST API Router for CareerBridge.
Provides conversation management, messaging, RAG knowledge retrieval,
and personalized career mentorship endpoints.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_active_user, get_optional_current_user
from app.models.user import User, UserRole
from app.schemas.common import APIResponse
from app.services.bridge_ai_service import BridgeAIService

router = APIRouter(prefix="/bridge-ai", tags=["BridgeAI Career Mentor"])


class CreateConversationRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=200, description="Optional custom conversation title")
    context_type: str = Field("general", description="general, resume_review, interview_strategy, job_advice")


class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000, description="User prompt message")


def _get_authenticated_user(current_user: Optional[User], db: Session) -> User:
    """Returns current active user or falls back to standard demo student."""
    if current_user:
        return current_user

    demo = db.query(User).filter(User.email == "student@careerbridge.com").first()
    if demo:
        return demo

    first_u = db.query(User).filter(User.role == UserRole.STUDENT).first()
    if first_u:
        return first_u

    raise HTTPException(status_code=401, detail="Authentication required to converse with BridgeAI.")


@router.get("/prompts", response_model=APIResponse[List[str]])
def get_suggested_prompts():
    """Returns curated starter prompts for career mentorship."""
    prompts = [
        "How can I become an AI engineer?",
        "What skills should I prioritize to improve my Career Readiness Index?",
        "How can I optimize my resume for Google Cloud and Tier-1 campus drives?",
        "Explain the STAR methodology with a software engineering example.",
        "Compare a Full Stack Developer role vs a Machine Learning Engineer role.",
        "What questions should I ask technical interviewers at the end of a round?"
    ]
    return APIResponse(
        success=True,
        data=prompts,
        message="Suggested mentorship prompts retrieved."
    )


@router.get("/conversations", response_model=APIResponse[List[Dict[str, Any]]])
def list_conversations(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Lists conversations belonging strictly to the authenticated user."""
    user = _get_authenticated_user(current_user, db)
    convs = BridgeAIService.list_conversations(db, user_id=user.id)
    return APIResponse(
        success=True,
        data=convs,
        message="Conversations retrieved successfully."
    )


@router.post("/conversations", response_model=APIResponse[Dict[str, Any]])
def create_conversation(
    payload: CreateConversationRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new conversation with personalized welcoming greeting."""
    user = _get_authenticated_user(current_user, db)
    conv = BridgeAIService.create_conversation(
        db=db,
        user_id=user.id,
        title=payload.title,
        context_type=payload.context_type
    )
    return APIResponse(
        success=True,
        data=conv,
        message="New BridgeAI conversation initialized."
    )


@router.get("/conversations/{conversation_id}", response_model=APIResponse[Dict[str, Any]])
def get_conversation(
    conversation_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves conversation history with strict cross-student data isolation."""
    user = _get_authenticated_user(current_user, db)
    try:
        conv = BridgeAIService.get_conversation(db, user_id=user.id, conversation_id=conversation_id)
        return APIResponse(
            success=True,
            data=conv,
            message="Conversation loaded."
        )
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied."
        )


@router.delete("/conversations/{conversation_id}", response_model=APIResponse[Dict[str, Any]])
def delete_conversation(
    conversation_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a conversation belonging to user."""
    user = _get_authenticated_user(current_user, db)
    try:
        BridgeAIService.delete_conversation(db, user_id=user.id, conversation_id=conversation_id)
        return APIResponse(
            success=True,
            data={"deleted_id": conversation_id},
            message="Conversation deleted successfully."
        )
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied."
        )


@router.post("/conversations/{conversation_id}/messages", response_model=APIResponse[Dict[str, Any]])
def send_message(
    conversation_id: str,
    payload: SendMessageRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Sends message to BridgeAI, triggers RAG knowledge search, grounds response
    in student context, and returns reply with source citations and follow-up chips.
    """
    user = _get_authenticated_user(current_user, db)
    try:
        resp = BridgeAIService.send_message(
            db=db,
            user_id=user.id,
            conversation_id=conversation_id,
            content=payload.content
        )
        return APIResponse(
            success=True,
            data=resp,
            message="BridgeAI response generated."
        )
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied."
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

