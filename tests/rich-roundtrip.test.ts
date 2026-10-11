import { describe, expect, it } from "vitest";
import { importBritdoc } from "../src/app/Editor/britdoc";
import { parseBritDocument } from "../src/domain/document-model";

/**
 * The `.britdoc` fixture used by `save-e2e.cjs` (TEST 4). It is written by hand
 * and exercises every block the editor can produce. If `importBritdoc` refuses
 * it, opening the file in the app yields an EMPTY document — the exact bug
 * this whole exercise is about.
 */
const RICH = {
  format: "britdoc",
  schemaVersion: 1,
  appVersion: "0.1.0",
  createdAt: "2026-01-01T00:00:00.000Z",
  modifiedAt: "2026-01-01T00:00:00.000Z",
  meta: { title: "Rich", language: "en-US", template: "default", thumbnail: null },
  page: {
    size: "Letter",
    orientation: "landscape",
    margins: { top: "72pt", right: "72pt", bottom: "72pt", left: "72pt" },
    headerDistance: "36pt",
    footerDistance: "36pt",
  },
  doc: {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "alpha" }] },
      {
        type: "blockquote",
        content: [{ type: "paragraph", content: [{ type: "text", text: "quoted" }] }],
      },
      { type: "codeBlock", content: [{ type: "text", text: "code()" }] },
      { type: "equation", attrs: { latex: "x^2" } },
      {
        type: "textBox",
        content: [{ type: "paragraph", content: [{ type: "text", text: "boxed" }] }],
      },
      { type: "layoutBreak" },
      { type: "horizontalRule" },
      { type: "pageBreak" },
      {
        type: "table",
        content: [
          {
            type: "tableRow",
            content: [
              {
                type: "tableHeader",
                attrs: { colspan: 1, rowspan: 1 },
                content: [{ type: "paragraph", content: [{ type: "text", text: "H" }] }],
              },
            ],
          },
          {
            type: "tableRow",
            content: [
              {
                type: "tableCell",
                attrs: { colspan: 1, rowspan: 1 },
                content: [{ type: "paragraph", content: [{ type: "text", text: "C" }] }],
              },
            ],
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "styled",
            marks: [{ type: "bold" }, { type: "textStyle", attrs: { color: "#ff0000" } }],
          },
        ],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "tracked", marks: [{ type: "trackInsert" }] }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "cap", marks: [{ type: "dropCap" }] }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "cited" },
          { type: "citation", attrs: { id: "c1", label: "[1]" } },
        ],
      },
    ],
  },
};

describe("a rich .britdoc actually reopens", () => {
  const source = JSON.stringify(RICH, null, 2);

  it("passes envelope validation", () => {
    const parsed = parseBritDocument(source);
    expect(parsed.errors).toEqual([]);
    expect(parsed.ok).toBe(true);
  });

  it("importBritdoc returns the document rather than an error", () => {
    const result = importBritdoc(source, "Rich.britdoc");
    if (!result.ok) {
      throw new Error(`import failed: ${result.errors.join(" | ")}`);
    }
    expect(result.ok).toBe(true);
  });

  it("keeps every block the editor produced", () => {
    const result = importBritdoc(source, "Rich.britdoc");
    if (!result.ok) throw new Error(result.errors.join(" | "));
    const doc = JSON.parse(result.json);
    const types = new Set<string>();
    (function walk(n: { type: string; content?: unknown[] }) {
      types.add(n.type);
      (n.content ?? []).forEach((c) => walk(c as { type: string; content?: unknown[] }));
    })(doc);
    for (const t of [
      "paragraph",
      "blockquote",
      "codeBlock",
      "equation",
      "textBox",
      "layoutBreak",
      "horizontalRule",
      "pageBreak",
      "table",
      "tableHeader",
      "tableCell",
      "citation",
    ]) {
      expect(types.has(t)).toBe(true);
    }
  });

  it("preserves the page setup", () => {
    const result = importBritdoc(source, "Rich.britdoc");
    if (!result.ok) throw new Error(result.errors.join(" | "));
    expect(result.page.size).toBe("letter");
    expect(result.page.orientation).toBe("landscape");
  });
});
