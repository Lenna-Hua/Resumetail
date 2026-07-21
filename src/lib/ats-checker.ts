import type { ATSCheckResult, AtsSiteOverview, CoverageSummary, ParsedJD } from "@/lib/types";
import { computeCoverage } from "@/lib/coverage";
import { toAtsPlainText } from "@/lib/ats-text-preview";
const BUZZWORDS = [
  "synergy",
  "leverage",
  "paradigm",
  "rockstar",
  "ninja",
  "guru",
  "passionate",
  "dynamic",
  "go-getter",
  "results-driven",
  "team player",
  "hard-working",
  "detail-oriented",
  "think outside the box",
];

const SECTION_HEADERS = [
  "experience",
  "education",
  "skills",
  "summary",
  "projects",
  "certifications",
];

function hasMetric(text: string): boolean {
  return /\d|%|\$|k\b|million|billion|increased|reduced|improved|saved/i.test(text);
}

export function runAtsCheck(
  resumeText: string,
  parsedJD: ParsedJD | null,
  coverage?: CoverageSummary | null,
): ATSCheckResult {
  const lower = resumeText.toLowerCase();
  const structureNotes: string[] = [];
  let structureStatus: ATSCheckResult["structure"]["status"] = "good";

  const foundSections = SECTION_HEADERS.filter((h) => lower.includes(h));
  if (foundSections.length < 2) {
    structureStatus = "warning";
    structureNotes.push(
      "Add clear section headings (Experience, Education, Skills) for ATS parsers.",
    );
  } else {
    structureNotes.push(`Detected sections: ${foundSections.join(", ")}.`);
  }

  if (/\t{2,}/.test(resumeText) || /\|/.test(resumeText)) {
    structureStatus = "warning";
    structureNotes.push("Avoid tables, columns, or pipe-separated layouts.");
  } else {
    structureNotes.push("Single-column plain text layout looks ATS-safe.");
  }

  const keywordNotes: string[] = [];
  let keywordStatus: ATSCheckResult["keywords"]["status"] = "good";
  let missingKeywords: string[] = [];

  if (parsedJD) {
    const cov = coverage ?? computeCoverage(resumeText, parsedJD);
    missingKeywords = cov.missing;
    const skillRatio =
      cov.skillsTotal > 0 ? cov.skillsCovered / cov.skillsTotal : 1;

    if (skillRatio < 0.4) {
      keywordStatus = "poor";
      keywordNotes.push("Many required JD skills are missing from your resume.");
    } else if (skillRatio < 0.7) {
      keywordStatus = "warning";
      keywordNotes.push("Some JD skills are missing — consider tailoring bullets.");
    } else {
      keywordNotes.push("Good overlap with JD skills and keywords.");
    }

    if (missingKeywords.length > 0) {
      keywordNotes.push(`Missing or weak: ${missingKeywords.slice(0, 6).join(", ")}.`);
    }
  } else {
    keywordStatus = "warning";
    keywordNotes.push("Add a job description to run keyword coverage checks.");
  }

  const contentNotes: string[] = [];
  let contentStatus: ATSCheckResult["content"]["status"] = "good";
  const lines = resumeText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const bulletLike = lines.filter((l) => l.length > 20);
  const weakBullets = bulletLike.filter((l) => !hasMetric(l)).slice(0, 8);

  const buzzwordHits = BUZZWORDS.filter((b) => lower.includes(b));
  if (buzzwordHits.length >= 3) {
    contentStatus = "warning";
    contentNotes.push(`Reduce generic buzzwords: ${buzzwordHits.slice(0, 4).join(", ")}.`);
  }

  if (weakBullets.length >= 3) {
    contentStatus = contentStatus === "good" ? "warning" : contentStatus;
    contentNotes.push(
      `${weakBullets.length} bullets lack metrics or quantified impact.`,
    );
  } else {
    contentNotes.push("Bullets include measurable outcomes in several places.");
  }

  return {
    structure: { status: structureStatus, notes: structureNotes },
    keywords: { status: keywordStatus, notes: keywordNotes },
    content: { status: contentStatus, notes: contentNotes },
    missingKeywords,
    weakBullets,
  };
}

/** True when no ATS dimension is rated poor (warnings still pass). */
export function passedAtsCheck(result: ATSCheckResult): boolean {
  return (
    result.structure.status !== "poor" &&
    result.keywords.status !== "poor" &&
    result.content.status !== "poor"
  );
}

/** Overview of how this resume may appear inside an employer ATS after upload. */
export function getAtsSiteOverview(
  resumeText: string,
  atsResult: ATSCheckResult,
): AtsSiteOverview {
  const passed = passedAtsCheck(atsResult);
  return {
    passed,
    plainText: toAtsPlainText(resumeText),
    verdict: passed
      ? "This is roughly what an employer ATS would store after you apply — structure and keywords look parseable."
      : "An employer ATS may misread or rank this lower — fix the poor-rated checks before applying.",
  };
}