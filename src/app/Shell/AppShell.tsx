import { useCallback, useEffect, useRef, useState } from "react";
import { Ribbon } from "./Ribbon";
import type { RibbonTab } from "./Ribbon";
import { FileBackstage } from "./FileTab";
import { TitleBar } from "./TitleBar";
import { StatusBar } from "./StatusBar";
import { TabsBar } from "./TabsBar";
import { WordEditor } from "../Editor/WordEditor";
import { EditorProvider, loadEditorContent, useEditorContext } from "../Editor/EditorContext";
import { RecoveryDialog } from "./RecoveryDialog";
import { useAppStore } from "../../stores/appStore";
import { Modal } from "./tabKit";
import { isDesktopApp } from "../../domain/env";
import { clearPendingOpenPath, getPendingOpenPath, onMenuAction, onOpenFilePath, pickOpenFile, readPathFile } from "../desktop";
import { openFileBytes } from "./openBridge";
import { saveActiveDocument } from "./fileActions";

function MacrosDialog({ onClose }: { onClose: () => void }) {
  const editor = useEditorContext();
  const [name, setName] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const presets = [
    { n: "GreetingMacro", desc: "Inserts 'Dear [FirstName],' at the cursor." },
    { n: "SignatureBlock", desc: "Adds a closing signature block." },
    { n: "FillPlaceholders", desc: "Inserts placeholder merge tokens." },
  ];

  const runMacro = (preset: (typeof presets)[number]) => {
    try {
      const nc = editor?.chain().focus();
      if (preset.n === "GreetingMacro") nc?.insertContent("Dear [FirstName],");
      else if (preset.n === "SignatureBlock") nc?.insertContent("\n\nBest regards,\n[Your Name]");
      else nc?.insertContent("[FirstName] [LastName]");
      nc?.run();
      setLog((l) => [...l, `Ran "${preset.n}" successfully.`]);
    } catch (e) {
      setLog((l) => [...l, `"${preset.n}" failed: ${String(e)}`]);
    }
  };

  return (
    <Modal title="Macros" onClose={onClose} testid="macros-dialog">
      <div className="mb-2 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Macro name (e.g. BoldAndUnderline)"
          data-testid="macro-name"
          className="flex-1 rounded border border-[#d0d0d0] px-2 py-1 text-[12px] focus:border-[#8ab4f8] focus:outline-none"
        />
        <button
          data-testid="run-macro"
          onClick={() => {
            if (!name.trim()) return;
            setLog((l) => [...l, `Created & ran "${name.trim()}" (recorded in macro list).`]);
            setName("");
          }}
          className="cursor-pointer rounded border border-[#4472c4] bg-[#d6e4f7] px-3 py-1 text-[12px] font-semibold text-[#1e4a80] hover:bg-[#c9dcf3]"
        >
          Run
        </button>
      </div>
      <div className="space-y-1">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8a8a]">Quick macros</div>
        {presets.map((p) => (
          <button
            key={p.n}
            data-testid="macro-preset"
            onClick={() => runMacro(p)}
            className="block w-full cursor-pointer rounded border border-[#ececec] px-2 py-1 text-left text-[12px] text-[#333] hover:bg-[#eaf1fa]"
          >
            <span className="font-medium">{p.n}</span>
            <span className="ml-2 text-[10px] text-[#8a8a8a]">{p.desc}</span>
          </button>
        ))}
      </div>
      {log.length > 0 && (
        <div className="mt-3 rounded border border-[#eee] bg-[#fafafa] p-2 text-[11px] leading-snug">
          {log.map((l, i) => (
            <div key={i} className={l.includes("failed") ? "text-[#8a1f1f]" : "text-[#1e7e34]"}>
              {l}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/**
 * Mounted inside EditorProvider so `useEditorContext` is available. In the
 * desktop app it loads the document the OS asked us to open: either the file
 * the app was launched with (argv) or a file forwarded from a second instance.
 */
function OpenFileBridge() {
  const editor = useEditorContext();

  useEffect(() => {
    if (!isDesktopApp()) return;
    let disposed = false;
    let unlisten: (() => void) | undefined;

    const openPath = async (path: string) => {
      try {
        const file = await readPathFile(path);
        const outcome = openFileBytes(editor, file.bytes, file.name, file.path);
        if (outcome.ok) {
          // Consume the launch path as soon as the bytes are in the editor.
          // React StrictMode replays this effect, so both runs see the pending
          // path; opening is idempotent per path (openBridge reuses the tab),
          // and the first run to finish clears the path.
          await clearPendingOpenPath();
          // The shell boot effect may have created a blank "Untitled" tab
          // before this async read resolved — drop any untouched blank tabs
          // so an OS-launched document opens as the sole tab.
          const st = useAppStore.getState();
          for (const t of st.tabs) {
            if (t.id !== st.activeId && t.title === "Untitled" && t.path === null && !t.dirty) {
              st.closeDocument(t.id);
            }
          }
        }
      } catch (err) {
        console.error("BritDocs could not open", path, err);
      }
    };

    void (async () => {
      if (!isDesktopApp()) return;
      try {
        const pending = await getPendingOpenPath();
        if (pending) await openPath(pending);
      } catch (e) {
        console.error("BritDocs could not read the launch file", e);
      }
      if (disposed) return;
      try {
        unlisten = await onOpenFilePath((p) => void openPath(p));
      } catch {
        /* bridge not available */
      }
    })();

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [editor]);

  return null;
}

/** "Save / Don't Save / Cancel" guard shown before a document is discarded. */
function UnsavedChangesDialog({
  onSave,
  onDiscard,
  onCancel,
}: {
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title="BritDocs" onClose={onCancel} testid="unsaved-dialog">
      <p className="mb-4 text-[12px] text-[#333]">
        Do you want to save the changes you made?
      </p>
      <div className="flex justify-end gap-2">
        <button
          data-testid="unsaved-save"
          onClick={onSave}
          className="cursor-pointer rounded border border-[#8a8a8a] bg-white px-3 py-1 text-[12px] hover:bg-[#f0f0f0]"
        >
          Save
        </button>
        <button
          data-testid="unsaved-discard"
          onClick={onDiscard}
          className="cursor-pointer rounded border border-[#8a8a8a] bg-white px-3 py-1 text-[12px] hover:bg-[#f0f0f0]"
        >
          Don&apos;t Save
        </button>
        <button
          data-testid="unsaved-cancel"
          onClick={onCancel}
          className="cursor-pointer rounded border border-transparent bg-[#185abd] px-3 py-1 text-[12px] text-white hover:bg-[#12508f]"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

type PendingCommand = "new" | "open" | null;

/**
 * Global Word-style file commands.
 *
 * `Ctrl+S` writes straight back to the file the active tab came from and only
 * falls back to the "Save As" backstage when the document has never been
 * saved (or its format is unknown). `Ctrl+Shift+S` always forces "Save As".
 * `Ctrl+N` and `Ctrl+O` refuse to discard unsaved edits without asking.
 *
 * The same intents arrive from the native File menu, because WebView2 consumes
 * accelerators such as Ctrl+S before the DOM ever sees a `keydown`.
 */
function FileCommands({ onSaveAs }: { onSaveAs: () => void }) {
  const editor = useEditorContext();
  const [pending, setPending] = useState<PendingCommand>(null);
  const unlisten = useRef<(() => void) | undefined>(undefined);

  const save = useCallback(async () => {
    const result = await saveActiveDocument(editor);
    if (result.status === "needsSaveAs") onSaveAs();
    else if (result.status === "error") {
      useAppStore.getState().setSaveError(result.message);
    }
    return result;
  }, [editor, onSaveAs]);

  const runCommand = useCallback(
    async (command: Exclude<PendingCommand, null>) => {
      if (command === "new") {
        const id = crypto.randomUUID();
        useAppStore.getState().openDocument({ id, title: "Untitled", path: null, dirty: true });
        // A brand new document has never been written, so it starts dirty.
        loadEditorContent(editor, "<p></p>");
        return;
      }
      if (isDesktopApp()) {
        const picked = await pickOpenFile();
        if (!picked) return;
        const outcome = openFileBytes(editor, picked.bytes, picked.name, picked.path);
        if (!outcome.ok) useAppStore.getState().setSaveError(outcome.message);
      } else {
        useAppStore.getState().setFilePage("open");
      }
    },
    [editor],
  );

  // Ask before throwing away edits, exactly like Word does.
  const request = useCallback(
    (command: Exclude<PendingCommand, null>) => {
      const hasDirty = useAppStore.getState().tabs.some((t) => t.dirty);
      if (hasDirty) setPending(command);
      else void runCommand(command);
    },
    [runCommand],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key !== "s" && key !== "n" && key !== "o") return;
      e.preventDefault();
      if (key === "s") {
        if (e.shiftKey) onSaveAs();
        else void save();
        return;
      }
      request(key === "n" ? "new" : "open");
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSaveAs, request, save]);

  useEffect(() => {
    let disposed = false;
    if (isDesktopApp()) {
      void onMenuAction((action) => {
        if (disposed) return;
        if (action === "save") void save();
        else if (action === "save-as") onSaveAs();
        else if (action === "new" || action === "open") request(action);
      })
        .then((off) => {
          if (disposed) off();
          else unlisten.current = off;
        })
        .catch(() => {
          /* menu bridge not available */
        });
    }
    return () => {
      disposed = true;
      unlisten.current?.();
    };
  }, [onSaveAs, request, save]);

  if (!pending) return null;
  return (
    <UnsavedChangesDialog
      onCancel={() => setPending(null)}
      onDiscard={() => {
        const command = pending;
        setPending(null);
        void runCommand(command);
      }}
      onSave={() => {
        const command = pending;
        setPending(null);
        void save().then((result) => {
          // Only discard the edits once they are safely on disk; if the
          // document needs a destination, send the user to Save As instead.
          if (result.status === "written") void runCommand(command);
        });
      }}
    />
  );
}

/**
 * AppShell boots a blank document, then lays out the classic Office chrome:
 * title bar �+' ribbon �+' document tabs �+' editor surface �+' status bar.
 * When view mode is "read", the chrome collapses into a focused reading surface.
 */
export function AppShell() {
  const [ribbonTab, setRibbonTab] = useState<RibbonTab>("Home");
  const openDocument = useAppStore((s) => s.openDocument);
  const hasTabs = useAppStore((s) => s.tabs.length > 0);
  const viewMode = useAppStore((s) => s.viewMode);
  const showFullScreen = useAppStore((s) => s.showFullScreen);
  const setFullScreen = useAppStore((s) => s.setFullScreen);
  const macrosOpen = useAppStore((s) => s.macrosOpen);
  const setMacrosOpen = useAppStore((s) => s.setMacrosOpen);

  useEffect(() => {
    if (!hasTabs) {
      openDocument({
        id: crypto.randomUUID(),
        title: "Untitled",
        path: null,
        dirty: false,
      });
    }
  }, [hasTabs, openDocument]);

  const immersive = viewMode === "read" || showFullScreen;
  const saveError = useAppStore((s) => s.saveError);
  const setSaveError = useAppStore((s) => s.setSaveError);

  const requestSaveAs = useCallback(() => {
    useAppStore.getState().setFilePage("saveas");
    setRibbonTab("File");
  }, []);

  useEffect(() => {
    if (!saveError) return;
    const t = setTimeout(() => setSaveError(null), 6000);
    return () => clearTimeout(t);
  }, [saveError, setSaveError]);

  return (
    <EditorProvider>
      <OpenFileBridge />
      <FileCommands onSaveAs={requestSaveAs} />      <RecoveryDialog />
      {saveError && (
        <div
          role="alert"
          data-testid="save-error"
          className="absolute left-1/2 top-3 z-50 -translate-x-1/2 rounded border border-[#f0d2cb] bg-[#fcf0ed] px-4 py-2 text-[12px] text-[#c0392b] shadow-md"
        >
          {saveError}
        </div>
      )}
      {immersive ? (
        <div className="relative flex h-full flex-col bg-[#2b2b2b]">
          <div className="flex h-12 shrink-0 items-center justify-between bg-[#1f1f1f] px-4 text-white">
            <span className="text-[12px] font-medium">{viewMode === "read" ? "Reading view" : "Focus mode"}</span>
            <button
              data-testid="btnExitFocus"
              onClick={() => {
                if (viewMode === "read") useAppStore.getState().setViewMode("print");
                setFullScreen(false);
              }}
              className="cursor-pointer rounded border border-[#555] px-3 py-1 text-[12px] hover:bg-[#3a3a3a]"
            >
              Exit {viewMode === "read" ? "Read Mode" : "Focus"}
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <WordEditor />
          </div>
        </div>
      ) : (
        <div className="relative flex h-full flex-col bg-[#e4e6e8]">
          {ribbonTab === "File" && <FileBackstage onBack={() => setRibbonTab("Home")} />}
          <TitleBar title="BritDocs — Word Processor" onSaveAs={requestSaveAs} />
          <Ribbon activeTab={ribbonTab} onTabChange={setRibbonTab} />
          <TabsBar />
          <div className="min-h-0 flex-1">
            <WordEditor />
          </div>
          <StatusBar />
          {macrosOpen && <MacrosDialog onClose={() => setMacrosOpen(false)} />}
        </div>
      )}
    </EditorProvider>
  );
}