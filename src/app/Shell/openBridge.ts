/**
 * Shared "open bytes into the editor" logic used by the browser file input,
 * the desktop open dialog and OS-driven file launches. Keeps one dispatch
 * implementation across all entry points.
 */
import type { Editor } from "@tiptap/core";
import { useAppStore } from "../../stores/appStore";
import { importBritdoc } from "../Editor/britdoc";
import { loadEditorContent } from "../Editor/EditorContext";
import { parseDocx } from "../Editor/docx";
import { parseRtf } from "../Editor/rtf";
import { addRecentFile } from "../../domain/persistence/recentFiles";
import { clearDraft, draftKey } from "../../domain/persistence/recovery";

export interface OpenOutcome {
  ok: boolean;
  message: string;
}

/**
 * Load a document from raw bytes. `fileName` is the display name (tab title
 * base); `filePath` is optional and, when given in the desktop app, becomes the
 * tab's real path so in-place Save can write back to it.
 */
export function openFileBytes(
  editor: Editor | null,
  bytes: Uint8Array,
  fileName: string,
  filePath?: string,
): OpenOutcome {
  const app = useAppStore.getState();
  const localName = fileName.toLowerCase();
  const title =
    fileName.replace(/\.(britdoc|docx|doc|rtf|html?|txt)$/i, "") || "Imported";

  // Opening the same file twice must reuse its tab instead of adding a second
  // one: React StrictMode replays this effect, and a double-clicked document
  // would otherwise end up open twice.
  const targetPath = filePath ?? fileName;
  const existing = filePath
    ? app.tabs.find((t) => t.path === filePath)
    : undefined;

  const loadIntoEditor = (id: string, tabTitle: string, load: () => void) => {
    clearDraft(draftKey(id));
    app.openDocument({ id, title: tabTitle, path: targetPath, dirty: false });
    app.renameDocument(id, tabTitle);
    load();
  };

  /** Reuse the tab already bound to this path; fall back to a new id. */
  const idFor = () => existing?.id ?? crypto.randomUUID();

  if (localName.endsWith(".britdoc")) {
    const source = new TextDecoder().decode(bytes);
    const result = importBritdoc(source, fileName);
    if (!result.ok) {
      return {
        ok: false,
        message: `Could not open "${fileName}": ${result.errors[0] ?? "invalid file"}.`,
      };
    }
    const id = idFor();
    app.setPageSizeId(result.page.size);
    app.setOrientation(result.page.orientation);
    app.setMargins(result.page.margins);
    loadIntoEditor(id, result.title, () => {
      loadEditorContent(editor, JSON.parse(result.json));
    });
    addRecentFile({ id, name: fileName, kind: "britdoc", content: source });
    return { ok: true, message: `Opened "${fileName}".` };
  }

  if (localName.endsWith(".html") || localName.endsWith(".htm")) {
    const text = new TextDecoder().decode(bytes);
    const id = idFor();
    loadIntoEditor(id, title, () => {
      loadEditorContent(editor, text);
    });
    addRecentFile({ id, name: fileName, kind: "html", content: text });
    return { ok: true, message: `Opened "${fileName}".` };
  }

  if (localName.endsWith(".docx")) {
    const html = parseDocx(bytes);
    if (!html) {
      return { ok: false, message: "Could not read that .docx file." };
    }
    const id = idFor();
    loadIntoEditor(id, title, () => {
      loadEditorContent(editor, html);
    });
    addRecentFile({ id, name: fileName, kind: "docx" });
    return { ok: true, message: `Opened "${fileName}".` };
  }

  if (localName.endsWith(".rtf")) {
    const html = parseRtf(bytes);
    if (!html) {
      return {
        ok: false,
        message: `Could not read "${fileName}" as RTF.`,
      };
    }
    const id = idFor();
    loadIntoEditor(id, title, () => {
      loadEditorContent(editor, html);
    });
    addRecentFile({ id, name: fileName, kind: "rtf" });
    return { ok: true, message: `Opened "${fileName}".` };
  }

  const text = new TextDecoder().decode(bytes);
  const id = idFor();
  loadIntoEditor(id, title, () => {
    loadEditorContent(editor, text.replace(/\n/g, "<br>"));
  });
  addRecentFile({ id, name: fileName, kind: "txt", content: text });
  return { ok: true, message: `Opened "${fileName}".` };
}