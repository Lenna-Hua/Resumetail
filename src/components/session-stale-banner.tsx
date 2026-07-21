"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

const STALE_MS = 10 * 60 * 1000;
const DISMISS_KEY = "resutail-stale-warn-dismiss";

export function SessionStaleBanner() {
  const [visible, setVisible] = useState(false);
  const [hiddenAt, setHiddenAt] = useState<number | null>(null);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        setHiddenAt(Date.now());
        return;
      }
      if (document.visibilityState !== "visible" || hiddenAt === null) return;
      const away = Date.now() - hiddenAt;
      setHiddenAt(null);
      if (away < STALE_MS) return;
      try {
        if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
      } catch {
        /* ignore */
      }
      setVisible(true);
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [hiddenAt]);

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Alert className="mb-3 border-amber-500/40 bg-amber-500/10">
      <AlertTriangle className="size-4 text-amber-700 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">Welcome back</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-2 text-amber-900/90 dark:text-amber-100/90">
        <span>
          You were away for a while. Your edits should still be here — export a PDF backup if
          you made important changes.
        </span>
        <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" onClick={dismiss}>
          <X className="size-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
