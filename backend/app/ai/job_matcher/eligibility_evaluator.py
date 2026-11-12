"""
Hard Eligibility Evaluation Engine for CareerBridge.
Audits candidate academic criteria (CGPA, active backlogs, graduation year, department)
against employer requisitions.
Guarantees strict separation between academic eligibility and AI semantic similarity.
Handles missing profile information gracefully as 'unknown' rather than punitive failure.
"""

import enum
from typing import Dict, List, Optional, Any, Set, Tuple
from pydantic import BaseModel, Field


class EligibilityStatus(str, enum.Enum):
    ELIGIBLE = "eligible"
    NOT_ELIGIBLE = "not_eligible"
    UNKNOWN = "unknown"


# Canonical department synonym mapping
DEPARTMENT_SYNONYMS: Dict[str, Set[str]] = {
    "Computer Science and Engineering": {
        "cse", "cs", "computer science", "computer science and engineering",
        "computer science & engineering", "comp sci", "software engineering",
        "information technology", "it", "information science", "ise", "csit",
        "computer engineering"
    },
    "Electronics and Communication Engineering": {
        "ece", "electronics and communication engineering", "electronics & communication",
        "electronics and communication", "electronics", "telecommunication"
    },
    "Electrical and Electronics Engineering": {
        "eee", "electrical engineering", "electrical and electronics engineering",
        "electrical & electronics", "electrical"
    },
    "Mechanical Engineering": {
        "me", "mechanical", "mechanical engineering"
    },
    "Civil Engineering": {
        "ce", "civil", "civil engineering"
    },
    "Chemical Engineering": {
        "chem", "chemical", "chemical engineering"
    },
    "Biotechnology": {
        "biotech", "biotechnology", "bio technology"
    },
    "Data Science and AI": {
        "data science", "ai & ds", "aids", "ai/ds", "artificial intelligence",
        "ai and machine learning", "aiml", "ai/ml"
    }
}


def normalize_department_name(dept_raw: Optional[str]) -> str:
    """Normalizes raw department strings into canonical institutional names."""
    if not dept_raw or not str(dept_raw).strip():
        return ""

    cleaned = str(dept_raw).strip().lower()
    for canonical, synonyms in DEPARTMENT_SYNONYMS.items():
        if cleaned in synonyms or any(s in cleaned for s in synonyms):
            return canonical

    return str(dept_raw).strip().title()


def is_department_allowed(student_dept: Optional[str], allowed_departments: Optional[List[str]]) -> Tuple[bool, bool]:
    """
    Returns (is_match, is_unknown).
    If allowed_departments is None or empty, all departments are eligible -> (True, False).
    If student_dept is empty/None -> (False, True).
    """
    if not allowed_departments:
        return True, False

    if not student_dept or not str(student_dept).strip():
        return False, True

    norm_student = normalize_department_name(student_dept).lower()

    for allowed in allowed_departments:
        if not allowed or not str(allowed).strip():
            continue
        norm_allowed = normalize_department_name(allowed).lower()
        if norm_student == norm_allowed:
            return True, False
        # Also check synonym overlap
        for canonical, syns in DEPARTMENT_SYNONYMS.items():
            if norm_student == canonical.lower() and norm_allowed == canonical.lower():
                return True, False
            if norm_student in syns and norm_allowed in syns:
                return True, False

    return False, False


class EligibilityResult(BaseModel):
    status: EligibilityStatus
    is_eligible: bool
    failed_reasons: List[str] = Field(default_factory=list)
    passed_checks: List[str] = Field(default_factory=list)
    unknown_checks: List[str] = Field(default_factory=list)


def evaluate_eligibility(
    student_profile: Dict[str, Any],
    job_eligibility: Optional[Dict[str, Any]] = None
) -> EligibilityResult:
    """
    Executes hard criteria evaluation:
    1. Minimum CGPA
    2. Maximum Allowed Backlogs
    3. Graduation Batch / Year
    4. Degree & Department Eligibility

    Rules:
    - If any configured hard requirement is explicitly violated -> NOT_ELIGIBLE.
    - If criteria cannot be verified because the student's profile lacks the data -> UNKNOWN.
    - If all verifiable criteria pass and no required data is missing -> ELIGIBLE.
    """
    if not job_eligibility:
        return EligibilityResult(
            status=EligibilityStatus.ELIGIBLE,
            is_eligible=True,
            passed_checks=["No restricted eligibility criteria specified for this requisition."]
        )

    failed_reasons: List[str] = []
    passed_checks: List[str] = []
    unknown_checks: List[str] = []

    # 1. CGPA Check
    min_cgpa = job_eligibility.get("min_cgpa")
    student_cgpa = student_profile.get("cgpa")
    if min_cgpa is not None and float(min_cgpa) > 0:
        if student_cgpa is None or student_cgpa == "":
            unknown_checks.append(f"CGPA not provided in academic profile (Requisition requires min {min_cgpa:.1f})")
        else:
            try:
                cgpa_val = float(student_cgpa)
                if cgpa_val < float(min_cgpa):
                    failed_reasons.append(f"CGPA {cgpa_val:.2f} is below minimum requirement of {min_cgpa:.1f}")
                else:
                    passed_checks.append(f"CGPA {cgpa_val:.2f} satisfies minimum requirement ({min_cgpa:.1f})")
            except (ValueError, TypeError):
                unknown_checks.append(f"Unable to parse candidate CGPA '{student_cgpa}'")

    # 2. Backlogs Check
    max_backlogs = job_eligibility.get("max_backlogs_allowed")
    student_backlogs = student_profile.get("active_backlogs")
    if max_backlogs is not None:
        if student_backlogs is None or student_backlogs == "":
            # If not explicitly tracked, note as unknown
            unknown_checks.append(f"Backlog history not recorded in profile (Requisition allows max {max_backlogs})")
        else:
            try:
                backlogs_val = int(student_backlogs)
                if backlogs_val > int(max_backlogs):
                    failed_reasons.append(f"Active backlogs ({backlogs_val}) exceed maximum allowed ({max_backlogs})")
                else:
                    passed_checks.append(f"Active backlogs ({backlogs_val}) within allowed limit ({max_backlogs})")
            except (ValueError, TypeError):
                unknown_checks.append(f"Unable to parse active backlogs '{student_backlogs}'")

    # 3. Graduation Year Check
    allowed_grad_years = job_eligibility.get("allowed_grad_years")
    student_grad_year = student_profile.get("graduation_year")
    if allowed_grad_years:
        if not student_grad_year:
            unknown_checks.append(f"Graduation year not provided (Requisition seeks {allowed_grad_years})")
        else:
            try:
                grad_val = int(student_grad_year)
                allowed_int_years = [int(y) for y in allowed_grad_years if y is not None]
                if grad_val not in allowed_int_years:
                    failed_reasons.append(f"Graduation year {grad_val} is outside allowed batches {allowed_int_years}")
                else:
                    passed_checks.append(f"Graduation batch {grad_val} matches eligible batches")
            except (ValueError, TypeError):
                unknown_checks.append(f"Unable to parse graduation year '{student_grad_year}'")

    # 4. Department Check
    allowed_departments = job_eligibility.get("allowed_departments")
    student_dept = student_profile.get("department")
    if allowed_departments:
        dept_match, dept_unknown = is_department_allowed(student_dept, allowed_departments)
        if dept_unknown:
            unknown_checks.append(f"Academic department not specified in profile (Requisition seeks {allowed_departments})")
        elif not dept_match:
            norm_student = normalize_department_name(student_dept)
            failed_reasons.append(f"Department '{norm_student}' is not eligible (Allowed: {', '.join(allowed_departments)})")
        else:
            norm_student = normalize_department_name(student_dept)
            passed_checks.append(f"Department '{norm_student}' matches eligible campus departments")

    # Final Status Determination
    if failed_reasons:
        return EligibilityResult(
            status=EligibilityStatus.NOT_ELIGIBLE,
            is_eligible=False,
            failed_reasons=failed_reasons,
            passed_checks=passed_checks,
            unknown_checks=unknown_checks
        )

    if unknown_checks:
        return EligibilityResult(
            status=EligibilityStatus.UNKNOWN,
            is_eligible=True,  # conditionally eligible pending data verification
            failed_reasons=[],
            passed_checks=passed_checks,
            unknown_checks=unknown_checks
        )

    return EligibilityResult(
        status=EligibilityStatus.ELIGIBLE,
        is_eligible=True,
        failed_reasons=[],
        passed_checks=passed_checks,
        unknown_checks=[]
    )
