"""
Skill Normalization and Taxonomy System for CareerBridge.
Provides canonical skill mapping, alias resolution, and strict non-equivalence enforcement.
Guarantees that distinct technologies (e.g., Java vs. JavaScript, C vs. C++, ML vs. SQL)
are never erroneously equated.
"""

import re
from typing import Dict, List, Set, Optional, Tuple

# Canonical Skill Taxonomy grouped by engineering domain
SKILL_TAXONOMY: Dict[str, Dict[str, List[str]]] = {
    "Programming Languages": {
        "Python": ["python", "python3", "python 3", "py"],
        "JavaScript": ["javascript", "js", "vanilla js", "es6", "es2015", "ecmascript"],
        "TypeScript": ["typescript", "ts"],
        "Java": ["java", "core java", "java 8", "java 11", "java 17", "java 21"],
        "C++": ["c++", "cpp", "c plus plus"],
        "C": ["c language", "ansi c", "c programming"],
        "C#": ["c#", "csharp", "c sharp", ".net c#"],
        "Go": ["go", "golang"],
        "Rust": ["rust", "rustlang"],
        "PHP": ["php", "php7", "php8"],
        "Ruby": ["ruby"],
        "Kotlin": ["kotlin"],
        "Swift": ["swift"],
        "Dart": ["dart"],
        "SQL": ["sql", "structured query language", "ansi sql"],
    },
    "Web & Mobile Frameworks": {
        "React": ["react", "react.js", "reactjs", "react js"],
        "Next.js": ["next.js", "nextjs", "next js", "next"],
        "Vue.js": ["vue", "vue.js", "vuejs", "vue 3"],
        "Angular": ["angular", "angularjs", "angular 2+"],
        "Node.js": ["node", "node.js", "nodejs", "node js"],
        "Express.js": ["express", "express.js", "expressjs"],
        "FastAPI": ["fastapi", "fast api"],
        "Django": ["django", "django rest framework", "drf"],
        "Flask": ["flask"],
        "Spring Boot": ["spring boot", "springboot", "spring", "spring framework"],
        "ASP.NET": ["asp.net", "aspnet", ".net core", "dotnet core"],
        "Tailwind CSS": ["tailwind", "tailwind css", "tailwindcss"],
        "Flutter": ["flutter"],
        "React Native": ["react native", "react-native"],
    },
    "Databases & Caching": {
        "PostgreSQL": ["postgresql", "postgres", "postgres db", "pgsql"],
        "MySQL": ["mysql", "my sql"],
        "MongoDB": ["mongodb", "mongo", "mongo db"],
        "Redis": ["redis", "redis cache"],
        "SQLite": ["sqlite", "sqlite3"],
        "Elasticsearch": ["elasticsearch", "elastic search", "elk"],
        "Cassandra": ["cassandra", "apache cassandra"],
        "DynamoDB": ["dynamodb", "aws dynamodb"],
    },
    "Cloud & DevOps": {
        "Docker": ["docker", "containerization", "containers"],
        "Kubernetes": ["kubernetes", "k8s"],
        "AWS": ["aws", "amazon web services", "amazon aws"],
        "GCP": ["gcp", "google cloud", "google cloud platform"],
        "Azure": ["azure", "microsoft azure"],
        "CI/CD": ["ci/cd", "cicd", "continuous integration", "github actions", "gitlab ci", "jenkins"],
        "Git": ["git", "github", "gitlab"],
        "Linux": ["linux", "ubuntu", "unix", "debian", "centos", "bash scripting"],
        "Terraform": ["terraform", "iac"],
        "Nginx": ["nginx"],
    },
    "AI, ML & Data Science": {
        "Machine Learning": ["machine learning", "ml"],
        "Deep Learning": ["deep learning", "dl"],
        "Natural Language Processing": ["natural language processing", "nlp"],
        "Computer Vision": ["computer vision", "cv"],
        "Large Language Models": ["llm", "llms", "large language models", "generative ai", "genai"],
        "PyTorch": ["pytorch", "torch"],
        "TensorFlow": ["tensorflow", "tf"],
        "Scikit-Learn": ["scikit-learn", "sklearn", "scikit learn"],
        "Pandas": ["pandas"],
        "NumPy": ["numpy"],
        "OpenCV": ["opencv", "cv2"],
        "Apache Spark": ["spark", "apache spark", "pyspark"],
        "Apache Kafka": ["kafka", "apache kafka"],
    },
    "Architecture & Methodologies": {
        "REST APIs": ["rest", "restful api", "restful apis", "rest apis", "rest api"],
        "GraphQL": ["graphql"],
        "Microservices": ["microservices", "microservice architecture"],
        "System Design": ["system design", "distributed systems"],
        "Agile": ["agile", "scrum", "kanban"],
    }
}

# Build flat alias lookup table (lowercase normalized string -> canonical title)
SKILL_ALIASES: Dict[str, str] = {}
for domain, skill_group in SKILL_TAXONOMY.items():
    for canonical_name, aliases in skill_group.items():
        # Map canonical name itself
        SKILL_ALIASES[canonical_name.lower()] = canonical_name
        for alias in aliases:
            SKILL_ALIASES[alias.lower().strip()] = canonical_name

# Explicit Non-Equivalence Pairs (False Friends)
# If a naive string contains check would accidentally match these, reject it!
STRICT_NON_EQUIVALENT_PAIRS: Set[Tuple[str, str]] = {
    ("java", "javascript"),
    ("javascript", "java"),
    ("c", "c++"),
    ("c++", "c"),
    ("c", "c#"),
    ("c#", "c"),
    ("c++", "c#"),
    ("c#", "c++"),
    ("machine learning", "sql"),
    ("sql", "machine learning"),
    ("html", "css"),
    ("css", "html"),
    ("python", "pytorch"),
    ("pytorch", "python"),
    ("rust", "ruby"),
    ("ruby", "rust"),
    ("go", "gcp"),
    ("gcp", "go"),
    ("r", "rust"),
    ("r", "ruby"),
}


def _clean_token(raw: str) -> str:
    """Cleans punctuation, extraneous whitespace, and lowercases."""
    if not raw:
        return ""
    text = raw.lower().strip()
    # Normalize multiple whitespaces
    text = re.sub(r"\s+", " ", text)
    # Remove surrounding quotes or parentheses
    text = text.strip("'\"()[]{}")
    return text


def normalize_skill(skill_name: str) -> str:
    """
    Normalizes any user-entered skill or extracted keyword to its canonical representation.
    If no alias is known, capitalizes words gracefully while preserving special acronyms.
    """
    if not skill_name:
        return ""

    cleaned = _clean_token(skill_name)
    if cleaned in SKILL_ALIASES:
        return SKILL_ALIASES[cleaned]

    # Special handling for C language exact match
    if cleaned == "c":
        return "C"

    # Remove trailing version numbers (e.g., 'Python 3.11' -> 'Python')
    version_stripped = re.sub(r"\s+\d+(?:\.\d+)*$", "", cleaned)
    if version_stripped in SKILL_ALIASES:
        return SKILL_ALIASES[version_stripped]

    # Fallback: title-case the cleaned skill
    return skill_name.strip().title()


def normalize_skill_list(skills: List[str]) -> List[str]:
    """
    Normalizes a list of skills, deduplicates them preserving canonical order.
    """
    if not skills:
        return []

    seen = set()
    result = []
    for s in skills:
        if not s or not str(s).strip():
            continue
        canonical = normalize_skill(str(s).strip())
        if canonical and canonical.lower() not in seen:
            seen.add(canonical.lower())
            result.append(canonical)

    return result


def are_skills_equivalent(skill_a: str, skill_b: str) -> bool:
    """
    Evaluates whether two skill strings represent the exact same engineering competency.
    Explicitly guards against false-friend matches.
    """
    if not skill_a or not skill_b:
        return False

    raw_a = _clean_token(skill_a)
    raw_b = _clean_token(skill_b)

    # Check strict non-equivalence guards
    if (raw_a, raw_b) in STRICT_NON_EQUIVALENT_PAIRS or (raw_b, raw_a) in STRICT_NON_EQUIVALENT_PAIRS:
        return False

    norm_a = normalize_skill(skill_a)
    norm_b = normalize_skill(skill_b)

    # Check non-equivalence on normalized names too
    norm_pair = (norm_a.lower(), norm_b.lower())
    if norm_pair in STRICT_NON_EQUIVALENT_PAIRS or (norm_pair[1], norm_pair[0]) in STRICT_NON_EQUIVALENT_PAIRS:
        return False

    return norm_a.lower() == norm_b.lower()

