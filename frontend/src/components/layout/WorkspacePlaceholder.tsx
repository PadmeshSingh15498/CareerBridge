"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";
import WorkspaceShell, { WorkspaceRole } from "./WorkspaceShell";

interface WorkspacePlaceholderProps {
  role: WorkspaceRole;
  title: string;
  subtitle: string;
  badge?: string;
  actionText?: string;
  actionHref?: string;
  children?: React.ReactNode;
}

export const WorkspacePlaceholder: React.FC<WorkspacePlaceholderProps> = ({
  role,
  title,
  subtitle,
  badge = "Feature Ready in Module 5",
  actionText,
  actionHref,
  children,
}) => {
  return (
    <WorkspaceShell role={role} activeTabTitle={title}>
      <div className="space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cb-border pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono text-cb-forest bg-cb-forest/10 px-2 py-0.5 rounded-full font-semibold">
                {badge}
              </span>
            </div>
            <h1 className="font-heading font-bold text-2xl text-cb-primary tracking-tight">
              {title}
            </h1>
            <p className="text-xs text-cb-secondary mt-1">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${role}/dashboard`}
              className="px-3.5 py-1.5 border border-cb-border bg-cb-card hover:bg-cb-card-alt text-cb-secondary hover:text-cb-primary rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>

            {actionText && actionHref && (
              <Link
                href={actionHref}
                className="px-4 py-2 bg-cb-forest text-white hover:bg-cb-forest-dark rounded-lg text-xs font-semibold transition-all shadow-xs"
              >
                {actionText}
              </Link>
            )}
          </div>
        </div>

        {/* Content Body */}
        {children ? (
          children
        ) : (
          <div className="p-10 bg-cb-card border border-cb-border rounded-xl shadow-xs text-center max-w-xl mx-auto space-y-4 my-8">
            <div className="w-12 h-12 rounded-full bg-cb-forest/10 text-cb-forest mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-cb-forest" />
            </div>
            <h3 className="font-heading font-bold text-lg text-cb-primary">
              {title} Workspace
            </h3>
            <p className="text-xs text-cb-secondary leading-relaxed">
              This module is wired to the unified role router. Backend persistence and database
              aggregates are connected via `/api/v1/` REST endpoints.
            </p>
            <div className="pt-2">
              <Link
                href={`/${role}/dashboard`}
                className="inline-block px-4 py-2 bg-cb-forest text-white rounded-lg text-xs font-semibold hover:bg-cb-forest-dark transition-all"
              >
                Return to {role.toUpperCase()} Overview
              </Link>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
};

export default WorkspacePlaceholder;

