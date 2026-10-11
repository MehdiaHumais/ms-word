/**
 * Crash-recovery drafts. Each document (keyed by tab id / path) keeps one HTML
 * snapshot so a reload never wipes typed content, and the app can offer to
 * restore drafts newer than the last save — the V1 "crash recovery" behaviour.
 */
export interface Draft {
  key: string;
  title: string;
  html: string;
  updatedAt: number;
}

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key?(index: number): string | null;
  length?: number;
}

const defaultStorage: DraftStorage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
  key: (index) => localStorage.key(index),
  get length() {
    return localStorage.length;
  },
};

const PREFIX = "britdocs:draft:";

export function draftKey(tabId: string): string {
  return `${PREFIX}${tabId}`;
}

export function writeDraft(
  key: string,
  entry: Omit<Draft, "key">,
  storage: DraftStorage = defaultStorage,
): void {
  try {
    storage.setItem(key, JSON.stringify({ key, ...entry }));
  } catch {
    /* storage unavailable */
  }
}

export function readDraft(
  key: string,
  storage: DraftStorage = defaultStorage,
): Draft | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).html !== "string" ||
      typeof (parsed as Record<string, unknown>).updatedAt !== "number" ||
      typeof (parsed as Record<string, unknown>).title !== "string"
    ) {
      return null;
    }
    return { key, ...(parsed as Omit<Draft, "key">) };
  } catch {
    return null;
  }
}

export function clearDraft(
  key: string,
  storage: DraftStorage = defaultStorage,
): void {
  try {
    storage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

/** All leftover drafts (i.e. not cleared by a successful save). Newest first. */
export function listDrafts(storage: DraftStorage = defaultStorage): Draft[] {
  const drafts: Draft[] = [];
  try {
    for (let i = 0; i < (storage.length ?? 0); i++) {
      const key = storage.key?.(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      const draft = readDraft(key, storage);
      if (draft) drafts.push(draft);
    }
  } catch {
    /* no enumerable storage */
  }
  return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Remove drafts for tabs that no longer exist in the open-tabs list. */
export function pruneDrafts(
  activeKeys: string[],
  storage: DraftStorage = defaultStorage,
): void {
  listDrafts(storage).forEach((d) => {
    if (!activeKeys.includes(d.key)) clearDraft(d.key, storage);
  });
}