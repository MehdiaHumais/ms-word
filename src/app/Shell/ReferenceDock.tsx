import { useEffect, useState } from "react";
import { useEditorContext } from "../Editor/EditorContext";
import { useAppStore } from "../../stores/appStore";
import { useRefStore, formatSource, type Source } from "../../stores/refStore";
import { listFootnoteMarkers } from "../Editor/extensions/Footnote";

function PanelShell({
  title,
  onClose,
  children,
  testid,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  testid: string;
}) {
  return (
    <div
      className="fixed right-3 top-[118px] z-30 flex h-[calc(100%-172px)] w-[360px] flex-col rounded border border-[#e1e1e1] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
      data-testid={testid}
    >
      <div className="flex items-center justify-between border-b border-[#e8e8e8] px-3 py-2">
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-[#1b1b1b]">{title}</span>
        </div>
        <button
          className="text-[#5b5b5b] hover:text-[#0078d4]"
          onClick={onClose}
          aria-label={`Close ${title} panel`}
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2">{children}</div>
    </div>
  );
}

/* ---------------- Footnotes / Endnotes ---------------- */

function FootnotesPanel() {
  const editor = useEditorContext();
  const footnotes = useRefStore((s) => s.footnotes);
  const updateFootnote = useRefStore((s) => s.updateFootnote);
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

  const markers = editor ? listFootnoteMarkers(editor.state.doc) : [];

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-[#8a8a8a]">
        {markers.length} in-document {markers.length === 1 ? "marker" : "markers"}.
      </p>
      {footnotes.length === 0 ? (
        <p className="py-4 text-center text-[12px] text-[#9aa0a6]">
          No footnotes yet. Place the cursor where you want a note and click Insert Footnote.
        </p>
      ) : (
        footnotes.map((f) => (
          <div key={f.id} className="rounded border border-[#ececec] bg-[#fbfbfb] p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#4472c4]">
                {f.kind === "endnote" ? "Endnote" : "Footnote"} {f.number}
              </span>
            </div>
            <textarea
              value={f.text}
              onChange={(e) => updateFootnote(f.id, e.target.value)}
              rows={2}
              aria-label={`Footnote ${f.number} text`}
              placeholder="Type the note text…"
              className="w-full resize-y rounded border border-[#d0d0d0] px-2 py-1 text-[12px] text-[#333] focus:border-[#8ab4f8] focus:outline-none"
            />
          </div>
        ))
      )}
    </div>
  );
}

/* ---------------- Citations / Sources ---------------- */

function SourcesPanel() {
  const editor = useEditorContext();
  const sources = useRefStore((s) => s.sources);
  const removeSource = useRefStore((s) => s.removeSource);
  const updateSource = useRefStore((s) => s.updateSource);
  const [editing, setEditing] = useState<Source | null>(null);

  const save = (next: Source) => {
    updateSource(next);
    setEditing(null);
    editor?.chain().focus().refreshCitations().run();
  };

  if (editing) {
    const s = editing;
    const field = (label: string, key: keyof Source) => (
      <label className="block">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8a8a]">{label}</span>
        <input
          value={(s[key] ?? "") as string}
          onChange={(e) => setEditing({ ...s, [key]: e.target.value })}
          className="mt-0.5 w-full rounded border border-[#d0d0d0] px-2 py-1 text-[12px] focus:border-[#8ab4f8] focus:outline-none"
        />
      </label>
    );
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8a8a]">Type</span>
          <select
            value={s.type}
            onChange={(e) => setEditing({ ...s, type: e.target.value as Source["type"] })}
            className="rounded border border-[#d0d0d0] px-1 py-0.5 text-[12px]"
          >
            {["Book", "Web", "Journal", "Newspaper"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        {field("Author(s)", "author")}
        {field("Title", "title")}
        {field("Year", "year")}
        {field("Publisher", "publisher")}
        {field("City", "city")}
        {field("URL", "url")}
        <div className="flex gap-2 pt-1">
          <button
            data-testid="source-save"
            onClick={() => save(editing)}
            className="rounded border border-[#4472c4] bg-[#d6e4f7] px-3 py-1 text-[12px] font-semibold text-[#1e4a80] hover:bg-[#c9dcf3]"
          >
            Save
          </button>
          <button
            onClick={() => setEditing(null)}
            className="rounded border border-[#d0d0d0] px-3 py-1 text-[12px] hover:bg-[#f0f4fa]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sources.map((s) => (
        <div key={s.id} className="flex items-start justify-between gap-2 rounded border border-[#ececec] bg-[#fbfbfb] p-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#4472c4]">{s.type}</div>
            <p className="text-[11.5px] leading-snug text-[#333]">{formatSource(s)}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => setEditing({ ...s })}
              className="rounded border border-[#d0d0d0] px-1.5 py-0.5 text-[11px] hover:bg-[#eaf1fa]"
            >
              Edit
            </button>
            <button
              onClick={() => {
                removeSource(s.id);
                editor?.chain().focus().refreshCitations().run();
              }}
              className="rounded border border-[#d0d0d0] px-1.5 py-0.5 text-[11px] text-[#8a1f1f] hover:bg-[#fde8e8]"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Index ---------------- */

function IndexPanel() {
  const indexEntries = useRefStore((s) => s.indexEntries);
  const removeIndexEntry = useRefStore((s) => s.removeIndexEntry);
  const sorted = [...indexEntries].sort((a, b) => a.term.localeCompare(b.term));
  return (
    <div className="space-y-1">
      {sorted.length === 0 ? (
        <p className="py-4 text-center text-[12px] text-[#9aa0a6]">
          No index entries yet. Select a word and click Mark Entry.
        </p>
      ) : (
        sorted.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded border border-[#ececec] bg-[#fbfbfb] px-2 py-1">
            <span className="text-[12px] text-[#333]">
              {e.term}
              {e.subterm ? <span className="text-[#8a8a8a]">, {e.subterm}</span> : null}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#8a8a8a]">p. {e.page}</span>
              <button
                onClick={() => removeIndexEntry(e.id)}
                className="rounded p-0.5 text-[#8a1f1f] hover:bg-[#fde8e8]"
              >
                ✕
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ---------------- Table of Contents ---------------- */

function TocPanel() {
  const editor = useEditorContext();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const bump = () => setTick((t) => t + 1);
    editor.on("transaction", bump);
    return () => {
      editor.off("transaction", bump);
    };
  }, [editor]);

  const headings = editor
    ? (() => {
        const out: { level: number; text: string }[] = [];
        editor.state.doc.descendants((node) => {
          if (node.type.name === "heading" && node.textContent.trim()) {
            out.push({ level: node.attrs.level as number, text: node.textContent });
          }
          return true;
        });
        return out;
      })()
    : [];
  void tick;

  return (
    <div className="space-y-1">
      <p className="text-[11px] text-[#8a8a8a]">
        The table of contents is generated from the document headings.
      </p>
      {headings.length === 0 ? (
        <p className="py-4 text-center text-[12px] text-[#9aa0a6]">
          No headings yet — apply Heading styles to add entries.
        </p>
      ) : (
        headings.map((h, i) => (
          <div
            key={i}
            className="flex justify-between gap-2 rounded border border-[#ececec] bg-[#fbfbfb] px-2 py-1 text-[12px] text-[#333]"
            style={{ paddingLeft: `${8 + (h.level - 1) * 14}px` }}
          >
            <span className="truncate">{h.text}</span>
            <span className="text-[10px] text-[#8a8a8a]">Heading {h.level}</span>
          </div>
        ))
      )}
    </div>
  );
}

/* ---------------- Dock picker ---------------- */

export function ReferenceDock() {
  const panel = useAppStore((s) => s.referencePanel);
  const show = useAppStore((s) => s.showReferencePanel);
  const close = () => useAppStore.getState().setReferencePanel(panel, false);

  if (!show) return null;
  switch (panel) {
    case "toc":
      return (
        <PanelShell title="Table of Contents" onClose={close} testid="ref-panel-toc">
          <TocPanel />
        </PanelShell>
      );
    case "footnotes":
      return (
        <PanelShell title="Footnotes & Endnotes" onClose={close} testid="ref-panel-footnotes">
          <FootnotesPanel />
        </PanelShell>
      );
    case "citations":
      return (
        <PanelShell title="Manage Sources" onClose={close} testid="ref-panel-citations">
          <SourcesPanel />
        </PanelShell>
      );
    case "index":
      return (
        <PanelShell title="Index" onClose={close} testid="ref-panel-index">
          <IndexPanel />
        </PanelShell>
      );
    default:
      return null;
  }
}