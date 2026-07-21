"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import type { ResumeTemplateId, TemplateSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

const TemplatePreview = dynamic(
  () => import("@/components/template-preview").then((m) => m.TemplatePreview),
  {
    loading: () => (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  },
);

interface PreviewBottomSheetProps {
  open: boolean;
  onClose: () => void;
  resumeText: string;
  templateId: ResumeTemplateId;
  settings: TemplateSettings;
}

export function PreviewBottomSheet({
  open,
  onClose,
  resumeText,
  templateId,
  settings,
}: PreviewBottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40"
        aria-label="Close preview"
        onClick={onClose}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-border bg-card shadow-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        role="dialog"
        aria-modal="true"
        aria-label="Resume preview"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Export preview</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <TemplatePreview
            resumeText={resumeText}
            templateId={templateId}
            settings={settings}
          />
        </div>
      </div>
    </>
  );
}
