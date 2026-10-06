"use client";

import type { CoverageSummary, ParsedJD } from "@/lib/types";
import type { SkillMapping } from "@/lib/skill-mapping";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles } from "lucide-react";

interface JdInsightsPanelProps {
  jdText: string;
  onJdTextChange: (text: string) => void;
  parsedJD: ParsedJD | null;
  coverage: CoverageSummary | null;
  skillMappings?: SkillMapping[];
  onAnalyze: () => void;
  analyzing: boolean;
  onAddSkill?: (phrase: string) => void;
  onFocusBullet?: (bulletId: string) => void;
}

export function JdInsightsPanel({
  jdText,
  onJdTextChange,
  parsedJD,
  coverage,
  skillMappings = [],
  onAnalyze,
  analyzing,
  onAddSkill,
  onFocusBullet,
}: JdInsightsPanelProps) {
  const priorityGaps: {
    label: string;
    covered: boolean;
    category: string;
    weight?: number;
  }[] =
    coverage?.missingWeighted ??
    coverage?.missing.map((label) => ({
      label,
      covered: false,
      category: "skill" as const,
      weight: 0.5,
    })) ??
    [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Job description</CardTitle>
        <CardDescription>
          Paste the target posting. Analyze works offline with rules; AI refines when configured.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="jd">Job posting</Label>
          <Textarea
            id="jd"
            rows={10}
            value={jdText}
            onChange={(e) => onJdTextChange(e.target.value)}
            placeholder="Paste the full job description here..."
          />
        </div>

        <Button
          onClick={onAnalyze}
          disabled={analyzing || jdText.trim().length < 50}
          className="w-full"
          variant={parsedJD ? "outline" : "default"}
        >
          {analyzing ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Extracting keywords…
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              {parsedJD ? "Re-analyze JD" : "Analyze job description"}
            </>
          )}
        </Button>

        {parsedJD && coverage && (
          <>
            <Separator />
            <div className="space-y-3 text-sm">
              <p className="font-medium">{parsedJD.roleTitle}</p>
              <p className="text-muted-foreground capitalize">{parsedJD.seniority}</p>

              <div className="grid grid-cols-1 gap-2 text-center min-[400px]:grid-cols-3">
                <div className="rounded-md border p-2">
                  <p className="text-lg font-semibold">
                    {coverage.skillsCovered}/{coverage.skillsTotal}
                  </p>
                  <p className="text-xs text-muted-foreground">Skills</p>
                </div>
                <div className="rounded-md border p-2">
                  <p className="text-lg font-semibold">
                    {coverage.responsibilitiesCovered}/{coverage.responsibilitiesTotal}
                  </p>
                  <p className="text-xs text-muted-foreground">Duties</p>
                </div>
                <div className="rounded-md border p-2">
                  <p className="text-lg font-semibold">
                    {typeof coverage.weightedCoverage === "number"
                      ? Math.round(coverage.weightedCoverage * 100)
                      : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Weighted %</p>
                </div>
              </div>

              {priorityGaps.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium">Missing or weak (by priority)</p>
                  <div className="flex flex-col gap-2">
                    {priorityGaps.slice(0, 8).map((item) => {
                      const mapping = skillMappings.find(
                        (m) =>
                          m.suggestedPhrase === item.label ||
                          m.skill.phrase === item.label.split(" (")[0],
                      );
                      const bestBullet = mapping?.bulletIds[0];
                      return (
                        <div
                          key={item.label}
                          className="flex flex-wrap items-center gap-2 rounded-md border px-2 py-1.5"
                        >
                          <Badge variant="outline" className="text-xs">
                            {item.label}
                          </Badge>
                          {item.weight != null && (
                            <span className="text-[10px] text-muted-foreground">
                              w{Math.round(item.weight * 100)}
                            </span>
                          )}
                          {bestBullet && onFocusBullet && mapping?.status === "close" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => onFocusBullet(bestBullet)}
                            >
                              Fix bullet
                            </Button>
                          )}
                          {onAddSkill && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs"
                              onClick={() => onAddSkill(item.label.split(" (")[0] ?? item.label)}
                            >
                              Add to Skills
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only add skills you truly have — misrepresenting experience can hurt you later.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
