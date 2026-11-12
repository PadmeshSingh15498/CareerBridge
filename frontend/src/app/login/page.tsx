"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Building2,
  Landmark,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        if (user.role === "student") router.push("/student/dashboard");
        else if (user.role === "recruiter") router.push("/recruiter/dashboard");
        else router.push("/admin/dashboard");
      }
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Invalid email or password. Please try again.";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
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
          <span className="text-cb-secondary hidden sm:inline">New to CareerBridge?</span>
          <Link
            href="/register"
            className="font-semibold text-cb-forest hover:text-cb-dark hover:underline"
          >
            Create an Account
          </Link>
        </div>
      </header>

      {/* Main Form Centerpiece */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-cb-card border border-cb-border rounded-2xl shadow-sm p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cb-lime/20 border border-cb-lime/30 text-[11px] font-mono text-cb-forest font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cb-forest" />
              <span>Career Intelligence Workspace</span>
            </div>
            <h1 className="font-heading font-bold text-2xl text-cb-primary tracking-tight">
              Sign In to CareerBridge
            </h1>
            <p className="text-xs text-cb-secondary mt-1">
              Enter your credentials or choose a quick demo account below.
            </p>
          </div>

          {/* Quick-Fill Demo Bar */}
          <div className="mb-6 p-3 rounded-xl bg-cb-card-alt border border-cb-border">
            <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-cb-secondary mb-2 flex items-center justify-between">
              <span>Quick Demo Accounts</span>
              <span className="text-cb-forest font-normal">Click to fill</span>
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill("student@careerbridge.com", "Password123!")}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-cb-card border border-cb-border hover:border-cb-forest hover:bg-white text-[11px] font-medium text-cb-primary transition-all text-left group"
              >
                <GraduationCap className="w-3.5 h-3.5 text-cb-forest shrink-0" />
                <span className="truncate">Student</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("recruiter@google.com", "Password123!")}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-cb-card border border-cb-border hover:border-cb-forest hover:bg-white text-[11px] font-medium text-cb-primary transition-all text-left group"
              >
                <Building2 className="w-3.5 h-3.5 text-cb-forest shrink-0" />
                <span className="truncate">Recruiter</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("tpo@university.edu", "Password123!")}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-cb-card border border-cb-border hover:border-cb-forest hover:bg-white text-[11px] font-medium text-cb-primary transition-all text-left group"
              >
                <Landmark className="w-3.5 h-3.5 text-cb-forest shrink-0" />
                <span className="truncate">Admin / TPO</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">
                <span className="font-semibold">Authentication Error: </span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-cb-primary mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.edu"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary placeholder:text-cb-secondary/50 focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-cb-primary">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-cb-forest hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary placeholder:text-cb-secondary/50 focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest transition-all"
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-3.5 h-3.5 rounded border-cb-border text-cb-forest focus:ring-cb-forest"
                />
                <span className="text-xs text-cb-secondary select-none">Remember this browser</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-cb-forest text-cb-cream hover:bg-cb-dark text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cb-lime" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4 text-cb-lime transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Security badge notice */}
          <div className="mt-6 pt-4 border-t border-cb-border flex items-center justify-center gap-2 text-[11px] text-cb-secondary font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-cb-forest" />
            <span>Encrypted with Argon2id + Secure HttpOnly Cookies</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-cb-border py-4 px-6 text-center text-[11px] text-cb-secondary">
        <p>
          © 2026 CareerBridge. Intelligent Campus Placement & Career Guidance System.
        </p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cb-cream flex items-center justify-center p-4">
          <div className="flex items-center gap-2 text-cb-forest font-mono text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading CareerBridge Workspace...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
