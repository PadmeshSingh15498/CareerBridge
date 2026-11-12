"""
Resume Analysis Service for CareerBridge.
Orchestrates multi-dimensional rubric scoring, LLM intelligence,
job-specific requisition matching, historical snapshots, and PDF generation.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.resume import Resume, ResumeAnalysis, ResumeAnalysisHistory
from app.models.student import StudentProfile
from app.models.job import Job, JobSkill
from app.models.user import User, UserRole
from app.ai.resume_analyzer.scoring_rubric import ScoringWeights
from app.ai.resume_analyzer.nlp_evaluator import evaluate_resume_content
from app.ai.resume_analyzer.llm_client import analyze_with_llm
from app.ai.resume_analyzer.job_matcher import analyze_resume_for_job
from app.ai.resume_analyzer.pdf_generator import generate_analysis_pdf


class ResumeAnalysisService:

    @staticmethod
    def _verify_resume_access(db: Session, student_user: User, resume_id: str) -> Tuple[Resume, StudentProfile]:
        """Ensures student owns the resume or user is authorized staff."""
        resume = db.query(Resume).options(
            joinedload(Resume.analysis),
            joinedload(Resume.student).joinedload(StudentProfile.user)
        ).filter(Resume.id == resume_id).first()

        if not resume:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

        student = resume.student
        if student_user.role == UserRole.STUDENT:
            if not student or student.user_id != student_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access to this resume")

        return resume, student

    @classmethod
    async def analyze_resume(
        cls,
        db: Session,
        student_user: User,
        resume_id: str,
        weights: Optional[ScoringWeights] = None,
        job_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes complete multi-dimensional evaluation of the selected resume.
        Optionally evaluates against target job requisition if job_id is provided.
        Persists snapshot to database.
        """
        resume, student = cls._verify_resume_access(db, student_user, resume_id)

        # Retrieve raw text
        raw_text = ""
        if resume.analysis and resume.analysis.raw_text:
            raw_text = resume.analysis.raw_text
        elif hasattr(resume, "raw_text") and resume.raw_text:
            raw_text = resume.raw_text

        # If raw text is missing, attempt on-the-fly extraction from disk
        if not raw_text.strip():
            import os
            from app.ai.resume_parser import extract_resume_text
            if os.path.exists(resume.file_path):
                with open(resume.file_path, "rb") as f:
                    file_bytes = f.read()
                raw_text = extract_resume_text(file_bytes, resume.file_name)

        if not raw_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resume content is empty or unreadable. Please upload a valid PDF or DOCX file."
            )

        # 1. Run LLM / NLP Analysis
        analysis_result = await analyze_with_llm(raw_text, weights)
        analysis_result["resume_id"] = resume.id

        return cls._persist_and_finalize_analysis(db, resume, raw_text, analysis_result, job_id)

    @classmethod
    def analyze_resume_sync(
        cls,
        db: Session,
        student_user: User,
        resume_id: str,
        weights: Optional[ScoringWeights] = None,
        job_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Synchronous version for direct unit testing and offline processing."""
        from app.ai.resume_analyzer.nlp_evaluator import evaluate_resume_content
        resume, student = cls._verify_resume_access(db, student_user, resume_id)

        raw_text = ""
        if resume.analysis and resume.analysis.raw_text:
            raw_text = resume.analysis.raw_text
        elif hasattr(resume, "raw_text") and resume.raw_text:
            raw_text = resume.raw_text

        if not raw_text.strip():
            import os
            from app.ai.resume_parser import extract_resume_text
            if os.path.exists(resume.file_path):
                with open(resume.file_path, "rb") as f:
                    file_bytes = f.read()
                raw_text = extract_resume_text(file_bytes, resume.file_name)

        if not raw_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resume content is empty or unreadable."
            )

        analysis_result = evaluate_resume_content(raw_text, weights)
        analysis_result["engine_type"] = "nlp_intelligence"
        analysis_result["resume_id"] = resume.id

        return cls._persist_and_finalize_analysis(db, resume, raw_text, analysis_result, job_id)

    @classmethod
    def _persist_and_finalize_analysis(
        cls,
        db: Session,
        resume: Resume,
        raw_text: str,
        analysis_result: Dict[str, Any],
        job_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Helper to compute job matching and persist analysis snapshot."""

        # 2. Run Job-Specific Matching if job_id provided
        job_analysis_data = None
        if job_id:
            job = db.query(Job).options(
                joinedload(Job.skills).joinedload(JobSkill.skill),
                joinedload(Job.company)
            ).filter(Job.id == job_id).first()

            if job:
                skills_list = [
                    {"name": js.skill.name, "is_mandatory": js.is_mandatory}
                    for js in (job.skills or []) if js.skill
                ]
                job_analysis_data = analyze_resume_for_job(
                    resume_text=raw_text,
                    job_title=job.title,
                    job_description=job.description,
                    job_requirements=job.requirements or "",
                    job_skills=skills_list
                )
                analysis_result["job_analysis"] = job_analysis_data

        analysis_result["created_at"] = datetime.utcnow().isoformat()

        # 3. Update or Insert Current ResumeAnalysis Record
        cat_scores = analysis_result["category_scores"]
        overall_score = analysis_result["overall_score"]

        current_analysis = resume.analysis
        if not current_analysis:
            current_analysis = ResumeAnalysis(
                resume_id=resume.id,
                raw_text=raw_text,
                ats_score=overall_score,
                section_score=int(cat_scores.get("structure", 0)),
                metric_score=int(cat_scores.get("readability", 0)),
                skill_score=int(cat_scores.get("technical_skills", 0)),
                format_score=int(cat_scores.get("projects", 0)),
                extracted_skills=analysis_result["skills_extracted"],
                missing_recommended_skills=analysis_result.get("weaknesses", []),
                improvements_json=analysis_result,
                created_at=datetime.utcnow()
            )
            db.add(current_analysis)
        else:
            current_analysis.ats_score = overall_score
            current_analysis.section_score = int(cat_scores.get("structure", 0))
            current_analysis.metric_score = int(cat_scores.get("readability", 0))
            current_analysis.skill_score = int(cat_scores.get("technical_skills", 0))
            current_analysis.format_score = int(cat_scores.get("projects", 0))
            current_analysis.extracted_skills = analysis_result["skills_extracted"]
            current_analysis.improvements_json = analysis_result
            current_analysis.created_at = datetime.utcnow()

        # 4. Save Historical Snapshot
        history_entry = ResumeAnalysisHistory(
            resume_id=resume.id,
            target_job_id=job_id,
            overall_score=overall_score,
            structure_score=int(cat_scores.get("structure", 0)),
            skills_score=int(cat_scores.get("technical_skills", 0)),
            projects_score=int(cat_scores.get("projects", 0)),
            experience_score=int(cat_scores.get("experience", 0)),
            education_score=int(cat_scores.get("education", 0)),
            achievements_score=int(cat_scores.get("achievements", 0)),
            readability_score=int(cat_scores.get("readability", 0)),
            strengths_json=analysis_result["strengths"],
            weaknesses_json=analysis_result["weaknesses"],
            improvement_suggestions_json=analysis_result.get("weaknesses", []),
            suggested_edits_json=analysis_result["suggested_edits"],
            job_relevance_json=job_analysis_data,
            engine_type=analysis_result["engine_type"],
            created_at=datetime.utcnow()
        )
        db.add(history_entry)
        db.commit()

        analysis_result["id"] = history_entry.id
        return analysis_result

    @classmethod
    async def get_latest_analysis(
        cls,
        db: Session,
        student_user: User,
        resume_id: str
    ) -> Dict[str, Any]:
        """Retrieves the latest analysis for the specified resume; generates one if not yet computed."""
        resume, student = cls._verify_resume_access(db, student_user, resume_id)

        if resume.analysis and resume.analysis.improvements_json:
            data = dict(resume.analysis.improvements_json)
            data["resume_id"] = resume.id
            data["created_at"] = resume.analysis.created_at.isoformat() if hasattr(resume.analysis.created_at, "isoformat") else resume.analysis.created_at
            return data

        # Trigger analysis
        return await cls.analyze_resume(db, student_user, resume_id)

    @classmethod
    def get_analysis_history(
        cls,
        db: Session,
        student_user: User,
        resume_id: str
    ) -> List[Dict[str, Any]]:
        """Returns past evaluation records for this resume."""
        resume, _ = cls._verify_resume_access(db, student_user, resume_id)

        history_records = db.query(ResumeAnalysisHistory).options(
            joinedload(ResumeAnalysisHistory.job)
        ).filter(
            ResumeAnalysisHistory.resume_id == resume.id
        ).order_by(ResumeAnalysisHistory.created_at.desc()).all()

        results = []
        for h in history_records:
            results.append({
                "id": h.id,
                "resume_id": h.resume_id,
                "target_job_id": h.target_job_id,
                "job_title": h.job.title if h.job else None,
                "overall_score": h.overall_score,
                "category_scores": {
                    "structure": h.structure_score,
                    "technical_skills": h.skills_score,
                    "projects": h.projects_score,
                    "experience": h.experience_score,
                    "education": h.education_score,
                    "achievements": h.achievements_score,
                    "readability": h.readability_score,
                },
                "engine_type": h.engine_type,
                "created_at": h.created_at.isoformat() if hasattr(h.created_at, "isoformat") else h.created_at,
            })
        return results

    @classmethod
    def export_pdf_report_sync(
        cls,
        db: Session,
        student_user: User,
        resume_id: str,
        history_id: Optional[str] = None
    ) -> Tuple[bytes, str]:
        """Synchronous version for direct unit testing and offline generation."""
        resume, student = cls._verify_resume_access(db, student_user, resume_id)
        student_name = student.full_name if student else "Student Candidate"

        analysis_data = None
        job_data = None

        if history_id:
            h = db.query(ResumeAnalysisHistory).filter(
                ResumeAnalysisHistory.id == history_id,
                ResumeAnalysisHistory.resume_id == resume.id
            ).first()
            if h:
                analysis_data = {
                    "overall_score": h.overall_score,
                    "category_scores": {
                        "structure": h.structure_score,
                        "technical_skills": h.skills_score,
                        "projects": h.projects_score,
                        "experience": h.experience_score,
                        "education": h.education_score,
                        "achievements": h.achievements_score,
                        "readability": h.readability_score,
                    },
                    "engine_type": h.engine_type,
                    "strengths": h.strengths_json or [],
                    "weaknesses": h.weaknesses_json or [],
                    "suggested_edits": h.suggested_edits_json or {},
                    "action_verb_suggestions": (h.suggested_edits_json or {}).get("action_verbs", []),
                    "quantification_suggestions": (h.suggested_edits_json or {}).get("quantifications", []),
                    "project_rewrites": (h.suggested_edits_json or {}).get("project_rewrites", []),
                    "created_at": h.created_at.isoformat() if hasattr(h.created_at, "isoformat") else h.created_at,
                }
                job_data = h.job_relevance_json

        if not analysis_data and resume.analysis:
            cur = resume.analysis
            analysis_data = {
                "overall_score": cur.ats_score,
                "category_scores": {
                    "structure": cur.section_score,
                    "technical_skills": cur.skill_score,
                    "projects": cur.format_score,
                    "experience": 0,
                    "education": 0,
                    "achievements": 0,
                    "readability": cur.metric_score,
                },
                "engine_type": "nlp_intelligence",
                "strengths": cur.extracted_skills,
                "weaknesses": cur.missing_recommended_skills or [],
                "suggested_edits": cur.improvements_json.get("suggested_edits", {}) if isinstance(cur.improvements_json, dict) else {},
                "action_verb_suggestions": [],
                "quantification_suggestions": [],
                "project_rewrites": [],
                "created_at": cur.created_at.isoformat() if hasattr(cur.created_at, "isoformat") else cur.created_at,
            }
            if isinstance(cur.improvements_json, dict):
                job_data = cur.improvements_json.get("job_analysis")

        if not analysis_data:
            from app.ai.resume_analyzer.nlp_evaluator import evaluate_resume_content
            raw = resume.analysis.raw_text if resume.analysis else ""
            analysis_data = evaluate_resume_content(raw)
            analysis_data["engine_type"] = "nlp_intelligence"

        pdf_bytes = generate_analysis_pdf(
            student_name=student_name,
            resume_title=resume.title or resume.file_name,
            analysis_data=analysis_data,
            job_analysis=job_data
        )

        clean_title = (resume.title or "Resume").replace(" ", "_").replace("/", "_")
        filename = f"CareerBridge_Audit_{clean_title}_{student_name.replace(' ', '_')}.pdf"
        return pdf_bytes, filename

    @classmethod
    async def export_pdf_report(
        cls,
        db: Session,
        student_user: User,
        resume_id: str,
        history_id: Optional[str] = None
    ) -> Tuple[bytes, str]:
        """Renders an executive-grade PDF analysis report for download."""
        return cls.export_pdf_report_sync(db, student_user, resume_id, history_id)
        resume, student = cls._verify_resume_access(db, student_user, resume_id)
        student_name = student.full_name if student else "Student Candidate"

        analysis_data = None
        job_data = None

        if history_id:
            h = db.query(ResumeAnalysisHistory).filter(
                ResumeAnalysisHistory.id == history_id,
                ResumeAnalysisHistory.resume_id == resume.id
            ).first()
            if h:
                analysis_data = {
                    "overall_score": h.overall_score,
                    "category_scores": {
                        "structure": h.structure_score,
                        "technical_skills": h.skills_score,
                        "projects": h.projects_score,
                        "experience": h.experience_score,
                        "education": h.education_score,
                        "achievements": h.achievements_score,
                        "readability": h.readability_score,
                    },
                    "strengths": h.strengths_json,
                    "weaknesses": h.weaknesses_json,
                    "suggested_edits": h.suggested_edits_json,
                    "engine_type": h.engine_type,
                }
                job_data = h.job_relevance_json

        if not analysis_data:
            analysis_data = await cls.get_latest_analysis(db, student_user, resume_id)
            job_data = analysis_data.get("job_analysis")

        pdf_bytes = generate_analysis_pdf(
            student_name=student_name,
            resume_title=resume.title or resume.file_name,
            analysis_data=analysis_data,
            job_analysis=job_data
        )

        clean_filename = f"CareerBridge_Analysis_{resume.file_name.split('.')[0]}.pdf"
        return pdf_bytes, clean_filename
