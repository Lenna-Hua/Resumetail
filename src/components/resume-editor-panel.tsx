"use client";

import { useState } from "react";
import type { ResumeSection } from "@/lib/types";
import {
  LIBRARY_DRAG_MIME,
  parseLibraryDragPayload,
  type LibraryDragPayload,
} from "@/lib/library-drag";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResumeFileUpload } from "@/components/resume-file-upload";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";

interface ResumeEditorPanelProps {
  sections: ResumeSection[];
  rawText: string;
  onRawTextChange: (text: string) => void;
  onSectionItemChange: (sectionId: string, itemId: string, content: string) => void;
  onSectionItemReorder: (
    sectionId: string,
    itemId: string,
    direction: "up" | "down",
  ) => void;
  onSectionItemDrop: (sectionId: string, fromIndex: number, toIndex: number) => void;
  onFileExtracted: (text: string) => void;
  onLibraryBlockDrop?: (sectionId: string, index: number, payload: LibraryDragPayload) => void;
}

export function ResumeEditorPanel({
  sections,
  rawText,
  onRawTextChange,
  onSectionItemChange,
  onSectionItemReorder,
  onSectionItemDrop,
  onFileExtracted,
  onLibraryBlockDrop,
}: ResumeEditorPanelProps) {
  const [dragItem, setDragItem] = useState<{ sectionId: string; index: number } | null>(null);
  const [libraryDragOver, setLibraryDragOver] = useState<string | null>(null);
  const hasStructure = sections.length > 0 && sections.some((s) => s.items.length > 0);

  const handleDragStart = (sectionId: string, index: number) => {
    setDragItem({ sectionId, index });
  };

  const handleDrop = (sectionId: string, toIndex: number) => {
    if (!dragItem || dragItem.sectionId !== sectionId) {
      setDragItem(null);
      return;
    }
    if (dragItem.index !== toIndex) {
      onSectionItemDrop(sectionId, dragItem.index, toIndex);
    }
    setDragItem(null);
  };

  const handleLibraryDragOver = (e: React.DragEvent, sectionId: string) => {
    if (!onLibraryBlockDrop) return;
    if (!e.dataTransfer.types.includes(LIBRARY_DRAG_MIME)) return;
    e.preventDefault();
    setLibraryDragOver(sectionId);
  };

  const handleLibraryDrop = (e: React.DragEvent, sectionId: string, index: number) => {
    if (!onLibraryBlockDrop) return;
    e.preventDefault();
    setLibraryDragOver(null);
    const payload = parseLibraryDragPayload(e.dataTransfer.getData(LIBRARY_DRAG_MIME));
    if (payload) onLibraryBlockDrop(sectionId, index, payload);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Resume</CardTitle>
        <CardDescription>
          <span className="lg:hidden">
            Import or edit your resume. Use the arrow buttons to reorder bullets
            {onLibraryBlockDrop ? " or add library blocks from a section." : "."}
          </span>
          <span className="hidden lg:inline">
            Import or edit your resume. Drag bullets to reorder
            {onLibraryBlockDrop ? " — drag library blocks onto a section to insert." : "."}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResumeFileUpload onExtracted={onFileExtracted} />

        {hasStructure ? (
          <div className="space-y-4 lg:max-h-[60vh] lg:overflow-y-auto lg:pr-1">
            {sections.map((section) => (
              <div key={section.id} className="space-y-2">
                <div
                  className={`flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors ${
                    libraryDragOver === section.id ? "bg-primary/10 ring-1 ring-primary/30" : ""
                  }`}
                  onDragOver={(e) => handleLibraryDragOver(e, section.id)}
                  onDragLeave={() => setLibraryDragOver(null)}
                  onDrop={(e) => handleLibraryDrop(e, section.id, section.items.length)}
                >
                  <Badge variant="secondary">{section.name}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {section.items.length} items
                    {onLibraryBlockDrop && " · drop here"}
                  </span>
                </div>
                {section.items.map((item, index) => (
                  <div
                    key={item.id}
                    draggable={item.type === "bullet"}
                    onDragStart={() => handleDragStart(section.id, index)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.types.includes(LIBRARY_DRAG_MIME)) {
                        setLibraryDragOver(section.id);
                      }
                    }}
                    onDrop={(e) => {
                      if (e.dataTransfer.types.includes(LIBRARY_DRAG_MIME)) {
                        handleLibraryDrop(e, section.id, index);
                      } else {
                        handleDrop(section.id, index);
                      }
                    }}
                    className={`space-y-1 rounded-md border border-transparent p-1 ${
                      dragItem?.sectionId === section.id && dragItem.index === index
                        ? "border-primary/40 bg-primary/5"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {item.type === "bullet" && (
                          <GripVertical
                            className="hidden size-3.5 cursor-grab text-muted-foreground lg:block"
                            aria-hidden
                          />
                        )}
                        {item.type === "bullet" && (
                          <Label className="text-xs text-muted-foreground">Bullet</Label>
                        )}
                      </div>
                      {item.type === "bullet" && (
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-9 sm:size-7"
                            disabled={index === 0}
                            onClick={() =>
                              onSectionItemReorder(section.id, item.id, "up")
                            }
                            aria-label="Move bullet up"
                          >
                            <ArrowUp className="size-4 sm:size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-9 sm:size-7"
                            disabled={index === section.items.length - 1}
                            onClick={() =>
                              onSectionItemReorder(section.id, item.id, "down")
                            }
                            aria-label="Move bullet down"
                          >
                            <ArrowDown className="size-4 sm:size-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Textarea
                      rows={item.type === "bullet" ? 2 : 3}
                      value={item.content}
                      onChange={(e) =>
                        onSectionItemChange(section.id, item.id, e.target.value)
                      }
                      className="text-base md:text-sm"
                    />
                    {item.content !== item.original && (
                      <div className="rounded-md bg-amber-500/10 px-2 py-1 text-xs text-amber-700 dark:text-amber-400">
                        <span className="font-medium">Changed: </span>
                        <span className="line-through opacity-70">{item.original}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="resume-raw">Resume text</Label>
            <Textarea
              id="resume-raw"
              rows={16}
              value={rawText}
              onChange={(e) => onRawTextChange(e.target.value)}
              placeholder="Paste or upload your resume. Use section headings like EXPERIENCE, SKILLS..."
              className="font-mono text-base md:text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
