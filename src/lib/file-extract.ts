const ACCEPTED_TYPES = {
  "text/plain": ".txt",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/pdf": ".pdf",
} as const;

export const RESUME_ACCEPT = ".txt,.docx,.pdf";

export function isAcceptedResumeFile(file: File): boolean {
  if (file.type in ACCEPTED_TYPES) return true;
  const lower = file.name.toLowerCase();
  return lower.endsWith(".txt") || lower.endsWith(".docx") || lower.endsWith(".pdf");
}

export async function extractResumeText(file: File): Promise<string> {
  const lower = file.name.toLowerCase();

  if (file.type === "text/plain" || lower.endsWith(".txt")) {
    return (await file.text()).trim();
  }

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value.trim();
  }

  if (file.type === "application/pdf" || lower.endsWith(".pdf")) {
    return extractPdfText(file);
  }

  throw new Error("Unsupported file type. Use .txt, .docx, or .pdf.");
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) pages.push(text);
  }

  return pages.join("\n\n").trim();
}
