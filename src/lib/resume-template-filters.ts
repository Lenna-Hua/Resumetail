import type { ResumeTemplate, ResumeTemplateFilter } from "@/lib/resume-template-types";

export const TEMPLATE_FILTER_OPTIONS: { id: ResumeTemplateFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "two-column", label: "Two column" },
  { id: "ats", label: "ATS" },
  { id: "docx", label: "DOCX" },
  { id: "free", label: "Free" },
];

export function filterResumeTemplates(
  templates: ResumeTemplate[],
  filter: ResumeTemplateFilter,
): ResumeTemplate[] {
  if (filter === "all") return templates;

  return templates.filter((template) => template.filters.includes(filter));
}
