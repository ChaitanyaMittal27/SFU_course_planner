/**
 * =============================================================================
 * DASHBOARD PAGE - PROFILE MANAGEMENT
 * =============================================================================
 *
 * Purpose:
 * Central hub for authenticated users to manage their profile and view watchers.
 *
 * Features:
 * 1. Profile Section:
 *    - Profile picture (upload placeholder)
 *    - Display name (editable)
 *    - Email (read-only, from Supabase)
 *    - Account created date
 *    - Change password
 *
 * 2. Watchers Section:
 *    - Empty placeholder for now
 *    - Will be populated in future rounds
 *
 * Why This Layout?
 * - Profile on left/top: Standard UX pattern
 * - Watchers on right: Main content area
 * - Edit mode: Inline editing with Save/Cancel
 *
 * Connection:
 * - Protected route: Requires login (via middleware)
 * - Uses: useAuth() for user data
 * - Updates: Supabase user metadata
 * =============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DashboardPage() {
  const { user, userId } = useAuth();

  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Load user profile data on mount
   * Gets display name from Supabase user metadata
   */
  useEffect(() => {
    if (user) {
      // Get display name from user metadata (if set)
      setDisplayName(user.user_metadata?.display_name || "");
    }
  }, [user]);

  /**
   * Save profile changes
   * Updates user metadata in Supabase
   */
  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });

      if (updateError) throw updateError;

      setSuccess("Profile updated successfully");
      setIsEditingProfile(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Change password
   * Sends password update to Supabase
   */
  const handleChangePassword = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess("Password changed successfully");
      setIsEditingPassword(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel editing
   * Resets form and closes edit mode
   */
  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setIsEditingPassword(false);
    setError(null);
    setSuccess(null);
    // Reset to original values
    if (user) {
      setDisplayName(user.user_metadata?.display_name || "");
    }
    setNewPassword("");
    setConfirmPassword("");
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  /**
   * Get user initials for profile picture placeholder
   */
  const getUserInitials = () => {
    if (displayName) {
      return displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  if (!user) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Profile Section */}
          <div className="lg:col-span-1">
            <div className="light-card dark:dark-card p-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h2>

              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {getUserInitials()}
                </div>
                <button
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  onClick={() => setError("Photo upload coming soon!")}
                >
                  Change Photo
                </button>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-field"
                    placeholder="Your name"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{displayName || "Not set"}</p>
                )}
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <p className="text-gray-900 dark:text-white">{user.email}</p>
              </div>

              {/* Account Created */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Member Since</label>
                <p className="text-gray-900 dark:text-white">{formatDate(user.created_at)}</p>
              </div>

              {/* User ID (for testing) */}
              {/*}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User ID</label>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">{userId}</p>
              </div>
                */}

              {/* Profile Edit Buttons */}
              {!isEditingProfile && !isEditingPassword && (
                <button onClick={() => setIsEditingProfile(true)} className="w-full btn-primary">
                  Edit Profile
                </button>
              )}

              {isEditingProfile && (
                <div className="flex space-x-2">
                  <button onClick={handleSaveProfile} disabled={loading} className="flex-1 btn-primary">
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button onClick={handleCancelEdit} className="flex-1 btn-secondary">
                    Cancel
                  </button>
                </div>
              )}

              {/* Change Password Section */}
              {!isEditingProfile && (
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  {!isEditingPassword ? (
                    <button
                      onClick={() => setIsEditingPassword(true)}
                      className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      Change Password
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Change Password</h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="input-field"
                          placeholder="••••••••"
                          minLength={6}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="input-field"
                          placeholder="••••••••"
                          minLength={6}
                        />
                      </div>

                      <div className="flex space-x-2">
                        <button onClick={handleChangePassword} disabled={loading} className="flex-1 btn-primary">
                          {loading ? "Changing..." : "Change"}
                        </button>
                        <button onClick={handleCancelEdit} className="flex-1 btn-secondary">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Watchers Section (Placeholder) */}
          <div className="lg:col-span-2">
            <div className="light-card dark:dark-card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Course Watchers</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">0 watchers</span>
              </div>

              {/* Empty State */}
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No watchers yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Browse courses and add watchers to track enrollment and availability
                </p>
                <a href="/browse" className="btn-primary inline-block">
                  Browse Courses
                </a>
              </div>

              {/* Future: Watchers table will go here */}
              {/* <div className="space-y-4">
                <table>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Section</th>
                      <th>Enrolled</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    Watcher rows here
                  </tbody>
                </table>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
