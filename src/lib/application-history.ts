import type { ApplicationRecord, AppSession } from "@/lib/types";
import { getLocalItem, setLocalItem } from "@/lib/browser-store";
import { getVersion } from "@/lib/resume-versions";

const HISTORY_KEY = "resutail-application-history-v1";
const MAX_RECORDS = 50;

function generateId(): string {
  return `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadApplicationHistory(): ApplicationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = getLocalItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ApplicationRecord[];
  } catch {
    return [];
  }
}

function saveHistory(records: ApplicationRecord[]): void {
  setLocalItem(HISTORY_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
}

export function recordApplicationAnalysis(
  session: AppSession,
  versionId: string | null,
): ApplicationRecord | null {
  if (!session.parsedJD || !versionId) return null;

  const version = getVersion(versionId);
  const record: ApplicationRecord = {
    id: generateId(),
    versionId,
    versionName: version?.name ?? "Resume",
    roleTitle: session.parsedJD.roleTitle,
    jdSnippet: session.jdText.trim().slice(0, 200),
    matchScore: session.matchScore?.overall ?? null,
    analyzedAt: new Date().toISOString(),
  };

  const existing = loadApplicationHistory();
  const deduped = existing.filter(
    (r) =>
      !(
        r.versionId === record.versionId &&
        r.roleTitle === record.roleTitle &&
        Math.abs(new Date(r.analyzedAt).getTime() - Date.now()) < 60_000
      ),
  );
  saveHistory([record, ...deduped]);
  return record;
}

export function getHistoryForVersion(versionId: string): ApplicationRecord[] {
  return loadApplicationHistory().filter((r) => r.versionId === versionId);
}

export function deleteApplicationRecord(id: string): void {
  saveHistory(loadApplicationHistory().filter((r) => r.id !== id));
}
