"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, Mail } from "lucide-react";
import { createVersion } from "@/lib/resume-versions";
import { loadSession, saveSession } from "@/lib/storage";
import { saveSelectedTemplateId } from "@/lib/resume-templates";
import { DEFAULT_ATS_FONT } from "@/lib/ats-fonts";
import { analyzeImportHealth } from "@/lib/import-health";
import { loadTemplateSettings, saveTemplateSettings } from "@/lib/template-settings";
import {
  COVER_LETTER_STARTER_TEMPLATES,
  RESUME_STARTER_TEMPLATES,
} from "@/lib/starter-templates";
import { CreateFromLibrary } from "@/components/create-from-library";
import { ResumeFileUpload } from "@/components/resume-file-upload";
import { ImportHealthStrip } from "@/components/import-health-strip";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CreateTab = "starters" | "import" | "library";

export function CreateResumePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab: CreateTab =
    searchParams.get("tab") === "library"
      ? "library"
      : searchParams.get("tab") === "import"
        ? "import"
        : "starters";
  const [tab, setTab] = useState<CreateTab>(initialTab);
  const [text, setText] = useState("");
  const [preferAtsTemplate, setPreferAtsTemplate] = useState(false);

  const importHealth = useMemo(
    () => (text.trim().length > 40 ? analyzeImportHealth(text) : null),
    [text],
  );

  const finishCreate = (
    resumeText: string,
    options?: { templateId?: string; mode?: string; coverLetter?: string },
  ) => {
    if (!resumeText.trim()) return;
    const version = createVersion(resumeText.trim());
    const session = loadSession();

    const templateId = (preferAtsTemplate
      ? "simple-ats"
      : options?.templateId) as Parameters<typeof saveSelectedTemplateId>[0] | undefined;

    if (templateId) {
      saveSelectedTemplateId(templateId);
      if (preferAtsTemplate) {
        const settings = loadTemplateSettings(templateId);
        saveTemplateSettings({ ...settings, fontFamily: DEFAULT_ATS_FONT });
      }
    }

    saveSession({
      ...session,
      resumeText: resumeText.trim(),
      activeVersionId: version.id,
      ...(options?.coverLetter ? { coverLetterText: options.coverLetter } : {}),
    });

    const mode = options?.mode ?? "edit";
    router.push(`/app/v/${version.id}?mode=${mode}`);
  };

  const handleResumeStarter = (starterId: string) => {
    const starter = RESUME_STARTER_TEMPLATES.find((t) => t.id === starterId);
    if (!starter) return;
    finishCreate(starter.content, {
      templateId: starter.suggestedTemplateId,
      mode: "customize",
    });
  };

  const handleTabChange = (value: string) => {
    const next = value as CreateTab;
    setTab(next);
    router.replace(`/app/new?tab=${next}`, { scroll: false });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 pb-[env(safe-area-inset-bottom)] sm:px-6">
      <div className="flex items-center gap-2">
        <ButtonLink
          href="/app"
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="size-5" />
        </ButtonLink>
        <h1 className="text-xl font-semibold">New resume</h1>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="!h-auto grid w-full grid-cols-3 gap-1 p-1">
          <TabsTrigger value="starters" className="min-h-10 px-1 text-xs sm:px-2 sm:text-sm">
            Templates
          </TabsTrigger>
          <TabsTrigger value="import" className="min-h-10 px-1 text-xs sm:px-2 sm:text-sm">
            Import
          </TabsTrigger>
          <TabsTrigger value="library" className="min-h-10 px-1 text-xs sm:px-2 sm:text-sm">
            <span className="sm:hidden">Library</span>
            <span className="hidden sm:inline">From library</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="starters" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4" />
                Resume templates
              </CardTitle>
              <CardDescription>
                Pre-structured content with placeholder sections. Opens in Customize mode so you
                can pick presentation style right away.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {RESUME_STARTER_TEMPLATES.map((starter) => (
                <button
                  key={starter.id}
                  type="button"
                  onClick={() => handleResumeStarter(starter.id)}
                  className="rounded-lg border p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
                >
                  <p className="font-medium">{starter.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{starter.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="size-4" />
                Cover letter templates
              </CardTitle>
              <CardDescription>
                Use with a resume starter, or add later in Customize mode.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {COVER_LETTER_STARTER_TEMPLATES.map((starter) => (
                <button
                  key={starter.id}
                  type="button"
                  onClick={() => {
                    const resumeStarter = RESUME_STARTER_TEMPLATES[0];
                    finishCreate(resumeStarter.content, {
                      templateId: resumeStarter.suggestedTemplateId,
                      mode: "customize",
                      coverLetter: starter.content,
                    });
                  }}
                  className="rounded-lg border p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
                >
                  <p className="font-medium">{starter.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{starter.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Import or paste</CardTitle>
              <CardDescription>
                Upload PDF or DOCX, or paste your resume text. You can edit and tailor right after.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResumeFileUpload
                onExtracted={(extracted) => {
                  setText(extracted);
                  setPreferAtsTemplate(false);
                }}
              />

              <div className="space-y-2">
                <Label htmlFor="resume-paste">Resume text</Label>
                <Textarea
                  id="resume-paste"
                  rows={12}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setPreferAtsTemplate(false);
                  }}
                  placeholder="Or paste your full resume here…"
                  className="min-h-[200px] text-base"
                />
              </div>

              {importHealth && (
                <ImportHealthStrip
                  report={importHealth}
                  onApplyAtsTemplate={() => setPreferAtsTemplate(true)}
                />
              )}

              {preferAtsTemplate && (
                <p className="text-xs text-muted-foreground">
                  Will open with the Simple ATS template and Helvetica.
                </p>
              )}

              <Button
                className="min-h-11 w-full max-w-full"
                onClick={() =>
                  finishCreate(text, preferAtsTemplate ? { templateId: "simple-ats" } : undefined)
                }
                disabled={!text.trim()}
              >
                <span className="truncate">Create and open editor</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="mt-4">
          <CreateFromLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
}
