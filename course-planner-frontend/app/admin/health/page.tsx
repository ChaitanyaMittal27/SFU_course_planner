"use client";

import { useEffect, useState, useCallback } from "react";
import { Server, Database, GraduationCap, BarChart3, Mail, RefreshCw } from "lucide-react";
import { api, ServiceHealthCheck } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorMessage from "@/components/ErrorMessage";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";

const serviceIcons: Record<string, typeof Server> = {
  api: Server,
  database: Database,
  coursesys: GraduationCap,
  coursediggers: BarChart3,
  resend: Mail,
};

const serviceLabels: Record<string, string> = {
  api: "API",
  database: "Database",
  coursesys: "CourseSys",
  coursediggers: "CourseDiggers",
  resend: "Resend",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function AdminHealthPage() {
  const [checks, setChecks] = useState<ServiceHealthCheck[]>([]);
  const [lastChecked, setLastChecked] = useState<Record<string, Date>>({});
  const [loading, setLoading] = useState(true);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [refreshingService, setRefreshingService] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const results = await api.getHealthStatus();
      setChecks(results);
      const now = new Date();
      const timestamps: Record<string, Date> = {};
      results.forEach((r) => { timestamps[r.service] = now; });
      setLastChecked(timestamps);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch health status";
      setError(message);
    }
  }, []);

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    await fetchAll();
    setRefreshingAll(false);
  };

  const handleRefreshService = async (service: string) => {
    setRefreshingService(service);
    try {
      const results = await api.getServiceHealth(service);
      if (results.length > 0) {
        setChecks((prev) => prev.map((c) => (c.service === service ? results[0] : c)));
        setLastChecked((prev) => ({ ...prev, [service]: new Date() }));
      }
    } catch (err) {
      console.error(`Failed to recheck ${service}:`, err);
    } finally {
      setRefreshingService(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 max-w-[1180px]">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-5">
              <CardContent className="p-0 space-y-3">
                <Skeleton className="h-9 w-9 rounded-[9px]" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-36" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && checks.length === 0) {
    return (
      <div className="flex-1 p-8 max-w-[1180px]">
        <ErrorMessage message={error} onRetry={handleRefreshAll} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 max-w-[1180px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className={`${displayStyles.sm} text-text-primary mb-1`}>System Health</h1>
          <p className={`${bodyStyles.md} text-text-muted`}>
            Live status checks for all external services and infrastructure.
          </p>
        </div>
        <Button
          onClick={handleRefreshAll}
          disabled={refreshingAll}
          className="gap-2 mt-4 sm:mt-0 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${refreshingAll ? "animate-spin" : ""}`} />
          Refresh All
        </Button>
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {checks.map((check) => {
          const Icon = serviceIcons[check.service] || Server;
          const label = serviceLabels[check.service] || check.service;
          const isUp = check.status === "up";
          const isRefreshing = refreshingService === check.service;
          const checkedAt = lastChecked[check.service];

          return (
            <Card key={check.service} className="p-5">
              <CardContent className="p-0">
                {/* Icon + status row */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-[9px] border flex items-center justify-center ${
                    isUp
                      ? "text-success bg-success/10 border-success/20"
                      : "text-destructive bg-destructive/10 border-destructive/20"
                  }`}>
                    <Icon className="w-[17px] h-[17px]" />
                  </div>
                  <Badge className={
                    isUp
                      ? "bg-success/15 text-success border-transparent"
                      : "bg-destructive/15 text-destructive border-transparent"
                  }>
                    {isUp ? "Operational" : "Down"}
                  </Badge>
                </div>

                {/* Service name */}
                <h3 className={`${headerStyles.xs} text-text-primary mb-3`}>{label}</h3>

                {/* Details */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between">
                    <span className={`${labelStyles.md} text-text-muted`}>Latency</span>
                    <span className={`${labelStyles.md} font-mono text-text-primary`}>{check.latencyMs}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`${labelStyles.md} text-text-muted`}>Endpoint</span>
                    <span className={`${labelStyles.sm} font-mono text-text-subtle`}>{check.url}</span>
                  </div>
                  {checkedAt && (
                    <div className="flex items-center justify-between">
                      <span className={`${labelStyles.md} text-text-muted`}>Checked</span>
                      <span className={`${labelStyles.sm} font-mono text-text-subtle`}>{formatTime(checkedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Recheck button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRefreshService(check.service)}
                  disabled={isRefreshing}
                  className="w-full gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  Recheck
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
