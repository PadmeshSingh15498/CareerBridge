"""
Career Readiness Index (CRI) Engine for CareerBridge.
Calculates a transparent, mathematically rigorous 6-pillar employability index out of 100.
Explicitly identifies missing profile dimensions and surfaces highest-impact improvement opportunities.
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class CRIWeights(BaseModel):
    technical_skills: float = Field(0.30, ge=0.0, le=1.0)
    projects: float = Field(0.20, ge=0.0, le=1.0)
    resume_quality: float = Field(0.15, ge=0.0, le=1.0)
    academic_eligibility: float = Field(0.15, ge=0.0, le=1.0)
    interview_preparation: float = Field(0.10, ge=0.0, le=1.0)
    certifications_experience: float = Field(0.10, ge=0.0, le=1.0)

    def validate_sum(self):
        total = (
            self.technical_skills +
            self.projects +
            self.resume_quality +
            self.academic_eligibility +
            self.interview_preparation +
            self.certifications_experience
        )
        if abs(total - 1.0) > 1e-4:
            raise ValueError(f"CRI weights must sum to 1.0, current sum is {total}")


DEFAULT_CRI_WEIGHTS = CRIWeights()


def compute_career_readiness_index(
    student_profile_data: Dict[str, Any],
    weights: CRIWeights = DEFAULT_CRI_WEIGHTS
) -> Dict[str, Any]:
    """
    Computes Career Readiness Index (0-100) across 6 core pillars.
    
    student_profile_data schema:
      - skills: list of skills (verified flag, proficiency)
      - projects: list of projects (technologies, github_url, live_demo_url, description)
      - resume_analysis: dict or None (ats_score out of 100)
      - academic: dict (cgpa, backlogs_count)
      - interview_sessions: list of sessions (overall_score, count)
      - certifications: list of certs
      - experiences: list of work experiences
    """
    weights.validate_sum()
    missing_data: List[Dict[str, Any]] = []
    improvement_opportunities: List[Dict[str, Any]] = []

    # 1. Technical Skills (Max 30 pts)
    # Evaluated on count of skills, proficiency depth, and verification
    skills = student_profile_data.get("skills", [])
    if not skills:
        tech_score = 0.0
        missing_data.append({
            "category": "Technical Skills",
            "points_missed": 30.0,
            "reason": "No technical skills recorded in profile.",
            "unlock_action": "Add at least 5 technical skills with proficiency levels."
        })
        improvement_opportunities.append({
            "title": "Add Verified Technical Skills",
            "potential_gain": 18.0,
            "difficulty": "Easy",
            "category": "Technical Skills",
            "description": "Log your primary programming languages, frameworks, and databases."
        })
    else:
        # Base count credit (up to 12 skills)
        count_credit = min(1.0, len(skills) / 8.0) * 0.50
        # Proficiency credit
        prof_sum = 0
        for s in skills:
            p = (s.get("proficiency_level") or "intermediate").lower()
            if p == "expert": prof_sum += 4
            elif p == "advanced": prof_sum += 3
            elif p == "intermediate": prof_sum += 2
            else: prof_sum += 1
        prof_credit = min(1.0, (prof_sum / max(1, len(skills))) / 3.0) * 0.30
        # Verified credit
        verified_count = sum(1 for s in skills if s.get("is_verified"))
        ver_credit = min(1.0, verified_count / 4.0) * 0.20 if verified_count else 0.05
        tech_score = (count_credit + prof_credit + ver_credit) * (weights.technical_skills * 100.0)
        tech_score = min(weights.technical_skills * 100.0, tech_score)

        if len(skills) < 6:
            improvement_opportunities.append({
                "title": "Expand Core Skill Coverage",
                "potential_gain": round((6 - len(skills)) * 2.2, 1),
                "difficulty": "Easy",
                "category": "Technical Skills",
                "description": f"Currently {len(skills)} skills logged. Industry requisitions prefer at least 6 core competencies."
            })
        if verified_count < 2:
            improvement_opportunities.append({
                "title": "Verify Skills via Project Evidence",
                "potential_gain": 4.5,
                "difficulty": "Medium",
                "category": "Technical Skills",
                "description": "Link your GitHub projects to verify self-declared proficiencies."
            })

    # 2. Projects (Max 20 pts)
    projects = student_profile_data.get("projects", [])
    if not projects:
        proj_score = 0.0
        missing_data.append({
            "category": "Projects",
            "points_missed": 20.0,
            "reason": "No student projects recorded.",
            "unlock_action": "Add 2+ production-grade software projects with GitHub repositories."
        })
        improvement_opportunities.append({
            "title": "Publish Production Project with GitHub",
            "potential_gain": 14.0,
            "difficulty": "Medium",
            "category": "Projects",
            "description": "Add a capstone project with clear technical architecture and repository URL."
        })
    else:
        # 10 pts for having 2+ projects
        p_count_pts = min(10.0, len(projects) * 5.0)
        # 5 pts for GitHub repository proof
        has_gh = sum(1 for p in projects if p.get("github_url"))
        gh_pts = min(5.0, has_gh * 2.5)
        # 5 pts for live deployment or deep tech description
        has_demo = sum(1 for p in projects if p.get("live_demo_url"))
        demo_pts = min(5.0, has_demo * 2.5)
        proj_score = p_count_pts + gh_pts + demo_pts
        proj_score = min(weights.projects * 100.0, proj_score)

        if not has_gh:
            improvement_opportunities.append({
                "title": "Add GitHub URLs to Projects",
                "potential_gain": 5.0,
                "difficulty": "Easy",
                "category": "Projects",
                "description": "Recruiters and matching algorithms prioritize verifiable open-source code repositories."
            })
        if not has_demo:
            improvement_opportunities.append({
                "title": "Deploy Project Live Demo",
                "potential_gain": 3.5,
                "difficulty": "Medium",
                "category": "Projects",
                "description": "Host your frontend or API on Vercel, Netlify, or Render to demonstrate deployment capability."
            })

    # 3. Resume Quality (Max 15 pts)
    resume_analysis = student_profile_data.get("resume_analysis")
    if not resume_analysis or not resume_analysis.get("ats_score"):
        resume_score = 0.0
        missing_data.append({
            "category": "Resume Quality",
            "points_missed": 15.0,
            "reason": "No ATS resume analysis performed.",
            "unlock_action": "Upload your primary PDF resume and run the AI Resume Analyzer."
        })
        improvement_opportunities.append({
            "title": "Upload & Benchmark Resume",
            "potential_gain": 12.0,
            "difficulty": "Easy",
            "category": "Resume Quality",
            "description": "Run the PyMuPDF ATS Analyzer to evaluate formatting, quantifiable impact, and keyword density."
        })
    else:
        raw_ats = float(resume_analysis.get("ats_score", 0.0))
        resume_score = (raw_ats / 100.0) * (weights.resume_quality * 100.0)
        resume_score = min(weights.resume_quality * 100.0, resume_score)
        if raw_ats < 85.0:
            improvement_opportunities.append({
                "title": "Elevate ATS Resume Score to 85+",
                "potential_gain": round((85.0 - raw_ats) * 0.15, 1),
                "difficulty": "Medium",
                "category": "Resume Quality",
                "description": "Adopt active action verbs and quantify project achievements with metrics (e.g. 'reduced latency by 40%')."
            })

    # 4. Academic Eligibility (Max 15 pts)
    academic = student_profile_data.get("academic")
    if not academic or academic.get("cgpa") is None:
        acad_score = 7.5  # default baseline if unrecorded
        missing_data.append({
            "category": "Academic Eligibility",
            "points_missed": 7.5,
            "reason": "Academic record is incomplete or unverified by TPO.",
            "unlock_action": "Complete university degree, department, and CGPA in your academic profile."
        })
    else:
        cgpa = float(academic.get("cgpa", 0.0))
        backlogs = int(academic.get("backlogs_count", 0))
        # 10.0 CGPA maps to 15 pts
        cgpa_pts = (min(10.0, max(0.0, cgpa)) / 10.0) * (weights.academic_eligibility * 100.0)
        # Backlog deduction: 2 pts deducted per active backlog
        backlog_deduction = min(6.0, backlogs * 2.0)
        acad_score = max(2.0, cgpa_pts - backlog_deduction)

    # 5. Interview Preparation (Max 10 pts)
    interviews = student_profile_data.get("interview_sessions", [])
    if not interviews:
        interview_score = 0.0
        missing_data.append({
            "category": "Interview Preparation",
            "points_missed": 10.0,
            "reason": "No mock interview sessions completed.",
            "unlock_action": "Take an AI mock interview simulator drill using the STAR methodology."
        })
        improvement_opportunities.append({
            "title": "Complete AI Mock Interview Session",
            "potential_gain": 8.0,
            "difficulty": "Medium",
            "category": "Interview Preparation",
            "description": "Practice technical and behavioral questions to simulate live corporate placement rounds."
        })
    else:
        # Average score of interview sessions
        avg_score = sum(i.get("overall_score", 70) for i in interviews) / max(1, len(interviews))
        interview_score = (avg_score / 100.0) * (weights.interview_preparation * 100.0)
        interview_score = min(weights.interview_preparation * 100.0, interview_score)

    # 6. Certifications & Experience (Max 10 pts)
    certs = student_profile_data.get("certifications", [])
    experiences = student_profile_data.get("experiences", [])
    if not certs and not experiences:
        cert_score = 0.0
        missing_data.append({
            "category": "Certifications & Experience",
            "points_missed": 10.0,
            "reason": "No professional certifications or industry internships logged.",
            "unlock_action": "Add accredited certifications (AWS, Oracle, Coursera) or internship experiences."
        })
        improvement_opportunities.append({
            "title": "Add Industry Certifications or Internship",
            "potential_gain": 6.0,
            "difficulty": "Medium",
            "category": "Certifications & Experience",
            "description": "Log verified credentials or internships to demonstrate real-world engineering exposure."
        })
    else:
        cert_pts = min(5.0, len(certs) * 2.5)
        exp_pts = min(5.0, len(experiences) * 3.5)
        cert_score = cert_pts + exp_pts
        cert_score = min(weights.certifications_experience * 100.0, cert_score)

    overall_score = round(
        tech_score + proj_score + resume_score + acad_score + interview_score + cert_score,
        1
    )
    overall_score = max(5.0, min(99.0, overall_score))

    # Determine Tier
    if overall_score >= 85.0:
        tier_label = "Campus Placement Ready"
        tier_color = "#244D3D"
    elif overall_score >= 70.0:
        tier_label = "Interview Competitive"
        tier_color = "#C9E66B"
    elif overall_score >= 50.0:
        tier_label = "Actively Progressing"
        tier_color = "#E88B57"
    else:
        tier_label = "Foundational Development"
        tier_color = "#727B74"

    # Sort opportunities by highest ROI
    improvement_opportunities.sort(key=lambda x: x["potential_gain"], reverse=True)

    category_scores = {
        "technical_skills": {
            "name": "Technical Skills",
            "earned": round(tech_score, 1),
            "max": weights.technical_skills * 100.0,
            "percentage": round((tech_score / (weights.technical_skills * 100.0)) * 100.0, 1),
            "weight": f"{int(weights.technical_skills * 100)}%"
        },
        "projects": {
            "name": "Projects & Evidence",
            "earned": round(proj_score, 1),
            "max": weights.projects * 100.0,
            "percentage": round((proj_score / (weights.projects * 100.0)) * 100.0, 1),
            "weight": f"{int(weights.projects * 100)}%"
        },
        "resume_quality": {
            "name": "Resume Quality (ATS)",
            "earned": round(resume_score, 1),
            "max": weights.resume_quality * 100.0,
            "percentage": round((resume_score / (weights.resume_quality * 100.0)) * 100.0, 1),
            "weight": f"{int(weights.resume_quality * 100)}%"
        },
        "academic_eligibility": {
            "name": "Academic Criteria",
            "earned": round(acad_score, 1),
            "max": weights.academic_eligibility * 100.0,
            "percentage": round((acad_score / (weights.academic_eligibility * 100.0)) * 100.0, 1),
            "weight": f"{int(weights.academic_eligibility * 100)}%"
        },
        "interview_preparation": {
            "name": "Mock Interviews",
            "earned": round(interview_score, 1),
            "max": weights.interview_preparation * 100.0,
            "percentage": round((interview_score / (weights.interview_preparation * 100.0)) * 100.0, 1),
            "weight": f"{int(weights.interview_preparation * 100)}%"
        },
        "certifications_experience": {
            "name": "Certifications & Experience",
            "earned": round(cert_score, 1),
            "max": weights.certifications_experience * 100.0,
            "percentage": round((cert_score / (weights.certifications_experience * 100.0)) * 100.0, 1),
            "weight": f"{int(weights.certifications_experience * 100)}%"
        }
    }

    formula_str = (
        f"CRI ({overall_score}) = Technical Skills ({category_scores['technical_skills']['earned']}/30) + "
        f"Projects ({category_scores['projects']['earned']}/20) + "
        f"Resume ATS ({category_scores['resume_quality']['earned']}/15) + "
        f"Academics ({category_scores['academic_eligibility']['earned']}/15) + "
        f"Interviews ({category_scores['interview_preparation']['earned']}/10) + "
        f"Certs & Exp ({category_scores['certifications_experience']['earned']}/10)"
    )

    return {
        "overall_score": overall_score,
        "tier": tier_label,
        "tier_color": tier_color,
        "category_scores": category_scores,
        "missing_data": missing_data,
        "improvement_opportunities": improvement_opportunities[:5],
        "formula": formula_str,
        "weights": {
            "technical_skills": weights.technical_skills,
            "projects": weights.projects,
            "resume_quality": weights.resume_quality,
            "academic_eligibility": weights.academic_eligibility,
            "interview_preparation": weights.interview_preparation,
            "certifications_experience": weights.certifications_experience
        },
        "calculated_at": datetime.utcnow().isoformat(),
        "methodology_note": (
            "CareerBridge CRI is a deterministic composite index calibrated to corporate recruitment expectations. "
            "Unlike simple profile completion percentages, CRI evaluates evidence rigor (GitHub repos, ATS readability, "
            "and mock performance)."
        )
    }

