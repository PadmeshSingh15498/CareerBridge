"""
AI-Powered Resume Analyzer Package for CareerBridge.
Provides multi-dimensional rubric scoring, LLM and NLP evaluation,
job-specific requisition matching, and PDF report export.
"""

from app.ai.resume_analyzer.scoring_rubric import ScoringWeights, DEFAULT_WEIGHTS, RUBRIC_EXPLANATIONS, DISCLAIMER_TEXT
from app.ai.resume_analyzer.nlp_evaluator import evaluate_resume_content
from app.ai.resume_analyzer.llm_client import analyze_with_llm
from app.ai.resume_analyzer.job_matcher import analyze_resume_for_job
from app.ai.resume_analyzer.pdf_generator import generate_analysis_pdf

__all__ = [
    "ScoringWeights",
    "DEFAULT_WEIGHTS",
    "RUBRIC_EXPLANATIONS",
    "DISCLAIMER_TEXT",
    "evaluate_resume_content",
    "analyze_with_llm",
    "analyze_resume_for_job",
    "generate_analysis_pdf",
]

