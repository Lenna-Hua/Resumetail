import type { AppSession } from "@/lib/types";
import { createSeedSession } from "@/lib/seed-profile";
import { getLocalItem, removeLocalItem, setLocalItem } from "@/lib/browser-store";

const STORAGE_KEY = "resutail-session-v1";
const HAS_SESSION_KEY = "resutail-has-session";

export const emptySession = (): AppSession => ({
  resumeText: "",
  jdText: "",
  parsedJD: null,
  bullets: [],
  coverage: null,
  atsResult: null,
  matchScore: null,
  activeVersionId: null,
  coverLetterText: "",
  coverLetterTone: "concise",
  coverLetterTemplate: "standard-business",
  updatedAt: new Date().toISOString(),
});

export function loadSession(): AppSession {
  if (typeof window === "undefined") return emptySession();
  try {
    const raw = getLocalItem(STORAGE_KEY);
    if (!raw) {
      if (!getLocalItem(HAS_SESSION_KEY)) return createSeedSession();
      return emptySession();
    }
    return { ...emptySession(), ...JSON.parse(raw) } as AppSession;
  } catch {
    return emptySession();
  }
}

export function saveSession(session: AppSession): void {
  if (typeof window === "undefined") return;
  setLocalItem(HAS_SESSION_KEY, "1");
  setLocalItem(
    STORAGE_KEY,
    JSON.stringify({ ...session, updatedAt: new Date().toISOString() }),
  );
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  setLocalItem(HAS_SESSION_KEY, "1");
  removeLocalItem(STORAGE_KEY);
}
