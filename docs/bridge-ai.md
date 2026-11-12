# BridgeAI — Personalized AI Career Assistant & RAG Engine

## 1. Overview
**BridgeAI** is CareerBridge's personalized AI career mentor. It provides context-grounded career intelligence, resume feedback, technical interview preparation, and roadmap milestones for students preparing for campus placement drives.

Tagline: *"Grounded in Your Potential, Directed to Your Placement."*

---

## 2. Core Architecture

```
                                 ┌──────────────────────────────────────────────┐
                                 │              Student Query                   │
                                 └──────────────────────┬───────────────────────┘
                                                        │
                                                        ▼
                                 ┌──────────────────────────────────────────────┐
                                 │         Guardrails & Prompt Filter           │
                                 │   - Prompt injection regex inspection        │
                                 │   - Non-execution policy (No Shell/SQL)      │
                                 │   - Safety boundary enforcement              │
                                 └──────────────────────┬───────────────────────┘
                                                        │
                         ┌──────────────────────────────┴──────────────────────────────┐
                         ▼                                                             ▼
┌────────────────────────────────────────────────┐           ┌────────────────────────────────────────────────┐
│           RAG Knowledge Retrieval              │           │          Student Profile Grounding             │
│  - Top-k semantic search via Vector Store      │           │  - Degree, CGPA, Backlogs, Batch               │
│  - Curated Career Knowledge Documents          │           │  - Verified Skills & Declared Proficiencies    │
│  - Citations (STAR, ATS, System Design)        │           │  - Featured Projects (GitHub, Live Demos)      │
│                                                │           │  - ATS Resume Score & PyMuPDF Insights         │
│                                                │           │  - Active Roadmap Milestones & CRI (0-100)     │
│                                                │           │  - Strict cross-student data isolation         │
└────────────────────────┬───────────────────────┘           └────────────────────────┬───────────────────────┘
                         │                                                             │
                         └──────────────────────────────┬──────────────────────────────┘
                                                        │
                                                        ▼
                                 ┌──────────────────────────────────────────────┐
                                 │         Contextual Reasoning Engine          │
                                 │   (Google Gemini 1.5 Flash / Local Engine)   │
                                 └──────────────────────┬───────────────────────┘
                                                        │
                                                        ▼
                                 ┌──────────────────────────────────────────────┐
                                 │            Structured Response               │
                                 │   - Editorial markdown guidance              │
                                 │   - Source citations & reference badges      │
                                 │   - Formatted code snippets with copy button │
                                 │   - Clickable follow-up prompt chips         │
                                 └──────────────────────────────────────────────┘
```

---

## 3. Curated Career Knowledge Base (RAG)

The knowledge base is maintained strictly separate from student private records in `backend/app/ai/bridge_ai/knowledge_base.py`:
1. **`kb_star_interview_01`**: STAR Methodology & Behavioral Interview Framework.
2. **`kb_coding_interview_02`**: Technical Problem Solving & Algorithmic Interview Strategy.
3. **`kb_system_design_03`**: System Design Fundamentals for Campus Placement Drives.
4. **`kb_resume_ats_04`**: ATS Resume Engineering & Quantifiable XYZ Impact Formula.
5. **`kb_ai_ml_career_05`**: Machine Learning & AI Engineering Career Path.
6. **`kb_fullstack_06`**: Full-Stack Web Development & Modern Architecture Standards.
7. **`kb_placement_etiquette_07`**: Campus Placement Drive Etiquette & HR Protocol.

---

## 4. Semantic Search & Vector Index

The vector store (`backend/app/ai/bridge_ai/vector_store.py`) indexes curated knowledge chunks using:
- **Primary:** `SentenceTransformer('all-MiniLM-L6-v2')` dense vector embeddings.
- **Offline / Low-Resource Fallback:** Scikit-Learn `TfidfVectorizer` (sublinear TF scaling, n-grams $(1, 2)$, token pattern preserving technical identifiers `C++`, `C#`, `.NET`, `Node.js`, `CI/CD`).
- Top-k cosine similarity ranking returning matching chunks above a $0.05$ relevance floor with source references.

---

## 5. Security, Guardrails & Student Data Isolation

1. **Strict Cross-Student Isolation:**
   BridgeAI only ever retrieves data belonging to the authenticated user's session (`user.id == session.user_id`). Student A can never access Student B's conversations, resume, academic standing, or application records.
2. **Prompt Injection Defense:**
   Inputs are pre-screened against known jailbreak patterns (`ignore previous instructions`, `reveal system prompt`, `dump database`, `select * from users`). Injections are intercepted and replaced with safety notices.
3. **Non-Execution Boundary:**
   BridgeAI is an informational advisor. It never executes arbitrary code, database mutations, or shell commands from chatbot queries.
4. **No Placement Guarantees:**
   Every BridgeAI interaction includes an explicit disclaimer stating that hiring decisions rest solely with employer recruiters.

