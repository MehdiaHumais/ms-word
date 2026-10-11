/**
 * Spacing — paragraph-level space-before / space-after margins, as set from
 * the Layout tab's Paragraph group. Values are emitted in CSS units (pt).
 */
import { Extension } from "@tiptap/core";

export const Spacing = Extension.create({
  name: "spacing",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          spaceBefore: {
            default: null,
            parseHTML: (element) => element.style.marginTop || null,
            renderHTML: (attributes) =>
              attributes.spaceBefore ? { style: `margin-top: ${attributes.spaceBefore}` } : {},
          },
          spaceAfter: {
            default: null,
            parseHTML: (element) => element.style.marginBottom || null,
            renderHTML: (attributes) =>
              attributes.spaceAfter ? { style: `margin-bottom: ${attributes.spaceAfter}` } : {},
          },
          suppressLineNum: {
            default: null,
            parseHTML: (element) => element.classList.contains("brit-no-linenum") || null,
            renderHTML: (attributes) =>
              attributes.suppressLineNum ? { class: "brit-no-linenum" } : {},
          },
        },
      },
    ];
  },
});