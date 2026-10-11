import { useRef, useState, type ReactNode } from "react";
import { loadEditorContent, useEditorContext } from "../Editor/EditorContext";
import { useAppStore } from "../../stores/appStore";
import { buildDocx } from "../Editor/docx";
import { buildPdf } from "../Editor/pdf";
import { exportBritdoc, importBritdoc, BRITDOC_MIME } from "../Editor/britdoc";
import { downloadFile, saveActiveDocument } from "./fileActions";
import { openFileBytes } from "./openBridge";
import { pickOpenFile, pickSavePath } from "../desktop";
import { describeSaveError, saveDocumentTo } from "./fileActions";
import { isDesktopApp } from "../../domain/env";
import { draftKey, clearDraft } from "../../domain/persistence/recovery";
import {
  addRecentFile,
  removeRecentFile,
  loadRecentFiles,
  type RecentFile,
} from "../../domain/persistence/recentFiles";
import {
  IconBackArrow,
  IconHome,
  IconNewFile,
  IconOpenFile,
  IconSaveAs,
  IconSaveFile,
  IconPrint,
  IconShare,
  IconExport,
  IconCloseFile,
  IconAccount,
  IconFeedback,
  IconOptions,
  IconPdf,
} from "./icons";

export type FilePage =
  | "home"
  | "new"
  | "open"
  | "save"
  | "saveas"
  | "print"
  | "share"
  | "export"
  | "close"
  | "account"
  | "feedback"
  | "options";

const currentFileName = () => {
  const app = useAppStore.getState();
  const tab = app.tabs.find((t) => t.id === app.activeId);
  return { id: tab?.id ?? app.activeId ?? "", title: tab?.title ?? "Untitled" };
};

function renderDocTemplate(): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><title>Document</title>
<style>
body { font-family: Calibri, "Segoe UI", sans-serif; font-size: 16px; line-height: 1.6; color: #1b1b1b; }
h1 { font-size: 28px; margin: 0 0 8px; } h2 { font-size: 22px; } p { margin: 0 0 10px; }
</style></head><body><p></p></body></html>`;
}

/* ---------------- Nav item ---------------- */

function NavItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-[208px] cursor-pointer items-center gap-3 rounded px-3 py-2 text-left text-[13px] ${
        active ? "bg-[#cfe3fb] font-medium text-[#1e4a80]" : "text-[#333] hover:bg-[#e9f0fa]"
      }`}
    >
      <span className="text-[#1e4a80]">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[12px] font-semibold text-[#1e4a80]">{title}</span>
        <div className="h-px flex-1 bg-[#dae2f0]" />
      </div>
      {children}
    </div>
  );
}

function Card({
  title,
  subtitle,
  extra,
  onClick,
}: {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded border border-[#e3e3e3] bg-white px-3 py-2.5 text-left ${
        onClick ? "cursor-pointer hover:border-[#9bbdf0] hover:bg-[#f2f7fd]" : "cursor-default"
      }`}
    >
      <div className="flex h-[44px] w-[36px] shrink-0 items-center justify-center rounded-sm border border-[#d0d0d0] bg-[#fafafa] text-[10px] font-bold text-[#4472c4]">
        {extra ?? "W"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-[#1b1b1b]">{title}</div>
        {subtitle && <div className="truncate text-[11px] text-[#7a7a7a]">{subtitle}</div>}
      </div>
    </button>
  );
}

/* ---------------- Recent files helper ---------------- */

function timeAgo(t: number): string {
  const mins = Math.floor((Date.now() - t) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function RecentList({
  files,
  onOpen,
  onRemove,
}: {
  files: RecentFile[];
  onOpen: (f: RecentFile) => void;
  onRemove: (id: string) => void;
}) {
  if (files.length === 0) {
    return <p className="py-6 text-center text-[12px] text-[#8a8a8a]">No recent documents yet.</p>;
  }
  return (
    <div className="space-y-1.5">
      {files.map((f) => (
        <div key={f.id} className="group relative">
          <Card title={f.name} subtitle={timeAgo(f.openedAt)} onClick={() => onOpen(f)} />
          <button
            title="Remove from recent"
            aria-label={`Remove ${f.name} from recent`}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(f.id);
            }}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 cursor-pointer rounded px-1 text-[13px] leading-none text-[#8a8a8a] hover:bg-[#e3e3e3] hover:text-[#333] group-hover:block"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Pages ---------------- */

function HomePage({
  go,
  files,
  onOpenRecent,
  onRemoveRecent,
}: {
  go: (p: FilePage) => void;
  files: RecentFile[];
  onOpenRecent: (f: RecentFile) => void;
  onRemoveRecent: (id: string) => void;
}) {
  return (
    <div>
      <Section title="Recent">
        <RecentList files={files} onOpen={onOpenRecent} onRemove={onRemoveRecent} />
      </Section>
      <Section title="Pinned">
        <p className="py-2 text-[12px] text-[#8a8a8a]">Pin documents you use often to keep them at the top of the list.</p>
      </Section>
      <button
        onClick={() => go("open")}
        className="cursor-pointer rounded border border-[#4472c4] bg-[#d6e4f7] px-3 py-1.5 text-[12px] font-semibold text-[#1e4a80] hover:bg-[#c9dcf3]"
      >
        Open other documents…
      </button>
    </div>
  );
}

const TEMPLATES: { name: string; desc: string; body: string }[] = [
  { name: "Blank document", desc: "A clean, empty page", body: "<p></p>" },
  {
    name: "Resume",
    desc: "Simple, professional resume",
    body: "<h1>Jane Doe</h1><p>jane.doe@example.com</p><h2>Experience</h2><p><strong>Example Corp</strong> — 2020–present</p><h2>Education</h2><p>B.Sc. Computer Science</p>",
  },
  {
    name: "Letter",
    desc: "Formal business letter",
    body: "<p>[Recipient]</p><p>Dear [Name],</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p><p>Sincerely,</p><p>[Your Name]</p>",
  },
  {
    name: "Report",
    desc: "Project or research report",
    body: "<h1>Report title</h1><h2>Introduction</h2><p>Write an introduction here…</p><h2>Findings</h2><p>Summarise your results…</p>",
  },
  {
    name: "Newsletter",
    desc: "Two-column newsletter",
    body: "<h1>Newsletter title</h1><p>Lead paragraph…</p><p>More content goes here.</p>",
  },
];

function NewPage({ onBack }: { onBack: () => void }) {
  const editor = useEditorContext();
  const openDocument = useAppStore((s) => s.openDocument);
const startDoc = (title: string, body: string) => {
    const id = crypto.randomUUID();
    openDocument({ id, title, path: null, dirty: true });
    clearDraft(draftKey(id));
    addRecentFile({ id, name: title, kind: "untitled" });
    loadEditorContent(editor, body);
    onBack();
  };
  return (
    <div>
      <Section title="Blank document">
        <div className="grid grid-cols-3 gap-3">
          <button
            data-testid="btnBlankDoc"
            onClick={() => startDoc("Untitled", "<p></p>")}
            className="cursor-pointer rounded border border-[#d8d8d8] bg-white p-3 text-left hover:border-[#0078d4] hover:shadow-md"
          >
            <div className="mb-2 flex h-[72px] items-center justify-center rounded border border-[#e3e3e3] bg-[#fafafa]">
              <IconNewFile className="h-[34px] w-[34px] text-[#4472c4]" />
            </div>
            <div className="text-[12px] font-semibold text-[#1b1b1b]">Blank document</div>
          </button>
          {TEMPLATES.slice(1).map((t) => (
            <button
              key={t.name}
              onClick={() => startDoc(t.name, t.body)}
              className="cursor-pointer rounded border border-[#d8d8d8] bg-white p-3 text-left hover:border-[#0078d4] hover:shadow-md"
            >
              <div className="mb-2 flex h-[72px] items-center justify-center rounded border border-[#e3e3e3] bg-[#f8fbfe]">
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#4472c4]">{t.name}</span>
              </div>
              <div className="text-[12px] font-semibold text-[#1b1b1b]">{t.name}</div>
              <div className="text-[10px] text-[#8a8a8a]">{t.desc}</div>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

function OpenPage({
  files,
  onOpenRecent,
  onRemoveRecent,
}: {
  files: RecentFile[];
  onOpenRecent: (f: RecentFile) => void;
  onRemoveRecent: (id: string) => void;
}) {
  const editor = useEditorContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result as ArrayBuffer);
      const outcome = openFileBytes(editor, bytes, f.name);
      if (!outcome.ok) setNotice(outcome.message);
    };
    reader.readAsArrayBuffer(f);
  };

  const browseNow = async () => {
    if (isDesktopApp()) {
      const picked = await pickOpenFile();
      if (!picked) return;
      const outcome = openFileBytes(editor, picked.bytes, picked.name, picked.path);
      if (!outcome.ok) setNotice(outcome.message);
      return;
    }
    fileRef.current?.click();
  };

  return (
    <div>
      {notice && (
        <div className="mb-4 rounded border border-[#cfe6d2] bg-[#eef7ef] px-3 py-2 text-[12px] text-[#1e7e34]">
          {notice}
        </div>
      )}
      <Section title="Recent documents">
        <RecentList files={files} onOpen={onOpenRecent} onRemove={onRemoveRecent} />
      </Section>
      <Section title="This PC">
        <div className="space-y-1.5">
          <Card title="Browse" subtitle="Choose a file from your computer" onClick={browseNow} extra={<IconOpenFile className="h-[20px] w-[20px]" />} />
          <Card title="Documents" subtitle="Open from your Documents folder" onClick={browseNow} extra={<IconOpenFile className="h-[20px] w-[20px]" />} />
        </div>
      </Section>
      <input ref={fileRef} type="file" accept=".britdoc,.docx,.doc,.rtf,.txt,.html,.htm" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
    </div>
  );
}

function SavePage({ onNeedSaveAs }: { onNeedSaveAs: () => void }) {
  const editor = useEditorContext();
  const tabs = useAppStore((s) => s.tabs);
  const activeId = useAppStore((s) => s.activeId);
  const setSaveError = useAppStore((s) => s.setSaveError);
  const tab = tabs.find((t) => t.id === activeId);
  const [done, setDone] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = () => {
    void saveActiveDocument(editor).then((result) => {
      setSaving(false);
      if (result.status === "needsSaveAs") {
        onNeedSaveAs();
        return;
      }
      if (result.status === "error") {
        setSaveError(result.message);
        return;
      }
      setDone(`Saved ${tab?.title ?? "document"}.`);
    });
    setSaving(true);
  };

  return (
    <div className="space-y-4">
      {done && (
        <div data-testid="save-done" className="rounded border border-[#cfe6d2] bg-[#eef7ef] px-3 py-2 text-[12px] text-[#1e7e34]">
          {done}
        </div>
      )}
      <div className="max-w-[520px] rounded border border-[#d0d0d0] bg-white p-4">
        <p className="mb-3 text-[12px] text-[#555]">
          {tab?.path
            ? `Saving “${tab.title}” back to its current file.`
            : "This document has not been saved yet — choose where to put it."}
        </p>
        <button
          data-testid="save-save"
          disabled={saving}
          onClick={save}
          className="cursor-pointer rounded bg-[#0078d4] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#005ba1] disabled:cursor-default disabled:bg-[#9dbfe0]"
        >
          {saving ? "Saving…" : "Save now"}
        </button>
      </div>
    </div>
  );
}

function SaveAsPage() {
  const editor = useEditorContext();
  const { id, title } = currentFileName();
  const renameDocument = useAppStore((s) => s.renameDocument);
  const markDirty = useAppStore((s) => s.markDirty);
  const setPath = useAppStore((s) => s.setPath);
  const margins = useAppStore((s) => s.margins);
  const pageSizeId = useAppStore((s) => s.pageSizeId);
  const orientation = useAppStore((s) => s.orientation);
  const proofingLang = useAppStore((s) => s.proofingLang);
  const [name, setName] = useState(title.replace(/\.(britdoc|docx?|html?|txt)$/i, ""));
  const [format, setFormat] = useState<
    "BritDocs Document" | "Word Document" | "PDF" | "Plain Text"
  >("BritDocs Document");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const finalName = name.trim() || "Untitled";
    const html = editor?.getHTML() ?? "<p></p>";
    if (!html.replace(/<[^>]*>/g, "").trim()) {
      setDone(null);
      setError("The document is empty — type something before saving.");
      return;
    }
    setError(null);
    let content: string | Uint8Array = "";
    let mime = "application/octet-stream";
    let ext = ".britdoc";
    let kind: "britdoc" | "docx" | "txt" = "britdoc";
    if (format === "BritDocs Document") {
      content = exportBritdoc(editor!, {
        size: pageSizeId,
        orientation,
        margins,
      }, { title: finalName, language: proofingLang === "English (US)" ? "en-US" : "en-GB" });
      mime = BRITDOC_MIME;
    } else if (format === "Word Document") {
      content = buildDocx(html);
      mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      ext = ".docx";
      kind = "docx";
    } else if (format === "Plain Text") {
      content = editor?.getText() ?? "";
      mime = "text/plain";
      ext = ".txt";
      kind = "txt";
    } else {
      content = buildPdf(html);
      mime = "application/pdf";
      ext = ".pdf";
    }

    const finish = (path: string | null) => {
      if (id) {
        renameDocument(id, finalName + ext);
        markDirty(id, false);
        setPath(id, path ?? finalName + ext);
        clearDraft(draftKey(id));
      }
      addRecentFile({
        id,
        name: finalName + ext,
        kind,
        content: kind === "britdoc" || kind === "txt" ? (content as string) : undefined,
      });
      setDone(`Saved as ${finalName + ext}.`);
    };

    if (isDesktopApp()) {
      // Apply the .britdoc extension when the user typed a bare name.
      const target = /\.[a-z0-9]+$/i.test(finalName) ? finalName : `${finalName}.britdoc`;
      const chosen = await pickSavePath(target);
      if (!chosen) return; // user cancelled
      try {
        await saveDocumentTo(chosen, content);
      } catch (err) {
        setDone(null);
        setError(describeSaveError(err));
        return;
      }
      finish(chosen);
      return;
    }

    downloadFile(finalName + ext, mime, content);
    finish(finalName + ext);
  };

  return (
    <div className="space-y-4">
      {error && <div data-testid="saveas-error" className="rounded border border-[#f0d2cb] bg-[#fcf0ed] px-3 py-2 text-[12px] text-[#c0392b]">{error}</div>}
      {done && <div className="rounded border border-[#cfe6d2] bg-[#eef7ef] px-3 py-2 text-[12px] text-[#1e7e34]">{done}</div>}
      <Section title="Location">
        <div className="max-w-[520px] gap-2">
          <label className="mb-1 block text-[11px] font-semibold text-[#555]">File name</label>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="saveas-name"
              className="flex-1 rounded border border-[#c8c8c8] px-3 py-2 text-[13px] focus:border-[#8ab4f8] focus:outline-none"
            />
            <button onClick={save} data-testid="saveas-save" className="cursor-pointer rounded bg-[#0078d4] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#005ba1]">
              Save
            </button>
          </div>
        </div>
      </Section>
      <Section title="Save as type">
        <div className="flex max-w-[520px] flex-col gap-1.5">
          {(["BritDocs Document", "Word Document", "PDF", "Plain Text"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`flex items-center gap-2 rounded border px-3 py-1.5 text-left text-[12px] ${
                format === f ? "border-[#0078d4] bg-[#e9f2fd] font-semibold text-[#1e4a80]" : "border-[#e0e0e0] bg-white text-[#333] hover:bg-[#f4f8fd]"
              }`}
            >
              <span className="w-3">{format === f ? "✓" : ""}</span>
              <span>{f === "BritDocs Document" ? "BritDocs Document (.britdoc)" : f}</span>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

function PrintPage() {
  const editor = useEditorContext();
  const [copies, setCopies] = useState(1);
  const [color, setColor] = useState("Color");
  const [printer, setPrinter] = useState("Microsoft Print to PDF");
  const [preview, setPreview] = useState(false);

  const doPrint = () => {
    if (preview) {
      setPreview(false);
    }
    window.print();
  };

  return (
    <div className="flex gap-8">
      <div className="w-[300px] shrink-0">
        <Section title="Print">
          <div className="mb-3">
            <button onClick={doPrint} data-testid="btnPrintNow" className="w-full cursor-pointer rounded bg-[#0078d4] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#005ba1]">
              Print
            </button>
          </div>
          <div className="mb-2">
            <label className="mb-1 block text-[11px] font-semibold text-[#555]">Copies</label>
            <input type="number" min={1} value={copies} onChange={(e) => setCopies(Math.max(1, Number(e.target.value) || 1))} data-testid="print-copies" className="w-full rounded border border-[#c8c8c8] px-2 py-1.5 text-[13px]" />
          </div>
          <div className="mb-2">
            <label className="mb-1 block text-[11px] font-semibold text-[#555]">Printer</label>
            <select value={printer} onChange={(e) => setPrinter(e.target.value)} className="w-full rounded border border-[#c8c8c8] px-2 py-1.5 text-[13px]">
              <option>Microsoft Print to PDF</option>
              <option>Microsoft XPS Document Writer</option>
              <option>Paperless PDF</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="mb-1 block text-[11px] font-semibold text-[#555]">Settings</label>
            <select value={color} onChange={(e) => setColor(e.target.value)} className="w-full rounded border border-[#c8c8c8] px-2 py-1.5 text-[13px]">
              <option>Color</option>
              <option>Black & white</option>
            </select>
          </div>
          <button onClick={() => setPreview((p) => !p)} className="w-full cursor-pointer rounded border border-[#c8c8c8] px-3 py-1.5 text-[12px] text-[#333] hover:bg-[#f0f0f0]">
            {preview ? "Hide" : "Show"} print preview
          </button>
        </Section>
      </div>
      <div className="min-w-0 flex-1">
        {preview ? (
          <div className="mx-auto max-w-[600px] rounded bg-white p-8 shadow ring-1 ring-[#e0e0e0]">
            <div className="prose text-[13px]" dangerouslySetInnerHTML={{ __html: editor?.getHTML() ?? "<p></p>" }} />
          </div>
        ) : (
          <div className="flex h-full min-h-[300px] items-center justify-center rounded border border-dashed border-[#c8c8c8] bg-[#f7f7f7] text-[12px] text-[#8a8a8a]">
            Preview pane — the current document will be printed.
          </div>
        )}
      </div>
    </div>
  );
}

function SharePage({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<"view" | "edit">("edit");
  const [copied, setCopied] = useState(false);
  const link = `https://britdocs.app/share/${Math.random().toString(36).slice(2, 10)}`;
  return (
    <div className="max-w-[560px]">
      <Section title="Share">
        <p className="mb-3 text-[12px] text-[#5a5a5a]">Invite people to view or edit this document. Only people with the link can access it.</p>
        <div className="mb-3 flex gap-2">
          <input value={link} readOnly onFocus={(e) => e.target.select()} className="flex-1 rounded border border-[#c8c8c8] px-3 py-2 text-[13px]" />
          <button
            onClick={() => { navigator.clipboard?.writeText(link).catch(() => undefined); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="cursor-pointer rounded bg-[#0078d4] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#005ba1]"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
        <div className="mb-3 flex gap-2">
          {(["view", "edit"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} data-testid={`share-${m}`} className={`cursor-pointer rounded border px-3 py-1 text-[12px] ${mode === m ? "border-[#0078d4] bg-[#e9f2fd] font-semibold text-[#1e4a80]" : "border-[#d8d8d8] bg-white text-[#555]"}`}>
              {m === "view" ? "Can view" : "Can edit"}
            </button>
          ))}
        </div>
        <button onClick={onBack} className="cursor-pointer rounded border border-[#4472c4] bg-[#d6e4f7] px-4 py-1.5 text-[12px] font-semibold text-[#1e4a80] hover:bg-[#c9dcf3]">
          Done
        </button>
      </Section>
    </div>
  );
}

function ExportPage() {
  const editor = useEditorContext();
  const { id, title } = currentFileName();
  const margins = useAppStore((s) => s.margins);
  const pageSizeId = useAppStore((s) => s.pageSizeId);
  const orientation = useAppStore((s) => s.orientation);
  const markDirty = useAppStore((s) => s.markDirty);
  const renameDocument = useAppStore((s) => s.renameDocument);
  const setPath = useAppStore((s) => s.setPath);
  const [done, setDone] = useState<string | null>(null);
const exportPdf = async () => {
    const html = editor?.getHTML() ?? "<p></p>";
    const fileName = (title.replace(/\.[^/.]+$/, "") || "Untitled") + ".pdf";
    if (!html.replace(/<[^>]*>/g, "").trim()) {
      setDone("Nothing to export — the document is empty.");
      return;
    }
    if (isDesktopApp()) {
      const chosen = await pickSavePath(fileName);
      if (!chosen) return;
      try {
        await saveDocumentTo(chosen, buildPdf(html));
      } catch (err) {
        setDone(describeSaveError(err));
        return;
      }
      setDone("PDF exported.");
      return;
    }
    downloadFile(fileName, "application/pdf", buildPdf(html));
    setDone("PDF exported to your downloads.");
  };

  const saveBritdoc = async () => {
    const base = title.replace(/\.[^/.]+$/, "") || "Untitled";
    const content = exportBritdoc(editor!, { size: pageSizeId, orientation, margins }, { title: base });
    const applyPath = (path: string | null) => {
      if (id) {
        renameDocument(id, base + ".britdoc");
        markDirty(id, false);
        setPath(id, path ?? base + ".britdoc");
        clearDraft(draftKey(id));
      }
      addRecentFile({ id, name: base + ".britdoc", kind: "britdoc", content });
      setDone(`Saved as ${base}.britdoc.`);
    };
    if (isDesktopApp()) {
      const chosen = await pickSavePath(base + ".britdoc");
      if (!chosen) return;
      try {
        await saveDocumentTo(chosen, content);
      } catch (err) {
        setDone(describeSaveError(err));
        return;
      }
      applyPath(chosen);
      return;
    }
    downloadFile(base + ".britdoc", BRITDOC_MIME, content);
    applyPath(base + ".britdoc");
  };

  return (
    <div className="max-w-[560px]">
      {done && <div className="mb-4 rounded border border-[#cfe6d2] bg-[#eef7ef] px-3 py-2 text-[12px] text-[#1e7e34]">{done}</div>}
      <Section title="Create PDF/XPS document">
        <p className="mb-3 text-[12px] text-[#5a5a5a]">Preserve layout, formatting, fonts and images. Download or share as a PDF.</p>
        <div className="flex gap-2">
          <button onClick={exportPdf} data-testid="btnExportPdf" className="cursor-pointer rounded border border-[#d8d8d8] bg-white px-4 py-2 text-[12px] font-medium text-[#1b1b1b] hover:border-[#0078d4]">
            <span className="mr-2 inline-flex align-middle"><IconPdf className="h-[16px] w-[16px] text-[#c00000]" /></span>
            Create PDF
          </button>
        </div>
      </Section>
      <Section title="Change file type">
        <p className="mb-3 text-[12px] text-[#5a5a5a]">Choose a different format to save your document in.</p>
        <div className="space-y-1.5">
          <Card title="BritDocs Document" subtitle="Native format — lossless save/open round-trip" onClick={saveBritdoc} />
          <Card title="Word Document" subtitle="Preserves fonts, layout and formatting" onClick={() => { downloadFile((title.replace(/\.[^/.]+$/, "") || "Untitled") + ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buildDocx(editor?.getHTML() ?? "<p></p>")); }} />
          <Card title="Plain Text" subtitle="Loses images and formatting" onClick={() => { downloadFile((title.replace(/\.[^/.]+$/, "") || "Untitled") + ".txt", "text/plain", editor?.getText() ?? ""); }} />
          <Card title="Web Page" subtitle="Save in HTML to view in a browser" onClick={() => { downloadFile((title.replace(/\.[^/.]+$/, "") || "Untitled") + ".html", "text/html", renderDocTemplate().replace("</body>", `${editor?.getHTML() ?? "<p></p>"}</body>`)); }} />
        </div>
      </Section>
    </div>
  );
}

function ClosePage({ onBack }: { onBack: () => void }) {
  const { id, title } = currentFileName();
  const closeDocument = useAppStore((s) => s.closeDocument);
  const handleClose = () => {
    if (id) closeDocument(id);
    onBack();
  };
  return (
    <div className="max-w-[520px]">
      <Section title="Close document">
        <Card title={`Close “${title}”`} subtitle="If you have unsaved changes they will be lost." extra={<IconCloseFile className="h-[20px] w-[20px] text-[#8a1f1f]" />} onClick={handleClose} />
      </Section>
    </div>
  );
}

function AccountPage() {
  return (
    <div className="max-w-[520px]">
      <Section title="Sign in">
        <div className="flex items-center gap-4 rounded border border-[#e3e3e3] bg-white p-4">
          <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#4472c4] text-[20px] font-bold text-white">
            B
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-semibold text-[#1b1b1b]">BritDocs User</div>
            <div className="text-[12px] text-[#7a7a7a]">user@britdocs.app</div>
            <div className="mt-1 flex gap-2">
              <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[10px] font-medium text-[#1e4a80]">Pro trial</span>
              <span className="rounded-full bg-[#e9e9e9] px-2 py-0.5 text-[10px] text-[#555]">Synced</span>
            </div>
          </div>
          <button className="cursor-pointer rounded border border-[#c8c8c8] px-3 py-1.5 text-[12px] text-[#333] hover:bg-[#f0f0f0]">Switch account</button>
        </div>
      </Section>
      <Section title="Product information">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded border border-[#e3e3e3] bg-white p-3">
            <div className="text-[18px] font-bold text-[#1b1b1b]">BritDocs</div>
            <div className="text-[11px] text-[#7a7a7a]">Version 0.1.0</div>
            <div className="text-[11px] text-[#7a7a7a]">Microsoft 365 style</div>
          </div>
          <div className="rounded border border-[#e3e3e3] bg-white p-3">
            <div className="text-[12px] font-semibold text-[#1b1b1b]">About BritDocs</div>
            <div className="mt-1 text-[11px] leading-relaxed text-[#7a7a7a]">
              A browser-based word processor inspired by Microsoft Word 365. Built with React, Tiptap and Zustand.
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function FeedbackPage() {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="max-w-[520px]">
      <Section title="Feedback">
        {sent ? (
          <div className="rounded border border-[#cfe6d2] bg-[#eef7ef] px-4 py-3 text-[13px] text-[#1e7e34]">
            Thanks! Your feedback helps improve BritDocs.
          </div>
        ) : (
          <>
            <p className="mb-3 text-[12px] text-[#5a5a5a]">Tell us what you like, or what could be better.</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              data-testid="feedback-text"
              rows={5}
              placeholder="Share your feedback…"
              className="w-full rounded border border-[#c8c8c8] p-3 text-[13px] focus:border-[#8ab4f8] focus:outline-none"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => setSent(true)}
                data-testid="send-feedback"
                className="cursor-pointer rounded bg-[#0078d4] px-4 py-1.5 text-[12px] font-medium text-white hover:bg-[#005ba1]"
              >
                Send feedback
              </button>
              {!text.trim() && <span className="text-[11px] text-[#8a8a8a]">Optional — you can send without a message.</span>}
            </div>
          </>
        )}
      </Section>
    </div>
  );
}

function OptionsPage() {
  const [proofing, setProofing] = useState("Auto");
  const [autoSave, setAutoSave] = useState(true);
  const [showSpaces, setShowSpaces] = useState(false);
  const [cursorBlinks, setCursorBlinks] = useState(true);
  return (
    <div className="max-w-[560px]">
      <Section title="Proofing">
        <SelectRow label="Grammar & spelling" value={proofing} onChange={setProofing} options={["Auto", "Manual", "Off"]} />
      </Section>
      <Section title="Save">
        <ToggleRow label="AutoSave documents to the cloud" value={autoSave} onChange={setAutoSave} />
      </Section>
      <Section title="Display">
        <ToggleRow label="Show spaces as dots" value={showSpaces} onChange={setShowSpaces} />
        <ToggleRow label="Show cursor blink" value={cursorBlinks} onChange={setCursorBlinks} />
      </Section>
    </div>
  );
}

function SelectRow({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-4 rounded border border-[#f0f0f0] bg-white px-3 py-2">
      <span className="text-[12px] text-[#333]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded border border-[#c8c8c8] px-2 py-1 text-[12px]">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-4 rounded border border-[#f0f0f0] bg-white px-3 py-2">
      <span className="text-[12px] text-[#333]">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-[20px] w-[38px] cursor-pointer rounded-full transition-colors ${value ? "bg-[#0078d4]" : "bg-[#c8c8c8]"}`}
      >
        <span className={`absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white shadow transition-all ${value ? "left-[20px]" : "left-[2px]"}`} />
      </button>
    </div>
  );
}

/* ---------------- Shell ---------------- */

export const NAV_GROUPS: { label: string; items: { page: FilePage; label: string; icon: ReactNode }[] }[] = [
  {
    label: "Info & New",
    items: [
      { page: "home", label: "Home", icon: <IconHome className="h-[16px] w-[16px]" /> },
      { page: "new", label: "New", icon: <IconNewFile className="h-[16px] w-[16px]" /> },
      { page: "open", label: "Open", icon: <IconOpenFile className="h-[16px] w-[16px]" /> },
    ],
  },
  {
    label: "Save & Print",
    items: [
      { page: "save", label: "Save", icon: <IconSaveFile className="h-[16px] w-[16px]" /> },
      { page: "saveas", label: "Save As", icon: <IconSaveAs className="h-[16px] w-[16px]" /> },
      { page: "print", label: "Print", icon: <IconPrint className="h-[16px] w-[16px]" /> },
      { page: "share", label: "Share", icon: <IconShare className="h-[16px] w-[16px]" /> },
      { page: "export", label: "Export", icon: <IconExport className="h-[16px] w-[16px]" /> },
    ],
  },
  {
    label: "Document",
    items: [{ page: "close", label: "Close", icon: <IconCloseFile className="h-[16px] w-[16px]" /> }],
  },
  {
    label: "Account & Help",
    items: [
      { page: "account", label: "Account", icon: <IconAccount className="h-[16px] w-[16px]" /> },
      { page: "feedback", label: "Feedback", icon: <IconFeedback className="h-[16px] w-[16px]" /> },
      { page: "options", label: "Options", icon: <IconOptions className="h-[16px] w-[16px]" /> },
    ],
  },
];

export function FileBackstage({ onBack }: { onBack: () => void }) {
  const [page, setPage] = useState<FilePage>(
    (useAppStore.getState().filePage as FilePage) || "home",
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>(() => loadRecentFiles());
  const editor = useEditorContext();
  const tabs = useAppStore((s) => s.tabs);
  const activeId = useAppStore((s) => s.activeId);
  const tab = tabs.find((t) => t.id === activeId);
  const openDocument = useAppStore((s) => s.openDocument);
  const renameDocument = useAppStore((s) => s.renameDocument);
  const setPageSizeId = useAppStore((s) => s.setPageSizeId);
  const setOrientation = useAppStore((s) => s.setOrientation);
  const setMargins = useAppStore((s) => s.setMargins);

  const removeRecent = (rid: string) => setRecentFiles(removeRecentFile(rid));

  const openRecent = (f: RecentFile) => {
    if (f.kind === "docx" || !f.content) {
      setNotice(`“${f.name}” can't be reopened from Recent in the browser — use Open and browse for the file.`);
      setPage("open");
      return;
    }
    if (f.kind === "britdoc") {
      const result = importBritdoc(f.content, f.name);
      if (!result.ok) {
        setNotice(result.errors[0] ?? "Could not open the recent file.");
        return;
      }
      const id = crypto.randomUUID();
      setPageSizeId(result.page.size);
      setOrientation(result.page.orientation);
      setMargins(result.page.margins);
      clearDraft(draftKey(id));
      openDocument({ id, title: result.title, path: f.name, dirty: false });
      renameDocument(id, result.title);
      editor?.chain().focus().setContent(JSON.parse(result.json)).run();
      onBack();
      return;
    }
    const id = crypto.randomUUID();
    const title = f.name.replace(/\.(html?|txt)$/i, "") || "Imported";
    clearDraft(draftKey(id));
    openDocument({ id, title, path: f.name, dirty: false });
    renameDocument(id, title);
    if (f.kind === "html") {
      editor?.chain().focus().setContent(f.content).run();
    } else {
      editor?.chain().focus().clearContent().insertContent(f.content.replace(/\n/g, "<br>")).run();
    }
    onBack();
  };

  return (
    <div className="absolute inset-0 z-[70] flex flex-col bg-[#f1f6fa]" data-testid="backstage">
      {/* Top bar */}
      <div className="flex h-[48px] shrink-0 items-center gap-3 border-b border-[#cfe0f2] bg-[#e8f1fa] px-4">
        <button
          onClick={onBack}
          data-testid="backstage-back"
          className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-[13px] font-medium text-[#1e4a80] hover:bg-[#d7e6f7]"
        >
          <IconBackArrow className="h-[16px] w-[16px]" />
          {tab?.title ?? "Untitled"}
        </button>
        <span className="text-[13px] text-[#5a5a5a]">|</span>
        <span className="text-[13px] font-medium text-[#1e4a80]">File</span>
        <div className="flex-1" />
        <span className="text-[12px] text-[#7a7a7a]">{tab?.dirty ? "● Unsaved" : "Saved"}</span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Left nav */}
        <nav className="flex w-[232px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-[#cfe0f2] bg-[#e8f1fa] px-2 py-4">
          {NAV_GROUPS.map((g) => (
            <div key={g.label}>
              <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-[#8fa6c8]">{g.label}</div>
              {g.items.map((it) => (
                <NavItem key={it.page} active={page === it.page} icon={it.icon} label={it.label} onClick={() => setPage(it.page)} />
              ))}
            </div>
          ))}
          <div className="mt-auto border-t border-[#d3e2f2] pt-3 text-center text-[10px] text-[#8fa6c8]">
            BritDocs — Word Processor
          </div>
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1 overflow-y-auto px-8 py-6">
          <h2 className="mb-5 text-[22px] font-semibold text-[#1b1b1b]">
            {NAV_GROUPS.flatMap((g) => g.items).find((i) => i.page === page)?.label ?? "File"}
          </h2>
          {notice && (
            <div className="mb-4 rounded border border-[#f0d2cb] bg-[#fcf0ed] px-3 py-2 text-[12px] text-[#c0392b]">
              {notice}
            </div>
          )}
          {page === "home" && <HomePage go={setPage} files={recentFiles} onOpenRecent={openRecent} onRemoveRecent={removeRecent} />}
          {page === "new" && <NewPage onBack={onBack} />}
          {page === "open" && <OpenPage files={recentFiles} onOpenRecent={openRecent} onRemoveRecent={removeRecent} />}
          {page === "save" && <SavePage onNeedSaveAs={() => setPage("saveas")} />}
          {page === "saveas" && <SaveAsPage />}
          {page === "print" && <PrintPage />}
          {page === "share" && <SharePage onBack={onBack} />}
          {page === "export" && <ExportPage />}
          {page === "close" && <ClosePage onBack={onBack} />}
          {page === "account" && <AccountPage />}
          {page === "feedback" && <FeedbackPage />}
          {page === "options" && <OptionsPage />}
        </div>
      </div>
    </div>
  );
}
