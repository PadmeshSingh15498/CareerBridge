"""
Curated Industry Role Skill Taxonomy & Curriculum Standards for CareerBridge.
Defines canonical benchmark competencies for campus recruitment across 9 standard roles
plus algorithmic synthesis for custom student/officer defined career targets.

Academic Disclaimer:
CareerBridge curated role competencies reflect aggregate industry placement trends and
academic curricula benchmarks, not universal legal minimums or employer-specific contractual
requirements. Employer-specific requisitions on campus drives may define bespoke criteria.
"""

from typing import Any, Dict, List, Optional
from app.ai.job_matcher.skill_normalizer import normalize_skill, SKILL_TAXONOMY

PLATFORM_REQUIREMENT_DISCLAIMER = (
    "Platform Benchmark Notice: These competencies represent CareerBridge placement intelligence "
    "and institutional curriculum standards based on aggregate hiring patterns. Individual employer "
    "requisitions on campus drives may have distinct or specialized criteria."
)

CURATED_TARGET_ROLES: Dict[str, Dict[str, Any]] = {
    "Software Developer": {
        "role_name": "Software Developer",
        "category": "Software Engineering",
        "description": "Generalist software engineer building resilient software systems, backend services, and clean algorithmic solutions.",
        "core_skills": [
            {"name": "Data Structures & Algorithms", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "Python", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "Java", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "Git", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "SQL", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "Object-Oriented Programming (OOP)", "proficiency": "advanced", "importance": "mandatory"}
        ],
        "preferred_skills": [
            {"name": "Docker", "proficiency": "beginner", "importance": "preferred"},
            {"name": "Linux", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "REST APIs", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "CI/CD", "proficiency": "beginner", "importance": "preferred"}
        ],
        "technical_fundamentals": [
            "Data Structures & Algorithms",
            "Object-Oriented Programming (OOP)",
            "Database Management Systems (DBMS)",
            "Operating Systems & Process Concurrency",
            "Computer Networks (TCP/IP, HTTP/HTTPS)"
        ],
        "tools": ["Git", "GitHub", "Linux CLI", "Postman", "VS Code / IntelliJ"],
        "frameworks": ["FastAPI", "Spring Boot", "JUnit / Pytest"],
        "curated_stages": [
            {
                "stage": 1,
                "week": 1,
                "title": "Algorithmic Foundations & Complexity",
                "skill": "Data Structures & Algorithms",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Master asymptotic time/space complexity analysis (Big-O), arrays, hash tables, stacks, queues, and tree traversal algorithms.",
                "learning_resources": [
                    {"title": "Open Data Structures", "url": "https://opendatastructures.org/", "type": "textbook"},
                    {"title": "Algorithms & Problem Solving", "url": "https://github.com/trekhleb/javascript-algorithms", "type": "code_repo"}
                ],
                "practical_exercise": "Implement a balanced binary search tree with self-balancing rotation operations and unit tests."
            },
            {
                "stage": 2,
                "week": 2,
                "title": "Object-Oriented Design & Clean Architecture",
                "skill": "Object-Oriented Programming (OOP)",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Apply SOLID design principles, inheritance, polymorphism, encapsulation, and foundational design patterns (Factory, Strategy, Observer).",
                "learning_resources": [
                    {"title": "Refactoring Guru - Design Patterns", "url": "https://refactoring.guru/design-patterns", "type": "guide"},
                    {"title": "Clean Code Principles", "url": "https://github.com/ryanmcdermott/clean-code-javascript", "type": "reference"}
                ],
                "practical_exercise": "Design and build an extensible in-memory parking lot or elevator system demonstrating SOLID principles."
            },
            {
                "stage": 3,
                "week": 3,
                "title": "Relational Data Modeling & ACID Transactions",
                "skill": "SQL",
                "priority": "mandatory",
                "estimated_time": "1-2 weeks",
                "description": "Formulate 3NF database schemas, write complex joins, subqueries, group by aggregations, indexes, and transactional locks.",
                "learning_resources": [
                    {"title": "PostgreSQL Tutorial", "url": "https://www.postgresqltutorial.com/", "type": "tutorial"},
                    {"title": "Use The Index, Luke!", "url": "https://use-the-index-luke.com/", "type": "guide"}
                ],
                "practical_exercise": "Model a high-concurrency banking ledger with pessimistic locking and rollback test cases."
            },
            {
                "stage": 4,
                "week": 4,
                "title": "High-Throughput REST API Design",
                "skill": "REST APIs",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Design deterministic, idempotent REST endpoints with schema validation, HTTP response codes, error envelopes, and authentication.",
                "learning_resources": [
                    {"title": "FastAPI Official Tutorial", "url": "https://fastapi.tiangolo.com/tutorial/", "type": "documentation"},
                    {"title": "RESTful API Guidelines", "url": "https://restfulapi.net/", "type": "guide"}
                ],
                "practical_exercise": "Build an authenticated resource management API with rate limiting, pagination, and OpenAPI spec."
            },
            {
                "stage": 5,
                "week": 5,
                "title": "Containerization & Environment Isolation",
                "skill": "Docker",
                "priority": "high",
                "estimated_time": "1 week",
                "description": "Author multi-stage Dockerfiles, minimize container footprint, isolate environment variables, and manage multi-service setups with Docker Compose.",
                "learning_resources": [
                    {"title": "Docker Official Documentation", "url": "https://docs.docker.com/get-started/", "type": "documentation"}
                ],
                "practical_exercise": "Containerize a backend service with a MySQL database container and persistent volume mount."
            },
            {
                "stage": 6,
                "week": 6,
                "title": "Production Deployment & Capstone Verification",
                "skill": "CI/CD",
                "priority": "high",
                "estimated_time": "2 weeks",
                "description": "Automate linting, testing, and deployment via GitHub Actions, establishing an end-to-end continuous delivery pipeline.",
                "learning_resources": [
                    {"title": "GitHub Actions Documentation", "url": "https://docs.github.com/en/actions", "type": "documentation"}
                ],
                "practical_exercise": "Create an automated GitHub Actions workflow verifying pytest suites and building a release artifact."
            }
        ]
    },

    "Java Developer": {
        "role_name": "Java Developer",
        "category": "Enterprise Software Engineering",
        "description": "Specialist in enterprise Java ecosystems, Spring Boot microservices, multithreading, and distributed transactional architectures.",
        "core_skills": [
            {"name": "Java", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "Spring Boot", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "SQL", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "Data Structures & Algorithms", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "Object-Oriented Programming (OOP)", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "Git", "proficiency": "intermediate", "importance": "mandatory"}
        ],
        "preferred_skills": [
            {"name": "Hibernate / JPA", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "Docker", "proficiency": "beginner", "importance": "preferred"},
            {"name": "Kafka", "proficiency": "beginner", "importance": "preferred"},
            {"name": "Microservices", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "Maven / Gradle", "proficiency": "intermediate", "importance": "preferred"}
        ],
        "technical_fundamentals": [
            "Java Virtual Machine (JVM) Architecture & Garbage Collection",
            "Java Memory Model & Multithreading (java.util.concurrent)",
            "Object-Oriented Design & GoF Patterns",
            "Relational Database Management (JDBC / JPA)",
            "Distributed Systems & Enterprise Integration Patterns"
        ],
        "tools": ["IntelliJ IDEA", "Maven", "Gradle", "Git", "Postman", "Docker"],
        "frameworks": ["Spring Boot", "Spring Data JPA", "Spring Security", "JUnit 5", "Mockito"],
        "curated_stages": [
            {
                "stage": 1,
                "week": 1,
                "title": "Modern Java 17/21 & Collections Mastery",
                "skill": "Java",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Master streams, lambdas, records, optional, pattern matching, and deep internals of Java Collections Framework.",
                "learning_resources": [
                    {"title": "Oracle Java Documentation", "url": "https://docs.oracle.com/en/java/", "type": "documentation"},
                    {"title": "Baeldung Core Java Tutorials", "url": "https://www.baeldung.com/category/java/", "type": "tutorial"}
                ],
                "practical_exercise": "Build an analytical transaction processor using Java 21 Streams and custom Collectors."
            },
            {
                "stage": 2,
                "week": 2,
                "title": "JVM Concurrency & Thread Synchronization",
                "skill": "Multithreading",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Understand thread life cycle, ExecutorService, ReentrantLock, ConcurrentHashMap, Atomic primitives, and Virtual Threads.",
                "learning_resources": [
                    {"title": "Java Concurrency in Practice Guide", "url": "https://docs.oracle.com/javase/tutorial/essential/concurrency/", "type": "documentation"}
                ],
                "practical_exercise": "Implement a producer-consumer thread-safe work pool with bounded blocking queues."
            },
            {
                "stage": 3,
                "week": 3,
                "title": "Enterprise Spring Boot Core & Inversion of Control",
                "skill": "Spring Boot",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Deep dive into Spring ApplicationContext, Bean lifecycle, Dependency Injection, component scanning, and application profiles.",
                "learning_resources": [
                    {"title": "Spring Boot Official Reference", "url": "https://spring.io/guides", "type": "documentation"}
                ],
                "practical_exercise": "Build a modular REST application with custom service beans, configuration properties, and environment profiles."
            },
            {
                "stage": 4,
                "week": 4,
                "title": "Persistence with Spring Data JPA & Hibernate",
                "skill": "Hibernate / JPA",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Entity relationships (OneToMany, ManyToMany), JPQL queries, lazy loading optimizations, N+1 problem elimination, and transaction management.",
                "learning_resources": [
                    {"title": "Vlad Mihalcea Hibernate Tips", "url": "https://vladmihalcea.com/tutorials/hibernate/", "type": "reference"}
                ],
                "practical_exercise": "Model an enterprise order execution schema and optimize JPQL queries with fetch joins to eliminate N+1 queries."
            },
            {
                "stage": 5,
                "week": 5,
                "title": "Securing REST Microservices with Spring Security",
                "skill": "Spring Security",
                "priority": "high",
                "estimated_time": "1-2 weeks",
                "description": "Implement stateless JWT authentication filters, Role-Based Access Control (RBAC), and method-level security annotations.",
                "learning_resources": [
                    {"title": "Spring Security Reference", "url": "https://docs.spring.io/spring-security/reference/", "type": "documentation"}
                ],
                "practical_exercise": "Create an authentication gateway service issuing signed JWT tokens with claims-based access verification."
            },
            {
                "stage": 6,
                "week": 6,
                "title": "Microservice Testing, Docker & Event Streams",
                "skill": "Docker",
                "priority": "high",
                "estimated_time": "2 weeks",
                "description": "Integration testing using Testcontainers and MockMvc, packaging JARs into distroless Docker containers, and publishing messages to Kafka.",
                "learning_resources": [
                    {"title": "Testcontainers for Java", "url": "https://testcontainers.com/guides/getting-started-with-testcontainers-for-java/", "type": "guide"}
                ],
                "practical_exercise": "Containerize a Spring Boot service with PostgreSQL Testcontainers integration tests running in CI."
            }
        ]
    },

    "Python Developer": {
        "role_name": "Python Developer",
        "category": "Backend & Systems Engineering",
        "description": "Focuses on idiomatic Python backend architectures, high-performance asynchronous APIs, data pipelines, and automation.",
        "core_skills": [
            {"name": "Python", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "FastAPI", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "SQL", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "Data Structures & Algorithms", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "Git", "proficiency": "intermediate", "importance": "mandatory"}
        ],
        "preferred_skills": [
            {"name": "Django", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "Redis", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "Docker", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "PostgreSQL", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "Asyncio", "proficiency": "intermediate", "importance": "preferred"}
        ],
        "technical_fundamentals": [
            "Python Data Model (Dunder methods, descriptors, generators)",
            "Asynchronous Programming (asyncio, event loops, tasks)",
            "Relational Database Normalization & SQLAlchemy ORM",
            "REST & Async Web Protocols",
            "Automated Testing with Pytest & Mocking"
        ],
        "tools": ["Poetry / Pipenv", "Pytest", "Docker", "Git", "Postman", "Ruff / Black"],
        "frameworks": ["FastAPI", "SQLAlchemy", "Pydantic", "Celery", "Alembic"],
        "curated_stages": [
            {
                "stage": 1,
                "week": 1,
                "title": "Advanced Python Internals & Metaprogramming",
                "skill": "Python",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Explore decorators, context managers, generator pipelines, typing annotations, and memory profiling.",
                "learning_resources": [
                    {"title": "Python Official Documentation", "url": "https://docs.python.org/3/", "type": "documentation"},
                    {"title": "Real Python Advanced Tutorials", "url": "https://realpython.com/", "type": "tutorial"}
                ],
                "practical_exercise": "Build a custom caching and execution-timing decorator suite supporting both synchronous and asynchronous functions."
            },
            {
                "stage": 2,
                "week": 2,
                "title": "Concurrency & Asynchronous Systems with Asyncio",
                "skill": "Asyncio",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Master non-blocking I/O, coroutines, asyncio.gather, Semaphores, and worker pools for high-concurrency tasks.",
                "learning_resources": [
                    {"title": "Asyncio in Python", "url": "https://docs.python.org/3/library/asyncio.html", "type": "documentation"}
                ],
                "practical_exercise": "Build an asynchronous web scraping and indexing crawler with concurrency limits and retry policies."
            },
            {
                "stage": 3,
                "week": 3,
                "title": "Modern RESTful Microservices with FastAPI",
                "skill": "FastAPI",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Pydantic V2 data validation, dependency injection patterns, middleware logging, and automated OpenAPI documentation.",
                "learning_resources": [
                    {"title": "FastAPI Documentation", "url": "https://fastapi.tiangolo.com/", "type": "documentation"}
                ],
                "practical_exercise": "Construct a multi-route microservice with JWT auth, request validation, and centralized exception handling."
            },
            {
                "stage": 4,
                "week": 4,
                "title": "SQLAlchemy 2.0 & Database Migrations with Alembic",
                "skill": "SQLAlchemy",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Declarative 2.0 ORM mappings, select statement constructs, connection pooling, and version-controlled database migrations.",
                "learning_resources": [
                    {"title": "SQLAlchemy 2.0 Unified Tutorial", "url": "https://docs.sqlalchemy.org/en/20/tutorial/", "type": "documentation"}
                ],
                "practical_exercise": "Implement database models with foreign keys, composite indexes, and run an automated Alembic migration pipeline."
            },
            {
                "stage": 5,
                "week": 5,
                "title": "Background Job Queues & In-Memory Caching",
                "skill": "Redis",
                "priority": "high",
                "estimated_time": "1-2 weeks",
                "description": "Configure Redis for distributed key-value caching, session stores, pub/sub messaging, and Celery asynchronous task workers.",
                "learning_resources": [
                    {"title": "Redis Documentation", "url": "https://redis.io/docs/", "type": "documentation"}
                ],
                "practical_exercise": "Build an asynchronous report generation worker triggered via HTTP and processed through Redis queue."
            },
            {
                "stage": 6,
                "week": 6,
                "title": "Production Containerization & Pytest Rigor",
                "skill": "Docker",
                "priority": "high",
                "estimated_time": "2 weeks",
                "description": "Author production slim Python containers, write parameterized pytest suites with coverage fixtures, and automate in GitHub Actions.",
                "learning_resources": [
                    {"title": "Pytest Documentation", "url": "https://docs.pytest.org/en/stable/", "type": "documentation"}
                ],
                "practical_exercise": "Dockerize the complete API with a pytest test suite achieving >85% code coverage."
            }
        ]
    },

    "Data Analyst": {
        "role_name": "Data Analyst",
        "category": "Data & Analytics",
        "description": "Transforms raw enterprise data into actionable business intelligence, interactive dashboards, and statistical insights.",
        "core_skills": [
            {"name": "SQL", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "Python", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "Pandas", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "Data Visualization", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "Excel / Spreadsheets", "proficiency": "advanced", "importance": "mandatory"}
        ],
        "preferred_skills": [
            {"name": "Power BI / Tableau", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "Statistics", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "NumPy", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "Git", "proficiency": "beginner", "importance": "preferred"}
        ],
        "technical_fundamentals": [
            "Descriptive & Inferential Statistics (Hypothesis testing, p-values)",
            "Relational Database Query Optimization & Window Functions",
            "Data Wrangling, Cleaning, & Imputation",
            "Visual Communication & Dashboard Information Hierarchy"
        ],
        "tools": ["SQL (PostgreSQL/MySQL)", "Jupyter Notebooks", "Power BI / Tableau", "Excel", "Git"],
        "frameworks": ["Pandas", "Matplotlib / Seaborn", "Plotly", "NumPy"],
        "curated_stages": [
            {
                "stage": 1,
                "week": 1,
                "title": "Advanced SQL & Analytical Window Functions",
                "skill": "SQL",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Write advanced aggregations, common table expressions (CTEs), ranking (ROW_NUMBER, DENSE_RANK), lead/lag metrics, and running totals.",
                "learning_resources": [
                    {"title": "Mode Analytics Advanced SQL Tutorial", "url": "https://mode.com/sql-tutorial/", "type": "tutorial"}
                ],
                "practical_exercise": "Write analytical queries calculating monthly cohort retention, churn rates, and cumulative sales from raw transaction logs."
            },
            {
                "stage": 2,
                "week": 2,
                "title": "Data Wrangling & Exploration with Pandas",
                "skill": "Pandas",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Vectorized filtering, grouping, pivoting, missing value imputation, DateTime parsing, and merging multi-source datasets.",
                "learning_resources": [
                    {"title": "Pandas Getting Started", "url": "https://pandas.pydata.org/docs/getting_started/", "type": "documentation"}
                ],
                "practical_exercise": "Ingest and clean a 100,000-row messy e-commerce dataset, imputing missing data and standardizing timestamps."
            },
            {
                "stage": 3,
                "week": 3,
                "title": "Applied Business Statistics & A/B Testing",
                "skill": "Statistics",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Confidence intervals, two-sample t-tests, chi-square tests, correlation vs causation, and evaluating A/B experiment significance.",
                "learning_resources": [
                    {"title": "Khan Academy Statistics", "url": "https://www.khanacademy.org/math/statistics-probability", "type": "course"}
                ],
                "practical_exercise": "Perform an A/B test analysis on student placement application conversion rates, computing p-values and statistical significance."
            },
            {
                "stage": 4,
                "week": 4,
                "title": "Interactive Storytelling with Data Visualization",
                "skill": "Data Visualization",
                "priority": "high",
                "estimated_time": "1-2 weeks",
                "description": "Create publication-quality charts using Seaborn and interactive dashboards with Plotly, emphasizing clarity and visual contrast.",
                "learning_resources": [
                    {"title": "Python Graph Gallery", "url": "https://python-graph-gallery.com/", "type": "reference"}
                ],
                "practical_exercise": "Build an interactive Plotly dashboard illustrating campus placement trends by department and salary quartile."
            },
            {
                "stage": 5,
                "week": 5,
                "title": "Business Intelligence Dashboards (Power BI / Tableau)",
                "skill": "Power BI / Tableau",
                "priority": "high",
                "estimated_time": "2 weeks",
                "description": "Data modeling, star schema design, DAX measures, KPI cards, and dynamic filter slicers for executive stakeholders.",
                "learning_resources": [
                    {"title": "Microsoft Power BI Guided Learning", "url": "https://learn.microsoft.com/en-us/power-bi/", "type": "guide"}
                ],
                "practical_exercise": "Create an executive recruitment operations dashboard tracking time-to-hire and interview funnel pass rates."
            },
            {
                "stage": 6,
                "week": 6,
                "title": "End-to-End Analytics Case Study & Presentation",
                "skill": "Portfolio Project",
                "priority": "high",
                "estimated_time": "2 weeks",
                "description": "Synthesize data extraction, cleaning, statistical modeling, and stakeholder presentation into an executive PDF report and GitHub repository.",
                "learning_resources": [
                    {"title": "Google Data Analytics Professional Standards", "url": "https://www.coursera.org/", "type": "reference"}
                ],
                "practical_exercise": "Publish a comprehensive end-to-end data analytics study with reproducible Jupyter notebooks and executive summary."
            }
        ]
    },

    "Data Scientist": {
        "role_name": "Data Scientist",
        "category": "Artificial Intelligence & Data",
        "description": "Applies statistical modeling, machine learning, and predictive analytics to solve complex business and scientific challenges.",
        "core_skills": [
            {"name": "Python", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "Machine Learning", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "Mathematics & Statistics", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "Pandas", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "NumPy", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "SQL", "proficiency": "intermediate", "importance": "mandatory"}
        ],
        "preferred_skills": [
            {"name": "Scikit-learn", "proficiency": "advanced", "importance": "preferred"},
            {"name": "Deep Learning", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "NLP", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "Docker", "proficiency": "beginner", "importance": "preferred"},
            {"name": "Git", "proficiency": "intermediate", "importance": "preferred"}
        ],
        "technical_fundamentals": [
            "Linear Algebra (Matrices, Eigenvalues, SVD, Vector Spaces)",
            "Multivariable Calculus & Gradient Descent Optimization",
            "Probability Theory, Bayesian Inference, & Maximum Likelihood",
            "Feature Engineering, Dimensionality Reduction (PCA), & Cross-Validation"
        ],
        "tools": ["Jupyter Lab", "Git", "Docker", "MLflow", "PostgreSQL"],
        "frameworks": ["Scikit-learn", "NumPy", "Pandas", "SciPy", "Statsmodels", "XGBoost"],
        "curated_stages": [
            {
                "stage": 1,
                "week": 1,
                "title": "Mathematical Foundations for Machine Learning",
                "skill": "Mathematics & Statistics",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Matrix operations, dot products, vector norms, partial derivatives, chain rule, and loss gradient formulations.",
                "learning_resources": [
                    {"title": "Mathematics for Machine Learning (Deisenroth)", "url": "https://mml-book.github.io/", "type": "textbook"},
                    {"title": "3Blue1Brown Linear Algebra", "url": "https://www.3blue1brown.com/topics/linear-algebra", "type": "video_course"}
                ],
                "practical_exercise": "Code linear regression and gradient descent from scratch using only pure NumPy without high-level ML libraries."
            },
            {
                "stage": 2,
                "week": 2,
                "title": "Feature Engineering & Dimensionality Reduction",
                "skill": "NumPy",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Standardization, quantile transforms, categorical encoding (target encoding, one-hot), Principal Component Analysis (PCA), and t-SNE.",
                "learning_resources": [
                    {"title": "Scikit-learn Preprocessing Guide", "url": "https://scikit-learn.org/stable/modules/preprocessing.html", "type": "documentation"}
                ],
                "practical_exercise": "Build a reusable scikit-learn Pipeline incorporating outlier trimming, scaling, and PCA decomposition."
            },
            {
                "stage": 3,
                "week": 3,
                "title": "Supervised Learning & Ensemble Methods",
                "skill": "Machine Learning",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Train, tune, and evaluate Logistic Regression, Random Forests, XGBoost, and LightGBM using stratified K-Fold cross-validation.",
                "learning_resources": [
                    {"title": "Scikit-Learn User Guide", "url": "https://scikit-learn.org/stable/user_guide.html", "type": "documentation"}
                ],
                "practical_exercise": "Train an XGBoost classifier predicting student campus placement probability, tuning hyperparameters via Optuna."
            },
            {
                "stage": 4,
                "week": 4,
                "title": "Model Evaluation, ROC-AUC & Interpretability",
                "skill": "Scikit-learn",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Precision-Recall trade-offs, F1-Score, Confusion Matrices, ROC-AUC, and feature attribution using SHAP and LIME.",
                "learning_resources": [
                    {"title": "SHAP Documentation", "url": "https://shap.readthedocs.io/en/latest/", "type": "documentation"}
                ],
                "practical_exercise": "Compute SHAP summary plots and explain individual prediction decisions for an enterprise credit scoring model."
            },
            {
                "stage": 5,
                "week": 5,
                "title": "Unsupervised Clustering & Anomaly Detection",
                "skill": "Machine Learning",
                "priority": "high",
                "estimated_time": "1-2 weeks",
                "description": "Implement K-Means++, DBSCAN, Hierarchical Clustering, and Isolation Forests for anomalous transaction identification.",
                "learning_resources": [
                    {"title": "Scikit-learn Clustering Guide", "url": "https://scikit-learn.org/stable/modules/clustering.html", "type": "documentation"}
                ],
                "practical_exercise": "Cluster candidate resumes into latent competency archetypes using TF-IDF vectors and DBSCAN."
            },
            {
                "stage": 6,
                "week": 6,
                "title": "Model Serialization & Inference API Service",
                "skill": "FastAPI",
                "priority": "high",
                "estimated_time": "2 weeks",
                "description": "Serialize trained models with Joblib/ONNX, package within a FastAPI inference endpoint, and track metrics with MLflow.",
                "learning_resources": [
                    {"title": "MLflow Tracking Documentation", "url": "https://mlflow.org/docs/latest/index.html", "type": "documentation"}
                ],
                "practical_exercise": "Deploy a containerized FastAPI inference endpoint that returns real-time predictions with p95 latency under 20ms."
            }
        ]
    },

    "Machine Learning Engineer": {
        "role_name": "Machine Learning Engineer",
        "category": "Artificial Intelligence & Systems",
        "description": "Designs, trains, deploys, and monitors machine learning models in production software environments.",
        "core_skills": [
            {"name": "Python", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "Machine Learning", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "Deep Learning", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "PyTorch / TensorFlow", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "Docker", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "FastAPI", "proficiency": "intermediate", "importance": "mandatory"}
        ],
        "preferred_skills": [
            {"name": "MLOps", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "Kubernetes", "proficiency": "beginner", "importance": "preferred"},
            {"name": "NLP", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "Computer Vision", "proficiency": "beginner", "importance": "preferred"},
            {"name": "CI/CD", "proficiency": "intermediate", "importance": "preferred"}
        ],
        "technical_fundamentals": [
            "Mathematical Foundations of Deep Learning (Backpropagation, Tensor Calc)",
            "Distributed Training & GPU Acceleration (CUDA)",
            "Model Quantization, Pruning, & ONNX Runtime Compilation",
            "Production MLOps Pipelines (Data Drift, Concept Drift, Model Registries)"
        ],
        "tools": ["Docker", "Git", "Weights & Biases / MLflow", "Postman", "Linux CLI"],
        "frameworks": ["PyTorch", "Hugging Face Transformers", "FastAPI", "Scikit-learn", "Triton / ONNX"],
        "curated_stages": [
            {
                "stage": 1,
                "week": 1,
                "title": "Python & High-Performance Data Processing",
                "skill": "Python and data processing",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Vectorized linear algebra with NumPy, custom memory-efficient data generators, and dataset streaming.",
                "learning_resources": [
                    {"title": "NumPy Deep Dive", "url": "https://numpy.org/doc/stable/user/index.html", "type": "documentation"}
                ],
                "practical_exercise": "Implement an out-of-core batched data loader reading multi-gigabyte CSV records with streaming generators."
            },
            {
                "stage": 2,
                "week": 2,
                "title": "Mathematics and Statistics for ML",
                "skill": "Mathematics and statistics",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Vector calculus, Jacobian and Hessian matrices, stochastic gradient descent optimizers (Adam, RMSProp), and regularization.",
                "learning_resources": [
                    {"title": "Stanford CS229 Linear Algebra Review", "url": "https://cs229.stanford.edu/section/cs229-linalg.pdf", "type": "notes"}
                ],
                "practical_exercise": "Implement a 2-layer Neural Network with forward and backward backpropagation passes written entirely from scratch."
            },
            {
                "stage": 3,
                "week": 3,
                "title": "Production Machine Learning Pipelines",
                "skill": "Machine Learning",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Develop automated feature transformation pipelines, cross-validation harnesses, and evaluate ensemble models.",
                "learning_resources": [
                    {"title": "Scikit-Learn Pipelines Guide", "url": "https://scikit-learn.org/stable/modules/compose.html", "type": "documentation"}
                ],
                "practical_exercise": "Construct an automated pipeline comparing Random Forest, XGBoost, and LightGBM with automated metric logging."
            },
            {
                "stage": 4,
                "week": 4,
                "title": "Deep Learning & Neural Architectures with PyTorch",
                "skill": "Deep Learning",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "PyTorch tensors, autograd, nn.Module, loss functions, learning rate schedulers, and transfer learning with pretrained backbones.",
                "learning_resources": [
                    {"title": "PyTorch 60-Minute Blitz", "url": "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html", "type": "tutorial"}
                ],
                "practical_exercise": "Train a multi-class deep neural network using PyTorch with early stopping, TensorBoard logging, and checkpoint saving."
            },
            {
                "stage": 5,
                "week": 5,
                "title": "Model Deployment & Low-Latency Inference Serving",
                "skill": "Model deployment",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Export models to ONNX Runtime format, build asynchronous FastAPI inference servers with batching, and containerize with Docker.",
                "learning_resources": [
                    {"title": "ONNX Runtime Python API", "url": "https://onnxruntime.ai/docs/api/python/", "type": "documentation"}
                ],
                "practical_exercise": "Convert a PyTorch model to ONNX and deploy inside a Dockerized FastAPI container verifying <15ms response latency."
            },
            {
                "stage": 6,
                "week": 6,
                "title": "Portfolio Projects & Production Monitoring",
                "skill": "Portfolio projects",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Deploy an end-to-end Machine Learning web application with data drift detection (Evidently AI) and live cloud hosting.",
                "learning_resources": [
                    {"title": "Evidently AI Model Monitoring", "url": "https://docs.evidentlyai.com/", "type": "guide"}
                ],
                "practical_exercise": "Build and showcase a complete end-to-end ML project with GitHub repository, documentation, and live demo."
            }
        ]
    },

    "AI Engineer": {
        "role_name": "AI Engineer",
        "category": "Artificial Intelligence & Generative Systems",
        "description": "Builds applications integrating foundational LLMs, Retrieval-Augmented Generation (RAG), vector databases, and multi-agent systems.",
        "core_skills": [
            {"name": "Python", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "LLM Integration", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "Vector Databases", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "Prompt Engineering", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "FastAPI", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "Sentence Transformers", "proficiency": "intermediate", "importance": "mandatory"}
        ],
        "preferred_skills": [
            {"name": "LangChain / LlamaIndex", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "Docker", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "Next.js", "proficiency": "beginner", "importance": "preferred"},
            {"name": "Fine-Tuning (LoRA)", "proficiency": "beginner", "importance": "preferred"},
            {"name": "Evaluation Frameworks (RAGAS)", "proficiency": "intermediate", "importance": "preferred"}
        ],
        "technical_fundamentals": [
            "Attention Mechanisms & Transformer Architecture (Vaswani et al.)",
            "Tokenization, Context Windows, & Positional Encodings",
            "Dense Vector Embeddings & Approximate Nearest Neighbor (ANN / HNSW)",
            "RAG Architecture (Chunking, Retrieval, Re-ranking, Context Grounding)"
        ],
        "tools": ["Git", "Docker", "ChromaDB / Qdrant", "Postman", "OpenAI / Gemini APIs"],
        "frameworks": ["FastAPI", "Hugging Face", "LangChain / LlamaIndex", "Sentence Transformers", "Pydantic"],
        "curated_stages": [
            {
                "stage": 1,
                "week": 1,
                "title": "Transformer Foundations & Dense Vector Embeddings",
                "skill": "Sentence Transformers",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Understand self-attention mechanisms, encoder architectures (BERT/MiniLM), cosine similarity, and high-dimensional semantic search.",
                "learning_resources": [
                    {"title": "The Illustrated Transformer (Jay Alammar)", "url": "https://jalammar.github.io/illustrated-transformer/", "type": "guide"},
                    {"title": "Sentence Transformers Docs", "url": "https://sbert.net/", "type": "documentation"}
                ],
                "practical_exercise": "Build an embedding search pipeline indexing 1,000 documents and querying using cosine similarity with numpy."
            },
            {
                "stage": 2,
                "week": 2,
                "title": "Vector Databases & High-Scale Indexing",
                "skill": "Vector Databases",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Set up vector storage engines (ChromaDB / Qdrant / FAISS), configure HNSW indexing parameters, and execute metadata filtering.",
                "learning_resources": [
                    {"title": "ChromaDB Getting Started", "url": "https://docs.trychroma.com/", "type": "documentation"}
                ],
                "practical_exercise": "Index technical documentation into ChromaDB with metadata filters and query with top-k nearest neighbors."
            },
            {
                "stage": 3,
                "week": 3,
                "title": "Production RAG Architecture & Context Retrieval",
                "skill": "LLM Integration",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Document chunking strategies, semantic chunking, context injection, prompt grounding, and hallucination mitigation.",
                "learning_resources": [
                    {"title": "LangChain RAG Architecture Guide", "url": "https://python.langchain.com/docs/tutorials/rag/", "type": "guide"}
                ],
                "practical_exercise": "Build a domain-specific Q&A RAG engine that queries user PDFs and cites source page numbers in answers."
            },
            {
                "stage": 4,
                "week": 4,
                "title": "Systematic Prompt Engineering & Function Calling",
                "skill": "Prompt Engineering",
                "priority": "mandatory",
                "estimated_time": "1-2 weeks",
                "description": "Few-shot prompting, Chain of Thought (CoT), Structured Outputs via Pydantic JSON schemas, and Tool/Function calling integrations.",
                "learning_resources": [
                    {"title": "Prompt Engineering Guide (DAIR.AI)", "url": "https://www.promptingguide.ai/", "type": "guide"}
                ],
                "practical_exercise": "Implement structured output extraction where an LLM parses unstructured resume text into a strict Pydantic model."
            },
            {
                "stage": 5,
                "week": 5,
                "title": "AI Agent Workflows & ReAct Architecture",
                "skill": "AI Agents",
                "priority": "high",
                "estimated_time": "2 weeks",
                "description": "Design autonomous reasoning loops (ReAct: Reason + Act), external tool integration, memory persistence, and guardrails.",
                "learning_resources": [
                    {"title": "Building Effective Agents (Anthropic)", "url": "https://www.anthropic.com/research/building-effective-agents", "type": "reference"}
                ],
                "practical_exercise": "Build a multi-step career research agent capable of browsing job postings, evaluating resume match, and drafting tips."
            },
            {
                "stage": 6,
                "week": 6,
                "title": "Evaluation, Guardrails & Production Deployment",
                "skill": "FastAPI",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Measure Faithfulness and Answer Relevance using RAGAS, implement prompt injection security guardrails, and deploy on FastAPI.",
                "learning_resources": [
                    {"title": "RAGAS Evaluation Framework", "url": "https://docs.ragas.io/", "type": "documentation"}
                ],
                "practical_exercise": "Deploy a containerized Generative AI assistant with streaming Server-Sent Events (SSE) and automated test suites."
            }
        ]
    },

    "Web Developer": {
        "role_name": "Web Developer",
        "category": "Web Applications",
        "description": "Constructs modern, responsive, accessible, and fast web experiences across frontend and client-side application architectures.",
        "core_skills": [
            {"name": "HTML/CSS", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "JavaScript", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "React", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "Tailwind CSS", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "Git", "proficiency": "intermediate", "importance": "mandatory"}
        ],
        "preferred_skills": [
            {"name": "TypeScript", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "Next.js", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "REST APIs", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "Figma", "proficiency": "beginner", "importance": "preferred"},
            {"name": "Responsive Design", "proficiency": "advanced", "importance": "preferred"}
        ],
        "technical_fundamentals": [
            "Document Object Model (DOM) Tree & Event Bubbling/Capturing",
            "CSS Box Model, Flexbox, Grid, & Mobile-First Breakpoints",
            "Browser Rendering Pipeline & Critical Rendering Path",
            "Web Accessibility (WCAG 2.1 AA, ARIA roles)"
        ],
        "tools": ["Chrome DevTools", "VS Code", "Git / GitHub", "Figma", "NPM / PNPM"],
        "frameworks": ["React", "Tailwind CSS", "Next.js", "Vite"],
        "curated_stages": [
            {
                "stage": 1,
                "week": 1,
                "title": "Semantic HTML5 & Accessible CSS Layouts",
                "skill": "HTML/CSS",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Master semantic tags, ARIA attributes, Flexbox, CSS Grid, custom properties (CSS variables), and media queries.",
                "learning_resources": [
                    {"title": "MDN Web Docs - HTML & CSS", "url": "https://developer.mozilla.org/en-US/docs/Learn", "type": "documentation"}
                ],
                "practical_exercise": "Build a responsive, accessible SaaS landing page with dark/light theme switching using pure CSS variables."
            },
            {
                "stage": 2,
                "week": 2,
                "title": "Modern JavaScript (ES6+) & DOM Manipulation",
                "skill": "JavaScript",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Event delegation, closures, promises, async/await, fetch API, local storage, and modular ES imports.",
                "learning_resources": [
                    {"title": "JavaScript.info Modern Tutorial", "url": "https://javascript.info/", "type": "tutorial"}
                ],
                "practical_exercise": "Build an interactive client-side kanban application with drag-and-drop and persistent localStorage."
            },
            {
                "stage": 3,
                "week": 3,
                "title": "Component Architecture with React",
                "skill": "React",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Functional components, JSX, props, state, useEffect hooks, custom hooks, and lifting state up.",
                "learning_resources": [
                    {"title": "React.dev Learn Documentation", "url": "https://react.dev/learn", "type": "documentation"}
                ],
                "practical_exercise": "Build an interactive job board with real-time keyword search, filter tags, and pagination in React."
            },
            {
                "stage": 4,
                "week": 4,
                "title": "Utility-First Styling with Tailwind CSS",
                "skill": "Tailwind CSS",
                "priority": "mandatory",
                "estimated_time": "1-2 weeks",
                "description": "Tailwind utility design system, configuration themes, typography plugins, responsive prefix modifiers, and component extraction.",
                "learning_resources": [
                    {"title": "Tailwind CSS Documentation", "url": "https://tailwindcss.com/docs", "type": "documentation"}
                ],
                "practical_exercise": "Style a full dashboard interface following the CareerBridge editorial design system using Tailwind tokens."
            },
            {
                "stage": 5,
                "week": 5,
                "title": "Consuming REST APIs & Client-Side State",
                "skill": "REST APIs",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Asynchronous data fetching, loading spinners, optimistic updates, error boundary catching, and form handling.",
                "learning_resources": [
                    {"title": "TanStack Query Docs", "url": "https://tanstack.com/query/latest", "type": "documentation"}
                ],
                "practical_exercise": "Implement an API-driven candidate profile manager with loading skeletons and inline validation."
            },
            {
                "stage": 6,
                "week": 6,
                "title": "Production Optimization & Cloud Deployment",
                "skill": "Portfolio projects",
                "priority": "high",
                "estimated_time": "2 weeks",
                "description": "Lighthouse performance auditing, image optimization, minification, and continuous deployment via Vercel / Netlify.",
                "learning_resources": [
                    {"title": "Web.dev Learn Performance", "url": "https://web.dev/learn/performance/", "type": "guide"}
                ],
                "practical_exercise": "Deploy a complete portfolio project live to Vercel scoring 95+ on Google Lighthouse."
            }
        ]
    },

    "Full Stack Developer": {
        "role_name": "Full Stack Developer",
        "category": "Software Engineering",
        "description": "Architects, develops, and delivers complete end-to-end applications across responsive user interfaces, robust backend APIs, and scalable databases.",
        "core_skills": [
            {"name": "JavaScript", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "TypeScript", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "React", "proficiency": "advanced", "importance": "mandatory"},
            {"name": "Python", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "FastAPI", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "SQL", "proficiency": "intermediate", "importance": "mandatory"},
            {"name": "Git", "proficiency": "intermediate", "importance": "mandatory"}
        ],
        "preferred_skills": [
            {"name": "Next.js", "proficiency": "advanced", "importance": "preferred"},
            {"name": "Node.js", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "Docker", "proficiency": "intermediate", "importance": "preferred"},
            {"name": "Tailwind CSS", "proficiency": "advanced", "importance": "preferred"},
            {"name": "Redis", "proficiency": "beginner", "importance": "preferred"},
            {"name": "CI/CD", "proficiency": "beginner", "importance": "preferred"}
        ],
        "technical_fundamentals": [
            "End-to-End System Architecture (Client-Server, Multi-tier, Microservices)",
            "Authentication & Security (JWT, HttpOnly cookies, CORS, CSRF, XSS)",
            "Database Normalization & Query Plan Optimization (MySQL/PostgreSQL)",
            "State Management & Server-Side Rendering (SSR vs CSR vs SSG)"
        ],
        "tools": ["Git / GitHub", "Docker", "Postman", "VS Code", "MySQL Workbench / DBeaver"],
        "frameworks": ["Next.js", "React", "FastAPI", "Tailwind CSS", "SQLAlchemy", "Pydantic"],
        "curated_stages": [
            {
                "stage": 1,
                "week": 1,
                "title": "Strict TypeScript & Modern React Components",
                "skill": "TypeScript",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Type inference, generics, discriminated unions, utility types, and typing complex React component hierarchies.",
                "learning_resources": [
                    {"title": "TypeScript Official Handbook", "url": "https://www.typescriptlang.org/docs/handbook/intro.html", "type": "handbook"},
                    {"title": "Total TypeScript Tutorials", "url": "https://www.totaltypescript.com/tutorials", "type": "tutorial"}
                ],
                "practical_exercise": "Build a strictly-typed React component library with generic tables, dialogs, and form inputs."
            },
            {
                "stage": 2,
                "week": 2,
                "title": "Next.js 14 App Router & Hybrid Rendering",
                "skill": "Next.js",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Server Components, Client Components, dynamic route handlers, layouts, Server Actions, and metadata optimization.",
                "learning_resources": [
                    {"title": "Next.js App Router Documentation", "url": "https://nextjs.org/docs/app", "type": "documentation"}
                ],
                "practical_exercise": "Construct an authenticated SaaS portal using Next.js 14 App Router with nested layouts and Server Actions."
            },
            {
                "stage": 3,
                "week": 3,
                "title": "Asynchronous Backend API Architecture with FastAPI",
                "skill": "FastAPI",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Design secure RESTful APIs, dependency injection, Pydantic schema validation, centralized error envelopes, and CORS configuration.",
                "learning_resources": [
                    {"title": "FastAPI Official Documentation", "url": "https://fastapi.tiangolo.com/", "type": "documentation"}
                ],
                "practical_exercise": "Build an authenticated multi-resource backend with JWT HttpOnly cookies and role-based permissions."
            },
            {
                "stage": 4,
                "week": 4,
                "title": "Relational Persistence & SQLAlchemy ORM",
                "skill": "SQL",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Normalized MySQL schemas, composite indexing, transactional atomicity, SQLAlchemy relationships, and Alembic migrations.",
                "learning_resources": [
                    {"title": "SQLAlchemy 2.0 Unified Tutorial", "url": "https://docs.sqlalchemy.org/en/20/tutorial/", "type": "documentation"}
                ],
                "practical_exercise": "Model a high-throughput placement application workflow with transaction isolation and audit history."
            },
            {
                "stage": 5,
                "week": 5,
                "title": "Containerization & Multi-Container Docker Compose",
                "skill": "Docker",
                "priority": "high",
                "estimated_time": "1-2 weeks",
                "description": "Multi-stage builds for Next.js frontend and Python backend, container networking, and local development orchestration with Docker Compose.",
                "learning_resources": [
                    {"title": "Docker Compose Specification", "url": "https://docs.docker.com/compose/", "type": "documentation"}
                ],
                "practical_exercise": "Create a unified docker-compose.yml running frontend, backend, and MySQL database with health checks."
            },
            {
                "stage": 6,
                "week": 6,
                "title": "Continuous Integration, Testing & Deployment",
                "skill": "CI/CD",
                "priority": "mandatory",
                "estimated_time": "2 weeks",
                "description": "Automated pytest and vitest execution in GitHub Actions, container registry publishing, and production deployment.",
                "learning_resources": [
                    {"title": "GitHub Actions Documentation", "url": "https://docs.github.com/en/actions", "type": "documentation"}
                ],
                "practical_exercise": "Deploy full-stack application with automated testing and continuous delivery pipeline."
            }
        ]
    }
}


def get_curated_target_role(role_name: str) -> Optional[Dict[str, Any]]:
    """Retrieve curated role by exact or case-insensitive partial match."""
    if not role_name:
        return None
    cleaned = role_name.strip()
    if cleaned in CURATED_TARGET_ROLES:
        return CURATED_TARGET_ROLES[cleaned]
    
    # Case-insensitive search
    for name, data in CURATED_TARGET_ROLES.items():
        if name.lower() == cleaned.lower():
            return data
            
    # Substring search
    for name, data in CURATED_TARGET_ROLES.items():
        if cleaned.lower() in name.lower() or name.lower() in cleaned.lower():
            return data
            
    return None


def generate_custom_role_profile(
    role_name: str,
    requested_skills: Optional[List[str]] = None,
    category: str = "Specialized Engineering"
) -> Dict[str, Any]:
    """
    Algorithmic synthesis for user or admin defined custom target roles.
    Extracts core competencies, matches against master taxonomy, and synthesizes 6 learning stages.
    """
    clean_name = role_name.strip().title()
    skills_list = requested_skills or []
    
    # If no skills provided, derive sensible defaults based on keywords in role_name
    normalized_skills = []
    for s in skills_list:
        norm = normalize_skill(s)
        if norm:
            normalized_skills.append(norm)
            
    if not normalized_skills:
        lower_name = clean_name.lower()
        if "cloud" in lower_name or "devops" in lower_name:
            normalized_skills = ["Linux", "Docker", "Kubernetes", "AWS", "Git", "CI/CD", "Python"]
            category = "Cloud & DevOps"
        elif "cyber" in lower_name or "security" in lower_name:
            normalized_skills = ["Linux", "Computer Networks", "Python", "Cryptography", "Bash", "Security Fundamentals"]
            category = "Cybersecurity"
        elif "mobile" in lower_name or "android" in lower_name or "ios" in lower_name:
            normalized_skills = ["Kotlin", "Java", "Android SDK", "REST APIs", "Git"]
            category = "Mobile Engineering"
        elif "qa" in lower_name or "test" in lower_name:
            normalized_skills = ["Python", "Selenium", "Pytest", "Postman", "Git", "SQL"]
            category = "Quality Assurance"
        else:
            normalized_skills = ["Python", "Git", "SQL", "REST APIs", "Data Structures & Algorithms"]
            category = "Custom Engineering"

    core = [{"name": s, "proficiency": "intermediate", "importance": "mandatory"} for s in normalized_skills[:5]]
    preferred = [{"name": s, "proficiency": "beginner", "importance": "preferred"} for s in normalized_skills[5:10]]

    # Generate 6 sequential stages
    stages = []
    for idx in range(1, 7):
        target_skill = normalized_skills[(idx - 1) % len(normalized_skills)]
        stages.append({
            "stage": idx,
            "week": idx,
            "title": f"Stage {idx}: {target_skill} Core Competency",
            "skill": target_skill,
            "priority": "mandatory" if idx <= 3 else "high",
            "estimated_time": "1-2 weeks",
            "description": f"Master foundational and applied concepts of {target_skill} tailored to the {clean_name} requisition profile.",
            "learning_resources": [
                {"title": f"{target_skill} Documentation & Practice", "url": "https://devdocs.io/", "type": "documentation"}
            ],
            "practical_exercise": f"Build a practical exercise or capstone component demonstrating proficiency in {target_skill}."
        })

    return {
        "role_name": clean_name,
        "category": category,
        "description": f"Custom requisition target synthesized for {clean_name}.",
        "core_skills": core,
        "preferred_skills": preferred,
        "technical_fundamentals": ["Data Structures & Algorithms", "System Design", "Relational Databases", "Git Version Control"],
        "tools": ["Git", "GitHub", "Linux CLI", "Postman"],
        "frameworks": [s for s in normalized_skills if s in ["React", "Next.js", "FastAPI", "Spring Boot", "Django", "PyTorch"]],
        "curated_stages": stages,
        "is_curated": False
    }

