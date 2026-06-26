"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Mail, Archive, Reply, Send, X, Check } from "lucide-react";
import { api, AdminSupportResponse, AdminContactSubmission } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import AdminPageSkeleton from "@/components/admin/AdminPageSkeleton";
import ErrorMessage from "@/components/ErrorMessage";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";

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
  "Bug Report": "bg-destructive/15 text-destructive",
  "Feature Request": "bg-accent/15 text-accent",
  "General Inquiry": "bg-primary/15 text-primary",
  "Technical Support": "bg-warning/15 text-warning",
  "Other": "bg-text-muted/15 text-text-muted",
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

  if (error && !data) {
    return (
      <div className="flex-1 p-8 max-w-[1180px]">
        <ErrorMessage message={error} onRetry={() => fetchData(filter)} />
      </div>
    );
  }

  if (!data) return null;

  const { stats, submissions } = data;

  const unresolved = submissions.filter((s) => !s.isReplied);
  const resolved = submissions.filter((s) => s.isReplied);

  const statCards = [
    { label: "Total Submissions", value: String(stats.totalSubmissions), icon: MessageSquare, color: "text-accent" },
    { label: "Unread", value: String(stats.unreadCount), icon: Mail, color: "text-primary" },
    { label: "Archived", value: String(stats.archivedCount), icon: Archive, color: "text-text-muted" },
  ];

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unresolved", label: "Unresolved" },
    { key: "archived", label: "Archived" },
  ];

  return (
    <div className="flex-1 p-8 max-w-[1180px]">
      {/* Heading */}
      <div className="mb-6">
        <h1 className={`${displayStyles.sm} text-text-primary mb-1`}>Support Inbox</h1>
        <p className={`${bodyStyles.md} text-text-muted`}>
          Contact form submissions, replies and message management.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3.5 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-4">
            <CardContent className="p-0">
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <span className={`${labelStyles.md} text-text-muted`}>{stat.label}</span>
              </div>
              <span className="font-mono font-semibold text-[20px] tracking-tight text-text-primary">
                {stat.value}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 mb-4">
        {filterTabs.map((tab) => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? "default" : "ghost"}
            size="sm"
            onClick={() => handleFilterChange(tab.key)}
            className={filter !== tab.key ? "text-text-muted" : ""}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {submissions.length === 0 ? (
        <Card className="p-8">
          <CardContent className="p-0 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-surface-raised rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-text-subtle" />
            </div>
            <p className={`${bodyStyles.md} text-text-muted`}>
              {filter === "archived" ? "No archived submissions" : filter === "unresolved" ? "All caught up — no unresolved messages" : "No submissions yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Unresolved section */}
          {(filter === "all" || filter === "unresolved") && unresolved.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`${headerStyles.xs} text-text-primary`}>Unresolved</h2>
                <span className={`${labelStyles.sm} font-mono text-text-subtle`}>{unresolved.length} messages</span>
              </div>
              <Card className="overflow-hidden mb-6">
                <CardContent className="p-0">
                  {unresolved.map((sub, i) => (
                    <SubmissionRow
                      key={sub.id}
                      sub={sub}
                      isExpanded={expandedId === sub.id}
                      isLast={i === unresolved.length - 1}
                      onExpand={() => handleExpand(sub)}
                      onArchive={() => handleArchive(sub)}
                      onReply={() => openReply(sub)}
                    />
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {/* Resolved section */}
          {(filter === "all") && resolved.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`${headerStyles.xs} text-text-primary`}>Resolved</h2>
                <span className={`${labelStyles.sm} font-mono text-text-subtle`}>{resolved.length} messages</span>
              </div>
              <Card className="overflow-hidden mb-6">
                <CardContent className="p-0">
                  {resolved.map((sub, i) => (
                    <SubmissionRow
                      key={sub.id}
                      sub={sub}
                      isExpanded={expandedId === sub.id}
                      isLast={i === resolved.length - 1}
                      onExpand={() => handleExpand(sub)}
                      onArchive={() => handleArchive(sub)}
                      onReply={() => openReply(sub)}
                    />
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {/* Archived — flat list, no split */}
          {filter === "archived" && (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {submissions.map((sub, i) => (
                  <SubmissionRow
                    key={sub.id}
                    sub={sub}
                    isExpanded={expandedId === sub.id}
                    isLast={i === submissions.length - 1}
                    onExpand={() => handleExpand(sub)}
                    onArchive={() => handleArchive(sub)}
                    onReply={() => openReply(sub)}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Reply compose modal */}
      {replyingTo && (
        <div className="fixed bottom-6 right-6 w-[440px] z-50 animate-slide-up">
          <Card className="overflow-hidden border-border-strong shadow-lg">
            <div className="h-0.5 bg-primary" />
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className={`${labelStyles.lg} text-text-primary`}>Reply to {replyingTo.name}</span>
                <Button variant="ghost" size="icon-xs" onClick={() => setReplyingTo(null)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* To / From */}
              <div className="px-4 py-2 border-b border-border space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`${labelStyles.sm} text-text-subtle w-10`}>To:</span>
                  <span className={`${labelStyles.md} font-mono text-text-primary`}>{replyingTo.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`${labelStyles.sm} text-text-subtle w-10`}>From:</span>
                  <span className={`${labelStyles.md} font-mono text-text-muted`}>support@sfucourseplanner.com</span>
                </div>
              </div>

              {/* Original message */}
              <div className="px-4 py-3 border-b border-border">
                <div className={`${labelStyles.sm} text-text-subtle mb-1.5`}>Their message:</div>
                <div className="pl-3 border-l-2 border-border">
                  <p className={`${bodyStyles.sm} text-text-muted whitespace-pre-wrap line-clamp-4`}>{replyingTo.message}</p>
                </div>
              </div>

              {/* Reply textarea */}
              <div className="p-4">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  rows={5}
                  className="resize-none mb-3"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button onClick={handleSendReply} disabled={sendingReply || !replyText.trim()} className="gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    {sendingReply ? "Sending…" : "Send Reply"}
                  </Button>
                  <Button variant="outline" onClick={() => setReplyingTo(null)}>Cancel</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function SubmissionRow({
  sub,
  isExpanded,
  isLast,
  onExpand,
  onArchive,
  onReply,
}: {
  sub: AdminContactSubmission;
  isExpanded: boolean;
  isLast: boolean;
  onExpand: () => void;
  onArchive: () => void;
  onReply: () => void;
}) {
  const reasonClass = sub.reason ? (REASON_COLORS[sub.reason] || "bg-text-muted/15 text-text-muted") : "";

  return (
    <div className={!isLast ? "border-b border-border" : ""}>
      {/* Row */}
      <div
        onClick={onExpand}
        className="flex items-center gap-3 px-[18px] py-3 cursor-pointer hover:bg-surface-raised transition-colors"
      >
        {/* Unread dot */}
        <div className="w-2 flex-none">
          {!sub.isRead && <span className="block w-2 h-2 rounded-full bg-primary" />}
        </div>

        {/* Sender */}
        <div className="w-36 flex-none min-w-0">
          <span className={`${labelStyles.lg} text-text-primary block truncate ${!sub.isRead ? "font-semibold" : ""}`}>
            {sub.name}
          </span>
          <span className={`${bodyStyles.sm} text-text-subtle block truncate`}>{sub.email}</span>
        </div>

        {/* Reason badge */}
        <div className="w-28 flex-none">
          {sub.reason ? (
            <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${reasonClass}`}>
              {sub.reason}
            </span>
          ) : (
            <span className="text-text-subtle text-[16px]">—</span>
          )}
        </div>

        {/* Message preview */}
        <div className="flex-1 min-w-0">
          <span className={`${bodyStyles.sm} text-text-muted truncate block`}>
            {sub.message.length > 80 ? sub.message.slice(0, 80) + "…" : sub.message}
          </span>
        </div>

        {/* Status + time */}
        <div className="flex items-center gap-2 flex-none">
          {sub.isReplied && (
            <Badge className="bg-success/15 text-success border-transparent">
              <Check className="w-3 h-3 mr-0.5" /> Replied
            </Badge>
          )}
          <span className={`${labelStyles.sm} font-mono text-text-subtle`}>{formatRelative(sub.submittedAt)}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-[18px] pb-4 pt-1 animate-fade-in">
          {/* Full message */}
          <div className="p-4 bg-surface-raised rounded-lg mb-3">
            <p className={`${bodyStyles.md} text-text-primary whitespace-pre-wrap`}>{sub.message}</p>
          </div>

          {/* Reply if already replied */}
          {sub.isReplied && sub.replyMessage && (
            <div className="p-4 bg-success/5 border border-success/20 rounded-lg mb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Reply className="w-3.5 h-3.5 text-success" />
                <span className={`${labelStyles.md} text-success font-semibold`}>Your reply</span>
                <span className={`${labelStyles.sm} font-mono text-text-subtle ml-auto`}>
                  {sub.replySentTo && `→ ${sub.replySentTo}`} · {formatDate(sub.repliedAt)}
                </span>
              </div>
              <p className={`${bodyStyles.md} text-text-primary whitespace-pre-wrap`}>{sub.replyMessage}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!sub.isReplied && (
              <Button size="sm" onClick={onReply} className="gap-1.5">
                <Reply className="w-3.5 h-3.5" /> Reply
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onArchive} className="gap-1.5">
              <Archive className="w-3.5 h-3.5" />
              {sub.isArchived ? "Unarchive" : "Archive"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
