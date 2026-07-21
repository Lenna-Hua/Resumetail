"use client";

import { useState } from "react";
import type { AtsSiteOverview, MatchScore, ScoreStatus } from "@/lib/types";
import type { SkillMapping } from "@/lib/skill-mapping";
import type { TrimSuggestion } from "@/lib/page-estimate";
import { ATS_DISCLAIMER, ATS_FAQ, DIMENSION_HELP } from "@/lib/ats-education";
import { AtsSiteOverviewBlock } from "@/components/ats-site-overview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

function statusColor(status: ScoreStatus) {
  if (status === "good") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (status === "warning") return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-red-500/15 text-red-700 dark:text-red-400";
}

interface ChecksPanelProps {
  matchScore: MatchScore | null;
  atsOverview?: AtsSiteOverview | null;
  trimSuggestions?: TrimSuggestion[];
  skillMappings?: SkillMapping[];
  onFocusBullet?: (bulletId: string) => void;
  onGoReview?: () => void;
}

export function ChecksPanel({
  matchScore,
  atsOverview,
  trimSuggestions = [],
  skillMappings = [],
  onFocusBullet,
  onGoReview,
}: ChecksPanelProps) {
  const [faqOpen, setFaqOpen] = useState(false);

  if (!matchScore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checks & score</CardTitle>
          <CardDescription>
            Add a resume and job description to run explainable checks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{ATS_DISCLAIMER}</p>
        </CardContent>
      </Card>
    );
  }

  const closeOrGap = skillMappings.filter((m) => m.status !== "matched").slice(0, 6);
  const lengthNotes = trimSuggestions.filter((t) => t.id !== "length-ok" || trimSuggestions.length === 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Match score</CardTitle>
        <CardDescription>{ATS_DISCLAIMER}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold">{matchScore.overall}</span>
            <span className="text-sm text-muted-foreground">/ 100 overall</span>
          </div>
          <Progress value={matchScore.overall} className="h-2" />
        </div>

        <Separator />

        {atsOverview && <AtsSiteOverviewBlock overview={atsOverview} />}

        {lengthNotes.length > 0 && (
          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-medium">Length</p>
            <ul className="list-inside list-disc text-xs text-muted-foreground">
              {lengthNotes.map((s) => (
                <li key={s.id}>{s.message}</li>
              ))}
            </ul>
          </div>
        )}

        {closeOrGap.length > 0 && (
          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-medium">Skill mapping</p>
            <div className="flex flex-col gap-1.5">
              {closeOrGap.map((m) => (
                <div key={m.skill.phrase} className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant={m.status === "close" ? "secondary" : "outline"}>
                    {m.status}
                  </Badge>
                  <span>{m.suggestedPhrase}</span>
                  {m.bulletIds[0] && onFocusBullet && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => {
                        onFocusBullet(m.bulletIds[0]);
                        onGoReview?.();
                      }}
                    >
                      Review bullet
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {matchScore.dimensions.map((dim) => (
            <div key={dim.id} className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className="min-w-0 text-sm font-medium">
                  {dim.label}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({dim.weight}%)
                  </span>
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm tabular-nums">{dim.score}</span>
                  <Badge className={statusColor(dim.status)}>{dim.status}</Badge>
                </div>
              </div>
              {DIMENSION_HELP[dim.id] && (
                <p className="flex gap-1.5 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3 shrink-0" aria-hidden />
                  {DIMENSION_HELP[dim.id]}
                </p>
              )}
              <Progress value={dim.score} className="h-1" />
              <ul className="list-inside list-disc text-xs text-muted-foreground">
                {dim.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-full justify-between px-2"
            onClick={() => setFaqOpen((o) => !o)}
          >
            ATS FAQ
            {faqOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
          {faqOpen && (
            <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
              {ATS_FAQ.map((item) => (
                <li key={item.q}>
                  <p className="font-medium text-foreground">{item.q}</p>
                  <p>{item.a}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
