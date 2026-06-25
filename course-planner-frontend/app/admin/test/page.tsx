"use client";

import { useState, useCallback } from "react";
import { Play, PlayCircle, AlertTriangle, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";

// ── Configurable test IDs ──
// Change these to match your database if defaults don't work.
const TEST_DEPT_ID = 1;
const TEST_COURSE_ID = 3481;
const TEST_SEMESTER_CODE = 1261;

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const RESPONSE_PREVIEW_LINES = 20;
const RUN_ALL_DELAY_MS = 200;

// ── Types ──

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type AuthLevel = "none" | "user" | "admin";

interface TestDef {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  auth: AuthLevel;
  category: string;
  dangerous?: boolean;
  body?: string;
}

interface TestResult {
  status: number;
  latencyMs: number;
  body: string;
  ok: boolean;
}

type TestState = "idle" | "running" | "done" | "error";

// ── Test collection ──

const tests: TestDef[] = [
  // Public — Browse
  {
    id: "departments",
    name: "List departments",
    method: "GET",
    url: "/api/departments",
    auth: "none",
    category: "Public — Browse",
  },
  {
    id: "courses",
    name: `Courses for dept ${TEST_DEPT_ID}`,
    method: "GET",
    url: `/api/departments/${TEST_DEPT_ID}/courses`,
    auth: "none",
    category: "Public — Browse",
  },
  {
    id: "offerings",
    name: `Offerings for course ${TEST_COURSE_ID}`,
    method: "GET",
    url: `/api/departments/${TEST_DEPT_ID}/courses/${TEST_COURSE_ID}/offerings`,
    auth: "none",
    category: "Public — Browse",
  },
  {
    id: "offering-detail",
    name: `Offering detail (semester ${TEST_SEMESTER_CODE})`,
    method: "GET",
    url: `/api/departments/${TEST_DEPT_ID}/courses/${TEST_COURSE_ID}/offerings/${TEST_SEMESTER_CODE}`,
    auth: "none",
    category: "Public — Browse",
  },

  // Public — Info
  { id: "about", name: "About", method: "GET", url: "/api/about", auth: "none", category: "Public — Info" },
  {
    id: "enrolling-term",
    name: "Current enrolling term",
    method: "GET",
    url: "/api/terms/enrolling",
    auth: "none",
    category: "Public — Info",
  },

  // Public — Graph
  {
    id: "grades",
    name: "Grade distribution",
    method: "GET",
    url: `/api/graph/grade-distribution?courseId=${TEST_COURSE_ID}`,
    auth: "none",
    category: "Public — Graph",
  },
  {
    id: "enrollment",
    name: "Enrollment history (5yr)",
    method: "GET",
    url: `/api/graph/enrollment-history?deptId=${TEST_DEPT_ID}&courseId=${TEST_COURSE_ID}&range=5yr`,
    auth: "none",
    category: "Public — Graph",
  },

  // Authenticated — Bookmarks
  {
    id: "my-bookmarks",
    name: "Get my bookmarks",
    method: "GET",
    url: "/api/bookmarks",
    auth: "user",
    category: "Authenticated — Bookmarks",
  },
  {
    id: "bookmark-offerings",
    name: "Get bookmark offerings",
    method: "GET",
    url: "/api/bookmarks/offerings",
    auth: "user",
    category: "Authenticated — Bookmarks",
  },

  // Authenticated — Preferences
  {
    id: "notif-prefs",
    name: "Get notification preferences",
    method: "GET",
    url: "/api/preferences/email-notifications",
    auth: "user",
    category: "Authenticated — Preferences",
  },

  // Admin — Core
  {
    id: "admin-status",
    name: "Admin status",
    method: "GET",
    url: "/api/admin",
    auth: "admin",
    category: "Admin — Core",
  },
  {
    id: "health-all",
    name: "Health check (all services)",
    method: "GET",
    url: "/api/admin/health",
    auth: "admin",
    category: "Admin — Core",
  },
  {
    id: "health-db",
    name: "Health check (database only)",
    method: "GET",
    url: "/api/admin/health?service=database",
    auth: "admin",
    category: "Admin — Core",
  },

  // Admin — Data
  {
    id: "admin-terms",
    name: "List all terms",
    method: "GET",
    url: "/api/admin/terms",
    auth: "admin",
    category: "Admin — Data",
  },
  {
    id: "admin-users",
    name: "List all users",
    method: "GET",
    url: "/api/admin/users",
    auth: "admin",
    category: "Admin — Data",
  },
  {
    id: "admin-bookmarks",
    name: "Bookmark analytics",
    method: "GET",
    url: "/api/admin/bookmarks",
    auth: "admin",
    category: "Admin — Data",
  },
];

const categories = [...new Set(tests.map((t) => t.category))];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "bg-success/15 text-success",
  POST: "bg-primary/15 text-primary",
  PUT: "bg-warning/15 text-warning",
  DELETE: "bg-destructive/15 text-destructive",
};

function statusColor(code: number): string {
  if (code >= 200 && code < 300) return "bg-success/15 text-success";
  if (code >= 400 && code < 500) return "bg-warning/15 text-warning";
  return "bg-destructive/15 text-destructive";
}

function formatJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export default function AdminTestPage() {
  const [states, setStates] = useState<Record<string, TestState>>({});
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [confirming, setConfirming] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);

  const getToken = useCallback(async (): Promise<string | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  const runTest = useCallback(
    async (test: TestDef) => {
      setStates((s) => ({ ...s, [test.id]: "running" }));

      const headers: Record<string, string> = {};
      if (test.auth !== "none") {
        const token = await getToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }
      if (test.body) headers["Content-Type"] = "application/json";

      const start = performance.now();
      try {
        const resp = await fetch(`${API_BASE}${test.url}`, {
          method: test.method,
          headers,
          body: test.body || undefined,
        });
        const latencyMs = Math.round(performance.now() - start);

        let body: string;
        const contentType = resp.headers.get("content-type") || "";
        if (contentType.includes("json")) {
          const json = await resp.json();
          body = JSON.stringify(json);
        } else if (resp.status === 204) {
          body = "(No Content)";
        } else {
          body = await resp.text();
        }

        const result: TestResult = {
          status: resp.status,
          latencyMs,
          body,
          ok: resp.ok,
        };
        setResults((r) => ({ ...r, [test.id]: result }));
        setStates((s) => ({ ...s, [test.id]: "done" }));
      } catch (err) {
        const latencyMs = Math.round(performance.now() - start);
        setResults((r) => ({
          ...r,
          [test.id]: {
            status: 0,
            latencyMs,
            body: err instanceof Error ? err.message : "Network error",
            ok: false,
          },
        }));
        setStates((s) => ({ ...s, [test.id]: "error" }));
      }
    },
    [getToken],
  );

  const handleRun = useCallback(
    (test: TestDef) => {
      if (test.dangerous) {
        setConfirming(test.id);
        return;
      }
      runTest(test);
    },
    [runTest],
  );

  const confirmRun = useCallback(
    (test: TestDef) => {
      setConfirming(null);
      runTest(test);
    },
    [runTest],
  );

  const handleRunAll = useCallback(async () => {
    setRunningAll(true);
    for (const test of tests) {
      if (test.dangerous) continue;
      await runTest(test);
      await sleep(RUN_ALL_DELAY_MS);
    }
    setRunningAll(false);
  }, [runTest]);

  const toggleExpand = (id: string) => {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  };

  const doneCount = tests.filter((t) => states[t.id] === "done").length;
  const passedCount = tests.filter((t) => states[t.id] === "done" && results[t.id]?.ok).length;
  const hasResults = doneCount > 0;

  return (
    <div className="flex-1 p-8 max-w-[1180px]">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className={`${displayStyles.sm} text-text-primary mb-1`}>API Test Runner</h1>
          <p className={`${bodyStyles.md} text-text-muted`}>
            Run predefined tests against all API endpoints. {tests.length} tests in {categories.length} categories.
          </p>
          <p className={`${labelStyles.sm} text-text-muted mt-1.5`}>
            Note: Only GET requests are safe to run. For POST requests, please use a tool like Postman.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          {hasResults && (
            <span
              className={`${labelStyles.md} font-mono ${passedCount === doneCount ? "text-success" : "text-warning"}`}
            >
              {passedCount}/{doneCount} passed
            </span>
          )}
          <Button onClick={handleRunAll} disabled={runningAll} className="gap-2">
            <PlayCircle className={`w-4 h-4 ${runningAll ? "animate-spin" : ""}`} />
            {runningAll ? "Running…" : "Run All"}
          </Button>
        </div>
      </div>

      {/* Categories */}
      {categories.map((category) => {
        const categoryTests = tests.filter((t) => t.category === category);
        const isDangerous = category.includes("Dangerous");

        return (
          <div key={category} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h2 className={`${headerStyles.xs} text-text-primary`}>{category}</h2>
              {isDangerous && <AlertTriangle className="w-4 h-4 text-warning" />}
            </div>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {categoryTests.map((test, i) => {
                  const state = states[test.id] || "idle";
                  const result = results[test.id];
                  const isExpanded = expanded[test.id];
                  const isConfirming = confirming === test.id;

                  const formatted = result ? formatJson(result.body) : "";
                  const lines = formatted.split("\n");
                  const truncated = lines.length > RESPONSE_PREVIEW_LINES;
                  const preview =
                    truncated && !isExpanded ? lines.slice(0, RESPONSE_PREVIEW_LINES).join("\n") : formatted;

                  return (
                    <div key={test.id} className={i < categoryTests.length - 1 ? "border-b border-border" : ""}>
                      {/* Test row */}
                      <div className="flex items-center gap-3 px-[18px] py-3 hover:bg-surface-raised transition-colors">
                        {/* Method badge */}
                        <Badge
                          className={`${METHOD_COLORS[test.method]} border-transparent font-mono shrink-0 w-14 justify-center`}
                        >
                          {test.method}
                        </Badge>

                        {/* Name + URL */}
                        <div className="flex-1 min-w-0">
                          <span className={`${labelStyles.lg} text-text-primary block`}>{test.name}</span>
                          <span className={`${labelStyles.sm} font-mono text-text-subtle block truncate`}>
                            {test.url}
                          </span>
                        </div>

                        {/* Auth badge */}
                        {test.auth !== "none" && (
                          <span
                            className={`${labelStyles.sm} px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                              test.auth === "admin" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                            }`}
                          >
                            {test.auth}
                          </span>
                        )}

                        {/* Result indicators */}
                        {state === "done" && result && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={`${statusColor(result.status)} border-transparent font-mono`}>
                              {result.status}
                            </Badge>
                            <span className={`${labelStyles.sm} font-mono text-text-subtle`}>{result.latencyMs}ms</span>
                          </div>
                        )}
                        {state === "error" && (
                          <Badge className="bg-destructive/15 text-destructive border-transparent">
                            <X className="w-3 h-3 mr-1" /> Error
                          </Badge>
                        )}

                        {/* Run button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRun(test)}
                          disabled={state === "running" || runningAll}
                          className="gap-1.5 shrink-0"
                        >
                          {state === "running" ? (
                            <Play className="w-3.5 h-3.5 animate-pulse" />
                          ) : test.dangerous ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                          Run
                        </Button>
                      </div>

                      {/* Confirm dialog for dangerous tests */}
                      {isConfirming && (
                        <div className="px-[18px] py-3 bg-warning/5 border-t border-warning/20 flex items-center gap-3 animate-fade-in">
                          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                          <span className={`${bodyStyles.sm} text-text-primary flex-1`}>
                            This will send real notification emails to all opted-in users. Continue?
                          </span>
                          <Button size="sm" onClick={() => confirmRun(test)} className="gap-1.5">
                            <Check className="w-3.5 h-3.5" /> Confirm
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setConfirming(null)}>
                            Cancel
                          </Button>
                        </div>
                      )}

                      {/* Response body */}
                      {state === "done" && result && (
                        <div className="px-[18px] pb-3">
                          <pre className="font-mono text-[12px] bg-surface-raised text-text-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words max-h-[500px] overflow-y-auto">
                            {preview}
                          </pre>
                          {truncated && (
                            <button
                              onClick={() => toggleExpand(test.id)}
                              className={`${labelStyles.sm} text-accent hover:text-accent-hover mt-1.5 flex items-center gap-1`}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3 h-3" /> Show less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" /> Show full response ({lines.length} lines)
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {state === "error" && result && (
                        <div className="px-[18px] pb-3">
                          <pre className="font-mono text-[12px] bg-destructive/5 text-destructive p-3 rounded-lg">
                            {result.body}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
