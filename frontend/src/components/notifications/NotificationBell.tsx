"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  Settings,
  X,
  ExternalLink,
  Briefcase,
  Calendar,
  FileText,
  Award,
  Layers,
  Sparkles,
  RefreshCw
} from "lucide-react";

import { api } from "@/lib/api";

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  category: string;
  action_url?: string;
  is_read: boolean;
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

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prefModalOpen, setPrefModalOpen] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    email_notifications: true,
    job_recommendations: true,
    application_updates: true,
    interview_alerts: true,
    placement_drives: true,
    learning_milestones: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.getNotificationUnreadCount();
      if (res && res.data) {
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch {
      // Ignore if unauthenticated
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications({ page: 1, page_size: 15 });
      if (res && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const res = await api.getNotificationPreferences();
      if (res && res.data) {
        setPreferences({
          email_notifications: res.data.email_notifications,
          job_recommendations: res.data.job_recommendations,
          application_updates: res.data.application_updates,
          interview_alerts: res.data.interview_alerts,
          placement_drives: res.data.placement_drives,
          learning_milestones: res.data.learning_milestones,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      await api.updateNotificationPreferences(preferences);
      setPrefModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "interview_schedule":
      case "interview_reminder":
        return <Calendar className="w-3.5 h-3.5 text-cb-orange" />;
      case "application_status":
      case "new_applications":
        return <Briefcase className="w-3.5 h-3.5 text-cb-teal" />;
      case "placement_drive":
        return <Layers className="w-3.5 h-3.5 text-blue-400" />;
      case "resume_analysis":
        return <FileText className="w-3.5 h-3.5 text-purple-400" />;
      case "learning_milestone":
        return <Award className="w-3.5 h-3.5 text-cb-teal" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-cb-muted" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-cb-card border border-cb-border text-cb-secondary hover:text-cb-primary transition-colors focus:outline-none"
        title="View Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-cb-orange text-cb-bg text-[10px] font-mono font-bold flex items-center justify-center shadow-sm animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Flyout */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-cb-card border border-cb-border shadow-2xl z-50 overflow-hidden animate-fade-in flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="p-3.5 border-b border-cb-border flex items-center justify-between bg-cb-card-hover/40">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-cb-primary uppercase tracking-wider font-mono">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cb-orange/20 text-cb-orange font-semibold">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-1 text-[11px] font-mono text-cb-teal hover:underline flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Read all</span>
                </button>
              )}
              <button
                onClick={() => {
                  loadPreferences();
                  setPrefModalOpen(true);
                  setIsOpen(false);
                }}
                className="p-1 rounded text-cb-muted hover:text-cb-primary"
                title="Notification Preferences"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List of Alerts */}
          <div className="overflow-y-auto flex-1 divide-y divide-cb-border/40">
            {loading ? (
              <div className="py-12 text-center text-cb-muted font-mono text-xs flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 text-cb-teal animate-spin" />
                <span>Loading alerts...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-cb-muted font-mono text-xs">
                No notifications right now. You are all caught up!
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 transition-colors flex items-start gap-3 ${
                    n.is_read ? "bg-transparent hover:bg-cb-card-hover/40" : "bg-cb-teal/5 hover:bg-cb-teal/10"
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-cb-card border border-cb-border shrink-0 mt-0.5">
                    {getCategoryIcon(n.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs truncate ${n.is_read ? "font-medium text-cb-primary" : "font-bold text-cb-primary"}`}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] font-mono text-cb-muted shrink-0">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-cb-secondary line-clamp-2 mt-0.5">
                      {n.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                      {n.action_url ? (
                        <Link
                          href={n.action_url}
                          onClick={() => setIsOpen(false)}
                          className="text-cb-teal hover:underline flex items-center gap-1"
                        >
                          <span>Open details</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      ) : (
                        <span className="text-cb-muted capitalize">{n.category.replace("_", " ")}</span>
                      )}

                      {!n.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          className="text-cb-muted hover:text-cb-teal flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark read</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Notification Preferences */}
      {prefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-cb-card border border-cb-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-cb-border pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-cb-teal" />
                <h3 className="font-bold text-sm text-cb-primary">Notification Preferences</h3>
              </div>
              <button
                onClick={() => setPrefModalOpen(false)}
                className="text-cb-muted hover:text-cb-primary"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-3 text-xs">
              <p className="text-cb-secondary text-[11px]">
                Customize the notifications and alerts you receive across in-app activity and email.
              </p>

              <div className="space-y-2 pt-1">
                {[
                  { key: "email_notifications", label: "Email Notifications", desc: "Receive email summaries when configured" },
                  { key: "job_recommendations", label: "Job Recommendations", desc: "Alerts when new matching opportunities are posted" },
                  { key: "application_updates", label: "Application Status Updates", desc: "Stage changes, shortlisting, and employer decisions" },
                  { key: "interview_alerts", label: "Interview Scheduling & Reminders", desc: "Times, meeting links, and prep alerts" },
                  { key: "placement_drives", label: "Placement Drive Announcements", desc: "On-campus recruitment schedules and eligibility notices" },
                  { key: "learning_milestones", label: "Learning Roadmaps & Milestones", desc: "AI career guidance and practice feedback" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-cb-card-hover border border-cb-border/60 cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-cb-primary">{item.label}</div>
                      <div className="text-[10px] text-cb-muted">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={(preferences as any)[item.key]}
                      onChange={(e) =>
                        setPreferences({ ...preferences, [item.key]: e.target.checked })
                      }
                      className="rounded border-cb-border text-cb-teal focus:ring-0 w-4 h-4"
                    />
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-cb-border">
                <button
                  type="button"
                  onClick={() => setPrefModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-cb-card hover:bg-cb-card-hover border border-cb-border font-mono text-cb-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPrefs}
                  className="px-4 py-1.5 rounded-lg bg-cb-teal text-cb-bg hover:bg-cb-teal/90 font-mono font-semibold text-xs"
                >
                  {savingPrefs ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

