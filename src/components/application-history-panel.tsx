"use client";

import { useEffect, useState } from "react";
import type { ApplicationRecord } from "@/lib/types";
import {
  deleteApplicationRecord,
  getHistoryForVersion,
  loadApplicationHistory,
} from "@/lib/application-history";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTimeStable } from "@/lib/format-date";
import { History, Trash2 } from "lucide-react";

interface ApplicationHistoryPanelProps {
  versionId: string | null;
  scope?: "version" | "all";
  refreshKey?: number;
  onRefresh?: () => void;
}

export function ApplicationHistoryPanel({
  versionId,
  scope = "version",
  refreshKey = 0,
  onRefresh,
}: ApplicationHistoryPanelProps) {
  const [records, setRecords] = useState<ApplicationRecord[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      setRecords(
        scope === "all" || !versionId
          ? loadApplicationHistory()
          : getHistoryForVersion(versionId),
      );
    });
  }, [versionId, scope, refreshKey]);

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4" />
            Application history
          </CardTitle>
          <CardDescription>
            Analyze a job description to log role, match score, and date here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="size-4" />
          Application history
        </CardTitle>
        <CardDescription>
          Recent job postings you compared this resume against.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {records.map((record) => (
          <div
            key={record.id}
            className="flex items-start justify-between gap-2 rounded-lg border p-3 text-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{record.roleTitle}</p>
              {scope === "all" && (
                <p className="truncate text-xs text-muted-foreground">{record.versionName}</p>
              )}
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {record.jdSnippet || "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTimeStable(record.analyzedAt)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {record.matchScore !== null && (
                <Badge variant="secondary" className="tabular-nums">
                  {record.matchScore}%
                </Badge>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                aria-label="Remove record"
                onClick={() => {
                  deleteApplicationRecord(record.id);
                  setRecords((prev) => prev.filter((r) => r.id !== record.id));
                  onRefresh?.();
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
