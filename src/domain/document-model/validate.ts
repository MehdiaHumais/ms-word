/**
 * Validation for the BritDocs document model (schema v1).
 *
 * Enforces the structural contract from `docs/document-schema.md`:
 * - correct node/mark `type` values
 * - correct parent/child relationships
 * - required attrs present with legal values
 *
 * Validators never mutate; they return a list of `ValidationIssue`s.
 */
import type {
  BlockContent,
  DocNode,
  InlineNode,
  TextAlign,
  TextNode,
} from "./types";

export interface ValidationIssue {
  path: string;
  message: string;
}

/**
 * Node and mark vocabulary, derived from the live Tiptap schema
 * (`getSchema(createEditorExtensions())`).
 *
 * This list MUST stay in sync with the editor. `exportBritdoc` writes
 * `editor.getJSON()` verbatim, so any node or mark the editor can produce also
 * lands in the file. If the validator then rejects that type, `importBritdoc`
 * refuses the file and the document reopens EMPTY — which is exactly the
 * "content is missing after reopening" failure. `tests/document-model.test.ts`
 * asserts this schema is covered.
 */
const BLOCK_TYPES: ReadonlySet<string> = new Set([
  "blockquote",
  "bulletList",
  "codeBlock",
  "equation",
  "heading",
  "horizontalRule",
  "image",
  "layoutBreak",
  "orderedList",
  "pageBreak",
  "paragraph",
  "table",
  "textBox",
]);

const INLINE_TYPES: ReadonlySet<string> = new Set([
  "citation",
  "footnote",
  "hardBreak",
  "pageNumber",
  "text",
]);

/** Marks the editor can apply to text. */
const MARK_TYPES: ReadonlySet<string> = new Set([
  "bold",
  "code",
  "comment",
  "dropCap",
  "highlight",
  "italic",
  "link",
  "strike",
  "subscript",
  "superscript",
  "textStyle",
  "trackDelete",
  "trackInsert",
  "underline",
  "wordArt",
]);

/** Cell node types allowed inside a `tableRow`. */
const TABLE_CELL_TYPES: ReadonlySet<string> = new Set(["tableCell", "tableHeader"]);

/** Exported so tests can assert the validator matches the live Tiptap schema. */
export const validatorVocabulary = {
  BLOCK_TYPES,
  INLINE_TYPES,
  MARK_TYPES,
  TABLE_CELL_TYPES,
};

function isTextAlign(v: unknown): v is TextAlign {
  return (
    v === "left" || v === "center" || v === "right" || v === "justify"
  );
}

function isNumberOrLineHeight(v: unknown): boolean {
  return typeof v === "number" || typeof v === "string";
}

function isInlineNode(v: unknown): v is InlineNode {
  if (typeof v !== "object" || v === null) return false;
  const node = v as { type?: unknown };
  return typeof node.type === "string" && INLINE_TYPES.has(node.type);
}

function isBlock(v: unknown): v is BlockContent {
  if (typeof v !== "object" || v === null) return false;
  const type = (v as { type?: unknown }).type;
  return typeof type === "string" && BLOCK_TYPES.has(type);
}

// ---------- Text & marks ----------

function validateMarks(textNode: TextNode, issues: ValidationIssue[], path: string): void {
  if (!Array.isArray(textNode.marks)) return;
  textNode.marks.forEach((mark, i) => {
    const p = `${path}.marks[${i}]`;
    const type = (mark as { type?: unknown }).type;
    if (typeof type !== "string" || !MARK_TYPES.has(type)) {
      issues.push({ path: p, message: `unknown mark type "${String(type)}"` });
      return;
    }
    if (type === "link") {
      const link = mark as unknown as { attrs?: { href?: unknown } };
      if (typeof link.attrs?.href !== "string" || link.attrs.href.length === 0) {
        issues.push({ path: p, message: "link mark requires a non-empty href" });
      }
    }
  });
}

function validateInlineContent(
  content: unknown,
  issues: ValidationIssue[],
  path: string,
): void {
  if (content === undefined) return;
  if (!Array.isArray(content)) {
    issues.push({ path, message: "inline content must be an array" });
    return;
  }
  content.forEach((node, i) => {
    const p = `${path}[${i}]`;
    if (!isInlineNode(node)) {
      issues.push({
        path: p,
        message: `invalid inline node (${JSON.stringify((node as { type?: unknown })?.type)})`,
      });
      return;
    }
    if (node.type === "text") {
      if (typeof node.text !== "string") {
        issues.push({ path: p, message: "text node requires a string 'text'" });
      }
      validateMarks(node, issues, p);
    }
  });
}

// ---------- Blocks ----------

function validateParagraph(
  node: Record<string, unknown>,
  issues: ValidationIssue[],
  path: string,
): void {
  const attrs = node.attrs as Record<string, unknown> | undefined;
  if (attrs) {
    // Tiptap serialises "no value" as null for these optional attributes, so
    // null has to be treated as absent — otherwise a document written by
    // BritDocs itself would fail validation and refuse to reopen.
    if (attrs.textAlign != null && !isTextAlign(attrs.textAlign)) {
      issues.push({ path: `${path}.attrs.textAlign`, message: "invalid textAlign" });
    }
    if (attrs.lineHeight != null && !isNumberOrLineHeight(attrs.lineHeight)) {
      issues.push({ path: `${path}.attrs.lineHeight`, message: "invalid lineHeight" });
    }
    if (attrs.indent != null && typeof attrs.indent !== "number" && typeof attrs.indent !== "string") {
      issues.push({ path: `${path}.attrs.indent`, message: "indent must be a number or string" });
    }
  }
  validateInlineContent(node.content, issues, path);
}

function validateHeading(
  node: Record<string, unknown>,
  issues: ValidationIssue[],
  path: string,
): void {
  const attrs = node.attrs as { level?: unknown } | undefined;
  const level = attrs?.level;
  if (level !== 1 && level !== 2 && level !== 3) {
    issues.push({ path, message: "heading requires level 1, 2, or 3" });
  }
  validateInlineContent(node.content, issues, path);
}

function validateBlockContainer(
  node: Record<string, unknown>,
  issues: ValidationIssue[],
  path: string,
): void {
  const content = node.content;
  // Tiptap omits `content` entirely for an empty container (a freshly inserted
  // code block or text box serialises as `{ type, attrs }` with no children).
  // That is legitimate editor output, so only a non-array `content` is an error.
  if (content === undefined || content === null) return;
  if (!Array.isArray(content)) {
    issues.push({ path, message: "block container requires a content array" });
    return;
  }
  content.forEach((child, i) => {
    const p = `${path}.content[${i}]`;
    if (!isBlock(child)) {
      issues.push({ path: p, message: "invalid block child" });
      return;
    }
    validateBlock(child, issues, p);
  });
}

function validateList(
  node: Record<string, unknown>,
  issues: ValidationIssue[],
  path: string,
): void {
  const content = node.content;
  // An empty list legitimately serialises without a content array.
  if (content === undefined || content === null) return;
  if (!Array.isArray(content)) {
    issues.push({ path, message: "list requires a content array of listItems" });
    return;
  }
  content.forEach((item, i) => {
    const p = `${path}.content[${i}]`;
    if (typeof item !== "object" || item === null || (item as { type?: unknown }).type !== "listItem") {
      issues.push({ path: p, message: "list children must be listItem" });
      return;
    }
    const itemContent = (item as { content?: unknown }).content;
    if (itemContent === undefined || itemContent === null) return;
    if (!Array.isArray(itemContent)) {
      issues.push({ path: p, message: "listItem requires a content array" });
      return;
    }
    itemContent.forEach((child, j) => {
      const cp = `${p}.content[${j}]`;
      if (!isBlock(child)) {
        issues.push({ path: cp, message: "invalid block child in listItem" });
        return;
      }
      validateBlock(child, issues, cp);
    });
  });
}

function validateTable(
  node: Record<string, unknown>,
  issues: ValidationIssue[],
  path: string,
): void {
  const content = node.content;
  // A table with no rows yet legitimately serialises without a content array.
  if (content === undefined || content === null) return;
  if (!Array.isArray(content)) {
    issues.push({ path, message: "table requires a content array of rows" });
    return;
  }
  content.forEach((row, i) => {
    const p = `${path}.content[${i}]`;
    if (typeof row !== "object" || row === null || (row as { type?: unknown }).type !== "tableRow") {
      issues.push({ path: p, message: "table children must be tableRow" });
      return;
    }
    const cells = (row as { content?: unknown }).content;
    if (cells === undefined || cells === null) return;
    if (!Array.isArray(cells)) {
      issues.push({ path: p, message: "tableRow requires a content array of cells" });
      return;
    }
    cells.forEach((cell, j) => {
      const cp = `${p}.content[${j}]`;
      const cellType =
        typeof cell === "object" && cell !== null
          ? (cell as { type?: unknown }).type
          : undefined;
      if (typeof cellType !== "string" || !TABLE_CELL_TYPES.has(cellType)) {
        issues.push({ path: cp, message: "tableRow children must be tableCell" });
        return;
      }
      const attrs = (cell as Record<string, unknown>).attrs as Record<string, unknown> | undefined;
      if (attrs) {
        for (const key of ["colspan", "rowspan"] as const) {
          const v = attrs[key];
          if (v != null && (typeof v !== "number" || !Number.isInteger(v) || v < 1)) {
            issues.push({ path: `${cp}.attrs.${key}`, message: `${key} must be a positive integer` });
          }
        }
        if (attrs.colwidth != null && !Array.isArray(attrs.colwidth)) {
          issues.push({ path: `${cp}.attrs.colwidth`, message: "colwidth must be an array" });
        }
      }
      validateBlockContainer(cell as Record<string, unknown>, issues, cp);
    });
  });
}

function validateImage(
  node: Record<string, unknown>,
  issues: ValidationIssue[],
  path: string,
): void {
  const attrs = node.attrs as { src?: unknown } | undefined;
  const src = attrs?.src;
  // A null/absent src is "unset", consistent with every other Tiptap
  // attribute. Only a src that is present but not a usable string is invalid.
  if (src == null) return;
  if (typeof src !== "string" || src.length === 0) {
    issues.push({ path, message: "image requires a non-empty attrs.src" });
  }
}

// ---------- Dispatch ----------

function validateBlock(node: BlockContent, issues: ValidationIssue[], path: string): void {
  const raw = node as unknown as Record<string, unknown>;
  switch (node.type) {
    case "paragraph":
      validateParagraph(raw, issues, path);
      break;
    case "heading":
      validateHeading(raw, issues, path);
      break;
    case "bulletList":
    case "orderedList":
      validateList(raw, issues, path);
      break;
    case "blockquote":
      validateBlockContainer(raw, issues, path);
      break;
    case "table":
      validateTable(raw, issues, path);
      break;
    case "image":
      validateImage(raw, issues, path);
      break;
    case "horizontalRule":
    case "pageBreak":
    case "layoutBreak":
      break;
    // These hold inline content, per their ProseMirror specs (text*).
    case "codeBlock":
    case "equation":
      validateInlineContent(raw.content, issues, path);
      break;
    // This one holds block content (paragraph+).
    case "textBox":
      validateBlockContainer(raw, issues, path);
      break;
    default: {
      // Unreachable while BLOCK_TYPES and this switch agree, but a mismatch
      // between the two must fail loudly rather than silently accept.
      const impossible = node as { type?: string };
      issues.push({ path, message: `unknown block type "${impossible.type}"` });
    }
  }
}

export function validateDoc(node: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (typeof node !== "object" || node === null) {
    return [{ path: "doc", message: "doc must be an object" }];
  }
  const root = node as Record<string, unknown>;
  if (root.type !== "doc") {
    return [{ path: "doc", message: "root node must have type \"doc\"" }];
  }
  const content = root.content;
  if (!Array.isArray(content)) {
    return [{ path: "doc", message: "doc requires a content array" }];
  }
  content.forEach((child, i) => {
    const p = `doc.content[${i}]`;
    if (!isBlock(child)) {
      issues.push({ path: p, message: "invalid block child at doc root" });
      return;
    }
    validateBlock(child, issues, p);
  });
  return issues;
}

export function isValidDoc(node: unknown): boolean {
  return validateDoc(node).length === 0;
}

/** Convenience: run the full envelope-level document check. */
export function validateEnvelopeDoc(doc: DocNode): ValidationIssue[] {
  return validateDoc(doc);
}