"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  Layers,
  Compass,
  MapPin,
  Bot,
  Bell,
  Settings,
  Building2,
  Users,
  Calendar,
  BarChart3,
  CheckSquare,
  FileSpreadsheet,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { HealthBadge } from "@/components/shared/HealthBadge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/context/AuthContext";

export type WorkspaceRole = "student" | "recruiter" | "admin";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const studentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "My Profile", href: "/student/profile", icon: User },
  { label: "Resume", href: "/student/resume", icon: FileText, badge: "88 ATS" },
  { label: "Find Jobs", href: "/student/jobs", icon: Briefcase, badge: "4 New" },
  { label: "Applications", href: "/student/applications", icon: Layers, badge: "3" },
  { label: "Skill Gap", href: "/student/skill-gap", icon: Compass },
  { label: "Career Roadmap", href: "/student/roadmap", icon: MapPin },
  { label: "Interview Prep", href: "/student/interview-prep", icon: CheckSquare },
  { label: "BridgeAI", href: "/student/bridge-ai", icon: Bot },
  { label: "Notifications", href: "/student/notifications", icon: Bell },
  { label: "Settings", href: "/student/settings", icon: Settings },
];

const recruiterNavItems: NavItem[] = [
  { label: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
  { label: "Company", href: "/recruiter/company", icon: Building2 },
  { label: "Jobs", href: "/recruiter/jobs", icon: Briefcase, badge: "3 Active" },
  { label: "Applicants", href: "/recruiter/applicants", icon: Users, badge: "42" },
  { label: "Interviews", href: "/recruiter/interviews", icon: Calendar, badge: "8" },
  { label: "Analytics", href: "/recruiter/analytics", icon: BarChart3 },
  { label: "Settings", href: "/recruiter/settings", icon: Settings },
];

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/admin/students", icon: Users, badge: "480" },
  { label: "Recruiters", href: "/admin/recruiters", icon: Building2, badge: "1 Pending" },
  { label: "Jobs", href: "/admin/jobs", icon: Briefcase, badge: "2 Pending" },
  { label: "Applications", href: "/admin/applications", icon: Layers },
  { label: "Placement Drives", href: "/admin/drives", icon: Calendar, badge: "2 Active" },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Reports", href: "/admin/reports", icon: FileSpreadsheet },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

interface WorkspaceShellProps {
  role: WorkspaceRole;
  children: React.ReactNode;
  activeTabTitle?: string;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  role,
  children,
  activeTabTitle,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const navItems =
    role === "student"
      ? studentNavItems
      : role === "recruiter"
      ? recruiterNavItems
      : adminNavItems;

  const roleTitle =
    role === "student"
      ? "Student Workspace"
      : role === "recruiter"
      ? "Recruiter Portal"
      : "Placement Command Center";

  const defaultPersona =
    role === "student"
      ? {
          name: "Aditya Sharma",
          email: "student@careerbridge.com",
          badge: "B.Tech CSE '26",
          avatar: "AS",
        }
      : role === "recruiter"
      ? {
          name: "Priya Sharma",
          email: "recruiter@google.com",
          badge: "Google Cloud",
          avatar: "PS",
        }
      : {
          name: "Dr. Rajesh Verma",
          email: "tpo@university.edu",
          badge: "Head of T&P, NIT",
          avatar: "RV",
        };

  const userPersona = user
    ? {
        name: user.full_name || defaultPersona.name,
        email: user.email,
        badge:
          user.role === "student"
            ? user.details?.department || "Student"
            : user.role === "recruiter"
            ? user.details?.company_name || "Recruiter"
            : "Placement Officer",
        avatar: (user.full_name || "CB")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      }
    : defaultPersona;

  return (
    <div className="min-h-screen bg-cb-bg text-cb-primary flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-cb-card border-b border-cb-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-cb-border text-cb-primary hover:bg-cb-card-alt"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/" className="flex items-center gap-1.5">
            <span className="font-heading font-bold text-base text-cb-primary tracking-tight">
              Career<span className="text-cb-forest">Bridge</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cb-forest/10 text-cb-forest font-semibold uppercase">
            {role}
          </span>
          <NotificationBell />
          <HealthBadge />
        </div>
      </header>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-cb-border bg-cb-card sticky top-0 h-screen shrink-0 overflow-y-auto">
        {/* Sidebar Brand Header */}
        <div className="p-5 border-b border-cb-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cb-forest text-cb-lime font-mono font-bold flex items-center justify-center text-sm shadow-sm">
              CB
            </div>
            <div>
              <span className="font-heading font-bold text-base text-cb-primary tracking-tight block">
                Career<span className="text-cb-forest">Bridge</span>
              </span>
              <span className="text-[11px] font-mono text-cb-secondary block leading-none">
                {roleTitle}
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Role Switcher Pill inside Sidebar */}
        <div className="px-4 py-3 bg-cb-card-alt/50 border-b border-cb-border text-xs">
          <div className="text-[10px] font-mono text-cb-secondary uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Active Persona</span>
            <span className="text-cb-forest font-medium">1-Click Switch</span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-cb-bg p-1 rounded-lg border border-cb-border">
            <button
              onClick={() => router.push("/student/dashboard")}
              className={`py-1 text-[11px] font-medium rounded text-center transition-all ${
                role === "student"
                  ? "bg-cb-forest text-white shadow-xs font-semibold"
                  : "text-cb-secondary hover:text-cb-primary"
              }`}
            >
              Student
            </button>
            <button
              onClick={() => router.push("/recruiter/dashboard")}
              className={`py-1 text-[11px] font-medium rounded text-center transition-all ${
                role === "recruiter"
                  ? "bg-cb-forest text-white shadow-xs font-semibold"
                  : "text-cb-secondary hover:text-cb-primary"
              }`}
            >
              Recruiter
            </button>
            <button
              onClick={() => router.push("/admin/dashboard")}
              className={`py-1 text-[11px] font-medium rounded text-center transition-all ${
                role === "admin"
                  ? "bg-cb-forest text-white shadow-xs font-semibold"
                  : "text-cb-secondary hover:text-cb-primary"
              }`}
            >
              Admin/TPO
            </button>
          </div>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? "bg-cb-forest text-white font-semibold shadow-xs"
                    : "text-cb-secondary hover:text-cb-primary hover:bg-cb-card-alt"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-cb-lime" : "text-cb-secondary group-hover:text-cb-primary"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-cb-lime/20 text-cb-lime border border-cb-lime/30"
                        : "bg-cb-card-alt text-cb-secondary border border-cb-border"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Persona Bottom Footer */}
        <div className="p-3 border-t border-cb-border bg-cb-card-alt/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-cb-forest text-cb-lime text-xs font-mono font-bold flex items-center justify-center shrink-0">
                {userPersona.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-cb-primary truncate leading-tight">
                  {userPersona.name}
                </p>
                <p className="text-[10px] text-cb-secondary truncate font-mono">
                  {userPersona.badge}
                </p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out of CareerBridge"
              className="p-1.5 text-cb-secondary hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (When Open) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-cb-primary/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-cb-card border-r border-cb-border flex flex-col h-full z-10 shadow-xl">
            <div className="p-4 border-b border-cb-border flex items-center justify-between">
              <span className="font-heading font-bold text-base text-cb-primary">
                Career<span className="text-cb-forest">Bridge</span>
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-cb-secondary hover:text-cb-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Persona Switcher on Mobile */}
            <div className="p-3 border-b border-cb-border bg-cb-card-alt">
              <p className="text-[10px] font-mono uppercase text-cb-secondary mb-1">Switch Role</p>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => {
                    router.push("/student/dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className={`py-1 text-xs rounded text-center ${
                    role === "student" ? "bg-cb-forest text-white font-semibold" : "bg-cb-bg text-cb-secondary"
                  }`}
                >
                  Student
                </button>
                <button
                  onClick={() => {
                    router.push("/recruiter/dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className={`py-1 text-xs rounded text-center ${
                    role === "recruiter" ? "bg-cb-forest text-white font-semibold" : "bg-cb-bg text-cb-secondary"
                  }`}
                >
                  Recruiter
                </button>
                <button
                  onClick={() => {
                    router.push("/admin/dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className={`py-1 text-xs rounded text-center ${
                    role === "admin" ? "bg-cb-forest text-white font-semibold" : "bg-cb-bg text-cb-secondary"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                      isActive
                        ? "bg-cb-forest text-white font-semibold"
                        : "text-cb-secondary hover:text-cb-primary hover:bg-cb-card-alt"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cb-card-alt">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Workspace Top Desktop Action Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 border-b border-cb-border bg-cb-card/70 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs text-cb-secondary font-sans">
            <span className="font-medium text-cb-primary capitalize">{role} Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-cb-secondary" />
            <span className="text-cb-forest font-semibold">{activeTabTitle || "Dashboard"}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Role Switcher Pill in Topbar */}
            <div className="flex items-center bg-cb-card-alt border border-cb-border rounded-full p-0.5 text-xs">
              <span className="text-[11px] font-mono text-cb-secondary px-2.5">Workspace:</span>
              <button
                onClick={() => router.push("/student/dashboard")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  role === "student"
                    ? "bg-cb-forest text-white shadow-xs font-semibold"
                    : "text-cb-secondary hover:text-cb-primary"
                }`}
              >
                🎓 Student
              </button>
              <button
                onClick={() => router.push("/recruiter/dashboard")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  role === "recruiter"
                    ? "bg-cb-forest text-white shadow-xs font-semibold"
                    : "text-cb-secondary hover:text-cb-primary"
                }`}
              >
                🏢 Recruiter
              </button>
              <button
                onClick={() => router.push("/admin/dashboard")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  role === "admin"
                    ? "bg-cb-forest text-white shadow-xs font-semibold"
                    : "text-cb-secondary hover:text-cb-primary"
                }`}
              >
                🏛️ Placement Officer
              </button>
            </div>

            <NotificationBell />
            <HealthBadge />
          </div>
        </header>

        {/* Dynamic Workspace Content */}
        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default WorkspaceShell;
