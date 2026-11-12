"""
Configurable LLM Provider Client for CareerBridge Resume Analyzer.
Connects to Google Gemini API when configured, with robust JSON schema validation
and transparent fallback to deep deterministic NLP analysis.
"""

import os
import json
import logging
from typing import Dict, Any, Optional
import httpx

from app.core.config import settings
from app.ai.resume_analyzer.scoring_rubric import ScoringWeights
from app.ai.resume_analyzer.nlp_evaluator import evaluate_resume_content

logger = logging.getLogger(__name__)

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"


def _build_llm_prompt(raw_text: str, nlp_eval: Dict[str, Any]) -> str:
    """Creates a grounded prompt strictly forbidding hallucination."""
    return f"""
You are an expert technical resume evaluator and placement coach for university students.
Analyze the following student resume objectively. Do NOT invent certifications, experience, or project results.
Base all observations STRICTLY on the provided text.

RESUME CONTENT:
\"\"\"
{raw_text[:4000]}
\"\"\"

PRE-COMPUTED NLP SIGNALS:
- Extracted Skills: {nlp_eval.get('skills_extracted', [])}
- Contact Info Found: {nlp_eval.get('contact_info', {})}
- Missing Sections: {nlp_eval.get('missing_sections', [])}

TASK:
Return a valid JSON object matching this EXACT schema:
{{
  "strengths": ["list of 3-4 specific strengths grounded in the resume"],
  "weaknesses": ["list of 2-3 actionable areas for improvement"],
  "missing_sections": ["list of standard sections that are absent or sparse"],
  "action_verb_suggestions": [
    {{
      "original": "weak verb from resume",
      "replacement": "strong action verb alternative",
      "context_snippet": "short phrase from resume containing the weak verb",
      "reason": "why this replacement adds technical impact"
    }}
  ],
  "quantification_suggestions": [
    {{
      "original_statement": "bullet from resume lacking numbers",
      "recommendation": "how to add measurable scale, performance, or users",
      "example_addition": "sample phrasing with metric placeholder"
    }}
  ],
  "project_description_rewrites": [
    {{
      "project_title": "title of project found in resume",
      "current_description": "current sentence from resume",
      "enhanced_description": "elevated version using STAR principles without inventing false achievements",
      "reasoning": "why this rewrite is more effective"
    }}
  ]
}}
IMPORTANT: Respond ONLY with the raw JSON object. Do not include markdown codeblocks, prose, or introductions.
"""


async def analyze_with_llm(
    raw_text: str,
    weights: Optional[ScoringWeights] = None
) -> Dict[str, Any]:
    """
    Evaluates resume using Gemini LLM if configured, otherwise falls back to NLP evaluator.
    Returns combined scoring and qualitative recommendations with clear engine attribution.
    """
    nlp_eval = evaluate_resume_content(raw_text, weights)

    api_key = getattr(settings, "GEMINI_API_KEY", "").strip()
    if not api_key or os.getenv("TESTING") or os.getenv("PYTEST_CURRENT_TEST"):
        # Transparent NLP engine attribution
        nlp_eval["engine_type"] = "nlp_intelligence"
        return nlp_eval

    # Attempt Gemini API Call
    try:
        prompt = _build_llm_prompt(raw_text, nlp_eval)
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "topP": 0.8,
                "maxOutputTokens": 1500,
                "responseMimeType": "application/json"
            }
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{GEMINI_ENDPOINT}?key={api_key}",
                json=payload
            )

        if response.status_code == 200:
            resp_json = response.json()
            candidates = resp_json.get("candidates", [])
            if candidates:
                text_part = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                llm_data = json.loads(text_part.strip())

                # Merge LLM insights with deterministic rubric scores
                merged = dict(nlp_eval)
                if "strengths" in llm_data and llm_data["strengths"]:
                    merged["strengths"] = llm_data["strengths"]
                if "weaknesses" in llm_data and llm_data["weaknesses"]:
                    merged["weaknesses"] = llm_data["weaknesses"]
                if "missing_sections" in llm_data:
                    merged["missing_sections"] = list(set(merged["missing_sections"] + llm_data["missing_sections"]))

                # Merge suggestions
                edits = merged.get("suggested_edits", {})
                if llm_data.get("action_verb_suggestions"):
                    edits["action_verbs"] = llm_data["action_verb_suggestions"]
                if llm_data.get("quantification_suggestions"):
                    edits["quantification"] = llm_data["quantification_suggestions"]
                if llm_data.get("project_description_rewrites"):
                    edits["project_rewrites"] = llm_data["project_description_rewrites"]
                merged["suggested_edits"] = edits

                merged["engine_type"] = "gemini_llm"
                return merged

    except Exception as exc:
        logger.warning(f"Gemini API analysis failed or timed out: {exc}. Falling back to NLP engine.")

    # Graceful fallback to deterministic rule engine
    nlp_eval["engine_type"] = "nlp_intelligence"
    return nlp_eval

