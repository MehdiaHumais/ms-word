/**
 * DropCap — a mark that renders the wrapped text (Word's dropped capital) as a
 * large floated letter at the start of a paragraph. The command applies it to
 * the first character of the paragraph at the cursor.
 */
import { Mark, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    dropCap: {
      setDropCap: () => ReturnType;
      unsetDropCap: () => ReturnType;
      toggleDropCap: () => ReturnType;
    };
  }
}

export const DropCap = Mark.create({
  name: "dropCap",
  inclusive: false,

  addAttributes() {
    return {};
  },

  parseHTML() {
    return [{ tag: "span.brit-dropcap" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "brit-dropcap" }), 0];
  },

  addCommands() {
    return {
      setDropCap:
        () =>
        ({ editor, tr, dispatch }) => {
          const { state } = editor;
          const $pos = state.doc.resolve(state.selection.from);
          const node = $pos.parent;
          if (!node.isTextblock) return false;
          const start = $pos.start();
          const first = node.firstChild;
          if (!first || !first.isText || !first.text) return false;
          tr.addMark(start, start + 1, state.schema.marks.dropCap.create());
          dispatch?.(tr);
          return true;
        },

      unsetDropCap:
        () =>
        ({ editor, tr, dispatch }) => {
          const { state } = editor;
          const $pos = state.doc.resolve(state.selection.from);
          const node = $pos.parent;
          if (!node.isTextblock) return false;
          const start = $pos.start();
          const first = node.firstChild;
          if (!first || !first.isText || !first.text) return false;
          tr.removeMark(start, start + first.nodeSize, state.schema.marks.dropCap);
          dispatch?.(tr);
          return true;
        },

      toggleDropCap:
        () =>
        ({ state, dispatch }) => {
          const $pos = state.doc.resolve(state.selection.from);
          const first = $pos.parent.firstChild;
          const active = !!first?.isText && first.marks.some((m) => m.type.name === "dropCap");

          const node = $pos.parent;
          if (!node.isTextblock) return false;
          const start = $pos.start();
          const firstChild = node.firstChild;
          if (!firstChild || !firstChild.isText || !firstChild.text) return false;

          const tr = state.tr;
          if (active) {
            tr.removeMark(start, start + firstChild.nodeSize, state.schema.marks.dropCap);
          } else {
            tr.addMark(start, start + 1, state.schema.marks.dropCap.create());
          }
          dispatch?.(tr);
          return true;
        },
    };
  },
});