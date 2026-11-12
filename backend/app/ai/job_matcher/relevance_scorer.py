"""
Project and Experience Relevance Scorer for CareerBridge Job Matcher.
Evaluates practical technical evidence from candidate portfolio projects and
internships against target job responsibilities and technical stack.
"""

import re
from typing import Dict, Any, List, Set
from app.ai.job_matcher.skill_normalizer import normalize_skill, normalize_skill_list


def evaluate_project_experience_relevance(
    student_data: Dict[str, Any],
    job_data: Dict[str, Any]
) -> float:
    """
    Computes practical evidence score [0.0, 1.0] based on:
    1. Project tech stack overlap with job required/preferred skills (50%).
    2. Project descriptive depth and domain keyword alignment (25%).
    3. Practical work experience / internship relevance (25%).
    """
    projects = student_data.get("projects", [])
    experiences = student_data.get("experience", [])

    if not projects and not experiences:
        return 0.0

    # Collect normalized job target skills
    job_req_skills = set(normalize_skill_list(job_data.get("required_skills", [])))
    job_pref_skills = set(normalize_skill_list(job_data.get("preferred_skills", [])))
    all_target_skills = job_req_skills.union(job_pref_skills)

    # 1. Project Tech Stack Overlap (Weight: 0.50)
    project_techs_used: Set[str] = set()
    total_project_words = 0
    project_text_parts = []

    for p in projects:
        techs = p.get("technologies", [])
        if isinstance(techs, list):
            for t in techs:
                project_techs_used.add(normalize_skill(str(t)))
        desc = p.get("description", "")
        if desc:
            project_text_parts.append(str(desc))
            total_project_words += len(desc.split())

    project_tech_score = 0.0
    if all_target_skills:
        matched_proj_techs = project_techs_used.intersection(all_target_skills)
        # Proportion of target skills demonstrated in tangible projects
        project_tech_score = min(1.0, len(matched_proj_techs) / max(1, len(job_req_skills)))
    elif project_techs_used:
        project_tech_score = 0.5  # Neutral bonus if no target skills specified

    # 2. Project Depth and Domain Alignment (Weight: 0.25)
    # Check if student has substantive project writeups (>50 words per project)
    depth_score = min(1.0, total_project_words / 150.0) if projects else 0.0

    # Domain keyword checks in project text
    job_desc_terms = set(re.findall(r"\b[a-zA-Z]{4,}\b", (job_data.get("description", "") + " " + job_data.get("requirements", "")).lower()))
    combined_proj_text = " ".join(project_text_parts).lower()
    keyword_matches = sum(1 for term in job_desc_terms if term in combined_proj_text)
    keyword_score = min(1.0, keyword_matches / 10.0) if job_desc_terms else 0.5
    project_domain_score = (depth_score * 0.5) + (keyword_score * 0.5)

    # 3. Work Experience / Internship Relevance (Weight: 0.25)
    exp_score = 0.0
    if experiences:
        exp_score += 0.4  # Baseline bonus for having structured professional experience
        # Check role title and responsibilities overlap
        target_role = (job_data.get("title") or job_data.get("role") or "").lower()
        for exp in experiences:
            role = str(exp.get("role", "")).lower()
            resp = str(exp.get("responsibilities", "")).lower()
            # Role alignment
            if target_role and (role in target_role or target_role in role):
                exp_score += 0.3
            # Tech mention in responsibilities
            for skill in all_target_skills:
                if skill.lower() in resp:
                    exp_score += 0.1
                    break
        exp_score = min(1.0, exp_score)

    total_score = (0.50 * project_tech_score) + (0.25 * project_domain_score) + (0.25 * exp_score)
    return round(float(np_clip(total_score, 0.0, 1.0)), 3)


def np_clip(val: float, low: float, high: float) -> float:
    return max(low, min(high, val))

