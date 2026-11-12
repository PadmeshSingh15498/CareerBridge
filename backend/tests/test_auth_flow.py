import uuid
import pytest
from fastapi import HTTPException
from app.models.user import User, UserRole, RefreshToken
from app.schemas.auth import (
    StudentRegisterRequest,
    RecruiterRegisterRequest,
    AdminRegisterRequest,
    UserLoginRequest,
)
from app.services.auth_service import AuthService
from app.core.security import verify_password, decode_token
from app.core.permissions import require_roles, verify_student_ownership, verify_recruiter_ownership


def test_student_registration_service(db_session):
    unique_id = uuid.uuid4().hex[:6]
    req = StudentRegisterRequest(
        full_name=f"Student {unique_id}",
        email=f"stu_{unique_id}@university.edu",
        password="Argon2StrongPassword123!",
        university="National Institute of Technology",
        registration_number=f"REG-{unique_id}",
        degree="B.Tech",
        department="Computer Science",
        graduation_year=2026,
    )
    user, tokens, verify_token = AuthService.register_student(db_session, req)
    assert user.email == f"stu_{unique_id}@university.edu"
    assert user.role == UserRole.STUDENT
    assert user.password_hash.startswith("$argon2")  # Confirms Argon2id hashing
    assert verify_password("Argon2StrongPassword123!", user.password_hash) is True
    assert tokens.access_token is not None
    assert tokens.role == "student"
    assert verify_token is not None

    # Check student profile and academic record created
    assert user.student_profile is not None
    assert user.student_profile.roll_number == f"REG-{unique_id}"


def test_recruiter_registration_service(db_session):
    unique_id = uuid.uuid4().hex[:6]
    req = RecruiterRegisterRequest(
        full_name=f"Recruiter {unique_id}",
        email=f"rec_{unique_id}@enterprise.com",
        password="CorporatePassword123!",
        company_name=f"Enterprise Tech {unique_id}",
        designation="Lead Campus Recruiter",
        company_website=f"https://enterprise-{unique_id}.com",
    )
    user, tokens, verify_token = AuthService.register_recruiter(db_session, req)
    assert user.email == f"rec_{unique_id}@enterprise.com"
    assert user.role == UserRole.RECRUITER
    assert user.password_hash.startswith("$argon2")
    assert user.recruiter_profile is not None
    assert tokens.role == "recruiter"


def test_admin_registration_requires_invitation_token(db_session):
    unique_id = uuid.uuid4().hex[:6]
    # 1. Invalid invite token fails with 403
    bad_req = AdminRegisterRequest(
        full_name="Unapproved Admin",
        email=f"admin_bad_{unique_id}@university.edu",
        password="AdminPassword123!",
        institution_name="NIT",
        admin_invitation_token="wrong_fake_token",
    )
    with pytest.raises(HTTPException) as exc:
        AuthService.register_admin(db_session, bad_req)
    assert exc.value.status_code == 403

    # 2. Valid invite token succeeds with 201
    good_req = AdminRegisterRequest(
        full_name="Approved Admin",
        email=f"admin_good_{unique_id}@university.edu",
        password="AdminPassword123!",
        institution_name="National Institute of Technology",
        admin_invitation_token="careerbridge_tpo_master_invite_token_2026",
    )
    user, tokens = AuthService.register_admin(db_session, good_req)
    assert user.role in [UserRole.TPO, UserRole.ADMIN]
    assert tokens.access_token is not None


def test_duplicate_email_rejection(db_session):
    unique_id = uuid.uuid4().hex[:6]
    req = StudentRegisterRequest(
        full_name="Duplicate Test",
        email=f"dup_{unique_id}@university.edu",
        password="Password123!",
        university="NIT",
        registration_number=f"DUP-{unique_id}",
        degree="B.Tech",
        department="IT",
        graduation_year=2026,
    )
    AuthService.register_student(db_session, req)

    # Attempt second registration with same email
    with pytest.raises(HTTPException) as exc:
        AuthService.register_student(db_session, req)
    assert exc.value.status_code == 400
    assert "already exists" in str(exc.value.detail)


def test_login_success_and_failure(db_session):
    unique_id = uuid.uuid4().hex[:6]
    email = f"login_{unique_id}@test.com"
    password = "CorrectPassword123!"

    req = StudentRegisterRequest(
        full_name="Login Test",
        email=email,
        password=password,
        university="NIT",
        registration_number=f"LOG-{unique_id}",
        degree="B.Tech",
        department="ECE",
        graduation_year=2026,
    )
    AuthService.register_student(db_session, req)

    # 1. Invalid password raises 401
    with pytest.raises(HTTPException) as exc:
        AuthService.login(db_session, email, "WrongPassword!")
    assert exc.value.status_code == 401

    # 2. Correct password returns tokens
    user, tokens = AuthService.login(db_session, email, password)
    assert tokens.access_token is not None
    assert tokens.refresh_token is not None
    assert user.email == email


def test_refresh_token_rotation_and_replay_detection(db_session):
    unique_id = uuid.uuid4().hex[:6]
    email = f"rotate_{unique_id}@test.com"
    password = "RotatePassword123!"

    req = StudentRegisterRequest(
        full_name="Rotate Test",
        email=email,
        password=password,
        university="NIT",
        registration_number=f"ROT-{unique_id}",
        degree="B.Tech",
        department="CS",
        graduation_year=2026,
    )
    user, tokens, _ = AuthService.register_student(db_session, req)
    first_refresh = tokens.refresh_token

    # 1. First refresh succeeds and rotates tokens
    new_tokens = AuthService.refresh(db_session, first_refresh)
    assert new_tokens.access_token != tokens.access_token
    assert new_tokens.refresh_token != first_refresh

    # 2. Replay attack: attempting to use the old refresh token again is rejected
    with pytest.raises(HTTPException) as exc:
        AuthService.refresh(db_session, first_refresh)
    assert exc.value.status_code == 401
    assert "revoked" in str(exc.value.detail).lower()


def test_password_reset_flow(db_session):
    unique_id = uuid.uuid4().hex[:6]
    email = f"reset_{unique_id}@test.com"
    old_password = "OldPassword123!"
    new_password = "NewArgon2Password123!"

    req = StudentRegisterRequest(
        full_name="Reset User",
        email=email,
        password=old_password,
        university="NIT",
        registration_number=f"RES-{unique_id}",
        degree="B.Tech",
        department="CS",
        graduation_year=2026,
    )
    user, _, _ = AuthService.register_student(db_session, req)

    # 1. Generate reset token
    reset_token = AuthService.forgot_password(db_session, email)
    assert reset_token is not None

    # 2. Reset password
    success = AuthService.reset_password(db_session, reset_token, new_password)
    assert success is True

    # 3. Old password no longer works
    with pytest.raises(HTTPException):
        AuthService.login(db_session, email, old_password)

    # 4. New password works
    user_after, tokens = AuthService.login(db_session, email, new_password)
    assert user_after.email == email
    assert tokens.access_token is not None


def test_email_verification_flow(db_session):
    unique_id = uuid.uuid4().hex[:6]
    email = f"verify_{unique_id}@test.com"
    req = StudentRegisterRequest(
        full_name="Verify User",
        email=email,
        password="Password123!",
        university="NIT",
        registration_number=f"VER-{unique_id}",
        degree="B.Tech",
        department="CS",
        graduation_year=2026,
    )
    user, _, verify_token = AuthService.register_student(db_session, req)
    assert user.is_verified is False

    # Verify email
    success = AuthService.verify_email(db_session, verify_token)
    assert success is True
    db_session.refresh(user)
    assert user.is_verified is True


def test_ownership_and_cross_role_guards(db_session):
    # 1. Cross-role check
    student_user = User(
        email=f"guard_{uuid.uuid4().hex[:4]}@nit.edu",
        password_hash="hash",
        role=UserRole.STUDENT,
        is_active=True,
    )
    recruiter_guard = require_roles(["recruiter", "admin"])

    # Student accessing recruiter endpoint raises 403
    with pytest.raises(HTTPException) as exc:
        recruiter_guard(current_user=student_user)
    assert exc.value.status_code == 403

    # 2. Ownership guard
    unique_id = uuid.uuid4().hex[:6]
    req1 = StudentRegisterRequest(
        full_name="Student 1",
        email=f"s1_{unique_id}@nit.edu",
        password="Password123!",
        university="NIT",
        registration_number=f"S1-{unique_id}",
        degree="B.Tech",
        department="CS",
        graduation_year=2026,
    )
    u1, _, _ = AuthService.register_student(db_session, req1)

    req2 = StudentRegisterRequest(
        full_name="Student 2",
        email=f"s2_{unique_id}@nit.edu",
        password="Password123!",
        university="NIT",
        registration_number=f"S2-{unique_id}",
        degree="B.Tech",
        department="CS",
        graduation_year=2026,
    )
    u2, _, _ = AuthService.register_student(db_session, req2)

    # u1 can access u1's profile
    assert verify_student_ownership(u1.student_profile.id, u1) is True

    # u1 attempting to access u2's profile raises 403
    with pytest.raises(HTTPException) as exc:
        verify_student_ownership(u2.student_profile.id, u1)
    assert exc.value.status_code == 403

