import type { ContentBlock, ResumeSection, ResumeSectionItem, StructuredResume } from "@/lib/types";

const SECTION_PATTERNS = [
  { name: "Experience", pattern: /^(experience|work experience|employment|professional experience)\s*$/i },
  { name: "Education", pattern: /^(education|academic background)\s*$/i },
  { name: "Skills", pattern: /^(skills|technical skills|core competencies)\s*$/i },
  { name: "Projects", pattern: /^(projects|personal projects)\s*$/i },
  { name: "Certifications", pattern: /^(certifications?|licenses?)\s*$/i },
  { name: "Summary", pattern: /^(summary|professional summary|profile|about)\s*$/i },
];

const BULLET_PREFIX = /^[\s•\-\*\u2022\u2013\u2014]+/;

let itemCounter = 0;
function nextId(prefix: string): string {
  return `${prefix}-${itemCounter++}`;
}

function isBulletLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (BULLET_PREFIX.test(trimmed)) return true;
  return trimmed.length > 20 && /^[A-Z]/.test(trimmed) && trimmed.includes(",");
}

function cleanBullet(line: string): string {
  return line.trim().replace(BULLET_PREFIX, "").trim();
}

export function parseStructuredResume(resumeText: string): StructuredResume {
  itemCounter = 0;
  const lines = resumeText.split(/\r?\n/);
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;
  let headerLines: string[] = [];

  const pushSection = (name: string) => {
    const section: ResumeSection = {
      id: nextId("section"),
      name,
      items: [],
    };
    sections.push(section);
    currentSection = section;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const sectionMatch = SECTION_PATTERNS.find((s) => s.pattern.test(line));
    if (sectionMatch) {
      pushSection(sectionMatch.name);
      continue;
    }

    if (isBulletLine(rawLine)) {
      if (!currentSection) {
        if (headerLines.length > 0) {
          pushSection("Header");
          currentSection!.items.push({
            id: nextId("item"),
            type: "text",
            content: headerLines.join("\n"),
            original: headerLines.join("\n"),
          });
          headerLines = [];
        } else {
          pushSection("General");
        }
      }
      const text = cleanBullet(rawLine);
      if (text.length < 8) continue;
      currentSection!.items.push({
        id: nextId("item"),
        type: "bullet",
        content: text,
        original: text,
      });
      continue;
    }

    const activeSection = sections.at(-1);
    if (!activeSection) {
      headerLines.push(line);
    } else {
      activeSection.items.push({
        id: nextId("item"),
        type: "text",
        content: line,
        original: line,
      });
    }
  }

  if (headerLines.length > 0 && sections.length === 0) {
    pushSection("Header");
    currentSection!.items.push({
      id: nextId("item"),
      type: "text",
      content: headerLines.join("\n"),
      original: headerLines.join("\n"),
    });
  }

  if (sections.length === 0 && resumeText.trim()) {
    pushSection("General");
    resumeText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .forEach((text) => {
        currentSection!.items.push({
          id: nextId("item"),
          type: "bullet",
          content: text,
          original: text,
        });
      });
  }

  return {
    sections,
    plainText: buildPlainText(sections),
  };
}

export function buildPlainText(sections: ResumeSection[]): string {
  const parts: string[] = [];
  for (const section of sections) {
    if (section.name !== "Header" && section.name !== "General") {
      parts.push(section.name.toUpperCase());
    }
    for (const item of section.items) {
      if (item.type === "bullet") {
        parts.push(`• ${item.content}`);
      } else {
        parts.push(item.content);
      }
    }
    parts.push("");
  }
  return parts.join("\n").trim();
}

export function updateSectionItem(
  sections: ResumeSection[],
  sectionId: string,
  itemId: string,
  content: string,
): ResumeSection[] {
  return sections.map((section) => {
    if (section.id !== sectionId) return section;
    return {
      ...section,
      items: section.items.map((item) =>
        item.id === itemId ? { ...item, content } : item,
      ),
    };
  });
}

export function sectionsToResumeText(sections: ResumeSection[]): string {
  return buildPlainText(sections);
}

/**
 * Text used for export/preview. Template-specific layout (columns, spacing, colors) is applied
 * separately by the document renderer — this keeps the plain-text content unchanged.
 */
export function resumeTextForExport(resumeText: string): string {
  return resumeText;
}

export function moveSectionItem(
  sections: ResumeSection[],
  sectionId: string,
  itemId: string,
  direction: "up" | "down",
): ResumeSection[] {
  return sections.map((section) => {
    if (section.id !== sectionId) return section;
    const index = section.items.findIndex((item) => item.id === itemId);
    if (index === -1) return section;

    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= section.items.length) return section;

    const items = [...section.items];
    [items[index], items[target]] = [items[target], items[index]];
    return { ...section, items };
  });
}

export function reorderSectionItem(
  sections: ResumeSection[],
  sectionId: string,
  fromIndex: number,
  toIndex: number,
): ResumeSection[] {
  return sections.map((section) => {
    if (section.id !== sectionId) return section;
    if (fromIndex < 0 || fromIndex >= section.items.length) return section;
    if (toIndex < 0 || toIndex >= section.items.length) return section;

    const items = [...section.items];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    return { ...section, items };
  });
}

function makeItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeSectionId(): string {
  return `section-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Insert a new item into a section (creates section if missing). */
export function addSectionItem(
  sections: ResumeSection[],
  sectionName: string,
  content: string,
  type: ResumeSectionItem["type"] = "bullet",
): ResumeSection[] {
  const name = sectionName.trim() || "General";
  const newItem: ResumeSectionItem = {
    id: makeItemId(),
    type,
    content: content.trim(),
    original: content.trim(),
  };

  const existing = sections.find(
    (s) => s.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) {
    return sections.map((s) =>
      s.id === existing.id ? { ...s, items: [...s.items, newItem] } : s,
    );
  }

  return [
    ...sections,
    { id: makeSectionId(), name, items: [newItem] },
  ];
}

/** Insert a library block at a specific index within a section. */
export function insertSectionItemAt(
  sections: ResumeSection[],
  sectionId: string,
  index: number,
  content: string,
  type: ResumeSectionItem["type"] = "bullet",
): ResumeSection[] {
  const newItem: ResumeSectionItem = {
    id: makeItemId(),
    type,
    content: content.trim(),
    original: content.trim(),
  };

  return sections.map((section) => {
    if (section.id !== sectionId) return section;
    const items = [...section.items];
    const at = Math.max(0, Math.min(index, items.length));
    items.splice(at, 0, newItem);
    return { ...section, items };
  });
}

/** Insert multiple library blocks in selection order. */
export function addBlocksToSections(
  sections: ResumeSection[],
  blocks: ContentBlock[],
): ResumeSection[] {
  return blocks.reduce((current, block) => {
    const itemType = block.type === "summary" ? "text" : "bullet";
    return addSectionItem(current, block.sectionName, block.content, itemType);
  }, sections);
}
