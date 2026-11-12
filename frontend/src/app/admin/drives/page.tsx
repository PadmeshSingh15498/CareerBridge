"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  Award,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Filter,
  UserCheck
} from "lucide-react";

import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { api } from "@/lib/api";

interface PlacementDriveItem {
  id: string;
  company_id: string;
  company_name: string;
  company_logo?: string;
  title: string;
  academic_year: number;
  drive_date: string;
  registration_deadline: string;
  min_cgpa: number;
  max_backlogs_allowed: number;
  number_of_openings: number;
  job_roles: string[];
  allowed_departments: string[];
  selection_rounds: string[];
  venue: string;
  status: string;
  registered_count: number;
  eligible_count: number;
}

interface EligibleStudent {
  student_id: string;
  full_name: string;
  roll_number: string;
  email: string;
  department: string;
  degree: string;
  graduation_year: number;
  cgpa: number;
  backlogs_count: number;
  placement_status: string;
  is_registered: boolean;
}

export default function AdminDrivesPage() {
  const [drives, setDrives] = useState<PlacementDriveItem[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState(2026);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newDrive, setNewDrive] = useState({
    title: "",
    company_id: "",
    academic_year: 2026,
    drive_date: "",
    registration_deadline: "",
    min_cgpa: 6.5,
    max_backlogs_allowed: 0,
    number_of_openings: 10,
    job_roles_str: "Software Engineer, Cloud Analyst",
    allowed_departments: ["Computer Science", "Information Technology"],
    selection_rounds_str: "Online Assessment, Technical Interview, HR Round",
    venue: "Main Auditorium & Computing Lab 3",
  });
  const [creating, setCreating] = useState(false);

  // Eligible Drawer State
  const [selectedDrive, setSelectedDrive] = useState<PlacementDriveItem | null>(null);
  const [eligibleStudents, setEligibleStudents] = useState<EligibleStudent[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const [drivesRes, companiesRes] = await Promise.all([
        api.getAdminDrives({ academic_year: academicYear }),
        api.getAdminRecruiters({ status_filter: "verified" }),
      ]);
      if (drivesRes && drivesRes.data) {
        setDrives(drivesRes.data);
      }
      if (companiesRes && companiesRes.data) {
        setCompanies(companiesRes.data);
        if (companiesRes.data.length > 0 && !newDrive.company_id) {
          setNewDrive((prev) => ({ ...prev, company_id: companiesRes.data[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch drives:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, [academicYear]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenEligibleDrawer = async (drive: PlacementDriveItem) => {
    setSelectedDrive(drive);
    setLoadingEligible(true);
    try {
      const res = await api.getDriveEligibleStudents(drive.id);
      if (res && res.data) {
        setEligibleStudents(res.data.students || []);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch eligible students for drive.");
    } finally {
      setLoadingEligible(false);
    }
  };

  const handleRegisterStudent = async (studentId: string) => {
    if (!selectedDrive) return;
    try {
      const res = await api.registerStudentForDrive(selectedDrive.id, studentId);
      setEligibleStudents((prev) =>
        prev.map((s) => (s.student_id === studentId ? { ...s, is_registered: true } : s))
      );
      setDrives((prev) =>
        prev.map((d) => (d.id === selectedDrive.id ? { ...d, registered_count: d.registered_count + 1 } : d))
      );
      showToast(res.message || "Candidate enrolled into placement drive.");
    } catch (err) {
      console.error(err);
      showToast("Enrollment failed.");
    }
  };

  const handleCreateDriveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrive.title || !newDrive.company_id || !newDrive.drive_date || !newDrive.registration_deadline) {
      showToast("Please complete all mandatory drive fields.");
      return;
    }
    setCreating(true);
    try {
      const payload = {
        title: newDrive.title,
        company_id: newDrive.company_id,
        academic_year: newDrive.academic_year,
        drive_date: newDrive.drive_date,
        registration_deadline: newDrive.registration_deadline,
        min_cgpa: Number(newDrive.min_cgpa),
        max_backlogs_allowed: Number(newDrive.max_backlogs_allowed),
        number_of_openings: Number(newDrive.number_of_openings),
        job_roles: newDrive.job_roles_str.split(",").map((s) => s.trim()).filter(Boolean),
        allowed_departments: newDrive.allowed_departments,
        selection_rounds: newDrive.selection_rounds_str.split(",").map((s) => s.trim()).filter(Boolean),
        venue: newDrive.venue,
      };

      const res = await api.createAdminDrive(payload);
      if (res && res.data) {
        showToast(`Placement drive '${res.data.title}' scheduled successfully!`);
        setCreateModalOpen(false);
        fetchDrives();
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.detail || "Failed to create placement drive.");
    } finally {
      setCreating(false);
    }
  };

  const toggleDept = (dept: string) => {
    setNewDrive((prev) => {
      const exists = prev.allowed_departments.includes(dept);
      return {
        ...prev,
        allowed_departments: exists
          ? prev.allowed_departments.filter((d) => d !== dept)
          : [...prev.allowed_departments, dept],
      };
    });
  };

  return (
    <WorkspaceShell role="admin" activeTabTitle="Drives">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 bg-cb-card border border-cb-teal/40 text-cb-teal px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in font-mono text-sm">
            <CheckCircle2 className="w-4 h-4 text-cb-teal shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-cb-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-cb-teal/10 text-cb-teal border border-cb-teal/20">
                Institutional Drives
              </span>
              <span className="text-xs font-mono text-cb-muted">Batch {academicYear}</span>
            </div>
            <h1 className="text-2xl font-bold text-cb-primary tracking-tight">
              Campus Placement Drives & Automated Eligibility
            </h1>
            <p className="text-sm text-cb-secondary mt-1">
              Coordinate on-campus recruitment drives, enforce eligibility criteria, and automatically identify qualified candidates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 text-xs font-mono font-semibold rounded-lg bg-cb-teal text-cb-bg hover:bg-cb-teal/90 flex items-center gap-2 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Placement Drive</span>
            </button>
          </div>
        </div>

        {/* Drives Grid */}
        {loading ? (
          <div className="py-16 text-center text-cb-muted font-mono flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-cb-teal animate-spin" />
            <span>Loading placement drives...</span>
          </div>
        ) : drives.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-cb-card border border-cb-border text-cb-muted font-mono">
            No campus placement drives scheduled yet for Batch of {academicYear}. Click "Schedule Placement Drive" above to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {drives.map((drv) => (
              <div
                key={drv.id}
                className="rounded-xl bg-cb-card border border-cb-border p-5 flex flex-col justify-between hover:border-cb-border-hover transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono text-cb-teal font-medium flex items-center gap-1.5 mb-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {drv.company_name}
                      </span>
                      <h3 className="font-bold text-base text-cb-primary leading-snug">{drv.title}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-cb-card-hover border border-cb-border text-cb-secondary shrink-0">
                      {drv.status}
                    </span>
                  </div>

                  {/* Openings & Roles */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-cb-teal/10 text-cb-teal font-mono border border-cb-teal/20">
                      {drv.number_of_openings} Openings
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cb-card-hover text-cb-secondary font-mono border border-cb-border">
                      Min {drv.min_cgpa.toFixed(2)} CGPA
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cb-card-hover text-cb-secondary font-mono border border-cb-border">
                      Max {drv.max_backlogs_allowed} Backlogs
                    </span>
                  </div>

                  {/* Target Departments */}
                  <div className="mt-3 text-xs text-cb-secondary">
                    <span className="text-cb-muted font-mono text-[11px] block mb-1">Allowed Departments:</span>
                    <div className="flex flex-wrap gap-1">
                      {drv.allowed_departments?.map((dept, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-cb-border/40 text-cb-primary"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Venue & Dates */}
                  <div className="mt-4 pt-3 border-t border-cb-border/60 space-y-1.5 text-xs text-cb-secondary">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-cb-orange shrink-0" />
                      <span>Drive Date: <strong className="text-cb-primary">{drv.drive_date}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-cb-muted shrink-0" />
                      <span>Registration Deadline: {drv.registration_deadline}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-cb-muted shrink-0" />
                      <span className="truncate">{drv.venue}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Eligible Count & Drawer Trigger */}
                <div className="pt-3 border-t border-cb-border flex items-center justify-between">
                  <div className="text-xs font-mono text-cb-secondary">
                    <span className="text-cb-teal font-bold">{drv.eligible_count}</span> eligible /{" "}
                    <span className="text-cb-primary font-bold">{drv.registered_count}</span> registered
                  </div>

                  <button
                    onClick={() => handleOpenEligibleDrawer(drv)}
                    className="px-3 py-1.5 rounded-lg bg-cb-card-hover hover:bg-cb-border border border-cb-border text-xs font-mono text-cb-teal hover:text-cb-primary flex items-center gap-1.5 transition-all"
                  >
                    <span>View Candidates</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drawer / Modal: Automated Eligible Candidates List */}
        {selectedDrive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-cb-card border border-cb-border rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-cb-border pb-3">
                <div>
                  <h3 className="font-bold text-base text-cb-primary">
                    Automated Student Eligibility List
                  </h3>
                  <div className="text-xs text-cb-secondary mt-0.5">
                    Drive: <strong className="text-cb-teal">{selectedDrive.title}</strong> •{" "}
                    Min CGPA: {selectedDrive.min_cgpa} • Max Backlogs: {selectedDrive.max_backlogs_allowed}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDrive(null)}
                  className="text-cb-muted hover:text-cb-primary text-xl font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {loadingEligible ? (
                <div className="py-12 text-center text-cb-muted font-mono flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 text-cb-teal animate-spin" />
                  <span>Scanning cohort for eligible students matching criteria...</span>
                </div>
              ) : eligibleStudents.length === 0 ? (
                <div className="py-12 text-center text-cb-muted font-mono">
                  No registered students currently meet this drive's academic criteria.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-mono text-cb-teal font-medium">
                    Found {eligibleStudents.length} candidates automatically matched based on academic criteria:
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-cb-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-cb-card-hover border-b border-cb-border text-cb-secondary font-mono">
                        <tr>
                          <th className="px-3 py-2.5">Roll Number</th>
                          <th className="px-3 py-2.5">Candidate</th>
                          <th className="px-3 py-2.5">Department</th>
                          <th className="px-3 py-2.5">CGPA</th>
                          <th className="px-3 py-2.5">Backlogs</th>
                          <th className="px-3 py-2.5 text-right">Enrollment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cb-border/60">
                        {eligibleStudents.map((st) => (
                          <tr key={st.student_id} className="hover:bg-cb-card-hover/40 transition-colors">
                            <td className="px-3 py-2.5 font-mono text-cb-primary font-medium">
                              {st.roll_number}
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="font-semibold text-cb-primary">{st.full_name}</div>
                              <div className="text-[11px] text-cb-muted truncate">{st.email}</div>
                            </td>
                            <td className="px-3 py-2.5 text-cb-secondary">{st.department}</td>
                            <td className="px-3 py-2.5 font-mono font-medium text-cb-teal">
                              {st.cgpa.toFixed(2)}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-cb-muted">
                              {st.backlogs_count}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              {st.is_registered ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono bg-cb-teal/15 text-cb-teal border border-cb-teal/30">
                                  <CheckCircle2 className="w-3 h-3" /> Enrolled
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleRegisterStudent(st.student_id)}
                                  className="px-2.5 py-1 rounded text-[10px] font-mono bg-cb-card hover:bg-cb-teal hover:text-cb-bg border border-cb-border text-cb-secondary transition-all"
                                >
                                  Enroll
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-cb-border">
                <button
                  onClick={() => setSelectedDrive(null)}
                  className="px-4 py-2 rounded-lg bg-cb-card hover:bg-cb-card-hover border border-cb-border text-xs font-mono text-cb-primary"
                >
                  Close Eligibility Drawer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Placement Drive */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-cb-card border border-cb-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-cb-border pb-3">
                <h3 className="font-bold text-base text-cb-primary">
                  Schedule New Placement Drive
                </h3>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-cb-muted hover:text-cb-primary text-xl font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateDriveSubmit} className="space-y-4 text-xs">
                {/* Title */}
                <div>
                  <label className="block font-mono text-cb-secondary mb-1">Drive Title *</label>
                  <input
                    type="text"
                    required
                    value={newDrive.title}
                    onChange={(e) => setNewDrive({ ...newDrive, title: e.target.value })}
                    placeholder="e.g. Google Cloud Autumn Campus Hiring 2026"
                    className="w-full p-2.5 rounded-lg bg-cb-card-hover border border-cb-border text-cb-primary focus:outline-none focus:border-cb-teal"
                  />
                </div>

                {/* Company Select */}
                <div>
                  <label className="block font-mono text-cb-secondary mb-1">Recruiting Company *</label>
                  <select
                    required
                    value={newDrive.company_id}
                    onChange={(e) => setNewDrive({ ...newDrive, company_id: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-cb-card-hover border border-cb-border text-cb-primary focus:outline-none"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.industry})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dates Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-cb-secondary mb-1">Drive Date *</label>
                    <input
                      type="date"
                      required
                      value={newDrive.drive_date}
                      onChange={(e) => setNewDrive({ ...newDrive, drive_date: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-cb-card-hover border border-cb-border text-cb-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-cb-secondary mb-1">Deadline *</label>
                    <input
                      type="datetime-local"
                      required
                      value={newDrive.registration_deadline}
                      onChange={(e) => setNewDrive({ ...newDrive, registration_deadline: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-cb-card-hover border border-cb-border text-cb-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Criteria: CGPA, Backlogs, Openings */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-mono text-cb-secondary mb-1">Min CGPA</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={newDrive.min_cgpa}
                      onChange={(e) => setNewDrive({ ...newDrive, min_cgpa: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-lg bg-cb-card-hover border border-cb-border text-cb-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-cb-secondary mb-1">Max Backlogs</label>
                    <input
                      type="number"
                      min="0"
                      value={newDrive.max_backlogs_allowed}
                      onChange={(e) => setNewDrive({ ...newDrive, max_backlogs_allowed: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-lg bg-cb-card-hover border border-cb-border text-cb-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-cb-secondary mb-1">Total Openings</label>
                    <input
                      type="number"
                      min="1"
                      value={newDrive.number_of_openings}
                      onChange={(e) => setNewDrive({ ...newDrive, number_of_openings: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-lg bg-cb-card-hover border border-cb-border text-cb-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Allowed Departments Checkboxes */}
                <div>
                  <label className="block font-mono text-cb-secondary mb-1.5">Allowed Departments:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Computer Science",
                      "Information Technology",
                      "Electronics & Communication",
                      "Mechanical Engineering",
                    ].map((dept) => {
                      const checked = newDrive.allowed_departments.includes(dept);
                      return (
                        <label
                          key={dept}
                          className="flex items-center gap-2 p-2 rounded-lg bg-cb-card-hover border border-cb-border/60 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDept(dept)}
                            className="rounded border-cb-border text-cb-teal focus:ring-0"
                          />
                          <span className="text-cb-primary">{dept}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Job Roles & Stages */}
                <div>
                  <label className="block font-mono text-cb-secondary mb-1">
                    Job Roles (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newDrive.job_roles_str}
                    onChange={(e) => setNewDrive({ ...newDrive, job_roles_str: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-cb-card-hover border border-cb-border text-cb-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-cb-secondary mb-1">Venue</label>
                  <input
                    type="text"
                    value={newDrive.venue}
                    onChange={(e) => setNewDrive({ ...newDrive, venue: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-cb-card-hover border border-cb-border text-cb-primary focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-cb-border">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-cb-card hover:bg-cb-card-hover border border-cb-border font-mono text-cb-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 rounded-lg bg-cb-teal text-cb-bg hover:bg-cb-teal/90 font-mono font-semibold"
                  >
                    {creating ? "Scheduling..." : "Publish Placement Drive"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
