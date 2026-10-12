import { useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useEditorContext } from "../Editor/EditorContext";
import { ptToPx } from "../Editor/editorConfig";
import { useAppStore } from "../../stores/appStore";
import { FONTS, FONT_SIZES } from "./HomeTab";
import { Modal } from "./tabKit";

/**
 * Word-style right-click menu for the editor.
 *
 * Opens on `contextmenu` inside the editing surface and offers the same
 * families of actions Word does — clipboard, styles, lists, alignment, line
 * spacing, Font…/Paragraph… dialogs, hyperlinks, comments and look-up tools.
 * Everything is wired to the same commands the ribbon uses, so no item is a
 * label-only entry.
 */

type SubId = "paste" | "styles" | "list" | "align" | "line";
type Dialog = null | "font" | "paragraph" | "link";

const LINE_HEIGHTS = ["1.0", "1.15", "1.5", "2.0", "2.5", "3.0"];

const itemCls =
  "flex w-full items-center gap-2 rounded-[3px] px-3 py-[3px] text-left text-[12px] leading-[18px]";
const enabledCls = "cursor-pointer text-[#1b1b1b] hover:bg-[#dfeaf7]";
const disabledCls = "cursor-default text-[#b5b5b5]";
const activeCls = "bg-[#cfe3fb] text-[#1e4a80]";

function Item({
  onClick,
  disabled,
  active,
  testid,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  testid?: string;
  children: ReactNode;
}) {
  return (
    <button
      data-testid={testid}
      disabled={disabled}
      onClick={onClick}
      className={`${itemCls} ${disabled ? disabledCls : active ? activeCls : enabledCls}`}
    >
      <span className="w-4 shrink-0 text-center text-[11px] leading-none">
        {active ? "✓" : ""}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}

function Sep() {
  return <div className="mx-2 my-1 border-t border-[#e1e1e1]" />;
}

function Sub({
  label,
  children,
  open,
  onOpen,
  testid,
}: {
  label: string;
  children: ReactNode;
  open: boolean;
  onOpen: () => void;
  testid?: string;
}) {
  return (
    <div className="relative" data-testid={testid}>
      <button onMouseEnter={onOpen} className={`${itemCls} ${open ? activeCls : enabledCls}`}>
        <span className="w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="pl-1 text-[10px] leading-none text-[#8a8a8a]">▸</span>
      </button>
      {open && (
        <div className="absolute left-full top-0 z-10 ml-[2px] min-w-[178px] rounded-[3px] border border-[#c8c8c8] bg-white py-0.5 shadow-[0_4px_14px_rgba(0,0,0,0.18)]">
          {children}
        </div>
      )}
    </div>
  );
}

export function EditorContextMenu({ x, y, onClose }: { x: number; y: number; onClose: () => void }) {
  const editor = useEditorContext();
  const [sub, setSub] = useState<SubId | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  /** Where the pointer was when the menu opened, resolved through the editor. */
  const pointer = useMemo(() => {
    if (!editor) return { pos: null, link: null };
    const coords = editor.view.posAtCoords({ left: x, top: y });
    if (!coords) return { pos: null, link: null };
    const resolved = editor.state.doc.resolve(coords.pos);
    const link = resolved.marks().find((m) => m.type.name === "link");
    return {
      pos: coords.pos,
      link: link && typeof link.attrs.href === "string" ? (link.attrs.href as string) : null,
    };
  }, [editor, x, y]);

  const sel = editor?.state.selection;
  const hasSelection = !!editor && !!sel && !sel.empty;
  const selText = editor && sel ? editor.state.doc.textBetween(sel.from, sel.to, " ") : "";
  const isOnLink = !!pointer.link;

  // Close on Escape or any click outside the menu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    if (!dialog) window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [onClose, dialog]);

  // Word is happy to open long menus; keep it on-screen.
  const style = {
    left: Math.max(6, Math.min(x, window.innerWidth - 236)),
    top: Math.max(6, Math.min(y, window.innerHeight - 520)),
  };

  /* ---------------------------------------------------------------- */
  /* Actions                                                           */
  /* ---------------------------------------------------------------- */

  const posAt = (pos?: number | null) =>
    pos ?? (editor ? editor.state.selection.from : 0);

  const blockType = (pos?: number | null) =>
    editor &&
    editor.state.doc.resolve(posAt(pos)).parent.type.name === "heading"
      ? "heading"
      : "paragraph";

  const applyBlocks = (patch: Record<string, string | null>) => {
    if (!editor) return;
    const pos = posAt(pointer.pos);
    editor.chain().focus().setTextSelection(pos).updateAttributes(blockType(pos), patch).run();
  };

  const copy = () => {
    if (hasSelection) navigator.clipboard.writeText(selText).catch(() => {});
    onClose();
  };

  const cut = () => {
    if (hasSelection) {
      navigator.clipboard.writeText(selText).catch(() => {});
      editor?.chain().focus().deleteSelection().run();
    }
    onClose();
  };

  const paste = (html = false) => {
    const insert = (fallback: string) => {
      if (fallback && editor) editor.chain().focus().insertContent(fallback).run();
    };
    if (html) {
      navigator.clipboard
        .read()
        .then((items) => {
          const htmlItem = items.find((i) => i.types.includes("text/html"));
          if (htmlItem) {
            (htmlItem as unknown as { getAsString: (cb: (s: string) => void) => void }).getAsString(
              insert,
            );
          } else navigator.clipboard.readText().then(insert).catch(() => {});
        })
        .catch(() => navigator.clipboard.readText().then(insert).catch(() => {}));
    } else {
      navigator.clipboard.readText().then(insert).catch(() => {});
    }
    onClose();
  };

  const selectAll = () => {
    editor?.chain().focus().selectAll().run();
    onClose();
  };

  /* Hyperlink actions ---------------------------------------------------- */

  const normalizeUrl = (url: string) =>
    /^[a-z][a-z0-9+.-]*:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;

  const insertLink = (url: string, text: string) => {
    if (!editor) return;
    const href = normalizeUrl(url);
    if (!sel || sel.empty) {
      const display = text.trim() || href;
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${href.replace(/"/g, "&quot;")}">${display.replace(/</g, "&lt;")}</a>`)
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    onClose();
  };

  const openLink = () => {
    if (pointer.link) window.open(pointer.link, "_blank");
    onClose();
  };

  const copyLink = () => {
    if (pointer.link) navigator.clipboard.writeText(pointer.link).catch(() => {});
    onClose();
  };

  const removeLink = () => {
    if (!editor || pointer.pos === null) return;
    editor.chain().focus().setTextSelection(pointer.pos).extendMarkRange("link").unsetLink().run();
    onClose();
  };

  const newComment = () => {
    editor?.chain().focus().addComment().run();
    onClose();
  };

  /* ---------------------------------------------------------------- */
  /* Main menu                                                         */
  /* ---------------------------------------------------------------- */

  const main = (
    <div
      ref={ref}
      data-testid="editor-context-menu"
      style={style}
      className="fixed z-[55] min-w-[218px] max-w-[260px] rounded-[3px] border border-[#c8c8c8] bg-white py-1 shadow-[0_6px_20px_rgba(0,0,0,0.22)] select-none"
    >
      <Item testid="cm-cut" disabled={!hasSelection} onClick={cut}>
        Cut
      </Item>
      <Item testid="cm-copy" disabled={!hasSelection} onClick={copy}>
        Copy
      </Item>
      <Item testid="cm-paste" onClick={() => paste()}>
        Paste
      </Item>
      <Sub label="Paste Options" open={sub === "paste"} onOpen={() => setSub("paste")} testid="cm-paste-opt">
        <Item onClick={() => paste(true)}>Keep Source Formatting</Item>
        <Item onClick={() => paste()}>Keep Text Only</Item>
      </Sub>
      <Sep />

      <Sub label="Styles" open={sub === "styles"} onOpen={() => setSub("styles")} testid="cm-styles">
        <Item
          testid="cm-style-normal"
          onClick={() => {
            editor?.chain().focus().setParagraph().unsetAllMarks().run();
            onClose();
          }}
        >
          Normal
        </Item>
        <Item
          testid="cm-style-h1"
          active={editor?.isActive("heading", { level: 1 }) ?? false}
          onClick={() => {
            editor?.chain().focus().setHeading({ level: 1 }).run();
            onClose();
          }}
        >
          Heading 1
        </Item>
        <Item
          active={editor?.isActive("heading", { level: 2 }) ?? false}
          onClick={() => {
            editor?.chain().focus().setHeading({ level: 2 }).run();
            onClose();
          }}
        >
          Heading 2
        </Item>
        <Item
          active={editor?.isActive("heading", { level: 3 }) ?? false}
          onClick={() => {
            editor?.chain().focus().setHeading({ level: 3 }).run();
            onClose();
          }}
        >
          Heading 3
        </Item>
      </Sub>

      <Sub label="Bullets &amp; Numbering" open={sub === "list"} onOpen={() => setSub("list")} testid="cm-list">
        <Item
          testid="cm-list-bullets"
          active={editor?.isActive("bulletList") ?? false}
          onClick={() => {
            editor?.chain().focus().toggleBulletList().run();
            onClose();
          }}
        >
          Bulleted
        </Item>
        <Item
          active={editor?.isActive("orderedList") ?? false}
          onClick={() => {
            editor?.chain().focus().toggleOrderedList().run();
            onClose();
          }}
        >
          Numbered
        </Item>
      </Sub>

      <Sub label="Align" open={sub === "align"} onOpen={() => setSub("align")} testid="cm-align">
        <Item
          active={editor?.isActive({ textAlign: "left" }) ?? false}
          onClick={() => {
            applyBlocks({ textAlign: "left" });
            onClose();
          }}
        >
          Left
        </Item>
        <Item
          testid="cm-align-center"
          active={editor?.isActive({ textAlign: "center" }) ?? false}
          onClick={() => {
            applyBlocks({ textAlign: "center" });
            onClose();
          }}
        >
          Center
        </Item>
        <Item
          active={editor?.isActive({ textAlign: "right" }) ?? false}
          onClick={() => {
            applyBlocks({ textAlign: "right" });
            onClose();
          }}
        >
          Right
        </Item>
        <Item
          active={editor?.isActive({ textAlign: "justify" }) ?? false}
          onClick={() => {
            applyBlocks({ textAlign: "justify" });
            onClose();
          }}
        >
          Justify
        </Item>
      </Sub>

      <Sub label="Line Spacing" open={sub === "line"} onOpen={() => setSub("line")} testid="cm-line">
        {LINE_HEIGHTS.map((lh) => (
          <Item
            key={lh}
            testid={`cm-line-${lh}`}
            active={editor?.isActive({ lineHeight: lh }) ?? false}
            onClick={() => {
              applyBlocks({ lineHeight: lh });
              onClose();
            }}
          >
            {lh}
          </Item>
        ))}
      </Sub>
      <Sep />

      <Item testid="cm-font" onClick={() => setDialog("font")}>
        Font…
      </Item>
      <Item testid="cm-para" onClick={() => setDialog("paragraph")}>
        Paragraph…
      </Item>
      <Sep />

      {isOnLink ? (
        <>
          <Item testid="cm-link-open" onClick={openLink}>
            Open Hyperlink
          </Item>
          <Item testid="cm-link-copy" onClick={copyLink}>
            Copy Hyperlink
          </Item>
          <Item testid="cm-link-edit" onClick={() => setDialog("link")}>
            Edit Hyperlink…
          </Item>
          <Item testid="cm-link-remove" onClick={removeLink}>
            Remove Hyperlink
          </Item>
        </>
      ) : (
        <Item testid="cm-hyperlink" onClick={() => setDialog("link")}>
          Hyperlink…
        </Item>
      )}
      <Item testid="cm-comment" onClick={newComment}>
        New Comment
      </Item>
      <Sep />

      <Item
        testid="cm-thesaurus"
        onClick={() => {
          useAppStore.getState().setReviewPanel("thesaurus");
          onClose();
        }}
      >
        Thesaurus
      </Item>
      <Item
        testid="cm-translate"
        onClick={() => {
          useAppStore.getState().setReviewPanel("translator");
          onClose();
        }}
      >
        Translate
      </Item>
      <Sep />

      <Item testid="cm-select-all" onClick={selectAll}>
        Select All
      </Item>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /* Dialogs                                                           */
  /* ---------------------------------------------------------------- */

  if (dialog === "font") {
    return <FontDialog onApply={onClose} onCancel={() => setDialog(null)} />;
  }
  if (dialog === "paragraph") {
    return (
      <ParagraphDialog
        pos={posAt(pointer.pos)}
        onClose={onClose}
        onCancel={() => setDialog(null)}
      />
    );
  }
  if (dialog === "link") {
    return (
      <LinkDialog
        initialUrl={isOnLink ? (pointer.link ?? "") : ""}
        hasSelection={hasSelection}
        onApply={insertLink}
        onCancel={() => setDialog(null)}
      />
    );
  }
  return main;
}

/* ---------------------------------------------------------------- */
/* Dialog components                                                 */
/* ---------------------------------------------------------------- */

function FontDialog({ onApply, onCancel }: { onApply: () => void; onCancel: () => void }) {
  const editor = useEditorContext();
  const cur = useMemo(() => editor?.getAttributes("textStyle") ?? {}, [editor]);
  const [family, setFamily] = useState<string>(
    (typeof cur.fontFamily === "string" && cur.fontFamily) || "Calibri",
  );
  const [size, setSize] = useState<number>(() => {
    const raw = typeof cur.fontSize === "string" ? cur.fontSize : "";
    const px = Number.parseFloat(raw);
    return raw.endsWith("px") && Number.isFinite(px) ? Math.round(px * 0.75) : 11;
  });

  const apply = () => {
    editor?.chain().focus().setFontFamily(family).setFontSize(ptToPx(size)).run();
    onApply();
  };

  return (
    <Modal title="Font" onClose={onCancel} testid="cm-font-dialog">
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-[12px] text-[#333]">
          Font
          <select
            data-testid="cm-font-family"
            value={family}
            onChange={(e) => setFamily(e.target.value)}
            className="w-full rounded border border-[#c8c8c8] bg-white px-2 py-1.5"
            style={{ fontFamily: family }}
          >
            {FONTS.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[#333]">
          Font size
          <select
            data-testid="cm-font-size"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full rounded border border-[#c8c8c8] bg-white px-2 py-1.5"
          >
            {FONT_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-1 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded border border-[#c8c8c8] px-3 py-1 text-[12px] text-[#333] hover:bg-[#f0f4fa]"
          >
            Cancel
          </button>
          <button
            data-testid="cm-font-apply"
            onClick={apply}
            className="rounded bg-[#185abd] px-3 py-1 text-[12px] font-medium text-white hover:bg-[#14499b]"
          >
            Apply
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ParagraphDialog({
  pos,
  onClose,
  onCancel,
}: {
  pos: number;
  onClose: () => void;
  onCancel: () => void;
}) {
  const editor = useEditorContext();
  const attrs = useMemo(() => {
    if (!editor) return {};
    return editor.state.doc.resolve(pos).parent.attrs;
  }, [editor, pos]);

  const blockType = () =>
    editor && editor.state.doc.resolve(pos).parent.type.name === "heading"
      ? "heading"
      : "paragraph";

  const [align, setAlign] = useState<string>(
    (typeof attrs.textAlign === "string" && attrs.textAlign) || "left",
  );
  const [line, setLine] = useState<string>(
    (typeof attrs.lineHeight === "string" && attrs.lineHeight !== "default" && attrs.lineHeight) ||
      "1.0",
  );
  const [before, setBefore] = useState<number>(() => {
    const s = typeof attrs.spaceBefore === "string" ? attrs.spaceBefore : "";
    const n = Number.parseFloat(s);
    return s.endsWith("pt") && Number.isFinite(n) ? n : 0;
  });
  const [after, setAfter] = useState<number>(() => {
    const s = typeof attrs.spaceAfter === "string" ? attrs.spaceAfter : "";
    const n = Number.parseFloat(s);
    return s.endsWith("pt") && Number.isFinite(n) ? n : 0;
  });

  const step = (setter: Dispatch<SetStateAction<number>>, dir: 1 | -1) => () =>
    setter((n) => Math.max(0, n + 6 * dir));

  const apply = () => {
    editor
      ?.chain()
      .focus()
      .setTextSelection(pos)
      .updateAttributes(blockType(), {
        textAlign: align,
        lineHeight: line,
        spaceBefore: before > 0 ? `${before}pt` : null,
        spaceAfter: after > 0 ? `${after}pt` : null,
      })
      .run();
    onClose();
  };

  const alignBtn = (value: string, label: string, testid?: string) => (
    <button
      key={value}
      data-testid={testid}
      onClick={() => setAlign(value)}
      className={`min-w-[52px] flex-1 rounded-[3px] border px-1.5 py-1 text-[12px] ${
        align === value
          ? "border-[#185abd] bg-[#dfeaf7] font-semibold text-[#185abd]"
          : "border-[#c8c8c8] bg-white text-[#333] hover:bg-[#f0f4fa]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Modal title="Paragraph" onClose={onCancel} testid="cm-para-dialog">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 text-[12px] text-[#333]">
          Alignment
          <div className="flex gap-1">
            {alignBtn("left", "Left", "cm-para-left")}
            {alignBtn("center", "Center", "cm-para-center")}
            {alignBtn("right", "Right", "cm-para-right")}
            {alignBtn("justify", "Justify", "cm-para-justify")}
          </div>
        </div>
        <label className="flex flex-col gap-1 text-[12px] text-[#333]">
          Line spacing
          <select
            value={line}
            onChange={(e) => setLine(e.target.value)}
            className="w-full rounded border border-[#c8c8c8] bg-white px-2 py-1.5"
          >
            {LINE_HEIGHTS.map((lh) => (
              <option key={lh} value={lh}>
                {lh}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-6">
          {(
            [
              ["Space before", before, setBefore],
              ["Space after", after, setAfter],
            ] as const
          ).map(([label, value, setter]) => {
            const key = label.split(" ")[1];
            return (
              <div key={label} className="flex items-center gap-2 text-[12px] text-[#333]">
                <span>{label}</span>
                <button
                  data-testid={`cm-para-${key}-dec`}
                  onClick={step(setter, -1)}
                  className="h-6 w-6 rounded border border-[#c8c8c8] text-[14px] leading-none hover:bg-[#f0f4fa]"
                >
                  −
                </button>
                <span data-testid={`cm-para-${key}`}>{value}pt</span>
                <button
                  data-testid={`cm-para-${key}-inc`}
                  onClick={step(setter, 1)}
                  className="h-6 w-6 rounded border border-[#c8c8c8] text-[14px] leading-none hover:bg-[#f0f4fa]"
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded border border-[#c8c8c8] px-3 py-1 text-[12px] text-[#333] hover:bg-[#f0f4fa]"
          >
            Cancel
          </button>
          <button
            data-testid="cm-para-apply"
            onClick={apply}
            className="rounded bg-[#185abd] px-3 py-1 text-[12px] font-medium text-white hover:bg-[#14499b]"
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
}

function LinkDialog({
  initialUrl,
  hasSelection,
  onApply,
  onCancel,
}: {
  initialUrl: string;
  hasSelection: boolean;
  onApply: (url: string, text: string) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState("");

  const apply = () => {
    if (!url.trim()) return;
    onApply(url.trim(), text.trim());
  };

  return (
    <Modal title="Insert Hyperlink" onClose={onCancel} testid="cm-link-dialog">
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-[12px] text-[#333]">
          Address
          <input
            data-testid="cm-link-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            autoFocus
            className="w-full rounded border border-[#c8c8c8] bg-white px-2 py-1.5 outline-none focus:border-[#185abd]"
          />
        </label>
        {!hasSelection && (
          <label className="flex flex-col gap-1 text-[12px] text-[#333]">
            Text to display
            <input
              data-testid="cm-link-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Link text"
              className="w-full rounded border border-[#c8c8c8] bg-white px-2 py-1.5 outline-none focus:border-[#185abd]"
            />
          </label>
        )}
        <div className="mt-1 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded border border-[#c8c8c8] px-3 py-1 text-[12px] text-[#333] hover:bg-[#f0f4fa]"
          >
            Cancel
          </button>
          <button
            data-testid="cm-link-insert"
            disabled={!url.trim()}
            onClick={apply}
            className="rounded bg-[#185abd] px-3 py-1 text-[12px] font-medium text-white hover:bg-[#14499b] disabled:opacity-50"
          >
            Insert
          </button>
        </div>
      </div>
    </Modal>
  );
}