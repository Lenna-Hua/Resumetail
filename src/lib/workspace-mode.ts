export const WORKSPACE_MODES = ["edit", "customize", "tailor", "checks", "review"] as const;

export type WorkspaceMode = (typeof WORKSPACE_MODES)[number];

export function isWorkspaceMode(value: string | null): value is WorkspaceMode {
  return WORKSPACE_MODES.includes(value as WorkspaceMode);
}

/** @deprecated Use isWorkspaceMode — maps legacy `more` to customize */
export function normalizeWorkspaceMode(value: string | null): WorkspaceMode {
  if (value === "more") return "customize";
  return parseWorkspaceMode(value);
}

export function parseWorkspaceMode(
  value: string | null,
  fallback: WorkspaceMode = "edit",
): WorkspaceMode {
  if (value === "more") return "customize";
  return isWorkspaceMode(value) ? value : fallback;
}

export const WORKSPACE_MODE_LABELS: Record<WorkspaceMode, string> = {
  edit: "Edit",
  customize: "Customize",
  tailor: "Tailor",
  checks: "Checks",
  review: "Review",
};

/** Modes grouped under the mobile Customize bottom-nav tab */
export const MOBILE_CUSTOMIZE_MODES: WorkspaceMode[] = ["customize", "review"];
