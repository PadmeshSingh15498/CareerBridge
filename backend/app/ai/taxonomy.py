"""
Master Skill Taxonomy & N-Gram Matcher for CareerBridge.
Provides standardized skill normalization and fast, deterministic extraction.
"""

import re
from typing import Dict, List, Set, Tuple

# Standardized categorization
SKILL_TAXONOMY: Dict[str, Dict[str, List[str]]] = {
    "programming_language": {
        "Python": ["python", "py", "python3"],
        "JavaScript": ["javascript", "js", "ecmascript"],
        "TypeScript": ["typescript", "ts"],
        "Java": ["java", "core java", "j2ee"],
        "C++": ["c++", "cpp"],
        "C": ["c language", "ansi c"],
        "C#": ["c#", "csharp", "c sharp"],
        "Go": ["golang", "go language"],
        "Rust": ["rust", "rustlang"],
        "PHP": ["php", "php7", "php8"],
        "Ruby": ["ruby"],
        "Swift": ["swift"],
        "Kotlin": ["kotlin"],
        "R": ["r language", "r programming"],
        "SQL": ["sql", "structured query language", "t-sql", "pl/sql"],
        "HTML/CSS": ["html", "html5", "css", "css3"],
        "Shell/Bash": ["bash", "shell scripting", "powershell", "zsh"],
        "Dart": ["dart"],
        "Scala": ["scala"],
        "MATLAB": ["matlab"],
    },
    "framework": {
        "React": ["react", "react.js", "reactjs"],
        "Next.js": ["next.js", "nextjs", "next"],
        "Node.js": ["node.js", "nodejs", "node"],
        "Express": ["express", "express.js", "expressjs"],
        "FastAPI": ["fastapi", "fast-api"],
        "Django": ["django", "django rest framework", "drf"],
        "Flask": ["flask"],
        "Spring Boot": ["spring boot", "springboot", "spring framework"],
        "Angular": ["angular", "angularjs", "angular 2+"],
        "Vue.js": ["vue", "vue.js", "vuejs", "vue 3"],
        "Tailwind CSS": ["tailwind", "tailwindcss"],
        "Bootstrap": ["bootstrap", "bootstrap 5"],
        "ASP.NET": ["asp.net", "asp.net core", ".net core", "dotnet"],
        "Ruby on Rails": ["rails", "ruby on rails"],
        "Laravel": ["laravel"],
        "Flutter": ["flutter"],
        "React Native": ["react native", "react-native"],
        "Pyramid": ["pyramid framework"],
        "NestJS": ["nestjs", "nest.js"],
        "Svelte": ["svelte", "sveltekit"],
    },
    "database": {
        "MySQL": ["mysql", "my-sql"],
        "PostgreSQL": ["postgresql", "postgres", "psql"],
        "MongoDB": ["mongodb", "mongo"],
        "Redis": ["redis"],
        "SQLite": ["sqlite", "sqlite3"],
        "Oracle Database": ["oracle", "oracle db", "plsql"],
        "Microsoft SQL Server": ["mssql", "sql server"],
        "Cassandra": ["cassandra", "apache cassandra"],
        "Elasticsearch": ["elasticsearch", "elastic search"],
        "DynamoDB": ["dynamodb", "aws dynamodb"],
        "Firebase": ["firebase", "firestore"],
        "Neo4j": ["neo4j", "graph database"],
        "Supabase": ["supabase"],
        "MariaDB": ["mariadb"],
    },
    "cloud_devops": {
        "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda"],
        "Google Cloud (GCP)": ["gcp", "google cloud", "google cloud platform", "bigquery"],
        "Microsoft Azure": ["azure", "microsoft azure"],
        "Docker": ["docker", "containerization"],
        "Kubernetes": ["kubernetes", "k8s"],
        "CI/CD": ["ci/cd", "continuous integration", "github actions", "gitlab ci", "jenkins"],
        "Terraform": ["terraform", "infrastructure as code", "iac"],
        "Linux": ["linux", "ubuntu", "debian", "centos", "redhat"],
        "Nginx": ["nginx"],
        "Apache": ["apache server", "apache httpd"],
        "Ansible": ["ansible"],
        "Kafka": ["kafka", "apache kafka"],
        "RabbitMQ": ["rabbitmq"],
    },
    "machine_learning": {
        "Machine Learning": ["machine learning", "ml", "supervised learning", "unsupervised learning"],
        "Deep Learning": ["deep learning", "neural networks", "cnn", "rnn", "lstm"],
        "Natural Language Processing": ["nlp", "natural language processing", "text mining"],
        "Computer Vision": ["computer vision", "opencv", "image processing"],
        "PyTorch": ["pytorch", "torch"],
        "TensorFlow": ["tensorflow", "tf"],
        "Scikit-learn": ["scikit-learn", "sklearn"],
        "Pandas": ["pandas"],
        "NumPy": ["numpy"],
        "Sentence Transformers": ["sentence transformers", "sentence-transformers", "embeddings"],
        "LLM Integration": ["llm", "large language models", "prompt engineering", "langchain", "rag"],
        "PyMuPDF": ["pymupdf", "fitz"],
        "Hugging Face": ["huggingface", "hugging face", "transformers"],
        "Keras": ["keras"],
        "Matplotlib": ["matplotlib"],
        "Seaborn": ["seaborn"],
    },
    "tool": {
        "Git": ["git", "version control"],
        "GitHub": ["github"],
        "GitLab": ["gitlab"],
        "Postman": ["postman", "api testing"],
        "VS Code": ["vs code", "vscode", "visual studio code"],
        "Jira": ["jira", "agile", "scrum"],
        "Figma": ["figma", "ui/ux design"],
        "Docker Desktop": ["docker desktop"],
        "Swagger / OpenAPI": ["swagger", "openapi"],
        "Vercel": ["vercel"],
        "Render": ["render.com"],
        "Jupyter": ["jupyter", "jupyter notebook"],
    },
    "soft_skill": {
        "Problem Solving": ["problem solving", "analytical skills"],
        "Communication": ["communication skills", "effective communication", "verbal communication"],
        "Team Leadership": ["leadership", "team management", "team player"],
        "Agile Methodology": ["agile", "scrum master", "sprints"],
        "Time Management": ["time management", "prioritization"],
        "Critical Thinking": ["critical thinking"],
    }
}

# Inverted mapping: lowercase alias -> (Standard Name, Category)
_ALIAS_LOOKUP: Dict[str, Tuple[str, str]] = {}

for category, skills in SKILL_TAXONOMY.items():
    for standard_name, aliases in skills.items():
        # Map the standard name itself
        _ALIAS_LOOKUP[standard_name.lower()] = (standard_name, category)
        for alias in aliases:
            _ALIAS_LOOKUP[alias.lower()] = (standard_name, category)


def normalize_skill_name(raw_name: str) -> Tuple[str, str]:
    """
    Normalizes a raw skill string to the canonical taxonomy standard.
    Returns (standard_name, category).
    """
    cleaned = raw_name.strip().lower()
    if cleaned in _ALIAS_LOOKUP:
        return _ALIAS_LOOKUP[cleaned]
    return (raw_name.strip().title(), "tool")


def extract_skills_from_text(text: str) -> List[Dict[str, str]]:
    """
    Deterministic sliding n-gram extractor (1, 2, 3 words) matching text against canonical taxonomy.
    Returns list of dicts: [{"name": "Python", "category": "programming_language"}, ...]
    """
    if not text:
        return []

    # Clean text to tokens
    cleaned_text = text.lower()
    # Replace punctuation with spaces except +, #, ., /
    cleaned_tokens = re.findall(r"[a-z0-9+#./-]+", cleaned_text)

    found_skills: Dict[str, str] = {}  # standard_name -> category

    # Check 3-grams, 2-grams, 1-grams
    num_tokens = len(cleaned_tokens)
    for n in (3, 2, 1):
        for i in range(num_tokens - n + 1):
            ngram = " ".join(cleaned_tokens[i:i + n])
            # Direct match
            if ngram in _ALIAS_LOOKUP:
                std_name, cat = _ALIAS_LOOKUP[ngram]
                found_skills[std_name] = cat

    # Also handle specific symbols like C++ and C# that might split
    if re.search(r"\bc\+\+\b", cleaned_text, re.IGNORECASE):
        found_skills["C++"] = "programming_language"
    if re.search(r"\bc#\b", cleaned_text, re.IGNORECASE):
        found_skills["C#"] = "programming_language"

    result = [{"name": name, "category": cat} for name, cat in sorted(found_skills.items())]
    return result

