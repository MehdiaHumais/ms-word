/**
 * Citation — an inline atom marker that renders the formatted source text.
 * Holds the source id + rendered text so it displays reliably; a
 * `refreshCitations` command re-syncs all markers after source edits.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { useRefStore, formatSource, type Source } from "../../../stores/refStore";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    citation: {
      insertCitation: (sourceId?: string) => ReturnType;
      insertBibliography: () => ReturnType;
      refreshCitations: () => ReturnType;
    };
  }
}

export function sourceLabel(s: Source): string {
  return formatSource(s);
}

/** Word-style short citation "({Author surname}, {year})". */
export function shortCitation(s: Source): string {
  const author = s.author.split(",")[0]?.trim() ?? s.author;
  return `(${author}, ${s.year})`;
}

export function citationText(sourceId: string | null | undefined): string {
  const source = useRefStore.getState().sources.find((s) => s.id === sourceId);
  return source ? shortCitation(source) : "(Citation)";
}

export const Citation = Node.create({
  name: "citation",

  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      sourceId: { default: null },
      text: { default: "(Citation)" },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-source-id]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const source = useRefStore.getState().sources.find(
      (s) => s.id === node.attrs.sourceId,
    );
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-source-id": node.attrs.sourceId,
        class: "brit-citation",
        title: source ? sourceLabel(source) : "Citation",
      }),
      node.attrs.text || (source ? shortCitation(source) : "(Citation)"),
    ];
  },

  addCommands() {
    return {
      insertCitation:
        (sourceId?) =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: this.name,
              attrs: { sourceId, text: citationText(sourceId) },
            })
            .run(),
      insertBibliography:
        () =>
        ({ chain }) => {
          const store = useRefStore.getState();
          store.bumpCitation();
          const blocks = store.sources.map((s) => ({
            type: "paragraph" as const,
            attrs: { class: "brit-bib-entry" },
            content: [{ type: "text" as const, text: formatSource(s) }],
          }));
          return chain()
            .focus()
            .insertContent([
              { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Bibliography" }] },
              ...blocks,
              { type: "paragraph" },
            ])
            .run();
        },
      refreshCitations:
        () =>
        ({ tr, dispatch }) => {
          const store = useRefStore.getState();
          let changed = false;
          tr.doc.descendants((node, pos) => {
            if (node.type.name === "citation") {
              const text = citationText(node.attrs.sourceId);
              if (text !== node.attrs.text) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, text });
                changed = true;
              }
            }
            return true;
          });
          void store;
          if (changed) tr.setMeta("britRefRefresh", true);
          dispatch?.(tr);
          return true;
        },
    };
  },
});