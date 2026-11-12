"""
Resume Management & Extraction Service for CareerBridge.
Handles secure file storage, versioning, PyMuPDF/python-docx parsing,
ATS scoring, file downloads, and approved profile merging.
"""

import os
import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.models.resume import Resume, ResumeVersion, ResumeAnalysis
from app.models.student import (
    StudentProfile, AcademicRecord, Skill, StudentSkill,
    StudentProject, StudentCertification, StudentExperience,
    SkillCategoryEnum, ProficiencyLevelEnum
)
from app.ai.resume_parser import parse_resume_bytes
from app.ai.ats_scorer import calculate_ats_score
from app.ai.taxonomy import normalize_skill_name
from app.services.student_service import StudentService


MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {"pdf", "docx"}


class ResumeService:

    @staticmethod
    def _validate_file_content(file_bytes: bytes, filename: str) -> str:
        """Validates file size, file extension, and magic bytes."""
        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of 10MB ({len(file_bytes)} bytes uploaded)."
            )

        if len(file_bytes) < 32:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty or too small to be a valid document."
            )

        ext = filename.lower().split(".")[-1] if "." in filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file extension '.{ext}'. Supported formats are: PDF, DOCX."
            )

        # Magic Bytes Validation
        if ext == "pdf":
            if not file_bytes.startswith(b"%PDF-"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Corrupted file: The uploaded document does not match the standard PDF specification header (%PDF-)."
                )
        elif ext == "docx":
            # DOCX is a zip archive starting with PK\x03\x04
            if not file_bytes.startswith(b"PK\x03\x04"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Corrupted file: The uploaded document does not match the OpenXML DOCX archive specification."
                )

        return ext

    @staticmethod
    def _save_file_to_disk(student_id: str, file_bytes: bytes, ext: str) -> str:
        """Saves file to secure local storage and returns absolute path."""
        storage_dir = os.path.join(settings.BASE_DIR, "storage", "resumes")
        os.makedirs(storage_dir, exist_ok=True)

        safe_filename = f"{student_id}_{uuid.uuid4().hex[:12]}.{ext}"
        dest_path = os.path.join(storage_dir, safe_filename)

        with open(dest_path, "wb") as f:
            f.write(file_bytes)

        return dest_path

    @classmethod
    def upload_resume(
        cls,
        student_id: str,
        file: UploadFile,
        title: Optional[str],
        db: Session,
    ) -> Dict[str, Any]:
        """Uploads a new resume or primary resume version."""
        student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found.")

        file_bytes = file.file.read()
        filename = file.filename or "resume.pdf"
        ext = cls._validate_file_content(file_bytes, filename)

        # 1. Parse content
        try:
            parsed_data = parse_resume_bytes(file_bytes, filename)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Resume extraction error: {str(e)}"
            )

        # 2. Evaluate ATS Rubric
        ats_eval = calculate_ats_score(parsed_data)

        # 3. Save to disk
        dest_path = cls._save_file_to_disk(student_id, file_bytes, ext)

        # 4. Check if student already has a default resume
        existing_resumes = db.query(Resume).filter(Resume.student_id == student_id).all()
        is_default = len(existing_resumes) == 0

        # Create Resume Record
        resume = Resume(
            student_id=student_id,
            title=title or filename.rsplit(".", 1)[0].replace("_", " ").title(),
            file_name=filename,
            file_path=dest_path,
            file_size_bytes=len(file_bytes),
            mime_type=file.content_type or ("application/pdf" if ext == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            is_default=is_default,
        )
        db.add(resume)
        db.flush()

        # Create Version 1
        version = ResumeVersion(
            resume_id=resume.id,
            version_number=1,
            file_path=dest_path,
            changelog_notes="Initial document upload and ATS evaluation.",
        )
        db.add(version)

        # Create Analysis Record
        extracted_skill_names = [s["name"] for s in parsed_data.get("skills", [])]
        analysis = ResumeAnalysis(
            resume_id=resume.id,
            raw_text=parsed_data.get("raw_text", ""),
            ats_score=ats_eval["ats_score"],
            section_score=ats_eval["section_score"],
            metric_score=ats_eval["metric_score"],
            skill_score=ats_eval["skill_score"],
            format_score=ats_eval["format_score"],
            extracted_skills=extracted_skill_names,
            improvements_json=ats_eval["improvements"],
        )
        db.add(analysis)

        db.commit()
        db.refresh(resume)

        return {
            "resume": resume,
            "version": 1,
            "ats_eval": ats_eval,
            "parsed_data": parsed_data,
        }

    @classmethod
    def reupload_version(
        cls,
        resume_id: str,
        student_id: str,
        file: UploadFile,
        changelog_notes: Optional[str],
        db: Session,
    ) -> Dict[str, Any]:
        """Uploads a new version of an existing resume (v2, v3, etc.)."""
        resume = db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.student_id == student_id
        ).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found or unauthorized.")

        file_bytes = file.file.read()
        filename = file.filename or resume.file_name
        ext = cls._validate_file_content(file_bytes, filename)

        # 1. Parse
        try:
            parsed_data = parse_resume_bytes(file_bytes, filename)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Resume extraction error: {str(e)}"
            )

        # 2. ATS Score
        ats_eval = calculate_ats_score(parsed_data)

        # 3. Save to disk
        dest_path = cls._save_file_to_disk(student_id, file_bytes, ext)

        # 4. Calculate next version number
        current_max = db.query(ResumeVersion.version_number).filter(
            ResumeVersion.resume_id == resume_id
        ).order_by(ResumeVersion.version_number.desc()).first()
        next_version = (current_max[0] + 1) if current_max else 2

        # Create new version record
        version = ResumeVersion(
            resume_id=resume.id,
            version_number=next_version,
            file_path=dest_path,
            changelog_notes=changelog_notes or f"Updated revision (v{next_version}).",
        )
        db.add(version)

        # Update primary resume pointers
        resume.file_name = filename
        resume.file_path = dest_path
        resume.file_size_bytes = len(file_bytes)
        resume.mime_type = file.content_type or resume.mime_type

        # Update analysis
        extracted_skill_names = [s["name"] for s in parsed_data.get("skills", [])]
        if resume.analysis:
            resume.analysis.raw_text = parsed_data.get("raw_text", "")
            resume.analysis.ats_score = ats_eval["ats_score"]
            resume.analysis.section_score = ats_eval["section_score"]
            resume.analysis.metric_score = ats_eval["metric_score"]
            resume.analysis.skill_score = ats_eval["skill_score"]
            resume.analysis.format_score = ats_eval["format_score"]
            resume.analysis.extracted_skills = extracted_skill_names
            resume.analysis.improvements_json = ats_eval["improvements"]
        else:
            analysis = ResumeAnalysis(
                resume_id=resume.id,
                raw_text=parsed_data.get("raw_text", ""),
                ats_score=ats_eval["ats_score"],
                section_score=ats_eval["section_score"],
                metric_score=ats_eval["metric_score"],
                skill_score=ats_eval["skill_score"],
                format_score=ats_eval["format_score"],
                extracted_skills=extracted_skill_names,
                improvements_json=ats_eval["improvements"],
            )
            db.add(analysis)

        db.commit()
        db.refresh(resume)

        return {
            "resume": resume,
            "version": next_version,
            "ats_eval": ats_eval,
            "parsed_data": parsed_data,
        }

    @staticmethod
    def get_student_resumes(student_id: str, db: Session) -> List[Resume]:
        """Lists all resumes uploaded by the student."""
        return db.query(Resume).filter(
            Resume.student_id == student_id
        ).order_by(Resume.created_at.desc()).all()

    @staticmethod
    def get_resume_by_id(resume_id: str, student_id: str, db: Session) -> Resume:
        """Retrieves a single resume with ownership verification."""
        resume = db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.student_id == student_id
        ).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found or unauthorized access.")
        return resume

    @staticmethod
    def delete_resume(resume_id: str, student_id: str, db: Session) -> bool:
        """Deletes a resume, all versions, and physical files on disk."""
        resume = db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.student_id == student_id
        ).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found or unauthorized access.")

        # Delete files on disk
        for v in resume.versions:
            if v.file_path and os.path.exists(v.file_path):
                try:
                    os.remove(v.file_path)
                except OSError:
                    pass

        if resume.file_path and os.path.exists(resume.file_path):
            try:
                os.remove(resume.file_path)
            except OSError:
                pass

        db.delete(resume)
        db.commit()
        return True

    @staticmethod
    def apply_extracted_data_to_profile(
        resume_id: str,
        student_id: str,
        options: Dict[str, Any],
        db: Session,
    ) -> Dict[str, Any]:
        """
        Merges approved extracted resume data into the student profile.
        Safely honors `overwrite_existing`: by default, existing manual data is preserved.
        """
        resume = db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.student_id == student_id
        ).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found or unauthorized access.")

        student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found.")

        # Re-parse file to ensure accurate extracted state
        if not os.path.exists(resume.file_path):
            raise HTTPException(status_code=404, detail="Stored resume file was not found on server disk.")

        with open(resume.file_path, "rb") as f:
            file_bytes = f.read()

        parsed = parse_resume_bytes(file_bytes, resume.file_name)
        overwrite = options.get("overwrite_existing", False)
        applied_sections: List[str] = []

        # 1. Personal Information
        if options.get("apply_personal", True):
            p = parsed.get("personal", {})
            if p.get("phone") and (overwrite or not student.phone_number):
                student.phone_number = p["phone"]
            if p.get("linkedin_url") and (overwrite or not student.linkedin_url):
                student.linkedin_url = p["linkedin_url"]
            if p.get("github_url") and (overwrite or not student.github_url):
                student.github_url = p["github_url"]
            if p.get("portfolio_url") and (overwrite or not student.portfolio_url):
                student.portfolio_url = p["portfolio_url"]
            applied_sections.append("Personal Links & Phone")

        # 2. Education
        if options.get("apply_education", True) and parsed.get("education"):
            edu_entry = parsed["education"][0]
            existing_rec = db.query(AcademicRecord).filter(AcademicRecord.student_id == student_id).first()
            if not existing_rec:
                existing_rec = AcademicRecord(
                    student_id=student_id,
                    institution_name=edu_entry.get("institution_name", "National Institute of Technology"),
                    degree=edu_entry.get("degree", "B.Tech"),
                    department=edu_entry.get("department", "Computer Science and Engineering"),
                    start_year=edu_entry.get("start_year", 2022),
                    end_year=edu_entry.get("end_year", 2026),
                    cgpa_or_percentage=edu_entry.get("cgpa", 8.5),
                    backlogs_count=0,
                )
                db.add(existing_rec)
                applied_sections.append("Academic Record")
            elif overwrite:
                existing_rec.institution_name = edu_entry.get("institution_name", existing_rec.institution_name)
                existing_rec.degree = edu_entry.get("degree", existing_rec.degree)
                existing_rec.department = edu_entry.get("department", existing_rec.department)
                existing_rec.start_year = edu_entry.get("start_year", existing_rec.start_year)
                existing_rec.end_year = edu_entry.get("end_year", existing_rec.end_year)
                existing_rec.cgpa_or_percentage = edu_entry.get("cgpa", existing_rec.cgpa_or_percentage)
                applied_sections.append("Academic Record (Updated)")

        # 3. Skills
        if options.get("apply_skills", True) and parsed.get("skills"):
            added_skills = 0
            for sk in parsed["skills"]:
                std_name, auto_cat = normalize_skill_name(sk["name"])
                cat = sk.get("category") or auto_cat

                # Ensure in catalog
                skill_obj = db.query(Skill).filter(Skill.name.ilike(std_name)).first()
                if not skill_obj:
                    skill_obj = Skill(
                        name=std_name,
                        category=SkillCategoryEnum(cat) if cat in SkillCategoryEnum.__members__.values() else SkillCategoryEnum.TOOL
                    )
                    db.add(skill_obj)
                    db.flush()

                # Check if student already has this skill
                exists = db.query(StudentSkill).filter(
                    StudentSkill.student_id == student_id,
                    StudentSkill.skill_id == skill_obj.id
                ).first()

                if not exists:
                    ss = StudentSkill(
                        student_id=student_id,
                        skill_id=skill_obj.id,
                        proficiency_level=ProficiencyLevelEnum.INTERMEDIATE,
                        is_verified=True,  # Extracted and approved from formal resume
                    )
                    db.add(ss)
                    added_skills += 1

            if added_skills > 0:
                applied_sections.append(f"Skills (+{added_skills} new)")

        # 4. Projects
        if options.get("apply_projects", True) and parsed.get("projects"):
            added_projects = 0
            for proj in parsed["projects"][:3]:
                # Check for duplicate by title
                proj_title = proj.get("title", "").strip()
                if not proj_title:
                    continue

                exists = db.query(StudentProject).filter(
                    StudentProject.student_id == student_id,
                    StudentProject.title.ilike(proj_title)
                ).first()

                if not exists:
                    sp = StudentProject(
                        student_id=student_id,
                        title=proj_title,
                        description=proj.get("description", proj_title),
                        technologies_used=proj.get("technologies", []),
                        github_url=proj.get("github_url"),
                        live_demo_url=proj.get("live_demo_url"),
                    )
                    db.add(sp)
                    added_projects += 1

            if added_projects > 0:
                applied_sections.append(f"Projects (+{added_projects} new)")

        # 5. Experience
        if options.get("apply_experience", True) and parsed.get("experience"):
            added_exp = 0
            for exp in parsed["experience"][:2]:
                company = exp.get("company_name", "").strip()
                if not company:
                    continue

                exists = db.query(StudentExperience).filter(
                    StudentExperience.student_id == student_id,
                    StudentExperience.company_name.ilike(company)
                ).first()

                if not exists:
                    se = StudentExperience(
                        student_id=student_id,
                        company_name=company,
                        role_title=exp.get("role_title", "Software Engineering Intern"),
                        location=exp.get("location", "India"),
                        start_date=exp.get("start_date") or student.created_at.date(),
                        is_current=False,
                        description=exp.get("description", ""),
                    )
                    db.add(se)
                    added_exp += 1

            if added_exp > 0:
                applied_sections.append(f"Experience (+{added_exp} new)")

        db.commit()
        db.refresh(student)

        # Calculate new profile completion
        new_completion = StudentService.calculate_profile_completion(student, db)

        return {
            "success": True,
            "message": f"Successfully merged {len(applied_sections)} sections into your student profile.",
            "applied_sections": applied_sections,
            "new_profile_completion": new_completion.overall_percentage,
        }

