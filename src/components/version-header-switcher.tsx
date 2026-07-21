"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ResumeVersion } from "@/lib/types";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface VersionHeaderSwitcherProps {
  versions: ResumeVersion[];
  activeVersionId: string | null;
  className?: string;
}

export function VersionHeaderSwitcher({
  versions,
  activeVersionId,
  className,
}: VersionHeaderSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const active = versions.find((v) => v.id === activeVersionId) ?? versions[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (!active || versions.length <= 1) {
    return (
      <p className={cn("truncate text-sm font-semibold", className)}>
        {active?.name ?? "Resume"}
      </p>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative min-w-0 flex-1", className)}>
      <button
        type="button"
        className="flex min-h-11 w-full min-w-0 items-center gap-1 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate text-sm font-semibold">{active.name}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 w-full min-w-[12rem] max-w-[min(16rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-lg"
          role="listbox"
        >
          {versions.map((v) => (
            <li key={v.id} role="option" aria-selected={v.id === active.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full flex-col px-3 py-2.5 text-left text-sm hover:bg-muted/60",
                  v.id === active.id && "bg-primary/5",
                )}
                onClick={() => {
                  setOpen(false);
                  router.push(`/app/v/${v.id}?mode=edit`);
                }}
              >
                <span className="truncate font-medium">{v.name}</span>
                {v.tailoredFor && (
                  <span className="truncate text-xs text-muted-foreground">
                    Tailored for {v.tailoredFor}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
