"use client";

import type { ResumeTemplateId } from "@/lib/resume-template-types";
import type { TemplateSettings } from "@/lib/resume-template-types";
import { RESUME_TEMPLATES } from "@/lib/resume-templates";
import { TemplateThumbnail } from "@/components/templates/template-thumbnail";
import { TemplatePreview } from "@/components/template-preview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutTemplate } from "lucide-react";

interface TemplatePickerProps {
  selectedId: ResumeTemplateId;
  onSelect: (id: ResumeTemplateId) => void;
  previewText?: string;
  settings?: TemplateSettings;
}

export function TemplatePicker({
  selectedId,
  onSelect,
  previewText,
  settings,
}: TemplatePickerProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <LayoutTemplate className="size-4" />
          Template
        </CardTitle>
        <CardDescription>
          Content stays the same — switch presentation style before export.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4">
          {RESUME_TEMPLATES.map((template) => (
            <TemplateThumbnail
              key={template.id}
              templateId={template.id}
              selected={template.id === selectedId}
              settings={settings}
              onClick={() => onSelect(template.id)}
            />
          ))}
        </div>

        {previewText !== undefined && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Live preview</p>
            <TemplatePreview resumeText={previewText} templateId={selectedId} settings={settings} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
