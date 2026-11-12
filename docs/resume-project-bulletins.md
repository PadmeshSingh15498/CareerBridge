# CareerBridge — Professional Resume Descriptions (B.Tech AI & ML)

These bullet points and summary formats are tailored specifically for inclusion on a **B.Tech Computer Science / AI & ML student's resume**, portfolio website, or LinkedIn profile. All claims accurately reflect the actual implemented codebase without exaggeration.

---

## Option 1: Standard Multi-Bullet Resume Format (Recommended)

### **CareerBridge — AI-Powered Campus Recruitment & Career Acceleration Platform**
*Full-Stack & Machine Learning Project | Python, FastAPI, Next.js, MySQL, Sentence Transformers, PyMuPDF*

- Architected a decoupled enterprise SaaS platform connecting university students, corporate recruiters, and placement offices with 32 normalized MySQL relational tables and role-based access control (RBAC).
- Implemented a multi-tier candidate job matching engine combining exact skill intersection (Jaccard), weighted core/preferred skill ratios, and dense semantic embeddings (`all-MiniLM-L6-v2`) with Cosine Similarity.
- Built a deterministic 100-point ATS resume parser utilizing PyMuPDF (`fitz`) layout coordinate sorting to preserve multi-column reading order, calculating 7-pillar rubrics and generating downloadable PDF audit reports.
- Engineered **BridgeAI**, a context-grounded conversational career assistant implementing RAG across student academic records, diagnosed skill gaps, and active applications with prompt-injection guardrails.
- Developed an interactive interview preparation studio featuring browser-native speech-to-text recording (Web Speech API) and multi-dimensional automated scoring rubrics.
- Hardened full-stack security using Argon2id password hashing, HttpOnly Secure cookie session management, refresh token rotation, and non-root Docker containerization verified by 104 automated tests.

---

## Option 2: Compact / 3-Bullet High-Impact Format (For 1-Page Resumes)

### **CareerBridge — AI-Driven Campus Recruitment & Placement Platform**
*Technologies: Python, FastAPI, Next.js 14, TypeScript, MySQL 8, PyMuPDF, Scikit-Learn, Docker*

- Engineered an AI-driven recruitment SaaS featuring a hybrid job matching engine (exact, weighted, and dense vector semantic similarity) and a deterministic 7-pillar ATS resume analyzer with PyMuPDF layout parsing.
- Implemented **BridgeAI**, a RAG-grounded conversational career mentor, dynamic 6-stage skill gap roadmaps across 9 industry roles, and an AI mock interview studio with voice-to-text transcription.
- Containerized a 4-worker FastAPI backend and Next.js frontend with MySQL connection pooling, Argon2id security, and zero-downtime health checking; validated via 104 passing pytest integration tests.

---

## Option 3: Technical Skills Summary for Portfolio Website

- **Project Title:** CareerBridge — From Potential to Placement
- **Short Overview:** An integrated campus placement and career acceleration platform featuring transparent ATS resume diagnostics, hybrid algorithmic job matching, personalized career roadmaps, and recruiter recruitment funnels.
- **Core Technologies:**
  - *Frontend:* Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Axios.
  - *Backend:* FastAPI, Python 3.11+, Pydantic v2, SQLAlchemy 2.0 ORM, PyMySQL, Argon2id (`argon2-cffi`), PyJWT.
  - *Database & Storage:* MySQL 8.0 Enterprise (Connection pooling 20-40), Persistent Volume Storage.
  - *DevOps & Cloud:* Docker (Multi-stage builds, non-root users), Docker Compose, Render Blueprint, Vercel edge deployment.
- **Implemented AI/ML Techniques:**
  - *Coordinate-Based Document Extraction:* PyMuPDF (`fitz`) bounding box sorting for multi-column layout preservation.
  - *Deterministic Rubric Modeling:* 7-pillar weighted scoring formula (Structure, Skills, Projects, Experience, Education, Achievements, Readability).
  - *Hybrid Recommendation Engine:* Jaccard similarity, weighted mandatory/preferred skill ratios, and dense vector embeddings with Cosine Similarity.
  - *Retrieval-Augmented Generation (RAG):* Tenant-isolated student context injection for personalized LLM career mentorship with prompt-injection defense.
  - *Speech-to-Text Audio Simulation:* Web Speech API audio transcription with 6-dimension interview answer evaluation.

