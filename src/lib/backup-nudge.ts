import { getLocalItem, setLocalItem } from "@/lib/browser-store";
import { loadVersions } from "@/lib/resume-versions";
import { loadSession } from "@/lib/storage";

const LAST_EXPORT_KEY = "resutail-last-export-v1";
const DISMISS_UNTIL_KEY = "resutail-backup-nudge-dismiss-v1";

const EXPORT_REMINDER_MS = 7 * 24 * 60 * 60 * 1000;
const DISMISS_SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

export function markLastExport(): void {
  setLocalItem(LAST_EXPORT_KEY, new Date().toISOString());
}

export function dismissBackupNudge(): void {
  const until = new Date(Date.now() + DISMISS_SNOOZE_MS).toISOString();
  setLocalItem(DISMISS_UNTIL_KEY, until);
}

export function shouldShowBackupNudge(): boolean {
  if (typeof window === "undefined") return false;

  const dismissUntil = getLocalItem(DISMISS_UNTIL_KEY);
  if (dismissUntil && Date.parse(dismissUntil) > Date.now()) return false;

  const session = loadSession();
  const versions = loadVersions();
  const hasData =
    session.resumeText.trim().length > 80 ||
    versions.some((v) => v.resumeText.trim().length > 80);
  if (!hasData) return false;

  const lastExport = getLocalItem(LAST_EXPORT_KEY);
  if (!lastExport) return true;

  return Date.now() - Date.parse(lastExport) > EXPORT_REMINDER_MS;
}
