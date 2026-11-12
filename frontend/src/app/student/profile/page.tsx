"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  GraduationCap,
  Briefcase,
  Code2,
  Award,
  Layers,
  Sparkles,
  Edit3,
  Plus,
  Trash2,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Calendar,
  Building,
} from "lucide-react";

import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { apiService } from "@/lib/api";

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Modals state
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    full_name: "",
    phone_number: "",
    city: "",
    bio: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
  });

  const [editingAcademic, setEditingAcademic] = useState(false);
  const [academicForm, setAcademicForm] = useState({
    institution_name: "",
    degree: "",
    department: "",
    start_year: 2022,
    end_year: 2026,
    cgpa_or_percentage: 8.5,
    backlogs_count: 0,
  });

  const [showAddSkill, setShowAddSkill] = useState(false);
  const [skillForm, setSkillForm] = useState({
    name: "",
    category: "programming_language",
    proficiency_level: "intermediate",
  });

  const [showAddProject, setShowAddProject] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    technologies: "",
    github_url: "",
    live_demo_url: "",
  });

  const [showAddCert, setShowAddCert] = useState(false);
  const [certForm, setCertForm] = useState({
    title: "",
    issuing_organization: "",
    issue_date: new Date().toISOString().split("T")[0],
    credential_url: "",
  });

  const [showAddExp, setShowAddExp] = useState(false);
  const [expForm, setExpForm] = useState({
    company_name: "",
    role_title: "",
    location: "Bengaluru, India",
    start_date: "2025-05-01",
    end_date: "2025-07-31",
    is_current: false,
    description: "",
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await apiService.getMyProfile();
      if (res && res.data) {
        setProfile(res.data);
        // Prepopulate personal
        setPersonalForm({
          full_name: res.data.full_name || "",
          phone_number: res.data.phone_number || "",
          city: res.data.city || "",
          bio: res.data.bio || "",
          linkedin_url: res.data.linkedin_url || "",
          github_url: res.data.github_url || "",
          portfolio_url: res.data.portfolio_url || "",
        });
        // Prepopulate academic if exists
        if (res.data.academic_records && res.data.academic_records.length > 0) {
          const rec = res.data.academic_records[0];
          setAcademicForm({
            institution_name: rec.institution_name,
            degree: rec.degree,
            department: rec.department,
            start_year: rec.start_year,
            end_year: rec.end_year,
            cgpa_or_percentage: rec.cgpa_or_percentage,
            backlogs_count: rec.backlogs_count,
          });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load student profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const showToast = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.updatePersonalInfo(personalForm);
      setEditingPersonal(false);
      showToast("Personal details updated successfully.");
      fetchProfile();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to update personal details.");
    }
  };

  const handleAcademicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.updateAcademicRecord(academicForm);
      setEditingAcademic(false);
      showToast("Academic records updated successfully.");
      fetchProfile();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to update academic record.");
    }
  };

  const handleAddSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillForm.name.trim()) return;
    try {
      await apiService.addSkill({
        name: skillForm.name.trim(),
        category: skillForm.category,
        proficiency_level: skillForm.proficiency_level,
      });
      setSkillForm({ ...skillForm, name: "" });
      setShowAddSkill(false);
      showToast("Technical skill added to profile.");
      fetchProfile();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to add skill.");
    }
  };

  const handleRemoveSkill = async (skillId: number) => {
    try {
      await apiService.removeSkill(skillId);
      showToast("Skill removed from profile.");
      fetchProfile();
    } catch (err: any) {
      alert("Failed to remove skill.");
    }
  };

  const handleAddProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const techArray = projectForm.technologies
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await apiService.createProject({
        title: projectForm.title,
        description: projectForm.description,
        technologies_used: techArray,
        github_url: projectForm.github_url || null,
        live_demo_url: projectForm.live_demo_url || null,
      });
      setShowAddProject(false);
      setProjectForm({
        title: "",
        description: "",
        technologies: "",
        github_url: "",
        live_demo_url: "",
      });
      showToast("Engineering project added to profile.");
      fetchProfile();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to create project.");
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to remove this project?")) return;
    try {
      await apiService.deleteProject(id);
      showToast("Project removed.");
      fetchProfile();
    } catch (err) {
      alert("Failed to delete project.");
    }
  };

  const handleAddCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createCertification({
        title: certForm.title,
        issuing_organization: certForm.issuing_organization,
        issue_date: certForm.issue_date,
        credential_url: certForm.credential_url || null,
      });
      setShowAddCert(false);
      setCertForm({
        title: "",
        issuing_organization: "",
        issue_date: new Date().toISOString().split("T")[0],
        credential_url: "",
      });
      showToast("Certification added.");
      fetchProfile();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to add certification.");
    }
  };

  const handleDeleteCert = async (id: string) => {
    if (!confirm("Delete certification?")) return;
    try {
      await apiService.deleteCertification(id);
      showToast("Certification deleted.");
      fetchProfile();
    } catch (err) {
      alert("Failed to delete certification.");
    }
  };

  const handleAddExpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createExperience({
        company_name: expForm.company_name,
        role_title: expForm.role_title,
        location: expForm.location,
        start_date: expForm.start_date,
        end_date: expForm.end_date,
        is_current: expForm.is_current,
        description: expForm.description,
      });
      setShowAddExp(false);
      setExpForm({
        company_name: "",
        role_title: "",
        location: "Bengaluru, India",
        start_date: "2025-05-01",
        end_date: "2025-07-31",
        is_current: false,
        description: "",
      });
      showToast("Work experience added.");
      fetchProfile();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to add experience.");
    }
  };

  const handleDeleteExp = async (id: string) => {
    if (!confirm("Delete experience record?")) return;
    try {
      await apiService.deleteExperience(id);
      showToast("Experience removed.");
      fetchProfile();
    } catch (err) {
      alert("Failed to delete experience.");
    }
  };

  if (loading) {
    return (
      <WorkspaceShell role="student" activeTabTitle="My Profile">
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-cb-forest mb-4" />
          <p className="font-heading font-semibold text-sm text-cb-primary">
            Loading Academic & Placement Profile...
          </p>
        </div>
      </WorkspaceShell>
    );
  }

  const primaryAcademic = profile?.academic_records?.[0] || null;
  const completion = profile?.completion;
  const compPercent = completion?.overall_percentage || 50;

  return (
    <WorkspaceShell role="student" activeTabTitle="My Profile">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg(null)}>
              <X className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* HEADER HERO: Profile Card + Dynamic Profile Completion Wheel             */}
        {/* ========================================================================= */}
        <div className="bg-cb-card border border-cb-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Identity & Basic Tags */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-cb-forest text-cb-lime font-mono font-bold text-2xl flex items-center justify-center shadow-xs shrink-0">
                {(profile?.full_name || "ST")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading font-bold text-2xl text-cb-primary">
                    {profile?.full_name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-cb-card-alt border border-cb-border text-[11px] font-mono text-cb-secondary">
                    {profile?.roll_number}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-mono font-semibold text-emerald-700 capitalize">
                    {profile?.placement_status || "Unplaced"}
                  </span>
                </div>

                <p className="text-xs text-cb-secondary flex items-center gap-3 flex-wrap">
                  {primaryAcademic && (
                    <span>
                      {primaryAcademic.degree} in {primaryAcademic.department} • Class of{" "}
                      {primaryAcademic.end_year}
                    </span>
                  )}
                  {profile?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cb-secondary" />
                      {profile.city}
                    </span>
                  )}
                </p>

                {/* Professional Links */}
                <div className="flex items-center gap-3 pt-1">
                  {profile?.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-cb-forest hover:underline flex items-center gap-1"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {profile?.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-cb-forest hover:underline flex items-center gap-1"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>GitHub</span>
                    </a>
                  )}
                  {profile?.portfolio_url && (
                    <a
                      href={profile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-cb-forest hover:underline flex items-center gap-1"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Portfolio</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Completion Dial */}
            <div className="flex items-center gap-5 p-3.5 rounded-xl bg-cb-card-alt border border-cb-border shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#E2E4DC"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#244D3D"
                    strokeWidth="5"
                    strokeDasharray={163.36}
                    strokeDashoffset={163.36 - (163.36 * compPercent) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute font-mono font-bold text-sm text-cb-primary">
                  {compPercent}%
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-cb-primary">Profile Completeness</p>
                <p className="text-[11px] text-cb-secondary">
                  {compPercent >= 80 ? "Placement Drive Ready" : "Missing key criteria"}
                </p>
                <Link
                  href="/student/resume"
                  className="text-[11px] font-semibold text-cb-forest hover:underline inline-flex items-center gap-1 mt-1"
                >
                  <FileText className="w-3 h-3" />
                  <span>
                    {profile?.has_resume ? `ATS Resume Verified (${profile.ats_score || 85}/100)` : "Upload Resume (+10%)"}
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Missing Criteria Checklist (if incomplete) */}
          {completion?.missing_items && completion.missing_items.length > 0 && (
            <div className="mt-5 pt-4 border-t border-cb-border flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-cb-secondary uppercase tracking-wider font-semibold mr-1">
                To reach 100%:
              </span>
              {completion.missing_items.map((item: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-mono flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span>{item}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* GRID: 2 COLUMNS (Left: Personal + Academic + Skills; Right: Projects + Exp + Certs) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* 1. PERSONAL INFORMATION */}
            <div className="bg-cb-card border border-cb-border rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-cb-border mb-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cb-forest" />
                  <h2 className="font-heading font-bold text-sm text-cb-primary">
                    Personal Information
                  </h2>
                </div>
                <button
                  onClick={() => setEditingPersonal(!editingPersonal)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-cb-forest hover:bg-cb-card-alt rounded-lg transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{editingPersonal ? "Cancel" : "Edit Details"}</span>
                </button>
              </div>

              {!editingPersonal ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-cb-secondary block">Full Name:</span>
                      <span className="font-medium text-cb-primary">{profile?.full_name}</span>
                    </div>
                    <div>
                      <span className="text-cb-secondary block">Email (Official):</span>
                      <span className="font-medium text-cb-primary font-mono">{profile?.email}</span>
                    </div>
                    <div>
                      <span className="text-cb-secondary block">Phone Number:</span>
                      <span className="font-medium text-cb-primary font-mono">
                        {profile?.phone_number || "Not provided"}
                      </span>
                    </div>
                    <div>
                      <span className="text-cb-secondary block">Location:</span>
                      <span className="font-medium text-cb-primary">
                        {profile?.city || "Not provided"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-cb-secondary block">Professional Bio:</span>
                    <p className="text-cb-primary italic leading-relaxed mt-0.5">
                      {profile?.bio || "No summary bio added yet. Add a short headline describing your career aspirations."}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePersonalSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={personalForm.full_name}
                        onChange={(e) =>
                          setPersonalForm({ ...personalForm, full_name: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-cb-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="+91 9876543210"
                        value={personalForm.phone_number}
                        onChange={(e) =>
                          setPersonalForm({ ...personalForm, phone_number: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-cb-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                        City / Location
                      </label>
                      <input
                        type="text"
                        placeholder="Bengaluru, India"
                        value={personalForm.city}
                        onChange={(e) =>
                          setPersonalForm({ ...personalForm, city: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-cb-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                        LinkedIn URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        value={personalForm.linkedin_url}
                        onChange={(e) =>
                          setPersonalForm({ ...personalForm, linkedin_url: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-cb-border rounded-lg font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                        GitHub URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={personalForm.github_url}
                        onChange={(e) =>
                          setPersonalForm({ ...personalForm, github_url: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-cb-border rounded-lg font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                        Portfolio / Web URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={personalForm.portfolio_url}
                        onChange={(e) =>
                          setPersonalForm({ ...personalForm, portfolio_url: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-cb-border rounded-lg font-mono text-[11px]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                      Professional Headline / Bio
                    </label>
                    <textarea
                      rows={2}
                      value={personalForm.bio}
                      onChange={(e) => setPersonalForm({ ...personalForm, bio: e.target.value })}
                      placeholder="e.g. Pre-final year CS undergraduate specializing in Distributed Systems and Cloud Computing."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-cb-border rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingPersonal(false)}
                      className="px-3 py-1.5 border border-cb-border rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-cb-forest text-cb-cream rounded-lg text-xs font-semibold hover:bg-cb-dark"
                    >
                      Save Personal Details
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* 2. ACADEMIC PROFILE & ELIGIBILITY */}
            <div className="bg-cb-card border border-cb-border rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-cb-border mb-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-cb-forest" />
                  <h2 className="font-heading font-bold text-sm text-cb-primary">
                    Academic Records & Placement Eligibility
                  </h2>
                </div>
                <button
                  onClick={() => setEditingAcademic(!editingAcademic)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-cb-forest hover:bg-cb-card-alt rounded-lg transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{editingAcademic ? "Cancel" : "Edit Academics"}</span>
                </button>
              </div>

              {!editingAcademic ? (
                primaryAcademic ? (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-cb-primary text-sm">
                          {primaryAcademic.institution_name}
                        </h3>
                        <p className="text-cb-secondary">
                          {primaryAcademic.degree} in {primaryAcademic.department}
                        </p>
                      </div>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-cb-card-alt border border-cb-border">
                        {primaryAcademic.start_year} – {primaryAcademic.end_year}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-cb-card-alt border border-cb-border flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-cb-secondary uppercase">
                            Cumulative CGPA
                          </span>
                          <span className="text-base font-bold font-mono text-cb-forest block">
                            {primaryAcademic.cgpa_or_percentage} / 10
                          </span>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-cb-forest" />
                      </div>

                      <div className="p-3 rounded-xl bg-cb-card-alt border border-cb-border flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-cb-secondary uppercase">
                            Active Backlogs
                          </span>
                          <span
                            className={`text-base font-bold font-mono block ${
                              primaryAcademic.backlogs_count === 0 ? "text-emerald-700" : "text-red-600"
                            }`}
                          >
                            {primaryAcademic.backlogs_count} Active
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-cb-border">
                          {primaryAcademic.backlogs_count === 0 ? "Eligible" : "Gated"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-cb-secondary">
                    No academic records on file. Please add your degree and CGPA.
                  </p>
                )
              ) : (
                <form onSubmit={handleAcademicSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                      College / University Name
                    </label>
                    <input
                      type="text"
                      required
                      value={academicForm.institution_name}
                      onChange={(e) =>
                        setAcademicForm({ ...academicForm, institution_name: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-cb-border rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                        Degree
                      </label>
                      <input
                        type="text"
                        required
                        value={academicForm.degree}
                        onChange={(e) =>
                          setAcademicForm({ ...academicForm, degree: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-cb-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        required
                        value={academicForm.department}
                        onChange={(e) =>
                          setAcademicForm({ ...academicForm, department: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-cb-border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                        CGPA or Percentage
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        required
                        value={academicForm.cgpa_or_percentage}
                        onChange={(e) =>
                          setAcademicForm({
                            ...academicForm,
                            cgpa_or_percentage: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-cb-border rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                        Active Backlogs Count
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        required
                        value={academicForm.backlogs_count}
                        onChange={(e) =>
                          setAcademicForm({
                            ...academicForm,
                            backlogs_count: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-cb-border rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingAcademic(false)}
                      className="px-3 py-1.5 border border-cb-border rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-cb-forest text-cb-cream rounded-lg text-xs font-semibold hover:bg-cb-dark"
                    >
                      Save Academic Records
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* 3. TECHNICAL SKILLS */}
            <div className="bg-cb-card border border-cb-border rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-cb-border mb-4">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cb-forest" />
                  <h2 className="font-heading font-bold text-sm text-cb-primary">
                    Technical Skills ({profile?.skills?.length || 0})
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddSkill(!showAddSkill)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-cb-forest hover:bg-cb-card-alt rounded-lg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </div>

              {showAddSkill && (
                <form
                  onSubmit={handleAddSkillSubmit}
                  className="mb-4 p-3 bg-cb-card-alt border border-cb-border rounded-xl space-y-3 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                        Skill Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Python, Docker, Next.js"
                        required
                        value={skillForm.name}
                        onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-cb-border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                        Category
                      </label>
                      <select
                        value={skillForm.category}
                        onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-cb-border rounded-lg text-xs"
                      >
                        <option value="programming_language">Language</option>
                        <option value="framework">Framework</option>
                        <option value="database">Database</option>
                        <option value="cloud_devops">Cloud & DevOps</option>
                        <option value="machine_learning">AI / ML</option>
                        <option value="tool">Tool</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddSkill(false)}
                      className="px-2.5 py-1 border border-cb-border rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-cb-forest text-cb-cream rounded-md font-semibold"
                    >
                      Save Skill
                    </button>
                  </div>
                </form>
              )}

              <div className="flex flex-wrap gap-2">
                {profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill: any) => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cb-card-alt border border-cb-border text-cb-primary group hover:border-cb-forest transition-colors"
                    >
                      <span>{skill.name}</span>
                      <span className="text-[10px] font-mono text-cb-secondary">
                        • {skill.proficiency_level}
                      </span>
                      <button
                        onClick={() => handleRemoveSkill(skill.id)}
                        className="opacity-40 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                        title="Remove Skill"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-cb-secondary italic">
                    No skills added yet. Add at least 5 skills to boost job recommendations.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* 4. ENGINEERING PROJECTS */}
            <div className="bg-cb-card border border-cb-border rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-cb-border mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cb-forest" />
                  <h2 className="font-heading font-bold text-sm text-cb-primary">
                    Engineering Projects ({profile?.projects?.length || 0})
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddProject(!showAddProject)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-cb-forest hover:bg-cb-card-alt rounded-lg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              {showAddProject && (
                <form
                  onSubmit={handleAddProjectSubmit}
                  className="mb-4 p-3.5 bg-cb-card-alt border border-cb-border rounded-xl space-y-3 text-xs"
                >
                  <div>
                    <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                      Project Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CareerBridge — Campus Placement AI"
                      required
                      value={projectForm.title}
                      onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-cb-border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                      Technologies (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="FastAPI, Next.js, MySQL, Docker"
                      value={projectForm.technologies}
                      onChange={(e) =>
                        setProjectForm({ ...projectForm, technologies: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-cb-border rounded-lg text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                        GitHub Repository URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={projectForm.github_url}
                        onChange={(e) =>
                          setProjectForm({ ...projectForm, github_url: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-cb-border rounded-lg text-xs font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                        Live Demo URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://demo.app"
                        value={projectForm.live_demo_url}
                        onChange={(e) =>
                          setProjectForm({ ...projectForm, live_demo_url: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-cb-border rounded-lg text-xs font-mono text-[11px]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                      Description & Architecture
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Describe what you engineered, key libraries, and metrics."
                      value={projectForm.description}
                      onChange={(e) =>
                        setProjectForm({ ...projectForm, description: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-cb-border rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddProject(false)}
                      className="px-2.5 py-1 border border-cb-border rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-cb-forest text-cb-cream rounded-md font-semibold"
                    >
                      Save Project
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {profile?.projects && profile.projects.length > 0 ? (
                  profile.projects.map((proj: any) => (
                    <div
                      key={proj.id}
                      className="p-3.5 rounded-xl bg-cb-card-alt border border-cb-border space-y-2 relative group"
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-cb-primary text-xs pr-6">
                          {proj.title}
                        </h3>
                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          className="opacity-0 group-hover:opacity-100 text-cb-secondary hover:text-red-600 transition-opacity"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-cb-secondary leading-relaxed line-clamp-2">
                        {proj.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {proj.technologies_used?.map((t: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-white border border-cb-border text-[10px] font-mono text-cb-forest"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-cb-forest">
                        {proj.github_url && (
                          <a
                            href={proj.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline inline-flex items-center gap-1"
                          >
                            <Github className="w-3 h-3" />
                            <span>Source Code</span>
                          </a>
                        )}
                        {proj.live_demo_url && (
                          <a
                            href={proj.live_demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Live App</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-cb-secondary italic">
                    No engineering projects recorded. Feature at least 2 projects with GitHub repositories.
                  </p>
                )}
              </div>
            </div>

            {/* 5. WORK & INTERNSHIP EXPERIENCE */}
            <div className="bg-cb-card border border-cb-border rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-cb-border mb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-cb-forest" />
                  <h2 className="font-heading font-bold text-sm text-cb-primary">
                    Experience & Internships ({profile?.experiences?.length || 0})
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddExp(!showAddExp)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-cb-forest hover:bg-cb-card-alt rounded-lg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Experience</span>
                </button>
              </div>

              {showAddExp && (
                <form
                  onSubmit={handleAddExpSubmit}
                  className="mb-4 p-3.5 bg-cb-card-alt border border-cb-border rounded-xl space-y-3 text-xs"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        placeholder="Google Cloud"
                        required
                        value={expForm.company_name}
                        onChange={(e) => setExpForm({ ...expForm, company_name: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-cb-border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                        Role Title
                      </label>
                      <input
                        type="text"
                        placeholder="Software Engineering Intern"
                        required
                        value={expForm.role_title}
                        onChange={(e) => setExpForm({ ...expForm, role_title: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-cb-border rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                      Key Responsibilities & Quantifiable Metrics
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Architected async microservices reducing query latency by 35%."
                      value={expForm.description}
                      onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-cb-border rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddExp(false)}
                      className="px-2.5 py-1 border border-cb-border rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-cb-forest text-cb-cream rounded-md font-semibold"
                    >
                      Save Experience
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {profile?.experiences && profile.experiences.length > 0 ? (
                  profile.experiences.map((exp: any) => (
                    <div
                      key={exp.id}
                      className="p-3.5 rounded-xl bg-cb-card-alt border border-cb-border space-y-1 relative group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-cb-primary text-xs">
                            {exp.role_title} • {exp.company_name}
                          </h3>
                          <span className="text-[10px] font-mono text-cb-secondary">
                            {exp.start_date} to {exp.end_date || "Present"} ({exp.location})
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteExp(exp.id)}
                          className="opacity-0 group-hover:opacity-100 text-cb-secondary hover:text-red-600 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {exp.description && (
                        <p className="text-xs text-cb-secondary leading-relaxed pt-1">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-cb-secondary italic">
                    No work experience listed yet.
                  </p>
                )}
              </div>
            </div>

            {/* 6. CERTIFICATIONS */}
            <div className="bg-cb-card border border-cb-border rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-cb-border mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-cb-forest" />
                  <h2 className="font-heading font-bold text-sm text-cb-primary">
                    Certifications ({profile?.certifications?.length || 0})
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddCert(!showAddCert)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-cb-forest hover:bg-cb-card-alt rounded-lg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Cert</span>
                </button>
              </div>

              {showAddCert && (
                <form
                  onSubmit={handleAddCertSubmit}
                  className="mb-4 p-3.5 bg-cb-card-alt border border-cb-border rounded-xl space-y-3 text-xs"
                >
                  <div>
                    <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                      Certification Name
                    </label>
                    <input
                      type="text"
                      placeholder="AWS Certified Solutions Architect"
                      required
                      value={certForm.title}
                      onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-cb-border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                      Issuing Organization
                    </label>
                    <input
                      type="text"
                      placeholder="Amazon Web Services"
                      required
                      value={certForm.issuing_organization}
                      onChange={(e) =>
                        setCertForm({ ...certForm, issuing_organization: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-cb-border rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCert(false)}
                      className="px-2.5 py-1 border border-cb-border rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-cb-forest text-cb-cream rounded-md font-semibold"
                    >
                      Save Certification
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {profile?.certifications && profile.certifications.length > 0 ? (
                  profile.certifications.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-cb-card-alt border border-cb-border flex items-center justify-between group"
                    >
                      <div>
                        <h3 className="font-semibold text-cb-primary text-xs">{c.title}</h3>
                        <p className="text-[10px] font-mono text-cb-secondary">
                          {c.issuing_organization} • Issued {c.issue_date}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteCert(c.id)}
                        className="opacity-0 group-hover:opacity-100 text-cb-secondary hover:text-red-600 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-cb-secondary italic">
                    No certifications added yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
