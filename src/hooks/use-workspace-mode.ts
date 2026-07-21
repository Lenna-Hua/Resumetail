"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  parseWorkspaceMode,
  type WorkspaceMode,
} from "@/lib/workspace-mode";

export function useWorkspaceMode(defaultMode: WorkspaceMode = "edit") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = parseWorkspaceMode(searchParams.get("mode"), defaultMode);

  const setMode = useCallback(
    (next: WorkspaceMode) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("mode", next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  return { mode, setMode };
}
