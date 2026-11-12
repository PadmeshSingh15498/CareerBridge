"""
REST API Router for Resume Upload, Parsing, ATS Analysis, Download, and Selective Merging.
Protected by JWT authentication and strict student ownership checks.
"""

import os
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_active_user, verify_student_ownership
from app.models.user import User
from app.models.student import StudentProfile
from app.services.student_service import StudentService
from app.services.resume_service import ResumeService
from app.services.resume_analysis_service import ResumeAnalysisService
from app.ai.resume_analyzer.scoring_rubric import ScoringWeights
from app.schemas.resume_analysis import (
    ResumeAnalysisDetailResponse, JobSpecificAnalysisRequest,
    AnalysisHistoryItemResponse, ScoringWeightsInput
)
from app.ai.resume_parser import parse_resume_bytes
from app.schemas.resume import (
    ResumeUploadResponse, ResumeDetailResponse, ResumeVersionResponse,
    ResumeAnalysisResponse, ExtractedResumeData,
    ApplyExtractedDataRequest, ApplyExtractedDataResponse
)
from app.schemas.common import APIResponse

router = APIRouter(prefix="/resumes", tags=["Resume Intelligence & Parsing"])


def _get_student(current_user: User, db: Session) -> StudentProfile:
    return StudentService.get_or_create_student_profile(current_user.id, db)


@router.post("/upload", response_model=APIResponse[ResumeUploadResponse])
def upload_resume(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Uploads and evaluates a PDF or DOCX resume.
    Performs layout text extraction via PyMuPDF/python-docx and computes deterministic 100-point ATS rubric.
    """
    student = _get_student(current_user, db)
    result = ResumeService.upload_resume(student.id, file, title, db)
    resume = result["resume"]
    ats_eval = result["ats_eval"]
    parsed = result["parsed_data"]

    response_data = ResumeUploadResponse(
        id=resume.id,
        title=resume.title,
        file_name=resume.file_name,
        file_size_bytes=resume.file_size_bytes,
        mime_type=resume.mime_type,
        version_number=result["version"],
        ats_score=ats_eval["ats_score"],
        extracted_skills_count=len(parsed.get("skills", [])),
        message="Resume uploaded, parsed, and evaluated successfully."
    )

    return APIResponse(
        success=True,
        data=response_data,
        message="Resume uploaded and ATS evaluation completed."
    )


@router.post("/{resume_id}/reupload", response_model=APIResponse[ResumeUploadResponse])
def reupload_resume_version(
    resume_id: str,
    file: UploadFile = File(...),
    changelog_notes: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Uploads a new version (v2, v3) of an existing resume."""
    student = _get_student(current_user, db)
    # Check ownership
    verify_student_ownership(student.id, current_user)

    result = ResumeService.reupload_version(resume_id, student.id, file, changelog_notes, db)
    resume = result["resume"]
    ats_eval = result["ats_eval"]
    parsed = result["parsed_data"]

    response_data = ResumeUploadResponse(
        id=resume.id,
        title=resume.title,
        file_name=resume.file_name,
        file_size_bytes=resume.file_size_bytes,
        mime_type=resume.mime_type,
        version_number=result["version"],
        ats_score=ats_eval["ats_score"],
        extracted_skills_count=len(parsed.get("skills", [])),
        message=f"Resume updated to version {result['version']}."
    )

    return APIResponse(
        success=True,
        data=response_data,
        message=f"Resume updated to version {result['version']}."
    )


@router.get("/my", response_model=APIResponse[List[ResumeDetailResponse]])
def get_my_resumes(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Lists all resumes uploaded by the authenticated student."""
    student = _get_student(current_user, db)
    resumes = ResumeService.get_student_resumes(student.id, db)

    result = []
    for r in resumes:
        versions = [
            ResumeVersionResponse(
                id=v.id,
                version_number=v.version_number,
                changelog_notes=v.changelog_notes,
                created_at=v.created_at
            ) for v in sorted(r.versions, key=lambda x: x.version_number)
        ]

        analysis = None
        if r.analysis:
            analysis = ResumeAnalysisResponse(
                ats_score=r.analysis.ats_score,
                section_score=r.analysis.section_score,
                metric_score=r.analysis.metric_score,
                skill_score=r.analysis.skill_score,
                format_score=r.analysis.format_score,
                extracted_skills=r.analysis.extracted_skills or [],
                missing_recommended_skills=r.analysis.missing_recommended_skills,
                improvements_json=r.analysis.improvements_json or [],
                created_at=r.analysis.created_at,
            )

        # Parse extracted data preview
        extracted = None
        if os.path.exists(r.file_path):
            try:
                with open(r.file_path, "rb") as f:
                    p = parse_resume_bytes(f.read(), r.file_name)
                    extracted = ExtractedResumeData(
                        raw_text_length=len(p.get("raw_text", "")),
                        personal=p.get("personal", {}),
                        education=p.get("education", []),
                        skills=p.get("skills", []),
                        projects=p.get("projects", []),
                        experience=p.get("experience", []),
                        certifications=p.get("certifications", []),
                        metrics=p.get("metrics", {}),
                    )
            except Exception:
                pass

        current_ver = max([v.version_number for v in r.versions]) if r.versions else 1

        result.append(ResumeDetailResponse(
            id=r.id,
            student_id=r.student_id,
            title=r.title,
            file_name=r.file_name,
            file_size_bytes=r.file_size_bytes,
            mime_type=r.mime_type,
            is_default=r.is_default,
            current_version=current_ver,
            created_at=r.created_at,
            updated_at=r.updated_at,
            versions=versions,
            analysis=analysis,
            extracted_data=extracted,
        ))

    return APIResponse(
        success=True,
        data=result,
        message="Resumes retrieved successfully."
    )


@router.get("/{resume_id}", response_model=APIResponse[ResumeDetailResponse])
def get_resume_detail(
    resume_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieves full resume details, version history, ATS breakdown, and extracted profile data."""
    student = _get_student(current_user, db)
    resume = ResumeService.get_resume_by_id(resume_id, student.id, db)

    versions = [
        ResumeVersionResponse(
            id=v.id,
            version_number=v.version_number,
            changelog_notes=v.changelog_notes,
            created_at=v.created_at
        ) for v in sorted(resume.versions, key=lambda x: x.version_number)
    ]

    analysis = None
    if resume.analysis:
        analysis = ResumeAnalysisResponse(
            ats_score=resume.analysis.ats_score,
            section_score=resume.analysis.section_score,
            metric_score=resume.analysis.metric_score,
            skill_score=resume.analysis.skill_score,
            format_score=resume.analysis.format_score,
            extracted_skills=resume.analysis.extracted_skills or [],
            missing_recommended_skills=resume.analysis.missing_recommended_skills,
            improvements_json=resume.analysis.improvements_json or [],
            created_at=resume.analysis.created_at,
        )

    extracted = None
    if os.path.exists(resume.file_path):
        try:
            with open(resume.file_path, "rb") as f:
                p = parse_resume_bytes(f.read(), resume.file_name)
                extracted = ExtractedResumeData(
                    raw_text_length=len(p.get("raw_text", "")),
                    personal=p.get("personal", {}),
                    education=p.get("education", []),
                    skills=p.get("skills", []),
                    projects=p.get("projects", []),
                    experience=p.get("experience", []),
                    certifications=p.get("certifications", []),
                    metrics=p.get("metrics", {}),
                )
        except Exception:
            pass

    current_ver = max([v.version_number for v in resume.versions]) if resume.versions else 1

    detail = ResumeDetailResponse(
        id=resume.id,
        student_id=resume.student_id,
        title=resume.title,
        file_name=resume.file_name,
        file_size_bytes=resume.file_size_bytes,
        mime_type=resume.mime_type,
        is_default=resume.is_default,
        current_version=current_ver,
        created_at=resume.created_at,
        updated_at=resume.updated_at,
        versions=versions,
        analysis=analysis,
        extracted_data=extracted,
    )

    return APIResponse(
        success=True,
        data=detail,
        message="Resume details retrieved successfully."
    )


@router.get("/{resume_id}/download")
def download_resume(
    resume_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Securely downloads the resume file with verification of student ownership, recruiter authorization, or institutional oversight."""
    from app.models.resume import Resume
    from app.models.recruiter import RecruiterProfile
    from app.models.application import Application
    from app.models.job import Job
    from app.models.user import UserRole

    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    if current_user.role in [UserRole.ADMIN, UserRole.TPO]:
        pass
    elif current_user.role == UserRole.STUDENT:
        student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if not student or resume.student_id != student.id:
            raise HTTPException(status_code=403, detail="Unauthorized: You can only download your own resumes.")
    elif current_user.role == UserRole.RECRUITER:
        recruiter = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == current_user.id).first()
        if not recruiter:
            raise HTTPException(status_code=403, detail="Recruiter profile not found.")
        app_exists = db.query(Application).join(Job).filter(
            Application.resume_id == resume_id,
            Job.company_id == recruiter.company_id
        ).first()
        if not app_exists:
            raise HTTPException(status_code=403, detail="Unauthorized: Candidate has not applied to your organization.")
    else:
        raise HTTPException(status_code=403, detail="Unauthorized access.")

    if not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="File not found on server storage.")

    return FileResponse(
        path=resume.file_path,
        media_type=resume.mime_type,
        filename=resume.file_name,
        headers={"Content-Disposition": f'attachment; filename="{resume.file_name}"'}
    )


@router.delete("/{resume_id}", response_model=APIResponse[bool])
def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Deletes a resume, all versions, and physical disk files."""
    student = _get_student(current_user, db)
    success = ResumeService.delete_resume(resume_id, student.id, db)
    return APIResponse(
        success=True,
        data=success,
        message="Resume deleted successfully."
    )


@router.post("/{resume_id}/apply-extracted", response_model=APIResponse[ApplyExtractedDataResponse])
def apply_extracted_resume_data(
    resume_id: str,
    payload: ApplyExtractedDataRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Imports student-approved extracted resume fields into the profile.
    Protects existing manually entered profile data by default.
    """
    student = _get_student(current_user, db)
    result = ResumeService.apply_extracted_data_to_profile(
        resume_id=resume_id,
        student_id=student.id,
        options=payload.model_dump(),
        db=db,
    )

    return APIResponse(
        success=True,
        data=ApplyExtractedDataResponse(
            success=result["success"],
            message=result["message"],
            applied_sections=result["applied_sections"],
            new_profile_completion=result["new_profile_completion"],
        ),
        message=result["message"]
    )


# --- Phase 8: AI-Powered Resume Analyzer Endpoints ---

@router.post("/{resume_id}/analyze", response_model=APIResponse[ResumeAnalysisDetailResponse])
async def trigger_resume_analysis(
    resume_id: str,
    weights_input: Optional[ScoringWeightsInput] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Executes comprehensive 13-dimension AI analysis on the selected resume.
    Evaluates structure, skills, projects, experience, education, achievements, and readability out of 100.
    """
    weights = None
    if weights_input:
        provided = {k: v for k, v in weights_input.model_dump().items() if v is not None}
        if provided:
            weights = ScoringWeights(**provided)

    analysis_res = await ResumeAnalysisService.analyze_resume(
        db=db,
        student_user=current_user,
        resume_id=resume_id,
        weights=weights
    )

    return APIResponse(
        success=True,
        data=analysis_res,
        message="Resume analyzed successfully."
    )


@router.post("/{resume_id}/analyze-job", response_model=APIResponse[ResumeAnalysisDetailResponse])
async def trigger_job_specific_analysis(
    resume_id: str,
    payload: JobSpecificAnalysisRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Compares the selected resume directly against a target job requisition.
    Identifies relevant skills, missing keywords, project alignment, and weakly represented criteria.
    """
    weights = None
    if payload.weights:
        provided = {k: v for k, v in payload.weights.model_dump().items() if v is not None}
        if provided:
            weights = ScoringWeights(**provided)

    analysis_res = await ResumeAnalysisService.analyze_resume(
        db=db,
        student_user=current_user,
        resume_id=resume_id,
        weights=weights,
        job_id=payload.job_id
    )

    return APIResponse(
        success=True,
        data=analysis_res,
        message=f"Job-specific resume comparison completed."
    )


@router.get("/{resume_id}/analysis", response_model=APIResponse[ResumeAnalysisDetailResponse])
async def get_latest_resume_analysis(
    resume_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieves the latest multi-dimensional analysis report for the specified resume."""
    analysis_res = await ResumeAnalysisService.get_latest_analysis(
        db=db,
        student_user=current_user,
        resume_id=resume_id
    )

    return APIResponse(
        success=True,
        data=analysis_res,
        message="Resume analysis report retrieved successfully."
    )


@router.get("/{resume_id}/analysis-history", response_model=APIResponse[List[AnalysisHistoryItemResponse]])
def get_resume_analysis_history(
    resume_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieves all past analytical snapshots for the specified resume."""
    history = ResumeAnalysisService.get_analysis_history(
        db=db,
        student_user=current_user,
        resume_id=resume_id
    )

    return APIResponse(
        success=True,
        data=history,
        message=f"Retrieved {len(history)} historical analysis records."
    )


@router.get("/{resume_id}/analysis/export-pdf")
async def export_resume_analysis_pdf(
    resume_id: str,
    history_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Generates and downloads an executive-styled PDF resume audit report."""
    pdf_bytes, filename = await ResumeAnalysisService.export_pdf_report(
        db=db,
        student_user=current_user,
        resume_id=resume_id,
        history_id=history_id
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "application/pdf"
        }
    )


