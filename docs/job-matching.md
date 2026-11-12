# CareerBridge Intelligent Job Matching & Opportunity Radar Documentation

> **Tagline:** *From Potential to Placement.*  
> **Module:** `backend/app/ai/job_matcher/`  
> **Architecture:** Independent, deterministic, multi-dimensional candidate-job alignment engine. Zero external LLM dependency.

---

## 1. Overview & Core Philosophy

CareerBridge's Intelligent Job Matching Engine evaluates student employability and recommends campus placement requisitions without relying on opaque LLM chat prompts. The recommendation engine implements actual Python-based algorithms, combining:

1. **Exact & Alias Skill Normalization** (with strict non-equivalence guards).
2. **Hard Academic Eligibility Gating** (CGPA, backlogs, department, graduation batch).
3. **Semantic Cosine Similarity** (Sentence Transformers / TF-IDF vectorization).
4. **Project & Internship Technical Evidence Scoring**.
5. **Career Preference Alignment** (Target roles, workplace types, and locations).

---

## 2. Configurable Matching Formula

The composite match score ($\text{Match Score} \in [0, 100]$) is computed through a normalized weighting model:

$$\text{Composite Score} = w_{\text{req}} \cdot S_{\text{req}} + w_{\text{sem}} \cdot S_{\text{sem}} + w_{\text{proj}} \cdot S_{\text{proj}} + w_{\text{pref}} \cdot S_{\text{pref}} + w_{\text{career}} \cdot S_{\text{career}}$$

### Default Normalized Weights:
| Dimension | Weight | Description |
| :--- | :---: | :--- |
| **Required Skills Match ($S_{\text{req}}$)** | **40%** (`0.40`) | Proportion of employer mandatory skills evidenced in candidate profile or projects. |
| **Semantic Similarity ($S_{\text{sem}}$)** | **25%** (`0.25`) | Cosine similarity between candidate technical corpus and requisition text. |
| **Project & Experience Evidence ($S_{\text{proj}}$)** | **15%** (`0.15`) | Tangible proof of work in capstone projects, repositories, and internships. |
| **Preferred Skills Match ($S_{\text{pref}}$)** | **10%** (`0.10`) | Bonus alignment with desirable secondary skills. |
| **Career Preferences Match ($S_{\text{career}}$)** | **10%** (`0.10`) | Role title similarity and location/workplace alignment. |

$$\sum w_i = 0.40 + 0.25 + 0.15 + 0.10 + 0.10 = 1.00 \quad (100\%)$$

---

## 3. Strict Separation of Academic Eligibility

Hard institutional eligibility criteria are evaluated **independently** from AI matching scores:

1. **Gating Rule**: A student who fails any configured hard requirement (CGPA below minimum, backlogs above limit, non-eligible department, or graduation year outside allowed batches) is strictly marked as **`not_eligible`**, regardless of whether their semantic similarity is 99%.
2. **Missing Information Principle**: Missing profile information (e.g., student has not yet entered CGPA or department) is marked as **`unknown`** with explicit explanatory messages, rather than punitively penalizing the student.
3. **No Automated Rejection by AI**: Match scores serve as diagnostic guidance; students are never automatically rejected from campus drives solely on low AI similarity scores.

---

## 4. Skill Normalization & False-Friend Guards

The skill dictionary normalizes common acronyms and technical synonyms:
- `JS`, `Vanilla JS`, `ES6` $\rightarrow$ `JavaScript`
- `TS` $\rightarrow$ `TypeScript`
- `Py`, `Python 3` $\rightarrow$ `Python`
- `ML` $\rightarrow$ `Machine Learning`
- `NLP` $\rightarrow$ `Natural Language Processing`
- `SQL` $\rightarrow$ `SQL`
- `Postgres`, `PgSQL` $\rightarrow$ `PostgreSQL`
- `K8s` $\rightarrow$ `Kubernetes`
- `Docker`, `Containerization` $\rightarrow$ `Docker`
- `ReactJS`, `React.js` $\rightarrow$ `React`
- `NextJS`, `Next.js` $\rightarrow$ `Next.js`

### Strict Non-Equivalence Enforcement:
To prevent false-positive matches common in naive substring check engines, the engine strictly forbids equating:
- `Java` $\neq$ `JavaScript`
- `C` $\neq$ `C++` $\neq$ `C#`
- `ML` $\neq$ `SQL`
- `HTML` $\neq$ `CSS`
- `Python` $\neq$ `PyTorch`
- `Rust` $\neq$ `Ruby`
- `Go` $\neq$ `Google Cloud Platform (GCP)`

---

## 5. Recommendation Output Schema

For every candidate-job evaluation, the engine produces the standardized JSON schema:

```json
{
  "job_id": "job_backend_cloud",
  "match_score": 84,
  "eligibility_status": "eligible",
  "matched_skills": ["Python", "FastAPI", "Docker", "PostgreSQL"],
  "missing_required_skills": ["Kubernetes"],
  "matched_preferred_skills": ["Redis"],
  "semantic_similarity": 0.8124,
  "explanation": "Strong technical alignment in mandatory stack (Python, FastAPI, Docker, PostgreSQL). Key missing skills for this role: Kubernetes. Candidate projects demonstrate strong practical application of target tools. High semantic similarity (81%) between your portfolio and requisition responsibilities.",
  "category": "Excellent Match",
  "is_eligible": true,
  "eligibility_reasons": [],
  "breakdown": {
    "required_skills_pct": 80.0,
    "preferred_skills_pct": 100.0,
    "semantic_similarity_pct": 81.2,
    "project_experience_pct": 85.0,
    "career_preference_pct": 90.0
  },
  "recommended_next_steps": [
    "Acquire foundation in Kubernetes through coursework or capstone implementation.",
    "Review company interview stages and prepare targeted questions for the recruiter."
  ]
}
```

---

## 6. Categorization Tiers

| Category | Criteria |
| :--- | :--- |
| **`Excellent Match`** | Academically Eligible / Unknown, $\text{Match Score} \ge 80$. Core requirements satisfied. |
| **`Good Match`** | Academically Eligible / Unknown, $60 \le \text{Match Score} < 80$. Solid baseline with minor gaps. |
| **`Skill Development Needed`** | Academically Eligible / Unknown, $\text{Match Score} < 60$. Substantial technical gaps. |
| **`Not Eligible`** | Explicitly fails one or more configured hard requirements (CGPA, backlogs, department, batch). |
| **`Insufficient Profile Information`**| Student profile has zero skills and zero recorded projects. |

---

## 7. Synthetic Benchmark Evaluation Results

The engine was evaluated across 8 synthetic student archetypes (Full-Stack, ML/AI, Frontend, Cloud/DevOps, Low-CGPA, Backlogs, Non-CS, Sparse) and 6 diverse enterprise requisitions:

| Metric | Result | Target | Status |
| :--- | :---: | :---: | :---: |
| **Ranking Consistency** | **100.0%** | $\ge 90.0\%$ | Passed |
| **Precision@1** | **100.0%** | $\ge 85.0\%$ | Passed |
| **Precision@2** | **100.0%** | $\ge 85.0\%$ | Passed |
| **Eligibility Gating Accuracy** | **100.0%** | $100.0\%$ | Passed |
| **False Matches Detected** | **0** | $0$ | Passed |
| **Execution Latency** | **< 15ms / pair** | $< 100\text{ms}$ | Passed |
| **External LLM Calls** | **0** | $0$ | Passed |

### Mandatory Academic Disclaimer:
> **DISCLAIMER:** Synthetic benchmark metrics evaluate algorithmic ranking logic and mathematical scoring consistency on controlled archetypes. They do not claim that synthetic-data performance proves real-world placement effectiveness or guarantees recruitment shortlisting.

