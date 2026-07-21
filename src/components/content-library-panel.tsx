"use client";

import { useMemo, useState } from "react";
import type {
  ContentBlock,
  ContentBlockType,
  ContentFunction,
  ContentSeniority,
  ParsedJD,
} from "@/lib/types";
import {
  CONTENT_BLOCK_TYPE_LABELS,
  CONTENT_FUNCTION_LABELS,
  CONTENT_FUNCTIONS,
  CONTENT_SENIORITIES,
  CONTENT_SENIORITY_LABELS,
  deleteContentBlock,
  filterContentBlocks,
  importSectionsToLibrary,
  loadContentBlocks,
  recommendBlocksForJd,
  toggleBlockStarred,
  updateContentBlock,
} from "@/lib/content-library";
import {
  LIBRARY_DRAG_MIME,
  serializeLibraryDragPayload,
} from "@/lib/library-drag";
import type { ResumeSection } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Library, Pencil, Plus, Search, Star, Trash2, X, CheckSquare } from "lucide-react";
import { MasterProfilePanel } from "@/components/master-profile-panel";

interface ContentLibraryPanelProps {
  sections: ResumeSection[];
  parsedJD: ParsedJD | null;
  activeVersionId: string | null;
  resumeText?: string;
  onAddToResume: (block: ContentBlock) => void;
  onAddBlocksToResume?: (blocks: ContentBlock[]) => void;
  onApplyProfileToResume?: (text: string) => void;
  onLibraryChange?: () => void;
  enableDrag?: boolean;
}

export function ContentLibraryPanel({
  sections,
  parsedJD,
  activeVersionId,
  resumeText,
  onAddToResume,
  onAddBlocksToResume,
  onApplyProfileToResume,
  onLibraryChange,
  enableDrag = false,
}: ContentLibraryPanelProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => loadContentBlocks());
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContentBlockType | "all">("all");
  const [functionFilter, setFunctionFilter] = useState<ContentFunction | "all">("all");
  const [seniorityFilter, setSeniorityFilter] = useState<ContentSeniority | "all">("all");
  const [starredOnly, setStarredOnly] = useState(false);
  const [showSuggested, setShowSuggested] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const refresh = () => {
    setBlocks(loadContentBlocks());
    onLibraryChange?.();
  };

  const filtered = useMemo(
    () =>
      filterContentBlocks(blocks, {
        query,
        type: typeFilter,
        function: functionFilter,
        seniority: seniorityFilter,
        starredOnly,
      }),
    [blocks, query, typeFilter, functionFilter, seniorityFilter, starredOnly],
  );

  const suggested = useMemo(
    () => recommendBlocksForJd(blocks, parsedJD),
    [blocks, parsedJD],
  );

  const handleImport = () => {
    if (sections.length === 0) return;
    importSectionsToLibrary(sections, activeVersionId);
    refresh();
  };

  const handleToggleStar = (id: string) => {
    toggleBlockStarred(id);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteContentBlock(id);
    if (editingId === id) setEditingId(null);
    refresh();
  };

  const handleSaveMetadata = (
    id: string,
    updates: {
      function: ContentFunction;
      seniority: ContentSeniority;
      domain: string;
      tags: string[];
    },
  ) => {
    updateContentBlock(id, updates);
    setEditingId(null);
    refresh();
  };

  const displayBlocks = showSuggested && parsedJD ? suggested : filtered;

  const selectedBlocks = useMemo(
    () => blocks.filter((block) => selectedIds.has(block.id)),
    [blocks, selectedIds],
  );

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSelected = () => {
    if (selectedBlocks.length === 0) return;
    if (onAddBlocksToResume) {
      onAddBlocksToResume(selectedBlocks);
    } else {
      for (const block of selectedBlocks) onAddToResume(block);
    }
    setSelectedIds(new Set());
    setMultiSelect(false);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Library className="size-4" />
          Content library
        </CardTitle>
        <CardDescription>
          Reusable bullets, summaries, and skills. Save once, pull into any tailored version.
          {enableDrag && " Drag blocks onto resume sections on desktop."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <MasterProfilePanel
          resumeText={resumeText}
          onApplyToResume={onApplyProfileToResume}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleImport}
            disabled={sections.length === 0}
          >
            <Plus className="size-3.5" />
            Import from resume
          </Button>
          {parsedJD && (
            <Button
              size="sm"
              variant={showSuggested ? "default" : "outline"}
              onClick={() => setShowSuggested((v) => !v)}
            >
              Suggested for job
            </Button>
          )}
          {onAddBlocksToResume && blocks.length > 0 && (
            <Button
              size="sm"
              variant={multiSelect ? "default" : "outline"}
              onClick={() => {
                setMultiSelect((value) => !value);
                setSelectedIds(new Set());
              }}
            >
              <CheckSquare className="size-3.5" />
              {multiSelect ? "Cancel select" : "Select multiple"}
            </Button>
          )}
        </div>

        {multiSelect && selectedBlocks.length > 0 && (
          <Button size="sm" className="w-full" onClick={handleAddSelected}>
            <Plus className="size-3.5" />
            Add {selectedBlocks.length} selected to resume
          </Button>
        )}

        <div className="space-y-2">
          <Label htmlFor="library-search" className="text-xs">
            Search blocks
          </Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 size-3.5 text-muted-foreground" />
            <input
              id="library-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by keyword, tag, section..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 sm:flex sm:flex-wrap sm:gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ContentBlockType | "all")}
            className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs min-[480px]:w-auto sm:w-auto"
            aria-label="Filter by block type"
          >
            <option value="all">All types</option>
            {(Object.keys(CONTENT_BLOCK_TYPE_LABELS) as ContentBlockType[]).map((t) => (
              <option key={t} value={t}>
                {CONTENT_BLOCK_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <select
            value={functionFilter}
            onChange={(e) => setFunctionFilter(e.target.value as ContentFunction | "all")}
            className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs min-[480px]:w-auto sm:w-auto"
            aria-label="Filter by function"
          >
            <option value="all">All functions</option>
            {CONTENT_FUNCTIONS.map((fn) => (
              <option key={fn} value={fn}>
                {CONTENT_FUNCTION_LABELS[fn]}
              </option>
            ))}
          </select>
          <select
            value={seniorityFilter}
            onChange={(e) => setSeniorityFilter(e.target.value as ContentSeniority | "all")}
            className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs min-[480px]:w-auto sm:w-auto"
            aria-label="Filter by seniority"
          >
            <option value="all">All seniority</option>
            {CONTENT_SENIORITIES.map((level) => (
              <option key={level} value={level}>
                {CONTENT_SENIORITY_LABELS[level]}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant={starredOnly ? "default" : "outline"}
            onClick={() => setStarredOnly((v) => !v)}
          >
            <Star className="size-3.5" />
            Starred
          </Button>
        </div>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {displayBlocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {blocks.length === 0
                ? "Import your resume to build a reusable content library."
                : "No blocks match your filters."}
            </p>
          ) : (
            displayBlocks.map((block) => (
              <BlockCard
                key={block.id}
                block={block}
                isEditing={editingId === block.id}
                enableDrag={enableDrag && !multiSelect}
                multiSelect={multiSelect}
                selected={selectedIds.has(block.id)}
                onToggleSelect={() => toggleSelected(block.id)}
                onAdd={() => onAddToResume(block)}
                onToggleStar={() => handleToggleStar(block.id)}
                onDelete={() => handleDelete(block.id)}
                onEdit={() => setEditingId(block.id)}
                onCancelEdit={() => setEditingId(null)}
                onSave={(updates) => handleSaveMetadata(block.id, updates)}
              />
            ))
          )}
        </div>

        {blocks.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {blocks.length} saved block{blocks.length === 1 ? "" : "s"} ·{" "}
            {suggested.length} suggested for this job
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function BlockCard({
  block,
  isEditing,
  enableDrag,
  multiSelect,
  selected,
  onToggleSelect,
  onAdd,
  onToggleStar,
  onDelete,
  onEdit,
  onCancelEdit,
  onSave,
}: {
  block: ContentBlock;
  isEditing: boolean;
  enableDrag: boolean;
  multiSelect: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onAdd: () => void;
  onToggleStar: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updates: {
    function: ContentFunction;
    seniority: ContentSeniority;
    domain: string;
    tags: string[];
  }) => void;
}) {
  const [fn, setFn] = useState<ContentFunction>(block.function);
  const [seniority, setSeniority] = useState<ContentSeniority>(block.seniority);
  const [domain, setDomain] = useState(block.domain);
  const [tagsText, setTagsText] = useState(block.tags.join(", "));

  const resetDraft = () => {
    setFn(block.function);
    setSeniority(block.seniority);
    setDomain(block.domain);
    setTagsText(block.tags.join(", "));
  };

  const handleStartEdit = () => {
    resetDraft();
    onEdit();
  };

  const handleCancel = () => {
    resetDraft();
    onCancelEdit();
  };

  const handleSave = () => {
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSave({ function: fn, seniority, domain: domain.trim(), tags });
  };

  return (
    <div
      className={`rounded-lg border p-2.5 space-y-2 ${
        selected ? "border-primary bg-primary/5" : ""
      } ${enableDrag && !isEditing ? "cursor-grab active:cursor-grabbing" : ""}`}
      draggable={enableDrag && !isEditing}
      onDragStart={(e) => {
        if (!enableDrag || isEditing) return;
        e.dataTransfer.setData(
          LIBRARY_DRAG_MIME,
          serializeLibraryDragPayload({
            content: block.content,
            sectionName: block.sectionName,
            type: block.type,
          }),
        );
        e.dataTransfer.effectAllowed = "copy";
      }}
    >
      {multiSelect && !isEditing && (
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="size-4 accent-primary"
          />
          Select for batch insert
        </label>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="text-[10px]">
          {CONTENT_BLOCK_TYPE_LABELS[block.type]}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {block.sectionName}
        </Badge>
        {!isEditing && (
          <>
            <Badge variant="outline" className="text-[10px]">
              {CONTENT_FUNCTION_LABELS[block.function]}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {CONTENT_SENIORITY_LABELS[block.seniority]}
            </Badge>
            {block.domain && (
              <Badge variant="outline" className="text-[10px]">
                {block.domain}
              </Badge>
            )}
          </>
        )}
        {block.starred && (
          <Badge className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400">
            Starred
          </Badge>
        )}
      </div>
      <Textarea
        readOnly
        rows={2}
        value={block.content}
        className="resize-none text-xs bg-muted/30"
      />

      {isEditing ? (
        <div className="space-y-2 rounded-md border border-dashed p-2">
          <p className="text-xs font-medium text-muted-foreground">Block metadata</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`fn-${block.id}`} className="text-[10px]">
                Function
              </Label>
              <select
                id={`fn-${block.id}`}
                value={fn}
                onChange={(e) => setFn(e.target.value as ContentFunction)}
                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              >
                {CONTENT_FUNCTIONS.map((value) => (
                  <option key={value} value={value}>
                    {CONTENT_FUNCTION_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`seniority-${block.id}`} className="text-[10px]">
                Seniority
              </Label>
              <select
                id={`seniority-${block.id}`}
                value={seniority}
                onChange={(e) => setSeniority(e.target.value as ContentSeniority)}
                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
              >
                {CONTENT_SENIORITIES.map((value) => (
                  <option key={value} value={value}>
                    {CONTENT_SENIORITY_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`domain-${block.id}`} className="text-[10px]">
              Domain
            </Label>
            <input
              id={`domain-${block.id}`}
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. fintech, healthcare, SaaS"
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`tags-${block.id}`} className="text-[10px]">
              Tags (comma-separated)
            </Label>
            <input
              id={`tags-${block.id}`}
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="ux, figma, research"
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            <Button size="sm" onClick={handleSave}>
              Save metadata
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="size-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        block.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {block.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )
      )}

      <div className="flex flex-wrap gap-1">
        {!multiSelect && (
          <Button size="sm" onClick={onAdd} disabled={isEditing}>
            <Plus className="size-3.5" />
            Add to resume
          </Button>
        )}
        {!isEditing && (
          <Button size="sm" variant="outline" onClick={handleStartEdit} aria-label="Edit metadata">
            <Pencil className="size-3.5" />
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={onToggleStar}
          disabled={isEditing}
          aria-label="Toggle star"
        >
          <Star className={`size-3.5 ${block.starred ? "fill-amber-400 text-amber-500" : ""}`} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          disabled={isEditing}
          aria-label="Delete block"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
