"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Briefcase, Search, Filter, Bookmark, BookmarkCheck,
  Building2, MapPin, IndianRupee, Clock, CheckCircle2,
  AlertCircle, ChevronRight, Sparkles, SlidersHorizontal,
  GraduationCap, ArrowUpDown, RefreshCw, X, Radar
} from "lucide-react";
import { apiService } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

interface JobCompany {
  id: string;
  name: string;
  website_url: string;
  industry: string;
  company_size: string;
  headquarters?: string;
  logo_url?: string;
  is_verified: boolean;
}

interface JobSkill {
  id: number;
  name: string;
  category?: string;
  is_mandatory: boolean;
  weight: number;
}

interface JobEligibility {
  min_cgpa: number;
  max_backlogs_allowed: number;
  allowed_grad_years: number[];
  allowed_departments: string[];
  gender_preference: string;
}

interface JobItem {
  id: string;
  title: string;
  company: JobCompany;
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
  skills: JobSkill[];
  eligibility?: JobEligibility;
  match_score?: number;
  is_eligible?: boolean;
  is_saved: boolean;
  has_applied: boolean;
  application_status?: string;
  applicants_count: number;
}

export default function StudentJobsPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters & State
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("");
  const [workplaceType, setWorkplaceType] = useState("");
  const [department, setDepartment] = useState("");
  const [sortBy, setSortBy] = useState("match_score");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getJobs({
        search: search || undefined,
        job_type: jobType || undefined,
        workplace_type: workplaceType || undefined,
        department: department || undefined,
        saved_only: showSavedOnly,
        sort_by: sortBy,
        page,
        page_size: 9,
      });
      if (res.success && res.data) {
        setJobs(res.data.items || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.total_pages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [search, jobType, workplaceType, department, showSavedOnly, sortBy, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleToggleSave = async (e: React.MouseEvent, jobId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarkingId(jobId);
    try {
      const res = await apiService.toggleSaveJob(jobId);
      if (res.success) {
        const isNowSaved = res.data.is_saved;
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, is_saved: isNowSaved } : j))
        );
        if (showSavedOnly && !isNowSaved) {
          setJobs((prev) => prev.filter((j) => j.id !== jobId));
          setTotal((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error("Failed to bookmark job:", err);
    } finally {
      setBookmarkingId(null);
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Competitive Stipend/CTC";
    const minLPA = min ? (min / 100000).toFixed(1) : null;
    const maxLPA = max ? (max / 100000).toFixed(1) : null;
    if (minLPA && maxLPA) return `₹${minLPA} - ₹${maxLPA} LPA`;
    if (maxLPA) return `Up to ₹${maxLPA} LPA`;
    return `₹${minLPA}+ LPA`;
  };

  const formatDeadline = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = d.getTime() - Date.now();
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return "Closed";
    if (daysLeft === 0) return "Closes Today";
    if (daysLeft === 1) return "1 day left";
    return `${daysLeft} days left`;
  };

  const clearAllFilters = () => {
    setSearch("");
    setJobType("");
    setWorkplaceType("");
    setDepartment("");
    setShowSavedOnly(false);
    setSortBy("match_score");
    setPage(1);
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-[#F6F5F0] text-[#202823] p-4 md:p-8 space-y-6">
        {/* Header Banner */}
        <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#244D3D]/10 text-[#244D3D]">
                <Sparkles className="w-3.5 h-3.5" /> AI Candidate Matching Active
              </span>
              <span className="text-xs text-[#727B74]">
                Showing {total} Opportunities
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#202823] font-['Space_Grotesk']">
              Campus & Partner Job Discovery
            </h1>
            <p className="text-sm text-[#727B74] mt-1 max-w-2xl">
              Explore verified placement drives and corporate requisitions ranked dynamically by your TF-IDF semantic profile similarity and institutional academic criteria.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <Link
              href="/student/jobs/radar"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#244D3D] text-[#C9E66B] hover:bg-[#1E3028] transition-all shadow-xs"
            >
              <Radar className="w-4 h-4 animate-pulse" />
              Opportunity Radar
            </Link>
            <button
              onClick={() => {
                setShowSavedOnly(!showSavedOnly);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                showSavedOnly
                  ? "bg-[#244D3D] text-white border-[#244D3D]"
                  : "bg-white text-[#202823] border-[#E2E4DC] hover:border-[#244D3D]"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${showSavedOnly ? "fill-white" : ""}`} />
              Saved Jobs
            </button>
            <button
              onClick={() => fetchJobs()}
              className="p-2.5 bg-white border border-[#E2E4DC] hover:border-[#244D3D] rounded-xl text-[#727B74] hover:text-[#202823] transition-colors"
              title="Refresh listings"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-[#E2E4DC] p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#727B74]" />
              <input
                type="text"
                placeholder="Search by job title, company name, skill, or keyword..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E4DC] text-sm focus:outline-none focus:border-[#244D3D] transition-colors bg-[#F6F5F0]/50"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Job Type Dropdown */}
            <select
              value={jobType}
              onChange={(e) => {
                setJobType(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-44 px-3 py-2.5 rounded-xl border border-[#E2E4DC] text-sm text-[#202823] focus:outline-none focus:border-[#244D3D] bg-white"
            >
              <option value="">All Job Types</option>
              <option value="full_time">Full-Time FTE</option>
              <option value="internship">Internship</option>
              <option value="intern_to_fte">Intern to FTE</option>
            </select>

            {/* Workplace Type Dropdown */}
            <select
              value={workplaceType}
              onChange={(e) => {
                setWorkplaceType(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-44 px-3 py-2.5 rounded-xl border border-[#E2E4DC] text-sm text-[#202823] focus:outline-none focus:border-[#244D3D] bg-white"
            >
              <option value="">Workplace Type</option>
              <option value="on_site">On-Site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-[#727B74] whitespace-nowrap hidden lg:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full md:w-44 px-3 py-2.5 rounded-xl border border-[#E2E4DC] text-sm text-[#202823] focus:outline-none focus:border-[#244D3D] bg-white font-medium"
              >
                <option value="match_score">AI Match Score</option>
                <option value="newest">Newest First</option>
                <option value="salary">Highest Salary</option>
                <option value="deadline">Application Deadline</option>
              </select>
            </div>
          </div>

          {/* Quick Active Filter Pills */}
          {(search || jobType || workplaceType || showSavedOnly) && (
            <div className="flex items-center gap-2 pt-2 border-t border-[#E2E4DC] flex-wrap text-xs text-[#727B74]">
              <span>Active filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#244D3D]/10 text-[#244D3D]">
                  Keyword: {search}
                  <button onClick={() => setSearch("")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {jobType && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#244D3D]/10 text-[#244D3D]">
                  Type: {jobType}
                  <button onClick={() => setJobType("")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {workplaceType && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#244D3D]/10 text-[#244D3D]">
                  Workplace: {workplaceType}
                  <button onClick={() => setWorkplaceType("")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {showSavedOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#244D3D]/10 text-[#244D3D]">
                  Saved Only
                  <button onClick={() => setShowSavedOnly(false)}><X className="w-3 h-3" /></button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs font-semibold text-red-600 hover:underline ml-auto"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Job Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm space-y-4 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E4DC] p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-[#244D3D]/10 text-[#244D3D] rounded-full flex items-center justify-center mx-auto">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#202823]">No job opportunities match your criteria</h3>
            <p className="text-sm text-[#727B74] max-w-md mx-auto">
              {showSavedOnly
                ? "You haven't bookmarked any jobs yet. Browse available jobs and click the bookmark icon to save them."
                : "Try adjusting your search terms or clear filters to see more verified opportunities."}
            </p>
            <button
              onClick={clearAllFilters}
              className="px-5 py-2.5 rounded-xl bg-[#244D3D] text-white text-sm font-semibold hover:bg-[#1E3028] transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => {
              const matchScore = job.match_score ?? 75.0;
              const isHighMatch = matchScore >= 80;
              const isMediumMatch = matchScore >= 60;

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-[#E2E4DC] hover:border-[#244D3D]/40 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Top Row: Company logo/initials & Bookmark */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#ECEDE7] border border-[#E2E4DC] flex items-center justify-center font-bold text-lg text-[#244D3D] overflow-hidden">
                          {job.company.logo_url ? (
                            <img
                              src={job.company.logo_url}
                              alt={job.company.name}
                              className="w-full h-full object-contain p-1.5"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            job.company.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#202823] flex items-center gap-1.5">
                            {job.company.name}
                            {job.company.is_verified && (
                              <span title="Verified Campus Partner">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 inline" />
                              </span>
                            )}
                          </h4>
                          <span className="text-xs text-[#727B74] block">
                            {job.company.industry}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleToggleSave(e, job.id)}
                        disabled={bookmarkingId === job.id}
                        className={`p-2 rounded-xl border transition-colors ${
                          job.is_saved
                            ? "bg-[#244D3D]/10 text-[#244D3D] border-[#244D3D]/30"
                            : "bg-white text-[#727B74] border-[#E2E4DC] hover:text-[#202823] hover:border-[#244D3D]"
                        }`}
                        title={job.is_saved ? "Remove bookmark" : "Bookmark job"}
                      >
                        {job.is_saved ? (
                          <BookmarkCheck className="w-4 h-4 fill-[#244D3D]" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Job Title & Badges */}
                    <div>
                      <Link href={`/student/jobs/${job.id}`}>
                        <h3 className="text-base font-bold text-[#202823] group-hover:text-[#244D3D] transition-colors line-clamp-1">
                          {job.title}
                        </h3>
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECEDE7] text-[#202823]">
                          {job.job_type.replace("_", " ").toUpperCase()}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-[#727B74]">
                          <MapPin className="w-3.5 h-3.5" /> {job.location} ({job.workplace_type})
                        </span>
                      </div>
                    </div>

                    {/* AI Match Score Pill & Eligibility Status */}
                    <div className="bg-[#F6F5F0] rounded-xl p-3 border border-[#E2E4DC] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-['IBM_Plex_Mono'] font-bold text-xs ${
                            isHighMatch
                              ? "bg-[#C9E66B] text-[#1E3028]"
                              : isMediumMatch
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {matchScore.toFixed(0)}%
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#202823] flex items-center gap-1">
                            <span>Compatibility</span>
                            {job.is_eligible === false && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Ineligible
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#727B74]">
                            {isHighMatch ? "Strong fit for profile" : isMediumMatch ? "Moderate skill match" : "Explore skill gaps"}
                          </span>
                        </div>
                      </div>

                      {job.has_applied && (
                        <span className="px-2 py-1 rounded text-[11px] font-bold bg-[#244D3D] text-white">
                          Applied
                        </span>
                      )}
                    </div>

                    {/* Skill Tags Preview */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.skills.slice(0, 3).map((s) => (
                        <span
                          key={s.name}
                          className="px-2 py-0.5 rounded text-[11px] bg-white border border-[#E2E4DC] text-[#202823]"
                        >
                          {s.name}
                        </span>
                      ))}
                      {job.skills.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded text-[11px] text-[#727B74] bg-[#ECEDE7]">
                          +{job.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Action Row */}
                  <div className="pt-4 mt-4 border-t border-[#E2E4DC] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#727B74] block">CTC / Stipend</span>
                      <span className="font-bold text-[#202823] font-['IBM_Plex_Mono']">
                        {formatSalary(job.salary_min, job.salary_max)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[#727B74] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDeadline(job.application_deadline)}
                      </span>
                      <Link
                        href={`/student/jobs/${job.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-[#244D3D] hover:bg-[#1E3028] text-white font-semibold transition-colors flex items-center gap-1"
                      >
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-2xl border border-[#E2E4DC] p-4 shadow-sm">
            <span className="text-xs text-[#727B74]">
              Page {page} of {totalPages} ({total} opportunities)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-[#E2E4DC] text-xs font-semibold disabled:opacity-40 hover:bg-[#F6F5F0]"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold ${
                    p === page
                      ? "bg-[#244D3D] text-white"
                      : "border border-[#E2E4DC] hover:bg-[#F6F5F0]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-[#E2E4DC] text-xs font-semibold disabled:opacity-40 hover:bg-[#F6F5F0]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
