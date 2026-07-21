/** Simulates what a basic ATS parser might extract from resume text. */
export function toAtsPlainText(resumeText: string): string {
  return resumeText
    .replace(/[\u2022\u2013\u2014]/g, "-")
    .replace(/\t+/g, " ")
    .replace(/\s{2,}/g, " ")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}
