"""
Safety Guardrails & Prompt Injection Mitigation for BridgeAI.
Protects against prompt injections, code execution requests, policy hallucinations,
and cross-tenant data exfiltration attempts.
"""

import re
from typing import Tuple

INJECTION_PATTERNS = [
    r"ignore (all )?(previous|above|system) (instructions|rules|prompts)",
    r"disregard (all )?(previous|system) instructions",
    r"reveal (your |the )?(system prompt|initial prompt|hidden prompt|instructions)",
    r"you are now (in )?developer mode",
    r"jailbreak",
    r"dan mode",
    r"show (me )?(all )?students?( records| data| profiles)?",
    r"dump (the )?(database|tables|users)",
    r"drop table",
    r"select \* from users",
    r"exec\(",
    r"eval\(",
    r"rm -rf",
    r"format c:"
]

SAFETY_INSTRUCTIONS = (
    "BridgeAI Safety & Integrity Guardrails:\n"
    "1. Role Boundary: You are BridgeAI, an expert career mentor for campus placement. Answer strictly within career, skills, resume, interview, and placement domains.\n"
    "2. Privacy Isolation: You have access ONLY to the authorized context of the current student. Never discuss or reveal other students' data.\n"
    "3. No Guarantees: Never guarantee job selection, offer letters, or interview shortlisting. Hiring decisions rest solely with employer recruiters.\n"
    "4. Factuality & Uncertainty: Never invent resume experiences or company policies. If information is unavailable, acknowledge the limitation.\n"
    "5. Non-Execution: You are a conversational advisor. Never execute arbitrary system scripts, shell commands, or database statements."
)


def inspect_and_sanitize_query(query: str) -> Tuple[bool, str]:
    """
    Inspects user input for prompt injection or malicious instructions.
    Returns (is_suspicious: bool, sanitized_or_warning_text: str).
    """
    if not query:
        return False, ""

    lower_q = query.lower()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, lower_q):
            return True, (
                "I am BridgeAI, your personalized campus career mentor. I am programmed to assist "
                "with career guidance, resume improvements, interview preparation, and skill roadmaps. "
                "I cannot override platform security policies, disclose confidential data, or execute code."
            )

    return False, query.strip()

