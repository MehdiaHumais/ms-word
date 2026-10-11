/** Convenience builders for documents (used by tests and later the editor). */

import type {
  DocNode,
  InlineNode,
  Mark,
  ParagraphNode,
  TextNode,
} from "./types";

export function emptyDoc(): DocNode {
  return { type: "doc", content: [] };
}

export function text(value: string, marks?: Mark[]): TextNode {
  return marks && marks.length > 0 ? { type: "text", text: value, marks } : { type: "text", text: value };
}

export function paragraph(content?: InlineNode[], attrs?: ParagraphNode["attrs"]): ParagraphNode {
  return content && content.length > 0
    ? { type: "paragraph", ...(attrs ? { attrs } : {}), content }
    : { type: "paragraph", ...(attrs ? { attrs } : {}) };
}

export function sampleDoc(): DocNode {
  return {
    type: "doc",
    content: [
      paragraph([text("Hello, BritDocs!")]),
      // prettier-ignore
      {
        type: "heading",
        attrs: { level: 1 },
        content: [text("Heading 1")],
      },
      paragraph(
        [text("bold text", [{ type: "bold" }])],
        { textAlign: "center", lineHeight: 1.5 },
      ),
    ],
  };
}