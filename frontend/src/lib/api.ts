import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { HealthCheckData, ResponseEnvelope } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true, // Automatically sends and receives HttpOnly, Secure cookies
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response Interceptor: Silent refresh on 401 using HttpOnly cookie
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 occurs and this request hasn't been retried yet (and isn't the login/refresh endpoint itself)
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt silent refresh via HttpOnly cookie
        await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );
        processQueue();
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Clear public user metadata on fatal refresh failure
        if (typeof window !== "undefined") {
          localStorage.removeItem("cb_user_metadata");
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Core API Service Functions
export const apiService = {
  // Health Check
  async getHealth(): Promise<ResponseEnvelope<HealthCheckData>> {
    const res = await apiClient.get<ResponseEnvelope<HealthCheckData>>("/health");
    return res.data;
  },

  // Auth Methods
  async login(payload: { email: string; password: string }) {
    const res = await apiClient.post("/auth/login", payload);
    return res.data;
  },

  async registerStudent(payload: any) {
    const res = await apiClient.post("/auth/register/student", payload);
    return res.data;
  },

  async registerRecruiter(payload: any) {
    const res = await apiClient.post("/auth/register/recruiter", payload);
    return res.data;
  },

  async registerAdmin(payload: any) {
    const res = await apiClient.post("/auth/register/admin", payload);
    return res.data;
  },

  async register(payload: any) {
    const res = await apiClient.post("/auth/register", payload);
    return res.data;
  },

  async logout() {
    const res = await apiClient.post("/auth/logout");
    return res.data;
  },

  async forgotPassword(payload: { email: string }) {
    const res = await apiClient.post("/auth/forgot-password", payload);
    return res.data;
  },

  async resetPassword(payload: { token: string; new_password: string }) {
    const res = await apiClient.post("/auth/reset-password", payload);
    return res.data;
  },

  async verifyEmail(payload: { token: string }) {
    const res = await apiClient.post("/auth/verify-email", payload);
    return res.data;
  },

  async getMe() {
    const res = await apiClient.get("/auth/me");
    return res.data;
  },

  // Student Profile Management
  async getMyProfile() {
    const res = await apiClient.get("/students/me/profile");
    return res.data;
  },

  async updatePersonalInfo(payload: any) {
    const res = await apiClient.put("/students/me/profile/personal", payload);
    return res.data;
  },

  async updateAcademicRecord(payload: any) {
    const res = await apiClient.put("/students/me/profile/academic", payload);
    return res.data;
  },

  async addSkill(payload: { name: string; category?: string; proficiency_level?: string }) {
    const res = await apiClient.post("/students/me/skills", payload);
    return res.data;
  },

  async removeSkill(skillId: number) {
    const res = await apiClient.delete(`/students/me/skills/${skillId}`);
    return res.data;
  },

  async createProject(payload: any) {
    const res = await apiClient.post("/students/me/projects", payload);
    return res.data;
  },

  async updateProject(projectId: string, payload: any) {
    const res = await apiClient.put(`/students/me/projects/${projectId}`, payload);
    return res.data;
  },

  async deleteProject(projectId: string) {
    const res = await apiClient.delete(`/students/me/projects/${projectId}`);
    return res.data;
  },

  async createCertification(payload: any) {
    const res = await apiClient.post("/students/me/certifications", payload);
    return res.data;
  },

  async deleteCertification(certId: string) {
    const res = await apiClient.delete(`/students/me/certifications/${certId}`);
    return res.data;
  },

  async createExperience(payload: any) {
    const res = await apiClient.post("/students/me/experience", payload);
    return res.data;
  },

  async updateExperience(expId: string, payload: any) {
    const res = await apiClient.put(`/students/me/experience/${expId}`, payload);
    return res.data;
  },

  async deleteExperience(expId: string) {
    const res = await apiClient.delete(`/students/me/experience/${expId}`);
    return res.data;
  },

  async getProfileCompletion() {
    const res = await apiClient.get("/students/me/completion");
    return res.data;
  },

  // Resume Intelligence & Extraction
  async uploadResume(formData: FormData) {
    const res = await apiClient.post("/resumes/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async reuploadResume(resumeId: string, formData: FormData) {
    const res = await apiClient.post(`/resumes/${resumeId}/reupload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async getMyResumes() {
    const res = await apiClient.get("/resumes/my");
    return res.data;
  },

  async getResumeDetail(resumeId: string) {
    const res = await apiClient.get(`/resumes/${resumeId}`);
    return res.data;
  },

  async deleteResume(resumeId: string) {
    const res = await apiClient.delete(`/resumes/${resumeId}`);
    return res.data;
  },

  async applyExtractedData(resumeId: string, payload: any) {
    const res = await apiClient.post(`/resumes/${resumeId}/apply-extracted`, payload);
    return res.data;
  },

  // AI Resume Analyzer (Phase 8)
  async analyzeResume(resumeId: string, weights?: Record<string, number>) {
    const res = await apiClient.post(`/resumes/${resumeId}/analyze`, weights ? { weights_input: weights } : {});
    return res.data;
  },

  async analyzeResumeForJob(resumeId: string, payload: { job_id: string; weights?: Record<string, number> }) {
    const res = await apiClient.post(`/resumes/${resumeId}/analyze-job`, payload);
    return res.data;
  },

  async getResumeAnalysis(resumeId: string) {
    const res = await apiClient.get(`/resumes/${resumeId}/analysis`);
    return res.data;
  },

  async getResumeAnalysisHistory(resumeId: string) {
    const res = await apiClient.get(`/resumes/${resumeId}/analysis-history`);
    return res.data;
  },

  getResumePdfExportUrl(resumeId: string, historyId?: string) {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${base}/api/v1/resumes/${resumeId}/analysis/export-pdf${historyId ? `?history_id=${historyId}` : ""}`;
  },

  // Job Catalog & Requisitions
  async getJobs(params?: Record<string, any>) {
    const res = await apiClient.get("/jobs", { params });
    return res.data;
  },

  async getSavedJobs(params?: Record<string, any>) {
    const res = await apiClient.get("/jobs/saved/all", { params });
    return res.data;
  },

  async getJobDetail(jobId: string) {
    const res = await apiClient.get(`/jobs/${jobId}`);
    return res.data;
  },

  async createJob(payload: any) {
    const res = await apiClient.post("/jobs", payload);
    return res.data;
  },

  async toggleSaveJob(jobId: string) {
    const res = await apiClient.post(`/jobs/${jobId}/save`);
    return res.data;
  },

  async approveJob(jobId: string, approved: boolean = true) {
    const res = await apiClient.put(`/jobs/${jobId}/approve`, null, {
      params: { approved },
    });
    return res.data;
  },

  async updateJobStatus(jobId: string, newStatus: string) {
    const res = await apiClient.put(`/jobs/${jobId}/status`, null, {
      params: { new_status: newStatus },
    });
    return res.data;
  },

  // Applications & Pipeline
  async applyToJob(payload: { job_id: string; resume_id: string; cover_letter?: string }) {
    const res = await apiClient.post("/applications/apply", payload);
    return res.data;
  },

  async getMyApplications() {
    const res = await apiClient.get("/applications/my");
    return res.data;
  },

  async getRecruiterApplications(params?: { job_id?: string; status?: string }) {
    const res = await apiClient.get("/applications/recruiter", { params });
    return res.data;
  },

  async updateApplicationStatus(applicationId: string, payload: { new_status: string; change_reason?: string }) {
    const res = await apiClient.put(`/applications/${applicationId}/status`, payload);
    return res.data;
  },

  async withdrawApplication(applicationId: string, payload?: { reason?: string }) {
    const res = await apiClient.post(`/applications/${applicationId}/withdraw`, payload || {});
    return res.data;
  },

  async scheduleInterview(applicationId: string, payload: {
    round_name: string;
    scheduled_start: string;
    scheduled_end: string;
    meeting_link?: string;
    venue?: string;
    interviewer_name?: string;
  }) {
    const res = await apiClient.post(`/applications/${applicationId}/schedule-interview`, payload);
    return res.data;
  },

  // Intelligent Job Matching (Opportunity Radar)
  async getOpportunityRadar(params?: {
    category?: string;
    min_score?: number;
    workplace_type?: string;
    location?: string;
    sort_by?: string;
    limit?: number;
  }) {
    const res = await apiClient.get("/jobs/recommendations/radar", { params });
    return res.data;
  },

  async getJobRadarMatch(jobId: string) {
    const res = await apiClient.get(`/jobs/${jobId}/radar-match`);
    return res.data;
  },

  async getMatchingBenchmark() {
    const res = await apiClient.get("/jobs/recommendations/benchmark");
    return res.data;
  },

  // Phase 10: Career Intelligence, Skill Gap & Roadmap APIs
  async getTargetRoles(category?: string) {
    const res = await apiClient.get("/career-intelligence/roles", { params: { category } });
    return res.data;
  },

  async getTargetRoleDetail(roleName: string) {
    const res = await apiClient.get(`/career-intelligence/roles/${encodeURIComponent(roleName)}`);
    return res.data;
  },

  async createCustomRole(payload: { role_name: string; skills?: string[] }) {
    const res = await apiClient.post("/career-intelligence/roles", payload);
    return res.data;
  },

  async analyzeSkillGap(targetRole: string) {
    const res = await apiClient.post("/career-intelligence/skill-gap/analyze", { target_role: targetRole });
    return res.data;
  },

  async getLatestSkillGap() {
    const res = await apiClient.get("/career-intelligence/skill-gap/latest");
    return res.data;
  },

  async generateRoadmap(payload: { target_role: string; force_regenerate?: boolean }) {
    const res = await apiClient.post("/career-intelligence/roadmap/generate", payload);
    return res.data;
  },

  async getActiveRoadmap() {
    const res = await apiClient.get("/career-intelligence/roadmap/active");
    return res.data;
  },

  async updateRoadmapMilestone(
    itemId: number,
    payload: {
      status?: string;
      notes?: string;
      evidence_url?: string;
      evidence_notes?: string;
      is_completed?: boolean;
    }
  ) {
    const res = await apiClient.patch(`/career-intelligence/roadmap/items/${itemId}`, payload);
    return res.data;
  },

  async getCareerReadinessIndex(recordSnapshot: boolean = true) {
    const res = await apiClient.get("/career-intelligence/readiness-index", {
      params: { record_snapshot: recordSnapshot }
    });
    return res.data;
  },

  async getReadinessHistory(limit: number = 10) {
    const res = await apiClient.get("/career-intelligence/readiness-index/history", {
      params: { limit }
    });
    return res.data;
  },

  // Phase 11: BridgeAI Career Assistant APIs
  async getBridgeAIPrompts() {
    const res = await apiClient.get("/bridge-ai/prompts");
    return res.data;
  },

  async getBridgeAIConversations() {
    const res = await apiClient.get("/bridge-ai/conversations");
    return res.data;
  },

  async createBridgeAIConversation(payload?: { title?: string; context_type?: string }) {
    const res = await apiClient.post("/bridge-ai/conversations", payload || {});
    return res.data;
  },

  async getBridgeAIConversation(conversationId: string) {
    const res = await apiClient.get(`/bridge-ai/conversations/${conversationId}`);
    return res.data;
  },

  async deleteBridgeAIConversation(conversationId: string) {
    const res = await apiClient.delete(`/bridge-ai/conversations/${conversationId}`);
    return res.data;
  },

  async sendBridgeAIMessage(conversationId: string, content: string) {
    const res = await apiClient.post(`/bridge-ai/conversations/${conversationId}/messages`, {
      content
    });
    return res.data;
  },

  // Phase 12: Recruiter Workspace & Candidate Intelligence
  async getRecruiterCompanyProfile(companyId?: string) {
    const res = await apiClient.get("/recruiter/company", {
      params: companyId ? { company_id: companyId } : undefined
    });
    return res.data;
  },

  async updateRecruiterCompanyProfile(payload: {
    name?: string;
    website_url?: string;
    industry?: string;
    company_size?: string;
    headquarters?: string;
    logo_url?: string;
    description?: string;
    hr_contact_name?: string;
    hr_contact_email?: string;
    hr_contact_phone?: string;
  }) {
    const res = await apiClient.put("/recruiter/company", payload);
    return res.data;
  },

  async getRecruiterDashboardMetrics() {
    const res = await apiClient.get("/recruiter/dashboard/metrics");
    return res.data;
  },

  async generateJobDescription(payload: {
    job_title: string;
    industry?: string;
    experience_level?: string;
    workplace_type?: string;
    core_skills?: string[];
    key_responsibilities?: string;
    company_context?: string;
  }) {
    const res = await apiClient.post("/recruiter/jobs/generate-description", payload);
    return res.data;
  },

  async getRecruiterJobs(status?: string) {
    const res = await apiClient.get("/recruiter/jobs", {
      params: status ? { status } : undefined
    });
    return res.data;
  },

  async createRecruiterJob(payload: any) {
    const res = await apiClient.post("/recruiter/jobs", payload);
    return res.data;
  },

  async updateRecruiterJobStatus(jobId: string, newStatus: string) {
    const res = await apiClient.put(`/recruiter/jobs/${jobId}/status`, null, {
      params: { new_status: newStatus }
    });
    return res.data;
  },

  async getRecruiterCandidates(params?: {
    job_id?: string;
    skill?: string;
    min_cgpa?: number;
    degree?: string;
    department?: string;
    graduation_year?: number;
    status?: string;
    search?: string;
    sort_by?: string;
    page?: number;
    page_size?: number;
  }) {
    const res = await apiClient.get("/recruiter/candidates", { params });
    return res.data;
  },

  async getCandidateApplicationDetail(applicationId: string) {
    const res = await apiClient.get(`/recruiter/candidates/${applicationId}`);
    return res.data;
  },

  async advanceApplicationStage(
    applicationId: string,
    payload: {
      new_status: string;
      change_reason?: string;
      internal_notes?: string;
    }
  ) {
    const res = await apiClient.patch(`/recruiter/applications/${applicationId}/stage`, payload);
    return res.data;
  },

  async updateRecruiterNotes(applicationId: string, notes: string) {
    const res = await apiClient.post(`/recruiter/applications/${applicationId}/notes`, { notes });
    return res.data;
  },

  async scheduleCandidateInterview(
    applicationId: string,
    payload: {
      round_name: string;
      scheduled_start: string;
      scheduled_end: string;
      interview_mode?: string;
      meeting_link?: string;
      venue?: string;
      interviewer_name?: string;
      instructions?: string;
    }
  ) {
    const res = await apiClient.post(`/recruiter/applications/${applicationId}/schedule-interview`, payload);
    return res.data;
  },

  async recordInterviewFeedback(
    interviewId: string,
    payload: {
      technical_rating: number;
      communication_rating: number;
      problem_solving_rating: number;
      recommendation: string;
      detailed_notes?: string;
    }
  ) {
    const res = await apiClient.post(`/recruiter/interviews/${interviewId}/feedback`, payload);
    return res.data;
  },

  // =========================================================================
  // Phase 13: Placement Officer & University Administration APIs
  // =========================================================================

  async getAdminDashboardMetrics() {
    const res = await apiClient.get("/admin/dashboard");
    return res.data;
  },

  async getAdminStudents(params?: {
    search?: string;
    department?: string;
    graduation_year?: number;
    placement_status?: string;
    is_verified?: boolean;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }) {
    const res = await apiClient.get("/admin/students", { params });
    return res.data;
  },

  async updateStudentStatus(
    studentId: string,
    payload: {
      is_verified?: boolean;
      is_active?: boolean;
      placement_status?: string;
    }
  ) {
    const res = await apiClient.put(`/admin/students/${studentId}/status`, payload);
    return res.data;
  },

  async importStudentsCsv(file?: File, csvText?: string) {
    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    if (csvText) {
      formData.append("csv_text", csvText);
    }
    const res = await apiClient.post("/admin/students/import-csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async exportStudentsCsv(params?: {
    department?: string;
    graduation_year?: number;
    placement_status?: string;
  }) {
    const res = await apiClient.get("/admin/students/export-csv", {
      params,
      responseType: "blob",
    });
    return res.data;
  },

  async getAdminRecruiters(params?: { search?: string; status_filter?: string }) {
    const res = await apiClient.get("/admin/recruiters", { params });
    return res.data;
  },

  async actionRecruiter(companyId: string, payload: { action: string; reason?: string }) {
    const res = await apiClient.post(`/admin/recruiters/${companyId}/action`, payload);
    return res.data;
  },

  async getAdminJobs(params?: { status_filter?: string; search?: string }) {
    const res = await apiClient.get("/admin/jobs", { params });
    return res.data;
  },

  async actionJob(jobId: string, payload: { action: string; comments?: string }) {
    const res = await apiClient.post(`/admin/jobs/${jobId}/action`, payload);
    return res.data;
  },

  async getAdminDrives(params?: { academic_year?: number; status_filter?: string }) {
    const res = await apiClient.get("/admin/drives", { params });
    return res.data;
  },

  async createAdminDrive(payload: {
    title: string;
    company_id: string;
    academic_year: number;
    drive_date: string;
    registration_deadline: string;
    min_cgpa: number;
    max_backlogs_allowed: number;
    number_of_openings: number;
    job_roles: string[];
    allowed_departments: string[];
    selection_rounds: string[];
    venue: string;
  }) {
    const res = await apiClient.post("/admin/drives", payload);
    return res.data;
  },

  async getDriveEligibleStudents(driveId: string) {
    const res = await apiClient.get(`/admin/drives/${driveId}/eligible-students`);
    return res.data;
  },

  async registerStudentForDrive(driveId: string, studentId: string) {
    const res = await apiClient.post(`/admin/drives/${driveId}/register-student`, { student_id: studentId });
    return res.data;
  },

  async getAdminPlacementAnalytics(academicYear?: number) {
    const res = await apiClient.get("/admin/analytics", { params: { academic_year: academicYear || 2026 } });
    return res.data;
  },

  async downloadAdminReport(
    reportType: "summary-pdf" | "department-csv" | "company-csv" | "student-csv" | "drive-csv"
  ) {
    const res = await apiClient.get(`/admin/reports/${reportType}`, {
      responseType: "blob",
    });
    return res.data;
  },

  async getAdminAuditLogs(limit: number = 50) {
    const res = await apiClient.get("/admin/audit-logs", { params: { limit } });
    return res.data;
  },

  // =========================================================================
  // Phase 14: Notifications & Alert Preferences APIs
  // =========================================================================

  async getNotifications(params?: {
    category?: string;
    is_read?: boolean;
    page?: number;
    page_size?: number;
  }) {
    const res = await apiClient.get("/notifications", { params });
    return res.data;
  },

  async getNotificationUnreadCount() {
    const res = await apiClient.get("/notifications/unread-count");
    return res.data;
  },

  async markNotificationAsRead(notificationId: string) {
    const res = await apiClient.put(`/notifications/${notificationId}/read`);
    return res.data;
  },

  async markAllNotificationsAsRead() {
    const res = await apiClient.put("/notifications/mark-all-read");
    return res.data;
  },

  async getNotificationPreferences() {
    const res = await apiClient.get("/notifications/preferences");
    return res.data;
  },

  async updateNotificationPreferences(payload: {
    email_notifications?: boolean;
    job_recommendations?: boolean;
    application_updates?: boolean;
    interview_alerts?: boolean;
    placement_drives?: boolean;
    learning_milestones?: boolean;
  }) {
    const res = await apiClient.put("/notifications/preferences", payload);
    return res.data;
  },

  // =========================================================================
  // Phase 14: AI Interview Preparation APIs
  // =========================================================================

  async startInterviewSession(payload: {
    target_role: string;
    company_target?: string;
    interview_type: string;
    difficulty: string;
    topics?: string[];
    total_questions?: number;
  }) {
    const res = await apiClient.post("/interview-prep/sessions", payload);
    return res.data;
  },

  async submitInterviewAnswer(
    sessionId: string,
    payload: {
      question_id: number;
      answer_text: string;
      audio_transcript?: string;
    }
  ) {
    const res = await apiClient.post(`/interview-prep/sessions/${sessionId}/answer`, payload);
    return res.data;
  },

  async getInterviewSessionDetail(sessionId: string) {
    const res = await apiClient.get(`/interview-prep/sessions/${sessionId}`);
    return res.data;
  },

  async getInterviewHistory() {
    const res = await apiClient.get("/interview-prep/history");
    return res.data;
  },

  async transcribeInterviewAudio(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/interview-prep/transcribe", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export const api = apiService;
