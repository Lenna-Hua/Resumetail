"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { ResumeTemplateId } from "@/lib/resume-template-types";
import type { TemplateSettings } from "@/lib/resume-template-types";
import { getTemplate } from "@/lib/resume-templates";
import { resumeTextToDisplayData } from "@/lib/resume-document";
import { ResumeDocumentView } from "@/components/templates/resume-document-view";
import { DEFAULT_TEMPLATE_SETTINGS } from "@/lib/template-settings";

/** US Letter dimensions at 96dpi — the preview renders true-to-size, then scales down to fit. */
const PAGE_WIDTH_PX = 816;
const PAGE_HEIGHT_PX = 1056;

interface TemplatePreviewProps {
  resumeText: string;
  templateId: ResumeTemplateId;
  settings?: TemplateSettings;
}

export const TemplatePreview = memo(function TemplatePreview({
  resumeText,
  templateId,
  settings = DEFAULT_TEMPLATE_SETTINGS,
}: TemplatePreviewProps) {
  const template = getTemplate(templateId);
  const data = resumeTextToDisplayData(resumeText);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>();
  const [contentHeight, setContentHeight] = useState(PAGE_HEIGHT_PX);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    // #region agent log
    let __dbgRoCount = 0;
    // #endregion
    const update = () => {
      const available = outer.clientWidth;
      const nextScale = Math.min(1, available / PAGE_WIDTH_PX);
      const nextScaledHeight = inner.offsetHeight * nextScale;
      const nextContentHeight = inner.offsetHeight;
      // #region agent log
      __dbgRoCount += 1;
      if (__dbgRoCount <= 30 || __dbgRoCount % 50 === 0) {
        try {
          fetch("http://127.0.0.1:7242/ingest/f6f0b1e2-debug", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "template-preview.tsx:update",
              message: "ResizeObserver update",
              data: {
                count: __dbgRoCount,
                available,
                nextScale,
                nextScaledHeight,
                nextContentHeight,
              },
              timestamp: Date.now(),
              hypothesisId: "A",
            }),
          }).catch(() => {});
          // Also write via sync beacon path for crash-before-network cases
          const line =
            JSON.stringify({
              location: "template-preview.tsx:update",
              message: "ResizeObserver update",
              data: {
                count: __dbgRoCount,
                available,
                nextScale,
                nextScaledHeight,
                nextContentHeight,
              },
              timestamp: Date.now(),
              hypothesisId: "A",
            }) + "\n";
          (
            window as unknown as { __dbgAppend?: (s: string) => void }
          ).__dbgAppend?.(line);
        } catch {
          /* ignore */
        }
      }
      // #endregion
      setScale(nextScale);
      setScaledHeight(nextScaledHeight);
      setContentHeight(nextContentHeight);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [resumeText, templateId, settings]);

  const pageCount = Math.max(1, Math.ceil(contentHeight / PAGE_HEIGHT_PX));
  const pageBreaks = Array.from({ length: pageCount - 1 }, (_, i) => (i + 1) * PAGE_HEIGHT_PX);

  return (
    <div className="w-full max-w-full">
      <div
        ref={outerRef}
        className="w-full max-w-full overflow-hidden rounded-lg border shadow-sm"
      >
        <div style={{ height: scaledHeight }}>
          <div
            ref={innerRef}
            className="relative"
            style={{
              width: PAGE_WIDTH_PX,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <ResumeDocumentView data={data} style={template.style} settings={settings} />
            {pageBreaks.map((top) => (
              <div
                key={top}
                className="pointer-events-none absolute inset-x-0 flex items-center"
                style={{ top }}
              >
                <div className="h-px w-full border-t border-dashed border-neutral-400" />
                <span className="absolute right-1 -translate-y-1/2 rounded bg-neutral-700 px-1.5 py-0.5 text-[9px] font-medium text-white">
                  Page break
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {pageCount > 1 && (
        <p className="mt-2 text-xs text-muted-foreground">
          This resume spans {pageCount} pages when printed on US Letter paper. Trim content or
          shrink margins to fit fewer pages.
        </p>
      )}
    </div>
  );
});
