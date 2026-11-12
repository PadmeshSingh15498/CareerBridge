"use client";

import React, { useState } from "react";
import { ArrowRight, Check, CheckCircle2, ChevronRight, Compass, Sparkles, XCircle } from "lucide-react";

interface TargetRoleGap {
  role: string;
  readiness: number;
  matchedCount: number;
  totalRequired: number;
  criticalMissing: { skill: string; weight: string; weeks: number }[];
  secondaryMissing: { skill: string; weight: string; weeks: number }[];
  matchedCore: string[];
}

export const SkillGapComparison: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [selectedRole, setSelectedRole] = useState<string>("backend_lead");

  const roles: Record<string, TargetRoleGap> = {
    backend_lead: {
      role: "Distributed Backend Engineer",
      readiness: 78.5,
      matchedCount: 11,
      totalRequired: 14,
      criticalMissing: [
        { skill: "Docker & Container Networking", weight: "Mandatory", weeks: 2 },
        { skill: "gRPC & Protocol Buffers", weight: "Mandatory", weeks: 2 },
      ],
      secondaryMissing: [
        { skill: "Kubernetes Orchestration", weight: "Preferred", weeks: 2 },
      ],
      matchedCore: ["Python", "FastAPI", "MySQL", "Redis", "REST Design", "Data Structures", "System Design"],
    },
    cloud_architect: {
      role: "Cloud Platform Specialist",
      readiness: 64.0,
      matchedCount: 8,
      totalRequired: 14,
      criticalMissing: [
        { skill: "Terraform IaC", weight: "Mandatory", weeks: 3 },
        { skill: "AWS IAM & VPC Peering", weight: "Mandatory", weeks: 2 },
        { skill: "CI/CD Pipeline Security", weight: "Mandatory", weeks: 1 },
      ],
      secondaryMissing: [
        { skill: "Prometheus & Grafana", weight: "Preferred", weeks: 1 },
      ],
      matchedCore: ["Python", "Docker", "Linux Shell", "MySQL", "Git & GitHub"],
    },
  };

  const active = roles[selectedRole];

  return (
    <div className={`premium-card p-6 rounded-2xl ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-border-subtle gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-forest" />
            <span className="text-xs font-mono uppercase tracking-widest text-primary-muted">
              Gap Diagnosis
            </span>
          </div>
          <h3 className="font-heading text-lg font-bold text-primary mt-0.5">
            Role Benchmark vs. Profile Delta
          </h3>
        </div>

        {/* Role Toggle Selector */}
        <div className="flex gap-1.5 bg-stone-200/60 p-1 rounded-xl border border-border-subtle">
          <button
            onClick={() => setSelectedRole("backend_lead")}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              selectedRole === "backend_lead"
                ? "bg-white text-primary shadow-sm"
                : "text-primary-muted hover:text-primary"
            }`}
          >
            Backend Specialist
          </button>
          <button
            onClick={() => setSelectedRole("cloud_architect")}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              selectedRole === "cloud_architect"
                ? "bg-white text-primary shadow-sm"
                : "text-primary-muted hover:text-primary"
            }`}
          >
            Cloud Platform
          </button>
        </div>
      </div>

      {/* Target Role & Readiness Score Banner */}
      <div className="p-4 rounded-xl bg-stone-100/70 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <span className="text-xs font-mono text-primary-muted uppercase tracking-wider block">
            Target Benchmark
          </span>
          <h4 className="font-heading text-base font-bold text-primary mt-0.5">
            {active.role}
          </h4>
          <span className="text-xs font-mono text-primary-muted">
            {active.matchedCount} of {active.totalRequired} core requirements satisfied
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-mono text-primary-muted block">Profile Readiness</span>
            <span className="font-mono text-xl font-bold text-forest">{active.readiness}%</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-forest text-lime flex items-center justify-center font-mono font-bold text-sm shadow-sm">
            {Math.round(active.readiness)}%
          </div>
        </div>
      </div>

      {/* Side-by-side: Critical Gaps vs Matched Core */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Critical Missing Skills */}
        <div className="p-4 rounded-xl border border-orange-warm/25 bg-orange-light/40">
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading text-xs font-bold text-orange-warm uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-orange-warm" /> Critical Gaps ({active.criticalMissing.length})
            </span>
            <span className="text-[10px] font-mono text-primary-muted">Est. 4 Weeks</span>
          </div>

          <div className="space-y-2">
            {active.criticalMissing.map((g) => (
              <div
                key={g.skill}
                className="p-2.5 rounded-lg bg-white/80 border border-orange-warm/20 flex items-center justify-between text-xs"
              >
                <span className="font-medium text-primary font-sans">{g.skill}</span>
                <span className="font-mono text-[11px] text-orange-warm font-semibold">
                  ~{g.weeks} wks
                </span>
              </div>
            ))}
            {active.secondaryMissing.map((g) => (
              <div
                key={g.skill}
                className="p-2.5 rounded-lg bg-white/60 border border-border-subtle flex items-center justify-between text-xs"
              >
                <span className="text-primary-muted font-sans">{g.skill} (Optional)</span>
                <span className="font-mono text-[11px] text-primary-muted">~{g.weeks} wks</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verified Matched Competencies */}
        <div className="p-4 rounded-xl border border-border-subtle bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-forest" /> Matched Core ({active.matchedCore.length})
            </span>
            <span className="text-[10px] font-mono text-forest bg-lime/20 px-2 py-0.5 rounded border border-lime/30">
              Verified
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {active.matchedCore.map((sk) => (
              <span
                key={sk}
                className="inline-flex items-center text-xs font-sans text-forest bg-stone-100 px-2.5 py-1 rounded-md border border-border-subtle"
              >
                <Check className="w-3 h-3 text-forest mr-1" /> {sk}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CTA: Roadmap Generator */}
      <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs font-mono text-primary-muted">
          Sequenced Path: <strong>6-Week Curriculum</strong> ready for auto-generation
        </span>
        <button className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-forest text-white hover:bg-forest-dark transition-all duration-150 shadow-sm">
          Generate 6-Week Action Roadmap <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

