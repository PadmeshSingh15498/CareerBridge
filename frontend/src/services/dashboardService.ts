import { apiClient } from "@/lib/api";
import {
  StudentDashboardData,
  RecruiterDashboardData,
  AdminDashboardData,
} from "@/types/dashboard";
import {
  mockStudentDashboard,
  mockNewStudentEmptyState,
  mockRecruiterDashboard,
  mockAdminDashboard,
} from "./mockData";

export const dashboardService = {
  /**
   * Fetches student workspace intelligence.
   * If isEmptyState is true, returns clean zero-state student data for onboarding inspection.
   */
  async getStudentDashboard(
    isEmptyState: boolean = false
  ): Promise<StudentDashboardData> {
    if (isEmptyState) {
      return mockNewStudentEmptyState;
    }

    try {
      const res = await apiClient.get<StudentDashboardData>(
        "/dashboard/student?demo=true",
        { timeout: 3500 }
      );
      if (res.data && res.data.student_name) {
        return res.data;
      }
      return mockStudentDashboard;
    } catch (error) {
      // Graceful offline fallback to verified mock
      return mockStudentDashboard;
    }
  },

  /**
   * Fetches recruiter talent acquisition workspace intelligence.
   */
  async getRecruiterDashboard(): Promise<RecruiterDashboardData> {
    try {
      const res = await apiClient.get<RecruiterDashboardData>(
        "/dashboard/recruiter?demo=true",
        { timeout: 3500 }
      );
      if (res.data && res.data.company_name) {
        return res.data;
      }
      return mockRecruiterDashboard;
    } catch (error) {
      // Graceful offline fallback to verified mock
      return mockRecruiterDashboard;
    }
  },

  /**
   * Fetches university placement officer / admin command center intelligence.
   */
  async getAdminDashboard(): Promise<AdminDashboardData> {
    try {
      const res = await apiClient.get<AdminDashboardData>("/dashboard/admin", {
        timeout: 3500,
      });
      if (res.data && res.data.institution_name) {
        return res.data;
      }
      return mockAdminDashboard;
    } catch (error) {
      // Graceful offline fallback to verified mock
      return mockAdminDashboard;
    }
  },
};

