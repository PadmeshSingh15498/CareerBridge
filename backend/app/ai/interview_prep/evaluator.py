"""
AI Interview Answer Evaluator.
Evaluates student responses across 6 core interview dimensions:
1. Technical Accuracy (0-100)
2. Relevance (0-100)
3. Completeness (0-100)
4. Conceptual Understanding (0-100)
5. Communication & Clarity (0-100)
6. Problem-Solving Approach (0-100)

Detects missing concepts, provides actionable improvement tips,
and generates context-aware follow-up questions.
"""

import re
import json
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class AnswerEvaluator:

    @staticmethod
    def evaluate(
        question_text: str,
        answer_text: str,
        interview_type: str = "technical",
        topic: str = "General",
        key_concepts: Optional[List[str]] = None,
        difficulty: str = "intermediate"
    ) -> Dict[str, Any]:
        """
        Evaluates a candidate's answer using hybrid evaluation:
        checks keyword coverage, structural depth, length, clarity, and specific domain principles.
        """
        text = answer_text.strip()
        word_count = len(text.split())

        if word_count < 5:
            return {
                "overall_score": 25,
                "dimension_scores": {
                    "technical_accuracy": 20,
                    "relevance": 30,
                    "completeness": 20,
                    "conceptual_understanding": 20,
                    "communication": 30,
                    "problem_solving": 20
                },
                "missing_concepts": key_concepts or ["Detailed technical explanation", "Concrete examples", "Edge cases"],
                "improvements": [
                    "Response is too brief. Provide a structured answer explaining the 'why' and 'how'.",
                    "State the underlying data structure or principle being used.",
                    "Include trade-offs or alternative approaches considered."
                ],
                "follow_up_question": "Could you expand on this concept and explain the trade-offs involved?",
                "feedback_summary": "Answer is minimal. Aim for a structured response covering core fundamentals, implementation details, and trade-offs.",
                "disclaimer": "AI-generated practice feedback, not an actual employer evaluation."
            }

        # Analyze key concepts coverage
        expected_concepts = key_concepts or []
        covered_concepts = []
        missing_concepts = []

        for concept in expected_concepts:
            pattern = re.escape(concept.lower())
            if re.search(r"\b" + pattern + r"\b", text.lower()):
                covered_concepts.append(concept)
            else:
                # Check partial word matches
                words = concept.lower().split()
                if any(w in text.lower() for w in words if len(w) > 3):
                    covered_concepts.append(concept)
                else:
                    missing_concepts.append(concept)

        coverage_ratio = len(covered_concepts) / max(1, len(expected_concepts)) if expected_concepts else 0.8

        # 1. Technical Accuracy (influenced by concept coverage and domain keywords)
        tech_score = int(min(98, max(45, 55 + (coverage_ratio * 40))))

        # 2. Relevance (is the answer directly addressing the question keywords?)
        q_words = [w.lower() for w in re.findall(r"\b\w{4,}\b", question_text)]
        overlap = sum(1 for w in q_words if w in text.lower())
        relevance_score = int(min(98, max(50, 60 + min(35, overlap * 6))))

        # 3. Completeness (structural length and explanation depth)
        if word_count < 30:
            comp_score = 55
        elif word_count < 60:
            comp_score = 72
        elif word_count < 120:
            comp_score = 88
        else:
            comp_score = 94

        # 4. Conceptual Understanding (mentions trade-offs, time/space complexity, or why)
        understanding_bonus = 0
        conceptual_keywords = ["trade-off", "tradeoff", "complexity", "because", "advantage", "drawback", "under the hood", "amortized", "bottleneck"]
        for kw in conceptual_keywords:
            if kw in text.lower():
                understanding_bonus += 5
        understanding_score = int(min(96, max(50, 65 + min(30, understanding_bonus))))

        # 5. Communication (sentence structure, paragraphing, formatting)
        comm_score = 75
        if "\n" in text or "1." in text or "first" in text.lower() or "second" in text.lower():
            comm_score += 15
        if word_count > 40:
            comm_score = min(96, comm_score + 5)

        # 6. Problem-Solving Approach (addresses edge cases, scale, or failure modes)
        problem_bonus = 0
        if any(term in text.lower() for term in ["edge case", "scale", "optimize", "cache", "failure", "distributed", "concurrency", "test"]):
            problem_bonus += 15
        if interview_type == "behavioral" and any(term in text.lower() for term in ["situation", "task", "action", "result", "outcome", "team"]):
            problem_bonus += 20
        problem_solving_score = int(min(95, max(52, 65 + problem_bonus)))

        # Weighted Overall Score
        overall = int(
            tech_score * 0.25 +
            relevance_score * 0.20 +
            comp_score * 0.15 +
            understanding_score * 0.15 +
            comm_score * 0.10 +
            problem_solving_score * 0.15
        )

        # Actionable improvements
        improvements: List[str] = []
        if missing_concepts:
            improvements.append(f"Deepen technical discussion by mentioning key concepts such as: {', '.join(missing_concepts[:3])}.")
        if word_count < 50:
            improvements.append("Elaborate on the practical implementation steps or architecture rather than high-level summaries.")
        if "complexity" not in text.lower() and interview_type in ["technical", "coding"]:
            improvements.append("Explicitly state the Big-O Time and Space complexities of your proposed approach.")
        if interview_type == "behavioral" and not any(term in text.lower() for term in ["action", "result", "outcome"]):
            improvements.append("Frame your story cleanly using the STAR technique (Situation, Task, Action, Result) with quantifiable impact.")
        if not improvements:
            improvements.append("Excellent structured answer. Consider discussing real-world failure modes or edge-case handling to stand out.")

        # Context-aware Follow-Up Question
        follow_up = None
        if missing_concepts:
            follow_up = f"How would your approach adapt if we need to optimize for {missing_concepts[0]}?"
        elif "trade-off" not in text.lower():
            follow_up = "What are the main architectural or algorithmic trade-offs of this approach compared to simpler alternatives?"
        else:
            follow_up = "How does this solution behave under extreme scale or high concurrent traffic?"

        # Feedback summary
        if overall >= 85:
            summary = "Strong, well-articulated response demonstrating solid mastery of core concepts and trade-offs."
        elif overall >= 70:
            summary = "Good answer covering the main requirements. Solid foundation with room to expand on edge cases and metrics."
        else:
            summary = "Developing response. Focus on expanding domain precision, technical keywords, and structured delivery."

        return {
            "overall_score": overall,
            "dimension_scores": {
                "technical_accuracy": tech_score,
                "relevance": relevance_score,
                "completeness": comp_score,
                "conceptual_understanding": understanding_score,
                "communication": comm_score,
                "problem_solving": problem_solving_score
            },
            "missing_concepts": missing_concepts,
            "improvements": improvements,
            "follow_up_question": follow_up,
            "feedback_summary": summary,
            "disclaimer": "AI-generated practice feedback, not an actual employer evaluation."
        }

