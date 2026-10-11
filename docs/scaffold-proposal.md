# Scaffold Proposal — BritDocs (Phase 0)

## Environment status (verified 2026-09-16, updated 2026-09-22)
| Tool | Required | Found | Action |
| --- | --- | --- | --- |
| Node.js | ≥ 20 | **24.16.0** ✅ | — |
| npm | ≥ 10 | **11.13.0** ✅ | — |
| Git | any modern | **2.54.0** ✅ | — |
| Rust / Cargo | required for Tauri | **stable-x86_64-pc-windows-gnu (rustc 1.98.1)** ✅ | rustup GNU toolchain |
| MinGW-w64 | linker/binutils needed by GNU toolchain | **winlibs 16.2.0** at `C:\Users\Digital\Tools\mingw64` ✅ | in PATH for builds |
| MSVC C++ Build Tools | not used | ✖ (no admin rights) | GNU toolchain used instead |
| Tauri CLI | via npm (devDep) | installed ✅ | `npm i -D @tauri-apps/cli` |
| WebView2 | Win10/11 | present on target OS | Verify on target |

**Status (2026-09-22): Tauri shell built and running.** Details in `RISK-REGISTER.md` R-01. Build environment notes:
- The project path (`D:\sir projectss\...`) contains spaces, which breaks `embed-resource`/`windres`. All cargo builds use a space-free target dir: `CARGO_TARGET_DIR=D:\britdocs-target`.
- Link the GNU cdylib with `-Wl,--exclude-libs=ALL,--exclude-all-symbols` (in `src-tauri\build.rs`, guarded to `windows`+`gnu`) to avoid `ld: export ordinal too large`.
- Pin the toolchain explicitly: `rustup run stable-x86_64-pc-windows-gnu cargo build …` (`rustup default` can flip back to MSVC after a rustup update).
- Debug exe: `D:\britdocs-target\debug\britdocs.exe` (dev build loads `http://localhost:5173`; run `npm run dev` first).

---

## Proposed folder layout (single repo, Tauri-friendly)

```
britdocs/
├─ package.json                 # npm scripts (dev, build, tauri, test, lint)
├─ vite.config.ts
├─ tsconfig.json
├─ index.html
├─ src/                         # React frontend
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ app/                      # layout, navigation, ribbon, home screen
│  │  ├─ Ribbon/                # tabs & groups (Home/Insert/Layout/Review)
│  │  ├─ Editor/                # Tiptap editor wrapper + toolbar glue
│  │  └─ Shell/                 # titlebar, tabs, status bar
│  ├─ features/
│  │  ├─ documents/             # doc list, recent, open/save flows
│  │  ├─ editor/                # editor store, commands, shortcuts
│  │  └─ export/                # export triggers/UI
│  ├─ domain/                   # PURE logic, no React
│  │  ├─ document-model/        # schema, node types, serialization/validation
│  │  ├─ converters/            # britdoc→docx, →pdfmake, →html, →txt
│  │  └─ ipc/                   # typed wrappers over Tauri invoke()
│  ├─ stores/                   # zustand stores
│  └─ styles/
│
├─ src-tauri/                   # Rust (added in Phase 1 after Rust installs)
│  ├─ src/
│  │  ├─ main.rs
│  │  ├─ lib.rs
│  │  ├─ commands/              # fs, dialogs, sqlite, autosave
│  │  └─ db/                    # migrations, recovery store
│  ├─ tauri.conf.json           # CSP, windows, capabilities
│  ├─ capabilities/default.json
│  └─ Cargo.toml

├─ tests/                       # unit + integration (vitest, playwright e2e)
├─ docs/                        # all TDR/SCOPE/LICENSES/RISK/SCHEMA (this is here 🎉)
├─ .github/workflows/ci.yml     # windows lint+build+test
└─ THIRD_PARTY_LICENSES.txt     # generated at release time
```

Key principle: **`src/domain/` is UI-free** and testable in isolation — it becomes the shared core reused by future BritCalc/BritSlides modules.

---

## Recommended commands (executed in Phase 1 as separate, reviewable steps)

### Step A — frontend + domain (safe today)
```powershell
# 1) Create Vite React-TS app inside current folder
npm create vite@latest . -- --template react-ts

# 2) Add tooling
npm install -D tailwindcss @tailwindcss/vite
npm install zustand
npm install @tauri-apps/api @tauri-apps/cli -D   # api used later by ipc layer
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-underline @tiptap/extension-link
npm install @tiptap/extension-text-style @tiptap/extension-font-family @tiptap/extension-font-size @tiptap/extension-highlight @tiptap/extension-image
npm install docx pdfmake
npm install -D vitest @testing-library/react @playwright/test
```

### Step B — after Rust is installed
```powershell
# install Rust via rustup (MSVC target), then:
npm run tauri init          # scaffolds src-tauri (Tauri CLI)
cargo add rusqlite --features bundled
cargo add serde serde_json --features derive
cargo add tauri-plugin-dialog tauri-plugin-fs tauri-plugin-sql
```

### Step C — verify gates
```powershell
npm run lint && npm run test && npm run build   # then (later) npm run tauri dev
```

## Notes
- All commands are **non-destructive** (create new files in empty dir; `vite create` will confirm).
- Nothing here deletes/overwrites data. DB migrations will ALWAYS be additive + versioned in Rust.
- `npm create vite` may prompt; pass flags to keep it non-interactive, or accept defaults and fix after.

---
Last reviewed: 2026-09-16 · Phase 0