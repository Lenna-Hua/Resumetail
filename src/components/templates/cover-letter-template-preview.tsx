import type { CoverLetterTemplate } from "@/lib/types";

interface CoverLetterTemplatePreviewProps {
  template: CoverLetterTemplate;
  className?: string;
}

export function CoverLetterTemplatePreview({
  template,
  className = "",
}: CoverLetterTemplatePreviewProps) {
  const fontSize = template.fontSize * 0.32;
  const gap = template.paragraphSpacing * 0.4;

  return (
    <div
      className={`aspect-[8.5/11] overflow-hidden rounded-md border bg-white p-3 shadow-sm ${className}`}
      aria-hidden
    >
      <div
        className="text-muted-foreground"
        style={{ fontSize: `${fontSize * 0.9}rem`, textAlign: template.alignment }}
      >
        March 15, 2026
      </div>
      <div
        className="text-muted-foreground"
        style={{
          fontSize: `${fontSize * 0.9}rem`,
          marginTop: `${gap}px`,
          textAlign: template.alignment,
        }}
      >
        Hiring Manager
        <br />
        Acme Corporation
      </div>

      <div
        className="text-foreground"
        style={{
          fontSize: `${fontSize}rem`,
          lineHeight: template.lineSpacing,
          marginTop: `${gap * 1.5}px`,
          textAlign: template.alignment,
        }}
      >
        Dear Hiring Manager,
      </div>
      <div
        className="text-muted-foreground"
        style={{
          fontSize: `${fontSize}rem`,
          lineHeight: template.lineSpacing,
          marginTop: `${gap}px`,
          textAlign: template.alignment,
        }}
      >
        I am writing to express my interest in the Product Designer role. My experience
        leading user research and shipping cross-platform features aligns well with your team.
      </div>
      <div
        className="text-muted-foreground"
        style={{
          fontSize: `${fontSize}rem`,
          lineHeight: template.lineSpacing,
          marginTop: `${gap}px`,
          textAlign: template.alignment,
        }}
      >
        I would welcome the opportunity to discuss how I can contribute to Acme&apos;s product
        goals.
      </div>
      <div
        className="text-foreground"
        style={{
          fontSize: `${fontSize}rem`,
          lineHeight: template.lineSpacing,
          marginTop: `${gap}px`,
          textAlign: template.alignment,
        }}
      >
        Sincerely,
        <br />
        Alex Morgan
      </div>
    </div>
  );
}
