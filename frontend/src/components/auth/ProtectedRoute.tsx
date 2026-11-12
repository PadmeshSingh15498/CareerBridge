"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"student" | "recruiter" | "tpo" | "admin">;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cb-cream flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="w-12 h-12 rounded-xl bg-cb-forest flex items-center justify-center shadow-md">
            <span className="font-heading font-black text-xl text-cb-lime tracking-tight">CB</span>
          </div>
          <div className="flex items-center gap-2 text-cb-forest font-mono text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-cb-forest" />
            <span>Verifying session credentials...</span>
          </div>
          <p className="text-xs text-cb-secondary">
            CareerBridge secure token verification in progress.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  // Check role authorization if restricted
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    const roleTarget =
      role === "student"
        ? "/student/dashboard"
        : role === "recruiter"
        ? "/recruiter/dashboard"
        : "/admin/dashboard";

    return (
      <div className="min-h-screen bg-cb-cream flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-cb-card border border-cb-border rounded-xl p-6 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-bold text-lg text-cb-primary mb-2">
            Restricted Workspace
          </h2>
          <p className="text-xs text-cb-secondary leading-relaxed mb-6">
            Your current account role (<span className="font-mono font-semibold text-cb-primary uppercase">{role}</span>) does not have authorization to view this area.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={roleTarget}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cb-forest text-cb-cream text-xs font-semibold rounded-lg hover:bg-cb-dark transition-all"
            >
              <span>Go to My Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 text-cb-lime" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2.5 border border-cb-border text-cb-secondary text-xs font-medium rounded-lg hover:bg-cb-card-alt hover:text-cb-primary transition-all"
            >
              Switch Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;


