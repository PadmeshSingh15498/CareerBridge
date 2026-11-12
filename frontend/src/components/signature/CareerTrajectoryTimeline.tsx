"use client";

import React from "react";
import { Check, Clock, Compass, FileCheck, Flag, Sparkles, Target } from "lucide-react";

interface Milestone {
  step: string;
  title: string;
  description: string;
  status: "completed" | "current" | "upcoming";
  timestamp: string;
  metrics?: string;
}

export const CareerTrajectoryTimeline: React.FC<{ className?: string }> = ({ className = "" }) => {
  const milestones: Milestone[] = [
    {
      step: "01",
      title: "Academic & Profile Verification",
      description: "University credentials, 8.75 CGPA, and department records authenticated by TPO.",
      status: "completed",
      timestamp: "Aug 15, 2026",
      metrics: "CGPA 8.75 Verified",
    },
    {
      step: "02",
      title: "PyMuPDF Resume Analysis & ATS Benchmark",
      description: "Extracted 24 technical competencies; scored 92/100 on 4-factor quantifiable rubric.",
      status: "completed",
      timestamp: "Sep 02, 2026",
      metrics: "ATS Score: 92/100",
    },
    {
      step: "03",
      title: "Skill Gap Bridging & Sequenced Roadmap",
      description: "FastAPI REST API design completed; currently mastering Docker containerization & Redis caching.",
      status: "current",
      timestamp: "In Progress (Week 3/6)",
      metrics: "65% Readiness",
    },
    {
      step: "04",
      title: "Recruiter Discovery & Campus Drive Pipeline",
      description: "Matched with 5 Tier-1 corporate openings; shortlisted for Google Cloud & Microsoft TR rounds.",
      status: "upcoming",
      timestamp: "Expected: Oct 2026",
      metrics: "91.4% Match Rank",
    },
    {
      step: "05",
      title: "Final Placement Offer & Institutional Clearance",
      description: "Convert campus placement interview into formal appointment letter and TPO registry lock.",
      status: "upcoming",
      timestamp: "Expected: Nov 2026",
      metrics: "Target CTC: ₹20+ LPA",
    },
  ];

  return (
    <div className={`premium-card p-6 rounded-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-forest" />
            <span className="text-xs font-mono uppercase tracking-widest text-primary-muted">
              Milestone Progression
            </span>
          </div>
          <h3 className="font-heading text-lg font-bold text-primary mt-0.5">
            Career Trajectory Timeline
          </h3>
        </div>
        <span className="text-xs font-mono text-forest bg-stone-200/60 px-2.5 py-1 rounded-md border border-border-subtle">
          Phase 3 of 5 Active
        </span>
      </div>

      {/* Timeline Steps */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border-subtle">
        {milestones.map((m) => {
          const isCompleted = m.status === "completed";
          const isCurrent = m.status === "current";

          return (
            <div key={m.step} className="relative group">
              {/* Bullet Node */}
              <div
                className={`absolute -left-[30px] top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                  isCompleted
                    ? "bg-forest border-forest text-white"
                    : isCurrent
                    ? "bg-cream border-forest text-forest shadow-sm"
                    : "bg-stone-200 border-border-subtle text-primary-muted"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3 text-lime stroke-[3]" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-forest animate-ping" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                )}
              </div>

              {/* Card Content */}
              <div
                className={`p-4 rounded-xl border transition-all duration-150 ${
                  isCurrent
                    ? "bg-stone-100/90 border-forest/30 shadow-subtle"
                    : "bg-white border-border-subtle hover:border-stone-400"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-forest">
                      {m.step}
                    </span>
                    <h4 className="font-heading text-sm font-bold text-primary">
                      {m.title}
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-primary-muted">
                    {m.timestamp}
                  </span>
                </div>

                <p className="text-xs text-primary-muted leading-relaxed mb-3">
                  {m.description}
                </p>

                {m.metrics && (
                  <div className="flex items-center justify-between pt-2.5 border-t border-border-subtle text-[11px] font-mono">
                    <span className="text-primary-muted">Performance Metric:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isCompleted || isCurrent ? "text-forest" : "text-primary-muted"}`}>
                        {m.metrics}
                      </span>
                      {isCurrent && m.step === "03" && (
                        <a
                          href="/student/roadmap"
                          className="text-[10px] bg-forest text-white px-2 py-0.5 rounded hover:bg-forest-dark transition-colors"
                        >
                          View Roadmap &rarr;
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

