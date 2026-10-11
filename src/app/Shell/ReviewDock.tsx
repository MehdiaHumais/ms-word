import { useEffect, useMemo, useState } from "react";
import { useEditorContext } from "../Editor/EditorContext";
import { useAppStore } from "../../stores/appStore";
import { computeMisspellings } from "../Editor/extensions/SpellCheck";
import {
  addToDictionary,
  ignoreWord,
  suggestionsFor,
  THESAURUS,
  translateText,
  scanAccessibility,
} from "./reviewLib";
import { listCommentRanges } from "../Editor/extensions/Comment";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function getSelectedWord(editor: { state: any }): { text: string; from: number; to: number } | null {
  const { doc, selection } = editor.state;
  if (!selection.empty) {
    const t = doc.textBetween(selection.from, selection.to, " ", " ");
    if (t.trim() && /^[A-Za-zÀ-ÿ'-]+$/.test(t.trim())) {
      const lead = t.length - t.trimStart().length;
      const trail = t.length - t.trimEnd().length;
      return { text: t.trim(), from: selection.from + lead, to: selection.to - trail };
    }
  }
  let from = selection.from;
  let to = selection.from;
  const max = doc.content.size;
  let guard = 0;
  while (from > 0 && /\S/.test(doc.textBetween(from - 1, from)) && guard++ < 500) from--;
  guard = 0;
  while (to < max && /\S/.test(doc.textBetween(to, to + 1)) && guard++ < 500) to++;
  if (from === to) return null;
  return { text: doc.textBetween(from, to, " ", " "), from, to };
}

function PanelShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed right-3 top-[118px] z-30 flex h-[calc(100%-172px)] w-[340px] flex-col rounded border border-[#e1e1e1] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
      data-testid={`review-panel-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-center justify-between border-b border-[#e8e8e8] px-3 py-2">
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-[#1b1b1b]">{title}</span>
          {subtitle && <span className="text-[10px] text-[#8a8a8a]">{subtitle}</span>}
        </div>
        <button
          className="text-[#5b5b5b] hover:text-[#0078d4]"
          onClick={onClose}
          aria-label={`Close ${title} pannel`}
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Editor / Spelling & Grammar pane                                    */
/* ------------------------------------------------------------------ */

export function EditorPane() {
  const editor = useEditorContext();
  const proofingLang = useAppStore((s) => s.proofingLang);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const bump = () => setTick((t) => t + 1);
    editor.on("transaction", bump);
    return () => {
      editor.off("transaction", bump);
    };
  }, [editor]);

  const misses = useMemo(
    () => (editor ? computeMisspellings(editor.state.doc) : []),
    [editor, tick],
  );

  const replace = (word: string, suggestion: string, all: boolean) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .command(({ tr, dispatch }) => {
        const targets = computeMisspellings(tr.doc).filter((m) => m.word === word);
        if (targets.length === 0) return false;
        if (all) {
          for (let i = targets.length - 1; i >= 0; i--) {
            tr.insertText(suggestion, targets[i].from, targets[i].to);
          }
        } else {
          const t = targets.find((m) => m.from >= editor.state.selection.from - 1) ?? targets[0];
          tr.insertText(suggestion, t.from, t.to);
        }
        dispatch?.(tr);
        return true;
      })
      .run();
  };

  const ignoreAction = (word: string, all: boolean) => {
    ignoreWord(word);
    if (all) void all;
    setTick((t) => t + 1);
  };

  const addKnown = (word: string) => {
    addToDictionary(word);
    setTick((t) => t + 1);
  };

  return (
    <PanelShell
      title="Editor"
      subtitle={`Spelling & Grammar — ${proofingLang}`}
      onClose={() => useAppStore.getState().setReviewPanel("none")}
    >
      {misses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <span className="text-[28px]">✓</span>
          <div className="text-[13px] font-semibold text-[#1e7e34]">
            No writing issues found.
          </div>
          <div className="text-[11px] text-[#8a8a8a]">
            The editor did not find any spelling or grammar problems.
          </div>
        </div>
      ) : (
        misses.map((m) => {
          const suggestions = suggestionsFor(m.word);
          return (
            <div
              key={`${m.word}-${m.from}`}
              className="border-b border-[#f0f0f0] px-3 py-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-[#b23b3b] line-through decoration-[#b23b3b]">
                  {m.word}
                </span>
                <span className="text-[10px] text-[#8a8a8a]">spelling</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {suggestions.slice(0, 4).map((s) => (
                  <button
                    key={s}
                    onClick={() => replace(m.word, s, false)}
                    className="rounded-full border border-[#d0d0d0] px-2 py-0.5 text-[12px] text-[#1a1a1a] hover:border-[#9fc4ec] hover:bg-[#eaf1fa]"
                  >
                    {s}
                  </button>
                ))}
                {suggestions.length === 0 && (
                  <span className="text-[11px] italic text-[#8a8a8a]">No suggestions</span>
                )}
              </div>
              <div className="mt-1.5 flex gap-1 text-[11px]">
                <button
                  onClick={() => replace(m.word, suggestions[0] ?? m.word, false)}
                  className="rounded border border-[#4472c4] px-2 py-0.5 text-[#1e4a80] hover:bg-[#eaf1fa]"
                >
                  Change
                </button>
                <button
                  onClick={() => replace(m.word, suggestions[0] ?? m.word, true)}
                  className="rounded border border-[#d0d0d0] px-2 py-0.5 text-[#444] hover:bg-[#f0f4fa]"
                >
                  Change All
                </button>
                <button
                  onClick={() => ignoreAction(m.word, false)}
                  className="rounded border border-[#d0d0d0] px-2 py-0.5 text-[#444] hover:bg-[#f0f4fa]"
                >
                  Ignore
                </button>
                <button
                  onClick={() => ignoreAction(m.word, true)}
                  className="rounded border border-[#d0d0d0] px-2 py-0.5 text-[#444] hover:bg-[#f0f4fa]"
                >
                  Ignore All
                </button>
                <button
                  onClick={() => addKnown(m.word)}
                  className="rounded border border-[#d0d0d0] px-2 py-0.5 text-[#444] hover:bg-[#f0f4fa]"
                >
                  Add
                </button>
              </div>
            </div>
          );
        })
      )}
    </PanelShell>
  );
}

/* ------------------------------------------------------------------ */
/* Thesaurus pane                                                      */
/* ------------------------------------------------------------------ */

export function ThesaurusPane() {
  const editor = useEditorContext();
  const [lookup, setLookup] = useState("");
  const [word, setWord] = useState<{ text: string; from: number; to: number } | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const sel = getSelectedWord(editor);
    if (sel) setWord(sel);
    const bump = () => {
      setTick((t) => t + 1);
    };
    editor.on("selectionUpdate", bump);
    return () => {
      editor.off("selectionUpdate", bump);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const sel = getSelectedWord(editor);
    if (sel) setWord(sel);
  }, [tick, editor]);

  const target = (word?.text ?? lookup.trim() ?? "").toLowerCase().replace(/[^a-zà-ÿ'-]/g, "");
  const syns = target ? THESAURUS[target] ?? [] : [];

  const useWord = (syn: string) => {
    if (!editor || !word || word.from < 0) return;
    editor
      .chain()
      .focus()
      .command(({ tr, dispatch }) => {
        tr.insertText(syn, word.from, word.to);
        dispatch?.(tr);
        return true;
      })
      .run();
    setWord({ ...word, text: syn });
  };

  return (
    <PanelShell
      title="Thesaurus"
      subtitle="Synonyms of the selected word"
      onClose={() => useAppStore.getState().setReviewPanel("none")}
    >
      <div className="px-3 py-2">
        <div className="mb-2 flex items-center gap-1">
          <input
            aria-label="Thesaurus look up"
            placeholder="Look up a word"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            className="h-[26px] flex-1 rounded border border-[#c8c8c8] px-2 text-[12px] focus:border-[#4472c4] focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && lookup.trim()) {
                const t = lookup.trim().toLowerCase();
                setWord({ text: t, from: -1, to: -1 });
              }
            }}
          />
          <button
            onClick={() => lookup.trim() && setWord({ text: lookup.trim(), from: -1, to: -1 })}
            className="rounded border border-[#d0d0d0] px-2 py-1 text-[12px] hover:bg-[#eaf1fa]"
          >
            Look up
          </button>
        </div>
        {word && (
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-[12px] font-semibold text-[#1b1b1b]">Current:</span>
            <span className="rounded bg-[#eaf1fa] px-1.5 py-0.5 text-[12px] text-[#1e4a80]">
              {word.text}
            </span>
          </div>
        )}
        {target && syns.length === 0 ? (
          <div className="px-1 py-3 text-[12px] text-[#8a8a8a]">
            The thesaurus does not have an entry for “{target}”.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {target && (
              <div className="px-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                {target} ({syns.length} synonyms)
              </div>
            )}
            {syns.map((s) => (
              <button
                key={s}
                onClick={() => useWord(s)}
                className="rounded px-2 py-1 text-left text-[13px] text-[#333] hover:bg-[#eaf1fa] hover:text-[#1e4a80]"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </PanelShell>
  );
}

/* ------------------------------------------------------------------ */
/* Accessibility pane                                                  */
/* ------------------------------------------------------------------ */

export function AccessibilityPane() {
  const editor = useEditorContext();
  const [tick, setTick] = useState(0);
  const [fixMsg, setFixMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!editor) return;
    const bump = () => setTick((t) => t + 1);
    editor.on("transaction", bump);
    return () => {
      editor.off("transaction", bump);
    };
  }, [editor]);

  const issues = useMemo(() => {
    if (!editor) return [];
    return scanAccessibility(editor.state.doc);
  }, [editor, tick]);

  const fix = (kind: string) => {
    if (!editor) return;
    const ok = editor
      .chain()
      .focus()
      .command(({ tr, dispatch }) => {
        let done = false;
        tr.doc.descendants((node, pos) => {
          if (done) return false;
          if (kind === "image-alt" && node.type.name === "image") {
            tr.setNodeMarkup(pos, null, { ...node.attrs, alt: "Document image" });
            done = true;
          } else if (kind === "blank-paragraph" && node.isTextblock && !node.textContent.trim()) {
            tr.delete(pos, pos + node.nodeSize);
            done = true;
          } else if (kind === "repeated-spaces" && node.isText && /\s{2,}/.test(node.text ?? "")) {
            tr.insertText((node.text ?? "").replace(/\s{2,}/g, " "), pos, pos + node.nodeSize);
            done = true;
          }
          return !done;
        });
        if (!done) return false;
        dispatch?.(tr);
        return true;
      })
      .run();
    if (ok) setFixMsg("Fixed — scanning again…");
    else setFixMsg("Nothing left to fix.");
    setTimeout(() => setFixMsg(null), 1600);
  };

  return (
    <PanelShell
      title="Accessibility"
      subtitle="Inspection results"
      onClose={() => useAppStore.getState().setReviewPanel("none")}
    >
      <div className="px-3 py-2">
        {fixMsg && (
          <div className="mb-2 rounded bg-[#e6f4ea] px-2 py-1 text-[12px] text-[#1e7e34]">
            {fixMsg}
          </div>
        )}
        {issues.length === 0 ? (
          <div className="px-1 py-3 text-[12px] text-[#1e7e34]">
            No accessibility issues found.
          </div>
        ) : (
          issues.map((issue, i) => (
            <div key={i} className="mb-1.5 rounded border border-[#eee] p-2">
              <div className="text-[12px] font-semibold text-[#1b1b1b]">{issue.label}</div>
              <button
                onClick={() => fix(issue.kind)}
                className="mt-1 rounded border border-[#4472c4] px-2 py-0.5 text-[11px] text-[#1e4a80] hover:bg-[#eaf1fa]"
              >
                Fix
              </button>
            </div>
          ))
        )}
      </div>
    </PanelShell>
  );
}

/* ------------------------------------------------------------------ */
/* Comments pane                                                       */
/* ------------------------------------------------------------------ */

export function CommentsPane() {
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

  const comments = useMemo(() => (editor ? listCommentRanges(editor.state) : []), [editor, tick]);

  const removeComment = (id: string) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .command(({ tr, dispatch }) => {
        const node = tr.doc;
        let removed = false;
        node.descendants((n, pos) => {
          if (n.isText && n.marks.some((m) => m.type.name === "comment" && m.attrs.id === id)) {
            tr.removeMark(pos, pos + n.nodeSize, tr.doc.type.schema.marks.comment);
            removed = true;
          }
          return !removed;
        });
        if (!removed) return false;
        dispatch?.(tr);
        return true;
      })
      .run();
  };

  return (
    <PanelShell
      title="Comments"
      subtitle="Comments in the document"
      onClose={() => useAppStore.getState().setReviewPanel("none")}
    >
      <div className="flex flex-col gap-1 px-1 py-1">
        {comments.length === 0 && (
          <div className="px-3 py-4 text-[12px] text-[#8a8a8a]">
            This document has no comments. Select some text and click New Comment.
          </div>
        )}
        {comments.map((c) => (
          <div key={c.id} className="rounded border border-[#eee] bg-[#fafafa] p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9a6700]">
                {c.author}
              </span>
              {c.created && (
                <span className="text-[10px] text-[#9a9a9a]">
                  {new Date(c.created).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[12px] text-[#333]">
              “{c.text || "(empty selection)"}”
            </div>
            <div className="mt-1.5 flex gap-1">
              <button
                onClick={() => editor?.chain().focus().selectComment(c.id).run()}
                className="rounded border border-[#d0d0d0] px-2 py-0.5 text-[11px] hover:bg-[#eaf1fa]"
              >
                Go to
              </button>
              <button
                onClick={() => removeComment(c.id)}
                className="rounded border border-[#d0d0d0] px-2 py-0.5 text-[11px] text-[#b23b3b] hover:bg-[#fde9e9]"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

/* ------------------------------------------------------------------ */
/* Translator pane                                                     */
/* ------------------------------------------------------------------ */

const LANG_OPTIONS = [
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
] as const;

export function TranslatorPane() {
  const editor = useEditorContext();
  const [lang, setLang] = useState<(typeof LANG_OPTIONS)[number]["code"]>("es");
  const [src, setSrc] = useState<"selection" | "document">("selection");
  const [result, setResult] = useState<{ text: string; found: number; total: number } | null>(null);

  const doTranslate = () => {
    if (!editor) return;
    const { doc, selection } = editor.state;
    const text =
      src === "document" || selection.empty
        ? doc.textBetween(0, doc.content.size, "\n", " ")
        : doc.textBetween(selection.from, selection.to, " ", " ");
    setResult(translateText(text, lang));
  };

  return (
    <PanelShell
      title="Translator"
      subtitle="Offline micro-glossary"
      onClose={() => useAppStore.getState().setReviewPanel("none")}
    >
      <div className="flex flex-col gap-2 px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-[#5b5b5b]">To:</span>
          {LANG_OPTIONS.map((o) => (
            <button
              key={o.code}
              onClick={() => {
                setLang(o.code);
                if (result) setResult((r) => r && translateText(" ", o.code));
              }}
              className={`rounded px-2 py-1 text-[12px] ${
                lang === o.code
                  ? "bg-[#cfe3fb] text-[#1e4a80]"
                  : "text-[#444] hover:bg-[#f0f4fa]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {(["selection", "document"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSrc(s)}
              className={`rounded px-2 py-1 text-[12px] ${
                src === s ? "bg-[#cfe3fb] text-[#1e4a80]" : "text-[#444] hover:bg-[#f0f4fa]"
              }`}
            >
              {s === "selection" ? "Selected text" : "Whole document"}
            </button>
          ))}
          <button
            onClick={doTranslate}
            className="ml-auto rounded border border-[#4472c4] px-2 py-1 text-[12px] font-semibold text-[#1e4a80] hover:bg-[#eaf1fa]"
          >
            Translate
          </button>
        </div>
        {src === "selection" && !editor?.state.selection.empty && (
          <div className="rounded bg-[#f6f8fb] px-2 py-1 text-[11px] text-[#5b5b5b]">
            Source: “{editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, " ", " ").slice(0, 80)}”
          </div>
        )}
        <div className="rounded border border-[#eee] bg-[#fafafa] p-2 text-[13px] leading-relaxed text-[#1b1b1b]">
          {result ? result.text : "Translation appears here. Select text or the whole document, choose a language, then click Translate."}
        </div>
        {result && (
          <div className="text-[11px] text-[#8a8a8a]">
            {result.found} of {result.total} words matched the micro-glossary.
          </div>
        )}
      </div>
    </PanelShell>
  );
}

/* ------------------------------------------------------------------ */
/* Dock dispatcher                                                     */
/* ------------------------------------------------------------------ */

export function ReviewDock() {
  const panel = useAppStore((s) => s.reviewPanel);
  if (panel === "editor") return <EditorPane />;
  if (panel === "thesaurus") return <ThesaurusPane />;
  if (panel === "accessibility") return <AccessibilityPane />;
  if (panel === "comments") return <CommentsPane />;
  if (panel === "translator") return <TranslatorPane />;
  return null;
}