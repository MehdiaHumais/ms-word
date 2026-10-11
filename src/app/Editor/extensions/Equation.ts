/**
 * Equation — a Word-style equation line: a centered, math-italic block whose
 * content can be typed into directly (Unicode maths: E = mc², etc.).
 */
import { Node } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    equation: {
      insertEquation: () => ReturnType;
    };
  }
}

export const Equation = Node.create({
  name: "equation",

  group: "block",
  content: "text*",

  parseHTML() {
    return [{ tag: "div[data-equation]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-equation": "", class: "brit-equation" }, 0];
  },

  addCommands() {
    return {
      insertEquation:
        () =>
        ({ chain }) =>
          chain().insertContent({
            type: this.name,
            content: [{ type: "text", text: "E = mc\u00B2" }],
          }).run(),
    };
  },
});