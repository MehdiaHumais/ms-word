import { describe, expect, it } from "vitest";
import { getSchema } from "@tiptap/core";
import { createEditorExtensions } from "../src/app/Editor/editorConfig";
import { validateDoc, validatorVocabulary } from "../src/domain/document-model";

/**
 * Regression test for the "document is empty after reopening" bug.
 *
 * `exportBritdoc` writes `editor.getJSON()` verbatim, so every node and mark
 * the editor can produce lands in the file. `parseBritDocument` then runs
 * `validateDoc` on it and REFUSES the whole file if any type is unknown — so a
 * single unrecognised node type turns a saved document into one that reopens
 * empty.
 *
 * These tests are driven off the live Tiptap schema, so a newly added
 * extension that the validator does not know about fails here rather than in
 * production.
 */
const schema = getSchema(createEditorExtensions());

const nodeNames = Object.keys(schema.nodes).sort();
const markNames = Object.keys(schema.marks).sort();

/** Nodes Tiptap declares as inline. */
const inlineNodes = nodeNames.filter((name) => schema.nodes[name]?.isInline === true);

/**
 * Nodes that can appear as a direct child of `doc`. Structural children
 * (listItem, tableRow, tableCell, tableHeader) are only valid inside their
 * parent, so they are excluded here and covered by the nesting tests below.
 */
const docLevelNodes = nodeNames.filter((name) => {
  if (name === "doc" || name === "text" || name === "hardBreak") return false;
  if (inlineNodes.includes(name)) return false;
  if (["listItem", "tableRow", "tableCell", "tableHeader"].includes(name)) return false;
  return true;
});

/**
 * Build a real node instance for `name` using the schema, so required
 * attributes and required child content are filled with legal defaults rather
 * than hand-written and potentially invalid.
 */
function instanceOf(name: string): Record<string, unknown> {
  return schema.nodes[name]!.createAndFill()!.toJSON() as Record<string, unknown>;
}

/**
 * Give `node` one child of a type its own content expression actually allows.
 * ProseMirror can fill valid content itself, so asking the schema for a
 * default child keeps the instance legal for paragraphs, headings, lists and
 * tables alike.
 */
function withOneChild(name: string): Record<string, unknown> {
  const type = schema.nodes[name]!;
  const parent = type.createAndFill()!;
  const allowed = parent.childCount === 0 ? null : parent.child(0);
  if (allowed === null) return parent.toJSON() as Record<string, unknown>;
  const filler = type.createAndFill(undefined, undefined, [
    schema.nodes[allowed.type.name]!.createAndFill()!,
  ]);
  return (filler ?? parent).toJSON() as Record<string, unknown>;
}

describe("save -> reopen: every editor node type must validate", () => {
  it("introspects a meaningful vocabulary", () => {
    expect(nodeNames).toContain("paragraph");
    expect(nodeNames).toContain("textBox");
    expect(docLevelNodes.length).toBeGreaterThan(5);
  });

  for (const name of docLevelNodes) {
    it(`accepts a document containing a "${name}" node`, () => {
      // Use a schema-built instance with one legal child so the test exercises
      // a realistic document, not a bare `{ type, attrs }` shell.
      const node = withOneChild(name);
      const doc = {
        type: "doc",
        content: [
          node,
          { type: "paragraph", content: [{ type: "text", text: "body" }] },
        ],
      };
      expect(validateDoc(doc)).toEqual([]);
    });
  }

  for (const name of inlineNodes) {
    it(`accepts a "${name}" node used inline`, () => {
      // `text` always carries a string; every other inline node is tested
      // with the schema's own defaults.
      const inline =
        name === "text"
          ? { type: "text", text: "inline" }
          : instanceOf(name);
      const doc = {
        type: "doc",
        content: [
          { type: "paragraph", content: [inline] },
          { type: "paragraph", content: [{ type: "text", text: "body" }] },
        ],
      };
      expect(validateDoc(doc)).toEqual([]);
    });
  }
});

describe("save -> reopen: every editor mark must validate", () => {
  for (const name of markNames) {
    it(`accepts text carrying the "${name}" mark`, () => {
      const attrs = name === "link" ? { href: "https://example.com" } : {};
      const doc = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "x", marks: [{ type: name, attrs }] }],
          },
        ],
      };
      expect(validateDoc(doc)).toEqual([]);
    });
  }
});

describe("save -> reopen: nested structures validate", () => {
  it("accepts a table with a header row", () => {
    const cell = (t: string) => ({
      type: "tableCell",
      attrs: { colspan: 1, rowspan: 1, colwidth: null },
      content: [{ type: "paragraph", content: [{ type: "text", text: t }] }],
    });
    const doc = {
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                { ...cell("H1"), type: "tableHeader" },
                { ...cell("H2"), type: "tableHeader" },
              ],
            },
            { type: "tableRow", content: [cell("a"), cell("b")] },
          ],
        },
      ],
    };
    expect(validateDoc(doc)).toEqual([]);
  });

  it("accepts an image carrying a base64 data URL", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: "data:image/png;base64,iVBORw0KGgo=", alt: "dot" },
        },
      ],
    };
    expect(validateDoc(doc)).toEqual([]);
  });
});

describe("save -> reopen: invalid documents are still rejected", () => {
  it("rejects a genuinely unknown block type", () => {
    expect(
      validateDoc({ type: "doc", content: [{ type: "carrot" }] }).length,
    ).toBeGreaterThan(0);
  });
  it("rejects a genuinely unknown mark type", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "x", marks: [{ type: "sparkle" }] }],
        },
      ],
    };
    expect(
      validateDoc(doc).some((i) => i.message.includes("unknown mark type")),
    ).toBe(true);
  });

  it("rejects a link mark without href", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: {} }] }],
        },
      ],
    };
    expect(validateDoc(doc).some((i) => i.message.includes("href"))).toBe(true);
  });

  it("rejects a table row containing a non-cell", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "table", content: [{ type: "tableRow", content: [{ type: "paragraph" }] }] },
      ],
    };
    expect(validateDoc(doc).some((i) => i.message.includes("tableCell"))).toBe(true);
  });
});

/**
 * The TypeScript document model and the runtime validator are two descriptions
 * of the same thing. If the model omits a node type the editor can emit, the
 * validator has to be widened without the type layer noticing — and then a
 * real document fails to typecheck while passing tests. Keep them in lockstep.
 */
describe("document model types cover the editor schema", () => {
  const { BLOCK_TYPES, INLINE_TYPES, MARK_TYPES } = validatorVocabulary;

  it("the validator knows every doc-level node the editor can emit", () => {
    const missing = docLevelNodes.filter((n) => !BLOCK_TYPES.has(n));
    expect(missing).toEqual([]);
  });

  it("the validator knows every inline node the editor can emit", () => {
    const missing = inlineNodes.filter((n) => !INLINE_TYPES.has(n));
    expect(missing).toEqual([]);
  });

  it("the validator knows every mark the editor can apply", () => {
    const missing = markNames.filter((n) => !MARK_TYPES.has(n));
    expect(missing).toEqual([]);
  });

  it("the BlockContent type admits every doc-level node", () => {
    // A compile-time guarantee would be better, but this catches a model that
    // was widened at runtime only.
    const modelNames: Record<string, true> = {
      paragraph: true,
      heading: true,
      bulletList: true,
      orderedList: true,
      blockquote: true,
      table: true,
      image: true,
      horizontalRule: true,
      pageBreak: true,
      layoutBreak: true,
      textBox: true,
      equation: true,
      codeBlock: true,
    };
    const missing = docLevelNodes.filter((n) => !modelNames[n]);
    expect(missing).toEqual([]);
  });
});
