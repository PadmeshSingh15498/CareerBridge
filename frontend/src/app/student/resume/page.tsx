"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Loader2,
  History,
  FileCheck,
  CheckSquare,
  Square,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  FileCode,
  FileSpreadsheet,
} from "lucide-react";

import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { apiService } from "@/lib/api";

export default function StudentResumePage() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [activeResume, setActiveResume] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Re-upload modal
  const [showReuploadModal, setShowReuploadModal] = useState(false);
  const [reuploadNotes, setReuploadNotes] = useState("");
  const [reuploadFile, setReuploadFile] = useState<File | null>(null);

  // Approval / Merge modal
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeOptions, setMergeOptions] = useState({
    apply_personal: true,
    apply_education: true,
    apply_skills: true,
    apply_projects: true,
    apply_experience: true,
    overwrite_existing: false,
  });
  const [isMerging, setIsMerging] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await apiService.getMyResumes();
      if (res && res.data) {
        setResumes(res.data);
        if (res.data.length > 0) {
          setActiveResume(res.data[0]);
        } else {
          setActiveResume(null);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load resumes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleFileUpload = async (file: File) => {
    setErrorMsg(null);

    // Validate size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File exceeds the 10MB size limit. Please upload a smaller document.");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      setErrorMsg("Unsupported file format. Please upload a PDF or DOCX resume.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").toUpperCase());

    setUploading(true);
    setUploadProgress(20);

    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 200);

    try {
      const res = await apiService.uploadResume(formData);
      clearInterval(progressTimer);
      setUploadProgress(100);
      showToast(`Resume uploaded successfully! ATS Score: ${res.data.ats_score}/100.`);
      fetchResumes();
    } catch (err: any) {
      clearInterval(progressTimer);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Upload failed. Please ensure the file is an uncorrupted PDF or DOCX.";
      setErrorMsg(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleReuploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reuploadFile || !activeResume) return;

    const formData = new FormData();
    formData.append("file", reuploadFile);
    if (reuploadNotes.trim()) {
      formData.append("changelog_notes", reuploadNotes.trim());
    }

    setUploading(true);
    try {
      const res = await apiService.reuploadResume(activeResume.id, formData);
      setShowReuploadModal(false);
      setReuploadFile(null);
      setReuploadNotes("");
      showToast(`New revision (v${res.data.version_number}) uploaded! New ATS Score: ${res.data.ats_score}/100.`);
      fetchResumes();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.response?.data?.message || "Revision upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleApplyExtractedSubmit = async () => {
    if (!activeResume) return;
    setIsMerging(true);
    try {
      const res = await apiService.applyExtractedData(activeResume.id, mergeOptions);
      setShowMergeModal(false);
      showToast(`${res.data.message} Profile completion is now ${res.data.new_profile_completion}%.`);
    } catch (err: any) {
      alert(err.response?.data?.detail || err.response?.data?.message || "Failed to merge data.");
    } finally {
      setIsMerging(false);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm("Are you sure you want to delete this resume and its version history?")) return;
    try {
      await apiService.deleteResume(resumeId);
      showToast("Resume deleted successfully.");
      fetchResumes();
    } catch (err: any) {
      alert("Failed to delete resume.");
    }
  };

  const downloadFile = (resumeId: string, filename: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const url = `${baseUrl}/api/v1/resumes/${resumeId}/download`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const analysis = activeResume?.analysis;
  const atsScore = analysis?.ats_score ?? 0;
  const extracted = activeResume?.extracted_data;

  return (
    <WorkspaceShell role="student" activeTabTitle="Resume Studio">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Toast Banner */}
        {toastMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg(null)}>
              <X className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)}>
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TOP SECTION: Active Document Overview + Quick Actions                     */}
        {/* ========================================================================= */}
        <div className="bg-cb-card border border-cb-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cb-forest text-cb-lime flex items-center justify-center font-mono font-bold text-xl shadow-xs shrink-0">
              <FileCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading font-bold text-xl text-cb-primary">
                  {activeResume ? activeResume.title : "No Active Resume Document"}
                </h1>
                {activeResume && (
                  <span className="px-2 py-0.5 rounded-full bg-cb-lime/20 border border-cb-lime/30 text-[11px] font-mono font-semibold text-cb-forest">
                    v{activeResume.current_version}.0 Active
                  </span>
                )}
              </div>
              <p className="text-xs text-cb-secondary">
                {activeResume ? (
                  <span>
                    {activeResume.file_name} • {(activeResume.file_size_bytes / 1024).toFixed(1)} KB •{" "}
                    Uploaded on {new Date(activeResume.created_at).toLocaleDateString()}
                  </span>
                ) : (
                  "Upload your PDF or DOCX resume to activate the 100-point deterministic ATS rubric."
                )}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {activeResume && (
              <>
                <button
                  onClick={() => downloadFile(activeResume.id, activeResume.file_name)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-cb-border text-xs font-semibold rounded-lg hover:bg-cb-card-alt text-cb-primary transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
                <button
                  onClick={() => setShowReuploadModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-cb-border text-xs font-semibold rounded-lg hover:bg-cb-card-alt text-cb-forest transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-upload Version</span>
                </button>
                <button
                  onClick={() => setShowMergeModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cb-forest text-cb-cream text-xs font-semibold rounded-lg hover:bg-cb-dark transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cb-lime" />
                  <span>Review & Import to Profile</span>
                </button>
                <Link
                  href="/student/resume/analysis"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cb-lime text-cb-dark text-xs font-bold rounded-lg hover:bg-[#b8d655] transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cb-dark" />
                  <span>AI Diagnostic Report</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DRAG-AND-DROP UPLOAD ZONE                                                */}
        {/* ========================================================================= */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
          className="border-2 border-dashed border-cb-border hover:border-cb-forest bg-cb-card/60 hover:bg-white rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cb-card-alt border border-cb-border flex items-center justify-center mx-auto text-cb-forest group-hover:scale-105 transition-transform">
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-cb-forest" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>

            <div>
              <p className="font-heading font-semibold text-sm text-cb-primary">
                {uploading ? "Extracting & Evaluating Document..." : "Drop your resume here, or browse files"}
              </p>
              <p className="text-xs text-cb-secondary mt-1">
                Supports <strong className="text-cb-primary">PDF</strong> and{" "}
                <strong className="text-cb-primary">DOCX</strong> up to 10MB.
              </p>
            </div>

            {uploading && (
              <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-cb-forest h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN ANALYSIS & EXTRACTED PREVIEW (If Active Resume exists)               */}
        {/* ========================================================================= */}
        {activeResume && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN: ATS Scorecard & 4 Pillars (1 col) */}
            <div className="space-y-6 lg:col-span-1">
              {/* ATS SCORE WHEEL */}
              <div className="bg-cb-card border border-cb-border rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-cb-border mb-4">
                  <h2 className="font-heading font-bold text-sm text-cb-primary">
                    ATS Scorecard (0-100)
                  </h2>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cb-secondary">
                    Deterministic Rubric
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center py-2">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 96 96">
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        stroke="#E2E4DC"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        stroke={atsScore >= 80 ? "#244D3D" : atsScore >= 60 ? "#E88B57" : "#DC2626"}
                        strokeWidth="8"
                        strokeDasharray={238.76}
                        strokeDashoffset={238.76 - (238.76 * atsScore) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="font-mono font-bold text-3xl text-cb-primary block">
                        {atsScore}
                      </span>
                      <span className="text-[10px] font-mono uppercase text-cb-secondary">
                        / 100 ATS
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Pillar Breakdown */}
                <div className="space-y-3 pt-3 border-t border-cb-border text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-cb-secondary">Section Completeness:</span>
                      <span className="font-mono font-semibold text-cb-primary">
                        {analysis?.section_score || 0} / 25
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-cb-forest h-1 rounded-full"
                        style={{ width: `${((analysis?.section_score || 0) / 25) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-cb-secondary">Metrics & STAR Verbs:</span>
                      <span className="font-mono font-semibold text-cb-primary">
                        {analysis?.metric_score || 0} / 25
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-cb-forest h-1 rounded-full"
                        style={{ width: `${((analysis?.metric_score || 0) / 25) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-cb-secondary">Technical Skill Depth:</span>
                      <span className="font-mono font-semibold text-cb-primary">
                        {analysis?.skill_score || 0} / 30
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-cb-forest h-1 rounded-full"
                        style={{ width: `${((analysis?.skill_score || 0) / 30) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-cb-secondary">Layout & Readability:</span>
                      <span className="font-mono font-semibold text-cb-primary">
                        {analysis?.format_score || 0} / 20
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-cb-forest h-1 rounded-full"
                        style={{ width: `${((analysis?.format_score || 0) / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actionable Improvement Tips */}
                {analysis?.improvements_json && analysis.improvements_json.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-cb-border">
                    <p className="text-[11px] font-mono font-semibold text-cb-forest uppercase tracking-wider mb-2">
                      Improvement Recommendations:
                    </p>
                    <ul className="space-y-1.5 text-xs text-cb-secondary">
                      {analysis.improvements_json.map((tip: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-snug">
                          <span className="text-cb-forest shrink-0 font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* VERSION HISTORY */}
              <div className="bg-cb-card border border-cb-border rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-cb-border mb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-cb-forest" />
                    <h2 className="font-heading font-bold text-sm text-cb-primary">
                      Version History ({activeResume.versions?.length || 1})
                    </h2>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {activeResume.versions?.map((v: any) => (
                    <div
                      key={v.id}
                      className="p-2.5 rounded-lg bg-cb-card-alt border border-cb-border flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono font-semibold text-cb-primary">
                          Revision v{v.version_number}.0
                        </span>
                        <p className="text-[10px] text-cb-secondary">
                          {v.changelog_notes || "Document update"} •{" "}
                          {new Date(v.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-white text-[10px] font-mono border border-cb-border text-cb-forest">
                        Stored
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Extracted Information Preview & Approval (2 cols) */}
            <div className="space-y-6 lg:col-span-2">
              <div className="bg-cb-card border border-cb-border rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-cb-border">
                  <div>
                    <h2 className="font-heading font-bold text-base text-cb-primary">
                      Extracted Structured Intelligence
                    </h2>
                    <p className="text-xs text-cb-secondary mt-0.5">
                      Extracted via layout-aware PyMuPDF/python-docx parsing. Review before importing to your live profile.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMergeModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cb-forest text-cb-cream text-xs font-semibold rounded-lg hover:bg-cb-dark transition-all shadow-xs"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-cb-lime" />
                    <span>Import to Profile</span>
                  </button>
                </div>

                {extracted ? (
                  <div className="space-y-5 text-xs">
                    {/* Candidate Identity */}
                    <div className="p-3.5 rounded-xl bg-cb-card-alt border border-cb-border">
                      <span className="text-[10px] font-mono uppercase text-cb-secondary block mb-1">
                        Parsed Contact & Links
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <span className="text-cb-secondary block">Name:</span>
                          <span className="font-medium text-cb-primary">
                            {extracted.personal?.name || "Not detected"}
                          </span>
                        </div>
                        <div>
                          <span className="text-cb-secondary block">Email:</span>
                          <span className="font-medium text-cb-primary font-mono truncate block">
                            {extracted.personal?.email || "Not detected"}
                          </span>
                        </div>
                        <div>
                          <span className="text-cb-secondary block">Phone:</span>
                          <span className="font-medium text-cb-primary font-mono">
                            {extracted.personal?.phone || "Not detected"}
                          </span>
                        </div>
                        <div>
                          <span className="text-cb-secondary block">LinkedIn:</span>
                          <span className="font-medium text-cb-primary truncate block">
                            {extracted.personal?.linkedin_url || "Not detected"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Extracted Skills */}
                    <div>
                      <span className="text-[11px] font-mono uppercase font-semibold text-cb-primary block mb-2">
                        Extracted Technical Skills ({extracted.skills?.length || 0}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {extracted.skills?.map((sk: any, i: number) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-full text-xs font-medium bg-cb-card-alt border border-cb-border text-cb-primary"
                          >
                            {sk.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Extracted Education */}
                    {extracted.education && extracted.education.length > 0 && (
                      <div>
                        <span className="text-[11px] font-mono uppercase font-semibold text-cb-primary block mb-2">
                          Parsed Academic Record:
                        </span>
                        <div className="p-3 rounded-xl bg-cb-card-alt border border-cb-border flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-cb-primary">
                              {extracted.education[0].institution_name}
                            </span>
                            <p className="text-cb-secondary text-[11px]">
                              {extracted.education[0].degree} in {extracted.education[0].department}
                            </p>
                          </div>
                          <span className="font-mono text-xs px-2 py-1 rounded bg-white border border-cb-border">
                            CGPA: {extracted.education[0].cgpa}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Extracted Projects */}
                    {extracted.projects && extracted.projects.length > 0 && (
                      <div>
                        <span className="text-[11px] font-mono uppercase font-semibold text-cb-primary block mb-2">
                          Parsed Projects ({extracted.projects.length}):
                        </span>
                        <div className="space-y-2">
                          {extracted.projects.map((p: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-cb-card-alt border border-cb-border space-y-1"
                            >
                              <span className="font-semibold text-cb-primary block">{p.title}</span>
                              <p className="text-cb-secondary leading-snug line-clamp-2">
                                {p.description}
                              </p>
                              {p.technologies && p.technologies.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {p.technologies.map((t: string, ti: number) => (
                                    <span
                                      key={ti}
                                      className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono text-cb-forest border border-cb-border"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-cb-secondary italic">
                    Parsing details unavailable for this record.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: RE-UPLOAD VERSION                                               */}
        {/* ========================================================================= */}
        {showReuploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cb-primary/40 backdrop-blur-xs">
            <div className="w-full max-w-md bg-cb-card border border-cb-border rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-cb-border">
                <h3 className="font-heading font-bold text-sm text-cb-primary">
                  Re-upload New Resume Version
                </h3>
                <button onClick={() => setShowReuploadModal(false)}>
                  <X className="w-4 h-4 text-cb-secondary" />
                </button>
              </div>

              <form onSubmit={handleReuploadSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                    Select Revised PDF or DOCX File
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setReuploadFile(e.target.files[0]);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-cb-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                    Changelog Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Added AWS certification and updated project metric bullets."
                    value={reuploadNotes}
                    onChange={(e) => setReuploadNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-cb-border rounded-lg"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReuploadModal(false)}
                    className="px-3 py-1.5 border border-cb-border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !reuploadFile}
                    className="px-3.5 py-1.5 bg-cb-forest text-cb-cream font-semibold rounded-lg hover:bg-cb-dark disabled:opacity-50"
                  >
                    {uploading ? "Evaluating..." : "Upload New Version"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: APPROVAL & SELECTIVE PROFILE IMPORT                             */}
        {/* ========================================================================= */}
        {showMergeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cb-primary/40 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-cb-card border border-cb-border rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-cb-border">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cb-forest" />
                  <h3 className="font-heading font-bold text-sm text-cb-primary">
                    Approve & Import Extracted Resume Data
                  </h3>
                </div>
                <button onClick={() => setShowMergeModal(false)}>
                  <X className="w-4 h-4 text-cb-secondary" />
                </button>
              </div>

              <p className="text-xs text-cb-secondary leading-relaxed">
                Select which parsed sections you would like to automatically synchronize with your student profile.
              </p>

              {/* Checkboxes */}
              <div className="space-y-2.5 p-3.5 bg-cb-card-alt border border-cb-border rounded-xl text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mergeOptions.apply_personal}
                    onChange={(e) =>
                      setMergeOptions({ ...mergeOptions, apply_personal: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-cb-forest"
                  />
                  <span>Import Phone Number & Social Links (LinkedIn, GitHub)</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mergeOptions.apply_education}
                    onChange={(e) =>
                      setMergeOptions({ ...mergeOptions, apply_education: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-cb-forest"
                  />
                  <span>Import Education Record (Institution, Degree, CGPA)</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mergeOptions.apply_skills}
                    onChange={(e) =>
                      setMergeOptions({ ...mergeOptions, apply_skills: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-cb-forest"
                  />
                  <span>Import Verified Technical Skills (Languages, Frameworks, DBs)</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mergeOptions.apply_projects}
                    onChange={(e) =>
                      setMergeOptions({ ...mergeOptions, apply_projects: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-cb-forest"
                  />
                  <span>Import Technical Projects</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mergeOptions.apply_experience}
                    onChange={(e) =>
                      setMergeOptions({ ...mergeOptions, apply_experience: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-cb-forest"
                  />
                  <span>Import Work Experience / Internships</span>
                </label>
              </div>

              {/* Protection Notice */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Safe Merge Active:</strong> Existing manually edited data is safely preserved; only empty or newly detected competencies will be appended.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMergeModal(false)}
                  className="px-3 py-1.5 border border-cb-border rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyExtractedSubmit}
                  disabled={isMerging}
                  className="px-4 py-1.5 bg-cb-forest text-cb-cream font-semibold rounded-lg text-xs hover:bg-cb-dark disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isMerging ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Merging Data...</span>
                    </>
                  ) : (
                    <span>Approve & Sync Profile</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
