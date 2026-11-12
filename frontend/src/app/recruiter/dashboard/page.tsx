"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Calendar,
  CheckCircle,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Building2,
  Clock,
  Eye,
  Filter,
  ExternalLink,
  ChevronRight,
  Award,
  Video,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ArrowRight
} from "lucide-react";

import WorkspaceShell from "@/components/layout/WorkspaceShell";
import {
  CreateJobModal,
  ScheduleInterviewModal,
} from "@/components/modals/WorkspaceModals";
import { api } from "@/lib/api";
import { dashboardService } from "@/services/dashboardService";
import { RecruiterDashboardData } from "@/types/dashboard";

interface RealDBMetrics {
  active_jobs_count: number;
  total_applications_count: number;
  shortlisted_candidates_count: number;
  interviews_scheduled_count: number;
  selected_candidates_count: number;
  is_company_verified: boolean;
  verification_status: string;
  pipeline_breakdown: Record<string, number>;
  recent_applications: Array<{
    application_id: string;
    candidate_name: string;
    candidate_email: string | null;
    roll_number: string | null;
    department: string | null;
    cgpa: number | null;
    job_id: string;
    job_title: string;
    match_score: number;
    current_status: string;
    applied_at: string;
  }>;
  active_requisitions: Array<{
    id: string;
    title: string;
    vacancies: number;
    location: string;
    application_deadline: string;
    applicants_count: number;
  }>;
}

export default function RecruiterDashboardPage() {
  const [data, setData] = useState<RecruiterDashboardData | null>(null);
  const [realMetrics, setRealMetrics] = useState<RealDBMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [scheduleInterviewOpen, setScheduleInterviewOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch real DB metrics from Phase 12 endpoint
      const metricsRes = await api.getRecruiterDashboardMetrics();
      if (metricsRes && metricsRes.data) {
        setRealMetrics(metricsRes.data);
      }

      // 2. Fetch base profile/branding context
      const res = await dashboardService.getRecruiterDashboard();
      setData(res);
    } catch (e) {
      console.error("Dashboard metrics loading error:", e);
      // Fallback to mock if offline
      const res = await dashboardService.getRecruiterDashboard();
      setData(res);
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

  if (loading || !data) {
    return (
      <WorkspaceShell role="recruiter" activeTabTitle="Dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <div className="text-slate-600 font-mono text-xs tracking-wider">
              Loading Recruiter Intelligence Workspace...
            </div>
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  // Effective metric numbers
  const activeJobs = realMetrics ? realMetrics.active_jobs_count : data.stats.active_jobs_count;
  const totalApps = realMetrics ? realMetrics.total_applications_count : data.stats.total_applicants_count;
  const shortlistedCount = realMetrics ? realMetrics.shortlisted_candidates_count : data.stats.shortlisted_count;
  const interviewsCount = realMetrics ? realMetrics.interviews_scheduled_count : data.stats.interviews_scheduled_count;
  const selectedCount = realMetrics ? realMetrics.selected_candidates_count : 0;
  const isVerified = realMetrics ? realMetrics.is_company_verified : true;

  const pipeline = realMetrics?.pipeline_breakdown || {
    applied: 12,
    screening: 8,
    shortlisted: 4,
    technical_round: 3,
    hr_round: 2,
    offered: 1
  };

  return (
    <WorkspaceShell role="recruiter" activeTabTitle="Dashboard">
      <div className="space-y-8 pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modals */}
        <CreateJobModal
          isOpen={createJobOpen}
          onClose={() => setCreateJobOpen(false)}
          onSuccess={(msg) => {
            showToast(msg);
            loadData();
          }}
        />
        <ScheduleInterviewModal
          isOpen={scheduleInterviewOpen}
          onClose={() => setScheduleInterviewOpen(false)}
          onSuccess={(msg) => {
            showToast(msg);
            loadData();
          }}
        />

        {/* Recruiter Workspace Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full font-semibold">
                Employer Talent Portal
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Partner: {data.company_name}
              </span>
            </div>
            <h1 className="font-bold text-2xl md:text-3xl text-slate-900 tracking-tight">
              Talent Acquisition Hub &bull; {data.company_name}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Recruiting Lead: <span className="text-slate-900 font-medium">{data.recruiter_name}</span> &bull; {data.designation}
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/recruiter/jobs?action=new"
              className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-200" />
              <span>Create a Job</span>
            </Link>

            <button
              onClick={() => setScheduleInterviewOpen(true)}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Schedule Interview</span>
            </button>

            <Link
              href="/recruiter/applicants"
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>View Candidates</span>
            </Link>

            <Link
              href="/recruiter/company"
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Organization</span>
            </Link>
          </div>
        </section>

        {/* Verification Status Banner */}
        {isVerified ? (
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500 text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                  Verified Campus Employer
                </span>
                <p className="text-xs text-emerald-800">
                  Your organization is verified by university administrators. Job requisitions publish directly to active students.
                </p>
              </div>
            </div>
            <Link
              href="/recruiter/company"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 whitespace-nowrap"
            >
              <span>Manage Profile</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  Organization Verification Pending
                </span>
                <p className="text-xs text-amber-800">
                  Campus verification is in review. Requisitions will be routed to university placement officers for approval before publishing.
                </p>
              </div>
            </div>
            <Link
              href="/recruiter/company"
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline flex items-center gap-1 whitespace-nowrap"
            >
              <span>View Verification</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Top 5 Metric KPI Tiles */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Active Jobs */}
          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Active Openings
              </span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-bold text-2xl md:text-3xl text-slate-900">
                {activeJobs}
              </span>
              <span className="text-[10px] font-mono text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                Requisitions
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Live campus positions</span>
          </div>

          {/* Total Applicants */}
          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Total Applicants
              </span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-bold text-2xl md:text-3xl text-slate-900">
                {totalApps}
              </span>
              <span className="text-[10px] font-mono text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                Candidates
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Resumes received</span>
          </div>

          {/* Shortlisted Candidates */}
          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Shortlisted
              </span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-bold text-2xl md:text-3xl text-slate-900">
                {shortlistedCount}
              </span>
              <span className="text-[10px] font-mono text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                Screened
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Advanced to evaluation</span>
          </div>

          {/* Scheduled Interviews */}
          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Interviews
              </span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-bold text-2xl md:text-3xl text-slate-900">
                {interviewsCount}
              </span>
              <span className="text-[10px] font-mono text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full">
                Rounds
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Scheduled or in progress</span>
          </div>

          {/* Selected / Offers Extended */}
          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Offers Made
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-bold text-2xl md:text-3xl text-slate-900">
                {selectedCount}
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                Final Offers
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Campus selections</span>
          </div>
        </section>

        {/* Recruitment Pipeline Funnel Strip */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recruitment Pipeline Funnel</h2>
              <p className="text-xs text-slate-500">Live candidate movement across official selection stages.</p>
            </div>
            <Link
              href="/recruiter/applicants"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Manage Candidates</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
            {[
              { key: "applied", label: "Applied", color: "bg-slate-100 text-slate-700 border-slate-200" },
              { key: "screening", label: "Screening", color: "bg-blue-50 text-blue-700 border-blue-200" },
              { key: "shortlisted", label: "Shortlisted", color: "bg-amber-50 text-amber-700 border-amber-200" },
              { key: "technical_round", label: "Technical", color: "bg-purple-50 text-purple-700 border-purple-200" },
              { key: "hr_round", label: "HR / Leadership", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
              { key: "offered", label: "Offered", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
            ].map((st) => (
              <div key={st.key} className={`p-3.5 rounded-xl border ${st.color} flex flex-col justify-between`}>
                <span className="text-xs font-semibold uppercase tracking-wider">{st.label}</span>
                <div className="text-2xl font-bold mt-2">
                  {pipeline[st.key] || 0}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2-Column Section: Recent Applicants & Active Requisitions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Applications Feed */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Recent Candidate Submissions</h3>
              </div>
              <Link href="/recruiter/applicants" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                View All
              </Link>
            </div>

            {realMetrics && realMetrics.recent_applications.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {realMetrics.recent_applications.map((app) => (
                  <div key={app.application_id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 truncate">
                          {app.candidate_name}
                        </span>
                        {app.cgpa && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            CGPA {app.cgpa.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {app.job_title} &bull; {app.department || "Engineering"}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-bold text-indigo-700">
                          {app.match_score.toFixed(0)}% Match
                        </span>
                        <span className="block text-[10px] uppercase font-semibold text-slate-400">
                          {app.current_status.replace("_", " ")}
                        </span>
                      </div>
                      <Link
                        href={`/recruiter/applicants?id=${app.application_id}`}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-sm">
                No recent applicants found. Open a new campus requisition to attract talent.
              </div>
            )}
          </div>

          {/* Active Job Requisitions */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Active Requisitions</h3>
              </div>
              <Link href="/recruiter/jobs" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                Manage Jobs
              </Link>
            </div>

            {realMetrics && realMetrics.active_requisitions.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {realMetrics.active_requisitions.map((req) => (
                  <div key={req.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900">{req.title}</h4>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {req.location} &bull; {req.vacancies} {req.vacancies === 1 ? "Opening" : "Openings"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                        {req.applicants_count} Applicants
                      </span>
                      <Link
                        href={`/recruiter/applicants?job_id=${req.id}`}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-sm">
                No active requisitions currently published.
              </div>
            )}
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
