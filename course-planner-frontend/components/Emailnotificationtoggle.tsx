/**
 * =============================================================================
 * EMAIL NOTIFICATION TOGGLE COMPONENT
 * =============================================================================
 *
 * Purpose:
 * Allows users to enable/disable email notifications for all bookmarks.
 * Placed above the bookmarks table in the dashboard.
 *
 * JWT Authentication:
 * - Uses api.getEmailNotificationPreference() and api.updateEmailNotificationPreference()
 * - Both methods use fetchAuthAPI which automatically:
 *   1. Gets JWT from Supabase session via getAuthToken()
 *   2. Adds Authorization: Bearer <token> header
 *   3. Throws error if not authenticated
 *
 * Features:
 * - Fetches current preference on mount
 * - Updates preference on toggle
 * - Shows loading state during update
 * - Error handling with visual feedback
 * - Dark mode support
 * - Responsive design
 *
 * Usage:
 * ```tsx
 * <EmailNotificationToggle />
 * ```
 *
 * Location: Dashboard page, above BookmarksTable
 * =============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function EmailNotificationToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch current email notification preference on mount
   *
   * JWT is automatically included by fetchAuthAPI helper
   */
  useEffect(() => {
    const fetchPreference = async () => {
      try {
        const preference = await api.getEmailNotificationPreference();
        setEnabled(preference.emailNotificationsEnabled);
      } catch (err: any) {
        console.error("Failed to fetch email preference:", err);
        setError("Failed to load preference");
      } finally {
        setLoading(false);
      }
    };

    fetchPreference();
  }, []);

  /**
   * Handle toggle change
   *
   * Updates preference in database.
   * JWT is automatically included by fetchAuthAPI helper.
   */
  const handleToggle = async () => {
    const newValue = !enabled;
    setUpdating(true);
    setError(null);

    try {
      const updated = await api.updateEmailNotificationPreference(newValue);
      setEnabled(updated.emailNotificationsEnabled);
    } catch (err: any) {
      console.error("Failed to update email preference:", err);
      setError("Failed to update preference");
      // Revert toggle on error
      setEnabled(enabled);
    } finally {
      setUpdating(false);
    }
  };

  // Show loading skeleton
  if (loading) {
    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700 mb-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-12 h-6 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
          <div className="h-4 w-48 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700 mb-4">
      {/* Left side: Toggle + Label */}
      <div className="flex items-center gap-3">
        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          disabled={updating}
          className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            enabled ? "bg-orange-600 dark:bg-orange-500" : "bg-gray-300 dark:bg-slate-600"
          }`}
          aria-label="Toggle email notifications"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>

        {/* Label */}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {enabled ? "You'll receive updates about your bookmarks" : "Enable to receive enrollment alerts"}
          </span>
        </div>
      </div>

      {/* Right side: Status indicator */}
      <div className="mt-2 sm:mt-0">
        {updating ? (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Updating...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        ) : (
          <div style={{ padding: "0.25rem 0.5rem" }}>
            {enabled ? (
              <div className="text-sm text-green-600 dark:text-green-400">Enabled</div>
            ) : (
              <div className="text-sm text-red-600 dark:text-red-400">Disabled</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
