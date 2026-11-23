"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api, ServiceHealthCheck } from "@/lib/api";
import { Button } from "@/components/ui/button";
import SectionCard, { cardPadding } from "@/components/course/SectionCard";
import { AdminPage, AdminPageHeader } from "@/components/admin/AdminPage";
import AdminPageSkeleton from "@/components/admin/AdminPageSkeleton";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { healthServicePresentation } from "@/components/admin/health-services";
import { bodyStyles, headerStyles, labelStyles, numericStyles } from "@/app/fonts";
import { cn } from "@/lib/utils";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminHealthPage() {
  const [checks, setChecks] = useState<ServiceHealthCheck[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Record<string, Date>>({});
  const [loading, setLoading] = useState(true);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [refreshingService, setRefreshingService] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serviceErrors, setServiceErrors] = useState<Record<string, string>>({});

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const results = await api.getHealthStatus();
      const refreshedAt = new Date();

      setChecks(results);
      setLastRefreshed(Object.fromEntries(results.map((result) => [result.service, refreshedAt])));
      setServiceErrors({});
    } catch (requestError: unknown) {
      setError(errorMessage(requestError, "Failed to fetch health status"));
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
    setServiceErrors((current) => ({ ...current, [service]: "" }));

    try {
      const [result] = await api.getServiceHealth(service);
      if (!result) {
        throw new Error("The health service returned no result.");
      }

      setChecks((current) => current.map((check) => (check.service === service ? result : check)));
      setLastRefreshed((current) => ({ ...current, [service]: new Date() }));
    } catch (requestError: unknown) {
      setServiceErrors((current) => ({
        ...current,
        [service]: errorMessage(requestError, `Failed to recheck ${service}`),
      }));
    } finally {
      setRefreshingService(null);
    }
  };

  if (loading) {
    return <AdminPageSkeleton hasTable tableRows={5} />;
  }

  const actions = (
    <Button type="button" onClick={handleRefreshAll} disabled={refreshingAll} className="gap-2">
      <RefreshCw className={refreshingAll ? "animate-spin" : ""} aria-hidden="true" />
      Refresh all
    </Button>
  );

  if (error && checks.length === 0) {
    return (
      <AdminPage>
        <AdminPageHeader title="System health" description="Live status checks for external services and infrastructure." actions={actions} />
        <ErrorMessage message={error} onRetry={handleRefreshAll} />
      </AdminPage>
    );
  }

  const upCount = checks.filter((check) => check.status === "up").length;

  return (
    <AdminPage>
      <AdminPageHeader title="System health" description="Live status checks for external services and infrastructure." actions={actions} />

      {error && <ErrorMessage className="mb-6" message={error} onRetry={handleRefreshAll} />}

      <SectionCard title="Services" note={checks.length > 0 ? `${upCount} of ${checks.length} up` : undefined} flush={checks.length > 0}>
        {checks.length === 0 ? (
          <>
            <p className={cn(headerStyles.sm, "text-text-primary")}>No health checks configured</p>
            <p className={cn(bodyStyles.md, "mt-1 text-text-muted")}>No service checks were returned by the API.</p>
          </>
        ) : (
          <ul>
            {checks.map((check) => {
              const { label } = healthServicePresentation(check.service);
              const isUp = check.status === "up";
              const isRefreshing = refreshingService === check.service;
              const refreshedAt = lastRefreshed[check.service];
              const serviceError = serviceErrors[check.service];

              return (
                <li key={check.service} className={cn(cardPadding, "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-t border-border first:border-t-0 sm:grid-cols-[minmax(0,1fr)_6rem_5rem_7rem_auto]")}>
                  <div className="min-w-0">
                    <h2 className={cn(headerStyles.xs, "text-text-primary")}>{label}</h2>
                    <p className={cn(numericStyles.sm, "truncate text-text-subtle")}>{check.url}</p>
                    {serviceError && (
                      <p className={cn(bodyStyles.sm, "mt-1 text-destructive-text")} role="status">
                        {serviceError}
                      </p>
                    )}
                  </div>
                  <span className={cn(labelStyles.md, "justify-self-start rounded-full px-2 py-0.5", isUp ? "bg-success-tint text-success-text" : "bg-destructive-tint text-destructive-text")}>
                    {isUp ? "Operational" : "Down"}
                  </span>
                  <span className={cn(numericStyles.md, "text-text-primary")} aria-label={`Latency ${check.latencyMs} milliseconds`}>
                    {check.latencyMs}ms
                  </span>
                  <span className={cn(numericStyles.sm, "text-text-subtle")}>{refreshedAt ? formatTime(refreshedAt) : "—"}</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => handleRefreshService(check.service)} disabled={isRefreshing} className="gap-1.5">
                    <RefreshCw className={isRefreshing ? "animate-spin" : ""} aria-hidden="true" />
                    Recheck
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </AdminPage>
  );
}
