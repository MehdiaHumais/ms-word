/**
 * Desktop (Tauri) bridge.
 *
 * In the installed BritDocs desktop app the browser download/upload flows are
 * replaced by native file dialogs and real filesystem writes. Every call here
 * is guarded behind isDesktopApp() on the caller's side; in a plain browser
 * these modules are bundled but never invoked.
 */
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open as dialogOpen, save as dialogSave } from "@tauri-apps/plugin-dialog";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";
import { isDesktopApp } from "../domain/env";

export interface OpenFileResult {
  name: string;
  path: string;
  bytes: Uint8Array;
}

const OPEN_FILE_EVENT = "britdocs://open-file";
const MENU_ACTION_EVENT = "britdocs://menu-action";

const OPEN_FILTERS = [
  { name: "BritDocs Document", extensions: ["britdoc"] },
  { name: "Word Document", extensions: ["docx", "doc"] },
  { name: "Rich Text Format", extensions: ["rtf"] },
  { name: "Web Page", extensions: ["html", "htm"] },
  { name: "Plain Text", extensions: ["txt"] },
  { name: "All files", extensions: ["*"] },
];

/**
 * Show the native "Open" dialog and read the chosen file as bytes.
 * Returns null when the user cancels.
 */
export async function pickOpenFile(): Promise<OpenFileResult | null> {
  if (!isDesktopApp()) return null;
  const selected = await dialogOpen({
    multiple: false,
    directory: false,
    filters: OPEN_FILTERS,
  });
  if (typeof selected !== "string") return null;
  const bytes = new Uint8Array(await readFile(selected));
  const name = selected.split(/[\\/]/).pop() || selected;
  return { name, path: selected, bytes };
}

/**
 * Show the native "Save As" dialog. Returns the chosen path or null on cancel
 * (nothing is written here — call writeBytes with the returned path).
 */
export async function pickSavePath(defaultName: string): Promise<string | null> {
  if (!isDesktopApp()) return null;
  const path = await dialogSave({
    defaultPath: defaultName,
    filters: [
      { name: "BritDocs Document", extensions: ["britdoc"] },
      { name: "Word Document", extensions: ["docx"] },
      { name: "PDF", extensions: ["pdf"] },
      { name: "Plain Text", extensions: ["txt"] },
      { name: "Web Page", extensions: ["html"] },
    ],
  });
  return typeof path === "string" ? path : null;
}

/** Encode string content to UTF-8 bytes for writeFile. */
export function toBytes(content: string | Uint8Array): Uint8Array {
  return typeof content === "string" ? new TextEncoder().encode(content) : content;
}

/** Write bytes to an absolute path. */
export async function writeBytes(path: string, content: string | Uint8Array): Promise<void> {
  await writeFile(path, toBytes(content));
}

/** Read an absolute path (OS open-file or Save-As target) back into memory. */
export async function readPathFile(path: string): Promise<OpenFileResult> {
  const bytes = new Uint8Array(await readFile(path));
  const name = path.split(/[\\/]/).pop() || path;
  return { name, path, bytes };
}

/** Path of the file the app was launched with (double-click on .britdoc). */
export async function getPendingOpenPath(): Promise<string | null> {
  try {
    const value = await invoke<string | null>("get_pending_file");
    return value;
  } catch {
    return null;
  }
}

/**
 * Consume the launch-time path once the document has been loaded. Peeking in
 * `getPendingOpenPath` keeps the path available across React StrictMode's
 * double-mount and Tiptap editor re-creation; this clears it for good.
 */
export async function clearPendingOpenPath(): Promise<void> {
  try {
    await invoke("clear_pending_file");
  } catch {
    /* nothing pending */
  }
}

/**
 * Subscribe to "open a file" requests. Fires when a second app instance is
 * launched with a document (the Rust layer forwards it here). Returns an
 * unsubscribe function.
 */
export async function onOpenFilePath(
  handler: (path: string) => void,
): Promise<() => void> {
  return await listen<string>(OPEN_FILE_EVENT, (e) => handler(e.payload));
}

/** File menu intents forwarded from the native Rust menu. */
export type MenuAction = "new" | "open" | "save" | "save-as";

/**
 * Subscribe to native File menu activations.
 *
 * The webview swallows accelerators such as Ctrl+S before the DOM sees them,
 * so the accelerator lives on a native menu item and arrives here instead.
 * Returns an unsubscribe function.
 */
export async function onMenuAction(
  handler: (action: MenuAction) => void,
): Promise<() => void> {
  return await listen<string>(MENU_ACTION_EVENT, (e) =>
    handler(e.payload as MenuAction),
  );
}