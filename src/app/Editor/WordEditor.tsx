import { EditorContent } from "@tiptap/react";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useEditorContext } from "./EditorContext";
import { useAppStore, PAGE_SIZES } from "../../stores/appStore";
import { getTheme, themeVars } from "../../stores/themes";
import { EditorContextMenu } from "../Shell/EditorContextMenu";
import { FindReplacePanel } from "../Shell/FindReplacePanel";
import { ReviewingPane } from "../Shell/ReviewingPane";
import { ReviewDock } from "../Shell/ReviewDock";
import { ReferenceDock } from "../Shell/ReferenceDock";
import { NavPane } from "../Shell/NavPane";
import { InkCanvas } from "./InkCanvas";

/**
 * Editable header / footer strip shown above / below the page when toggled
 * from the Insert tab. Content is held in the store so it survives tab switches.
 */
function HfZone({
  side,
  active,
  text,
  onInput,
}: {
  side: "Header" | "Footer";
  active: boolean;
  text: string;
  onInput: (html: string) => void;
}) {
  return (
    <div style={{ minHeight: 40 }}>
      <div className="flex items-center justify-center">
        <span className="rounded bg-[#f0f1f4] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#6b6b6b]">
          {side}
        </span>
      </div>
      <div
        role="textbox"
        aria-label={`${side} zone`}
        contentEditable={active}
        suppressContentEditableWarning
        onInput={(e) => onInput((e.target as HTMLElement).innerHTML)}
        className={`rounded-[3px] border px-2 py-1 text-[12px] outline-none transition-colors ${
          active
            ? "border-[#c1d3ec] bg-white"
            : "cursor-pointer border-[#dfdfdf] bg-white/60 text-[#9a9a9a] hover:border-[#c1d3ec]"
        }`}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </div>
  );
}

const PAGE_BORDERS: Record<string, string> = {
  simple: "1px solid #9aa0a6",
  thick: "3px solid #5f6368",
  double: "4px double #5f6368",
  thin: "0.5px solid #b8bcc2",
};

/** Horizontal ruler above the page showing inches. */
function Ruler({ widthPx }: { widthPx: number }) {
  const marks = useMemo(() => {
    const arr: { left: number; major: boolean; label?: string }[] = [];
    let inch = 0;
    for (let x = 0; x < widthPx; x += 8) {
      const frac = (x / widthPx) * 8.27;
      if (Math.abs(frac - Math.round(frac)) < 0.06) {
        arr.push({ left: x, major: true, label: `${Math.round(frac)}` });
      } else if (Math.abs(frac - (Math.round(frac) + 0.5)) < 0.06) {
        arr.push({ left: x, major: false });
      }
    }
    void inch;
    return arr;
  }, [widthPx]);
  return (
    <div
      data-testid="ruler"
      className="relative h-6 shrink-0 border-b border-[#d0d0d0] bg-[#f7f7f7]"
      style={{ width: Math.min(widthPx, 1000) }}
    >
      {marks.map((m, i) => (
        <span
          key={i}
          className="absolute top-0 border-l border-[#b8bcc2]"
          style={{ left: m.left, height: m.major ? 10 : 6 }}
        />
      ))}
      <div
        className="absolute top-1 flex h-4 items-center justify-center border-x border-[#8ab4f8] bg-[#d2e3fc] text-[9px] font-semibold text-[#1e4a80]"
        style={{ left: 88, width: widthPx - 176 }}
      >
        Text width
      </div>
    </div>
  );
}

function OutlinePane() {
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
  void tick;
  const items = useMemo(() => {
    if (!editor) return [];
    const out: { level: number; text: string; from: number }[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        const text = node.textContent;
        if (text.trim()) out.push({ level: node.attrs.level as number, text, from: pos });
      }
      return true;
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, tick]);
  return (
    <div className="flex h-full w-[220px] shrink-0 flex-col border-r border-[#e0e0e0] bg-[#fbfbfb]">
      <div className="border-b border-[#e8e8e8] px-3 py-2 text-[12px] font-semibold text-[#1b1b1b]">
        Outline
      </div>
      <div className="flex-1 overflow-auto p-2">
        {items.length === 0 ? (
          <p className="px-2 py-3 text-[11px] text-[#999]">
            No headings yet. Apply Heading 1 – 3 styles to structure the document.
          </p>
        ) : (
          items.map((it, i) => (
            <button
              key={i}
              onClick={() => {
                editor?.commands.setTextSelection(it.from);
                editor?.commands.focus();
              }}
              className="block w-full cursor-pointer rounded px-2 py-1 text-left text-[11.5px] text-[#333] hover:bg-[#eaf1fa]"
              style={{ paddingLeft: `${6 + (it.level - 1) * 14}px` }}
            >
              {it.text}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * WordEditor renders the document surface. Behaviour adapts to the View tab:
 * print layout shows a paged white surface, web layout runs full-width, draft
 * shows a plain sheet. Read mode is handled by the AppShell overlay.
 */
export function WordEditor() {
  const editor = useEditorContext();
  const zoom = useAppStore((s) => s.zoom);
  const showHeader = useAppStore((s) => s.showHeader);
  const showFooter = useAppStore((s) => s.showFooter);
  const headerText = useAppStore((s) => s.headerText);
  const footerText = useAppStore((s) => s.footerText);
  const setHeaderText = useAppStore((s) => s.setHeaderText);
  const setFooterText = useAppStore((s) => s.setFooterText);
  const margins = useAppStore((s) => s.margins);
  const pageSizeId = useAppStore((s) => s.pageSizeId);
  const orientation = useAppStore((s) => s.orientation);
  const columns = useAppStore((s) => s.columns);
  const lineNumbers = useAppStore((s) => s.lineNumbers);
  const hyphenation = useAppStore((s) => s.hyphenation);
  const showMarkup = useAppStore((s) => s.showMarkup);
  const showComments = useAppStore((s) => s.showComments);
  const final = useAppStore((s) => s.final);
  const restrictReadOnly = useAppStore((s) => s.restrictReadOnly);
  const viewMode = useAppStore((s) => s.viewMode);
  const showRuler = useAppStore((s) => s.showRuler);
  const showGridlines = useAppStore((s) => s.showGridlines);
  const showNavPane = useAppStore((s) => s.showNavPane);
  const splitView = useAppStore((s) => s.splitView);
  const pageColor = useAppStore((s) => s.pageColor);
  const watermark = useAppStore((s) => s.watermark);
  const pageBorder = useAppStore((s) => s.pageBorder);
  const themeId = useAppStore((s) => s.themeId);
  const outlineActive = useAppStore((s) => s.outlineActive);
  const showInk = useAppStore((s) => s.showInk);

  const theme = getTheme(themeId);

  const locked = final || restrictReadOnly || viewMode === "read";

  const [ctxMenu, setCtxMenu] = useState<null | { x: number; y: number }>(null);
  const openContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (editor) editor.setEditable(!locked);
  }, [editor, locked]);

  const size = PAGE_SIZES[pageSizeId];
  const landscape = orientation === "landscape";
  const pageWidth = landscape ? size.height : size.width;
  const pageHeight = landscape ? size.width : size.height;
  const pagePx = pageWidth * 96 * (zoom / 100);

  const skinClasses = [
    "brit-page",
    viewMode === "web" ? "brit-web-layout" : "",
    viewMode === "draft" ? "brit-draft-layout" : "",
    columns !== "one" && viewMode !== "draft" ? `brit-cols-${columns}` : "",
    lineNumbers === "continuous" ? "brit-line-numbers" : "",
    hyphenation === "automatic" ? "brit-hyphens" : "",
    showMarkup === "hidden" ? "brit-markup-hidden" : "",
    showMarkup === "original" ? "brit-markup-original" : "",
    showComments ? "" : "brit-comments-off",
    showGridlines ? "brit-gridlines" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const isPaged = viewMode === "print";
  const borderStyle = pageBorder ? PAGE_BORDERS[pageBorder] : null;

  const pageEl = () => (
    <div
      className={`${isPaged ? "relative shrink-0 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_6px_24px_rgba(0,0,0,0.18)]" : "shadow-none"} transition-[width] duration-150`}
      style={{
        width: isPaged ? `calc(${pageWidth}in * ${zoom / 100})` : "100%",
        background: pageColor,
        ...(borderStyle ? { borderTop: borderStyle, borderBottom: borderStyle } : {}),
      }}
    >
      {showRuler && isPaged && (
        <div className="px-6" style={{ maxWidth: `calc(${pageWidth}in * ${zoom / 100})` }}>
          <Ruler widthPx={pagePx} />
        </div>
      )}
      {isPaged && (
        <div className="px-6 py-2" style={{ maxWidth: `calc(${pageWidth}in * ${zoom / 100})` }}>
          <HfZone side="Header" active={showHeader} text={headerText} onInput={setHeaderText} />
        </div>
      )}
      <div
        className={skinClasses}
        style={{
          ...themeVars(theme),
          minHeight: isPaged
            ? `calc(${pageHeight}in * ${zoom / 100})`
            : undefined,
          padding: isPaged
            ? `calc(${margins.top}in * ${zoom / 100}) calc(${margins.right}in * ${zoom / 100}) calc(${margins.bottom}in * ${zoom / 100}) calc(${margins.left}in * ${zoom / 100})`
            : "16px 48px 16px 24px",
          background: viewMode === "draft" || viewMode === "web" ? pageColor || "#ffffff" : undefined,
        }}
      >
        <div className="relative" onContextMenu={openContextMenu}>
          <EditorContent editor={editor} />
          {(showInk || (viewMode === "print" && showInk)) && <InkCanvas />}
        </div>
        {watermark && (
          <div
            data-testid="watermark"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <span
              className="select-none text-[96px] font-black uppercase tracking-[0.2em]"
              style={{ color: "rgba(120,130,145,0.16)", transform: "rotate(-32deg)" }}
            >
              {watermark}
            </span>
          </div>
        )}
      </div>
      {isPaged && (
        <div className="px-6 py-2" style={{ maxWidth: `calc(${pageWidth}in * ${zoom / 100})` }}>
          <HfZone side="Footer" active={showFooter} text={footerText} onInput={setFooterText} />
        </div>
      )}
    </div>
  );

  const surface = (key: string) => (
    <div
      key={key}
      className={`relative flex h-full min-h-0 items-start justify-center overflow-auto ${viewMode === "web" ? "bg-gray-200" : "bg-[#e4e6e8]"} p-4 sm:p-8`}
      data-testid="word-editor"
    >
      {key === "main" && <FindReplacePanel />}
      {key === "main" && <ReviewingPane />}
      {key === "main" && <ReviewDock />}
      {key === "main" && <ReferenceDock />}
      {(final || restrictReadOnly) && key === "main" && (
        <div className="fixed left-1/2 top-[110px] z-40 -translate-x-1/2 rounded-full bg-[#4a5a6b] px-4 py-1.5 text-[12px] font-semibold text-white shadow-lg">
          {final ? "Marked as Final — editing is disabled" : "Restrict Editing — document is read-only"}
        </div>
      )}
      {isPaged && key === "main" && showRuler && false}
      {pageEl()}
      <div className="pointer-events-none fixed bottom-3 right-4 z-30 text-[12px] text-[#6b6b6b]">
        {isPaged ? `Zoom ${zoom}%` : viewMode === "web" ? "Web layout" : "Draft layout"}
      </div>
    </div>
  );

  const body = splitView ? (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1">{surface("main")}</div>
      <div className="h-8 shrink-0 border-y border-[#c8c8c8] bg-[#eef1f5] px-3 pt-1.5 text-[11px] font-semibold text-[#5b5b5b]">
        Split view — second window
      </div>
      <div className="min-h-0 flex-1">{surface("split")}</div>
    </div>
  ) : (
    surface("main")
  );

  return (
    <div className="flex h-full min-h-0">
      {showNavPane && <NavPane />}
      {outlineActive && viewMode === "outline" && <OutlinePane />}
      <div className="min-w-0 flex-1">{body}</div>
      {ctxMenu && (
        <EditorContextMenu x={ctxMenu.x} y={ctxMenu.y} onClose={() => setCtxMenu(null)} />
      )}
    </div>
  );
}