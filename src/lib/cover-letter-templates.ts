import type { CoverLetterTemplate, CoverLetterTemplateId } from "@/lib/types";

export const COVER_LETTER_TEMPLATES: CoverLetterTemplate[] = [
  {
    id: "standard-business",
    label: "Standard Business",
    description: "Traditional block format with clear paragraph breaks — works for most industries.",
    fontSize: 12,
    lineSpacing: 1.5,
    paragraphSpacing: 12,
    alignment: "left",
  },
  {
    id: "modern-minimal",
    label: "Modern Minimal",
    description: "Generous spacing and clean left alignment for tech and creative roles.",
    fontSize: 11,
    lineSpacing: 1.65,
    paragraphSpacing: 16,
    alignment: "left",
  },
  {
    id: "academic",
    label: "Academic / Formal",
    description: "Conservative margins and justified text for research, law, and academia.",
    fontSize: 12,
    lineSpacing: 1.4,
    paragraphSpacing: 10,
    alignment: "justify",
  },
];

export function getCoverLetterTemplate(id: CoverLetterTemplateId): CoverLetterTemplate {
  return COVER_LETTER_TEMPLATES.find((t) => t.id === id) ?? COVER_LETTER_TEMPLATES[0];
}
