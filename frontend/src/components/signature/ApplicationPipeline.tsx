"use client";

import React, { useState } from "react";
import { CheckCircle2, ChevronRight, Filter, MoreHorizontal, Sparkles, User } from "lucide-react";

interface PipelineCard {
  id: string;
  candidateName: string;
  rollNumber: string;
  role: string;
  matchScore: number;
  cgpa: number;
  status: "applied" | "screening" | "shortlisted" | "technical" | "offered";
}

export const ApplicationPipeline: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [activeStage, setActiveStage] = useState<string>("all");

  const stages = [
    { id: "applied", label: "Applied", count: 4 },
    { id: "screening", label: "Screening", count: 2 },
    { id: "shortlisted", label: "Shortlisted", count: 3 },
    { id: "technical", label: "Tech Round", count: 1 },
    { id: "offered", label: "Offered", count: 1 },
  ];

  const candidates: PipelineCard[] = [
    {
      id: "app-1",
      candidateName: "Aditya Sharma",
      rollNumber: "2022CSB1045",
      role: "Associate Software Engineer",
      matchScore: 91.4,
      cgpa: 8.75,
      status: "technical",
    },
    {
      id: "app-2",
      candidateName: "Sneha Patel",
      rollNumber: "2022ITB1012",
      role: "Associate Software Engineer",
      matchScore: 89.2,
      cgpa: 8.90,
      status: "shortlisted",
    },
    {
      id: "app-3",
      candidateName: "Rohan Verma",
      rollNumber: "2022CSB1088",
      role: "Cloud Platform Intern",
      matchScore: 86.5,
      cgpa: 8.20,
      status: "shortlisted",
    },
    {
      id: "app-4",
      candidateName: "Meera Nair",
      rollNumber: "2022ECB1034",
      role: "Backend Engineer",
      matchScore: 94.0,
      cgpa: 9.15,
      status: "offered",
    },
    {
      id: "app-5",
      candidateName: "Arjun Reddy",
      rollNumber: "2022CSB1102",
      role: "Data Engineering Intern",
      matchScore: 78.4,
      cgpa: 7.80,
      status: "screening",
    },
  ];

  const filteredCandidates =
    activeStage === "all"
      ? candidates
      : candidates.filter((c) => c.status === activeStage);

  return (
    <div className={`premium-card p-6 rounded-2xl ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-border-subtle gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-forest" />
            <span className="text-xs font-mono uppercase tracking-widest text-primary-muted">
              ATS Pipeline
            </span>
          </div>
          <h3 className="font-heading text-lg font-bold text-primary mt-0.5">
            Recruitment Flow & Stage Progress
          </h3>
        </div>

        {/* Stage Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveStage("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeStage === "all"
                ? "bg-forest text-white"
                : "bg-stone-200/60 text-primary-muted hover:text-primary"
            }`}
          >
            All ({candidates.length})
          </button>
          {stages.map((st) => (
            <button
              key={st.id}
              onClick={() => setActiveStage(st.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeStage === st.id
                  ? "bg-forest text-white"
                  : "bg-stone-200/60 text-primary-muted hover:text-primary"
              }`}
            >
              {st.label} ({st.count})
            </button>
          ))}
        </div>
      </div>

      {/* Candidate Pipeline Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCandidates.map((c) => (
          <div
            key={c.id}
            className="p-3.5 rounded-xl border border-border-subtle bg-stone-50/60 hover:bg-white hover:border-forest/40 hover:shadow-subtle transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-heading text-sm font-bold text-primary">
                    {c.candidateName}
                  </h4>
                  <span className="text-[11px] font-mono text-primary-muted">
                    {c.rollNumber} • CGPA {c.cgpa}
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-forest text-white text-[11px] font-mono font-bold">
                  <Sparkles className="w-2.5 h-2.5 text-lime" />
                  {c.matchScore}%
                </div>
              </div>
              <p className="text-xs text-primary-muted mb-3 font-sans">
                {c.role}
              </p>
            </div>

            <div className="pt-2.5 border-t border-border-subtle flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-forest font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-forest" />
                {c.status.replace("_", " ")}
              </span>
              <span className="text-[11px] text-primary-muted font-mono hover:text-primary cursor-pointer">
                Review Profile →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

