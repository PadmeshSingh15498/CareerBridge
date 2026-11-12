"use client";

import React from "react";
import { ArrowUpRight, Check, CheckCircle2, ChevronRight, Sparkles, AlertCircle, Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface MatchIntelligenceCardProps {
  company: string;
  role: string;
  location: string;
  salary: string;
  jobType: string;
  matchScore: number;
  semanticSimilarity: number;
  skillOverlap: number;
  matchedSkills: string[];
  missingSkills: string[];
  eligibilityMet: boolean;
  onApply?: () => void;
  className?: string;
}

export const MatchIntelligenceCard: React.FC<MatchIntelligenceCardProps> = ({
  company = "Google Cloud",
  role = "Associate Software Engineer - Distributed Systems",
  location = "Bengaluru, Karnataka (Hybrid)",
  salary = "₹18.0 - ₹24.0 LPA",
  jobType = "Full-Time",
  matchScore = 91.4,
  semanticSimilarity = 94.2,
  skillOverlap = 88.0,
  matchedSkills = ["Python", "FastAPI", "MySQL", "Docker", "Data Structures"],
  missingSkills = ["Kubernetes", "gRPC"],
  eligibilityMet = true,
  onApply,
  className = "",
}) => {
  return (
    <div className={`premium-card p-6 rounded-2xl ${className}`}>
      {/* Top Meta Bar */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-forest-dark text-white flex items-center justify-center font-heading font-bold text-lg shadow-sm flex-shrink-0">
            {company.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-semibold text-primary">{company}</span>
              <span className="text-[11px] font-mono text-primary-muted bg-stone-200/60 px-2 py-0.5 rounded border border-border-subtle">
                {jobType}
              </span>
            </div>
            <h3 className="font-heading text-base font-bold text-primary mt-0.5 leading-snug">
              {role}
            </h3>
            <div className="flex items-center gap-3 text-xs text-primary-muted mt-1.5 font-mono">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary-muted" /> {location}
              </span>
              <span>•</span>
              <span className="font-semibold text-forest">{salary}</span>
            </div>
          </div>
        </div>

        {/* Composite Match Badge */}
        <div className="flex flex-col items-end flex-shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest text-white border border-forest-dark shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-lime" />
            <span className="font-mono text-sm font-bold tracking-tight">
              {matchScore}
              <span className="text-[10px] text-lime font-normal ml-0.5">%</span>
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-forest font-semibold mt-1">
            Strong Match
          </span>
        </div>
      </div>

      {/* Vector & Skill Overlap Telemetry */}
      <div className="my-4 py-3 px-4 rounded-xl bg-stone-100/70 border border-border-subtle grid grid-cols-3 gap-2 text-center">
        <div>
          <span className="text-[11px] font-mono text-primary-muted block">Semantic Vector</span>
          <span className="font-mono text-sm font-bold text-forest">{semanticSimilarity}%</span>
        </div>
        <div className="border-x border-border-subtle">
          <span className="text-[11px] font-mono text-primary-muted block">Skill Overlap</span>
          <span className="font-mono text-sm font-bold text-forest">{skillOverlap}%</span>
        </div>
        <div>
          <span className="text-[11px] font-mono text-primary-muted block">Campus Gating</span>
          <span className="font-mono text-sm font-bold text-emerald-700 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" /> Passed
          </span>
        </div>
      </div>

      {/* Skill Intersection Breakdown */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-mono text-primary-muted mr-1">Matched:</span>
          {matchedSkills.map((sk) => (
            <span
              key={sk}
              className="inline-flex items-center text-xs font-sans text-forest bg-stone-200/70 px-2 py-0.5 rounded-md border border-border-subtle"
            >
              <Check className="w-3 h-3 text-forest mr-1" /> {sk}
            </span>
          ))}
        </div>

        {missingSkills.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-mono text-primary-muted mr-1">Recommended:</span>
            {missingSkills.map((sk) => (
              <span
                key={sk}
                className="inline-flex items-center text-xs font-sans text-orange-warm bg-orange-light px-2 py-0.5 rounded-md border border-orange-warm/20"
              >
                + {sk}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-border-subtle flex items-center justify-between gap-3">
        <span className="text-xs text-primary-muted font-mono">
          Deadline: In 14 days • 8 campus openings
        </span>
        <button
          onClick={onApply}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-forest text-white hover:bg-forest-dark transition-all duration-150 shadow-sm hover:shadow"
        >
          Apply via 1-Click <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

