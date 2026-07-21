"use client";

import { useMemo, useState } from "react";
import type { ResumeTemplateId, ResumeTemplateFilter, TemplateSettings } from "@/lib/resume-template-types";
import { ATS_FONT_WHITELIST, type AtsFontFamily } from "@/lib/ats-fonts";
import { getTemplate, RESUME_TEMPLATES } from "@/lib/resume-templates";
import { ACCENT_COLOR_PRESETS, saveTemplateSettings } from "@/lib/template-settings";
import {
  TEMPLATE_FILTER_OPTIONS,
  filterResumeTemplates,
} from "@/lib/resume-template-filters";
import { TemplatePreview } from "@/components/template-preview";
import { TemplateThumbnail } from "@/components/templates/template-thumbnail";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CustomizeTab = "template" | "text" | "layout";

const CUSTOMIZE_TABS: { id: CustomizeTab; label: string; shortLabel: string }[] = [
  { id: "template", label: "Template & colors", shortLabel: "Template" },
  { id: "text", label: "Text", shortLabel: "Text" },
  { id: "layout", label: "Layout", shortLabel: "Layout" },
];

interface CustomizePanelProps {
  resumeText: string;
  selectedTemplateId: ResumeTemplateId;
  onTemplateSelect: (id: ResumeTemplateId) => void;
  settings: TemplateSettings;
  onSettingsChange: (settings: TemplateSettings) => void;
  /** Hide inline preview when shown in split-pane or bottom sheet */
  showPreview?: boolean;
}

export function CustomizePanel({
  resumeText,
  selectedTemplateId,
  onTemplateSelect,
  settings,
  onSettingsChange,
  showPreview = true,
}: CustomizePanelProps) {
  const [filter, setFilter] = useState<ResumeTemplateFilter>("all");
  const [tab, setTab] = useState<CustomizeTab>("template");

  const filteredTemplates = useMemo(
    () => filterResumeTemplates(RESUME_TEMPLATES, filter),
    [filter],
  );

  const selectedTemplate = getTemplate(selectedTemplateId);
  const showAtsLayoutWarning = !selectedTemplate.atsSafe;

  const updateSettings = (patch: Partial<TemplateSettings>) => {
    const next = { ...settings, ...patch };
    onSettingsChange(next);
    saveTemplateSettings(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-1">
        {CUSTOMIZE_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2 text-xs font-medium transition-colors",
              tab === item.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="sm:hidden">{item.shortLabel}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </div>

      {tab === "template" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Template & colors</CardTitle>
            <CardDescription>
              Pick a layout — your resume content stays the same. Prefer ATS-safe
              single-column templates when applying online.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAtsLayoutWarning && (
              <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                Uses columns or tables — may hurt ATS parsing. Prefer an ATS-safe
                single-column template for job portals.
              </p>
            )}

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Main color</Label>
              <div className="flex flex-wrap items-center gap-2">
                {ACCENT_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    title={preset.label}
                    onClick={() => updateSettings({ accentColor: preset.value })}
                    className={`size-9 rounded-full border-2 transition-transform hover:scale-105 ${
                      settings.accentColor === preset.value
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border"
                    }`}
                    style={{ backgroundColor: preset.value }}
                    aria-label={preset.label}
                  />
                ))}
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => updateSettings({ accentColor: e.target.value })}
                  className="size-9 cursor-pointer rounded-full border border-border"
                  aria-label="Custom color"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_FILTER_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  size="sm"
                  variant={filter === option.id ? "default" : "outline"}
                  className="h-8 rounded-full px-3 text-xs"
                  onClick={() => setFilter(option.id)}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            {filteredTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No templates match this filter.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <TemplateThumbnail
                    key={template.id}
                    templateId={template.id}
                    selected={template.id === selectedTemplateId}
                    settings={settings}
                    onClick={() => {
                      onTemplateSelect(template.id);
                      updateSettings({ accentColor: template.defaultAccentColor });
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "text" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Text & typography</CardTitle>
            <CardDescription>
              Whitelisted fonts only — common faces ATS systems parse reliably.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="font-family">Font family</Label>
              <select
                id="font-family"
                value={settings.fontFamily}
                onChange={(e) =>
                  updateSettings({ fontFamily: e.target.value as AtsFontFamily })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {ATS_FONT_WHITELIST.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <Label htmlFor="spacing-scale">Spacing</Label>
                <span className="tabular-nums text-muted-foreground">
                  {Math.round(settings.spacingScale * 100)}%
                </span>
              </div>
              <input
                id="spacing-scale"
                type="range"
                min={0.85}
                max={1.25}
                step={0.05}
                value={settings.spacingScale}
                onChange={(e) => updateSettings({ spacingScale: Number(e.target.value) })}
                className="w-full accent-primary"
              />
              <p className="text-xs text-muted-foreground">
                Tighter spacing fits more on one page; looser spacing improves readability.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "layout" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Page layout</CardTitle>
            <CardDescription>Adjust margins and overall page density for export.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <Label htmlFor="margin-scale">Margins</Label>
                <span className="tabular-nums text-muted-foreground">
                  {Math.round(settings.marginScale * 100)}%
                </span>
              </div>
              <input
                id="margin-scale"
                type="range"
                min={0.75}
                max={1.25}
                step={0.05}
                value={settings.marginScale}
                onChange={(e) => updateSettings({ marginScale: Number(e.target.value) })}
                className="w-full accent-primary"
              />
              <p className="text-xs text-muted-foreground">
                Smaller margins use more of the page; larger margins add whitespace.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {showPreview && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Live preview</CardTitle>
            <CardDescription>Full-page preview with your content and selected template.</CardDescription>
          </CardHeader>
          <CardContent>
            <TemplatePreview
              resumeText={resumeText}
              templateId={selectedTemplateId}
              settings={settings}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
