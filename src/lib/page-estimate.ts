import type { TemplateSettings } from "@/lib/resume-template-types";
import { getTemplate } from "@/lib/resume-templates";
import type { ResumeTemplateId } from "@/lib/resume-template-types";

export interface PageEstimate {
  estimatedPages: number;
  chars: number;
  lines: number;
  charsPerPage: number;
}

export interface TrimSuggestion {
  id: string;
  severity: "info" | "warn";
  message: string;
}

/**
 * Heuristic page estimate from character/line budgets (not pixel-perfect).
 * Assumes US Letter, ~body font size and margins from template settings.
 */
export function estimatePageCount(
  resumeText: string,
  templateId: ResumeTemplateId = "classic",
  settings?: Pick<TemplateSettings, "marginScale" | "spacingScale">,
): PageEstimate {
  const template = getTemplate(templateId);
  const marginScale = settings?.marginScale ?? 1;
  const spacingScale = settings?.spacingScale ?? 1;

  const usableHeightPt = 792 - 54 * 2 * marginScale; // letter height − margins
  const lineHeight = template.lineHeight * spacingScale;
  const linesPerPage = Math.max(28, Math.floor(usableHeightPt / lineHeight));
  const avgCharsPerLine = Math.max(55, Math.round(95 - template.fontSize * 2));
  const charsPerPage = linesPerPage * avgCharsPerLine;

  const chars = resumeText.replace(/\s+/g, " ").trim().length;
  const lines = resumeText.split(/\r?\n/).filter((l) => l.trim()).length;
  const byChars = chars / charsPerPage;
  const byLines = lines / linesPerPage;
  const estimatedPages = Math.max(1, Math.ceil(Math.max(byChars, byLines) * 10) / 10);

  return {
    estimatedPages: Math.round(estimatedPages * 10) / 10,
    chars,
    lines,
    charsPerPage,
  };
}

/**
 * Suggest trims when content exceeds a target page count (default 1, soft max 2).
 */
export function suggestTrim(
  resumeText: string,
  targetPages = 1,
  templateId: ResumeTemplateId = "classic",
  settings?: Pick<TemplateSettings, "marginScale" | "spacingScale">,
): TrimSuggestion[] {
  const estimate = estimatePageCount(resumeText, templateId, settings);
  const suggestions: TrimSuggestion[] = [];

  if (estimate.estimatedPages <= targetPages) {
    suggestions.push({
      id: "length-ok",
      severity: "info",
      message: `About ${estimate.estimatedPages} page(s) — within the ${targetPages}-page target.`,
    });
    return suggestions;
  }

  suggestions.push({
    id: "over-target",
    severity: "warn",
    message: `Estimated ~${estimate.estimatedPages} pages (target ${targetPages}). Trim for human reviewers; ATS usually ignores length.`,
  });

  const lower = resumeText.toLowerCase();
  const summaryMatch = resumeText.match(
    /(?:summary|profile|about)\s*\n([\s\S]*?)(?=\n(?:experience|education|skills|projects)\b|$)/i,
  );
  if (summaryMatch && summaryMatch[1] && summaryMatch[1].trim().length > 400) {
    suggestions.push({
      id: "shorten-summary",
      severity: "warn",
      message: "Shorten the Summary/Profile to 2–3 sentences.",
    });
  }

  const bulletLines = resumeText
    .split(/\r?\n/)
    .filter((l) => /^[\s•\-\*]/.test(l) || (l.trim().length > 40 && /[,.]/.test(l)));
  if (bulletLines.length > 18) {
    suggestions.push({
      id: "trim-bullets",
      severity: "warn",
      message: "Drop weaker or older role bullets — keep the strongest 3–5 per recent role.",
    });
  }

  if (/projects/i.test(lower) && estimate.estimatedPages > 1.5) {
    suggestions.push({
      id: "projects-optional",
      severity: "info",
      message: "Consider moving less relevant Projects into an optional section or removing them.",
    });
  }

  if (estimate.estimatedPages > 2) {
    suggestions.push({
      id: "hard-cap",
      severity: "warn",
      message: "Over 2 pages — tighten spacing in Customize or cut older roles entirely.",
    });
  }

  return suggestions;
}
