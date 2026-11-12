"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiService } from "@/lib/api";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!token) {
      setErrorMsg("A valid reset token is required. Please check your reset link.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.resetPassword({
        token,
        new_password: newPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to reset password. The token may be expired or invalid.";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cb-cream flex flex-col justify-between selection:bg-cb-lime/30 selection:text-cb-primary">
      {/* Header */}
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
          {!isSuccess ? (
            <>
              <div className="mb-6">
                <div className="w-10 h-10 rounded-xl bg-cb-card-alt border border-cb-border flex items-center justify-center text-cb-forest mb-3">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h1 className="font-heading font-bold text-2xl text-cb-primary tracking-tight">
                  Choose New Password
                </h1>
                <p className="text-xs text-cb-secondary mt-1 leading-relaxed">
                  Enter your verified reset token and configure your new secure password.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-snug">
                    <span className="font-semibold">Reset Failed: </span>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!tokenFromUrl && (
                  <div>
                    <label className="block text-xs font-semibold text-cb-primary mb-1.5">
                      Reset Token
                    </label>
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste your reset token"
                      required
                      className="w-full px-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary font-mono focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1.5">
                    New Password (min 8 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
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

                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-cb-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
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
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset & Save Password</span>
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
                Password Successfully Reset
              </h2>
              <p className="text-xs text-cb-secondary leading-relaxed mb-6">
                Your credentials have been re-encrypted with Argon2id and your active sessions have been secured.
              </p>
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-cb-forest text-cb-cream rounded-lg text-xs font-semibold hover:bg-cb-dark transition-all"
              >
                <span>Sign In with New Password</span>
                <ArrowRight className="w-4 h-4 text-cb-lime" />
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cb-cream flex items-center justify-center p-4">
          <div className="flex items-center gap-2 text-cb-forest font-mono text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading Password Reset Workspace...</span>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
