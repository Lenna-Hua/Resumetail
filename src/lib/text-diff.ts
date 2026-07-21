export interface DiffLine {
  type: "same" | "added" | "removed";
  text: string;
}

/** Simple line-by-line diff for base vs current resume text. */
export function diffLines(base: string, current: string): DiffLine[] {
  const baseLines = base.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const currentLines = current.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const baseSet = new Set(baseLines);
  const currentSet = new Set(currentLines);
  const result: DiffLine[] = [];

  for (const line of baseLines) {
    if (!currentSet.has(line)) {
      result.push({ type: "removed", text: line });
    }
  }
  for (const line of currentLines) {
    if (!baseSet.has(line)) {
      result.push({ type: "added", text: line });
    }
  }

  return result;
}

export function countDiffChanges(base: string, current: string): number {
  return diffLines(base, current).length;
}

export function hasDiff(base: string, current: string): boolean {
  return base.trim() !== current.trim();
}
