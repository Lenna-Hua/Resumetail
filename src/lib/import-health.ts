export type ImportHealthStatus = "ok" | "warn" | "poor";

export interface ImportHealthItem {
  id: string;
  label: string;
  status: ImportHealthStatus;
  detail: string;
}

export interface ImportHealthReport {
  items: ImportHealthItem[];
  overall: ImportHealthStatus;
  /** True when applying an ATS template would help. */
  suggestAtsTemplate: boolean;
}

const SECTION_CHECKS: { id: string; pattern: RegExp; label: string }[] = [
  { id: "experience", pattern: /\b(experience|work experience|employment)\b/i, label: "Experience" },
  { id: "education", pattern: /\beducation\b/i, label: "Education" },
  { id: "skills", pattern: /\bskills\b/i, label: "Skills" },
];

/**
 * Text-level ATS health after import (binary layout is already stripped by extractors).
 */
export function analyzeImportHealth(resumeText: string): ImportHealthReport {
  const text = resumeText.trim();
  const items: ImportHealthItem[] = [];

  if (text.length < 120) {
    items.push({
      id: "length",
      label: "Content",
      status: "poor",
      detail: "Extract looks very short — PDF/DOCX may have failed to parse.",
    });
  } else {
    items.push({
      id: "length",
      label: "Content",
      status: "ok",
      detail: "Enough text extracted for editing.",
    });
  }

  const foundSections = SECTION_CHECKS.filter((s) => s.pattern.test(text));
  if (foundSections.length === 0) {
    items.push({
      id: "sections",
      label: "Sections",
      status: "poor",
      detail: "No standard section titles detected (Experience, Education, Skills).",
    });
  } else if (foundSections.length < 3) {
    items.push({
      id: "sections",
      label: "Sections",
      status: "warn",
      detail: `Found: ${foundSections.map((s) => s.label).join(", ")}. Missing some standard headers.`,
    });
  } else {
    items.push({
      id: "sections",
      label: "Sections",
      status: "ok",
      detail: "Standard section titles detected.",
    });
  }

  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(text);
  if (!hasEmail && !hasPhone) {
    items.push({
      id: "contact",
      label: "Contact",
      status: "warn",
      detail: "No email or phone detected near the top — add contact info.",
    });
  } else {
    items.push({
      id: "contact",
      label: "Contact",
      status: "ok",
      detail: [hasEmail && "Email", hasPhone && "Phone"].filter(Boolean).join(" · ") + " found.",
    });
  }

  if (/\t{2,}/.test(text) || /\|/.test(text)) {
    items.push({
      id: "columns",
      label: "Layout",
      status: "warn",
      detail: "Column markers or pipes found — apply an ATS-safe single-column template.",
    });
  } else {
    items.push({
      id: "columns",
      label: "Layout",
      status: "ok",
      detail: "No obvious multi-column markers in extracted text.",
    });
  }

  const worst = items.some((i) => i.status === "poor")
    ? "poor"
    : items.some((i) => i.status === "warn")
      ? "warn"
      : "ok";

  const suggestAtsTemplate =
    worst !== "ok" ||
    items.some((i) => i.id === "columns" && i.status === "warn") ||
    items.some((i) => i.id === "sections" && i.status !== "ok");

  return { items, overall: worst, suggestAtsTemplate };
}
