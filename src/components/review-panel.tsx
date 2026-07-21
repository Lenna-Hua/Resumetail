"use client";

import type { ResumeBullet } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, RotateCcw, Sparkles, X } from "lucide-react";

interface ReviewPanelProps {
  bullets: ResumeBullet[];
  hasJd: boolean;
  tailoringId: string | null;
  focusBulletId?: string | null;
  onTailor: (id: string) => void;
  onAccept: (id: string, editedText?: string) => void;
  onReject: (id: string) => void;
  onRestore: (id: string) => void;
  onEditSuggestion?: (id: string, text: string) => void;
}

export function ReviewPanel({
  bullets,
  hasJd,
  tailoringId,
  focusBulletId,
  onTailor,
  onAccept,
  onReject,
  onRestore,
  onEditSuggestion,
}: ReviewPanelProps) {
  const suggested = bullets.filter((b) => b.suggestion);
  const pending = bullets.filter((b) => !b.suggestion && b.status !== "accepted");

  if (!hasJd) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI review</CardTitle>
          <CardDescription>
            Add and analyze a job description in Tailor mode first — suggestions are tailored to
            each role.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (bullets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI review</CardTitle>
          <CardDescription>
            No bullets found in your resume. Add experience bullets in Edit mode.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Suggestion queue</CardTitle>
          <CardDescription>
            Per-bullet rewrites — review and edit each change before accepting. Nothing is applied
            automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          <Badge variant="secondary">{suggested.length} pending review</Badge>
          <Badge variant="outline">{pending.length} not yet requested</Badge>
        </CardContent>
      </Card>

      {suggested.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ready to review
          </p>
          {suggested.map((bullet) => (
            <BulletSuggestionRow
              key={bullet.id}
              bullet={bullet}
              tailoringId={tailoringId}
              highlighted={focusBulletId === bullet.id}
              onTailor={() => onTailor(bullet.id)}
              onAccept={(text) => onAccept(bullet.id, text)}
              onReject={() => onReject(bullet.id)}
              onRestore={() => onRestore(bullet.id)}
              onEditSuggestion={
                onEditSuggestion
                  ? (text) => onEditSuggestion(bullet.id, text)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Request rewrites
          </p>
          {pending.map((bullet) => (
            <BulletSuggestionRow
              key={bullet.id}
              bullet={bullet}
              tailoringId={tailoringId}
              highlighted={focusBulletId === bullet.id}
              onTailor={() => onTailor(bullet.id)}
              onAccept={(text) => onAccept(bullet.id, text)}
              onReject={() => onReject(bullet.id)}
              onRestore={() => onRestore(bullet.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BulletSuggestionRow({
  bullet,
  tailoringId,
  highlighted,
  onTailor,
  onAccept,
  onReject,
  onRestore,
  onEditSuggestion,
}: {
  bullet: ResumeBullet;
  tailoringId: string | null;
  highlighted?: boolean;
  onTailor: () => void;
  onAccept: (editedText?: string) => void;
  onReject: () => void;
  onRestore: () => void;
  onEditSuggestion?: (text: string) => void;
}) {
  const isLoading = tailoringId === bullet.id;
  const draft = bullet.suggestion ?? "";

  return (
    <div
      id={`review-bullet-${bullet.id}`}
      className={`space-y-2 rounded-lg border p-3 ${highlighted ? "ring-2 ring-primary" : ""}`}
    >
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{bullet.section}</Badge>
        <Badge variant="outline" className="capitalize">
          {bullet.status}
        </Badge>
      </div>
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-md bg-muted/40 p-2">
          <p className="mb-1 text-xs text-muted-foreground">Current</p>
          <p>{bullet.currentText}</p>
        </div>
        <div className="rounded-md border border-primary/20 bg-primary/5 p-2">
          <p className="mb-1 text-xs text-muted-foreground">Suggestion</p>
          {bullet.suggestion ? (
            <Textarea
              value={draft}
              onChange={(e) => onEditSuggestion?.(e.target.value)}
              rows={4}
              className="min-h-[80px] resize-y text-sm"
            />
          ) : (
            <p>—</p>
          )}
        </div>
      </div>
      {bullet.alignedJdElements && bullet.alignedJdElements.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {bullet.alignedJdElements.map((kw) => (
            <Badge key={kw} variant="secondary" className="text-[10px]">
              {kw}
            </Badge>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {!bullet.suggestion && (
          <Button
            size="sm"
            className="min-h-11"
            onClick={onTailor}
            disabled={tailoringId !== null}
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Get rewrite
          </Button>
        )}
        {bullet.suggestion && (
          <>
            <Button size="sm" className="min-h-11" onClick={() => onAccept(draft)}>
              <Check className="size-3.5" />
              Accept
            </Button>
            <Button size="sm" variant="outline" className="min-h-11" onClick={onReject}>
              <X className="size-3.5" />
              Dismiss
            </Button>
          </>
        )}
        <Button size="sm" variant="ghost" className="min-h-11" onClick={onRestore}>
          <RotateCcw className="size-3.5" />
          Restore original
        </Button>
      </div>
    </div>
  );
}
