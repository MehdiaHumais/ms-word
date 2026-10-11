import { useEffect, useRef, useState } from "react";
import { useEditorContext } from "../Editor/EditorContext";
import { useAppStore } from "../../stores/appStore";
import { computeMatches, findReplaceKey } from "../Editor/extensions/FindReplace";

/**
 * Word-style Find & Replace panel. Rendered inside the editor overlay when the
 * store's `findOpen` flag is set (Find / Replace buttons on the Home ribbon).
 */
export function FindReplacePanel() {
  const editor = useEditorContext();
  const findOpen = useAppStore((s) => s.findOpen);
  const findMode = useAppStore((s) => s.findMode);
  const closeFind = useAppStore((s) => s.closeFind);

  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [stats, setStats] = useState({ current: 0, total: 0 });

  const findRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  // Sync highlights whenever the doc or query changes.
  useEffect(() => {
    const update = () => {
      const ps = findReplaceKey.getState(editor.state);
      if (!ps) return;
      const total = computeMatches(editor.state.doc, ps.query, ps.caseSensitive).length;
      setStats({ current: ps.current + 1, total });
    };
    editor.on("transaction", update);
    update();
    return () => {
      editor.off("transaction", update);
    };
  }, [editor]);

  // Focus the right input when the panel opens / mode changes.
  useEffect(() => {
    if (!findOpen) return;
    const t = window.setTimeout(() => {
      (findMode === "replace" ? replaceRef.current : findRef.current)?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [findOpen, findMode]);

  // Ctrl+F / F3 / Escape handling (Mod+F opens, Esc closes).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (findOpen) {
          e.preventDefault();
          closeFind();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const openFind = useAppStore.getState().openFind;
        openFind("find");
        return;
      }
      if (findOpen && e.key === "F3") {
        e.preventDefault();
        if (e.shiftKey) editor.commands.findPrevious();
        else editor.commands.findNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, findOpen, closeFind]);

  const applyQuery = (q: string) => {
    setQuery(q);
    editor.commands.find(q, caseSensitive);
  };

  if (!findOpen) return null;

  return (
    <div className="absolute right-2 top-2 z-30 w-[300px] rounded border border-[#c8c8c8] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between border-b border-[#e6e6e6] bg-[#f3f3f3] px-2 py-1">
        <span className="text-[11px] font-semibold text-[#333]">
          {findMode === "replace" ? "Find and Replace" : "Find"}
        </span>
        <button
          title="Close (Esc)"
          aria-label="Close find"
          onClick={closeFind}
          className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-[#444] hover:bg-[#e0e0e0] hover:text-[#111]"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 p-2">
        <div className="flex items-center gap-1.5">
          <input
            ref={findRef}
            value={query}
            onChange={(e) => applyQuery(e.target.value)}
            placeholder="Find…"
            spellCheck={false}
            className="h-[24px] min-w-0 flex-1 rounded border border-[#d0d0d0] px-1.5 text-[12px] text-[#333] outline-none focus:border-[#9fc4ec]"
          />
          <div className="grid w-[52px] shrink-0 grid-cols-2 gap-0.5">
            <button
              title="Previous match (Shift+F3)"
              aria-label="Previous match"
              disabled={stats.total === 0}
              onClick={() => editor.commands.findPrevious()}
              className="flex h-[24px] cursor-pointer items-center justify-center rounded border border-transparent text-[#333] hover:border-[#c1d3ec] hover:bg-[#eaf1fa] disabled:cursor-default disabled:opacity-35"
            >
              ▲
            </button>
            <button
              title="Next match (F3)"
              aria-label="Next match"
              disabled={stats.total === 0}
              onClick={() => editor.commands.findNext()}
              className="flex h-[24px] cursor-pointer items-center justify-center rounded border border-transparent text-[#333] hover:border-[#c1d3ec] hover:bg-[#eaf1fa] disabled:cursor-default disabled:opacity-35"
            >
              ▼
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-[#555]">
          <span>
            {stats.total === 0 ? "No results" : `${stats.current} of ${stats.total}`}
          </span>
          <button
            title="Match case"
            onClick={() => {
              const next = !caseSensitive;
              setCaseSensitive(next);
              editor.commands.find(query, next);
            }}
            className={`cursor-pointer rounded px-1.5 py-0.5 hover:bg-[#eaf1fa] ${
              caseSensitive ? "rounded border border-[#9fc4ec] bg-[#cfe3fb] text-[#1e4a80]" : ""
            }`}
          >
            Aa
          </button>
        </div>

        {findMode === "replace" && (
          <>
            <div className="flex items-center gap-1.5">
              <input
                ref={replaceRef}
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="Replace with…"
                spellCheck={false}
                className="h-[24px] min-w-0 flex-1 rounded border border-[#d0d0d0] px-1.5 text-[12px] text-[#333] outline-none focus:border-[#9fc4ec]"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={stats.total === 0}
                onClick={() => {
                  editor.commands.replaceCurrent(replacement);
                }}
                className="h-[24px] flex-1 cursor-pointer rounded border border-[#8ea9db] bg-[#e8f0fb] px-2 text-[12px] text-[#1e4a80] hover:bg-[#dbe7f7] disabled:cursor-default disabled:opacity-35"
              >
                Replace
              </button>
              <button
                disabled={stats.total === 0}
                onClick={() => {
                  editor.commands.replaceAll(replacement);
                }}
                className="h-[24px] flex-1 cursor-pointer rounded border border-[#8ea9db] bg-[#e8f0fb] px-2 text-[12px] text-[#1e4a80] hover:bg-[#dbe7f7] disabled:cursor-default disabled:opacity-35"
              >
                Replace All
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}