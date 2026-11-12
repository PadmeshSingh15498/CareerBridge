"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, ArrowUpRight, Award, Bot, Briefcase, 
  Building2, Check, CheckCircle2, ChevronRight, Compass, 
  Cpu, Database, FileCheck, FileText, Globe, GraduationCap, 
  Layers, Lock, MapPin, Network, Search, ShieldCheck, 
  Sparkles, Target, Terminal, TrendingUp, UserCheck, Users, Zap
} from "lucide-react";

import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { CareerReadinessRing } from "@/components/signature/CareerReadinessRing";
import { SkillConstellation } from "@/components/signature/SkillConstellation";
import { MatchIntelligenceCard } from "@/components/signature/MatchIntelligenceCard";
import { CareerTrajectoryTimeline } from "@/components/signature/CareerTrajectoryTimeline";
import { ApplicationPipeline } from "@/components/signature/ApplicationPipeline";
import { OpportunityRadar } from "@/components/signature/OpportunityRadar";
import { AIInsightPanel } from "@/components/signature/AIInsightPanel";
import { SkillGapComparison } from "@/components/signature/SkillGapComparison";
import { ActivityTimeline } from "@/components/signature/ActivityTimeline";
import { AIAssistantPanel } from "@/components/signature/AIAssistantPanel";

export default function HomePage() {
  const [selectedDemoRole, setSelectedDemoRole] = useState<"student" | "recruiter" | "tpo">("student");

  return (
    <div className="min-h-screen flex flex-col bg-cream text-primary font-sans selection:bg-lime/30 selection:text-primary">
      <Navbar />

      <main className="flex-1">
        {/* ============================================================ */}
        {/* SECTION 1: HERO SECTION                                     */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border-subtle bg-stone-50/40">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
            {/* Top Pill */}
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200/70 border border-border-subtle text-forest text-xs font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
                <span>Career Intelligence Workspace • System Online</span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-primary leading-[1.08] mb-6">
                Your Career Has Potential. <br className="hidden sm:inline" />
                <span className="text-forest underline decoration-lime decoration-4 underline-offset-8">
                  Let’s Turn It Into Placement.
                </span>
              </h1>

              {/* Supporting Copy */}
              <p className="font-sans text-base sm:text-lg md:text-xl text-primary-muted leading-relaxed max-w-2xl mx-auto mb-10">
                An intelligent career ecosystem that understands your skills, discovers your opportunities and guides you towards your next professional milestone.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
                <Link href="#get-started" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-forest text-white hover:bg-forest-dark transition-all duration-150 shadow-sm hover:shadow border border-forest-dark">
                    Build My Career Profile <ArrowRight className="w-4 h-4 text-lime" />
                  </button>
                </Link>

                <Link href="#job-matching" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-white text-primary hover:bg-stone-100 transition-all duration-150 border border-border-subtle shadow-card">
                    Explore Opportunities <ArrowUpRight className="w-4 h-4 text-primary-muted" />
                  </button>
                </Link>
              </div>

              {/* Telemetry Stats Ribbon */}
              <div className="pt-8 border-t border-border-subtle grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-forest block">
                    88.4%
                  </span>
                  <span className="text-xs font-mono text-primary-muted uppercase tracking-wider mt-0.5 block">
                    Match Precision
                  </span>
                </div>
                <div>
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-forest block">
                    100-pt
                  </span>
                  <span className="text-xs font-mono text-primary-muted uppercase tracking-wider mt-0.5 block">
                    ATS Rubric Engine
                  </span>
                </div>
                <div>
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-forest block">
                    32
                  </span>
                  <span className="text-xs font-mono text-primary-muted uppercase tracking-wider mt-0.5 block">
                    Normalized Entities
                  </span>
                </div>
                <div>
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-forest block">
                    0-Leak
                  </span>
                  <span className="text-xs font-mono text-primary-muted uppercase tracking-wider mt-0.5 block">
                    Backend Security
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 2: CAREER INTELLIGENCE VISUALIZATION (HERO CENTERPIECE) */}
        {/* ============================================================ */}
        <section id="intelligence" className="py-16 md:py-24 bg-cream">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            {/* Editorial Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-primary-muted block mb-1">
                  Workspace Telemetry • Live Snapshot
                </span>
                <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
                  The Career Intelligence Workspace
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-primary-muted max-w-md font-sans leading-relaxed">
                A unified operational dashboard where students monitor placement readiness, match against verified corporate mandates, and receive predictive algorithmic coaching.
              </p>
            </div>

            {/* Asymmetric 3-Card Centerpiece Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Career Readiness Ring (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <CareerReadinessRing score={86} />
              </div>

              {/* Right Column: Match Intelligence Card (7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <MatchIntelligenceCard
                  company="Google Cloud"
                  role="Associate Software Engineer - Cloud Platform"
                  location="Bengaluru (Hybrid)"
                  salary="₹18.0 - ₹24.0 LPA"
                  jobType="Full-Time Campus"
                  matchScore={91.4}
                  semanticSimilarity={94.2}
                  skillOverlap={88.0}
                  matchedSkills={["Python", "FastAPI", "MySQL", "Docker", "Data Structures"]}
                  missingSkills={["Kubernetes", "gRPC"]}
                  eligibilityMet={true}
                />
              </div>

              {/* Wide Banner: AI Insight Panel (Full 12 cols) */}
              <div className="lg:col-span-12">
                <AIInsightPanel />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 3: PRODUCT INTRODUCTION (THE 3 WORKSPACES)          */}
        {/* ============================================================ */}
        <section id="workspaces" className="py-16 md:py-24 border-t border-border-subtle bg-stone-100/60">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-mono uppercase tracking-widest text-primary-muted block mb-1">
                Multi-Stakeholder Architecture
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
                Three Integrated Workspaces. One Unified Cohort.
              </h2>
              <p className="text-xs sm:text-sm text-primary-muted mt-2 leading-relaxed">
                Engineered from the ground up with strict Role-Based Access Control to connect campus talent directly with recruitment pipelines.
              </p>
            </div>

            {/* Asymmetric 3-Role Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Student Workspace */}
              <div className="premium-card p-7 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-forest text-lime flex items-center justify-center font-bold mb-6 shadow-sm">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-forest font-semibold block mb-1">
                    Candidate Domain
                  </span>
                  <h3 className="font-heading text-xl font-bold text-primary mb-2">
                    Student Workspace
                  </h3>
                  <p className="text-xs text-primary-muted leading-relaxed mb-6">
                    Comprehensive career preparation: PDF resume analyzer, 100-pt ATS rubric, semantic job match score, 6-week sequenced roadmaps, and STAR mock interview simulations.
                  </p>

                  <ul className="space-y-2.5 text-xs text-primary mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-forest" />
                      <span>Deterministic ATS scoring (0-100)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-forest" />
                      <span>Sentence Transformers vector matching</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-forest" />
                      <span>BridgeAI career assistant & STAR prep</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-xs font-mono">
                  <span className="text-primary-muted">Demo: student@careerbridge.com</span>
                  <span className="text-forest font-semibold">Active →</span>
                </div>
              </div>

              {/* Recruiter Workspace */}
              <div className="premium-card p-7 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-forest-dark text-white flex items-center justify-center font-bold mb-6 shadow-sm">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-forest font-semibold block mb-1">
                    Talent Acquisition
                  </span>
                  <h3 className="font-heading text-xl font-bold text-primary mb-2">
                    Recruiter Studio
                  </h3>
                  <p className="text-xs text-primary-muted leading-relaxed mb-6">
                    Publish campus job descriptions with department cutoffs, screen applicants automatically with dense semantic vectors, and manage candidate progression through Kanban ATS pipelines.
                  </p>

                  <ul className="space-y-2.5 text-xs text-primary mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-forest" />
                      <span>Automated CGPA & backlog gating</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-forest" />
                      <span>Match-ranked candidate discovery</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-forest" />
                      <span>Interview scheduling & feedback rubrics</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-xs font-mono">
                  <span className="text-primary-muted">Demo: recruiter@google.com</span>
                  <span className="text-forest font-semibold">Active →</span>
                </div>
              </div>

              {/* Placement Officer Workspace */}
              <div className="premium-card p-7 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-forest text-white flex items-center justify-center font-bold mb-6 shadow-sm">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-forest font-semibold block mb-1">
                    University TPO
                  </span>
                  <h3 className="font-heading text-xl font-bold text-primary mb-2">
                    Placement Officer
                  </h3>
                  <p className="text-xs text-primary-muted leading-relaxed mb-6">
                    Institutional governance: verify batch credentials, schedule multi-round on-campus placement drives, review corporate employers, and monitor macro cohort placement rates.
                  </p>

                  <ul className="space-y-2.5 text-xs text-primary mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-forest" />
                      <span>Placement drive coordinator (Aptitude to HR)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-forest" />
                      <span>Batch verification & credential locks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-forest" />
                      <span>Departmental salary and placement metrics</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-xs font-mono">
                  <span className="text-primary-muted">Demo: tpo@university.edu</span>
                  <span className="text-forest font-semibold">Active →</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 4: AI RESUME ANALYZER SHOWCASE                      */}
        {/* ============================================================ */}
        <section id="resume-analyzer" className="py-16 md:py-24 border-t border-border-subtle bg-cream">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left narrative (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-forest" />
                  <span className="text-xs font-mono uppercase tracking-widest text-primary-muted">
                    Engineered Precision
                  </span>
                </div>

                <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary tracking-tight leading-tight">
                  Deterministic 100-Point ATS Resume Rubric
                </h2>

                <p className="text-xs sm:text-sm text-primary-muted leading-relaxed font-sans">
                  Unlike fragile black-box parsers, CareerBridge uses <strong>PyMuPDF</strong> layout extraction paired with an explicit, four-pillar scoring rubric to score your resume objectively without hallucination.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-xl bg-white border border-border-subtle">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span>Section Completeness</span>
                      <span className="font-mono text-forest">25 / 25 pts</span>
                    </div>
                    <p className="text-[11px] text-primary-muted">Validates Header, Contact, Education, Experience, and Skills sections.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-border-subtle">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span>STAR Quantifiable Metrics</span>
                      <span className="font-mono text-forest">22 / 25 pts</span>
                    </div>
                    <p className="text-[11px] text-primary-muted">Regex and NLP extraction of action verbs and measurable percentage gains.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-border-subtle">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span>Skill Taxonomy Density</span>
                      <span className="font-mono text-forest">27 / 30 pts</span>
                    </div>
                    <p className="text-[11px] text-primary-muted">Matches against 800+ validated technical and domain competency tokens.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-border-subtle">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span>Formatting & Length Hygiene</span>
                      <span className="font-mono text-forest">18 / 20 pts</span>
                    </div>
                    <p className="text-[11px] text-primary-muted">Word density (350-750 words/page), clean font hierarchy, no ligature artifacts.</p>
                  </div>
                </div>
              </div>

              {/* Right: Activity & Timeline Showcase (7 cols) */}
              <div className="lg:col-span-7">
                <CareerTrajectoryTimeline />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 5: INTELLIGENT JOB MATCHING SHOWCASE                 */}
        {/* ============================================================ */}
        <section id="job-matching" className="py-16 md:py-24 border-t border-border-subtle bg-stone-100/60">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-primary-muted block mb-1">
                  Semantic Matching Engine
                </span>
                <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
                  Beyond Keyword Matching: Dense Semantic Vectors
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-primary-muted max-w-md font-sans leading-relaxed">
                Our hybrid matching formula synthesizes dense 384-dimensional Sentence Transformer embeddings with direct skill overlap ratios and campus eligibility rules.
              </p>
            </div>

            {/* Match Cards Showcase Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MatchIntelligenceCard
                company="Google Cloud"
                role="Associate Software Engineer - Cloud Platform"
                location="Bengaluru, Karnataka (Hybrid)"
                salary="₹18.0 - ₹24.0 LPA"
                jobType="Full-Time Campus"
                matchScore={91.4}
                semanticSimilarity={94.2}
                skillOverlap={88.0}
                matchedSkills={["Python", "FastAPI", "MySQL", "Docker", "Data Structures"]}
                missingSkills={["Kubernetes", "gRPC"]}
                eligibilityMet={true}
              />

              <MatchIntelligenceCard
                company="Microsoft India"
                role="Software Development Engineer - Core OS"
                location="Hyderabad, Telangana"
                salary="₹16.0 - ₹22.0 LPA"
                jobType="Full-Time Campus"
                matchScore={87.8}
                semanticSimilarity={91.0}
                skillOverlap={84.0}
                matchedSkills={["Python", "C++", "MySQL", "Algorithms", "Git"]}
                missingSkills={["Azure SDK", "Distributed Systems"]}
                eligibilityMet={true}
              />
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 6: SKILL GAP & ROADMAP SHOWCASE                     */}
        {/* ============================================================ */}
        <section id="skill-gaps" className="py-16 md:py-24 border-t border-border-subtle bg-cream">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-mono uppercase tracking-widest text-primary-muted block mb-1">
                Curriculum Pathfinder
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
                Skill Gap Analysis & 6-Week Action Roadmaps
              </h2>
              <p className="text-xs sm:text-sm text-primary-muted mt-2 leading-relaxed">
                Diagnose exact skill discrepancies between your current portfolio and target corporate roles, then follow a sequenced weekly milestone path.
              </p>
            </div>

            {/* Gap Component & Constellation */}
            <div className="space-y-8">
              <SkillGapComparison />
              <SkillConstellation />
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 7: BRIDGEAI ASSISTANT SHOWCASE                      */}
        {/* ============================================================ */}
        <section id="bridge-ai" className="py-16 md:py-24 border-t border-border-subtle bg-stone-100/60">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left narrative (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-forest" />
                  <span className="text-xs font-mono uppercase tracking-widest text-primary-muted">
                    Conversational Co-Pilot
                  </span>
                </div>

                <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary tracking-tight leading-tight">
                  BridgeAI: Context-Aware Career Assistant
                </h2>

                <p className="text-xs sm:text-sm text-primary-muted leading-relaxed font-sans">
                  BridgeAI is not a generic chatbot. It is grounded in your verified academic transcripts, parsed resume, and active campus placement drives.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-border-subtle">
                    <Sparkles className="w-5 h-5 text-forest flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading text-xs font-bold text-primary">STAR Interview Simulation</h4>
                      <p className="text-[11px] text-primary-muted">Evaluates candidate answers across Situation, Task, Action, and Result.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-border-subtle">
                    <ShieldCheck className="w-5 h-5 text-forest flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading text-xs font-bold text-primary">Explicit Model Transparency</h4>
                      <p className="text-[11px] text-primary-muted">All AI responses clearly indicate provider source and mock fallback tags.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-border-subtle">
                    <Lock className="w-5 h-5 text-forest flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading text-xs font-bold text-primary">Zero Key Leakage</h4>
                      <p className="text-[11px] text-primary-muted">All LLM calls are authenticated through backend proxy endpoints.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Interactive Assistant Panel (7 cols) */}
              <div className="lg:col-span-7">
                <AIAssistantPanel />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 8: RECRUITER & UNIVERSITY BENEFITS                  */}
        {/* ============================================================ */}
        <section id="institutional" className="py-16 md:py-24 border-t border-border-subtle bg-cream">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-mono uppercase tracking-widest text-primary-muted block mb-1">
                Institutional Governance
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
                Built for High-Trust Campus Recruitment
              </h2>
              <p className="text-xs sm:text-sm text-primary-muted mt-2 leading-relaxed">
                Universities and recruitment leaders rely on CareerBridge to eliminate placement manual bottlenecks and automate candidate verification.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Radar Diagram (6 cols) */}
              <div className="lg:col-span-6">
                <OpportunityRadar />
              </div>

              {/* Live Pipeline Flow (6 cols) */}
              <div className="lg:col-span-6">
                <ApplicationPipeline />
              </div>

              {/* Live Activity Telemetry (Full 12 cols) */}
              <div className="lg:col-span-12">
                <ActivityTimeline />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 9: FINAL REGISTRATION SECTION                        */}
        {/* ============================================================ */}
        <section id="get-started" className="py-20 md:py-28 border-t border-border-subtle bg-forest-dark text-white relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-forest/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="container mx-auto px-4 sm:px-6 max-w-4xl relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-lime text-xs font-mono mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Placement Cohort 2026 Open</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
              Ready to Accelerate Your Placement Journey?
            </h2>

            <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto mb-10 leading-relaxed font-sans">
              Join thousands of university candidates, corporate talent partners, and university placement officers on the Career Intelligence Workspace.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <Link href="#workspaces" className="w-full sm:w-auto flex-1">
                <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-lime text-forest-dark hover:bg-lime-hover transition-all duration-150 shadow-md">
                  I am a Candidate <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="#workspaces" className="w-full sm:w-auto flex-1">
                <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-white/15 transition-all duration-150 border border-white/20">
                  Recruiter / TPO Portal <ArrowUpRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            <p className="text-[11px] font-mono text-white/50 mt-6">
              No credit card required • Seeded demo credentials available • MySQL 8 persistence
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
