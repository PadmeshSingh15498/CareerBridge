"""
AI-Assisted Job Description Generator for CareerBridge Recruiter Workspace.
Synthesizes commercial-grade campus and lateral job requisitions with
responsibilities, technical competencies, and culture highlights.
Integrates Google Gemini API with robust deterministic fallback generation.
"""

import os
import re
import json
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger("careerbridge.job_desc_generator")

# Role archetype templates for domain-calibrated description generation
ROLE_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "software engineer": {
        "summary": "We are seeking a high-caliber {experience_level} Software Engineer to design, build, and scale resilient distributed services and interactive applications. In this role, you will collaborate with cross-functional product and infrastructure teams to deliver high-throughput, fault-tolerant campus and enterprise features.",
        "responsibilities": [
            "Architect and implement robust, modular backend services and API contracts using {skills_sample}.",
            "Partner with product managers and designers to translate business requirements into scalable technical specifications.",
            "Write comprehensive automated unit, integration, and contract tests to safeguard system reliability.",
            "Participate actively in code reviews, design critiques, and engineering post-mortems.",
            "Troubleshoot performance bottlenecks, optimize database queries, and reduce end-to-end latency."
        ],
        "qualifications": [
            "B.Tech/B.E./M.Tech/MCA in Computer Science, Information Technology, or related quantitative engineering discipline.",
            "Proficiency in core programming languages and data structures (including {skills_sample}).",
            "Solid understanding of object-oriented design, relational databases, and RESTful API architecture.",
            "Demonstrated problem-solving abilities and strong fundamentals in algorithmic complexity."
        ],
        "preferred": [
            "Prior internship experience building full-stack or backend web applications.",
            "Exposure to containerization (Docker) and modern CI/CD deployment pipelines.",
            "Contributions to open-source software or active technical portfolio on GitHub."
        ],
        "benefits": [
            "Competitive compensation package with performance-linked incentives.",
            "Mentorship from principal engineers and continuous career development tracks.",
            "Cutting-edge development environment with modern developer tooling.",
            "Comprehensive health benefits and wellness allowance."
        ]
    },
    "full stack": {
        "summary": "Join our product engineering squad as a {experience_level} Full Stack Developer. You will own features end-to-end—from sleek, accessible user interfaces to performant microservices and database schemas.",
        "responsibilities": [
            "Build responsive, high-performance web applications using modern component frameworks and state management.",
            "Develop secure, RESTful/GraphQL backend APIs connected to scalable relational and document stores.",
            "Ensure cross-browser compatibility, WCAG accessibility, and sub-second page load times.",
            "Collaborate closely with UI/UX designers, product analysts, and quality assurance engineers.",
            "Maintain high test coverage across both client-side components and server-side route handlers."
        ],
        "qualifications": [
            "Degree in Computer Science, Software Engineering, or equivalent practical coursework.",
            "Hands-on proficiency in modern web technologies including {skills_sample}.",
            "Clear understanding of asynchronous programming, HTTP lifecycle, and web security best practices (CORS, CSRF, XSS).",
            "Strong team collaboration and transparent communication skills."
        ],
        "preferred": [
            "Experience with server-side rendering (Next.js, Remix) and modern CSS architectures (Tailwind CSS).",
            "Familiarity with cloud hosting providers (AWS, GCP, Azure, Vercel) and relational databases (MySQL, PostgreSQL).",
            "Track record of deploying end-to-end side projects or enterprise capstone systems."
        ],
        "benefits": [
            "Competitive entry compensation with annual performance reviews.",
            "Flexible hybrid work policy and workstation equipment setup stipend.",
            "Continuous learning sponsorship for certifications and engineering conferences.",
            "Generous paid time off and vibrant team culture."
        ]
    },
    "data scientist": {
        "summary": "We are looking for an analytical and detail-oriented {experience_level} Data Scientist / ML Engineer to extract actionable signals from complex datasets and operationalize predictive machine learning pipelines.",
        "responsibilities": [
            "Formulate exploratory data analysis workflows, hypothesis testing, and statistical validation on high-volume datasets.",
            "Design, train, and benchmark supervised and unsupervised machine learning models using {skills_sample}.",
            "Engineer resilient data processing pipelines and feature stores in collaboration with data engineers.",
            "Build interactive dashboards and executive reports communicating model inferences and business ROI.",
            "Monitor live model performance for data drift, feature degradation, and bias."
        ],
        "qualifications": [
            "B.Tech/M.S. in Data Science, Computer Science, Statistics, Mathematics, or related quantitative field.",
            "Strong command of Python scientific libraries (Pandas, NumPy, Scikit-learn) and SQL.",
            "Solid theoretical foundation in probability, linear algebra, and statistical inference.",
            "Hands-on experience in feature engineering, model evaluation, and cross-validation techniques."
        ],
        "preferred": [
            "Experience with deep learning frameworks (PyTorch or TensorFlow) or NLP techniques.",
            "Familiarity with data warehousing tools (Snowflake, BigQuery, Databricks) and BI platforms.",
            "Kaggle competitions or published research papers in machine learning."
        ],
        "benefits": [
            "High-impact role with direct access to massive real-world business datasets.",
            "Sponsorship for cloud compute GPUs and advanced AI research toolkits.",
            "Top-tier health coverage, mentorship programs, and academic publishing support."
        ]
    },
    "frontend developer": {
        "summary": "We are seeking a creative and detail-obsessed {experience_level} Frontend Developer to craft delightful, snappy, and accessible user experiences for millions of campus students and hiring teams.",
        "responsibilities": [
            "Translate high-fidelity Figma designs into pixel-perfect, responsive React/Vue/Angular components.",
            "Optimize frontend rendering cycles, Web Vitals metrics, and asset caching strategies.",
            "Implement robust client-side state management, optimistic UI updates, and error boundary handling.",
            "Collaborate with backend engineers to integrate structured REST and WebSocket endpoints."
        ],
        "qualifications": [
            "Degree in Computer Science, Information Technology, or equivalent practical portfolio.",
            "Deep proficiency in modern JavaScript/TypeScript, HTML5, CSS3, and modern component frameworks.",
            "Understanding of the DOM, browser networking, and client-side performance profiling."
        ],
        "preferred": [
            "Experience with Tailwind CSS, Framer Motion, and design system component libraries.",
            "Understanding of automated UI testing tools (Jest, Playwright, Cypress)."
        ],
        "benefits": [
            "Modern Apple or Dell developer workstation of your choice.",
            "Collaborative and inclusive design-led engineering culture.",
            "Hybrid schedule flexibility and comprehensive medical coverage."
        ]
    }
}


def _match_archetype(title: str) -> Dict[str, Any]:
    """Matches job title to the closest archetype template."""
    title_lower = title.lower()
    for key, template in ROLE_TEMPLATES.items():
        if key in title_lower:
            return template
    if "data" in title_lower or "analyst" in title_lower or "ml" in title_lower:
        return ROLE_TEMPLATES["data scientist"]
    if "front" in title_lower or "ui" in title_lower:
        return ROLE_TEMPLATES["frontend developer"]
    if "full" in title_lower or "web" in title_lower:
        return ROLE_TEMPLATES["full stack"]
    return ROLE_TEMPLATES["software engineer"]


def generate_job_description(
    job_title: str,
    industry: Optional[str] = "Technology & Software",
    experience_level: Optional[str] = "Entry Level / Campus Grad",
    workplace_type: Optional[str] = "Hybrid",
    core_skills: Optional[List[str]] = None,
    key_responsibilities: Optional[str] = None,
    company_context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates an enterprise-grade job description using AI / deterministic templating.
    Always returns structured JSON and pre-formatted markdown blocks ready for recruiter review.
    """
    skills = [s.strip() for s in (core_skills or []) if s.strip()]
    if not skills:
        skills = ["Python", "FastAPI", "SQL", "Git", "REST APIs"]

    skills_str = ", ".join(skills[:4])
    all_skills_str = ", ".join(skills)

    # Check for Google Gemini API key
    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_api_key:
        try:
            return _generate_with_gemini(
                api_key=gemini_api_key,
                job_title=job_title,
                industry=industry,
                experience_level=experience_level,
                workplace_type=workplace_type,
                core_skills=skills,
                key_responsibilities=key_responsibilities,
                company_context=company_context
            )
        except Exception as e:
            logger.warning(f"Gemini API JD generation failed: {e}. Falling back to deterministic generator.")

    # Deterministic domain-calibrated generator
    archetype = _match_archetype(job_title)

    exp_str = experience_level or "Entry Level"
    summary = archetype["summary"].format(
        experience_level=exp_str,
        skills_sample=skills_str
    )
    if company_context:
        summary = f"{company_context.strip()} {summary}"

    responsibilities = []
    for r in archetype["responsibilities"]:
        responsibilities.append(r.format(skills_sample=skills_str))

    if key_responsibilities and key_responsibilities.strip():
        custom_items = [item.strip("- *").strip() for item in key_responsibilities.split("\n") if item.strip()]
        responsibilities = custom_items + responsibilities[:3]

    qualifications = []
    for q in archetype["qualifications"]:
        qualifications.append(q.format(skills_sample=skills_str))

    preferred = archetype.get("preferred", [])
    benefits = archetype.get("benefits", [])

    # Format description markdown
    desc_markdown = f"""### About the Role
{summary}

### Key Responsibilities
""" + "\n".join([f"- {r}" for r in responsibilities]) + f"""

### What We Offer & Culture
""" + "\n".join([f"- {b}" for b in benefits])

    # Format requirements markdown
    req_markdown = f"""### Minimum Qualifications
""" + "\n".join([f"- {q}" for q in qualifications]) + f"""

### Preferred Qualifications & Tech Stack
- Primary competencies: {all_skills_str}
""" + "\n".join([f"- {p}" for p in preferred]) + f"""
- Workplace Model: {workplace_type.capitalize() if workplace_type else 'Hybrid'} campus opportunity."""

    return {
        "job_title": job_title,
        "summary": summary,
        "responsibilities": responsibilities,
        "qualifications": qualifications,
        "preferred_qualifications": preferred,
        "benefits_culture": benefits,
        "suggested_skills": skills,
        "formatted_description": desc_markdown.strip(),
        "formatted_requirements": req_markdown.strip()
    }


def _generate_with_gemini(
    api_key: str,
    job_title: str,
    industry: str,
    experience_level: str,
    workplace_type: str,
    core_skills: List[str],
    key_responsibilities: Optional[str],
    company_context: Optional[str]
) -> Dict[str, Any]:
    """Invokes Google Gemini API to produce tailored requisition."""
    import urllib.request

    prompt = f"""You are an elite corporate campus recruitment leader and tech talent strategist.
Generate an engaging, professional, and rigorous Job Requisition for:
Job Title: {job_title}
Industry: {industry}
Experience Level: {experience_level}
Workplace Type: {workplace_type}
Core Skills: {', '.join(core_skills)}
Key Responsibilities Focus: {key_responsibilities or 'Standard role duties'}
Company Context: {company_context or 'Leading enterprise campus partner'}

Return a valid JSON object matching this schema EXACTLY without markdown code fences:
{{
  "job_title": "{job_title}",
  "summary": "2-3 sentences introducing the role and mission",
  "responsibilities": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
  "qualifications": ["degree requirement", "core skills requirement", "cs fundamentals requirement"],
  "preferred_qualifications": ["preferred 1", "preferred 2", "preferred 3"],
  "benefits_culture": ["benefit 1", "benefit 2", "benefit 3"],
  "suggested_skills": ["skill1", "skill2", "skill3", "skill4"]
}}"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 1000}
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    with urllib.request.urlopen(req, timeout=10) as response:
        result = json.loads(response.read().decode("utf-8"))
        candidate_text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
        if candidate_text.startswith("```"):
            candidate_text = re.sub(r"^```(?:json)?\n?", "", candidate_text)
            candidate_text = re.sub(r"\n?```$", "", candidate_text)

        data = json.loads(candidate_text)
        desc_md = f"### About the Role\n{data.get('summary', '')}\n\n### Key Responsibilities\n" + "\n".join([f"- {r}" for r in data.get("responsibilities", [])]) + "\n\n### Culture & Benefits\n" + "\n".join([f"- {b}" for b in data.get("benefits_culture", [])])
        req_md = "### Minimum Qualifications\n" + "\n".join([f"- {q}" for q in data.get("qualifications", [])]) + "\n\n### Preferred Qualifications\n" + "\n".join([f"- {p}" for p in data.get("preferred_qualifications", [])])

        data["formatted_description"] = desc_md.strip()
        data["formatted_requirements"] = req_md.strip()
        return data
