import {
  flattenJdSkills,
  normalizeTerm,
  termInText,
  termOverlapRatio,
} from "@/lib/coverage";
import type { ParsedJD, ResumeBullet, WeightedSkill } from "@/lib/types";

export type SkillMapStatus = "matched" | "close" | "gap";

export interface SkillMapping {
  skill: WeightedSkill;
  status: SkillMapStatus;
  /** Overlap ratio of best bullet (0–1). */
  bestScore: number;
  bulletIds: string[];
  /** Exact JD phrase to weave in when status is close or gap. */
  suggestedPhrase: string;
}

const MATCH_THRESHOLD = 0.7;
const CLOSE_THRESHOLD = 0.4;

function phraseWithForms(skill: WeightedSkill): string {
  if (skill.forms && skill.forms.length > 0) {
    const companion = skill.forms.find(
      (f) => normalizeTerm(f) !== normalizeTerm(skill.phrase),
    );
    if (companion) return `${skill.phrase} (${companion})`;
  }
  return skill.phrase;
}

function scoreBulletAgainstSkill(bulletText: string, skill: WeightedSkill): number {
  const norm = normalizeTerm(bulletText);
  const ratios = [
    termOverlapRatio(skill.phrase, norm),
    ...(skill.forms ?? []).map((f) => termOverlapRatio(f, norm)),
  ];
  return Math.max(0, ...ratios);
}

/**
 * Map each weighted JD skill to resume bullets via token/phrase heuristics.
 */
export function mapSkillsToResume(
  bullets: ResumeBullet[],
  parsedJD: ParsedJD,
): SkillMapping[] {
  const skills = flattenJdSkills(parsedJD);
  const experienceBullets = bullets.filter((b) =>
    /experience|work|employment|project/i.test(b.section),
  );
  const pool = experienceBullets.length > 0 ? experienceBullets : bullets;

  const mappings: SkillMapping[] = skills.map((skill) => {
    const scored = pool
      .map((b) => ({ id: b.id, score: scoreBulletAgainstSkill(b.currentText, skill) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    const bestScore = scored[0]?.score ?? 0;
    const bulletIds = scored.filter((s) => s.score >= CLOSE_THRESHOLD).map((s) => s.id);

    let status: SkillMapStatus = "gap";
    if (bestScore >= MATCH_THRESHOLD || termInText(skill.phrase, normalizeTerm(pool.map((b) => b.currentText).join(" ")))) {
      status = "matched";
    } else if (bestScore >= CLOSE_THRESHOLD) {
      status = "close";
    }

    // Also check full resume-style: if any bullet is a strong match, mark matched
    if (status !== "matched" && scored.some((s) => s.score >= MATCH_THRESHOLD)) {
      status = "matched";
    }

    return {
      skill,
      status,
      bestScore,
      bulletIds: status === "gap" ? [] : bulletIds.slice(0, 3),
      suggestedPhrase: phraseWithForms(skill),
    };
  });

  return mappings.sort((a, b) => b.skill.weight - a.skill.weight);
}

export function gapMappings(mappings: SkillMapping[]): SkillMapping[] {
  return mappings.filter((m) => m.status === "gap" || m.status === "close");
}
