import type { AtsSiteOverview } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

function passBadgeClass(passed: boolean) {
  return passed
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    : "bg-red-500/15 text-red-700 dark:text-red-400";
}

interface AtsSiteOverviewBlockProps {
  overview: AtsSiteOverview;
}

export function AtsSiteOverviewBlock({ overview }: AtsSiteOverviewBlockProps) {
  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Employer ATS view</span>
        <Badge className={passBadgeClass(overview.passed)}>
          {overview.passed ? "Passed" : "Needs work"}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{overview.verdict}</p>
      <p className="text-xs text-muted-foreground">
        Plain text a company career portal may extract from your upload:
      </p>
      <pre className="max-h-40 overflow-auto rounded-md border bg-muted/40 p-2 font-mono text-xs whitespace-pre-wrap break-words">
        {overview.plainText}
      </pre>
    </div>
  );
}
