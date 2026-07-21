"use client";

import type { WorkspaceMode } from "@/lib/workspace-mode";
import { WORKSPACE_MODE_LABELS } from "@/lib/workspace-mode";
import { cn } from "@/lib/utils";

const DESKTOP_MODES: WorkspaceMode[] = ["edit", "customize", "tailor", "checks", "review"];

interface DesktopWorkspaceShellProps {
  activeMode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  header: React.ReactNode;
  panel: React.ReactNode;
  preview: React.ReactNode;
}

export function DesktopWorkspaceShell({
  activeMode,
  onModeChange,
  header,
  panel,
  preview,
}: DesktopWorkspaceShellProps) {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-6 sm:px-6">
      {header}

      <div
        className="flex gap-1 overflow-x-auto border-b border-border"
        role="tablist"
        aria-label="Workspace modes"
      >
        {DESKTOP_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={activeMode === mode}
            onClick={() => onModeChange(mode)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              activeMode === mode
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {WORKSPACE_MODE_LABELS[mode]}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,42%)]">
        <div className="min-w-0 space-y-4">{panel}</div>
        <div className="min-w-0 lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Live preview
          </p>
          {preview}
        </div>
      </div>
    </div>
  );
}
