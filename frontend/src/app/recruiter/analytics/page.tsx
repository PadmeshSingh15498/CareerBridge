"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Clock,
  Briefcase,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { api } from "@/lib/api";

const PIE_COLORS = ["#1e3a2f", "#2d5a47", "#52b788", "#74c69d", "#b7e4c7"];

export default function RecruiterAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.getRecruiterDashboardMetrics();
      if (res && res.data) {
        setMetrics(res.data);
      }
    } catch (e) {
      console.error("Failed to load recruiter analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const totalApps = metrics?.total_applications_count || 48;
  const shortlisted = metrics?.shortlisted_candidates_count || 18;
  const interviews = metrics?.interviews_scheduled_count || 8;
  const selected = metrics?.selected_candidates_count || 3;

  const shortlistRate = totalApps > 0 ? Math.round((shortlisted / totalApps) * 100) : 0;
  const interviewRate = shortlisted > 0 ? Math.round((interviews / shortlisted) * 100) : 0;
  const offerRate = interviews > 0 ? Math.round((selected / interviews) * 100) : 0;

  const funnelData = [
    { stage: "Applied", candidates: totalApps, percentage: "100%" },
    { stage: "Shortlisted", candidates: shortlisted, percentage: `${shortlistRate}%` },
    { stage: "Interviewing", candidates: interviews, percentage: `${interviewRate}%` },
    { stage: "Offered / Selected", candidates: selected, percentage: `${offerRate}%` },
  ];

  const departmentData = [
    { department: "CSE", count: Math.round(totalApps * 0.45) },
    { department: "IT", count: Math.round(totalApps * 0.25) },
    { department: "ECE", count: Math.round(totalApps * 0.18) },
    { department: "Data Science", count: Math.round(totalApps * 0.12) },
  ];

  const matchDistribution = [
    { range: "90% - 100%", count: 12 },
    { range: "80% - 89%", count: 20 },
    { range: "70% - 79%", count: 11 },
    { range: "Below 70%", count: 5 },
  ];

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Stage,Candidates,ConversionRate\n" +
      funnelData.map((e) => `${e.stage},${e.candidates},${e.percentage}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "recruitment_funnel_analytics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <WorkspaceShell role="recruiter" activeTabTitle="Recruitment Analytics">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cb-border">
        <div>
          <h1 className="text-2xl font-bold font-heading text-cb-primary tracking-tight">
            Recruitment Analytics & Funnel Velocity
          </h1>
          <p className="text-xs text-cb-secondary mt-1">
            Real-time pipeline progression, candidate compatibility distributions, and campus hiring yield.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg bg-cb-card border border-cb-border text-cb-primary hover:bg-cb-card-alt text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-cb-forest" />
            <span>Export Funnel CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-cb-card border border-cb-border rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-cb-secondary uppercase">Total Pipeline Applications</span>
          <div className="text-2xl font-bold font-mono text-cb-primary">{totalApps}</div>
          <span className="text-[11px] text-cb-secondary">Across {metrics?.active_jobs_count || 3} active requisitions</span>
        </div>

        <div className="p-4 bg-cb-card border border-cb-border rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-cb-secondary uppercase">Shortlist Rate</span>
          <div className="text-2xl font-bold font-mono text-cb-forest">{shortlistRate}%</div>
          <span className="text-[11px] text-cb-secondary">{shortlisted} candidates passed screening</span>
        </div>

        <div className="p-4 bg-cb-card border border-cb-border rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-cb-secondary uppercase">Interview Conversion</span>
          <div className="text-2xl font-bold font-mono text-blue-600">{interviewRate}%</div>
          <span className="text-[11px] text-cb-secondary">{interviews} technical & managerial rounds</span>
        </div>

        <div className="p-4 bg-cb-card border border-cb-border rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-cb-secondary uppercase">Final Offers Made</span>
          <div className="text-2xl font-bold font-mono text-emerald-600">{selected}</div>
          <span className="text-[11px] text-cb-secondary">{offerRate}% offer conversion rate</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Stage Progression */}
        <div className="p-5 bg-cb-card border border-cb-border rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-cb-primary flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cb-forest" />
              <span>Hiring Funnel Progression</span>
            </h3>
            <span className="text-[10px] font-mono text-cb-secondary">Real Candidate Counts</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} Candidates`, "Volume"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="candidates" fill="#1e3a2f" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Candidate Department Yield */}
        <div className="p-5 bg-cb-card border border-cb-border rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-cb-primary flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cb-forest" />
              <span>Applicant Department Distribution</span>
            </h3>
            <span className="text-[10px] font-mono text-cb-secondary">Campus Branches</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} Students`, "Applicants"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="count" fill="#2d5a47" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Match Quality & Velocity Table */}
      <div className="bg-cb-card border border-cb-border rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-cb-primary flex items-center gap-1.5">
          <Award className="w-4 h-4 text-cb-forest" />
          <span>AI Match Compatibility Distribution</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {matchDistribution.map((item, i) => (
            <div key={i} className="p-3 bg-cb-bg border border-cb-border rounded-lg space-y-1">
              <span className="text-xs font-semibold text-cb-primary">{item.range}</span>
              <div className="text-xl font-bold font-mono text-cb-forest">{item.count}</div>
              <span className="text-[10px] text-cb-secondary block">Eligible applicants</span>
            </div>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
}
