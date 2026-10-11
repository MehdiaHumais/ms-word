import { describe, expect, it } from "vitest";
import {
  canonicalize,
  createBritDocument,
  emptyDoc,
  isValidDoc,
  parseBritDocument,
  paragraph,
  sampleDoc,
  text,
  validateDoc,
} from "../src/domain/document-model";

describe("document model — build & builders", () => {
  it("builds an empty document", () => {
    expect(isValidDoc(emptyDoc())).toBe(true);
    expect(validateDoc(emptyDoc())).toEqual([]);
  });

  it("builds a valid sample document", () => {
    const doc = sampleDoc();
    expect(isValidDoc(doc)).toBe(true);
    expect(validateDoc(doc)).toEqual([]);
  });

  it("creates a paragraph without content and with content", () => {
    expect(paragraph()).toEqual({ type: "paragraph" });
    expect(paragraph([text("hi")])).toEqual({
      type: "paragraph",
      content: [{ type: "text", text: "hi" }],
    });
  });
});

describe("document model — validation", () => {
  it("rejects unknown block type", () => {
    const issues = validateDoc({
      type: "doc",
      content: [{ type: "carrot" }],
    });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.message).toContain("invalid block child");
  });

  it("rejects a doc root that is not type doc", () => {
    expect(validateDoc({ type: "paragraph" }).length).toBeGreaterThan(0);
  });

  it("rejects heading without a valid level", () => {
    const issues = validateDoc({
      type: "doc",
      content: [{ type: "heading", attrs: { level: 7 }, content: [text("x")] }],
    });
    expect(issues.some((i) => i.message.includes("level"))).toBe(true);
  });

  it("rejects an image whose src is present but unusable", () => {
    // A null/absent src means "unset" (same as every other Tiptap attribute),
    // but a src that is present and not a usable string is invalid.
    expect(
      validateDoc({
        type: "doc",
        content: [{ type: "image", attrs: { src: "" } }],
      }).some((i) => i.message.includes("src")),
    ).toBe(true);
    expect(
      validateDoc({
        type: "doc",
        content: [{ type: "image", attrs: { src: null } }],
      }),
    ).toEqual([]);
  });

  it("rejects a link mark without href", () => {
    const issues = validateDoc({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "x", marks: [{ type: "link", attrs: {} }] },
          ],
        },
      ],
    });
    expect(issues.some((i) => i.message.includes("href"))).toBe(true);
  });

  it("rejects invalid table cell layout", () => {
    const issues = validateDoc({
      type: "doc",
      content: [
        {
          type: "table",
          content: [{ type: "tableRow", content: [{ type: "paragraph" }] }],
        },
      ],
    });
    expect(issues.some((i) => i.message.includes("tableCell"))).toBe(true);
  });

  it("accepts a valid 1x1 table", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            { type: "tableRow", content: [{ type: "tableCell", content: [paragraph([text("cell")])] }] },
          ],
        },
      ],
    };
    expect(isValidDoc(doc)).toBe(true);
  });
});

/**
 * Tiptap serialises "no value" as null for optional attributes. A document
 * written by BritDocs therefore contains null textAlign/lineHeight/indent and
 * null colwidth on table cells, and must still reopen.
 */
describe("document model — Tiptap null attrs", () => {
  it("treats null paragraph attrs as unset", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: {
            indent: null,
            lineHeight: null,
            rightIndent: null,
            spaceAfter: null,
            spaceBefore: null,
            textAlign: null,
          },
          content: [text("null attrs")],
        },
      ],
    };
    expect(validateDoc(doc)).toEqual([]);
  });

  it("accepts string indents written by the TextIndent extension", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "paragraph", attrs: { indent: "48px" }, content: [text("indented")] },
      ],
    };
    expect(validateDoc(doc)).toEqual([]);
  });

  it("treats null table cell attrs as unset", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                {
                  type: "tableCell",
                  attrs: { colspan: 1, rowspan: 1, colwidth: null, background: null },
                  content: [paragraph([text("cell")])],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(validateDoc(doc)).toEqual([]);
  });

  it("still rejects genuinely invalid values", () => {
    expect(
      validateDoc({
        type: "doc",
        content: [{ type: "paragraph", attrs: { textAlign: "sideways" }, content: [text("x")] }],
      }).some((i) => i.message.includes("textAlign")),
    ).toBe(true);
    expect(
      validateDoc({
        type: "doc",
        content: [
          {
            type: "table",
            content: [
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableCell",
                    attrs: { colspan: 0 },
                    content: [paragraph([text("cell")])],
                  },
                ],
              },
            ],
          },
        ],
      }).some((i) => i.message.includes("colspan")),
    ).toBe(true);
  });
});

describe("document model — serialization round-trip", () => {
  it("serializes canonically (stable key order)", () => {
    const a = canonicalize(sampleDoc());
    const b = canonicalize(JSON.parse(JSON.stringify(sampleDoc())));
    expect(a).toBe(b);
  });

  it("round-trips JSON.parse(JSON.stringify) identity", () => {
    const doc = sampleDoc();
    expect(JSON.parse(canonicalize(doc))).toEqual(doc);
  });
});

describe("document envelope — create & parse", () => {
  it("creates a valid envelope", () => {
    const env = createBritDocument(sampleDoc(), {
      appVersion: "0.1.0",
      title: "Test",
      now: "2026-09-16T00:00:00.000Z",
    });
    expect(env.format).toBe("britdoc");
    expect(env.schemaVersion).toBe(1);
    expect(env.meta.title).toBe("Test");
    expect(env.page.size).toBe("A4");
  });

  it("parse(serialize(doc)) round-trips byte-identical", () => {
    const env = createBritDocument(sampleDoc(), {
      appVersion: "0.1.0",
      title: "Test",
      now: "2026-09-16T00:00:00.000Z",
    });
    const source = canonicalize(env);
    const result = parseBritDocument(source);
    expect(result.ok).toBe(true);
    expect(canonicalize(result.document)).toBe(source);
  });

  it("rejects non-JSON input", () => {
    expect(parseBritDocument("not json").ok).toBe(false);
  });

  it("rejects wrong format marker", () => {
    const env = createBritDocument(sampleDoc(), {
      appVersion: "0.1.0",
      now: "2026-09-16T00:00:00.000Z",
    });
    const source = canonicalize({ ...env, format: "docx" });
    const result = parseBritDocument(source);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("format"))).toBe(true);
  });

  it("rejects unsupported future schema versions", () => {
    const env = createBritDocument(sampleDoc(), {
      appVersion: "0.1.0",
      now: "2026-09-16T00:00:00.000Z",
    });
    const source = canonicalize({ ...env, schemaVersion: 999 });
    const result = parseBritDocument(source);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("schemaVersion"))).toBe(true);
  });

  it("rejects structurally invalid documents", () => {
    const env = createBritDocument(sampleDoc(), {
      appVersion: "0.1.0",
      now: "2026-09-16T00:00:00.000Z",
    });
    const broken = { ...env, doc: { type: "doc", content: [{ type: "nope" }] } };
    const result = parseBritDocument(canonicalize(broken));
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});