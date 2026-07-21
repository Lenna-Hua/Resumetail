import type { ResumeBullet } from "@/lib/types";

const SECTION_PATTERNS = [
  { name: "Experience", pattern: /^(experience|work experience|employment|professional experience)\s*$/i },
  { name: "Education", pattern: /^(education|academic background)\s*$/i },
  { name: "Skills", pattern: /^(skills|technical skills|core competencies)\s*$/i },
  { name: "Projects", pattern: /^(projects|personal projects?)\s*$/i },
  {
    name: "Community",
    pattern: /^(community(?:\s*&\s*volunteer)?\s*experience|volunteer(?:\s*experience)?)\s*$/i,
  },
  { name: "Certifications", pattern: /^(certifications?|licenses?)\s*$/i },
  { name: "Summary", pattern: /^(summary|professional summary|profile|about)\s*$/i },
];

const BULLET_PREFIX = /^[\s•\-\*\u2022\u2013\u2014]+/;

function isBulletLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (BULLET_PREFIX.test(trimmed)) return true;
  return trimmed.length > 20 && /^[A-Z]/.test(trimmed) && trimmed.includes(",");
}

function cleanBullet(line: string): string {
  return line.trim().replace(BULLET_PREFIX, "").trim();
}

export function parseResumeBullets(resumeText: string): ResumeBullet[] {
  const lines = resumeText.split(/\r?\n/);
  let currentSection = "General";
  const bullets: ResumeBullet[] = [];
  let id = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const sectionMatch = SECTION_PATTERNS.find((s) => s.pattern.test(line));
    if (sectionMatch) {
      currentSection = sectionMatch.name;
      continue;
    }

    if (isBulletLine(rawLine)) {
      const text = cleanBullet(rawLine);
      if (text.length < 12) continue;
      bullets.push({
        id: `bullet-${id++}`,
        section: currentSection,
        original: text,
        currentText: text,
        status: "pending",
      });
    }
  }

  if (bullets.length === 0) {
    const paragraphs = resumeText
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter((p) => p.length >= 40);

    paragraphs.slice(0, 12).forEach((text) => {
      bullets.push({
        id: `bullet-${id++}`,
        section: "General",
        original: text,
        currentText: text,
        status: "pending",
      });
    });
  }

  return bullets;
}
