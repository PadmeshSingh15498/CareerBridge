"use client";

import React from "react";
import { Award, Briefcase, CheckCircle2, Clock, FileText, Sparkles, UserCheck } from "lucide-react";

interface ActivityItem {
  id: string;
  category: "application" | "ats" | "drive" | "interview" | "tpo";
  title: string;
  detail: string;
  time: string;
  metric?: string;
}

export const ActivityTimeline: React.FC<{ className?: string }> = ({ className = "" }) => {
  const activities: ActivityItem[] = [
    {
      id: "act-1",
      category: "application",
      title: "Shortlisted for Technical Round 1",
      detail: "Google Cloud talent team moved your profile to the Technical Round stage after 91.4% semantic match.",
      time: "14m ago",
      metric: "Rank #3 of 142",
    },
    {
      id: "act-2",
      category: "ats",
      title: "PyMuPDF Resume Analysis Synchronized",
      detail: "Validated 24 technical taxonomy competencies; quantifiable metric density increased score to 92.",
      time: "1h ago",
      metric: "ATS: 92/100",
    },
    {
      id: "act-3",
      category: "drive",
      title: "Campus Drive Registration Confirmed",
      detail: "Successfully registered for Google Cloud Campus Recruitment Drive 2026. Online assessment on Oct 20.",
      time: "3h ago",
      metric: "TPO Verified",
    },
    {
      id: "act-4",
      category: "interview",
      title: "Mock Interview Simulation Evaluated",
      detail: "Completed STAR behavioral session for Senior Backend Engineer. Communication & Problem Solving rated 4.5/5.",
      time: "1d ago",
      metric: "Score: 88%",
    },
  ];

  const getIcon = (cat: ActivityItem["category"]) => {
    switch (cat) {
      case "application":
        return <Briefcase className="w-3.5 h-3.5 text-forest" />;
      case "ats":
        return <FileText className="w-3.5 h-3.5 text-forest" />;
      case "drive":
        return <Award className="w-3.5 h-3.5 text-forest" />;
      case "interview":
        return <Sparkles className="w-3.5 h-3.5 text-forest" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-forest" />;
    }
  };

  return (
    <div className={`premium-card p-6 rounded-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-forest" />
            <span className="text-xs font-mono uppercase tracking-widest text-primary-muted">
              Live Audit Stream
            </span>
          </div>
          <h3 className="font-heading text-lg font-bold text-primary mt-0.5">
            Real-Time Activity Telemetry
          </h3>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-mono text-forest bg-stone-200/60 px-2.5 py-1 rounded-md border border-border-subtle">
          <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse" /> Live Feed
        </span>
      </div>

      {/* Stream List */}
      <div className="space-y-3.5">
        {activities.map((act) => (
          <div
            key={act.id}
            className="p-3.5 rounded-xl border border-border-subtle bg-white hover:bg-stone-50/70 hover:border-forest/30 transition-all duration-150 flex items-start gap-3.5"
          >
            <div className="w-8 h-8 rounded-lg bg-stone-200/60 flex items-center justify-center flex-shrink-0 mt-0.5 border border-border-subtle">
              {getIcon(act.category)}
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <h4 className="font-heading text-sm font-semibold text-primary">
                  {act.title}
                </h4>
                <div className="flex items-center gap-2">
                  {act.metric && (
                    <span className="text-[10px] font-mono text-forest bg-lime/20 px-2 py-0.5 rounded border border-lime/30 font-semibold">
                      {act.metric}
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-primary-muted">
                    {act.time}
                  </span>
                </div>
              </div>

              <p className="text-xs text-primary-muted leading-relaxed font-sans">
                {act.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

