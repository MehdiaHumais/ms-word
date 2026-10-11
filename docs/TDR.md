# Technical Decision Record (TDR) — BritDocs

Status: **ACCEPTED** (Phase 0). Each decision has status + rationale + consequences.

---

## TDR-001 — Desktop Framework: Tauri 2 (Rust shell + system WebView2)

**Status:** ACCEPTED

- **Context:** Need a small-footprint, offline-first Windows desktop app with native file dialogs, filesystem access, and future SQLite. Electron was considered but rejected for bundle size (~150MB+) and memory.
- **Decision:** Use Tauri 2. Frontend ships as static assets; backend logic in Rust behind IPC (`invoke`/`emit`).
- **Consequences:**
  - Installer size stays ~5–12 MB (vs Electron ~150 MB).
  - Rust gives safe file I/O and a path to native DOCX/PDF backends later.
  - **REQUIRES Rust toolchain + MSVC C++ Build Tools + WebView2** on dev machine (not yet installed — see Risk R-01).
  - **Implemented 2026-09-22 (dev build via GNU toolchain; see R-01):** debug exe builds at `D:\britdocs-target\debug\britdocs.exe`, loads the Vite dev server, and supports double-click/“Open with” `.britdoc` opening (argv → `get_pending_file` command or `britdocs://open-file` single-instance event) plus native open/save dialogs through IPC. NSIS release bundling is a follow-up.

## TDR-002 — Frontend: React + TypeScript + Vite + Tailwind + Zustand

**Status:** ACCEPTED

- React 19, TypeScript strict, Vite 6, Tailwind 4 (utility styling for the Word-like ribbon UI), Zustand 5 for app-level state (documents list, recent files, dirty flags).
- Editor state stays inside Tiptap's ProseMirror store; Zustand holds *app* state only — avoids double-source-of-truth.

## TDR-003 — Editor Engine: Tiptap 3 (on ProseMirror)

**Status:** ACCEPTED

- Tiptap gives ProseMirror's rock-solid schema/transaction model with a friendly React API. ProseMirror is used by NYT/Atlassian and has 10 years of correctness hardening (IME, undo/redo, tables).
- We use the **MIT core only**; no Tiptap Pro paid extensions in V1.
- **Schema is the source of truth** — our internal JSON document model maps 1:1 onto the ProseMirror schema so save/load is a pure serialization (see TDR-004).

## TDR-004 — Internal Document Model / Native Format: `britdoc` (JSON + assets)

**Status:** ACCEPTED

- Internal representation is a **ProseMirror-compatible JSON document** with a versioned envelope. Saved as `.britdoc` — a plain JSON file. No binary format in V1 (keeps diffing, recovery, and parsing trivial).
- Envelope: `{ version, meta, body }` where `body` is the ProseMirror `doc` node (see `docs/document-schema.md`).
- **Why not `.docx` as native:** DOCX is a zipped OOXML with 30+ XML parts; round-tripping through it on every autosave is slow and lossy. `.docx` becomes an **Export/Import** concern (write-only in V1, export always available).
- Future: if file size becomes a problem, migrate envelope to `zip + schema` or SQLite-blob-backed store without touching the editor layer.

## TDR-005 — DOCX Export: `docx` (dolanmiu/docx) — Write-only in V1

**Status:** ACCEPTED

- We can guarantee high-fidelity **generation** of `.docx` (bold, fonts, headings, lists, tables, images, margins, headers/footers).
- **DOCX *Import* (reading .docx) is out of V1 scope** — full OOXML parsing (styles.xml, numbering.xml, sectPr, embedded media) is a multi-week effort on its own and is tracked as V2. Until then, "Open .docx" shows an honest "not yet supported" dialog — we will not fake it.
- Bridge plan for V2: `mammoth` (BSD-2) to convert `.docx → clean HTML`, then Tiptap's HTML parser into our schema.

## TDR-006 — PDF Export: `pdfmake`

**Status:** ACCEPTED

- Converts our internal doc-tree (paragraph/p/text-run/tables/images with inline styles) into pdfmake's declarative document definition. Works fully client-side → stays offline; consistent with pagination via `pageSize`/`pageMargins` mapped from our page settings.
- Known limit: pixel-perfect pagination parity with Word requires a layout engine (V2+). V1 goal: **clean, readable PDFs**, not byte-identical layouts.

## TDR-007 — Persistence Layer: Rust (rusqlite) for metadata + drafts; FS for `.britdoc`

**Status:** ACCEPTED

- SQLite stores: recent files, document metadata (title, tags, modifiedAt), recovery/autosave drafts.
- The **document content itself lives on the filesystem** as `.britdoc`, exactly like Word does with `.docx` — the DB is never the primary store, so users can't lose documents if the DB corrupts.

## TDR-008 — Native Capabilities All Through Tauri IPC (allowlist, no raw web APIs)

**Status:** ACCEPTED

- File dialogs (Save/Open), filesystem read/write, and SQLite all go through **Rust commands with an explicit capability manifest**. The webview runs with restricted permissions (`core:default` + minimal additions). We never use `<input type=file>` or JS file access for persistence — keeps sandbox tight and consistent with "offline-first, no browser strings attached".

## TDR-009 — Monorepo Layout (no workspace multiplier in V1)

**Status:** ACCEPTED

- Single Tauri app repo: `src/` (React) + `src-tauri/` (Rust) + `packages/` for domain logic that may later split into shared libs (document model, converters) reused by future BritCalc/BritSlides. See `docs/scaffold-proposal.md`.

---
Last reviewed: 2026-09-16 · Phase 0