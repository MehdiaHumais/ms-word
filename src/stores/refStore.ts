import { create } from "zustand";

export interface Footnote {
  id: string;
  kind: "footnote" | "endnote";
  number: number;
  text: string;
}

export interface Source {
  id: string;
  type: "Book" | "Web" | "Journal" | "Newspaper";
  author: string;
  title: string;
  year: string;
  publisher?: string;
  city?: string;
  url?: string;
}

export interface IndexEntry {
  id: string;
  term: string;
  subterm?: string;
  page: string;
}

export interface Caption {
  id: string;
  label: "Figure" | "Table" | "Equation";
  number: number;
  text: string;
}

interface RefState {
  footnotes: Footnote[];
  sources: Source[];
  indexEntries: IndexEntry[];
  captions: Caption[];
  citationCount: number;
  tocBlocks: number;
  addFootnote: (kind: "footnote" | "endnote", text?: string) => string;
  updateFootnote: (id: string, text: string) => void;
  removeFootnote: (id: string) => void;
  nextFootnoteNumber: () => number;
  resetFootnotes: () => void;
  addSource: (s: Source) => void;
  updateSource: (s: Source) => void;
  removeSource: (id: string) => void;
  addIndexEntry: (term: string, subterm: string | undefined, page: string) => string;
  removeIndexEntry: (id: string) => void;
  clearIndex: () => void;
  addCaption: (label: Caption["label"], text: string) => string;
  updateCaption: (id: string, text: string) => void;
  nextCaptionNumber: (label: Caption["label"]) => number;
  bumpCitation: () => void;
}

let footnoteSeq = 1;

export const useRefStore = create<RefState>((set, get) => ({
  footnotes: [],
  sources: [
    { id: "s1", type: "Book", author: "David Pogue", title: "Word 365: The Missing Manual", year: "2024", publisher: "O'Reilly", city: "Sebastopol" },
    { id: "s2", type: "Web", author: "Microsoft", title: "Mail merge documentation", year: "2025", url: "https://support.microsoft.com" },
    { id: "s3", type: "Journal", author: "Ada Lovelace", title: "Notes on the Analytical Engine", year: "1843" },
  ],
  indexEntries: [],
  captions: [],
  citationCount: 0,
  tocBlocks: 0,
  nextFootnoteNumber: () => {
    const maxKinds: Record<string, number> = {};
    for (const f of get().footnotes) maxKinds[f.kind] = f.number;
    const n = Math.max(maxKinds.footnote ?? 0, maxKinds.endnote ?? 0) + 1;
    return n;
  },
  addFootnote: (kind, text = "") => {
    const n = get().nextFootnoteNumber();
    const id = `fn${footnoteSeq++}`;
    set((s) => ({ footnotes: [...s.footnotes, { id, kind, number: n, text }] }));
    return id;
  },
  updateFootnote: (id, text) =>
    set((s) => ({ footnotes: s.footnotes.map((f) => (f.id === id ? { ...f, text } : f)) })),
  removeFootnote: (id) =>
    set((s) => ({ footnotes: s.footnotes.filter((f) => f.id !== id) })),
  resetFootnotes: () => set({ footnotes: [] }),
  addSource: (source) => set((s) => ({ sources: [...s.sources, source] })),
  updateSource: (source) =>
    set((s) => ({ sources: s.sources.map((x) => (x.id === source.id ? source : x)) })),
  removeSource: (id) => set((s) => ({ sources: s.sources.filter((x) => x.id !== id) })),
  addIndexEntry: (term, subterm, page) => {
    const id = `ix${footnoteSeq++}`;
    set((s) => ({ indexEntries: [...s.indexEntries, { id, term, subterm, page }] }));
    return id;
  },
  removeIndexEntry: (id) =>
    set((s) => ({ indexEntries: s.indexEntries.filter((e) => e.id !== id) })),
  clearIndex: () => set({ indexEntries: [] }),
  addCaption: (label, text) => {
    const number = get().nextCaptionNumber(label);
    const id = `cap${footnoteSeq++}`;
    set((s) => ({ captions: [...s.captions, { id, label, number, text }] }));
    return id;
  },
  updateCaption: (id, text) =>
    set((s) => ({ captions: s.captions.map((c) => (c.id === id ? { ...c, text } : c)) })),
  nextCaptionNumber: (label) =>
    get().captions.filter((c) => c.label === label).length + 1,
  bumpCitation: () => set((s) => ({ citationCount: s.citationCount + 1 })),
}));

/** Word-style citation formatting. */
export function formatSource(s: Source): string {
  switch (s.type) {
    case "Book":
      return `${s.author}. ${s.title}. ${s.publisher ?? ""}, ${s.year}.`;
    case "Web":
      return `${s.author}. "${s.title}." ${s.url ?? ""} (accessed ${new Date().getFullYear()}).`;
    case "Journal":
      return `${s.author}. "${s.title}." Journal of Computing ${s.year}.`;
    case "Newspaper":
      return `${s.author}. "${s.title}." Daily News, ${s.year}.`;
  }
}

/** Deterministic pseudorandom for deterministic tests. */
export function seededId(prefix: string, n: number): string {
  return `${prefix}${n}`;
}