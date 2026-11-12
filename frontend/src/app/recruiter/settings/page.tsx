"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  Bell,
  Calendar,
  ShieldCheck,
  Video,
  Save,
  CheckCircle2,
  User,
  KeyRound,
  LogOut,
  Check,
  Loader2,
} from "lucide-react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export default function RecruiterSettingsPage() {
  const { user, logout } = useAuth();

  // Notification Preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [applicationAlerts, setApplicationAlerts] = useState(true);
  const [interviewAlerts, setInterviewAlerts] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState(false);

  // Integrations
  const [googleMeetEnabled, setGoogleMeetEnabled] = useState(true);
  const [zoomEnabled, setZoomEnabled] = useState(false);
  const [autoArchiveDays, setAutoArchiveDays] = useState(30);

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const data = await api.getNotificationPreferences();
        setEmailAlerts(Boolean(data.email_notifications));
        setApplicationAlerts(Boolean(data.application_updates));
        setInterviewAlerts(Boolean(data.interview_alerts));
      } catch (e) {
        // use defaults
      }
    };
    loadPrefs();
  }, []);

  const handleSavePreferences = async () => {
    try {
      setSavingPrefs(true);
      setPrefSuccess(false);
      await api.updateNotificationPreferences({
        email_notifications: emailAlerts,
        application_updates: applicationAlerts,
        interview_alerts: interviewAlerts,
      });
      setPrefSuccess(true);
      setTimeout(() => setPrefSuccess(false), 3000);
    } catch (e) {
      console.error("Save preferences failed:", e);
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <WorkspaceShell role="recruiter" activeTabTitle="Settings & Preferences">
      <div className="pb-4 border-b border-cb-border">
        <h1 className="text-2xl font-bold font-heading text-cb-primary tracking-tight">
          Recruiter Workspace Settings
        </h1>
        <p className="text-xs text-cb-secondary mt-1">
          Configure talent acquisition alerts, video interview integrations, and corporate account preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate Alerts & Notifications */}
          <div className="bg-cb-card border border-cb-border rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cb-forest/10 text-cb-forest">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-cb-primary">Pipeline & Application Alerts</h2>
                  <p className="text-[11px] text-cb-secondary">
                    Configure notifications when candidates apply or interview rounds complete.
                  </p>
                </div>
              </div>
              {prefSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-cb-primary block">
                    Immediate Email Notification on Application
                  </span>
                  <span className="text-[11px] text-cb-secondary block">
                    Receive alert emails whenever a candidate submits an application exceeding 80% match
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 accent-cb-forest rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-cb-primary block">
                    Applicant Stage Changes & Notes
                  </span>
                  <span className="text-[11px] text-cb-secondary block">
                    Notify team members when candidate status moves across pipeline columns
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={applicationAlerts}
                  onChange={(e) => setApplicationAlerts(e.target.checked)}
                  className="w-4 h-4 accent-cb-forest rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-cb-primary block">
                    Interview Feedback Submission Alerts
                  </span>
                  <span className="text-[11px] text-cb-secondary block">
                    Alert recruitment leads immediately when interviewers submit structured rubrics
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={interviewAlerts}
                  onChange={(e) => setInterviewAlerts(e.target.checked)}
                  className="w-4 h-4 accent-cb-forest rounded"
                />
              </label>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSavePreferences}
                  disabled={savingPrefs}
                  className="px-5 py-2 rounded-lg bg-cb-forest text-white text-xs font-semibold hover:bg-cb-forest/90 transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingPrefs ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Notification Preferences</span>
                </button>
              </div>
            </div>
          </div>

          {/* Calendar & Video Integrations */}
          <div className="bg-cb-card border border-cb-border rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cb-forest/10 text-cb-forest">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-cb-primary">Interview Meeting Rooms & Calendar</h2>
                <p className="text-[11px] text-cb-secondary">
                  Default meeting provider for automatically generated candidate interview invitations.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-cb-primary block">
                    Google Meet Integration (Active)
                  </span>
                  <span className="text-[11px] text-cb-secondary block">
                    Auto-generate secure Google Meet video links with calendar event sync
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={googleMeetEnabled}
                  onChange={(e) => setGoogleMeetEnabled(e.target.checked)}
                  className="w-4 h-4 accent-cb-forest rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-cb-primary block">
                    Zoom Workplace Integration
                  </span>
                  <span className="text-[11px] text-cb-secondary block">
                    Generate Zoom room links using corporate SSO credentials
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={zoomEnabled}
                  onChange={(e) => setZoomEnabled(e.target.checked)}
                  className="w-4 h-4 accent-cb-forest rounded"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Col */}
        <div className="space-y-6">
          {/* Identity & Company */}
          <div className="bg-cb-card border border-cb-border rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-cb-border">
              <Building2 className="w-4 h-4 text-cb-forest" />
              <h2 className="text-sm font-bold text-cb-primary">Recruiting Organization</h2>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-mono text-cb-secondary uppercase block">Recruiter Name</span>
                <span className="font-semibold text-cb-primary">{user?.full_name || "Priya Sharma"}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-cb-secondary uppercase block">Company Name</span>
                <span className="font-semibold text-cb-primary">{user?.details?.company_name || "Google Cloud"}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-cb-secondary uppercase block">Corporate Email</span>
                <span className="font-mono text-cb-primary">{user?.email || "recruiter@google.com"}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-cb-secondary uppercase block">Verification Status</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Approved Organization</span>
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => logout()}
                className="w-full py-2 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Recruiter Portal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
