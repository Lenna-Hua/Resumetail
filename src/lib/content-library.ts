import type {
  ContentBlock,
  ContentBlockType,
  ContentFunction,
  ContentSeniority,
  MasterProfile,
  ParsedJD,
  ResumeSection,
} from "@/lib/types";
import { masterProfileToHeaderText } from "@/lib/master-profile";
import { getLocalItem, setLocalItem } from "@/lib/browser-store";

const LIBRARY_KEY = "resutail-content-library-v1";

function generateId(): string {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadContentBlocks(): ContentBlock[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = getLocalItem(LIBRARY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ContentBlock[];
  } catch {
    return [];
  }
}

function saveContentBlocks(blocks: ContentBlock[]): void {
  if (typeof window === "undefined") return;
  setLocalItem(LIBRARY_KEY, JSON.stringify(blocks));
}

export function getContentBlock(id: string): ContentBlock | undefined {
  return loadContentBlocks().find((b) => b.id === id);
}

export function createContentBlock(
  input: Pick<ContentBlock, "type" | "content" | "sectionName"> &
    Partial<
      Pick<
        ContentBlock,
        "tags" | "function" | "seniority" | "domain" | "starred" | "sourceVersionId"
      >
    >,
): ContentBlock {
  const now = new Date().toISOString();
  const block: ContentBlock = {
    id: generateId(),
    type: input.type,
    content: input.content.trim(),
    sectionName: input.sectionName,
    tags: input.tags ?? [],
    function: input.function ?? "general",
    seniority: input.seniority ?? "mid",
    domain: input.domain ?? "",
    starred: input.starred ?? false,
    sourceVersionId: input.sourceVersionId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  saveContentBlocks([...loadContentBlocks(), block]);
  return block;
}

export function updateContentBlock(
  id: string,
  updates: Partial<
    Pick<
      ContentBlock,
      | "content"
      | "sectionName"
      | "tags"
      | "function"
      | "seniority"
      | "domain"
      | "starred"
      | "type"
    >
  >,
): ContentBlock | null {
  const blocks = loadContentBlocks();
  const index = blocks.findIndex((b) => b.id === id);
  if (index === -1) return null;

  blocks[index] = {
    ...blocks[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveContentBlocks(blocks);
  return blocks[index];
}

export function deleteContentBlock(id: string): void {
  saveContentBlocks(loadContentBlocks().filter((b) => b.id !== id));
}

export function toggleBlockStarred(id: string): ContentBlock | null {
  const block = getContentBlock(id);
  if (!block) return null;
  return updateContentBlock(id, { starred: !block.starred });
}

function inferBlockType(sectionName: string, content: string): ContentBlockType {
  const section = sectionName.toLowerCase();
  if (/summary|profile|about/.test(section)) return "summary";
  if (/skill/.test(section)) return "skill";
  if (/project/.test(section)) return "project";
  if (/certif|license/.test(section)) return "certification";
  if (/award|honou?r/.test(section)) return "award";
  if (/volunteer|community/.test(section)) return "volunteer";
  if (/leadership/.test(section)) return "leadership";
  if (/http|\.com|portfolio|linkedin/i.test(content)) return "link";
  return "bullet";
}

function inferTags(content: string, sectionName: string): string[] {
  const tags = new Set<string>();
  const lower = `${content} ${sectionName}`.toLowerCase();

  const keywordHints = [
    "ux",
    "ui",
    "product",
    "design",
    "event",
    "marketing",
    "client",
    "logistics",
    "leadership",
    "ai",
    "figma",
    "research",
    "coordination",
  ];
  for (const hint of keywordHints) {
    if (lower.includes(hint)) tags.add(hint);
  }
  if (sectionName) tags.add(sectionName.toLowerCase().replace(/\s+/g, "-"));
  return [...tags];
}

/** Import structured resume sections into the content library (dedupes by content). */
export function importSectionsToLibrary(
  sections: ResumeSection[],
  sourceVersionId?: string | null,
): ContentBlock[] {
  const existing = loadContentBlocks();
  const existingContent = new Set(existing.map((b) => b.content.trim().toLowerCase()));
  const created: ContentBlock[] = [];

  for (const section of sections) {
    for (const item of section.items) {
      const content = item.content.trim();
      if (content.length < 8) continue;
      if (existingContent.has(content.toLowerCase())) continue;

      const block = createContentBlock({
        type: item.type === "bullet" ? inferBlockType(section.name, content) : "summary",
        content,
        sectionName: section.name,
        tags: inferTags(content, section.name),
        sourceVersionId: sourceVersionId ?? null,
      });
      created.push(block);
      existingContent.add(content.toLowerCase());
    }
  }

  return created;
}

export interface ContentBlockFilter {
  query?: string;
  type?: ContentBlockType | "all";
  sectionName?: string;
  function?: ContentFunction | "all";
  seniority?: ContentSeniority | "all";
  starredOnly?: boolean;
}

export function filterContentBlocks(
  blocks: ContentBlock[],
  filter: ContentBlockFilter,
): ContentBlock[] {
  const q = filter.query?.trim().toLowerCase() ?? "";
  return blocks.filter((block) => {
    if (filter.starredOnly && !block.starred) return false;
    if (filter.type && filter.type !== "all" && block.type !== filter.type) return false;
    if (filter.function && filter.function !== "all" && block.function !== filter.function) {
      return false;
    }
    if (filter.seniority && filter.seniority !== "all" && block.seniority !== filter.seniority) {
      return false;
    }
    if (
      filter.sectionName &&
      block.sectionName.toLowerCase() !== filter.sectionName.toLowerCase()
    ) {
      return false;
    }
    if (!q) return true;
    const haystack = [
      block.content,
      block.sectionName,
      block.domain,
      block.function,
      ...block.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

/** Rule-based JD recommendations — no AI required. */
export function recommendBlocksForJd(
  blocks: ContentBlock[],
  parsedJD: ParsedJD | null,
  limit = 8,
): ContentBlock[] {
  if (!parsedJD) return blocks.filter((b) => b.starred).slice(0, limit);

  const jdTerms = [
    ...parsedJD.hardSkills,
    ...parsedJD.softSkills,
    ...parsedJD.keywords,
    ...parsedJD.responsibilities,
    parsedJD.roleTitle,
  ]
    .map((t) => t.toLowerCase())
    .filter((t) => t.length > 2);

  const scored = blocks.map((block) => {
    const text = [block.content, block.sectionName, ...block.tags, block.domain]
      .join(" ")
      .toLowerCase();
    let score = block.starred ? 2 : 0;
    for (const term of jdTerms) {
      if (text.includes(term)) score += 1;
    }
    return { block, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.block);
}

export const CONTENT_BLOCK_TYPE_LABELS: Record<ContentBlockType, string> = {
  summary: "Summary",
  bullet: "Bullet",
  project: "Project",
  skill: "Skill",
  certification: "Certification",
  award: "Award",
  volunteer: "Volunteer",
  leadership: "Leadership",
  link: "Link",
  custom: "Custom",
};

export const CONTENT_FUNCTIONS: ContentFunction[] = [
  "general",
  "product",
  "design",
  "engineering",
  "marketing",
  "growth",
  "operations",
  "strategy",
];

export const CONTENT_SENIORITIES: ContentSeniority[] = [
  "entry",
  "mid",
  "senior",
  "leadership",
];

export const CONTENT_FUNCTION_LABELS: Record<ContentFunction, string> = {
  general: "General",
  product: "Product",
  design: "Design",
  engineering: "Engineering",
  marketing: "Marketing",
  growth: "Growth",
  operations: "Operations",
  strategy: "Strategy",
};

export const CONTENT_SENIORITY_LABELS: Record<ContentSeniority, string> = {
  entry: "Entry",
  mid: "Mid",
  senior: "Senior",
  leadership: "Leadership",
};

const BUILD_SECTION_ORDER = [
  "Header",
  "Summary",
  "Experience",
  "Education",
  "Projects",
  "Skills",
  "Certifications",
  "General",
];

function sectionRank(name: string): number {
  const index = BUILD_SECTION_ORDER.findIndex(
    (section) => section.toLowerCase() === name.toLowerCase(),
  );
  return index === -1 ? 50 : index;
}

function blockToResumeLine(block: ContentBlock): string {
  const bulletTypes: ContentBlockType[] = [
    "bullet",
    "project",
    "volunteer",
    "leadership",
    "award",
  ];
  if (bulletTypes.includes(block.type)) {
    return `• ${block.content}`;
  }
  return block.content;
}

/** Assemble plain resume text from selected library blocks (Workflow B). */
export function buildResumeTextFromBlocks(
  blocks: ContentBlock[],
  options?: { profile?: MasterProfile | null },
): string {
  if (blocks.length === 0 && !options?.profile?.fullName?.trim()) return "";

  const bySection = new Map<string, ContentBlock[]>();
  for (const block of blocks) {
    const section = block.sectionName.trim() || "General";
    const list = bySection.get(section) ?? [];
    list.push(block);
    bySection.set(section, list);
  }

  const sectionNames = [...bySection.keys()].sort((a, b) => sectionRank(a) - sectionRank(b));
  const parts: string[] = [];

  const profileHeader = options?.profile ? masterProfileToHeaderText(options.profile) : "";
  if (profileHeader) {
    parts.push(profileHeader, "");
  }

  for (const name of sectionNames) {
    const items = bySection.get(name) ?? [];
    const isHeader = name.toLowerCase() === "header";
    if (!isHeader && name.toLowerCase() !== "general") {
      parts.push(name.toUpperCase());
    }
    for (const block of items) {
      parts.push(blockToResumeLine(block));
    }
    parts.push("");
  }

  return parts.join("\n").trim();
}
