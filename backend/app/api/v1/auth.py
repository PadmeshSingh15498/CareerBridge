from typing import Optional
from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.schemas.common import ResponseEnvelope
from app.schemas.auth import (
    StudentRegisterRequest,
    RecruiterRegisterRequest,
    AdminRegisterRequest,
    UserRegisterRequest,
    UserLoginRequest,
    TokenRefreshRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
    TokenResponse,
    UserResponse,
    UserMeResponse,
)
from app.services.auth_service import AuthService
from app.core.config import settings

router = APIRouter()


def set_auth_cookies(response: Response, tokens: TokenResponse):
    """Sets secure HttpOnly cookies for access and refresh tokens."""
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/",
    )


def clear_auth_cookies(response: Response):
    """Clears HttpOnly authentication cookies upon logout."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")


@router.post("/register/student", response_model=ResponseEnvelope[TokenResponse], status_code=status.HTTP_201_CREATED)
def register_student(
    request: StudentRegisterRequest,
    req: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Dedicated Student registration endpoint initializing profile and academic record."""
    user, tokens, verify_token = AuthService.register_student(db, request, req)
    set_auth_cookies(response, tokens)
    return ResponseEnvelope(
        success=True,
        data=tokens,
        message="Student account created successfully. Welcome to CareerBridge!"
    )


@router.post("/register/recruiter", response_model=ResponseEnvelope[TokenResponse], status_code=status.HTTP_201_CREATED)
def register_recruiter(
    request: RecruiterRegisterRequest,
    req: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Dedicated Recruiter registration endpoint associating employer organization."""
    user, tokens, verify_token = AuthService.register_recruiter(db, request, req)
    set_auth_cookies(response, tokens)
    return ResponseEnvelope(
        success=True,
        data=tokens,
        message="Recruiter account created successfully. Company profile pending TPO verification."
    )


@router.post("/register/admin", response_model=ResponseEnvelope[TokenResponse], status_code=status.HTTP_201_CREATED)
def register_admin(
    request: AdminRegisterRequest,
    req: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Controlled Administrator / TPO registration endpoint.
    Requires an authorized institutional invitation token.
    """
    user, tokens = AuthService.register_admin(db, request, req)
    set_auth_cookies(response, tokens)
    return ResponseEnvelope(
        success=True,
        data=tokens,
        message="Administrator account successfully provisioned."
    )


@router.post("/register", response_model=ResponseEnvelope[TokenResponse], status_code=status.HTTP_201_CREATED)
def register_user(
    request: UserRegisterRequest,
    req: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Backward-compatible unified registration endpoint."""
    user, tokens = AuthService.register(db, request, req)
    set_auth_cookies(response, tokens)
    return ResponseEnvelope(
        success=True,
        data=tokens,
        message="Account registered successfully. Workspace profile initialized."
    )


@router.post("/login", response_model=ResponseEnvelope[TokenResponse])
def login_user(
    payload: UserLoginRequest,
    request: Request = None,
    response: Response = None,
    db: Session = Depends(get_db)
):
    """Authenticates user credentials, sets HttpOnly cookies, and returns JWT tokens."""
    user, tokens = AuthService.login(db, payload.email, payload.password, request)
    if response:
        set_auth_cookies(response, tokens)
    return ResponseEnvelope(
        success=True,
        data=tokens,
        message="Authentication successful."
    )


@router.post("/refresh", response_model=ResponseEnvelope[TokenResponse])
def refresh_token(
    request: TokenRefreshRequest,
    req: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Rotates refresh token and sets fresh HttpOnly cookies.
    Extracts refresh token from request body or HttpOnly cookie.
    """
    token_str = request.refresh_token or req.cookies.get("refresh_token")
    if not token_str:
        return ResponseEnvelope(
            success=False,
            data=None,
            message="No refresh token provided in body or cookies."
        )

    tokens = AuthService.refresh(db, token_str, req)
    set_auth_cookies(response, tokens)
    return ResponseEnvelope(
        success=True,
        data=tokens,
        message="Token refreshed successfully."
    )


@router.post("/logout", response_model=ResponseEnvelope[dict])
def logout_user(
    req: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Revokes active refresh tokens and clears HttpOnly cookies."""
    refresh_token = req.cookies.get("refresh_token")
    AuthService.logout(db, current_user.id, refresh_token, req)
    clear_auth_cookies(response)
    return ResponseEnvelope(
        success=True,
        data={"user_id": current_user.id, "logged_out": True},
        message="Successfully logged out. All session cookies cleared."
    )


@router.post("/forgot-password", response_model=ResponseEnvelope[dict])
def forgot_password(
    request: ForgotPasswordRequest,
    req: Request,
    db: Session = Depends(get_db)
):
    """Initiates password reset flow and mints signed token."""
    token = AuthService.forgot_password(db, request.email, req)
    return ResponseEnvelope(
        success=True,
        data={"reset_token": token, "email": request.email},
        message="If an account exists with this email, password reset instructions have been dispatched."
    )


@router.post("/reset-password", response_model=ResponseEnvelope[dict])
def reset_password(
    request: ResetPasswordRequest,
    req: Request,
    db: Session = Depends(get_db)
):
    """Resets password using Argon2id and revokes all active refresh tokens."""
    AuthService.reset_password(db, request.token, request.new_password, req)
    return ResponseEnvelope(
        success=True,
        data={"password_updated": True},
        message="Password has been successfully reset. Please log in with your new credentials."
    )


@router.post("/verify-email", response_model=ResponseEnvelope[dict])
def verify_email(
    request: VerifyEmailRequest,
    req: Request,
    db: Session = Depends(get_db)
):
    """Validates email verification token and marks user verified."""
    AuthService.verify_email(db, request.token, req)
    return ResponseEnvelope(
        success=True,
        data={"verified": True},
        message="Email address verified successfully."
    )


@router.get("/me", response_model=ResponseEnvelope[UserMeResponse])
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Returns authenticated user identity, role, and linked profile details."""
    details = {}
    full_name = "User"

    if current_user.role == UserRole.STUDENT and hasattr(current_user, "student_profile") and current_user.student_profile:
        sp = current_user.student_profile
        full_name = sp.full_name
        details = {
            "student_profile_id": sp.id,
            "roll_number": sp.roll_number,
            "phone_number": sp.phone_number,
            "city": sp.city,
            "placement_status": sp.placement_status.value if hasattr(sp.placement_status, "value") else str(sp.placement_status),
        }
    elif current_user.role == UserRole.RECRUITER and hasattr(current_user, "recruiter_profile") and current_user.recruiter_profile:
        rp = current_user.recruiter_profile
        full_name = current_user.email.split("@")[0].capitalize()
        details = {
            "recruiter_profile_id": rp.id,
            "company_id": rp.company_id,
            "designation": rp.designation,
            "is_primary_contact": rp.is_primary_contact,
        }
    elif current_user.role in [UserRole.ADMIN, UserRole.TPO]:
        full_name = "Placement Officer"
        details = {
            "institution": "National Institute of Technology",
            "department": "Training & Placement Cell"
        }

    return ResponseEnvelope(
        success=True,
        data=UserMeResponse(
            id=current_user.id,
            email=current_user.email,
            role=current_user.role.value,
            full_name=full_name,
            is_active=current_user.is_active,
            is_verified=current_user.is_verified,
            details=details,
        ),
        message="Authenticated profile retrieved."
    )
