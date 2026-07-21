/** Dimension-level ATS education copy for the checks panel. */

export const ATS_DISCLAIMER =
  "These checks are guidance only — not a hiring prediction. ATS systems vary; no tool can guarantee parsing or ranking.";

export const DIMENSION_HELP: Record<string, string> = {
  keywords:
    "How many job-description skills and keywords appear in your resume. Missing terms may be worth adding if you truly have that experience.",
  sections:
    "Whether standard sections (Experience, Education, Skills, etc.) are present. Recruiters and parsers expect clear structure.",
  formatting:
    "Single-column, plain-text-friendly layout. Tables, columns, and graphics can break automated parsers.",
  bullets:
    "Action verbs and quantified outcomes. Strong bullets help both humans and keyword scanners.",
  contact:
    "Name, email, phone, and LinkedIn hints. Parsers often extract contact info from the header block.",
};

export const ATS_FAQ = [
  {
    q: "What is an ATS?",
    a: "Applicant Tracking Systems parse resumes into searchable fields. Many employers use them before a human reads your file.",
  },
  {
    q: "Will a high score get me hired?",
    a: "No. Match score shows alignment with the posting text — not fit, culture, or interview performance.",
  },
  {
    q: "Why plain-text preview?",
    a: "It approximates what a basic parser reads. If text is missing here, it may not reach a recruiter's screen.",
  },
] as const;
