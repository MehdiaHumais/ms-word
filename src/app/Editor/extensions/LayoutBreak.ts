/**
 * LayoutBreak — Word-style column / section break markers. Rendered as a
 * visible marker in the document (like the page-break divider). Column
 * breaks also force the following content into the next CSS column via
 * `break-before`. A trailing empty paragraph is inserted after the marker so
 * the cursor lands in text (and a repeat click appends a new break).
 */
import { Node } from "@tiptap/core";

export type LayoutBreakKind = "column" | "nextPage" | "continuous" | "evenPage" | "oddPage";

const LABELS: Record<LayoutBreakKind, string> = {
  column: "Column break",
  nextPage: "Next Page Section Break",
  continuous: "Continuous Section Break",
  evenPage: "Even Page Section Break",
  oddPage: "Odd Page Section Break",
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    layoutBreak: {
      insertLayoutBreak: (kind: LayoutBreakKind) => ReturnType;
    };
  }
}

export const LayoutBreak = Node.create({
  name: "layoutBreak",

  group: "block",
  atom: true,

  addAttributes() {
    return {
      kind: {
        default: "continuous",
        parseHTML: (element) => element.getAttribute("data-kind") ?? "continuous",
        renderHTML: (attributes) => ({ "data-kind": attributes.kind ?? "continuous" }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-layout-break]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { ...HTMLAttributes, "data-layout-break": "", class: "brit-layout-break" },
      LABELS[(HTMLAttributes["data-kind"] as LayoutBreakKind) ?? "continuous"] ?? "Section break",
    ];
  },

  addCommands() {
    return {
      insertLayoutBreak:
        (kind) =>
        ({ chain }) =>
          chain()
            .insertContent([
              { type: this.name, attrs: { kind } },
              { type: "paragraph" },
            ])
            .run(),
    };
  },
});