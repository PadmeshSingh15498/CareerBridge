"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase, Plus, Search, Building2, MapPin, IndianRupee,
  Clock, CheckCircle2, AlertCircle, Users, ExternalLink,
  ChevronRight, RefreshCw, X, ShieldAlert, Sparkles, Filter,
  Pause, Play, AlertTriangle
} from "lucide-react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { api } from "@/lib/api";

interface RecruiterJob {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    website_url: string;
    industry: string;
    is_verified?: boolean;
  };
  job_type: string;
  workplace_type: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  vacancies: number;
  status: string;
  application_deadline: string;
  created_at: string;
  skills: Array<{ name: string; is_mandatory: boolean }>;
  eligibility?: {
    min_cgpa: number;
    max_backlogs_allowed: number;
    allowed_grad_years: number[];
    allowed_departments: string[];
  };
  applicants_count: number;
}

export default function RecruiterJobsPage() {
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // Create Job Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [aiReviewed, setAiReviewed] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    title: "",
    job_type: "full_time",
    workplace_type: "hybrid",
    location: "Bengaluru, India",
    description: "",
    requirements: "",
    salary_min: 1200000,
    salary_max: 1800000,
    vacancies: 3,
    application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    required_skills: "Python, FastAPI, Docker",
    preferred_skills: "PostgreSQL, Redis, Kubernetes",
    min_cgpa: 7.0,
    max_backlogs: 0,
    allowed_departments: "Computer Science, Information Technology, Electronics & Communication",
    allowed_grad_years: "2026",
    key_focus: "Cloud microservices and distributed APIs"
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.getRecruiterJobs(statusFilter || undefined);
      if (res && res.data) {
        setJobs(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load recruiter jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  // AI-Assisted Job Description Generator
  const handleGenerateAI = async () => {
    if (!formData.title.trim()) {
      setCreateError("Please enter a Job Title before generating with AI.");
      return;
    }
    setGeneratingAI(true);
    setCreateError(null);

    try {
      const coreSkillsList = formData.required_skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.generateJobDescription({
        job_title: formData.title,
        industry: "Enterprise Technology & SaaS",
        experience_level: "Campus Graduate / Entry Level",
        workplace_type: formData.workplace_type,
        core_skills: coreSkillsList,
        key_responsibilities: formData.key_focus
      });

      if (res && res.data) {
        setFormData((prev) => ({
          ...prev,
          description: res.data.formatted_description || prev.description,
          requirements: res.data.formatted_requirements || prev.requirements
        }));
        setAiReviewed(true);
        setNotice("AI Job Description synthesized! Please review and approve all qualifications before submitting.");
        setTimeout(() => setNotice(null), 5000);
      }
    } catch (err: any) {
      console.error("AI Generation error:", err);
      setCreateError("AI generation failed. You can draft manually.");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const reqSkills = formData.required_skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => ({ name: s, is_mandatory: true, weight: 1.0 }));

      const prefSkills = formData.preferred_skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => ({ name: s, is_mandatory: false, weight: 0.5 }));

      const allSkills = [...reqSkills, ...prefSkills];

      const depts = formData.allowed_departments
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      const years = formData.allowed_grad_years
        .split(",")
        .map((y) => parseInt(y.trim()))
        .filter((y) => !isNaN(y));

      const payload = {
        title: formData.title,
        job_type: formData.job_type,
        workplace_type: formData.workplace_type,
        location: formData.location,
        description: formData.description,
        requirements: formData.requirements,
        salary_min: Number(formData.salary_min) || undefined,
        salary_max: Number(formData.salary_max) || undefined,
        salary_currency: "INR",
        vacancies: Number(formData.vacancies) || 1,
        application_deadline: new Date(formData.application_deadline).toISOString(),
        skills: allSkills,
        eligibility: {
          min_cgpa: Number(formData.min_cgpa),
          max_backlogs_allowed: Number(formData.max_backlogs),
          allowed_departments: depts,
          allowed_grad_years: years,
          gender_preference: "any"
        }
      };

      const res = await api.createRecruiterJob(payload);
      if (res && res.data) {
        setShowCreateModal(false);
        const noticeMsg = res.data.verification_notice
          ? res.data.verification_notice
          : `Job requisition '${res.data.title}' created successfully!`;
        setNotice(noticeMsg);
        setTimeout(() => setNotice(null), 6000);
        fetchJobs();
      }
    } catch (err: any) {
      console.error("Job creation failed:", err);
      const detail = err.response?.data?.detail || "Failed to create job requisition.";
      setCreateError(detail);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (jobId: string, targetStatus: string) => {
    try {
      await api.updateRecruiterJobStatus(jobId, targetStatus);
      setNotice(`Job status changed to '${targetStatus}'.`);
      setTimeout(() => setNotice(null), 4000);
      fetchJobs();
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Failed to update job status.";
      setNotice(detail);
      setTimeout(() => setNotice(null), 5000);
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Disclosed on review";
    const toLakhs = (val: number) => (val / 100000).toFixed(1) + " LPA";
    if (min && max) return `₹${toLakhs(min)} - ₹${toLakhs(max)}`;
    if (min) return `₹${toLakhs(min)}+`;
    return `Up to ₹${toLakhs(max!)}`;
  };

  const filteredJobs = jobs.filter((j) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q);
  });

  return (
    <WorkspaceShell role="recruiter" activeTabTitle="Jobs">
      <div className="space-y-6 pb-12">
        {/* Notice Banner */}
        {notice && (
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm font-medium flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full font-semibold">
                Requisition Lifecycle
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Campus Recruitment Requisitions
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Create, publish, and manage campus job openings with automated AI skill taxonomy and institutional eligibility gating.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchJobs}
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-slate-900 transition shadow-xs"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Requisition</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by role or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-medium">Status Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-medium focus:outline-none focus:border-indigo-600"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Openings</option>
              <option value="pending_approval">Pending TPO Approval</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed / Archived</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>

        {/* Job Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-12 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
            <Briefcase className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No requisitions found</h3>
            <p className="text-xs text-slate-500">Click &quot;Post New Requisition&quot; to create your first campus opening.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        job.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : job.status === "pending_approval"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : job.status === "paused"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {job.status.replace("_", " ")}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {job.vacancies} {job.vacancies === 1 ? "Opening" : "Openings"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">{job.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.location} ({job.workplace_type})</span>
                    </div>
                  </div>

                  {/* Compensation & Applicants */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Salary Package</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {formatSalary(job.salary_min, job.salary_max)}
                      </span>
                    </div>

                    <Link
                      href={`/recruiter/applicants?job_id=${job.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{job.applicants_count || 0} Candidates</span>
                    </Link>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1">
                    {(job.skills || []).slice(0, 4).map((s) => (
                      <span key={s.name} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                        {s.name}
                      </span>
                    ))}
                    {(job.skills || []).length > 4 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px]">
                        +{job.skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Closes {new Date(job.application_deadline).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {job.status === "active" ? (
                      <button
                        onClick={() => handleStatusChange(job.id, "paused")}
                        className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                        title="Pause applications"
                      >
                        Pause
                      </button>
                    ) : job.status === "paused" ? (
                      <button
                        onClick={() => handleStatusChange(job.id, "active")}
                        className="px-2 py-1 rounded-lg border border-emerald-200 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                        title="Resume applications"
                      >
                        Publish
                      </button>
                    ) : null}

                    {job.status !== "closed" && (
                      <button
                        onClick={() => handleStatusChange(job.id, "closed")}
                        className="px-2 py-1 rounded-lg border border-rose-200 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Close
                      </button>
                    )}

                    <Link
                      href={`/recruiter/applicants?job_id=${job.id}`}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 transition"
                    >
                      Applicants
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create Job + AI Description Generator */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Post New Campus Requisition</h2>
                  <p className="text-xs text-slate-500">Configure role requirements, skill weights, and academic criteria.</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* AI Assistant Banner */}
              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-white border border-indigo-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>AI-Assisted Job Requisition Generator</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={generatingAI}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition"
                  >
                    {generatingAI ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                        <span>Generate with AI</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  Enter your job title and core skills below, then click &quot;Generate with AI&quot; to synthesize industry-standard responsibilities, minimum qualifications, and benefits.
                </p>
                {aiReviewed && (
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>AI draft generated. Please review and customize the text before final submission.</span>
                  </div>
                )}
              </div>

              {createError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateJob} className="space-y-5">
                {/* Title & Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Role Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Graduate Software Engineer"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Type</label>
                    <select
                      value={formData.job_type}
                      onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600 bg-white"
                    >
                      <option value="full_time">Full-Time (FTE)</option>
                      <option value="internship">Internship (6 Months)</option>
                      <option value="intern_to_fte">Internship to Full-Time (PPO)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Workplace Model</label>
                    <select
                      value={formData.workplace_type}
                      onChange={(e) => setFormData({ ...formData, workplace_type: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600 bg-white"
                    >
                      <option value="on_site">On-Site (Office / Campus)</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mandatory Required Skills (Comma separated) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Python, SQL, Docker, FastAPI"
                      value={formData.required_skills}
                      onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Preferred Skills (Comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. React, Redis, AWS"
                      value={formData.preferred_skills}
                      onChange={(e) => setFormData({ ...formData, preferred_skills: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* Compensation & Openings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Min Salary (CTC in INR)</label>
                    <input
                      type="number"
                      value={formData.salary_min}
                      onChange={(e) => setFormData({ ...formData, salary_min: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Max Salary (CTC in INR)</label>
                    <input
                      type="number"
                      value={formData.salary_max}
                      onChange={(e) => setFormData({ ...formData, salary_max: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Openings</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.vacancies}
                      onChange={(e) => setFormData({ ...formData, vacancies: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* Academic Eligibility */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Academic Eligibility Criteria
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Minimum CGPA (0-10)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={formData.min_cgpa}
                        onChange={(e) => setFormData({ ...formData, min_cgpa: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Max Backlogs Allowed</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.max_backlogs}
                        onChange={(e) => setFormData({ ...formData, max_backlogs: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Allowed Batches</label>
                      <input
                        type="text"
                        placeholder="2025, 2026"
                        value={formData.allowed_grad_years}
                        onChange={(e) => setFormData({ ...formData, allowed_grad_years: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Job Description (Editable markdown) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Role Description (Markdown) *</label>
                    <span className="text-[10px] text-slate-400">Review AI-generated text or craft custom specs</span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter detailed role overview, mission, and responsibilities..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600 font-mono leading-relaxed"
                  />
                </div>

                {/* Job Requirements */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Technical Requirements &amp; Qualifications</label>
                  <textarea
                    rows={4}
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="Enter minimum and preferred qualifications..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600 font-mono leading-relaxed"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {creating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Publishing Requisition...</span>
                      </>
                    ) : (
                      <span>Submit &amp; Publish Requisition</span>
                    )}
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
