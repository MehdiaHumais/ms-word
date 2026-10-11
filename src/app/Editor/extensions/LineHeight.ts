/**
 * LineHeight — a global attribute on paragraph-level blocks that renders
 * `line-height` on the element. Default is "default" (inherited).
 */
import { Extension } from "@tiptap/core";

export type LineHeightOptions = {
  types: string[];
  default: string;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

export const LineHeight = Extension.create<LineHeightOptions>({
  name: "lineHeight",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      default: "default",
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: this.options.default,
            parseHTML: (element) => element.style.lineHeight || this.options.default,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight || attributes.lineHeight === this.options.default) {
                return {};
              }
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight) =>
        ({ commands }) =>
          commands.updateAttributes("paragraph", { lineHeight }),
      unsetLineHeight:
        () =>
        ({ commands }) =>
          commands.resetAttributes("paragraph", "lineHeight"),
    };
  },
});