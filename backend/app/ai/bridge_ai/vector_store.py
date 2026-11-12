"""
Vector Index & Semantic Retrieval Engine for BridgeAI Knowledge Base.
Supports dense sentence-transformer embeddings with calibrated TF-IDF cosine similarity fallback.
"""

import logging
from typing import Any, Dict, List, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.ai.bridge_ai.knowledge_base import get_all_knowledge_chunks

logger = logging.getLogger("careerbridge.bridge_ai.vector_store")


class CareerKnowledgeVectorStore:
    _instance: Optional["CareerKnowledgeVectorStore"] = None

    def __init__(self):
        self.chunks = get_all_knowledge_chunks()
        self.corpus_texts = [f"{c['title']}. {c['text']}" for c in self.chunks]
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None
        self.encoder = None
        self.dense_embeddings = None
        self.use_dense = False

        self._initialize_index()

    @classmethod
    def get_instance(cls) -> "CareerKnowledgeVectorStore":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _initialize_index(self):
        """Initializes dense sentence transformers or TF-IDF vector matrix."""
        try:
            from sentence_transformers import SentenceTransformer
            self.encoder = SentenceTransformer("all-MiniLM-L6-v2")
            self.dense_embeddings = self.encoder.encode(self.corpus_texts, convert_to_numpy=True)
            self.use_dense = True
            logger.info("BridgeAI Vector Store initialized with SentenceTransformer('all-MiniLM-L6-v2').")
            return
        except Exception as e:
            logger.info(f"Dense embeddings unavailable ({e}). Using high-dimensional TF-IDF vector index.")

        # Fallback to TF-IDF with custom token pattern preserving technical identifiers
        self.vectorizer = TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            sublinear_tf=True,
            token_pattern=r"(?u)\b[\w\.\+\#\-]{2,}\b"
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus_texts)
        self.use_dense = False
        logger.info(f"BridgeAI TF-IDF Vector Index initialized over {len(self.chunks)} knowledge passages.")

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves top-k most semantically relevant knowledge chunks for user query.
        """
        if not query or not query.strip():
            return []

        clean_query = query.strip()

        if self.use_dense and self.encoder is not None:
            try:
                q_emb = self.encoder.encode([clean_query], convert_to_numpy=True)
                scores = cosine_similarity(q_emb, self.dense_embeddings)[0]
            except Exception as exc:
                logger.warning(f"Dense search failed ({exc}), falling back to TF-IDF.")
                scores = self._tfidf_search(clean_query)
        else:
            scores = self._tfidf_search(clean_query)

        # Rank indices
        top_indices = np.argsort(scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            score = float(scores[idx])
            if score > 0.05:  # Minimum relevance floor
                chunk = self.chunks[idx].copy()
                chunk["relevance_score"] = round(score, 4)
                results.append(chunk)

        return results

    def _tfidf_search(self, query: str) -> np.ndarray:
        if self.vectorizer is None or self.tfidf_matrix is None:
            return np.zeros(len(self.chunks))
        q_vec = self.vectorizer.transform([query])
        return cosine_similarity(q_vec, self.tfidf_matrix)[0]


def search_knowledge_base(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """Convenience search helper for BridgeAI knowledge base."""
    store = CareerKnowledgeVectorStore.get_instance()
    return store.search(query, top_k=top_k)

