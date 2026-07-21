/**
 * Dual-write persistence: localStorage for sync reads, IndexedDB for durability.
 * On init, recovers localStorage from IndexedDB when keys are missing (e.g. Safari eviction).
 */

const DB_NAME = "resutail-store-v1";
const DB_VERSION = 1;
const STORE_NAME = "kv";
const MIGRATED_KEY = "resutail-idb-migrated-v1";

export const PERSISTED_KEYS = [
  "resutail-session-v1",
  "resutail-has-session",
  "resutail-versions-v1",
  "resutail-content-library-v1",
  "resutail-master-profile-v1",
  "resutail-template-settings-v1",
  "resutail-template-v1",
  "resutail-last-export-v1",
  "resutail-backup-nudge-dismiss-v1",
  "resutail-application-history-v1",
] as const;

export const STORAGE_READY_EVENT = "resutail-storage-ready";

let initPromise: Promise<void> | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error ?? new Error("IndexedDB open failed"));
    };
  });

  return dbPromise;
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function getLocalItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

function scheduleCloudPushFor(key: string): void {
  if (!(PERSISTED_KEYS as readonly string[]).includes(key)) return;
  // Dynamic import avoids a static circular dependency with cloud-sync.ts (which reads/writes
  // local items) and keeps the Supabase client out of bundles that never touch persisted data.
  void import("@/lib/cloud-sync")
    .then((mod) => mod.scheduleCloudPush())
    .catch(() => {});
}

export function setLocalItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
  void idbSet(key, value).catch(() => {
    // IndexedDB may be unavailable in private mode — localStorage still works
  });
  scheduleCloudPushFor(key);
}

export function removeLocalItem(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
  void idbDelete(key).catch(() => {});
  scheduleCloudPushFor(key);
}

export async function initBrowserStore(): Promise<void> {
  if (typeof window === "undefined") return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!("indexedDB" in window)) return;

    for (const key of PERSISTED_KEYS) {
      if (!localStorage.getItem(key)) {
        const recovered = await idbGet(key);
        if (recovered) localStorage.setItem(key, recovered);
      }
    }

    if (!localStorage.getItem(MIGRATED_KEY)) {
      for (const key of PERSISTED_KEYS) {
        const value = localStorage.getItem(key);
        if (value) await idbSet(key, value);
      }
      localStorage.setItem(MIGRATED_KEY, new Date().toISOString());
    } else {
      for (const key of PERSISTED_KEYS) {
        const value = localStorage.getItem(key);
        if (value) await idbSet(key, value);
      }
    }
  })();

  return initPromise;
}

export function notifyStorageReady(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(STORAGE_READY_EVENT));
}

/** Wipe all app data from localStorage and IndexedDB (keeps has-session flag). */
export function clearAllPersistedData(): void {
  if (typeof window === "undefined") return;
  for (const key of PERSISTED_KEYS) {
    removeLocalItem(key);
  }
  removeLocalItem(MIGRATED_KEY);
  setLocalItem("resutail-has-session", "1");
}
