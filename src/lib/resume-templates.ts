import type { ResumeTemplate, ResumeTemplateId } from "@/lib/resume-template-types";
import { getLocalItem, setLocalItem } from "@/lib/browser-store";

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Clear section hierarchy with bold headings — works everywhere.",
    style: "classic",
    layout: "one-column",
    filters: ["ats", "docx", "free"],
    defaultAccentColor: "#1a1a1a",
    atsSafe: true,
    supportsDocx: true,
    fontSize: 10.5,
    headingSize: 11,
    lineHeight: 14,
    sectionSpacing: 12,
    nameSize: 20,
  },
  {
    id: "traditional",
    label: "Traditional",
    description: "Centered name with ruled section dividers for formal roles.",
    style: "traditional",
    layout: "one-column",
    filters: ["ats", "docx", "free"],
    defaultAccentColor: "#1a1a1a",
    atsSafe: true,
    supportsDocx: true,
    fontSize: 10,
    headingSize: 10.5,
    lineHeight: 13,
    sectionSpacing: 10,
    nameSize: 18,
  },
  {
    id: "professional",
    label: "Professional",
    description: "Two-column layout with a sidebar for contact and skills.",
    style: "professional",
    layout: "two-column",
    filters: ["two-column", "docx", "free"],
    defaultAccentColor: "#1e4d3a",
    atsSafe: false,
    supportsDocx: true,
    fontSize: 10,
    headingSize: 10,
    lineHeight: 13,
    sectionSpacing: 8,
    nameSize: 16,
  },
  {
    id: "prime-ats",
    label: "Prime ATS",
    description: "Accent-colored headings with strong visual hierarchy, ATS-parseable.",
    style: "prime-ats",
    layout: "one-column",
    filters: ["ats", "docx", "free"],
    defaultAccentColor: "#2563eb",
    atsSafe: true,
    supportsDocx: true,
    fontSize: 10.5,
    headingSize: 11,
    lineHeight: 14,
    sectionSpacing: 11,
    nameSize: 22,
  },
  {
    id: "pure-ats",
    label: "Pure ATS",
    description: "Plain single-column text — maximum parser compatibility.",
    style: "pure-ats",
    layout: "one-column",
    filters: ["ats", "docx", "free"],
    defaultAccentColor: "#000000",
    atsSafe: true,
    supportsDocx: true,
    fontSize: 10,
    headingSize: 10,
    lineHeight: 13,
    sectionSpacing: 8,
    nameSize: 16,
  },
  {
    id: "specialist",
    label: "Specialist",
    description: "Bold headings and tight bullets for technical roles.",
    style: "specialist",
    layout: "one-column",
    filters: ["ats", "docx", "free"],
    defaultAccentColor: "#1a1a1a",
    atsSafe: true,
    supportsDocx: true,
    fontSize: 10,
    headingSize: 11,
    lineHeight: 13,
    sectionSpacing: 10,
    nameSize: 19,
  },
  {
    id: "clean",
    label: "Clean",
    description: "Sidebar for info and skills, main column for experience.",
    style: "clean",
    layout: "two-column",
    filters: ["two-column", "free"],
    defaultAccentColor: "#1a1a1a",
    atsSafe: false,
    supportsDocx: false,
    fontSize: 10,
    headingSize: 10,
    lineHeight: 13,
    sectionSpacing: 9,
    nameSize: 17,
  },
  {
    id: "simple-ats",
    label: "Simple ATS",
    description: "Minimal design with colored headings — easy to scan and parse.",
    style: "simple-ats",
    layout: "one-column",
    filters: ["ats", "docx", "free"],
    defaultAccentColor: "#2563eb",
    atsSafe: true,
    supportsDocx: true,
    fontSize: 10.5,
    headingSize: 11,
    lineHeight: 14,
    sectionSpacing: 10,
    nameSize: 20,
  },
];

const TEMPLATE_KEY = "resutail-template-v1";

const LEGACY_TEMPLATE_MAP: Record<string, ResumeTemplateId> = {
  "ats-classic": "classic",
  "harvard-style": "traditional",
  "clean-professional": "clean",
  "tech-product": "specialist",
  compact: "pure-ats",
  student: "simple-ats",
};

export function getTemplate(id: ResumeTemplateId): ResumeTemplate {
  return RESUME_TEMPLATES.find((t) => t.id === id) ?? RESUME_TEMPLATES[0];
}

export function loadSelectedTemplateId(): ResumeTemplateId {
  if (typeof window === "undefined") return "classic";
  const stored = getLocalItem(TEMPLATE_KEY);
  if (stored) {
    if (RESUME_TEMPLATES.some((t) => t.id === stored)) {
      return stored as ResumeTemplateId;
    }
    if (LEGACY_TEMPLATE_MAP[stored]) {
      return LEGACY_TEMPLATE_MAP[stored];
    }
  }
  return "classic";
}

export function saveSelectedTemplateId(id: ResumeTemplateId): void {
  if (typeof window === "undefined") return;
  setLocalItem(TEMPLATE_KEY, id);
}
