"use client";

import { useEffect, useState } from "react";
import { FileText, ScanSearch, Sparkles, Download } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { fetchOnboarded, markOnboarded } from "@/lib/cloud-sync";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: FileText,
    title: "Import or paste your resume",
    description: "Upload a PDF/DOCX or paste plain text to start your first version.",
  },
  {
    icon: ScanSearch,
    title: "Paste a job description",
    description: "ResuTail compares your resume against the role automatically.",
  },
  {
    icon: Sparkles,
    title: "Review your match score",
    description: "Five transparent dimensions show exactly what to fix — no black box.",
  },
  {
    icon: Download,
    title: "Export your tailored resume",
    description: "Download an ATS-ready PDF or DOCX. Your data now syncs to this account everywhere.",
  },
];

export function FirstTimeWelcome() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    void fetchOnboarded(user.id).then((onboarded) => {
      if (!cancelled && !onboarded) setOpen(true);
    });
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  if (!open || !user) return null;

  async function handleDismiss() {
    if (!user) return;
    setDismissing(true);
    await markOnboarded(user.id);
    setOpen(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to ResuTail"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
          <h2 className="text-lg font-semibold tracking-tight">Welcome to ResuTail</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s how the core workflow goes:
          </p>

          <ol className="mt-5 space-y-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {index + 1}. {step.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <Button className="mt-6 w-full" onClick={handleDismiss} disabled={dismissing}>
            {dismissing ? "Let's go…" : "Got it, let's start"}
          </Button>
        </div>
      </div>
    </>
  );
}
