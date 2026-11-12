"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Terminal,
  Database,
  Globe,
  Plus,
  BookOpen,
  Info,
  ChevronRight,
  TrendingUp,
  Cpu
} from "lucide-react";

import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { SkillConstellation } from "@/components/signature/SkillConstellation";
import { apiService } from "@/lib/api";
import { SkillGapResponse, TargetRoleItem, SkillDiagnosis } from "@/types/career-intelligence";

const STANDARD_CURATED_ROLES = [
  "Software Developer",
  "Java Developer",
  "Python Developer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "AI Engineer",
  "Web Developer",
  "Full Stack Developer"
];

export default function StudentSkillGapPage() {
  const [selectedRole, setSelectedRole] = useState<string>("Full Stack Developer");
  const [availableRoles, setAvailableRoles] = useState<TargetRoleItem[]>([]);
  const [gapData, setGapData] = useState<SkillGapResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"constellation" | "matrix">("constellation");

  // Custom role modal state
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customRoleName, setCustomRoleName] = useState<string>("");
  const [customRoleSkills, setCustomRoleSkills] = useState<string>("");
  const [creatingCustom, setCreatingCustom] = useState<boolean>(false);

  // Load roles list
  useEffect(() => {
    async function loadRoles() {
      try {
        const res = await apiService.getTargetRoles();
        if (res.data && res.data.length > 0) {
          setAvailableRoles(res.data);
        }
      } catch (err) {
        console.error("Could not fetch target roles:", err);
      }
    }
    loadRoles();
  }, []);

  // Run skill gap analysis when selectedRole changes
  useEffect(() => {
    async function runGapAnalysis() {
      setLoading(true);
      try {
        const res = await apiService.analyzeSkillGap(selectedRole);
        if (res.data) {
          setGapData(res.data);
        }
      } catch (err) {
        console.error("Failed to run skill gap analysis:", err);
      } finally {
        setLoading(false);
      }
    }
    runGapAnalysis();
  }, [selectedRole]);

  const handleCreateCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRoleName.trim()) return;

    setCreatingCustom(true);
    try {
      const skillsArray = customRoleSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await apiService.createCustomRole({
        role_name: customRoleName.trim(),
        skills: skillsArray
      });

      if (res.data) {
        setSelectedRole(res.data.role_name);
        setShowCustomModal(false);
        setCustomRoleName("");
        setCustomRoleSkills("");
      }
    } catch (err) {
      console.error("Failed to create custom role:", err);
    } finally {
      setCreatingCustom(false);
    }
  };

  return (
    <WorkspaceShell role="student" activeTabTitle="Skill Gap">
      <div className="space-y-6">
        {/* Header & Target Role Selector */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cb-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono text-cb-forest bg-cb-forest/10 px-2 py-0.5 rounded-full font-semibold">
                Competency Benchmarking
              </span>
              <span className="text-xs text-cb-secondary font-mono">
                Phase 10 Career Intelligence
              </span>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-cb-primary tracking-tight">
              Skill Gap Analysis & Role Benchmarking
            </h1>
            <p className="text-sm text-cb-secondary mt-1 max-w-2xl">
              Deterministic set-difference comparison between your verified competencies and target requisition standards.
            </p>
          </div>

          {/* Role Picker Strip */}
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col">
              <label className="text-[11px] font-mono text-cb-secondary uppercase tracking-wider mb-1">
                Target Requisition
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-white border border-cb-border rounded-xl px-3.5 py-2 text-xs font-semibold text-cb-primary focus:outline-none focus:ring-1 focus:ring-cb-forest shadow-xs min-w-[200px]"
              >
                {STANDARD_CURATED_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
                {availableRoles
                  .filter((r) => !STANDARD_CURATED_ROLES.includes(r.role_name))
                  .map((r) => (
                    <option key={r.id} value={r.role_name}>
                      {r.role_name} (Custom)
                    </option>
                  ))}
              </select>
            </div>

            <button
              onClick={() => setShowCustomModal(true)}
              className="mt-5 px-3 py-2 bg-stone-200/80 hover:bg-stone-200 text-cb-primary rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border border-cb-border"
              title="Add Custom Career Role"
            >
              <Plus className="w-3.5 h-3.5 text-cb-forest" />
              <span>Custom Role</span>
            </button>
          </div>
        </section>

        {/* Platform vs Employer Disclaimer Banner */}
        <section className="bg-stone-100/90 border border-cb-border/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-cb-secondary">
          <Info className="w-4 h-4 text-cb-forest shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-cb-primary">Platform Benchmark Notice: </span>
            {gapData?.disclaimer ||
              "These competencies represent CareerBridge placement intelligence and institutional curriculum standards based on aggregate hiring patterns. Individual employer requisitions on campus drives may have distinct or specialized criteria."}
          </div>
        </section>

        {loading || !gapData ? (
          <div className="flex items-center justify-center min-h-[350px]">
            <div className="flex items-center gap-3 text-cb-secondary font-mono text-sm">
              <RefreshCw className="w-5 h-5 animate-spin text-cb-forest" />
              <span>Evaluating competency deltas for {selectedRole}...</span>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Summary Strip */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Readiness Score Card */}
              <div className="premium-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-cb-forest">
                <div>
                  <span className="text-xs font-mono text-cb-secondary uppercase tracking-wider block">
                    Role Readiness
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-3xl font-extrabold text-cb-forest">
                      {gapData.readiness_percentage}%
                    </span>
                    <span className="text-[11px] font-mono text-cb-secondary">Estimated</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-cb-forest/10 flex items-center justify-center text-cb-forest">
                  <Compass className="w-6 h-6" />
                </div>
              </div>

              {/* Already Proficient */}
              <div className="premium-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-cb-forest">
                <div>
                  <span className="text-xs font-mono text-cb-secondary uppercase tracking-wider block">
                    Already Proficient
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-3xl font-extrabold text-cb-forest">
                      {gapData.counts.already_proficient}
                    </span>
                    <span className="text-[11px] font-mono text-cb-secondary">
                      of {gapData.counts.total_benchmark_skills} skills
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-cb-forest/10 flex items-center justify-center text-cb-forest">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              {/* Needs Improvement */}
              <div className="premium-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-cb-orange">
                <div>
                  <span className="text-xs font-mono text-cb-secondary uppercase tracking-wider block">
                    Needs Reinforcement
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-3xl font-extrabold text-cb-orange">
                      {gapData.counts.needs_improvement}
                    </span>
                    <span className="text-[11px] font-mono text-cb-secondary">Level Below</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-cb-orange/15 flex items-center justify-center text-cb-orange">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              {/* Critical Missing Gaps */}
              <div className="premium-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-rose-500">
                <div>
                  <span className="text-xs font-mono text-cb-secondary uppercase tracking-wider block">
                    Critical Gaps
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-3xl font-extrabold text-rose-600">
                      {gapData.critical_missing_skills.length}
                    </span>
                    <span className="text-[11px] font-mono text-cb-secondary">Unlearned</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
            </section>

            {/* View Switcher Tabs & CTA Banner */}
            <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-200/60 p-2 rounded-2xl border border-cb-border">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("constellation")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "constellation"
                      ? "bg-white text-cb-forest shadow-xs"
                      : "text-cb-secondary hover:text-cb-primary"
                  }`}
                >
                  Skill Constellation Graph
                </button>
                <button
                  onClick={() => setActiveTab("matrix")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "matrix"
                      ? "bg-white text-cb-forest shadow-xs"
                      : "text-cb-secondary hover:text-cb-primary"
                  }`}
                >
                  Role Benchmark Gap Matrix
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/student/roadmap"
                  className="px-4 py-2 bg-cb-forest hover:bg-cb-dark text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5 text-cb-lime" />
                  <span>Generate Personalized Roadmap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </section>

            {/* Main Workspace Display */}
            {activeTab === "constellation" ? (
              <SkillConstellation
                nodes={gapData.constellation_nodes}
                title={`${selectedRole} — Competency Constellation`}
              />
            ) : (
              <section className="premium-card p-6 rounded-2xl space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cb-forest" />
                    <span className="text-xs font-mono uppercase tracking-widest text-cb-secondary">
                      Curriculum Delta
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-cb-primary mt-0.5">
                    Detailed Skill Gap Matrix for {selectedRole}
                  </h3>
                  <p className="text-xs text-cb-secondary mt-1">
                    Side-by-side comparison of candidate verified proficiency vs target role benchmarks.
                  </p>
                </div>

                {/* Table representation */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-cb-border bg-stone-100/70 font-mono text-cb-secondary uppercase text-[10px]">
                        <th className="py-3 px-4">Skill / Competency</th>
                        <th className="py-3 px-3">Priority</th>
                        <th className="py-3 px-3">Your Level</th>
                        <th className="py-3 px-3">Target Level</th>
                        <th className="py-3 px-3">Diagnosis</th>
                        <th className="py-3 px-4">Recommended Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cb-border/60">
                      {gapData.all_skills_diagnosed.map((item, idx) => {
                        const isProficient = item.status === "already_proficient";
                        const isImprovement = item.status === "needs_improvement";
                        const isMissing = item.status === "not_yet_learned";

                        return (
                          <tr key={idx} className="hover:bg-stone-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-heading font-semibold text-cb-primary">
                                {item.skill_name}
                              </div>
                              <div className="text-[10px] font-mono text-cb-secondary uppercase">
                                {item.category}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                                  item.priority === "mandatory"
                                    ? "bg-rose-100 text-rose-700"
                                    : item.priority === "high"
                                    ? "bg-cb-orange/15 text-cb-orange"
                                    : "bg-stone-200 text-stone-700"
                                }`}
                              >
                                {item.priority}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono">
                              {item.student_proficiency ? (
                                <span className="capitalize text-cb-primary font-medium">
                                  {item.student_proficiency}
                                </span>
                              ) : (
                                <span className="text-stone-400 italic">None</span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono capitalize text-cb-forest font-semibold">
                              {item.target_proficiency}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                                  isProficient
                                    ? "bg-cb-forest/10 text-cb-forest border-cb-forest/20"
                                    : isImprovement
                                    ? "bg-cb-orange/15 text-cb-orange border-cb-orange/20"
                                    : "bg-stone-200 text-stone-600 border-stone-300"
                                }`}
                              >
                                {isProficient && <CheckCircle2 className="w-3 h-3 text-cb-forest" />}
                                {isImprovement && <AlertCircle className="w-3 h-3 text-cb-orange" />}
                                {isMissing && <AlertCircle className="w-3 h-3 text-stone-500" />}
                                <span className="capitalize">
                                  {item.status.replace("_", " ")}
                                </span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-cb-secondary max-w-xs">
                              {item.action_recommendation}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

        {/* Custom Target Role Modal */}
        {showCustomModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-cb-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-cb-border">
                <h3 className="font-heading text-lg font-bold text-cb-primary">
                  Define Custom Target Role
                </h3>
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="text-cb-secondary hover:text-cb-primary text-sm font-mono"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCustomRole} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-cb-secondary uppercase tracking-wider block mb-1">
                    Role Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cloud Platform Engineer"
                    value={customRoleName}
                    onChange={(e) => setCustomRoleName(e.target.value)}
                    className="w-full bg-stone-50 border border-cb-border rounded-xl px-3.5 py-2 text-xs font-semibold text-cb-primary focus:outline-none focus:ring-1 focus:ring-cb-forest"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-cb-secondary uppercase tracking-wider block mb-1">
                    Required Skills (Comma-Separated)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="AWS, Kubernetes, Terraform, Docker, Python, Linux, CI/CD"
                    value={customRoleSkills}
                    onChange={(e) => setCustomRoleSkills(e.target.value)}
                    className="w-full bg-stone-50 border border-cb-border rounded-xl px-3.5 py-2 text-xs text-cb-primary focus:outline-none focus:ring-1 focus:ring-cb-forest"
                  />
                  <p className="text-[11px] text-cb-secondary mt-1">
                    Our AI will synthesize a custom 6-stage curriculum and gap evaluation for this requisition.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-cb-secondary hover:text-cb-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingCustom}
                    className="px-5 py-2 bg-cb-forest hover:bg-cb-dark text-white rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
                  >
                    {creatingCustom ? "Synthesizing..." : "Synthesize Role"}
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
