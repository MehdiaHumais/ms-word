/**
 * Recent-files persistence for the browser-hosted app. The V1 target is SQLite
 * via the (future) Tauri shell; until that lands we use localStorage with an
 * injectable storage so the module stays testable and swap-safe.
 */
export type RecentKind = "britdoc" | "html" | "txt" | "docx" | "rtf" | "untitled";

export interface RecentFile {
  id: string;
  name: string;
  kind: RecentKind;
  openedAt: number;
  /** Content snapshot for reopenable kinds (britdoc/html/txt). Omitted for binaries. */
  content?: string;
}

const STORAGE_KEY = "britdocs:recent";
const MAX_ENTRIES = 12;
/** Keep content below this so localStorage (≈5 MB) is never blown out. */
const MAX_CONTENT = 256_000;

export interface RecentStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const defaultStorage: RecentStorage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
};

export function loadRecentFiles(storage: RecentStorage = defaultStorage): RecentFile[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentFile).sort((a, b) => b.openedAt - a.openedAt);
  } catch {
    return [];
  }
}

function isRecentFile(v: unknown): v is RecentFile {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.name === "string" &&
    typeof r.kind === "string" &&
    typeof r.openedAt === "number"
  );
}

export function addRecentFile(
  entry: Omit<RecentFile, "openedAt">,
  storage: RecentStorage = defaultStorage,
): RecentFile[] {
  const full: RecentFile = { ...entry, openedAt: Date.now() };
  if (typeof full.content === "string" && full.content.length > MAX_CONTENT) {
    delete full.content;
  }
  const list = [
    full,
    ...loadRecentFiles(storage).filter((r) => r.id !== full.id),
  ].slice(0, MAX_ENTRIES);
  persist(list, storage);
  return list;
}

export function removeRecentFile(
  id: string,
  storage: RecentStorage = defaultStorage,
): RecentFile[] {
  const list = loadRecentFiles(storage).filter((r) => r.id !== id);
  persist(list, storage);
  return list;
}

export function clearRecentFiles(storage: RecentStorage = defaultStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch {
    /* storage unavailable */
  }
}

function persist(list: RecentFile[], storage: RecentStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota exceeded — drop heavy payloads and retry once */
    const slim = list.map((r) => {
      if (r.content && r.content.length > 64_000) {
        const { content, ...rest } = r;
        void content;
        return rest;
      }
      return r;
    });
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch {
      storage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
  }
}