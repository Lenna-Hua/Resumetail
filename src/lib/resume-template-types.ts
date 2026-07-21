import type { AtsFontFamily } from "@/lib/ats-fonts";

/** Visual layout family — drives preview + PDF rendering. */
export type ResumeTemplateStyle =
  | "classic"
  | "traditional"
  | "professional"
  | "prime-ats"
  | "pure-ats"
  | "specialist"
  | "clean"
  | "simple-ats";

export type ResumeTemplateId = ResumeTemplateStyle;

export type ResumeTemplateFilter =
  | "all"
  | "two-column"
  | "ats"
  | "docx"
  | "free";

export type ResumeTemplateLayout = "one-column" | "two-column";

export interface ResumeTemplate {
  id: ResumeTemplateId;
  label: string;
  description: string;
  style: ResumeTemplateStyle;
  layout: ResumeTemplateLayout;
  filters: Exclude<ResumeTemplateFilter, "all">[];
  defaultAccentColor: string;
  atsSafe: boolean;
  supportsDocx: boolean;
  fontSize: number;
  headingSize: number;
  lineHeight: number;
  sectionSpacing: number;
  nameSize: number;
}

export interface TemplateSettings {
  accentColor: string;
  marginScale: number;
  spacingScale: number;
  /** Whitelisted ATS-safe body/heading font. */
  fontFamily: AtsFontFamily;
}
