"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CheckCircle2, AlertCircle, HelpCircle, Layers, Terminal, Database, Globe, Cpu, Wrench } from "lucide-react";
import { ConstellationNode } from "@/types/career-intelligence";

interface SkillConstellationProps {
  nodes?: ConstellationNode[];
  title?: string;
  className?: string;
}

const DEFAULT_NODES: ConstellationNode[] = [
  { name: "Python", category: "languages", status: "already_proficient", proficiency: "expert", target_proficiency: "advanced", verified: true, has_project_evidence: true, priority: "mandatory", frequency: "94% JDs" },
  { name: "FastAPI", category: "backend", status: "already_proficient", proficiency: "expert", target_proficiency: "intermediate", verified: true, has_project_evidence: true, priority: "mandatory", frequency: "82% JDs" },
  { name: "MySQL", category: "backend", status: "already_proficient", proficiency: "advanced", target_proficiency: "intermediate", verified: true, has_project_evidence: true, priority: "mandatory", frequency: "88% JDs" },
  { name: "TypeScript", category: "languages", status: "already_proficient", proficiency: "advanced", target_proficiency: "intermediate", verified: true, has_project_evidence: true, priority: "mandatory", frequency: "79% JDs" },
  { name: "Docker", category: "cloud", status: "already_proficient", proficiency: "intermediate", target_proficiency: "intermediate", verified: true, has_project_evidence: true, priority: "high", frequency: "76% JDs" },
  { name: "Sentence Transformers", category: "data_ai", status: "already_proficient", proficiency: "intermediate", target_proficiency: "intermediate", verified: true, has_project_evidence: true, priority: "mandatory", frequency: "68% JDs" },
  { name: "PyMuPDF", category: "data_ai", status: "already_proficient", proficiency: "intermediate", target_proficiency: "intermediate", verified: true, has_project_evidence: true, priority: "high", frequency: "52% JDs" },
  { name: "Data Structures & Algorithms", category: "fundamentals", status: "already_proficient", proficiency: "advanced", target_proficiency: "advanced", verified: true, has_project_evidence: false, priority: "mandatory", frequency: "96% JDs" },
  { name: "System Design", category: "fundamentals", status: "needs_improvement", proficiency: "beginner", target_proficiency: "intermediate", verified: false, has_project_evidence: false, priority: "high", frequency: "85% JDs" },
  { name: "Redis", category: "backend", status: "needs_improvement", proficiency: "beginner", target_proficiency: "intermediate", verified: false, has_project_evidence: false, priority: "high", frequency: "64% JDs" },
  { name: "Kubernetes", category: "cloud", status: "not_yet_learned", proficiency: "unspecified", target_proficiency: "beginner", verified: false, has_project_evidence: false, priority: "high", frequency: "72% JDs" },
  { name: "Next.js", category: "backend", status: "already_proficient", proficiency: "advanced", target_proficiency: "intermediate", verified: true, has_project_evidence: true, priority: "high", frequency: "74% JDs" },
];

export const SkillConstellation: React.FC<SkillConstellationProps> = ({
  nodes,
  title = "Verified Skill Constellation",
  className = ""
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [hoveredSkill, setHoveredSkill] = useState<ConstellationNode | null>(null);

  const skillList = nodes && nodes.length > 0 ? nodes : DEFAULT_NODES;

  const categories = [
    { id: "all", label: "All Competencies", icon: Layers },
    { id: "languages", label: "Languages", icon: Terminal },
    { id: "backend", label: "Backend & DB", icon: Database },
    { id: "cloud", label: "Cloud & DevOps", icon: Globe },
    { id: "data_ai", label: "AI / ML Engine", icon: Cpu },
    { id: "fundamentals", label: "Fundamentals", icon: Wrench },
  ];

  const filteredSkills = skillList.filter((s) => {
    const matchCat = selectedCategory === "all" || s.category === selectedCategory;
    const matchStatus = selectedStatus === "all" || s.status === selectedStatus;
    return matchCat && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "already_proficient":
        return {
          label: "Proficient",
          badgeBg: "bg-cb-forest/10 text-cb-forest border-cb-forest/20",
          icon: CheckCircle2,
          border: "border-cb-forest/30 bg-white"
        };
      case "needs_improvement":
        return {
          label: "Needs Reinforcement",
          badgeBg: "bg-cb-orange/15 text-cb-orange border-cb-orange/20",
          icon: AlertCircle,
          border: "border-cb-orange/40 bg-white"
        };
      case "not_yet_learned":
        return {
          label: "Gap",
          badgeBg: "bg-stone-200 text-cb-secondary border-stone-300",
          icon: AlertCircle,
          border: "border-dashed border-stone-300 bg-stone-50"
        };
      default:
        return {
          label: "Unspecified",
          badgeBg: "bg-stone-200 text-stone-600 border-stone-300",
          icon: HelpCircle,
          border: "border-stone-200 bg-white"
        };
    }
  };

  return (
    <div className={`premium-card p-6 rounded-2xl ${className}`}>
      {/* Title Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 mb-4 border-b border-cb-border gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cb-forest" />
            <span className="text-xs font-mono uppercase tracking-widest text-cb-secondary">
              Ontology Competency Matrix
            </span>
          </div>
          <h3 className="font-heading text-lg font-bold text-cb-primary mt-0.5">
            {title}
          </h3>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter pills */}
          <div className="flex items-center gap-1 bg-stone-200/60 p-1 rounded-xl text-xs font-mono">
            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-2 py-0.5 rounded-lg transition-all ${selectedStatus === "all" ? "bg-white text-cb-primary shadow-xs font-semibold" : "text-cb-secondary"}`}
            >
              All ({skillList.length})
            </button>
            <button
              onClick={() => setSelectedStatus("already_proficient")}
              className={`px-2 py-0.5 rounded-lg transition-all ${selectedStatus === "already_proficient" ? "bg-cb-forest text-white shadow-xs font-semibold" : "text-cb-forest"}`}
            >
              Proficient
            </button>
            <button
              onClick={() => setSelectedStatus("needs_improvement")}
              className={`px-2 py-0.5 rounded-lg transition-all ${selectedStatus === "needs_improvement" ? "bg-cb-orange text-white shadow-xs font-semibold" : "text-cb-orange"}`}
            >
              Reinforce
            </button>
            <button
              onClick={() => setSelectedStatus("not_yet_learned")}
              className={`px-2 py-0.5 rounded-lg transition-all ${selectedStatus === "not_yet_learned" ? "bg-stone-600 text-white shadow-xs font-semibold" : "text-cb-secondary"}`}
            >
              Gaps
            </button>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-1">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === c.id
                    ? "bg-cb-forest text-white shadow-xs"
                    : "bg-stone-200/70 text-cb-secondary hover:text-cb-primary hover:bg-stone-200"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Skill Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 py-2 min-h-[220px]">
        <AnimatePresence>
          {filteredSkills.map((skill) => {
            const st = getStatusBadge(skill.status);
            const StatusIcon = st.icon;

            return (
              <motion.div
                key={skill.name}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                onMouseEnter={() => setHoveredSkill(skill)}
                onMouseLeave={() => setHoveredSkill(null)}
                className={`group relative p-3 rounded-xl border transition-all duration-200 hover:shadow-subtle ${st.border}`}
              >
                <div className="flex items-start justify-between gap-1 mb-2">
                  <span className="font-heading text-xs font-bold text-cb-primary truncate max-w-[120px]">
                    {skill.name}
                  </span>
                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${st.badgeBg}`}>
                    <StatusIcon className="w-2.5 h-2.5" />
                    <span>{st.label}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-cb-secondary">
                  <span>Target: {skill.target_proficiency}</span>
                  <span className="text-stone-400">{skill.frequency}</span>
                </div>

                {/* Progress bar indication */}
                <div className="w-full bg-stone-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      skill.status === "already_proficient"
                        ? "bg-cb-forest w-full"
                        : skill.status === "needs_improvement"
                        ? "bg-cb-orange w-1/2"
                        : "bg-stone-300 w-1/12"
                    }`}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Hover Information Strip */}
      <div className="mt-4 pt-3 border-t border-cb-border flex items-center justify-between text-xs text-cb-secondary font-mono">
        <div className="flex items-center gap-2">
          {hoveredSkill ? (
            <>
              <span className="font-semibold text-cb-primary">{hoveredSkill.name}:</span>
              <span>{hoveredSkill.status === "already_proficient" ? "Verified competency in profile and projects." : hoveredSkill.status === "needs_improvement" ? "Proficiency below target level; recommended in upcoming roadmap." : "Core requisition gap; prioritized in learning curriculum."}</span>
            </>
          ) : (
            <span>Hover over any competency tile to view role benchmark diagnosis.</span>
          )}
        </div>
        <span className="text-[11px] text-stone-400">
          Showing {filteredSkills.length} of {skillList.length} competencies
        </span>
      </div>
    </div>
  );
};
