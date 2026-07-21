import type { CoverLetterTone } from "@/lib/types";

export interface CoverLetterTonePreset {
  id: CoverLetterTone;
  label: string;
  description: string;
  instruction: string;
}

export const COVER_LETTER_TONES: CoverLetterTonePreset[] = [
  {
    id: "concise",
    label: "Concise Professional",
    description: "Short paragraphs, formal and efficient.",
    instruction:
      "Write in a concise, professional tone. Keep to 3 short paragraphs. No filler or flowery language.",
  },
  {
    id: "friendly",
    label: "Confident & Friendly",
    description: "Warm but still professional.",
    instruction:
      "Write in a confident, approachable tone. Sound human and enthusiastic without being casual or using clichés.",
  },
  {
    id: "direct",
    label: "Direct",
    description: "Straight to the point, role-focused.",
    instruction:
      "Write in a direct, no-nonsense tone. Lead with fit for the role. Short sentences. No throat-clearing.",
  },
];

export function getTonePreset(tone: CoverLetterTone): CoverLetterTonePreset {
  return COVER_LETTER_TONES.find((t) => t.id === tone) ?? COVER_LETTER_TONES[0];
}
