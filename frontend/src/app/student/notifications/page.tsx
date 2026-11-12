"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
  Calendar,
  Compass,
  Settings,
  Filter,
  Check,
  ExternalLink,
  Clock,
  Sparkles,
  Mail,
  Shield,
  Loader2,
} from "lucide-react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { api } from "@/lib/api";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  category: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

interface Preferences {
  email_notifications: boolean;
  job_recommendations: boolean;
  application_updates: boolean;
  interview_alerts: boolean;
  placement_drives: boolean;
  learning_milestones: boolean;
}

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterReadStatus, setFilterReadStatus] = useState<"all" | "unread" | "read">("all");

  // Preferences
  const [showPreferences, setShowPreferences] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>({
    email_notifications: true,
    job_recommendations: true,
    application_updates: true,
    interview_alerts: true,
    placement_drives: true,
    learning_milestones: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefSaveSuccess, setPrefSaveSuccess] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page_size: 50 };
      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }
      if (filterReadStatus === "unread") {
        params.is_read = false;
      } else if (filterReadStatus === "read") {
        params.is_read = true;
      }

      const res = await api.getNotifications(params);
      setNotifications(res.items || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err: any) {
      console.error("Failed to load notifications:", err);
      setError("Unable to load notifications. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const data = await api.getNotificationPreferences();
      setPrefs({
        email_notifications: Boolean(data.email_notifications),
        job_recommendations: Boolean(data.job_recommendations),
        application_updates: Boolean(data.application_updates),
        interview_alerts: Boolean(data.interview_alerts),
        placement_drives: Boolean(data.placement_drives),
        learning_milestones: Boolean(data.learning_milestones),
      });
    } catch (err) {
      console.warn("Using default notification preferences");
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [selectedCategory, filterReadStatus]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSavingPrefs(true);
      setPrefSaveSuccess(false);
      await api.updateNotificationPreferences(prefs);
      setPrefSaveSuccess(true);
      setTimeout(() => setPrefSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save preferences:", err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "job_recommendation":
        return <Briefcase className="w-4 h-4 text-emerald-600" />;
      case "application_status":
        return <Layers className="w-4 h-4 text-blue-600" />;
      case "interview_schedule":
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case "placement_drive":
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case "learning_milestone":
        return <Compass className="w-4 h-4 text-teal-600" />;
      default:
        return <Bell className="w-4 h-4 text-cb-forest" />;
    }
  };

  const formatTimestamp = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <WorkspaceShell role="student" activeTabTitle="Notifications & Alerts">
      {/* Top Banner & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cb-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-heading text-cb-primary tracking-tight">
              Notifications & Alerts
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cb-forest text-white">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-cb-secondary mt-1">
            Real-time campus placement drives, application status updates, interview schedules, and personalized AI alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cb-card border border-cb-border hover:bg-cb-card-alt text-cb-primary transition"
            >
              <Check className="w-3.5 h-3.5 text-cb-forest" />
              <span>Mark All Read</span>
            </button>
          )}

          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              showPreferences
                ? "bg-cb-forest text-white border-cb-forest"
                : "bg-cb-card border-cb-border hover:bg-cb-card-alt text-cb-primary"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </button>
        </div>
      </div>

      {/* Preferences Drawer / Modal Card */}
      {showPreferences && (
        <div className="p-5 bg-cb-card border border-cb-forest/30 rounded-xl shadow-sm space-y-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cb-forest" />
              <h2 className="text-sm font-bold text-cb-primary">Notification Channels & Categories</h2>
            </div>
            {prefSaveSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved successfully
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="flex items-center gap-3 p-3 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
              <input
                type="checkbox"
                checked={prefs.email_notifications}
                onChange={(e) => setPrefs({ ...prefs, email_notifications: e.target.checked })}
                className="w-4 h-4 accent-cb-forest rounded"
              />
              <div className="text-xs">
                <span className="font-semibold text-cb-primary block">Email Notifications</span>
                <span className="text-cb-secondary text-[11px]">Send critical alerts to registered email</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
              <input
                type="checkbox"
                checked={prefs.application_updates}
                onChange={(e) => setPrefs({ ...prefs, application_updates: e.target.checked })}
                className="w-4 h-4 accent-cb-forest rounded"
              />
              <div className="text-xs">
                <span className="font-semibold text-cb-primary block">Application Stage Updates</span>
                <span className="text-cb-secondary text-[11px]">Shortlisted, interview calls, offers</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
              <input
                type="checkbox"
                checked={prefs.interview_alerts}
                onChange={(e) => setPrefs({ ...prefs, interview_alerts: e.target.checked })}
                className="w-4 h-4 accent-cb-forest rounded"
              />
              <div className="text-xs">
                <span className="font-semibold text-cb-primary block">Interview Scheduling</span>
                <span className="text-cb-secondary text-[11px]">Date, venue, mode & prep reminders</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
              <input
                type="checkbox"
                checked={prefs.placement_drives}
                onChange={(e) => setPrefs({ ...prefs, placement_drives: e.target.checked })}
                className="w-4 h-4 accent-cb-forest rounded"
              />
              <div className="text-xs">
                <span className="font-semibold text-cb-primary block">Campus Placement Drives</span>
                <span className="text-cb-secondary text-[11px]">Eligibility matching & drive registrations</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
              <input
                type="checkbox"
                checked={prefs.job_recommendations}
                onChange={(e) => setPrefs({ ...prefs, job_recommendations: e.target.checked })}
                className="w-4 h-4 accent-cb-forest rounded"
              />
              <div className="text-xs">
                <span className="font-semibold text-cb-primary block">AI Job Recommendations</span>
                <span className="text-cb-secondary text-[11px]">Matches exceeding 75% compatibility</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-cb-bg border border-cb-border rounded-lg cursor-pointer hover:border-cb-forest/40 transition">
              <input
                type="checkbox"
                checked={prefs.learning_milestones}
                onChange={(e) => setPrefs({ ...prefs, learning_milestones: e.target.checked })}
                className="w-4 h-4 accent-cb-forest rounded"
              />
              <div className="text-xs">
                <span className="font-semibold text-cb-primary block">Learning Milestones</span>
                <span className="text-cb-secondary text-[11px]">Skill gap progress & roadmap achievements</span>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSavePreferences}
              disabled={savingPrefs}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-cb-forest text-white hover:bg-cb-forest/90 transition flex items-center gap-2 disabled:opacity-50"
            >
              {savingPrefs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {[
            { id: "all", label: "All Alerts" },
            { id: "application_status", label: "Applications" },
            { id: "interview_schedule", label: "Interviews" },
            { id: "placement_drive", label: "Campus Drives" },
            { id: "job_recommendation", label: "Job Matches" },
            { id: "learning_milestone", label: "Learning" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? "bg-cb-forest text-white font-semibold shadow-xs"
                  : "bg-cb-card border border-cb-border text-cb-secondary hover:text-cb-primary hover:bg-cb-card-alt"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Read / Unread Filter */}
        <div className="flex items-center gap-1 bg-cb-card border border-cb-border rounded-lg p-1 self-start sm:self-auto shrink-0">
          {(["all", "unread", "read"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterReadStatus(status)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition ${
                filterReadStatus === status
                  ? "bg-cb-forest text-white font-semibold"
                  : "text-cb-secondary hover:text-cb-primary"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Stream */}
      {loading ? (
        <div className="p-12 text-center bg-cb-card border border-cb-border rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-cb-forest mx-auto mb-2" />
          <p className="text-xs text-cb-secondary">Retrieving notification feed...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center text-xs text-red-600">
          <p>{error}</p>
          <button
            onClick={fetchNotifications}
            className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center bg-cb-card border border-dashed border-cb-border rounded-xl">
          <Bell className="w-10 h-10 text-cb-secondary/40 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-cb-primary mb-1">No notifications found</h3>
          <p className="text-xs text-cb-secondary max-w-sm mx-auto">
            {selectedCategory !== "all" || filterReadStatus !== "all"
              ? "No alerts match your active filter criteria."
              : "You're all caught up! New application updates and campus drive invitations will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                item.is_read
                  ? "bg-cb-card border-cb-border opacity-85 hover:opacity-100"
                  : "bg-cb-card border-cb-forest/40 shadow-xs"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    item.is_read ? "bg-cb-bg" : "bg-cb-forest/10 border border-cb-forest/20"
                  }`}
                >
                  {getCategoryIcon(item.category)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-cb-primary">{item.title}</span>
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-cb-forest shrink-0 animate-pulse" />
                    )}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cb-bg border border-cb-border text-cb-secondary uppercase">
                      {item.category.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-xs text-cb-secondary mt-1 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-cb-secondary">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(item.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {item.action_url && (
                  <Link
                    href={item.action_url}
                    onClick={() => {
                      if (!item.is_read) handleMarkAsRead(item.id);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cb-forest text-white hover:bg-cb-forest/90 transition shadow-xs"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}

                {!item.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    className="p-1.5 rounded-lg border border-cb-border hover:bg-cb-card-alt text-cb-secondary hover:text-cb-primary transition"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}
