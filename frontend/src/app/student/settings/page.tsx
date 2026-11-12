"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Bell,
  Shield,
  User,
  KeyRound,
  CheckCircle2,
  Mail,
  Smartphone,
  Save,
  Check,
  Loader2,
  AlertCircle,
  Eye,
  LogOut,
} from "lucide-react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

interface NotificationPreferences {
  email_notifications: boolean;
  job_recommendations: boolean;
  application_updates: boolean;
  interview_alerts: boolean;
  placement_drives: boolean;
  learning_milestones: boolean;
}

export default function StudentSettingsPage() {
  const { user, logout } = useAuth();

  // Notification Preferences State
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    email_notifications: true,
    job_recommendations: true,
    application_updates: true,
    interview_alerts: true,
    placement_drives: true,
    learning_milestones: true,
  });
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState(false);

  // Privacy toggles
  const [recruiterDiscovery, setRecruiterDiscovery] = useState(true);
  const [shareScoresWithTPO, setShareScoresWithTPO] = useState(true);

  // Security Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        setLoadingPrefs(true);
        const data = await api.getNotificationPreferences();
        setPrefs({
          email_notifications: Boolean(data.email_notifications),
          job_recommendations: Boolean(data.job_recommendations),
          application_updates: Boolean(data.application_updates),
          interview_alerts: Boolean(data.interview_alerts),
          placement_drives: Boolean(data.placement_drives),
          learning_milestones: Boolean(data.learning_milestones),
        });
      } catch (e) {
        console.warn("Could not fetch notification preferences, using defaults");
      } finally {
        setLoadingPrefs(false);
      }
    };
    fetchPrefs();
  }, []);

  const handleSavePreferences = async () => {
    try {
      setSavingPrefs(true);
      setPrefSuccess(false);
      await api.updateNotificationPreferences(prefs);
      setPrefSuccess(true);
      setTimeout(() => setPrefSuccess(false), 3000);
    } catch (e) {
      console.error("Failed to save preferences:", e);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    // Successfully validated
    setPasswordSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSuccess(false), 4000);
  };

  return (
    <WorkspaceShell role="student" activeTabTitle="Settings & Preferences">
      <div className="pb-4 border-b border-cb-border">
        <h1 className="text-2xl font-bold font-heading text-cb-primary tracking-tight">
          Account Settings & Preferences
        </h1>
        <p className="text-xs text-cb-secondary mt-1">
          Manage your notification channels, placement privacy permissions, and authentication credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Preferences & Privacy */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notification Preferences Card */}
          <div className="bg-cb-card border border-cb-border rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cb-forest/10 text-cb-forest">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-cb-primary">Notification Settings</h2>
                  <p className="text-[11px] text-cb-secondary">
                    Control which alerts trigger in-app banners and email notifications.
                  </p>
                </div>
              </div>
              {prefSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>

            {loadingPrefs ? (
              <div className="p-6 text-center text-xs text-cb-secondary">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-cb-forest" />
                Loading preferences...
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3.5 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-cb-primary block">
                      Email Notification Delivery
                    </span>
                    <span className="text-[11px] text-cb-secondary block">
                      Send interview schedules and campus drive announcements to your registered email
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.email_notifications}
                    onChange={(e) =>
                      setPrefs({ ...prefs, email_notifications: e.target.checked })
                    }
                    className="w-4 h-4 accent-cb-forest rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-cb-primary block">
                      Application Status Updates
                    </span>
                    <span className="text-[11px] text-cb-secondary block">
                      Alerts when your job application is reviewed, shortlisted, or scheduled
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.application_updates}
                    onChange={(e) =>
                      setPrefs({ ...prefs, application_updates: e.target.checked })
                    }
                    className="w-4 h-4 accent-cb-forest rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-cb-primary block">
                      Interview Schedule Reminders
                    </span>
                    <span className="text-[11px] text-cb-secondary block">
                      Countdown reminders 2 hours and 15 minutes before scheduled interview rounds
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.interview_alerts}
                    onChange={(e) =>
                      setPrefs({ ...prefs, interview_alerts: e.target.checked })
                    }
                    className="w-4 h-4 accent-cb-forest rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-cb-primary block">
                      Campus Placement Drives
                    </span>
                    <span className="text-[11px] text-cb-secondary block">
                      Immediate alerts whenever your university announces an eligible placement drive
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.placement_drives}
                    onChange={(e) =>
                      setPrefs({ ...prefs, placement_drives: e.target.checked })
                    }
                    className="w-4 h-4 accent-cb-forest rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-cb-primary block">
                      Intelligent Job Matches
                    </span>
                    <span className="text-[11px] text-cb-secondary block">
                      Weekly digest of jobs exceeding 75% skill and academic compatibility
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.job_recommendations}
                    onChange={(e) =>
                      setPrefs({ ...prefs, job_recommendations: e.target.checked })
                    }
                    className="w-4 h-4 accent-cb-forest rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-cb-primary block">
                      Learning Milestones & Skill Gaps
                    </span>
                    <span className="text-[11px] text-cb-secondary block">
                      Recommendations when target role taxonomies are updated or skills are acquired
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.learning_milestones}
                    onChange={(e) =>
                      setPrefs({ ...prefs, learning_milestones: e.target.checked })
                    }
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
            )}
          </div>

          {/* Placement Privacy & Visibility Card */}
          <div className="bg-cb-card border border-cb-border rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cb-forest/10 text-cb-forest">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-cb-primary">Placement Privacy & Visibility</h2>
                <p className="text-[11px] text-cb-secondary">
                  Configure who can discover your candidate profile in talent searches.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-cb-primary block">
                    Verified Recruiter Discovery
                  </span>
                  <span className="text-[11px] text-cb-secondary block">
                    Allow verified enterprise recruiters to view your profile and invite you to apply
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={recruiterDiscovery}
                  onChange={(e) => setRecruiterDiscovery(e.target.checked)}
                  className="w-4 h-4 accent-cb-forest rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-cb-primary block">
                    University Placement Cell Analytics
                  </span>
                  <span className="text-[11px] text-cb-secondary block">
                    Share your ATS resume score and mock interview readiness with your department TPO
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={shareScoresWithTPO}
                  onChange={(e) => setShareScoresWithTPO(e.target.checked)}
                  className="w-4 h-4 accent-cb-forest rounded"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Profile Summary & Security */}
        <div className="space-y-6">
          {/* Active Account Identity Card */}
          <div className="bg-cb-card border border-cb-border rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-cb-border">
              <User className="w-4 h-4 text-cb-forest" />
              <h2 className="text-sm font-bold text-cb-primary">Account Identity</h2>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-mono text-cb-secondary uppercase block">Full Name</span>
                <span className="font-semibold text-cb-primary">{user?.full_name || "Aditya Sharma"}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-cb-secondary uppercase block">Email Address</span>
                <span className="font-mono text-cb-primary">{user?.email || "student@careerbridge.com"}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-cb-secondary uppercase block">Platform Role</span>
                <span className="font-mono px-2 py-0.5 rounded-full bg-cb-forest/10 text-cb-forest font-semibold text-[10px] uppercase">
                  {user?.role || "student"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-cb-secondary uppercase block">Department</span>
                <span className="text-cb-primary">{user?.details?.department || "Computer Science & Engineering"}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => logout()}
                className="w-full py-2 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of CareerBridge</span>
              </button>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-cb-card border border-cb-border rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-cb-border">
              <KeyRound className="w-4 h-4 text-cb-forest" />
              <h2 className="text-sm font-bold text-cb-primary">Update Password</h2>
            </div>

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Password updated successfully.</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-cb-border bg-cb-bg text-cb-primary focus:outline-none focus:border-cb-forest"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-cb-border bg-cb-bg text-cb-primary focus:outline-none focus:border-cb-forest"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-cb-primary mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-cb-border bg-cb-bg text-cb-primary focus:outline-none focus:border-cb-forest"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-cb-card-alt border border-cb-border text-cb-primary hover:bg-cb-card text-xs font-semibold transition"
                >
                  Update Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
