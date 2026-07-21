"use client";

import { useEffect, useState } from "react";
import { decodeSharePayload, type SharePayload } from "@/lib/share-link";
import { toAtsPlainText } from "@/lib/ats-text-preview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ExternalLink } from "lucide-react";

export function ShareView() {
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) {
      queueMicrotask(() => {
        setError("No resume data in this link.");
        setLoading(false);
      });
      return;
    }

    void decodeSharePayload(hash)
      .then((decoded) => {
        if (!decoded) {
          setError("This share link is invalid or expired.");
          return;
        }
        setPayload(decoded);
      })
      .catch(() => setError("Could not read this share link."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading shared resume…</p>;
  }

  if (error || !payload) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Unable to open link</AlertTitle>
        <AlertDescription>{error ?? "Unknown error"}</AlertDescription>
      </Alert>
    );
  }

  const atsPreview = toAtsPlainText(payload.resumeText);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          View only
        </p>
        <h1 className="text-2xl font-semibold">{payload.name}</h1>
        <p className="text-sm text-muted-foreground">
          Shared via ResuTail. This is a read-only snapshot — not a live editable version.
        </p>
        <ButtonLink href="/app" className="min-h-11">
          <ExternalLink className="size-4" />
          Open ResuTail
        </ButtonLink>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resume</CardTitle>
          <CardDescription>Plain-text view of the shared content.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-4 font-mono text-sm">
            {payload.resumeText}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ATS plain-text preview</CardTitle>
          <CardDescription>What a basic parser may extract.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-3 font-mono text-xs">
            {atsPreview}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
