# CareerBridge — Known Limitations & Architectural Trade-offs

> **Platform Version:** 1.0.0  
> **Philosophy:** High transparency regarding platform boundaries, deliberate design trade-offs, and future engineering milestones.

---

## 1. Document Parsing & ATS Limitations

### 1.1 Pure Raster Scans (Non-OCR Resumes)
- **Current Behavior:** PyMuPDF (`fitz`) parses structured vector PDFs containing digital text streams with bounding-box layout coordinates. If a candidate uploads a photograph or flat scanned image saved as a PDF without an OCR text layer, PyMuPDF cannot extract text.
- **Handling:** The backend detects empty extracted text and returns an informative error (`HTTP 422 Unprocessable Entity`) instructing the student to upload a digitally generated resume.
- **Trade-off Rationale:** Bundling heavy optical character recognition engines (such as Tesseract OCR with Leptonica) would increase the Docker backend image size by over 450MB and substantially increase CPU latency on file uploads.

### 1.2 Non-Standard Graphic Canvas Layouts
- **Current Behavior:** Resumes created using graphic design tools (such as complex Photoshop or Canva templates with arbitrary floating text boxes, circular graphic callouts, or icon-based skill bars) may have reading order discrepancies during two-column sorting.
- **Mitigation:** The 7-pillar ATS scoring rubric explicitly penalizes non-standard layouts under the "Structure" and "Readability" pillars and provides actionable guidance to adopt clean, single or two-column chronological layouts.

---

## 2. Machine Learning & Embeddings Boundaries

### 2.1 Cold-Start Problem for Empty Profiles
- **Current Behavior:** The hybrid job matching engine depends on candidate profile data (skills, projects, experience, academic record). If a student has just registered and has not entered any skills or uploaded a resume, algorithmic match scores default to 0%.
- **Mitigation:** The student dashboard automatically presents a prominent 3-step onboarding guide (`Upload Resume` $\to$ `Tag 5 Skills` $\to$ `Set Target Role`) to immediately bootstrap the candidate's vector profile.

### 2.2 CPU vs GPU Embedding Inference
- **Current Behavior:** On standard cloud containers without dedicated GPUs, generating dense sentence embeddings (`all-MiniLM-L6-v2`) runs on the CPU.
- **Optimization:** To prevent request blocking, candidate embeddings are computed and cached, and an optimized TF-IDF vectorizer fallback is available for resource-constrained instances.

---

## 3. Conversational AI & External Providers

### 3.1 External LLM Availability & Quotas
- **Current Behavior:** BridgeAI and the AI Interview Studio utilize the Google Gemini API (`gemini-1.5-flash`). If external API keys expire, experience network latency, or exceed provider rate limits, generation could fail.
- **Mitigation:** CareerBridge includes a deterministic, offline `MockLLMProvider` that transparently catches provider exceptions and returns structured career advice and interview rubrics, ensuring system resilience.

### 3.2 Response Streaming
- **Current Behavior:** BridgeAI responses are delivered as complete JSON response payloads over HTTP REST.
- **Future Milestone:** Future iterations can implement Server-Sent Events (SSE) or WebSocket streaming for word-by-word conversational typewriter rendering.

---

## 4. Browser & Speech Recognition Dependencies

### 4.1 Web Speech API Browser Compatibility
- **Current Behavior:** The AI Interview Preparation Studio provides speech-to-text recording via browser-native `webkitSpeechRecognition` / `SpeechRecognition`.
- **Limitation:** While Google Chrome, Microsoft Edge, and Safari provide full native support, Mozilla Firefox requires specific user flags or falls back to standard text area input.
- **Handling:** The interview UI detects microphone availability and gracefully allows students to type their interview answers if voice input is unsupported.

---

## 5. Distributed State & Horizontal Scaling

### 5.1 In-Memory Rate Limiting
- **Current Behavior:** The brute-force login defense uses an in-memory sliding-window rate limiter per worker process.
- **Scale Horizon:** In a multi-server cluster running across multiple physical nodes, an external distributed cache (such as Redis) is recommended to synchronize rate limits across instances.

### 5.2 Transactional Email Delivery
- **Current Behavior:** Email notifications are dispatched only when production SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`) are configured.
- **Handling:** In local development or staging environments without SMTP, email dispatch is safely skipped while in-app notification badges and records are always persisted in the database.

