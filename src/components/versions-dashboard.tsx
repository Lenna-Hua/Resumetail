"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ResumeVersion } from "@/lib/types";
import {
  createVersion,
  deleteVersion,
  duplicateVersion,
  loadVersions,
} from "@/lib/resume-versions";
import { loadSession } from "@/lib/storage";
import { STORAGE_READY_EVENT } from "@/lib/browser-store";
import { exportResumePdf } from "@/lib/pdf-export";
import { loadSelectedTemplateId } from "@/lib/resume-templates";
import { resumeTextForExport } from "@/lib/structured-resume";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Sparkles, Download, Copy, Trash2 } from "lucide-react";
import { ApplicationHistoryPanel } from "@/components/application-history-panel";
import { cn } from "@/lib/utils";
import { formatDateStable } from "@/lib/format-date";

type DashboardTab = "all" | "tailored";

function formatUpdated(iso: string): string {
  return formatDateStable(iso);
}

export function VersionsDashboard() {
  const router = useRouter();
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [tab, setTab] = useState<DashboardTab>("all");
  const [historyKey, setHistoryKey] = useState(0);
  const [activeScore, setActiveScore] = useState<{
    versionId: string | null;
    overall: number | null;
  }>({ versionId: null, overall: null });

  const refresh = useCallback(() => {
    setVersions(loadVersions());
    const session = loadSession();
    setActiveScore({
      versionId: session.activeVersionId,
      overall: session.matchScore?.overall ?? null,
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => refresh());
    const onReady = () => refresh();
    window.addEventListener(STORAGE_READY_EVENT, onReady);
    return () => window.removeEventListener(STORAGE_READY_EVENT, onReady);
  }, [refresh]);

  const filteredVersions = useMemo(() => {
    if (tab === "tailored") {
      return versions.filter((v) => Boolean(v.tailoredFor?.trim()));
    }
    return versions;
  }, [versions, tab]);

  const tailoredCount = useMemo(
    () => versions.filter((v) => Boolean(v.tailoredFor?.trim())).length,
    [versions],
  );

  const handleExport = (version: ResumeVersion) => {
    const templateId = loadSelectedTemplateId();
    exportResumePdf(
      resumeTextForExport(version.resumeText),
      `${version.name.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      templateId,
    );
  };

  const handleDuplicate = (id: string) => {
    const copy = duplicateVersion(id);
    if (copy) refresh();
  };

  const handleDelete = (id: string) => {
    if (versions.length <= 1) return;
    deleteVersion(id);
    refresh();
  };

  const bootstrapFromSession = () => {
    const session = loadSession();
    if (session.resumeText.trim()) {
      const existing = loadVersions();
      if (existing.length > 0) {
        router.push(`/app/v/${existing[0].id}`);
        return;
      }
      const created = createVersion(session.resumeText);
      router.push(`/app/v/${created.id}`);
      return;
    }
    router.push("/app/new");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 overflow-x-hidden px-4 py-6 sm:max-w-3xl sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your resumes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a version, tailor it for a job, and export when ready.
          </p>
        </div>
        <Link
          href="/app/new"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New
        </Link>
      </div>

      {versions.length > 0 && (
        <div className="flex gap-2 rounded-lg border bg-muted/40 p-1">
          <button
            type="button"
            className={cn(
              "min-h-11 flex-1 whitespace-nowrap rounded-md px-2 text-sm font-medium transition-colors sm:px-3",
              tab === "all" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
            onClick={() => setTab("all")}
          >
            All ({versions.length})
          </button>
          <button
            type="button"
            className={cn(
              "min-h-11 flex-1 whitespace-nowrap rounded-md px-2 text-sm font-medium transition-colors sm:px-3",
              tab === "tailored" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
            onClick={() => setTab("tailored")}
          >
            Tailored ({tailoredCount})
          </button>
        </div>
      )}

      {versions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No resumes yet</CardTitle>
            <CardDescription>
              Import an existing resume or paste text to create your first version.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <ButtonLink href="/app/new?tab=import" className="min-h-11">
              <Plus className="size-4" />
              Import resume
            </ButtonLink>
            <ButtonLink href="/app/new" variant="outline" className="min-h-11">
              Start from template
            </ButtonLink>
            <Button variant="outline" className="min-h-11" onClick={bootstrapFromSession}>
              Continue with sample data
            </Button>
          </CardContent>
        </Card>
      ) : filteredVersions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No tailored copies yet</CardTitle>
            <CardDescription>
              After analyzing a job description, use &quot;Save tailored copy&quot; in the
              workspace to keep a role-specific version here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="min-h-11 w-full"
              onClick={() => setTab("all")}
            >
              View all resumes
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filteredVersions.map((version) => {
            const score =
              activeScore.versionId === version.id && activeScore.overall !== null
                ? activeScore.overall
                : null;

            return (
              <li key={version.id}>
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{version.name}</p>
                          {score !== null && (
                            <Badge variant="secondary" className="shrink-0 tabular-nums">
                              {score}%
                            </Badge>
                          )}
                        </div>
                        {version.tailoredFor ? (
                          <p className="text-xs text-primary/80">
                            Tailored for {version.tailoredFor}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Updated {formatUpdated(version.updatedAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link
                        href={`/app/v/${version.id}?mode=edit`}
                        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Open
                      </Link>
                      <Link
                        href={`/app/v/${version.id}?mode=tailor`}
                        className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
                      >
                        <Sparkles className="size-4" />
                        Tailor
                      </Link>
                      <Button
                        variant="outline"
                        className="min-h-11"
                        onClick={() => handleExport(version)}
                        disabled={!version.resumeText.trim()}
                      >
                        <Download className="size-4" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        className="min-h-11"
                        onClick={() => handleDuplicate(version.id)}
                      >
                        <Copy className="size-4" />
                        Copy
                      </Button>
                    </div>

                    {versions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 min-h-11 w-full text-destructive"
                        onClick={() => handleDelete(version.id)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ApplicationHistoryPanel
        key={historyKey}
        versionId={null}
        scope="all"
        onRefresh={() => setHistoryKey((k) => k + 1)}
      />
    </div>
  );
}
