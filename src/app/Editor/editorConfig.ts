/**
 * Editor engine configuration — wires Tiptap 3 + all free extensions into a
 * single reusable factory.
 */
import StarterKit from "@tiptap/starter-kit";
import { BulletList, OrderedList } from "@tiptap/extension-list";
import { mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { CharacterCount } from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { PageBreak } from "./extensions/PageBreak";
import { PageNumber } from "./extensions/PageNumber";
import { DropCap } from "./extensions/DropCap";
import { TextBox } from "./extensions/TextBox";
import { Equation } from "./extensions/Equation";
import { WordArt } from "./extensions/WordArt";
import { LayoutBreak } from "./extensions/LayoutBreak";
import { Spacing } from "./extensions/Spacing";
import { FontSize } from "./extensions/FontSize";
import { LineHeight } from "./extensions/LineHeight";
import { TextIndent } from "./extensions/TextIndent";
import { FindReplace } from "./extensions/FindReplace";
import { TrackInsert, TrackDelete, ReviewChanges } from "./extensions/ReviewChanges";
import { CommentMark, Comments } from "./extensions/Comment";
import { SpellCheck } from "./extensions/SpellCheck";
import { Footnote } from "./extensions/Footnote";
import { Citation } from "./extensions/Citation";

/** Attributes applied to the editable ProseMirror element. */
export const editorAttributes = {
  class:
    "brit-content focus:outline-none min-h-[24in] text-[16px] leading-6 text-slate-900",
  spellcheck: "true",
} as const;

/**
 * The extension list, extracted so it can be unit-tested without a DOM.
 * Tiptap v3's StarterKit already ships Link + Underline + TrailingNode +
 * UndoRedo, so those are configured through it rather than re-registered.
 */
export function createEditorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      underline: {},
      bulletList: false,
      orderedList: false,
    }),
    // Extend BulletList with Word-style marker types (disc / circle / square).
    // StarterKit's own BulletList is disabled above; this extended one replaces it.
    BulletList.configure({}).extend({
      addAttributes() {
        return {
          type: {
            default: "disc",
            parseHTML: (element) => element.style.listStyleType || "disc",
            renderHTML: (attributes) =>
              attributes.type && attributes.type !== "disc"
                ? { style: `list-style-type: ${attributes.type}` }
                : {},
          },
        };
      },
    }),
    // Ordered list with Word-style number types (1 / a / A / i / I).
    // CSS attribute selectors like [type="a"] are case-insensitive in HTML and
    // would collide between "a" and "A", so the marker style is emitted as an
    // inline style instead of relying on the HTML `type` attribute.
    OrderedList.configure({}).extend({
      renderHTML({ HTMLAttributes }) {
        const { start, type, style, ...rest } = HTMLAttributes;
        const markerStyles: Record<string, string> = {
          a: "lower-alpha",
          A: "upper-alpha",
          i: "lower-roman",
          I: "upper-roman",
          "1": "decimal",
        };
        const css = type ? (markerStyles[type as string] ?? "decimal") : null;
        const merged = mergeAttributes(this.options.HTMLAttributes, rest);
        if (start !== 1) merged.start = start;
        if (css) merged.style = [style ?? "", `list-style-type: ${css}`].filter(Boolean).join(";");
        return ["ol", merged, 0];
      },
    }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    // Image carries a `style` attribute so the Layout tab's Arrange group can
    // wrap / float / rotate a selected picture via inline CSS.
    Image.configure({ inline: false, allowBase64: true }).extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          style: {
            default: null,
            parseHTML: (element) => element.getAttribute("style"),
            renderHTML: (attributes) => (attributes.style ? { style: attributes.style } : {}),
          },
        };
      },
    }),
    Table.configure({ resizable: false, allowTableNodeSelection: true }),
    TableRow,
    TableHeader,
    TableCell,
    Highlight.configure({ multicolor: true }),
    Subscript,
    Superscript,
    TextStyle,
    Color,
    FontFamily,
    FontSize,
    LineHeight,
    PageBreak,
    PageNumber,
    DropCap,
    TextBox,
    Equation,
    WordArt,
    LayoutBreak,
    Spacing,
    TextIndent,
    FindReplace,
    SpellCheck,
    TrackInsert,
    TrackDelete,
    ReviewChanges,
    CommentMark,
    Comments,
    Footnote,
    Citation,
    CharacterCount,
  ];
}

/** pt → px conversion used by the font-size dropdown. */
export function ptToPx(pt: number): string {
  return `${Math.round(pt * (4 / 3))}px`;
}