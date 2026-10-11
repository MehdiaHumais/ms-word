import { createContext, useContext, type ReactNode } from "react";
import { useEditor } from "@tiptap/react";
import type { Editor, EditorOptions } from "@tiptap/core";
import { createEditorExtensions, editorAttributes } from "./editorConfig";
import { useAppStore } from "../../stores/appStore";
import { draftKey, readDraft, writeDraft } from "../../domain/persistence/recovery";

interface EditorContextValue {
  editor: Editor;
}

/**
 * Depth counter for programmatic content loads.
 *
 * Tiptap fires `onUpdate` for a programmatic `setContent` exactly as it does
 * for real typing, so a naive `onUpdate -> markDirty` would report every freshly
 * opened file as having unsaved edits and make the "unsaved changes" guard fire
 * on documents the user never touched. Bracketing loads keeps `dirty` meaning
 * "changed since the last save".
 */
let loadDepth = 0;

/** Run a content load (open a file, restore a draft, start a new document). */
export function loadEditorContent(
  editor: Editor | null | undefined,
  content: string | Record<string, unknown>,
  options: { focus?: boolean } = {},
): void {
  if (!editor) return;
  loadDepth += 1;
  try {
    const chain = editor.chain();
    if (options.focus !== false) chain.focus();
    chain.setContent(content as Parameters<typeof chain.setContent>[0]).run();
  } finally {
    loadDepth -= 1;
  }
}

/** Is an `onUpdate` caused by a load rather than by the user? */
export function isLoadingContent(): boolean {
  return loadDepth > 0;
}

const EditorContext = createContext<EditorContextValue | null>(null);

/**
 * Wraps Tiptap's own `useEditor` hook. We do NOT manually destroy the editor:
 * that breaks React StrictMode, whose simulated unmount would destroy a
 * manually-managed instance. `useEditor` handles the lifecycle correctly.
 *
 * Autosave writes a per-document draft (crash recovery, V1 scope) keyed by the
 * active tab's id. The AppShell boot flow then offers to restore leftover
 * drafts from a previous session via a Recovery dialog instead of silently
 * injecting content.
 */
export function EditorProvider({
  children,
  onCreate,
}: {
  children: ReactNode;
  onCreate?: EditorOptions["onCreate"];
}) {
  const editor = useEditor(
    {
      extensions: createEditorExtensions(),
      content: "<p></p>",
      immediatelyRender: true,
      onCreate({ editor }) {
        onCreate?.({ editor });
      },
      onUpdate({ editor }) {
        const html = editor.getHTML();
        if (!html || html.replace(/<[^>]+>/g, "").trim() === "") return;
        const activeId = useAppStore.getState().activeId;
        if (!activeId) return;
        // A real edit means the document now differs from what is on disk.
        // Without this the tab never shows as unsaved and no guard can warn.
        if (!isLoadingContent()) {
          useAppStore.getState().markDirty(activeId, true);
        }
        const tab = useAppStore.getState().tabs.find((t) => t.id === activeId);
        writeDraft(draftKey(activeId), {
          title: tab?.title ?? "Untitled",
          html,
          updatedAt: Date.now(),
        });
      },
      editorProps: {
        attributes: editorAttributes,
      },
    },
    // A stable dependency list keeps Tiptap from tearing down and re-creating
    // the instance on every render, which would reset the document back to the
    // initial empty paragraph and discard anything opened into the editor.
    [],
  );

  if (!editor) {
    return null;
  }

  return (
    <EditorContext.Provider value={{ editor }}>{children}</EditorContext.Provider>
  );
}

/** Does a crash-recovery draft exist for this tab? */
export function hasDraft(tabId: string): boolean {
  return readDraft(draftKey(tabId)) !== null;
}

export function useEditorContext(): Editor {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error("useEditorContext must be used inside <EditorProvider>");
  }
  return ctx.editor;
}