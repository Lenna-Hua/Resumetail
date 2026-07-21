import { markLastExport } from "@/lib/backup-nudge";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
} from "docx";
import { getCoverLetterTemplate } from "@/lib/cover-letter-templates";
import type { CoverLetterTemplateId, ResumeTemplateId, TemplateSettings } from "@/lib/types";
import { DEFAULT_ATS_FONT, type AtsFontFamily } from "@/lib/ats-fonts";
import { getTemplate } from "@/lib/resume-templates";
import { DEFAULT_TEMPLATE_SETTINGS, resolveTemplateSettings } from "@/lib/template-settings";
import {
  resumeTextToDisplayData,
  splitSectionsForLayout,
  type ResumeDisplayData,
  type ResumeDisplayItem,
  type ResumeDisplaySection,
} from "@/lib/resume-document";
import type { ResumeTemplate } from "@/lib/resume-template-types";

/** Word sizes fonts in half-points and spacing/margins in twips (1pt = 20 twips). */
const PT_TO_HALF_PT = 2;
const PT_TO_TWIP = 20;
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } as const;

function hexToDocxColor(hex: string): string {
  return hex.replace("#", "").toUpperCase();
}

function headingColorFor(template: ResumeTemplate, accent: string): string {
  if (template.style === "prime-ats" || template.style === "simple-ats") return hexToDocxColor(accent);
  if (template.style === "pure-ats") return "000000";
  return "1A1A1A";
}

function nameParagraph(
  data: ResumeDisplayData,
  template: ResumeTemplate,
  accent: string,
  font: AtsFontFamily,
): Paragraph {
  const centered = template.style === "traditional";
  const color =
    template.style === "prime-ats" || template.style === "simple-ats"
      ? hexToDocxColor(accent)
      : "1A1A1A";
  return new Paragraph({
    alignment: centered ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: data.name,
        bold: true,
        font,
        size: Math.round(template.nameSize * PT_TO_HALF_PT),
        color,
      }),
    ],
  });
}

function contactParagraph(
  data: ResumeDisplayData,
  template: ResumeTemplate,
  font: AtsFontFamily,
): Paragraph | null {
  if (!data.contactLines.length) return null;
  const centered = template.style === "traditional";
  return new Paragraph({
    alignment: centered ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { after: 160 },
    children: [
      new TextRun({ text: data.contactLines.join(" · "), font, size: 19, color: "595959" }),
    ],
  });
}

function headingParagraph(
  name: string,
  template: ResumeTemplate,
  accent: string,
  spacingBeforePt: number,
  font: AtsFontFamily,
): Paragraph {
  const color = headingColorFor(template, accent);
  return new Paragraph({
    spacing: { before: Math.round(spacingBeforePt * PT_TO_TWIP), after: 80 },
    border:
      template.style === "traditional"
        ? { bottom: { style: BorderStyle.SINGLE, size: 4, color: "B3B3B3", space: 2 } }
        : undefined,
    children: [
      new TextRun({
        text: name.toUpperCase(),
        bold: true,
        font,
        size: Math.round(template.headingSize * PT_TO_HALF_PT),
        color,
      }),
    ],
  });
}

function itemParagraph(
  item: ResumeDisplayItem,
  template: ResumeTemplate,
  boldLead: boolean,
  font: AtsFontFamily,
): Paragraph {
  const size = Math.round(template.fontSize * PT_TO_HALF_PT);
  if (item.type === "bullet") {
    return new Paragraph({
      spacing: { after: 40 },
      indent: { left: 260 },
      children: [new TextRun({ text: `• ${item.content}`, font, size })],
    });
  }
  return new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: item.content, font, size, bold: boldLead })],
  });
}

function sectionParagraphs(
  section: ResumeDisplaySection,
  template: ResumeTemplate,
  accent: string,
  spacingPt: number,
  font: AtsFontFamily,
): Paragraph[] {
  const paragraphs = [headingParagraph(section.name, template, accent, spacingPt, font)];
  section.items.forEach((item, i) => {
    paragraphs.push(
      itemParagraph(
        item,
        template,
        template.style === "specialist" && item.type === "text" && i === 0,
        font,
      ),
    );
  });
  return paragraphs;
}

export async function exportResumeDocx(
  resumeText: string,
  filename = "resutail-resume.docx",
  templateId: ResumeTemplateId = "classic",
  settings: TemplateSettings = DEFAULT_TEMPLATE_SETTINGS,
): Promise<void> {
  const template = getTemplate(templateId);
  const resolved = resolveTemplateSettings(templateId, settings);
  const data = resumeTextToDisplayData(resumeText);
  const accent = resolved.accentColor;
  const font = resolved.fontFamily ?? DEFAULT_ATS_FONT;
  const spacingPt = template.sectionSpacing * resolved.spacingScale;
  const marginTwip = Math.round(54 * resolved.marginScale * PT_TO_TWIP);

  const children: (Paragraph | Table)[] = [nameParagraph(data, template, accent, font)];
  const contact = contactParagraph(data, template, font);
  if (contact) children.push(contact);

  if (template.layout === "two-column") {
    const { main, sidebar } = splitSectionsForLayout(data.sections, template.style);
    const sidebarParagraphs = sidebar.flatMap((s) =>
      sectionParagraphs(s, template, accent, spacingPt, font),
    );
    const mainParagraphs = main.flatMap((s) =>
      sectionParagraphs(s, template, accent, spacingPt, font),
    );
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: NO_BORDER,
          bottom: NO_BORDER,
          left: NO_BORDER,
          right: NO_BORDER,
          insideHorizontal: NO_BORDER,
          insideVertical: NO_BORDER,
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 32, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.TOP,
                margins: { top: 0, bottom: 0, left: 0, right: 160 },
                children: sidebarParagraphs.length ? sidebarParagraphs : [new Paragraph("")],
              }),
              new TableCell({
                width: { size: 68, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.TOP,
                margins: { top: 0, bottom: 0, left: 160, right: 0 },
                children: mainParagraphs.length ? mainParagraphs : [new Paragraph("")],
              }),
            ],
          }),
        ],
      }),
    );
  } else {
    for (const section of data.sections) {
      children.push(...sectionParagraphs(section, template, accent, spacingPt, font));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: marginTwip, bottom: marginTwip, left: marginTwip, right: marginTwip },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  markLastExport();
}

function coverLetterToParagraphs(
  letterText: string,
  templateId: CoverLetterTemplateId = "standard-business",
): Paragraph[] {
  const template = getCoverLetterTemplate(templateId);
  const fontSize = template.fontSize * 2;
  const paragraphSpacing = template.paragraphSpacing * 20;
  const alignment =
    template.alignment === "justify" ? AlignmentType.JUSTIFIED : AlignmentType.LEFT;

  return letterText.split(/\n\n+/).map(
    (block) =>
      new Paragraph({
        alignment,
        spacing: { after: paragraphSpacing, line: Math.round(template.lineSpacing * 240) },
        children: [new TextRun({ text: block.trim(), size: fontSize })],
      }),
  );
}

export async function exportCoverLetterDocx(
  letterText: string,
  filename = "resutail-cover-letter.docx",
  templateId: CoverLetterTemplateId = "standard-business",
): Promise<void> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: coverLetterToParagraphs(letterText, templateId),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
