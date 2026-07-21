import type { MasterProfile } from "@/lib/types";
import { getLocalItem, setLocalItem } from "@/lib/browser-store";

const PROFILE_KEY = "resutail-master-profile-v1";

const SECTION_HEADING =
  /^(experience|work experience|employment|professional experience|education|skills|summary|projects?|personal projects?|certifications?|licenses?|community(?:\s*&\s*volunteer)?\s*experience|volunteer(?:\s*experience)?)$/i;

export const emptyMasterProfile = (): MasterProfile => ({
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedIn: "",
  portfolio: "",
  updatedAt: new Date().toISOString(),
});

export function loadMasterProfile(): MasterProfile {
  if (typeof window === "undefined") return emptyMasterProfile();
  try {
    const raw = getLocalItem(PROFILE_KEY);
    if (!raw) return emptyMasterProfile();
    return { ...emptyMasterProfile(), ...JSON.parse(raw) } as MasterProfile;
  } catch {
    return emptyMasterProfile();
  }
}

export function saveMasterProfile(profile: MasterProfile): void {
  if (typeof window === "undefined") return;
  setLocalItem(
    PROFILE_KEY,
    JSON.stringify({ ...profile, updatedAt: new Date().toISOString() }),
  );
}

export function updateMasterProfile(
  updates: Partial<Omit<MasterProfile, "updatedAt">>,
): MasterProfile {
  const next = {
    ...loadMasterProfile(),
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveMasterProfile(next);
  return next;
}

export function hasMasterProfile(profile: MasterProfile): boolean {
  return Boolean(
    profile.fullName.trim() ||
      profile.email.trim() ||
      profile.phone.trim() ||
      profile.location.trim(),
  );
}

export function masterProfileToHeaderText(profile: MasterProfile): string {
  const lines: string[] = [];
  if (profile.fullName.trim()) {
    lines.push(profile.fullName.trim().toUpperCase());
  }

  const contactParts = [profile.location, profile.phone, profile.email]
    .map((part) => part.trim())
    .filter(Boolean);
  if (contactParts.length > 0) {
    lines.push(contactParts.join(" | "));
  }

  const linkParts: string[] = [];
  if (profile.portfolio.trim()) {
    linkParts.push(
      profile.portfolio.includes(":")
        ? profile.portfolio.trim()
        : `Portfolio: ${profile.portfolio.trim()}`,
    );
  }
  if (profile.linkedIn.trim()) {
    linkParts.push(
      profile.linkedIn.includes(":")
        ? profile.linkedIn.trim()
        : `LinkedIn: ${profile.linkedIn.trim()}`,
    );
  }
  if (linkParts.length > 0) {
    lines.push(linkParts.join(" | "));
  }

  return lines.join("\n").trim();
}

function findFirstSectionLineIndex(lines: string[]): number {
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    if (SECTION_HEADING.test(trimmed)) return i;
    if (
      trimmed.length < 48 &&
      trimmed === trimmed.toUpperCase() &&
      /[A-Z]/.test(trimmed) &&
      !trimmed.includes("@") &&
      !trimmed.includes("|")
    ) {
      return i;
    }
  }
  return -1;
}

export function extractMasterProfileFromResume(resumeText: string): Partial<MasterProfile> {
  const lines = resumeText.split(/\r?\n/).map((line) => line.trim());
  const sectionIndex = findFirstSectionLineIndex(lines);
  const headerLines =
    sectionIndex === -1
      ? lines.filter(Boolean)
      : lines.slice(0, sectionIndex).filter(Boolean);

  if (headerLines.length === 0) return {};

  const profile: Partial<MasterProfile> = {
    fullName: headerLines[0],
  };

  const contactBlob = headerLines.slice(1).join(" ");
  const emailMatch = contactBlob.match(/[\w.+-]+@[\w.-]+\.\w+/);
  if (emailMatch) profile.email = emailMatch[0];

  const phoneMatch = contactBlob.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/,
  );
  if (phoneMatch) profile.phone = phoneMatch[0].trim();

  const linkedInMatch = contactBlob.match(/linkedin\.com\/[^\s|,)]+/i);
  if (linkedInMatch) profile.linkedIn = linkedInMatch[0];

  const portfolioMatch = contactBlob.match(
    /(?:portfolio:\s*)?([a-z0-9][-a-z0-9]*\.[a-z]{2,}(?:\/[^\s|,)]+)?)/i,
  );
  if (portfolioMatch && !portfolioMatch[0].includes("linkedin")) {
    profile.portfolio = portfolioMatch[1] ?? portfolioMatch[0];
  }

  const locationCandidate = headerLines[1]
    ?.split("|")
    .map((part) => part.trim())
    .find(
      (part) =>
        part &&
        !part.includes("@") &&
        !/linkedin|portfolio|http/i.test(part) &&
        !/\d{3}/.test(part),
    );
  if (locationCandidate) profile.location = locationCandidate;

  return profile;
}

export function applyMasterProfileToResumeText(
  resumeText: string,
  profile: MasterProfile,
): string {
  const header = masterProfileToHeaderText(profile);
  if (!header) return resumeText;

  const lines = resumeText.split(/\r?\n/);
  const sectionIndex = findFirstSectionLineIndex(lines);
  const body =
    sectionIndex === -1
      ? ""
      : lines
          .slice(sectionIndex)
          .join("\n")
          .trim();

  return body ? `${header}\n\n${body}` : header;
}

export function stripResumeHeader(resumeText: string): string {
  const lines = resumeText.split(/\r?\n/);
  const sectionIndex = findFirstSectionLineIndex(lines);
  if (sectionIndex <= 0) return resumeText.trim();
  return lines
    .slice(sectionIndex)
    .join("\n")
    .trim();
}
