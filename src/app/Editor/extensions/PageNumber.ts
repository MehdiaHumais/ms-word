/**
 * PageNumber — a Word-style page field. Displays the page the mark currently
 * sits on, computed from the number of PageBreak nodes that precede it (+1).
 * A small plugin re-freshes every number attribute on each transaction, so the
 * fields stay correct as pages are inserted or removed.
 */
import { Node } from "@tiptap/core";
import { Plugin, PluginKey, type Transaction } from "@tiptap/pm/state";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageNumber: {
      insertPageNumber: () => ReturnType;
    };
  }
}

export const PageNumber = Node.create({
  name: "pageNumber",

  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      number: { default: 1 },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-page-number]" }];
  },

  renderHTML({ node }) {
    return [
      "span",
      {
        "data-page-number": String(node.attrs.number),
        class: "brit-page-number",
        title: "Page number (updates automatically)",
      },
      String(node.attrs.number),
    ];
  },

  addCommands() {
    return {
      insertPageNumber:
        () =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs: { number: 1 } }).run(),
    };
  },

  addProseMirrorPlugins() {
    const key = new PluginKey("pageNumberRefresh");
    return [
      new Plugin({
        key,
        appendTransaction(transactions, _oldState, newState) {
          const docChanged = transactions.some((tr) => tr.docChanged);
          if (!docChanged) return null;
          let tr: Transaction | null = null;
          let page = 1;
          newState.doc.descendants((node, pos) => {
            if (node.type.name === "pageBreak") {
              page += 1;
              return false;
            }
            if (node.type.name === "pageNumber") {
              const want = page;
              if (node.attrs.number !== want) {
                if (!tr) tr = newState.tr;
                tr.setNodeMarkup(pos, undefined, { number: want });
              }
            }
            return true;
          });
          return tr;
        },
      }),
    ];
  },
});