"use client";

import { useCallback, useSyncExternalStore } from "react";

export interface PlaylistHistoryEntry {
  id: string;
  name: string;
  url: string;
  trackCount: number;
  createdAt: number;
  vibe?: string;
}

const STORAGE_KEY = "music-brother:history";
const EVENT = "music-brother:history-update";
const MAX_ENTRIES = 50;
const EMPTY: PlaylistHistoryEntry[] = [];

let cachedJson: string | null = null;
let cachedSnapshot: PlaylistHistoryEntry[] = EMPTY;

function readRaw(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function parse(raw: string): PlaylistHistoryEntry[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PlaylistHistoryEntry[]) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): PlaylistHistoryEntry[] {
  const raw = readRaw();
  if (raw !== cachedJson) {
    cachedJson = raw;
    cachedSnapshot = parse(raw);
  }
  return cachedSnapshot;
}

function getServerSnapshot(): PlaylistHistoryEntry[] {
  return EMPTY;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, callback);
  };
}

function write(entries: PlaylistHistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    cachedJson = null; // force re-parse on next getSnapshot
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* localStorage might be full or disabled */
  }
}

export function usePlaylistHistory() {
  const history = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const add = useCallback(
    (entry: Omit<PlaylistHistoryEntry, "createdAt">) => {
      const current = getSnapshot();
      if (current.some((p) => p.id === entry.id)) return;
      const next = [
        { ...entry, createdAt: Date.now() },
        ...current,
      ].slice(0, MAX_ENTRIES);
      write(next);
    },
    [],
  );

  const remove = useCallback((id: string) => {
    const next = getSnapshot().filter((p) => p.id !== id);
    write(next);
  }, []);

  const clear = useCallback(() => {
    write([]);
  }, []);

  return { history, add, remove, clear };
}
