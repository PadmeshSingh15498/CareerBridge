"use client";

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Building2,
  MapPin,
  DollarSign,
  Users,
  Eye,
  RefreshCw,
  Send,
  Ban,
  Check
} from "lucide-react";

import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { api } from "@/lib/api";

interface AdminJob {
  id: string;
  title: string;
  company_id: string;
  company_name: string;
  company_logo?: string;
  job_type: string;
  workplace_type: string;
  location: string;
  vacancies: number;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  status: string;
  application_deadline: string;
  created_at: string;
  poster_name?: string;
  poster_email?: string;
  applicants_count: number;
  required_skills: string[];
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending_approval");
  const [search, setSearch] = useState("");

  // Review modal state
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "request_correction" | "close" | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [processing, setProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminJobs({
        status_filter: statusFilter || undefined,
        search: search || undefined,
      });
      if (res && res.data) {
        setJobs(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openReviewModal = (job: AdminJob, action: "approve" | "reject" | "request_correction" | "close") => {
    setSelectedJob(job);
    setReviewAction(action);
    setReviewComments("");
  };

  const handleExecuteReview = async () => {
    if (!selectedJob || !reviewAction) return;
    setProcessing(true);
    try {
      const res = await api.actionJob(selectedJob.id, {
        action: reviewAction,
        comments: reviewComments || undefined,
      });
      if (res && res.data) {
        setJobs((prev) =>
          prev.map((j) => (j.id === selectedJob.id ? res.data : j))
        );
        showToast(`Job '${selectedJob.title}' status changed to '${res.data.status.toUpperCase()}'.`);
        setSelectedJob(null);
        setReviewAction(null);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.detail || "Review action failed.");
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = jobs.filter((j) => j.status === "pending_approval").length;

  return (
    <WorkspaceShell role="admin" activeTabTitle="Jobs">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 bg-cb-card border border-cb-teal/40 text-cb-teal px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in font-mono text-sm">
            <CheckCircle2 className="w-4 h-4 text-cb-teal shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-cb-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-cb-teal/10 text-cb-teal border border-cb-teal/20">
                Placement Approvals
              </span>
              <span className="text-xs font-mono text-cb-muted">{jobs.length} Requisitions Loaded</span>
            </div>
            <h1 className="text-2xl font-bold text-cb-primary tracking-tight">
              Job Requisition Approvals & Publishing
            </h1>
            <p className="text-sm text-cb-secondary mt-1">
              Validate incoming corporate hiring requisitions, compensation standards, and eligibility compliance before campus publication.
            </p>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 rounded-xl bg-cb-card border border-cb-border flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-cb-muted absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by job title or company name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-cb-card-hover border border-cb-border text-xs text-cb-primary placeholder-cb-muted focus:outline-none focus:border-cb-teal"
            />
          </form>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            {[
              { id: "pending_approval", label: "Pending Approval" },
              { id: "active", label: "Active" },
              { id: "draft", label: "Edits Requested (Draft)" },
              { id: "closed", label: "Closed" },
              { id: "", label: "All Requisitions" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === tab.id
                    ? "bg-cb-teal/15 text-cb-teal border border-cb-teal/30 font-semibold"
                    : "text-cb-secondary hover:text-cb-primary bg-cb-card-hover border border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requisitions List */}
        {loading ? (
          <div className="py-16 text-center text-cb-muted font-mono flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-cb-teal animate-spin" />
            <span>Loading requisitions queue...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-cb-card border border-cb-border text-cb-muted font-mono">
            No job requisitions found in '{statusFilter || "all"}' status.
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const isPending = job.status === "pending_approval";
              const isActive = job.status === "active";
              const isDraft = job.status === "draft";
              const isClosed = job.status === "closed";

              const salaryStr = job.salary_min && job.salary_max
                ? `₹${(job.salary_min / 100000).toFixed(1)}L - ₹${(job.salary_max / 100000).toFixed(1)}L PA`
                : "Compensation Not Disclosed";

              return (
                <div
                  key={job.id}
                  className="p-5 rounded-xl bg-cb-card border border-cb-border hover:border-cb-border-hover transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-base text-cb-primary">{job.title}</h3>
                      <span className="text-xs font-mono text-cb-muted">•</span>
                      <span className="text-xs font-medium text-cb-teal flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {job.company_name}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${
                          isPending
                            ? "bg-cb-orange/15 text-cb-orange border-cb-orange/30 animate-pulse"
                            : isActive
                            ? "bg-cb-teal/15 text-cb-teal border-cb-teal/30"
                            : isDraft
                            ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                            : "bg-cb-muted/20 text-cb-muted border-cb-border"
                        }`}
                      >
                        {job.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-cb-secondary">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-cb-muted" />
                        {job.location} ({job.workplace_type.replace("_", " ")})
                      </span>
                      <span>•</span>
                      <span className="font-mono text-cb-primary">{salaryStr}</span>
                      <span>•</span>
                      <span>{job.vacancies} Openings</span>
                      <span>•</span>
                      <span className="text-cb-orange">
                        Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                      </span>
                    </div>

                    {job.required_skills && job.required_skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {job.required_skills.slice(0, 6).map((sk, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-cb-card-hover text-cb-secondary border border-cb-border/60"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions & Applicant Counter */}
                  <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-end md:items-center gap-3 shrink-0">
                    <div className="text-right sm:text-left md:text-right">
                      <div className="text-sm font-bold font-mono text-cb-primary">
                        {job.applicants_count}
                      </div>
                      <div className="text-[10px] font-mono text-cb-muted uppercase">Applicants</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            onClick={() => openReviewModal(job, "approve")}
                            className="px-3 py-1.5 rounded-lg bg-cb-teal text-cb-bg hover:bg-cb-teal/90 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>

                          <button
                            onClick={() => openReviewModal(job, "request_correction")}
                            className="px-3 py-1.5 rounded-lg bg-cb-card-hover hover:bg-cb-border border border-cb-border text-xs font-mono text-yellow-400 flex items-center gap-1.5 transition-all"
                            title="Request recruiter to edit requirements or compensation"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Request Edits</span>
                          </button>

                          <button
                            onClick={() => openReviewModal(job, "reject")}
                            className="px-3 py-1.5 rounded-lg bg-cb-card-hover hover:bg-red-500/10 border border-cb-border hover:border-red-500/30 text-xs font-mono text-red-400 flex items-center gap-1.5 transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {isActive && (
                        <button
                          onClick={() => openReviewModal(job, "close")}
                          className="px-3 py-1.5 rounded-lg bg-cb-card-hover hover:bg-cb-border border border-cb-border text-xs font-mono text-cb-secondary hover:text-cb-primary flex items-center gap-1.5 transition-all"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Close Post</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Job Review Action (Approve, Request Correction, Reject, Close) */}
        {reviewAction && selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-cb-card border border-cb-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-cb-border pb-3">
                <h3 className="font-bold text-base text-cb-primary capitalize">
                  {reviewAction.replace("_", " ")} Job Requisition
                </h3>
                <button
                  onClick={() => { setReviewAction(null); setSelectedJob(null); }}
                  className="text-cb-muted hover:text-cb-primary"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-cb-secondary">
                <div>
                  <div className="font-semibold text-cb-primary text-sm">{selectedJob.title}</div>
                  <div className="text-cb-teal font-mono">{selectedJob.company_name}</div>
                </div>

                {reviewAction === "approve" && (
                  <p className="p-3 rounded-lg bg-cb-teal/10 border border-cb-teal/20 text-cb-teal">
                    Approving will publish this requisition to the student discovery portal and make it available for eligible candidate applications.
                  </p>
                )}

                {reviewAction === "request_correction" && (
                  <div>
                    <p className="mb-2 text-yellow-400 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                      The job status will revert to Draft. The recruiter will receive an action-required notification containing your instructions.
                    </p>
                    <label className="block text-xs font-mono text-cb-muted mb-1.5">
                      Required Modifications / Comments:
                    </label>
                    <textarea
                      rows={3}
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="e.g. Please clarify minimum CGPA and specify if remote candidates are permitted..."
                      className="w-full p-2.5 rounded-lg bg-cb-card-hover border border-cb-border text-xs text-cb-primary placeholder-cb-muted focus:outline-none focus:border-cb-teal"
                    />
                  </div>
                )}

                {reviewAction === "reject" && (
                  <div>
                    <label className="block text-xs font-mono text-cb-muted mb-1.5">
                      Rejection Reason (Shared with Recruiter):
                    </label>
                    <textarea
                      rows={3}
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="e.g. Compensation package is below university placement guidelines..."
                      className="w-full p-2.5 rounded-lg bg-cb-card-hover border border-cb-border text-xs text-cb-primary placeholder-cb-muted focus:outline-none focus:border-cb-teal"
                    />
                  </div>
                )}

                {reviewAction === "close" && (
                  <p className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    Closing will discontinue new student applications for this requisition.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cb-border">
                <button
                  type="button"
                  onClick={() => { setReviewAction(null); setSelectedJob(null); }}
                  className="px-4 py-2 rounded-lg bg-cb-card hover:bg-cb-card-hover border border-cb-border text-xs font-mono text-cb-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleExecuteReview}
                  className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 ${
                    reviewAction === "approve"
                      ? "bg-cb-teal text-cb-bg hover:bg-cb-teal/90"
                      : reviewAction === "request_correction"
                      ? "bg-yellow-500 text-black hover:bg-yellow-400"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  {processing ? "Processing..." : `Confirm ${reviewAction.replace("_", " ").toUpperCase()}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
