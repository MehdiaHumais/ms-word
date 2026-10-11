/**
 * PageBreak — a leaf node rendered as a Word-style "page break" separator.
 * Visually a dashed line; future pagination (Phase 4) will honor it.
 */
import { Node } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageBreak: {
      insertPageBreak: () => ReturnType;
    };
  }
}

export const PageBreak = Node.create({
  name: "pageBreak",

  group: "block",
  atom: true,

  parseHTML() {
    return [{ tag: "div[data-page-break]" }];
  },

  renderHTML() {
    return [
      "div",
      { "data-page-break": "true", class: "brit-page-break" },
      "\u2014 Page break \u2014",
    ];
  },

addCommands() {
    return {
      insertPageBreak:
        () =>
        ({ chain }) =>
          // Insert an empty paragraph after the break so the cursor lands in
          // text; a second click must append a new break, not replace the node.
          chain().insertContent([{ type: this.name }, { type: "paragraph" }]).run(),
    };
  },
});