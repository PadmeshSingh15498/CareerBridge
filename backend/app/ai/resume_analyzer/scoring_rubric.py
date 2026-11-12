"""
Transparent Multi-Dimensional Resume Assessment Rubric for CareerBridge.
Provides configurable category weights and clear scoring explanations out of 100.
"""

from typing import Dict, Any
from pydantic import BaseModel, Field


class ScoringWeights(BaseModel):
    structure: float = Field(15.0, ge=0.0, le=100.0, description="Contact info, standard headers, section flow")
    technical_skills: float = Field(20.0, ge=0.0, le=100.0, description="Categorized language, framework, DB, cloud breadth")
    projects: float = Field(20.0, ge=0.0, le=100.0, description="Project titles, descriptions, technical stack, repo links")
    experience: float = Field(15.0, ge=0.0, le=100.0, description="Internships, industry engagements, company names, bullet points")
    education: float = Field(10.0, ge=0.0, le=100.0, description="Degree, department, graduation year, institution, CGPA")
    achievements: float = Field(10.0, ge=0.0, le=100.0, description="Certifications, hackathons, competitions, academic honors")
    readability: float = Field(10.0, ge=0.0, le=100.0, description="Action verb density, quantifiable metrics, bullet structure")

    def normalize(self) -> "ScoringWeights":
        """Ensures weights sum exactly to 100.0."""
        total = (
            self.structure + self.technical_skills + self.projects +
            self.experience + self.education + self.achievements + self.readability
        )
        if total == 0:
            return ScoringWeights()
        factor = 100.0 / total
        return ScoringWeights(
            structure=round(self.structure * factor, 1),
            technical_skills=round(self.technical_skills * factor, 1),
            projects=round(self.projects * factor, 1),
            experience=round(self.experience * factor, 1),
            education=round(self.education * factor, 1),
            achievements=round(self.achievements * factor, 1),
            readability=round(self.readability * factor, 1),
        )


DEFAULT_WEIGHTS = ScoringWeights()

RUBRIC_EXPLANATIONS = {
    "structure": (
        "Evaluates the completeness of critical contact channels (email, phone, LinkedIn, GitHub) "
        "and presence of standard resume sections (Education, Skills, Experience, Projects)."
    ),
    "technical_skills": (
        "Evaluates technical competency breadth across programming languages, backend/frontend frameworks, "
        "databases, cloud/DevOps tooling, and developer utilities."
    ),
    "projects": (
        "Assesses practical engineering capability through technical depth, demonstrated technologies, "
        "clear problem/solution framing, and accessible GitHub repository or live demo links."
    ),
    "experience": (
        "Measures professional maturity through formal internships, co-ops, freelance engagements, "
        "or open-source contributions with clear roles and organizational context."
    ),
    "education": (
        "Audits academic credentials including university institution, degree, engineering department, "
        "graduation year, and placement eligibility metrics like CGPA."
    ),
    "achievements": (
        "Rewards external validation such as accredited industry certifications, hackathon podium finishes, "
        "competitive programming ratings, or academic merit awards."
    ),
    "readability": (
        "Analyzes writing impact, active voice vs. passive voice, strong action verb usage, "
        "and presence of quantifiable metrics (percentages, latency, throughput, scale)."
    ),
}

DISCLAIMER_TEXT = (
    "Disclaimer: This assessment is an internal diagnostic benchmark computed according to "
    "CareerBridge placement intelligence standards. It is intended for educational and career readiness guidance "
    "and does not represent a universal applicant tracking system (ATS) score or guarantee recruitment shortlisting."
)

