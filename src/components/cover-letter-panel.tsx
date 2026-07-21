"use client";

import { useState } from "react";
import type { CoverLetterTone, CoverLetterTemplateId, ParsedJD } from "@/lib/types";
import { COVER_LETTER_TONES } from "@/lib/cover-letter-tones";
import { COVER_LETTER_TEMPLATES } from "@/lib/cover-letter-templates";
import { jdToSummary } from "@/lib/jd-summary";
import { exportCoverLetterDocx } from "@/lib/docx-export";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, Loader2, Sparkles, Wand2 } from "lucide-react";

interface CoverLetterPanelProps {
  resumeText: string;
  parsedJD: ParsedJD | null;
  jdText: string;
  letterText: string;
  tone: CoverLetterTone;
  templateId: CoverLetterTemplateId;
  onLetterChange: (text: string) => void;
  onToneChange: (tone: CoverLetterTone) => void;
  onTemplateChange: (templateId: CoverLetterTemplateId) => void;
  onError: (message: string | null) => void;
}

export function CoverLetterPanel({
  resumeText,
  parsedJD,
  jdText,
  letterText,
  tone,
  templateId,
  onLetterChange,
  onToneChange,
  onTemplateChange,
  onError,
}: CoverLetterPanelProps) {
  const [highlights, setHighlights] = useState<string[]>([]);
  const [drafting, setDrafting] = useState(false);
  const [humanizing, setHumanizing] = useState(false);
  const [copied, setCopied] = useState(false);

  const canDraft =
    resumeText.trim().length > 0 && (parsedJD || jdText.trim().length >= 50);

  const handleDraft = async () => {
    onError(null);
    setDrafting(true);
    setHighlights([]);

    try {
      const jdSummary = parsedJD
        ? jdToSummary(parsedJD)
        : `Job posting excerpt:\n${jdText.slice(0, 4000)}`;

      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jdSummary,
          roleTitle: parsedJD?.roleTitle,
          tone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to draft cover letter");

      onLetterChange(data.letter);
      setHighlights(data.highlights ?? []);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setDrafting(false);
    }
  };

  const handleHumanize = async () => {
    if (!letterText.trim()) return;
    onError(null);
    setHumanizing(true);

    try {
      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: letterText,
          context: parsedJD?.roleTitle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to humanize");

      onLetterChange(data.text);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setHumanizing(false);
    }
  };

  const handleCopy = async () => {
    if (!letterText.trim()) return;
    await navigator.clipboard.writeText(letterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cover letter</CardTitle>
        <CardDescription>
          Optional — draft from your resume and job description, then edit freely.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs
          value={tone}
          onValueChange={(v) => onToneChange(v as CoverLetterTone)}
        >
          <TabsList className="grid w-full grid-cols-3">
            {COVER_LETTER_TONES.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="px-1 text-[11px] sm:px-2 sm:text-sm">
                <span className="truncate sm:hidden">{t.label.split(" ")[0]}</span>
                <span className="hidden truncate sm:inline">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {COVER_LETTER_TONES.map((t) => (
            <TabsContent key={t.id} value={t.id} className="mt-2">
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </TabsContent>
          ))}
        </Tabs>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Export layout</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {COVER_LETTER_TEMPLATES.map((template) => {
              const active = template.id === templateId;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onTemplateChange(template.id)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <p className="text-xs font-medium">{template.label}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{template.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleDraft} disabled={!canDraft || drafting || humanizing}>
            {drafting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Draft cover letter
          </Button>
          <Button
            variant="outline"
            onClick={handleHumanize}
            disabled={!letterText.trim() || drafting || humanizing}
          >
            {humanizing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Wand2 className="size-3.5" />
            )}
            Humanize
          </Button>
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={!letterText.trim()}
          >
            <Copy className="size-3.5" />
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="outline"
            onClick={() => exportCoverLetterDocx(letterText, "resutail-cover-letter.docx", templateId)}
            disabled={!letterText.trim()}
          >
            <Download className="size-3.5" />
            Export DOCX
          </Button>
        </div>

        {!parsedJD && jdText.trim().length < 50 && (
          <p className="text-xs text-muted-foreground">
            Paste a job description (or analyze it) before drafting.
          </p>
        )}

        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {highlights.map((h) => (
              <Badge key={h} variant="secondary" className="text-xs">
                {h}
              </Badge>
            ))}
          </div>
        )}

        <Textarea
          rows={12}
          value={letterText}
          onChange={(e) => onLetterChange(e.target.value)}
          placeholder="Your cover letter will appear here after drafting, or paste your own."
          className="text-base md:text-sm"
        />
      </CardContent>
    </Card>
  );
}
