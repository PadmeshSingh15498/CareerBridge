"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Briefcase,
  Users,
  ExternalLink,
  Mail,
  Phone,
  RefreshCw,
  Filter,
  Check,
  Ban,
  RotateCcw
} from "lucide-react";

import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { api } from "@/lib/api";

interface RecruiterCompany {
  id: string;
  name: string;
  website_url: string;
  industry: string;
  company_size: string;
  logo_url?: string;
  description?: string;
  hr_contact_name?: string;
  hr_contact_email?: string;
  hr_contact_phone?: string;
  verification_status: string;
  is_verified: boolean;
  active_jobs_count: number;
  total_hires_count: number;
  recruiter_name?: string;
  recruiter_email?: string;
  created_at: string;
}

export default function AdminRecruitersPage() {
  const [companies, setCompanies] = useState<RecruiterCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Action Dialog State
  const [selectedCompany, setSelectedCompany] = useState<RecruiterCompany | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "suspend" | "reactivate" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchRecruiters = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminRecruiters({
        search: search || undefined,
        status_filter: statusFilter || undefined,
      });
      if (res && res.data) {
        setCompanies(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch recruiters:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruiters();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecruiters();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openActionModal = (
    company: RecruiterCompany,
    action: "approve" | "reject" | "suspend" | "reactivate"
  ) => {
    setSelectedCompany(company);
    setActionType(action);
    setActionReason("");
  };

  const handleExecuteAction = async () => {
    if (!selectedCompany || !actionType) return;
    setProcessing(true);
    try {
      const res = await api.actionRecruiter(selectedCompany.id, {
        action: actionType,
        reason: actionReason || undefined,
      });
      if (res && res.data) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === selectedCompany.id ? res.data : c))
        );
        showToast(
          `Organization '${selectedCompany.name}' status updated to ${res.data.verification_status.toUpperCase()}.`
        );
        setSelectedCompany(null);
        setActionType(null);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.detail || "Action execution failed.");
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = companies.filter((c) => c.verification_status === "pending_verification").length;

  return (
    <WorkspaceShell role="admin" activeTabTitle="Recruiters">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Toast Notification */}
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
                Corporate Relations
              </span>
              <span className="text-xs font-mono text-cb-muted">{companies.length} Corporate Partners</span>
              {pendingCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-cb-orange/15 text-cb-orange border border-cb-orange/30">
                  {pendingCount} Pending Review
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-cb-primary tracking-tight">
              Recruiter & Partner Organization Management
            </h1>
            <p className="text-sm text-cb-secondary mt-1">
              Verify employer credentials, approve corporate partnerships, review hiring contacts, and manage organizational access.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 rounded-xl bg-cb-card border border-cb-border flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-cb-muted absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search partner by company name or industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-cb-card-hover border border-cb-border text-xs text-cb-primary placeholder-cb-muted focus:outline-none focus:border-cb-teal"
            />
          </form>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            {[
              { id: "", label: "All Partners" },
              { id: "pending_verification", label: `Pending (${pendingCount})` },
              { id: "verified", label: "Verified" },
              { id: "suspended", label: "Suspended" },
              { id: "rejected", label: "Rejected" },
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

        {/* Company Cards Grid */}
        {loading ? (
          <div className="py-16 text-center text-cb-muted font-mono flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-cb-teal animate-spin" />
            <span>Loading corporate partners...</span>
          </div>
        ) : companies.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-cb-card border border-cb-border text-cb-muted font-mono">
            No corporate recruiting organizations found matching the criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {companies.map((comp) => {
              const isVerified = comp.verification_status === "verified";
              const isPending = comp.verification_status === "pending_verification";
              const isSuspended = comp.verification_status === "suspended";
              const isRejected = comp.verification_status === "rejected";

              return (
                <div
                  key={comp.id}
                  className="rounded-xl bg-cb-card border border-cb-border p-5 flex flex-col justify-between hover:border-cb-border-hover transition-all space-y-4"
                >
                  <div>
                    {/* Top Row: Name, Website, Status Pill */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-base text-cb-primary flex items-center gap-2">
                          {comp.name}
                        </h3>
                        <div className="text-xs text-cb-secondary mt-0.5">{comp.industry}</div>
                      </div>

                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium shrink-0 border ${
                          isVerified
                            ? "bg-cb-teal/15 text-cb-teal border-cb-teal/30"
                            : isPending
                            ? "bg-cb-orange/15 text-cb-orange border-cb-orange/30 animate-pulse"
                            : isSuspended
                            ? "bg-red-500/15 text-red-400 border-red-500/30"
                            : "bg-cb-muted/20 text-cb-muted border-cb-border"
                        }`}
                      >
                        {comp.verification_status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>

                    {/* HR Contact & Org Details */}
                    <div className="mt-4 pt-3 border-t border-cb-border/60 space-y-2 text-xs">
                      {comp.website_url && (
                        <div className="flex items-center gap-2 text-cb-secondary">
                          <ExternalLink className="w-3.5 h-3.5 text-cb-muted shrink-0" />
                          <a
                            href={comp.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cb-teal hover:underline truncate"
                          >
                            {comp.website_url.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}

                      {comp.hr_contact_name && (
                        <div className="flex items-center gap-2 text-cb-secondary">
                          <Users className="w-3.5 h-3.5 text-cb-muted shrink-0" />
                          <span>HR: {comp.hr_contact_name}</span>
                        </div>
                      )}

                      {comp.hr_contact_email && (
                        <div className="flex items-center gap-2 text-cb-secondary">
                          <Mail className="w-3.5 h-3.5 text-cb-muted shrink-0" />
                          <span className="truncate">{comp.hr_contact_email}</span>
                        </div>
                      )}

                      {comp.hr_contact_phone && (
                        <div className="flex items-center gap-2 text-cb-secondary">
                          <Phone className="w-3.5 h-3.5 text-cb-muted shrink-0" />
                          <span>{comp.hr_contact_phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats Metrics: Active Jobs & Offers */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-cb-card-hover border border-cb-border/60">
                        <div className="text-base font-bold text-cb-primary font-mono">
                          {comp.active_jobs_count}
                        </div>
                        <div className="text-[10px] text-cb-muted font-mono uppercase">Active Jobs</div>
                      </div>
                      <div className="p-2 rounded-lg bg-cb-card-hover border border-cb-border/60">
                        <div className="text-base font-bold text-cb-teal font-mono">
                          {comp.total_hires_count}
                        </div>
                        <div className="text-[10px] text-cb-muted font-mono uppercase">Total Hires</div>
                      </div>
                    </div>
                  </div>

                  {/* Administrative Action Buttons */}
                  <div className="pt-3 border-t border-cb-border flex items-center justify-end gap-2">
                    {isPending && (
                      <>
                        <button
                          onClick={() => openActionModal(comp, "approve")}
                          className="px-3 py-1.5 rounded-lg bg-cb-teal text-cb-bg hover:bg-cb-teal/90 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => openActionModal(comp, "reject")}
                          className="px-3 py-1.5 rounded-lg bg-cb-card-hover hover:bg-cb-border border border-cb-border text-xs font-mono text-cb-orange flex items-center gap-1.5 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {isVerified && (
                      <button
                        onClick={() => openActionModal(comp, "suspend")}
                        className="px-3 py-1.5 rounded-lg bg-cb-card-hover hover:bg-red-500/10 border border-cb-border hover:border-red-500/30 text-xs font-mono text-red-400 flex items-center gap-1.5 transition-all"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Suspend Access</span>
                      </button>
                    )}

                    {(isSuspended || isRejected) && (
                      <button
                        onClick={() => openActionModal(comp, "reactivate")}
                        className="px-3 py-1.5 rounded-lg bg-cb-card-hover hover:bg-cb-teal/10 border border-cb-border hover:border-cb-teal/30 text-xs font-mono text-cb-teal flex items-center gap-1.5 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reactivate Partner</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Administrative Action Confirmation (Approve, Reject, Suspend, Reactivate) */}
        {actionType && selectedCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-cb-card border border-cb-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-cb-border pb-3">
                <h3 className="font-bold text-base text-cb-primary capitalize">
                  {actionType} Corporate Partner
                </h3>
                <button
                  onClick={() => { setActionType(null); setSelectedCompany(null); }}
                  className="text-cb-muted hover:text-cb-primary"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-cb-secondary">
                <p>
                  You are about to execute administrative action:{" "}
                  <strong className="text-cb-primary uppercase font-mono">{actionType}</strong> on{" "}
                  <strong className="text-cb-teal">{selectedCompany.name}</strong>.
                </p>

                {actionType === "approve" && (
                  <p className="text-cb-teal bg-cb-teal/10 p-3 rounded-lg border border-cb-teal/20">
                    Approving this organization will grant verified partner credentials and allow them to publish active job requisitions on the campus portal.
                  </p>
                )}

                {actionType === "suspend" && (
                  <p className="text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    Suspension will immediately deactivate all associated recruiter accounts for this company and prevent candidates from viewing their postings.
                  </p>
                )}

                {(actionType === "reject" || actionType === "suspend") && (
                  <div>
                    <label className="block text-xs font-mono text-cb-muted mb-1.5">
                      Reason for {actionType} (Shared with Employer in Notice)
                    </label>
                    <textarea
                      rows={3}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="e.g. Official university domain email verification could not be validated..."
                      className="w-full p-2.5 rounded-lg bg-cb-card-hover border border-cb-border text-xs text-cb-primary placeholder-cb-muted focus:outline-none focus:border-cb-teal"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cb-border">
                <button
                  type="button"
                  onClick={() => { setActionType(null); setSelectedCompany(null); }}
                  className="px-4 py-2 rounded-lg bg-cb-card hover:bg-cb-card-hover border border-cb-border text-xs font-mono text-cb-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleExecuteAction}
                  className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 ${
                    actionType === "approve" || actionType === "reactivate"
                      ? "bg-cb-teal text-cb-bg hover:bg-cb-teal/90"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  {processing ? "Processing..." : `Confirm ${actionType.toUpperCase()}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
