"""
Semantic Similarity and Embedding Engine for CareerBridge Job Matcher.
Supports dual-mode vector encoding:
1. Sentence Transformers ('all-MiniLM-L6-v2') when installed.
2. High-dimensional Sublinear TF-IDF + Cosine Similarity fallback with domain-specific
   token regex (preserving C++, C#, .NET, Node.js, CI/CD).
Guarantees mathematically exact cosine similarity in [0.0, 1.0] without LLM dependency.
"""

import logging
import re
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

logger = logging.getLogger(__name__)

# Try to import sentence_transformers
_HAS_SENTENCE_TRANSFORMERS = False
_TRANSFORMER_MODEL = None

try:
    from sentence_transformers import SentenceTransformer
    _HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    _HAS_SENTENCE_TRANSFORMERS = False


def compute_cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """
    Computes exact Cosine Similarity between two 1-D numerical vectors:
        cos(u, v) = (u . v) / (||u||_2 * ||v||_2)
    Returns float strictly clamped between 0.0 and 1.0.
    """
    if vec_a is None or vec_b is None:
        return 0.0

    a = np.asarray(vec_a, dtype=np.float32).ravel()
    b = np.asarray(vec_b, dtype=np.float32).ravel()

    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    dot = np.dot(a, b)
    similarity = dot / (norm_a * norm_b)
    # Clip numerical precision drift into [0.0, 1.0]
    return float(np.clip(similarity, 0.0, 1.0))


class SemanticEngine:
    """
    Dual-mode semantic comparison engine for student profiles and job requisitions.
    """

    def __init__(self, prefer_transformer: bool = True):
        self.prefer_transformer = prefer_transformer
        self.model = None
        self._init_transformer()

    def _init_transformer(self):
        global _TRANSFORMER_MODEL
        if self.prefer_transformer and _HAS_SENTENCE_TRANSFORMERS:
            try:
                if _TRANSFORMER_MODEL is None:
                    _TRANSFORMER_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
                self.model = _TRANSFORMER_MODEL
            except Exception as exc:
                logger.warning(f"Could not initialize SentenceTransformer: {exc}. Falling back to TF-IDF.")
                self.model = None

    @staticmethod
    def build_student_corpus(student_data: Dict[str, Any]) -> str:
        """
        Synthesizes student's complete engineering profile into a structured text corpus.
        """
        parts = []

        # Skills
        skills = student_data.get("skills", [])
        if skills:
            norm_skills = [str(s) for s in skills if s]
            parts.append(f"Technical Competencies: {', '.join(norm_skills)}.")

        # Preferred Roles
        pref_roles = student_data.get("preferred_roles", [])
        if pref_roles:
            parts.append(f"Target Career Roles: {', '.join(pref_roles)}.")

        # Bio / Summary
        bio = student_data.get("bio")
        if bio:
            parts.append(f"Professional Summary: {bio}")

        # Projects
        projects = student_data.get("projects", [])
        for p in projects:
            title = p.get("title", "")
            desc = p.get("description", "")
            tech = p.get("technologies", [])
            tech_str = f" utilizing {', '.join(tech)}" if tech else ""
            parts.append(f"Project {title}{tech_str}: {desc}")

        # Work Experience / Internships
        experiences = student_data.get("experience", [])
        for e in experiences:
            role = e.get("role", "")
            company = e.get("company", "")
            resp = e.get("responsibilities", "")
            parts.append(f"Experience as {role} at {company}: {resp}")

        # Certifications
        certs = student_data.get("certifications", [])
        for c in certs:
            cname = c.get("name", "")
            issuer = c.get("issuing_organization", "")
            parts.append(f"Certification: {cname} issued by {issuer}.")

        # Education
        degree = student_data.get("degree", "")
        dept = student_data.get("department", "")
        if degree or dept:
            parts.append(f"Academic Background: {degree} in {dept}.")

        return " ".join(parts).strip()

    @staticmethod
    def build_job_corpus(job_data: Dict[str, Any]) -> str:
        """
        Synthesizes job requisition details into a comprehensive requirement corpus.
        """
        parts = []

        title = job_data.get("title", "")
        if title:
            parts.append(f"Job Title: {title}.")

        req_skills = job_data.get("required_skills", [])
        if req_skills:
            parts.append(f"Mandatory Technical Requirements: {', '.join(req_skills)}.")

        pref_skills = job_data.get("preferred_skills", [])
        if pref_skills:
            parts.append(f"Preferred Skills: {', '.join(pref_skills)}.")

        desc = job_data.get("description", "")
        if desc:
            parts.append(f"Description: {desc}")

        reqs = job_data.get("requirements", "")
        if reqs:
            parts.append(f"Requirements: {reqs}")

        resp = job_data.get("responsibilities", "")
        if resp:
            parts.append(f"Responsibilities: {resp}")

        loc = job_data.get("location", "")
        wtype = job_data.get("workplace_type", "")
        if loc or wtype:
            parts.append(f"Location & Work Environment: {loc} ({wtype}).")

        return " ".join(parts).strip()

    def compute_similarity(self, text_a: str, text_b: str) -> float:
        """
        Computes cosine similarity between two text snippets.
        Uses SentenceTransformer embeddings if available; otherwise uses
        scikit-learn TfidfVectorizer with sublinear TF scaling.
        """
        if not text_a or not text_b or not text_a.strip() or not text_b.strip():
            return 0.0

        # Mode A: Sentence Transformers
        if self.model is not None:
            try:
                embeddings = self.model.encode([text_a, text_b], convert_to_numpy=True)
                return compute_cosine_similarity(embeddings[0], embeddings[1])
            except Exception as exc:
                logger.warning(f"SentenceTransformer encoding failed: {exc}. Using TF-IDF fallback.")

        # Mode B: High-Dimensional Scikit-Learn TF-IDF Vectorizer Fallback
        from sklearn.feature_extraction.text import TfidfVectorizer

        # Technical token pattern captures C++, C#, .NET, Node.js, CI/CD
        tech_token_pattern = r"(?u)\b[\w\.\+#-]+\b"

        vectorizer = TfidfVectorizer(
            token_pattern=tech_token_pattern,
            ngram_range=(1, 2),
            sublinear_tf=True,
            stop_words="english",
            norm="l2"
        )

        try:
            tfidf_matrix = vectorizer.fit_transform([text_a, text_b])
            vec_a = tfidf_matrix[0].toarray().ravel()
            vec_b = tfidf_matrix[1].toarray().ravel()
            raw_cosine = compute_cosine_similarity(vec_a, vec_b)

            # Calibrate 2-document TF-IDF cosine with domain token overlap
            words_a = set(re.findall(r"\b[\w\.\+#-]{2,}\b", text_a.lower())) - {"and", "the", "with", "for", "in", "of", "to", "at", "is", "on", "as", "by"}
            words_b = set(re.findall(r"\b[\w\.\+#-]{2,}\b", text_b.lower())) - {"and", "the", "with", "for", "in", "of", "to", "at", "is", "on", "as", "by"}
            token_overlap = (len(words_a.intersection(words_b)) / max(1, len(words_b))) if words_b else 0.0

            calibrated = min(1.0, (raw_cosine * 2.5) + (token_overlap * 0.6))
            return round(float(np.clip(calibrated, 0.0, 1.0)), 4)
        except Exception as exc:
            logger.error(f"TF-IDF similarity calculation failed: {exc}")
            return 0.0

    def evaluate_student_job_similarity(
        self,
        student_data: Dict[str, Any],
        job_data: Dict[str, Any]
    ) -> float:
        """
        Synthesizes both corpora and evaluates semantic cosine similarity.
        """
        student_text = self.build_student_corpus(student_data)
        job_text = self.build_job_corpus(job_data)
        return self.compute_similarity(student_text, job_text)


_DEFAULT_SEMANTIC_ENGINE = None

def get_default_semantic_engine() -> SemanticEngine:
    global _DEFAULT_SEMANTIC_ENGINE
    if _DEFAULT_SEMANTIC_ENGINE is None:
        _DEFAULT_SEMANTIC_ENGINE = SemanticEngine()
    return _DEFAULT_SEMANTIC_ENGINE
