import type { ParsedJD, ParsedJDSkills, WeightedSkill } from "@/lib/types";
import { normalizeParsedJD } from "@/lib/coverage";

const SECTION_HEADERS =
  /^(requirements|qualifications|responsibilities|what you.?ll do|about the role|skills|must[- ]have|nice[- ]to[- ]have|preferred|minimum qualifications|basic qualifications|job description|the role|you will|you.?ll)\b[:\s-]*/i;

const SENIORITY_RE =
  /\b(intern|junior|entry[- ]level|mid[- ]level|senior|staff|principal|lead|manager|director|head of|vp|chief)\b/i;

const ROLE_LINE_RE =
  /^(?:job title|title|position|role)\s*[:\-–]\s*(.+)$/im;

const STOP_SKILLS = new Set([
  "experience",
  "years",
  "ability",
  "strong",
  "excellent",
  "knowledge",
  "understanding",
  "team",
  "work",
  "working",
  "using",
  "including",
  "related",
  "preferred",
  "required",
  "bachelor",
  "master",
  "degree",
  "etc",
]);

/** Common tech / role tokens to boost when found as whole words. */
const KNOWN_SKILLS = [
  "javascript",
  "typescript",
  "python",
  "java",
  "kotlin",
  "swift",
  "go",
  "golang",
  "rust",
  "c\\+\\+",
  "c#",
  "ruby",
  "php",
  "sql",
  "nosql",
  "postgres",
  "postgresql",
  "mysql",
  "mongodb",
  "redis",
  "react",
  "next\\.js",
  "nextjs",
  "vue",
  "angular",
  "node\\.js",
  "nodejs",
  "express",
  "django",
  "flask",
  "fastapi",
  "spring",
  "aws",
  "gcp",
  "azure",
  "docker",
  "kubernetes",
  "k8s",
  "terraform",
  "ci/cd",
  "graphql",
  "rest",
  "api",
  "git",
  "linux",
  "agile",
  "scrum",
  "jira",
  "figma",
  "tableau",
  "power bi",
  "excel",
  "salesforce",
  "sap",
  "machine learning",
  "deep learning",
  "nlp",
  "llm",
  "pytorch",
  "tensorflow",
  "pandas",
  "spark",
  "hadoop",
  "kafka",
  "airflow",
  "communication",
  "leadership",
  "problem solving",
  "collaboration",
  "stakeholder management",
];

function weighted(phrase: string, weight: number, forms?: string[]): WeightedSkill {
  return { phrase, weight, forms };
}

function extractRoleTitle(text: string): string {
  const labeled = text.match(ROLE_LINE_RE);
  if (labeled?.[1]) return labeled[1].trim().slice(0, 120);

  const firstNonEmpty = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length >= 4 && l.length <= 100 && !SECTION_HEADERS.test(l));

  if (firstNonEmpty && !/https?:\/\//i.test(firstNonEmpty)) {
    return firstNonEmpty.replace(/^[#*\-\d.)\s]+/, "").slice(0, 120);
  }
  return "Target role";
}

function extractSeniority(text: string): string {
  const match = text.match(SENIORITY_RE);
  if (!match) return "unspecified";
  return match[1].toLowerCase();
}

function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s•*\-\d.)]+/, "").trim())
    .filter((l) => l.length >= 3);
}

function collectSectionBullets(text: string, headers: RegExp): string[] {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let inSection = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inSection && out.length > 0) inSection = false;
      continue;
    }
    if (headers.test(line)) {
      inSection = true;
      const rest = line.replace(headers, "").trim();
      if (rest.length > 20) out.push(rest.replace(/^[\s•*\-\d.)]+/, ""));
      continue;
    }
    if (SECTION_HEADERS.test(line)) {
      // Different section — leave the target section.
      inSection = false;
      continue;
    }
    if (inSection) {
      out.push(line.replace(/^[\s•*\-\d.)]+/, ""));
    }
  }
  return out.filter(Boolean).slice(0, 20);
}

function extractKnownSkills(text: string): WeightedSkill[] {
  const lower = text.toLowerCase();
  const found: WeightedSkill[] = [];
  for (const skill of KNOWN_SKILLS) {
    const re = new RegExp(`\\b${skill}\\b`, "i");
    if (re.test(lower)) {
      const phrase = skill.replace(/\\/g, "");
      const isSoft = /communication|leadership|problem solving|collaboration|stakeholder/i.test(
        phrase,
      );
      found.push(weighted(phrase, isSoft ? 0.55 : 0.85));
    }
  }
  return found;
}

function extractAcronyms(text: string): WeightedSkill[] {
  const matches = text.match(/\b[A-Z][A-Z0-9]{1,5}\b/g) ?? [];
  const counts = new Map<string, number>();
  for (const m of matches) {
    if (["AND", "THE", "FOR", "WITH", "YOU", "ARE", "OUR", "JOB", "PDF"].includes(m)) continue;
    counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([phrase, n]) => weighted(phrase, Math.min(0.95, 0.55 + n * 0.1)));
}

function extractCommaSkills(text: string): WeightedSkill[] {
  const reqBlocks = collectSectionBullets(
    text,
    /^(requirements|qualifications|skills|must[- ]have|tech stack)\b/i,
  );
  const skills: WeightedSkill[] = [];
  for (const block of reqBlocks) {
    // Only split short list-like fragments, not full sentences.
    if (!block.includes(",") || block.length > 120) continue;
    for (const part of block.split(/,|\/|;|\|/)) {
      const phrase = part
        .replace(/\([^)]*\)/g, "")
        .replace(/^(?:and|or|with|using|including)\s+/i, "")
        .trim();
      if (phrase.length < 2 || phrase.length > 32) continue;
      if (STOP_SKILLS.has(phrase.toLowerCase())) continue;
      if (/^\d/.test(phrase)) continue;
      if (/\byears?\b/i.test(phrase)) continue;
      skills.push(weighted(phrase, /preferred|nice/i.test(block) ? 0.45 : 0.8));
    }
  }
  return skills;
}

function dedupeSkills(skills: WeightedSkill[]): WeightedSkill[] {
  const seen = new Map<string, WeightedSkill>();
  for (const skill of skills) {
    const key = skill.phrase.toLowerCase();
    const prev = seen.get(key);
    if (!prev || skill.weight > prev.weight) seen.set(key, skill);
  }
  return [...seen.values()].slice(0, 40);
}

/**
 * Rule-based JD extraction — no network, no AI.
 * Powers offline Analyze and serves as fallback when AI routes fail.
 */
export function extractJdHeuristic(jdText: string): ParsedJD {
  const text = jdText.trim();
  const responsibilities = collectSectionBullets(
    text,
    /^(responsibilities|what you.?ll do|you will|the role|about the role)\b/i,
  )
    .filter((l) => l.length > 15)
    .slice(0, 12);

  const bulletFallback =
    responsibilities.length > 0
      ? responsibilities
      : splitLines(text)
          .filter((l) => l.length > 30 && /^(lead|build|develop|manage|design|own|drive|ensure|work|collaborate)/i.test(l))
          .slice(0, 10);

  const skills = dedupeSkills([
    ...extractKnownSkills(text),
    ...extractCommaSkills(text),
    ...extractAcronyms(text),
  ]);

  const soft = skills.filter((s) =>
    /communication|leadership|collaboration|problem|stakeholder|teamwork|ownership/i.test(
      s.phrase,
    ),
  );
  const hard = skills.filter((s) => !soft.includes(s));

  const parsedSkills: ParsedJDSkills = {
    hard: hard.slice(0, 25),
    soft: soft.slice(0, 10),
    domain: [],
  };

  const keywords = [
    ...new Set([
      ...hard.slice(0, 15).map((s) => s.phrase),
      ...soft.slice(0, 5).map((s) => s.phrase),
    ]),
  ];

  return normalizeParsedJD({
    roleTitle: extractRoleTitle(text),
    seniority: extractSeniority(text),
    hardSkills: hard.map((s) => s.phrase),
    softSkills: soft.map((s) => s.phrase),
    responsibilities: bulletFallback,
    keywords,
    skills: parsedSkills,
  });
}
