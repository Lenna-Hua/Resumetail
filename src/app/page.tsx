import type { Metadata } from "next";
import { ArrowRight, LayoutDashboard, LayoutTemplate, Shield, Target } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RESUME_STARTER_TEMPLATES } from "@/lib/starter-templates";

export const metadata: Metadata = {
  title: "ResuTail — Resume tailoring workspace",
  description:
    "Import your resume, compare it to a job description, see what's missing, edit fast, and export an ATS-ready version. Checker-first — AI only when you ask.",
};

const features = [
  {
    icon: LayoutDashboard,
    title: "Tailoring workspace",
    description:
      "Import an existing resume, paste a job posting, and work in one screen — editor, match insights, and checks side by side.",
  },
  {
    icon: Target,
    title: "Explainable match score",
    description:
      "Five visible dimensions — keywords, sections, formatting, bullets, contact — not one opaque number or hiring prediction.",
  },
  {
    icon: LayoutTemplate,
    title: "Templates & customize",
    description:
      "Start from ATS-safe resume and cover letter starters. Customize mode lets you pick layout, accent color, and spacing before PDF export.",
  },
  {
    icon: Shield,
    title: "Local-first, optional sync",
    description:
      "Guest mode keeps versions in your browser. Sign in only if you want cloud sync across devices. Checks run without AI.",
  },
];

const steps = [
  "Upload or paste your resume",
  "Paste the target job description",
  "See gaps and match score instantly",
  "Edit and optionally rewrite bullets",
  "Export an ATS-safe PDF",
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 overflow-x-hidden">
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-medium text-primary">
              Checker-first · Multi-version · ATS-smart
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Tailor the resume you already have — fast
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              ResuTail is a resume optimization workspace for people who apply to many roles.
              Import a version, compare it to a job posting, see what&apos;s missing, edit in
              place, and export — with optional AI help only when you want it.
            </p>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
              <ButtonLink href="/app/new?tab=import" size="lg" className="min-h-11 w-full sm:w-auto">
                Import resume
              </ButtonLink>
              <ButtonLink href="/app" size="lg" variant="outline" className="min-h-11 w-full sm:w-auto">
                Open workspace
              </ButtonLink>
              <ButtonLink
                href="/templates"
                size="lg"
                variant="outline"
                className="min-h-11 w-full sm:w-auto"
              >
                Browse templates
              </ButtonLink>
              <ButtonLink
                href="#how-it-works"
                size="lg"
                variant="ghost"
                className="min-h-11 w-full sm:w-auto"
              >
                How it works
              </ButtonLink>
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <Card key={f.title} className="border-border/80">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {f.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section id="templates" className="border-t bg-muted/30 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-semibold">ATS-friendly template library</h2>
              <p className="mt-2 text-muted-foreground">
                Classic, Traditional, Professional, Prime ATS, Pure ATS, and more — with clear
                section hierarchy and PDF/DOCX export.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {RESUME_STARTER_TEMPLATES.map((starter) => (
                <Card key={starter.id} className="border-border/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{starter.label}</CardTitle>
                    <CardDescription className="text-sm">{starter.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ButtonLink href="/app/new" variant="outline" className="w-full">
                      Use template
                    </ButtonLink>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <ButtonLink href="/templates" variant="outline">
                View all templates
                <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-semibold">How it works</h2>
            <ol className="mt-8 space-y-3">
              {steps.map((step, i) => (
                <li
                  key={step}
                  className="flex items-start gap-3 rounded-lg border bg-background px-4 py-3 text-sm"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="privacy" className="border-t py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy & data</CardTitle>
                <CardDescription>Plain language, no legalese wall.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Local-first (default):</strong> Resume
                  versions, job descriptions, and edits stay in your browser (IndexedDB with a
                  localStorage cache). File uploads are parsed on-device. You can use the full
                  checker workspace as a guest — no account required.
                </p>
                <p>
                  <strong className="text-foreground">Optional account sync:</strong> If you sign
                  in, we store a copy of your workspace data in Supabase (`user_data`) so versions
                  follow you across devices. Sync is opt-in; guest mode never writes to the cloud.
                </p>
                <p>
                  <strong className="text-foreground">What runs without AI:</strong> Match scoring,
                  keyword gaps, ATS formatting checks, offline JD analyze (heuristics), and
                  plain-text preview all run in your browser.
                </p>
                <p>
                  <strong className="text-foreground">When AI is used:</strong> Only on explicit
                  actions — AI-refined Analyze (when keys are configured), Rewrite bullet, cover
                  letter, or Humanize. That text is sent to our serverless API (Gemini, with
                  optional Groq fallback). We do not use AI content for ads or model training.
                </p>
                <p>
                  <strong className="text-foreground">AI limits:</strong> Roughly 20 AI calls per
                  day per IP on the free tier. Offline Analyze still works when the quota is hit.
                </p>
                <p>
                  Use <strong className="text-foreground">Clear data</strong> in the app anytime to
                  wipe your local session.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        ResuTail — ATS guidance, not guarantees.
      </footer>
    </>
  );
}
