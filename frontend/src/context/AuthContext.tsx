"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiService } from "@/lib/api";

export interface UserProfile {
  id: string;
  email: string;
  role: "student" | "recruiter" | "tpo" | "admin";
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  details?: Record<string, any>;
}

interface AuthContextType {
  user: UserProfile | null;
  role: "student" | "recruiter" | "tpo" | "admin" | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  registerStudent: (data: any) => Promise<UserProfile>;
  registerRecruiter: (data: any) => Promise<UserProfile>;
  registerAdmin: (data: any) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const getDashboardRouteForRole = (role: string): string => {
    if (role === "student") return "/student/dashboard";
    if (role === "recruiter") return "/recruiter/dashboard";
    return "/admin/dashboard";
  };

  const refreshProfile = useCallback(async () => {
    try {
      const res = await apiService.getMe();
      if (res && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await apiService.login({ email, password });
      if (!res.success || !res.data) {
        throw new Error(res.message || "Authentication failed.");
      }

      // Rehydrate full user profile via /auth/me using the newly set HttpOnly cookie
      const meRes = await apiService.getMe();
      const authenticatedUser = meRes.data;
      setUser(authenticatedUser);

      // Auto-redirect to the appropriate role-specific dashboard
      const targetRoute = getDashboardRouteForRole(authenticatedUser.role);
      router.push(targetRoute);
      return authenticatedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const registerStudent = async (data: any): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await apiService.registerStudent(data);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Student registration failed.");
      }

      const meRes = await apiService.getMe();
      const authenticatedUser = meRes.data;
      setUser(authenticatedUser);
      router.push("/student/dashboard");
      return authenticatedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const registerRecruiter = async (data: any): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await apiService.registerRecruiter(data);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Recruiter registration failed.");
      }

      const meRes = await apiService.getMe();
      const authenticatedUser = meRes.data;
      setUser(authenticatedUser);
      router.push("/recruiter/dashboard");
      return authenticatedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const registerAdmin = async (data: any): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await apiService.registerAdmin(data);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Administrator provisioning failed.");
      }

      const meRes = await apiService.getMe();
      const authenticatedUser = meRes.data;
      setUser(authenticatedUser);
      router.push("/admin/dashboard");
      return authenticatedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiService.logout();
    } catch (e) {
      // Ignore logout errors
    } finally {
      setUser(null);
      setIsLoading(false);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerStudent,
        registerRecruiter,
        registerAdmin,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

