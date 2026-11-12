"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCode,
  Github,
  Globe,
  Layers,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  ChevronDown,
  Info
} from "lucide-react";

import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { apiService } from "@/lib/api";
import { CareerRoadmapResponse, RoadmapMilestoneItem } from "@/types/career-intelligence";

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

export default function StudentRoadmapPage() {
  const [roadmap, setRoadmap] = useState<CareerRoadmapResponse | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("Full Stack Developer");
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

  // Notes Modal state
  const [activeNotesItem, setActiveNotesItem] = useState<RoadmapMilestoneItem | null>(null);
  const [noteContent, setNoteContent] = useState<string>("");

  // Evidence Modal state
  const [activeEvidenceItem, setActiveEvidenceItem] = useState<RoadmapMilestoneItem | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState<string>("");
  const [evidenceNotes, setEvidenceNotes] = useState<string>("");

  // Feedback toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadRoadmap = async (role: string, force = false) => {
    setLoading(true);
    try {
      const res = await apiService.generateRoadmap({
        target_role: role,
        force_regenerate: force
      });
      if (res.data) {
        setRoadmap(res.data);
        setSelectedRole(res.data.target_role);
      }
    } catch (err) {
      console.error("Failed to load career roadmap:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoadmap(selectedRole);
  }, []);

  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole);
    loadRoadmap(newRole);
  };

  const handleToggleStatus = async (item: RoadmapMilestoneItem) => {
    setUpdatingItemId(item.id);
    const nextStatus = item.completion_status === "completed" ? "in_progress" : "completed";
    const nextIsCompleted = nextStatus === "completed";

    try {
      const res = await apiService.updateRoadmapMilestone(item.id, {
        status: nextStatus,
        is_completed: nextIsCompleted
      });
      if (res.data) {
        setRoadmap(res.data);
        showToast(
          nextIsCompleted
            ? `Milestone "${item.milestone_title}" marked completed!`
            : `Milestone "${item.milestone_title}" moved to In Progress.`
        );
      }
    } catch (err) {
      console.error("Failed to update milestone status:", err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!activeNotesItem) return;
    setUpdatingItemId(activeNotesItem.id);

    try {
      const res = await apiService.updateRoadmapMilestone(activeNotesItem.id, {
        notes: noteContent
      });
      if (res.data) {
        setRoadmap(res.data);
        showToast("Personal learning notes saved.");
        setActiveNotesItem(null);
      }
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvidenceItem || !evidenceUrl.trim()) return;

    setUpdatingItemId(activeEvidenceItem.id);
    try {
      const res = await apiService.updateRoadmapMilestone(activeEvidenceItem.id, {
        evidence_url: evidenceUrl.trim(),
        evidence_notes: evidenceNotes.trim(),
        status: "completed",
        is_completed: true
      });
      if (res.data) {
        setRoadmap(res.data);
        showToast("Project evidence submitted & verified!");
        setActiveEvidenceItem(null);
        setEvidenceUrl("");
        setEvidenceNotes("");
      }
    } catch (err) {
      console.error("Failed to submit evidence:", err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <WorkspaceShell role="student" activeTabTitle="Career Roadmap">
      <div className="space-y-6">
        {/* Toast Alert */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-cb-forest text-white px-5 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-cb-lime/30 animate-in slide-in-from-bottom">
            <CheckCircle2 className="w-4 h-4 text-cb-lime" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Workspace Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cb-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono text-cb-forest bg-cb-forest/10 px-2 py-0.5 rounded-full font-semibold">
                Personalized Curriculum
              </span>
              <span className="text-xs text-cb-secondary font-mono">
                Phase 10 Career Intelligence
              </span>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-cb-primary tracking-tight">
              Personalized 6-Week Career Roadmap
            </h1>
            <p className="text-sm text-cb-secondary mt-1 max-w-2xl">
              Sequenced milestones, vetted official resources, and hands-on coding exercises tailored to bridge your target role gaps.
            </p>
          </div>

          {/* Role Switcher & Refresh */}
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col">
              <label className="text-[11px] font-mono text-cb-secondary uppercase tracking-wider mb-1">
                Target Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="bg-white border border-cb-border rounded-xl px-3.5 py-2 text-xs font-semibold text-cb-primary focus:outline-none focus:ring-1 focus:ring-cb-forest shadow-xs min-w-[200px]"
              >
                {STANDARD_CURATED_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => loadRoadmap(selectedRole, true)}
              disabled={loading}
              className="mt-5 px-3 py-2 bg-stone-200/80 hover:bg-stone-200 text-cb-primary rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border border-cb-border disabled:opacity-50"
              title="Regenerate Roadmap"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cb-forest ${loading ? "animate-spin" : ""}`} />
              <span>Regenerate</span>
            </button>
          </div>
        </section>

        {/* Anti-Cheat / Rigor Disclaimer Banner */}
        <section className="bg-stone-100/90 border border-cb-border/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-cb-secondary">
          <ShieldCheck className="w-4 h-4 text-cb-forest shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-cb-primary">Evidence-Backed Rigor Standard: </span>
            {roadmap?.disclaimer ||
              "Marking milestones complete tracks personal study progress. Formal institutional skill verification on CareerBridge requires attaching verifiable project code (GitHub) or clearing an institutional mock interview."}
          </div>
        </section>

        {loading || !roadmap ? (
          <div className="flex items-center justify-center min-h-[350px]">
            <div className="flex items-center gap-3 text-cb-secondary font-mono text-sm">
              <RefreshCw className="w-5 h-5 animate-spin text-cb-forest" />
              <span>Generating sequenced curriculum for {selectedRole}...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Progress Metrics Strip */}
            <section className="premium-card p-6 rounded-2xl bg-white border border-cb-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs font-mono text-cb-secondary uppercase tracking-wider block">
                    Curriculum Progress
                  </span>
                  <h3 className="font-heading text-lg font-bold text-cb-primary mt-0.5">
                    {roadmap.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono text-2xl font-extrabold text-cb-forest">
                      {roadmap.progress_percentage}%
                    </span>
                    <span className="text-[11px] font-mono text-cb-secondary block">
                      {roadmap.completed_milestones} of {roadmap.total_milestones} Completed
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-cb-forest h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${roadmap.progress_percentage}%` }}
                />
              </div>
            </section>

            {/* Sequenced Milestones Timeline */}
            <section className="space-y-4">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cb-forest" />
                  <h2 className="font-heading text-base font-bold text-cb-primary">
                    6-Stage Sequenced Milestones
                  </h2>
                </div>
                <Link
                  href="/student/skill-gap"
                  className="text-xs text-cb-forest font-semibold hover:underline flex items-center gap-1"
                >
                  <span>View Gap Diagnosis</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-4">
                {roadmap.items.map((item, index) => {
                  const isCompleted = item.is_completed;
                  const isVerified = item.is_verified;
                  const isUpdating = updatingItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`premium-card p-6 rounded-2xl border transition-all duration-200 ${
                        isCompleted
                          ? "bg-stone-50/60 border-cb-border"
                          : "bg-white border-cb-border hover:border-cb-forest/40 hover:shadow-subtle"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        {/* Milestone Main Content */}
                        <div className="space-y-3 flex-1">
                          {/* Stage & Meta Pill */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-cb-forest bg-cb-forest/10 px-2.5 py-0.5 rounded-full">
                              Stage {item.stage_number} • Week {item.week_number}
                            </span>

                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                                item.priority === "mandatory"
                                  ? "bg-rose-100 text-rose-700"
                                  : item.priority === "high"
                                  ? "bg-cb-orange/15 text-cb-orange"
                                  : "bg-stone-200 text-stone-700"
                              }`}
                            >
                              {item.priority.toUpperCase()}
                            </span>

                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cb-secondary">
                              <Clock className="w-3 h-3 text-stone-400" />
                              <span>{item.estimated_learning_time}</span>
                            </span>

                            {/* Verification badge */}
                            {isCompleted && (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                  isVerified
                                    ? "bg-cb-forest/10 text-cb-forest border-cb-forest/30 font-semibold"
                                    : "bg-stone-200 text-cb-secondary border-stone-300"
                                }`}
                              >
                                {isVerified ? (
                                  <>
                                    <ShieldCheck className="w-3 h-3 text-cb-forest" />
                                    <span>Evidence Verified</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-stone-500" />
                                    <span>Self-Reported</span>
                                  </>
                                )}
                              </span>
                            )}
                          </div>

                          {/* Title & Description */}
                          <div>
                            <h3 className="font-heading text-lg font-bold text-cb-primary">
                              {item.milestone_title}
                            </h3>
                            <p className="text-xs text-cb-secondary mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          {/* Learning Resources */}
                          {item.learning_resources && item.learning_resources.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[11px] font-mono text-cb-secondary uppercase tracking-wider block">
                                Curated Learning Resources:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {item.learning_resources.map((res, rIdx) => (
                                  <a
                                    key={rIdx}
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-cb-border text-xs text-cb-primary font-medium transition-colors"
                                  >
                                    <Globe className="w-3 h-3 text-cb-forest" />
                                    <span>{res.title}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-cb-secondary" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Practical Hands-on Exercise */}
                          {item.practical_exercise && (
                            <div className="bg-stone-100/70 border border-cb-border/80 rounded-xl p-3 text-xs">
                              <div className="flex items-center gap-1.5 text-cb-forest font-semibold mb-1">
                                <FileCode className="w-3.5 h-3.5" />
                                <span>Practical Coding Exercise:</span>
                              </div>
                              <p className="text-cb-primary leading-relaxed">
                                {item.practical_exercise}
                              </p>
                            </div>
                          )}

                          {/* Existing Notes or Evidence display */}
                          {(item.student_notes || item.evidence_url) && (
                            <div className="pt-2 flex flex-wrap gap-3 text-xs text-cb-secondary font-mono">
                              {item.student_notes && (
                                <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-md">
                                  <MessageSquare className="w-3 h-3 text-cb-forest" />
                                  <span className="truncate max-w-md">Notes: {item.student_notes}</span>
                                </div>
                              )}
                              {item.evidence_url && (
                                <a
                                  href={item.evidence_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 bg-cb-forest/10 text-cb-forest px-2.5 py-1 rounded-md hover:underline"
                                >
                                  <Github className="w-3 h-3" />
                                  <span>Repository Proof</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons Column */}
                        <div className="flex lg:flex-col items-center gap-2 shrink-0 pt-2 lg:pt-0">
                          {/* Toggle Completed */}
                          <button
                            onClick={() => handleToggleStatus(item)}
                            disabled={isUpdating}
                            className={`w-full px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs ${
                              isCompleted
                                ? "bg-stone-200 text-cb-secondary hover:bg-stone-300"
                                : "bg-cb-forest hover:bg-cb-dark text-white"
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-cb-lime" />
                            <span>{isCompleted ? "Mark Incomplete" : "Mark Completed"}</span>
                          </button>

                          {/* Personal Notes Button */}
                          <button
                            onClick={() => {
                              setActiveNotesItem(item);
                              setNoteContent(item.student_notes || "");
                            }}
                            className="w-full px-3 py-2 bg-stone-100 hover:bg-stone-200 text-cb-primary rounded-xl text-xs font-medium transition-colors border border-cb-border flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-cb-secondary" />
                            <span>Notes</span>
                          </button>

                          {/* Submit Project Evidence Button */}
                          <button
                            onClick={() => {
                              setActiveEvidenceItem(item);
                              setEvidenceUrl(item.evidence_url || "");
                              setEvidenceNotes(item.evidence_notes || "");
                            }}
                            className="w-full px-3 py-2 bg-white hover:bg-stone-50 text-cb-forest rounded-xl text-xs font-semibold transition-colors border border-cb-forest/30 flex items-center justify-center gap-1.5"
                          >
                            <Github className="w-3.5 h-3.5" />
                            <span>Submit Evidence</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* Learning Notes Modal */}
        {activeNotesItem && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-cb-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-cb-border">
                <h3 className="font-heading text-base font-bold text-cb-primary">
                  Personal Study Notes
                </h3>
                <button
                  onClick={() => setActiveNotesItem(null)}
                  className="text-cb-secondary hover:text-cb-primary text-sm font-mono"
                >
                  ✕
                </button>
              </div>

              <div>
                <span className="text-xs font-mono text-cb-secondary block mb-1">
                  Milestone: {activeNotesItem.milestone_title}
                </span>
                <textarea
                  rows={4}
                  placeholder="Record key takeaways, syntax patterns, or architectural considerations..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full bg-stone-50 border border-cb-border rounded-xl p-3 text-xs text-cb-primary focus:outline-none focus:ring-1 focus:ring-cb-forest"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveNotesItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-cb-secondary hover:text-cb-primary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-5 py-2 bg-cb-forest hover:bg-cb-dark text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Project Evidence Modal */}
        {activeEvidenceItem && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-cb-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-cb-border">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cb-forest" />
                  <h3 className="font-heading text-base font-bold text-cb-primary">
                    Submit Project Proof-of-Work
                  </h3>
                </div>
                <button
                  onClick={() => setActiveEvidenceItem(null)}
                  className="text-cb-secondary hover:text-cb-primary text-sm font-mono"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitEvidence} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-cb-secondary uppercase tracking-wider block mb-1">
                    Repository URL (GitHub / GitLab)
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://github.com/your-username/project-repo"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    className="w-full bg-stone-50 border border-cb-border rounded-xl px-3.5 py-2 text-xs font-semibold text-cb-primary focus:outline-none focus:ring-1 focus:ring-cb-forest"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-cb-secondary uppercase tracking-wider block mb-1">
                    Implementation Notes / Live Demo URL
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Explain architectural implementation, unit test coverage, or live deployment link..."
                    value={evidenceNotes}
                    onChange={(e) => setEvidenceNotes(e.target.value)}
                    className="w-full bg-stone-50 border border-cb-border rounded-xl p-3 text-xs text-cb-primary focus:outline-none focus:ring-1 focus:ring-cb-forest"
                  />
                  <p className="text-[11px] text-cb-secondary mt-1">
                    Submitting valid code evidence upgrades this milestone to "Evidence Verified".
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveEvidenceItem(null)}
                    className="px-4 py-2 text-xs font-semibold text-cb-secondary hover:text-cb-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-cb-forest hover:bg-cb-dark text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-cb-lime" />
                    <span>Verify & Complete</span>
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
