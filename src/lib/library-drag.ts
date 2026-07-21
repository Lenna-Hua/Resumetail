import type { ContentBlockType } from "@/lib/types";

export const LIBRARY_DRAG_MIME = "application/x-resutail-content-block";

export interface LibraryDragPayload {
  content: string;
  sectionName: string;
  type: ContentBlockType;
}

export function serializeLibraryDragPayload(payload: LibraryDragPayload): string {
  return JSON.stringify(payload);
}

export function parseLibraryDragPayload(data: string): LibraryDragPayload | null {
  try {
    const parsed = JSON.parse(data) as LibraryDragPayload;
    if (!parsed.content?.trim() || !parsed.sectionName?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}
