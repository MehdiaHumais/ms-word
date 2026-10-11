/**
 * Footnote / Endnote — an inline atom marker rendered as a superscript
 * number. The note text lives in the reference store; the node keeps a
 * store id + running number so markers stay in sync as notes are added or
 * removed. A small plugin re-numbers all markers in document order.
 */
import { Node } from "@tiptap/core";
import { Plugin, PluginKey, type Transaction } from "@tiptap/pm/state";
import { useRefStore } from "../../../stores/refStore";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    footnote: {
      insertFootnote: (kind?: "footnote" | "endnote") => ReturnType;
    };
  }
}

/**
 * Convert a ProseMirror doc to plain text so the plugin can drop a summary
 * of the numbered notes into the reference store for the dock panel.
 */
export function listFootnoteMarkers(doc: import("@tiptap/pm/model").Node): { id: string; number: number; kind: "footnote" | "endnote" }[] {
  const out: { id: string; number: number; kind: "footnote" | "endnote" }[] = [];
  doc.descendants((node) => {
    if (node.type.name === "footnote") {
      out.push({
        id: node.attrs.id as string,
        number: node.attrs.number as number,
        kind: node.attrs.kind as "footnote" | "endnote",
      });
    }
    return true;
  });
  return out;
}

export const Footnote = Node.create({
  name: "footnote",

  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      id: { default: null },
      kind: { default: "footnote" },
      number: { default: 1 },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-footnote-id]" }];
  },

  renderHTML({ node }) {
    const cls = node.attrs.kind === "endnote" ? "brit-endnote" : "brit-footnote";
    return [
      "span",
      {
        "data-footnote-id": node.attrs.id,
        "data-kind": node.attrs.kind,
        class: `${cls} brit-ref-marker`,
        title: node.attrs.kind === "endnote" ? "Endnote" : "Footnote",
      },
      String(node.attrs.number),
    ];
  },

  addCommands() {
    return {
      insertFootnote:
        (kind = "footnote") =>
        ({ chain, editor }) => {
          const id = useRefStore.getState().addFootnote(kind);
          const number = useRefStore.getState()
            .footnotes.find((f) => f.id === id)?.number ?? 1;
          void editor;
          return chain()
            .insertContent({ type: this.name, attrs: { id, kind, number } })
            .run();
        },
    };
  },

  addProseMirrorPlugins() {
    const key = new PluginKey("footnoteRenumber");
    return [
      new Plugin({
        key,
        appendTransaction(transactions, _oldState, newState) {
          const docChanged = transactions.some((tr) => tr.docChanged);
          if (!docChanged) return null;
          let tr: Transaction | null = null;
          let n = 0;
          newState.doc.descendants((node, pos) => {
            if (node.type.name !== "footnote") return true;
            n += 1;
            if (node.attrs.number !== n) {
              if (!tr) tr = newState.tr;
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, number: n });
            }
            return true;
          });
          return tr;
        },
      }),
    ];
  },
});