export type UserRole = "student" | "recruiter" | "tpo" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_id: string;
  email: string;
  role: UserRole;
}

export interface ResponseEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface DatabaseStatus {
  status: "healthy" | "unhealthy" | "degraded";
  dialect: string;
  detail: string;
}

export interface HealthCheckData {
  status: string;
  version: string;
  environment: string;
  database: DatabaseStatus;
}

