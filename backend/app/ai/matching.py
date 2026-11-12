"""
AI Semantic Match Engine for CareerBridge.
Calculates semantic similarity, skill overlap, and academic eligibility criteria
to produce a transparent, deterministic composite compatibility score.
"""

import re
from typing import Any, Dict, List, Optional, Set, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.ai.taxonomy import normalize_skill_name


def _normalize_dept_name(name: str) -> str:
    """Helper to clean department string for robust comparison."""
    if not name:
        return ""
    cleaned = name.lower()
    cleaned = re.sub(r"[^a-z0-9]", "", cleaned)
    # Common acronym expansions
    replacements = {
        "cse": "computerscience",
        "it": "informationtechnology",
        "ece": "electronicscommunication",
        "eee": "electricalelectronics",
        "me": "mechanicalengineering",
        "ce": "civilengineering",
        "ai": "artificialintelligence",
        "aiml": "artificialintelligencemachinelearning",
        "ds": "datascience",
    }
    return replacements.get(cleaned, cleaned)


def check_department_match(student_dept: str, allowed_depts: List[str]) -> bool:
    """
    Checks if student's department satisfies the allowed departments list.
    Supports case-insensitive, partial matching and standard acronyms.
    """
    if not allowed_depts or "all" in [d.lower() for d in allowed_depts]:
        return True

    norm_student = _normalize_dept_name(student_dept)
    if not norm_student:
        return False

    for allowed in allowed_depts:
        norm_allowed = _normalize_dept_name(allowed)
        if norm_allowed in norm_student or norm_student in norm_allowed:
            return True

    return False


def compute_semantic_similarity(candidate_text: str, job_text: str) -> float:
    """
    Calculates TF-IDF cosine similarity between candidate profile/resume text and job description.
    Returns float in range [0.0, 1.0].
    """
    if not candidate_text.strip() or not job_text.strip():
        return 0.35

    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            max_features=1000,
            ngram_range=(1, 2),
            token_pattern=r"(?u)\b[a-zA-Z0-9+#./-]+\b"
        )
        tfidf_matrix = vectorizer.fit_transform([job_text, candidate_text])
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        # Map raw cosine similarity (typically 0.1 - 0.7 for resumes/JDs) to a scaled realistic score
        scaled = float(np.clip(sim * 1.5, 0.05, 1.0))
        return round(scaled, 4)
    except Exception:
        return 0.40


def evaluate_candidate_for_job(
    student_profile: Any,
    job: Any,
    resume_text: Optional[str] = None
) -> Dict[str, Any]:
    """
    Comprehensive candidate match evaluation.
    Evaluates:
      1. Semantic similarity between resume/profile text and JD.
      2. Direct mandatory and preferred skill overlap.
      3. Institutional academic eligibility checks (CGPA, backlogs, department, grad year).
      4. Composite match score:
         Composite = 0.50 * SemanticSim + 0.35 * SkillOverlap + 0.15 * EligibilityScore
    """
    # 1. Prepare Student Competencies
    student_skill_names: Set[str] = set()
    if hasattr(student_profile, "skills") and student_profile.skills:
        for s in student_profile.skills:
            if hasattr(s, "skill") and s.skill:
                canonical, _ = normalize_skill_name(s.skill.name)
                student_skill_names.add(canonical)
            elif isinstance(s, dict) and "name" in s:
                canonical, _ = normalize_skill_name(s["name"])
                student_skill_names.add(canonical)
            elif isinstance(s, str):
                canonical, _ = normalize_skill_name(s)
                student_skill_names.add(canonical)

    # 2. Prepare Job Skills
    mandatory_skills: Set[str] = set()
    preferred_skills: Set[str] = set()

    if hasattr(job, "skills") and job.skills:
        for js in job.skills:
            name = js.skill.name if hasattr(js, "skill") and js.skill else str(js)
            canonical, _ = normalize_skill_name(name)
            if getattr(js, "is_mandatory", True):
                mandatory_skills.add(canonical)
            else:
                preferred_skills.add(canonical)

    all_job_skills = mandatory_skills.union(preferred_skills)

    # If job has no explicit skills in relation, extract from description
    if not all_job_skills and hasattr(job, "description") and job.description:
        from app.ai.taxonomy import extract_skills_from_text
        extracted = extract_skills_from_text(f"{job.title} {job.description} {getattr(job, 'requirements', '')}")
        for es in extracted:
            mandatory_skills.add(es["name"])
        all_job_skills = mandatory_skills

    # Calculate Skill Overlap
    matched_mandatory = mandatory_skills.intersection(student_skill_names)
    matched_preferred = preferred_skills.intersection(student_skill_names)
    matched_all = all_job_skills.intersection(student_skill_names)
    missing_all = all_job_skills.difference(student_skill_names)

    if mandatory_skills:
        mand_ratio = len(matched_mandatory) / len(mandatory_skills)
    else:
        mand_ratio = 1.0

    if preferred_skills:
        pref_ratio = len(matched_preferred) / len(preferred_skills)
    else:
        pref_ratio = 1.0

    skill_overlap_ratio = round(float(0.75 * mand_ratio + 0.25 * pref_ratio), 4)

    # 3. Academic Eligibility Checks
    academic = None
    if hasattr(student_profile, "academic_records") and student_profile.academic_records:
        academic = student_profile.academic_records[0]

    cgpa = float(academic.cgpa_or_percentage) if academic and academic.cgpa_or_percentage is not None else 0.0
    backlogs = int(academic.backlogs_count) if academic and academic.backlogs_count is not None else 0
    dept = str(academic.department) if academic and academic.department else ""
    grad_year = int(academic.end_year) if academic and academic.end_year else 0
    gender = getattr(student_profile, "gender", None)
    if hasattr(gender, "value"):
        gender = gender.value

    eligibility = getattr(job, "eligibility", None)

    cgpa_req = float(eligibility.min_cgpa) if eligibility and eligibility.min_cgpa is not None else 0.0
    max_backlogs = int(eligibility.max_backlogs_allowed) if eligibility and eligibility.max_backlogs_allowed is not None else 0
    allowed_depts = list(eligibility.allowed_departments) if eligibility and eligibility.allowed_departments else []
    allowed_years = list(eligibility.allowed_grad_years) if eligibility and eligibility.allowed_grad_years else []
    gender_pref = getattr(eligibility, "gender_preference", "any")
    if hasattr(gender_pref, "value"):
        gender_pref = gender_pref.value

    cgpa_met = cgpa >= cgpa_req
    backlogs_met = backlogs <= max_backlogs
    dept_met = check_department_match(dept, allowed_depts)
    grad_year_met = (not allowed_years) or (grad_year in allowed_years)
    gender_met = (not gender_pref or gender_pref == "any") or (str(gender).lower() == "female" and gender_pref == "female_only")

    ineligible_reasons: List[str] = []
    if not cgpa_met:
        ineligible_reasons.append(f"CGPA {cgpa:.2f} is below minimum requirement of {cgpa_req:.2f}")
    if not backlogs_met:
        ineligible_reasons.append(f"Current backlogs ({backlogs}) exceed maximum allowed ({max_backlogs})")
    if not dept_met:
        ineligible_reasons.append(f"Department '{dept}' is not in allowed list: {', '.join(allowed_depts)}")
    if not grad_year_met:
        ineligible_reasons.append(f"Graduation year {grad_year} is not in allowed batch: {allowed_years}")
    if not gender_met:
        ineligible_reasons.append(f"Opportunity specifies preference: {gender_pref}")

    is_eligible = len(ineligible_reasons) == 0

    # 4. Semantic Similarity Calculation
    candidate_corpus_parts = [
        str(getattr(student_profile, "full_name", "") or ""),
        str(getattr(student_profile, "bio", "") or ""),
        " ".join(sorted(student_skill_names)),
        str(resume_text or "")
    ]
    # Add projects if present
    if hasattr(student_profile, "projects") and student_profile.projects:
        for p in student_profile.projects:
            techs = getattr(p, "technologies_used", None) or getattr(p, "technologies", None) or ""
            if isinstance(techs, list):
                techs_str = " ".join(str(t) for t in techs)
            else:
                techs_str = str(techs)
            candidate_corpus_parts.append(f"{str(getattr(p, 'title', '') or '')} {str(getattr(p, 'description', '') or '')} {techs_str}")
    # Add experience if present
    if hasattr(student_profile, "experiences") and student_profile.experiences:
        for exp in student_profile.experiences:
            role = getattr(exp, "role_title", "") or getattr(exp, "job_title", "")
            candidate_corpus_parts.append(f"{str(role)} {str(getattr(exp, 'company_name', '') or '')} {str(getattr(exp, 'description', '') or '')}")

    candidate_text = " ".join(str(part or "") for part in candidate_corpus_parts)

    job_corpus_parts = [
        str(getattr(job, "title", "") or ""),
        str(getattr(job, "description", "") or ""),
        str(getattr(job, "requirements", "") or ""),
        " ".join(sorted(all_job_skills))
    ]
    job_text = " ".join(str(part or "") for part in job_corpus_parts)

    semantic_sim = compute_semantic_similarity(candidate_text, job_text)

    # 5. Composite Score Computation
    # Composite = 0.50 * Semantic + 0.35 * SkillOverlap + 0.15 * Eligibility
    eligibility_weight_score = 1.0 if is_eligible else 0.40
    raw_composite = (0.50 * semantic_sim) + (0.35 * skill_overlap_ratio) + (0.15 * eligibility_weight_score)
    final_percentage = round(float(np.clip(raw_composite * 100.0, 15.0, 99.0)), 1)

    return {
        "semantic_similarity": semantic_sim,
        "skill_overlap_ratio": skill_overlap_ratio,
        "composite_score": final_percentage,
        "matched_skills": sorted(list(matched_all)),
        "missing_skills": sorted(list(missing_all)),
        "is_eligible": is_eligible,
        "eligibility_breakdown": {
            "is_eligible": is_eligible,
            "cgpa_met": cgpa_met,
            "cgpa_required": cgpa_req,
            "cgpa_student": cgpa,
            "backlogs_met": backlogs_met,
            "backlogs_max": max_backlogs,
            "backlogs_student": backlogs,
            "department_met": dept_met,
            "department_allowed": allowed_depts,
            "department_student": dept,
            "grad_year_met": grad_year_met,
            "grad_years_allowed": allowed_years,
            "grad_year_student": grad_year,
            "gender_met": gender_met,
            "reasons_if_ineligible": ineligible_reasons,
        }
    }
