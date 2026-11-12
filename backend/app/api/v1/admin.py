"""
REST API Router for Placement Officer and University Administration Module.
Features:
- Administrative Dashboard with Zero Fabricated Metrics
- Student Management, CSV Bulk Import with Duplicate Detection & CSV Export
- Recruiter Verification, Approval, Rejection with Reason, Suspension, and Reactivation
- Job Requisition Approvals, Rejections, Corrections & Closures
- Placement Drives Management & Automated Student Eligibility Matching
- Institutional Placement Analytics (Department, Company, Trends, Salary, CRI, Skills)
- Certified PyMuPDF PDF Placement Summary and CSV Reports Generation
- Audit Trail Logging
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_roles
from app.models.user import User, UserRole
from app.schemas.common import APIResponse
from app.schemas.admin import (
    AdminDashboardMetricsResponse, StudentListResponse, StudentListItem,
    StudentStatusUpdateRequest, StudentCSVImportResult,
    RecruiterCompanyItem, RecruiterActionRequest,
    AdminJobItem, JobApprovalActionRequest,
    PlacementDriveCreateRequest, PlacementDriveUpdateRequest, PlacementDriveDetailResponse,
    EligibleStudentItem, PlacementAnalyticsResponse, AuditLogItem
)
from app.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["Placement Officer & University Administration"])


# =============================================================================
# 1. ADMINISTRATIVE DASHBOARD
# =============================================================================

@router.get("/dashboard", response_model=APIResponse[AdminDashboardMetricsResponse])
def get_admin_dashboard(
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Returns live university placement metrics calculated strictly from actual database records.
    Accompanied by transparent mathematical formulas for every single metric.
    """
    metrics = AdminService.get_dashboard_metrics(db)
    return APIResponse(
        success=True,
        message="Administrative dashboard metrics retrieved successfully.",
        data=metrics
    )


# =============================================================================
# 2. STUDENT MANAGEMENT (SEARCH, FILTER, VERIFY, IMPORT, EXPORT)
# =============================================================================

@router.get("/students", response_model=APIResponse[StudentListResponse])
def list_students(
    search: Optional[str] = Query(None, description="Search by name, roll number, or email"),
    department: Optional[str] = Query(None, description="Filter by department"),
    graduation_year: Optional[int] = Query(None, description="Filter by graduation year"),
    placement_status: Optional[str] = Query(None, description="Filter by placement status: unplaced, placed, opted_out"),
    is_verified: Optional[bool] = Query(None, description="Filter by profile verification status"),
    is_active: Optional[bool] = Query(None, description="Filter by account active status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """Lists students with comprehensive academic profiles and filters."""
    result = AdminService.list_students(
        db=db,
        search=search,
        department=department,
        graduation_year=graduation_year,
        placement_status=placement_status,
        is_verified=is_verified,
        is_active=is_active,
        page=page,
        page_size=page_size
    )
    return APIResponse(
        success=True,
        message="Student cohort retrieved successfully.",
        data=result
    )


@router.put("/students/{student_id}/status", response_model=APIResponse[StudentListItem])
def update_student_status(
    student_id: str,
    payload: StudentStatusUpdateRequest,
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """Verifies academic credentials, updates account status, or modifies placement status."""
    updated = AdminService.update_student_status(
        db=db,
        admin_user=current_user,
        student_id=student_id,
        payload=payload
    )
    return APIResponse(
        success=True,
        message="Student status updated successfully.",
        data=updated
    )


@router.post("/students/import-csv", response_model=APIResponse[StudentCSVImportResult])
async def import_students_csv(
    file: Optional[UploadFile] = File(None),
    csv_text: Optional[str] = Form(None),
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Imports student candidates from CSV file with automated duplicate detection
    against both roll number and university email address.
    """
    content = ""
    if file:
        file_bytes = await file.read()
        content = file_bytes.decode("utf-8", errors="replace")
    elif csv_text:
        content = csv_text
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a CSV file upload or csv_text form parameter."
        )

    result = AdminService.import_students_csv(
        db=db,
        admin_user=current_user,
        csv_content=content
    )
    return APIResponse(
        success=True,
        message=f"CSV processing finished: {result.imported_count} imported, {result.duplicates_skipped} duplicates skipped.",
        data=result
    )


@router.get("/students/export-csv")
def export_students_csv(
    department: Optional[str] = Query(None),
    graduation_year: Optional[int] = Query(None),
    placement_status: Optional[str] = Query(None),
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """Streams full student roster as an RFC-4180 compliant CSV document."""
    csv_data = AdminService.export_students_csv(
        db=db,
        department=department,
        graduation_year=graduation_year,
        placement_status=placement_status
    )
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=careerbridge_students_cohort.csv"}
    )


# =============================================================================
# 3. RECRUITER MANAGEMENT (VERIFY, APPROVE, REJECT, SUSPEND, REACTIVATE)
# =============================================================================

@router.get("/recruiters", response_model=APIResponse[List[RecruiterCompanyItem]])
def list_recruiters(
    search: Optional[str] = Query(None, description="Search company name or industry"),
    status_filter: Optional[str] = Query(None, description="Filter by verification_status: pending_verification, verified, rejected, suspended"),
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """Lists corporate hiring partners with verification details and recruitment metrics."""
    companies = AdminService.list_recruiters(
        db=db,
        search=search,
        status_filter=status_filter
    )
    return APIResponse(
        success=True,
        message="Corporate partners list retrieved.",
        data=companies
    )


@router.post("/recruiters/{company_id}/action", response_model=APIResponse[RecruiterCompanyItem])
def manage_recruiter_action(
    company_id: str,
    payload: RecruiterActionRequest,
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """Executes administrative action (approve, reject, suspend, reactivate) on a hiring partner."""
    updated = AdminService.manage_recruiter_company(
        db=db,
        admin_user=current_user,
        company_id=company_id,
        action=payload.action,
        reason=payload.reason
    )
    return APIResponse(
        success=True,
        message=f"Company status changed to '{updated.verification_status}'.",
        data=updated
    )


# =============================================================================
# 4. JOB APPROVAL WORKFLOW
# =============================================================================

@router.get("/jobs", response_model=APIResponse[List[AdminJobItem]])
def list_jobs(
    status_filter: Optional[str] = Query(None, description="Filter by status: pending_approval, active, draft, paused, closed"),
    search: Optional[str] = Query(None, description="Search job title or company name"),
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """Retrieves job requisitions with applicant metrics and approval states."""
    jobs = AdminService.list_jobs(
        db=db,
        status_filter=status_filter,
        search=search
    )
    return APIResponse(
        success=True,
        message="Job requisitions retrieved.",
        data=jobs
    )


@router.post("/jobs/{job_id}/action", response_model=APIResponse[AdminJobItem])
def review_job_action(
    job_id: str,
    payload: JobApprovalActionRequest,
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """Reviews job requisition: approve, reject, request corrections, or close."""
    job = AdminService.review_job_posting(
        db=db,
        admin_user=current_user,
        job_id=job_id,
        action=payload.action,
        comments=payload.comments
    )
    return APIResponse(
        success=True,
        message=f"Job requisition status changed to '{job.status}'.",
        data=job
    )


# =============================================================================
# 5. PLACEMENT DRIVES MANAGEMENT & ELIGIBILITY MATCHING
# =============================================================================

@router.get("/drives", response_model=APIResponse[List[PlacementDriveDetailResponse]])
def list_drives(
    academic_year: Optional[int] = Query(None, description="Filter by academic year"),
    status_filter: Optional[str] = Query(None, description="Filter by drive status: upcoming, in_progress, completed, cancelled"),
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """Lists campus placement drives with live registration and eligibility statistics."""
    drives = AdminService.list_drives(
        db=db,
        academic_year=academic_year,
        status_filter=status_filter
    )
    return APIResponse(
        success=True,
        message="Placement drives retrieved.",
        data=drives
    )


@router.post("/drives", response_model=APIResponse[PlacementDriveDetailResponse])
def create_placement_drive(
    payload: PlacementDriveCreateRequest,
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """Schedules a new institutional placement drive with eligibility criteria."""
    drive = AdminService.create_drive(
        db=db,
        admin_user=current_user,
        payload=payload
    )
    return APIResponse(
        success=True,
        message=f"Placement drive '{drive.title}' created successfully.",
        data=drive
    )


@router.get("/drives/{drive_id}/eligible-students", response_model=APIResponse[Dict[str, Any]])
def get_drive_eligible_students(
    drive_id: str,
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Automatically matches and retrieves all students meeting the drive's academic criteria
    (allowed departments, graduation year, minimum CGPA, and backlog limit).
    """
    drive, eligible_students = AdminService.get_drive_details_and_eligibility(db, drive_id)
    comp = drive.company
    return APIResponse(
        success=True,
        message=f"Identified {len(eligible_students)} eligible candidates for drive.",
        data={
            "drive_id": drive.id,
            "title": drive.title,
            "company_name": comp.name if comp else "Recruiting Partner",
            "academic_year": drive.academic_year,
            "min_cgpa": float(drive.min_cgpa),
            "max_backlogs_allowed": drive.max_backlogs_allowed,
            "allowed_departments": drive.allowed_departments,
            "total_eligible_count": len(eligible_students),
            "students": eligible_students
        }
    )


@router.post("/drives/{drive_id}/register-student", response_model=APIResponse[Dict[str, Any]])
def register_student_for_drive(
    drive_id: str,
    payload: Dict[str, str],
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """Enrolls an eligible candidate into a placement drive."""
    student_id = payload.get("student_id")
    if not student_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="student_id is required")

    result = AdminService.register_student_for_drive(
        db=db,
        admin_user=current_user,
        drive_id=drive_id,
        student_id=student_id
    )
    return APIResponse(
        success=True,
        message=result["message"],
        data=result
    )


# =============================================================================
# 6. PLACEMENT ANALYTICS
# =============================================================================

@router.get("/analytics", response_model=APIResponse[PlacementAnalyticsResponse])
def get_placement_analytics(
    academic_year: int = Query(2026, description="Academic cohort year"),
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """Returns deep placement analytics calculated from real MySQL records."""
    analytics = AdminService.get_placement_analytics(db, academic_year=academic_year)
    return APIResponse(
        success=True,
        message="Placement analytics retrieved successfully.",
        data=analytics
    )


# =============================================================================
# 7. REPORTS (PDF & CSV GENERATION)
# =============================================================================

@router.get("/reports/summary-pdf")
def download_summary_pdf(
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """Generates official multi-page PDF summary report using PyMuPDF."""
    pdf_bytes = AdminService.generate_placement_summary_pdf(db)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=careerbridge_placement_summary_2026.pdf"}
    )


@router.get("/reports/department-csv")
def download_department_csv(
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """Generates department-wise placement breakdown CSV."""
    csv_str = AdminService.generate_department_csv(db)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=department_placement_report.csv"}
    )


@router.get("/reports/company-csv")
def download_company_csv(
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """Generates company-wise recruitment report CSV."""
    csv_str = AdminService.generate_company_csv(db)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=company_recruitment_report.csv"}
    )


@router.get("/reports/student-csv")
def download_student_csv(
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """Generates comprehensive student cohort CSV."""
    csv_str = AdminService.export_students_csv(db)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=student_placement_report.csv"}
    )


@router.get("/reports/drive-csv")
def download_drive_csv(
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """Generates placement drive participation and outcome CSV."""
    csv_str = AdminService.generate_drive_report_csv(db)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=drive_participation_report.csv"}
    )


# =============================================================================
# 8. AUDIT LOGS
# =============================================================================

@router.get("/audit-logs", response_model=APIResponse[List[AuditLogItem]])
def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_roles(["tpo", "admin"])),
    db: Session = Depends(get_db)
):
    """Retrieves recent administrative action audit trail."""
    logs = AdminService.list_audit_logs(db, limit=limit)
    return APIResponse(
        success=True,
        message="Audit logs retrieved.",
        data=logs
    )

