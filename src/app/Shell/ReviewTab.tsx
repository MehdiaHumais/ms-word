import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorContext } from "../Editor/EditorContext";
import { useAppStore } from "../../stores/appStore";
import { computeMisspellings } from "../Editor/extensions/SpellCheck";
import { listCommentRanges } from "../Editor/extensions/Comment";
import { listDocChanges } from "../Editor/extensions/ReviewChanges";
import { countWords, diffWords, buildSpeechText, type DiffOp } from "./reviewLib";
import {
  IconAccessibility,
  IconAccept,
  IconCombine,
  IconCompare,
  IconDeleteComment,
  IconEditorSpelling,
  IconInkMath,
  IconInkPen,
  IconInkShape,
  IconInkText,
  IconLanguage,
  IconMarkAsFinal,
  IconNewComment,
  IconNext,
  IconPrevious,
  IconReadAloud,
  IconReject,
  IconRestrictEditing,
  IconReviewingPane,
  IconShowComments,
  IconShowMarkup,
  IconThesaurus,
  IconTrackChanges,
  IconTranslate,
  IconWordCount,
} from "./icons";

const btnBase =
  "relative flex items-center justify-center rounded-[3px] text-[#474747] transition-colors duration-75 ";
const btnHover = "border border-transparent hover:border-[#c1d3ec] hover:bg-[#eaf1fa]";
const btnActive = "border border-[#9fc4ec] bg-[#cfe3fb] text-[#1e4a80]";

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

function Popover({
  open,
  onClose,
  children,
  align = "left-0",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  align?: string;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className={`absolute top-full z-50 mt-1 w-max rounded border border-[#c8c8c8] bg-white p-1 shadow-[0_4px_12px_rgba(0,0,0,0.18)] ${align}`}
      >
        {children}
      </div>
    </>
  );
}

function MenuSection({ title }: { title: string }) {
  return (
    <div className="mb-0.5 px-1 pt-1 text-[9px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
      {title}
    </div>
  );
}

function MenuItem({
  onClick,
  children,
  desc,
  active,
  disabled,
}: {
  onClick: () => void;
  children: ReactNode;
  desc?: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-start gap-2 rounded px-2 py-1 text-left ${
        disabled
          ? "cursor-not-allowed opacity-40"
          : active
            ? "bg-[#cfe3fb] text-[#1e4a80]"
            : "text-[#333] hover:bg-[#eaf1fa]"
      }`}
    >
      <span className="w-3 shrink-0 text-[11px] leading-tight">{active ? "✓" : ""}</span>
      <span className="flex flex-col">
        <span className="text-[12px] leading-tight">{children}</span>
        {desc && <span className="text-[9px] text-[#8a8a8a]">{desc}</span>}
      </span>
    </button>
  );
}

function Group({
  title,
  children,
  widthClass,
}: {
  title: string;
  children: ReactNode;
  widthClass?: string;
}) {
  return (
    <div
      className={`relative flex h-[104px] shrink-0 flex-col items-center justify-between border-r border-[#e0e0e0] px-1.5 py-1 ${widthClass ?? ""}`}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-1">{children}</div>
      <span className="mt-0.5 text-[9px] leading-none text-[#5b5b5b]">{title}</span>
    </div>
  );
}

function RvCell({
  title,
  icon,
  onClick,
  active,
  disabled,
  wide,
  danger,
  badge,
  testid,
}: {
  title: string;
  icon?: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  wide?: boolean;
  danger?: boolean;
  badge?: number | null;
  testid?: string;
}) {
  const activeCls = danger
    ? "border border-[#d9798a] bg-[#fde2e6] text-[#8a1f1f]"
    : btnActive;
  return (
    <button
      title={title}
      aria-label={title}
      data-testid={testid}
      onClick={onClick}
      disabled={disabled}
      className={`${btnBase} ${
        disabled ? "cursor-not-allowed opacity-40" : active ? activeCls : btnHover
      } ${wide ? "h-[32px] w-[64px]" : "h-[32px] w-[42px]"} cursor-pointer flex-col gap-[2px] px-0.5`}
    >
      <span className="relative">
        {icon}
        {typeof badge === "number" && badge > 0 && (
          <span className="absolute -right-2.5 -top-2 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#d93025] px-0.5 text-[9px] font-bold text-white">
            {badge}
          </span>
        )}
      </span>
      <span className="w-full text-center text-[7.5px] leading-[8px] text-[#444]">{title}</span>
    </button>
  );
}

function Modal({ title, onClose, children, testid }: { title: string; onClose: () => void; children: ReactNode; testid?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-[560px] flex-col rounded bg-white shadow-[0_16px_60px_rgba(0,0,0,0.35)]"
        data-testid={testid}
      >
        <div className="flex items-center justify-between border-b border-[#e8e8e8] px-4 py-2.5">
          <span className="text-[14px] font-semibold text-[#1b1b1b]">{title}</span>
          <button className="text-[#5b5b5b] hover:text-[#0078d4]" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}

function useDocTick(editor: Editor | null): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const bump = () => setTick((t) => t + 1);
    editor.on("transaction", bump);
    return () => {
      editor.off("transaction", bump);
    };
  }, [editor]);
  return tick;
}

/* ------------------------------------------------------------------ */
/* Word Count dialog                                                   */
/* ------------------------------------------------------------------ */

function WordCountDialog({ onClose }: { onClose: () => void }) {
  const editor = useEditorContext();
  const tick = useDocTick(editor);
  const stats = editor ? countWords(editor.state.doc) : null;
  void tick;
  if (!stats) return null;
  return (
    <Modal title="Word Count" onClose={onClose} testid="word-count-dialog">
      <div className="grid grid-cols-2 gap-y-2 text-[13px]">
        <span className="text-[#5b5b5b]">Words</span>
        <span className="text-right font-semibold" data-testid="wc-words">{stats.words}</span>
        <span className="text-[#5b5b5b]">Characters (no spaces)</span>
        <span className="text-right font-semibold">{stats.charsNoSpaces}</span>
        <span className="text-[#5b5b5b]">Characters (with spaces)</span>
        <span className="text-right font-semibold">{stats.charsWithSpaces}</span>
        <span className="text-[#5b5b5b]">Paragraphs</span>
        <span className="text-right font-semibold">{stats.paragraphs}</span>
        <span className="text-[#5b5b5b]">Lines</span>
        <span className="text-right font-semibold">{stats.lines}</span>
        <span className="text-[#5b5b5b]">Pages (approx.)</span>
        <span className="text-right font-semibold">{stats.pages}</span>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="rounded border border-[#4472c4] bg-[#d6e4f7] px-4 py-1 text-[12px] text-[#1e4a80] hover:bg-[#c9dcF3]"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Read Aloud                                                          */
/* ------------------------------------------------------------------ */

let _synth: SpeechSynthesis | null = null;
let _utterance: SpeechSynthesisUtterance | null = null;

function speakSelectionOrDoc(editor: Editor | null, selectionOnly: boolean) {
  if (!editor) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    useAppStore.getState().setReadAloud("stopped");
    return;
  }
  const synth = window.speechSynthesis;
  _synth = synth;
  synth.cancel();
  const sel = editor.state.selection;
  const text =
    selectionOnly && !sel.empty
      ? buildSpeechText(editor.state.doc, sel.from, sel.to)
      : buildSpeechText(editor.state.doc);
  if (!text.trim()) {
    useAppStore.getState().setReadAloud("stopped");
    return;
  }
  _utterance = new SpeechSynthesisUtterance(text);
  _utterance.rate = 1;
  _utterance.onend = () => useAppStore.getState().setReadAloud("stopped");
  _utterance.onerror = () => useAppStore.getState().setReadAloud("stopped");
  synth.speak(_utterance);
  useAppStore.getState().setReadAloud("playing");
}

/* ------------------------------------------------------------------ */
/* Ink pad                                                             */
/* ------------------------------------------------------------------ */

function InkPad({ onInsert }: { onInsert: (url: string, title: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = 300;
    c.height = 150;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.strokeStyle = "#141414";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, []);

  const ctx = () => canvasRef.current?.getContext("2d");

  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx()?.beginPath();
    ctx()?.moveTo(x, y);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx()?.lineTo(x, y);
    ctx()?.stroke();
    setDirty(true);
  };

  const stop = () => {
    drawing.current = false;
  };

  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const g = ctx();
    if (g) {
      g.clearRect(0, 0, c.width, c.height);
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, c.width, c.height);
    }
    setDirty(false);
  };

  return (
    <div className="w-[320px] p-2">
      <div className="mb-1 text-[11px] font-semibold text-[#333]">Draw with the mouse, then insert:</div>
      <canvas
        data-testid="ink-canvas"
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerLeave={stop}
        className="w-full cursor-crosshair touch-none rounded border border-[#c8c8c8]"
      />
      <div className="mt-2 flex items-center gap-1">
        <button
          onClick={clear}
          data-testid="ink-clear"
          className="rounded border border-[#d0d0d0] px-2 py-1 text-[12px] hover:bg-[#f0f4fa]"
        >
          Clear
        </button>
        <span className="text-[10px] text-[#8a8a8a]">{dirty ? "Drawing ready" : "Nothing drawn yet"}</span>
        <span className="ml-auto flex gap-1">
          <button
            data-testid="ink-insert-text"
            onClick={() => canvasRef.current?.toDataURL("image/png") && onInsert(canvasRef.current.toDataURL("image/png"), "Ink to Text")}
            className="rounded border border-[#4472c4] px-2 py-1 text-[12px] text-[#1e4a80] hover:bg-[#eaf1fa]"
          >
            Ink to Text
          </button>
          <button
            data-testid="ink-insert-shape"
            onClick={() => canvasRef.current?.toDataURL("image/png") && onInsert(canvasRef.current.toDataURL("image/png"), "Ink to Shape")}
            className="rounded border border-[#4472c4] px-2 py-1 text-[12px] text-[#1e4a80] hover:bg-[#eaf1fa]"
          >
            Ink to Shape
          </button>
          <button
            data-testid="ink-insert-math"
            onClick={() => canvasRef.current?.toDataURL("image/png") && onInsert(canvasRef.current.toDataURL("image/png"), "Ink Math")}
            className="rounded border border-[#4472c4] px-2 py-1 text-[12px] text-[#1e4a80] hover:bg-[#eaf1fa]"
          >
            Ink to Math
          </button>
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Compare dialog                                                      */
/* ------------------------------------------------------------------ */

const SAMPLE_ORIGINAL =
  "The quick brown fox jumps over the lazy dog. This is the original document that we keep on file for comparison.";

function CompareDialog({ mode, onClose }: { mode: "compare" | "combine"; onClose: () => void }) {
  const editor = useEditorContext();
  const [orig, setOrig] = useState("");
  const [revised, setRevised] = useState("");
  const [diff, setDiff] = useState<DiffOp[] | null>(null);

  useEffect(() => {
    if (editor) {
      setRevised(editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n", " "));
    }
  }, [editor]);

  const applyDiff = () => {
    if (!editor || !revised.trim()) return;
    editor
      .chain()
      .focus()
      .command(({ tr, dispatch }) => {
        const schema = tr.doc.type.schema;
        const insMark = schema.marks.trackInsert?.create();
        const delMark = schema.marks.trackDelete?.create();
        const origParas = orig.split(/\r?\n/);
        const revisedParas = revised.split(/\r?\n/);
        const blocks: { pos: number; size: number }[] = [];
        tr.doc.descendants((n, p) => {
          if (n.isTextblock) blocks.push({ pos: p, size: n.nodeSize });
          return true;
        });
        if (blocks.length === 0) return false;
        let bi = 0;
        for (const b of blocks) {
          const otext = origParas[bi] ?? "";
          const rtext = revisedParas[bi] ?? "";
          const ops = diffWords(otext, rtext);
          const content: import("@tiptap/pm/model").Node[] = [];
          for (const op of ops) {
            if (!op.text) continue;
            if (op.type === "insert" && insMark) content.push(schema.text(op.text, [insMark]));
            else if (op.type === "delete" && delMark) content.push(schema.text(op.text, [delMark]));
            else content.push(schema.text(op.text));
          }
          const range = tr.doc.textBetween(b.pos + 1, b.pos + b.size - 1, " ", " ");
          if (range && content.length) {
            tr.replaceWith(b.pos + 1, b.pos + b.size - 1, content);
          }
          bi++;
        }
        tr.setMeta("britCompareApplied", true);
        dispatch?.(tr);
        return true;
      })
      .run();
    onClose();
  };

  const replaceWithRevised = () => {
    if (!editor || !revised.trim()) return;
    const paras = revised.split(/\r?\n/).map((t) => ({
      type: "paragraph",
      content: t ? [{ type: "text", text: t }] : [],
    }));
    editor.chain().focus().setContent({ type: "doc", content: paras }).run();
    onClose();
  };

  const diffView = diff?.length
    ? diff.map((op, i) => (
        <span
          key={i}
          className={
            op.type === "insert"
              ? "rounded bg-[#e6f4ea] px-0.5 text-[#1e7e34]"
              : op.type === "delete"
                ? "rounded bg-[#fde9e9] px-0.5 text-[#c5221f] line-through"
                : ""
          }
        >
          {op.text}
        </span>
      ))
    : null;

  return (
    <Modal title={mode === "compare" ? "Compare Documents" : "Combine Documents"} onClose={onClose} testid="compare-dialog">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-16 text-[11px] font-semibold text-[#5b5b5b]">Original</span>
          <textarea
            aria-label="Original document"
            value={orig}
            onChange={(e) => setOrig(e.target.value)}
            rows={3}
            placeholder="Paste the original document text here…"
            className="flex-1 rounded border border-[#c8c8c8] px-2 py-1 text-[12px] focus:border-[#4472c4] focus:outline-none"
          />
          <button
            onClick={() => setOrig(SAMPLE_ORIGINAL)}
            className="rounded border border-[#d0d0d0] px-2 py-1 text-[11px] hover:bg-[#f0f4fa]"
          >
            Use sample
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 text-[11px] font-semibold text-[#5b5b5b]">Revised</span>
          <textarea
            aria-label="Revised document"
            value={revised}
            onChange={(e) => setRevised(e.target.value)}
            rows={3}
            className="flex-1 rounded border border-[#c8c8c8] px-2 py-1 text-[12px] focus:border-[#4472c4] focus:outline-none"
          />
          <button
            onClick={() => editor && setRevised(editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n", " "))}
            className="rounded border border-[#d0d0d0] px-2 py-1 text-[11px] hover:bg-[#f0f4fa]"
          >
            Sync to doc
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDiff(diffWords(orig, revised))}
            className="rounded border border-[#4472c4] bg-[#d6e4f7] px-3 py-1 text-[12px] font-semibold text-[#1e4a80] hover:bg-[#c9dCF3]"
          >
            Compare
          </button>
          <button
            onClick={applyDiff}
            className="rounded border border-[#4472c4] px-3 py-1 text-[12px] text-[#1e4a80] hover:bg-[#eaf1fa]"
          >
            {mode === "compare" ? "Insert as tracked changes" : "Merge into document"}
          </button>
          <button
            onClick={replaceWithRevised}
            className="rounded border border-[#d0d0d0] px-3 py-1 text-[12px] hover:bg-[#f0f4fa]"
          >
            Replace with revised
          </button>
        </div>
        <div className="rounded border border-[#eee] bg-[#fafafa] p-2">
          {diffView ? (
            <div className="text-[12px] leading-relaxed text-[#333]" data-testid="diff-preview">
              {diffView}
            </div>
          ) : (
            <div className="text-[12px] text-[#8a8a8a]">
              Differences will be shown here (green = added, red = removed).
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Language dialog                                                     */
/* ------------------------------------------------------------------ */

const LANGUAGES = [
  "English (US)",
  "English (UK)",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Chinese (Simplified)",
  "Japanese",
  "Arabic",
];

function LanguageDialog({ onClose }: { onClose: () => void }) {
  const proofingLang = useAppStore((s) => s.proofingLang);
  const editor = useEditorContext();
  return (
    <Modal title="Language" onClose={onClose} testid="language-dialog">
      <div className="text-[12px] text-[#5b5b5b]">
        Choose the proofing language. The spell checker uses the English dictionary.
      </div>
      <div className="mt-2 max-h-[52vh] overflow-auto">
        {LANGUAGES.map((l) => (
          <button
            key={l}
            onClick={() => {
              useAppStore.getState().setProofingLang(l);
              if (editor) {
                editor.chain().focus().command(({ tr }) => {
                  tr.setMeta("britLang", l);
                  return true;
                }).run();
              }
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-[#333] hover:bg-[#eaf1fa]"
          >
            <span className="w-3 text-[11px]">{proofingLang === l ? "✓" : ""}</span>
            <span className="font-['Segoe_UI',sans-serif]">{l}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* The tab                                                             */
/* ------------------------------------------------------------------ */

export function ReviewTab() {
  const editor = useEditorContext();
  const spellCount = useDocTick(editor);
  const trackChanges = useAppStore((s) => s.trackChanges);
  const showMarkup = useAppStore((s) => s.showMarkup);
  const reviewingPane = useAppStore((s) => s.reviewingPane);
  const reviewPanel = useAppStore((s) => s.reviewPanel);
  const restrictReadOnly = useAppStore((s) => s.restrictReadOnly);
  const final = useAppStore((s) => s.final);
  const showComments = useAppStore((s) => s.showComments);
  const readAloud = useAppStore((s) => s.readAloud);

  const [menu, setMenu] = useState<null | string>(null);
  const [showWordCount, setShowWordCount] = useState(false);
  const [compareMode, setCompareMode] = useState<"compare" | "combine" | null>(null);
  const [showLanguage, setShowLanguage] = useState(false);

  const errs = editor ? computeMisspellings(editor.state.doc) : [];
  const comments = editor ? listCommentRanges(editor.state) : [];
  const changes = editor ? listDocChanges(editor.state) : [];

  const insertInk = (url: string, title: string) => {
    if (!editor) return;
    editor.chain().focus().setImage({ src: url, alt: title }).run();
    setMenu(null);
  };

  const acceptAll = (stopTracking?: boolean) => {
    editor?.chain().focus().acceptChanges(true).run();
    if (stopTracking) useAppStore.getState().setTrackChanges(false);
  };

  const rejectAll = (stopTracking?: boolean) => {
    editor?.chain().focus().rejectChanges(true).run();
    if (stopTracking) useAppStore.getState().setTrackChanges(false);
  };

  void spellCount;

  return (
    <div className="flex h-[104px] items-stretch px-1" data-testid="review-tab">
      {/* Proofing */}
      <Group title="Proofing">
        <RvCell
          title="Editor"
          wide
          testid="btnEditor"
          icon={<IconEditorSpelling />}
          badge={errs.length}
          active={reviewPanel === "editor"}
          onClick={() => {
            setMenu(null);
            useAppStore.getState().setReviewPanel(reviewPanel === "editor" ? "none" : "editor");
          }}
        />
        <div className="flex gap-1">
          <RvCell
            title="Thesaurus"
            icon={<IconThesaurus />}
            testid="btnThesaurus"
            active={reviewPanel === "thesaurus"}
            onClick={() => {
              setMenu(null);
              useAppStore.getState().setReviewPanel(reviewPanel === "thesaurus" ? "none" : "thesaurus");
            }}
          />
          <RvCell
            title="Word Count"
            icon={<IconWordCount />}
            testid="btnWordCount"
            onClick={() => {
              setMenu(null);
              setShowWordCount(true);
            }}
          />
        </div>
      </Group>

      {/* Speech */}
      <Group title="Speech">
        <button
          data-testid="btnReadAloud"
          aria-pressed={readAloud !== "stopped"}
          aria-label="Read Aloud"
          onClick={() => {
            if (readAloud !== "stopped") {
              setMenu(menu === "readaloud" ? null : "readaloud");
              return;
            }
            speakSelectionOrDoc(editor, false);
          }}
          className={`${btnBase} ${btnHover} h-[32px] w-[72px] cursor-pointer flex-col gap-[2px] px-0.5 ${readAloud !== "stopped" ? btnActive : ""}`}
        >
          <IconReadAloud />
          <span className="w-full text-center text-[7.5px] leading-[8px] text-[#444]">Read Aloud</span>
        </button>
        <Popover open={menu === "readaloud"} onClose={() => setMenu(null)} align="right-0">
          <MenuSection title="Read Aloud" />
          {readAloud === "stopped" ? (
            <MenuItem onClick={() => speakSelectionOrDoc(editor, false)}>Start reading document</MenuItem>
          ) : readAloud === "playing" ? (
            <MenuItem
              onClick={() => {
                _synth?.pause();
                useAppStore.getState().setReadAloud("paused");
              }}
            >
              Pause read aloud
            </MenuItem>
          ) : (
            <MenuItem
              onClick={() => {
                _synth?.resume();
                useAppStore.getState().setReadAloud("playing");
              }}
            >
              Resume read aloud
            </MenuItem>
          )}
          {readAloud !== "stopped" && (
            <MenuItem
              onClick={() => {
                _synth?.cancel();
                useAppStore.getState().setReadAloud("stopped");
              }}
            >
              Stop read aloud
            </MenuItem>
          )}
        </Popover>
      </Group>

      {/* Accessibility */}
      <Group title="Accessibility">
        <RvCell
          title="Check Accessibility"
          icon={<IconAccessibility />}
          testid="btnAccessibility"
          active={reviewPanel === "accessibility"}
          wide
          onClick={() => {
            setMenu(null);
            useAppStore.getState().setReviewPanel(reviewPanel === "accessibility" ? "none" : "accessibility");
          }}
        />
      </Group>

      {/* Comments */}
      <Group title="Comments">
        <RvCell
          title="New Comment"
          icon={<IconNewComment />}
          testid="btnNewComment"
          onClick={() => {
            setMenu(null);
            editor?.chain().focus().addComment().run();
          }}
        />
        <RvCell
          title="Delete"
          icon={<IconDeleteComment />}
          testid="btnDeleteComment"
          onClick={() => {
            setMenu(null);
            editor?.chain().focus().deleteComment().run();
          }}
        />
        <RvCell
          title="Previous"
          icon={<IconPrevious />}
          testid="btnPrevComment"
          disabled={comments.length === 0}
          onClick={() => {
            setMenu(null);
            editor?.chain().focus().previousComment().run();
          }}
        />
        <RvCell
          title="Next"
          icon={<IconNext />}
          testid="btnNextComment"
          disabled={comments.length === 0}
          onClick={() => {
            setMenu(null);
            editor?.chain().focus().nextComment().run();
          }}
        />
        <RvCell
          title="Show Comments"
          icon={<IconShowComments />}
          active={showComments}
          testid="btnShowComments"
          onClick={() => {
            setMenu(null);
            useAppStore.getState().setShowComments(!showComments);
          }}
        />
      </Group>

      {/* Tracking */}
      <Group title="Tracking">
        <RvCell
          title="Track Changes"
          icon={<IconTrackChanges />}
          active={trackChanges}
          testid="btnTrackChanges"
          onClick={() => {
            setMenu(null);
            useAppStore.getState().setTrackChanges(!trackChanges);
          }}
        />
        <RvCell
          title="Show Markup"
          icon={<IconShowMarkup />}
          testid="btnShowMarkup"
          active={menu === "markup"}
          onClick={() => setMenu(menu === "markup" ? null : "markup")}
        />
        <RvCell
          title="Reviewing Pane"
          icon={<IconReviewingPane />}
          testid="btnReviewingPane"
          active={reviewingPane === "vertical"}
          onClick={() => {
            setMenu(null);
            useAppStore.getState().setReviewingPane(reviewingPane === "vertical" ? "off" : "vertical");
          }}
        />
        <Popover open={menu === "markup"} onClose={() => setMenu(null)} align="right-0">
          <MenuSection title="Show Markup" />
          {(["all", "hidden", "original"] as const).map((m) => (
            <MenuItem
              key={m}
              active={showMarkup === m}
              onClick={() => {
                useAppStore.getState().setShowMarkup(m);
                setMenu(null);
              }}
            >
              {m === "all" ? "All Markup" : m === "hidden" ? "No Markup" : "Original"}
            </MenuItem>
          ))}
        </Popover>
      </Group>

      {/* Changes */}
      <Group title="Changes">
        <RvCell
          title="Accept"
          icon={<IconAccept />}
          testid="btnAccept"
          disabled={changes.length === 0}
          active={menu === "accept"}
          onClick={() => setMenu(menu === "accept" ? null : "accept")}
        />
        <RvCell
          title="Reject"
          icon={<IconReject />}
          testid="btnReject"
          disabled={changes.length === 0}
          active={menu === "reject"}
          onClick={() => setMenu(menu === "reject" ? null : "reject")}
        />
        <RvCell
          title="Previous"
          icon={<IconPrevious />}
          testid="btnPrevChange"
          disabled={changes.length === 0}
          onClick={() => {
            setMenu(null);
            editor?.chain().focus().previousChange().run();
          }}
        />
        <RvCell
          title="Next"
          icon={<IconNext />}
          testid="btnNextChange"
          disabled={changes.length === 0}
          onClick={() => {
            setMenu(null);
            editor?.chain().focus().nextChange().run();
          }}
        />
        <Popover open={menu === "accept"} onClose={() => setMenu(null)} align="right-0">
          <MenuSection title="Accept Changes" />
          <MenuItem onClick={() => { editor?.chain().focus().acceptChanges(false).run(); setMenu(null); }}>
            Accept and Move to Next
          </MenuItem>
          <MenuItem onClick={() => { acceptAll(false); setMenu(null); }}>Accept All Changes</MenuItem>
          <MenuItem onClick={() => { acceptAll(true); setMenu(null); }}>Accept All Changes and Stop Tracking</MenuItem>
        </Popover>
        <Popover open={menu === "reject"} onClose={() => setMenu(null)} align="right-0">
          <MenuSection title="Reject Changes" />
          <MenuItem onClick={() => { editor?.chain().focus().rejectChanges(false).run(); setMenu(null); }}>
            Reject and Move to Next
          </MenuItem>
          <MenuItem onClick={() => { rejectAll(false); setMenu(null); }}>Reject All Changes</MenuItem>
          <MenuItem onClick={() => { rejectAll(true); setMenu(null); }}>Reject All Changes and Stop Tracking</MenuItem>
        </Popover>
      </Group>

      {/* Compare */}
      <Group title="Compare">
        <RvCell
          title="Compare"
          icon={<IconCompare />}
          testid="btnCompare"
          onClick={() => {
            setMenu(null);
            setCompareMode("compare");
          }}
        />
        <RvCell
          title="Combine"
          icon={<IconCombine />}
          testid="btnCombine"
          onClick={() => {
            setMenu(null);
            setCompareMode("combine");
          }}
        />
      </Group>

      {/* Protect */}
      <Group title="Protect">
        <RvCell
          title="Restrict Editing"
          icon={<IconRestrictEditing />}
          active={restrictReadOnly}
          testid="btnRestrict"
          onClick={() => {
            setMenu(null);
            useAppStore.getState().setRestrictReadOnly(!restrictReadOnly);
          }}
        />
        <RvCell
          title="Mark as Final"
          icon={<IconMarkAsFinal />}
          active={final}
          testid="btnMarkFinal"
          onClick={() => {
            setMenu(null);
            useAppStore.getState().setFinal(!final);
          }}
        />
      </Group>

      {/* Language */}
      <Group title="Language">
        <RvCell
          title="Translate"
          icon={<IconTranslate />}
          testid="btnTranslate"
          active={reviewPanel === "translator"}
          onClick={() => {
            setMenu(null);
            useAppStore.getState().setReviewPanel(reviewPanel === "translator" ? "none" : "translator");
          }}
        />
        <RvCell
          title="Language"
          icon={<IconLanguage />}
          testid="btnLanguage"
          onClick={() => {
            setMenu(null);
            setShowLanguage(true);
          }}
        />
      </Group>

      {/* Ink */}
      <Group title="Ink">
        <RvCell
          title="Start Inking"
          icon={<IconInkPen />}
          testid="btnInk"
          active={menu === "ink"}
          onClick={() => setMenu(menu === "ink" ? null : "ink")}
        />
        <RvCell
          title="Ink to Text"
          icon={<IconInkText />}
          onClick={() => {
            if (menu !== "ink") setMenu("ink");
          }}
        />
        <RvCell
          title="Ink to Shape"
          icon={<IconInkShape />}
          onClick={() => {
            if (menu !== "ink") setMenu("ink");
          }}
        />
        <RvCell
          title="Ink to Math"
          icon={<IconInkMath />}
          onClick={() => {
            if (menu !== "ink") setMenu("ink");
          }}
        />
        <Popover open={menu === "ink"} onClose={() => setMenu(null)} align="right-0">
          <InkPad onInsert={insertInk} />
        </Popover>
      </Group>

      {showWordCount && <WordCountDialog onClose={() => setShowWordCount(false)} />}
      {compareMode && <CompareDialog mode={compareMode} onClose={() => setCompareMode(null)} />}
      {showLanguage && <LanguageDialog onClose={() => setShowLanguage(false)} />}
    </div>
  );
}