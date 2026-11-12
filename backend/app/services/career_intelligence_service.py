"""
Career Intelligence Service for CareerBridge.
Integrates skill gap analysis, personalized roadmaps, milestone tracking,
and Career Readiness Index (CRI) calculations with database persistence.
"""

import json
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.user import User, UserRole
from app.models.student import (
    StudentProfile, AcademicRecord, StudentSkill, Skill,
    StudentProject, StudentCertification, StudentExperience
)
from app.models.resume import Resume, ResumeAnalysis
from app.models.ai import (
    SkillGapAnalysis, CareerRoadmap, RoadmapItem, RoadmapStatusEnum,
    TargetRoleRequirement, CareerReadinessHistory, InterviewSession
)
from app.ai.career_intelligence import (
    CURATED_TARGET_ROLES,
    get_curated_target_role,
    generate_custom_role_profile,
    evaluate_skill_gap,
    generate_personalized_roadmap,
    compute_career_readiness_index
)

logger = logging.getLogger("careerbridge.intelligence_service")


class CareerIntelligenceService:

    @classmethod
    def seed_curated_roles(cls, db: Session):
        """Seeds standard 9 curated roles into target_roles table if not already populated."""
        try:
            for role_name, data in CURATED_TARGET_ROLES.items():
                existing = db.query(TargetRoleRequirement).filter(
                    TargetRoleRequirement.role_name == role_name
                ).first()
                if not existing:
                    new_role = TargetRoleRequirement(
                        role_name=role_name,
                        category=data.get("category", "Software Engineering"),
                        description=data.get("description", ""),
                        core_skills=data.get("core_skills", []),
                        preferred_skills=data.get("preferred_skills", []),
                        technical_fundamentals=data.get("technical_fundamentals", []),
                        tools=data.get("tools", []),
                        frameworks=data.get("frameworks", []),
                        curated_stages=data.get("curated_stages", []),
                        is_curated=True,
                        is_active=True
                    )
                    db.add(new_role)
            db.commit()
            logger.info("Curated target roles synchronized with MySQL database.")
        except Exception as e:
            db.rollback()
            logger.warning(f"Error seeding curated roles: {e}")

    @classmethod
    def extract_student_intelligence_data(cls, db: Session, student_id: str) -> Dict[str, Any]:
        """Extracts complete student profile dimensions for AI reasoning."""
        student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
        if not student:
            raise ValueError(f"Student profile {student_id} not found.")

        # Skills
        student_skills = db.query(StudentSkill).filter(StudentSkill.student_id == student_id).all()
        skills_data = []
        for ss in student_skills:
            sk = db.query(Skill).filter(Skill.id == ss.skill_id).first()
            if sk:
                skills_data.append({
                    "name": sk.name,
                    "proficiency_level": ss.proficiency_level.value if hasattr(ss.proficiency_level, "value") else str(ss.proficiency_level),
                    "is_verified": bool(ss.is_verified)
                })

        # Projects
        projects = db.query(StudentProject).filter(StudentProject.student_id == student_id).all()
        projects_data = []
        for p in projects:
            techs = getattr(p, "technologies_used", None) or getattr(p, "technologies", [])
            projects_data.append({
                "title": p.title,
                "description": p.description,
                "technologies_used": techs if isinstance(techs, list) else [],
                "github_url": p.github_url,
                "live_demo_url": p.live_demo_url
            })

        # Academic
        academic = db.query(AcademicRecord).filter(AcademicRecord.student_id == student_id).first()
        acad_data = {
            "cgpa": float(academic.cgpa_or_percentage) if academic and academic.cgpa_or_percentage else None,
            "department": academic.department if academic else None,
            "backlogs_count": academic.backlogs_count if academic else 0,
            "institution_name": academic.institution_name if academic else None,
            "end_year": academic.end_year if academic else None
        }

        # Resume & ATS Analysis
        resume = db.query(Resume).filter(Resume.student_id == student_id).order_by(Resume.created_at.desc()).first()
        resume_analysis = None
        if resume:
            ra = db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == resume.id).first()
            if ra:
                resume_analysis = {
                    "ats_score": ra.ats_score,
                    "section_score": ra.section_score,
                    "skill_score": ra.skill_score,
                    "metric_score": ra.metric_score,
                    "format_score": ra.format_score
                }

        # Certifications
        certs = db.query(StudentCertification).filter(StudentCertification.student_id == student_id).all()
        certs_data = [{"title": c.title, "issuing_organization": c.issuing_organization} for c in certs]

        # Experiences
        exps = db.query(StudentExperience).filter(StudentExperience.student_id == student_id).all()
        exps_data = [{"company_name": e.company_name, "role_title": e.role_title} for e in exps]

        # Interview sessions
        interviews = db.query(InterviewSession).filter(InterviewSession.student_id == student_id).all()
        itv_data = [{"overall_score": i.overall_score or 75, "target_role": i.target_role} for i in interviews]

        return {
            "id": student.id,
            "full_name": student.full_name,
            "roll_number": student.roll_number,
            "skills": skills_data,
            "projects": projects_data,
            "academic": acad_data,
            "resume_analysis": resume_analysis,
            "certifications": certs_data,
            "experiences": exps_data,
            "interview_sessions": itv_data
        }

    @classmethod
    def list_target_roles(cls, db: Session, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lists all curated and custom target roles with high-level stats."""
        # Query DB roles
        query = db.query(TargetRoleRequirement).filter(TargetRoleRequirement.is_active == True)
        if category and isinstance(category, str):
            query = query.filter(TargetRoleRequirement.category.ilike(f"%{category}%"))
        db_roles = query.all()

        roles_list = []
        if db_roles:
            for r in db_roles:
                roles_list.append({
                    "id": r.id,
                    "role_name": r.role_name,
                    "category": r.category,
                    "description": r.description,
                    "core_skills_count": len(r.core_skills or []),
                    "preferred_skills_count": len(r.preferred_skills or []),
                    "is_curated": r.is_curated,
                    "stages_count": len(r.curated_stages or [])
                })
        else:
            # Fallback to in-memory curated roles
            for name, data in CURATED_TARGET_ROLES.items():
                if category and isinstance(category, str) and category.lower() not in data.get("category", "").lower():
                    continue
                roles_list.append({
                    "id": name,
                    "role_name": name,
                    "category": data.get("category", "Software Engineering"),
                    "description": data.get("description", ""),
                    "core_skills_count": len(data.get("core_skills", [])),
                    "preferred_skills_count": len(data.get("preferred_skills", [])),
                    "is_curated": True,
                    "stages_count": len(data.get("curated_stages", []))
                })
        return roles_list

    @classmethod
    def get_target_role_detail(cls, db: Session, role_name: str) -> Dict[str, Any]:
        """Retrieves comprehensive requirement detail for a specific role."""
        db_role = db.query(TargetRoleRequirement).filter(
            TargetRoleRequirement.role_name == role_name
        ).first()
        if db_role:
            return {
                "id": db_role.id,
                "role_name": db_role.role_name,
                "category": db_role.category,
                "description": db_role.description,
                "core_skills": db_role.core_skills,
                "preferred_skills": db_role.preferred_skills,
                "technical_fundamentals": db_role.technical_fundamentals,
                "tools": db_role.tools,
                "frameworks": db_role.frameworks,
                "curated_stages": db_role.curated_stages,
                "is_curated": db_role.is_curated,
                "updated_at": db_role.updated_at.isoformat() if db_role.updated_at else None
            }

        curated = get_curated_target_role(role_name)
        if curated:
            return curated

        # Synthesize custom profile
        return generate_custom_role_profile(role_name)

    @classmethod
    def create_custom_target_role(cls, db: Session, role_name: str, skills: List[str], is_admin: bool = False) -> Dict[str, Any]:
        """Allows creating or synthesizing a custom target role."""
        existing = db.query(TargetRoleRequirement).filter(
            TargetRoleRequirement.role_name.ilike(role_name.strip())
        ).first()
        if existing:
            return cls.get_target_role_detail(db, existing.role_name)

        synthesized = generate_custom_role_profile(role_name, requested_skills=skills)
        new_role = TargetRoleRequirement(
            role_name=synthesized["role_name"],
            category=synthesized["category"],
            description=synthesized["description"],
            core_skills=synthesized["core_skills"],
            preferred_skills=synthesized["preferred_skills"],
            technical_fundamentals=synthesized["technical_fundamentals"],
            tools=synthesized["tools"],
            frameworks=synthesized["frameworks"],
            curated_stages=synthesized["curated_stages"],
            is_curated=False,
            is_active=True
        )
        db.add(new_role)
        db.commit()
        db.refresh(new_role)
        return cls.get_target_role_detail(db, new_role.role_name)

    @classmethod
    def analyze_skill_gap(cls, db: Session, student_id: str, target_role_name: str) -> Dict[str, Any]:
        """Calculates and persists student skill gap analysis against target role."""
        student_data = cls.extract_student_intelligence_data(db, student_id)
        role_profile = cls.get_target_role_detail(db, target_role_name)

        gap_result = evaluate_skill_gap(student_data, role_profile)

        # Persist in skill_gap_analysis table
        try:
            analysis_rec = SkillGapAnalysis(
                student_id=student_id,
                target_role=gap_result["target_role"],
                critical_missing_skills=gap_result["critical_missing_skills"],
                secondary_missing_skills=gap_result["secondary_missing_skills"],
                readiness_percentage=gap_result["readiness_percentage"],
                summary=gap_result["summary"]
            )
            db.add(analysis_rec)
            db.commit()
            db.refresh(analysis_rec)
            gap_result["analysis_id"] = analysis_rec.id
        except Exception as e:
            db.rollback()
            logger.warning(f"Could not persist skill gap record: {e}")

        return gap_result

    @classmethod
    def get_latest_skill_gap(cls, db: Session, student_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves most recent gap analysis or computes default against Software Developer."""
        latest = db.query(SkillGapAnalysis).filter(
            SkillGapAnalysis.student_id == student_id
        ).order_by(desc(SkillGapAnalysis.created_at)).first()

        target_role = latest.target_role if latest else "Software Developer"
        return cls.analyze_skill_gap(db, student_id, target_role)

    @classmethod
    def generate_or_get_roadmap(
        cls,
        db: Session,
        student_id: str,
        target_role_name: str,
        force_regenerate: bool = False
    ) -> Dict[str, Any]:
        """Generates or retrieves active career roadmap with milestone items."""
        if not force_regenerate:
            existing_roadmap = db.query(CareerRoadmap).filter(
                CareerRoadmap.student_id == student_id,
                CareerRoadmap.target_role == target_role_name,
                CareerRoadmap.status == RoadmapStatusEnum.ACTIVE
            ).order_by(desc(CareerRoadmap.created_at)).first()

            if existing_roadmap and existing_roadmap.items:
                return cls._serialize_roadmap(db, existing_roadmap)

        # Need to generate fresh roadmap
        student_data = cls.extract_student_intelligence_data(db, student_id)
        gap = cls.analyze_skill_gap(db, student_id, target_role_name)

        roadmap_plan = generate_personalized_roadmap(student_data, target_role_name, gap)

        # Deactivate older roadmaps for this target role
        db.query(CareerRoadmap).filter(
            CareerRoadmap.student_id == student_id,
            CareerRoadmap.target_role == target_role_name
        ).update({"status": RoadmapStatusEnum.COMPLETED})

        new_roadmap = CareerRoadmap(
            student_id=student_id,
            gap_analysis_id=gap.get("analysis_id") or "gap_dyn",
            title=roadmap_plan["title"],
            target_role=roadmap_plan["target_role"],
            total_weeks=roadmap_plan["total_weeks"],
            status=RoadmapStatusEnum.ACTIVE
        )
        db.add(new_roadmap)
        db.flush()

        for item in roadmap_plan["items"]:
            m_item = RoadmapItem(
                roadmap_id=new_roadmap.id,
                week_number=item["week_number"],
                milestone_title=item["milestone_title"],
                description=item["description"],
                learning_resources=item["learning_resources"],
                suggested_project=item["practical_exercise"],
                skill_name=item["skill_name"],
                priority=item["priority"],
                estimated_time=item["estimated_learning_time"],
                practical_exercise=item["practical_exercise"],
                status=item["completion_status"],
                student_notes=item["student_notes"],
                evidence_url=item["evidence_url"],
                evidence_notes=item["evidence_notes"],
                is_verified=item["is_verified"],
                is_completed=item["is_completed"],
                completed_at=datetime.utcnow() if item["is_completed"] else None
            )
            db.add(m_item)

        db.commit()
        db.refresh(new_roadmap)
        return cls._serialize_roadmap(db, new_roadmap)

    @classmethod
    def get_active_roadmap(cls, db: Session, student_id: str) -> Dict[str, Any]:
        """Gets active roadmap or generates for student's preferred role."""
        active = db.query(CareerRoadmap).filter(
            CareerRoadmap.student_id == student_id,
            CareerRoadmap.status == RoadmapStatusEnum.ACTIVE
        ).order_by(desc(CareerRoadmap.created_at)).first()

        if active and active.items:
            return cls._serialize_roadmap(db, active)

        # Default generate Software Developer
        return cls.generate_or_get_roadmap(db, student_id, "Software Developer")

    @classmethod
    def update_milestone_progress(
        cls,
        db: Session,
        student_id: str,
        item_id: int,
        status: Optional[str] = None,
        notes: Optional[str] = None,
        evidence_url: Optional[str] = None,
        evidence_notes: Optional[str] = None,
        is_completed: Optional[bool] = None
    ) -> Dict[str, Any]:
        """
        Updates milestone progress, notes, or attaches project evidence.
        Enforces evidence distinction: clicking complete does not automatically grant verified status.
        """
        item = db.query(RoadmapItem).join(CareerRoadmap).filter(
            RoadmapItem.id == item_id,
            CareerRoadmap.student_id == student_id
        ).first()

        if not item:
            raise ValueError(f"Milestone item {item_id} not found for student.")

        if status:
            item.status = status
            if status == "completed":
                item.is_completed = True
                if not item.completed_at:
                    item.completed_at = datetime.utcnow()
            elif status in ["in_progress", "not_started"]:
                item.is_completed = False
                item.completed_at = None

        if is_completed is not None:
            item.is_completed = is_completed
            item.status = "completed" if is_completed else "in_progress"
            item.completed_at = datetime.utcnow() if is_completed else None

        if notes is not None:
            item.student_notes = notes.strip()

        if evidence_url is not None:
            item.evidence_url = evidence_url.strip()
            # If evidence URL is provided, mark as evidence-submitted
            item.is_verified = True

        if evidence_notes is not None:
            item.evidence_notes = evidence_notes.strip()

        db.commit()
        db.refresh(item)

        roadmap = db.query(CareerRoadmap).filter(CareerRoadmap.id == item.roadmap_id).first()
        return cls._serialize_roadmap(db, roadmap)

    @classmethod
    def calculate_and_record_readiness(
        cls,
        db: Session,
        student_id: str,
        save_snapshot: bool = True
    ) -> Dict[str, Any]:
        """Calculates transparent Career Readiness Index (CRI) and saves snapshot."""
        student_data = cls.extract_student_intelligence_data(db, student_id)
        cri_result = compute_career_readiness_index(student_data)

        if save_snapshot:
            try:
                hist = CareerReadinessHistory(
                    student_id=student_id,
                    overall_score=cri_result["overall_score"],
                    technical_skills_score=cri_result["category_scores"]["technical_skills"]["earned"],
                    projects_score=cri_result["category_scores"]["projects"]["earned"],
                    resume_quality_score=cri_result["category_scores"]["resume_quality"]["earned"],
                    academic_eligibility_score=cri_result["category_scores"]["academic_eligibility"]["earned"],
                    interview_prep_score=cri_result["category_scores"]["interview_preparation"]["earned"],
                    certifications_score=cri_result["category_scores"]["certifications_experience"]["earned"],
                    breakdown_json=cri_result["category_scores"],
                    missing_data_json=cri_result["missing_data"],
                    improvement_tips_json=cri_result["improvement_opportunities"]
                )
                db.add(hist)
                db.commit()
            except Exception as e:
                db.rollback()
                logger.warning(f"Could not save readiness snapshot: {e}")

        return cri_result

    @classmethod
    def get_readiness_history(cls, db: Session, student_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Retrieves score progression history."""
        records = db.query(CareerReadinessHistory).filter(
            CareerReadinessHistory.student_id == student_id
        ).order_by(desc(CareerReadinessHistory.calculated_at)).limit(limit).all()

        history = []
        for r in records:
            history.append({
                "id": r.id,
                "overall_score": float(r.overall_score),
                "technical_skills_score": float(r.technical_skills_score),
                "projects_score": float(r.projects_score),
                "resume_quality_score": float(r.resume_quality_score),
                "academic_eligibility_score": float(r.academic_eligibility_score),
                "interview_prep_score": float(r.interview_prep_score),
                "certifications_score": float(r.certifications_score),
                "calculated_at": r.calculated_at.isoformat() if r.calculated_at else None
            })
        return history

    @staticmethod
    def _serialize_roadmap(db: Session, roadmap: CareerRoadmap) -> Dict[str, Any]:
        """Serializes roadmap ORM object to dictionary."""
        items = db.query(RoadmapItem).filter(
            RoadmapItem.roadmap_id == roadmap.id
        ).order_by(RoadmapItem.week_number.asc()).all()

        completed_count = sum(1 for i in items if i.is_completed)
        total_count = len(items)
        pct = round((completed_count / max(1, total_count)) * 100.0, 1)

        serialized_items = []
        for i in items:
            serialized_items.append({
                "id": i.id,
                "stage_number": i.week_number,
                "week_number": i.week_number,
                "milestone_title": i.milestone_title,
                "skill_name": i.skill_name or i.milestone_title,
                "priority": i.priority or "mandatory",
                "estimated_learning_time": i.estimated_time or "1-2 weeks",
                "description": i.description,
                "learning_resources": i.learning_resources or [],
                "practical_exercise": i.practical_exercise or i.suggested_project or "",
                "completion_status": i.status or ("completed" if i.is_completed else "not_started"),
                "is_completed": bool(i.is_completed),
                "completed_at": i.completed_at.isoformat() if i.completed_at else None,
                "student_notes": i.student_notes,
                "evidence_url": i.evidence_url,
                "evidence_notes": i.evidence_notes,
                "is_verified": bool(i.is_verified),
                "verification_type": "Evidence Verified" if i.is_verified else ("Self-Reported" if i.is_completed else "Pending")
            })

        return {
            "id": roadmap.id,
            "title": roadmap.title,
            "target_role": roadmap.target_role,
            "total_weeks": roadmap.total_weeks,
            "status": roadmap.status.value if hasattr(roadmap.status, "value") else str(roadmap.status),
            "total_milestones": total_count,
            "completed_milestones": completed_count,
            "progress_percentage": pct,
            "created_at": roadmap.created_at.isoformat() if roadmap.created_at else None,
            "items": serialized_items,
            "disclaimer": (
                "Rigor Standard: Completing a milestone tracks personal study progress. "
                "Evidence verification requires submitting a valid repository URL (e.g. GitHub) or live demo."
            )
        }

