"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Building2,
  Users,
  Briefcase,
  ChevronRight
} from "lucide-react";

import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { api } from "@/lib/api";

export default function AdminApplicationsPage() {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminPlacementAnalytics(2026)
      .then((res) => {
        if (res && res.data) setAnalytics(res.data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const funnel = analytics?.funnel_conversion || {
    total_applications: 0,
    shortlisted_candidates: 0,
    interviewed_candidates: 0,
    selected_offers: 0,
    application_to_shortlist_pct: 0,
    shortlist_to_selection_pct: 0,
  };

  const handleExport = async () => {
    try {
      const blob = await api.downloadAdminReport("student-csv");
      const url = window.URL.createObjectURL(new Blob([blob], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "master_application_ledger.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <WorkspaceShell role="admin" activeTabTitle="Applications">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-cb-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-cb-teal/10 text-cb-teal border border-cb-teal/20">
                Master Ledger
              </span>
              <span className="text-xs font-mono text-cb-muted">Campus Applications</span>
            </div>
            <h1 className="text-2xl font-bold text-cb-primary tracking-tight">
              Central Candidate Applications Ledger
            </h1>
            <p className="text-sm text-cb-secondary mt-1">
              Campus-wide application pipeline, stage progressions, and corporate offer outcomes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 text-xs font-mono font-semibold rounded-lg bg-cb-teal text-cb-bg hover:bg-cb-teal/90 flex items-center gap-2 transition-all shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Master Ledger CSV</span>
            </button>
          </div>
        </div>

        {/* Funnel Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-cb-card border border-cb-border">
            <div className="text-xs font-mono text-cb-secondary">Total Submissions</div>
            <div className="text-2xl font-extrabold text-cb-primary font-mono mt-1">
              {funnel.total_applications}
            </div>
            <div className="text-[11px] font-mono text-cb-muted mt-1">Across all jobs</div>
          </div>

          <div className="p-5 rounded-xl bg-cb-card border border-cb-border">
            <div className="text-xs font-mono text-cb-secondary">Shortlisted</div>
            <div className="text-2xl font-extrabold text-cb-teal font-mono mt-1">
              {funnel.shortlisted_candidates}
            </div>
            <div className="text-[11px] font-mono text-cb-teal mt-1">
              {funnel.application_to_shortlist_pct}% Conversion
            </div>
          </div>

          <div className="p-5 rounded-xl bg-cb-card border border-cb-border">
            <div className="text-xs font-mono text-cb-secondary">Interviewed</div>
            <div className="text-2xl font-extrabold text-cb-orange font-mono mt-1">
              {funnel.interviewed_candidates}
            </div>
            <div className="text-[11px] font-mono text-cb-muted mt-1">Evaluated by HR/TR</div>
          </div>

          <div className="p-5 rounded-xl bg-cb-card border border-cb-border">
            <div className="text-xs font-mono text-cb-secondary">Selected & Placed</div>
            <div className="text-2xl font-extrabold text-cb-teal font-mono mt-1">
              {funnel.selected_offers}
            </div>
            <div className="text-[11px] font-mono text-cb-teal mt-1">Offers Extended</div>
          </div>
        </div>

        {/* Action Link Banner */}
        <div className="p-6 rounded-xl bg-cb-card border border-cb-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-cb-primary">
              Candidate Dossiers & Stage Advancements
            </h3>
            <p className="text-xs text-cb-secondary mt-1">
              Individual candidate dossiers with ATS PyMuPDF metrics and recruiter interview rubrics can be audited in the Candidate Intelligence Workspace.
            </p>
          </div>
          <Link
            href="/admin/students"
            className="px-4 py-2 rounded-lg bg-cb-card-hover hover:bg-cb-border border border-cb-border text-xs font-mono text-cb-teal hover:text-cb-primary flex items-center gap-2 shrink-0 transition-all"
          >
            <span>Open Student Roster</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </WorkspaceShell>
  );
}
