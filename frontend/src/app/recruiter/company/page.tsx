"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Globe,
  MapPin,
  Users,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Mail,
  Phone,
  User,
  Save,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Camera
} from "lucide-react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { api } from "@/lib/api";

interface CompanyProfile {
  id: string;
  name: string;
  website_url: string;
  industry: string;
  company_size: string;
  headquarters: string | null;
  logo_url: string | null;
  description: string | null;
  hr_contact_name: string | null;
  hr_contact_email: string | null;
  hr_contact_phone: string | null;
  is_verified: boolean;
  verification_status: string;
  created_at: string;
  can_publish_jobs: boolean;
  recruiters_count: number;
}

export default function RecruiterCompanyPage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    website_url: "",
    industry: "",
    company_size: "51-200",
    headquarters: "",
    logo_url: "",
    description: "",
    hr_contact_name: "",
    hr_contact_email: "",
    hr_contact_phone: ""
  });

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getRecruiterCompanyProfile();
      if (res && res.data) {
        const p = res.data;
        setProfile(p);
        setFormData({
          name: p.name || "",
          website_url: p.website_url || "",
          industry: p.industry || "",
          company_size: p.company_size || "51-200",
          headquarters: p.headquarters || "",
          logo_url: p.logo_url || "",
          description: p.description || "",
          hr_contact_name: p.hr_contact_name || "",
          hr_contact_email: p.hr_contact_email || "",
          hr_contact_phone: p.hr_contact_phone || ""
        });
      }
    } catch (err: any) {
      console.error("Error fetching company profile:", err);
      setErrorMessage("Could not load organization profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await api.updateRecruiterCompanyProfile(formData);
      if (res && res.data) {
        setProfile(res.data);
        setSuccessMessage("Organization profile updated successfully!");
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      console.error("Error updating company profile:", err);
      const detail = err.response?.data?.detail || "Failed to update profile.";
      setErrorMessage(detail);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <WorkspaceShell role="recruiter">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Loading organization workspace...</p>
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  const isVerified = Boolean(profile?.is_verified || profile?.verification_status === "verified");

  return (
    <WorkspaceShell role="recruiter">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Profile</h1>
                <p className="text-sm text-slate-500">
                  Manage corporate identity, employer branding, and official university recruitment contacts.
                </p>
              </div>
            </div>
          </div>

          {/* Verification Pill */}
          <div>
            {isVerified ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Employer</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold shadow-sm">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Verification Pending</span>
              </div>
            )}
          </div>
        </div>

        {/* Verification Status Notice Card */}
        {isVerified ? (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border border-emerald-200/80 rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-emerald-950">University Verified Campus Partner</h3>
              <p className="text-sm text-emerald-800 leading-relaxed">
                Your organization is fully verified by the Placement Cell. You have active permissions to publish job requisitions,
                schedule campus recruitment drives, review student profiles, and extend final placement offers.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-amber-50 via-orange-50/50 to-white border border-amber-200/80 rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-amber-500 text-white rounded-xl shadow-md flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-amber-950">Verification Pending Review by Placement Cell</h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                Your corporate account is currently awaiting verification by the university placement department.
                To protect students, requisitions created during this period will be routed to the Placement Officer (TPO) queue
                for review before being published on the campus discovery board.
              </p>
            </div>
          </div>
        )}

        {/* Feedback Alerts */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Core Company Details */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-bold text-slate-900">Company Overview</h2>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                    Required Information
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Acme Technologies Corp"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Industry Domain *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="e.g. Software, Cloud Infrastructure, Fintech"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Official Website *
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        required
                        value={formData.website_url}
                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 text-sm font-medium"
                      />
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Company Size
                    </label>
                    <select
                      value={formData.company_size}
                      onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 text-sm font-medium bg-white"
                    >
                      <option value="1-10">1 - 10 Employees (Seed Startup)</option>
                      <option value="11-50">11 - 50 Employees (Growth Startup)</option>
                      <option value="51-200">51 - 200 Employees (Mid-Market Enterprise)</option>
                      <option value="201-1000">201 - 1000 Employees (Large Enterprise)</option>
                      <option value="1000+">1000+ Employees (Global Multinational)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Headquarters & Campus Location
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.headquarters}
                        onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                        placeholder="e.g. Bengaluru, Karnataka, India"
                        className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 text-sm font-medium"
                      />
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      About the Organization & Campus Culture
                    </label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what your organization builds, engineering culture, graduate training programs, and mentorship..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 text-sm font-medium resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Primary HR & University Relations Contact */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">University Relations & HR Contact</h2>
                    <p className="text-xs text-slate-500">Contact shared with the university Placement Cell for scheduling.</p>
                  </div>
                  <User className="w-5 h-5 text-slate-400" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Lead HR Name
                    </label>
                    <input
                      type="text"
                      value={formData.hr_contact_name}
                      onChange={(e) => setFormData({ ...formData, hr_contact_name: e.target.value })}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Official Work Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.hr_contact_email}
                        onChange={(e) => setFormData({ ...formData, hr_contact_email: e.target.value })}
                        placeholder="recruiting@company.com"
                        className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 text-sm font-medium"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Work Phone / Mobile
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={formData.hr_contact_phone}
                        onChange={(e) => setFormData({ ...formData, hr_contact_phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 text-sm font-medium"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Logo & Branding Preview */}
            <div className="space-y-6">
              {/* Logo Upload Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900">Employer Brand Asset</h3>
                <p className="text-xs text-slate-500">
                  Logo displayed across student job listings, candidate interview invites, and campus drive banners.
                </p>

                {/* Logo Preview */}
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  {formData.logo_url ? (
                    <img
                      src={formData.logo_url}
                      alt="Company Logo Preview"
                      className="w-24 h-24 object-contain rounded-xl border border-slate-200 bg-white p-2 shadow-sm mb-3"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=128&auto=format&fit=crop&q=80";
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-indigo-100/70 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold text-2xl mb-3 shadow-inner">
                      {formData.name.slice(0, 2).toUpperCase() || "CB"}
                    </div>
                  )}
                  <span className="text-xs text-slate-400 font-medium">Recommended: Square PNG or SVG, min 256x256</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Logo Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Recruitment Policy Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Placement Governance</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  CareerBridge partners with recognized colleges and universities. All job offers, stipend amounts, and interview schedules
                  are governed under the institutional placement charter.
                </p>
                <div className="pt-2 text-xs font-semibold text-slate-500">
                  Registered Recruiters: <span className="text-slate-900">{profile?.recruiters_count || 1} team member</span>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Organization Details</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </WorkspaceShell>
  );
}
