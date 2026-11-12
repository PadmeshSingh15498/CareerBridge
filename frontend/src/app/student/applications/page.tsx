"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase, Building2, MapPin, IndianRupee, Clock,
  Calendar, CheckCircle2, AlertCircle, Sparkles, ChevronRight,
  ExternalLink, Video, XCircle, ArrowUpRight, History,
  Filter, RefreshCw, X
} from "lucide-react";
import { apiService } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

interface StatusHistoryItem {
  id: number;
  previous_status?: string;
  new_status: string;
  change_reason?: string;
  created_at: string;
}

interface InterviewItem {
  id: string;
  round_name: string;
  scheduled_start: string;
  scheduled_end: string;
  meeting_link?: string;
  venue?: string;
  interviewer_name?: string;
  status: string;
}

interface ApplicationItem {
  id: string;
  job_id: string;
  student_id: string;
  resume_id: string;
  current_status: string;
  composite_match_score: number;
  cover_letter?: string;
  applied_at: string;
  job_title: string;
  company_name: string;
  company_logo?: string;
  job_location: string;
  job_type: string;
  salary_range?: string;
  status_history: StatusHistoryItem[];
  interviews: InterviewItem[];
}

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState<string>("ALL");
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);

  // Withdraw Modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await apiService.getMyApplications();
      if (res.success && res.data) {
        setApplications(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async () => {
    if (!selectedApp) return;
    setWithdrawing(true);
    try {
      const res = await apiService.withdrawApplication(selectedApp.id, {
        reason: withdrawReason.trim() || undefined,
      });
      if (res.success) {
        setApplications((prev) =>
          prev.map((a) => (a.id === selectedApp.id ? { ...a, current_status: "withdrawn" } : a))
        );
        setShowWithdrawModal(false);
        setWithdrawReason("");
      }
    } catch (err) {
      console.error("Failed to withdraw:", err);
    } finally {
      setWithdrawing(false);
    }
  };

  const stageTabs = [
    { key: "ALL", label: "All Active" },
    { key: "applied", label: "Applied" },
    { key: "screening", label: "Under Review" },
    { key: "shortlisted", label: "Shortlisted" },
    { key: "technical_round", label: "Interviews" },
    { key: "offered", label: "Offers" },
    { key: "rejected", label: "Closed" },
  ];

  const filteredApps = applications.filter((app) => {
    if (filterStage === "ALL") return true;
    if (filterStage === "technical_round") {
      return app.current_status === "technical_round" || app.current_status === "hr_round";
    }
    return app.current_status === filterStage;
  });

  const getStatusBadge = (statusStr: string) => {
    const s = statusStr.toLowerCase();
    switch (s) {
      case "applied":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Applied</span>;
      case "screening":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">Under Review</span>;
      case "shortlisted":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#C9E66B]/50 text-[#1E3028] border border-[#C9E66B]">Shortlisted</span>;
      case "technical_round":
      case "hr_round":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Interviewing</span>;
      case "offered":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">Offer Extended 🎉</span>;
      case "rejected":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">Not Selected</span>;
      case "withdrawn":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">Withdrawn</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 capitalize">{statusStr}</span>;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-[#F6F5F0] text-[#202823] p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#244D3D]/10 text-[#244D3D]">
                <Clock className="w-3.5 h-3.5" /> Stage Tracker & Timeline
              </span>
              <span className="text-xs text-[#727B74]">
                {applications.length} Requisitions Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#202823] font-['Space_Grotesk']">
              Placement Application Pipeline
            </h1>
            <p className="text-sm text-[#727B74] mt-1 max-w-2xl">
              Track your campus placement lifecycle from initial application through screening, technical evaluations, interview rounds, and official offers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchApplications}
              className="p-2.5 bg-white border border-[#E2E4DC] hover:border-[#244D3D] rounded-xl text-[#727B74] hover:text-[#202823] transition-colors"
              title="Refresh applications"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/student/jobs"
              className="px-4 py-2.5 rounded-xl bg-[#244D3D] text-white text-xs font-bold hover:bg-[#1E3028] transition-colors flex items-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5" /> Discover More Jobs
            </Link>
          </div>
        </div>

        {/* Stage Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {stageTabs.map((tab) => {
            const count =
              tab.key === "ALL"
                ? applications.length
                : tab.key === "technical_round"
                ? applications.filter((a) => a.current_status === "technical_round" || a.current_status === "hr_round").length
                : applications.filter((a) => a.current_status === tab.key).length;

            return (
              <button
                key={tab.key}
                onClick={() => setFilterStage(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap ${
                  filterStage === tab.key
                    ? "bg-[#244D3D] text-white border-[#244D3D] shadow-sm"
                    : "bg-white text-[#727B74] border-[#E2E4DC] hover:text-[#202823] hover:border-[#244D3D]"
                }`}
              >
                {tab.label}
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    filterStage === tab.key ? "bg-white/20 text-white" : "bg-[#ECEDE7] text-[#202823]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E2E4DC] p-6 animate-pulse space-y-3">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E4DC] p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-[#244D3D]/10 text-[#244D3D] rounded-full flex items-center justify-center mx-auto">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#202823]">No applications in this category</h3>
            <p className="text-sm text-[#727B74] max-w-md mx-auto">
              Explore open placement drives and enterprise opportunities in the job catalog.
            </p>
            <Link
              href="/student/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#244D3D] text-white text-xs font-semibold hover:bg-[#1E3028]"
            >
              Browse Campus Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-[#E2E4DC] hover:border-[#244D3D]/40 p-6 shadow-sm hover:shadow-md transition-all space-y-5"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Company & Role */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#ECEDE7] border border-[#E2E4DC] flex items-center justify-center font-bold text-xl text-[#244D3D] overflow-hidden flex-shrink-0">
                      {app.company_logo ? (
                        <img
                          src={app.company_logo}
                          alt={app.company_name}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        app.company_name.charAt(0)
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#202823]">{app.company_name}</h4>
                        <span className="text-xs text-[#727B74]">• Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                      </div>
                      <Link href={`/student/jobs/${app.job_id}`}>
                        <h3 className="text-lg font-extrabold text-[#202823] hover:text-[#244D3D] transition-colors mt-0.5">
                          {app.job_title}
                        </h3>
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#727B74]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {app.job_location}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{app.job_type.replace("_", " ")}</span>
                        {app.salary_range && (
                          <>
                            <span>•</span>
                            <span className="font-bold text-[#202823] font-['IBM_Plex_Mono']">{app.salary_range}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status & Match Score */}
                  <div className="flex items-center gap-4 self-start md:self-auto">
                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] text-[#727B74] block">Match Intelligence</span>
                      <span className="font-bold text-sm text-[#244D3D] font-['IBM_Plex_Mono']">
                        {app.composite_match_score.toFixed(1)}% Match
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(app.current_status)}
                      <button
                        onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                        className="p-2 rounded-xl border border-[#E2E4DC] hover:border-[#244D3D] text-[#727B74] hover:text-[#202823] text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <History className="w-4 h-4" />
                        <span className="hidden sm:inline">Timeline</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scheduled Interviews Box (if any) */}
                {app.interviews && app.interviews.length > 0 && (
                  <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                      <span className="flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-purple-700" /> Scheduled Interview Call
                      </span>
                      <span className="text-[11px] font-normal text-purple-700">
                        Status: {app.interviews[0].status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-[#202823] block">{app.interviews[0].round_name}</span>
                        <span className="text-[#727B74]">
                          {new Date(app.interviews[0].scheduled_start).toLocaleString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {app.interviews[0].interviewer_name && ` with ${app.interviews[0].interviewer_name}`}
                        </span>
                      </div>
                      {app.interviews[0].meeting_link && (
                        <a
                          href={app.interviews[0].meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold transition-colors flex items-center gap-1 self-start sm:self-auto"
                        >
                          Join Meeting <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Expanded Timeline Drawer */}
                {selectedApp?.id === app.id && (
                  <div className="pt-4 border-t border-[#E2E4DC] space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#202823] uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-[#244D3D]" /> Official Application Audit Trail
                      </h4>
                      {app.current_status !== "withdrawn" && app.current_status !== "rejected" && (
                        <button
                          onClick={() => setShowWithdrawModal(true)}
                          className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Withdraw Application
                        </button>
                      )}
                    </div>

                    {/* Timeline items */}
                    <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E4DC]">
                      {app.status_history.map((h, idx) => (
                        <div key={h.id || idx} className="relative text-xs space-y-0.5">
                          <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#244D3D] ring-4 ring-white"></div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#202823] capitalize">
                              {h.new_status.replace("_", " ")}
                            </span>
                            <span className="text-[11px] text-[#727B74]">
                              • {new Date(h.created_at).toLocaleString()}
                            </span>
                          </div>
                          {h.change_reason && (
                            <p className="text-[#727B74] text-[11px]">{h.change_reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Withdraw Confirmation Modal */}
        {showWithdrawModal && selectedApp && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E2E4DC] max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-[#E2E4DC] pb-3">
                <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
                  <XCircle className="w-5 h-5" /> Withdraw Application
                </h3>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#727B74] leading-relaxed">
                Are you sure you want to withdraw your application for{" "}
                <span className="font-bold text-[#202823]">{selectedApp.job_title}</span> at{" "}
                <span className="font-bold text-[#202823]">{selectedApp.company_name}</span>? This action cannot be reversed.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#202823] block">
                  Reason for withdrawal (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g., Accepted another offer, relocation constraint..."
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E2E4DC] text-xs focus:outline-none focus:border-[#244D3D]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E2E4DC] text-xs font-semibold hover:bg-[#F6F5F0]"
                >
                  Keep Application
                </button>
                <button
                  type="button"
                  disabled={withdrawing}
                  onClick={handleWithdraw}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {withdrawing ? "Withdrawing..." : "Confirm Withdrawal"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
