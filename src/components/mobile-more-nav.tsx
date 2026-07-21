"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MoreSection = "style" | "library" | "review" | "letter";

export const MORE_SECTION_LABELS: Record<MoreSection, string> = {
  style: "Style",
  library: "Library",
  review: "Review",
  letter: "Letter",
};

interface MobileMoreNavProps {
  active: MoreSection;
  onChange: (section: MoreSection) => void;
  reviewCount?: number;
}

export function MobileMoreNav({ active, onChange, reviewCount = 0 }: MobileMoreNavProps) {
  const sections: MoreSection[] = ["style", "library", "review", "letter"];

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {sections.map((section) => (
        <Button
          key={section}
          type="button"
          size="sm"
          variant={active === section ? "default" : "outline"}
          className={cn("min-h-9 shrink-0 rounded-full px-3 text-xs")}
          onClick={() => onChange(section)}
        >
          {MORE_SECTION_LABELS[section]}
          {section === "review" && reviewCount > 0 && (
            <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 text-[10px] tabular-nums">
              {reviewCount}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
