"use client";

import { useState } from "react";
import { diffLines, hasDiff } from "@/lib/text-diff";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";

interface BaseDiffPanelProps {
  baseText: string;
  currentText: string;
  versionName?: string;
}

export function BaseDiffPanel({ baseText, currentText, versionName }: BaseDiffPanelProps) {
  const [open, setOpen] = useState(false);

  if (!baseText.trim() || !hasDiff(baseText, currentText)) {
    return null;
  }

  const changes = diffLines(baseText, currentText);
  const added = changes.filter((c) => c.type === "added").length;
  const removed = changes.filter((c) => c.type === "removed").length;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Changes from base</CardTitle>
            <CardDescription>
              {versionName ? `${versionName} — ` : ""}
              comparing your current edits to the imported original.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            {open ? "Hide" : "Show"} diff
          </Button>
        </div>
        <div className="flex gap-2 pt-1">
          {removed > 0 && (
            <Badge variant="outline" className="text-red-700 dark:text-red-400">
              {removed} removed
            </Badge>
          )}
          {added > 0 && (
            <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400">
              {added} added
            </Badge>
          )}
        </div>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Base (imported)</p>
              <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-2 font-mono text-xs whitespace-pre-wrap">
                {baseText}
              </pre>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Current (tailored)</p>
              <pre className="max-h-48 overflow-auto rounded-md border border-primary/20 bg-primary/5 p-2 font-mono text-xs whitespace-pre-wrap">
                {currentText}
              </pre>
            </div>
          </div>
          {changes.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Line changes</p>
              <ul className="max-h-32 space-y-1 overflow-auto text-xs">
                {changes.map((line, i) => (
                  <li
                    key={`${line.type}-${i}`}
                    className={
                      line.type === "added"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-red-700 dark:text-red-400 line-through"
                    }
                  >
                    {line.type === "added" ? "+ " : "− "}
                    {line.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
