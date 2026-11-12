"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  Building2,
  Landmark,
  Mail,
  Lock,
  User,
  School,
  CreditCard,
  BookOpen,
  Calendar,
  Briefcase,
  Globe,
  KeyRound,
  ArrowRight,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { registerStudent, registerRecruiter, registerAdmin, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"student" | "recruiter" | "admin">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student form state
  const [studentForm, setStudentForm] = useState({
    fullName: "",
    email: "",
    password: "",
    university: "National Institute of Technology",
    registrationNumber: "",
    degree: "B.Tech",
    department: "Computer Science and Engineering",
    graduationYear: 2026,
  });

  // Recruiter form state
  const [recruiterForm, setRecruiterForm] = useState({
    fullName: "",
    workEmail: "",
    password: "",
    companyName: "",
    designation: "Technical Talent Lead",
    companyWebsite: "https://",
  });

  // Admin form state
  const [adminForm, setAdminForm] = useState({
    fullName: "",
    email: "",
    password: "",
    department: "Training & Placement Cell",
    invitationToken: "",
  });

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (studentForm.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerStudent({
        full_name: studentForm.fullName,
        email: studentForm.email,
        password: studentForm.password,
        university: studentForm.university,
        registration_number: studentForm.registrationNumber,
        degree: studentForm.degree,
        department: studentForm.department,
        graduation_year: Number(studentForm.graduationYear),
      });
      router.push("/student/dashboard");
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Registration failed. Please verify your details.";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecruiterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (recruiterForm.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerRecruiter({
        full_name: recruiterForm.fullName,
        email: recruiterForm.workEmail,
        password: recruiterForm.password,
        company_name: recruiterForm.companyName,
        designation: recruiterForm.designation,
        company_website: recruiterForm.companyWebsite,
      });
      router.push("/recruiter/dashboard");
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Registration failed. Please verify your work details.";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!adminForm.invitationToken) {
      setErrorMsg("An authorized Admin Invitation Token is required.");
      return;
    }

    if (adminForm.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerAdmin({
        full_name: adminForm.fullName,
        email: adminForm.email,
        password: adminForm.password,
        department: adminForm.department,
        admin_invitation_token: adminForm.invitationToken,
      });
      router.push("/admin/dashboard");
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Administrator registration failed. Invalid token or unauthorized request.";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cb-cream flex flex-col justify-between selection:bg-cb-lime/30 selection:text-cb-primary">
      {/* Top Header */}
      <header className="border-b border-cb-border bg-cb-card/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cb-forest flex items-center justify-center shadow-xs">
            <span className="font-heading font-black text-sm text-cb-lime">CB</span>
          </div>
          <div>
            <span className="font-heading font-bold text-base text-cb-primary tracking-tight">
              Career<span className="text-cb-forest">Bridge</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-mono text-cb-secondary border-l border-cb-border pl-2 uppercase tracking-wider">
              From Potential to Placement
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-cb-secondary hidden sm:inline">Already registered?</span>
          <Link
            href="/login"
            className="font-semibold text-cb-forest hover:text-cb-dark hover:underline"
          >
            Sign In Instead
          </Link>
        </div>
      </header>

      {/* Main Registration Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-xl bg-cb-card border border-cb-border rounded-2xl shadow-sm p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-heading font-bold text-2xl text-cb-primary tracking-tight">
              Create Your CareerBridge Account
            </h1>
            <p className="text-xs text-cb-secondary mt-1">
              Select your role below to configure your tailored campus intelligence workspace.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-3 p-1 rounded-xl bg-cb-card-alt border border-cb-border mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("student");
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "student"
                  ? "bg-cb-forest text-cb-lime shadow-xs"
                  : "text-cb-secondary hover:text-cb-primary"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("recruiter");
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "recruiter"
                  ? "bg-cb-forest text-cb-lime shadow-xs"
                  : "text-cb-secondary hover:text-cb-primary"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Recruiter</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("admin");
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "admin"
                  ? "bg-cb-forest text-cb-lime shadow-xs"
                  : "text-cb-secondary hover:text-cb-primary"
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>Admin / TPO</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">
                <span className="font-semibold">Registration Notice: </span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* STUDENT FORM */}
          {activeTab === "student" && (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aditya Sharma"
                      value={studentForm.fullName}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, fullName: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1">
                    College / Student Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="aditya@nit.edu"
                      value={studentForm.email}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, email: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1">
                  Password (min 8 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Create a strong password"
                    value={studentForm.password}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, password: e.target.value })
                    }
                    className="w-full pl-9 pr-10 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-cb-secondary hover:text-cb-primary absolute right-2.5 top-1/2 -translate-y-1/2 rounded"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1">
                    University / College Name
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="National Institute of Technology"
                      value={studentForm.university}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, university: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1">
                    Registration / Roll Number
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="2022UGCS042"
                      value={studentForm.registrationNumber}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, registrationNumber: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1">
                    Degree
                  </label>
                  <select
                    value={studentForm.degree}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, degree: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest"
                  >
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="B.E.">B.E.</option>
                    <option value="MCA">MCA</option>
                    <option value="B.Sc">B.Sc</option>
                    <option value="M.Sc">M.Sc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1">
                    Department
                  </label>
                  <select
                    value={studentForm.department}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, department: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest truncate"
                  >
                    <option value="Computer Science and Engineering">Computer Science (CSE)</option>
                    <option value="Information Technology">Information Technology (IT)</option>
                    <option value="Electronics and Communication">Electronics & Comm (ECE)</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1">
                    Graduation Year
                  </label>
                  <select
                    value={studentForm.graduationYear}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, graduationYear: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest font-mono"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                    <option value={2028}>2028</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full mt-4 py-2.5 px-4 bg-cb-forest text-cb-cream hover:bg-cb-dark text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 group cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cb-lime" />
                    <span>Creating Student Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Student Registration</span>
                    <ArrowRight className="w-4 h-4 text-cb-lime transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* RECRUITER FORM */}
          {activeTab === "recruiter" && (
            <form onSubmit={handleRecruiterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={recruiterForm.fullName}
                      onChange={(e) =>
                        setRecruiterForm({ ...recruiterForm, fullName: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1">
                    Corporate Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="priya@company.com"
                      value={recruiterForm.workEmail}
                      onChange={(e) =>
                        setRecruiterForm({ ...recruiterForm, workEmail: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1">
                  Password (min 8 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Create corporate password"
                    value={recruiterForm.password}
                    onChange={(e) =>
                      setRecruiterForm({ ...recruiterForm, password: e.target.value })
                    }
                    className="w-full pl-9 pr-10 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-cb-secondary hover:text-cb-primary absolute right-2.5 top-1/2 -translate-y-1/2 rounded"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Google Cloud"
                      value={recruiterForm.companyName}
                      onChange={(e) =>
                        setRecruiterForm({ ...recruiterForm, companyName: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1">
                    Designation / Title
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Technical Talent Lead"
                      value={recruiterForm.designation}
                      onChange={(e) =>
                        setRecruiterForm({ ...recruiterForm, designation: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1">
                  Company Website
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    placeholder="https://cloud.google.com"
                    value={recruiterForm.companyWebsite}
                    onChange={(e) =>
                      setRecruiterForm({ ...recruiterForm, companyWebsite: e.target.value })
                    }
                    className="w-full pl-9 pr-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest font-mono text-[11px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full mt-4 py-2.5 px-4 bg-cb-forest text-cb-cream hover:bg-cb-dark text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 group cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cb-lime" />
                    <span>Registering Recruiter Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Recruiter Registration</span>
                    <ArrowRight className="w-4 h-4 text-cb-lime transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ADMIN / TPO FORM */}
          {activeTab === "admin" && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              {/* Controlled Access Notice Banner */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-950">Controlled Administrator Provisioning</p>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Public administrator registration is restricted. Placement Officers and platform administrators must provide a verified institutional invitation token to provision administrative credentials.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1">
                    Officer Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Dr. Rajesh Verma"
                      value={adminForm.fullName}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, fullName: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1">
                    Institutional Email (.edu / .ac.in)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="tpo@university.edu"
                      value={adminForm.email}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, email: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cb-primary mb-1">
                  Admin Password (min 8 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Create secure admin password"
                    value={adminForm.password}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, password: e.target.value })
                    }
                    className="w-full pl-9 pr-10 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-cb-secondary hover:text-cb-primary absolute right-2.5 top-1/2 -translate-y-1/2 rounded"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1">
                    Department / Cell
                  </label>
                  <div className="relative">
                    <Landmark className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Training & Placement Cell"
                      value={adminForm.department}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, department: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1">
                    Admin Invitation Token
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="CAREERBRIDGE_TPO_SECURE_TOKEN_2026"
                      value={adminForm.invitationToken}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, invitationToken: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full mt-4 py-2.5 px-4 bg-cb-forest text-cb-cream hover:bg-cb-dark text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 group cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cb-lime" />
                    <span>Validating Administrative Token...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Provision Admin Account</span>
                    <ArrowRight className="w-4 h-4 text-cb-lime transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Security Notice */}
          <div className="mt-6 pt-4 border-t border-cb-border flex items-center justify-center gap-2 text-[11px] text-cb-secondary font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-cb-forest" />
            <span>Encrypted with Argon2id • Zero sensitive tokens in localStorage</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-cb-border py-4 px-6 text-center text-[11px] text-cb-secondary">
        <p>© 2026 CareerBridge. Intelligent Campus Placement & Career Guidance System.</p>
      </footer>
    </div>
  );
}
