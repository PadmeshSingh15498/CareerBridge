"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiService } from "@/lib/api";
import {
  CheckCircle2,
  ShieldAlert,
  Loader2,
  ArrowRight,
  MailCheck,
} from "lucide-react";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [status, setStatus] = useState<"verifying" | "success" | "error" | "input">(
    tokenFromUrl ? "verifying" : "input"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performVerification = async (verifyToken: string) => {
    setStatus("verifying");
    setErrorMessage(null);
    try {
      await apiService.verifyEmail({ token: verifyToken });
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "The verification link is invalid, expired, or has already been used.";
      setErrorMessage(msg);
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      performVerification(tokenFromUrl);
    }
  }, [tokenFromUrl]);

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
          className="text-xs font-semibold text-cb-forest hover:text-cb-dark"
        >
          Sign In
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-cb-card border border-cb-border rounded-2xl shadow-sm p-6 sm:p-8 text-center">
          {status === "verifying" && (
            <div className="py-8">
              <Loader2 className="w-10 h-10 animate-spin text-cb-forest mx-auto mb-4" />
              <h2 className="font-heading font-bold text-xl text-cb-primary mb-2">
                Verifying Email Address
              </h2>
              <p className="text-xs text-cb-secondary">
                Confirming your institutional email credentials with CareerBridge identity services...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="font-heading font-bold text-xl text-cb-primary mb-2">
                Email Successfully Verified
              </h2>
              <p className="text-xs text-cb-secondary leading-relaxed mb-6">
                Your account is now verified. You can access all campus recruitment and career intelligence features.
              </p>
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-cb-forest text-cb-cream rounded-lg text-xs font-semibold hover:bg-cb-dark transition-all"
              >
                <span>Continue to Sign In</span>
                <ArrowRight className="w-4 h-4 text-cb-lime" />
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="py-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="font-heading font-bold text-xl text-cb-primary mb-2">
                Verification Failed
              </h2>
              <p className="text-xs text-cb-secondary leading-relaxed mb-6">
                {errorMessage}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setStatus("input")}
                  className="px-4 py-2 border border-cb-border text-xs font-medium rounded-lg hover:bg-cb-card-alt text-cb-primary"
                >
                  Enter Token Manually
                </button>
                <Link
                  href="/login"
                  className="px-4 py-2 bg-cb-forest text-cb-cream text-xs font-semibold rounded-lg hover:bg-cb-dark"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          )}

          {status === "input" && (
            <div className="py-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-cb-card-alt border border-cb-border flex items-center justify-center text-cb-forest mb-3">
                <MailCheck className="w-5 h-5" />
              </div>
              <h1 className="font-heading font-bold text-xl text-cb-primary tracking-tight mb-1">
                Enter Verification Token
              </h1>
              <p className="text-xs text-cb-secondary mb-4 leading-relaxed">
                Paste the verification token received in your confirmation email.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (token) performVerification(token);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-cb-primary mb-1.5">
                    Token String
                  </label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    required
                    className="w-full px-3 py-2 bg-white border border-cb-border rounded-lg text-xs text-cb-primary font-mono focus:outline-none focus:border-cb-forest focus:ring-1 focus:ring-cb-forest"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-cb-forest text-cb-cream hover:bg-cb-dark text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Verify Account</span>
                  <ArrowRight className="w-4 h-4 text-cb-lime" />
                </button>
              </form>
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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cb-cream flex items-center justify-center p-4">
          <div className="flex items-center gap-2 text-cb-forest font-mono text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Verifying email token...</span>
          </div>
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
