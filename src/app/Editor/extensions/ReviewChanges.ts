import { Extension, type CommandProps, Mark } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import type { Node } from "@tiptap/pm/model";
import { useAppStore, type ReviewChange } from "../../../stores/appStore";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    reviewChanges: {
      acceptChanges: (all?: boolean) => ReturnType;
      rejectChanges: (all?: boolean) => ReturnType;
      nextChange: () => ReturnType;
      previousChange: () => ReturnType;
    };
  }
}

const TRACK_META = "britTrackApplied";

export const trackInsertMarkName = "trackInsert";
export const trackDeleteMarkName = "trackDelete";

/** Inserted text while tracking is on. */
export const TrackInsert = Mark.create({
  name: trackInsertMarkName,
  parseHTML: () => [{ tag: "span.brit-track-insert" }],
  renderHTML() {
    return ["span", { class: "brit-track-insert" }, 0];
  },
});

/** Deleted text replayed into the document (used by Compare). */
export const TrackDelete = Mark.create({
  name: trackDeleteMarkName,
  parseHTML: () => [{ tag: "span.brit-track-delete" }],
  renderHTML() {
    return ["span", { class: "brit-track-delete" }, 0];
  },
});

export type ReviewChangeItem =
  | { kind: "insert"; id: string; text: string; from: number; to: number }
  | { kind: "delete"; id: string; text: string; at: number };

/* ------------------------------------------------------------------ */
/* Doc <-> text helpers                                                */
/* ------------------------------------------------------------------ */

interface TextBlock {
  start: number;
  text: string;
}

function textBlocks(doc: Node): TextBlock[] {
  const blocks: TextBlock[] = [];
  doc.descendants((node, pos) => {
    if (node.isTextblock) blocks.push({ start: pos + 1, text: node.textContent });
    return true;
  });
  return blocks;
}

function commonPrefix(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

function commonSuffix(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
  return i;
}

function locatePrefix(doc: Node, prefix: string): number | null {
  if (!prefix) return null;
  for (const b of textBlocks(doc)) {
    const idx = b.text.indexOf(prefix);
    if (idx !== -1) return b.start + idx + prefix.length;
  }
  return null;
}

const trackKey = new PluginKey("britTrack");

function collectInsertRanges(doc: Node): { from: number; to: number }[] {
  const out: { from: number; to: number }[] = [];
  doc.descendants((node, pos) => {
    if (node.isText && node.marks.length) {
      for (const m of node.marks) {
        if (m.type.name === trackInsertMarkName) {
          out.push({ from: pos, to: pos + node.nodeSize });
        }
      }
    }
    return true;
  });
  return out;
}

export function collectDeleteRanges(doc: Node): { from: number; to: number }[] {
  const out: { from: number; to: number }[] = [];
  doc.descendants((node, pos) => {
    if (node.isText && node.marks.length) {
      for (const m of node.marks) {
        if (m.type.name === trackDeleteMarkName) {
          out.push({ from: pos, to: pos + node.nodeSize });
        }
      }
    }
    return true;
  });
  return out;
}

function selIntersects(sel: { from: number; to: number }, from: number, to: number): boolean {
  const a = sel.from <= sel.to ? sel.from : sel.to;
  const b = sel.from <= sel.to ? sel.to : sel.from;
  return Math.max(a, from) <= Math.min(b, to);
}

/* ------------------------------------------------------------------ */
/* Picked-delete bookkeeping (single Accept/Reject targets)            */
/* ------------------------------------------------------------------ */

let pickedDeleteId: string | null = null;

export function setPickedDelete(id: string | null) {
  pickedDeleteId = id;
}

function takePickedDelete(): ReviewChange | null {
  if (!pickedDeleteId) return null;
  const c = useAppStore.getState().changes.find((ch) => ch.id === pickedDeleteId) ?? null;
  if (c) pickedDeleteId = null;
  return c;
}

/** Full, position-sorted list of changes for the Reviews pane. */
export function listDocChanges(state: { doc: Node; schema?: any }): ReviewChangeItem[] {
  const items: ReviewChangeItem[] = [];
  let i = 0;
  for (const r of collectInsertRanges(state.doc)) {
    items.push({
      kind: "insert",
      id: `ins-${i++}`,
      text: state.doc.textBetween(r.from, r.to),
      from: r.from,
      to: r.to,
    });
  }
  for (const r of collectDeleteRanges(state.doc)) {
    items.push({
      kind: "delete",
      id: `delmark-${i++}`,
      text: state.doc.textBetween(r.from, r.to),
      at: r.from,
    });
  }
  for (const c of useAppStore.getState().changes) {
    const at = locatePrefix(state.doc, c.prefix);
    if (at !== null) items.push({ kind: "delete", id: c.id, text: c.text, at });
  }
  items.sort((a, b) => (a.kind === "insert" ? a.from : a.at) - (b.kind === "insert" ? b.from : b.at));
  return items;
}

function changeAnchor(c: ReviewChangeItem): number {
  return c.kind === "insert" ? c.from : c.at;
}

function navigate(
  state: { doc: Node; selection: { from: number } },
  tr: import("@tiptap/pm/state").Transaction,
  dir: 1 | -1,
): boolean {
  const items = listDocChanges(state);
  if (items.length === 0) return false;
  const anchor = state.selection.from;
  let idx = -1;
  if (dir === 1) {
    for (let i = 0; i < items.length; i++) {
      if (changeAnchor(items[i]) > anchor) {
        idx = i;
        break;
      }
    }
  } else {
    for (let i = items.length - 1; i >= 0; i--) {
      if (changeAnchor(items[i]) < anchor) {
        idx = i;
        break;
      }
    }
  }
  const item = idx === -1 ? items[dir === 1 ? 0 : items.length - 1] : items[idx];
  const from = item.kind === "insert" ? item.from : item.at;
  const to = item.kind === "insert" ? item.to : item.at;
  tr.setSelection(new TextSelection(tr.doc.resolve(from), tr.doc.resolve(to)));
  setPickedDelete(item.kind === "delete" ? item.id : null);
  tr.scrollIntoView();
  return true;
}

/* ------------------------------------------------------------------ */
/* Tracking plugin — wraps inserted text while tracking is on          */
/* ------------------------------------------------------------------ */

const trackPlugin = (): Plugin => {
  return new Plugin({
    key: trackKey,
    appendTransaction(transactions, oldState, newState) {
      if (transactions.some((t) => t.getMeta(TRACK_META))) return null;
      if (!useAppStore.getState().trackChanges) return null;
      if (oldState.doc.eq(newState.doc)) return null;

      const schema = newState.schema;
      const insertMark = schema.marks[trackInsertMarkName];
      if (!insertMark) return null;

      const oldBlocks = textBlocks(oldState.doc);
      const newBlocks = textBlocks(newState.doc);
      const tr = newState.tr;
      let docTouched = false;
      const deleted: { text: string; prefix: string }[] = [];
      let needStore = false;

      const len = Math.max(oldBlocks.length, newBlocks.length);
      for (let i = 0; i < len; i++) {
        const o = oldBlocks[i];
        const n = newBlocks[i];
        const ot = o?.text ?? "";
        const nt = n?.text ?? "";
        if (ot === nt) continue;
        const p = commonPrefix(ot, nt);
        const s = commonSuffix(ot, nt);

        const inFrom = p;
        const inTo = nt.length - s;
        if (inTo > inFrom) {
          const from = (n?.start ?? p) + inFrom;
          const to = from + (inTo - inFrom);
          tr.addMark(from, to, insertMark.create());
          docTouched = true;
        }

        const delFrom = p;
        const delTo = ot.length - s;
        if (delTo > delFrom) {
          deleted.push({ text: ot.slice(delFrom, delTo), prefix: ot.slice(0, p) });
          needStore = true;
        }
      }

      if (needStore) {
        const author = "You";
        for (const d of deleted) {
          useAppStore.getState().addChange({
            id: `d-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            kind: "delete",
            text: d.text,
            prefix: d.prefix,
            author,
          });
        }
      }
      if (docTouched) {
        tr.setMeta(TRACK_META, true);
        return tr;
      }
      return null;
    },
  });
};

/* ------------------------------------------------------------------ */
/* Accept / Reject / Navigate                                          */
/* ------------------------------------------------------------------ */

export const ReviewChanges = Extension.create({
  name: "reviewChanges",
  addProseMirrorPlugins() {
    return [trackPlugin()];
  },
  addCommands() {
    return {
      acceptChanges:
        (all = false) =>
        ({ state, dispatch }: CommandProps): boolean => {
          const { schema, doc, selection } = state;
          const ins = schema.marks[trackInsertMarkName];
          const del = schema.marks[trackDeleteMarkName];
          const tr = state.tr;
          let worked = false;

          if (all) {
            if (ins) {
              for (const r of collectInsertRanges(doc)) {
                tr.removeMark(r.from, r.to, ins);
              }
            }
            if (del) {
              for (const r of collectDeleteRanges(doc)) {
                tr.delete(r.from, r.to);
              }
            }
            useAppStore.getState().clearChanges();
            worked = true;
          } else {
            if (del) {
              for (const r of collectDeleteRanges(doc)) {
                if (!worked && selIntersects(selection, r.from, r.to)) {
                  tr.delete(r.from, r.to);
                  worked = true;
                }
              }
            }
            if (!worked && ins) {
              for (const r of collectInsertRanges(doc)) {
                if (!worked && selIntersects(selection, r.from, r.to)) {
                  tr.removeMark(r.from, r.to, ins);
                  worked = true;
                }
              }
            }
            if (!worked) {
              const c = takePickedDelete();
              if (c) {
                useAppStore.getState().removeChange(c.id);
                worked = true;
              }
            }
          }

          if (!worked) return false;
          if (tr.docChanged) dispatch?.(tr);
          return true;
        },

      rejectChanges:
        (all = false) =>
        ({ state, dispatch }: CommandProps): boolean => {
          const { schema, doc, selection } = state;
          const ins = schema.marks[trackInsertMarkName];
          const del = schema.marks[trackDeleteMarkName];
          const stores = useAppStore.getState();
          const tr = state.tr;
          let worked = false;

          if (all) {
            const insRanges = ins ? collectInsertRanges(doc) : [];
            for (let i = insRanges.length - 1; i >= 0; i--) {
              tr.delete(insRanges[i].from, insRanges[i].to);
            }
            if (del) {
              for (const r of collectDeleteRanges(doc)) {
                tr.removeMark(r.from, r.to, del);
              }
            }
            const dels = [...stores.changes];
            for (const d of dels) {
              const at = locatePrefix(tr.doc, d.prefix);
              const pos = at !== null ? at : Math.max(0, tr.doc.content.size - 1);
              tr.insert(pos, schema.text(d.text));
            }
            stores.clearChanges();
            worked = true;
          } else {
            if (ins) {
              for (const r of collectInsertRanges(doc)) {
                if (!worked && selIntersects(selection, r.from, r.to)) {
                  tr.delete(r.from, r.to);
                  worked = true;
                }
              }
            }
            if (!worked && del) {
              for (const r of collectDeleteRanges(doc)) {
                if (!worked && selIntersects(selection, r.from, r.to)) {
                  tr.removeMark(r.from, r.to, del);
                  worked = true;
                }
              }
            }
            if (!worked) {
              const c = takePickedDelete();
              if (c) {
                const at = locatePrefix(state.doc, c.prefix);
                const pos = at !== null ? at : Math.max(0, state.doc.content.size - 1);
                tr.insert(pos, schema.text(c.text));
                useAppStore.getState().removeChange(c.id);
                worked = true;
              }
            }
          }

          if (!worked) return false;
          dispatch?.(tr);
          return true;
        },

      nextChange:
        () =>
        ({ state, tr, dispatch }: CommandProps): boolean => {
          if (!navigate(state, tr, 1)) return false;
          dispatch?.(tr);
          return true;
        },

      previousChange:
        () =>
        ({ state, tr, dispatch }: CommandProps): boolean => {
          if (!navigate(state, tr, -1)) return false;
          dispatch?.(tr);
          return true;
        },
    };
  },
});