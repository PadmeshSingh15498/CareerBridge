# CareerBridge — Career Readiness Index (CRI) Methodology & Architecture

## 1. Overview
The **Career Readiness Index (CRI)** is CareerBridge's transparent, 6-pillar employability index calibrated to corporate recruitment expectations. Unlike simple profile completion percentages, the CRI evaluates **evidence rigor**: public GitHub repositories, ATS readability, verifiable skill mastery, academic eligibility gating, and STAR mock interview performance.

---

## 2. Mathematical Scoring Formula

The composite CRI score is computed on a 0–100 scale using configurable pillar weights that sum strictly to $1.0$:

$$\text{CRI} = S_{\text{skills}} + S_{\text{projects}} + S_{\text{resume}} + S_{\text{academic}} + S_{\text{interviews}} + S_{\text{cert\_exp}}$$

### Configurable Category Weights

| Pillar | Max Points | Weight | Assessment Dimensions |
| :--- | :---: | :---: | :--- |
| **Technical Skills** | **30 pts** | $30\%$ | Count of competencies (up to 8), depth of proficiency (Beginner to Expert), and TPO/project verification. |
| **Projects & Evidence** | **20 pts** | $20\%$ | Count of production projects (target $\ge 2$), presence of verified GitHub repository URLs ($+5$ pts), and live deployment demos ($+5$ pts). |
| **Resume Quality (ATS)** | **15 pts** | $15\%$ | PyMuPDF text parseability, 4-factor ATS score, quantifiable XYZ bullet formula, and keyword density. |
| **Academic Eligibility** | **15 pts** | $15\%$ | University CGPA normalized to 10.0 scale, with proportional deductions for active academic backlogs ($2$ pts per backlog). |
| **Interview Preparation** | **10 pts** | $10\%$ | Average performance score across completed AI mock interview drills utilizing the STAR methodology. |
| **Certifications & Experience** | **10 pts** | $10\%$ | Accredited external credentials (AWS, Oracle, Google Cloud) and verified corporate internship exposure. |

$$\text{Total Available Points} = 30 + 20 + 15 + 15 + 10 + 10 = 100 \text{ pts}$$

---

## 3. Handling Missing Information Separately

CareerBridge never silently zeroes out scores without providing actionable remediation. Missing data categories are explicitly identified with:
- **`category`**: Name of the deficient profile area.
- **`points_missed`**: Exact points currently locked.
- **`reason`**: Descriptive explanation of why points were not awarded.
- **`unlock_action`**: Actionable instructions to unlock points (e.g. *"Upload your primary PDF resume and run the AI Resume Analyzer"* or *"Add public GitHub repositories to your featured projects"*).

---

## 4. Prioritized Improvement Opportunities (Dynamic ROI)

The CRI engine sorts improvement opportunities by highest return on investment:
1. **Add GitHub URLs to Projects:** $+5.0$ pts (Easy difficulty)
2. **Complete AI Mock Interview Session:** $+8.0$ pts (Medium difficulty)
3. **Elevate ATS Resume Score to 85+:** $+4.5$ pts (Medium difficulty)
4. **Bridge Core Target Role Skill Gaps:** $+6.0$ pts (High difficulty)

---

## 5. Performance Tiers

| Score Range | Tier Classification | Visual Palette | Placement Implication |
| :--- | :--- | :--- | :--- |
| **$85.0 - 100.0$** | **Campus Placement Ready** | Forest Green (`#244D3D`) | Top-tier shortlist candidate across premium corporate campus drives. |
| **$70.0 - 84.9$** | **Interview Competitive** | Accent Lime (`#C9E66B`) | Competitive profile satisfying most core criteria; minor gaps in evidence. |
| **$50.0 - 69.9$** | **Actively Progressing** | Warm Orange (`#E88B57`) | Foundational skills present; requires capstone project and resume polish. |
| **$0.0 - 49.9$** | **Foundational Development**| Secondary Slate (`#727B74`) | Early stage onboarding; student guided through initial 6-week roadmap. |

---

## 6. Snapshot Persistence & Progression Tracking

Every CRI computation can be stored as a point-in-time snapshot in the MySQL table `career_readiness_history`. This enables students, recruiters, and placement officers to visualize the score trajectory over weeks leading up to campus recruitment drives.

