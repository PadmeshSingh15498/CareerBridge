"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Briefcase, Building2, MapPin, IndianRupee, Clock,
  Calendar, CheckCircle2, AlertCircle, ArrowLeft, Bookmark,
  BookmarkCheck, Sparkles, Send, FileText, Check, ShieldCheck,
  ChevronRight, ExternalLink, X, HelpCircle
} from "lucide-react";
import { apiService } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

interface JobDetail {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    website_url: string;
    industry: string;
    company_size: string;
    headquarters?: string;
    logo_url?: string;
    is_verified: boolean;
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
  description: string;
  requirements: string;
  skills: Array<{
    id: number;
    name: string;
    category?: string;
    is_mandatory: boolean;
    weight: number;
  }>;
  eligibility?: {
    min_cgpa: number;
    max_backlogs_allowed: number;
    allowed_grad_years: number[];
    allowed_departments: string[];
    gender_preference: string;
  };
  match_score?: number;
  is_eligible?: boolean;
  is_saved: boolean;
  has_applied: boolean;
  application_status?: string;
  applicants_count: number;
  posted_by_name?: string;
  recruitment_process?: string[];
  match_breakdown?: {
    semantic_similarity: number;
    skill_overlap_ratio: number;
    composite_score: number;
    matched_skills: string[];
    missing_skills: string[];
    is_eligible: boolean;
    eligibility_breakdown: {
      cgpa_met: boolean;
      cgpa_required: number;
      cgpa_student: number;
      backlogs_met: boolean;
      backlogs_max: number;
      backlogs_student: number;
      department_met: boolean;
      department_allowed: string[];
      department_student: string;
      grad_year_met: boolean;
      grad_years_allowed: number[];
      grad_year_student: number;
      reasons_if_ineligible: string[];
    };
  };
}

interface StudentResume {
  id: string;
  filename: string;
  file_format: string;
  created_at: string;
  analysis?: {
    ats_score: number;
  };
}

export default function StudentJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumes, setResumes] = useState<StudentResume[]>([]);

  // Application Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    async function fetchJobAndResumes() {
      if (!jobId) return;
      setLoading(true);
      try {
        const [jobRes, resumeRes] = await Promise.all([
          apiService.getJobDetail(jobId),
          apiService.getMyResumes(),
        ]);

        if (jobRes.success && jobRes.data) {
          setJob(jobRes.data);
        } else {
          setError(jobRes.message || "Failed to load job details");
        }

        if (resumeRes.success && resumeRes.data) {
          const list = resumeRes.data || [];
          setResumes(list);
          if (list.length > 0) {
            setSelectedResumeId(list[0].id);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load job details");
      } finally {
        setLoading(false);
      }
    }

    fetchJobAndResumes();
  }, [jobId]);

  const handleToggleSave = async () => {
    if (!job) return;
    try {
      const res = await apiService.toggleSaveJob(job.id);
      if (res.success) {
        setJob({ ...job, is_saved: res.data.is_saved });
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleConfirmApply = async () => {
    if (!job || !selectedResumeId) return;
    setSubmitting(true);
    setApplyError(null);
    try {
      const res = await apiService.applyToJob({
        job_id: job.id,
        resume_id: selectedResumeId,
        cover_letter: coverLetter.trim() || undefined,
      });

      if (res.success) {
        setApplySuccess(true);
        setJob({
          ...job,
          has_applied: true,
          application_status: "applied",
          applicants_count: job.applicants_count + 1,
        });
      }
    } catch (err: any) {
      setApplyError(err.response?.data?.detail || "Application failed. Please check eligibility requirements.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Competitive CTC / Stipend";
    const minLPA = min ? (min / 100000).toFixed(1) : null;
    const maxLPA = max ? (max / 100000).toFixed(1) : null;
    if (minLPA && maxLPA) return `₹${minLPA} - ₹${maxLPA} LPA`;
    if (maxLPA) return `Up to ₹${maxLPA} LPA`;
    return `₹${minLPA}+ LPA`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F5F0] p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#244D3D] font-bold">
          <div className="w-5 h-5 border-2 border-[#244D3D] border-t-transparent rounded-full animate-spin"></div>
          Loading Requisition Intelligence...
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#F6F5F0] p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#E2E4DC] p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-[#202823]">Job Opening Not Found</h2>
          <p className="text-sm text-[#727B74]">{error || "This position may have been closed or archived."}</p>
          <Link
            href="/student/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#244D3D] text-white text-sm font-semibold hover:bg-[#1E3028]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Job Catalog
          </Link>
        </div>
      </div>
    );
  }

  const breakdown = job.match_breakdown;
  const isEligible = job.is_eligible !== false;
  const matchScore = job.match_score ?? 75.0;

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-[#F6F5F0] text-[#202823] p-4 md:p-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/student/jobs"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#727B74] hover:text-[#202823] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Discover Opportunities
          </Link>

          <button
            onClick={handleToggleSave}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              job.is_saved
                ? "bg-[#244D3D]/10 text-[#244D3D] border-[#244D3D]/30"
                : "bg-white text-[#202823] border-[#E2E4DC] hover:border-[#244D3D]"
            }`}
          >
            {job.is_saved ? (
              <>
                <BookmarkCheck className="w-4 h-4 fill-[#244D3D]" /> Saved
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" /> Save Job
              </>
            )}
          </button>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#ECEDE7] border border-[#E2E4DC] flex items-center justify-center font-extrabold text-2xl text-[#244D3D] overflow-hidden flex-shrink-0">
                {job.company.logo_url ? (
                  <img
                    src={job.company.logo_url}
                    alt={job.company.name}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  job.company.name.charAt(0)
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#202823]">{job.company.name}</h3>
                  {job.company.is_verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      <CheckCircle2 className="w-3 h-3" /> Verified Partner
                    </span>
                  )}
                  {job.company.website_url && (
                    <a
                      href={job.company.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#244D3D] transition-colors"
                      title="Visit company website"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold text-[#202823] mt-1 font-['Space_Grotesk']">
                  {job.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-[#727B74]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {job.location} ({job.workplace_type})
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" /> {job.job_type.replace("_", " ").toUpperCase()}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-bold text-[#202823] font-['IBM_Plex_Mono']">
                    <IndianRupee className="w-3.5 h-3.5 text-[#244D3D]" /> {formatSalary(job.salary_min, job.salary_max)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Deadline: {new Date(job.application_deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Apply Action / Status Widget */}
            <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0">
              {job.has_applied ? (
                <div className="bg-[#244D3D]/10 border border-[#244D3D]/30 rounded-xl p-4 text-left md:text-right space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#244D3D]">
                    <CheckCircle2 className="w-4 h-4" /> Application Submitted
                  </div>
                  <p className="text-xs text-[#727B74]">
                    Current Status: <span className="font-bold text-[#202823] capitalize">{job.application_status?.replace("_", " ")}</span>
                  </p>
                  <Link
                    href="/student/applications"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#244D3D] hover:underline pt-1"
                  >
                    View Status History <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : isEligible ? (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="px-6 py-3 rounded-xl bg-[#244D3D] hover:bg-[#1E3028] text-white font-bold text-sm transition-all shadow-sm hover:shadow flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> 1-Click Apply Now
                </button>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left md:text-right space-y-1">
                  <div className="text-xs font-bold text-amber-800 flex items-center gap-1 md:justify-end">
                    <AlertCircle className="w-3.5 h-3.5" /> Academic Gating Ineligible
                  </div>
                  <p className="text-[11px] text-amber-700 max-w-xs">
                    You do not currently satisfy one or more institutional eligibility rules for this requisition.
                  </p>
                </div>
              )}

              <span className="text-[11px] text-[#727B74]">
                {job.applicants_count} students have applied
              </span>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content: Description, Requirements, Recruitment stages */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-[#202823] font-['Space_Grotesk']">
                Role Overview & Responsibilities
              </h2>
              <div className="text-sm text-[#202823]/90 leading-relaxed whitespace-pre-line">
                {job.description}
              </div>
            </div>

            {/* Requirements & Skills */}
            <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-[#202823] font-['Space_Grotesk']">
                Skill Competencies & Requirements
              </h2>
              <div className="text-sm text-[#202823]/90 leading-relaxed whitespace-pre-line mb-4">
                {job.requirements}
              </div>

              {/* Skills breakdown */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-[#727B74] uppercase tracking-wider">
                  Target Competencies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s) => (
                    <span
                      key={s.name}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        s.is_mandatory
                          ? "bg-[#244D3D]/10 text-[#244D3D] border-[#244D3D]/30"
                          : "bg-[#ECEDE7] text-[#202823] border-[#E2E4DC]"
                      }`}
                    >
                      {s.name}
                      {s.is_mandatory ? (
                        <span className="text-[10px] text-[#244D3D] opacity-80">(Required)</span>
                      ) : (
                        <span className="text-[10px] text-[#727B74]">(Preferred)</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recruitment Pipeline Stages */}
            <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-[#202823] font-['Space_Grotesk']">
                Selection Process Stages
              </h2>
              <div className="space-y-3">
                {(job.recruitment_process || [
                  "Resume Screening & Eligibility Audit",
                  "Technical Skill Evaluation",
                  "Technical Domain Interview",
                  "HR & Leadership Fitment",
                  "Final Placement Offer"
                ]).map((stage, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-[#F6F5F0] border border-[#E2E4DC]">
                    <div className="w-7 h-7 rounded-full bg-[#244D3D] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-semibold text-[#202823]">{stage}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: AI Match Intelligence & Eligibility Audit */}
          <div className="space-y-6">
            {/* AI Match Intelligence Card */}
            <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#202823] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#244D3D]" /> AI Compatibility Match
                </h3>
                <span className="text-xs text-[#727B74]">TF-IDF Semantic</span>
              </div>

              {/* Match Score Meter */}
              <div className="bg-[#F6F5F0] rounded-xl p-4 border border-[#E2E4DC] text-center space-y-2">
                <div className="text-4xl font-extrabold text-[#244D3D] font-['IBM_Plex_Mono']">
                  {matchScore.toFixed(1)}%
                </div>
                <div className="text-xs font-semibold text-[#202823]">
                  {matchScore >= 80 ? "Exceptional Candidate Alignment" : matchScore >= 60 ? "Strong Foundational Fit" : "Potential Skill Gap"}
                </div>
                <p className="text-[11px] text-[#727B74] leading-relaxed">
                  Composite score calculated from 50% semantic vector similarity, 35% direct skill taxonomy overlap, and 15% institutional criteria pass.
                </p>
              </div>

              {/* Matched vs Missing Skills */}
              {breakdown && (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="font-bold text-[#244D3D] block mb-2 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Matched Skills ({breakdown.matched_skills.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {breakdown.matched_skills.map((ms) => (
                        <span key={ms} className="px-2 py-0.5 rounded bg-[#C9E66B]/30 text-[#1E3028] font-medium border border-[#C9E66B]/50">
                          {ms}
                        </span>
                      ))}
                      {breakdown.matched_skills.length === 0 && (
                        <span className="text-gray-400">None detected from your profile yet.</span>
                      )}
                    </div>
                  </div>

                  {breakdown.missing_skills.length > 0 && (
                    <div>
                      <span className="font-bold text-amber-800 block mb-2 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Missing / Unverified Skills ({breakdown.missing_skills.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {breakdown.missing_skills.map((mis) => (
                          <span key={mis} className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            {mis}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Institutional Academic Eligibility Card */}
            <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#202823] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#244D3D]" /> Placement Eligibility Audit
              </h3>

              {job.eligibility ? (
                <div className="space-y-3 text-xs">
                  {/* CGPA */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F5F0]">
                    <div>
                      <span className="text-[#727B74] block">Minimum CGPA Required</span>
                      <span className="font-bold text-[#202823]">{job.eligibility.min_cgpa.toFixed(2)} CGPA</span>
                    </div>
                    {breakdown?.eligibility_breakdown && (
                      <span className={`px-2 py-0.5 rounded font-bold ${breakdown.eligibility_breakdown.cgpa_met ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"}`}>
                        {breakdown.eligibility_breakdown.cgpa_met ? "Satisfied" : "Unmet"}
                      </span>
                    )}
                  </div>

                  {/* Backlogs */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F5F0]">
                    <div>
                      <span className="text-[#727B74] block">Max Backlogs Permitted</span>
                      <span className="font-bold text-[#202823]">{job.eligibility.max_backlogs_allowed} Backlogs</span>
                    </div>
                    {breakdown?.eligibility_breakdown && (
                      <span className={`px-2 py-0.5 rounded font-bold ${breakdown.eligibility_breakdown.backlogs_met ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"}`}>
                        {breakdown.eligibility_breakdown.backlogs_met ? "Satisfied" : "Exceeded"}
                      </span>
                    )}
                  </div>

                  {/* Allowed Departments */}
                  <div className="p-2.5 rounded-lg bg-[#F6F5F0] space-y-1">
                    <span className="text-[#727B74] block">Allowed Departments</span>
                    <div className="flex flex-wrap gap-1">
                      {job.eligibility.allowed_departments.length === 0 ? (
                        <span className="font-bold text-[#202823]">All Engineering & Science Batches</span>
                      ) : (
                        job.eligibility.allowed_departments.map((d) => (
                          <span key={d} className="px-1.5 py-0.5 bg-white border border-[#E2E4DC] rounded text-[10px] text-[#202823]">
                            {d}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Allowed Grad Years */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F5F0]">
                    <div>
                      <span className="text-[#727B74] block">Graduation Batch</span>
                      <span className="font-bold text-[#202823]">{job.eligibility.allowed_grad_years.join(", ")}</span>
                    </div>
                    {breakdown?.eligibility_breakdown && (
                      <span className={`px-2 py-0.5 rounded font-bold ${breakdown.eligibility_breakdown.grad_year_met ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"}`}>
                        {breakdown.eligibility_breakdown.grad_year_met ? "Eligible" : "Batch Ineligible"}
                      </span>
                    )}
                  </div>

                  {/* Ineligibility Warning */}
                  {breakdown?.eligibility_breakdown?.reasons_if_ineligible?.length ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                      <span className="font-bold text-red-800 block text-[11px]">Hard Criteria Restrictions:</span>
                      <ul className="list-disc list-inside text-[11px] text-red-700 space-y-0.5">
                        {breakdown.eligibility_breakdown.reasons_if_ineligible.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-[#727B74]">No specific institutional gating constraints configured for this opening.</p>
              )}
            </div>
          </div>
        </div>

        {/* 1-Click Application Confirmation Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E2E4DC] max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-[#E2E4DC] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#244D3D]/10 text-[#244D3D] flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#202823]">Confirm Application</h3>
                    <p className="text-xs text-[#727B74]">{job.title} • {job.company.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {applySuccess ? (
                <div className="py-6 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-[#202823]">Application Submitted!</h4>
                  <p className="text-xs text-[#727B74] max-w-xs mx-auto">
                    Your profile and verified resume have been delivered to the {job.company.name} recruitment team.
                  </p>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => setShowApplyModal(false)}
                      className="px-4 py-2 rounded-xl border border-[#E2E4DC] text-xs font-semibold hover:bg-[#F6F5F0]"
                    >
                      Done
                    </button>
                    <Link
                      href="/student/applications"
                      className="px-4 py-2 rounded-xl bg-[#244D3D] text-white text-xs font-semibold hover:bg-[#1E3028]"
                    >
                      View in Application Pipeline
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  {applyError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>{applyError}</div>
                    </div>
                  )}

                  {/* Resume Selector */}
                  <div className="space-y-2">
                    <label className="font-bold text-[#202823] block">
                      Select Resume Version to Attach:
                    </label>
                    {resumes.length === 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                        No resumes uploaded yet. Please upload a PDF/DOCX in the Resume Center first.
                        <Link href="/student/resume" className="block font-bold underline mt-1">
                          Go to Resume Manager
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {resumes.map((r) => (
                          <label
                            key={r.id}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                              selectedResumeId === r.id
                                ? "bg-[#244D3D]/5 border-[#244D3D]"
                                : "bg-[#F6F5F0] border-[#E2E4DC] hover:border-gray-400"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="resumeChoice"
                                checked={selectedResumeId === r.id}
                                onChange={() => setSelectedResumeId(r.id)}
                                className="text-[#244D3D] focus:ring-[#244D3D]"
                              />
                              <div>
                                <span className="font-bold text-[#202823] block">{r.filename}</span>
                                <span className="text-[11px] text-[#727B74]">
                                  Format: {r.file_format.toUpperCase()} • Uploaded {new Date(r.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {r.analysis?.ats_score && (
                              <span className="px-2 py-0.5 rounded bg-[#C9E66B]/40 text-[#1E3028] font-bold text-[10px] font-['IBM_Plex_Mono']">
                                {r.analysis.ats_score} ATS
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Optional Cover Note */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#202823] block">
                      Candidate Note / Cover Statement (Optional):
                    </label>
                    <textarea
                      rows={3}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Highlight relevant projects, specialized certifications, or specific interest in this role..."
                      className="w-full p-2.5 rounded-xl border border-[#E2E4DC] text-xs focus:outline-none focus:border-[#244D3D] bg-[#F6F5F0]/50"
                    />
                  </div>

                  {/* Policy Confirmation Note */}
                  <div className="p-3 rounded-xl bg-[#F6F5F0] border border-[#E2E4DC] text-[11px] text-[#727B74] space-y-1">
                    <span className="font-bold text-[#202823] block">Institutional Compliance Notice:</span>
                    <p>
                      Submitting this application constitutes a binding campus placement commitment. Your verified academic record and ATS resume will be shared with {job.company.name}.
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowApplyModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-[#E2E4DC] text-xs font-semibold hover:bg-[#F6F5F0]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={submitting || !selectedResumeId || !isEligible}
                      onClick={handleConfirmApply}
                      className="px-5 py-2.5 rounded-xl bg-[#244D3D] text-white text-xs font-bold hover:bg-[#1E3028] disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" /> Submit Application
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

