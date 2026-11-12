import re
from typing import Optional, Any, Dict
from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class StudentRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150, description="Candidate's legal full name")
    email: str = Field(..., description="Student university or personal email")
    password: str = Field(..., min_length=8, description="Password with minimum 8 characters")
    university: str = Field(..., min_length=2, max_length=200, description="University or college name")
    registration_number: str = Field(..., min_length=3, max_length=50, description="College roll number / registration ID")
    degree: str = Field(..., min_length=2, max_length=150, description="E.g. B.Tech, M.Tech, MCA, B.Sc")
    department: str = Field(..., min_length=2, max_length=100, description="E.g. Computer Science, Information Technology")
    graduation_year: int = Field(..., ge=2024, le=2030, description="Anticipated graduation year")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid email address format.")
        return clean


class RecruiterRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150, description="Recruiting representative's full name")
    email: str = Field(..., description="Official corporate work email")
    password: str = Field(..., min_length=8, description="Password with minimum 8 characters")
    company_name: str = Field(..., min_length=2, max_length=200, description="Registered employer company name")
    designation: str = Field(..., min_length=2, max_length=150, description="E.g. Senior Technical University Recruiter")
    company_website: str = Field(..., min_length=4, max_length=255, description="Corporate website URL")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid corporate email format.")
        return clean


class AdminRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: str = Field(..., description="Institutional administrator email")
    password: str = Field(..., min_length=8)
    institution_name: str = Field(default="National Institute of Technology", min_length=2)
    admin_invitation_token: str = Field(..., description="Controlled secret token required to provision admin privileges")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid administrator email format.")
        return clean


class UserRegisterRequest(BaseModel):
    """Backward-compatible unified registration schema."""
    email: str = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8)
    role: str = Field(..., description="Role: 'student', 'recruiter', or 'tpo'")
    full_name: str = Field(..., min_length=2, max_length=150)
    
    # Student specific optional fields
    university: Optional[str] = None
    roll_number: Optional[str] = None
    registration_number: Optional[str] = None
    degree: Optional[str] = None
    department: Optional[str] = None
    graduation_year: Optional[int] = None
    
    # Recruiter specific optional fields
    company_name: Optional[str] = None
    company_website: Optional[str] = None
    designation: Optional[str] = None

    # Admin invite token if role is admin/tpo
    admin_invitation_token: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid email format.")
        return clean


class UserLoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid email format.")
        return clean


class TokenRefreshRequest(BaseModel):
    refresh_token: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid email address format.")
        return clean


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., description="Signed password reset token")
    new_password: str = Field(..., min_length=8, description="New password with minimum 8 characters")


class VerifyEmailRequest(BaseModel):
    token: str = Field(..., description="Signed email verification token")


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    email: str
    role: str
    full_name: str


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserMeResponse(BaseModel):
    id: str
    email: str
    role: str
    full_name: str
    is_active: bool
    is_verified: bool
    details: Dict[str, Any]
    model_config = ConfigDict(from_attributes=True)
