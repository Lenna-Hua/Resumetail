"use client";

import { useEffect } from "react";
import { initBrowserStore, notifyStorageReady } from "@/lib/browser-store";

export function StorageInit() {
  useEffect(() => {
    void initBrowserStore().then(() => notifyStorageReady());
  }, []);

  return null;
}
