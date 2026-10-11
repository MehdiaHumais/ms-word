# Risk Register — BritDocs

Legend: Impact L/M/H · Likelihood L/M/H · Score = Impact × Likelihood
Owner of register: Project lead (updated after each phase).

## Risks (Phase 0 snapshot)

| ID | Risk | Impact | Likelihood | Score | Mitigation / Response |
| --- | --- | --- | --- | --- | --- |
| R-01 | **Rust + MSVC + C++ Build Tools not installed** on dev machine — blocks `cargo`/Tauri build | H | H | HH | **RESOLVED (build works, 2026-09-22).** Used rustup **GNU** toolchain (`stable-x86_64-pc-windows-gnu`) + MinGW-w64 (winlibs) instead of MSVC. Build was additionally blocked by (a) spaces in the project path breaking `windres`/`embed-resource` → fixed with space-free `CARGO_TARGET_DIR=D:\britdocs-target`; (b) GNU ld `export ordinal too large` when linking the Tauri cdylib → fixed with `cargo::rustc-link-arg=-Wl,--exclude-libs=ALL,--exclude-all-symbols` guarded to `windows`+`gnu` in `src-tauri\build.rs`; (c) `rustup default` silently flipping to MSVC → pinned toolchain via `rustup run stable-x86_64-pc-windows-gnu` in the build script. Debug exe (`D:\britdocs-target\debug\britdocs.exe`) builds and runs; `.britdoc` open-by-double-click + single-instance forwarding verified manually. Release/installer build on GNU toolchain is still a follow-up. |
| R-02 | WebView2 runtime missing on target PCs | H | L | M | Tauri NSIS/MSI installers auto-install bootstrapper; test on clean VM without WebView2. |
| R-03 | DOCX export fidelity gaps (fonts, spacing, tables) causing Word to "repair" file | H | M | M+ | Constrain V1 schema to well-supported constructs; integration-test exported `.docx` opens cleanly in Word **and** LibreOffice; never use unsupported OOXML features. |
| R-04 | **Scope creep into DOCX import** (huge) | H | M | M+ | Explicitly V2. UI must show honest "Import not available yet" — no fake enable button. Signed off in V1 SCOPE. |
| R-05 | ProseMirror/Tiptap schema divergence: doc saved but can't re-open (version skew) | H | M | M+ | Envelope has `schemaVersion`; migration map on load; **round-trip unit test** in CI; keep schema file as single source of truth. |
| R-06 | pdfmake pagination differs from Word (page numbers break mid-paragraph) | M | M | M | Validate in export tests; document limitations; consider `pdf-lib` post-processing later. |
| R-07 | Autosave races: writing while exiting / two autosaves overlap → corrupt draft | M | M | M | Rust-side serialized write queue, temp-file + atomic rename on same volume; draft written only when changed (dirty flag). |
| R-08 | Clipboard paste of arbitrary evil HTML (XSS vector) into editor | H | M | M+ | Disable dangerous HTML stripping in Tiptap default; allowlist-only HTML parser; no `dangerouslySetInnerHTML` on untrusted input; CSP in `tauri.conf.json`. |
| R-09 | Large docs (10MB+) degrade IME/typing latency | M | M | M | ProseMirror uses document fragments; debounce React re-renders in Tiptap (avoid `shouldRerenderOnTransaction` default costs); benchmark in Phase 2. |
| R-10 | Licenses: accidental GPL dependency breaks commercial distribution | H | L | L | License gate in CI (license-checker + cargo-license with policy: deny GPL/AGPL; allow MIT/Apache/BSD/MPL) — see `THIRD_PARTY_LICENSES.md`. |
| R-11 | No telemetry + opaque errors → user frustration, poor crash diagnosis | M | M | M | Detailed on-screen error dialogs with "copy details"; optional local log file (no network); structured error channel from Rust to UI. |
| R-12 | Ribbon UI complexity (Word-like) inflates schedule | M | M | M | Phase plan: shell chrome first, then grouped extensions (Start? → Building blocks → Plateau). Keep ribbon in a `components/ribbon` module. |
| R-13 | Single dev, long project → burnout/momentum loss | M | M | M | Ship in small vertical slices (each PR = playable feature); keep this doc updated so handoff is possible; everything tested as we go. |
| R-14 | Windows 7 target claims (Tauri supports, installers cope) | L | L | L | V1 targets Windows 10/11 only. Document explicit support matrix. |

## Watchlist (not yet risks)
- Tiptap 3 breaking minor releases (release cadence high) → pin exact versions, review upgrade diffs before bumping.
- `docx` lib occasional API churn (v9→) → pin version; wrap behind our own `converter` interface so we can swap.
- Rust compile times slow inner loop → use `cargo build` caching, keep `src-tauri` small, split heavy crates.

---
Last reviewed: 2026-09-16 · Phase 0