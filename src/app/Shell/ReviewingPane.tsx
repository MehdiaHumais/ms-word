import { useEffect, useMemo, useState } from "react";
import { useEditorContext } from "../Editor/EditorContext";
import { useAppStore } from "../../stores/appStore";
import { listDocChanges, setPickedDelete } from "../Editor/extensions/ReviewChanges";
import { listCommentRanges } from "../Editor/extensions/Comment";

interface ChangeRow {
  kind: "insert" | "delete" | "comment";
  id: string;
  text: string;
  date: string;
}

/** Right-side reviewing pane listing tracked changes and comments. */
export function ReviewingPane() {
  const editor = useEditorContext();
  const mode = useAppStore((s) => s.reviewingPane);
  const changes = useAppStore((s) => s.changes);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const bump = () => setTick((t) => t + 1);
    editor.on("transaction", bump);
    return () => {
      editor.off("transaction", bump);
    };
  }, [editor]);

  const rows = useMemo<ChangeRow[]>(() => {
    if (!editor) return [];
    const state = editor.state;
    const items = listDocChanges(state).map((c) => ({
      kind: c.kind,
      id: c.id,
      text: c.text,
      date: c.kind === "delete" ? "tracked change" : "tracked change",
    }));
    const comments = listCommentRanges(state).map((c) => ({
      kind: "comment" as const,
      id: c.id,
      text: c.text,
      date: c.created ? new Date(c.created).toLocaleDateString() : "",
    }));
    return [...items, ...comments].sort(() => 0);
  }, [editor, tick, changes]);

  if (mode !== "vertical") return null;
  if (!editor) return null;

  const jump = (row: ChangeRow) => {
    if (row.kind === "comment") {
      editor.chain().focus().selectComment(row.id).run();
      return;
    }
    if (row.kind === "insert") {
      const item = listDocChanges(editor.state).find((c) => c.id === row.id);
      if (item && item.kind === "insert") {
        editor.chain().focus().setTextSelection({ from: item.from, to: item.to }).run();
      }
      return;
    }
    const item = listDocChanges(editor.state).find((c) => c.id === row.id);
    if (item && item.kind === "delete") {
      setPickedDelete(item.id);
      editor.chain().focus().setTextSelection(item.at).run();
    }
  };

  return (
    <div
      className="fixed left-3 top-[118px] z-30 flex h-[calc(100%-172px)] w-[320px] flex-col rounded border border-[#e1e1e1] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
      data-testid="reviewing-pane"
    >
      <div className="flex items-center justify-between border-b border-[#e8e8e8] px-3 py-2">
        <span className="text-[13px] font-semibold text-[#1b1b1b]">Reviewing Pane</span>
        <button
          className="text-[#5b5b5b] hover:text-[#0078d4]"
          onClick={() => useAppStore.getState().setReviewingPane("off")}
          aria-label="Close reviewing pane"
        >
          ✕
        </button>
      </div>
      <div className="flex items-center gap-3 border-b border-[#e8e8e8] px-3 py-2 text-[11px] font-semibold text-[#5b5b5b]">
        <span
          className="flex items-center gap-1"
          data-testid="rp-changes"
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#2ea043]" />
          {rows.filter((r) => r.kind === "insert").length} insertions
        </span>
        <span
          className="flex items-center gap-1"
          data-testid="rp-deletions"
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#d93025]" />
          {rows.filter((r) => r.kind === "delete").length} deletions
        </span>
      </div>
      <div className="flex-1 overflow-auto p-1">
        {rows.length === 0 ? (
          <div className="px-3 py-4 text-center text-[12px] text-[#8a8a8a]">
            No changes or comments.
          </div>
        ) : (
          rows.map((row, i) => (
            <button
              key={`${row.id}-${i}`}
              className="block w-full rounded px-2 py-2 text-left hover:bg-[#f3f6fa]"
              onClick={() => jump(row)}
            >
              <div className="mb-0.5 flex items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    row.kind === "insert"
                      ? "bg-[#e6f4ea] text-[#1e7e34]"
                      : row.kind === "delete"
                        ? "bg-[#fde9e9] text-[#c5221f]"
                        : "bg-[#fef7e0] text-[#9a6700]"
                  }`}
                >
                  {row.kind === "insert" ? "Inserted" : row.kind === "delete" ? "Deleted" : "Commented"}
                </span>
                <span className="text-[10px] text-[#9a9a9a]">{row.date}</span>
              </div>
              <div
                className={`line-clamp-2 text-[12px] text-[#3b3b3b] ${
                  row.kind === "delete" ? "line-through decoration-[#d93025]" : ""
                }`}
              >
                {row.text || "(empty)"}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}