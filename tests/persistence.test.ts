import { describe, expect, it, beforeEach } from "vitest";
import {
  clearDraft,
  draftKey,
  listDrafts,
  pruneDrafts,
  readDraft,
  writeDraft,
  type DraftStorage,
} from "../src/domain/persistence/recovery";
import {
  addRecentFile,
  clearRecentFiles,
  loadRecentFiles,
  removeRecentFile,
} from "../src/domain/persistence/recentFiles";

function memoryStorage() {
  const m = new Map<string, string>();
  const storage: DraftStorage = {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => {
      m.set(k, v);
    },
    removeItem: (k) => {
      m.delete(k);
    },
    key: (i) => Array.from(m.keys())[i] ?? null,
    length: 0,
  };
  Object.defineProperty(storage, "length", {
    get() {
      return m.size;
    },
  });
  return { storage, m };
}

describe("crash recovery — drafts", () => {
  let s: ReturnType<typeof memoryStorage>;
  beforeEach(() => {
    s = memoryStorage();
    clearRecentFiles();
  });

  it("writes and reads a draft round-trip", () => {
    writeDraft(draftKey("t1"), {
      title: "Doc A",
      html: "<p>hi</p>",
      updatedAt: 1000,
    }, s.storage);
    const d = readDraft(draftKey("t1"), s.storage);
    expect(d).toEqual({
      key: draftKey("t1"),
      title: "Doc A",
      html: "<p>hi</p>",
      updatedAt: 1000,
    });
  });

  it("lists drafts newest first and clears them", () => {
    writeDraft(draftKey("a"), { title: "A", html: "<p>a</p>", updatedAt: 10 }, s.storage);
    writeDraft(draftKey("b"), { title: "B", html: "<p>b</p>", updatedAt: 20 }, s.storage);
    expect(listDrafts(s.storage).map((d) => d.title)).toEqual(["B", "A"]);
    clearDraft(draftKey("a"), s.storage);
    expect(listDrafts(s.storage).map((d) => d.title)).toEqual(["B"]);
  });

  it("prunes drafts whose tabs no longer exist but keeps active ones", () => {
    writeDraft(draftKey("keep"), { title: "K", html: "<p>k</p>", updatedAt: 1 }, s.storage);
    writeDraft(draftKey("stale"), { title: "S", html: "<p>s</p>", updatedAt: 2 }, s.storage);
    pruneDrafts([draftKey("keep")], s.storage);
    expect(listDrafts(s.storage).map((d) => d.title)).toEqual(["K"]);
  });

  it("ignores malformed draft entries", () => {
    s.storage.setItem(draftKey("bad"), "{not json");
    s.storage.setItem(draftKey("wrong"), JSON.stringify({ nope: true }));
    expect(listDrafts(s.storage)).toEqual([]);
  });
});

describe("recent files", () => {
  let r: ReturnType<typeof memoryStorage>;
  beforeEach(() => {
    r = memoryStorage();
    clearRecentFiles(r.storage);
  });

  it("adds, de-duplicates and removes recent entries", () => {
    addRecentFile({ id: "1", name: "a.britdoc", kind: "britdoc", content: "<p>a</p>" }, r.storage);
    addRecentFile({ id: "2", name: "b.txt", kind: "txt" }, r.storage);
    addRecentFile({ id: "1", name: "a.britdoc", kind: "britdoc", content: "<p>a2</p>" }, r.storage);
    const list = loadRecentFiles(r.storage);
    expect(list.map((f) => f.name)).toEqual(["a.britdoc", "b.txt"]);
    removeRecentFile("1", r.storage);
    expect(loadRecentFiles(r.storage).map((f) => f.name)).toEqual(["b.txt"]);
  });

  it("reopens content-carrying recent entries", () => {
    addRecentFile({ id: "3", name: "c.britdoc", kind: "britdoc", content: "{}" }, r.storage);
    expect(loadRecentFiles(r.storage)[0]?.content).toBe("{}");
  });
});