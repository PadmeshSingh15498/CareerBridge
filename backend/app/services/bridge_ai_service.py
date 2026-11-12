"""
BridgeAI Service for CareerBridge.
Orchestrates multi-turn conversation persistence in MySQL, context-grounded AI reasoning,
cross-student data isolation, and RAG knowledge search.
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.user import User
from app.models.ai import (
    AIConversation, AIMessage, MessageSenderRoleEnum, ConversationContextEnum
)
from app.ai.bridge_ai import (
    build_student_context_prompt,
    generate_bridge_ai_response
)

logger = logging.getLogger("careerbridge.bridge_ai.service")


class BridgeAIService:

    @classmethod
    def list_conversations(cls, db: Session, user_id: str) -> List[Dict[str, Any]]:
        """Lists conversations belonging strictly to the authenticated user."""
        convs = db.query(AIConversation).filter(
            AIConversation.user_id == user_id
        ).order_by(desc(AIConversation.created_at)).all()

        results = []
        for c in convs:
            msg_count = db.query(AIMessage).filter(AIMessage.conversation_id == c.id).count()
            last_msg = db.query(AIMessage).filter(
                AIMessage.conversation_id == c.id
            ).order_by(desc(AIMessage.created_at)).first()

            results.append({
                "id": c.id,
                "title": c.title,
                "context_type": c.context_type.value if hasattr(c.context_type, "value") else str(c.context_type),
                "message_count": msg_count,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "last_message_at": last_msg.created_at.isoformat() if last_msg and last_msg.created_at else None
            })
        return results

    @classmethod
    def create_conversation(
        cls,
        db: Session,
        user_id: str,
        title: Optional[str] = None,
        context_type: str = "general"
    ) -> Dict[str, Any]:
        """Creates a new conversation with an initial personalized greeting."""
        conv_title = title.strip() if title and title.strip() else "New Career Discussion"
        c_type = ConversationContextEnum.GENERAL
        if context_type == "resume_review":
            c_type = ConversationContextEnum.RESUME_REVIEW
        elif context_type == "interview_strategy":
            c_type = ConversationContextEnum.INTERVIEW_STRATEGY
        elif context_type == "job_advice":
            c_type = ConversationContextEnum.JOB_ADVICE

        conv = AIConversation(
            user_id=user_id,
            title=conv_title,
            context_type=c_type
        )
        db.add(conv)
        db.flush()

        # Initial assistant welcoming message
        greeting_text = (
            "Hello! I am **BridgeAI**, your personalized campus career mentor. "
            "I'm grounded in your verified technical skills, academic records, resume analysis, and campus job drives.\n\n"
            "How can I help you accelerate your placement journey today?"
        )
        welcome_msg = AIMessage(
            conversation_id=conv.id,
            sender_role=MessageSenderRoleEnum.ASSISTANT,
            content=greeting_text,
            metadata_json={
                "provider": "system",
                "model": "BridgeAI-v1",
                "follow_ups": [
                    "How can I become an AI engineer?",
                    "What skills should I prioritize to improve my CRI score?",
                    "How can I optimize my resume for campus placement drives?"
                ],
                "sources": []
            }
        )
        db.add(welcome_msg)
        db.commit()
        db.refresh(conv)

        return cls.get_conversation(db, user_id=user_id, conversation_id=conv.id)

    @classmethod
    def get_conversation(cls, db: Session, user_id: str, conversation_id: str) -> Dict[str, Any]:
        """
        Retrieves a conversation and all its messages.
        Enforces strict cross-student data isolation.
        """
        conv = db.query(AIConversation).filter(
            AIConversation.id == conversation_id,
            AIConversation.user_id == user_id
        ).first()

        if not conv:
            raise PermissionError("Conversation not found or access denied.")

        messages = db.query(AIMessage).filter(
            AIMessage.conversation_id == conversation_id
        ).order_by(AIMessage.created_at.asc()).all()

        serialized_messages = []
        for m in messages:
            serialized_messages.append({
                "id": m.id,
                "sender_role": m.sender_role.value if hasattr(m.sender_role, "value") else str(m.sender_role),
                "content": m.content,
                "metadata": m.metadata_json or {},
                "created_at": m.created_at.isoformat() if m.created_at else None
            })

        return {
            "id": conv.id,
            "title": conv.title,
            "context_type": conv.context_type.value if hasattr(conv.context_type, "value") else str(conv.context_type),
            "created_at": conv.created_at.isoformat() if conv.created_at else None,
            "messages": serialized_messages
        }

    @classmethod
    def delete_conversation(cls, db: Session, user_id: str, conversation_id: str) -> bool:
        """Deletes a conversation belonging strictly to user."""
        conv = db.query(AIConversation).filter(
            AIConversation.id == conversation_id,
            AIConversation.user_id == user_id
        ).first()

        if not conv:
            raise PermissionError("Conversation not found or access denied.")

        db.delete(conv)
        db.commit()
        return True

    @classmethod
    def send_message(
        cls,
        db: Session,
        user_id: str,
        conversation_id: str,
        content: str
    ) -> Dict[str, Any]:
        """
        Processes student message, performs RAG retrieval, runs LLM / fallback generator,
        and persists dialogue to database.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found.")

        conv = db.query(AIConversation).filter(
            AIConversation.id == conversation_id,
            AIConversation.user_id == user_id
        ).first()

        if not conv:
            raise PermissionError("Conversation not found or access denied.")

        clean_text = content.strip()
        if not clean_text:
            raise ValueError("Message content cannot be empty.")

        # 1. Save user message
        user_msg = AIMessage(
            conversation_id=conversation_id,
            sender_role=MessageSenderRoleEnum.USER,
            content=clean_text
        )
        db.add(user_msg)
        db.flush()

        # Update conversation title if default
        if conv.title == "New Career Discussion":
            words = clean_text.split()
            short_title = " ".join(words[:5]) + ("..." if len(words) > 5 else "")
            conv.title = short_title[:100]

        # 2. Extract conversation history
        prev_messages = db.query(AIMessage).filter(
            AIMessage.conversation_id == conversation_id
        ).order_by(AIMessage.created_at.asc()).limit(8).all()

        history_payload = []
        for pm in prev_messages:
            history_payload.append({
                "role": pm.sender_role.value if hasattr(pm.sender_role, "value") else str(pm.sender_role),
                "content": pm.content
            })

        # 3. Build grounded student context (Isolated to current student)
        student_context = build_student_context_prompt(db, user)

        # 4. Generate AI response (RAG + Guardrails + LLM/fallback)
        ai_resp = generate_bridge_ai_response(
            query=clean_text,
            student_context=student_context,
            conversation_history=history_payload
        )

        # 5. Save assistant message
        assistant_msg = AIMessage(
            conversation_id=conversation_id,
            sender_role=MessageSenderRoleEnum.ASSISTANT,
            content=ai_resp["content"],
            metadata_json={
                "sources": ai_resp.get("sources", []),
                "follow_ups": ai_resp.get("follow_ups", []),
                "provider": ai_resp.get("metadata", {}).get("provider", "mock"),
                "model": ai_resp.get("metadata", {}).get("model", "BridgeAI-v1"),
                "latency_ms": ai_resp.get("metadata", {}).get("latency_ms", 120),
                "is_mock": ai_resp.get("metadata", {}).get("is_mock", True)
            }
        )
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)

        return {
            "conversation_id": conversation_id,
            "user_message": {
                "id": user_msg.id,
                "sender_role": "user",
                "content": user_msg.content,
                "created_at": user_msg.created_at.isoformat() if user_msg.created_at else None
            },
            "assistant_message": {
                "id": assistant_msg.id,
                "sender_role": "assistant",
                "content": assistant_msg.content,
                "metadata": assistant_msg.metadata_json,
                "created_at": assistant_msg.created_at.isoformat() if assistant_msg.created_at else None
            }
        }

