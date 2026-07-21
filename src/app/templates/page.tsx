import type { Metadata } from "next";
import { ArrowRight, Mail } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  COVER_LETTER_STARTER_TEMPLATES,
  RESUME_STARTER_TEMPLATES,
} from "@/lib/starter-templates";
import { RESUME_TEMPLATES } from "@/lib/resume-templates";
import { COVER_LETTER_TEMPLATES } from "@/lib/cover-letter-templates";
import { TemplateThumbnail } from "@/components/templates/template-thumbnail";

export const metadata: Metadata = {
  title: "Templates — ResuTail",
  description:
    "ATS-friendly resume templates: Classic, Traditional, Professional, Prime ATS, Pure ATS, and more.",
};

export default function TemplatesPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Resume & cover letter templates
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Eight ATS-friendly layouts with clear hierarchy — Classic, Traditional, Professional,
              Prime ATS, Pure ATS, Specialist, Clean, and Simple ATS. Start with structured content,
              then customize color and export.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
              <ButtonLink href="/app/new" size="lg" className="min-h-11 w-full sm:w-auto">
                Create from template
                <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink
                href="/app/new?tab=import"
                size="lg"
                variant="outline"
                className="min-h-11 w-full sm:w-auto"
              >
                Import resume
              </ButtonLink>
              <ButtonLink
                href="/app"
                size="lg"
                variant="outline"
                className="min-h-11 w-full sm:w-auto"
              >
                Open workspace
              </ButtonLink>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="mb-6 text-2xl font-semibold">Resume layouts</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {RESUME_TEMPLATES.map((template) => (
                <TemplateThumbnail key={template.id} templateId={template.id} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-t py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="mb-6 text-2xl font-semibold">Content starters</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {RESUME_STARTER_TEMPLATES.map((starter) => (
                <Card key={starter.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{starter.label}</CardTitle>
                    <CardDescription>{starter.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ButtonLink href="/app/new" className="w-full">
                      Use template
                    </ButtonLink>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-6 flex items-center gap-3">
              <Mail className="size-5 text-primary" />
              <h2 className="text-2xl font-semibold">Cover letter starters</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {COVER_LETTER_STARTER_TEMPLATES.map((starter) => (
                <Card key={starter.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{starter.label}</CardTitle>
                    <CardDescription>{starter.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {COVER_LETTER_TEMPLATES.length} export layouts available in Customize mode.
            </p>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        ResuTail — ATS guidance, not guarantees.
      </footer>
    </>
  );
}
