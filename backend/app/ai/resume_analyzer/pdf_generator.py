"""
PDF Report Generator for CareerBridge AI Resume Analyzer.
Uses PyMuPDF to generate a clean, executive-styled analysis report.
"""

from datetime import datetime
from typing import Dict, Any, Optional
import pymupdf as fitz  # PyMuPDF


def generate_analysis_pdf(
    student_name: str,
    resume_title: str,
    analysis_data: Dict[str, Any],
    job_analysis: Optional[Dict[str, Any]] = None
) -> bytes:
    """
    Renders an executive-grade PDF document containing complete resume analysis insights.
    """
    doc = fitz.open()

    # --- Page 1: Executive Summary & Category Scores ---
    page = doc.new_page(width=595, height=842)  # Standard A4
    y = 40

    # Header Background Banner
    page.draw_rect(fitz.Rect(35, 30, 560, 95), color=None, fill=(0.14, 0.30, 0.24))  # Forest green #244D3D

    # Header Text
    page.insert_text(fitz.Point(50, 58), "CAREERBRIDGE", fontsize=16, color=(0.79, 0.90, 0.42), fontname="hebo")  # Accent lime
    page.insert_text(fitz.Point(50, 75), "AI RESUME INTELLIGENCE & AUDIT REPORT", fontsize=11, color=(1, 1, 1), fontname="hebo")
    page.insert_text(fitz.Point(50, 88), "From Potential to Placement • Comprehensive Multi-Dimensional Diagnostic", fontsize=8, color=(0.85, 0.85, 0.85), fontname="helv")

    y = 115
    # Metadata Row
    page.insert_text(fitz.Point(40, y), f"Candidate: {student_name}", fontsize=10, color=(0.12, 0.15, 0.13), fontname="hebo")
    page.insert_text(fitz.Point(320, y), f"Resume: {resume_title}", fontsize=9, color=(0.4, 0.45, 0.4), fontname="helv")
    y += 16
    page.insert_text(fitz.Point(40, y), f"Generated: {datetime.utcnow().strftime('%B %d, %Y')}", fontsize=9, color=(0.4, 0.45, 0.4), fontname="helv")
    engine_name = "Google Gemini 1.5 Flash (Grounded)" if analysis_data.get("engine_type") == "gemini_llm" else "Deterministic NLP Rule Intelligence"
    page.insert_text(fitz.Point(320, y), f"Engine: {engine_name}", fontsize=9, color=(0.14, 0.30, 0.24), fontname="hebo")

    y += 25
    # Overall Score Box
    score = analysis_data.get("overall_score", 75)
    page.draw_rect(fitz.Rect(40, y, 555, y + 55), color=(0.88, 0.89, 0.86), fill=(0.96, 0.96, 0.94))
    page.insert_text(fitz.Point(55, y + 36), f"{score}", fontsize=28, color=(0.14, 0.30, 0.24), fontname="hebo")
    page.insert_text(fitz.Point(105, y + 25), "OVERALL READINESS SCORE (OUT OF 100)", fontsize=10, color=(0.12, 0.15, 0.13), fontname="hebo")
    grade = "Strong Alignment" if score >= 80 else "Competitive Foundation" if score >= 65 else "Requires Strategic Refinement"
    page.insert_text(fitz.Point(105, y + 42), f"Diagnostic Assessment: {grade}", fontsize=9, color=(0.4, 0.45, 0.4), fontname="helv")

    y += 75
    # Category Breakdown Table Header
    page.insert_text(fitz.Point(40, y), "CATEGORY SCORING BREAKDOWN", fontsize=11, color=(0.14, 0.30, 0.24), fontname="hebo")
    y += 15

    cat_scores = analysis_data.get("category_scores", {})
    cat_max = analysis_data.get("category_max", {})
    categories = [
        ("Structure & Contact Completeness", "structure", 15.0),
        ("Technical Competency Breadth", "technical_skills", 20.0),
        ("Engineering Projects & Evidence", "projects", 20.0),
        ("Experience & Internships", "experience", 15.0),
        ("Academic Credentials", "education", 10.0),
        ("Certifications & Achievements", "achievements", 10.0),
        ("Readability, Verbs & Metrics", "readability", 10.0),
    ]

    for label, key, default_max in categories:
        earned = cat_scores.get(key, 0.0)
        maximum = cat_max.get(key, default_max)
        pct = (earned / maximum) if maximum > 0 else 0

        # Row text
        page.insert_text(fitz.Point(45, y + 10), label, fontsize=9, color=(0.2, 0.2, 0.2), fontname="helv")
        page.insert_text(fitz.Point(260, y + 10), f"{earned:.1f} / {maximum:.1f} pts", fontsize=9, color=(0.14, 0.30, 0.24), fontname="hebo")

        # Progress bar
        page.draw_rect(fitz.Rect(350, y + 2, 530, y + 12), color=(0.85, 0.85, 0.85), fill=(0.92, 0.92, 0.90))
        bar_width = min(180.0, 180.0 * pct)
        if bar_width > 0:
            bar_color = (0.14, 0.30, 0.24) if pct >= 0.75 else (0.85, 0.55, 0.2) if pct >= 0.50 else (0.75, 0.25, 0.25)
            page.draw_rect(fitz.Rect(350, y + 2, 350 + bar_width, y + 12), color=None, fill=bar_color)

        y += 18

    y += 15
    # Key Strengths
    page.insert_text(fitz.Point(40, y), "PRIMARY STRENGTHS", fontsize=11, color=(0.14, 0.30, 0.24), fontname="hebo")
    y += 14
    for st in analysis_data.get("strengths", [])[:3]:
        page.insert_text(fitz.Point(45, y), f"• {st[:90]}", fontsize=8.5, color=(0.2, 0.2, 0.2), fontname="helv")
        y += 13

    y += 10
    # Areas for Improvement
    page.insert_text(fitz.Point(40, y), "KEY AREAS FOR ENHANCEMENT", fontsize=11, color=(0.85, 0.45, 0.2), fontname="hebo")
    y += 14
    for wk in analysis_data.get("weaknesses", [])[:3]:
        page.insert_text(fitz.Point(45, y), f"• {wk[:90]}", fontsize=8.5, color=(0.2, 0.2, 0.2), fontname="helv")
        y += 13

    # Footer Disclaimer
    page.draw_line(fitz.Point(40, 790), fitz.Point(555, 790), color=(0.85, 0.85, 0.85), width=0.5)
    page.insert_text(fitz.Point(40, 804), analysis_data.get("disclaimer", "")[:130], fontsize=6.5, color=(0.5, 0.5, 0.5), fontname="helv")
    page.insert_text(fitz.Point(40, 814), analysis_data.get("disclaimer", "")[130:260], fontsize=6.5, color=(0.5, 0.5, 0.5), fontname="helv")
    page.insert_text(fitz.Point(510, 814), "Page 1 of 2", fontsize=7, color=(0.5, 0.5, 0.5), fontname="helv")

    # --- Page 2: Specific Suggested Edits & Job Relevance ---
    page2 = doc.new_page(width=595, height=842)
    y2 = 40

    page2.draw_rect(fitz.Rect(35, 30, 560, 65), color=None, fill=(0.14, 0.30, 0.24))
    page2.insert_text(fitz.Point(50, 52), "ACTIONABLE EDIT SUGGESTIONS & REQUISITION ALIGNMENT", fontsize=12, color=(1, 1, 1), fontname="hebo")
    page2.insert_text(fitz.Point(50, 66), "Specific text enhancements for verbs, quantification, and targeted keywords", fontsize=8, color=(0.85, 0.85, 0.85), fontname="helv")

    y2 = 85
    # Action Verbs Table
    edits = analysis_data.get("suggested_edits", {})
    verbs = edits.get("action_verbs", [])
    if verbs:
        page2.insert_text(fitz.Point(40, y2), "ACTION VERB REPLACEMENTS", fontsize=10, color=(0.14, 0.30, 0.24), fontname="hebo")
        y2 += 14
        for item in verbs[:4]:
            orig = item.get("original", "")
            rep = item.get("replacement", "")
            reason = item.get("reason", "")
            page2.insert_text(fitz.Point(45, y2), f"• Replace passive '{orig}'  -->  '{rep}'", fontsize=8.5, color=(0.12, 0.15, 0.13), fontname="hebo")
            y2 += 11
            page2.insert_text(fitz.Point(55, y2), f"Reason: {reason[:100]}", fontsize=7.5, color=(0.4, 0.45, 0.4), fontname="helv")
            y2 += 14

    y2 += 10
    # Quantification Suggestions
    quants = edits.get("quantification", [])
    if quants:
        page2.insert_text(fitz.Point(40, y2), "QUANTIFICATION RECOMMENDATIONS", fontsize=10, color=(0.14, 0.30, 0.24), fontname="hebo")
        y2 += 14
        for q in quants[:3]:
            stmt = q.get("original_statement", "")
            ex = q.get("example_addition", "")
            page2.insert_text(fitz.Point(45, y2), f"• Statement: \"{stmt[:85]}\"", fontsize=8, color=(0.2, 0.2, 0.2), fontname="helv")
            y2 += 11
            page2.insert_text(fitz.Point(55, y2), f"Add Metric: {ex[:95]}", fontsize=7.5, color=(0.14, 0.30, 0.24), fontname="hebo")
            y2 += 14

    # Optional Job Relevance Section
    if job_analysis:
        y2 += 10
        page2.insert_text(fitz.Point(40, y2), f"JOB REQUISITION ALIGNMENT: {job_analysis.get('job_title', '').upper()}", fontsize=10, color=(0.14, 0.30, 0.24), fontname="hebo")
        y2 += 15

        rel_score = job_analysis.get("job_relevance_score", 70.0)
        page2.draw_rect(fitz.Rect(40, y2, 555, y2 + 35), color=(0.88, 0.89, 0.86), fill=(0.96, 0.96, 0.94))
        page2.insert_text(fitz.Point(50, y2 + 22), f"Relevance Alignment: {rel_score}%", fontsize=10, color=(0.14, 0.30, 0.24), fontname="hebo")
        matched_str = ", ".join(job_analysis.get("relevant_skills", [])[:5])
        page2.insert_text(fitz.Point(230, y2 + 22), f"Matched Skills: {matched_str[:60]}", fontsize=8, color=(0.2, 0.2, 0.2), fontname="helv")
        y2 += 45

        missing = job_analysis.get("missing_keywords", [])
        if missing:
            page2.insert_text(fitz.Point(45, y2), f"Missing Keywords to Consider: {', '.join(missing[:8])}", fontsize=8, color=(0.75, 0.25, 0.25), fontname="hebo")
            y2 += 14

        tips = job_analysis.get("targeted_improvements", [])
        for tip in tips[:2]:
            page2.insert_text(fitz.Point(45, y2), f"• {tip[:95]}", fontsize=7.5, color=(0.3, 0.3, 0.3), fontname="helv")
            y2 += 12

    # Footer
    page2.draw_line(fitz.Point(40, 790), fitz.Point(555, 790), color=(0.85, 0.85, 0.85), width=0.5)
    page2.insert_text(fitz.Point(40, 804), "CareerBridge Campus Placement Intelligence • Confidential Diagnostic Evaluation", fontsize=7, color=(0.5, 0.5, 0.5), fontname="helv")
    page2.insert_text(fitz.Point(510, 804), "Page 2 of 2", fontsize=7, color=(0.5, 0.5, 0.5), fontname="helv")

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes
