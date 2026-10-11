/**
 * TextBox — Word's floating-style text box, implemented as a bordered block
 * node whose content can be typed into directly. Clicking the Render tab's
 * "Text Box" button inserts one at the cursor.
 */
import { Node } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textBox: {
      insertTextBox: () => ReturnType;
    };
  }
}

export const TextBox = Node.create({
  name: "textBox",

  group: "block",
  content: "paragraph+",

  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute("style"),
        renderHTML: (attributes) => (attributes.style ? { style: attributes.style } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-text-box]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-text-box": "", class: "brit-text-box" }, 0];
  },

  addCommands() {
    return {
      insertTextBox:
        () =>
        ({ chain }) =>
          chain().insertContent({
            type: this.name,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Text Box — click inside and type." }],
              },
            ],
          }).run(),
    };
  },
});