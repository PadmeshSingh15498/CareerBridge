# CareerBridge — REST API Specification

> **Base URL:** `/api/v1`  
> **API Protocol:** REST over HTTPS  
> **Data Format:** JSON (`application/json`), Multipart Form (`multipart/form-data`) for file uploads  
> **Security Scheme:** HTTP Bearer JWT (`Authorization: Bearer <access_token>`)  
> **Standard Response Envelope:** Standardized JSON responses with `success`, `data`, `error`, and `timestamp`.

---

## 1. Global Conventions & Standard Response Envelopes

### Standard Success Envelope (`200 OK`, `201 Created`, `202 Accepted`)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully.",
  "timestamp": "2026-11-11T13:30:00Z"
}
```

### Standard Paginated Envelope
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_records": 142,
    "total_pages": 8
  },
  "timestamp": "2026-11-11T13:30:00Z"
}
```

### Standard Error Envelope (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`)
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested job listing does not exist or has been archived.",
    "details": null
  },
  "timestamp": "2026-11-11T13:30:00Z"
}
```

---

## 2. API Endpoints by Module

---

### Module 1: Authentication (`/api/v1/auth`)

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new user (Student, Recruiter, TPO) |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & issue access and refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Public | Exchange valid refresh token for a new access token |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve authenticated user profile & workspace context |
| `POST` | `/api/v1/auth/logout` | Authenticated | Invalidate current session |

#### `POST /api/v1/auth/login`
- **Request Body:**
```json
{
  "email": "student@college.edu",
  "password": "Password123!"
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "dGhpc2lzYXJlZnJlc2h0b2tlbg...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": "e58129de-3a9d-4786-8d19-d1ecf547c13a",
      "email": "student@college.edu",
      "role": "student",
      "is_active": true
    }
  }
}
```

---

### Module 2: Students (`/api/v1/students`)

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/students/profile` | Student | Get current student full profile & academic details |
| `PUT` | `/api/v1/students/profile` | Student | Update personal bio, contact info, and social links |
| `POST` | `/api/v1/students/academic` | Student / TPO | Add or update academic history & CGPA records |
| `GET` | `/api/v1/students/skills` | Student | List tagged skills and self-assessed proficiencies |
| `POST` | `/api/v1/students/skills` | Student | Add skills from the standardized master skill taxonomy |
| `DELETE` | `/api/v1/students/skills/{skill_id}` | Student | Remove skill mapping from profile |
| `POST` | `/api/v1/students/projects` | Student | Create or update a portfolio project entry |
| `GET` | `/api/v1/students/applications` | Student | Retrieve all submitted job applications & status |
| `GET` | `/api/v1/students/drives` | Student | View registered on-campus placement drives |
| `POST` | `/api/v1/students/drives/{drive_id}/register`| Student | Register candidate for a placement drive |

#### `PUT /api/v1/students/profile`
- **Request Body:**
```json
{
  "full_name": "Aditya Sharma",
  "phone_number": "+91-9876543210",
  "city": "Bengaluru",
  "linkedin_url": "https://linkedin.com/in/aditya-sharma",
  "github_url": "https://github.com/aditya-sharma",
  "bio": "Aspiring Full Stack Engineer passionate about distributed systems and cloud backends."
}
```

---

### Module 3: Resumes (`/api/v1/resumes`)

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/resumes` | Student | List all uploaded resumes for current student |
| `POST` | `/api/v1/resumes/upload` | Student | Upload resume PDF, extract text & trigger ATS analysis |
| `GET` | `/api/v1/resumes/{resume_id}` | Student / Recruiter / TPO | Fetch resume metadata and download URL |
| `GET` | `/api/v1/resumes/{resume_id}/analysis` | Student / TPO | Get detailed ATS score breakdown & improvement tips |
| `PUT` | `/api/v1/resumes/{resume_id}/set-default` | Student | Mark resume as default for 1-click applications |
| `DELETE` | `/api/v1/resumes/{resume_id}` | Student | Delete resume and associated analysis versions |

#### `POST /api/v1/resumes/upload`
- **Content-Type:** `multipart/form-data`
- **Form Parameters:**
  - `file`: PDF binary (max 5 MB)
  - `title`: String (e.g., "FullStack_Resume_2026")
- **Response (`202 Accepted`):**
```json
{
  "success": true,
  "data": {
    "resume_id": "b188c0be-d0f9-4b13-8cfb-6f81ef0e39da",
    "title": "FullStack_Resume_2026",
    "file_name": "aditya_resume.pdf",
    "status": "processing",
    "message": "Resume uploaded successfully. Background ATS analysis initiated."
  }
}
```

---

### Module 4: Jobs (`/api/v1/jobs`)

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/jobs` | Authenticated | Search & filter active approved job postings |
| `GET` | `/api/v1/jobs/{job_id}` | Authenticated | Get full details, requirements, and eligibility for a job |
| `POST` | `/api/v1/jobs` | Recruiter | Post new job listing (defaults to pending TPO review) |
| `PUT` | `/api/v1/jobs/{job_id}` | Recruiter | Update job details, deadline, or requirements |
| `PATCH` | `/api/v1/jobs/{job_id}/status` | Recruiter / TPO | Update lifecycle state (`active`, `closed`, `approved`) |
| `POST` | `/api/v1/jobs/{job_id}/bookmark` | Student | Bookmark or remove job from saved list |
| `GET` | `/api/v1/jobs/saved` | Student | List all bookmarked jobs |

#### `POST /api/v1/jobs`
- **Request Body:**
```json
{
  "title": "Associate Software Engineer - Backend",
  "job_type": "full_time",
  "workplace_type": "hybrid",
  "location": "Bengaluru, India",
  "description": "Join our cloud infrastructure team building high-scale microservices...",
  "requirements": "Strong foundation in Python/Java, relational databases, REST APIs, and Docker.",
  "salary_min": 800000,
  "salary_max": 1200000,
  "vacancies": 5,
  "application_deadline": "2026-12-15T23:59:59Z",
  "skills": [
    { "name": "Python", "is_mandatory": true, "weight": 1.5 },
    { "name": "FastAPI", "is_mandatory": true, "weight": 1.2 },
    { "name": "MySQL", "is_mandatory": true, "weight": 1.0 },
    { "name": "Docker", "is_mandatory": false, "weight": 0.8 }
  ],
  "eligibility": {
    "min_cgpa": 7.00,
    "max_backlogs_allowed": 0,
    "allowed_grad_years": [2026],
    "allowed_departments": ["Computer Science", "Information Technology"]
  }
}
```

---

### Module 5: Applications (`/api/v1/applications`)

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/applications/apply` | Student | Apply to a job with selected resume and cover note |
| `GET` | `/api/v1/applications/{application_id}` | Student / Recruiter | View application status, match details, and history |
| `PATCH` | `/api/v1/applications/{application_id}/status` | Recruiter | Transition pipeline stage (`shortlisted`, `interview`, etc.) |
| `GET` | `/api/v1/applications/job/{job_id}` | Recruiter | List all applicants for a job with match ranking |
| `POST` | `/api/v1/applications/{application_id}/interviews` | Recruiter | Schedule live interview round for applicant |

#### `POST /api/v1/applications/apply`
- **Request Body:**
```json
{
  "job_id": "8f828a11-b0e2-4fce-b248-dc81c5f3b7b2",
  "resume_id": "b188c0be-d0f9-4b13-8cfb-6f81ef0e39da",
  "cover_letter": "I have completed several enterprise-scale FastAPI and React applications..."
}
```
- **Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "application_id": "c1f72a44-648f-416b-9c7d-e6b72a4128f1",
    "status": "applied",
    "composite_match_score": 88.5,
    "applied_at": "2026-11-11T13:35:00Z"
  }
}
```

---

### Module 6: AI Services (`/api/v1/ai`)

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/ai/match-job` | Student / Recruiter | Calculate real-time semantic match score for resume vs JD |
| `POST` | `/api/v1/ai/skill-gap` | Student | Identify missing skills and calculate target role readiness |
| `POST` | `/api/v1/ai/roadmap/generate`| Student | Generate a personalized 6 to 8-week learning roadmap |
| `GET` | `/api/v1/ai/roadmaps` | Student | Retrieve active learning roadmaps and week milestones |
| `PATCH` | `/api/v1/ai/roadmaps/{item_id}/toggle`| Student | Mark a weekly roadmap milestone as completed |
| `POST` | `/api/v1/ai/chat` | Student | Ask BridgeAI career assistant contextual queries |
| `POST` | `/api/v1/ai/interview/start` | Student | Start mock interview simulator for a selected role |
| `POST` | `/api/v1/ai/interview/{session_id}/answer` | Student | Submit answer and receive STAR feedback & rating |

#### `POST /api/v1/ai/chat`
- **Request Body:**
```json
{
  "conversation_id": "902d338a-366a-4b9d-bf82-72dc89761e38",
  "message": "How should I prepare for the upcoming Google Software Engineer interview?",
  "context_type": "interview_strategy"
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "conversation_id": "902d338a-366a-4b9d-bf82-72dc89761e38",
    "reply": "For Google Software Engineer roles, focus on: 1) Core Data Structures (Trees, Graphs, Dynamic Programming), 2) Clarifying requirements before coding, 3) Writing clean, testable code...",
    "source": "gemini_pro",
    "created_at": "2026-11-11T13:36:12Z"
  }
}
```

---

### Module 7: Recruiters (`/api/v1/recruiters`)

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/recruiters/company` | Recruiter | Get authenticated recruiter's corporate profile |
| `PUT` | `/api/v1/recruiters/company` | Recruiter | Update company overview, website, and logo |
| `GET` | `/api/v1/recruiters/dashboard` | Recruiter | Recruiter macro stats: active jobs, candidate pipeline counts |
| `GET` | `/api/v1/recruiters/candidates/search` | Recruiter | Search verified student talent pool by skill and CGPA |
| `POST` | `/api/v1/recruiters/interviews/{interview_id}/feedback` | Recruiter | Submit interview scoring, ratings, and recommendation |

---

### Module 8: Administration & TPO (`/api/v1/admin`)

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/admin/analytics/placement` | TPO / Admin | Campus-wide placement statistics (placed %, salary bands) |
| `GET` | `/api/v1/admin/students` | TPO / Admin | Filterable batch directory of students with verification controls |
| `PATCH` | `/api/v1/admin/students/{student_id}/verify` | TPO / Admin | Verify student CGPA & credentials for placement eligibility |
| `GET` | `/api/v1/admin/companies/pending` | TPO / Admin | List unverified corporate employers |
| `PATCH` | `/api/v1/admin/companies/{company_id}/verify`| TPO / Admin | Approve or reject company registration |
| `POST` | `/api/v1/admin/drives` | TPO / Admin | Create & publish new campus placement drive |
| `GET` | `/api/v1/admin/drives/{drive_id}/students` | TPO / Admin | View all registered students and update drive round progression |
| `POST` | `/api/v1/admin/broadcasts` | TPO / Admin | Send announcement broadcast to students or recruiters |
| `GET` | `/api/v1/admin/audit-logs` | Admin | Query system audit logs and compliance history |

#### `GET /api/v1/admin/analytics/placement`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "cohort_year": 2026,
    "total_students": 650,
    "placed_students": 492,
    "unplaced_students": 158,
    "placement_percentage": 75.69,
    "highest_ctc": 4400000,
    "average_ctc": 820000,
    "median_ctc": 700000,
    "department_breakdown": [
      { "department": "Computer Science", "placed": 210, "total": 230, "percentage": 91.30 },
      { "department": "Information Technology", "placed": 115, "total": 130, "percentage": 88.46 },
      { "department": "Electronics", "placed": 95, "total": 140, "percentage": 67.85 },
      { "department": "Mechanical", "placed": 72, "total": 150, "percentage": 48.00 }
    ],
    "top_recruiters": [
      { "company": "Microsoft", "hires": 18 },
      { "company": "Amazon", "hires": 24 },
      { "company": "TCS", "hires": 85 }
    ]
  }
}
```

---

### Module 9: Notifications (`/api/v1/notifications`)

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/notifications` | Authenticated | Retrieve unread and read alerts for authenticated user |
| `PATCH` | `/api/v1/notifications/{notification_id}/read` | Authenticated | Mark a notification as read |
| `PATCH` | `/api/v1/notifications/read-all` | Authenticated | Mark all notifications as read |

