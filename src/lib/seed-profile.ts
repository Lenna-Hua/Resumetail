import type { AppSession } from "@/lib/types";

/**
 * Canonical resume text for Lenna Hua — cleaned from Reference/Lenna Hua Resume.pdf.
 * Represents the text quality expected after a successful PDF upload.
 */
export const SEED_RESUME_TEXT = `LENNA HUA
Toronto, ON | 416-316-5827 | lenna.huawork@gmail.com
Portfolio: lennahua.ca | LinkedIn: linkedin.com/in/nhuxu-lenna/

EDUCATION
POST-GRADUATION COURSE IN USER EXPERIENCE DESIGN
Humber College | 2025–Present

BACHELOR OF DIGITAL GRAPHIC DESIGN
Hoa Sen University, Vietnam | 2019–2023

PERSONAL PROJECT
Habiganizer | Product Owner – UX/UI Lead

• Product & UI Design: Designed a gamified habit-tracking application that pairs a modern, minimalist interface for rapid task entry with an interactive virtual pet companion to drive user retention and motivation.
• Empathetic UX: Championed an inclusive user experience tailored for neurodivergent individuals, integrating AI-supported empathetic messaging and live-photo journaling to provide meaningful mental health support.
• End-to-End Lifecycle: Managed the complete product lifecycle from initial wireframes and visual design to high-fidelity prototyping, preparing for upcoming launches on the iOS App Store and Google Play.

PROFESSIONAL EXPERIENCE
Event Crew | Event Assistant
2024 – 2025

• Supported major Toronto events including Annual Dinner 2025, DesignTO, CANFAR's Bloor Street Entertain 28, Limitless Gala 2024, CAFA Awards 2024, and on-call for Floral Werx | Europe Elegant.
• Implemented event setups including venue layouts and audience touchpoints across high-traffic environments.
• Optimized wayfinding and spatial systems for high-volume environments, iterating on service delivery in real-time based on logistical constraints and live user feedback.

Cotriply | UX & Product Designer Co-op
Apr 2026 – Jun 2026

• Contributed to product design and development initiatives by supporting UX research, user flow optimization, and feature iteration.
• Worked closely with team members to improve onboarding, booking, AI-assisted workflows, and admin-facing tools.
• Assisted with testing, feedback collection, and design refinement to enhance usability and product consistency.

THG Trade & Service Co., Ltd. | Hybrid Experience Designer (Visual & Event)
2022 – 2025

• Designed visual systems, motion assets, and spatial concepts for weddings, live events, and brand campaigns.
• Collaborated with planners and marketers to deliver cohesive audience experiences.

7 Millions Store | Graphic Designer / Visual Designer
Mar 2022 – Sep 2022

• Designed print and digital assets for apparel collections and branding.
• Supported visual consistency across marketing materials and production workflows.
• Implemented sustainable design principles into the brand's visual identity.

COMMUNITY & VOLUNTEER EXPERIENCE

• Designed and facilitated inclusive design workshops for 50+ diverse youth, increasing engagement by focusing on accessible creative tools and peer-to-peer mentorship.
• Get REAL Movement: Supported LGBTQ+ education and inclusive community events in Toronto.

SKILLS
Design Systems & UI: Component Libraries, Design System Documentation, Typography, Layout & Composition, Accessibility Standards, Production-Ready Handoff.
UX Foundation: Rapid Prototyping, Information Architecture, Journey Mapping, Usability Testing, Visual Communication.
Design Tools: Figma (Components, Auto-layout, Tokens, Plugins), Adobe Creative Suite (Illustrator, Photoshop, After Effects), Miro.
AI Design & Workflows: AI-Assisted Prototyping, Prompt Engineering, Human-AI Interaction Design, Generative AI (Claude, DeepSeek).
Technical Acumen: Cross-functional Developer Handoff, AI-Assisted Deployment (Cursor, Replit, Vercel), Understanding of Web Constraints.

UX Design student with a background in graphic and spatial experience design. Focused on bridging the gap between digital interfaces and physical journeys through research-backed solutions.

POST-GRADUATION COURSE IN EVENT MANAGEMENT – CREATIVE DESIGN
Seneca College | 2024–2025`;

/** Sample JD aligned with Reference/Lenna Hua_Cover Letter_Client Experience.pdf */
export const SEED_JD_TEXT = `Coordinator, Client Experience — Proof Experiences (Toronto, ON)

Proof Experiences is an award-winning experiential marketing agency recognized as one of Canada's Top Growing Companies. We create purpose-driven, impactful brand experiences for clients across North America.

Responsibilities:
- Support client experience coordination for experiential campaigns and live events
- Manage event logistics including permits, transportation, vendor coordination, and on-site resources
- Maintain project timelines, workflows, and stakeholder updates in fast-paced environments
- Reconcile invoices and assist with budget tracking for campaign execution
- Collaborate with cross-functional teams on in-field event delivery and client communication
- Adapt to flexible hours during live events and critical deadlines

Requirements:
- Post-secondary education in Event Management, Marketing, or related field
- Strong organizational skills and attention to detail
- Experience with Microsoft Office (Excel, PowerPoint, Word)
- Comfort working in hybrid settings with Toronto-based team members
- Excellent communication, empathy, and problem-solving in client-facing roles
- Ability to manage multiple vendors and logistics simultaneously

Keywords: client experience, experiential marketing, event logistics, project coordination, stakeholder communication, vendor management, campaign execution, Toronto events`;

export const SEED_PROFILE = {
  name: "Lenna Hua",
  exportFilename: "Lenna-Hua-Resume.pdf",
  referencePdf: "/samples/Lenna-Hua-Resume.pdf",
} as const;

export function createSeedSession(): AppSession {
  return {
    resumeText: SEED_RESUME_TEXT,
    jdText: SEED_JD_TEXT,
    parsedJD: null,
    bullets: [],
    coverage: null,
    atsResult: null,
    matchScore: null,
    activeVersionId: null,
    coverLetterText: "",
    coverLetterTone: "concise",
    coverLetterTemplate: "standard-business",
    updatedAt: new Date().toISOString(),
  };
}
