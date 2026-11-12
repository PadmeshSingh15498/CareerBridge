"""
Synthetic Evaluation Dataset and Ranking Verification for CareerBridge Job Matcher.
Measures:
- Matching consistency across candidate archetypes.
- Ranking quality (Precision@K, Recall@K).
- Eligibility correctness (100% precision on hard gates).
- False matches detection.
Includes mandatory disclaimer that synthetic metrics evaluate algorithmic logic,
not real-world placement guarantees.
"""

from typing import Dict, Any, List, Set
from app.ai.job_matcher.recommendation_engine import RecommendationEngine, JobRecommendationOutput
from app.ai.job_matcher.eligibility_evaluator import EligibilityStatus
from app.ai.job_matcher.scoring_model import RecommendationCategory


EVALUATION_DISCLAIMER = (
    "DISCLAIMER: Synthetic benchmark metrics evaluate algorithmic ranking logic and mathematical "
    "scoring consistency on controlled archetypes. They do not claim that synthetic-data "
    "performance proves real-world placement effectiveness or guarantees recruitment shortlisting."
)

# --- Synthetic Student Archetypes ---

SYNTHETIC_STUDENTS: Dict[str, Dict[str, Any]] = {
    "student_fullstack": {
        "id": "s_fullstack",
        "name": "Arjun Mehta",
        "degree": "B.Tech",
        "department": "Computer Science and Engineering",
        "cgpa": 8.8,
        "graduation_year": 2026,
        "active_backlogs": 0,
        "skills": ["Python", "FastAPI", "TypeScript", "React", "Docker", "PostgreSQL", "Git", "REST APIs"],
        "preferred_roles": ["Full Stack Developer", "Backend Engineer"],
        "preferred_locations": ["Bangalore", "Hyderabad"],
        "projects": [
            {
                "title": "Scalable Microservices Portal",
                "description": "Architected distributed API backend with FastAPI, PostgreSQL, and Docker microservices.",
                "technologies": ["Python", "FastAPI", "Docker", "PostgreSQL"]
            }
        ],
        "experience": [
            {
                "role": "Software Engineering Intern",
                "company": "TechNova Solutions",
                "responsibilities": "Engineered REST APIs using Python and React frontend components."
            }
        ]
    },
    "student_aiml": {
        "id": "s_aiml",
        "name": "Priya Sharma",
        "degree": "B.Tech",
        "department": "Computer Science",
        "cgpa": 9.2,
        "graduation_year": 2026,
        "active_backlogs": 0,
        "skills": ["Python", "PyTorch", "Scikit-Learn", "Machine Learning", "Natural Language Processing", "Pandas", "NumPy"],
        "preferred_roles": ["Machine Learning Engineer", "AI Researcher"],
        "preferred_locations": ["Bangalore", "Remote"],
        "projects": [
            {
                "title": "Transformer-based NLP Summarizer",
                "description": "Implemented fine-tuned PyTorch language models for document abstraction with high BLEU scores.",
                "technologies": ["Python", "PyTorch", "NLP", "HuggingFace"]
            }
        ],
        "experience": []
    },
    "student_frontend": {
        "id": "s_frontend",
        "name": "Rohan Patel",
        "degree": "B.Tech",
        "department": "Information Technology",
        "cgpa": 8.1,
        "graduation_year": 2026,
        "active_backlogs": 0,
        "skills": ["JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS", "HTML", "CSS", "Git"],
        "preferred_roles": ["Frontend Developer", "UI Engineer"],
        "preferred_locations": ["Pune", "Mumbai"],
        "projects": [
            {
                "title": "Real-time Analytics Dashboard",
                "description": "Constructed responsive SaaS frontend in Next.js and Tailwind CSS featuring Recharts.",
                "technologies": ["React", "Next.js", "TypeScript", "Tailwind CSS"]
            }
        ],
        "experience": []
    },
    "student_devops": {
        "id": "s_devops",
        "name": "Kavita Reddy",
        "degree": "B.Tech",
        "department": "Computer Science & Engineering",
        "cgpa": 8.5,
        "graduation_year": 2026,
        "active_backlogs": 0,
        "skills": ["Kubernetes", "Docker", "AWS", "Linux", "CI/CD", "Python", "Terraform", "Git"],
        "preferred_roles": ["DevOps Engineer", "Cloud Engineer"],
        "preferred_locations": ["Hyderabad", "Bangalore"],
        "projects": [
            {
                "title": "Automated Multi-Cluster CI/CD Pipeline",
                "description": "Configured GitLab CI and Helm charts to deploy containerized services into AWS EKS.",
                "technologies": ["Docker", "Kubernetes", "AWS", "CI/CD"]
            }
        ],
        "experience": []
    },
    "student_low_cgpa": {
        "id": "s_low_cgpa",
        "name": "Devendra Kumar",
        "degree": "B.Tech",
        "department": "CSE",
        "cgpa": 6.2,  # Low CGPA to trigger hard gating
        "graduation_year": 2026,
        "active_backlogs": 0,
        "skills": ["Python", "C++", "SQL", "Git"],
        "preferred_roles": ["Software Developer"],
        "preferred_locations": ["Delhi NCR"],
        "projects": [],
        "experience": []
    },
    "student_backlogs": {
        "id": "s_backlogs",
        "name": "Siddharth Das",
        "degree": "B.Tech",
        "department": "Computer Science",
        "cgpa": 7.8,
        "graduation_year": 2026,
        "active_backlogs": 2,  # Active backlogs to trigger backlog gating
        "skills": ["Python", "FastAPI", "React"],
        "preferred_roles": ["Backend Developer"],
        "preferred_locations": ["Bangalore"],
        "projects": [],
        "experience": []
    },
    "student_non_cs": {
        "id": "s_non_cs",
        "name": "Ananya Nair",
        "degree": "B.Tech",
        "department": "Mechanical Engineering",
        "cgpa": 7.9,
        "graduation_year": 2026,
        "active_backlogs": 0,
        "skills": ["AutoCAD", "SolidWorks", "Python", "Matlab"],
        "preferred_roles": ["Design Engineer", "Robotics"],
        "preferred_locations": ["Chennai"],
        "projects": [],
        "experience": []
    },
    "student_sparse": {
        "id": "s_sparse",
        "name": "New Student",
        "degree": "B.Tech",
        "department": "CSE",
        "cgpa": None,  # Missing information
        "graduation_year": None,
        "active_backlogs": None,
        "skills": [],  # Empty skills
        "preferred_roles": [],
        "preferred_locations": [],
        "projects": [],
        "experience": []
    }
}


# --- Synthetic Job Requisitions ---

SYNTHETIC_JOBS: Dict[str, Dict[str, Any]] = {
    "job_backend_platform": {
        "id": "j_backend",
        "title": "Senior Backend Platform Engineer",
        "company_name": "CloudNova Systems",
        "location": "Bangalore",
        "workplace_type": "hybrid",
        "salary_min": 1600000.0,
        "salary_max": 2200000.0,
        "description": "Design and scale resilient backend services using FastAPI and Docker containers.",
        "requirements": "Hands-on experience with Python microservices and PostgreSQL.",
        "required_skills": ["Python", "FastAPI", "Docker", "PostgreSQL"],
        "preferred_skills": ["Kubernetes", "Redis"],
        "eligibility": {
            "min_cgpa": 7.5,
            "max_backlogs_allowed": 0,
            "allowed_grad_years": [2025, 2026],
            "allowed_departments": ["Computer Science and Engineering", "Information Technology"]
        }
    },
    "job_aiml_research": {
        "id": "j_aiml",
        "title": "Machine Learning Research Associate",
        "company_name": "CognitiveAI Labs",
        "location": "Bangalore",
        "workplace_type": "remote",
        "salary_min": 1800000.0,
        "salary_max": 2500000.0,
        "description": "Train and optimize state-of-the-art NLP transformers and deep learning models.",
        "requirements": "Strong foundation in PyTorch, statistical learning, and natural language processing.",
        "required_skills": ["Python", "PyTorch", "Machine Learning", "Natural Language Processing"],
        "preferred_skills": ["Pandas", "Scikit-Learn"],
        "eligibility": {
            "min_cgpa": 8.0,
            "max_backlogs_allowed": 0,
            "allowed_grad_years": [2026],
            "allowed_departments": ["Computer Science and Engineering"]
        }
    },
    "job_frontend_ui": {
        "id": "j_frontend",
        "title": "Frontend Software Engineer",
        "company_name": "PixelCraft Studio",
        "location": "Pune",
        "workplace_type": "on_site",
        "salary_min": 1200000.0,
        "salary_max": 1800000.0,
        "description": "Build modern responsive web applications using React, Next.js, and TypeScript.",
        "requirements": "Fluency in modern CSS frameworks such as Tailwind CSS and client state management.",
        "required_skills": ["React", "TypeScript", "Next.js", "Tailwind CSS"],
        "preferred_skills": ["Git", "HTML"],
        "eligibility": {
            "min_cgpa": 7.0,
            "max_backlogs_allowed": 1,
            "allowed_grad_years": [2025, 2026],
            "allowed_departments": ["Computer Science and Engineering", "Information Technology"]
        }
    },
    "job_devops_cloud": {
        "id": "j_devops",
        "title": "Cloud Platform & DevOps Engineer",
        "company_name": "ScaleGrid Infrastructure",
        "location": "Hyderabad",
        "workplace_type": "hybrid",
        "salary_min": 1500000.0,
        "salary_max": 2100000.0,
        "description": "Manage Kubernetes clusters and continuous delivery pipelines across AWS cloud.",
        "requirements": "Solid experience with Docker, Kubernetes, CI/CD pipelines, and Linux administration.",
        "required_skills": ["Docker", "Kubernetes", "AWS", "Linux"],
        "preferred_skills": ["CI/CD", "Python"],
        "eligibility": {
            "min_cgpa": 7.5,
            "max_backlogs_allowed": 0,
            "allowed_grad_years": [2026],
            "allowed_departments": ["Computer Science and Engineering"]
        }
    },
    "job_fintech_strict": {
        "id": "j_fintech",
        "title": "High Frequency Trading Systems Analyst",
        "company_name": "AlphaQuant Capital",
        "location": "Mumbai",
        "workplace_type": "on_site",
        "salary_min": 2800000.0,
        "salary_max": 3800000.0,
        "description": "Build deterministic low latency order matching systems in C++.",
        "requirements": "Minimum 8.5 CGPA required. Zero backlogs strictly enforced. CS only.",
        "required_skills": ["C++", "Python", "SQL"],
        "preferred_skills": ["Linux", "System Design"],
        "eligibility": {
            "min_cgpa": 8.5,
            "max_backlogs_allowed": 0,
            "allowed_grad_years": [2026],
            "allowed_departments": ["Computer Science and Engineering"]
        }
    },
    "job_open_campus": {
        "id": "j_open",
        "title": "Associate Technology Consultant",
        "company_name": "GlobalTech Consulting",
        "location": "Delhi NCR",
        "workplace_type": "hybrid",
        "salary_min": 900000.0,
        "salary_max": 1200000.0,
        "description": "Collaborate on digital enterprise modernization and script automation.",
        "requirements": "Basic programming aptitude in Python or SQL.",
        "required_skills": ["Python"],
        "preferred_skills": ["SQL"],
        "eligibility": {
            "min_cgpa": 6.0,
            "max_backlogs_allowed": 2,
            "allowed_grad_years": [2025, 2026],
            "allowed_departments": []  # Open to all departments
        }
    }
}

# Target ground-truth relevance: mapping candidate archetype -> expected highest-match job id
GROUND_TRUTH_PRIMARY_JOB = {
    "student_fullstack": "j_backend",
    "student_aiml": "j_aiml",
    "student_frontend": "j_frontend",
    "student_devops": "j_devops",
}


def run_synthetic_benchmark(engine: RecommendationEngine) -> Dict[str, Any]:
    """
    Executes algorithmic benchmark across synthetic archetypes and requisitions.
    Computes Precision@1, Precision@2, Ranking Consistency, and Eligibility Correctness.
    """
    results_by_student: Dict[str, List[JobRecommendationOutput]] = {}

    ranking_consistency_hits = 0
    total_domain_students = len(GROUND_TRUTH_PRIMARY_JOB)

    p1_hits = 0
    p2_hits = 0

    eligibility_checks_total = 0
    eligibility_checks_correct = 0

    false_matches_count = 0

    # Evaluate each synthetic student across all jobs
    for student_key, s_data in SYNTHETIC_STUDENTS.items():
        job_recommendations: List[JobRecommendationOutput] = []

        for job_key, j_data in SYNTHETIC_JOBS.items():
            rec = engine.evaluate_match(student_data=s_data, job_data=j_data)
            job_recommendations.append(rec)

        # Sort recommendations descending by match_score
        job_recommendations.sort(key=lambda r: r.match_score, reverse=True)
        results_by_student[student_key] = job_recommendations

        # Check Ranking Consistency for domain specialists
        if student_key in GROUND_TRUTH_PRIMARY_JOB:
            target_job_id = GROUND_TRUTH_PRIMARY_JOB[student_key]
            # Top-1 job check
            top_1 = job_recommendations[0]
            if top_1.job_id == target_job_id:
                ranking_consistency_hits += 1
                p1_hits += 1

            # Top-2 job check
            top_2_ids = {job_recommendations[0].job_id, job_recommendations[1].job_id}
            if target_job_id in top_2_ids:
                p2_hits += 1

        # Check Eligibility Correctness
        if student_key == "student_low_cgpa":
            # Must be marked not eligible for j_backend (min CGPA 7.5) and j_fintech (min CGPA 8.5)
            eligibility_checks_total += 2
            rec_backend = next(r for r in job_recommendations if r.job_id == "j_backend")
            rec_fintech = next(r for r in job_recommendations if r.job_id == "j_fintech")
            if rec_backend.eligibility_status == "not_eligible":
                eligibility_checks_correct += 1
            if rec_fintech.eligibility_status == "not_eligible":
                eligibility_checks_correct += 1

        if student_key == "student_backlogs":
            # Must be marked not eligible for j_backend (max backlogs 0) and j_fintech (max 0)
            eligibility_checks_total += 2
            rec_backend = next(r for r in job_recommendations if r.job_id == "j_backend")
            rec_fintech = next(r for r in job_recommendations if r.job_id == "j_fintech")
            if rec_backend.eligibility_status == "not_eligible":
                eligibility_checks_correct += 1
            if rec_fintech.eligibility_status == "not_eligible":
                eligibility_checks_correct += 1

        if student_key == "student_non_cs":
            # Must be marked not eligible for j_aiml and j_backend (CS only)
            eligibility_checks_total += 2
            rec_aiml = next(r for r in job_recommendations if r.job_id == "j_aiml")
            rec_backend = next(r for r in job_recommendations if r.job_id == "j_backend")
            if rec_aiml.eligibility_status == "not_eligible":
                eligibility_checks_correct += 1
            if rec_backend.eligibility_status == "not_eligible":
                eligibility_checks_correct += 1

        if student_key == "student_sparse":
            # Must be marked Insufficient Profile Information for all jobs
            eligibility_checks_total += 1
            if all(r.category == RecommendationCategory.INSUFFICIENT_PROFILE_INFO.value for r in job_recommendations):
                eligibility_checks_correct += 1

        # Check for False Matches:
        # e.g., Frontend student matching high on FinTech C++ systems role (should be < 50)
        if student_key == "student_frontend":
            rec_fintech = next(r for r in job_recommendations if r.job_id == "j_fintech")
            if rec_fintech.match_score >= 60:
                false_matches_count += 1

    ranking_consistency = round((ranking_consistency_hits / total_domain_students) * 100.0, 1)
    precision_at_1 = round((p1_hits / total_domain_students) * 100.0, 1)
    precision_at_2 = round((p2_hits / total_domain_students) * 100.0, 1)
    eligibility_accuracy = round((eligibility_checks_correct / max(1, eligibility_checks_total)) * 100.0, 1)

    return {
        "status": "success",
        "ranking_consistency_pct": ranking_consistency,
        "precision_at_1_pct": precision_at_1,
        "precision_at_2_pct": precision_at_2,
        "eligibility_accuracy_pct": eligibility_accuracy,
        "false_matches_detected": false_matches_count,
        "evaluated_archetypes": len(SYNTHETIC_STUDENTS),
        "evaluated_requisitions": len(SYNTHETIC_JOBS),
        "disclaimer": EVALUATION_DISCLAIMER
    }

