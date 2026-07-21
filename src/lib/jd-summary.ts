import type { ParsedJD } from "@/lib/types";

export function jdToSummary(parsedJD: ParsedJD): string {
  const hard =
    parsedJD.skills?.hard?.map((s) => s.phrase).join(", ") ||
    parsedJD.hardSkills.join(", ");
  const soft =
    parsedJD.skills?.soft?.map((s) => s.phrase).join(", ") ||
    parsedJD.softSkills.join(", ");
  const domain = parsedJD.skills?.domain?.map((s) => s.phrase).join(", ") || "";

  return [
    `Role: ${parsedJD.roleTitle} (${parsedJD.seniority})`,
    `Hard skills: ${hard}`,
    `Soft skills: ${soft}`,
    domain ? `Domain: ${domain}` : null,
    `Responsibilities: ${parsedJD.responsibilities.join("; ")}`,
    `Keywords: ${parsedJD.keywords.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}
