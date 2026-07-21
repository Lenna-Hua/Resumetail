import { markLastExport } from "@/lib/backup-nudge";
import { jsPDF } from "jspdf";
import { pdfStandardFont } from "@/lib/ats-fonts";
import type { ResumeTemplate, ResumeTemplateId, TemplateSettings } from "@/lib/resume-template-types";
import { getTemplate } from "@/lib/resume-templates";
import { DEFAULT_TEMPLATE_SETTINGS, resolveTemplateSettings } from "@/lib/template-settings";
import {
  resumeTextToDisplayData,
  splitSectionsForLayout,
} from "@/lib/resume-document";

export function exportResumePdf(
  resumeText: string,
  filename = "resutail-resume.pdf",
  templateId: ResumeTemplateId = "classic",
  settings: TemplateSettings = DEFAULT_TEMPLATE_SETTINGS,
) {
  const template = getTemplate(templateId);
  const resolved = resolveTemplateSettings(templateId, settings);
  const data = resumeTextToDisplayData(resumeText);
  exportResumePdfWithTemplate(data, filename, template, resolved);
  markLastExport();
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const num = Number.parseInt(value, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function exportResumePdfWithTemplate(
  data: ReturnType<typeof resumeTextToDisplayData>,
  filename: string,
  template: ResumeTemplate,
  settings: TemplateSettings,
) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 54 * settings.marginScale;
  const sectionGap = template.sectionSpacing * settings.spacingScale;
  const [accentR, accentG, accentB] = hexToRgb(settings.accentColor);

  if (template.style === "professional" || template.style === "clean") {
    renderTwoColumnPdf(doc, data, template, settings, {
      pageWidth,
      pageHeight,
      margin,
      sectionGap,
      accent: [accentR, accentG, accentB],
    });
  } else {
    renderSingleColumnPdf(doc, data, template, settings, {
      pageWidth,
      pageHeight,
      margin,
      sectionGap,
      accent: [accentR, accentG, accentB],
    });
  }

  doc.save(filename);
}

function renderSingleColumnPdf(
  doc: jsPDF,
  data: ReturnType<typeof resumeTextToDisplayData>,
  template: ResumeTemplate,
  settings: TemplateSettings,
  ctx: {
    pageWidth: number;
    pageHeight: number;
    margin: number;
    sectionGap: number;
    accent: [number, number, number];
  },
) {
  const maxWidth = ctx.pageWidth - ctx.margin * 2;
  let y = ctx.margin;
  const centered = template.style === "traditional";
  const pdfFont = pdfStandardFont(settings.fontFamily);

  const ensureSpace = (height: number) => {
    if (y + height > ctx.pageHeight - ctx.margin) {
      doc.addPage();
      y = ctx.margin;
    }
  };

  const write = (
    text: string,
    opts: {
      fontSize?: number;
      bold?: boolean;
      color?: [number, number, number];
      indent?: number;
      align?: "left" | "center";
      lineHeight?: number;
    } = {},
  ) => {
    const fontSize = opts.fontSize ?? template.fontSize;
    const lineHeight = opts.lineHeight ?? template.lineHeight;
    const indent = opts.indent ?? 0;
    const width = maxWidth - indent;
    const color = opts.color ?? [0, 0, 0];
    const align = opts.align ?? (centered ? "center" : "left");

    doc.setFont(pdfFont, opts.bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);

    const wrapped = doc.splitTextToSize(text, width) as string[];
    for (const part of wrapped) {
      ensureSpace(lineHeight);
      const x =
        align === "center"
          ? ctx.pageWidth / 2
          : ctx.margin + indent;
      doc.text(part, x, y, { align });
      y += lineHeight;
    }
    doc.setTextColor(0, 0, 0);
  };

  const headingColor =
    template.style === "prime-ats" || template.style === "simple-ats"
      ? ctx.accent
      : [0, 0, 0] as [number, number, number];

  write(data.name, {
    fontSize: template.nameSize,
    bold: true,
    color:
      template.style === "prime-ats" || template.style === "simple-ats"
        ? ctx.accent
        : [0, 0, 0],
    align: centered ? "center" : "left",
    lineHeight: template.nameSize + 4,
  });

  if (data.contactLines.length) {
    write(data.contactLines.join(" · "), {
      fontSize: 9.5,
      align: centered ? "center" : "left",
      lineHeight: 12,
    });
  }

  y += 6;

  for (const section of data.sections) {
    y += ctx.sectionGap;
    ensureSpace(template.lineHeight + 4);
    write(section.name.toUpperCase(), {
      fontSize: template.headingSize,
      bold: true,
      color: headingColor,
      align: centered ? "center" : "left",
      lineHeight: template.lineHeight + 2,
    });

    if (template.style === "traditional") {
      ensureSpace(6);
      doc.setDrawColor(180, 180, 180);
      doc.line(ctx.margin, y - 2, ctx.margin + maxWidth, y - 2);
      y += 4;
    }

    for (const item of section.items) {
      if (item.type === "bullet") {
        write(`• ${item.content}`, {
          indent: 12,
          fontSize: template.fontSize,
          lineHeight: template.lineHeight,
        });
      } else {
        write(item.content, {
          fontSize: template.fontSize,
          lineHeight: template.lineHeight,
          bold: template.style === "specialist",
        });
      }
    }
  }
}

function renderTwoColumnPdf(
  doc: jsPDF,
  data: ReturnType<typeof resumeTextToDisplayData>,
  template: ResumeTemplate,
  settings: TemplateSettings,
  ctx: {
    pageWidth: number;
    pageHeight: number;
    margin: number;
    sectionGap: number;
    accent: [number, number, number];
  },
) {
  const sidebarWidth =
    template.style === "professional" ? ctx.pageWidth * 0.3 : ctx.pageWidth * 0.28;
  const mainX = ctx.margin + sidebarWidth + 12;
  const mainWidth = ctx.pageWidth - mainX - ctx.margin;
  const { main, sidebar } = splitSectionsForLayout(data.sections, template.style);
  const pdfFont = pdfStandardFont(settings.fontFamily);

  if (template.style === "professional") {
    doc.setFillColor(ctx.accent[0], ctx.accent[1], ctx.accent[2]);
    doc.rect(0, 0, sidebarWidth + ctx.margin, ctx.pageHeight, "F");
  }

  let sideY = ctx.margin;
  let mainY = ctx.margin;

  const writeSidebar = (text: string, opts: { bold?: boolean; size?: number; white?: boolean }) => {
    doc.setFont(pdfFont, opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? 9);
    if (template.style === "professional") {
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(0, 0, 0);
    }
    const wrapped = doc.splitTextToSize(text, sidebarWidth - 16) as string[];
    for (const line of wrapped) {
      doc.text(line, ctx.margin + 8, sideY);
      sideY += (opts.size ?? 9) + 3;
    }
    doc.setTextColor(0, 0, 0);
  };

  writeSidebar(data.name, { bold: true, size: template.nameSize });
  for (const line of data.contactLines) writeSidebar(line, { size: 8 });
  sideY += 4;

  for (const section of sidebar) {
    sideY += ctx.sectionGap;
    writeSidebar(section.name.toUpperCase(), { bold: true, size: template.headingSize });
    for (const item of section.items) {
      writeSidebar(item.type === "bullet" ? `• ${item.content}` : item.content, { size: 9 });
    }
  }

  const writeMain = (text: string, opts: { bold?: boolean; size?: number; indent?: number }) => {
    doc.setFont(pdfFont, opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? template.fontSize);
    const wrapped = doc.splitTextToSize(text, mainWidth - (opts.indent ?? 0)) as string[];
    for (const line of wrapped) {
      doc.text(line, mainX + (opts.indent ?? 0), mainY);
      mainY += (opts.size ?? template.fontSize) + 2;
    }
  };

  for (const section of main) {
    mainY += ctx.sectionGap;
    writeMain(section.name.toUpperCase(), { bold: true, size: template.headingSize });
    mainY += 2;
    for (const item of section.items) {
      if (item.type === "bullet") {
        writeMain(`• ${item.content}`, { indent: 10 });
      } else {
        writeMain(item.content, { bold: template.style === "specialist" });
      }
    }
  }
}
