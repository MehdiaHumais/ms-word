import { Extension, type CommandProps, Mark, mergeAttributes } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import type { Node } from "@tiptap/pm/model";
import { useAppStore } from "../../../stores/appStore";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    comments: {
      addComment: () => ReturnType;
      deleteComment: () => ReturnType;
      nextComment: () => ReturnType;
      previousComment: () => ReturnType;
      selectComment: (id: string) => ReturnType;
    };
  }
}

export const commentMarkName = "comment";

export const CommentMark = Mark.create({
  name: commentMarkName,

  addAttributes() {
    return {
      id: { default: null, rendered: true },
      author: { default: "You", rendered: true },
      created: { default: null, rendered: true },
    };
  },

  parseHTML: () => [{ tag: "span.brit-comment" }],
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "brit-comment" }), 0];
  },
});

interface CommentRange {
  id: string;
  author: string;
  created: string | null;
  from: number;
  to: number;
  text: string;
}

export function listCommentRanges(state: { doc: Node }): CommentRange[] {
  const out: CommentRange[] = [];
  const doc = state.doc;
  doc.descendants((node, pos) => {
    if (node.isText && node.marks.length) {
      for (const m of node.marks) {
        if (m.type.name === commentMarkName) {
          const attrs = m.attrs as { id?: string; author?: string; created?: string | null };
          if (!attrs.id) continue;
          out.push({
            id: String(attrs.id),
            author: String(attrs.author ?? "You"),
            created: attrs.created ?? null,
            from: pos,
            to: pos + node.nodeSize,
            text: node.text ?? "",
          });
        }
      }
    }
    return true;
  });
  // Merge adjacent ranges with the same id so the pane list is clean.
  const merged: CommentRange[] = [];
  for (const c of out.sort((a, b) => a.from - b.from)) {
    const last = merged[merged.length - 1];
    if (last && last.id === c.id && c.from <= last.to) {
      last.to = Math.max(last.to, c.to);
      last.text += c.text;
    } else {
      merged.push({ ...c });
    }
  }
  return merged;
}

function selIntersects(sel: { from: number; to: number }, from: number, to: number): boolean {
  const a = sel.from <= sel.to ? sel.from : sel.to;
  const b = sel.from <= sel.to ? sel.to : sel.from;
  return Math.max(a, from) <= Math.min(b, to);
}

function expandToWord(doc: Node, from: number, to: number): { from: number; to: number } {
  // Walk back/forward skipping whitespace.
  let f = from;
  let t = to;
  const max = doc.content.size;
  let guard = 0;
  while (guard++ < 200) {
    const ch = doc.textBetween(Math.max(0, f - 1), f);
    if (f > 0 && ch.trim()) f--;
    const ch2 = doc.textBetween(t, Math.min(max, t + 1));
    if (t < max && ch2.trim()) t++;
    else break;
    if (f === 0 && t === max) break;
  }
  return f < t ? { from: f, to: t } : { from, to };
}

export const Comments = Extension.create({
  name: "comments",

  addCommands() {
    return {
      addComment:
        () =>
        ({ editor, state, tr, dispatch }: CommandProps): boolean => {
          void editor;
          const { doc, selection } = state;
          const mark = state.schema.marks[commentMarkName];
          if (!mark) return false;
          let from = selection.from;
          let to = selection.to;
          if (selection.empty) {
            const w = expandToWord(doc, from, to);
            if (w.from === w.to) return false;
            from = w.from;
            to = w.to;
          }
          // Bail if the selection already carries a comment (Word allows nested,
          // but one-per-selection keeps the demo clean).
          const existing = listCommentRanges({ doc });
          if (existing.some((c) => selIntersects(selection, c.from, c.to))) return false;
          const id = `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          tr.addMark(
            from,
            to,
            mark.create({ id, author: "You", created: new Date().toISOString() }),
          );
          dispatch?.(tr);
          useAppStore.getState().setReviewPanel("comments");
          return true;
        },

      deleteComment:
        () =>
        ({ state, tr, dispatch }: CommandProps): boolean => {
          const { doc, selection } = state;
          const mark = state.schema.marks[commentMarkName];
          if (!mark) return false;
          const targets = listCommentRanges({ doc }).filter((c) =>
            selIntersects(selection, c.from, c.to),
          );
          if (targets.length === 0) return false;
          for (const c of targets) tr.removeMark(c.from, c.to, mark);
          dispatch?.(tr);
          return true;
        },

      nextComment:
        () =>
        ({ state, tr, dispatch }: CommandProps): boolean => {
          const ranges = listCommentRanges(state);
          if (ranges.length === 0) return false;
          const anchor = state.selection.from;
          const next = ranges.find((c) => c.from > anchor) ?? ranges[0];
          tr.setSelection(new TextSelection(tr.doc.resolve(next.from), tr.doc.resolve(next.to)));
          tr.scrollIntoView();
          dispatch?.(tr);
          return true;
        },

      previousComment:
        () =>
        ({ state, tr, dispatch }: CommandProps): boolean => {
          void dispatch;
          const ranges = listCommentRanges(state);
          if (ranges.length === 0) return false;
          const anchor = state.selection.from;
          const prev = [...ranges].reverse().find((c) => c.from < anchor) ?? ranges[ranges.length - 1];
          tr.setSelection(new TextSelection(tr.doc.resolve(prev.from), tr.doc.resolve(prev.to)));
          tr.scrollIntoView();
          dispatch?.(tr);
          return true;
        },

      selectComment:
        (id: string) =>
        ({ state, tr, dispatch }: CommandProps): boolean => {
          const c = listCommentRanges(state).find((r) => r.id === id);
          if (!c) return false;
          tr.setSelection(new TextSelection(tr.doc.resolve(c.from), tr.doc.resolve(c.to)));
          tr.scrollIntoView();
          dispatch?.(tr);
          return true;
        },
    };
  },
});