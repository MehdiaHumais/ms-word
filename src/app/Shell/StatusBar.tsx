import { useEditorState } from "@tiptap/react";
import { useEditorContext } from "../Editor/EditorContext";
import { useAppStore } from "../../stores/appStore";

export function StatusBar() {
  const editor = useEditorContext();
  const zoom = useAppStore((s) => s.zoom);
  const zoomIn = useAppStore((s) => s.zoomIn);
  const zoomOut = useAppStore((s) => s.zoomOut);

  const stats = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const cc = e.storage.characterCount as
        | { words?: () => number; characters?: () => number }
        | undefined;
      return {
        words: cc?.words?.() ?? 0,
        chars: cc?.characters?.() ?? 0,
      };
    },
  });

  return (
    <footer className="flex h-6 select-none items-center justify-between border-t border-[#d0d0d0] bg-[#f0f0f0] px-3 text-xs text-[#555]">
      <div className="flex items-center gap-4">
        <span>
          {stats.words} words
        </span>
        <span>
          {stats.chars} characters
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span title="Page layout renders continuously until pagination lands (Phase 4)">
          Continuous page
        </span>
        <button
          title="Zoom out"
          onClick={zoomOut}
          className="rounded px-1.5 hover:bg-[#e0e0e0]"
        >
          −
        </button>
        <span aria-hidden>{zoom}%</span>
        <button
          title="Zoom in"
          onClick={zoomIn}
          className="rounded px-1.5 hover:bg-[#e0e0e0]"
        >
          +
        </button>
      </div>
    </footer>
  );
}