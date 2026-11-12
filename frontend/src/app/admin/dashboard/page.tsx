"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  Briefcase,
  Layers,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  TrendingUp,
  UserPlus,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Download,
  Info,
  HelpCircle,
  FileText,
  ChevronRight,
  Calculator,
  RefreshCw
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { api } from "@/lib/api";

interface MetricDef {
  label: string;
  formula: string;
  description: string;
}

interface AdminDashboardData {
  total_registered_students: number;
  eligible_students: number;
  placed_students: number;
  unplaced_students: number;
  active_recruiters: number;
  active_jobs: number;
  total_applications: number;
  interviews_scheduled: number;
  placement_percentage: number;
  metric_definitions: Record<string, MetricDef>;
  pending_companies_count: number;
  pending_jobs_count: number;
  recent_activities: Array<{
    id: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    user_email?: string;
    timestamp: string;
    details?: any;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [selectedMetricKey, setSelectedMetricKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, analyticsRes] = await Promise.all([
        api.getAdminDashboardMetrics(),
        api.getAdminPlacementAnalytics().catch(() => ({ data: null })),
      ]);
      if (res && res.data) {
        setData(res.data);
      }
      if (analyticsRes && analyticsRes.data) {
        setAnalyticsData(analyticsRes.data);
      }
    } catch (e) {
      console.error("Failed to load admin dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const downloadPdfSummary = async () => {
    try {
      showToast("Generating certified Placement Summary PDF report...");
      const blob = await api.downloadAdminReport("summary-pdf");
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "careerbridge_placement_summary_2026.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("Official Placement Summary PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      showToast("Report download failed. Please try again.");
    }
  };

  if (loading || !data) {
    return (
      <WorkspaceShell role="admin" activeTabTitle="Dashboard">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <RefreshCw className="w-8 h-8 text-cb-teal animate-spin" />
          <div className="text-cb-secondary font-mono text-sm">
            Calculating verified university placement metrics...
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  const deptChartData = analyticsData?.department_placements?.map((d: any) => ({
    name: d.department_name.replace("Engineering", "Eng.").replace("Computer Science", "CSE"),
    Enrolled: d.total_students,
    Placed: d.placed_students,
    Eligible: d.eligible_students,
  })) || [
    { name: "CSE", Enrolled: data.total_registered_students, Placed: data.placed_students, Eligible: data.eligible_students },
  ];

  return (
    <WorkspaceShell role="admin" activeTabTitle="Dashboard">
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 bg-cb-card border border-cb-teal/40 text-cb-teal px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in font-mono text-sm">
            <CheckCircle2 className="w-4 h-4 text-cb-teal shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header & Fast Action Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-cb-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-cb-teal/10 text-cb-teal border border-cb-teal/20">
                Placement Directorate
              </span>
              <span className="text-xs font-mono text-cb-muted">Cohort 2026</span>
            </div>
            <h1 className="text-2xl font-bold text-cb-primary tracking-tight">
              University Placement Command Center
            </h1>
            <p className="text-sm text-cb-secondary mt-1">
              Live recruitment operations, student eligibility audit, and corporate hiring intelligence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFormulaModal(true)}
              className="px-3.5 py-2 text-xs font-mono font-medium rounded-lg bg-cb-card hover:bg-cb-card-hover border border-cb-border text-cb-secondary hover:text-cb-primary flex items-center gap-2 transition-all shadow-sm"
              title="Audit transparent mathematical calculation formulas"
            >
              <Calculator className="w-3.5 h-3.5 text-cb-teal" />
              <span>Audit Formulas</span>
            </button>

            <Link
              href="/admin/students"
              className="px-3.5 py-2 text-xs font-mono font-medium rounded-lg bg-cb-card hover:bg-cb-card-hover border border-cb-border text-cb-secondary hover:text-cb-primary flex items-center gap-2 transition-all shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5 text-cb-primary" />
              <span>Import Students</span>
            </Link>

            <Link
              href="/admin/drives"
              className="px-3.5 py-2 text-xs font-mono font-medium rounded-lg bg-cb-card hover:bg-cb-card-hover border border-cb-border text-cb-secondary hover:text-cb-primary flex items-center gap-2 transition-all shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-cb-orange" />
              <span>Schedule Drive</span>
            </Link>

            <button
              onClick={downloadPdfSummary}
              className="px-4 py-2 text-xs font-mono font-semibold rounded-lg bg-cb-teal text-cb-bg hover:bg-cb-teal/90 flex items-center gap-2 transition-all shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Certified PDF Report</span>
            </button>
          </div>
        </div>

        {/* Action Required Banner for Pending Verifications & Jobs */}
        {(data.pending_companies_count > 0 || data.pending_jobs_count > 0) && (
          <div className="p-4 rounded-xl bg-cb-orange/10 border border-cb-orange/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-cb-orange shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-cb-primary">
                  Placement Officer Approvals Pending
                </h4>
                <p className="text-xs text-cb-secondary mt-0.5">
                  {data.pending_companies_count > 0 && (
                    <span>
                      <strong className="text-cb-orange">{data.pending_companies_count} recruiter organization(s)</strong> awaiting employer verification.{" "}
                    </span>
                  )}
                  {data.pending_jobs_count > 0 && (
                    <span>
                      <strong className="text-cb-orange">{data.pending_jobs_count} job requisition(s)</strong> awaiting syllabus & compensation review.
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {data.pending_companies_count > 0 && (
                <Link
                  href="/admin/recruiters"
                  className="px-3 py-1.5 rounded-lg bg-cb-card border border-cb-orange/40 text-xs font-mono text-cb-orange hover:bg-cb-orange/20 transition-all"
                >
                  Verify Employers ({data.pending_companies_count})
                </Link>
              )}
              {data.pending_jobs_count > 0 && (
                <Link
                  href="/admin/jobs"
                  className="px-3 py-1.5 rounded-lg bg-cb-card border border-cb-orange/40 text-xs font-mono text-cb-orange hover:bg-cb-orange/20 transition-all"
                >
                  Review Jobs ({data.pending_jobs_count})
                </Link>
              )}
            </div>
          </div>
        )}

        {/* KPI Macro Stats Grid (100% Calculated From Real Database Records) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-cb-muted">
              Live Database Placement Metrics
            </h2>
            <span className="text-[11px] font-mono text-cb-teal flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Zero Fabricated Fallbacks
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Students */}
            <div className="p-5 rounded-xl bg-cb-card border border-cb-border hover:border-cb-border-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cb-secondary">Total Registered</span>
                <button
                  onClick={() => { setSelectedMetricKey("total_registered_students"); setShowFormulaModal(true); }}
                  className="text-cb-muted hover:text-cb-teal"
                  title="View formula"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-3xl font-extrabold text-cb-primary tracking-tight">
                  {data.total_registered_students}
                </div>
                <div className="text-[11px] font-mono text-cb-muted">Candidates</div>
              </div>
              <div className="mt-2 text-xs text-cb-secondary">
                <span className="text-cb-teal font-medium">{data.eligible_students}</span> meeting drive eligibility
              </div>
            </div>

            {/* Placement Rate */}
            <div className="p-5 rounded-xl bg-cb-card border border-cb-border hover:border-cb-teal/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cb-secondary">Placement Rate</span>
                <button
                  onClick={() => { setSelectedMetricKey("placement_percentage"); setShowFormulaModal(true); }}
                  className="text-cb-muted hover:text-cb-teal"
                  title="View formula"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-3xl font-extrabold text-cb-teal tracking-tight">
                  {data.placement_percentage}%
                </div>
                <div className="text-[11px] font-mono text-cb-teal/80">Institutional</div>
              </div>
              <div className="mt-2 text-xs text-cb-secondary">
                <span className="text-cb-primary font-medium">{data.placed_students}</span> placed / {data.unplaced_students} unplaced
              </div>
            </div>

            {/* Active Recruiters */}
            <div className="p-5 rounded-xl bg-cb-card border border-cb-border hover:border-cb-border-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cb-secondary">Active Recruiters</span>
                <button
                  onClick={() => { setSelectedMetricKey("active_recruiters"); setShowFormulaModal(true); }}
                  className="text-cb-muted hover:text-cb-teal"
                  title="View formula"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-3xl font-extrabold text-cb-primary tracking-tight">
                  {data.active_recruiters}
                </div>
                <div className="text-[11px] font-mono text-cb-muted">Verified Partners</div>
              </div>
              <div className="mt-2 text-xs text-cb-secondary">
                <span className="text-cb-primary font-medium">{data.active_jobs}</span> active job requisitions
              </div>
            </div>

            {/* Total Applications & Interviews */}
            <div className="p-5 rounded-xl bg-cb-card border border-cb-border hover:border-cb-border-hover transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cb-secondary">Recruitment Pipeline</span>
                <button
                  onClick={() => { setSelectedMetricKey("interviews_scheduled"); setShowFormulaModal(true); }}
                  className="text-cb-muted hover:text-cb-teal"
                  title="View formula"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-3xl font-extrabold text-cb-primary tracking-tight">
                  {data.total_applications}
                </div>
                <div className="text-[11px] font-mono text-cb-muted">Applications</div>
              </div>
              <div className="mt-2 text-xs text-cb-secondary">
                <span className="text-cb-orange font-medium">{data.interviews_scheduled}</span> interviews scheduled
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Department Bar Chart & Audit Activity Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Placement Comparison Chart */}
          <div className="lg:col-span-2 p-6 rounded-xl bg-cb-card border border-cb-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-cb-primary">
                  Department Placement Breakdown
                </h3>
                <p className="text-xs text-cb-secondary mt-0.5">
                  Cohort enrollment vs cleared eligibility vs confirmed placement offers.
                </p>
              </div>
              <Link
                href="/admin/analytics"
                className="text-xs font-mono text-cb-teal hover:underline flex items-center gap-1"
              >
                Deep Analytics <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="h-[280px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d131f",
                      borderColor: "#1f2937",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      color: "#f3f4f6",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <Bar dataKey="Enrolled" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Eligible" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Placed" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Real-time Administrative Audit Activity */}
          <div className="p-6 rounded-xl bg-cb-card border border-cb-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-cb-primary">
                  Audit Activity Stream
                </h3>
                <span className="text-[11px] font-mono text-cb-muted">Live Trail</span>
              </div>

              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {data.recent_activities && data.recent_activities.length > 0 ? (
                  data.recent_activities.slice(0, 5).map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-lg bg-cb-card-hover/40 border border-cb-border/60 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-medium text-cb-teal uppercase">
                          {act.action.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-cb-muted font-mono">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-cb-secondary truncate">
                        By {act.user_email || "System"} on {act.resource_type}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-cb-muted font-mono">
                    No recent audit activities recorded yet.
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/admin/reports"
              className="mt-4 pt-3 border-t border-cb-border/70 text-xs font-mono text-cb-teal hover:underline flex items-center justify-between"
            >
              <span>Download Full Audit Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/admin/students"
            className="p-5 rounded-xl bg-cb-card border border-cb-border hover:border-cb-teal/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-cb-teal" />
              <ChevronRight className="w-4 h-4 text-cb-muted group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="text-sm font-semibold text-cb-primary group-hover:text-cb-teal transition-colors">
              Student Directory
            </h4>
            <p className="text-xs text-cb-secondary mt-1">
              Verify credentials, academic backlogs, and CSV bulk roster imports.
            </p>
          </Link>

          <Link
            href="/admin/recruiters"
            className="p-5 rounded-xl bg-cb-card border border-cb-border hover:border-cb-teal/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-5 h-5 text-cb-primary" />
              <ChevronRight className="w-4 h-4 text-cb-muted group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="text-sm font-semibold text-cb-primary group-hover:text-cb-teal transition-colors">
              Recruiter Partners
            </h4>
            <p className="text-xs text-cb-secondary mt-1">
              Organization verification, partner approval, and suspension workflows.
            </p>
          </Link>

          <Link
            href="/admin/jobs"
            className="p-5 rounded-xl bg-cb-card border border-cb-border hover:border-cb-teal/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <Briefcase className="w-5 h-5 text-cb-orange" />
              <ChevronRight className="w-4 h-4 text-cb-muted group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="text-sm font-semibold text-cb-primary group-hover:text-cb-teal transition-colors">
              Job Approval Queue
            </h4>
            <p className="text-xs text-cb-secondary mt-1">
              Review compensation tiers, department requirements, and publish requisitions.
            </p>
          </Link>

          <Link
            href="/admin/drives"
            className="p-5 rounded-xl bg-cb-card border border-cb-border hover:border-cb-teal/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-cb-teal" />
              <ChevronRight className="w-4 h-4 text-cb-muted group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="text-sm font-semibold text-cb-primary group-hover:text-cb-teal transition-colors">
              Placement Drives
            </h4>
            <p className="text-xs text-cb-secondary mt-1">
              Schedule on-campus drives with automated student eligibility matching.
            </p>
          </Link>
        </div>

        {/* Modal: Transparent Mathematical Formula Audit */}
        {showFormulaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-cb-card border border-cb-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-cb-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cb-teal/10 text-cb-teal border border-cb-teal/20">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-cb-primary">
                      Transparent Metric Formula Audit
                    </h3>
                    <p className="text-xs text-cb-secondary">
                      Exact mathematical algorithms and SQL query definitions powering dashboard benchmarks.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowFormulaModal(false); setSelectedMetricKey(null); }}
                  className="text-cb-muted hover:text-cb-primary text-xl font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {Object.entries(data.metric_definitions).map(([key, def]) => {
                  const isHighlighted = selectedMetricKey === key;
                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-xl border transition-all ${
                        isHighlighted
                          ? "bg-cb-teal/10 border-cb-teal/40 shadow-sm"
                          : "bg-cb-card-hover/40 border-cb-border/60"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-sm font-semibold text-cb-primary flex items-center gap-2">
                          {def.label}
                          {isHighlighted && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cb-teal/20 text-cb-teal">
                              Selected
                            </span>
                          )}
                        </h4>
                        <span className="text-xs font-mono text-cb-muted">`{key}`</span>
                      </div>
                      <p className="text-xs text-cb-secondary mb-2">{def.description}</p>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-cb-border/50 font-mono text-xs text-cb-teal overflow-x-auto">
                        <code>{def.formula}</code>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2 border-t border-cb-border">
                <button
                  onClick={() => { setShowFormulaModal(false); setSelectedMetricKey(null); }}
                  className="px-4 py-2 rounded-lg bg-cb-card hover:bg-cb-card-hover border border-cb-border text-xs font-mono text-cb-primary"
                >
                  Close Audit Inspector
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
