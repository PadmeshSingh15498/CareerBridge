"use client";

import React, { useState } from "react";
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Building2,
  GraduationCap,
  Bell,
  Save,
  RefreshCw
} from "lucide-react";

import WorkspaceShell from "@/components/layout/WorkspaceShell";

export default function AdminSettingsPage() {
  const [minCgpa, setMinCgpa] = useState("6.00");
  const [maxBacklogs, setMaxBacklogs] = useState("0");
  const [requireJobApproval, setRequireJobApproval] = useState(true);
  const [requireCompanyVerification, setRequireCompanyVerification] = useState(true);
  const [academicYear, setAcademicYear] = useState("2026");
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast("Institutional placement policies saved successfully!");
    }, 600);
  };

  return (
    <WorkspaceShell role="admin" activeTabTitle="Settings">
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 bg-cb-card border border-cb-teal/40 text-cb-teal px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in font-mono text-sm">
            <CheckCircle2 className="w-4 h-4 text-cb-teal shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="pb-6 border-b border-cb-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-cb-teal/10 text-cb-teal border border-cb-teal/20">
              System Configuration
            </span>
            <span className="text-xs font-mono text-cb-muted">Directorate Policies</span>
          </div>
          <h1 className="text-2xl font-bold text-cb-primary tracking-tight">
            Placement Policies & Platform Rules
          </h1>
          <p className="text-sm text-cb-secondary mt-1">
            Configure institutional baseline eligibility standards, employer verification rules, and job approval governance.
          </p>
        </div>

        <form onSubmit={handleSavePolicies} className="space-y-6">
          {/* 1. Baseline Eligibility Policy */}
          <div className="p-6 rounded-xl bg-cb-card border border-cb-border space-y-4">
            <div className="flex items-center gap-2 text-cb-primary font-bold text-sm">
              <GraduationCap className="w-5 h-5 text-cb-teal" />
              <span>Campus Drive Baseline Eligibility Policy</span>
            </div>
            <p className="text-xs text-cb-secondary">
              Defines the standard criteria used to calculate institutional eligible student counts on the dashboard.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono text-cb-secondary mb-1.5">
                  Minimum Baseline CGPA Threshold
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="10"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-cb-card-hover border border-cb-border text-xs font-mono text-cb-primary focus:outline-none focus:border-cb-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-cb-secondary mb-1.5">
                  Maximum Standing Backlogs Permitted
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={maxBacklogs}
                  onChange={(e) => setMaxBacklogs(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-cb-card-hover border border-cb-border text-xs font-mono text-cb-primary focus:outline-none focus:border-cb-teal"
                />
              </div>
            </div>
          </div>

          {/* 2. Employer Verification & Requisition Gating */}
          <div className="p-6 rounded-xl bg-cb-card border border-cb-border space-y-4">
            <div className="flex items-center gap-2 text-cb-primary font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-cb-primary" />
              <span>Employer Gating & Approval Governance</span>
            </div>
            <p className="text-xs text-cb-secondary">
              Strict controls governing employer verification and placement officer review prior to campus publication.
            </p>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3.5 rounded-lg bg-cb-card-hover border border-cb-border/60 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-cb-primary">
                    Mandatory TPO Review for Job Postings
                  </div>
                  <div className="text-[11px] text-cb-secondary mt-0.5">
                    When enabled, recruiter postings enter 'Pending Approval' queue until verified by TPO.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={requireJobApproval}
                  onChange={(e) => setRequireJobApproval(e.target.checked)}
                  className="rounded border-cb-border text-cb-teal focus:ring-0 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-lg bg-cb-card-hover border border-cb-border/60 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-cb-primary">
                    Enforce Corporate Organization Verification
                  </div>
                  <div className="text-[11px] text-cb-secondary mt-0.5">
                    Unverified recruiting companies cannot publish active requisitions to students.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={requireCompanyVerification}
                  onChange={(e) => setRequireCompanyVerification(e.target.checked)}
                  className="rounded border-cb-border text-cb-teal focus:ring-0 w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* 3. Cohort Year Settings */}
          <div className="p-6 rounded-xl bg-cb-card border border-cb-border space-y-4">
            <div className="flex items-center gap-2 text-cb-primary font-bold text-sm">
              <Sliders className="w-5 h-5 text-cb-orange" />
              <span>Active Placement Cycle</span>
            </div>

            <div className="max-w-xs">
              <label className="block text-xs font-mono text-cb-secondary mb-1.5">
                Current Graduation Batch
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-cb-card-hover border border-cb-border text-xs font-mono text-cb-primary focus:outline-none"
              >
                <option value="2026">Class of 2026 (Active Placement Year)</option>
                <option value="2025">Class of 2025 (Previous Cohort)</option>
                <option value="2027">Class of 2027 (Internship Batch)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-cb-teal text-cb-bg hover:bg-cb-teal/90 text-xs font-mono font-semibold flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Policies...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </WorkspaceShell>
  );
}
