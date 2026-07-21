"use client";

import { createClient } from "@/lib/supabase/client";
import { PERSISTED_KEYS, getLocalItem, setLocalItem } from "@/lib/browser-store";

const LAST_SYNC_KEY = "resutail-last-sync-v1";
const PUSH_DEBOUNCE_MS = 2000;

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let activeUserId: string | null = null;

/** Read/write the sync marker directly (never through setLocalItem) to avoid re-triggering a push. */
function getSyncMarker(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

function setSyncMarker(value: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SYNC_KEY, value);
}

export function setSyncUser(userId: string | null): void {
  activeUserId = userId;
  if (!userId && pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
}

function collectLocalData(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const key of PERSISTED_KEYS) {
    const raw = getLocalItem(key);
    if (raw == null) continue;
    try {
      data[key] = JSON.parse(raw);
    } catch {
      // Skip values that somehow aren't valid JSON.
    }
  }
  return data;
}

function applyCloudData(data: Record<string, unknown>): void {
  for (const key of PERSISTED_KEYS) {
    if (!(key in data)) continue;
    setLocalItem(key, JSON.stringify(data[key]));
  }
}

/** Upload current local data immediately (no debounce). */
export async function pushCloudDataNow(userId: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  const data = collectLocalData();
  const { data: row, error } = await supabase
    .from("user_data")
    .upsert({ user_id: userId, data }, { onConflict: "user_id" })
    .select("updated_at")
    .single();

  if (error) {
    console.error("cloud-sync: push failed", error.message);
    return;
  }
  if (row?.updated_at) setSyncMarker(row.updated_at as string);
}

/** Debounced push, called after any local write while a user is signed in. */
export function scheduleCloudPush(): void {
  if (!activeUserId) return;
  const userId = activeUserId;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void pushCloudDataNow(userId);
  }, PUSH_DEBOUNCE_MS);
}

/**
 * Called once per sign-in. Pulls cloud data down when it's newer than what this device last
 * synced (e.g. signing in on a new device), otherwise pushes local data up (first sync,
 * or this device is already the source of truth for the last known cloud state).
 */
export async function pullCloudData(userId: string): Promise<void> {
  setSyncUser(userId);
  const supabase = createClient();
  if (!supabase) return;

  const { data: row, error } = await supabase
    .from("user_data")
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("cloud-sync: pull failed", error.message);
    return;
  }

  if (!row) {
    await pushCloudDataNow(userId);
    return;
  }

  const localMarker = getSyncMarker();
  if (localMarker !== row.updated_at) {
    applyCloudData((row.data as Record<string, unknown>) ?? {});
    setSyncMarker(row.updated_at as string);
  }
}

export async function fetchOnboarded(userId: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("user_data")
    .select("onboarded")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return false;
  return Boolean(data.onboarded);
}

export async function markOnboarded(userId: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  await supabase
    .from("user_data")
    .upsert({ user_id: userId, onboarded: true }, { onConflict: "user_id" });
}
