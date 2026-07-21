"use client";

import type { ImportHealthReport } from "@/lib/import-health";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function statusClass(status: "ok" | "warn" | "poor") {
  if (status === "ok") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (status === "warn") return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-red-500/15 text-red-700 dark:text-red-400";
}

interface ImportHealthStripProps {
  report: ImportHealthReport;
  onApplyAtsTemplate?: () => void;
}

export function ImportHealthStrip({ report, onApplyAtsTemplate }: ImportHealthStripProps) {
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Import health check</p>
        <Badge className={statusClass(report.overall)}>{report.overall}</Badge>
      </div>
      <ul className="space-y-1 text-xs text-muted-foreground">
        {report.items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-baseline gap-2">
            <Badge variant="outline" className={`text-[10px] ${statusClass(item.status)}`}>
              {item.label}
            </Badge>
            <span>{item.detail}</span>
          </li>
        ))}
      </ul>
      {report.suggestAtsTemplate && onApplyAtsTemplate && (
        <Button type="button" size="sm" className="min-h-10 w-full sm:w-auto" onClick={onApplyAtsTemplate}>
          Apply ATS template
        </Button>
      )}
    </div>
  );
}
