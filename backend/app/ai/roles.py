"""
Role Definitions & Competency Profiles for CareerBridge AI Guidance.
Defines canonical industry roles, core/secondary skills, and curriculum templates.
"""

from typing import Dict, List, Any

TARGET_ROLES: Dict[str, Dict[str, Any]] = {
    "Full Stack Software Engineer": {
        "category": "Software Engineering",
        "core_skills": ["Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "SQL", "Git"],
        "secondary_skills": ["Docker", "FastAPI", "Tailwind CSS", "Redis", "AWS", "CI/CD"],
        "description": "Architects, develops, and maintains end-to-end web applications across responsive frontends and resilient backends.",
        "estimated_weeks": 8,
        "weekly_milestones": [
            {
                "week": 1,
                "title": "Modern Frontend Architecture & State Management",
                "description": "Deep dive into React 18 hooks, TypeScript strict mode, and Next.js App Router patterns.",
                "resources": [
                    {"title": "React Official Docs", "url": "https://react.dev", "type": "documentation"},
                    {"title": "Next.js App Router Masterclass", "url": "https://nextjs.org/docs", "type": "guide"}
                ],
                "suggested_project": "Build an authenticated multi-tenant dashboard with client-side caching."
            },
            {
                "week": 2,
                "title": "REST & Asynchronous Backend API Design",
                "description": "Build high-throughput REST APIs using FastAPI/Node.js with Pydantic request validation and dependency injection.",
                "resources": [
                    {"title": "FastAPI Tutorial", "url": "https://fastapi.tiangolo.com", "type": "documentation"}
                ],
                "suggested_project": "Design a rate-limited RESTful service with JWT HttpOnly authentication."
            },
            {
                "week": 3,
                "title": "Relational Database Modeling & Query Optimization",
                "description": "Normalize schemas to 3NF, configure composite indexes, and optimize query plans with MySQL / PostgreSQL.",
                "resources": [
                    {"title": "Use The Index, Luke!", "url": "https://use-the-index-luke.com", "type": "book"}
                ],
                "suggested_project": "Write an e-commerce order processing schema with transaction atomicity."
            },
            {
                "week": 4,
                "title": "Containerization & Docker Orchestration",
                "description": "Containerize full-stack apps with multi-stage Dockerfiles and orchestrate with Docker Compose.",
                "resources": [
                    {"title": "Docker Best Practices", "url": "https://docs.docker.com/develop/develop-images/dockerfile_best-practices/", "type": "guide"}
                ],
                "suggested_project": "Create a unified multi-container docker-compose setup with persistent volumes."
            },
            {
                "week": 5,
                "title": "Caching & Message Queues with Redis",
                "description": "Implement in-memory caching strategies, cache invalidation, and background task queues.",
                "resources": [
                    {"title": "Redis University", "url": "https://university.redis.com", "type": "course"}
                ],
                "suggested_project": "Implement write-through caching on high-frequency read endpoints."
            },
            {
                "week": 6,
                "title": "Cloud Deployment & Continuous Delivery",
                "description": "Automate testing and deployments with GitHub Actions and host on AWS / Vercel / Render.",
                "resources": [
                    {"title": "GitHub Actions Docs", "url": "https://docs.github.com/en/actions", "type": "documentation"}
                ],
                "suggested_project": "Set up automated test pipelines that run linting, pytest, and auto-deploy."
            }
        ]
    },
    "Cloud & DevOps Engineer": {
        "category": "Cloud & Infrastructure",
        "core_skills": ["Linux", "Python", "Docker", "Kubernetes", "AWS", "Git", "CI/CD"],
        "secondary_skills": ["Terraform", "Shell/Bash", "Prometheus", "Grafana", "Nginx"],
        "description": "Designs and manages scalable cloud infrastructure, container orchestration, and continuous integration pipelines.",
        "estimated_weeks": 6,
        "weekly_milestones": [
            {
                "week": 1,
                "title": "Linux Systems Internals & Shell Automation",
                "description": "Master process management, systemd, networking tools (netstat, curl, iptables), and Bash scripting.",
                "resources": [{"title": "Linux Command Line", "url": "https://linuxcommand.org", "type": "guide"}],
                "suggested_project": "Write automated log parsing and system health daemon scripts."
            },
            {
                "week": 2,
                "title": "Container Architecture & Advanced Docker",
                "description": "Multi-stage builds, non-root users, container networking, and minimal base images.",
                "resources": [{"title": "Docker Security Guide", "url": "https://docs.docker.com", "type": "guide"}],
                "suggested_project": "Shrink an enterprise image from 1.2GB to under 120MB with Alpine."
            },
            {
                "week": 3,
                "title": "Kubernetes Orchestration Fundamentals",
                "description": "Deployments, Services, ConfigMaps, Secrets, Ingress controllers, and persistent volume claims.",
                "resources": [{"title": "Kubernetes Documentation", "url": "https://kubernetes.io/docs/", "type": "documentation"}],
                "suggested_project": "Deploy a multi-replica microservice on local Minikube / K3s with ingress."
            },
            {
                "week": 4,
                "title": "Infrastructure as Code with Terraform",
                "description": "Provision AWS VPC, subnets, EC2, and S3 using modular Terraform declarations.",
                "resources": [{"title": "Terraform HashiCorp Tutorials", "url": "https://developer.hashicorp.com/terraform", "type": "tutorials"}],
                "suggested_project": "Declaratively spin up an isolated VPC with public and private subnets."
            },
            {
                "week": 5,
                "title": "CI/CD Pipeline Automation",
                "description": "Build end-to-end delivery pipelines with automated testing, vulnerability scanning, and container registries.",
                "resources": [{"title": "CI/CD Blueprint", "url": "https://docs.github.com/en/actions", "type": "guide"}],
                "suggested_project": "Automated deployment pipeline triggering on git tags with rollbacks."
            },
            {
                "week": 6,
                "title": "Observability, Metrics & Alerting",
                "description": "Instrument application metrics with Prometheus and build real-time monitoring dashboards in Grafana.",
                "resources": [{"title": "Prometheus Getting Started", "url": "https://prometheus.io/docs", "type": "documentation"}],
                "suggested_project": "Set up Grafana dashboard monitoring p95 latency and HTTP 5xx error rates."
            }
        ]
    },
    "Data Scientist & AI/ML Engineer": {
        "category": "Artificial Intelligence & Data",
        "core_skills": ["Python", "NumPy", "Pandas", "Scikit-learn", "SQL", "Machine Learning", "Mathematics & Statistics"],
        "secondary_skills": ["TensorFlow", "PyTorch", "NLP", "FastAPI", "Docker", "HuggingFace"],
        "description": "Applies statistical analysis, machine learning algorithms, and deep learning architectures to extract predictive value from data.",
        "estimated_weeks": 8,
        "weekly_milestones": [
            {
                "week": 1,
                "title": "Exploratory Data Analysis & Feature Engineering",
                "description": "Vectorized computations with NumPy, high-performance dataframe wrangling in Pandas, and outlier detection.",
                "resources": [{"title": "Pandas User Guide", "url": "https://pandas.pydata.org/docs/", "type": "guide"}],
                "suggested_project": "Clean and preprocess a 500,000-row real-world dataset with imputation and scaling."
            },
            {
                "week": 2,
                "title": "Supervised & Unsupervised Machine Learning",
                "description": "Train, cross-validate, and evaluate regression, random forests, gradient boosting (XGBoost), and k-means clustering.",
                "resources": [{"title": "Scikit-Learn Tutorials", "url": "https://scikit-learn.org/stable/", "type": "documentation"}],
                "suggested_project": "Build an end-to-end churn prediction model with ROC-AUC curve evaluation."
            },
            {
                "week": 3,
                "title": "Natural Language Processing & Embeddings",
                "description": "TF-IDF vectorizers, tokenization, n-grams, and dense sentence transformers with cosine similarity.",
                "resources": [{"title": "HuggingFace Course", "url": "https://huggingface.co/learn", "type": "course"}],
                "suggested_project": "Implement a semantic search engine matching user queries to document text."
            },
            {
                "week": 4,
                "title": "Deep Learning Fundamentals with PyTorch",
                "description": "Tensors, autograd, forward/backward propagation, multi-layer perceptrons, and loss function optimization.",
                "resources": [{"title": "PyTorch 60-Minute Blitz", "url": "https://pytorch.org/tutorials/", "type": "tutorial"}],
                "suggested_project": "Train an image or text classification neural network from scratch."
            },
            {
                "week": 5,
                "title": "ML Model Deployment & Serving",
                "description": "Serve models with low latency using FastAPI, ONNX Runtime, and containerized Docker environments.",
                "resources": [{"title": "FastAPI ML Serving", "url": "https://fastapi.tiangolo.com", "type": "guide"}],
                "suggested_project": "Deploy an inference endpoint with batching and request validation."
            },
            {
                "week": 6,
                "title": "LLM Integration & Prompt Engineering",
                "description": "Retrieval Augmented Generation (RAG), embeddings indexing, context chunking, and LLM API orchestrations.",
                "resources": [{"title": "LangChain & Vector DBs", "url": "https://docs.langchain.com", "type": "documentation"}],
                "suggested_project": "Build a domain-specific Q&A assistant over unstructured PDF documents."
            }
        ]
    },
    "Frontend Engineer - Design Systems": {
        "category": "Frontend Engineering",
        "core_skills": ["JavaScript", "TypeScript", "React", "Next.js", "HTML/CSS", "Tailwind CSS", "Git"],
        "secondary_skills": ["Framer Motion", "Figma", "Jest", "Storybook", "Web Performance"],
        "description": "Crafts accessible, performant, and visually stunning web interfaces with scalable component architectures.",
        "estimated_weeks": 6,
        "weekly_milestones": [
            {
                "week": 1,
                "title": "TypeScript Strict Typing & Clean Code Patterns",
                "description": "Master generics, utility types, discriminated unions, and typing complex React component props.",
                "resources": [{"title": "TypeScript Handbook", "url": "https://www.typescriptlang.org/docs/", "type": "handbook"}],
                "suggested_project": "Refactor an untyped component library to strict TypeScript definitions."
            },
            {
                "week": 2,
                "title": "Modular Design System with Tailwind CSS",
                "description": "Build an enterprise design system token set (colors, typography, spacing) and accessible UI primitives.",
                "resources": [{"title": "Tailwind CSS Documentation", "url": "https://tailwindcss.com/docs", "type": "documentation"}],
                "suggested_project": "Create 10 accessible atomic components (Buttons, Badges, Modals, Inputs)."
            },
            {
                "week": 3,
                "title": "Micro-Interactions with Framer Motion",
                "description": "Animate layout transitions, gesture controls, modal dialogs, and route transitions with spring physics.",
                "resources": [{"title": "Framer Motion Docs", "url": "https://www.framer.com/motion/", "type": "documentation"}],
                "suggested_project": "Build an interactive pipeline drag-and-drop board with smooth layout animations."
            },
            {
                "week": 4,
                "title": "Data Visualization & Dashboards",
                "description": "Create responsive charts, radial readiness meters, and time-series line graphs using Recharts.",
                "resources": [{"title": "Recharts Documentation", "url": "https://recharts.org", "type": "documentation"}],
                "suggested_project": "Build a placement analytics dashboard with interactive tooltips and responsive filters."
            },
            {
                "week": 5,
                "title": "Web Performance & Core Web Vitals",
                "description": "Optimize Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), code splitting, and dynamic imports.",
                "resources": [{"title": "web.dev Performance", "url": "https://web.dev/fast/", "type": "guide"}],
                "suggested_project": "Audit a Next.js application to achieve 95+ Google Lighthouse performance score."
            },
            {
                "week": 6,
                "title": "Component Testing & Quality Assurance",
                "description": "Write automated unit tests using Vitest / React Testing Library and verify accessibility with axe-core.",
                "resources": [{"title": "Testing Library Docs", "url": "https://testing-library.com", "type": "documentation"}],
                "suggested_project": "Achieve 85%+ code coverage across design system components."
            }
        ]
    }
}


def get_role_competency_profile(role_name: str) -> Dict[str, Any]:
    """Finds closest target role profile or returns standard software engineering profile."""
    for key, data in TARGET_ROLES.items():
        if key.lower() in role_name.lower() or role_name.lower() in key.lower():
            return {"role_name": key, **data}
    return {"role_name": "Full Stack Software Engineer", **TARGET_ROLES["Full Stack Software Engineer"]}

