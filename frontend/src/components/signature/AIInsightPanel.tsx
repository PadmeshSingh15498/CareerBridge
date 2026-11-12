"use client";

import React from "react";
import { ArrowRight, Bot, ChevronRight, Lightbulb, Sparkles, TrendingUp, Zap } from "lucide-react";

export const AIInsightPanel: React.FC<{ className?: string }> = ({ className = "" }) => {
  const insights = [
    {
      type: "ATS Benchmark",
      title: "Quantified Impact Detected",
      text: "5 project bullet points feature STAR metrics (e.g. 'reduced API response time by 42%'). This places your resume in the top 8% of applicants.",
      badge: "+15 pts Impact",
      badgeColor: "bg-lime/20 text-lime border-lime/30",
    },
    {
      type: "Compensation Forecast",
      title: "Market Valuation: ₹18 - ₹24 LPA",
      text: "Based on 32 active hiring mandates in Bengaluru & Hyderabad seeking FastAPI + MySQL + Sentence Transformer skills.",
      badge: "High Demand",
      badgeColor: "bg-white/10 text-white border-white/20",
    },
    {
      type: "High-ROI Recommendation",
      title: "Containerization Milestone (Week 3)",
      text: "Adding Docker Compose deployment to your Distributed Task Queue project is predicted to increase semantic match score for Google Cloud from 91.4% to 96.1%.",
      badge: "+4.7% Match",
      badgeColor: "bg-orange-warm/20 text-orange-warm border-orange-warm/30",
    },
  ];

  return (
    <div className={`dark-card p-6 rounded-2xl relative overflow-hidden ${className}`}>
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-forest/40 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-lime text-forest-dark flex items-center justify-center font-bold shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-lime font-semibold block">
              BridgeAI Engine
            </span>
            <h3 className="font-heading text-base font-bold text-white">
              Career Intelligence Insights
            </h3>
          </div>
        </div>
        <span className="text-[11px] font-mono text-white/60 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
          Source: Sentence Transformers 384-d
        </span>
      </div>

      {/* Insights Stream */}
      <div className="space-y-3.5 relative z-10">
        {insights.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-150"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/60">
                {item.type}
              </span>
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>
            <h4 className="font-heading text-sm font-semibold text-white mb-1">
              {item.title}
            </h4>
            <p className="text-xs text-white/70 leading-relaxed font-sans">
              {item.text}
            </p>
          </div>
        ))}
      </div>

      {/* Footer Interactive Trigger */}
      <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between relative z-10">
        <span className="text-xs font-mono text-white/60">
          Updated: Just now • Deterministic Model
        </span>
        <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-lime hover:underline">
          Query BridgeAI Copilot <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

