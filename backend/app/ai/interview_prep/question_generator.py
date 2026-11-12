"""
AI Interview Question Generator.
Generates structured, domain-tailored interview questions based on:
- Job Role (SWE, Full Stack, Data Science, DevOps, Frontend, etc.)
- Target Employer Tier (Google, Microsoft, Amazon, Tier-1 Tech, Generic)
- Interview Type (Technical, Coding, HR, Behavioral, Aptitude)
- Difficulty Level (entry_level, intermediate, senior)
- Specific Focus Topics
"""

import random
from typing import List, Dict, Any, Optional

# Curated archetypes for question banks
INTERVIEW_QUESTION_BANKS: Dict[str, Dict[str, List[Dict[str, Any]]]] = {
    "technical": {
        "software engineer": [
            {
                "topic": "System Design & Concurrency",
                "question": "How would you design a thread-safe in-memory cache with eviction policies like LRU, and how would you handle race conditions during high concurrent writes?",
                "hints": ["Consider Mutex/Locks vs Concurrent HashMaps", "Think about doubly linked list + hash map for O(1) eviction"],
                "difficulty": "intermediate",
                "key_concepts": ["Thread safety", "LRU Cache", "Lock contention", "Read-Write Locks"]
            },
            {
                "topic": "Database & Query Optimization",
                "question": "Explain the difference between clustered and non-clustered indexes. How does B+ tree structure enable efficient range queries, and what are the trade-offs of excessive indexing?",
                "hints": ["Data page ordering on disk", "Leaf nodes linked in B+ trees", "Write latency overhead on INSERT/UPDATE"],
                "difficulty": "intermediate",
                "key_concepts": ["Clustered Index", "B+ Tree", "Disk I/O", "Write Amplification"]
            },
            {
                "topic": "Distributed Systems",
                "question": "In a microservices architecture, how do you handle distributed transactions across multiple databases? Explain the Saga pattern and compare choreography vs orchestration.",
                "hints": ["Compensating transactions", "Event-driven architecture vs centralized orchestrator"],
                "difficulty": "senior",
                "key_concepts": ["Saga Pattern", "Eventual Consistency", "Compensating Actions", "Orchestration"]
            },
            {
                "topic": "Core Data Structures",
                "question": "Explain how hash collisions are resolved in HashMap implementations. When does Java or Python resize its buckets, and what is the amortized time complexity?",
                "hints": ["Chaining vs Open Addressing", "Treeify threshold in Java 8 (Red-Black trees)", "Load factor"],
                "difficulty": "entry_level",
                "key_concepts": ["Hash collisions", "Chaining", "Amortized O(1)", "Load factor"]
            },
            {
                "topic": "Networking & Protocols",
                "question": "What happens under the hood when a user types a URL into their browser? Trace the journey from DNS resolution and TCP three-way handshake to HTTP/2 multiplexing and DOM rendering.",
                "hints": ["DNS recursive lookup", "SYN, SYN-ACK, ACK", "TLS handshake", "Browser rendering pipeline"],
                "difficulty": "intermediate",
                "key_concepts": ["DNS", "TCP Handshake", "TLS Termination", "HTTP/2 Multiplexing"]
            }
        ],
        "data scientist": [
            {
                "topic": "Machine Learning Fundamentals",
                "question": "Explain the bias-variance tradeoff. How do regularization techniques like L1 (Lasso) and L2 (Ridge) prevent overfitting, and why does L1 lead to sparse feature weights?",
                "hints": ["Geometric interpretation of L1 diamond vs L2 circle constraint", "High variance vs high bias models"],
                "difficulty": "intermediate",
                "key_concepts": ["Bias-Variance", "L1 Regularization", "Sparsity", "Overfitting"]
            },
            {
                "topic": "Model Evaluation",
                "question": "When dealing with highly imbalanced datasets (e.g. fraud detection with 99.9% negative class), why is accuracy misleading? Compare ROC-AUC and Precision-Recall AUC for this use-case.",
                "hints": ["Confusion matrix baseline", "PR-AUC focuses on minority positive class"],
                "difficulty": "intermediate",
                "key_concepts": ["Class Imbalance", "Precision-Recall AUC", "ROC-AUC", "F1 Score"]
            },
            {
                "topic": "Deep Learning & Transformers",
                "question": "Explain the multi-head self-attention mechanism in Transformers. Why does it scale quadratically $O(N^2)$ with sequence length, and how do flash attention or sparse attention address this?",
                "hints": ["Query, Key, Value dot products", "Softmax matrix dimensions", "Memory bandwidth vs compute"],
                "difficulty": "senior",
                "key_concepts": ["Self-Attention", "QKV matrices", "Quadratic complexity", "Memory bottlenecks"]
            }
        ],
        "frontend developer": [
            {
                "topic": "Browser Internals & Performance",
                "question": "How does the React Virtual DOM diffing algorithm work? Explain key reconciliation rules, why keys are essential in lists, and how React 18 Concurrent Mode avoids blocking the main thread.",
                "hints": ["Heuristic O(N) diffing", "Fiber architecture and time slicing", "State batching"],
                "difficulty": "intermediate",
                "key_concepts": ["Virtual DOM", "Fiber Architecture", "Reconciliation", "Concurrent Rendering"]
            },
            {
                "topic": "State Management & Architecture",
                "question": "Compare prop drilling, Context API, and state stores like Redux or Zustand. How do you prevent unnecessary re-renders in deeply nested React component trees?",
                "hints": ["React.memo, useMemo, useCallback", "Context re-render caveat", "Selective subscriptions"],
                "difficulty": "intermediate",
                "key_concepts": ["Context API", "Unnecessary re-renders", "Memoization", "Zustand"]
            }
        ]
    },
    "coding": {
        "generic": [
            {
                "topic": "Algorithms & Optimization",
                "question": "Given an array of integers representing stock prices on consecutive days, describe an algorithm to find the maximum profit you can achieve with at most two transactions. State the time and space complexity.",
                "hints": ["Dynamic programming with buy/sell states", "Prefix profit and suffix profit arrays"],
                "difficulty": "intermediate",
                "key_concepts": ["Dynamic Programming", "O(N) Time", "State Machines"]
            },
            {
                "topic": "Trees & Graphs",
                "question": "Explain how you would detect a cycle in a directed graph. Contrast using Depth-First Search (DFS with 3-state coloring) versus Kahn's Algorithm (topological sort with in-degrees).",
                "hints": ["White/Gray/Black node states in DFS", "Queue of zero in-degree nodes"],
                "difficulty": "intermediate",
                "key_concepts": ["Cycle Detection", "Topological Sort", "DFS Coloring", "Kahn's Algorithm"]
            },
            {
                "topic": "Strings & Two Pointers",
                "question": "How would you solve the 'Longest Substring Without Repeating Characters' problem in $O(N)$ time? Walk through the sliding window approach and how a hash map optimizes the left pointer jump.",
                "hints": ["Sliding window with two pointers", "Store character index in map to jump directly past duplicate"],
                "difficulty": "entry_level",
                "key_concepts": ["Sliding Window", "Two Pointers", "O(N) Time Complexity", "Hash Map lookup"]
            }
        ]
    },
    "behavioral": {
        "generic": [
            {
                "topic": "Conflict Resolution & Teamwork",
                "question": "Tell me about a time you had a strong technical disagreement with a team member or lead on an architecture or project decision. How did you handle the situation and what was the outcome?",
                "hints": ["Use the STAR method: Situation, Task, Action, Result", "Focus on objective data, prototyping, and consensus-building"],
                "difficulty": "intermediate",
                "key_concepts": ["STAR Method", "Data-driven resolution", "Empathy", "Collaboration"]
            },
            {
                "topic": "Ownership & Accountability",
                "question": "Describe a project or deliverable that did not go according to plan, missed a deadline, or failed in production. What went wrong, how did you take ownership, and what safeguards did you put in place?",
                "hints": ["Radical ownership", "Blameless post-mortem", "Systemic automated safeguards"],
                "difficulty": "intermediate",
                "key_concepts": ["Accountability", "Post-mortem analysis", "Continuous Improvement"]
            },
            {
                "topic": "Dealing with Ambiguity",
                "question": "Can you give an example of a situation where you had to make progress on a critical task with vague, incomplete, or rapidly shifting requirements? What steps did you take to clarify expectations?",
                "hints": ["Stakeholder communication", "Phased deliverables / MVPs", "Proactive assumptions documentation"],
                "difficulty": "intermediate",
                "key_concepts": ["Ambiguity", "Proactive communication", "Iterative Delivery"]
            }
        ]
    },
    "hr": {
        "generic": [
            {
                "topic": "Career Goals & Motivation",
                "question": "Why are you interested in this specific role and our organization? Where do you see yourself technically and professionally in the next 3 to 5 years?",
                "hints": ["Demonstrate knowledge of company mission/products", "Show growth mindset aligned with engineering craftsmanship"],
                "difficulty": "entry_level",
                "key_concepts": ["Cultural alignment", "Career vision", "Motivation"]
            },
            {
                "topic": "Work-Life Integration & Pressure",
                "question": "How do you manage high-pressure situations with competing deadlines and context switching? Share your prioritization methodology.",
                "hints": ["Eisenhower matrix or triage frameworks", "Proactive expectation setting with managers"],
                "difficulty": "entry_level",
                "key_concepts": ["Stress management", "Prioritization", "Communication"]
            }
        ]
    },
    "aptitude": {
        "generic": [
            {
                "topic": "Quantitative & Probability",
                "question": "A bag contains 5 red and 7 blue marbles. Two marbles are drawn at random without replacement. What is the probability that both marbles are red, and how would this change if sampling was with replacement?",
                "hints": ["Hypergeometric vs Binomial", "(5/12) * (4/11) without replacement"],
                "difficulty": "entry_level",
                "key_concepts": ["Conditional Probability", "Sampling without replacement", "Combinatorics"]
            },
            {
                "topic": "Logical Deductions",
                "question": "You have 8 balls of identical shape and size, but one ball is slightly heavier than the other 7. You have a two-pan balance scale. What is the minimum number of weighings required to identify the heavy ball, and how do you do it?",
                "hints": ["Divide into 3 groups (3, 3, 2)", "Ternary search on balance scale"],
                "difficulty": "entry_level",
                "key_concepts": ["Ternary Division", "Optimization", "Worst-case analysis"]
            }
        ]
    }
};


class QuestionGenerator:

    @staticmethod
    def generate_question(
        target_role: str,
        company_target: str = "General Tech",
        interview_type: str = "technical",
        difficulty: str = "intermediate",
        topics: Optional[List[str]] = None,
        question_index: int = 0,
        answered_topics: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Dynamically generates or curates a targeted interview question adapting to
        role, company context, difficulty, and previous question history.
        """
        type_clean = interview_type.lower().strip()
        role_clean = target_role.lower().strip()

        # Resolve question pool
        type_pool = INTERVIEW_QUESTION_BANKS.get(type_clean, INTERVIEW_QUESTION_BANKS["technical"])
        role_pool = type_pool.get(role_clean)

        if not role_pool:
            # Fallback to software engineer or generic
            if "software engineer" in type_pool:
                role_pool = type_pool["software engineer"]
            elif "generic" in type_pool:
                role_pool = type_pool["generic"]
            else:
                first_key = list(type_pool.keys())[0]
                role_pool = type_pool[first_key]

        # Filter by topics if provided
        filtered = role_pool
        if topics:
            matched = [q for q in role_pool if any(t.lower() in q.get("topic", "").lower() for t in topics)]
            if matched:
                filtered = matched

        # Avoid repeating answered topics if possible
        if answered_topics:
            unanswered = [q for q in filtered if q.get("topic") not in answered_topics]
            if unanswered:
                filtered = unanswered

        # Select question deterministically or cyclically based on question_index
        selected = filtered[question_index % len(filtered)]

        # Tailor question prefix for specific companies if requested
        company_mention = ""
        if company_target and company_target.lower() not in ["general", "general tech"]:
            company_mention = f"[{company_target} Prep] "

        return {
            "question_id": question_index + 1,
            "question_text": f"{company_mention}{selected['question']}",
            "interview_type": type_clean,
            "topic": selected.get("topic", "General"),
            "difficulty": difficulty,
            "hints": selected.get("hints", []),
            "key_concepts": selected.get("key_concepts", [])
        }

