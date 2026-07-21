import type { ResumeSection } from "@/lib/types";
import { parseStructuredResume } from "@/lib/structured-resume";
import type { ResumeTemplateStyle } from "@/lib/resume-template-types";

export interface ResumeDisplayItem {
  type: "bullet" | "text";
  content: string;
}

export interface ResumeDisplaySection {
  name: string;
  items: ResumeDisplayItem[];
}

export interface ResumeDisplayData {
  name: string;
  contactLines: string[];
  sections: ResumeDisplaySection[];
}

const SIDEBAR_SECTIONS = new Set([
  "skills",
  "technical skills",
  "languages",
  "certifications",
  "details",
  "info",
  "contact",
]);

/** Rich fake resume for template thumbnails and empty-state previews. */
const SAMPLE_DISPLAY_DATA: ResumeDisplayData = {
  name: "Jane Doe",
  contactLines: [
    "Product Designer",
    "San Francisco, CA · (555) 123-4567 · jane.doe@email.com",
    "linkedin.com/in/janedoe",
  ],
  sections: [
    {
      name: "Summary",
      items: [
        {
          type: "text",
          content:
            "Product designer with 6+ years building user-centered experiences for B2B SaaS products. Skilled in research, prototyping, and cross-functional collaboration with product and engineering teams.",
        },
      ],
    },
    {
      name: "Experience",
      items: [
        { type: "text", content: "Senior Product Designer | Acme Corp" },
        { type: "text", content: "Jan 2021 – Present" },
        {
          type: "bullet",
          content: "Led redesign of onboarding flow, increasing activation by 18%",
        },
        {
          type: "bullet",
          content:
            "Partnered with engineering to ship design system components used across 4 products",
        },
        {
          type: "bullet",
          content:
            "Conducted user interviews and usability tests to validate roadmap priorities",
        },
        {
          type: "bullet",
          content: "Presented quarterly design reviews to executive stakeholders",
        },
        { type: "text", content: "Product Designer | Startup Labs" },
        { type: "text", content: "Jun 2018 – Dec 2020" },
        {
          type: "bullet",
          content: "Owned end-to-end design for mobile and web analytics dashboards",
        },
        {
          type: "bullet",
          content:
            "Created wireframes, high-fidelity mocks, and developer-ready specs in Figma",
        },
        {
          type: "bullet",
          content:
            "Reduced support tickets by 22% through improved navigation and empty states",
        },
      ],
    },
    {
      name: "Education",
      items: [{ type: "text", content: "B.A. Interaction Design | State University | 2018" }],
    },
    {
      name: "Skills",
      items: [
        {
          type: "text",
          content: "Figma · UX research · Prototyping · Design systems · HTML/CSS · Accessibility",
        },
      ],
    },
    {
      name: "Projects",
      items: [
        { type: "text", content: "Design Portfolio | Personal" },
        { type: "text", content: "2023 – Present" },
        {
          type: "bullet",
          content:
            "Built portfolio site with case studies highlighting measurable design outcomes",
        },
        {
          type: "bullet",
          content: "Implemented responsive layouts and optimized Lighthouse performance scores",
        },
      ],
    },
  ],
};

export function getSampleDisplayData(): ResumeDisplayData {
  return SAMPLE_DISPLAY_DATA;
}

export function resumeTextToDisplayData(resumeText: string): ResumeDisplayData {
  if (!resumeText.trim()) return SAMPLE_DISPLAY_DATA;

  return parseResumeTextToDisplay(resumeText);
}

function parseResumeTextToDisplay(resumeText: string): ResumeDisplayData {
  const { sections } = parseStructuredResume(resumeText);
  let name = "";
  const contactLines: string[] = [];
  const displaySections: ResumeDisplaySection[] = [];

  for (const section of sections) {
    if (section.name === "Header" || section.name === "General") {
      for (const item of section.items) {
        const lines = item.content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (!name && lines[0]) name = lines[0];
        contactLines.push(...lines.slice(name ? 1 : 0));
      }
      continue;
    }

    displaySections.push({
      name: section.name,
      items: section.items.map((item) => ({
        type: item.type,
        content: item.content,
      })),
    });
  }

  if (!name) name = "Your Name";

  return { name, contactLines, sections: displaySections };
}

export function splitSectionsForLayout(
  sections: ResumeDisplaySection[],
  style: ResumeTemplateStyle,
): { main: ResumeDisplaySection[]; sidebar: ResumeDisplaySection[] } {
  if (style !== "professional" && style !== "clean") {
    return { main: sections, sidebar: [] };
  }

  const sidebar: ResumeDisplaySection[] = [];
  const main: ResumeDisplaySection[] = [];

  for (const section of sections) {
    const key = section.name.toLowerCase();
    if (SIDEBAR_SECTIONS.has(key) || key.includes("skill") || key.includes("language")) {
      sidebar.push(section);
    } else {
      main.push(section);
    }
  }

  if (sidebar.length === 0 && sections.length > 0) {
    const skills = sections.find((s) => s.name.toLowerCase().includes("skill"));
    if (skills) {
      sidebar.push(skills);
      main.push(...sections.filter((s) => s !== skills));
    } else {
      main.push(...sections);
    }
  }

  return { main, sidebar };
}

export function sectionsFromDisplay(data: ResumeDisplayData): ResumeSection[] {
  const result: ResumeSection[] = [];
  const headerContent = [data.name, ...data.contactLines].join("\n");
  result.push({
    id: "header",
    name: "Header",
    items: [{ id: "h1", type: "text", content: headerContent, original: headerContent }],
  });
  for (const section of data.sections) {
    result.push({
      id: section.name,
      name: section.name,
      items: section.items.map((item, i) => ({
        id: `${section.name}-${i}`,
        type: item.type,
        content: item.content,
        original: item.content,
      })),
    });
  }
  return result;
}
