# V1 Requirements Scope — BritDocs Word Processor

Status: Draft for Phase 0 sign-off. "In" items ship in V1; "Out" items are explicitly deferred and will show honest "not yet" states rather than fake features.

## Identity
- Product name: **BritDocs** (Word Processor module).
- Platform: Windows 10/11 desktop. Offline-first; zero telemetry.
- Installer: MSI + EXE (Tauri NSIS), ~10 MB.

## V1 IN-SCOPE (Must Have)

### Document Lifecycle
- [ ] New blank document (default: A4 portrait, 1" margins, 11pt Calibri-like default)
- [ ] Open `.britdoc` (native), Open `.docx` → **in V1, only via file picker with honest "import not ready" flow, since DOCX import is V2**. Open recent from home screen.
- [ ] Save / Save As `.britdoc` (Ctrl+S / Ctrl+Shift+S), dirty-dot indicator on tab, autosave draft every 30s to SQLite recovery store.
- [ ] Multiple open documents in tabs (first-class tab bar like Word/Tabbed).
- [ ] Recent files list persisted in SQLite.
- [ ] Crash recovery: on launch, offer to restore drafts newer than last save.

### Editing (Core)
- [ ] Typing with full IME support, selection, cursor, copy/cut/paste (internal + external rich text, strip weird HTML).
- [ ] Undo/Redo (multi-level, ProseMirror history).
- [ ] Search & Replace in current doc (Ctrl+H panel), match case/whole word.
- [ ] Paragraph: alignment (left/center/right/justify), line spacing (1/1.15/1.5/double/custom), bullet & numbered lists, blockquote, indent increase/decrease.
- [ ] Inline marks: bold, italic, underline, strikethrough, superscript/subscript, text color, highlight color, font family, font size.
- [ ] Styles (paragraph presets): Normal, Heading 1–3, Title, Subtitle.
- [ ] Tables: insert (rows×cols), add/delete row/column, merge cells, cell shading, borders (basic), table alignment.
- [ ] Images: insert from file dialog, resize by dragging handle, wrap (inline basic).
- [ ] Page: margins (presets + custom), orientation portrait/landscape, page size A4/Letter, page break (Ctrl+Enter), page numbers (header/footer basic, centered system field).
- [ ] Hyperlink insert/edit.
- [ ] Character count / word count / page count in status bar (live).

### Export
- [ ] Export to `.docx` (high-fidelity via `docx` lib). **The V1 primary interop path.**
- [ ] Export to `.pdf` (via pdfmake; margins/page size honored, pagination best-effort).
- [ ] Export to `.html` (simple) and plain `.txt`.

### UI / Shell
- [ ] Word-style **Ribbon UI** (Home / Insert / Layout / Review tabs) with Tailwind; collapsed ribbon state.
- [ ] Home screen: New / Open / Recent grid.
- [ ] Status bar: page, word count, zoom (50–200%), language placeholder.
- [ ] Keyboard shortcuts table (Word-compatible: Ctrl+B/I/U, Ctrl+Z/Y, etc.).
- [ ] Zoom (Ctrl+scroll, +/- buttons), print preview (basic) and print via `document`/OS print (WebView2 printing) — marked experimental.

### Reliability / Quality
- [ ] Unit tests for document model (schema validation, serialization round-trip).
- [ ] Integration tests for export (`.docx` opens in LibreOffice/Word, `.pdf` produces N pages).
- [ ] TypeScript strict mode; Rust clippy clean; CI (GitHub Actions) lint+build+test on Windows.
- [ ] Telemetry: none. Error reporting: on-screen dialog.

## V2+ OUT-OF-SCOPE (deferred, will display honest "Coming soon")
- DOCX **import/read** (.docx → editor). V2 via mammoth bridge.
- Track changes / comments; multi-user collaboration.
- Mail merge, macros (VBA-equivalent), endnotes/footnotes advanced, dictionary/thesaurus/grammar.
- Real print reflow engine (pixel-accurate pagination), headers/footers advanced (different first page, odd/even).
- PDF import/annotations, full OOXML fidelity round-trip.
- Tabs → next modules: **BritCalc** (spreadsheet), **BritSlides** (presentation).

## Success Criteria (V1 "done")
1. Create → edit (incl. tables/images/styles) → **save → open** `.britdoc` round-trip with zero data loss (round-trip unit test).
2. Export `.docx` opens correctly in MS Word / LibreOffice.
3. Export `.pdf` renders readable, paginated output.
4. Full offline; no network calls; clean install/uninstall on clean Windows 10/11.
5. Crash after typing → relaunch → unsaved work recoverable.

---
Last reviewed: 2026-09-16 · Phase 0