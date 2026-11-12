"""
Curated Career Knowledge Base for BridgeAI RAG Engine.
Maintains curated, vetted career intelligence documents across technical concepts,
STAR interview frameworks, system design, and resume optimization.
Kept strictly separate from private student data.
"""

from typing import Any, Dict, List

CAREER_KNOWLEDGE_DOCUMENTS: List[Dict[str, Any]] = [
    {
        "doc_id": "kb_star_interview_01",
        "title": "STAR Methodology & Behavioral Interview Framework",
        "category": "Interview Preparation",
        "source": "CareerBridge Behavioral Interview Handbook v2.0",
        "content": (
            "The STAR methodology is the gold standard for behavioral interviews at leading technology companies.\n"
            "1. Situation: Set the scene and describe the context. Specify the project, timeline, team scale, and constraints.\n"
            "2. Task: Articulate your specific responsibility in that scenario. What exact technical challenge or deliverable did you own?\n"
            "3. Action: Detail the precise actions you took. Emphasize your individual engineering decisions, design tradeoffs, "
            "technologies chosen, and how you overcame roadblocks. Avoid saying 'we did'; specify 'I designed/implemented'.\n"
            "4. Result: Conclude with quantifiable outcomes. Measure success using metrics: percentage latency reduction, "
            "throughput increase, defect elimination, or cost savings.\n"
            "Example for conflict resolution: When disagreeing on database choice, conduct an objective benchmark of PostgreSQL vs MongoDB, "
            "document query plans and latency under load, and align the team around empirical data."
        )
    },
    {
        "doc_id": "kb_coding_interview_02",
        "title": "Technical Problem Solving & Algorithmic Interview Strategy",
        "category": "Coding Interviews",
        "source": "CareerBridge Technical Drill Handbook v1.5",
        "content": (
            "During technical coding interviews (LeetCode/HackerRank style rounds):\n"
            "Step 1 - Clarification: Never start coding immediately. Ask clarifying questions regarding edge cases, "
            "empty inputs, negative numbers, duplicates, and expected input size (n).\n"
            "Step 2 - State Brute Force: First describe a naive brute-force solution and articulate its time/space complexity (e.g. O(N^2)).\n"
            "Step 3 - Optimize: Identify redundant work. Can a hash map reduce time from O(N^2) to O(N)? Can two-pointers or sliding window reduce space?\n"
            "Step 4 - Dry Run with Example: Trace through a small non-trivial test case manually on paper/whiteboard before writing code.\n"
            "Step 5 - Modular Clean Code: Write idiomatic code with descriptive variable names. Handle edge cases upfront (null checks, boundary conditions).\n"
            "Step 6 - Complexity Audit: Explicitly state final asymptotic Time and Auxiliary Space complexity (Big-O notation)."
        )
    },
    {
        "doc_id": "kb_system_design_03",
        "title": "System Design Fundamentals for Campus Placement Drives",
        "category": "System Architecture",
        "source": "CareerBridge Enterprise Architecture Primer",
        "content": (
            "Key architectural pillars frequently evaluated in campus placement interviews:\n"
            "1. Scalability: Distinguish Vertical Scaling (scaling up CPU/RAM) from Horizontal Scaling (scaling out across multiple instances).\n"
            "2. Load Balancing: Round-robin, least-connections, and IP-hash routing. Terminate SSL at the load balancer (e.g., NGINX / AWS ALB).\n"
            "3. Caching Strategies: Cache-Aside (Lazy Loading), Write-Through, and Write-Back. Mitigate Cache Stampede and Cache Invalidation using TTLs.\n"
            "4. Database Sharding & Replication: Master-Replica replication for read-heavy architectures. Horizontal sharding by user_id hash for large tables.\n"
            "5. Asynchronous Messaging: Decouple high-latency tasks (emails, report generation, video transcoding) using message brokers (RabbitMQ, Kafka, Redis Celery).\n"
            "6. CAP Theorem: In distributed network partitions (P), balance Consistency (C) vs Availability (A)."
        )
    },
    {
        "doc_id": "kb_resume_ats_04",
        "title": "ATS Resume Engineering & Quantifiable Impact Formula",
        "category": "Resume Guidance",
        "source": "CareerBridge Resume Optimization Standards",
        "content": (
            "To maximize ATS readability and recruiter engagement:\n"
            "1. The XYZ Impact Formula (Google standard): Frame bullet points as 'Accomplished [X], as measured by [Y], by doing [Z]'.\n"
            "Bad: 'Worked on backend APIs.'\n"
            "Good: 'Engineered 12 asynchronous REST endpoints using FastAPI and MySQL, decreasing average response latency by 42% (from 320ms to 185ms).'\n"
            "2. Action Verbs: Begin every bullet with strong technical action verbs (Architected, Engineered, Formulated, Refactored, Containerized, Automated).\n"
            "3. Technical Competencies Section: Categorize skills into Languages, Frameworks, Databases, Cloud & DevOps, and Developer Tools.\n"
            "4. ATS Clean Formatting: Avoid multi-column tables, text boxes, and complex graphics that break PDF text extractors (PyMuPDF/PDFMiner).\n"
            "5. Proof of Work: Include clickable GitHub repository URLs and live deployment links for every featured project."
        )
    },
    {
        "doc_id": "kb_ai_ml_career_05",
        "title": "Machine Learning & AI Engineering Career Path",
        "category": "Career Roadmaps",
        "source": "CareerBridge AI/ML Engineering Curriculum Benchmark",
        "content": (
            "To transition into a production Machine Learning Engineer or AI Engineer role:\n"
            "Stage 1 - High-Performance Python: Vectorized linear algebra with NumPy, dataframe transformation with Pandas, and Python typing.\n"
            "Stage 2 - Mathematical Core: Matrix decomposition (SVD, Eigenvalues), multivariate calculus, gradient descent optimizers (Adam, RMSprop), and probability distributions.\n"
            "Stage 3 - Classical ML: Supervised regression, Random Forests, XGBoost, cross-validation, and ROC-AUC curve evaluation via Scikit-learn.\n"
            "Stage 4 - Deep Learning: PyTorch tensors, autograd, forward/backward propagation, loss functions, and neural network architectures.\n"
            "Stage 5 - Model Serving & Low Latency: Export models to ONNX runtime, build asynchronous FastAPI inference microservices with batching.\n"
            "Stage 6 - Generative AI & RAG: Dense vector embeddings (Sentence Transformers), vector databases (ChromaDB, Qdrant), context grounding, and prompt engineering."
        )
    },
    {
        "doc_id": "kb_fullstack_06",
        "title": "Full-Stack Web Development & Modern Architecture",
        "category": "Career Roadmaps",
        "source": "CareerBridge Full-Stack Developer Curriculum Benchmark",
        "content": (
            "Modern Full-Stack engineering standards:\n"
            "Frontend: React 18+ component patterns, strict TypeScript, Next.js App Router, Server Components vs Client Components, Tailwind CSS design tokens.\n"
            "Backend: Asynchronous REST and GraphQL endpoints, FastAPI / Node.js, Pydantic request validation, centralized error envelopes, and CORS configuration.\n"
            "Authentication: Secure stateless authentication using JWT tokens stored in HttpOnly, Secure, SameSite cookies. Refresh token rotation with replay detection.\n"
            "Persistence: 3NF database normalization in MySQL / PostgreSQL, composite indexes on high-frequency query columns, transaction atomicity, and Alembic migrations.\n"
            "DevOps: Multi-stage Dockerfiles for minimal container footprint, docker-compose orchestration, and GitHub Actions continuous delivery."
        )
    },
    {
        "doc_id": "kb_placement_etiquette_07",
        "title": "Campus Placement Drive Etiquette & HR Protocol",
        "category": "Placement Preparation",
        "source": "CareerBridge Placement Cell Institutional Guidelines",
        "content": (
            "Essential rules for campus placement drives:\n"
            "1. Company Research: Thoroughly research the visiting company's business model, engineering blogs, core products, and recent tech stack migrations.\n"
            "2. Questions for Interviewers: Always prepare 2-3 thoughtful questions for the closing segment.\n"
            "Example: 'How does your engineering team manage database schema migrations across microservices?' or 'What does success look like in the first 90 days for a graduate engineer in this team?'\n"
            "3. Transparency & Integrity: Never claim knowledge of a framework or library that you cannot explain at a fundamental level. If you do not know an answer, articulate your thought process: 'I have not worked directly with Kafka, but based on message queue principles, I would expect...'\n"
            "4. Placement Clearance: Ensure your university CGPA, backlogs declaration, and attendance records are verified by the Training and Placement Officer (TPO)."
        )
    }
]


def get_all_knowledge_chunks() -> List[Dict[str, Any]]:
    """
    Chunks curated knowledge documents into searchable passages with metadata.
    """
    chunks = []
    chunk_counter = 0

    for doc in CAREER_KNOWLEDGE_DOCUMENTS:
        # Split document into paragraphs
        paragraphs = [p.strip() for p in doc["content"].split("\n") if p.strip()]
        for p in paragraphs:
            chunk_counter += 1
            chunks.append({
                "chunk_id": f"chk_{chunk_counter}",
                "doc_id": doc["doc_id"],
                "title": doc["title"],
                "category": doc["category"],
                "source": doc["source"],
                "text": p
            })

    return chunks

