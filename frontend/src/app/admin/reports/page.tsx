"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  Award,
  Layers,
  Building2,
  Users,
  Calendar,
  AlertCircle
} from "lucide-react";

import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { api } from "@/lib/api";

interface AuditLog {
  id: number;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  timestamp: string;
  details_json?: any;
}

export default function AdminReportsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.getAdminAuditLogs(50);
      if (res && res.data) {
        setAuditLogs(res.data);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDownloadReport = async (
    reportType: "summary-pdf" | "department-csv" | "company-csv" | "student-csv" | "drive-csv",
    fileName: string,
    mimeType: string
  ) => {
    setDownloading(reportType);
    try {
      showToast(`Generating ${fileName}...`);
      const blob = await api.downloadAdminReport(reportType);
      const url = window.URL.createObjectURL(new Blob([blob], { type: mimeType }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`Report '${fileName}' downloaded successfully!`);
    } catch (err) {
      console.error(err);
      showToast("Download failed. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <WorkspaceShell role="admin" activeTabTitle="Reports">
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 bg-cb-card border border-cb-teal/40 text-cb-teal px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in font-mono text-sm">
            <CheckCircle2 className="w-4 h-4 text-cb-teal shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-cb-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-cb-teal/10 text-cb-teal border border-cb-teal/20">
                Institutional Reports
              </span>
              <span className="text-xs font-mono text-cb-muted">Export & Compliance Center</span>
            </div>
            <h1 className="text-2xl font-bold text-cb-primary tracking-tight">
              Placement Summary Reports & Audit Trails
            </h1>
            <p className="text-sm text-cb-secondary mt-1">
              Export certified PyMuPDF PDF placement summaries, department CSV breakdowns, and institutional audit trail records.
            </p>
          </div>
        </div>

        {/* Instant Report Export Cards Grid */}
        <div>
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-cb-muted mb-4">
            Certified Institutional Reports
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Official PDF Summary */}
            <div className="p-6 rounded-xl bg-cb-card border border-cb-border hover:border-cb-teal/40 transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-cb-teal/10 text-cb-teal border border-cb-teal/20">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cb-teal/15 text-cb-teal border border-cb-teal/30">
                    PyMuPDF Certified
                  </span>
                </div>
                <h3 className="font-bold text-base text-cb-primary">
                  Official Placement Summary (PDF)
                </h3>
                <p className="text-xs text-cb-secondary mt-1">
                  Full institutional summary report featuring executive placement benchmarks, department statistics table, and partner company highlights.
                </p>
              </div>

              <button
                disabled={downloading === "summary-pdf"}
                onClick={() =>
                  handleDownloadReport(
                    "summary-pdf",
                    `careerbridge_placement_summary_${new Date().getFullYear()}.pdf`,
                    "application/pdf"
                  )
                }
                className="w-full py-2.5 rounded-lg bg-cb-teal text-cb-bg hover:bg-cb-teal/90 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                {downloading === "summary-pdf" ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Download Certified PDF</span>
              </button>
            </div>

            {/* 2. Department Breakdown CSV */}
            <div className="p-6 rounded-xl bg-cb-card border border-cb-border hover:border-cb-border-hover transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Layers className="w-6 h-6" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cb-card-hover text-cb-secondary border border-cb-border">
                    CSV Format
                  </span>
                </div>
                <h3 className="font-bold text-base text-cb-primary">
                  Department Placement Breakdown
                </h3>
                <p className="text-xs text-cb-secondary mt-1">
                  Department-wise tally of total enrolled candidates, eligible students, placed vs unplaced counts, placement rates, and average CGPAs.
                </p>
              </div>

              <button
                disabled={downloading === "department-csv"}
                onClick={() =>
                  handleDownloadReport(
                    "department-csv",
                    "department_placement_breakdown.csv",
                    "text/csv"
                  )
                }
                className="w-full py-2.5 rounded-lg bg-cb-card-hover hover:bg-cb-border border border-cb-border text-xs font-mono text-cb-primary flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {downloading === "department-csv" ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-cb-teal" />
                )}
                <span>Export Department CSV</span>
              </button>
            </div>

            {/* 3. Company Recruitment CSV */}
            <div className="p-6 rounded-xl bg-cb-card border border-cb-border hover:border-cb-border-hover transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cb-card-hover text-cb-secondary border border-cb-border">
                    CSV Format
                  </span>
                </div>
                <h3 className="font-bold text-base text-cb-primary">
                  Corporate Recruitment Partners
                </h3>
                <p className="text-xs text-cb-secondary mt-1">
                  Summary of recruiting employers, industry classification, HR contacts, verification statuses, active postings, and total confirmed hires.
                </p>
              </div>

              <button
                disabled={downloading === "company-csv"}
                onClick={() =>
                  handleDownloadReport(
                    "company-csv",
                    "company_recruitment_report.csv",
                    "text/csv"
                  )
                }
                className="w-full py-2.5 rounded-lg bg-cb-card-hover hover:bg-cb-border border border-cb-border text-xs font-mono text-cb-primary flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {downloading === "company-csv" ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-cb-teal" />
                )}
                <span>Export Employer CSV</span>
              </button>
            </div>

            {/* 4. Full Student Cohort Report CSV */}
            <div className="p-6 rounded-xl bg-cb-card border border-cb-border hover:border-cb-border-hover transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-cb-orange/10 text-cb-orange border border-cb-orange/20">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cb-card-hover text-cb-secondary border border-cb-border">
                    Full Roster
                  </span>
                </div>
                <h3 className="font-bold text-base text-cb-primary">
                  Student Cohort Placement Report
                </h3>
                <p className="text-xs text-cb-secondary mt-1">
                  Individual candidate records with roll number, degree, department, CGPA, backlogs tally, and confirmed placement statuses.
                </p>
              </div>

              <button
                disabled={downloading === "student-csv"}
                onClick={() =>
                  handleDownloadReport(
                    "student-csv",
                    "student_cohort_placement_roster.csv",
                    "text/csv"
                  )
                }
                className="w-full py-2.5 rounded-lg bg-cb-card-hover hover:bg-cb-border border border-cb-border text-xs font-mono text-cb-primary flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {downloading === "student-csv" ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-cb-teal" />
                )}
                <span>Export Student Roster</span>
              </button>
            </div>

            {/* 5. Drive Participation Report CSV */}
            <div className="p-6 rounded-xl bg-cb-card border border-cb-border hover:border-cb-border-hover transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cb-card-hover text-cb-secondary border border-cb-border">
                    Drives Audit
                  </span>
                </div>
                <h3 className="font-bold text-base text-cb-primary">
                  Placement Drive Participation
                </h3>
                <p className="text-xs text-cb-secondary mt-1">
                  Comprehensive audit of on-campus placement drives, company titles, openings, eligibility filters, and enrolled candidates counts.
                </p>
              </div>

              <button
                disabled={downloading === "drive-csv"}
                onClick={() =>
                  handleDownloadReport(
                    "drive-csv",
                    "drive_participation_summary.csv",
                    "text/csv"
                  )
                }
                className="w-full py-2.5 rounded-lg bg-cb-card-hover hover:bg-cb-border border border-cb-border text-xs font-mono text-cb-primary flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {downloading === "drive-csv" ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-cb-teal" />
                )}
                <span>Export Drive Audit CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Audit Trail Log Table */}
        <div className="p-6 rounded-xl bg-cb-card border border-cb-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-cb-primary">
                Institutional Administrative Audit Trail
              </h3>
              <p className="text-xs text-cb-secondary mt-0.5">
                Immutable security log of student verifications, employer status changes, and job requisition overrides.
              </p>
            </div>
            <button
              onClick={fetchAuditLogs}
              className="text-xs font-mono text-cb-teal hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Trail</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-cb-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-cb-card-hover border-b border-cb-border text-cb-secondary font-mono">
                <tr>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Admin User</th>
                  <th className="px-4 py-2.5">Action Executed</th>
                  <th className="px-4 py-2.5">Resource</th>
                  <th className="px-4 py-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cb-border/60">
                {loadingLogs ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-cb-muted font-mono">
                      <RefreshCw className="w-4 h-4 mx-auto mb-1 text-cb-teal animate-spin" />
                      Loading audit entries...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-cb-muted font-mono">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-cb-card-hover/40 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-cb-muted whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-cb-primary font-medium">
                        {log.user_email || "System Admin"}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-cb-teal uppercase">
                        {log.action.replace("_", " ")}
                      </td>
                      <td className="px-4 py-2.5 text-cb-secondary font-mono">
                        {log.resource_type}
                        {log.resource_id && <span className="text-cb-muted text-[11px]"> ({log.resource_id})</span>}
                      </td>
                      <td className="px-4 py-2.5 text-cb-muted font-mono text-[11px] max-w-xs truncate">
                        {log.details_json ? JSON.stringify(log.details_json) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
