import { Extension, type CommandProps } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node } from "@tiptap/pm/model";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    findReplace: {
      find: (query: string, caseSensitive?: boolean) => ReturnType;
      findNext: () => ReturnType;
      findPrevious: () => ReturnType;
      replaceCurrent: (replacement: string) => ReturnType;
      replaceAll: (replacement: string) => ReturnType;
    };
  }
}

/**
 * Find & Replace — a ProseMirror plugin that highlights every match of the
 * query and commands to navigate and replace them (Word-style Ctrl+F).
 */

export interface FindReplacePluginState {
  query: string;
  caseSensitive: boolean;
  current: number;
}

interface TextNodePos {
  pos: number;
  text: string;
  start: number;
}

export const findReplaceKey = new PluginKey<FindReplacePluginState>("findReplace");

function buildLocator(doc: Node): TextNodePos[] {
  const nodes: TextNodePos[] = [];
  let offset = 0;
  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      nodes.push({ pos, text: node.text, start: offset });
      offset += node.text.length;
    }
    return true;
  });
  return nodes;
}

function textOffsetToPos(nodes: TextNodePos[], offset: number): number | null {
  for (const n of nodes) {
    const end = n.start + n.text.length;
    if (offset >= n.start && offset <= end) return n.pos + (offset - n.start);
  }
  return null;
}

export function computeMatches(
  doc: Node,
  query: string,
  caseSensitive: boolean,
): { from: number; to: number }[] {
  if (!query) return [];
  const nodes = buildLocator(doc);
  const full = nodes.map((n) => n.text).join("");
  const haystack = caseSensitive ? full : full.toLowerCase();
  const needle = caseSensitive ? query : query.toLowerCase();
  if (!needle) return [];

  const matches: { from: number; to: number }[] = [];
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    const from = textOffsetToPos(nodes, i);
    const to = textOffsetToPos(nodes, i + needle.length);
    if (from !== null && to !== null && to > from) {
      matches.push({ from, to });
    }
    i = haystack.indexOf(needle, i + needle.length);
  }
  return matches;
}

const findReplacePlugin = (): Plugin => {
  return new Plugin<FindReplacePluginState>({
    key: findReplaceKey,
    state: {
      init: () => ({ query: "", caseSensitive: false, current: 0 }),
      apply(tr, prev, _oldState, newState) {
        let next = prev ?? { query: "", caseSensitive: false, current: 0 };
        const meta = tr.getMeta(findReplaceKey) as
          | { setQuery?: string; setCase?: boolean; setCurrent?: number }
          | undefined;
        if (meta) {
          if (typeof meta.setQuery === "string") {
            next = { ...next, query: meta.setQuery, current: 0 };
          }
          if (typeof meta.setCase === "boolean") {
            next = { ...next, caseSensitive: meta.setCase, current: 0 };
          }
          if (typeof meta.setCurrent === "number") {
            next = { ...next, current: meta.setCurrent };
          }
        }
        // Re-clamp after the doc changes so the highlighted match stays valid.
        if (tr.docChanged && next.query) {
          const matches = computeMatches(newState.doc, next.query, next.caseSensitive);
          if (matches.length === 0) next = { ...next, current: 0 };
          else next = { ...next, current: Math.min(next.current, matches.length - 1) };
        }
        return next;
      },
    },
    props: {
      decorations(state) {
        const ps = findReplaceKey.getState(state);
        if (!ps || !ps.query) return null;
        const matches = computeMatches(state.doc, ps.query, ps.caseSensitive);
        if (matches.length === 0) return null;
        const decos = matches.map((m, idx) =>
          Decoration.inline(m.from, m.to, {
            class: idx === ps.current ? "brit-find-match-current" : "brit-find-match",
          }),
        );
        return DecorationSet.create(state.doc, decos);
      },
    },
  });
};

function setCurrent(tr: import("@tiptap/pm/state").Transaction, idx: number) {
  const existing = (tr.getMeta(findReplaceKey) as { setQuery?: string; setCase?: boolean; setCurrent?: number }) ?? {};
  tr.setMeta(findReplaceKey, { ...existing, setCurrent: idx });
}

export const FindReplace = Extension.create({
  name: "findReplace",

  addOptions() {
    return { caseSensitive: false };
  },

  addProseMirrorPlugins() {
    return [findReplacePlugin()];
  },

  addCommands() {
    return {
      find:
        (query: string, caseSensitive?: boolean) =>
        ({ editor, tr, dispatch }: CommandProps) => {
          const { state } = editor;
          const caseFlag = typeof caseSensitive === "boolean" ? caseSensitive : this.options.caseSensitive;
          tr.setMeta(findReplaceKey, { setQuery: query, setCase: caseFlag });

          if (query) {
            const matches = computeMatches(state.doc, query, caseFlag);
            if (matches.length > 0) {
              const m = matches[0];
              tr.setSelection(
                new TextSelection(state.doc.resolve(m.from), state.doc.resolve(m.to)),
              );
              setCurrent(tr, 0);
            }
          }
          tr.scrollIntoView();
          dispatch?.(tr);
          return true;
        },

      findNext:
        () =>
        ({ editor, tr, dispatch }: CommandProps) => {
          const { state } = editor;
          const ps = findReplaceKey.getState(state);
          if (!ps?.query) return false;
          const matches = computeMatches(state.doc, ps.query, ps.caseSensitive);
          if (matches.length === 0) return false;
          const next = (ps.current + 1) % matches.length;
          const m = matches[next];
          tr.setSelection(new TextSelection(state.doc.resolve(m.from), state.doc.resolve(m.to)));
          setCurrent(tr, next);
          tr.scrollIntoView();
          dispatch?.(tr);
          return true;
        },

      findPrevious:
        () =>
        ({ editor, tr, dispatch }: CommandProps) => {
          const { state } = editor;
          const ps = findReplaceKey.getState(state);
          if (!ps?.query) return false;
          const matches = computeMatches(state.doc, ps.query, ps.caseSensitive);
          if (matches.length === 0) return false;
          const prev = (ps.current - 1 + matches.length) % matches.length;
          const m = matches[prev];
          tr.setSelection(new TextSelection(state.doc.resolve(m.from), state.doc.resolve(m.to)));
          setCurrent(tr, prev);
          tr.scrollIntoView();
          dispatch?.(tr);
          return true;
        },

      replaceCurrent:
        (replacement: string) =>
        ({ editor, tr, dispatch }: CommandProps) => {
          const { state } = editor;
          const ps = findReplaceKey.getState(state);
          if (!ps?.query) return false;
          const matches = computeMatches(state.doc, ps.query, ps.caseSensitive);
          if (matches.length === 0) return false;
          const m = matches[ps.current] ?? matches[0];
          tr.setSelection(new TextSelection(state.doc.resolve(m.from), state.doc.resolve(m.to)));
          tr.insertText(replacement, m.from, m.to);
          // Keep highlighting but move to the following match.
          const remaining = computeMatches(tr.doc, ps.query, ps.caseSensitive).length;
          setCurrent(tr, Math.min(ps.current, remaining - 1));
          tr.scrollIntoView();
          dispatch?.(tr);
          return true;
        },

      replaceAll:
        (replacement: string) =>
        ({ editor, tr, dispatch }: CommandProps) => {
          const { state } = editor;
          const ps = findReplaceKey.getState(state);
          if (!ps?.query) return false;
          const matches = computeMatches(state.doc, ps.query, ps.caseSensitive);
          if (matches.length === 0) return false;

          // Replace from the end so earlier positions stay valid.
          for (let i = matches.length - 1; i >= 0; i--) {
            const m = matches[i];
            tr = tr.replaceWith(m.from, m.to, state.schema.text(replacement));
          }
          tr.setMeta(findReplaceKey, { setQuery: ps.query, setCase: ps.caseSensitive });
          setCurrent(tr, 0);
          tr.scrollIntoView();
          dispatch?.(tr);
          return true;
        },
    };
  },
});