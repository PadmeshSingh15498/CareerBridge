from typing import Any, List, Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
):
    """
    Extracts authentication token from Authorization Bearer header or HttpOnly access_token cookie.
    Validates JWT signature, token type, and expiration, returning the User ORM object.
    """
    token: Optional[str] = None

    # 1. Prefer Authorization Bearer header if provided
    if credentials and credentials.credentials:
        token = credentials.credentials
    # 2. Otherwise extract from secure HttpOnly cookie
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")
    # 3. Fallback for direct browser document downloads/window.open via query parameter
    elif "token" in request.query_params:
        token = request.query_params.get("token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject identifier.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Late import to prevent circular dependency
    from app.models.user import User
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this token does not exist.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_optional_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Optional[Any]:
    """
    Extracts authenticated user if present in Bearer header or cookie,
    otherwise returns None without raising 401. Useful for public discovery routes.
    """
    token: Optional[str] = None
    if credentials and credentials.credentials:
        token = credentials.credentials
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")
    elif "token" in request.query_params:
        token = request.query_params.get("token")

    if not token:
        return None

    try:
        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        from app.models.user import User
        return db.query(User).filter(User.id == user_id, User.is_active == True).first()
    except Exception:
        return None


def get_current_active_user(
    current_user = Depends(get_current_user),
):
    """Ensures authenticated user account is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Please contact administrator.",
        )
    return current_user


def get_current_verified_user(
    current_user = Depends(get_current_active_user),
):
    """Ensures authenticated user has verified their email address."""
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required before accessing this protected resource.",
        )
    return current_user


def require_roles(allowed_roles: List[str]):
    """
    Dependency factory that enforces Role-Based Access Control (RBAC).
    Usage: Depends(require_roles(["student", "admin"]))
    """
    def role_checker(current_user = Depends(get_current_active_user)):
        user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        normalized_allowed = [r.value if hasattr(r, "value") else str(r) for r in allowed_roles]
        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(normalized_allowed)}. Your role: {user_role}.",
            )
        return current_user

    return role_checker


def verify_student_ownership(student_profile_id: str, current_user):
    """
    Verifies that the authenticated student owns the resource.
    Placement officers and Administrators are granted institutional access.
    """
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if user_role in ["admin", "tpo"]:
        return True

    if user_role == "student":
        if hasattr(current_user, "student_profile") and current_user.student_profile:
            if current_user.student_profile.id == student_profile_id:
                return True

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Ownership verification failed: You can only view or modify your own student records."
    )


def verify_recruiter_ownership(company_id: str, current_user):
    """
    Verifies that the recruiter belongs to the specified company.
    Placement officers and Administrators are granted institutional oversight.
    """
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if user_role in ["admin", "tpo"]:
        return True

    if user_role == "recruiter":
        if hasattr(current_user, "recruiter_profile") and current_user.recruiter_profile:
            if current_user.recruiter_profile.company_id == company_id:
                return True

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Organization authorization failed: You can only manage jobs and applicants for your own verified company."
    )
