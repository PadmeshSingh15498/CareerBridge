# CareerBridge — System Architecture Specification

> **Platform Version:** 1.0.0  
> **Topology:** Decoupled Micro-Modular Full-Stack SaaS  
> **Primary Runtime:** Next.js 14 (Node.js 20) + FastAPI (Python 3.11+) + MySQL 8.0 Enterprise  

---

## 1. System Topology & Infrastructure Layout

CareerBridge is designed around a decoupled, layered architectural pattern. The user interface runs as an independent Next.js 14 application on edge/container infrastructure, communicating securely with an asynchronous FastAPI application cluster fronted by an SSL/TLS terminating reverse proxy.

```mermaid
flowchart TD
    subgraph ClientNetwork["Client & CDN Tier"]
        Client["Browser Client (Desktop / Mobile)"]
        Edge["Edge CDN / Vercel Edge Network"]
    end

    subgraph PresentationTier["Presentation Tier (Port 3000)"]
        NextJS["Next.js 14 App Router\n- React Server Components (RSC)\n- Standalone Output Bundle\n- Non-root User (UID 1001)"]
    end

    subgraph IngressTier["Ingress & Proxy Tier (Port 443)"]
        Nginx["Reverse Proxy / SSL Termination\n- Rate Limiting\n- Compression (gzip)\n- Security Headers (HSTS, CSP)"]
    end

    subgraph ApplicationTier["Application Tier (Port 8000)"]
        UvicornMaster["Uvicorn Process Manager"]
        Worker1["Worker 1 (Async Event Loop)"]
        Worker2["Worker 2 (Async Event Loop)"]
        Worker3["Worker 3 (Async Event Loop)"]
        Worker4["Worker 4 (Async Event Loop)"]
        FastAPIApp["FastAPI REST Application\n- Pydantic v2 Serialization\n- RBAC Dependency Injection\n- Non-root User (UID 1000)"]
    end

    subgraph DataTier["Data & Persistence Tier"]
        SQLPool["SQLAlchemy 2.0 Connection Pool\n(20 Base + 40 Overflow Connections)"]
        MySQL[("MySQL 8.0 Production DB\n- utf8mb4_unicode_ci\n- 32 Normalized Tables\n- 58 Optimized Indexes")]
        Storage[("Persistent Storage Volume\n/app/storage/resumes")]
    end

    subgraph ExternalTier["External Cloud Services"]
        Gemini["Google Gemini AI Platform\n(Flash 1.5 / 2.0 API)"]
        SMTP["Enterprise SMTP Relay\n(Port 587 TLS)"]
    end

    Client -->|HTTPS / Port 443| Edge
    Edge --> NextJS
    Client -->|HTTPS REST /api/v1/| Nginx
    NextJS -->|Server Fetch / Actions| Nginx
    Nginx --> UvicornMaster
    UvicornMaster --> Worker1
    UvicornMaster --> Worker2
    UvicornMaster --> Worker3
    UvicornMaster --> Worker4
    Worker1 & Worker2 & Worker3 & Worker4 --> FastAPIApp

    FastAPIApp --> SQLPool
    SQLPool --> MySQL
    FastAPIApp -->|File I/O| Storage
    FastAPIApp -->|HTTPS REST| Gemini
    FastAPIApp -->|TLS Protocol| SMTP
```

---

## 2. End-to-End Request Lifecycle

The diagram below illustrates how an authenticated request (such as uploading a resume or triggering job matching) flows through the complete system:

```mermaid
sequenceDiagram
    autonumber
    actor User as Student Browser
    participant FE as Next.js Client (Axios)
    participant Nginx as Reverse Proxy
    participant BE as FastAPI API Router
    participant Auth as Auth Dependency (get_current_user)
    participant Svc as Domain Service Layer
    participant AI as Embedded AI Engine
    participant DB as SQLAlchemy / MySQL 8
    participant FS as Persistent File Storage

    User->>FE: Upload Resume File (PDF)
    FE->>Nginx: POST /api/v1/resumes/upload (FormData + HttpOnly Cookie)
    Nginx->>BE: Proxy Request with X-Forwarded-For & X-Real-IP
    BE->>Auth: Verify JWT Access Token in Cookie
    Auth->>DB: Query User & Profile Record (RBAC check)
    DB-->>Auth: Verified User (Role: STUDENT)
    Auth-->>BE: Inject Current User Dependency
    BE->>Svc: ResumeService.upload_resume(file, student_id)
    Svc->>FS: Validate Magic Bytes & Persist PDF (/storage/resumes)
    FS-->>Svc: File Saved Path
    Svc->>AI: Extract Text & Sort Layout Coordinates (PyMuPDF)
    AI-->>Svc: Extracted Structured Sections & Metadata
    Svc->>AI: Run 7-Pillar ATS Rubric & Calculate Score
    AI-->>Svc: ATS Score (0-100) + Actionable Improvement Tips
    Svc->>DB: Commit ResumeVersion & Analysis Records (Transaction)
    DB-->>Svc: Persisted Record IDs
    Svc-->>BE: ResumeAnalysisResult DTO
    BE-->>Nginx: HTTP 200 OK (ResponseEnvelope[ResumeAnalysisResponse])
    Nginx-->>FE: Stream Encrypted JSON Response
    FE-->>User: Update UI (ATS Score Radial Ring & Feedback Cards)
```

---

## 3. Backend Architecture & Layered Modular Structure

The backend is structured strictly into modular layers adhering to separation of concerns:

```
backend/app/
├── api/
│   ├── deps.py              # Inversion of Control: DB session & RBAC dependencies
│   └── v1/                  # Versioned API route controllers
│       ├── auth.py          # Registration, login, token refresh, logout
│       ├── students.py      # Profile, academic records, skills, projects
│       ├── resumes.py       # Upload, parsing, ATS scoring, PDF report export
│       ├── jobs.py          # Job discovery, matching engine, radar
│       ├── applications.py  # Application lifecycle, status progression
│       ├── recruiter.py     # Job creation, candidate pipeline, interview scheduling
│       ├── admin.py         # Institutional analytics, bulk import, drive management
│       ├── bridge_ai.py     # Conversational career mentor endpoint
│       ├── interview_prep.py# Voice-to-text practice simulations & scoring
│       └── notifications.py # Real-time notification center
├── core/
│   ├── config.py            # Pydantic Settings with production invariants
│   ├── database.py          # SQLAlchemy 2.0 engine, connection pool, sessionmaker
│   └── security.py          # Argon2id password hashing, JWT encoding/decoding
├── models/                  # 32 SQLAlchemy ORM models with UUID primary keys
├── schemas/                 # Pydantic v2 validation DTOs and ResponseEnvelope
├── services/                # Encapsulated business logic transactions
└── ai/                      # Domain-specific AI/ML algorithms
    ├── resume_analyzer/     # PyMuPDF text extractor, 100-point rubric, PDF exporter
    ├── job_matcher/         # Exact, weighted, and dense semantic vector matchers
    ├── skill_gap/           # Role taxonomy comparator & roadmap synthesis
    ├── interview_prep/      # Question generator & 6-dimension evaluation rubric
    └── bridge_ai/           # RAG context retriever & Gemini LLM adapter
```

### Architectural Principles:
1. **Dependency Injection (IoC):** Routes never instantiate database sessions or business services directly. Database sessions (`get_db`) and authenticated contexts (`get_current_user`, `require_roles`) are injected via FastAPI dependencies.
2. **Transactional Boundaries:** Database writes are wrapped in atomic transactions within the service layer. If an external service or file operation fails, the transaction rolls back cleanly.
3. **Response Envelope Pattern:** All endpoints return a standardized, uniform response wrapper:
   ```json
   {
     "success": true,
     "message": "Operation completed successfully",
     "data": { ... },
     "meta": {
       "timestamp": "2026-11-12T12:00:00Z",
       "request_id": "req_uuid4"
     }
   }
   ```

---

## 4. Frontend Architecture & Component Geometry

The frontend leverages Next.js 14 App Router, React Server Components where beneficial, and Client Components for dynamic dashboards and interactive SVG visualizations.

### 4.1 Layout Hierarchy
- **`WorkspaceShell`:** Persistent responsive layout housing the role-specific sidebar, top notification bar, mobile menu drawer, and active user profile indicator.
- **Role Isolation:**
  - `/student/*`: Student career workspace.
  - `/recruiter/*`: Corporate recruiter talent hub.
  - `/admin/*`: University Placement Officer (TPO) command center.

### 4.2 Signature Math-Driven SVG Components
Rather than relying on generic UI charts, CareerBridge implements bespoke components calculated with geometric trigonometry and SVG math:
1. **`CareerReadinessRing`:** Concentric multi-tier radial progress SVG visualizing 4 weighted sub-pillars (Resume Health 30%, Skill Coverage 30%, Interview Prep 20%, Academic Eligibility 20%).
2. **`OpportunityRadar`:** Custom 5-axis pentagon vector radar plotting candidate competencies against Tier-1 campus hiring benchmarks.
3. **`ApplicationPipeline`:** High-density Kanban recruitment stream with status progression buttons and stage counters.
4. **`SkillConstellation`:** Interactive categorized ontology matrix showing verified student skills alongside market demand percentages.

---

## 5. Concurrency, Connection Pooling & Resilience

| Parameter | Configuration | Technical Rationale |
| :--- | :--- | :--- |
| **Server Engine** | Uvicorn (ASGI) | Async event-loop handling thousands of concurrent idle I/O connections. |
| **Worker Model** | 4 Worker Processes | Maximizes CPU multi-core utilization on multi-core servers/containers. |
| **DB Pool Size** | `DATABASE_POOL_SIZE = 20` | Base persistent open connections shared across worker threads. |
| **DB Max Overflow** | `DATABASE_MAX_OVERFLOW = 40` | Burst buffer handling peak campus placement traffic spikes (up to 60 total). |
| **DB Pool Recycle** | `DATABASE_POOL_RECYCLE = 1800` | Refreshes idle connections every 30 minutes to prevent MySQL timeout disconnections. |
| **Timeouts** | `timeout = 10000ms` (Client) | Prevents slow client queries from hanging worker threads. |
| **Fail-Fast Invariant** | `ENABLE_DB_FALLBACK = False` | Strictly enforces fatal error if MySQL fails in production; avoids split-brain SQLite. |

