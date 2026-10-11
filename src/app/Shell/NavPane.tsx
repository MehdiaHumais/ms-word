import { useEffect, useMemo, useState } from "react";
import { useEditorContext } from "../Editor/EditorContext";
import { useAppStore } from "../../stores/appStore";

/**
 * Navigation Pane — Word's left-hand "Navigation" panel. Shows a search box
 * and a live outline of the document headings; clicking a heading jumps to it.
 */
export function NavPane() {
  const editor = useEditorContext();
  const toggleNavPane = useAppStore((s) => s.toggleNavPane);
  const [query, setQuery] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const bump = () => setTick((t) => t + 1);
    editor.on("transaction", bump);
    return () => {
      editor.off("transaction", bump);
    };
  }, [editor]);
  void tick;

  const headings = useMemo(() => {
    if (!editor) return [];
    const out: { level: number; text: string; from: number }[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        const t = node.textContent;
        if (t.trim()) out.push({ level: node.attrs.level as number, text: t, from: pos });
      }
      return true;
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, tick]);

  const filtered = query
    ? headings.filter((h) => h.text.toLowerCase().includes(query.toLowerCase()))
    : headings;

  const goTo = (from: number) => {
    editor?.commands.setTextSelection(from);
    editor?.commands.focus();
  };

  return (
    <div
      data-testid="nav-pane"
      className="flex h-full w-[248px] shrink-0 flex-col border-r border-[#dfe1e5] bg-white"
    >
      <div className="flex items-center gap-1 border-b border-[#e8e8e8] px-2 py-1.5">
        <div className="flex h-[26px] flex-1 items-center rounded border border-[#dadce0] bg-[#f1f3f4] px-2 focus-within:border-[#8ab4f8]">
          <svg className="h-3.5 w-3.5 text-[#70757a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Navigation"
            aria-label="Navigation search"
            className="ml-1 min-w-0 flex-1 bg-transparent text-[12px] text-[#202124] outline-none"
          />
        </div>
        <button
          title="Close"
          aria-label="Close navigation pane"
          onClick={toggleNavPane}
          className="text-[#5b5b5b] hover:text-[#0078d4]"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-auto p-1">
        <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#9aa0a6]">
          {query ? "Results" : "Headings"}
        </div>
        {filtered.length === 0 && (
          <p className="px-2 py-2 text-[11px] text-[#9aa0a6]">
            {query ? "No headings match your search." : "No headings in this document yet."}
          </p>
        )}
        {filtered.map((h, i) => (
          <button
            key={i}
            onClick={() => goTo(h.from)}
            className="block w-full cursor-pointer rounded px-2 py-1 text-left text-[12px] text-[#3c4043] hover:bg-[#e8f0fe]"
            style={{ paddingLeft: `${8 + (h.level - 1) * 16}px` }}
          >
            {query ? (
              <Highlight text={h.text} query={query} />
            ) : (
              h.text
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-[#f9e081] px-0.5 text-[#202124]">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}