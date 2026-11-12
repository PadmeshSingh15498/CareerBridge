"use client";

import React, { useState } from "react";
import Link from "next/link";
import { apiService } from "@/lib/api";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  KeyRound,
  ExternalLink,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiService.forgotPassword({ email });
      setIsSubmitted(true);
      if (res.data?.reset_token) {
        setResetToken(res.data.reset_token);
      }
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to initiate password reset. Please check your email.";
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
          </div>
        </Link>

        <Link
          href="/login"
          className="text-xs font-semibold text-cb-forest hover:text-cb-dark flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-cb-card border border-cb-border rounded-2xl shadow-sm p-6 sm:p-8">
          {!isSubmitted ? (
            <>
              <div className="mb-6">
                <div className="w-10 h-10 rounded-xl bg-cb-card-alt border border-cb-border flex items-center justify-center text-cb-forest mb-3">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h1 className="font-heading font-bold text-2xl text-cb-primary tracking-tight">
                  Reset Password
                </h1>
                <p className="text-xs text-cb-secondary mt-1 leading-relaxed">
                  Enter the email address registered with your CareerBridge account and we will generate a secure reset link.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-snug">
                    <span className="font-semibold">Notice: </span>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@careerbridge.com"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 px-4 bg-cb-forest text-cb-cream hover:bg-cb-dark text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 group cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cb-lime" />
                      <span>Sending Instructions...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Instructions</span>
                      <ArrowRight className="w-4 h-4 text-cb-lime transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="font-heading font-bold text-xl text-cb-primary mb-2">
                Check Your Inbox
              </h2>
              <p className="text-xs text-cb-secondary leading-relaxed mb-6">
                If an account exists for <strong className="text-cb-primary">{email}</strong>, we have dispatched a secure password reset link (valid for 15 minutes).
              </p>

              {resetToken && (
                <div className="mb-6 p-4 rounded-xl bg-cb-card-alt border border-cb-border text-left">
                  <p className="text-[10px] font-mono font-semibold text-cb-forest uppercase tracking-wider mb-1">
                    Development Environment Shortcut:
                  </p>
                  <p className="text-xs text-cb-secondary mb-3">
                    A test reset token was issued by the backend:
                  </p>
                  <Link
                    href={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cb-forest text-cb-cream rounded-md text-xs font-medium hover:bg-cb-dark transition-all"
                  >
                    <span>Proceed to Reset Password</span>
                    <ExternalLink className="w-3.5 h-3.5 text-cb-lime" />
                  </Link>
                </div>
              )}

              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cb-forest hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-cb-border py-4 px-6 text-center text-[11px] text-cb-secondary">
        <p>© 2026 CareerBridge. Intelligent Campus Placement & Career Guidance System.</p>
      </footer>
    </div>
  );
}

