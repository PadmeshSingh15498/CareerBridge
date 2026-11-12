# CareerBridge — REST API Specification & Endpoint Catalog

> **Base URL (Local):** `http://localhost:8000/api/v1`  
> **Base URL (Production):** `https://api.careerbridge.university.edu/api/v1`  
> **Interactive Swagger UI:** `/docs`  
> **ReDoc Documentation:** `/redoc`  
> **Authentication:** Bearer Token via HttpOnly, Secure, SameSite=Lax Cookie  

---

## 1. API Architecture & Standards

### 1.1 Response Envelope Structure
All successful and error responses adhere to the standard `ResponseEnvelope[T]` format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "timestamp": "2026-11-12T12:00:00.000Z",
    "request_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  }
}
```

### 1.2 HTTP Status Code Conventions
- `200 OK`: Request succeeded and response data is returned.
- `201 Created`: New resource successfully persisted.
- `400 Bad Request`: Validation failure or invalid business state transition.
- `401 Unauthorized`: Missing, expired, or invalid session token.
- `403 Forbidden`: Authenticated user lacks required RBAC role or resource ownership.
- `404 Not Found`: Resource ID does not exist in active database.
- `413 Payload Too Large`: Uploaded file exceeds the 10MB safety threshold.
- `422 Unprocessable Entity`: Schema mismatch or unparseable scanned PDF.
- `429 Too Many Requests`: Rate limit exceeded (sliding window 10 requests/min).
- `500 Internal Server Error`: Unhandled server exception with internal stack trace hidden.

---

## 2. Authentication & Identity Endpoints (`/auth`)

### `POST /auth/register`
Creates a new student or recruiter account. (Admin registration is strictly forbidden).

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "StrongPassword123!",
  "first_name": "Aarav",
  "last_name": "Sharma",
  "role": "student"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "e2c34d1a-4f5b-4321-9abc-1234567890ab",
    "email": "student@university.edu",
    "first_name": "Aarav",
    "last_name": "Sharma",
    "role": "student",
    "is_active": true
  }
}
```

### `POST /auth/login`
Authenticates user using Argon2id with automatic fallback/upgrade from legacy bcrypt hashes. Sets `access_token` and `refresh_token` in `HttpOnly` Secure cookies.

**Request Body (FormData or JSON):**
```json
{
  "username": "student@careerbridge.com",
  "password": "Password123!"
}
```

### `POST /auth/refresh`
Rotates refresh tokens and issues fresh access tokens. Detects replay attacks and revokes all active sessions if a compromised refresh token hash is resubmitted.

### `POST /auth/logout`
Revokes active refresh token from database and expires cookies (`Max-Age=0`).

### `GET /auth/me`
Returns authenticated user profile, active role, and system permissions.

---

## 3. Student Profile & Resumes (`/students`, `/resumes`)

### `GET /students/me`
Retrieves comprehensive student profile including academic record, skills, projects, certifications, and experience.

### `POST /students/skills`
Associates verified skills from the master skill catalog with proficiency levels.

**Request Body:**
```json
{
  "skill_name": "FastAPI",
  "proficiency": "expert",
  "years_of_experience": 2.5
}
```

### `POST /resumes/upload`
Uploads a candidate resume (`.pdf` or `.docx`, max 10MB). Validates magic bytes, extracts text via PyMuPDF with layout coordinates, and calculates preliminary 100-point ATS rubric.

**Request (multipart/form-data):**
- `file`: Binary document buffer.
- `version_label`: Optional friendly label (e.g., "Full-Stack Software Engineering").

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Resume uploaded and analyzed successfully",
  "data": {
    "resume_id": "0e1df37c-a556-4fb1-bcf6-eb58bbee168b",
    "file_name": "aarav_resume.pdf",
    "parsed_sections": ["education", "skills", "projects", "experience"],
    "ats_score": 88,
    "breakdown": {
      "structure": 15,
      "technical_skills": 20,
      "projects": 18,
      "experience": 13,
      "education": 10,
      "achievements": 7,
      "readability": 5
    }
  }
}
```

### `GET /resumes/{id}/export-pdf`
Generates and downloads a branded PDF audit report analyzing resume strengths, weaknesses, formatting defects, and actionable improvements.

---

## 4. Jobs & Algorithmic Matching (`/jobs`, `/applications`)

### `GET /jobs`
Queries active job requisitions with multi-criteria filtering (role, location, workplace type, minimum salary, department eligibility).

### `GET /jobs/radar`
Executes multi-tier candidate job matching algorithm returning ranked openings scored by compatibility.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "job_id": "c1f8a29b-8321-4b12-9876-123456789abc",
      "job_title": "Backend Software Engineer",
      "company_name": "Google Cloud",
      "match_percentage": 91.4,
      "is_eligible": true,
      "matched_skills": ["Python", "FastAPI", "SQLAlchemy", "MySQL", "Docker"],
      "missing_skills": ["Kubernetes"],
      "compatibility_breakdown": {
        "exact_skill_score": 90.0,
        "weighted_skill_score": 92.5,
        "semantic_vector_score": 89.8
      }
    }
  ]
}
```

### `POST /applications`
Submits student application for a target requisition. Verifies academic eligibility (minimum CGPA cutoff, maximum allowed backlogs) before persisting application record.

---

## 5. Recruiter Talent Hub (`/recruiter`)

### `POST /recruiter/jobs`
Creates a new requisition with structured requirements, skill tags, and campus drive affiliation.

### `POST /recruiter/jobs/generate-description`
Invokes the AI Job Description Assistant to draft clear job descriptions from role parameters, which recruiters review and approve before publishing.

### `GET /recruiter/jobs/{id}/applicants`
Returns candidate pipeline ranked by algorithmic match score with filters for GPA, department, and application stage.

### `PATCH /recruiter/applications/{id}/stage`
Advances candidate recruitment stage (e.g. `applied` $\to$ `shortlisted` $\to$ `technical_round`). Commits immutable status transition record into `audit_logs` table.

### `POST /recruiter/interviews`
Schedules structured interview round with date/time, venue/meeting link, and feedback rubric. Automatically triggers notification to student.

---

## 6. Placement Officer (TPO) Command Center (`/admin`)

### `GET /admin/dashboard`
Returns macro institutional statistics (eligible students, placed percentage, department distribution, top recruiting partners).

### `POST /admin/students/import-csv`
Uploads batch student CSV roster. Parses academic records, performs duplicate email/roll-number detection, and inserts records in a single atomic transaction.

### `GET /admin/students/export-csv`
Streams real-time CSV snapshot of student placement statuses, CGPA, and assigned company offers.

### `PATCH /admin/recruiters/{id}/verify`
Approves or rejects recruiter registration requests with audit reason logging.

### `PATCH /admin/jobs/{id}/review`
Approves or rejects recruiter job postings, enforcing institutional compliance before public display.

---

## 7. AI & Career Assistant (`/bridge-ai`, `/interview-prep`)

### `POST /bridge-ai/chat`
Conversational career mentor. Grounded exclusively on authorized student context (profile, resume, applications, skill gaps). Enforces prompt injection safeguards.

**Request Body:**
```json
{
  "message": "What skills should I focus on this week to prepare for Google Cloud's backend interview?",
  "conversation_id": null
}
```

### `POST /interview-prep/start`
Generates role-specific mock interview questions (Technical, Coding, HR, Behavioral, Aptitude) adjusted by difficulty.

### `POST /interview-prep/submit-answer`
Evaluates student text or voice-transcribed answer against a 6-dimension rubric (Technical Correctness, Depth, Structure, Relevance, Clarity, Actionable Tips) returning a score out of 100.

