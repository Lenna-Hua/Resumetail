export function formatSaveLabel(savedAt: Date | null): string | null {
  if (!savedAt) return null;
  const seconds = Math.floor((Date.now() - savedAt.getTime()) / 1000);
  if (seconds < 5) return "Saved";
  if (seconds < 60) return `Saved ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Saved ${minutes}m ago`;
  return `Saved ${Math.floor(minutes / 60)}h ago`;
}
