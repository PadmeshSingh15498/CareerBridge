import os
import time
import hashlib
from typing import Tuple, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, Request, status

from app.models.user import User, UserRole, AuditLog, RefreshToken
from app.models.student import StudentProfile, AcademicRecord, PlacementStatusEnum
from app.models.recruiter import Company, RecruiterProfile
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    create_password_reset_token,
    create_email_verification_token,
    decode_token,
)
from app.core.config import settings
from app.schemas.auth import (
    StudentRegisterRequest,
    RecruiterRegisterRequest,
    AdminRegisterRequest,
    UserRegisterRequest,
    TokenResponse,
)


class InMemoryRateLimiter:
    """
    Lightweight sliding window in-memory rate limiter for auth endpoints.
    Tracks failed attempts and requests per IP to mitigate credential stuffing and brute-force attacks.
    """
    def __init__(self):
        self.requests: Dict[str, list] = {}
        self.failed_attempts: Dict[str, list] = {}

    def is_rate_limited(self, key: str, max_requests: int = 15, window_seconds: int = 60) -> bool:
        if os.environ.get("TESTING") == "1":
            return False
        now = time.time()
        if key not in self.requests:
            self.requests[key] = []
        # Prune old timestamps
        self.requests[key] = [t for t in self.requests[key] if now - t < window_seconds]
        if len(self.requests[key]) >= max_requests:
            return True
        self.requests[key].append(now)
        return False

    def record_failed_login(self, key: str) -> None:
        now = time.time()
        if key not in self.failed_attempts:
            self.failed_attempts[key] = []
        self.failed_attempts[key].append(now)

    def is_login_locked(self, key: str, max_failures: int = 5, lock_seconds: int = 60) -> bool:
        if os.environ.get("TESTING") == "1":
            return False
        now = time.time()
        if key not in self.failed_attempts:
            return False
        self.failed_attempts[key] = [t for t in self.failed_attempts[key] if now - t < lock_seconds]
        return len(self.failed_attempts[key]) >= max_failures


auth_rate_limiter = InMemoryRateLimiter()


def get_client_ip(request: Optional[Request]) -> str:
    if not request:
        return "127.0.0.1"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


def get_user_agent(request: Optional[Request]) -> str:
    if not request:
        return "unknown"
    return request.headers.get("user-agent", "unknown")[:255]


class AuthService:

    @staticmethod
    def register_student(
        db: Session, request: StudentRegisterRequest, req: Optional[Request] = None
    ) -> Tuple[User, TokenResponse, str]:
        email_clean = request.email.lower().strip()
        client_ip = get_client_ip(req)

        # Rate check
        if auth_rate_limiter.is_rate_limited(f"reg_{client_ip}", max_requests=10, window_seconds=60):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many registration attempts. Please wait a minute before trying again."
            )

        existing = db.query(User).filter(User.email == email_clean).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists.",
            )

        # 1. Create User with Argon2id hash
        new_user = User(
            email=email_clean,
            password_hash=get_password_hash(request.password),
            role=UserRole.STUDENT,
            is_active=True,
            is_verified=False,
        )
        db.add(new_user)
        db.flush()

        # 2. Create Student Profile
        student_profile = StudentProfile(
            user_id=new_user.id,
            full_name=request.full_name.strip(),
            roll_number=request.registration_number.strip(),
            placement_status=PlacementStatusEnum.UNPLACED,
        )
        db.add(student_profile)
        db.flush()

        # 3. Create Academic Record
        academic = AcademicRecord(
            student_id=student_profile.id,
            institution_name=request.university.strip(),
            degree=request.degree.strip(),
            department=request.department.strip(),
            start_year=request.graduation_year - 4,
            end_year=request.graduation_year,
            cgpa_or_percentage=0.00,
            backlogs_count=0,
        )
        db.add(academic)

        # 4. Generate Auth Tokens & Email Verification Token
        access_token = create_access_token(subject=new_user.id, role=new_user.role.value)
        refresh_token = create_refresh_token(subject=new_user.id, role=new_user.role.value)
        verify_token = create_email_verification_token(subject=new_user.id, email=new_user.email)

        # Store Refresh Token for single-use rotation
        token_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
        db.add(RefreshToken(
            user_id=new_user.id,
            token_hash=token_hash,
            is_revoked=False,
            expires_at=datetime.now(timezone.utc)
        ))

        # 5. Audit Log
        db.add(AuditLog(
            user_id=new_user.id,
            action="REGISTER_STUDENT",
            resource_type="user",
            resource_id=new_user.id,
            ip_address=client_ip,
            user_agent=get_user_agent(req),
            details_json={
                "department": request.department,
                "graduation_year": request.graduation_year,
                "roll_number": request.registration_number
            }
        ))

        db.commit()
        db.refresh(new_user)

        token_response = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user_id=new_user.id,
            email=new_user.email,
            role=new_user.role.value,
            full_name=student_profile.full_name,
        )

        return new_user, token_response, verify_token

    @staticmethod
    def register_recruiter(
        db: Session, request: RecruiterRegisterRequest, req: Optional[Request] = None
    ) -> Tuple[User, TokenResponse, str]:
        email_clean = request.email.lower().strip()
        client_ip = get_client_ip(req)

        if auth_rate_limiter.is_rate_limited(f"reg_{client_ip}", max_requests=10, window_seconds=60):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many registration attempts. Please wait a minute before trying again."
            )

        existing = db.query(User).filter(User.email == email_clean).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this work email already exists.",
            )

        # 1. Create User
        new_user = User(
            email=email_clean,
            password_hash=get_password_hash(request.password),
            role=UserRole.RECRUITER,
            is_active=True,
            is_verified=False,
        )
        db.add(new_user)
        db.flush()

        # 2. Find or Create Company
        comp = db.query(Company).filter(Company.name == request.company_name.strip()).first()
        if not comp:
            comp = Company(
                name=request.company_name.strip(),
                website_url=request.company_website.strip(),
                industry="Enterprise Software & Services",
                is_verified=False,  # Unverified until TPO approves
            )
            db.add(comp)
            db.flush()

        # 3. Create Recruiter Profile
        recruiter_profile = RecruiterProfile(
            user_id=new_user.id,
            company_id=comp.id,
            designation=request.designation.strip(),
            is_primary_contact=True,
        )
        db.add(recruiter_profile)

        # 4. Mint Tokens
        access_token = create_access_token(subject=new_user.id, role=new_user.role.value)
        refresh_token = create_refresh_token(subject=new_user.id, role=new_user.role.value)
        verify_token = create_email_verification_token(subject=new_user.id, email=new_user.email)

        token_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
        db.add(RefreshToken(
            user_id=new_user.id,
            token_hash=token_hash,
            is_revoked=False,
            expires_at=datetime.now(timezone.utc)
        ))

        # 5. Audit Log
        db.add(AuditLog(
            user_id=new_user.id,
            action="REGISTER_RECRUITER",
            resource_type="user",
            resource_id=new_user.id,
            ip_address=client_ip,
            user_agent=get_user_agent(req),
            details_json={
                "company_name": request.company_name,
                "designation": request.designation
            }
        ))

        db.commit()
        db.refresh(new_user)

        token_response = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user_id=new_user.id,
            email=new_user.email,
            role=new_user.role.value,
            full_name=request.full_name.strip(),
        )

        return new_user, token_response, verify_token

    @staticmethod
    def register_admin(
        db: Session, request: AdminRegisterRequest, req: Optional[Request] = None
    ) -> Tuple[User, TokenResponse]:
        """
        Controlled Administrator & TPO provisioning.
        Strictly forbids unrestricted public registration by validating an administrative invitation token.
        """
        if request.admin_invitation_token != settings.ADMIN_INVITE_TOKEN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unrestricted administrator registration is strictly prohibited. An authorized institutional invitation token is required."
            )

        email_clean = request.email.lower().strip()
        existing = db.query(User).filter(User.email == email_clean).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An administrator with this email already exists."
            )

        new_user = User(
            email=email_clean,
            password_hash=get_password_hash(request.password),
            role=UserRole.TPO,
            is_active=True,
            is_verified=True,
        )
        db.add(new_user)
        db.flush()

        access_token = create_access_token(subject=new_user.id, role=new_user.role.value)
        refresh_token = create_refresh_token(subject=new_user.id, role=new_user.role.value)

        token_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
        db.add(RefreshToken(
            user_id=new_user.id,
            token_hash=token_hash,
            is_revoked=False,
            expires_at=datetime.now(timezone.utc)
        ))

        client_ip = get_client_ip(req)
        db.add(AuditLog(
            user_id=new_user.id,
            action="REGISTER_ADMIN_INVITATION",
            resource_type="user",
            resource_id=new_user.id,
            ip_address=client_ip,
            user_agent=get_user_agent(req),
            details_json={"institution": request.institution_name}
        ))

        db.commit()
        db.refresh(new_user)

        token_response = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user_id=new_user.id,
            email=new_user.email,
            role=new_user.role.value,
            full_name=request.full_name.strip(),
        )

        return new_user, token_response

    @staticmethod
    def register(db: Session, request: UserRegisterRequest, req: Optional[Request] = None) -> Tuple[User, TokenResponse]:
        """Backward-compatible unified registration adapter routing to role-specific methods."""
        role_lower = request.role.lower().strip()
        if role_lower == "student":
            stu_req = StudentRegisterRequest(
                full_name=request.full_name,
                email=request.email,
                password=request.password,
                university=request.university or "National Institute of Technology",
                registration_number=request.registration_number or request.roll_number or f"2026CSB{request.email[:4].upper()}",
                degree=request.degree or "B.Tech in Computer Science",
                department=request.department or "Computer Science",
                graduation_year=request.graduation_year or 2026,
            )
            u, tr, _ = AuthService.register_student(db, stu_req, req)
            return u, tr
        elif role_lower == "recruiter":
            rec_req = RecruiterRegisterRequest(
                full_name=request.full_name,
                email=request.email,
                password=request.password,
                company_name=request.company_name or f"{request.full_name} Corp",
                designation=request.designation or "University Talent Recruiter",
                company_website=request.company_website or "https://example.com",
            )
            u, tr, _ = AuthService.register_recruiter(db, rec_req, req)
            return u, tr
        elif role_lower in ["tpo", "admin"]:
            if not request.admin_invitation_token:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Public admin registration is not permitted. Please provide an admin invitation token."
                )
            adm_req = AdminRegisterRequest(
                full_name=request.full_name,
                email=request.email,
                password=request.password,
                institution_name="National Institute of Technology",
                admin_invitation_token=request.admin_invitation_token,
            )
            return AuthService.register_admin(db, adm_req, req)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid registration role '{request.role}'. Allowed roles: student, recruiter, tpo."
            )

    @staticmethod
    def login(
        db: Session, email: str, password: str, req: Optional[Request] = None
    ) -> Tuple[User, TokenResponse]:
        client_ip = get_client_ip(req)
        lock_key = f"login_fail_{email.lower().strip()}_{client_ip}"

        # 1. Rate limiter lock check
        if auth_rate_limiter.is_login_locked(lock_key, max_failures=5, lock_seconds=60):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed login attempts. Account temporarily locked for 60 seconds."
            )

        user = db.query(User).filter(User.email == email.lower().strip()).first()

        # 2. Verify password with Argon2 (and bcrypt backward compatibility)
        if not user or not verify_password(password, user.password_hash):
            auth_rate_limiter.record_failed_login(lock_key)
            db.add(AuditLog(
                user_id=user.id if user else None,
                action="LOGIN_FAILURE",
                resource_type="user",
                resource_id=email,
                ip_address=client_ip,
                user_agent=get_user_agent(req),
                details_json={"reason": "invalid_credentials", "attempted_email": email}
            ))
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 3. Account active check
        if not user.is_active:
            db.add(AuditLog(
                user_id=user.id,
                action="LOGIN_LOCKED",
                resource_type="user",
                resource_id=user.id,
                ip_address=client_ip,
                user_agent=get_user_agent(req),
                details_json={"reason": "account_deactivated"}
            ))
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated. Please contact the placement office.",
            )

        # 4. Transparent upgrade of legacy bcrypt hashes to Argon2id
        if user.password_hash.startswith("$2b$") or user.password_hash.startswith("$2a$"):
            user.password_hash = get_password_hash(password)
            db.flush()

        # 5. Mint JWT Tokens
        access_token = create_access_token(subject=user.id, role=user.role.value)
        refresh_token = create_refresh_token(subject=user.id, role=user.role.value)

        # Record Refresh Token in Database for Rotation Tracking
        token_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
        db.add(RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            is_revoked=False,
            expires_at=datetime.now(timezone.utc)
        ))

        # 6. Audit Success Log
        db.add(AuditLog(
            user_id=user.id,
            action="LOGIN_SUCCESS",
            resource_type="user",
            resource_id=user.id,
            ip_address=client_ip,
            user_agent=get_user_agent(req),
            details_json={"role": user.role.value}
        ))
        db.commit()

        # Resolve full name
        full_name = "User"
        if user.role == UserRole.STUDENT and hasattr(user, "student_profile") and user.student_profile:
            full_name = user.student_profile.full_name
        elif user.role == UserRole.RECRUITER and hasattr(user, "recruiter_profile") and user.recruiter_profile:
            full_name = user.email.split("@")[0].capitalize()
        elif user.role in [UserRole.ADMIN, UserRole.TPO]:
            full_name = "Placement Officer"

        token_response = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user_id=user.id,
            email=user.email,
            role=user.role.value,
            full_name=full_name,
        )

        return user, token_response

    @staticmethod
    def refresh(db: Session, refresh_token_str: str, req: Optional[Request] = None) -> TokenResponse:
        """
        Refresh token rotation:
        Validates refresh token, checks that it is not revoked, invalidates it, and issues a fresh token pair.
        """
        payload = decode_token(refresh_token_str)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
            )

        token_hash = hashlib.sha256(refresh_token_str.encode("utf-8")).hexdigest()
        token_record = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

        # Replay Attack Detection: If token is already revoked, invalidate ALL user tokens
        if token_record and token_record.is_revoked:
            user_id = payload.get("sub")
            db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({"is_revoked": True})
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Revoked refresh token presented. Security violation detected: all sessions terminated.",
            )

        # Invalidate the used refresh token (Rotation)
        if token_record:
            token_record.is_revoked = True
        else:
            # If not tracked yet, store as revoked
            db.add(RefreshToken(
                user_id=payload.get("sub"),
                token_hash=token_hash,
                is_revoked=True,
                expires_at=datetime.now(timezone.utc)
            ))

        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User associated with token is inactive or not found.",
            )

        # Issue fresh token pair
        new_access_token = create_access_token(subject=user.id, role=user.role.value)
        new_refresh_token = create_refresh_token(subject=user.id, role=user.role.value)

        # Store newly issued refresh token
        new_token_hash = hashlib.sha256(new_refresh_token.encode("utf-8")).hexdigest()
        db.add(RefreshToken(
            user_id=user.id,
            token_hash=new_token_hash,
            is_revoked=False,
            expires_at=datetime.now(timezone.utc)
        ))

        db.commit()

        # Resolve full name
        full_name = "User"
        if user.role == UserRole.STUDENT and hasattr(user, "student_profile") and user.student_profile:
            full_name = user.student_profile.full_name

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user_id=user.id,
            email=user.email,
            role=user.role.value,
            full_name=full_name,
        )

    @staticmethod
    def logout(db: Session, user_id: str, refresh_token_str: Optional[str] = None, req: Optional[Request] = None):
        """Invalidates user refresh tokens and logs out session."""
        if refresh_token_str:
            token_hash = hashlib.sha256(refresh_token_str.encode("utf-8")).hexdigest()
            db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).update({"is_revoked": True})
        else:
            db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({"is_revoked": True})

        client_ip = get_client_ip(req)
        db.add(AuditLog(
            user_id=user_id,
            action="LOGOUT",
            resource_type="user",
            resource_id=user_id,
            ip_address=client_ip,
            user_agent=get_user_agent(req),
        ))
        db.commit()

    @staticmethod
    def forgot_password(db: Session, email: str, req: Optional[Request] = None) -> str:
        """Generates password reset token and audits request."""
        user = db.query(User).filter(User.email == email.lower().strip()).first()
        if not user:
            # Prevent email enumeration by returning a mock token/success message
            return create_password_reset_token(subject="mock-id", email=email)

        token = create_password_reset_token(subject=user.id, email=user.email)
        client_ip = get_client_ip(req)
        db.add(AuditLog(
            user_id=user.id,
            action="FORGOT_PASSWORD_REQUEST",
            resource_type="user",
            resource_id=user.id,
            ip_address=client_ip,
            user_agent=get_user_agent(req),
        ))
        db.commit()
        return token

    @staticmethod
    def reset_password(db: Session, token: str, new_password: str, req: Optional[Request] = None) -> bool:
        """Verifies reset token, updates password hash using Argon2id, and revokes all active refresh tokens."""
        payload = decode_token(token)
        if not payload or payload.get("type") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid, tampered, or expired password reset token."
            )

        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User associated with this reset token not found."
            )

        # Update password with Argon2
        user.password_hash = get_password_hash(new_password)
        # Invalidate all active refresh tokens for security
        db.query(RefreshToken).filter(RefreshToken.user_id == user.id).update({"is_revoked": True})

        client_ip = get_client_ip(req)
        db.add(AuditLog(
            user_id=user.id,
            action="RESET_PASSWORD_SUCCESS",
            resource_type="user",
            resource_id=user.id,
            ip_address=client_ip,
            user_agent=get_user_agent(req),
        ))
        db.commit()
        return True

    @staticmethod
    def verify_email(db: Session, token: str, req: Optional[Request] = None) -> bool:
        """Verifies user email via signed token."""
        payload = decode_token(token)
        if not payload or payload.get("type") != "email_verification":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired email verification token."
            )

        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        user.is_verified = True
        client_ip = get_client_ip(req)
        db.add(AuditLog(
            user_id=user.id,
            action="EMAIL_VERIFIED",
            resource_type="user",
            resource_id=user.id,
            ip_address=client_ip,
            user_agent=get_user_agent(req),
        ))
        db.commit()
        return True
