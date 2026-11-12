"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Award,
  Layers,
  DollarSign,
  Briefcase,
  Users,
  CheckCircle2,
  RefreshCw,
  PieChart,
  BarChart2,
  Calendar,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { api } from "@/lib/api";

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState(2026);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminPlacementAnalytics(academicYear);
      if (res && res.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [academicYear]);

  if (loading || !analytics) {
    return (
      <WorkspaceShell role="admin" activeTabTitle="Analytics">
        <div className="py-24 text-center text-cb-muted font-mono flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-cb-teal animate-spin" />
          <span>Aggregating institutional placement data...</span>
        </div>
      </WorkspaceShell>
    );
  }

  const deptData = analytics.department_placements?.map((d: any) => ({
    name: d.department_name.replace("Engineering", "Eng.").replace("Computer Science", "CSE"),
    Enrolled: d.total_students,
    Placed: d.placed_students,
    Rate: d.placement_rate_percent,
  })) || [];

  const trendData = analytics.monthly_trends?.map((m: any) => ({
    month: m.month_label,
    Applications: m.applications_count,
    Offers: m.selections_count,
  })) || [];

  const salaryData = analytics.salary_distribution?.map((s: any) => ({
    bracket: s.bracket_label,
    count: s.student_count,
  })) || [];

  const funnel = analytics.funnel_conversion || {
    total_applications: 0,
    shortlisted_candidates: 0,
    interviewed_candidates: 0,
    selected_offers: 0,
    application_to_shortlist_pct: 0,
    shortlist_to_selection_pct: 0,
  };

  return (
    <WorkspaceShell role="admin" activeTabTitle="Analytics">
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-cb-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-cb-teal/10 text-cb-teal border border-cb-teal/20">
                Institutional Intelligence
              </span>
              <span className="text-xs font-mono text-cb-muted">Cohort {analytics.academic_year}</span>
            </div>
            <h1 className="text-2xl font-bold text-cb-primary tracking-tight">
              Placement Analytics & Cohort Benchmarks
            </h1>
            <p className="text-sm text-cb-secondary mt-1">
              Deep statistical analytics on department placement velocity, compensation distribution, and funnel conversions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cb-muted">Cohort:</span>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg bg-cb-card border border-cb-border text-xs font-mono text-cb-primary focus:outline-none"
            >
              <option value="2026">Class of 2026</option>
              <option value="2025">Class of 2025</option>
              <option value="2024">Class of 2024</option>
            </select>
          </div>
        </div>

        {/* Recruitment Funnel Conversion Cards */}
        <div>
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-cb-muted mb-3">
            Hiring Pipeline Funnel Ratios
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-cb-card border border-cb-border">
              <div className="text-xs font-mono text-cb-secondary">Applications</div>
              <div className="text-2xl font-extrabold text-cb-primary mt-1 font-mono">
                {funnel.total_applications}
              </div>
              <div className="text-[11px] text-cb-muted mt-1 font-mono">100% Pipeline Base</div>
            </div>

            <div className="p-4 rounded-xl bg-cb-card border border-cb-border">
              <div className="text-xs font-mono text-cb-secondary">Shortlisted</div>
              <div className="text-2xl font-extrabold text-cb-teal mt-1 font-mono">
                {funnel.shortlisted_candidates}
              </div>
              <div className="text-[11px] text-cb-teal mt-1 font-mono">
                {funnel.application_to_shortlist_pct}% Conversion
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cb-card border border-cb-border">
              <div className="text-xs font-mono text-cb-secondary">Interviewed</div>
              <div className="text-2xl font-extrabold text-cb-orange mt-1 font-mono">
                {funnel.interviewed_candidates}
              </div>
              <div className="text-[11px] text-cb-muted mt-1 font-mono">Technical & HR</div>
            </div>

            <div className="p-4 rounded-xl bg-cb-card border border-cb-border">
              <div className="text-xs font-mono text-cb-secondary">Offers Extended</div>
              <div className="text-2xl font-extrabold text-cb-teal mt-1 font-mono">
                {funnel.selected_offers}
              </div>
              <div className="text-[11px] text-cb-teal mt-1 font-mono">
                {funnel.shortlist_to_selection_pct}% Shortlist-to-Offer
              </div>
            </div>
          </div>
        </div>

        {/* Department Placement Comparison & Table */}
        <div className="p-6 rounded-xl bg-cb-card border border-cb-border space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-cb-primary">
                Department Placement Performance
              </h3>
              <p className="text-xs text-cb-secondary mt-0.5">
                Comparative analysis of batch enrollment, cleared candidates, and placement rates.
              </p>
            </div>
          </div>

          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d131f",
                    borderColor: "#1f2937",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                    color: "#f3f4f6",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="Enrolled" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Placed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Department Breakdown Table */}
          <div className="overflow-x-auto rounded-lg border border-cb-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-cb-card-hover border-b border-cb-border text-cb-secondary font-mono">
                <tr>
                  <th className="px-4 py-2.5">Department</th>
                  <th className="px-4 py-2.5">Enrolled</th>
                  <th className="px-4 py-2.5">Eligible</th>
                  <th className="px-4 py-2.5">Placed</th>
                  <th className="px-4 py-2.5">Unplaced</th>
                  <th className="px-4 py-2.5">Placement %</th>
                  <th className="px-4 py-2.5 text-right">Avg CGPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cb-border/60">
                {analytics.department_placements?.map((dept: any) => (
                  <tr key={dept.department_name} className="hover:bg-cb-card-hover/40 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-cb-primary">{dept.department_name}</td>
                    <td className="px-4 py-2.5 font-mono text-cb-secondary">{dept.total_students}</td>
                    <td className="px-4 py-2.5 font-mono text-cb-teal">{dept.eligible_students}</td>
                    <td className="px-4 py-2.5 font-mono text-cb-teal font-semibold">{dept.placed_students}</td>
                    <td className="px-4 py-2.5 font-mono text-cb-orange">{dept.unplaced_students}</td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-cb-primary">
                      {dept.placement_rate_percent}%
                    </td>
                    <td className="px-4 py-2.5 font-mono text-right text-cb-secondary">
                      {dept.average_cgpa.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Row: Monthly Timeline & Salary Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Recruitment Velocity */}
          <div className="p-6 rounded-xl bg-cb-card border border-cb-border">
            <h3 className="text-sm font-semibold text-cb-primary mb-1">
              Monthly Recruitment Velocity
            </h3>
            <p className="text-xs text-cb-secondary mb-4">
              Monthly applications submitted vs offers confirmed.
            </p>

            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d131f",
                      borderColor: "#1f2937",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      color: "#f3f4f6",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <Line type="monotone" dataKey="Applications" stroke="#38bdf8" strokeWidth={2} />
                  <Line type="monotone" dataKey="Offers" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Salary Distribution Brackets */}
          <div className="p-6 rounded-xl bg-cb-card border border-cb-border">
            <h3 className="text-sm font-semibold text-cb-primary mb-1">
              Salary Compensation Brackets
            </h3>
            <p className="text-xs text-cb-secondary mb-4">
              Distribution of job packages offered across salary ranges.
            </p>

            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salaryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="bracket" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d131f",
                      borderColor: "#1f2937",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      color: "#f3f4f6",
                    }}
                  />
                  <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} name="Positions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Readiness Distribution & In-Demand Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CRI Tier Distribution */}
          <div className="p-6 rounded-xl bg-cb-card border border-cb-border space-y-4">
            <h3 className="text-sm font-semibold text-cb-primary">
              Student Career Readiness Index (CRI)
            </h3>
            <div className="space-y-3">
              {analytics.readiness_distribution?.map((tier: any) => (
                <div key={tier.tier_name} className="p-3 rounded-lg bg-cb-card-hover border border-cb-border/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-cb-primary">{tier.tier_name}</span>
                    <span className="text-xs font-mono font-bold text-cb-teal">{tier.percentage}%</span>
                  </div>
                  <p className="text-[11px] text-cb-secondary">{tier.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top In-Demand Skills */}
          <div className="lg:col-span-2 p-6 rounded-xl bg-cb-card border border-cb-border">
            <h3 className="text-sm font-semibold text-cb-primary mb-1">
              Top In-Demand Technical Competencies
            </h3>
            <p className="text-xs text-cb-secondary mb-4">
              Most requested skills across corporate employer requisitions.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {analytics.in_demand_skills?.map((sk: any) => (
                <div
                  key={sk.skill_name}
                  className="p-3 rounded-lg bg-cb-card-hover border border-cb-border/60 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-cb-primary">{sk.skill_name}</div>
                    <div className="text-[10px] text-cb-muted font-mono capitalize">
                      {sk.category.replace("_", " ")}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cb-teal/15 text-cb-teal">
                    {sk.job_count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
