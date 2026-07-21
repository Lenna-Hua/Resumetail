"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ContentBlock, ContentBlockType } from "@/lib/types";
import {
  buildResumeTextFromBlocks,
  CONTENT_BLOCK_TYPE_LABELS,
  filterContentBlocks,
  loadContentBlocks,
} from "@/lib/content-library";
import { hasMasterProfile, loadMasterProfile } from "@/lib/master-profile";
import type { MasterProfile } from "@/lib/types";
import { MasterProfilePanel } from "@/components/master-profile-panel";
import { createVersion } from "@/lib/resume-versions";
import { loadSession, saveSession } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Library, Search } from "lucide-react";

export function CreateFromLibrary() {
  const router = useRouter();
  const [blocks] = useState<ContentBlock[]>(() => loadContentBlocks());
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContentBlockType | "all">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [versionName, setVersionName] = useState("");
  const [includeProfile, setIncludeProfile] = useState(() =>
    hasMasterProfile(loadMasterProfile()),
  );
  const [profile, setProfile] = useState<MasterProfile>(() => loadMasterProfile());

  const filtered = useMemo(
    () => filterContentBlocks(blocks, { query, type: typeFilter }),
    [blocks, query, typeFilter],
  );

  const selectedBlocks = useMemo(
    () => blocks.filter((block) => selectedIds.has(block.id)),
    [blocks, selectedIds],
  );

  const previewText = useMemo(
    () =>
      buildResumeTextFromBlocks(selectedBlocks, {
        profile: includeProfile ? profile : null,
      }),
    [selectedBlocks, includeProfile, profile],
  );

  const canCreate =
    selectedBlocks.length > 0 || (includeProfile && hasMasterProfile(profile));

  const toggleBlock = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const block of filtered) next.add(block.id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleCreate = () => {
    const resumeText = buildResumeTextFromBlocks(selectedBlocks, {
      profile: includeProfile ? profile : null,
    });
    if (!resumeText.trim()) return;

    const name = versionName.trim() || `Library resume ${new Date().toLocaleDateString()}`;
    const version = createVersion(resumeText, name);
    const session = loadSession();
    saveSession({
      ...session,
      resumeText,
      activeVersionId: version.id,
      parsedJD: null,
      coverage: null,
      matchScore: null,
      atsResult: null,
      bullets: [],
    });
    router.push(`/app/v/${version.id}?mode=edit`);
  };

  if (blocks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Library className="size-4" />
            Build from library
          </CardTitle>
          <CardDescription>
            Your content library is empty. Import an existing resume to save reusable blocks, then
            assemble new versions here without uploading again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Open any resume in the workspace, go to the content library, and use{" "}
            <span className="font-medium">Import from resume</span> to populate blocks.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Library className="size-4" />
          Build from library
        </CardTitle>
        <CardDescription>
          Select reusable blocks to assemble a new resume — no file upload required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <MasterProfilePanel onSaved={() => setProfile(loadMasterProfile())} />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeProfile}
            onChange={(e) => setIncludeProfile(e.target.checked)}
            className="size-4 accent-primary"
          />
          Include saved master profile header
        </label>

        <div className="space-y-2">
          <Label htmlFor="library-version-name" className="text-xs">
            Resume name (optional)
          </Label>
          <input
            id="library-version-name"
            type="text"
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            placeholder="e.g. Product design — Acme role"
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 size-3.5 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blocks…"
            className="flex h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ContentBlockType | "all")}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
            aria-label="Filter by block type"
          >
            <option value="all">All types</option>
            {(Object.keys(CONTENT_BLOCK_TYPE_LABELS) as ContentBlockType[]).map((type) => (
              <option key={type} value={type}>
                {CONTENT_BLOCK_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <Button type="button" size="sm" variant="outline" onClick={selectAllFiltered}>
            Select filtered
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={clearSelection}
            disabled={selectedIds.size === 0}
          >
            Clear
          </Button>
        </div>

        <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blocks match your filters.</p>
          ) : (
            filtered.map((block) => {
              const checked = selectedIds.has(block.id);
              return (
                <label
                  key={block.id}
                  className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                    checked ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleBlock(block.id)}
                    className="mt-1 size-4 shrink-0 accent-primary"
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10px]">
                        {CONTENT_BLOCK_TYPE_LABELS[block.type]}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {block.sectionName}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm">{block.content}</p>
                  </div>
                </label>
              );
            })
          )}
        </div>

        {selectedBlocks.length > 0 && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Preview</p>
            <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap font-mono text-xs">
              {previewText}
            </pre>
          </div>
        )}

        <Button
          className="min-h-11 w-full"
          onClick={handleCreate}
          disabled={!canCreate}
        >
          Create resume with {selectedBlocks.length} block
          {selectedBlocks.length === 1 ? "" : "s"}
          {includeProfile && hasMasterProfile(profile) ? " + profile" : ""}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Need to add blocks first?{" "}
          <Link href="/app" className="text-primary underline-offset-4 hover:underline">
            Open a resume
          </Link>{" "}
          and import sections into your library.
        </p>
      </CardContent>
    </Card>
  );
}
