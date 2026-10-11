import { useEditorContext } from "../Editor/EditorContext";
import { isDesktopApp } from "../../domain/env";
import { IconRedo, IconUndo, IconSearch, IconSaveFile } from "./icons";
import { useAppStore } from "../../stores/appStore";
import { saveActiveDocument } from "./fileActions";

interface TitleBarProps {
  title: string;
  onSaveAs: () => void;
}

/** Word-style title bar: app mark, Quick Access undo/redo, a search field and window controls placeholders. */
export function TitleBar({ title, onSaveAs }: TitleBarProps) {
  const editor = useEditorContext();

  return (
    <header className="flex h-[42px] select-none items-center gap-3 border-b border-[#d0d0d0] bg-white px-2.5">
      {/* App mark */}
      <div className="flex items-center gap-2">
        <span className="flex h-[28px] w-[28px] items-center justify-center rounded bg-[#185abd] text-[15px] font-bold text-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]">
          B
        </span>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-[#1a1a1a]">BritDocs</div>
          <div className="text-[11px] text-[#666]">Word Processor</div>
        </div>
      </div>

      <span className="mx-1 h-6 w-px bg-[#e0e0e0]" />

      {/* Quick Access Toolbar */}
      <div className="flex items-center gap-0.5">
        <button
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
          onClick={() => editor.chain().undo().run()}
          className="flex h-7 w-8 cursor-pointer items-center justify-center rounded-[3px] text-[#333] hover:bg-[#eaf1fa] hover:text-[#1e4a80]"
        >
          <IconUndo />
        </button>
        <button
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
          onClick={() => editor.chain().redo().run()}
          className="flex h-7 w-8 cursor-pointer items-center justify-center rounded-[3px] text-[#333] hover:bg-[#eaf1fa] hover:text-[#1e4a80]"
        >
          <IconRedo />
        </button>
        <button
          title="Save (Ctrl+S)"
          aria-label="Save"
          data-testid="btn-save"
          onClick={() => {
            void saveActiveDocument(editor).then((result) => {
              if (result.status === "needsSaveAs") onSaveAs();
              else if (result.status === "error") {
                useAppStore.getState().setSaveError(result.message);
              }
            });
          }}
          className="flex h-7 cursor-pointer items-center gap-1 rounded-[3px] px-2 text-[12px] text-[#333] hover:bg-[#eaf1fa] hover:text-[#1e4a80]"
        >
          <IconSaveFile />
          Save
        </button>
        <button
          title="Save As (Ctrl+Shift+S)"
          aria-label="Save As"
          data-testid="btn-save-as"
          onClick={onSaveAs}
          className="flex h-7 cursor-pointer items-center gap-1 rounded-[3px] px-2 text-[12px] text-[#333] hover:bg-[#eaf1fa] hover:text-[#1e4a80]"
        >
          Save As
        </button>
      </div>

      {/* Document title */}
      <div className="min-w-0 flex-1 truncate text-center text-[13px] text-[#333]">
        <span className="font-medium">{title}</span>
      </div>

      {/* Tell me / search box */}
      <div className="flex w-[240px] items-center gap-1.5 rounded-[3px] border border-[#d0d0d0] px-2 py-1 focus-within:border-[#9fc4ec] focus-within:shadow-[0_0_0_1px_#9fc4ec]">
        <IconSearch className="text-[#666]" />
        <input
          placeholder="Tell me what you want to do"
          className="w-full bg-transparent text-[12px] text-[#333] outline-none placeholder:text-[#999]"
        />
      </div>

      {/* Window controls placeholders (web mode only — the Tauri shell has a native title bar) */}
      {!isDesktopApp() && (
        <div className="flex gap-1">
          <button title="Minimise" aria-label="Minimise" className="flex h-7 w-10 cursor-pointer items-center justify-center rounded-[3px] text-[#333] hover:bg-[#e5e5e5]">
            <span className="block h-px w-3 bg-current" />
          </button>
          <button title="Maximise" aria-label="Maximise" className="flex h-7 w-10 cursor-pointer items-center justify-center rounded-[3px] text-[#333] hover:bg-[#e5e5e5]">
            <span className="block h-3 w-3 border border-current" />
          </button>
          <button title="Close" aria-label="Close" className="flex h-7 w-10 cursor-pointer items-center justify-center rounded-[3px] text-[#333] hover:bg-[#e81123] hover:text-white">
            <span className="block h-3.5 w-3.5 [background:linear-gradient(45deg,transparent_43%,currentColor_43%,currentColor_57%,transparent_57%),linear-gradient(-45deg,transparent_43%,currentColor_43%,currentColor_57%,transparent_57%)]" />
          </button>
        </div>
      )}
    </header>
  );
}