"""
Student Profile Business Logic Service for CareerBridge.
Provides deterministic profile completion calculation and CRUD management for all profile sections.
"""

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.student import (
    StudentProfile, AcademicRecord, Skill, StudentSkill,
    StudentProject, StudentCertification, StudentExperience,
    SkillCategoryEnum, ProficiencyLevelEnum
)
from app.models.resume import Resume
from app.models.user import User
from app.schemas.student import (
    PersonalInfoUpdate, AcademicRecordCreate, AcademicRecordUpdate,
    SkillAddRequest, ProjectCreate, ProjectUpdate,
    CertificationCreate, ExperienceCreate, ExperienceUpdate,
    ProfileCompletionResponse, SectionCompletionScore
)
from app.ai.taxonomy import normalize_skill_name


class StudentService:

    @staticmethod
    def calculate_profile_completion(student: StudentProfile, db: Session) -> ProfileCompletionResponse:
        """
        Dynamically calculates profile completeness based on required section criteria.
        Total = 100 points:
        - Personal Info: 15 pts
        - Academic Record: 20 pts
        - Technical Skills: 20 pts
        - Projects: 20 pts
        - Work Experience: 10 pts
        - Certifications: 5 pts
        - Resume Upload: 10 pts
        """
        missing_items: List[str] = []
        recommendations: List[str] = []
        sections: List[SectionCompletionScore] = []

        # 1. Personal Information (15 pts)
        personal_score = 0
        if student.full_name and len(student.full_name.strip()) >= 2:
            personal_score += 3
        if student.phone_number:
            personal_score += 3
        else:
            missing_items.append("Personal phone number")

        if student.city:
            personal_score += 3
        else:
            missing_items.append("Current location / city")

        if student.bio and len(student.bio.strip()) >= 15:
            personal_score += 3
        else:
            missing_items.append("Professional career headline / bio")

        if student.linkedin_url or student.github_url or student.portfolio_url:
            personal_score += 3
        else:
            missing_items.append("LinkedIn or GitHub profile link")

        sections.append(SectionCompletionScore(
            name="Personal Details",
            score=personal_score,
            max_score=15,
            status="complete" if personal_score == 15 else ("partial" if personal_score > 0 else "missing")
        ))

        # 2. Academic Records (20 pts)
        academic_score = 0
        academics = student.academic_records
        if academics and len(academics) > 0:
            rec = academics[0]
            if rec.institution_name:
                academic_score += 5
            if rec.degree and rec.department:
                academic_score += 5
            if rec.cgpa_or_percentage and rec.cgpa_or_percentage > 0:
                academic_score += 5
            if rec.end_year and rec.end_year >= 2000:
                academic_score += 5
        else:
            missing_items.append("Degree and current CGPA / percentage")
            missing_items.append("Graduation year and department")

        sections.append(SectionCompletionScore(
            name="Academic Profile",
            score=academic_score,
            max_score=20,
            status="complete" if academic_score == 20 else ("partial" if academic_score > 0 else "missing")
        ))

        # 3. Technical Skills (20 pts)
        skills_score = 0
        skill_count = len(student.skills)
        if skill_count >= 5:
            skills_score = 20
        elif skill_count >= 3:
            skills_score = 14
            missing_items.append("Add at least 5 core technical skills (currently has 3-4)")
        elif skill_count >= 1:
            skills_score = 8
            missing_items.append("Add at least 5 core technical skills")
        else:
            missing_items.append("Technical skills (Languages, Frameworks, Databases)")

        sections.append(SectionCompletionScore(
            name="Technical Skills",
            score=skills_score,
            max_score=20,
            status="complete" if skills_score == 20 else ("partial" if skills_score > 0 else "missing")
        ))

        # 4. Projects (20 pts)
        projects_score = 0
        project_count = len(student.projects)
        if project_count >= 2:
            projects_score = 20
        elif project_count == 1:
            projects_score = 10
            missing_items.append("Add a second technical project to achieve full project score")
        else:
            missing_items.append("At least 1 technical project with GitHub repository")

        sections.append(SectionCompletionScore(
            name="Engineering Projects",
            score=projects_score,
            max_score=20,
            status="complete" if projects_score == 20 else ("partial" if projects_score > 0 else "missing")
        ))

        # 5. Work Experience / Internships (10 pts)
        experience_score = 0
        if len(student.experiences) >= 1:
            experience_score = 10
        else:
            missing_items.append("Work or internship experience (or open source contributions)")

        sections.append(SectionCompletionScore(
            name="Experience / Internships",
            score=experience_score,
            max_score=10,
            status="complete" if experience_score == 10 else "missing"
        ))

        # 6. Certifications (5 pts)
        cert_score = 0
        if len(student.certifications) >= 1:
            cert_score = 5
        else:
            missing_items.append("Professional certifications (Cloud, Security, AI)")

        sections.append(SectionCompletionScore(
            name="Certifications",
            score=cert_score,
            max_score=5,
            status="complete" if cert_score == 5 else "missing"
        ))

        # 7. Resume Upload (10 pts)
        resume_score = 0
        resumes = student.resumes
        if resumes and len(resumes) > 0:
            resume_score = 10
        else:
            missing_items.append("Active ATS-verified Resume PDF or DOCX")

        sections.append(SectionCompletionScore(
            name="Resume Document",
            score=resume_score,
            max_score=10,
            status="complete" if resume_score == 10 else "missing"
        ))

        # Total Calculation
        total_score = personal_score + academic_score + skills_score + projects_score + experience_score + cert_score + resume_score
        total_percentage = max(0, min(100, total_score))

        # Actionable Recommendations
        if resume_score == 0:
            recommendations.append("Upload your latest resume to trigger automated ATS scoring and skill extraction.")
        if project_count < 2:
            recommendations.append("Add a full-stack or systems project with an active GitHub repo (+10% profile boost).")
        if skill_count < 5:
            recommendations.append("Tag at least 5 categorized competencies to maximize job match precision.")
        if personal_score < 15:
            recommendations.append("Complete your contact details and professional links for recruiter outreach.")

        if not recommendations:
            recommendations.append("Profile is comprehensive and optimized for campus placement drives.")

        return ProfileCompletionResponse(
            overall_percentage=total_percentage,
            sections=sections,
            missing_items=missing_items,
            recommendations=recommendations,
        )

    @staticmethod
    def get_or_create_student_profile(user_id: str, db: Session) -> StudentProfile:
        """Finds or initializes a StudentProfile for the given User."""
        student = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
        if not student:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User account not found.")

            # Auto-create basic profile
            student = StudentProfile(
                user_id=user_id,
                full_name=getattr(user, "full_name", user.email.split("@")[0].title()),
                roll_number=f"ROLL_{user_id[:8].upper()}",
            )
            db.add(student)
            db.commit()
            db.refresh(student)

        return student

    @staticmethod
    def update_personal_info(student_id: str, data: PersonalInfoUpdate, db: Session) -> StudentProfile:
        """Updates personal details."""
        student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found.")

        if data.full_name is not None:
            student.full_name = data.full_name.strip()
        if data.phone_number is not None:
            student.phone_number = data.phone_number.strip()
        if data.bio is not None:
            student.bio = data.bio.strip()
        if data.city is not None:
            student.city = data.city.strip()
        if data.linkedin_url is not None:
            student.linkedin_url = data.linkedin_url.strip()
        if data.github_url is not None:
            student.github_url = data.github_url.strip()
        if data.portfolio_url is not None:
            student.portfolio_url = data.portfolio_url.strip()
        if data.gender is not None:
            student.gender = data.gender

        db.commit()
        db.refresh(student)
        return student

    @staticmethod
    def add_or_update_academic_record(student_id: str, data: AcademicRecordCreate, db: Session) -> AcademicRecord:
        """Adds or updates primary academic record."""
        student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found.")

        record = db.query(AcademicRecord).filter(AcademicRecord.student_id == student_id).first()
        if not record:
            record = AcademicRecord(
                student_id=student_id,
                institution_name=data.institution_name,
                degree=data.degree,
                department=data.department,
                start_year=data.start_year,
                end_year=data.end_year,
                cgpa_or_percentage=data.cgpa_or_percentage,
                backlogs_count=data.backlogs_count,
            )
            db.add(record)
        else:
            record.institution_name = data.institution_name
            record.degree = data.degree
            record.department = data.department
            record.start_year = data.start_year
            record.end_year = data.end_year
            record.cgpa_or_percentage = data.cgpa_or_percentage
            record.backlogs_count = data.backlogs_count

        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def add_skill(student_id: str, data: SkillAddRequest, db: Session) -> StudentSkill:
        """Adds a categorized skill to the student's profile."""
        std_name, auto_cat = normalize_skill_name(data.name)
        cat = data.category or auto_cat

        # Ensure skill exists in master catalog
        skill = db.query(Skill).filter(Skill.name.ilike(std_name)).first()
        if not skill:
            skill = Skill(
                name=std_name,
                category=SkillCategoryEnum(cat) if cat in SkillCategoryEnum.__members__.values() else SkillCategoryEnum.TOOL
            )
            db.add(skill)
            db.flush()

        # Check existing student skill
        existing = db.query(StudentSkill).filter(
            StudentSkill.student_id == student_id,
            StudentSkill.skill_id == skill.id
        ).first()

        if existing:
            existing.proficiency_level = ProficiencyLevelEnum(data.proficiency_level or "intermediate")
            db.commit()
            db.refresh(existing)
            return existing

        student_skill = StudentSkill(
            student_id=student_id,
            skill_id=skill.id,
            proficiency_level=ProficiencyLevelEnum(data.proficiency_level or "intermediate"),
            is_verified=False
        )
        db.add(student_skill)
        db.commit()
        db.refresh(student_skill)
        return student_skill

    @staticmethod
    def remove_skill(student_id: str, skill_id: int, db: Session) -> bool:
        """Removes a skill from student profile."""
        link = db.query(StudentSkill).filter(
            StudentSkill.student_id == student_id,
            StudentSkill.skill_id == skill_id
        ).first()
        if not link:
            return False

        db.delete(link)
        db.commit()
        return True

    @staticmethod
    def create_project(student_id: str, data: ProjectCreate, db: Session) -> StudentProject:
        """Creates a new project record."""
        project = StudentProject(
            student_id=student_id,
            title=data.title,
            description=data.description,
            technologies_used=data.technologies_used,
            github_url=data.github_url,
            live_demo_url=data.live_demo_url,
            start_date=data.start_date,
            end_date=data.end_date,
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def update_project(student_id: str, project_id: str, data: ProjectUpdate, db: Session) -> StudentProject:
        """Updates an existing project record."""
        project = db.query(StudentProject).filter(
            StudentProject.id == project_id,
            StudentProject.student_id == student_id
        ).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")

        if data.title is not None:
            project.title = data.title
        if data.description is not None:
            project.description = data.description
        if data.technologies_used is not None:
            project.technologies_used = data.technologies_used
        if data.github_url is not None:
            project.github_url = data.github_url
        if data.live_demo_url is not None:
            project.live_demo_url = data.live_demo_url
        if data.start_date is not None:
            project.start_date = data.start_date
        if data.end_date is not None:
            project.end_date = data.end_date

        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def delete_project(student_id: str, project_id: str, db: Session) -> bool:
        """Deletes a project record."""
        project = db.query(StudentProject).filter(
            StudentProject.id == project_id,
            StudentProject.student_id == student_id
        ).first()
        if not project:
            return False

        db.delete(project)
        db.commit()
        return True

    @staticmethod
    def create_certification(student_id: str, data: CertificationCreate, db: Session) -> StudentCertification:
        """Creates a certification record."""
        cert = StudentCertification(
            student_id=student_id,
            title=data.title,
            issuing_organization=data.issuing_organization,
            issue_date=data.issue_date,
            expiration_date=data.expiration_date,
            credential_url=data.credential_url,
        )
        db.add(cert)
        db.commit()
        db.refresh(cert)
        return cert

    @staticmethod
    def delete_certification(student_id: str, cert_id: str, db: Session) -> bool:
        """Deletes a certification record."""
        cert = db.query(StudentCertification).filter(
            StudentCertification.id == cert_id,
            StudentCertification.student_id == student_id
        ).first()
        if not cert:
            return False

        db.delete(cert)
        db.commit()
        return True

    @staticmethod
    def create_experience(student_id: str, data: ExperienceCreate, db: Session) -> StudentExperience:
        """Creates work/internship experience."""
        exp = StudentExperience(
            student_id=student_id,
            company_name=data.company_name,
            role_title=data.role_title,
            location=data.location,
            start_date=data.start_date,
            end_date=data.end_date,
            is_current=data.is_current,
            description=data.description,
        )
        db.add(exp)
        db.commit()
        db.refresh(exp)
        return exp

    @staticmethod
    def update_experience(student_id: str, exp_id: str, data: ExperienceUpdate, db: Session) -> StudentExperience:
        """Updates work experience."""
        exp = db.query(StudentExperience).filter(
            StudentExperience.id == exp_id,
            StudentExperience.student_id == student_id
        ).first()
        if not exp:
            raise HTTPException(status_code=404, detail="Experience record not found.")

        if data.company_name is not None:
            exp.company_name = data.company_name
        if data.role_title is not None:
            exp.role_title = data.role_title
        if data.location is not None:
            exp.location = data.location
        if data.start_date is not None:
            exp.start_date = data.start_date
        if data.end_date is not None:
            exp.end_date = data.end_date
        if data.is_current is not None:
            exp.is_current = data.is_current
        if data.description is not None:
            exp.description = data.description

        db.commit()
        db.refresh(exp)
        return exp

    @staticmethod
    def delete_experience(student_id: str, exp_id: str, db: Session) -> bool:
        """Deletes work experience."""
        exp = db.query(StudentExperience).filter(
            StudentExperience.id == exp_id,
            StudentExperience.student_id == student_id
        ).first()
        if not exp:
            return False

        db.delete(exp)
        db.commit()
        return True
