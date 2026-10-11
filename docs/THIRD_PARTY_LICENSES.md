# Third-Party License Inventory — BritDocs

Status: Living document, reviewed during Phase 0 (discovery). Re-verify versions at install time and update this table.

## Guidelines
- Only licenses compatible with a commercial, closed-source desktop app are acceptable: **MIT, Apache-2.0, BSD-2/3-Clause, MPL-2.0, Zlib**.
- **GPL / AGPL** are **NOT** acceptable (copyleft would force us to release source).
- Record obligations (attribution notice in `THIRD_PARTY_LICENSES.txt` shipped inside the installer) for anything not public-domain.

## Selected Libraries

| Package | Version (plan) | Purpose | License | Obligation |
| --- | --- | --- | --- | --- |
| `@tiptap/*` (Tiptap core) | 3.x | Rich-text editor engine | MIT | Keep copyright notice on redistribution |
| `@tiptap/pm` (ProseMirror bundle) | 3.x | Editor core model/view/state | MIT | Keep copyright notice |
| `docx` (dolanmiu/docx) | 9.x | DOCX **export/write** | MIT | Keep copyright notice |
| `pdfmake` | 0.3.x | PDF export | MIT | Keep copyright notice; fonts used must carry their own license |
| `pdf-lib` | 1.17.x | PDF create/modify (fallback/candidate) | MIT | Keep copyright notice |
| `react` / `react-dom` | 19.x | UI framework | MIT | Keep copyright notice |
| `vite` | 6.x | Build tool | MIT | Keep copyright notice |
| `tailwindcss` | 4.x | Styling | MIT | Keep copyright notice |
| `zustand` | 5.x | State management | MIT | Keep copyright notice |
| `typescript` | 5.x | Typing | Apache-2.0 | Keep NOTICE/attribution |
| Tauri (`@tauri-apps/*`, `tauri`) | 2.x | Desktop shell, native FS/dialogs | MIT / Apache-2.0 (dual) | Keep licenses; see SPDX headers |
| `rusqlite` / `sqlite` | current | SQLite metadata store | MIT (rusqlite) + SQLite Public Domain | None for SQLite itself |
| `serde` / `serde_json` | 1.x | Serialization | MIT OR Apache-2.0 | Keep copyright notice |
| `mammoth` *(candidate)* | 1.x | DOCX **read/import** (HTML bridge) | BSD-2-Clause | Keep copyright notice |

## Candidate / Not Yet Selected (evaluated, not committed)

| Package | Status | License | Notes |
| --- | --- | --- | --- |
| `@tiptap-pro/*` | **REJECTED for V1** | Commercial | Paid extensions; avoid for offline-first free core. Revisit later if needed. |
| `jspdf` | Alternate | MIT | Older API; pdfmake preferred for declarative doc-tree rendering. |
| `@react-pdf/renderer` | Alternate | MIT | React-component model; pdfmake simpler for 1:1 doc-tree mapping. |
| `lexical` | Alternate editor | MIT | Viable fallback if Tiptap/ProseMirror constraints bite; team skill favors Tiptap. |
| `squoosh`/`sharp` | Rust-side image handling | Apache-2.0 / MIT | Sharp is `Apache-2.0` — acceptable; decide when image support lands. |

## NOTES / REQUIRED ACTIONS
1. On first real `npm install` + `cargo build`, run a license audit and capture **exact pinned versions** here (use `npx license-checker` and `cargo-license`).
2. Ship `THIRD_PARTY_LICENSES.txt` (auto-generated from this table) inside the installer bundle and in-app **About → Credits**.
3. pdfmake ships fonts (Roboto) under Apache-2.0 — those must be listed too if bundled.
4. No library currently in the plan requires copyleft compliance — **the stack is clean for commercial distribution.**

---
Last reviewed: 2026-09-16 · Phase 0