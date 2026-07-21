"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ClipboardPaste,
  Download,
  Eye,
  FileText,
  LayoutGrid,
  LayoutTemplate,
  Link2,
  MoreVertical,
  Sparkles,
} from "lucide-react";
import type { WorkspaceMode } from "@/lib/workspace-mode";
import { MOBILE_CUSTOMIZE_MODES } from "@/lib/workspace-mode";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NAV_MODES = ["edit", "customize", "tailor", "checks"] as const;
type MobileNavMode = (typeof NAV_MODES)[number];

const MODE_ICONS: Record<MobileNavMode, typeof FileText> = {
  edit: FileText,
  customize: LayoutTemplate,
  tailor: Sparkles,
  checks: LayoutGrid,
};

const MOBILE_NAV_LABELS: Record<MobileNavMode, string> = {
  edit: "Edit",
  customize: "Style",
  tailor: "Tailor",
  checks: "Checks",
};

interface MobileWorkspaceShellProps {
  versionSwitcher?: React.ReactNode;
  matchScore: number | null;
  saveLabel?: string | null;
  activeMode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  onExport: () => void;
  onPreview?: () => void;
  onShare?: () => void;
  exportDisabled?: boolean;
  previewDisabled?: boolean;
  shareDisabled?: boolean;
  shareLabel?: string;
  children: React.ReactNode;
}

export function MobileWorkspaceShell({
  versionSwitcher,
  matchScore,
  saveLabel,
  activeMode,
  onModeChange,
  onExport,
  onPreview,
  onShare,
  exportDisabled,
  previewDisabled,
  shareDisabled,
  shareLabel,
  children,
}: MobileWorkspaceShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasOverflowActions = Boolean(onPreview || onShare);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col overflow-x-hidden pb-[calc(4rem+env(safe-area-inset-bottom)+var(--keyboard-inset,0px))]">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-card/95 backdrop-blur-sm">
        <div className="flex min-h-14 items-center gap-1.5 px-2 py-2 sm:gap-2 sm:px-3">
          <ButtonLink
            href="/app"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 sm:size-11"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="size-5" />
          </ButtonLink>
          <div className="min-w-0 flex-1">
            {versionSwitcher ?? <p className="truncate text-sm font-semibold">Resume</p>}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {matchScore !== null && <span className="tabular-nums sm:hidden">{matchScore}%</span>}
              {saveLabel && (
                <>
                  {matchScore !== null && <span aria-hidden className="sm:hidden">·</span>}
                  <span className="truncate">{saveLabel}</span>
                </>
              )}
            </div>
          </div>
          {matchScore !== null && (
            <Badge variant="secondary" className="hidden shrink-0 tabular-nums sm:inline-flex">
              {matchScore}%
            </Badge>
          )}

          {hasOverflowActions && (
            <div ref={menuRef} className="relative sm:hidden">
              <Button
                variant="outline"
                size="icon"
                className="size-10 shrink-0"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="More actions"
              >
                <MoreVertical className="size-5" />
              </Button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-full z-30 mt-1 min-w-[10rem] rounded-lg border border-border bg-card py-1 shadow-lg"
                  role="menu"
                >
                  {onPreview && (
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted/60 disabled:opacity-50"
                      onClick={() => {
                        setMenuOpen(false);
                        onPreview();
                      }}
                      disabled={previewDisabled}
                    >
                      <Eye className="size-4 shrink-0" />
                      Preview
                    </button>
                  )}
                  {onShare && (
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted/60 disabled:opacity-50"
                      onClick={() => {
                        setMenuOpen(false);
                        onShare();
                      }}
                      disabled={shareDisabled}
                    >
                      <Link2 className="size-4 shrink-0" />
                      {shareLabel ?? "Share"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {onShare && (
            <Button
              variant="outline"
              size="icon"
              className="hidden size-11 shrink-0 sm:inline-flex"
              onClick={onShare}
              disabled={shareDisabled}
              aria-label={shareLabel ?? "Copy share link"}
              title={shareLabel ?? "Copy view-only share link"}
            >
              <Link2 className="size-5" />
            </Button>
          )}
          {onPreview && (
            <Button
              variant="outline"
              size="icon"
              className="hidden size-11 shrink-0 sm:inline-flex"
              onClick={onPreview}
              disabled={previewDisabled}
              aria-label="Preview resume"
            >
              <Eye className="size-5" />
            </Button>
          )}
          <Button
            variant="default"
            size="icon"
            className="size-10 shrink-0 sm:size-11"
            onClick={onExport}
            disabled={exportDisabled}
            aria-label="Export PDF"
          >
            <Download className="size-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3">{children}</div>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border/80 bg-card/95 backdrop-blur-sm"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Workspace modes"
      >
        <div className="grid grid-cols-4">
          {NAV_MODES.map((mode) => {
            const Icon = MODE_ICONS[mode];
            const active =
              activeMode === mode ||
              (mode === "customize" && MOBILE_CUSTOMIZE_MODES.includes(activeMode));
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onModeChange(mode as WorkspaceMode)}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10px] transition-colors min-[380px]:px-1 min-[380px]:text-xs",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5" aria-hidden />
                <span className="max-w-full truncate font-medium">
                  {MOBILE_NAV_LABELS[mode]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PasteClipboardButton({
  onPaste,
  disabled,
}: {
  onPaste: (text: string) => void;
  disabled?: boolean;
}) {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) onPaste(text);
    } catch {
      // Clipboard API may be blocked; user can paste manually
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-11 w-full"
      onClick={() => void handlePaste()}
      disabled={disabled}
    >
      <ClipboardPaste className="size-4" />
      Paste from clipboard
    </Button>
  );
}
