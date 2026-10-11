# BritDocs Internal Document Model + File Format (Draft v0.1)

Owner: Core team · Status: DRAFT for Phase 0 → ratified when editor engine lands.

## 1. Concepts
- Editor uses **ProseMirror document model** (a tree of typed nodes with marks).
- The **.britdoc file** is a versioned JSON envelope wrapping that tree + metadata. Plain, diffable, recoverable.
- The schema below is the **single source of truth**. Tiptap extensions map to it 1:1.

## 2. File envelope (`.britdoc`)

```json
{
  "format": "britdoc",
  "schemaVersion": 1,
  "appVersion": "0.1.0",
  "createdAt": "2026-09-16T10:00:00Z",
  "modifiedAt": "2026-09-16T10:05:00Z",
  "meta": {
    "title": "Quarterly Report",
    "author": "Jane Doe",
    "language": "en-US",
    "template": "default",
    "thumbnail": null
  },
  "doc": { "type": "doc", "content": [ /* node tree */ ] }
}
```

### Envelope rules
- `doc` is a **plain ProseMirror JSON node** → lossless load into Tiptap.
- Unknown future keys must be *ignored*, not rejected → forward/backward safe as `schemaVersion` grows.
- `doc` must validate against the current schema before opening; if it fails → locked "repair / reject" dialog (never silently strip content).

## 3. Node schema (v1)

### Document
- `doc` — root; contains `block` sequence.

### Blocks
| Node | Content | Notes |
| --- | --- | --- |
| `paragraph` | inline[] + marks | default block |
| `heading` | inline[] | attrs: `level` (1,2,3) |
| `bulletList` | listItem[] | group block |
| `orderedList` | listItem[] | attrs: `start`, `tight` |
| `listItem` | paragraph | |
| `blockquote` | block+ | |
| `table` | tableRow[] | attrs: border style |
| `tableRow` | tableCell[] | |
| `tableCell` | block+ | attrs: `colspan`, `rowspan`, `colwidth`, `background` |
| `image` | leaf | attrs: `src`, `alt`, `title`, `width`, `height`, `align` |
| `hardBreak` | leaf | line break |
| `horizontalRule` | leaf | |
| `pageBreak` | leaf | Ctrl+Enter |

### Inline marks
`bold`, `italic`, `underline`, `strike`, `superscript`, `subscript`, `code`, `link` (`href`, `title`), `highlight` (`color`), `textStyle` (`fontFamily`, `fontSize`).

### Text attrs (via `textStyle` compact notation)
```json
{ "type": "text", "text": "Hello", "marks": [
  { "type": "textStyle", "attrs": { "fontFamily": "Calibri", "fontSize": "12pt", "color": "#1F4E79" } }
] }
```

## 4. Paragraph / page layout (part of block attrs, Tiptap `paragraphStyle`)
Attrs on `paragraph`: `textAlign` (`left|center|right|justify`), `lineHeight` (number or `"1.5"`), `indent` (relative level), `margins` (px → later pt), `styleId` (link → named style in `meta.styles`).

## 5. Styles & theme
`meta.styles` holds named paragraph/character styles (Normal, Heading 1–3, Title). Nodes reference by `styleId`; definitions resolve via internal registry, so theme changes reflow without touching content nodes.

## 6. Page setup (document level)
```json
"page": {
  "size": "A4", "orientation": "portrait",
  "margins": { "top": "72pt", "right": "72pt", "bottom": "72pt", "left": "72pt" },
  "headerDistance": "36pt", "footerDistance": "36pt"
}
```
Maps to pdfmake `pageSize`/`pageMargins` in export and to print CSS in preview.

## 7. Recovery & versioning
- Autosave writes `draft` rows in SQLite (keyed by document path).
- File migration map: `1 → 2`: … (placeholder). Every schema bump MUST ship a forward-migration scenario + test.

## 8. Serialization contract (tests required)
- `britdoc round-trip`: editor → serialize → file → parse → editor → serialize ⇒ byte-identical JSON (canonical ordering).
- `schema validation`: every node type is allowed only where the schema allows; invalid docs rejected at load with clear error.