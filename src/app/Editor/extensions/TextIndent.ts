import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textIndent: {
      increaseIndent: () => ReturnType;
      decreaseIndent: () => ReturnType;
      resetIndent: () => ReturnType;
    };
    paragraphLayout: {
      setParagraphIndent: (left?: string | null, right?: string | null) => ReturnType;
    };
  }
}

export const TextIndent = Extension.create({
  name: "textIndent",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          indent: {
            default: null,
            parseHTML: (el) => el.style.marginLeft || null,
            renderHTML: (attrs) =>
              attrs.indent ? { style: `margin-left:${attrs.indent}` } : {},
          },
          rightIndent: {
            default: null,
            parseHTML: (el) => el.style.marginRight || null,
            renderHTML: (attrs) =>
              attrs.rightIndent ? { style: `margin-right:${attrs.rightIndent}` } : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      increaseIndent:
        () =>
        ({ state, commands }) => {
          const { $from } = state.selection;
          const node = $from.node($from.depth);
          const cur = parseInt(node?.attrs.indent ?? "0", 10) || 0;
          return commands.updateAttributes("paragraph", {
            indent: `${cur + 48}px`,
          });
        },
      decreaseIndent:
        () =>
        ({ state, commands }) => {
          const { $from } = state.selection;
          const node = $from.node($from.depth);
          const cur = parseInt(node?.attrs.indent ?? "0", 10) || 0;
          if (cur <= 0) return false;
          const next = cur - 48;
          return commands.updateAttributes("paragraph", {
            indent: next > 0 ? `${next}px` : null,
          });
        },
      resetIndent:
        () =>
        ({ commands }) =>
          commands.updateAttributes("paragraph", { indent: null }),
      setParagraphIndent:
        (left, right) =>
        ({ chain, state }) => {
          const { $from } = state.selection;
          const node = $from.node($from.depth);
          if (!node || (node.type.name !== "paragraph" && node.type.name !== "heading")) return false;
          const patch: Record<string, string | null> = {};
          if (left !== undefined) patch.indent = left;
          if (right !== undefined) patch.rightIndent = right;
          return chain().updateAttributes("paragraph", patch).run();
        },
    };
  },
});
