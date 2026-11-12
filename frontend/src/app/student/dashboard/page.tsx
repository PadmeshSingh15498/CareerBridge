"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Briefcase,
  Layers,
  Calendar,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Video,
  Clock,
  Compass,
  TrendingUp,
  RefreshCw,
  Plus,
} from "lucide-react";

import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { CareerReadinessRing } from "@/components/signature/CareerReadinessRing";
import { MatchIntelligenceCard } from "@/components/signature/MatchIntelligenceCard";
import { CareerTrajectoryTimeline } from "@/components/signature/CareerTrajectoryTimeline";
import { ActivityTimeline } from "@/components/signature/ActivityTimeline";
import { AIAssistantPanel } from "@/components/signature/AIAssistantPanel";
import { dashboardService } from "@/services/dashboardService";
import { StudentDashboardData } from "@/types/dashboard";

export default function StudentDashboardPage() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getStudentDashboard(false);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApply = (jobId: string, jobTitle: string) => {
    setAppliedJobs((prev) => [...prev, jobId]);
    setApplySuccessMsg(`Application submitted for ${jobTitle}!`);
    setTimeout(() => setApplySuccessMsg(null), 4000);
  };

  // Dynamic time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading || !data) {
    return (
      <WorkspaceShell role="student" activeTabTitle="Dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-3 text-cb-secondary font-mono text-sm">
            <RefreshCw className="w-5 h-5 animate-spin text-cb-forest" />
            <span>Loading career intelligence workspace...</span>
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell role="student" activeTabTitle="Dashboard">
      {/* Toast Alert */}
      {applySuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-cb-forest text-white px-5 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-cb-lime/30 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-4 h-4 text-cb-lime" />
          <span>{applySuccessMsg}</span>
        </div>
      )}

      {/* Workspace Header Strip */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cb-border pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-[11px] font-mono text-cb-forest bg-cb-forest/10 px-2 py-0.5 rounded-full font-semibold">
              Batch of 2026 • Seeking Software Roles
            </span>
            <span className="text-xs text-cb-secondary font-mono">
              Roll: {data.roll_number}
            </span>
          </div>
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-cb-primary tracking-tight">
            {getGreeting()}, {data.student_name}
          </h1>
          <p className="text-sm text-cb-secondary mt-1">
            Your next opportunity starts with understanding where you stand.
          </p>
        </div>

        {/* Workspace Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/student/jobs"
            className="px-3.5 py-2 bg-cb-card border border-cb-border hover:border-cb-forest text-cb-primary rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5 text-cb-forest" />
            <span>Browse Jobs</span>
          </Link>

          <Link
            href="/student/resume"
            className="px-4 py-2 bg-cb-forest text-white hover:bg-cb-forest-dark rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-cb-lime" />
            <span>Update Resume</span>
          </Link>
        </div>
      </section>

      {/* ======================================================== */}
      {/* CONDITIONAL: EMPTY STATE ONBOARDING FOR NEW STUDENTS     */}
      {/* ======================================================== */}
      {data.profile_completion?.percentage === 0 && !data.resume_health?.file_name ? (
        <section className="space-y-6">
          <div className="p-8 bg-cb-card border border-cb-border rounded-xl shadow-xs text-center max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-cb-forest/10 text-cb-forest mx-auto flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-cb-forest" />
            </div>
            <h2 className="font-heading font-bold text-xl text-cb-primary">
              Welcome to CareerBridge, {data.student_name}!
            </h2>
            <p className="text-xs text-cb-secondary max-w-md mx-auto leading-relaxed">
              You haven&apos;t uploaded an ATS resume or completed your skills inventory yet.
              Follow these three fast steps to calculate your Career Readiness Score and unlock
              AI-driven campus recommendations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
              <div className="p-4 bg-cb-bg border border-cb-border rounded-lg space-y-2">
                <div className="w-7 h-7 rounded-md bg-cb-forest text-cb-lime font-mono font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <h4 className="font-semibold text-xs text-cb-primary">Upload Resume</h4>
                <p className="text-[11px] text-cb-secondary leading-normal">
                  Ingest PDF to extract skills, section scores, and formatting health.
                </p>
                <Link
                  href="/student/resume"
                  className="inline-block text-[11px] text-cb-forest font-semibold hover:underline mt-1"
                >
                  Upload now &rarr;
                </Link>
              </div>

              <div className="p-4 bg-cb-bg border border-cb-border rounded-lg space-y-2">
                <div className="w-7 h-7 rounded-md bg-cb-forest text-cb-lime font-mono font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <h4 className="font-semibold text-xs text-cb-primary">Tag 5 Skills</h4>
                <p className="text-[11px] text-cb-secondary leading-normal">
                  Select core languages, frameworks, and databases you know.
                </p>
                <Link
                  href="/student/profile"
                  className="inline-block text-[11px] text-cb-forest font-semibold hover:underline mt-1"
                >
                  Add skills &rarr;
                </Link>
              </div>

              <div className="p-4 bg-cb-bg border border-cb-border rounded-lg space-y-2">
                <div className="w-7 h-7 rounded-md bg-cb-forest text-cb-lime font-mono font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <h4 className="font-semibold text-xs text-cb-primary">Discover Jobs</h4>
                <p className="text-[11px] text-cb-secondary leading-normal">
                  Explore active campus drives matched to your eligibility.
                </p>
                <Link
                  href="/student/jobs"
                  className="inline-block text-[11px] text-cb-forest font-semibold hover:underline mt-1"
                >
                  Browse jobs &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* ======================================================== */
        /* ACTIVE STUDENT PERSONALIZED WORKSPACE                     */
        /* ======================================================== */
        <div className="space-y-8">
          {/* Top Row: Readiness Ring + Profile Completion + Resume Health + Counter Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 1. Career Readiness Ring Card */}
            <div className="lg:col-span-4 bg-cb-card border border-cb-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-semibold text-sm text-cb-primary">
                    Career Readiness Index
                  </h3>
                  <span className="text-[11px] font-mono text-cb-forest bg-cb-forest/10 px-2 py-0.5 rounded-full font-semibold">
                    Composite
                  </span>
                </div>
                <p className="text-xs text-cb-secondary mb-4">
                  Multi-pillar calculation across resume health, verified skills, and interview readiness.
                </p>
              </div>

              <div className="flex justify-center py-2">
                <CareerReadinessRing
                  score={data.career_readiness_score}
                  pillars={[
                    { name: "ATS Resume Rubric", score: data.readiness_breakdown.resume_health, weight: "35%", status: "verified" },
                    { name: "Skill Coverage", score: data.readiness_breakdown.skill_coverage, weight: "35%", status: "verified" },
                    { name: "Interview Prep", score: data.readiness_breakdown.interview_preparedness, weight: "15%", status: "optimizing" },
                    { name: "Academic Criteria", score: data.readiness_breakdown.academic_eligibility, weight: "15%", status: "verified" },
                  ]}
                />
              </div>

              <div className="pt-3 border-t border-cb-border flex items-center justify-between text-xs text-cb-secondary">
                <Link
                  href="/student/skill-gap"
                  className="text-xs font-semibold text-cb-forest hover:underline flex items-center gap-1"
                >
                  <span>Skill Gap & Roadmap &rarr;</span>
                </Link>
                <span className="font-semibold text-cb-forest flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cb-forest" /> Cleared (CGPA {data.cgpa})
                </span>
              </div>
            </div>

            {/* 2. Resume Health Card */}
            <div className="lg:col-span-4 bg-cb-card border border-cb-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-semibold text-sm text-cb-primary">
                    Resume ATS Health
                  </h3>
                  <span className="text-xs font-mono font-bold text-cb-forest bg-cb-forest/10 px-2.5 py-0.5 rounded-full">
                    {data.resume_health.ats_score}/100
                  </span>
                </div>
                <p className="text-xs text-cb-secondary mb-3">
                  Parsed: <span className="font-mono text-cb-primary">{data.resume_health.file_name}</span>
                </p>

                {/* Score Pills */}
                <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                  <div className="p-2 bg-cb-bg border border-cb-border rounded-lg">
                    <span className="block text-[10px] text-cb-secondary uppercase">Sections</span>
                    <span className="font-mono font-bold text-xs text-cb-primary">
                      {data.resume_health.sections_score}/25
                    </span>
                  </div>
                  <div className="p-2 bg-cb-bg border border-cb-border rounded-lg">
                    <span className="block text-[10px] text-cb-secondary uppercase">Skills</span>
                    <span className="font-mono font-bold text-xs text-cb-primary">
                      {data.resume_health.skills_score}/30
                    </span>
                  </div>
                  <div className="p-2 bg-cb-bg border border-cb-border rounded-lg">
                    <span className="block text-[10px] text-cb-secondary uppercase">Metrics</span>
                    <span className="font-mono font-bold text-xs text-cb-primary">
                      {data.resume_health.metrics_score}/25
                    </span>
                  </div>
                  <div className="p-2 bg-cb-bg border border-cb-border rounded-lg">
                    <span className="block text-[10px] text-cb-secondary uppercase">Format</span>
                    <span className="font-mono font-bold text-xs text-cb-primary">
                      {data.resume_health.formatting_score}/20
                    </span>
                  </div>
                </div>

                {/* Priority Actionable Tip */}
                <div className="p-3 bg-cb-bg rounded-lg border border-cb-border space-y-1">
                  <span className="text-[10px] font-mono font-semibold uppercase text-cb-orange flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Recommended Improvement
                  </span>
                  <p className="text-xs text-cb-secondary leading-snug">
                    {data.resume_health.actionable_tips[0]}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-cb-border flex items-center justify-between">
                <Link
                  href="/student/resume"
                  className="text-xs font-semibold text-cb-forest hover:underline flex items-center gap-1"
                >
                  View full ATS breakdown &rarr;
                </Link>
                <span className="text-[11px] text-cb-secondary font-mono">PyMuPDF ATS v2.1</span>
              </div>
            </div>

            {/* 3. Profile Completion & Quick Stats */}
            <div className="lg:col-span-4 bg-cb-card border border-cb-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-semibold text-sm text-cb-primary">
                    Profile Completion
                  </h3>
                  <span className="text-xs font-mono font-bold text-cb-forest">
                    {data.profile_completion.percentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-cb-bg h-2 rounded-full overflow-hidden mb-4 border border-cb-border">
                  <div
                    className="bg-cb-forest h-full rounded-full transition-all duration-500"
                    style={{ width: `${data.profile_completion.percentage}%` }}
                  />
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-[11px] font-mono text-cb-secondary uppercase">Remaining Checklist</p>
                  {data.profile_completion.missing_items.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-cb-secondary">
                      <div className="w-1.5 h-1.5 rounded-full bg-cb-orange mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Counter Metric Strip */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cb-border text-center">
                  <div className="p-2 bg-cb-bg rounded-lg border border-cb-border">
                    <span className="block font-mono font-bold text-base text-cb-primary">
                      {data.quick_stats.applications_count}
                    </span>
                    <span className="text-[10px] text-cb-secondary">Applied</span>
                  </div>
                  <div className="p-2 bg-cb-bg rounded-lg border border-cb-border">
                    <span className="block font-mono font-bold text-base text-cb-forest">
                      {data.quick_stats.interviews_count}
                    </span>
                    <span className="text-[10px] text-cb-secondary">Interviews</span>
                  </div>
                  <div className="p-2 bg-cb-bg rounded-lg border border-cb-border">
                    <span className="block font-mono font-bold text-base text-cb-primary">
                      {data.quick_stats.verified_skills_count}
                    </span>
                    <span className="text-[10px] text-cb-secondary">Skills</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end">
                <Link
                  href="/student/profile"
                  className="text-xs font-semibold text-cb-forest hover:underline"
                >
                  Edit profile details &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* High Priority: Upcoming Interview Banner (if exists) */}
          {data.upcoming_interviews.length > 0 && (
            <div className="bg-cb-card-alt border-l-4 border-l-cb-forest border border-cb-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-cb-forest text-cb-lime rounded-lg shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cb-forest/10 text-cb-forest font-semibold uppercase">
                      Upcoming Interview
                    </span>
                    <span className="text-xs font-semibold text-cb-primary">
                      {data.upcoming_interviews[0].company_name}
                    </span>
                  </div>
                  <h4 className="font-heading font-semibold text-sm text-cb-primary">
                    {data.upcoming_interviews[0].round_name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-cb-secondary mt-1">
                    <span className="flex items-center gap-1 text-cb-primary font-medium">
                      <Clock className="w-3.5 h-3.5 text-cb-forest" />
                      {data.upcoming_interviews[0].scheduled_start}
                    </span>
                    <span>Interviewer: {data.upcoming_interviews[0].interviewer_name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  href="/student/interview-prep"
                  className="px-3.5 py-2 border border-cb-border bg-cb-card hover:bg-cb-card-alt rounded-lg text-xs font-medium text-cb-primary transition-all"
                >
                  Prepare with BridgeAI
                </Link>
                {data.upcoming_interviews[0].meeting_link && (
                  <a
                    href={data.upcoming_interviews[0].meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-cb-forest text-white hover:bg-cb-forest-dark rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Join Meeting</span>
                    <ExternalLink className="w-3.5 h-3.5 text-cb-lime" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Asymmetric 2-Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column (7 cols): Recommended Jobs & Applications Pipeline */}
            <div className="lg:col-span-7 space-y-8">
              {/* Recommended Jobs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-cb-primary">
                      Recommended Opportunities
                    </h3>
                    <p className="text-xs text-cb-secondary">
                      Ranked by dense embedding similarity &amp; skill overlap
                    </p>
                  </div>
                  <Link
                    href="/student/jobs"
                    className="text-xs font-semibold text-cb-forest hover:underline flex items-center gap-1"
                  >
                    View all {data.recommended_jobs.length + 4} jobs &rarr;
                  </Link>
                </div>

                <div className="space-y-3.5">
                  {data.recommended_jobs.map((job) => {
                    const isApplied =
                      appliedJobs.includes(job.id) ||
                      data.active_applications.some((a) => a.job_id === job.id);

                    return (
                      <div
                        key={job.id}
                        className="p-5 bg-cb-card border border-cb-border rounded-xl shadow-xs hover:border-cb-forest/30 transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-mono text-cb-secondary uppercase tracking-wider block">
                              {job.company_name} • {job.workplace_type}
                            </span>
                            <h4 className="font-heading font-semibold text-base text-cb-primary">
                              {job.title}
                            </h4>
                            <p className="text-xs text-cb-secondary mt-0.5">{job.location}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="inline-block text-xs font-mono font-bold text-cb-forest bg-cb-forest/10 px-2 py-0.5 rounded-full">
                              {job.match_percentage}% Match
                            </span>
                            <span className="block text-xs font-mono font-semibold text-cb-primary mt-1">
                              {job.salary_range}
                            </span>
                          </div>
                        </div>

                        {/* Top Matching Skills */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {job.top_matching_skills.map((sk) => (
                            <span
                              key={sk}
                              className="text-[11px] font-mono px-2 py-0.5 rounded bg-cb-bg border border-cb-border text-cb-secondary"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-cb-border flex items-center justify-between text-xs">
                          <span className="text-cb-secondary text-[11px]">
                            Deadline: {job.deadline}
                          </span>
                          {isApplied ? (
                            <span className="text-xs font-semibold text-cb-forest flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Applied
                            </span>
                          ) : (
                            <button
                              onClick={() => handleApply(job.id, job.title)}
                              className="px-3.5 py-1.5 bg-cb-forest text-white hover:bg-cb-forest-dark rounded-md font-semibold text-xs transition-colors"
                            >
                              1-Click Apply
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Career Trajectory Roadmap Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-cb-primary">
                      Career Trajectory
                    </h3>
                    <p className="text-xs text-cb-secondary">
                      Active roadmap: {data.career_roadmap.title}
                    </p>
                  </div>
                  <Link
                    href="/student/roadmap"
                    className="text-xs font-semibold text-cb-forest hover:underline"
                  >
                    View 6-week curriculum &rarr;
                  </Link>
                </div>

                <div className="p-5 bg-cb-card border border-cb-border rounded-xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-cb-primary">
                      Target Role: {data.career_roadmap.target_role}
                    </span>
                    <span className="font-mono text-cb-forest font-semibold">
                      Week {data.career_roadmap.current_week} of {data.career_roadmap.total_weeks} (
                      {data.career_roadmap.progress_percentage}% Done)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {data.career_roadmap.milestones.map((m) => (
                      <div
                        key={m.week_number}
                        className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 transition-colors ${
                          m.is_completed
                            ? "bg-cb-forest/5 border-cb-forest/30"
                            : m.week_number === data.career_roadmap.current_week
                            ? "bg-cb-card-alt border-cb-forest font-medium"
                            : "bg-cb-bg border-cb-border opacity-70"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shrink-0 mt-0.5 ${
                            m.is_completed
                              ? "bg-cb-forest text-cb-lime"
                              : "bg-cb-border text-cb-secondary"
                          }`}
                        >
                          {m.is_completed ? "✓" : m.week_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-cb-primary truncate">
                              Week {m.week_number}: {m.milestone_title}
                            </h5>
                            {m.is_completed && (
                              <span className="text-[10px] font-mono text-cb-forest uppercase font-semibold">
                                Completed
                              </span>
                            )}
                          </div>
                          <p className="text-cb-secondary text-[11px] mt-0.5 leading-normal">
                            {m.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Skill Gap Summary + Embedded BridgeAI + Activity Feed */}
            <div className="lg:col-span-5 space-y-6">
              {/* Skill Gap Delta Card */}
              <div className="p-5 bg-cb-card border border-cb-border rounded-xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-cb-forest/10 rounded text-cb-forest">
                      <Compass className="w-4 h-4" />
                    </div>
                    <h3 className="font-heading font-semibold text-sm text-cb-primary">
                      Skill Gap Delta
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-cb-forest">
                    {data.skill_gap_summary.readiness_percentage}% Ready
                  </span>
                </div>

                <p className="text-xs text-cb-secondary leading-normal">
                  {data.skill_gap_summary.summary}
                </p>

                <div>
                  <span className="block text-[10px] font-mono text-cb-secondary uppercase mb-1.5">
                    Critical Missing Competencies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.skill_gap_summary.critical_missing_skills.map((sk) => (
                      <span
                        key={sk}
                        className="text-xs font-mono px-2 py-0.5 rounded bg-cb-orange/10 border border-cb-orange/30 text-cb-orange font-semibold"
                      >
                        +{sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-mono text-cb-secondary uppercase mb-1.5">
                    Verified Competencies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.skill_gap_summary.verified_skills.slice(0, 5).map((sk) => (
                      <span
                        key={sk}
                        className="text-xs font-mono px-2 py-0.5 rounded bg-cb-forest/10 border border-cb-forest/20 text-cb-forest"
                      >
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-cb-border">
                  <Link
                    href="/student/skill-gap"
                    className="text-xs font-semibold text-cb-forest hover:underline flex items-center justify-between"
                  >
                    <span>Full skill gap diagnosis</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>

              {/* Embedded BridgeAI Copilot Quick Query Panel */}
              <div className="p-5 bg-cb-card-alt border border-cb-border rounded-xl shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-cb-forest text-cb-lime rounded">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-xs text-cb-primary">
                      BridgeAI Career Copilot
                    </h4>
                    <p className="text-[10px] text-cb-secondary font-mono">
                      Grounded in your resume &amp; academic profile
                    </p>
                  </div>
                </div>

                <p className="text-xs text-cb-secondary leading-relaxed">
                  Ask BridgeAI anything regarding your upcoming interview with Sarah Chen, or how
                  to frame your distributed systems project.
                </p>

                <div className="space-y-1.5">
                  <Link
                    href="/student/bridge-ai?prompt=interview_prep"
                    className="block p-2 rounded bg-cb-card border border-cb-border text-xs text-cb-primary hover:border-cb-forest/50 transition-colors"
                  >
                    &ldquo;Give me 3 tough questions Sarah Chen might ask about my FastAPI queue.&rdquo;
                  </Link>
                  <Link
                    href="/student/bridge-ai?prompt=resume_review"
                    className="block p-2 rounded bg-cb-card border border-cb-border text-xs text-cb-primary hover:border-cb-forest/50 transition-colors"
                  >
                    &ldquo;How can I improve my ATS score from 88 to 95?&rdquo;
                  </Link>
                </div>

                <Link
                  href="/student/bridge-ai"
                  className="block text-center py-2 bg-cb-forest text-white rounded-lg text-xs font-semibold hover:bg-cb-forest-dark transition-colors shadow-xs"
                >
                  Open Full BridgeAI Chat
                </Link>
              </div>

              {/* Recent Activity Stream */}
              <div className="p-5 bg-cb-card border border-cb-border rounded-xl shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-sm text-cb-primary">
                    Recent Activity
                  </h3>
                  <span className="text-[10px] font-mono text-cb-secondary">Live Logs</span>
                </div>

                <ActivityTimeline />
              </div>
            </div>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
