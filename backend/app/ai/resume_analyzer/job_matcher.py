"""
Job-Specific Resume Comparison & Relevance Analyzer.
Compares candidate resume text against target job requirements, identifying matched skills,
missing keywords, aligned projects, and weakly represented competencies.
"""

from typing import Dict, List, Any, Set
from app.ai.taxonomy import extract_skills_from_text, normalize_skill_name
from app.ai.matching import compute_semantic_similarity


def analyze_resume_for_job(
    resume_text: str,
    job_title: str,
    job_description: str,
    job_requirements: str,
    job_skills: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Compares candidate resume with a target job requisition.
    Returns:
      - relevant_skills: skills present in both resume and job description
      - missing_keywords: high-value skills or terms required by job but absent in resume
      - relevant_projects: projects or paragraphs in resume that demonstrate relevant tech
      - weakly_represented: skills that appear in resume's skill list but not in bullet points
      - job_relevance_score: 0 to 100 percentage
      - targeted_improvements: actionable tips for tailoring this resume for this job
    """
    # 1. Extract candidate skills
    candidate_skills_extracted = extract_skills_from_text(resume_text)
    candidate_skill_names = {s["name"].lower() for s in candidate_skills_extracted}

    # 2. Extract job skills
    target_job_skills: Set[str] = set()
    for js in job_skills:
        name = js.get("name") if isinstance(js, dict) else getattr(js, "name", str(js))
        canonical, _ = normalize_skill_name(name)
        target_job_skills.add(canonical)

    # Extract additional skills from description
    extracted_from_jd = extract_skills_from_text(f"{job_title} {job_description} {job_requirements}")
    for es in extracted_from_jd:
        target_job_skills.add(es["name"])

    # 3. Partition into Matched vs Missing
    matched_skills = []
    missing_keywords = []

    for s in sorted(list(target_job_skills)):
        if s.lower() in candidate_skill_names or s.lower() in resume_text.lower():
            matched_skills.append(s)
        else:
            missing_keywords.append(s)

    # 4. Semantic Relevance
    semantic_sim = compute_semantic_similarity(resume_text, f"{job_title} {job_description} {job_requirements}")

    # Calculate overall job match percentage
    overlap_ratio = len(matched_skills) / len(target_job_skills) if target_job_skills else 0.8
    relevance_score = round((0.60 * overlap_ratio + 0.40 * semantic_sim) * 100.0, 1)
    relevance_score = max(25.0, min(98.0, relevance_score))

    # 5. Weakly Represented Requirements
    # Skills mentioned in resume skills list but absent in project description lines
    weakly_represented = []
    lines = [l for l in resume_text.splitlines() if len(l.strip()) > 30]
    projects_and_exp_text = " ".join(lines).lower()

    for ms in matched_skills:
        if ms.lower() not in projects_and_exp_text:
            weakly_represented.append({
                "skill": ms,
                "status": "Listed in skills section but not demonstrated in any project or experience bullet point.",
                "recommendation": f"Add a bullet describing how you engineered a system using {ms}."
            })

    # 6. Relevant Projects Aligned with Role
    aligned_snippets = []
    for line in lines:
        matched_in_line = [s for s in matched_skills if s.lower() in line.lower()]
        if len(matched_in_line) >= 2:
            aligned_snippets.append({
                "statement": line.strip()[:140],
                "skills_demonstrated": matched_in_line
            })

    # 7. Targeted Improvement Tips
    targeted_tips = []
    if missing_keywords:
        top_missing = missing_keywords[:3]
        targeted_tips.append(
            f"Target Requisition Keywords: Incorporate {', '.join(top_missing)} if you have practical experience with them."
        )
    if weakly_represented:
        targeted_tips.append(
            f"Strengthen Project Evidence: {weakly_represented[0]['skill']} is listed as a skill but lacks project context."
        )
    if semantic_sim < 0.50:
        targeted_tips.append(
            f"Tailor Vocabulary: Align your project descriptions with terminology from the {job_title} specification."
        )

    return {
        "job_title": job_title,
        "job_relevance_score": relevance_score,
        "matched_skills_count": len(matched_skills),
        "missing_keywords_count": len(missing_keywords),
        "relevant_skills": matched_skills,
        "missing_keywords": missing_keywords,
        "weakly_represented_requirements": weakly_represented[:4],
        "relevant_project_evidence": aligned_snippets[:3],
        "targeted_improvements": targeted_tips
    }

