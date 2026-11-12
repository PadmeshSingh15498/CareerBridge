import uuid
import pytest
from fastapi import Response, HTTPException
from app.schemas.auth import StudentRegisterRequest, RecruiterRegisterRequest, UserLoginRequest
from app.services.auth_service import AuthService
from app.api.v1.auth import login_user

def test_student_registration_and_login(db_session):
    unique_id = uuid.uuid4().hex[:6]
    student_email = f"student_{unique_id}@example.com"
    
    # 1. Register Student
    register_payload = StudentRegisterRequest(
        email=student_email,
        password="StrongPassword123!",
        role="student",
        full_name="Test Student",
        registration_number=f"ROLL_{unique_id}",
        university="University",
        degree="B.Tech",
        department="Computer Science",
        graduation_year=2026
    )
    user, tokens, _ = AuthService.register_student(db_session, register_payload)
    assert user is not None
    assert user.email == student_email
    assert tokens.access_token is not None
    assert tokens.role == "student"

    # 2. Login with correct credentials
    login_payload = UserLoginRequest(
        email=student_email,
        password="StrongPassword123!",
    )
    login_res = login_user(payload=login_payload, db=db_session)
    assert login_res.success is True
    token = login_res.data.access_token
    assert token is not None


def test_login_invalid_password(db_session):
    login_payload = UserLoginRequest(
        email="nonexistent@example.com",
        password="WrongPassword!",
    )
    with pytest.raises(HTTPException) as exc:
        login_user(payload=login_payload, db=db_session)
    assert exc.value.status_code == 401


def test_recruiter_registration(db_session):
    unique_id = uuid.uuid4().hex[:6]
    recruiter_email = f"recruiter_{unique_id}@hiringcorp.com"
    
    payload = RecruiterRegisterRequest(
        email=recruiter_email,
        password="CorporatePassword123!",
        role="recruiter",
        full_name="Sarah Recruiter",
        company_name=f"Hiring Corp {unique_id}",
        company_website=f"https://hiringcorp-{unique_id}.com",
        designation="Lead Recruiter",
    )
    user, tokens, _ = AuthService.register_recruiter(db_session, payload)
    assert user.role.value == "recruiter"
    assert tokens.role == "recruiter"
