"use client";

import React, { useState } from "react";
import { X, CheckCircle, Briefcase, Calendar, UserPlus, FileSpreadsheet, Building2 } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const CreateJobModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState("Junior Cloud Solutions Architect");
  const [jobType, setJobType] = useState("full_time");
  const [location, setLocation] = useState("Bengaluru, Karnataka (Hybrid)");
  const [salaryMin, setSalaryMin] = useState("18");
  const [salaryMax, setSalaryMax] = useState("24");
  const [minCgpa, setMinCgpa] = useState("7.5");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onSuccess?.(`Job posting "${title}" submitted successfully for TPO approval!`);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cb-primary/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-cb-card border border-cb-border rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cb-border bg-cb-card-alt">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-cb-forest/10 rounded text-cb-forest">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-cb-primary text-base">Create Job Requisition</h3>
              <p className="text-xs text-cb-secondary">Post a new position for campus eligibility matching</p>
            </div>
          </div>
          <button onClick={onClose} className="text-cb-secondary hover:text-cb-primary p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-cb-forest mx-auto animate-bounce" />
            <h4 className="font-heading font-semibold text-lg text-cb-primary">Job Created!</h4>
            <p className="text-xs text-cb-secondary">Requisition published to university talent pool.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-cb-primary mb-1">Job Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary focus:outline-none focus:border-cb-forest font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1">Employment Type</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary focus:outline-none focus:border-cb-forest"
                >
                  <option value="full_time">Full-Time FTE</option>
                  <option value="internship">6-Month Internship</option>
                  <option value="intern_to_fte">Intern to FTE PPO</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1">Location / Mode</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary focus:outline-none focus:border-cb-forest"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1">Min CTC (LPA)</label>
                <input
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1">Max CTC (LPA)</label>
                <input
                  type="number"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1">Min CGPA</label>
                <input
                  type="text"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value)}
                  className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary font-mono text-xs"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-cb-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-cb-border text-cb-secondary rounded-lg hover:bg-cb-card-alt text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-cb-forest text-white rounded-lg hover:bg-cb-forest-dark text-xs font-semibold tracking-wide shadow-sm"
              >
                Publish Requisition
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const ScheduleInterviewModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [candidate, setCandidate] = useState("Aditya Sharma (2022CSB1045)");
  const [round, setRound] = useState("Technical Round II - Systems Architecture");
  const [interviewer, setInterviewer] = useState("Sarah Chen (Staff Architect)");
  const [link, setLink] = useState("https://meet.google.com/xyz-cbqj-cbr");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onSuccess?.(`Interview scheduled with ${candidate} for ${round}!`);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cb-primary/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-cb-card border border-cb-border rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cb-border bg-cb-card-alt">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-cb-forest/10 rounded text-cb-forest">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-cb-primary text-base">Schedule Candidate Interview</h3>
              <p className="text-xs text-cb-secondary">Trigger automated calendar invite and candidate notifications</p>
            </div>
          </div>
          <button onClick={onClose} className="text-cb-secondary hover:text-cb-primary p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-cb-forest mx-auto animate-bounce" />
            <h4 className="font-heading font-semibold text-lg text-cb-primary">Interview Scheduled!</h4>
            <p className="text-xs text-cb-secondary">Google Meet link delivered to candidate.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-cb-primary mb-1">Candidate</label>
              <input
                type="text"
                value={candidate}
                onChange={(e) => setCandidate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary focus:outline-none focus:border-cb-forest"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-cb-primary mb-1">Evaluation Round</label>
              <input
                type="text"
                value={round}
                onChange={(e) => setRound(e.target.value)}
                required
                className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary focus:outline-none focus:border-cb-forest"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1">Interviewer Name</label>
                <input
                  type="text"
                  value={interviewer}
                  onChange={(e) => setInterviewer(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1">Virtual Meeting Link</label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary text-xs font-mono"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-cb-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-cb-border text-cb-secondary rounded-lg hover:bg-cb-card-alt text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-cb-forest text-white rounded-lg hover:bg-cb-forest-dark text-xs font-semibold shadow-sm"
              >
                Dispatch Invitation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const AddStudentModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState("Pooja Nair");
  const [email, setEmail] = useState("pooja.nair@nit.edu");
  const [roll, setRoll] = useState("2022CSB1098");
  const [dept, setDept] = useState("Computer Science");
  const [cgpa, setCgpa] = useState("8.45");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onSuccess?.(`Student ${name} (${roll}) enrolled successfully!`);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cb-primary/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-cb-card border border-cb-border rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cb-border bg-cb-card-alt">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-cb-forest/10 rounded text-cb-forest">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-cb-primary text-base">Enroll Student</h3>
              <p className="text-xs text-cb-secondary">Add undergraduate candidate to Batch of 2026 registry</p>
            </div>
          </div>
          <button onClick={onClose} className="text-cb-secondary hover:text-cb-primary p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-cb-forest mx-auto animate-bounce" />
            <h4 className="font-heading font-semibold text-lg text-cb-primary">Student Enrolled!</h4>
            <p className="text-xs text-cb-secondary">Onboarding invitation sent to student email.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1">Roll Number</label>
                <input
                  type="text"
                  value={roll}
                  onChange={(e) => setRoll(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cb-primary mb-1">Institutional Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1">Department</label>
                <select
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary text-xs"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1">Current CGPA</label>
                <input
                  type="text"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary font-mono text-xs"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-cb-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-cb-border text-cb-secondary rounded-lg hover:bg-cb-card-alt text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-cb-forest text-white rounded-lg hover:bg-cb-forest-dark text-xs font-semibold shadow-sm"
              >
                Save Student Record
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const CreateDriveModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [company, setCompany] = useState("Amazon Web Services");
  const [title, setTitle] = useState("AWS Campus Pool Drive 2026");
  const [minCgpa, setMinCgpa] = useState("7.50");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onSuccess?.(`Placement drive "${title}" scheduled and announced to eligible students!`);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cb-primary/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-cb-card border border-cb-border rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cb-border bg-cb-card-alt">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-cb-forest/10 rounded text-cb-forest">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-cb-primary text-base">Create Campus Placement Drive</h3>
              <p className="text-xs text-cb-secondary">Schedule dates, eligibility criteria, and selection rounds</p>
            </div>
          </div>
          <button onClick={onClose} className="text-cb-secondary hover:text-cb-primary p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-cb-forest mx-auto animate-bounce" />
            <h4 className="font-heading font-semibold text-lg text-cb-primary">Placement Drive Published!</h4>
            <p className="text-xs text-cb-secondary">412 eligible candidates notified automatically.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-cb-primary mb-1">Company Partner</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-cb-primary mb-1">Drive Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1">Min CGPA Cutoff</label>
                <input
                  type="text"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1">Venue / Mode</label>
                <input
                  type="text"
                  defaultValue="Auditorium & Virtual"
                  className="w-full px-3 py-2 bg-cb-bg border border-cb-border rounded-lg text-cb-primary text-xs"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-cb-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-cb-border text-cb-secondary rounded-lg hover:bg-cb-card-alt text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-cb-forest text-white rounded-lg hover:bg-cb-forest-dark text-xs font-semibold shadow-sm"
              >
                Schedule & Broadcast
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const ExportReportModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [format, setFormat] = useState("csv");

  if (!isOpen) return null;

  const handleExport = () => {
    onSuccess?.(`Batch of 2026 Placement Report generated (${format.toUpperCase()})!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cb-primary/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-cb-card border border-cb-border rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cb-border bg-cb-card-alt">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-cb-forest/10 rounded text-cb-forest">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-cb-primary text-base">Export Cohort Report</h3>
              <p className="text-xs text-cb-secondary">Download verified audit reports for institutional compliance</p>
            </div>
          </div>
          <button onClick={onClose} className="text-cb-secondary hover:text-cb-primary p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-cb-primary">Select Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`p-3 border rounded-lg text-left text-xs font-medium transition-colors ${
                  format === "csv"
                    ? "border-cb-forest bg-cb-forest/5 text-cb-forest font-semibold"
                    : "border-cb-border text-cb-secondary hover:border-cb-forest/40"
                }`}
              >
                📊 CSV Spreadsheet
                <span className="block text-[10px] text-cb-secondary mt-1">Full candidate & offer rows</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`p-3 border rounded-lg text-left text-xs font-medium transition-colors ${
                  format === "pdf"
                    ? "border-cb-forest bg-cb-forest/5 text-cb-forest font-semibold"
                    : "border-cb-border text-cb-secondary hover:border-cb-forest/40"
                }`}
              >
                📑 PDF Executive Summary
                <span className="block text-[10px] text-cb-secondary mt-1">Charts & Department graphs</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-cb-bg rounded-lg border border-cb-border text-xs text-cb-secondary">
            Contains 480 candidate statuses, 328 placed records, CTC distribution, and company-wise offers.
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-cb-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-cb-border text-cb-secondary rounded-lg hover:bg-cb-card-alt text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="px-5 py-2 bg-cb-forest text-white rounded-lg hover:bg-cb-forest-dark text-xs font-semibold shadow-sm"
            >
              Download Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

