"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users, Search, Filter, Sparkles, Building2, MapPin,
  CheckCircle2, AlertCircle, Calendar, Video, Clock,
  ArrowUpDown, ChevronRight, X, ExternalLink, Send,
  RefreshCw, Check, XCircle, GraduationCap, ShieldCheck,
  FileText, Award, Lock, BookOpen, Star, MessageSquare
} from "lucide-react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { api } from "@/lib/api";

interface CandidateListItem {
  application_id: string;
  job_id: string;
  job_title: string;
  student_id: string;
  full_name: string;
  email?: string;
  roll_number?: string;
  university?: string;
  degree?: string;
  department?: string;
  graduation_year?: number;
  cgpa?: number;
  backlogs: number;
  skills: string[];
  projects_count: number;
  experience_count: number;
  resume_id: string;
  resume_file_url?: string;
  current_status: string;
  composite_match_score: number;
  advisory_recommendation: string;
  is_academically_eligible: boolean;
  has_recruiter_notes: boolean;
  applied_at: string;
}

interface RecruiterJob {
  id: string;
  title: string;
}

function RecruiterApplicantsContent() {
  const searchParams = useSearchParams();
  const initialJobId = searchParams?.get("job_id") || "";
  const initialAppId = searchParams?.get("id") || "";

  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters State
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [skillFilter, setSkillFilter] = useState("");
  const [minCgpa, setMinCgpa] = useState<number | "">("");
  const [degreeFilter, setDegreeFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [gradYearFilter, setGradYearFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("match_score");

  // Candidate Dossier State
  const [activeDossierId, setActiveDossierId] = useState<string | null>(initialAppId || null);
  const [dossierData, setDossierData] = useState<any | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierTab, setDossierTab] = useState<"overview" | "resume" | "ai_match" | "notes" | "interview">("overview");

  // Private Notes Editor State
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Stage Advancement State
  const [advanceStatus, setAdvanceStatus] = useState("");
  const [advanceReason, setAdvanceReason] = useState("");
  const [advancing, setAdvancing] = useState(false);

  // Schedule Interview State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    round_name: "Technical Domain Assessment",
    scheduled_start: "",
    scheduled_end: "",
    interview_mode: "virtual",
    meeting_link: "",
    venue: "",
    interviewer_name: "",
    instructions: "Please ensure your microphone, camera, and IDE are operational."
  });
  const [scheduling, setScheduling] = useState(false);

  // Interview Feedback Rubric State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [activeInterviewId, setActiveInterviewId] = useState<string | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    technical_rating: 4,
    communication_rating: 4,
    problem_solving_rating: 4,
    recommendation: "hire",
    detailed_notes: ""
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Jobs Dropdown
  const loadJobs = async () => {
    try {
      const res = await api.getRecruiterJobs();
      if (res && res.data) {
        setJobs(res.data);
      }
    } catch (e) {
      console.error("Failed to load recruiter jobs dropdown", e);
    }
  };

  // Fetch Candidates List
  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await api.getRecruiterCandidates({
        job_id: selectedJobId || undefined,
        skill: skillFilter || undefined,
        min_cgpa: minCgpa !== "" ? Number(minCgpa) : undefined,
        degree: degreeFilter || undefined,
        department: departmentFilter || undefined,
        graduation_year: gradYearFilter !== "" ? Number(gradYearFilter) : undefined,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        sort_by: sortBy,
        page_size: 50
      });
      if (res && res.data) {
        setCandidates(res.data.items || []);
      }
    } catch (e) {
      console.error("Failed to fetch candidates:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [selectedJobId, statusFilter, sortBy]);

  // Load Dossier when activeDossierId changes
  const loadDossier = async (appId: string) => {
    setDossierLoading(true);
    setActiveDossierId(appId);
    try {
      const res = await api.getCandidateApplicationDetail(appId);
      if (res && res.data) {
        setDossierData(res.data);
        setNotesText(res.data.recruiter_notes || "");
        setAdvanceStatus(res.data.current_status || "screening");
      }
    } catch (e) {
      console.error("Failed to load candidate dossier:", e);
      showToast("Could not load candidate dossier.");
    } finally {
      setDossierLoading(false);
    }
  };

  useEffect(() => {
    if (initialAppId) {
      loadDossier(initialAppId);
    }
  }, [initialAppId]);

  // Save Private Notes
  const handleSaveNotes = async () => {
    if (!activeDossierId) return;
    setSavingNotes(true);
    try {
      await api.updateRecruiterNotes(activeDossierId, notesText);
      showToast("Private recruiter notes saved securely.");
      if (dossierData) {
        setDossierData({ ...dossierData, recruiter_notes: notesText });
      }
      fetchCandidates();
    } catch (e) {
      showToast("Failed to save private notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  // Advance Stage
  const handleAdvanceStage = async () => {
    if (!activeDossierId) return;
    setAdvancing(true);
    try {
      await api.advanceApplicationStage(activeDossierId, {
        new_status: advanceStatus,
        change_reason: advanceReason || undefined,
        internal_notes: notesText || undefined
      });
      showToast(`Candidate advanced to ${advanceStatus.replace("_", " ")}.`);
      setAdvanceReason("");
      loadDossier(activeDossierId);
      fetchCandidates();
    } catch (e: any) {
      const detail = e.response?.data?.detail || "Stage advancement failed.";
      showToast(detail);
    } finally {
      setAdvancing(false);
    }
  };

  // Schedule Interview
  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDossierId) return;
    setScheduling(true);
    try {
      await api.scheduleCandidateInterview(activeDossierId, {
        round_name: interviewForm.round_name,
        scheduled_start: new Date(interviewForm.scheduled_start).toISOString(),
        scheduled_end: new Date(interviewForm.scheduled_end).toISOString(),
        interview_mode: interviewForm.interview_mode,
        meeting_link: interviewForm.meeting_link || undefined,
        venue: interviewForm.venue || undefined,
        interviewer_name: interviewForm.interviewer_name || undefined,
        instructions: interviewForm.instructions || undefined
      });
      showToast("Interview scheduled and candidate notified!");
      setShowScheduleModal(false);
      loadDossier(activeDossierId);
      fetchCandidates();
    } catch (e: any) {
      const detail = e.response?.data?.detail || "Failed to schedule interview.";
      showToast(detail);
    } finally {
      setScheduling(false);
    }
  };

  // Submit Feedback Rubric
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInterviewId) return;
    setSubmittingFeedback(true);
    try {
      await api.recordInterviewFeedback(activeInterviewId, feedbackForm);
      showToast("Interview assessment rubric recorded!");
      setShowFeedbackModal(false);
      if (activeDossierId) loadDossier(activeDossierId);
    } catch (e: any) {
      const detail = e.response?.data?.detail || "Failed to submit feedback.";
      showToast(detail);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getAdvisoryColor = (advisory: string) => {
    switch (advisory) {
      case "Excellent Match":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Strong Match":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Moderate Match":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "shortlisted":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "technical_round":
      case "hr_round":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "offered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <WorkspaceShell role="recruiter" activeTabTitle="Applicants">
      <div className="space-y-6 pb-12">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full font-semibold">
                Candidate Intelligence
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {candidates.length} Applicants Evaluated
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Candidate Pipeline &amp; Talent Intelligence
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Screen candidate dossiers, review advisory AI compatibility breakdowns, manage private evaluation notes, and schedule interview rounds.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchCandidates}
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-slate-900 transition shadow-xs"
              title="Refresh pipeline"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Multi-Attribute Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate name, roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchCandidates()}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600"
              />
            </div>

            {/* Job Requisition Filter */}
            <div>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600 bg-white text-slate-800"
              >
                <option value="">All Job Requisitions</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600 bg-white text-slate-800"
              >
                <option value="">All Pipeline Stages</option>
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="technical_round">Technical Round</option>
                <option value="hr_round">HR Round</option>
                <option value="offered">Offered</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600 bg-white text-slate-800"
              >
                <option value="match_score">Sort by: AI Compatibility (High to Low)</option>
                <option value="applied_at">Sort by: Application Date (Newest First)</option>
                <option value="cgpa">Sort by: Academic CGPA (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Granular Filters: Skill, CGPA, Department */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Skill:</span>
              <input
                type="text"
                placeholder="e.g. Python, React"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchCandidates()}
                className="w-28 px-2.5 py-1 rounded-lg border border-slate-200 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Min CGPA:</span>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                placeholder="7.5"
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value === "" ? "" : Number(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && fetchCandidates()}
                className="w-20 px-2.5 py-1 rounded-lg border border-slate-200 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Department:</span>
              <input
                type="text"
                placeholder="e.g. Computer Science"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchCandidates()}
                className="w-36 px-2.5 py-1 rounded-lg border border-slate-200 text-xs"
              />
            </div>

            <button
              onClick={fetchCandidates}
              className="ml-auto px-3 py-1 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Candidates Table / Grid */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">No applicants match criteria</h3>
            <p className="text-xs text-slate-500">Adjust your filter parameters or clear filters to view all candidate records.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Candidate Profile</th>
                    <th className="py-3 px-4">Role Requisition</th>
                    <th className="py-3 px-4">Academics &amp; Backlogs</th>
                    <th className="py-3 px-4">AI Match Advisory</th>
                    <th className="py-3 px-4">Pipeline Stage</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.map((c) => (
                    <tr
                      key={c.application_id}
                      className="hover:bg-slate-50/60 transition group cursor-pointer"
                      onClick={() => loadDossier(c.application_id)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shadow-inner">
                            {c.full_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-sm">{c.full_name}</span>
                              {c.has_recruiter_notes && (
                                <span title="Private notes recorded">
                                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {c.roll_number} &bull; {c.university || "University Partner"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {c.job_title}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {c.degree || "B.Tech"} &bull; CGPA {c.cgpa ? c.cgpa.toFixed(2) : "N/A"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {c.department || "Engineering"} &bull; {c.backlogs === 0 ? "0 Backlogs" : `${c.backlogs} Backlogs`}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getAdvisoryColor(c.advisory_recommendation)}`}>
                            {c.advisory_recommendation}
                          </span>
                          <span className="font-bold text-indigo-700 font-mono">
                            {c.composite_match_score.toFixed(0)}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(c.current_status)}`}>
                          {c.current_status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadDossier(c.application_id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition"
                        >
                          View Dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Candidate Application Dossier Modal / Drawer */}
        {activeDossierId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
              {dossierLoading || !dossierData ? (
                <div className="py-20 text-center">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-500 text-xs font-medium">Retrieving comprehensive candidate intelligence...</p>
                </div>
              ) : (
                <>
                  {/* Dossier Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                        {dossierData.candidate.full_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-slate-900">{dossierData.candidate.full_name}</h2>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(dossierData.current_status)}`}>
                            {dossierData.current_status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {dossierData.candidate.roll_number} &bull; {dossierData.candidate.university} &bull; Applied for: <span className="font-semibold text-indigo-700">{dossierData.job_title}</span>
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                          {dossierData.candidate.email && <span>{dossierData.candidate.email}</span>}
                          {dossierData.candidate.phone && <span>&bull; {dossierData.candidate.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveDossierId(null)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Advisory AI Banner */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2.5 leading-relaxed">
                    <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>DECISION SUPPORT ADVISORY:</strong> Candidate compatibility scores and skill matches are algorithmically synthesized to assist review. Final evaluation and hiring decisions must be made by qualified human recruiters.
                    </span>
                  </div>

                  {/* Dossier Tabs */}
                  <div className="flex items-center gap-2 border-b border-slate-100 text-xs font-semibold">
                    {[
                      { key: "overview", label: "Profile Overview", icon: GraduationCap },
                      { key: "ai_match", label: "Advisory AI Match", icon: Sparkles },
                      { key: "resume", label: "Resume & ATS Analysis", icon: FileText },
                      { key: "notes", label: "Private Recruiter Notes", icon: Lock },
                      { key: "interview", label: "Interviews & Rubric", icon: Video },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setDossierTab(t.key as any)}
                        className={`pb-3 px-2 flex items-center gap-1.5 border-b-2 transition ${
                          dossierTab === t.key
                            ? "border-indigo-600 text-indigo-700"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <t.icon className="w-3.5 h-3.5" />
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Tab 1: Profile Overview */}
                  {dossierTab === "overview" && (
                    <div className="space-y-6">
                      {/* Academics & Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic Standing</span>
                          <div className="text-lg font-bold text-slate-900 mt-1">
                            {dossierData.candidate.degree || "B.Tech"} - {dossierData.candidate.department}
                          </div>
                          <span className="text-xs text-slate-600">Batch {dossierData.candidate.graduation_year || 2026}</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cumulative CGPA</span>
                          <div className="text-2xl font-extrabold text-indigo-700 font-mono mt-1">
                            {dossierData.candidate.cgpa ? dossierData.candidate.cgpa.toFixed(2) : "N/A"}
                          </div>
                          <span className="text-xs text-slate-500">
                            {dossierData.candidate.active_backlogs === 0 ? "Zero active backlogs" : `${dossierData.candidate.active_backlogs} Backlogs`}
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Application Date</span>
                          <div className="text-sm font-bold text-slate-900 mt-1">
                            {new Date(dossierData.applied_at).toLocaleDateString()}
                          </div>
                          <span className="text-xs text-slate-500">Status: {dossierData.current_status}</span>
                        </div>
                      </div>

                      {/* Technical Skills */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Verified Technical Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {(dossierData.candidate.skills || []).map((s: any) => (
                            <span
                              key={s.id || s.name}
                              className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200/70 text-indigo-900 text-xs font-semibold flex items-center gap-1.5"
                            >
                              <span>{s.name}</span>
                              {s.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Projects */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Technical Projects</h4>
                        <div className="space-y-3">
                          {(dossierData.candidate.projects || []).map((p: any) => (
                            <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                              <div className="flex items-center justify-between">
                                <h5 className="font-bold text-sm text-slate-900">{p.title}</h5>
                                <div className="flex items-center gap-2">
                                  {p.github_url && (
                                    <a
                                      href={p.github_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
                                    >
                                      GitHub <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                  {p.live_url && (
                                    <a
                                      href={p.live_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1 font-semibold"
                                    >
                                      Live Demo <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>
                              {p.technologies && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {p.technologies.map((t: string) => (
                                    <span key={t} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Advisory AI Match Breakdown */}
                  {dossierTab === "ai_match" && (
                    <div className="space-y-6">
                      <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs uppercase font-bold text-indigo-950">Overall AI Match Compatibility</span>
                          <p className="text-xs text-indigo-800 mt-0.5">
                            Synthesized through exact matching, weighted semantic cosine similarity, and project validation.
                          </p>
                        </div>
                        <div className="text-3xl font-extrabold text-indigo-700 font-mono">
                          {dossierData.ai_match_breakdown.composite_score.toFixed(0)}%
                        </div>
                      </div>

                      {/* Matched & Missing Skills */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wide">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Exact &amp; Partial Skill Matches</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(dossierData.ai_match_breakdown.exact_skills_matched || []).map((s: string) => (
                              <span key={s} className="px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold">
                                {s} (Exact)
                              </span>
                            ))}
                            {(dossierData.ai_match_breakdown.partial_skills_matched || []).map((s: string) => (
                              <span key={s} className="px-2.5 py-1 rounded-md bg-white border border-blue-300 text-blue-800 text-xs font-semibold">
                                {s} (Related)
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
                          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span>Missing Job Requirements</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(dossierData.ai_match_breakdown.missing_skills || []).length > 0 ? (
                              dossierData.ai_match_breakdown.missing_skills.map((s: string) => (
                                <span key={s} className="px-2.5 py-1 rounded-md bg-white border border-amber-300 text-amber-800 text-xs font-medium">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-emerald-700 font-medium">Candidate satisfies all core job skill requirements!</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Academic Eligibility Breakdown */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Institutional Academic Gating</h4>
                        <div className="flex items-center gap-2 text-xs">
                          {dossierData.ai_match_breakdown.is_eligible ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                              <Check className="w-4 h-4 text-emerald-600" />
                              Academically Eligible for Campus Requisition
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold flex items-center gap-1.5">
                              <XCircle className="w-4 h-4 text-rose-600" />
                              Ineligible under institutional criteria: {dossierData.ai_match_breakdown.eligibility_reasons?.join("; ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Resume & ATS Analysis */}
                  {dossierTab === "resume" && (
                    <div className="space-y-6">
                      {dossierData.resume_analysis ? (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                              <span className="text-[10px] font-bold uppercase text-slate-400">ATS Score</span>
                              <div className="text-2xl font-bold text-indigo-700 font-mono mt-1">
                                {dossierData.resume_analysis.ats_overall_score?.toFixed(0) || "85"}%
                              </div>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                              <span className="text-[10px] font-bold uppercase text-slate-400">Structure</span>
                              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                                {dossierData.resume_analysis.structure_score?.toFixed(0) || "90"}%
                              </div>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                              <span className="text-[10px] font-bold uppercase text-slate-400">Content / Verbs</span>
                              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                                {dossierData.resume_analysis.content_score?.toFixed(0) || "85"}%
                              </div>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                              <span className="text-[10px] font-bold uppercase text-slate-400">Readability</span>
                              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                                {dossierData.resume_analysis.readability_score?.toFixed(0) || "88"}%
                              </div>
                            </div>
                          </div>

                          {/* Strengths & Improvements */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                              <h5 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">Resume Strengths</h5>
                              <ul className="text-xs text-emerald-800 space-y-1 list-disc pl-4">
                                {(dossierData.resume_analysis.strengths || []).map((str: string, idx: number) => (
                                  <li key={idx}>{str}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                              <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wide">Potential Areas to Probe</h5>
                              <ul className="text-xs text-amber-800 space-y-1 list-disc pl-4">
                                {(dossierData.resume_analysis.improvements || []).map((imp: string, idx: number) => (
                                  <li key={idx}>{imp}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          Resume analysis metrics are pending automated processing.
                        </div>
                      )}

                      {/* Download Link */}
                      {dossierData.resume && (
                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                          <span className="text-xs font-semibold text-slate-800">Uploaded Document: {dossierData.resume.file_name}</span>
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/resumes/${dossierData.resume.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Download Resume PDF</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 4: Private Recruiter Notes */}
                  {dossierTab === "notes" && (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 font-medium">
                        <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>
                          <strong>CONFIDENTIAL:</strong> These internal evaluation notes are accessible only to authorized hiring team members. They are NEVER shared with or displayed to candidates.
                        </span>
                      </div>

                      <textarea
                        rows={6}
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        placeholder="Add private observations regarding candidate architecture design, behavioral answers, or salary expectations..."
                        className="w-full p-4 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 font-medium leading-relaxed"
                      />

                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {savingNotes ? "Saving Notes..." : "Save Confidential Note"}
                      </button>
                    </div>
                  )}

                  {/* Tab 5: Interviews & Feedback */}
                  {dossierTab === "interview" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Scheduled Interview Rounds</h4>
                          <p className="text-xs text-slate-500">Track rounds and record evaluation rubrics.</p>
                        </div>
                        <button
                          onClick={() => setShowScheduleModal(true)}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 flex items-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Schedule Round</span>
                        </button>
                      </div>

                      {/* Interview List */}
                      {(dossierData.interviews || []).length > 0 ? (
                        <div className="space-y-3">
                          {dossierData.interviews.map((iv: any) => (
                            <div key={iv.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-sm text-slate-900">{iv.round_name}</span>
                                  <span className="text-xs text-slate-500 block mt-0.5">
                                    Mode: <span className="capitalize font-semibold text-slate-700">{iv.interview_mode || "virtual"}</span> &bull; Status: <span className="capitalize font-semibold text-indigo-700">{iv.status}</span>
                                  </span>
                                </div>

                                {iv.status === "scheduled" && (
                                  <button
                                    onClick={() => {
                                      setActiveInterviewId(iv.id);
                                      setShowFeedbackModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold text-xs"
                                  >
                                    Submit Feedback
                                  </button>
                                )}
                              </div>

                              <div className="text-xs text-slate-600 flex items-center gap-4">
                                <span>Date: {new Date(iv.scheduled_start).toLocaleString()}</span>
                                {iv.meeting_link && (
                                  <a href={iv.meeting_link} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                                    Join Link
                                  </a>
                                )}
                              </div>

                              {iv.feedback && (
                                <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/80 text-xs space-y-1">
                                  <div className="font-bold text-emerald-950 flex items-center gap-2">
                                    <span>Recommendation: {iv.feedback.recommendation.toUpperCase()}</span>
                                  </div>
                                  <div className="text-slate-600">
                                    Ratings: Tech {iv.feedback.technical_rating}/5 &bull; Communication {iv.feedback.communication_rating}/5 &bull; Problem Solving {iv.feedback.problem_solving_rating}/5
                                  </div>
                                  {iv.feedback.detailed_notes && (
                                    <p className="text-slate-700 italic pt-1">&quot;{iv.feedback.detailed_notes}&quot;</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                          No interview rounds scheduled yet.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stage Advancement Footer */}
                  <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">Advance Stage:</span>
                      <select
                        value={advanceStatus}
                        onChange={(e) => setAdvanceStatus(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800"
                      >
                        <option value="screening">Screening</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="technical_round">Technical Round</option>
                        <option value="hr_round">HR Round</option>
                        <option value="offered">Offered Placement</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Reason / Notes..."
                        value={advanceReason}
                        onChange={(e) => setAdvanceReason(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48"
                      />
                      <button
                        onClick={handleAdvanceStage}
                        disabled={advancing}
                        className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition disabled:opacity-50"
                      >
                        {advancing ? "Updating..." : "Update Status"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowScheduleModal(true)}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Schedule Interview</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Modal: Schedule Interview */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900">Schedule Candidate Interview</h3>
                <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleScheduleInterview} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interview Round Title *</label>
                  <input
                    type="text"
                    required
                    value={interviewForm.round_name}
                    onChange={(e) => setInterviewForm({ ...interviewForm, round_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={interviewForm.scheduled_start}
                      onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_start: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">End Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={interviewForm.scheduled_end}
                      onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_end: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Interview Mode</label>
                    <select
                      value={interviewForm.interview_mode}
                      onChange={(e) => setInterviewForm({ ...interviewForm, interview_mode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="virtual">Virtual Meeting</option>
                      <option value="in_person">In-Person Campus Drive</option>
                      <option value="phone">Telephonic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Interviewer Name</label>
                    <input
                      type="text"
                      placeholder="e.g. David Chen"
                      value={interviewForm.interviewer_name}
                      onChange={(e) => setInterviewForm({ ...interviewForm, interviewer_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Meeting Link or Venue Details</label>
                  <input
                    type="text"
                    placeholder="https://meet.google.com/... or Campus Block 4 Lab 2"
                    value={interviewForm.meeting_link}
                    onChange={(e) => setInterviewForm({ ...interviewForm, meeting_link: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Instructions for Candidate</label>
                  <textarea
                    rows={2}
                    value={interviewForm.instructions}
                    onChange={(e) => setInterviewForm({ ...interviewForm, instructions: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={scheduling}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs disabled:opacity-50"
                  >
                    {scheduling ? "Scheduling..." : "Schedule & Notify Candidate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Record Interview Feedback Rubric */}
        {showFeedbackModal && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900">Record Interview Rubric</h3>
                <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
                {/* 1-5 Star Ratings */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700">Technical Depth (1-5)</span>
                      <span className="font-bold text-indigo-700">{feedbackForm.technical_rating} / 5</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={feedbackForm.technical_rating}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, technical_rating: Number(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700">Communication &amp; Articulation (1-5)</span>
                      <span className="font-bold text-indigo-700">{feedbackForm.communication_rating} / 5</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={feedbackForm.communication_rating}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, communication_rating: Number(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700">Problem Solving &amp; Logic (1-5)</span>
                      <span className="font-bold text-indigo-700">{feedbackForm.problem_solving_rating} / 5</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={feedbackForm.problem_solving_rating}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, problem_solving_rating: Number(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hiring Recommendation *</label>
                  <select
                    value={feedbackForm.recommendation}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, recommendation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                  >
                    <option value="strong_hire">Strong Hire</option>
                    <option value="hire">Hire</option>
                    <option value="borderline">Borderline / Additional Evaluation</option>
                    <option value="no_hire">No Hire</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Evaluator Detailed Notes</label>
                  <textarea
                    rows={3}
                    value={feedbackForm.detailed_notes}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, detailed_notes: e.target.value })}
                    placeholder="Assessment summary, strengths, code cleanliness..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs disabled:opacity-50"
                  >
                    {submittingFeedback ? "Saving..." : "Submit Evaluation Rubric"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}

export default function RecruiterApplicantsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading candidate intelligence...</div>}>
      <RecruiterApplicantsContent />
    </Suspense>
  );
}
