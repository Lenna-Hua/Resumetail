"use client";

import { useCallback, useEffect, useState } from "react";
import type { ResumeVersion } from "@/lib/types";
import {
  createVersion,
  deleteVersion,
  duplicateVersion,
  loadVersions,
  updateVersion,
} from "@/lib/resume-versions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, Trash2 } from "lucide-react";

interface VersionPickerProps {
  activeVersionId: string | null;
  onSelect: (version: ResumeVersion) => void;
  onVersionsChange?: () => void;
}

export function VersionPicker({
  activeVersionId,
  onSelect,
  onVersionsChange,
}: VersionPickerProps) {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);

  // Load local versions only — never notify the parent from mount/effect.
  // Notifying on mount remounts this component when the parent uses
  // key={versionKey} + onVersionsChange={() => setVersionKey(...)}, which
  // previously caused an infinite remount loop (Chrome Aw Snap / OOM).
  const reload = useCallback(() => {
    setVersions(loadVersions());
  }, []);

  const refresh = useCallback(() => {
    setVersions(loadVersions());
    // #region agent log
    try {
      const w = window as unknown as { __dbgVpRefresh?: number };
      w.__dbgVpRefresh = (w.__dbgVpRefresh ?? 0) + 1;
      if (w.__dbgVpRefresh <= 40 || w.__dbgVpRefresh % 50 === 0) {
        fetch("http://127.0.0.1:7242/ingest/f6f0b1e2-debug", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "version-picker.tsx:refresh",
            message: "VersionPicker refresh (mutation)",
            data: { count: w.__dbgVpRefresh },
            timestamp: Date.now(),
            hypothesisId: "E",
            runId: "post-fix",
          }),
        }).catch(() => {});
      }
    } catch {
      /* ignore */
    }
    // #endregion
    onVersionsChange?.();
  }, [onVersionsChange]);

  useEffect(() => {
    // #region agent log
    try {
      const w = window as unknown as { __dbgVpEffect?: number };
      w.__dbgVpEffect = (w.__dbgVpEffect ?? 0) + 1;
      if (w.__dbgVpEffect <= 40 || w.__dbgVpEffect % 50 === 0) {
        fetch("http://127.0.0.1:7242/ingest/f6f0b1e2-debug", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "version-picker.tsx:useEffect",
            message: "VersionPicker effect (load only)",
            data: { count: w.__dbgVpEffect },
            timestamp: Date.now(),
            hypothesisId: "E",
            runId: "post-fix",
          }),
        }).catch(() => {});
      }
    } catch {
      /* ignore */
    }
    // #endregion
    queueMicrotask(() => reload());
  }, [reload]);

  const handleDuplicate = (id: string) => {
    const copy = duplicateVersion(id);
    if (copy) {
      refresh();
      onSelect(copy);
    }
  };

  const handleDelete = (id: string) => {
    deleteVersion(id);
    refresh();
  };

  const handleRename = (id: string, name: string) => {
    updateVersion(id, { name });
    refresh();
  };

  if (versions.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Resume versions</Label>
        <p className="text-xs text-muted-foreground">
          Import a resume to create your first version.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Resume versions</Label>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={() => {
            const active = versions.find((v) => v.id === activeVersionId) ?? versions[0];
            if (active) handleDuplicate(active.id);
          }}
        >
          <Plus className="size-3.5" />
          Duplicate
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {versions.map((v) => (
          <div key={v.id} className="flex items-center gap-1">
            <Badge
              variant={v.id === activeVersionId ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => onSelect(v)}
            >
              {v.name}
            </Badge>
            {v.id === activeVersionId && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6"
                  title="Duplicate version"
                  onClick={() => handleDuplicate(v.id)}
                >
                  <Copy className="size-3" />
                </Button>
                {versions.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6 text-destructive"
                    title="Delete version"
                    onClick={() => handleDelete(v.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      {activeVersionId && (
        <input
          type="text"
          className="w-full rounded-md border bg-background px-2 py-1 text-sm"
          defaultValue={versions.find((v) => v.id === activeVersionId)?.name ?? ""}
          onBlur={(e) => {
            if (activeVersionId) handleRename(activeVersionId, e.target.value);
          }}
          placeholder="Version name"
        />
      )}
    </div>
  );
}

export function useVersionBootstrap(
  resumeText: string,
  activeVersionId: string | null,
): ResumeVersion | null {
  const [version, setVersion] = useState<ResumeVersion | null>(null);

  useEffect(() => {
    if (!resumeText.trim()) return;
    const existing = loadVersions();
    if (existing.length === 0) {
      const created = createVersion(resumeText);
      queueMicrotask(() => setVersion(created));
      return;
    }
    const active = activeVersionId
      ? existing.find((v) => v.id === activeVersionId) ?? existing[0]
      : existing[0];
    queueMicrotask(() => setVersion(active));
  }, [resumeText, activeVersionId]);

  return version;
}
