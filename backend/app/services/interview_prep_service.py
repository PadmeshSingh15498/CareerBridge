import json
import logging
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.student import StudentProfile
from app.models.ai import InterviewSession, InterviewDifficultyEnum
from app.models.user import NotificationType
from app.schemas.interview_prep import (
    InterviewStartRequest, InterviewQuestionItem,
    InterviewAnswerSubmitRequest, AnswerEvaluationResponse,
    InterviewSessionDetailResponse, InterviewSessionItem,
    InterviewHistoryResponse, ImprovementTrendPoint, DimensionScores
)
from app.ai.interview_prep.question_generator import QuestionGenerator
from app.ai.interview_prep.evaluator import AnswerEvaluator
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class InterviewPrepService:

    @staticmethod
    def start_session(
        db: Session,
        student_id: str,
        payload: InterviewStartRequest
    ) -> Dict[str, Any]:
        """Initializes a new interactive mock interview session and generates Question 1."""
        student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

        # Map difficulty string to enum
        diff_map = {
            "entry_level": InterviewDifficultyEnum.ENTRY_LEVEL,
            "intermediate": InterviewDifficultyEnum.MID_LEVEL,
            "senior": InterviewDifficultyEnum.SENIOR
        }
        diff_enum = diff_map.get(payload.difficulty.lower(), InterviewDifficultyEnum.MID_LEVEL)

        # Generate Question 1
        q1 = QuestionGenerator.generate_question(
            target_role=payload.target_role,
            company_target=payload.company_target or "General Tech",
            interview_type=payload.interview_type,
            difficulty=payload.difficulty,
            topics=payload.topics,
            question_index=0
        )

        session = InterviewSession(
            student_id=student.id,
            target_role=payload.target_role,
            company_target=payload.company_target or "General Tech",
            interview_type=payload.interview_type.lower(),
            difficulty=diff_enum,
            topics=payload.topics or [],
            current_question_index=0,
            total_questions=payload.total_questions,
            status="in_progress",
            questions_json=[q1],
            answers_json=[],
            feedback_json=[],
            created_at=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        return {
            "session_id": session.id,
            "target_role": session.target_role,
            "company_target": session.company_target,
            "interview_type": session.interview_type,
            "difficulty": payload.difficulty,
            "total_questions": session.total_questions,
            "current_question_index": 1,
            "question": q1
        }

    @staticmethod
    def submit_answer(
        db: Session,
        student_id: str,
        session_id: str,
        payload: InterviewAnswerSubmitRequest
    ) -> Dict[str, Any]:
        """Evaluates candidate answer, records feedback, and serves the next question or completes session."""
        session = db.query(InterviewSession).filter(
            InterviewSession.id == session_id,
            InterviewSession.student_id == student_id
        ).first()

        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found")

        if session.status == "completed":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Interview session is already completed")

        questions = session.questions_json or []
        curr_idx = session.current_question_index

        if curr_idx >= len(questions):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid question index")

        curr_q = questions[curr_idx]

        # Evaluate answer
        eval_result = AnswerEvaluator.evaluate(
            question_text=curr_q["question_text"],
            answer_text=payload.answer_text,
            interview_type=session.interview_type,
            topic=curr_q.get("topic", "General"),
            key_concepts=curr_q.get("key_concepts", []),
            difficulty=curr_q.get("difficulty", "intermediate")
        )

        # Record answer and feedback in session
        answers = session.answers_json or []
        answers.append({
            "question_id": curr_q["question_id"],
            "answer_text": payload.answer_text,
            "audio_transcript": payload.audio_transcript,
            "submitted_at": datetime.utcnow().isoformat()
        })
        session.answers_json = answers

        feedbacks = session.feedback_json or []
        feedbacks.append(eval_result)
        session.feedback_json = feedbacks

        is_last = (curr_idx + 1) >= session.total_questions
        next_question = None

        if not is_last:
            # Advance to next question
            session.current_question_index = curr_idx + 1
            answered_topics = [q.get("topic") for q in questions]
            next_q = QuestionGenerator.generate_question(
                target_role=session.target_role,
                company_target=session.company_target,
                interview_type=session.interview_type,
                difficulty=session.difficulty.value if hasattr(session.difficulty, "value") else str(session.difficulty),
                topics=session.topics,
                question_index=curr_idx + 1,
                answered_topics=answered_topics
            )
            questions.append(next_q)
            session.questions_json = questions
            next_question = next_q
        else:
            # Finalize session
            session.status = "completed"
            session.completed_at = datetime.utcnow()

            # Compute aggregated overall score
            all_scores = [f["overall_score"] for f in feedbacks]
            avg_score = int(sum(all_scores) / max(1, len(all_scores)))
            session.overall_score = avg_score

            # Compute average dimension scores
            dim_avgs = {
                "technical_accuracy": int(sum(f["dimension_scores"]["technical_accuracy"] for f in feedbacks) / len(feedbacks)),
                "relevance": int(sum(f["dimension_scores"]["relevance"] for f in feedbacks) / len(feedbacks)),
                "completeness": int(sum(f["dimension_scores"]["completeness"] for f in feedbacks) / len(feedbacks)),
                "conceptual_understanding": int(sum(f["dimension_scores"]["conceptual_understanding"] for f in feedbacks) / len(feedbacks)),
                "communication": int(sum(f["dimension_scores"]["communication"] for f in feedbacks) / len(feedbacks)),
                "problem_solving": int(sum(f["dimension_scores"]["problem_solving"] for f in feedbacks) / len(feedbacks)),
            }
            session.detailed_scores = dim_avgs

            # Identify weak topics and recommendations
            all_missing = []
            weak_topics = set()
            for idx, fb in enumerate(feedbacks):
                if fb["overall_score"] < 75:
                    q_topic = questions[idx].get("topic", "Core Fundamentals")
                    weak_topics.add(q_topic)
                all_missing.extend(fb.get("missing_concepts", []))

            session.weak_topics = list(weak_topics) or ["System Trade-offs"]
            session.recommendations = [
                f"Review concepts: {', '.join(all_missing[:4])}.",
                "Practice delivering answers using the STAR method for behavioral and architectural trade-offs for technical.",
                "Reinforce implementation details and Big-O computational bounds."
            ]

            # Emit notification to student
            student_obj = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
            if student_obj and student_obj.user_id:
                NotificationService.send_notification(
                    db=db,
                    user_id=student_obj.user_id,
                    title="Interview Prep Session Completed",
                    message=f"You completed {session.target_role} mock interview with an overall score of {avg_score}/100.",
                    category="learning_milestone",
                    notification_type=NotificationType.SUCCESS,
                    action_url="/interview-prep"
                )

        db.commit()
        db.refresh(session)

        return {
            "evaluation": eval_result,
            "is_last_question": is_last,
            "current_question_index": session.current_question_index + 1,
            "total_questions": session.total_questions,
            "next_question": next_question,
            "session_completed": is_last,
            "session_overall_score": session.overall_score if is_last else None
        }

    @staticmethod
    def get_session_detail(
        db: Session,
        student_id: str,
        session_id: str
    ) -> InterviewSessionDetailResponse:
        """Retrieves full interactive interview session dossier."""
        session = db.query(InterviewSession).filter(
            InterviewSession.id == session_id,
            InterviewSession.student_id == student_id
        ).first()

        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

        scores_obj = None
        if session.detailed_scores:
            scores_obj = DimensionScores(**session.detailed_scores)

        return InterviewSessionDetailResponse(
            id=session.id,
            target_role=session.target_role,
            company_target=session.company_target,
            interview_type=session.interview_type,
            difficulty=session.difficulty.value if hasattr(session.difficulty, "value") else str(session.difficulty),
            topics=session.topics or [],
            current_question_index=session.current_question_index,
            total_questions=session.total_questions,
            status=session.status,
            overall_score=session.overall_score,
            detailed_scores=scores_obj,
            missing_concepts=session.missing_concepts or [],
            improvements=session.improvements or [],
            weak_topics=session.weak_topics or [],
            recommendations=session.recommendations or [],
            questions=session.questions_json or [],
            answers=session.answers_json or [],
            feedback=session.feedback_json or [],
            created_at=session.created_at,
            completed_at=session.completed_at
        )

    @staticmethod
    def get_performance_history(
        db: Session,
        student_id: str
    ) -> InterviewHistoryResponse:
        """Calculates past interview practice history, performance trends, and revision advice."""
        sessions = (
            db.query(InterviewSession)
            .filter(InterviewSession.student_id == student_id)
            .order_by(desc(InterviewSession.created_at))
            .all()
        )

        completed = [s for s in sessions if s.status == "completed" and s.overall_score is not None]
        avg_score = float(sum(s.overall_score for s in completed) / max(1, len(completed))) if completed else 0.0

        # Trends over time (chronological)
        trends = []
        for s in reversed(completed):
            trends.append(ImprovementTrendPoint(
                session_id=s.id,
                date=s.created_at.strftime("%b %d"),
                target_role=s.target_role,
                score=s.overall_score or 0
            ))

        # Collect weak topics across all sessions
        weak_counter: Dict[str, int] = {}
        for s in completed:
            for wt in (s.weak_topics or []):
                weak_counter[wt] = weak_counter.get(wt, 0) + 1

        top_weak = sorted(weak_counter.keys(), key=lambda k: weak_counter[k], reverse=True)[:5]
        if not top_weak:
            top_weak = ["Distributed Concurrency", "Database Indexing", "System Trade-offs"]

        revisions = [
            f"Prioritize targeted review of '{top_weak[0]}' before your next mock interview.",
            "Practice articulating algorithmic trade-offs (Time vs Space) under simulated pressure.",
            "Use voice recording mode to self-critique clarity, pace, and vocal structure."
        ]

        items = [
            InterviewSessionItem(
                id=s.id,
                target_role=s.target_role,
                company_target=s.company_target,
                interview_type=s.interview_type,
                difficulty=s.difficulty.value if hasattr(s.difficulty, "value") else str(s.difficulty),
                topics=s.topics or [],
                current_question_index=s.current_question_index,
                total_questions=s.total_questions,
                status=s.status,
                overall_score=s.overall_score,
                created_at=s.created_at,
                completed_at=s.completed_at
            )
            for s in sessions
        ]

        return InterviewHistoryResponse(
            total_sessions=len(sessions),
            completed_sessions=len(completed),
            average_score=round(avg_score, 1),
            sessions=items,
            improvement_trends=trends,
            weak_topics=top_weak,
            recommended_revisions=revisions
        )

