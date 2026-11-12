import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.security import create_access_token, get_password_hash
from app.models.user import User, UserRole, Notification, NotificationType, NotificationPreference
from app.models.student import StudentProfile, PlacementStatusEnum, AcademicRecord
from app.models.ai import InterviewSession, InterviewDifficultyEnum
from app.schemas.notification import NotificationPreferenceUpdateRequest
from app.schemas.interview_prep import InterviewStartRequest, InterviewAnswerSubmitRequest
from app.services.notification_service import NotificationService
from app.services.interview_prep_service import InterviewPrepService
from app.ai.interview_prep.speech_transcriber import SpeechTranscriber


@pytest.fixture
def phase14_fixture(db_session: Session):
    """Provisions student, user, and initial preferences for Phase 14 tests."""
    user = db_session.query(User).filter(User.email == "student_phase14@example.com").first()
    if not user:
        user = User(
            email="student_phase14@example.com",
            password_hash=get_password_hash("Student@123"),
            role=UserRole.STUDENT,
            is_active=True,
            is_verified=True
        )
        db_session.add(user)
        db_session.flush()

    student = db_session.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not student:
        student = StudentProfile(
            user_id=user.id,
            full_name="Karan Malhotra",
            roll_number="CS2026-P14",
            placement_status=PlacementStatusEnum.UNPLACED
        )
        db_session.add(student)
        db_session.flush()

    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(student)
    return {"user": user, "student": student}


def test_send_and_list_notifications(db_session: Session, phase14_fixture):
    """Validates creating in-app alerts, unread counts, and category filtering."""
    user = phase14_fixture["user"]

    # 1. Send notifications
    notif1 = NotificationService.send_notification(
        db=db_session,
        user_id=user.id,
        title="Resume Scored",
        message="Your resume scored 88/100 ATS compatibility.",
        category="resume_analysis",
        notification_type=NotificationType.SUCCESS
    )
    assert notif1 is not None

    notif2 = NotificationService.send_notification(
        db=db_session,
        user_id=user.id,
        title="New Placement Drive",
        message="Google Cloud campus hiring registration opened.",
        category="placement_drive",
        notification_type=NotificationType.ACTION_REQUIRED
    )
    assert notif2 is not None

    # 2. Check unread count
    unread_res = NotificationService.get_unread_count(db_session, user.id)
    assert unread_res.unread_count >= 2

    # 3. List notifications
    list_res = NotificationService.list_notifications(db_session, user.id, page=1, page_size=10)
    assert list_res.total >= 2
    assert any(n.title == "Resume Scored" for n in list_res.notifications)

    # 4. Filter by category
    drive_notifs = NotificationService.list_notifications(db_session, user.id, category="placement_drive")
    assert all(n.category == "placement_drive" for n in drive_notifs.notifications)


def test_notification_mark_as_read_and_mark_all(db_session: Session, phase14_fixture):
    """Validates marking single notification as read and marking all as read."""
    user = phase14_fixture["user"]

    notif = NotificationService.send_notification(
        db=db_session,
        user_id=user.id,
        title="Status Changed",
        message="Your application moved to Technical Round.",
        category="application_status"
    )

    # Mark single read
    updated = NotificationService.mark_as_read(db_session, user.id, notif.id)
    assert updated.is_read is True

    # Mark all read
    bulk_res = NotificationService.mark_all_read(db_session, user.id)
    assert "updated_count" in bulk_res

    # Unread count should now be 0
    unread_res = NotificationService.get_unread_count(db_session, user.id)
    assert unread_res.unread_count == 0


def test_notification_preferences_and_suppression(db_session: Session, phase14_fixture):
    """Validates category toggles and verifying that suppressed categories are not created."""
    user = phase14_fixture["user"]

    # Disable job recommendations
    pref_update = NotificationPreferenceUpdateRequest(
        job_recommendations=False
    )
    updated_pref = NotificationService.update_preferences(db_session, user.id, pref_update)
    assert updated_pref.job_recommendations is False

    # Attempt to dispatch job recommendation notification -> Should be suppressed!
    suppressed = NotificationService.send_notification(
        db=db_session,
        user_id=user.id,
        title="Recommended Job",
        message="Backend Engineer at FinTech Corp matches your profile.",
        category="job_recommendations"
    )
    assert suppressed is None

    # Re-enable
    NotificationService.update_preferences(db_session, user.id, NotificationPreferenceUpdateRequest(job_recommendations=True))


def test_start_interview_session(db_session: Session, phase14_fixture):
    """Validates starting an interactive AI interview prep session."""
    student = phase14_fixture["student"]

    req = InterviewStartRequest(
        target_role="Software Engineer",
        company_target="Google",
        interview_type="technical",
        difficulty="intermediate",
        topics=["System Design & Concurrency"],
        total_questions=3
    )

    session_res = InterviewPrepService.start_session(db_session, student.id, req)
    assert session_res["session_id"] is not None
    assert session_res["target_role"] == "Software Engineer"
    assert session_res["company_target"] == "Google"
    assert session_res["total_questions"] == 3
    assert session_res["current_question_index"] == 1

    q1 = session_res["question"]
    assert q1["question_id"] == 1
    assert "Google" in q1["question_text"]
    assert len(q1["hints"]) >= 1


def test_submit_interview_answer_and_evaluation(db_session: Session, phase14_fixture):
    """Validates multi-dimensional answer rubric evaluation and follow-up generation."""
    student = phase14_fixture["student"]

    req = InterviewStartRequest(
        target_role="Software Engineer",
        company_target="General Tech",
        interview_type="technical",
        difficulty="intermediate",
        total_questions=2
    )
    session_res = InterviewPrepService.start_session(db_session, student.id, req)
    session_id = session_res["session_id"]

    # Submit comprehensive answer
    ans_payload = InterviewAnswerSubmitRequest(
        question_id=1,
        answer_text="""To build a thread-safe LRU cache, I use a Doubly Linked List paired with a ConcurrentHashMap.
The Hash map provides O(1) lookup to find the node. The doubly linked list maintains node access order so that on read or write,
the accessed node moves to the head. For eviction, the tail node is removed in O(1).
To handle race conditions under high concurrent writes, we use ReentrantReadWriteLock or striped locking to minimize lock contention."""
    )

    eval_res = InterviewPrepService.submit_answer(db_session, student.id, session_id, ans_payload)

    evaluation = eval_res["evaluation"]
    assert evaluation["overall_score"] >= 70
    dim_scores = evaluation["dimension_scores"]
    assert dim_scores["technical_accuracy"] >= 60
    assert dim_scores["relevance"] >= 60
    assert dim_scores["completeness"] >= 60
    assert dim_scores["conceptual_understanding"] >= 60
    assert dim_scores["communication"] >= 60
    assert dim_scores["problem_solving"] >= 60
    assert len(evaluation["improvements"]) >= 1
    assert evaluation["disclaimer"] is not None
    assert eval_res["is_last_question"] is False
    assert eval_res["next_question"] is not None
    assert eval_res["next_question"]["question_id"] == 2


def test_complete_interview_session_workflow(db_session: Session, phase14_fixture):
    """Validates full session completion, aggregate score calculation, and milestone notification."""
    student = phase14_fixture["student"]

    req = InterviewStartRequest(
        target_role="Data Scientist",
        company_target="Amazon",
        interview_type="technical",
        difficulty="intermediate",
        total_questions=1
    )
    session_res = InterviewPrepService.start_session(db_session, student.id, req)
    session_id = session_res["session_id"]

    ans_payload = InterviewAnswerSubmitRequest(
        question_id=1,
        answer_text="The bias-variance tradeoff balances underfitting and overfitting. L1 regularization adds absolute penalty inducing sparsity while L2 adds squared penalty."
    )

    eval_res = InterviewPrepService.submit_answer(db_session, student.id, session_id, ans_payload)
    assert eval_res["is_last_question"] is True
    assert eval_res["session_completed"] is True
    assert eval_res["session_overall_score"] is not None

    # Check session in database
    detail = InterviewPrepService.get_session_detail(db_session, student.id, session_id)
    assert detail.status == "completed"
    assert detail.overall_score is not None
    assert detail.detailed_scores is not None
    assert len(detail.recommendations) >= 1

    # Check completion notification dispatched to student
    notifs = NotificationService.list_notifications(db_session, student.user_id, category="learning_milestone")
    assert any("Interview Prep Session Completed" in n.title for n in notifs.notifications)


def test_performance_history_and_trends(db_session: Session, phase14_fixture):
    """Validates candidate interview practice history, performance trendline, and revision recommendations."""
    student = phase14_fixture["student"]

    history = InterviewPrepService.get_performance_history(db_session, student.id)
    assert history.total_sessions >= 1
    assert history.completed_sessions >= 1
    assert history.average_score > 0
    assert len(history.weak_topics) >= 1
    assert len(history.recommended_revisions) >= 1


def test_audio_transcription_endpoint(phase14_fixture):
    """Validates audio speech-to-text recording endpoint and transcriber service."""
    from app.api.v1.interview_prep import transcribe_audio
    import io

    student = phase14_fixture["student"]
    fake_audio_bytes = b"RIFF....WAVEfmt ....data" * 20

    class MockAudioFile:
        def __init__(self, content: bytes, filename: str):
            self.file = io.BytesIO(content)
            self.filename = filename

    mock_file = MockAudioFile(fake_audio_bytes, "interview_recording.webm")
    resp = transcribe_audio(file=mock_file, student=student)

    assert resp.success is True
    assert "transcript" in resp.data
    assert len(resp.data["transcript"]) > 0

    # Also test transcriber directly on different formats
    direct_transcript = SpeechTranscriber.transcribe_audio_bytes(fake_audio_bytes, "test.wav")
    assert len(direct_transcript) > 0

    # Short / empty audio edge case
    assert SpeechTranscriber.transcribe_audio_bytes(b"", "empty.wav") == ""


def test_notifications_and_interview_prep_api_rbac(db_session: Session, phase14_fixture):
    """Validates REST endpoints and permissions."""
    from app.api.v1.notifications import get_unread_count, get_notification_preferences
    from app.api.v1.interview_prep import get_interview_history
    from app.core.permissions import require_roles
    from fastapi import HTTPException

    user = phase14_fixture["user"]
    student = phase14_fixture["student"]

    # 1. Unread count endpoint function
    resp_unread = get_unread_count(current_user=user, db=db_session)
    assert resp_unread.success is True
    assert resp_unread.data.unread_count >= 0

    # 2. Preferences endpoint function
    resp_pref = get_notification_preferences(current_user=user, db=db_session)
    assert resp_pref.success is True
    assert resp_pref.data.email_notifications is True

    # 3. Interview history endpoint function
    resp_hist = get_interview_history(student=student, db=db_session)
    assert resp_hist.success is True
    assert resp_hist.data.total_sessions >= 1

    # 4. Role validation check
    student_role_checker = require_roles(["student"])
    assert student_role_checker(current_user=user) == user

    recruiter_only_checker = require_roles(["recruiter"])
    with pytest.raises(HTTPException) as exc:
        recruiter_only_checker(current_user=user)
    assert exc.value.status_code == 403
