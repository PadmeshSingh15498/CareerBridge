"""
Career Preferences Matcher for CareerBridge Job Matcher.
Evaluates student preferred job roles and locations against job postings.
"""

from typing import Dict, Any, List


def evaluate_career_preferences(
    student_data: Dict[str, Any],
    job_data: Dict[str, Any]
) -> float:
    """
    Evaluates career preference alignment:
    - Role preference match (60%)
    - Location preference match (40%)
    If student has not specified preferences, returns neutral baseline (0.75).
    """
    pref_roles = student_data.get("preferred_roles", [])
    pref_locations = student_data.get("preferred_locations", [])

    job_title = (job_data.get("title") or job_data.get("role") or "").lower()
    job_loc = (job_data.get("location") or "").lower()
    job_workplace = (job_data.get("workplace_type") or "").lower()

    # 1. Role Preference Evaluation
    role_score = 0.75  # Default neutral
    if pref_roles:
        role_score = 0.2  # Floor if specified but no match
        for r in pref_roles:
            r_clean = str(r).strip().lower()
            if not r_clean:
                continue
            if r_clean in job_title or job_title in r_clean:
                role_score = 1.0
                break
            # Word intersection check
            r_words = set(r_clean.split())
            title_words = set(job_title.split())
            if r_words.intersection(title_words):
                role_score = max(role_score, 0.7)

    # 2. Location Preference Evaluation
    location_score = 0.75  # Default neutral
    if job_workplace == "remote":
        location_score = 1.0  # Remote jobs match everyone
    elif pref_locations:
        location_score = 0.2  # Floor if specified but no match
        for loc in pref_locations:
            loc_clean = str(loc).strip().lower()
            if not loc_clean:
                continue
            if loc_clean in job_loc or job_loc in loc_clean:
                location_score = 1.0
                break

    composite_preference = (0.60 * role_score) + (0.40 * location_score)
    return round(float(composite_preference), 3)

