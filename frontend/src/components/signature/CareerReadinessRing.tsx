"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Award, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";

interface Pillar {
  name: string;
  score: number;
  weight: string;
  status: "verified" | "optimizing" | "needs_attention";
}

interface CareerReadinessRingProps {
  score?: number;
  pillars?: Pillar[];
  className?: string;
}

export const CareerReadinessRing: React.FC<CareerReadinessRingProps> = ({
  score = 86,
  pillars = [
    { name: "ATS Resume Rubric", score: 92, weight: "30%", status: "verified" },
    { name: "Verified Skill Taxonomy", score: 84, weight: "30%", status: "verified" },
    { name: "Mock Interview (STAR)", score: 78, weight: "25%", status: "optimizing" },
    { name: "Academic & Campus Criteria", score: 95, weight: "15%", status: "verified" },
  ],
  className = "",
}) => {
  const [activePillar, setActivePillar] = useState<number | null>(null);

  // SVG circular math
  const radius = 64;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`premium-card p-6 rounded-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-forest" />
          <span className="text-xs font-mono uppercase tracking-widest text-primary-muted">
            Readiness Index
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-forest bg-stone-200/60 px-2 py-0.5 rounded-full border border-border-subtle">
          <Sparkles className="w-3 h-3 text-forest" /> Verified Cohort
        </span>
      </div>

      {/* Main Metric Visualization */}
      <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
        {/* Animated Radial SVG */}
        <div className="relative flex items-center justify-center flex-shrink-0">
          <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#ECEDE7"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Sub-track ticks */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#E2E4DC"
              strokeWidth={strokeWidth}
              strokeDasharray="4 8"
              fill="transparent"
            />
            {/* Animated Score Progress Arc */}
            <motion.circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#244D3D"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Central Percentage Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-heading text-3xl font-bold tracking-tight text-primary">
              {score}
              <span className="text-xs font-mono text-primary-muted font-normal ml-0.5">%</span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-forest font-semibold mt-0.5">
              Placement Ready
            </span>
          </div>
        </div>

        {/* Narrative & Status Description */}
        <div className="flex-1 text-center sm:text-left">
          <h4 className="font-heading text-base font-semibold text-primary mb-1">
            Tier 1 Recruiter Eligible
          </h4>
          <p className="text-xs text-primary-muted leading-relaxed mb-3">
            Your semantic profile matches top 15% of university candidates. Strengthening Cloud & System Design will elevate readiness to 94%.
          </p>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-forest bg-lime/20 px-2.5 py-1 rounded-md border border-lime/40">
            <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse" />
            Predicted Offer Probability: 88%
          </div>
        </div>
      </div>

      {/* Segmented Pillars Grid */}
      <div className="mt-5 pt-4 border-t border-border-subtle grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {pillars.map((pillar, idx) => (
          <div
            key={pillar.name}
            onMouseEnter={() => setActivePillar(idx)}
            onMouseLeave={() => setActivePillar(null)}
            className={`p-2.5 rounded-xl border transition-all duration-150 cursor-pointer ${
              activePillar === idx
                ? "bg-stone-200/50 border-forest/30"
                : "bg-stone-100/60 border-border-subtle hover:border-stone-400"
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-sans text-[13px] font-medium text-primary">
                {pillar.name}
              </span>
              <span className="font-mono font-semibold text-forest">
                {pillar.score}%
              </span>
            </div>
            {/* Fine progress bar */}
            <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pillar.score >= 90
                    ? "bg-forest"
                    : pillar.score >= 80
                    ? "bg-forest-light"
                    : "bg-orange-warm"
                }`}
                style={{ width: `${pillar.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

