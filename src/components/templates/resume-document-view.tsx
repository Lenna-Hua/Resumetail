"use client";

import type { ResumeTemplateStyle } from "@/lib/resume-template-types";
import type { TemplateSettings } from "@/lib/resume-template-types";
import { cssFontStack } from "@/lib/ats-fonts";
import { DEFAULT_TEMPLATE_SETTINGS } from "@/lib/template-settings";
import {
  type ResumeDisplayData,
  type ResumeDisplaySection,
  splitSectionsForLayout,
} from "@/lib/resume-document";
import { getTemplate } from "@/lib/resume-templates";

/** CSS px per PDF point at 96dpi — template sizes are authored in points, like a real word processor. */
export const PX_PER_PT = 96 / 72;

/** US Letter page margin used by the PDF export, converted to on-screen px so preview matches print. */
function marginPxFor(settings: TemplateSettings): number {
  return 54 * settings.marginScale * PX_PER_PT;
}

interface ResumeDocumentViewProps {
  data: ResumeDisplayData;
  style: ResumeTemplateStyle;
  settings?: TemplateSettings;
  compact?: boolean;
  className?: string;
}

export function ResumeDocumentView({
  data,
  style,
  settings = DEFAULT_TEMPLATE_SETTINGS,
  compact = false,
  className = "",
}: ResumeDocumentViewProps) {
  const template = getTemplate(style);
  const accent = settings.accentColor;
  const base = compact ? 0.42 : PX_PER_PT;
  const spacing = template.sectionSpacing * settings.spacingScale * base;
  const fs = (pt: number) => `${pt * base}px`;
  const margin = marginPxFor(settings);
  const { main, sidebar } = splitSectionsForLayout(data.sections, style);
  const fontFamily = cssFontStack(settings.fontFamily);

  const rootClass = `max-w-full break-words bg-white text-neutral-900 ${compact ? "overflow-hidden" : ""} ${className}`;
  const pageStyle = compact ? undefined : { minHeight: "11in" };

  if (style === "professional") {
    return (
      <div
        className={`flex ${rootClass}`}
        style={{ fontFamily, ...pageStyle }}
      >
        <aside
          className="shrink-0 text-white"
          style={{
            width: compact ? "32%" : "30%",
            backgroundColor: accent,
            padding: compact ? "6px 5px" : `${margin}px ${margin * 0.6}px`,
            fontSize: fs(9),
          }}
        >
          <p className="font-bold leading-tight" style={{ fontSize: fs(template.nameSize) }}>
            {data.name}
          </p>
          {data.contactLines.map((line) => (
            <p key={line} className="mt-1 opacity-90" style={{ fontSize: fs(8) }}>
              {line}
            </p>
          ))}
          {sidebar.map((section) => (
            <SidebarBlock
              key={section.name}
              section={section}
              accent="#ffffff"
              underline={false}
              compact={compact}
              spacing={spacing}
              fs={fs}
            />
          ))}
        </aside>
        <main
          className="min-w-0 flex-1"
          style={{
            padding: compact
              ? "6px 6px"
              : `${margin}px ${margin}px ${margin}px ${margin * 0.5}px`,
          }}
        >
          {main.map((section) => (
            <SectionBlock
              key={section.name}
              section={section}
              style={style}
              accent={accent}
              template={template}
              compact={compact}
              spacing={spacing}
              settings={settings}
              fs={fs}
            />
          ))}
        </main>
      </div>
    );
  }

  if (style === "clean") {
    return (
      <div
        className={`flex ${rootClass}`}
        style={{ fontFamily, ...pageStyle }}
      >
        <aside
          className="shrink-0 border-r border-neutral-200"
          style={{
            width: compact ? "30%" : "28%",
            padding: compact ? "6px 5px" : `${margin}px ${margin * 0.6}px`,
          }}
        >
          <p className="font-bold" style={{ fontSize: fs(template.nameSize) }}>
            {data.name}
          </p>
          {data.contactLines.map((line) => (
            <p key={line} className="text-neutral-600" style={{ fontSize: fs(8) }}>
              {line}
            </p>
          ))}
          {sidebar.map((section) => (
            <SidebarBlock
              key={section.name}
              section={section}
              accent={accent}
              underline
              compact={compact}
              spacing={spacing}
              fs={fs}
            />
          ))}
        </aside>
        <main
          className="min-w-0 flex-1"
          style={{
            padding: compact
              ? "6px 6px"
              : `${margin}px ${margin}px ${margin}px ${margin * 0.5}px`,
          }}
        >
          {main.map((section) => (
            <SectionBlock
              key={section.name}
              section={section}
              style={style}
              accent={accent}
              template={template}
              compact={compact}
              spacing={spacing}
              settings={settings}
              fs={fs}
            />
          ))}
        </main>
      </div>
    );
  }

  return (
    <div
      className={rootClass}
      style={{
        fontFamily,
        padding: compact ? "6px 7px" : `${margin}px`,
        textAlign: style === "traditional" ? "center" : "left",
        ...pageStyle,
      }}
    >
      <p
        className="font-bold leading-tight"
        style={{
          fontSize: fs(template.nameSize),
          color: style === "prime-ats" || style === "simple-ats" ? accent : "#1a1a1a",
        }}
      >
        {data.name}
      </p>
      {data.contactLines.length > 0 && (
        <p
          className="text-neutral-600"
          style={{
            fontSize: fs(9),
            marginTop: compact ? 2 : 4,
          }}
        >
          {data.contactLines.join(" · ")}
        </p>
      )}
      {data.sections.map((section) => (
        <SectionBlock
          key={section.name}
          section={section}
          style={style}
          accent={accent}
          template={template}
          compact={compact}
          spacing={spacing}
          settings={settings}
          fs={fs}
        />
      ))}
    </div>
  );
}

function SidebarBlock({
  section,
  accent,
  underline,
  compact,
  spacing,
  fs,
}: {
  section: ResumeDisplaySection;
  accent: string;
  underline: boolean;
  compact: boolean;
  spacing: number;
  fs: (pt: number) => string;
}) {
  return (
    <div style={{ marginTop: compact ? 4 : spacing }}>
      <p
        className="font-bold uppercase tracking-wide"
        style={{
          fontSize: fs(9),
          color: accent,
          borderBottom: underline ? `1px solid ${accent}33` : undefined,
          paddingBottom: underline ? 2 : 0,
        }}
      >
        {section.name}
      </p>
      {section.items.map((item, i) => (
        <ItemLine key={i} item={item} compact={compact} muted={accent === "#ffffff"} fs={fs} />
      ))}
    </div>
  );
}

function SectionBlock({
  section,
  style,
  accent,
  template,
  compact,
  spacing,
  fs,
}: {
  section: ResumeDisplaySection;
  style: ResumeTemplateStyle;
  accent: string;
  template: ReturnType<typeof getTemplate>;
  compact: boolean;
  spacing: number;
  settings: TemplateSettings;
  fs: (pt: number) => string;
}) {
  const headingColor =
    style === "prime-ats" || style === "simple-ats"
      ? accent
      : style === "pure-ats"
        ? "#000000"
        : "#1a1a1a";

  return (
    <div style={{ marginTop: compact ? 4 : spacing, textAlign: "left" }}>
      <SectionHeading
        name={section.name}
        style={style}
        color={headingColor}
        headingSize={template.headingSize}
        fs={fs}
      />
      {section.items.map((item, i) => (
        <ItemLine
          key={i}
          item={item}
          compact={compact}
          fontSize={template.fontSize}
          fs={fs}
          boldLead={style === "specialist" && item.type === "text" && i === 0}
        />
      ))}
    </div>
  );
}

function SectionHeading({
  name,
  style,
  color,
  headingSize,
  fs,
}: {
  name: string;
  style: ResumeTemplateStyle;
  color: string;
  headingSize: number;
  fs: (pt: number) => string;
}) {
  const fontSize = fs(headingSize);

  if (style === "traditional") {
    return (
      <div className="mb-1">
        <p className="font-semibold uppercase tracking-wide" style={{ fontSize, color }}>
          {name}
        </p>
        <div className="mx-auto h-px w-full bg-neutral-300" />
      </div>
    );
  }

  if (style === "pure-ats") {
    return (
      <p className="font-bold uppercase" style={{ fontSize, color, letterSpacing: "0.04em" }}>
        {name}
      </p>
    );
  }

  if (style === "specialist") {
    return (
      <p className="font-bold" style={{ fontSize: fs(headingSize + 1), color }}>
        {name}
      </p>
    );
  }

  return (
    <p className="font-bold uppercase tracking-wide" style={{ fontSize, color }}>
      {name}
    </p>
  );
}

function ItemLine({
  item,
  compact,
  muted,
  boldLead,
  fontSize: fontSizePt = 10,
  fs,
}: {
  item: { type: string; content: string };
  compact?: boolean;
  muted?: boolean;
  boldLead?: boolean;
  fontSize?: number;
  fs?: (pt: number) => string;
}) {
  const base = compact ? 0.42 : PX_PER_PT;
  const fontSize = fs ? fs(fontSizePt) : `${fontSizePt * base}px`;
  const color = muted ? "rgba(255,255,255,0.92)" : "#404040";

  if (item.type === "bullet") {
    return (
      <p className="pl-2" style={{ fontSize, lineHeight: 1.35, color }}>
        • {item.content}
      </p>
    );
  }

  return (
    <p
      style={{
        fontSize,
        lineHeight: 1.35,
        color,
        fontWeight: boldLead ? 600 : 400,
      }}
    >
      {item.content}
    </p>
  );
}
