import enum
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.models.base import generate_uuid, TimestampMixin


class CompanySizeEnum(str, enum.Enum):
    TIER_1_10 = "1-10"
    TIER_11_50 = "11-50"
    TIER_51_200 = "51-200"
    TIER_201_1000 = "201-1000"
    TIER_1000_PLUS = "1000+"


class Company(Base):
    __tablename__ = "companies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), unique=True, nullable=False, index=True)
    website_url = Column(String(255), nullable=False)
    industry = Column(String(100), nullable=False, index=True)
    company_size = Column(Enum(CompanySizeEnum), default=CompanySizeEnum.TIER_51_200, nullable=False)
    headquarters = Column(String(150), nullable=True)
    logo_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    hr_contact_name = Column(String(150), nullable=True)
    hr_contact_email = Column(String(255), nullable=True)
    hr_contact_phone = Column(String(50), nullable=True)
    verification_status = Column(String(50), default="pending_verification", nullable=False)  # pending_verification, verified, rejected
    is_verified = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    recruiters = relationship("RecruiterProfile", back_populates="company", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="company", cascade="all, delete-orphan")
    placement_drives = relationship("PlacementDrive", back_populates="company")


class RecruiterProfile(Base):
    __tablename__ = "recruiter_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    designation = Column(String(100), nullable=False)
    work_phone = Column(String(20), nullable=True)
    is_primary_contact = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="recruiter_profile")
    company = relationship("Company", back_populates="recruiters")
    jobs = relationship("Job", back_populates="poster", cascade="all, delete-orphan")

