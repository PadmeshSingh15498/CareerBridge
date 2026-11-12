"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Heart, ArrowUpRight, Terminal } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-cream border-t border-border-subtle pt-16 pb-12 text-primary font-sans">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-14 border-b border-border-subtle">
          {/* Brand Info Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-forest text-lime flex items-center justify-center font-heading font-extrabold text-base shadow-sm border border-forest-dark">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-heading font-extrabold text-xl tracking-tight text-primary">
                CareerBridge
              </span>
            </div>

            <p className="text-xs text-primary-muted leading-relaxed max-w-sm">
              The Career Intelligence Workspace. Connecting students, corporate recruiters, and university placement officers through deterministic ATS evaluation and dense semantic matching.
            </p>

            <div className="flex items-center gap-2 pt-2 text-xs font-mono text-primary-muted">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-200/70 border border-border-subtle text-forest font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-forest" /> MySQL 8 Persistent
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-200/70 border border-border-subtle text-forest font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-forest" /> Zero Key Leakage
              </span>
            </div>
          </div>

          {/* Column 1: Candidate Intelligence */}
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-primary mb-4">
              Student Workspace
            </h4>
            <ul className="space-y-2.5 text-xs text-primary-muted">
              <li>
                <Link href="#resume-analyzer" className="hover:text-forest transition-colors">
                  ATS Resume Rubric (100 pts)
                </Link>
              </li>
              <li>
                <Link href="#job-matching" className="hover:text-forest transition-colors">
                  Semantic Vector Matching
                </Link>
              </li>
              <li>
                <Link href="#skill-gaps" className="hover:text-forest transition-colors">
                  Skill Gap & 6-Week Roadmaps
                </Link>
              </li>
              <li>
                <Link href="#bridge-ai" className="hover:text-forest transition-colors">
                  BridgeAI & STAR Interview Sim
                </Link>
              </li>
              <li>
                <Link href="#application-tracker" className="hover:text-forest transition-colors">
                  1-Click Application Pipeline
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Recruiter Platform */}
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-primary mb-4">
              Recruiter Studio
            </h4>
            <ul className="space-y-2.5 text-xs text-primary-muted">
              <li>
                <Link href="#institutional" className="hover:text-forest transition-colors">
                  Job Studio & Eligibility Gating
                </Link>
              </li>
              <li>
                <Link href="#institutional" className="hover:text-forest transition-colors">
                  Dense Semantic Candidate Search
                </Link>
              </li>
              <li>
                <Link href="#institutional" className="hover:text-forest transition-colors">
                  Kanban ATS Stage Pipeline
                </Link>
              </li>
              <li>
                <Link href="#institutional" className="hover:text-forest transition-colors">
                  Campus Placement Drives
                </Link>
              </li>
              <li>
                <Link href="#institutional" className="hover:text-forest transition-colors">
                  STAR Interview Evaluation
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: University TPO */}
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-primary mb-4">
              Placement Officer (TPO)
            </h4>
            <ul className="space-y-2.5 text-xs text-primary-muted">
              <li>
                <Link href="#institutional" className="hover:text-forest transition-colors">
                  Campus Macro Analytics
                </Link>
              </li>
              <li>
                <Link href="#institutional" className="hover:text-forest transition-colors">
                  Student Verification & Cutoffs
                </Link>
              </li>
              <li>
                <Link href="#institutional" className="hover:text-forest transition-colors">
                  Recruiter Verification
                </Link>
              </li>
              <li>
                <Link href="#institutional" className="hover:text-forest transition-colors">
                  Drive Schedule Manager
                </Link>
              </li>
              <li>
                <Link href="#institutional" className="hover:text-forest transition-colors">
                  Batch Notice Broadcaster
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-primary-muted font-mono gap-4">
          <p>© 2026 CareerBridge. Tagline: From Potential to Placement. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-forest font-semibold">FastAPI v1.0 • Next.js 14 • MySQL 8</span>
            <Link href="#top" className="hover:text-forest transition-colors">
              Back to Top ↑
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

