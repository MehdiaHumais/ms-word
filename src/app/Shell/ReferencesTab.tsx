import { useState } from "react";
import { useEditorContext } from "../Editor/EditorContext";
import { useAppStore } from "../../stores/appStore";
import { useRefStore } from "../../stores/refStore";
import { citationText } from "../Editor/extensions/Citation";
import { Group, RvCell, Popover, MenuSection, MenuItem } from "./tabKit";
import {
  IconToc,
  IconAddText,
  IconUpdateTable,
  IconFootnote,
  IconEndnote,
  IconCitation,
  IconManageSources,
  IconBibliography,
  IconCaption,
  IconTableOfFigures,
  IconCrossReference,
  IconMarkEntry,
  IconIndex,
  IconMarkCitation,
  IconTableOfAuthorities,
} from "./icons";

export function ReferencesTab() {
  const editor = useEditorContext();
  const sources = useRefStore((s) => s.sources);
  const addSource = useRefStore((s) => s.addSource);
  const indexEntries = useRefStore((s) => s.indexEntries);
  const addIndexEntry = useRefStore((s) => s.addIndexEntry);
  const captions = useRefStore((s) => s.captions);
  const addCaption = useRefStore((s) => s.addCaption);
  const referencePanel = useAppStore((s) => s.referencePanel);
  const setReferencePanel = useAppStore((s) => s.setReferencePanel);
  const showReferencePanel = useAppStore((s) => s.showReferencePanel);

  const [menu, setMenu] = useState<null | string>(null);
  const [showIndexDialog, setShowIndexDialog] = useState(false);
  const [showCaptionDialog, setShowCaptionDialog] = useState(false);
  const [showNewSource, setShowNewSource] = useState(false);

  const togglePanel = (panel: "toc" | "footnotes" | "citations" | "index") => {
    const now = showReferencePanel && referencePanel === panel;
    setReferencePanel(panel, !now);
  };

  const selectedText = () =>
    editor ? editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, " ") : "";

  const insertFootnote = (kind: "footnote" | "endnote") => {
    editor?.chain().focus().insertFootnote(kind).run();
    setMenu(null);
  };

  const insertBibliography = () => {
    editor?.chain().focus().insertBibliography().run();
    setMenu(null);
  };

  const insertCitationFor = (sourceId: string) => {
    editor?.chain().focus().insertCitation(sourceId).run();
    setMenu(null);
  };

  /* --- dialogs --- */

  if (showNewSource) {
    return (
      <NewSourceDialog
        onClose={() => setShowNewSource(false)}
        onSave={(s) => {
          addSource(s);
          setShowNewSource(false);
        }}
      />
    );
  }

  return (
    <div className="flex h-[104px] items-stretch px-1" data-testid="references-tab">
      {/* Table of Contents */}
      <Group title="Table of Contents">
        <RvCell
          title="Table of Contents"
          icon={<IconToc />}
          testid="btnToc"
          active={showReferencePanel && referencePanel === "toc"}
          onClick={() => {
            setMenu(menu === "toc" ? null : "toc");
          }}
        />
        <RvCell
          title="Add Text"
          icon={<IconAddText />}
          testid="btnTocAddText"
          onClick={() => {
            setMenu(null);
            editor?.chain().focus().setParagraph().run();
          }}
        />
        <RvCell
          title="Update Table"
          icon={<IconUpdateTable />}
          testid="btnUpdateToc"
          onClick={() => {
            setMenu(null);
            editor?.chain().focus().insertContent({ type: "paragraph", content: [{ type: "text", text: "Table of Contents" }] }).run();
            togglePanel("toc");
          }}
        />
        <Popover open={menu === "toc"} onClose={() => setMenu(null)} align="left-0">
          <MenuSection title="Insert Table of Contents" />
          <MenuItem
            onClick={() => {
              setMenu(null);
              editor?.chain().focus().insertContent({ type: "paragraph", content: [{ type: "text", text: "Table of Contents" }] }).run();
              togglePanel("toc");
            }}
          >
            Automatic Table
            <span className="text-[9px] text-[#8a8a8a]">Built from headings</span>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setMenu(null);
              togglePanel("toc");
            }}
          >
            View Headings List
          </MenuItem>
        </Popover>
      </Group>

      {/* Footnotes */}
      <Group title="Footnotes">
        <RvCell
          title="Insert Footnote"
          icon={<IconFootnote />}
          testid="btnInsertFootnote"
          onClick={() => insertFootnote("footnote")}
        />
        <RvCell
          title="Insert Endnote"
          icon={<IconEndnote />}
          testid="btnInsertEndnote"
          onClick={() => insertFootnote("endnote")}
        />
        <RvCell
          title="Footnotes"
          icon={<IconFootnote />}
          testid="btnFootnotesPanel"
          active={showReferencePanel && referencePanel === "footnotes"}
          onClick={() => togglePanel("footnotes")}
        />
      </Group>

      {/* Citations & Bibliography */}
      <Group title="Citations & Bibliography">
        <RvCell
          title="Insert Citation"
          icon={<IconCitation />}
          testid="btnInsertCitation"
          active={menu === "citation"}
          onClick={() => setMenu(menu === "citation" ? null : "citation")}
        />
        <RvCell
          title="Manage Sources"
          icon={<IconManageSources />}
          testid="btnManageSources"
          active={showReferencePanel && referencePanel === "citations"}
          onClick={() => togglePanel("citations")}
        />
        <RvCell
          title="Bibliography"
          icon={<IconBibliography />}
          testid="btnBibliography"
          onClick={insertBibliography}
        />
        <Popover open={menu === "citation"} onClose={() => setMenu(null)} align="left-0">
          <MenuSection title="Insert Citation" />
          {sources.length === 0 && (
            <p className="px-2 py-1 text-[11px] text-[#8a8a8a]">No sources yet.</p>
          )}
          {sources.map((s) => (
            <MenuItem key={s.id} onClick={() => insertCitationFor(s.id)}>
              <span className="text-[10px] font-bold uppercase text-[#4472c4]">{s.type}</span>
              {citationText(s.id)}
            </MenuItem>
          ))}
          <div className="my-1 border-t border-[#ececec]" />
          <MenuItem
            onClick={() => {
              setMenu(null);
              setShowNewSource(true);
            }}
          >
            + Add New Source
          </MenuItem>
        </Popover>
      </Group>

      {/* Captions */}
      <Group title="Captions">
        <RvCell
          title="Insert Caption"
          icon={<IconCaption />}
          testid="btnInsertCaption"
          onClick={() => {
            setMenu(null);
            setShowCaptionDialog(true);
          }}
        />
        <RvCell
          title="Table of Figures"
          icon={<IconTableOfFigures />}
          testid="btnTableOfFigures"
          onClick={() => {
            setMenu(null);
            if (captions.length === 0) setShowCaptionDialog(true);
            else togglePanel("toc");
          }}
        />
        <RvCell
          title="Cross-Reference"
          icon={<IconCrossReference />}
          testid="btnCrossReference"
          onClick={() => {
            setMenu(null);
            const sel = editor?.state.selection;
            if (editor && sel && !sel.empty) {
              editor.chain().focus().toggleBold().run();
            }
          }}
        />
      </Group>

      {/* Index */}
      <Group title="Index">
        <RvCell
          title="Mark Entry"
          icon={<IconMarkEntry />}
          testid="btnMarkEntry"
          onClick={() => {
            setMenu(null);
            setShowIndexDialog(true);
          }}
        />
        <RvCell
          title="Insert Index"
          icon={<IconIndex />}
          testid="btnInsertIndex"
          disabled={indexEntries.length === 0}
          onClick={() => {
            setMenu(null);
            togglePanel("index");
          }}
        />
        <RvCell
          title="Mark Citation"
          icon={<IconMarkCitation />}
          testid="btnMarkCitation"
          onClick={() => {
            setMenu(null);
            const sel = editor?.state.selection;
            if (editor && sel && !sel.empty) {
              editor.chain().focus().setHighlight({ color: "#fff24d" }).run();
            }
          }}
        />
      </Group>

      {/* Table of Authorities */}
      <Group title="Table of Authorities">
        <RvCell
          title="Mark Citation"
          icon={<IconTableOfAuthorities />}
          testid="btnMarkAuthority"
          onClick={() => {
            setMenu(null);
            const sel = editor?.state.selection;
            if (editor && sel && !sel.empty) {
              editor.chain().focus().setBold().run();
            }
          }}
        />
        <RvCell
          title="Insert TOA"
          icon={<IconTableOfAuthorities />}
          testid="btnInsertTOA"
          onClick={() => {
            setMenu(null);
            editor?.chain().focus().insertContent({ type: "paragraph", content: [{ type: "text", text: "Table of Authorities" }] }).run();
            togglePanel("toc");
          }}
        />
      </Group>

      {showIndexDialog && (
        <IndexEntryDialog
          word={selectedText()}
          onClose={() => setShowIndexDialog(false)}
          onAdd={(term, subterm) => {
            addIndexEntry(term, subterm || undefined, "1");
            setShowIndexDialog(false);
          }}
        />
      )}
      {showCaptionDialog && <CaptionDialog onClose={() => setShowCaptionDialog(false)} onAdd={addCaption} />}
    </div>
  );
}

/* --- New source dialog --- */

function NewSourceDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (s: { id: string; type: "Book" | "Web" | "Journal" | "Newspaper"; author: string; title: string; year: string; publisher?: string; city?: string; url?: string }) => void;
}) {
  const [src, setSrc] = useState<{
    id: string;
    type: "Book" | "Web" | "Journal" | "Newspaper";
    author: string;
    title: string;
    year: string;
    publisher: string;
    city: string;
    url: string;
  }>({
    id: `s${Date.now()}`,
    type: "Book",
    author: "",
    title: "",
    year: new Date().getFullYear().toString(),
    publisher: "",
    city: "",
    url: "",
  });
  const set = (patch: Partial<typeof src>) => setSrc((s) => ({ ...s, ...patch }));
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20" onClick={onClose}>
      <div
        className="w-[460px] rounded border border-[#c8c8c8] bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.35)]"
        data-testid="new-source-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-[14px] font-semibold text-[#1b1b1b]">Create Source</h3>
        <div className="space-y-2">
          <label className="block">
            <span className="text-[10px] font-semibold uppercase text-[#8a8a8a]">Type</span>
            <select
              value={src.type}
              onChange={(e) => set({ type: e.target.value as typeof src.type })}
              className="w-full rounded border border-[#d0d0d0] px-2 py-1 text-[12px]"
            >
              {["Book", "Web", "Journal", "Newspaper"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          {(["author", "title", "year", "publisher", "city", "url"] as const).map((f) => (
            <label
              key={f}
              className={`block ${f === "publisher" && src.type === "Web" ? "hidden" : ""} ${f === "city" ? "hidden" : ""}`}
            >
              <span className="text-[10px] font-semibold uppercase text-[#8a8a8a]">{f}</span>
              <input
                value={src[f] ?? ""}
                onChange={(e) => set({ [f]: e.target.value } as Partial<typeof src>)}
                className="w-full rounded border border-[#d0d0d0] px-2 py-1 text-[12px] focus:border-[#8ab4f8] focus:outline-none"
              />
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded border border-[#d0d0d0] px-3 py-1 text-[12px] hover:bg-[#f0f4fa]"
          >
            Cancel
          </button>
          <button
            data-testid="source-save-new"
            onClick={() => src.author && src.title && onSave(src)}
            disabled={!src.author || !src.title}
            className="rounded border border-[#4472c4] bg-[#d6e4f7] px-3 py-1 text-[12px] font-semibold text-[#1e4a80] hover:bg-[#c9dcf3] disabled:opacity-40"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Index entry dialog --- */

function IndexEntryDialog({
  word,
  onClose,
  onAdd,
}: {
  word: string;
  onClose: () => void;
  onAdd: (term: string, subterm?: string) => void;
}) {
  const [term, setTerm] = useState(word || "");
  const [subterm, setSubterm] = useState("");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20" onClick={onClose}>
      <div
        className="w-[400px] rounded border border-[#c8c8c8] bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.35)]"
        data-testid="index-entry-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-[14px] font-semibold text-[#1b1b1b]">Mark Index Entry</h3>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase text-[#8a8a8a]">Main entry</span>
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            data-testid="index-term"
            className="w-full rounded border border-[#d0d0d0] px-2 py-1 text-[12px] focus:border-[#8ab4f8] focus:outline-none"
          />
        </label>
        <label className="mt-2 block">
          <span className="text-[10px] font-semibold uppercase text-[#8a8a8a]">Subentry (optional)</span>
          <input
            value={subterm}
            onChange={(e) => setSubterm(e.target.value)}
            data-testid="index-subterm"
            className="w-full rounded border border-[#d0d0d0] px-2 py-1 text-[12px] focus:border-[#8ab4f8] focus:outline-none"
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded border border-[#d0d0d0] px-3 py-1 text-[12px] hover:bg-[#f0f4fa]">
            Cancel
          </button>
          <button
            data-testid="index-add"
            onClick={() => term.trim() && onAdd(term.trim(), subterm.trim() || undefined)}
            disabled={!term.trim()}
            className="rounded border border-[#4472c4] bg-[#d6e4f7] px-3 py-1 text-[12px] font-semibold text-[#1e4a80] hover:bg-[#c9dcf3] disabled:opacity-40"
          >
            Mark
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Caption dialog --- */

function CaptionDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (label: "Figure" | "Table" | "Equation", text: string) => string;
}) {
  const [label, setLabel] = useState<"Figure" | "Table" | "Equation">("Figure");
  const [text, setText] = useState("");
  const captions = useRefStore((s) => s.captions);
  const next = captions.filter((c) => c.label === label).length + 1;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20" onClick={onClose}>
      <div
        className="w-[420px] rounded border border-[#c8c8c8] bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.35)]"
        data-testid="caption-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-[14px] font-semibold text-[#1b1b1b]">Caption</h3>
        <div className="flex items-center gap-2">
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value as typeof label)}
            className="rounded border border-[#d0d0d0] px-2 py-1 text-[12px]"
          >
            {["Figure", "Table", "Equation"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <span className="text-[12px] text-[#555]">{label} {next}</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Caption text…"
            data-testid="caption-text"
            className="flex-1 rounded border border-[#d0d0d0] px-2 py-1 text-[12px] focus:border-[#8ab4f8] focus:outline-none"
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded border border-[#d0d0d0] px-3 py-1 text-[12px] hover:bg-[#f0f4fa]">
            Cancel
          </button>
          <button
            data-testid="caption-add"
            onClick={() => {
              onAdd(label, text);
              onClose();
            }}
            className="rounded border border-[#4472c4] bg-[#d6e4f7] px-3 py-1 text-[12px] font-semibold text-[#1e4a80] hover:bg-[#c9dcf3]"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}