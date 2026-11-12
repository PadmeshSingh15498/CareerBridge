"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  FileSpreadsheet,
  GraduationCap,
  RefreshCw,
  Plus
} from "lucide-react";

import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { api } from "@/lib/api";

interface StudentItem {
  id: string;
  user_id: string;
  full_name: string;
  roll_number: string;
  email: string;
  phone_number?: string;
  city?: string;
  placement_status: string;
  is_verified: boolean;
  is_active: boolean;
  academic_record?: {
    institution_name: string;
    degree: string;
    department: string;
    start_year: number;
    end_year: number;
    cgpa_or_percentage: number;
    backlogs_count: number;
  };
  skills: string[];
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);

  // Filters
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [gradYear, setGradYear] = useState<number | undefined>(undefined);
  const [placementStatus, setPlacementStatus] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | undefined>(undefined);

  // Modals & Feedback
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminStudents({
        search: search || undefined,
        department: department || undefined,
        graduation_year: gradYear || undefined,
        placement_status: placementStatus || undefined,
        is_verified: verifiedFilter,
        page,
        page_size: pageSize,
      });
      if (res && res.data) {
        setStudents(res.data.students || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, department, gradYear, placementStatus, verifiedFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleVerified = async (student: StudentItem) => {
    try {
      const newStatus = !student.is_verified;
      await api.updateStudentStatus(student.id, { is_verified: newStatus });
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, is_verified: newStatus } : s))
      );
      showToast(`${student.full_name} verification status set to ${newStatus ? "VERIFIED" : "UNVERIFIED"}.`);
    } catch (err) {
      console.error(err);
      showToast("Failed to update verification status.");
    }
  };

  const handleToggleActive = async (student: StudentItem) => {
    try {
      const newStatus = !student.is_active;
      await api.updateStudentStatus(student.id, { is_active: newStatus });
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, is_active: newStatus } : s))
      );
      showToast(`${student.full_name} account set to ${newStatus ? "ACTIVE" : "DEACTIVATED"}.`);
    } catch (err) {
      console.error(err);
      showToast("Failed to update active status.");
    }
  };

  const handleChangePlacementStatus = async (student: StudentItem, status: string) => {
    try {
      await api.updateStudentStatus(student.id, { placement_status: status });
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, placement_status: status } : s))
      );
      showToast(`${student.full_name} placement status updated to '${status.toUpperCase()}'.`);
    } catch (err) {
      console.error(err);
      showToast("Failed to change placement status.");
    }
  };

  const handleExportCsv = async () => {
    try {
      showToast("Generating student cohort export CSV...");
      const blob = await api.exportStudentsCsv({
        department: department || undefined,
        graduation_year: gradYear || undefined,
        placement_status: placementStatus || undefined,
      });
      const url = window.URL.createObjectURL(new Blob([blob], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `students_cohort_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("CSV cohort export downloaded successfully!");
    } catch (err) {
      console.error(err);
      showToast("CSV export failed.");
    }
  };

  const handleCsvImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile && !csvText.trim()) {
      showToast("Please select a CSV file or paste CSV text.");
      return;
    }
    setImporting(true);
    try {
      const res = await api.importStudentsCsv(csvFile || undefined, csvText || undefined);
      if (res && res.data) {
        setImportResult(res.data);
        showToast(`Imported ${res.data.imported_count} students (${res.data.duplicates_skipped} duplicates skipped).`);
        fetchStudents();
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.detail || "CSV import failed.");
    } finally {
      setImporting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <WorkspaceShell role="admin" activeTabTitle="Students">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 bg-cb-card border border-cb-teal/40 text-cb-teal px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in font-mono text-sm">
            <CheckCircle2 className="w-4 h-4 text-cb-teal shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-cb-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-cb-teal/10 text-cb-teal border border-cb-teal/20">
                Academic Administration
              </span>
              <span className="text-xs font-mono text-cb-muted">{total} Enrolled Candidates</span>
            </div>
            <h1 className="text-2xl font-bold text-cb-primary tracking-tight">
              Student Directory & Eligibility Verification
            </h1>
            <p className="text-sm text-cb-secondary mt-1">
              Manage student academic records, backlogs verification, placement statuses, and CSV cohort rosters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setImportModalOpen(true); setImportResult(null); }}
              className="px-3.5 py-2 text-xs font-mono font-medium rounded-lg bg-cb-card hover:bg-cb-card-hover border border-cb-border text-cb-secondary hover:text-cb-primary flex items-center gap-2 transition-all shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 text-cb-teal" />
              <span>Bulk Import CSV</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 text-xs font-mono font-medium rounded-lg bg-cb-teal text-cb-bg hover:bg-cb-teal/90 flex items-center gap-2 transition-all shadow-sm font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Cohort CSV</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-xl bg-cb-card border border-cb-border space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-cb-muted absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by candidate name, roll number, or institutional email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-cb-card-hover border border-cb-border text-xs text-cb-primary placeholder-cb-muted focus:outline-none focus:border-cb-teal"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cb-border/60 hover:bg-cb-border text-xs font-mono text-cb-primary flex items-center justify-center gap-2 transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-cb-border/50 text-xs">
            {/* Department Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-cb-muted font-mono">Dept:</span>
              <select
                value={department}
                onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 rounded-md bg-cb-card-hover border border-cb-border text-cb-primary text-xs focus:outline-none"
              >
                <option value="">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Communication">Electronics & Comm.</option>
                <option value="Mechanical Engineering">Mechanical Eng.</option>
                <option value="Civil Engineering">Civil Eng.</option>
              </select>
            </div>

            {/* Graduation Year */}
            <div className="flex items-center gap-1.5">
              <span className="text-cb-muted font-mono">Grad Year:</span>
              <select
                value={gradYear || ""}
                onChange={(e) => { setGradYear(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                className="px-2.5 py-1.5 rounded-md bg-cb-card-hover border border-cb-border text-cb-primary text-xs focus:outline-none"
              >
                <option value="">All Batches</option>
                <option value="2026">Batch of 2026</option>
                <option value="2025">Batch of 2025</option>
                <option value="2024">Batch of 2024</option>
              </select>
            </div>

            {/* Placement Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-cb-muted font-mono">Status:</span>
              <select
                value={placementStatus}
                onChange={(e) => { setPlacementStatus(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 rounded-md bg-cb-card-hover border border-cb-border text-cb-primary text-xs focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="unplaced">Unplaced</option>
                <option value="placed">Placed</option>
                <option value="opted_out">Opted Out</option>
              </select>
            </div>

            {/* Verified Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-cb-muted font-mono">Verification:</span>
              <select
                value={verifiedFilter === undefined ? "" : String(verifiedFilter)}
                onChange={(e) => {
                  setVerifiedFilter(e.target.value === "" ? undefined : e.target.value === "true");
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-md bg-cb-card-hover border border-cb-border text-cb-primary text-xs focus:outline-none"
              >
                <option value="">All Verification</option>
                <option value="true">Verified Only</option>
                <option value="false">Unverified</option>
              </select>
            </div>

            {(department || gradYear || placementStatus || verifiedFilter !== undefined || search) && (
              <button
                onClick={() => {
                  setDepartment("");
                  setGradYear(undefined);
                  setPlacementStatus("");
                  setVerifiedFilter(undefined);
                  setSearch("");
                  setPage(1);
                }}
                className="text-xs font-mono text-cb-orange hover:underline ml-auto"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Student Roster Table */}
        <div className="rounded-xl bg-cb-card border border-cb-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cb-card-hover border-b border-cb-border text-cb-secondary font-mono">
                <tr>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Candidate Name</th>
                  <th className="px-4 py-3">Department & Batch</th>
                  <th className="px-4 py-3">CGPA & Backlogs</th>
                  <th className="px-4 py-3">Placement Status</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cb-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-cb-muted font-mono">
                      <RefreshCw className="w-5 h-5 mx-auto mb-2 text-cb-teal animate-spin" />
                      Loading student roster...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-cb-muted font-mono">
                      No student records match the specified filters.
                    </td>
                  </tr>
                ) : (
                  students.map((s) => {
                    const acad = s.academic_record;
                    return (
                      <tr key={s.id} className="hover:bg-cb-card-hover/40 transition-colors">
                        {/* Roll Number */}
                        <td className="px-4 py-3.5 font-mono text-cb-primary font-medium">
                          {s.roll_number}
                        </td>

                        {/* Name & Email */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-cb-primary">{s.full_name}</div>
                          <div className="text-[11px] text-cb-secondary truncate max-w-[180px]">
                            {s.email}
                          </div>
                        </td>

                        {/* Department & Batch */}
                        <td className="px-4 py-3.5 text-cb-secondary">
                          <div>{acad?.department || "Unassigned"}</div>
                          <div className="text-[11px] font-mono text-cb-muted">
                            {acad?.degree} • Class of {acad?.end_year || 2026}
                          </div>
                        </td>

                        {/* CGPA & Backlogs */}
                        <td className="px-4 py-3.5">
                          <div className="font-mono font-medium text-cb-primary">
                            {acad?.cgpa_or_percentage ? `${acad.cgpa_or_percentage.toFixed(2)} CGPA` : "N/A"}
                          </div>
                          <div className="text-[11px] font-mono">
                            {acad?.backlogs_count === 0 ? (
                              <span className="text-cb-teal">0 Backlogs</span>
                            ) : (
                              <span className="text-cb-orange font-semibold">{acad?.backlogs_count} Standing Backlogs</span>
                            )}
                          </div>
                        </td>

                        {/* Placement Status */}
                        <td className="px-4 py-3.5">
                          <select
                            value={s.placement_status}
                            onChange={(e) => handleChangePlacementStatus(s, e.target.value)}
                            className={`px-2 py-1 rounded text-[11px] font-mono font-medium border focus:outline-none ${
                              s.placement_status === "placed"
                                ? "bg-cb-teal/10 text-cb-teal border-cb-teal/30"
                                : s.placement_status === "opted_out"
                                ? "bg-cb-muted/20 text-cb-muted border-cb-border"
                                : "bg-cb-orange/10 text-cb-orange border-cb-orange/30"
                            }`}
                          >
                            <option value="unplaced">UNPLACED</option>
                            <option value="placed">PLACED</option>
                            <option value="opted_out">OPTED OUT</option>
                          </select>
                        </td>

                        {/* Verification Toggle */}
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => handleToggleVerified(s)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium transition-all ${
                              s.is_verified
                                ? "bg-cb-teal/15 text-cb-teal border border-cb-teal/30 hover:bg-cb-teal/25"
                                : "bg-cb-border text-cb-muted hover:text-cb-primary"
                            }`}
                          >
                            {s.is_verified ? (
                              <>
                                <ShieldCheck className="w-3 h-3 text-cb-teal" />
                                <span>Verified</span>
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="w-3 h-3 text-cb-orange" />
                                <span>Pending</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Account Status Toggle */}
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => handleToggleActive(s)}
                            className={`px-2 py-1 rounded text-[11px] font-mono ${
                              s.is_active
                                ? "text-cb-teal bg-cb-teal/10 hover:bg-cb-teal/20"
                                : "text-cb-orange bg-cb-orange/10 hover:bg-cb-orange/20"
                            }`}
                          >
                            {s.is_active ? "Active" : "Deactivated"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-[11px] font-mono text-cb-secondary">
                            {s.skills?.length || 0} skills
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          <div className="p-4 border-t border-cb-border flex items-center justify-between text-xs text-cb-secondary font-mono">
            <div>
              Showing {students.length} of {total} candidates (Page {page} of {totalPages})
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-cb-border hover:bg-cb-card-hover disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-cb-border hover:bg-cb-card-hover disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal: Bulk Student CSV Import with Duplicate Detection */}
        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-cb-card border border-cb-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-cb-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cb-teal/10 text-cb-teal border border-cb-teal/20">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-cb-primary">
                      Bulk Student Cohort Import
                    </h3>
                    <p className="text-xs text-cb-secondary">
                      Automated duplicate detection against roll numbers and university email addresses.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setImportModalOpen(false)}
                  className="text-cb-muted hover:text-cb-primary text-xl font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Sample Headers Reference */}
              <div className="p-3 rounded-xl bg-black/40 border border-cb-border/60 text-xs font-mono space-y-1 text-cb-muted">
                <div className="text-cb-teal font-semibold">Required CSV Headers:</div>
                <div className="text-cb-secondary select-all">
                  roll_number, full_name, email, department, degree, start_year, end_year, cgpa, backlogs
                </div>
                <div className="text-[11px] text-cb-muted pt-1">
                  Default passwords are automatically generated (Argon2id) and accounts set to verified.
                </div>
              </div>

              <form onSubmit={handleCsvImportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-cb-secondary mb-1.5">
                    Upload CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-xs text-cb-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-mono file:bg-cb-card-hover file:text-cb-primary hover:file:bg-cb-border"
                  />
                </div>

                <div className="text-center text-xs font-mono text-cb-muted">--- OR PASTE CSV TEXT ---</div>

                <div>
                  <label className="block text-xs font-mono text-cb-secondary mb-1.5">
                    Paste Raw CSV Data
                  </label>
                  <textarea
                    rows={5}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="roll_number,full_name,email,department,degree,start_year,end_year,cgpa,backlogs&#10;CS2026-101,Aman Gupta,aman@example.com,Computer Science,B.Tech,2022,2026,8.5,0"
                    className="w-full p-3 rounded-lg bg-cb-card-hover border border-cb-border text-xs font-mono text-cb-primary placeholder-cb-muted focus:outline-none focus:border-cb-teal"
                  />
                </div>

                {/* Import Result Feedback with Duplicate Detection */}
                {importResult && (
                  <div className="p-4 rounded-xl bg-cb-card-hover border border-cb-border space-y-2">
                    <div className="flex items-center gap-2 font-mono text-xs font-semibold text-cb-primary">
                      <CheckCircle2 className="w-4 h-4 text-cb-teal" />
                      <span>
                        Import Finished: {importResult.imported_count} imported,{" "}
                        <span className="text-cb-orange">{importResult.duplicates_skipped} duplicates skipped</span>
                      </span>
                    </div>

                    {importResult.duplicate_details && importResult.duplicate_details.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-[11px] font-mono text-cb-muted">Duplicate Detection Log:</div>
                        <div className="max-h-28 overflow-y-auto space-y-1 p-2 rounded bg-black/40 text-[11px] font-mono text-cb-orange">
                          {importResult.duplicate_details.map((dup: string, idx: number) => (
                            <div key={idx}>• {dup}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-[11px] font-mono text-cb-orange">Formatting Warnings:</div>
                        <div className="max-h-24 overflow-y-auto space-y-1 p-2 rounded bg-black/40 text-[11px] font-mono text-cb-muted">
                          {importResult.errors.map((err: string, idx: number) => (
                            <div key={idx}>• {err}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-cb-border">
                  <button
                    type="button"
                    onClick={() => setImportModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-cb-card hover:bg-cb-card-hover border border-cb-border text-xs font-mono text-cb-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={importing}
                    className="px-4 py-2 rounded-lg bg-cb-teal text-cb-bg hover:bg-cb-teal/90 text-xs font-mono font-semibold flex items-center gap-2 disabled:opacity-50"
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing CSV...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Execute Import</span>
                      </>
                    )}
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
