/** ATS-safe font whitelist (common system fonts parsers handle reliably). */
export const ATS_FONT_WHITELIST = [
  "Arial",
  "Calibri",
  "Georgia",
  "Helvetica",
  "Times New Roman",
  "Verdana",
] as const;

export type AtsFontFamily = (typeof ATS_FONT_WHITELIST)[number];

export const DEFAULT_ATS_FONT: AtsFontFamily = "Helvetica";

export function isAtsFont(value: string | undefined | null): value is AtsFontFamily {
  return ATS_FONT_WHITELIST.includes(value as AtsFontFamily);
}

/** CSS stack for preview rendering. */
export function cssFontStack(font: AtsFontFamily): string {
  switch (font) {
    case "Arial":
      return "Arial, Helvetica, sans-serif";
    case "Calibri":
      return "Calibri, Candara, Segoe UI, sans-serif";
    case "Georgia":
      return "Georgia, Times New Roman, serif";
    case "Helvetica":
      return "Helvetica, Arial, sans-serif";
    case "Times New Roman":
      return '"Times New Roman", Times, serif';
    case "Verdana":
      return "Verdana, Geneva, sans-serif";
    default:
      return "Helvetica, Arial, sans-serif";
  }
}

/**
 * jsPDF built-in fonts only: helvetica | times | courier.
 * Map whitelist fonts to the closest standard PDF face.
 */
export function pdfStandardFont(font: AtsFontFamily): "helvetica" | "times" {
  if (font === "Georgia" || font === "Times New Roman") return "times";
  return "helvetica";
}
