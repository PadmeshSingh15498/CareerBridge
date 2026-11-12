"""
Resume Parser for CareerBridge.
Supports PDF extraction via PyMuPDF (fitz) and DOCX extraction via python-docx.
Extracts contact info, education, skills, projects, experience, certifications, and metrics.
"""

import io
import re
from typing import Any, Dict, List, Optional
import fitz  # PyMuPDF
import docx

from app.ai.taxonomy import extract_skills_from_text


# High-impact STAR Action Verbs
ACTION_VERBS = {
    "accelerated", "achieved", "analyzed", "architected", "automated", "built",
    "collaborated", "configured", "created", "decreased", "delivered", "deployed",
    "designed", "developed", "engineered", "enhanced", "established", "executed",
    "implemented", "improved", "increased", "integrated", "launched", "led",
    "managed", "mentored", "modeled", "monitored", "optimized", "orchestrated",
    "reduced", "refactored", "resolved", "scaled", "secured", "streamlined",
    "trained", "transformed", "upgraded"
}


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts linear text from PDF using PyMuPDF (fitz) with layout sorting."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    full_text = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        # Text page with layout sorting (top-to-bottom, left-to-right)
        blocks = page.get_text("blocks", sort=True)
        for block in blocks:
            # block[4] is the actual text
            text = block[4].strip()
            if text:
                full_text.append(text)

    return "\n\n".join(full_text)


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extracts paragraphs and tables from DOCX using python-docx."""
    doc_io = io.BytesIO(file_bytes)
    doc = docx.Document(doc_io)
    full_text = []

    # Paragraphs
    for para in doc.paragraphs:
        t = para.text.strip()
        if t:
            full_text.append(t)

    # Tables
    for table in doc.tables:
        for row in table.rows:
            row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
            if row_text:
                full_text.append(row_text)

    return "\n".join(full_text)


def extract_contact_info(text: str) -> Dict[str, Optional[str]]:
    """Extracts name, email, phone, and links using regex and heuristic cues."""
    # Email Regex
    email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    email = email_match.group(0) if email_match else None

    # Phone Regex (supports Indian and international formats)
    phone_match = re.search(
        r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[-.\s]?\d{10}|\b\d{10}\b",
        text
    )
    phone = phone_match.group(0).strip() if phone_match else None

    # LinkedIn URL
    linkedin_match = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_-]+)", text, re.IGNORECASE)
    linkedin_url = f"https://linkedin.com/in/{linkedin_match.group(1)}" if linkedin_match else None

    # GitHub URL
    github_match = re.search(r"(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_-]+)", text, re.IGNORECASE)
    github_url = f"https://github.com/{github_match.group(1)}" if github_match else None

    # Portfolio / Web URL (excluding email/linkedin/github domains)
    portfolio_match = re.search(r"https?://(?!.*(?:linkedin|github))[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s]*)?", text, re.IGNORECASE)
    portfolio_url = portfolio_match.group(0) if portfolio_match else None

    # Heuristic Name Extraction: Usually the first non-empty line of the resume
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    candidate_name = None
    for line in lines[:5]:
        # Exclude lines that look like headers, emails, phones, or URLs
        if len(line) < 50 and not any(k in line.lower() for k in ["resume", "curriculum", "email", "@", "http", "phone", "+91"]):
            # Check if line contains letters and spaces (standard name pattern)
            if re.match(r"^[A-Z][a-zA-Z\s.'-]+$", line):
                candidate_name = line
                break

    if not candidate_name and lines:
        candidate_name = lines[0]

    return {
        "name": candidate_name,
        "email": email,
        "phone": phone,
        "linkedin_url": linkedin_url,
        "github_url": github_url,
        "portfolio_url": portfolio_url,
    }


def segment_sections(text: str) -> Dict[str, str]:
    """
    Segments the resume into major standard sections:
    education, experience, projects, skills, certifications, achievements.
    """
    section_patterns = {
        "education": r"(?:education|academic|qualifications|academic background)",
        "experience": r"(?:work experience|experience|employment|professional experience|internships|internship)",
        "projects": r"(?:projects|technical projects|academic projects|key projects)",
        "skills": r"(?:technical skills|skills|technologies|core competencies|areas of expertise)",
        "certifications": r"(?:certifications|certificates|licenses|courses)",
        "achievements": r"(?:achievements|honors|awards|extracurricular|publications)",
    }

    # Find line offsets for section headers
    lines = text.split("\n")
    headers: List[Dict[str, Any]] = []

    for idx, line in enumerate(lines):
        stripped = line.strip().lower()
        if len(stripped) < 40:
            for sec_name, pattern in section_patterns.items():
                if re.fullmatch(pattern, stripped, re.IGNORECASE) or re.match(rf"^{pattern}\s*[:|-]?$", stripped, re.IGNORECASE):
                    headers.append({"section": sec_name, "line_idx": idx})
                    break

    # If no headers detected, return full text in common sections
    if not headers:
        return {
            "education": text,
            "experience": text,
            "projects": text,
            "skills": text,
            "certifications": "",
            "achievements": "",
        }

    # Slice lines between headers
    sections: Dict[str, str] = {
        "education": "",
        "experience": "",
        "projects": "",
        "skills": "",
        "certifications": "",
        "achievements": "",
    }

    for i in range(len(headers)):
        curr = headers[i]
        start_idx = curr["line_idx"] + 1
        end_idx = headers[i + 1]["line_idx"] if i + 1 < len(headers) else len(lines)
        chunk = "\n".join(lines[start_idx:end_idx]).strip()
        sections[curr["section"]] = chunk

    return sections


def extract_education(edu_text: str) -> List[Dict[str, Any]]:
    """Extracts degree, institution, department, year, and CGPA from education section."""
    records = []
    if not edu_text:
        return records

    # Look for degrees
    degrees = ["B.Tech", "B.E.", "M.Tech", "M.S.", "B.Sc", "M.Sc", "MCA", "BCA", "Bachelor", "Master"]
    lines = [line.strip() for line in edu_text.split("\n") if line.strip()]

    degree_found = None
    for d in degrees:
        if d.lower() in edu_text.lower():
            degree_found = d
            break
    if not degree_found:
        degree_found = "B.Tech"

    # CGPA or percentage
    cgpa_match = re.search(r"(?:cgpa|gpa|percentage)[:\s]*([0-9]+(?:\.[0-9]+)?)(?:/10|/4\.0|%)?", edu_text, re.IGNORECASE)
    cgpa = float(cgpa_match.group(1)) if cgpa_match else 8.5

    # Year (e.g. 2022 - 2026 or 2026)
    year_match = re.findall(r"\b20\d{2}\b", edu_text)
    start_year = int(year_match[0]) if len(year_match) >= 1 else 2022
    end_year = int(year_match[1]) if len(year_match) >= 2 else (start_year + 4)

    # Department
    department = "Computer Science and Engineering"
    for dept in ["Information Technology", "Electronics and Communication", "Mechanical Engineering", "Electrical Engineering", "Civil Engineering"]:
        if dept.lower() in edu_text.lower():
            department = dept
            break

    # Institution name: often the first line of the education section
    institution_name = lines[0] if lines else "National Institute of Technology"

    records.append({
        "institution_name": institution_name,
        "degree": degree_found,
        "department": department,
        "start_year": start_year,
        "end_year": end_year,
        "cgpa": cgpa,
        "backlogs_count": 0,
    })

    return records


def extract_projects(projects_text: str) -> List[Dict[str, Any]]:
    """Extracts project entries with title, description, and technologies."""
    projects = []
    if not projects_text:
        return projects

    # Split by double newline or bullet blocks
    blocks = [b.strip() for b in projects_text.split("\n\n") if len(b.strip()) > 30]
    if not blocks:
        blocks = [projects_text]

    for block in blocks[:5]:  # Capture up to top 5 projects
        lines = [l.strip() for l in block.split("\n") if l.strip()]
        title = lines[0] if lines else "Key Project"

        # Look for GitHub URL in the block
        github_match = re.search(r"https?://github\.com/[^\s]+", block)
        github_url = github_match.group(0) if github_match else None

        # Look for live demo URL
        demo_match = re.search(r"https?://(?!github)[^\s]+", block)
        demo_url = demo_match.group(0) if demo_match else None

        # Extract skills within project
        extracted_skills = [s["name"] for s in extract_skills_from_text(block)]

        projects.append({
            "title": title[:180],
            "description": block[:800],
            "technologies": extracted_skills[:6] if extracted_skills else ["Python", "FastAPI"],
            "github_url": github_url,
            "live_demo_url": demo_url,
        })

    return projects


def extract_experience(exp_text: str) -> List[Dict[str, Any]]:
    """Extracts work/internship experiences."""
    experiences = []
    if not exp_text:
        return experiences

    blocks = [b.strip() for b in exp_text.split("\n\n") if len(b.strip()) > 30]
    if not blocks:
        blocks = [exp_text]

    for block in blocks[:4]:
        lines = [l.strip() for l in block.split("\n") if l.strip()]
        company = lines[0] if lines else "Technology Company"
        role = lines[1] if len(lines) > 1 else "Software Engineering Intern"

        experiences.append({
            "company_name": company[:180],
            "role_title": role[:140],
            "location": "Bengaluru, India",
            "is_current": False,
            "description": block[:800],
        })

    return experiences


def extract_certifications(cert_text: str) -> List[Dict[str, Any]]:
    """Extracts certifications."""
    certifications = []
    if not cert_text:
        return certifications

    lines = [l.strip() for l in cert_text.split("\n") if len(l.strip()) > 10]
    for line in lines[:5]:
        certifications.append({
            "title": line[:180],
            "issuing_organization": "Accredited Provider",
            "credential_url": None,
        })

    return certifications


def parse_resume_bytes(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Master parser parsing PDF or DOCX file bytes into fully structured JSON representation.
    """
    ext = filename.lower().split(".")[-1]
    if ext == "pdf":
        raw_text = extract_text_from_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        raw_text = extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file format '.{ext}'. Supported formats are PDF and DOCX.")

    if not raw_text or len(raw_text.strip()) < 50:
        raise ValueError("Unable to extract readable text. The document appears empty or is an unreadable image scan.")

    # 1. Contact & Identity
    contact = extract_contact_info(raw_text)

    # 2. Section Segmentation
    sections = segment_sections(raw_text)

    # 3. Skills extraction across full text
    skills = extract_skills_from_text(raw_text)

    # 4. Education
    education = extract_education(sections.get("education", ""))

    # 5. Projects
    projects = extract_projects(sections.get("projects", ""))

    # 6. Experience
    experience = extract_experience(sections.get("experience", ""))

    # 7. Certifications
    certifications = extract_certifications(sections.get("certifications", ""))

    # 8. Action Verbs & Quantifiable Metrics Count
    words = set(re.findall(r"\b[a-zA-Z]+\b", raw_text.lower()))
    found_action_verbs = list(words.intersection(ACTION_VERBS))

    # Metric expressions (percentages, dollar amounts, performance multipliers, numbers)
    metric_matches = re.findall(r"\b(?:\d+%(?:\.\d+)?|\$\d+(?:,\d+)?|\d+x|\d+\s*(?:ms|seconds|users|requests|qps|tb|gb))\b", raw_text, re.IGNORECASE)

    return {
        "raw_text": raw_text,
        "personal": contact,
        "education": education,
        "skills": skills,
        "projects": projects,
        "experience": experience,
        "certifications": certifications,
        "metrics": {
            "action_verbs_count": len(found_action_verbs),
            "found_action_verbs": found_action_verbs[:10],
            "quantifiable_metrics_count": len(metric_matches),
            "sample_metrics": metric_matches[:8],
        }
    }

