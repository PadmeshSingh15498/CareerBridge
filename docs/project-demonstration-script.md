# CareerBridge — Portfolio Live Demonstration Script

This script is structured for a 10-15 minute live portfolio presentation or technical interview demonstration. It walks through all 11 core stages of CareerBridge across the Student, Recruiter, and Placement Officer (TPO) personas.

---

## Demonstration Setup

- **Frontend URL:** `http://localhost:3000` (or production URL)
- **Backend API Docs:** `http://localhost:8000/docs`
- **Seeded Demo Accounts:**
  - **Student:** `student@careerbridge.com` / `Password123!`
  - **Recruiter:** `recruiter@google.com` / `Password123!`
  - **Placement Officer (TPO):** `tpo@university.edu` / `Password123!`

---

## 11-Step Demonstration Script

### Step 1: Student Registration & Authentication
- **Action:** Navigate to `http://localhost:3000/register`.
- **Demo Points:**
  - Show the tabbed registration interface supporting Student, Recruiter, and Admin.
  - Point out that Admin registration requires an authorized institutional invitation token.
  - Log in via `http://localhost:3000/login` using the one-click **"Student"** demo account button.
- **Talking Point:** *"Notice that authentication uses Argon2id password hashing and issues JWT tokens stored strictly in HttpOnly, SameSite=Lax Secure cookies, preventing any client-side JavaScript access or XSS token theft."*

### Step 2: Resume Ingestion & Parsing
- **Action:** From the Student Dashboard, click **"Update Resume"** or navigate to `/student/resume`.
- **Demo Points:**
  - Upload a candidate PDF resume.
  - Show instantaneous document ingestion.
- **Talking Point:** *"The backend leverages PyMuPDF (`fitz`) with coordinate layout sorting. Rather than flattening text line-by-line, it preserves two-column reading order, bounding boxes, and section blocks."*

### Step 3: AI Resume Diagnostics & PDF Report Export
- **Action:** Navigate to `/student/resume/analysis` (or click "View ATS Audit").
- **Demo Points:**
  - View the 100-point transparent ATS score broken down into 7 configurable dimensions (Structure 15%, Technical Skills 20%, Projects 20%, Experience 15%, Education 10%, Achievements 10%, Readability 10%).
  - Highlight the Action Verb and Metric Density feedback cards.
  - Click **"Download Audit PDF"** to download the generated multi-page branded PDF report.
- **Talking Point:** *"Unlike commercial ATS scanners that make black-box claims, CareerBridge provides a deterministic, transparent rubric with zero ungrounded LLM guessing."*

### Step 4: Algorithmic Job Matching & Opportunity Radar
- **Action:** Navigate to `/student/jobs/radar` (or `/student/jobs`).
- **Demo Points:**
  - View recommended jobs ranked by compatibility percentage.
  - Point out the Opportunity Radar (5-axis SVG pentagon comparing candidate depth against Tier-1 campus cutoffs).
- **Talking Point:** *"The matching engine is a hybrid tri-tier algorithm combining exact Jaccard skill overlap (40%), weighted core/preferred skill ratios (35%), and dense semantic embeddings (25%) using Sentence Transformers."*

### Step 5: Compatibility Explanation & Academic Eligibility
- **Action:** Click on an individual job card (e.g. *Backend Software Engineer* at *Google Cloud*).
- **Demo Points:**
  - Show the Matched Skills list (e.g. Python, FastAPI, Docker) vs Missing Skills (e.g. Kubernetes).
  - Highlight the **"Eligible"** badge and show how CGPA cutoff ($\ge 8.0$) and backlog thresholds ($0$ active backlogs) are strictly enforced.
- **Talking Point:** *"We strictly separate skill compatibility from institutional eligibility. Even a student with a 95% skill match is flagged if they do not satisfy the employer's academic cutoffs."*

### Step 6: Skill Gap Diagnosis
- **Action:** Navigate to `/student/skill-gap`.
- **Demo Points:**
  - Select target role: **"Software Developer"** or **"Machine Learning Engineer"**.
  - Show the 4-category classification:
    - *Already Proficient* (verified in profile/resume).
    - *Needs Improvement* (introductory familiarity).
    - *Not Yet Learned* (critical missing gaps).
    - *Unknown Proficiency*.
- **Talking Point:** *"The skill gap engine maps candidate proficiencies against our structured taxonomy of 800+ normalized skills across 9 industry roles."*

### Step 7: Personalized 6-Stage Career Roadmap & CRI
- **Action:** Navigate to `/student/roadmap`.
- **Demo Points:**
  - View the 6-stage milestone tracker (e.g., Week 1: Advanced Algorithms $\to$ Week 3: Distributed Systems Capstone $\to$ Week 6: System Design & Mock Interviews).
  - Inspect the **Career Readiness Index (CRI)** concentric radial SVG ring displaying composite placement readiness.
- **Talking Point:** *"Instead of vague suggestions, the roadmap provides concrete capstone projects with verifiable GitHub evidence markers."*

### Step 8: BridgeAI Context-Grounded Mentorship
- **Action:** Navigate to `/student/bridge-ai`.
- **Demo Points:**
  - Click a suggested prompt chip: *"What should I focus on this week to prepare for Google Cloud's backend role?"*
  - Observe how BridgeAI references the student's actual missing skills, active applications, and academic background.
- **Talking Point:** *"BridgeAI uses Retrieval-Augmented Generation (RAG). It retrieves only the authorized student's records and enforces strict prompt-injection defenses and tenant isolation."*

### Step 9: One-Click Job Application Submission
- **Action:** Navigate to `/student/jobs`, select an eligible job, and click **"Apply Now"**.
- **Demo Points:**
  - Instant submission confirmation.
  - Navigate to `/student/applications` to show the application active in the pipeline (`Status: APPLIED`).

### Step 10: Recruiter Talent Hub & Pipeline Advancement
- **Action:** Log out and log in as Recruiter (`recruiter@google.com` / `Password123!`).
- **Demo Points:**
  - Navigate to `/recruiter/dashboard`. Show active requisitions and candidate match insights.
  - Navigate to `/recruiter/applicants`.
  - Locate the newly submitted application and drag/click to advance status: `applied` $\to$ `shortlisted` $\to$ `technical_round`.
  - Schedule an interview round with date, venue, and evaluation rubric.
- **Talking Point:** *"Recruiters manage candidates through an interactive Kanban stream with immutable audit logging on every stage transition."*

### Step 11: University Placement Officer (TPO) Command Center
- **Action:** Log out and log in as Placement Officer (`tpo@university.edu` / `Password123!`).
- **Demo Points:**
  - Navigate to `/admin/dashboard`.
  - Point out the macro metrics: Placement Percentage (79.6%), average package, and department distribution chart (Recharts).
  - Navigate to `/admin/students` to demonstrate CSV bulk roster import with duplicate detection.
  - Click **"Export Placement CSV"** to demonstrate instantaneous institutional compliance reporting.
- **Talking Point:** *"The TPO workspace acts as an institutional command center, eliminating fragmented spreadsheets while maintaining full auditability and verification governance."*

