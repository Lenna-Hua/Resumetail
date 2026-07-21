import type {
  CoverageSummary,
  MatchScore,
  ParsedJD,
  ScoreDimension,
  ScoreStatus,
} from "@/lib/types";
import { computeCoverage } from "@/lib/coverage";

const CORE_SECTIONS = ["experience", "education", "skills"];
const OPTIONAL_SECTIONS = ["summary", "projects", "certifications"];

const ACTION_VERBS =
  /\b(led|built|developed|designed|implemented|improved|reduced|increased|managed|created|launched|delivered|optimized|automated|scaled|achieved)\b/i;

const CONTACT_PATTERNS = {
  email: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  phone: /(\+?\d[\d\s().-]{7,}\d)/,
  linkedin: /linkedin\.com/i,
};

function statusFromScore(score: number): ScoreStatus {
  if (score >= 75) return "good";
  if (score >= 50) return "warning";
  return "poor";
}

function keywordCoverageScore(
  resumeText: string,
  parsedJD: ParsedJD | null,
  coverage?: CoverageSummary | null,
): ScoreDimension {
  const notes: string[] = [];
  if (!parsedJD) {
    return {
      id: "keywords",
      label: "Keyword & skill coverage",
      weight: 35,
      score: 0,
      status: "poor",
      notes: ["Paste a job description to measure keyword coverage."],
    };
  }

  const cov = coverage ?? computeCoverage(resumeText, parsedJD);
  const score =
    typeof cov.weightedCoverage === "number"
      ? Math.round(cov.weightedCoverage * 100)
      : (() => {
          const total =
            cov.skillsTotal + cov.responsibilitiesTotal + cov.keywordsTotal;
          const covered =
            cov.skillsCovered + cov.responsibilitiesCovered + cov.keywordsCovered;
          return total > 0 ? Math.round((covered / total) * 100) : 0;
        })();

  notes.push(`Skills: ${cov.skillsCovered}/${cov.skillsTotal}`);
  notes.push(
    `Responsibilities: ${cov.responsibilitiesCovered}/${cov.responsibilitiesTotal}`,
  );
  if (cov.missing.length > 0) {
    notes.push(`Missing (priority): ${cov.missing.slice(0, 5).join(", ")}`);
  }

  return {
    id: "keywords",
    label: "Keyword & skill coverage",
    weight: 35,
    score,
    status: statusFromScore(score),
    notes,
  };
}

function sectionCompletenessScore(resumeText: string): ScoreDimension {
  const lower = resumeText.toLowerCase();
  const foundCore = CORE_SECTIONS.filter((s) => lower.includes(s));
  const foundOptional = OPTIONAL_SECTIONS.filter((s) => lower.includes(s));
  const coreRatio = foundCore.length / CORE_SECTIONS.length;
  const optionalBonus = foundOptional.length * 5;
  const score = Math.min(100, Math.round(coreRatio * 85 + optionalBonus));
  const notes: string[] = [];

  if (foundCore.length > 0) {
    notes.push(`Found: ${[...foundCore, ...foundOptional].join(", ")}`);
  }
  const missing = CORE_SECTIONS.filter((s) => !lower.includes(s));
  if (missing.length > 0) {
    notes.push(`Missing core sections: ${missing.join(", ")}`);
  }

  return {
    id: "sections",
    label: "Section completeness",
    weight: 20,
    score,
    status: statusFromScore(score),
    notes,
  };
}

function formattingSafetyScore(
  resumeText: string,
  options?: { twoColumnLayout?: boolean },
): ScoreDimension {
  const notes: string[] = [];
  let penalty = 0;

  if (options?.twoColumnLayout) {
    penalty += 40;
    notes.push(
      "Selected template uses a two-column layout — switch to an ATS-safe single-column template for job portals.",
    );
  }

  if (/\t{2,}/.test(resumeText) || /\|/.test(resumeText)) {
    penalty += 35;
    notes.push("Tables, columns, or pipe layouts may break ATS parsing.");
  } else if (!options?.twoColumnLayout) {
    notes.push("No obvious multi-column or table formatting detected.");
  }

  if (/[^\x00-\x7F]/.test(resumeText.replace(/[•\u2013\u2014]/g, ""))) {
    penalty += 10;
    notes.push("Special characters detected — stick to plain ASCII where possible.");
  }

  const lineCount = resumeText.split(/\r?\n/).filter(Boolean).length;
  if (lineCount < 8) {
    penalty += 20;
    notes.push("Resume text looks very short — ATS may miss content.");
  }

  const score = Math.max(0, 100 - penalty);
  return {
    id: "formatting",
    label: "ATS formatting safety",
    weight: 20,
    score,
    status: statusFromScore(score),
    notes,
  };
}

function bulletQualityScore(resumeText: string): ScoreDimension {
  const lines = resumeText
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^[\s•\-\*\u2022\u2013\u2014]+/, ""))
    .filter((l) => l.length > 20);

  if (lines.length === 0) {
    return {
      id: "bullets",
      label: "Bullet quality",
      weight: 15,
      score: 0,
      status: "poor",
      notes: ["No bullet-style lines detected."],
    };
  }

  const withMetrics = lines.filter((l) =>
    /\d|%|\$|k\b|million|billion|increased|reduced|improved|saved/i.test(l),
  );
  const withVerbs = lines.filter((l) => ACTION_VERBS.test(l));
  const metricRatio = withMetrics.length / lines.length;
  const verbRatio = withVerbs.length / lines.length;
  const score = Math.round(metricRatio * 55 + verbRatio * 45);

  const notes: string[] = [
    `${withMetrics.length}/${lines.length} bullets include metrics or outcomes`,
    `${withVerbs.length}/${lines.length} bullets start with strong action verbs`,
  ];
  const weak = lines.filter(
    (l) => !/\d|%|\$/.test(l) && !ACTION_VERBS.test(l),
  );
  if (weak.length > 0) {
    notes.push(`${weak.length} bullets could use metrics or stronger verbs`);
  }

  return {
    id: "bullets",
    label: "Bullet quality",
    weight: 15,
    score,
    status: statusFromScore(score),
    notes,
  };
}

function contactMetadataScore(resumeText: string): ScoreDimension {
  const notes: string[] = [];
  let found = 0;

  if (CONTACT_PATTERNS.email.test(resumeText)) {
    found++;
    notes.push("Email detected");
  }
  if (CONTACT_PATTERNS.phone.test(resumeText)) {
    found++;
    notes.push("Phone number detected");
  }
  if (CONTACT_PATTERNS.linkedin.test(resumeText)) {
    found++;
    notes.push("LinkedIn URL detected");
  }

  const firstLines = resumeText.split(/\r?\n/).slice(0, 3).join(" ");
  if (/[A-Z][a-z]+ [A-Z][a-z]+/.test(firstLines)) {
    found++;
    notes.push("Name-like heading at top");
  }

  const score = Math.round((found / 4) * 100);
  if (found < 2) {
    notes.push("Add email, phone, and a clear name at the top");
  }

  return {
    id: "contact",
    label: "Contact & metadata",
    weight: 10,
    score,
    status: statusFromScore(score),
    notes,
  };
}

export function computeMatchScore(
  resumeText: string,
  parsedJD: ParsedJD | null,
  coverage?: CoverageSummary | null,
  options?: { twoColumnLayout?: boolean },
): MatchScore {
  const dimensions: ScoreDimension[] = [
    keywordCoverageScore(resumeText, parsedJD, coverage),
    sectionCompletenessScore(resumeText),
    formattingSafetyScore(resumeText, options),
    bulletQualityScore(resumeText),
    contactMetadataScore(resumeText),
  ];

  const overall = Math.round(
    dimensions.reduce((sum, d) => sum + (d.score * d.weight) / 100, 0),
  );

  return { overall, dimensions };
}
