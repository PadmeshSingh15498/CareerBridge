"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, Menu, X, ArrowRight, ShieldCheck, 
  GraduationCap, Briefcase, Building2, ChevronDown 
} from "lucide-react";
import { HealthBadge } from "./HealthBadge";
import { useAuth } from "@/context/AuthContext";

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { label: "Intelligence", href: "#intelligence" },
    { label: "ATS Analyzer", href: "#resume-analyzer" },
    { label: "Semantic Match", href: "#job-matching" },
    { label: "Skill Gaps", href: "#skill-gaps" },
    { label: "BridgeAI", href: "#bridge-ai" },
    { label: "Institutional", href: "#institutional" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-cream/90 backdrop-blur-md border-b border-border-subtle transition-all">
      <div className="container mx-auto px-4 sm:px-6 h-18 flex items-center justify-between py-3.5">
        {/* Brand Logo & Tag */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-forest text-lime flex items-center justify-center font-heading font-extrabold text-lg shadow-sm border border-forest-dark group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-xl tracking-tight text-primary">
                CareerBridge
              </span>
              <span className="hidden lg:inline-flex items-center text-[10px] font-mono text-forest bg-stone-200/70 px-2 py-0.5 rounded-full border border-border-subtle uppercase tracking-wider font-semibold">
                Intelligence Workspace
              </span>
            </div>
            <span className="text-[11px] font-mono text-primary-muted hidden sm:block">
              From Potential to Placement.
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs font-sans font-semibold text-primary-muted hover:text-primary px-3 py-1.5 rounded-lg hover:bg-stone-200/60 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Action Controls & Health */}
        <div className="hidden lg:flex items-center gap-2.5">
          <HealthBadge />

          <div className="flex items-center gap-1 bg-stone-200/60 p-1 rounded-xl border border-border-subtle text-xs font-semibold">
            <Link
              href="/student/dashboard"
              className="px-2.5 py-1 text-primary-muted hover:text-primary hover:bg-white rounded-lg transition-all"
            >
              🎓 Student
            </Link>
            <Link
              href="/recruiter/dashboard"
              className="px-2.5 py-1 text-primary-muted hover:text-primary hover:bg-white rounded-lg transition-all"
            >
              🏢 Recruiter
            </Link>
            <Link
              href="/admin/dashboard"
              className="px-2.5 py-1 text-primary-muted hover:text-primary hover:bg-white rounded-lg transition-all"
            >
              🏛️ Placement
            </Link>
          </div>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                href={
                  user.role === "student"
                    ? "/student/dashboard"
                    : user.role === "recruiter"
                    ? "/recruiter/dashboard"
                    : "/admin/dashboard"
                }
              >
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-forest text-white hover:bg-forest-dark transition-all duration-150 shadow-sm border border-forest-dark">
                  <span>{user.full_name?.split(" ")[0] || "My"} Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5 text-lime" />
                </button>
              </Link>
              <button
                onClick={() => logout()}
                className="px-2.5 py-1.5 text-xs text-primary-muted hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-semibold text-primary hover:text-forest transition-colors"
              >
                Sign In
              </Link>
              <Link href="/register">
                <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-forest text-white hover:bg-forest-dark transition-all duration-150 shadow-sm hover:shadow border border-forest-dark">
                  Get Started <ArrowRight className="w-3.5 h-3.5 text-lime" />
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          <HealthBadge />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-border-subtle bg-white text-primary hover:bg-stone-100"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-primary" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border-subtle bg-cream px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-primary hover:bg-stone-200/60 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-border-subtle flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-200/50 rounded-xl border border-border-subtle text-center text-xs font-semibold">
              <Link
                href="/student/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 bg-white text-primary rounded-lg shadow-2xs"
              >
                🎓 Student
              </Link>
              <Link
                href="/recruiter/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 bg-white text-primary rounded-lg shadow-2xs"
              >
                🏢 Recruiter
              </Link>
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 bg-white text-primary rounded-lg shadow-2xs"
              >
                🏛️ Placement
              </Link>
            </div>

            {isAuthenticated && user ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-100">
                <span className="text-xs font-medium text-primary">
                  {user.full_name} ({user.role})
                </span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="text-xs text-red-600 font-semibold"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-xs font-semibold border border-border-subtle bg-white text-primary rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-xs font-semibold bg-forest text-white rounded-xl"
                >
                  Register
                </Link>
              </div>
            )}

            <Link
              href="/student/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-xs font-semibold bg-forest text-white rounded-xl flex items-center justify-center gap-1.5"
            >
              Enter Intelligence Workspace <ArrowRight className="w-3.5 h-3.5 text-lime" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
