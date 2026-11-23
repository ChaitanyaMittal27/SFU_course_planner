"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Archive, Reply, Send, Check } from "lucide-react";
import { api, AdminSupportResponse, AdminContactSubmission } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { tabsListVariants } from "@/components/ui/tabs";
import { AdminPage, AdminPageHeader, AdminStats, AdminTable } from "@/components/admin/AdminPage";
import SectionCard from "@/components/course/SectionCard";
import TaskEmptyState from "@/components/feedback/TaskEmptyState";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import AdminPageSkeleton from "@/components/admin/AdminPageSkeleton";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { bodyStyles, labelStyles, numericStyles } from "@/app/fonts";

type FilterTab = "all" | "unresolved" | "archived";

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const REASON_COLORS: Record<string, string> = {
  "Bug Report": "bg-destructive-tint text-destructive-text",
  "Feature Request": "bg-success-tint text-success-text",
  "General Inquiry": "bg-surface-raised text-text-muted",
  "Technical Support": "bg-warning-tint text-warning-text",
  "Other": "bg-surface-raised text-text-muted",
};

export default function AdminSupportPage() {
  const [data, setData] = useState<AdminSupportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [replyingTo, setReplyingTo] = useState<AdminContactSubmission | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchData = useCallback(async (f: FilterTab) => {
    try {
      setError(null);
      const result = await api.getAdminSupport(f === "all" ? undefined : f);
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load submissions";
      setError(message);
    }
  }, []);

  useEffect(() => {
    fetchData(filter).finally(() => setLoading(false));
  }, [fetchData, filter]);

  const handleFilterChange = (f: FilterTab) => {
    setFilter(f);
    setExpandedId(null);
    setLoading(true);
  };

  const handleExpand = async (sub: AdminContactSubmission) => {
    if (expandedId === sub.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sub.id);
    if (!sub.isRead) {
      try {
        const updated = await api.markSubmissionRead(sub.id);
        setData((prev) => prev ? {
          ...prev,
          stats: { ...prev.stats, unreadCount: prev.stats.unreadCount - 1 },
          submissions: prev.submissions.map((s) => s.id === sub.id ? updated : s),
        } : prev);
      } catch { /* best-effort */ }
    }
  };

  const handleArchive = async (sub: AdminContactSubmission) => {
    try {
      const updated = await api.archiveSubmission(sub.id);
      setData((prev) => {
        if (!prev) return prev;
        if (filter === "archived") {
          if (!updated.isArchived) {
            return { ...prev, submissions: prev.submissions.filter((s) => s.id !== sub.id), stats: { ...prev.stats, archivedCount: prev.stats.archivedCount - 1 } };
          }
          return { ...prev, submissions: prev.submissions.map((s) => s.id === sub.id ? updated : s) };
        }
        if (updated.isArchived) {
          return { ...prev, submissions: prev.submissions.filter((s) => s.id !== sub.id), stats: { ...prev.stats, archivedCount: prev.stats.archivedCount + 1 } };
        }
        return { ...prev, submissions: prev.submissions.map((s) => s.id === sub.id ? updated : s) };
      });
      setExpandedId(null);
    } catch (err) {
      console.error("Failed to archive:", err);
    }
  };

  const openReply = (sub: AdminContactSubmission) => {
    setReplyingTo(sub);
    setReplyText("");
  };

  const handleSendReply = async () => {
    if (!replyingTo || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const updated = await api.replyToSubmission(replyingTo.id, replyText.trim());
      setData((prev) => prev ? {
        ...prev,
        submissions: prev.submissions.map((s) => s.id === replyingTo.id ? updated : s),
      } : prev);
      setReplyingTo(null);
      setReplyText("");
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return <AdminPageSkeleton statCards={3} hasTable tableRows={8} />;
  }

  const header = (
    <AdminPageHeader title="Support Inbox" description="Contact form submissions, replies and message management." />
  );

  if (error && !data) {
    return (
      <AdminPage>
        {header}
        <ErrorMessage message={error} onRetry={() => fetchData(filter)} />
      </AdminPage>
    );
  }

  if (!data) return null;

  const { stats, submissions } = data;

  const unresolved = submissions.filter((s) => !s.isReplied);
  const resolved = submissions.filter((s) => s.isReplied);

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unresolved", label: "Unresolved" },
    { key: "archived", label: "Archived" },
  ];

  const list = (title: string, items: AdminContactSubmission[]) => (
    <AdminTable title={title} note={`${items.length} messages`} className="mb-6">
      <ul>
        {items.map((sub) => (
          <SubmissionRow
            key={sub.id}
            sub={sub}
            isExpanded={expandedId === sub.id}
            onExpand={() => handleExpand(sub)}
            onArchive={() => handleArchive(sub)}
            onReply={() => openReply(sub)}
          />
        ))}
      </ul>
    </AdminTable>
  );

  return (
    <AdminPage>
      {header}

      <AdminStats
        items={[
          { label: "Total Submissions", value: String(stats.totalSubmissions) },
          { label: "Unread", value: String(stats.unreadCount), tone: stats.unreadCount > 0 ? "text-warning-text" : undefined },
          { label: "Archived", value: String(stats.archivedCount) },
        ]}
      />

      <div role="group" aria-label="Filter submissions" className={cn(tabsListVariants(), "mb-4 h-9 bg-surface-raised")}>
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            aria-pressed={filter === tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={cn(
              labelStyles.lg,
              "inline-flex h-full items-center rounded-md px-3 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              filter === tab.key ? "bg-background text-text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {submissions.length === 0 ? (
        <SectionCard title="Inbox">
          <TaskEmptyState
            icon={MessageSquare}
            title={filter === "archived" ? "No archived submissions" : filter === "unresolved" ? "All caught up — no unresolved messages" : "No submissions yet"}
            description="Messages from the About page contact form show up here."
          />
        </SectionCard>
      ) : (
        <>
          {(filter === "all" || filter === "unresolved") && unresolved.length > 0 && list("Unresolved", unresolved)}
          {filter === "all" && resolved.length > 0 && list("Resolved", resolved)}
          {filter === "archived" && list("Archived", submissions)}
        </>
      )}

      <Dialog open={replyingTo !== null} onOpenChange={(open) => !open && setReplyingTo(null)}>
        <DialogContent className="sm:max-w-lg">
          {replyingTo && (
            <>
              <DialogHeader>
                <DialogTitle>Reply to {replyingTo.name}</DialogTitle>
                <DialogDescription>
                  To: <span className={numericStyles.sm}>{replyingTo.email}</span> · From:{" "}
                  <span className={numericStyles.sm}>support@sfucourseplanner.com</span>
                </DialogDescription>
              </DialogHeader>
              <div className="border-l-2 border-border pl-3">
                <p className={cn(labelStyles.sm, "mb-1 text-text-subtle")}>Their message:</p>
                <p className={cn(bodyStyles.sm, "line-clamp-4 whitespace-pre-wrap text-text-muted")}>{replyingTo.message}</p>
              </div>
              <Textarea
                aria-label="Reply"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
                rows={5}
                className="resize-none"
                autoFocus
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setReplyingTo(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSendReply} disabled={sendingReply || !replyText.trim()} className="gap-1.5">
                  <Send aria-hidden="true" />
                  {sendingReply ? "Sending…" : "Send Reply"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

function SubmissionRow({
  sub,
  isExpanded,
  onExpand,
  onArchive,
  onReply,
}: {
  sub: AdminContactSubmission;
  isExpanded: boolean;
  onExpand: () => void;
  onArchive: () => void;
  onReply: () => void;
}) {
  const reasonClass = sub.reason ? (REASON_COLORS[sub.reason] || "bg-surface-raised text-text-muted") : "";
  const panelId = `submission-${sub.id}`;

  return (
    <li className="border-t border-border first:border-t-0">
      <button
        type="button"
        onClick={onExpand}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-nowrap sm:px-5"
      >
        <span className="w-2 flex-none" aria-hidden="true">
          {!sub.isRead && <span className="block size-2 rounded-full bg-primary" />}
        </span>
        {!sub.isRead && <span className="sr-only">Unread.</span>}

        <span className="w-36 min-w-0 flex-none">
          <span className={cn(labelStyles.lg, "block truncate text-text-primary", !sub.isRead && "font-semibold")}>{sub.name}</span>
          <span className={cn(bodyStyles.sm, "block truncate text-text-subtle")}>{sub.email}</span>
        </span>

        <span className="w-32 flex-none">
          {sub.reason ? (
            <span className={cn(labelStyles.sm, "rounded-full px-2 py-0.5 font-semibold", reasonClass)}>{sub.reason}</span>
          ) : (
            <span className="text-text-subtle">—</span>
          )}
        </span>

        <span className={cn(bodyStyles.sm, "block min-w-0 flex-1 truncate text-text-muted")}>
          {sub.message.length > 80 ? sub.message.slice(0, 80) + "…" : sub.message}
        </span>

        <span className="flex flex-none items-center gap-2">
          {sub.isReplied && (
            <Badge className="border-transparent bg-success-tint text-success-text">
              <Check aria-hidden="true" className="mr-0.5 size-3" /> Replied
            </Badge>
          )}
          <span className={cn(numericStyles.sm, "text-text-subtle")}>{formatRelative(sub.submittedAt)}</span>
        </span>
      </button>

      {isExpanded && (
        <div id={panelId} className="space-y-3 px-4 pt-1 pb-4 sm:px-5">
          <p className={cn(bodyStyles.md, "whitespace-pre-wrap border-l-2 border-border pl-3 text-text-primary")}>{sub.message}</p>

          {sub.isReplied && sub.replyMessage && (
            <div className="border-l-2 border-success pl-3">
              <p className={cn(labelStyles.md, "mb-1 flex flex-wrap items-center gap-x-2 font-semibold text-success-text")}>
                <Reply aria-hidden="true" className="size-3.5" />
                Your reply
                <span className={cn(numericStyles.sm, "font-normal text-text-subtle")}>
                  {sub.replySentTo && `→ ${sub.replySentTo}`} · {formatDate(sub.repliedAt)}
                </span>
              </p>
              <p className={cn(bodyStyles.md, "whitespace-pre-wrap text-text-primary")}>{sub.replyMessage}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            {!sub.isReplied && (
              <Button size="sm" onClick={onReply} className="gap-1.5">
                <Reply aria-hidden="true" /> Reply
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onArchive} className="gap-1.5">
              <Archive aria-hidden="true" />
              {sub.isArchived ? "Unarchive" : "Archive"}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
