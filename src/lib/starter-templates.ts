import type { CoverLetterTemplateId } from "@/lib/types";
import type { ResumeTemplateId } from "@/lib/resume-template-types";

export interface ResumeStarterTemplate {
  id: string;
  label: string;
  description: string;
  suggestedTemplateId: ResumeTemplateId;
  content: string;
}

export interface CoverLetterStarterTemplate {
  id: string;
  label: string;
  description: string;
  suggestedLayoutId: CoverLetterTemplateId;
  content: string;
}

export const RESUME_STARTER_TEMPLATES: ResumeStarterTemplate[] = [
  {
    id: "classic-blank",
    label: "Classic",
    description: "Standard sections with clear hierarchy for any role.",
    suggestedTemplateId: "classic",
    content: `YOUR FULL NAME
City, ST | phone | email@example.com
LinkedIn: linkedin.com/in/yourname

SUMMARY
Two to three lines describing your role, years of experience, and strongest fit for the jobs you target.

EXPERIENCE
Job Title | Company Name
Month Year – Present

• Achievement with a metric (e.g. increased conversion 18%)
• Responsibility showing scope and tools used
• Outcome tied to business or user impact

EDUCATION
Degree Name
University Name | Graduation Year

SKILLS
Skill one · Skill two · Skill three · Skill four`,
  },
  {
    id: "student-new-grad",
    label: "Student / New Grad",
    description: "Education-first layout for internships and campus recruiting.",
    suggestedTemplateId: "simple-ats",
    content: `YOUR FULL NAME
City, ST | phone | email@example.com

EDUCATION
Bachelor of [Major]
University Name | Expected Graduation Year
• Relevant coursework: Course A, Course B, Course C
• Dean's List / GPA (optional)

PROJECTS
Project Name | Role
Month Year – Month Year

• What you built and the problem it solved
• Tools used and measurable result if available

EXPERIENCE
Role Title | Organization
Month Year – Month Year

• Part-time, co-op, volunteer, or leadership experience
• Focus on transferable skills and outcomes

SKILLS
Technical skills · Design tools · Languages`,
  },
  {
    id: "tech-product",
    label: "Tech / Product",
    description: "Highlights projects, tools, and product impact metrics.",
    suggestedTemplateId: "specialist",
    content: `YOUR FULL NAME
City, ST | phone | email@example.com | portfolio.com

SUMMARY
Product-minded [role] with experience shipping [domain] features and improving key metrics.

EXPERIENCE
Product Designer | Company
Month Year – Present

• Shipped [feature] used by [N] users; improved [metric] by [%]
• Partnered with engineering on roadmap prioritization and specs
• Ran user research (interviews, usability tests) to validate decisions

PROJECTS
Side Project Name
Month Year – Present

• Built with React, Figma, [stack]; describe user problem and outcome

SKILLS
Figma · User research · Prototyping · SQL · Agile`,
  },
  {
    id: "harvard-formal",
    label: "Harvard-style Formal",
    description: "Conservative structure for finance, consulting, and law recruiting.",
    suggestedTemplateId: "traditional",
    content: `YOUR FULL NAME
City, ST · phone · email@example.com

EDUCATION
University Name, City, ST
Degree, Major | Month Year

EXPERIENCE
Organization Name, City, ST
Position Title | Month Year – Month Year

• Quantified achievement in a formal, concise bullet
• Leadership or analytical responsibility with outcome

LEADERSHIP & ACTIVITIES
Organization | Role | Month Year – Month Year

• Brief description of contribution and impact

SKILLS & INTERESTS
Languages: English (native), [other]
Skills: Excel, PowerPoint, [relevant tools]`,
  },
];

export const COVER_LETTER_STARTER_TEMPLATES: CoverLetterStarterTemplate[] = [
  {
    id: "standard-business",
    label: "Standard Business",
    description: "Traditional three-paragraph format for most applications.",
    suggestedLayoutId: "standard-business",
    content: `[Date]

[Hiring Manager Name]
[Company Name]
[Company Address]

Dear [Hiring Manager Name / Hiring Team],

I am writing to apply for the [Role Title] position at [Company Name]. With [X years] of experience in [field], I am confident I can contribute to [specific team goal or product area mentioned in the job posting].

In my current role at [Company], I [key achievement with metric]. I also [second relevant accomplishment that maps to a requirement in the job description]. These experiences align closely with your need for [skill or responsibility from the posting].

I would welcome the opportunity to discuss how my background in [area] can support [Company Name]'s goals. Thank you for your time and consideration.

Sincerely,
[Your Name]`,
  },
  {
    id: "modern-tech",
    label: "Modern Tech",
    description: "Direct, concise tone suited for product and engineering roles.",
    suggestedLayoutId: "modern-minimal",
    content: `Dear [Hiring Manager / Team],

I'm applying for the [Role Title] role at [Company Name]. I've spent the last [X years] building [type of work], and the focus on [specific product or mission from JD] is exactly where I do my best work.

At [Current Company], I [achievement with metric]. Before that, I [relevant project or role]. I'm comfortable with [tools/skills from posting] and enjoy collaborating across design, engineering, and stakeholders.

I'd love to talk about how I can help [Company Name] [specific goal from posting]. Thanks for reading.

Best,
[Your Name]`,
  },
  {
    id: "academic-formal",
    label: "Academic / Research",
    description: "Formal structure for research, academia, and policy roles.",
    suggestedLayoutId: "academic",
    content: `[Date]

Dear Members of the Search Committee,

I am pleased to submit my application for the [Position Title] at [Institution / Organization]. My research and professional experience in [field] have prepared me to contribute to [department, lab, or program focus].

My work on [project or thesis topic] examined [brief description]. This resulted in [outcome: publication, presentation, policy impact, etc.]. I have also [teaching, mentoring, or collaborative experience relevant to the role].

I am enthusiastic about the opportunity to join [Institution] and would be glad to provide additional materials or discuss my application at your convenience.

Respectfully,
[Your Name]
[Degree / Affiliation]`,
  },
];

export function getResumeStarter(id: string): ResumeStarterTemplate | undefined {
  return RESUME_STARTER_TEMPLATES.find((t) => t.id === id);
}

export function getCoverLetterStarter(id: string): CoverLetterStarterTemplate | undefined {
  return COVER_LETTER_STARTER_TEMPLATES.find((t) => t.id === id);
}
