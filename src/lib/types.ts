export interface WeightedSkill {
  phrase: string;
  /** 0–1 importance from JD cues (required / preferred / frequency). */
  weight: number;
  /** Optional long-form or acronym companions, e.g. ["ERP", "enterprise resource planning"]. */
  forms?: string[];
}

export interface ParsedJDSkills {
  hard: WeightedSkill[];
  soft: WeightedSkill[];
  domain: WeightedSkill[];
}

export interface ParsedJD {
  roleTitle: string;
  seniority: string;
  hardSkills: string[];
  softSkills: string[];
  responsibilities: string[];
  keywords: string[];
  /** Weighted skill taxonomy when available (AI extract v2). */
  skills?: ParsedJDSkills;
}

export type BulletStatus =
  | "pending"
  | "loading"
  | "suggested"
  | "accepted"
  | "rejected"
  | "edited";

export interface ResumeBullet {
  id: string;
  section: string;
  original: string;
  currentText: string;
  suggestion?: string;
  status: BulletStatus;
  alignedJdElements?: string[];
}

export interface CoverageItem {
  label: string;
  covered: boolean;
  category: "skill" | "responsibility" | "keyword" | "domain";
  weight?: number;
  forms?: string[];
}

export interface CoverageSummary {
  skillsCovered: number;
  skillsTotal: number;
  responsibilitiesCovered: number;
  responsibilitiesTotal: number;
  keywordsCovered: number;
  keywordsTotal: number;
  /** Weighted coverage ratio 0–1 (high-weight misses hurt more). */
  weightedCoverage?: number;
  missing: string[];
  /** Missing skills sorted by weight descending. */
  missingWeighted?: CoverageItem[];
  items: CoverageItem[];
}
export type ScoreStatus = "good" | "warning" | "poor";

export interface ScoreDimension {
  id: string;
  label: string;
  weight: number;
  score: number;
  status: ScoreStatus;
  notes: string[];
}

export interface MatchScore {
  overall: number;
  dimensions: ScoreDimension[];
}

export interface ATSCheckResult {
  structure: { status: ScoreStatus; notes: string[] };
  keywords: { status: ScoreStatus; notes: string[] };
  content: { status: ScoreStatus; notes: string[] };
  missingKeywords: string[];
  weakBullets: string[];
}

/** Simulated employer career-site ATS parse: pass/fail + plain-text extract. */
export interface AtsSiteOverview {
  passed: boolean;
  verdict: string;
  plainText: string;
}

export interface ResumeSectionItem {
  id: string;
  type: "bullet" | "text";
  content: string;
  original: string;
}

export interface ResumeSection {
  id: string;
  name: string;
  items: ResumeSectionItem[];
}

export interface StructuredResume {
  sections: ResumeSection[];
  plainText: string;
}

export interface ResumeVersion {
  id: string;
  name: string;
  resumeText: string;
  baseText: string;
  /** Set when saved as a job-specific tailored copy from the workspace */
  tailoredFor?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** One JD analysis session tied to a resume version (Phase 3 application history). */
export interface ApplicationRecord {
  id: string;
  versionId: string;
  versionName: string;
  roleTitle: string;
  jdSnippet: string;
  matchScore: number | null;
  analyzedAt: string;
}

export interface AppSession {
  resumeText: string;
  jdText: string;
  parsedJD: ParsedJD | null;
  bullets: ResumeBullet[];
  coverage: CoverageSummary | null;
  atsResult: ATSCheckResult | null;
  matchScore: MatchScore | null;
  activeVersionId: string | null;
  coverLetterText: string;
  coverLetterTone: CoverLetterTone;
  coverLetterTemplate: CoverLetterTemplateId;
  updatedAt: string;
}

export type WizardStep = "resume" | "job" | "tailor" | "export";

export type CoverLetterTone = "concise" | "friendly" | "direct";

export type CoverLetterTemplateId = "standard-business" | "modern-minimal" | "academic";

export interface CoverLetterTemplate {
  id: CoverLetterTemplateId;
  label: string;
  description: string;
  fontSize: number;
  lineSpacing: number;
  paragraphSpacing: number;
  alignment: "left" | "justify";
}

/** Reusable career content block (v2 content library). */
export type ContentBlockType =
  | "summary"
  | "bullet"
  | "project"
  | "skill"
  | "certification"
  | "award"
  | "volunteer"
  | "leadership"
  | "link"
  | "custom";

export type ContentSeniority = "entry" | "mid" | "senior" | "leadership";
export type ContentFunction =
  | "product"
  | "growth"
  | "operations"
  | "strategy"
  | "marketing"
  | "design"
  | "engineering"
  | "general";

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string;
  sectionName: string;
  tags: string[];
  function: ContentFunction;
  seniority: ContentSeniority;
  domain: string;
  starred: boolean;
  sourceVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Contact identity stored once — separate from reusable content blocks. */
export interface MasterProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  portfolio: string;
  updatedAt: string;
}

/** Re-export resume template types (Classic, Traditional, Prime ATS, etc.) */
export type {
  ResumeTemplateId,
  ResumeTemplateStyle,
  ResumeTemplateFilter,
  ResumeTemplateLayout,
  ResumeTemplate,
  TemplateSettings,
} from "@/lib/resume-template-types";
