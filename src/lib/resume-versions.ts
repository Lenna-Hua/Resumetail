import type { ResumeVersion } from "@/lib/types";
import { getLocalItem, setLocalItem } from "@/lib/browser-store";

const VERSIONS_KEY = "resutail-versions-v1";

function generateId(): string {
  return `ver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadVersions(): ResumeVersion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = getLocalItem(VERSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ResumeVersion[];
  } catch {
    return [];
  }
}

function saveVersions(versions: ResumeVersion[]): void {
  if (typeof window === "undefined") return;
  setLocalItem(VERSIONS_KEY, JSON.stringify(versions));
}

export function getVersion(id: string): ResumeVersion | undefined {
  return loadVersions().find((v) => v.id === id);
}

export function createVersion(
  resumeText: string,
  name?: string,
): ResumeVersion {
  const now = new Date().toISOString();
  const version: ResumeVersion = {
    id: generateId(),
    name: name ?? `Resume ${loadVersions().length + 1}`,
    resumeText,
    baseText: resumeText,
    createdAt: now,
    updatedAt: now,
  };
  const versions = [...loadVersions(), version];
  saveVersions(versions);
  return version;
}

export function duplicateVersion(
  sourceId: string,
  name?: string,
): ResumeVersion | null {
  const source = getVersion(sourceId);
  if (!source) return null;

  const now = new Date().toISOString();
  const copy: ResumeVersion = {
    id: generateId(),
    name: name ?? `${source.name} (copy)`,
    resumeText: source.resumeText,
    baseText: source.baseText,
    tailoredFor: source.tailoredFor ?? null,
    createdAt: now,
    updatedAt: now,
  };
  saveVersions([...loadVersions(), copy]);
  return copy;
}

/** Save current resume text as a new version labeled for a target role. */
export function saveTailoredVersion(
  sourceId: string,
  resumeText: string,
  roleTitle: string,
): ResumeVersion | null {
  const source = getVersion(sourceId);
  if (!source || !roleTitle.trim()) return null;

  const now = new Date().toISOString();
  const version: ResumeVersion = {
    id: generateId(),
    name: `${roleTitle.trim()} — tailored`,
    resumeText,
    baseText: source.baseText,
    tailoredFor: roleTitle.trim(),
    createdAt: now,
    updatedAt: now,
  };
  saveVersions([...loadVersions(), version]);
  return version;
}

export function updateVersion(
  id: string,
  updates: Partial<Pick<ResumeVersion, "name" | "resumeText">>,
): ResumeVersion | null {
  const versions = loadVersions();
  const index = versions.findIndex((v) => v.id === id);
  if (index === -1) return null;

  versions[index] = {
    ...versions[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveVersions(versions);
  return versions[index];
}

export function deleteVersion(id: string): void {
  saveVersions(loadVersions().filter((v) => v.id !== id));
}

export function ensureVersion(resumeText: string): ResumeVersion {
  const versions = loadVersions();
  if (versions.length === 0 && resumeText.trim()) {
    return createVersion(resumeText);
  }
  return versions[0];
}
