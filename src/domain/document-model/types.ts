/**
 * BritDocs internal document model (schema v1).
 *
 * This mirrors `docs/document-schema.md`. The model is UI-free and pure:
 * it can be validated, serialized, and tested outside any editor engine.
 */

// ---------- Marks (inline formatting) ----------

export type TextAlign = "left" | "center" | "right" | "justify";

export interface BoldMark {
  type: "bold";
}

export interface ItalicMark {
  type: "italic";
}

export interface UnderlineMark {
  type: "underline";
}

export interface StrikeMark {
  type: "strike";
}

export interface SuperscriptMark {
  type: "superscript";
}

export interface SubscriptMark {
  type: "subscript";
}

export interface CodeMark {
  type: "code";
}

export interface LinkMark {
  type: "link";
  attrs: { href: string; title?: string };
}

export interface HighlightMark {
  type: "highlight";
  attrs?: { color?: string };
}

export interface TextStyleMark {
  type: "textStyle";
  attrs?: { fontFamily?: string; fontSize?: string; color?: string };
}

/** First-letter capitalisation. */
export interface DropCapMark {
  type: "dropCap";
  attrs?: { lines?: number };
}

/** Stylised title text. */
export interface WordArtMark {
  type: "wordArt";
  attrs?: { style?: string; fill?: string; stroke?: string };
}

/** Anchored review comment. */
export interface CommentMarkType {
  type: "comment";
  attrs?: { id?: string; author?: string; created?: string };
}

/** Text inserted while Track Changes was on. */
export interface TrackInsertMark {
  type: "trackInsert";
}

/** Text deleted while Track Changes was on. */
export interface TrackDeleteMark {
  type: "trackDelete";
}

export type Mark =
  | BoldMark
  | ItalicMark
  | UnderlineMark
  | StrikeMark
  | SuperscriptMark
  | SubscriptMark
  | CodeMark
  | LinkMark
  | HighlightMark
  | TextStyleMark
  | DropCapMark
  | WordArtMark
  | CommentMarkType
  | TrackInsertMark
  | TrackDeleteMark;

// ---------- Inline nodes ----------

export interface TextNode {
  type: "text";
  text: string;
  marks?: Mark[];
}

export interface HardBreakNode {
  type: "hardBreak";
}

/** Footnote reference / body marker. */
export interface FootnoteNode {
  type: "footnote";
  attrs?: { id?: string; label?: string };
}

/** In-text citation marker. */
export interface CitationNode {
  type: "citation";
  attrs?: { id?: string; label?: string };
}

/** Field that renders the page number. */
export interface PageNumberNode {
  type: "pageNumber";
  attrs?: { align?: string | null };
}

export type InlineNode =
  | TextNode
  | HardBreakNode
  | FootnoteNode
  | CitationNode
  | PageNumberNode;

// ---------- Block attrs ----------

export interface ParagraphAttrs {
  textAlign?: TextAlign;
  lineHeight?: number | string;
  indent?: number;
  styleId?: string;
}

export interface HeadingAttrs {
  level: 1 | 2 | 3;
  textAlign?: TextAlign;
  styleId?: string;
}

export interface TableAttrs {
  border?: string;
}

export interface TableCellAttrs {
  colspan?: number;
  rowspan?: number;
  colwidth?: number[];
  background?: string;
}

// ---------- Block nodes ----------

export interface ParagraphNode {
  type: "paragraph";
  attrs?: ParagraphAttrs;
  content?: InlineNode[];
}

export interface HeadingNode {
  type: "heading";
  attrs: HeadingAttrs;
  content: InlineNode[];
}

export interface BulletListNode {
  type: "bulletList";
  attrs?: { tight?: boolean };
  content: ListItemNode[];
}

export interface OrderedListNode {
  type: "orderedList";
  attrs?: { start?: number; tight?: boolean };
  content: ListItemNode[];
}

export interface ListItemNode {
  type: "listItem";
  content: BlockContent[];
}

export interface BlockquoteNode {
  type: "blockquote";
  content: BlockContent[];
}

export interface TableNode {
  type: "table";
  attrs?: TableAttrs;
  content: TableRowNode[];
}

export interface TableRowNode {
  type: "tableRow";
  content: TableCellNode[];
}

export interface TableCellNode {
  type: "tableCell";
  attrs?: TableCellAttrs;
  content: BlockContent[];
}

export interface ImageNode {
  type: "image";
  attrs: {
    src: string;
    alt?: string;
    title?: string;
    width?: number;
    height?: number;
    align?: "left" | "center" | "right";
  };
}

export interface HorizontalRuleNode {
  type: "horizontalRule";
}

export interface PageBreakNode {
  type: "pageBreak";
}

/** Column/page layout break inserted from the Layout tab. */
export interface LayoutBreakNode {
  type: "layoutBreak";
  attrs?: { count?: number; clear?: string | null };
}

/** Floating text box drawn on the page. */
export interface TextBoxNode {
  type: "textBox";
  attrs?: { style?: string | null; width?: string | number; height?: string | number };
  content?: BlockContent[];
}

/** Math/chemical formula. Holds inline content, per the editor schema. */
export interface EquationNode {
  type: "equation";
  attrs?: { latex?: string; style?: string | null };
  content?: InlineNode[];
}

/** Preformatted code block. Holds inline content, per the editor schema. */
export interface CodeBlockNode {
  type: "codeBlock";
  attrs?: { language?: string | null };
  content?: InlineNode[];
}

export type BlockContent =
  | ParagraphNode
  | HeadingNode
  | BulletListNode
  | OrderedListNode
  | BlockquoteNode
  | TableNode
  | ImageNode
  | HorizontalRuleNode
  | PageBreakNode
  | LayoutBreakNode
  | TextBoxNode
  | EquationNode
  | CodeBlockNode;

export interface DocNode {
  type: "doc";
  content: BlockContent[];
}

// ---------- Envelope (the .britdoc file) ----------

export interface DocumentMeta {
  title: string;
  author?: string;
  language?: string;
  template?: string;
  thumbnail?: string | null;
  styles?: Record<string, unknown>;
}

export interface PageSetup {
  size: "A4" | "Letter";
  orientation: "portrait" | "landscape";
  margins: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  headerDistance?: string;
  footerDistance?: string;
}

export interface BritDocument {
  format: "britdoc";
  schemaVersion: 1;
  appVersion: string;
  createdAt: string;
  modifiedAt: string;
  meta: DocumentMeta;
  page: PageSetup;
  doc: DocNode;
}

export const SCHEMA_VERSION = 1 as const;
export const FORMAT = "britdoc" as const;