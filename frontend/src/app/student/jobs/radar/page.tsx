"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Radar, Sparkles, Filter, CheckCircle2, AlertTriangle, XCircle,
  Building2, MapPin, IndianRupee, Clock, ArrowRight, Bookmark,
  BookmarkCheck, SlidersHorizontal, RefreshCw, Info, ChevronDown,
  ChevronUp, Award, BarChart3, HelpCircle, ArrowUpDown, Check
} from "lucide-react";
import { apiService } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

interface BreakdownScores {
  required_skills_pct: number;
  preferred_skills_pct: number;
  semantic_similarity_pct: number;
  project_experience_pct: number;
  career_preference_pct: number;
}

interface RadarJobItem {
  job_id: string;
  match_score: number;
  eligibility_status: string;
  matched_skills: string[];
  missing_required_skills: string[];
  matched_preferred_skills: string[];
  semantic_similarity: number;
  explanation: string;
  category: string;
  is_eligible: boolean;
  eligibility_reasons: string[];
  breakdown?: BreakdownScores;
  recommended_next_steps: string[];
  job_title?: string;
  company_name?: string;
  location?: string;
  workplace_type?: string;
  salary_range?: string;
  application_deadline?: string;
  is_saved?: boolean;
  has_applied?: boolean;
}

interface RadarSummary {
  total_available: number;
  excellent_match_count: number;
  good_match_count: number;
  skill_development_count: number;
  not_eligible_count: number;
  insufficient_info_count: number;
}

interface MissingSkillFreq {
  skill: string;
  frequency: number;
}

interface BenchmarkData {
  status: string;
  ranking_consistency_pct: number;
  precision_at_1_pct: number;
  precision_at_2_pct: number;
  eligibility_accuracy_pct: number;
  false_matches_detected: number;
  evaluated_archetypes: number;
  evaluated_requisitions: number;
  disclaimer: string;
}

export default function OpportunityRadarPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<RadarJobItem[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<RadarSummary | null>(null);
  const [topMissingSkills, setTopMissingSkills] = useState<MissingSkillFreq[]>([]);
  const [studentReadiness, setStudentReadiness] = useState<any>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(0);
  const [workplaceType, setWorkplaceType] = useState<string>("");
  const [locationQuery, setLocationQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("match_score");

  // Expanded card tracking
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Benchmark Modal
  const [showBenchmarkModal, setShowBenchmarkModal] = useState<boolean>(false);
  const [benchmarkLoading, setBenchmarkLoading] = useState<boolean>(false);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);

  const fetchRadarRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getOpportunityRadar({
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        min_score: minScore > 0 ? minScore : undefined,
        workplace_type: workplaceType || undefined,
        location: locationQuery || undefined,
        sort_by: sortBy,
        limit: 50,
      });

      if (res.success && res.data) {
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
        setSummary(res.data.radar_summary || null);
        setTopMissingSkills(res.data.top_missing_skills || []);
        setStudentReadiness(res.data.student_profile_readiness || null);
      }
    } catch (err) {
      console.error("Failed to load Opportunity Radar recommendations:", err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, minScore, workplaceType, locationQuery, sortBy]);

  useEffect(() => {
    fetchRadarRecommendations();
  }, [fetchRadarRecommendations]);

  const loadBenchmarkMetrics = async () => {
    setShowBenchmarkModal(true);
    if (benchmarkData) return;
    setBenchmarkLoading(true);
    try {
      const res = await apiService.getMatchingBenchmark();
      if (res.success && res.data) {
        setBenchmarkData(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch benchmark metrics:", err);
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const handleToggleSave = async (jobId: string, currentSaved: boolean) => {
    try {
      await apiService.toggleSaveJob(jobId);
      setItems((prev) =>
        prev.map((item) =>
          item.job_id === jobId ? { ...item, is_saved: !currentSaved } : item
        )
      );
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "Excellent Match":
        return "bg-[#244D3D] text-[#C9E66B] border-[#244D3D]";
      case "Good Match":
        return "bg-[#EBF5EE] text-[#244D3D] border-[#B7D8C4]";
      case "Skill Development Needed":
        return "bg-[#FFF4EC] text-[#D96B27] border-[#FADCC7]";
      case "Not Eligible":
        return "bg-[#FDF2F2] text-[#9B1C1C] border-[#F8B4B4]";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getScoreColor = (score: number, isEligible: boolean) => {
    if (!isEligible) return "text-[#9B1C1C]";
    if (score >= 80) return "text-[#244D3D]";
    if (score >= 60) return "text-[#2A6F54]";
    return "text-[#D96B27]";
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-[#F6F5F0] text-[#202823] p-4 md:p-8 space-y-6">
        
        {/* Top Header Banner */}
        <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#244D3D] text-[#C9E66B]">
                <Radar className="w-3.5 h-3.5 animate-pulse" /> Core AI/ML Engine Active
              </span>
              <span className="text-xs font-medium text-[#727B74]">
                Deterministic Dual-Mode Matcher • Sentence Transformers / TF-IDF
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#202823] font-['Space_Grotesk']">
              Opportunity Radar
            </h1>
            <p className="text-sm text-[#727B74] mt-1 max-w-2xl">
              Intelligent multi-dimensional job matching evaluated across required & preferred skills,
              dense semantic cosine similarity, project technical evidence, and hard academic eligibility gates.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <button
              onClick={loadBenchmarkMetrics}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#ECEDE7] hover:bg-[#E2E4DC] text-[#202823] transition-colors border border-[#E2E4DC]"
              title="Inspect model Precision@K and validation metrics"
            >
              <BarChart3 className="w-4 h-4 text-[#244D3D]" />
              Model Benchmark
            </button>
            <Link
              href="/student/jobs"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-[#F6F5F0] text-[#202823] transition-colors border border-[#E2E4DC]"
            >
              Standard Catalog
            </Link>
            <button
              onClick={() => fetchRadarRecommendations()}
              className="p-2 bg-white border border-[#E2E4DC] hover:border-[#244D3D] rounded-xl text-[#727B74] hover:text-[#202823] transition-colors"
              title="Recalculate Radar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Opportunity Radar Metrics Strip */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-[#E2E4DC] shadow-sm">
              <span className="text-xs text-[#727B74] font-medium block">Active Postings Audited</span>
              <span className="text-2xl font-extrabold text-[#202823] font-['Space_Grotesk'] mt-1 block">
                {summary.total_available}
              </span>
              <span className="text-[11px] text-[#727B74] mt-0.5 block">Campus verified drives</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E4DC] shadow-sm">
              <span className="text-xs text-[#244D3D] font-semibold block flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#244D3D]" /> Excellent Match (≥80)
              </span>
              <span className="text-2xl font-extrabold text-[#244D3D] font-['Space_Grotesk'] mt-1 block">
                {summary.excellent_match_count}
              </span>
              <span className="text-[11px] text-[#727B74] mt-0.5 block">High compatibility</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E4DC] shadow-sm">
              <span className="text-xs text-[#2A6F54] font-semibold block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#2A6F54]" /> Good Match (60-79)
              </span>
              <span className="text-2xl font-extrabold text-[#2A6F54] font-['Space_Grotesk'] mt-1 block">
                {summary.good_match_count}
              </span>
              <span className="text-[11px] text-[#727B74] mt-0.5 block">Solid technical foundation</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E4DC] shadow-sm">
              <span className="text-xs text-[#D96B27] font-semibold block flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-[#D96B27]" /> Skill Gap Needed
              </span>
              <span className="text-2xl font-extrabold text-[#D96B27] font-['Space_Grotesk'] mt-1 block">
                {summary.skill_development_count}
              </span>
              <span className="text-[11px] text-[#727B74] mt-0.5 block">Requires targeted skills</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E4DC] shadow-sm col-span-2 sm:col-span-1">
              <span className="text-xs text-[#9B1C1C] font-semibold block flex items-center gap-1">
                <XCircle className="w-3 h-3 text-[#9B1C1C]" /> Not Eligible
              </span>
              <span className="text-2xl font-extrabold text-[#9B1C1C] font-['Space_Grotesk'] mt-1 block">
                {summary.not_eligible_count}
              </span>
              <span className="text-[11px] text-[#727B74] mt-0.5 block">Academic criteria gate</span>
            </div>
          </div>
        )}

        {/* In-Demand Missing Skills Diagnostic Banner */}
        {topMissingSkills.length > 0 && (
          <div className="bg-white rounded-xl border border-[#E2E4DC] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#244D3D] shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#244D3D]">
                Top In-Demand Skills in Your Repertoire Gaps:
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {topMissingSkills.map(({ skill, frequency }) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F6F5F0] text-[#202823] border border-[#E2E4DC]"
                >
                  {skill}
                  <span className="text-[10px] text-[#727B74] font-['IBM_Plex_Mono']">
                    ({frequency} jobs)
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filter and Categorization Tabs */}
        <div className="bg-white rounded-2xl border border-[#E2E4DC] p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: "All Opportunities", val: "all" },
                { label: "Excellent Match (≥80)", val: "excellent" },
                { label: "Good Match (60-79)", val: "good" },
                { label: "Skill Gap Needed (<60)", val: "skill_gap" },
                { label: "Eligible Only", val: "eligible_only" },
                { label: "Not Eligible", val: "ineligible" },
              ].map(({ label, val }) => (
                <button
                  key={val}
                  onClick={() => setCategoryFilter(val)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    categoryFilter === val
                      ? "bg-[#244D3D] text-[#C9E66B] border-[#244D3D] shadow-xs"
                      : "bg-[#F6F5F0] text-[#727B74] border-transparent hover:border-[#E2E4DC] hover:text-[#202823]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Quick Count Indicator */}
            <span className="text-xs text-[#727B74] font-medium ml-auto">
              Showing <strong className="text-[#202823]">{items.length}</strong> matched roles
            </span>
          </div>

          {/* Secondary Controls (Score slider, workplace, sorting) */}
          <div className="pt-3 border-t border-[#E2E4DC] flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#727B74] font-medium">Min Match Score:</span>
              <input
                type="range"
                min="0"
                max="90"
                step="10"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-24 accent-[#244D3D] cursor-pointer"
              />
              <span className="font-['IBM_Plex_Mono'] font-bold text-[#244D3D] w-8">
                {minScore}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#727B74] font-medium">Workplace:</span>
              <select
                value={workplaceType}
                onChange={(e) => setWorkplaceType(e.target.value)}
                className="bg-[#F6F5F0] border border-[#E2E4DC] rounded-lg px-2.5 py-1 text-xs font-medium text-[#202823] focus:outline-none focus:border-[#244D3D]"
              >
                <option value="">All Types</option>
                <option value="remote">Remote Only</option>
                <option value="hybrid">Hybrid</option>
                <option value="on_site">On-site</option>
              </select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#727B74]" />
              <span className="text-[#727B74] font-medium">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#F6F5F0] border border-[#E2E4DC] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#202823] focus:outline-none focus:border-[#244D3D]"
              >
                <option value="match_score">Highest Match Score</option>
                <option value="salary">Highest Compensation</option>
                <option value="deadline">Nearest Deadline</option>
                <option value="newest">Recently Posted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Recommendation Cards List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#E2E4DC] p-12 text-center shadow-sm space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#244D3D] mx-auto" />
            <p className="text-sm font-semibold text-[#202823]">
              Computing Multi-Dimensional Opportunity Radar...
            </p>
            <p className="text-xs text-[#727B74]">
              Evaluating exact skills, semantic cosine vectors, project evidence, and academic criteria.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E4DC] p-12 text-center shadow-sm space-y-3">
            <Radar className="w-12 h-12 text-[#727B74] mx-auto opacity-40" />
            <h3 className="text-base font-bold text-[#202823]">No Opportunities Matched Current Filters</h3>
            <p className="text-xs text-[#727B74] max-w-md mx-auto">
              Try adjusting the minimum match threshold or clearing active workplace filters to reveal more campus roles.
            </p>
            <button
              onClick={() => {
                setCategoryFilter("all");
                setMinScore(0);
                setWorkplaceType("");
                setLocationQuery("");
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#244D3D] text-[#C9E66B] hover:bg-[#1E3028] transition-colors"
            >
              Reset Radar Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((job) => {
              const isExpanded = expandedJobId === job.job_id;
              const isEligible = job.is_eligible;

              return (
                <div
                  key={job.job_id}
                  className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md ${
                    isEligible ? "border-[#E2E4DC]" : "border-[#F8B4B4] bg-[#FFFDFD]"
                  }`}
                >
                  <div className="p-6 space-y-4">
                    {/* Header Row: Company, Role, Badges, Match Dial */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getCategoryBadgeClass(job.category)}`}>
                            {job.category === "Excellent Match" && <Sparkles className="w-3.5 h-3.5" />}
                            {job.category === "Good Match" && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {job.category === "Skill Development Needed" && <AlertTriangle className="w-3.5 h-3.5" />}
                            {job.category === "Not Eligible" && <XCircle className="w-3.5 h-3.5" />}
                            {job.category}
                          </span>

                          {/* Eligibility Status Pill */}
                          {job.eligibility_status === "eligible" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EBF5EE] text-[#244D3D]">
                              <Check className="w-3 h-3" /> Academically Eligible
                            </span>
                          ) : job.eligibility_status === "unknown" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                              <HelpCircle className="w-3 h-3" /> Verification Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDF2F2] text-[#9B1C1C]">
                              <XCircle className="w-3 h-3" /> Gating Gate Failed
                            </span>
                          )}

                          {job.has_applied && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#244D3D]/10 text-[#244D3D]">
                              Applied
                            </span>
                          )}
                        </div>

                        <h2 className="text-xl font-extrabold text-[#202823] font-['Space_Grotesk'] hover:text-[#244D3D] transition-colors">
                          <Link href={`/student/jobs/${job.job_id}`}>
                            {job.job_title || "Engineering Opportunity"}
                          </Link>
                        </h2>

                        <div className="flex items-center gap-3 text-xs text-[#727B74] flex-wrap">
                          <span className="flex items-center gap-1 font-semibold text-[#202823]">
                            <Building2 className="w-3.5 h-3.5 text-[#244D3D]" />
                            {job.company_name || "Campus Partner"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.location || "Flexible"} ({job.workplace_type || "Hybrid"})
                          </span>
                          {job.salary_range && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-[#244D3D] font-bold">
                                <IndianRupee className="w-3.5 h-3.5" />
                                {job.salary_range}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Match Dial Box */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#727B74] block">
                            Opportunity Score
                          </span>
                          <div className="flex items-baseline justify-end gap-0.5">
                            <span className={`text-3xl font-extrabold font-['IBM_Plex_Mono'] ${getScoreColor(job.match_score, isEligible)}`}>
                              {job.match_score}
                            </span>
                            <span className="text-xs text-[#727B74] font-semibold">/100</span>
                          </div>
                          <span className="text-[11px] text-[#727B74] block font-['IBM_Plex_Mono']">
                            Semantic: {Math.round(job.semantic_similarity * 100)}%
                          </span>
                        </div>

                        {/* Bookmark Button */}
                        <button
                          onClick={() => handleToggleSave(job.job_id, !!job.is_saved)}
                          className="p-2.5 rounded-xl border border-[#E2E4DC] hover:border-[#244D3D] transition-colors"
                          title={job.is_saved ? "Remove bookmark" : "Save opportunity"}
                        >
                          <Bookmark className={`w-4 h-4 ${job.is_saved ? "fill-[#244D3D] text-[#244D3D]" : "text-[#727B74]"}`} />
                        </button>
                      </div>
                    </div>

                    {/* Hard Eligibility Failure Callout (If Not Eligible) */}
                    {!isEligible && job.eligibility_reasons.length > 0 && (
                      <div className="bg-[#FDF2F2] border border-[#F8B4B4] rounded-xl p-3.5 flex items-start gap-2.5">
                        <XCircle className="w-4 h-4 text-[#9B1C1C] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-[#9B1C1C] block">
                            Academic Requirement Restriction
                          </span>
                          <ul className="text-xs text-[#9B1C1C] mt-0.5 list-disc list-inside space-y-0.5">
                            {job.eligibility_reasons.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Skills Compatibility Section */}
                    <div className="space-y-2 pt-2 border-t border-[#E2E4DC]/60">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#727B74]">Skill Alignment Breakdown</span>
                        <span className="text-[11px] text-[#727B74]">
                          {job.matched_skills.length} matched / {job.missing_required_skills.length} missing required
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 items-center">
                        {/* Matched Mandatory Skills */}
                        {job.matched_skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#EBF5EE] text-[#244D3D] border border-[#B7D8C4]"
                          >
                            <Check className="w-3 h-3 text-[#244D3D]" />
                            {skill}
                          </span>
                        ))}

                        {/* Missing Mandatory Skills */}
                        {job.missing_required_skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FFF4EC] text-[#D96B27] border border-[#FADCC7]"
                            title="Required competency missing from your profile"
                          >
                            <AlertTriangle className="w-3 h-3 text-[#D96B27]" />
                            Missing: {skill}
                          </span>
                        ))}

                        {/* Matched Preferred Skills */}
                        {job.matched_preferred_skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F0F5FF] text-[#1D4ED8] border border-[#BFDBFE]"
                            title="Preferred competency match"
                          >
                            + {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AI Explanation Box */}
                    <div className="bg-[#F6F5F0] rounded-xl p-3.5 border border-[#E2E4DC] text-xs text-[#202823] space-y-1">
                      <span className="font-bold text-[#244D3D] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Calculated Recommendation Rationale:
                      </span>
                      <p className="leading-relaxed text-[#727B74]">
                        {job.explanation}
                      </p>
                    </div>

                    {/* Expandable Breakdown and Next Steps */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-[#E2E4DC] space-y-4">
                        {/* Component Percentage Meters */}
                        {job.breakdown && (
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                            <div className="bg-[#F6F5F0] p-2.5 rounded-xl border border-[#E2E4DC]">
                              <span className="text-[10px] text-[#727B74] block uppercase font-bold">Required Skills</span>
                              <span className="text-sm font-extrabold font-['IBM_Plex_Mono'] text-[#244D3D]">
                                {job.breakdown.required_skills_pct}%
                              </span>
                            </div>
                            <div className="bg-[#F6F5F0] p-2.5 rounded-xl border border-[#E2E4DC]">
                              <span className="text-[10px] text-[#727B74] block uppercase font-bold">Semantic Vector</span>
                              <span className="text-sm font-extrabold font-['IBM_Plex_Mono'] text-[#244D3D]">
                                {job.breakdown.semantic_similarity_pct}%
                              </span>
                            </div>
                            <div className="bg-[#F6F5F0] p-2.5 rounded-xl border border-[#E2E4DC]">
                              <span className="text-[10px] text-[#727B74] block uppercase font-bold">Project Evidence</span>
                              <span className="text-sm font-extrabold font-['IBM_Plex_Mono'] text-[#244D3D]">
                                {job.breakdown.project_experience_pct}%
                              </span>
                            </div>
                            <div className="bg-[#F6F5F0] p-2.5 rounded-xl border border-[#E2E4DC]">
                              <span className="text-[10px] text-[#727B74] block uppercase font-bold">Preferred Skills</span>
                              <span className="text-sm font-extrabold font-['IBM_Plex_Mono'] text-[#244D3D]">
                                {job.breakdown.preferred_skills_pct}%
                              </span>
                            </div>
                            <div className="bg-[#F6F5F0] p-2.5 rounded-xl border border-[#E2E4DC] col-span-2 sm:col-span-1">
                              <span className="text-[10px] text-[#727B74] block uppercase font-bold">Preferences</span>
                              <span className="text-sm font-extrabold font-['IBM_Plex_Mono'] text-[#244D3D]">
                                {job.breakdown.career_preference_pct}%
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Recommended Next Steps */}
                        {job.recommended_next_steps.length > 0 && (
                          <div className="bg-[#EBF5EE]/50 border border-[#B7D8C4] rounded-xl p-3.5 space-y-1.5">
                            <span className="text-xs font-bold text-[#244D3D] flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5" /> Recommended Action Items to Boost Selection:
                            </span>
                            <ul className="text-xs text-[#202823] space-y-1 list-disc list-inside">
                              {job.recommended_next_steps.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Card Actions Footer */}
                    <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
                      <button
                        onClick={() => setExpandedJobId(isExpanded ? null : job.job_id)}
                        className="text-xs font-semibold text-[#727B74] hover:text-[#202823] flex items-center gap-1 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            Hide Alignment Details <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            View Detailed Breakdown & Next Steps <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/student/jobs/${job.job_id}`}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#ECEDE7] hover:bg-[#E2E4DC] text-[#202823] transition-colors"
                        >
                          View Job Details
                        </Link>
                        {isEligible ? (
                          <Link
                            href={`/student/jobs/${job.job_id}`}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#244D3D] text-[#C9E66B] hover:bg-[#1E3028] transition-colors flex items-center gap-1.5 shadow-xs"
                          >
                            Apply via Portal <ArrowRight className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-400 cursor-not-allowed">
                            Ineligible
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Benchmark Evaluation Modal */}
        {showBenchmarkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-[#E2E4DC] max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E4DC]">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#244D3D]" />
                  <h3 className="text-lg font-bold text-[#202823] font-['Space_Grotesk']">
                    Model Benchmark & Ranking Verification
                  </h3>
                </div>
                <button
                  onClick={() => setShowBenchmarkModal(false)}
                  className="p-1.5 text-[#727B74] hover:text-[#202823] rounded-lg hover:bg-[#F6F5F0]"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {benchmarkLoading ? (
                <div className="py-12 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#244D3D] mx-auto" />
                  <p className="text-xs text-[#727B74]">Executing synthetic archetypes evaluation...</p>
                </div>
              ) : benchmarkData ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-[#F6F5F0] p-3 rounded-xl border border-[#E2E4DC]">
                      <span className="text-[11px] text-[#727B74] block font-semibold">Ranking Consistency</span>
                      <span className="text-xl font-extrabold text-[#244D3D] font-['IBM_Plex_Mono'] mt-1 block">
                        {benchmarkData.ranking_consistency_pct}%
                      </span>
                    </div>
                    <div className="bg-[#F6F5F0] p-3 rounded-xl border border-[#E2E4DC]">
                      <span className="text-[11px] text-[#727B74] block font-semibold">Precision@1</span>
                      <span className="text-xl font-extrabold text-[#244D3D] font-['IBM_Plex_Mono'] mt-1 block">
                        {benchmarkData.precision_at_1_pct}%
                      </span>
                    </div>
                    <div className="bg-[#F6F5F0] p-3 rounded-xl border border-[#E2E4DC]">
                      <span className="text-[11px] text-[#727B74] block font-semibold">Eligibility Accuracy</span>
                      <span className="text-xl font-extrabold text-[#244D3D] font-['IBM_Plex_Mono'] mt-1 block">
                        {benchmarkData.eligibility_accuracy_pct}%
                      </span>
                    </div>
                    <div className="bg-[#F6F5F0] p-3 rounded-xl border border-[#E2E4DC]">
                      <span className="text-[11px] text-[#727B74] block font-semibold">False Matches</span>
                      <span className="text-xl font-extrabold text-[#244D3D] font-['IBM_Plex_Mono'] mt-1 block">
                        {benchmarkData.false_matches_detected}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#ECEDE7] p-3.5 rounded-xl space-y-2">
                    <span className="font-bold text-[#202823] block">Evaluation Dataset Dimensions:</span>
                    <ul className="space-y-1 list-disc list-inside text-[#727B74]">
                      <li>Evaluated Archetypes: <strong>{benchmarkData.evaluated_archetypes} profiles</strong> (Full-Stack, ML/AI, Frontend, Cloud/DevOps, Low-CGPA, Backlogs, Non-CS, Sparse)</li>
                      <li>Evaluated Requisitions: <strong>{benchmarkData.evaluated_requisitions} positions</strong> with varying CGPA, department, and backlog gates</li>
                      <li>Execution Mode: <strong>100% Deterministic Python Algorithms</strong> (Zero external LLM reliance)</li>
                    </ul>
                  </div>

                  {/* Mandatory Academic Disclaimer */}
                  <div className="bg-[#FFF4EC] border border-[#FADCC7] rounded-xl p-3.5 text-[#D96B27]">
                    <span className="font-bold block flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> Academic & Placement Notice:
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      {benchmarkData.disclaimer}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="pt-2 text-right">
                <button
                  onClick={() => setShowBenchmarkModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#244D3D] text-[#C9E66B] hover:bg-[#1E3028]"
                >
                  Close Benchmark
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}

