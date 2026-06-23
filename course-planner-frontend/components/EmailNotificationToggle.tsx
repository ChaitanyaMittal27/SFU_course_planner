"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { labelStyles, bodyStyles } from "@/app/fonts";

export default function EmailNotificationToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreference = async () => {
      try {
        const preference = await api.getUserPreferences();
        setEnabled(preference.emailNotificationsEnabled);
      } catch (err: any) {
        console.error("Failed to fetch user preferences:", err);
        setError("Failed to load user preferences");
      } finally {
        setLoading(false);
      }
    };

    fetchPreference();
  }, []);

  const handleToggle = async () => {
    const newValue = !enabled;
    setUpdating(true);
    setError(null);

    try {
      const updated = await api.updateEmailNotificationPreference(newValue);
      setEnabled(updated.emailNotificationsEnabled);
    } catch (err: any) {
      console.error("Failed to update email notification preference:", err);
      setError("Failed to update email notification preference");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-surface rounded-lg border border-border mb-4">
        <Skeleton className="w-12 h-6 rounded-full" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-surface rounded-lg border border-border mb-4">
      <div className="flex items-center gap-3">
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={updating}
          aria-label="Toggle email notifications"
        />
        <div className="flex flex-col">
          <span className={`${labelStyles.lg} text-text-primary`}>Email Notifications</span>
          <span className={`${labelStyles.sm} text-text-muted`}>
            {enabled ? "You'll receive updates about your bookmarks" : "Enable to receive enrollment alerts"}
          </span>
        </div>
      </div>

      <div className="mt-2 sm:mt-0">
        {updating ? (
          <div className={`flex items-center gap-2 ${bodyStyles.md} text-text-muted`}>
            <Loader2 className="w-4 h-4 animate-spin" />
            Updating...
          </div>
        ) : error ? (
          <div className={`flex items-center gap-2 ${bodyStyles.md} text-destructive`}>
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        ) : (
          <span className={`${labelStyles.md} ${enabled ? "text-success" : "text-destructive"}`}>
            {enabled ? "Enabled" : "Disabled"}
          </span>
        )}
      </div>
    </div>
  );
}
