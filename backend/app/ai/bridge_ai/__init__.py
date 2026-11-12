"""
BridgeAI Career Intelligence Assistant & RAG Engine Package.
"""

from app.ai.bridge_ai.knowledge_base import (
    CAREER_KNOWLEDGE_DOCUMENTS,
    get_all_knowledge_chunks
)
from app.ai.bridge_ai.vector_store import (
    search_knowledge_base,
    CareerKnowledgeVectorStore
)
from app.ai.bridge_ai.context_builder import (
    build_student_context_prompt
)
from app.ai.bridge_ai.guardrails import (
    inspect_and_sanitize_query,
    SAFETY_INSTRUCTIONS
)
from app.ai.bridge_ai.llm_client import (
    generate_bridge_ai_response
)

__all__ = [
    "CAREER_KNOWLEDGE_DOCUMENTS",
    "get_all_knowledge_chunks",
    "search_knowledge_base",
    "CareerKnowledgeVectorStore",
    "build_student_context_prompt",
    "inspect_and_sanitize_query",
    "SAFETY_INSTRUCTIONS",
    "generate_bridge_ai_response"
]

