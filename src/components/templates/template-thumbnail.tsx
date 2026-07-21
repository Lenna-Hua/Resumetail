"use client";

import type { ResumeTemplateId } from "@/lib/resume-template-types";
import type { TemplateSettings } from "@/lib/resume-template-types";
import { getTemplate } from "@/lib/resume-templates";
import { ResumeDocumentView } from "@/components/templates/resume-document-view";
import { getSampleDisplayData } from "@/lib/resume-document";
import { FileText } from "lucide-react";

interface TemplateThumbnailProps {
  templateId: ResumeTemplateId;
  selected?: boolean;
  settings?: TemplateSettings;
  onClick?: () => void;
}

export function TemplateThumbnail({
  templateId,
  selected,
  settings,
  onClick,
}: TemplateThumbnailProps) {
  const template = getTemplate(templateId);
  const accent = settings?.accentColor ?? template.defaultAccentColor;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-lg border text-left transition-all ${
        selected
          ? "border-primary ring-2 ring-primary/25"
          : "border-border hover:border-primary/40"
      }`}
    >
      <div className="relative aspect-[8.5/11] overflow-hidden rounded-t-lg bg-neutral-100">
        <div className="absolute inset-0">
          <ResumeDocumentView
            data={getSampleDisplayData()}
            style={template.style}
            settings={{
              accentColor: accent,
              marginScale: 1,
              spacingScale: 1,
              fontFamily: settings?.fontFamily ?? "Helvetica",
            }}
            compact
            className="h-full w-full shadow-sm"
          />
        </div>
        {selected && (
          <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <svg viewBox="0 0 12 12" className="size-3" fill="currentColor">
              <path d="M10.2 2.4 4.8 8.4 1.8 5.4l1.2-1.2 1.8 1.8 4.2-4.8 1.2 1.2z" />
            </svg>
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-2 py-2">
        <span className="text-sm font-medium">{template.label}</span>
        <div className="flex gap-1">
          <FormatBadge label="PDF" />
          {template.supportsDocx && <FormatBadge label="DOCX" />}
        </div>
      </div>
    </button>
  );
}

function FormatBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded border border-border bg-muted/50 px-1 py-0.5 text-[9px] font-medium text-muted-foreground">
      <FileText className="size-2.5" />
      {label}
    </span>
  );
}
