"""
Deterministic 100-Point ATS Rubric Evaluator for CareerBridge.
Evaluates resumes across 4 objective pillars:
1. Section Completeness (25 pts)
2. Quantifiable Impact & STAR Action Verbs (25 pts)
3. Technical Skill Depth & Diversity (30 pts)
4. Layout, Length & Formatting Integrity (20 pts)
"""

from typing import Any, Dict, List, Tuple


def calculate_ats_score(parsed_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes a deterministic, explainable 100-point ATS evaluation.
    Returns:
    {
        "ats_score": int (0-100),
        "section_score": int (0-25),
        "metric_score": int (0-25),
        "skill_score": int (0-30),
        "format_score": int (0-20),
        "improvements": list[str]
    }
    """
    raw_text = parsed_data.get("raw_text", "")
    personal = parsed_data.get("personal", {})
    education = parsed_data.get("education", [])
    skills = parsed_data.get("skills", [])
    projects = parsed_data.get("projects", [])
    experience = parsed_data.get("experience", [])
    metrics = parsed_data.get("metrics", {})

    improvements: List[str] = []

    # =========================================================================
    # PILLAR 1: SECTION COMPLETENESS (25 PTS)
    # =========================================================================
    section_score = 0

    # Contact info: Email (2), Phone (1), LinkedIn/GitHub (2)
    contact_pts = 0
    if personal.get("email"):
        contact_pts += 2
    if personal.get("phone"):
        contact_pts += 1
    if personal.get("linkedin_url") or personal.get("github_url"):
        contact_pts += 2
    else:
        improvements.append("Add a verified LinkedIn or GitHub profile link to your contact header.")
    section_score += min(5, contact_pts)

    # Education (5 pts)
    if education and len(education) > 0 and education[0].get("institution_name"):
        section_score += 5
    else:
        improvements.append("Add an explicit Education section with institution name, degree, and graduation year.")

    # Experience / Internships (5 pts)
    if experience and len(experience) > 0:
        section_score += 5
    else:
        improvements.append("Add relevant internship, work experience, or open-source contribution history.")

    # Technical Skills Section (5 pts)
    if skills and len(skills) >= 4:
        section_score += 5
    else:
        improvements.append("Organize your technical skills into distinct categories (Languages, Frameworks, Tools).")

    # Projects with tech stacks (5 pts)
    if projects and len(projects) >= 1:
        section_score += 5
    else:
        improvements.append("Feature at least 2 technical projects with architecture descriptions and GitHub repositories.")

    # =========================================================================
    # PILLAR 2: QUANTIFIABLE METRICS & STAR ACTION VERBS (25 PTS)
    # =========================================================================
    metric_score = 0
    quant_count = metrics.get("quantifiable_metrics_count", 0)
    verbs_count = metrics.get("action_verbs_count", 0)

    # Metrics score (up to 15 pts: 3 pts per metric up to 5 metrics)
    quant_pts = min(15, quant_count * 3)
    metric_score += quant_pts
    if quant_count < 3:
        improvements.append("Quantify your project achievements using metrics, percentages (e.g. 'reduced latency by 40%'), or user scale.")

    # Action verbs score (up to 10 pts: 2 pts per STAR verb up to 5 verbs)
    verbs_pts = min(10, verbs_count * 2)
    metric_score += verbs_pts
    if verbs_count < 4:
        improvements.append("Start each bullet point with strong STAR action verbs (e.g., 'Architected', 'Implemented', 'Automated').")

    # =========================================================================
    # PILLAR 3: TECHNICAL SKILL DIVERSITY & DEPTH (30 PTS)
    # =========================================================================
    skill_score = 0
    categories_present = set(s.get("category") for s in skills)

    # Programming languages (10 pts)
    lang_skills = [s for s in skills if s.get("category") == "programming_language"]
    if len(lang_skills) >= 2:
        skill_score += 10
    elif len(lang_skills) == 1:
        skill_score += 6
        improvements.append("List at least 2 primary programming languages (e.g., Python, C++, TypeScript, Java).")
    else:
        improvements.append("Include core programming languages under a dedicated Skills header.")

    # Modern Frameworks (8 pts)
    fw_skills = [s for s in skills if s.get("category") == "framework"]
    if len(fw_skills) >= 2:
        skill_score += 8
    elif len(fw_skills) == 1:
        skill_score += 5
    else:
        improvements.append("Include full-stack or backend frameworks (e.g. Next.js, FastAPI, React, Spring Boot).")

    # Databases (6 pts)
    db_skills = [s for s in skills if s.get("category") == "database"]
    if len(db_skills) >= 1:
        skill_score += 6
    else:
        improvements.append("Add database competencies (e.g. MySQL, PostgreSQL, MongoDB, Redis).")

    # Cloud, DevOps & Developer Tools (6 pts)
    tool_skills = [s for s in skills if s.get("category") in ("cloud_devops", "tool")]
    if len(tool_skills) >= 2:
        skill_score += 6
    elif len(tool_skills) == 1:
        skill_score += 3
    else:
        improvements.append("Mention essential developer tooling and cloud platforms (Git, Docker, AWS, Postman).")

    # =========================================================================
    # PILLAR 4: LAYOUT, LENGTH & READABILITY (20 PTS)
    # =========================================================================
    format_score = 0
    word_count = len(raw_text.split())

    # Optimal 1-page/2-page student resume word count (300 to 900 words): 8 pts
    if 300 <= word_count <= 900:
        format_score += 8
    elif 200 <= word_count < 300:
        format_score += 5
        improvements.append("Expand on your project contributions and key responsibilities; your resume is slightly brief.")
    elif word_count > 900:
        format_score += 5
        improvements.append("Condense your resume to keep it concise and under 2 pages for standard campus ATS parsers.")
    else:
        format_score += 3

    # Section Headers Clarity (6 pts)
    if len(categories_present) >= 3:
        format_score += 6
    else:
        format_score += 3

    # Clean text density & formatting without scan artifacts (6 pts)
    if len(raw_text) > 400 and "@" in raw_text:
        format_score += 6
    else:
        format_score += 2

    # Composite Score
    total_ats_score = section_score + metric_score + skill_score + format_score
    total_ats_score = max(0, min(100, total_ats_score))

    if not improvements:
        improvements.append("Resume demonstrates high ATS alignment across sections, quantifiable metrics, and tech skills.")

    return {
        "ats_score": total_ats_score,
        "section_score": section_score,
        "metric_score": metric_score,
        "skill_score": skill_score,
        "format_score": format_score,
        "improvements": improvements[:5],
    }

