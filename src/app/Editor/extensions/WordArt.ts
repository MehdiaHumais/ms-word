/**
 * WordArt — a mark that gives selected text the Word "WordArt" treatment:
 * large, bold, gradient-filled letters. A few preset fills are offered in the
 * Insert tab's WordArt gallery.
 */
import { Mark, mergeAttributes } from "@tiptap/core";

export interface WordArtOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    wordArt: {
      setWordArt: (style: string) => ReturnType;
      unsetWordArt: () => ReturnType;
    };
  }
}

export const WordArt = Mark.create<WordArtOptions>({
  name: "wordArt",

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      style: { default: "rainbow" },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-word-art]" }];
  },

  renderHTML({ HTMLAttributes, mark }) {
    const style = (mark.attrs.style as string) || "rainbow";
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-word-art": style,
        class: `brit-word-art brit-word-art-${style}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setWordArt:
        (style) =>
        ({ commands }) =>
          commands.toggleMark(this.name, { style }),
      unsetWordArt:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});