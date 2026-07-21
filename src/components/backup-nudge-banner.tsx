"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { dismissBackupNudge, shouldShowBackupNudge } from "@/lib/backup-nudge";
import { STORAGE_READY_EVENT } from "@/lib/browser-store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

export function BackupNudgeBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const refresh = useCallback(() => {
    const onAppRoute = pathname === "/app" || pathname.startsWith("/app/");
    setVisible(onAppRoute && shouldShowBackupNudge());
  }, [pathname]);

  useEffect(() => {
    queueMicrotask(() => refresh());
    window.addEventListener(STORAGE_READY_EVENT, refresh);
    return () => window.removeEventListener(STORAGE_READY_EVENT, refresh);
  }, [refresh]);

  if (!visible) return null;

  return (
    <Alert className="mx-auto mb-4 max-w-[1600px] border-amber-500/40 bg-amber-500/5">
      <Download className="size-4 text-amber-700 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">
        Your resumes are only on this device
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-amber-900/90 dark:text-amber-100/90">
          Export a PDF backup regularly — browser storage can be cleared without warning,
          especially on mobile.
        </span>
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="min-h-9"
            onClick={() => {
              dismissBackupNudge();
              setVisible(false);
            }}
          >
            Remind me later
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="min-h-9"
            onClick={() => setVisible(false)}
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
