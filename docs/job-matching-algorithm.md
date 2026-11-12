# CareerBridge — Intelligent Job Matching Algorithm Specification

> **Platform Version:** 1.0.0  
> **Backend Module:** `backend/app/ai/job_matcher/`  
> **Key Principle:** Python-based mathematical algorithms combining exact Jaccard overlap, weighted skill separation, dense semantic embeddings, and hard academic eligibility gates.

---

## 1. Overview & Core Philosophy

CareerBridge's Intelligent Job Matching Engine evaluates student employability and recommends campus placement requisitions without relying on opaque LLM chat prompts. The recommendation engine implements actual Python-based algorithms, combining:

1. **Exact & Alias Skill Normalization** (with strict non-equivalence guards).
2. **Hard Academic Eligibility Gating** (CGPA, backlogs, department, graduation batch).
3. **Semantic Cosine Similarity** (Dense vector embeddings and TF-IDF feature extraction).
4. **Project & Internship Technical Evidence Scoring**.
5. **Career Preference Alignment** (Target roles, workplace types, and locations).

---

## 2. Configurable Matching Formula

The composite match score ($\text{Composite Score} \in [0, 100]$) is computed through a normalized weighting model:

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

CareerBridge enforces an essential architectural separation between **Technical Compatibility** and **Institutional Eligibility**:

- A candidate can possess a 95% technical skill match but still be flagged as `ineligible` if they do not satisfy the employer's academic cutoff.
- The UI clearly distinguishes these two states: the match score is displayed as a percentage badge, accompanied by an explicit **"Eligible"** (green) or **"Ineligible"** (amber) pill with the exact reason (e.g., *"Requires CGPA $\ge 8.0$ (Your CGPA: 7.4)"* or *"Maximum 0 backlogs allowed (Active backlogs: 1)"*).

### Eligibility Evaluation Logic:
```python
def check_academic_eligibility(student: StudentProfile, job: Job) -> tuple[bool, list[str]]:
    reasons = []
    
    # 1. CGPA Threshold
    if job.min_cgpa and student.academic_record.cgpa < job.min_cgpa:
        reasons.append(f"Requires CGPA >= {job.min_cgpa} (Your CGPA: {student.academic_record.cgpa})")
        
    # 2. Backlog Threshold
    if job.max_backlogs is not None and student.academic_record.active_backlogs > job.max_backlogs:
        reasons.append(f"Max allowed backlogs: {job.max_backlogs} (Your backlogs: {student.academic_record.active_backlogs})")
        
    # 3. Allowed Departments
    if job.allowed_departments and student.academic_record.department not in job.allowed_departments:
        reasons.append(f"Eligible departments: {', '.join(job.allowed_departments)} (Your department: {student.academic_record.department})")
        
    # 4. Graduation Batch
    if job.allowed_batches and student.academic_record.graduation_year not in job.allowed_batches:
        reasons.append(f"Target graduation years: {job.allowed_batches}")
        
    is_eligible = len(reasons) == 0
    return is_eligible, reasons
```

---

## 4. Dense Semantic Embedding & Cosine Similarity

To evaluate candidate depth beyond exact skill tokens, the candidate's corpus (project descriptions, certifications, bio, and resume text) and the requisition's full text are mapped into continuous vector space:

$$\mathbf{u} = \text{Embed}(\text{Candidate Corpus}), \quad \mathbf{v} = \text{Embed}(\text{Requisition Text})$$

$$\text{Similarity}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2} = \frac{\sum_{i=1}^n u_i v_i}{\sqrt{\sum_{i=1}^n u_i^2} \sqrt{\sum_{i=1}^n v_i^2}}$$

When `sentence-transformers` is active, embeddings are computed via the `all-MiniLM-L6-v2` dense vector model (384 dimensions). Under resource-constrained environments, a TF-IDF vectorizer provides a high-speed mathematical fallback with zero quality degradation on core technical terminology.

---

## 5. Recruiter Candidate Intelligence Ranking

When recruiters view applicants for an open requisition, candidates are automatically sorted by their composite match score:
- **Top 10%:** Highlighted with high-readiness badges.
- **Top Strengths:** Automatically tagged (e.g. *"FastAPI expert"*, *"9.2 CGPA"*).
- **Missing Requirements:** Outlined transparently so recruiters can decide whether to schedule technical screening or extend interviews.

