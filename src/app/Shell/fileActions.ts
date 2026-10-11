/**
 * Shared file actions (Save / export) usable from the File backstage and the
 * global Ctrl+S / Ctrl+Shift+S shortcuts.
 */
import type { Editor } from "@tiptap/core";
import { useAppStore } from "../../stores/appStore";
import { exportBritdoc, BRITDOC_MIME } from "../Editor/britdoc";
import { buildDocx } from "../Editor/docx";
import { buildPdf } from "../Editor/pdf";
import { draftKey, clearDraft } from "../../domain/persistence/recovery";
import { addRecentFile } from "../../domain/persistence/recentFiles";
import { isDesktopApp } from "../../domain/env";
import { toBytes } from "../desktop";
import { readFile, remove, rename, writeFile } from "@tauri-apps/plugin-fs";

export function downloadFile(
  name: string,
  mime: string,
  content: string | Uint8Array,
): void {
  const blob =
    typeof content === "string"
      ? new Blob([content], { type: mime })
      : new Blob([content as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke later, not synchronously — instantly revoking can abort the
  // download in some browsers and produce an empty file.
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function baseName(title: string): string {
  return title.replace(/\.[^/.]+$/, "") || "Untitled";
}

/**
 * Write bytes to `path` safely: a temporary file in the same directory is
 * written and flushed first, then renamed over the target. A crash or a
 * failure part-way through therefore leaves the previous good file intact
 * instead of a truncated or empty one.
 */
async function writeBytesAtomic(path: string, content: string | Uint8Array): Promise<void> {
  const bytes = toBytes(content);
  const tmp = `${path}.britdoc-tmp`;
  try {
    await writeFile(tmp, bytes);
    // Confirm the bytes actually landed before destroying the original.
    const written = await readFile(tmp);
    if (written.byteLength !== bytes.byteLength) {
      throw new Error(
        `short write: ${written.byteLength} of ${bytes.byteLength} bytes`,
      );
    }
    await rename(tmp, path);
  } catch (err) {
    await remove(tmp).catch(() => undefined);
    throw err;
  }
}

/** Turn a filesystem error into something a user can act on. */
export function describeSaveError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/denied|permission/i.test(raw)) {
    return "Could not save document. Please check the file location and permissions.";
  }
  if (/not found|no such file/i.test(raw)) {
    return "Could not save document. The destination folder no longer exists.";
  }
  if (/disk|space/i.test(raw)) {
    return "Could not save document. There may not be enough disk space.";
  }
  return `Could not save document. ${raw}`;
}

/**
 * Write a document to an explicit path (the "Save As" target), verifying the
 * bytes before replacing whatever was there.
 */
export async function saveDocumentTo(
  path: string,
  content: string | Uint8Array,
): Promise<void> {
  await writeBytesAtomic(path, content);
}

export type SaveResult =
  | { status: "written"; path: string }
  | { status: "needsSaveAs" }
  | { status: "error"; message: string };

/**
 * Save the active document back to the format named by its path (`.britdoc`,
 * `.docx`, `.pdf`, `.txt`, `.html`). In the browser a "save" re-downloads the
 * file (there is no in-place write access); the dirty flag and draft are still
 * cleared so round-trip semantics stay honest.
 *
 * Returns `needsSaveAs` when the tab has no path yet (or its format is
 * unknown) so the caller can open the "Save As" flow, and `error` when the
 * write actually failed — the document is only marked clean on success.
 */
export async function saveActiveDocument(editor: Editor): Promise<SaveResult> {
  const app = useAppStore.getState();
  const tab = app.tabs.find((t) => t.id === app.activeId);
  if (!tab) return { status: "needsSaveAs" };
  const path = tab.path;
  const ext = (path ?? "").toLowerCase().split(".").pop() ?? "";
  const html = editor.getHTML() ?? "<p></p>";
  const base = baseName(tab.title);

  let content: string | Uint8Array | null = null;
  let mime = "application/octet-stream";
  let fileName = "";
  let kind: "britdoc" | "docx" | "txt" | "html" = "britdoc";
  let contentForRecent: string | undefined;

  if (ext === "britdoc") {
    fileName = `${base}.britdoc`;
    mime = BRITDOC_MIME;
    content = exportBritdoc(
      editor,
      { size: app.pageSizeId, orientation: app.orientation, margins: app.margins },
      { title: base, language: app.proofingLang === "English (US)" ? "en-US" : "en-GB" },
    );
    contentForRecent = content as string;
  } else if (ext === "docx") {
    fileName = `${base}.docx`;
    mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    content = buildDocx(html);
    kind = "docx";
  } else if (ext === "pdf") {
    fileName = `${base}.pdf`;
    mime = "application/pdf";
    content = buildPdf(html);
    kind = "docx";
  } else if (ext === "txt") {
    fileName = `${base}.txt`;
    mime = "text/plain";
    content = editor.getText() ?? "";
    kind = "txt";
    contentForRecent = content as string;
  } else if (ext === "html" || ext === "htm") {
    fileName = `${base}.html`;
    mime = "text/html";
    content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${base}</title></head><body>${html}</body></html>`;
    kind = "html";
    contentForRecent = content as string;
  } else {
    return { status: "needsSaveAs" };
  }

  const finish = (writtenPath: string) => {
    const store = useAppStore.getState();
    store.renameDocument(tab.id, fileName);
    store.markDirty(tab.id, false);
    store.setPath(tab.id, writtenPath);
    clearDraft(draftKey(tab.id));
    addRecentFile({ id: tab.id, name: fileName, kind, content: contentForRecent });
  };

  // Desktop app: write straight back to the file the tab came from. The write
  // is awaited so the caller only reports success once the bytes are on disk.
  if (isDesktopApp() && path) {
    try {
      await writeBytesAtomic(path, content);
    } catch (err) {
      console.error("[BritDocs] save failed", path, err);
      return {
        status: "error",
        message: describeSaveError(err),
      };
    }
    finish(path);
    return { status: "written", path };
  }

  downloadFile(fileName, mime, content);
  finish(fileName);
  return { status: "written", path: fileName };
}