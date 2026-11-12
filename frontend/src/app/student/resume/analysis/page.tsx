"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText, Sparkles, ArrowLeft, Download, RefreshCw, CheckCircle2,
  AlertCircle, ChevronRight, Sliders, Target, Briefcase, Award,
  BookOpen, Code, Clock, ShieldCheck, Check, ArrowRight, HelpCircle,
  FileCheck, ExternalLink, Zap, Flame, BarChart3, History, X
} from "lucide-react";
import { apiService } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

interface CategoryScores {
  structure: number;
  technical_skills: number;
  projects: number;
  experience: number;
  education: number;
  achievements: number;
  readability: number;
}

interface ActionVerbItem {
  original: string;
  replacement: string;
  context_snippet?: string;
  reason: string;
}

interface QuantificationItem {
  original_statement: string;
  recommendation: string;
  example_addition: string;
}

interface ProjectRewriteItem {
  project_title?: string;
  current_description: string;
  enhanced_description: string;
  reasoning: string;
}

interface JobRelevanceData {
  job_title: string;
  job_relevance_score: number;
  matched_skills_count: number;
  missing_keywords_count: number;
  relevant_skills: string[];
  missing_keywords: string[];
  weakly_represented_requirements: Array<{
    skill: string;
    status: string;
    recommendation: string;
  }>;
  relevant_project_evidence: Array<{
    statement: string;
    skills_demonstrated: string[];
  }>;
  targeted_improvements: string[];
}

interface AnalysisData {
  id?: string;
  resume_id: string;
  overall_score: number;
  weights: Record<string, number>;
  category_scores: CategoryScores;
  category_max: Record<string, number>;
  category_explanations: Record<string, string>;
  contact_info: Record<string, string | null>;
  skills_extracted: string[];
  strengths: string[];
  weaknesses: string[];
  missing_sections: string[];
  suggested_edits: {
    action_verbs: ActionVerbItem[];
    quantification: QuantificationItem[];
    project_rewrites: ProjectRewriteItem[];
  };
  job_analysis?: JobRelevanceData | null;
  engine_type: string;
  disclaimer: string;
  created_at: string;
}

interface StudentResume {
  id: string;
  title: string;
  file_name: string;
  file_size_bytes: number;
  current_version: number;
  created_at: string;
}

interface JobRequisition {
  id: string;
  title: string;
  company: {
    name: string;
  };
}

export default function ResumeAnalysisPage() {
  const [resumes, setResumes] = useState<StudentResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [jobs, setJobs] = useState<JobRequisition[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Weights Customization Modal
  const [showWeightsModal, setShowWeightsModal] = useState(false);
  const [weights, setWeights] = useState({
    structure: 15,
    technical_skills: 20,
    projects: 20,
    experience: 15,
    education: 10,
    achievements: 10,
    readability: 10,
  });

  // History Drawer State
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);

  useEffect(() => {
    async function initData() {
      setLoading(true);
      try {
        const [resumeRes, jobsRes] = await Promise.all([
          apiService.getMyResumes(),
          apiService.getJobs({ page_size: 50 }),
        ]);

        if (resumeRes.success && resumeRes.data && resumeRes.data.length > 0) {
          const list = resumeRes.data;
          setResumes(list);
          const firstId = list[0].id;
          setSelectedResumeId(firstId);

          // Fetch analysis for first resume
          const analRes = await apiService.getResumeAnalysis(firstId);
          if (analRes.success && analRes.data) {
            setAnalysis(analRes.data);
            if (analRes.data.weights) {
              setWeights(analRes.data.weights as any);
            }
          }
        }

        if (jobsRes.success && jobsRes.data) {
          setJobs(jobsRes.data.items || []);
        }
      } catch (err: any) {
        setErrorMsg(err.response?.data?.detail || "Failed to initialize resume analyzer.");
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  const handleSelectResume = async (resumeId: string) => {
    setSelectedResumeId(resumeId);
    setAnalyzing(true);
    setErrorMsg(null);
    try {
      const res = await apiService.getResumeAnalysis(resumeId);
      if (res.success && res.data) {
        setAnalysis(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to load resume analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRunAnalysis = async (jobIdToCompare?: string) => {
    if (!selectedResumeId) return;
    setAnalyzing(true);
    setErrorMsg(null);
    try {
      let res;
      const targetJob = jobIdToCompare !== undefined ? jobIdToCompare : selectedJobId;
      if (targetJob) {
        res = await apiService.analyzeResumeForJob(selectedResumeId, {
          job_id: targetJob,
          weights: weights,
        });
      } else {
        res = await apiService.analyzeResume(selectedResumeId, weights);
      }

      if (res.success && res.data) {
        setAnalysis(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Analysis failed. Please ensure resume content is readable.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOpenHistory = async () => {
    if (!selectedResumeId) return;
    try {
      const res = await apiService.getResumeAnalysisHistory(selectedResumeId);
      if (res.success && res.data) {
        setHistoryList(res.data);
        setShowHistory(true);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleDownloadPdf = () => {
    if (!selectedResumeId) return;
    const url = apiService.getResumePdfExportUrl(selectedResumeId, analysis?.id);
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <div className="min-h-screen bg-[#F6F5F0] flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-[#244D3D] font-bold">
            <div className="w-5 h-5 border-2 border-[#244D3D] border-t-transparent rounded-full animate-spin"></div>
            Loading Multi-Dimensional Resume Assessment...
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const overallScore = analysis?.overall_score ?? 70;
  const isHigh = overallScore >= 80;
  const isMed = overallScore >= 65;

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-[#F6F5F0] text-[#202823] p-4 md:p-8 space-y-6">
        {/* Navigation & Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/student/resume"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#727B74] hover:text-[#202823] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Resume Studio
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E2E4DC] hover:border-[#244D3D] text-xs font-semibold text-[#202823] bg-white transition-colors"
            >
              <History className="w-4 h-4 text-[#727B74]" /> Audit History
            </button>

            <button
              onClick={() => setShowWeightsModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E2E4DC] hover:border-[#244D3D] text-xs font-semibold text-[#202823] bg-white transition-colors"
            >
              <Sliders className="w-4 h-4 text-[#727B74]" /> Custom Weights
            </button>

            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#244D3D] hover:bg-[#1E3028] text-white text-xs font-bold transition-all shadow-sm"
            >
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Header Control Card */}
        <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#244D3D]/10 text-[#244D3D]">
                  <Sparkles className="w-3.5 h-3.5" /> 13-Dimension AI Resume Diagnostic
                </span>
                <span className="text-xs text-[#727B74]">
                  Engine: <span className="font-bold text-[#202823] capitalize">{analysis?.engine_type.replace("_", " ")}</span>
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#202823] font-['Space_Grotesk']">
                AI Resume Intelligence & Audit Studio
              </h1>
              <p className="text-sm text-[#727B74] mt-1 max-w-2xl">
                Diagnostic rubric evaluating technical skills, project impact, quantifiable metrics, action verbs, and alignment with target campus requisitions.
              </p>
            </div>

            {/* Document & Target Job Selectors */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              {/* Resume Selector */}
              <div className="w-full sm:w-56 space-y-1">
                <label className="text-[11px] font-bold text-[#727B74] block">Select Resume:</label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => handleSelectResume(e.target.value)}
                  className="w-full p-2 rounded-xl border border-[#E2E4DC] text-xs bg-white text-[#202823] font-semibold focus:outline-none focus:border-[#244D3D]"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title || r.file_name} (v{r.current_version}.0)
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Job Selector */}
              <div className="w-full sm:w-64 space-y-1">
                <label className="text-[11px] font-bold text-[#727B74] block">Compare With Target Requisition:</label>
                <select
                  value={selectedJobId}
                  onChange={(e) => {
                    setSelectedJobId(e.target.value);
                    handleRunAnalysis(e.target.value);
                  }}
                  className="w-full p-2 rounded-xl border border-[#E2E4DC] text-xs bg-white text-[#202823] font-semibold focus:outline-none focus:border-[#244D3D]"
                >
                  <option value="">General Comprehensive Audit (No Job)</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} • {j.company?.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleRunAnalysis()}
                disabled={analyzing}
                className="self-end px-4 py-2 mt-4 sm:mt-0 rounded-xl border border-[#E2E4DC] hover:border-[#244D3D] text-xs font-bold text-[#202823] bg-[#F6F5F0] hover:bg-white transition-colors flex items-center gap-1.5"
                title="Rerun AI evaluation"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? "animate-spin" : ""}`} />
                {analyzing ? "Analyzing..." : "Re-evaluate"}
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer Alert */}
        <div className="p-3.5 rounded-xl bg-[#ECEDE7] border border-[#E2E4DC] text-[11px] text-[#727B74] flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-[#244D3D] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold text-[#202823]">Diagnostic Standard Notice: </span>
            {analysis?.disclaimer || "This assessment is an internal diagnostic benchmark based on CareerBridge criteria and does not represent a universal ATS score or guarantee recruitment shortlisting."}
          </p>
        </div>

        {/* Top Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Main Score Card */}
          <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#727B74] uppercase tracking-wider">Overall Score</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isHigh ? "bg-[#C9E66B] text-[#1E3028]" : isMed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {isHigh ? "Top 10% Tier" : isMed ? "Competitive" : "Developing"}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-[#244D3D] font-['IBM_Plex_Mono']">
                {overallScore}
              </span>
              <span className="text-sm text-[#727B74] font-['IBM_Plex_Mono']">/ 100 pts</span>
            </div>

            <div className="space-y-1">
              <div className="w-full bg-[#ECEDE7] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#244D3D] h-full rounded-full transition-all duration-500"
                  style={{ width: `${overallScore}%` }}
                ></div>
              </div>
              <span className="text-[11px] text-[#727B74] block">
                {isHigh ? "Exemplary structure & technical clarity" : isMed ? "Strong base; enhance quantifiable scale" : "Address missing sections & active verbs"}
              </span>
            </div>
          </div>

          {/* Technical Competencies Card */}
          <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#727B74] uppercase tracking-wider">Skills Extracted</span>
              <Code className="w-4 h-4 text-[#244D3D]" />
            </div>

            <div>
              <span className="text-3xl font-extrabold text-[#202823] font-['IBM_Plex_Mono']">
                {analysis?.skills_extracted.length ?? 0}
              </span>
              <span className="text-xs text-[#727B74] ml-2">Verified Tools</span>
            </div>

            <div className="flex flex-wrap gap-1">
              {analysis?.skills_extracted.slice(0, 4).map((s) => (
                <span key={s} className="px-2 py-0.5 rounded bg-[#F6F5F0] border border-[#E2E4DC] text-[10px] text-[#202823]">
                  {s}
                </span>
              ))}
              {(analysis?.skills_extracted.length ?? 0) > 4 && (
                <span className="text-[10px] text-[#727B74]">
                  +{(analysis?.skills_extracted.length ?? 0) - 4} more
                </span>
              )}
            </div>
          </div>

          {/* Action Verbs Quality */}
          <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#727B74] uppercase tracking-wider">Impact & Verbs</span>
              <Zap className="w-4 h-4 text-amber-600" />
            </div>

            <div>
              <span className="text-3xl font-extrabold text-[#202823] font-['IBM_Plex_Mono']">
                {analysis?.suggested_edits.action_verbs.length ? "Needs Review" : "Executive"}
              </span>
              <span className="text-xs text-[#727B74] ml-2">
                {analysis?.suggested_edits.action_verbs.length} Passive phrases
              </span>
            </div>

            <span className="text-[11px] text-[#727B74]">
              {analysis?.suggested_edits.action_verbs.length
                ? "Replace weak verbs with ownership words below."
                : "Strong, proactive engineering vocabulary detected."}
            </span>
          </div>

          {/* Job Alignment (if selected) */}
          <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#727B74] uppercase tracking-wider">Job Alignment</span>
              <Target className="w-4 h-4 text-[#244D3D]" />
            </div>

            {analysis?.job_analysis ? (
              <div>
                <span className="text-3xl font-extrabold text-[#244D3D] font-['IBM_Plex_Mono']">
                  {analysis.job_analysis.job_relevance_score.toFixed(0)}%
                </span>
                <span className="text-xs text-[#727B74] ml-2">Target Match</span>
                <span className="text-[11px] text-[#727B74] block mt-1 line-clamp-1">
                  for {analysis.job_analysis.job_title}
                </span>
              </div>
            ) : (
              <div>
                <span className="text-base font-bold text-[#727B74]">General Audit</span>
                <span className="text-[11px] text-[#727B74] block mt-1">
                  Select a job opening above to audit requisition match.
                </span>
              </div>
            )}

            <span className="text-[11px] text-[#244D3D] font-semibold">
              {analysis?.job_analysis ? `${analysis.job_analysis.missing_keywords.length} keywords to add` : "General standard applied"}
            </span>
          </div>
        </div>

        {/* Category Scores Breakdown Cards (7 Dimensions) */}
        <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#202823] font-['Space_Grotesk']">
                Multi-Category Scoring Breakdown
              </h2>
              <p className="text-xs text-[#727B74]">
                Detailed points earned across each configurable evaluation pillar.
              </p>
            </div>
            <button
              onClick={() => setShowWeightsModal(true)}
              className="text-xs font-semibold text-[#244D3D] hover:underline flex items-center gap-1"
            >
              Adjust Category Weights <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: "structure", label: "Structure & Contact", icon: FileCheck },
              { key: "technical_skills", label: "Technical Competencies", icon: Code },
              { key: "projects", label: "Projects & Portfolios", icon: Briefcase },
              { key: "experience", label: "Experience & Internships", icon: Clock },
              { key: "education", label: "Academic Records", icon: BookOpen },
              { key: "achievements", label: "Achievements & Certs", icon: Award },
              { key: "readability", label: "Readability & Metrics", icon: BarChart3 },
            ].map(({ key, label, icon: Icon }) => {
              const earned = (analysis?.category_scores as any)?.[key] ?? 0;
              const max = (analysis?.category_max as any)?.[key] ?? 15;
              const pct = max > 0 ? (earned / max) * 100 : 0;
              const explanation = analysis?.category_explanations?.[key];

              return (
                <div key={key} className="p-4 rounded-xl bg-[#F6F5F0] border border-[#E2E4DC] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#202823] flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-[#244D3D]" /> {label}
                    </span>
                    <span className="text-xs font-bold text-[#244D3D] font-['IBM_Plex_Mono']">
                      {earned.toFixed(1)} / {max.toFixed(1)}
                    </span>
                  </div>

                  <div className="w-full bg-[#ECEDE7] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#244D3D] h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    ></div>
                  </div>

                  {explanation && (
                    <p className="text-[10px] text-[#727B74] leading-relaxed line-clamp-2">
                      {explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Job-Specific Relevance Card (when active) */}
        {analysis?.job_analysis && (
          <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E4DC] pb-4">
              <div>
                <span className="text-xs font-bold text-[#727B74] uppercase tracking-wider block">Requisition Comparison</span>
                <h3 className="text-xl font-bold text-[#202823] font-['Space_Grotesk'] mt-0.5">
                  Alignment for: {analysis.job_analysis.job_title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-[#244D3D] font-['IBM_Plex_Mono']">
                  {analysis.job_analysis.job_relevance_score.toFixed(1)}%
                </span>
                <span className="text-xs text-[#727B74]">Relevance Index</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Matched Skills */}
              <div className="space-y-2">
                <span className="font-bold text-[#244D3D] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Target Skills Present in Resume ({analysis.job_analysis.relevant_skills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.job_analysis.relevant_skills.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-[#C9E66B]/30 text-[#1E3028] font-bold border border-[#C9E66B]/60">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Keywords */}
              <div className="space-y-2">
                <span className="font-bold text-amber-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Missing Requisition Keywords ({analysis.job_analysis.missing_keywords.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.job_analysis.missing_keywords.map((k) => (
                    <span key={k} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Weakly represented requirements */}
            {analysis.job_analysis.weakly_represented_requirements.length > 0 && (
              <div className="p-4 rounded-xl bg-[#F6F5F0] border border-[#E2E4DC] space-y-3 text-xs">
                <span className="font-bold text-[#202823] block">
                  Weakly Represented Competencies (Listed in skills but missing project context):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysis.job_analysis.weakly_represented_requirements.map((wr, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-[#E2E4DC] space-y-1">
                      <span className="font-bold text-[#244D3D]">{wr.skill}</span>
                      <p className="text-[11px] text-[#727B74]">{wr.status}</p>
                      <p className="text-[11px] text-[#202823] font-semibold">{wr.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Two-Column: Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#244D3D] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Confirmed Strengths
            </h3>
            <ul className="space-y-2.5 text-xs">
              {analysis?.strengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-[#202823]">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" /> Actionable Weaknesses
            </h3>
            <ul className="space-y-2.5 text-xs">
              {analysis?.weaknesses.map((w, idx) => (
                <li key={idx} className="flex items-start gap-2 p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-[#202823]">
                  <ChevronRight className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Specific Suggested Edits (Verbs, Quantification, Project Rewrites) */}
        <div className="bg-white rounded-2xl border border-[#E2E4DC] p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#202823] font-['Space_Grotesk']">
              Specific Recommended Text Edits
            </h2>
            <p className="text-xs text-[#727B74]">
              Concrete improvements grounded in your actual uploaded resume text.
            </p>
          </div>

          {/* 1. Action Verbs Table */}
          {analysis?.suggested_edits.action_verbs && analysis.suggested_edits.action_verbs.length > 0 && (
            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-[#202823] flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-600" /> Action Verb Upgrades
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E4DC] text-[#727B74] font-bold text-[11px]">
                      <th className="py-2.5 px-3">Passive Phrasing Found</th>
                      <th className="py-2.5 px-3">Recommended Replacement</th>
                      <th className="py-2.5 px-3">Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E4DC]">
                    {analysis.suggested_edits.action_verbs.map((v, i) => (
                      <tr key={i} className="hover:bg-[#F6F5F0]/50">
                        <td className="py-2.5 px-3 text-red-700 font-semibold line-through">
                          "{v.original}"
                        </td>
                        <td className="py-2.5 px-3 text-[#244D3D] font-bold">
                          "{v.replacement}"
                        </td>
                        <td className="py-2.5 px-3 text-[#727B74] text-[11px]">
                          {v.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Quantification Recommendations */}
          {analysis?.suggested_edits.quantification && analysis.suggested_edits.quantification.length > 0 && (
            <div className="space-y-3 text-xs pt-3 border-t border-[#E2E4DC]">
              <h3 className="font-bold text-[#202823] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#244D3D]" /> Metric Quantification Opportunities
              </h3>
              <div className="space-y-3">
                {analysis.suggested_edits.quantification.map((q, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#F6F5F0] border border-[#E2E4DC] space-y-1.5">
                    <span className="font-bold text-[#727B74] block text-[11px]">Original Bullet:</span>
                    <p className="text-[#202823] italic">"{q.original_statement}"</p>
                    <div className="pt-1 flex items-start gap-1.5 text-[11px] text-[#244D3D] font-semibold">
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{q.example_addition}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Project Description Rewrites */}
          {analysis?.suggested_edits.project_rewrites && analysis.suggested_edits.project_rewrites.length > 0 && (
            <div className="space-y-3 text-xs pt-3 border-t border-[#E2E4DC]">
              <h3 className="font-bold text-[#202823] flex items-center gap-2">
                <Code className="w-4 h-4 text-[#244D3D]" /> STAR-Aligned Project Description Rewrites
              </h3>
              <div className="space-y-4">
                {analysis.suggested_edits.project_rewrites.map((p, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-[#E2E4DC] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#202823]">{p.project_title || "Project Description"}</span>
                      <span className="text-[10px] text-[#727B74]">{p.reasoning}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Current Phrasing:</span>
                        <p className="text-[#202823]">{p.current_description}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#C9E66B]/20 border border-[#C9E66B]/60 space-y-1">
                        <span className="text-[10px] font-bold text-[#244D3D] uppercase">Elevated Architecture:</span>
                        <p className="text-[#1E3028] font-medium">{p.enhanced_description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Weights Customization Modal */}
        {showWeightsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E2E4DC] max-w-md w-full p-6 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-[#E2E4DC] pb-3">
                <h3 className="text-base font-bold text-[#202823] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#244D3D]" /> Configure Scoring Rubric Weights
                </h3>
                <button onClick={() => setShowWeightsModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-[#727B74] leading-relaxed">
                Adjust points allocation across dimensions. Values will normalize automatically to 100 points.
              </p>

              <div className="space-y-3">
                {Object.entries(weights).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-[#202823] capitalize">{k.replace("_", " ")}:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={v}
                      onChange={(e) => setWeights({ ...weights, [k]: Number(e.target.value) })}
                      className="w-20 p-1.5 rounded-lg border border-[#E2E4DC] text-right font-['IBM_Plex_Mono'] font-bold text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowWeightsModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E2E4DC] font-semibold hover:bg-[#F6F5F0]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowWeightsModal(false);
                    handleRunAnalysis();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#244D3D] text-white font-bold hover:bg-[#1E3028]"
                >
                  Apply & Re-Calculate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Drawer */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end p-0">
            <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl space-y-4 overflow-y-auto animate-in slide-in-from-right duration-200 text-xs">
              <div className="flex items-center justify-between border-b border-[#E2E4DC] pb-4">
                <h3 className="text-base font-bold text-[#202823] flex items-center gap-2">
                  <History className="w-4 h-4 text-[#244D3D]" /> Historical Analysis Runs
                </h3>
                <button onClick={() => setShowHistory(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-[#727B74]">
                Past analytical audits preserved for this resume version.
              </p>

              <div className="space-y-3">
                {historyList.map((h) => (
                  <div key={h.id} className="p-4 rounded-xl bg-[#F6F5F0] border border-[#E2E4DC] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#244D3D] font-['IBM_Plex_Mono']">
                        {h.overall_score} / 100
                      </span>
                      <span className="text-[11px] text-[#727B74]">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#202823]">
                      Target: <span className="font-bold">{h.job_title || "General Audit"}</span>
                    </div>

                    <div className="text-[10px] text-[#727B74]">
                      Engine: {h.engine_type}
                    </div>

                    <div className="pt-1 flex items-center justify-end">
                      <a
                        href={apiService.getResumePdfExportUrl(selectedResumeId, h.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#244D3D] hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF Report
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

