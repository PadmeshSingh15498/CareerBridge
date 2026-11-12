"use client";

import { useEffect, useState } from "react";
import { apiService } from "@/lib/api";
import { HealthCheckData } from "@/types";

export const HealthBadge = () => {
  const [health, setHealth] = useState<HealthCheckData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    apiService
      .getHealth()
      .then((res) => {
        if (isMounted && res.data) {
          setHealth(res.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError("API Offline");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        Connecting to Backend...
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
        Backend Offline
      </div>
    );
  }

  const isHealthy = health.status === "healthy";
  const dbDialect = health.database?.dialect?.toUpperCase() || "DB";

  return (
    <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span>
        FastAPI v{health.version} • <strong className="font-semibold">{dbDialect}</strong> Connected
      </span>
    </div>
  );
};

