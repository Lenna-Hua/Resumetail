import type {
  CoverageItem,
  CoverageSummary,
  ParsedJD,
  ParsedJDSkills,
  WeightedSkill,
} from "@/lib/types";

export function normalizeTerm(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").replace(/\s+/g, " ").trim();
}

export function termOverlapRatio(term: string, haystackNorm: string): number {
  const normalized = normalizeTerm(term);
  if (!normalized || normalized.length < 2) return 0;
  if (haystackNorm.includes(normalized)) return 1;

  const words = normalized.split(" ").filter((w) => w.length > 2);
  if (words.length === 0) return haystackNorm.includes(normalized) ? 1 : 0;
  const matched = words.filter((w) => haystackNorm.includes(w));
  return matched.length / words.length;
}

export function termInText(term: string, haystackNorm: string): boolean {
  return termOverlapRatio(term, haystackNorm) >= 0.6;
}

function skillCovered(skill: WeightedSkill, resumeNorm: string): boolean {
  if (termInText(skill.phrase, resumeNorm)) return true;
  return (skill.forms ?? []).some((form) => termInText(form, resumeNorm));
}

/** Flatten weighted skills + legacy string arrays into a consistent skill list. */
export function flattenJdSkills(parsedJD: ParsedJD): WeightedSkill[] {
  if (parsedJD.skills) {
    const fromWeighted = [
      ...parsedJD.skills.hard,
      ...parsedJD.skills.soft,
      ...parsedJD.skills.domain,
    ];
    if (fromWeighted.length > 0) return fromWeighted;
  }

  const legacy = [
    ...parsedJD.hardSkills.map((phrase) => ({ phrase, weight: 0.8 })),
    ...parsedJD.softSkills.map((phrase) => ({ phrase, weight: 0.55 })),
  ];
  return legacy;
}

export function normalizeParsedJD(raw: ParsedJD): ParsedJD {
  const skills = raw.skills
    ? {
        hard: (raw.skills.hard ?? []).map(clampSkill),
        soft: (raw.skills.soft ?? []).map(clampSkill),
        domain: (raw.skills.domain ?? []).map(clampSkill),
      }
    : hydrateSkillsFromFlat(raw);

  const hardSkills =
    raw.hardSkills?.length > 0 ? raw.hardSkills : skills.hard.map((s) => s.phrase);
  const softSkills =
    raw.softSkills?.length > 0 ? raw.softSkills : skills.soft.map((s) => s.phrase);

  return {
    ...raw,
    hardSkills,
    softSkills,
    responsibilities: raw.responsibilities ?? [],
    keywords: raw.keywords ?? [],
    skills,
  };
}

function clampSkill(skill: WeightedSkill): WeightedSkill {
  return {
    phrase: skill.phrase.trim(),
    weight: Math.min(1, Math.max(0.1, Number(skill.weight) || 0.5)),
    forms: skill.forms?.map((f) => f.trim()).filter(Boolean),
  };
}

function hydrateSkillsFromFlat(raw: ParsedJD): ParsedJDSkills {
  return {
    hard: (raw.hardSkills ?? []).map((phrase) => ({ phrase, weight: 0.8 })),
    soft: (raw.softSkills ?? []).map((phrase) => ({ phrase, weight: 0.55 })),
    domain: [],
  };
}

function displayLabel(skill: WeightedSkill): string {
  if (skill.forms && skill.forms.length > 0) {
    const companion = skill.forms.find(
      (f) => normalizeTerm(f) !== normalizeTerm(skill.phrase),
    );
    if (companion) return `${skill.phrase} (${companion})`;
  }
  return skill.phrase;
}

export function computeCoverage(
  resumeText: string,
  parsedJD: ParsedJD,
): CoverageSummary {
  const resumeNorm = normalizeTerm(resumeText);
  const jd = normalizeParsedJD(parsedJD);
  const weightedSkills = flattenJdSkills(jd);

  const skillItems: CoverageItem[] = weightedSkills.map((skill) => ({
    label: displayLabel(skill),
    covered: skillCovered(skill, resumeNorm),
    category: jd.skills?.domain.some(
      (d) => normalizeTerm(d.phrase) === normalizeTerm(skill.phrase),
    )
      ? ("domain" as const)
      : ("skill" as const),
    weight: skill.weight,
    forms: skill.forms,
  }));

  // Dedupe by normalized phrase
  const seen = new Set<string>();
  const dedupedSkills = skillItems.filter((item) => {
    const key = normalizeTerm(item.label.split(" (")[0] ?? item.label);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const responsibilities = jd.responsibilities;
  const keywords = jd.keywords.filter(
    (k) => !dedupedSkills.some((s) => normalizeTerm(s.label).includes(normalizeTerm(k))),
  );

  const items: CoverageItem[] = [
    ...dedupedSkills,
    ...responsibilities.map((label) => ({
      label,
      covered: termInText(label, resumeNorm),
      category: "responsibility" as const,
      weight: 0.5,
    })),
    ...keywords.map((label) => ({
      label,
      covered: termInText(label, resumeNorm),
      category: "keyword" as const,
      weight: 0.45,
    })),
  ];

  const skillsCovered = items.filter(
    (i) => (i.category === "skill" || i.category === "domain") && i.covered,
  ).length;
  const skillsTotal = items.filter(
    (i) => i.category === "skill" || i.category === "domain",
  ).length;
  const responsibilitiesCovered = items.filter(
    (i) => i.category === "responsibility" && i.covered,
  ).length;
  const responsibilitiesTotal = items.filter((i) => i.category === "responsibility").length;
  const keywordsCovered = items.filter((i) => i.category === "keyword" && i.covered).length;
  const keywordsTotal = items.filter((i) => i.category === "keyword").length;

  const weightSum = items.reduce((sum, i) => sum + (i.weight ?? 0.5), 0);
  const weightCovered = items
    .filter((i) => i.covered)
    .reduce((sum, i) => sum + (i.weight ?? 0.5), 0);
  const weightedCoverage = weightSum > 0 ? weightCovered / weightSum : 0;

  const missingWeighted = items
    .filter((i) => !i.covered)
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
    .slice(0, 12);

  return {
    skillsCovered,
    skillsTotal,
    responsibilitiesCovered,
    responsibilitiesTotal,
    keywordsCovered,
    keywordsTotal,
    weightedCoverage,
    missing: missingWeighted.map((i) => i.label),
    missingWeighted,
    items,
  };
}
