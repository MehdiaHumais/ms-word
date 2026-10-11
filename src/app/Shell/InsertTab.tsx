import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import type { Editor } from "@tiptap/core";
import { useAppStore } from "../../stores/appStore";
import {
  IconBlankPage,
  IconChart,
  IconCoverPage,
  IconDateTime,
  IconDropCap,
  IconEquation,
  IconFooter,
  IconGallery,
  IconHeader,
  IconIconGrid,
  IconImage,
  IconModel3D,
  IconObject,
  IconPageBreak,
  IconPageNumber,
  IconQuickParts,
  IconScreenshot,
  IconShapes,
  IconSignature,
  IconSmartArt,
  IconSymbol,
  IconTable,
  IconTextBox,
  IconWordArt,
} from "./icons";

const btnBase =
  "relative flex items-center justify-center rounded-[3px] text-[#474747] transition-colors duration-75 ";
const btnHover = "border border-transparent hover:border-[#c1d3ec] hover:bg-[#eaf1fa]";
const btnActive = "border border-[#9fc4ec] bg-[#cfe3fb] text-[#1e4a80]";

// ---------- Building blocks ----------

function ToolButton({
  title,
  active,
  onClick,
  children,
  className = "",
}: {
  title: string;
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`${btnBase} cursor-pointer ${active ? btnActive : btnHover} ${className}`}
    >
      {children}
    </button>
  );
}

/** Compact icon+label pill for stacked gallery buttons (Pages / Header & Footer / Symbols). */
function MiniButton({
  title,
  icon,
  onClick,
  active,
}: {
  title: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`${btnBase} ${active ? btnActive : btnHover} h-[24px] w-[52px] cursor-pointer flex-col gap-[2px]`}
    >
      {icon}
      <span className="max-w-full truncate text-[8px] leading-none">{title.split(" ")[0]}</span>
    </button>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex h-[104px] flex-col items-center justify-between border-r border-[#e0e0e0] px-2 py-1">
      <div className="flex flex-1 flex-col items-center justify-center">{children}</div>
      <span className="mt-0.5 text-[9px] leading-none text-[#5b5b5b]">{title}</span>
    </div>
  );
}

/** Generic dropdown popover opened from a trigger button. */
function Popover({
  open,
  onClose,
  header,
  children,
  align = "left-0",
}: {
  open: boolean;
  onClose: () => void;
  header?: string;
  children: ReactNode;
  align?: string;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div
        className={`absolute top-full z-20 mt-1 w-max rounded border border-[#c8c8c8] bg-white p-1 shadow-[0_4px_12px_rgba(0,0,0,0.18)] ${align}`}
      >
        {header && <div className="mb-1 px-1 text-[11px] font-medium text-[#333]">{header}</div>}
        {children}
      </div>
    </>
  );
}

// ---------- SVG factories ----------

/** Encodes an SVG document as a robust base64 data URL for use in <img>. */
function svgUrl(svg: string): string {
  const b64 = btoa(
    // eslint-disable-next-line no-control-regex
    svg.replace(/[^\x00-\x7F]/g, (m) => {
      // keep non-ASCII text renderable by encoding through UTF-8
      return unescape(encodeURIComponent(m)) as unknown as string;
    }),
  );
  return `data:image/svg+xml;base64,${b64}`;
}

function thumbSvg(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">${body}</svg>`;
}

const SHAPE_ICON = "h-[16px] w-[16px]";

const SHAPES = [
  { label: "Rectangle", body: `<rect x="5" y="20" width="90" height="60" rx="4" fill="#4472c4"/>` },
  { label: "Rounded rectangle", body: `<rect x="5" y="20" width="90" height="60" rx="24" fill="#4472c4"/>` },
  { label: "Ellipse", body: `<ellipse cx="50" cy="50" rx="44" ry="30" fill="#4472c4"/>` },
  { label: "Circle", body: `<circle cx="50" cy="50" r="34" fill="#4472c4"/>` },
  { label: "Triangle", body: `<polygon points="50,8 92,88 8,88" fill="#4472c4"/>` },
  { label: "Diamond", body: `<polygon points="50,6 94,50 50,94 6,50" fill="#4472c4"/>` },
  { label: "Star", body: `<polygon points="50,5 62,37 96,37 69,57 79,91 50,71 21,91 31,57 4,37 38,37" fill="#4472c4"/>` },
  { label: "Heart", body: `<path d="M50 88C20 70 8 54 8 38a22 22 0 0 1 42-14 22 22 0 0 1 42 14c0 16-12 32-42 50z" fill="#d1495b" transform="scale(0.94) translate(3 1)"/>` },
  { label: "Right arrow", body: `<path d="M10 38h50l-14-16 8 0 18 24-18 24-8 0 14-16H10z" fill="#4472c4"/>` },
  { label: "Line", body: `<line x1="8" y1="80" x2="92" y2="20" stroke="#4472c4" stroke-width="5" stroke-linecap="round"/>` },
] as const;

const ICONS = [
  { label: "Star", body: `<polygon points="50,8 62,38 94,38 68,58 78,90 50,70 22,90 32,58 6,38 38,38" fill="none" stroke="#333" stroke-width="5" stroke-linejoin="round"/>` },
  { label: "Heart", body: `<path d="M50 88C20 70 8 54 8 38a22 22 0 0 1 42-14 22 22 0 0 1 42 14c0 16-12 32-42 50z" fill="none" stroke="#333" stroke-width="5" transform="scale(0.94) translate(3 1)"/>` },
  { label: "Home", body: `<path d="M8 46L50 10l42 36M20 40v48h60V40" fill="none" stroke="#333" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 88V58h16v30" fill="none" stroke="#333" stroke-width="5"/>` },
  { label: "Cloud", body: `<path d="M28 78a20 20 0 0 1-2-40 26 26 0 0 1 50-6 18 18 0 0 1-4 46z" fill="none" stroke="#333" stroke-width="5" stroke-linejoin="round"/>` },
  { label: "Sun", body: `<circle cx="50" cy="50" r="20" fill="none" stroke="#333" stroke-width="5"/><path d="M50 8v10M50 82v10M8 50h10M82 50h10M20 20l7 7M73 73l7 7M20 80l7-7M73 27l7-7" stroke="#333" stroke-width="5" stroke-linecap="round"/>` },
  { label: "Flag", body: `<path d="M16 8v88M16 12h56l-10 16 10 16H16" fill="none" stroke="#333" stroke-width="5" stroke-linejoin="round"/>` },
] as const;

const SMARTART = [
  {
    label: "Process",
    body: `<g><rect x="2" y="40" width="30" height="22" fill="#4472c4"/><polygon points="34,40 44,51 34,62" fill="#8faadc"/><rect x="46" y="40" width="30" height="22" fill="#4472c4"/><polygon points="78,40 88,51 78,62" fill="#8faadc"/><rect x="90" y="40" width="8" height="22" fill="#4472c4"/></g>`,
  },
  {
    label: "Cycle",
    body: `<g fill="none" stroke-width="14"><circle cx="50" cy="50" r="26" stroke="#4472c4" stroke-dasharray="60 110" stroke-linecap="round"/><circle cx="50" cy="50" r="26" stroke="#8faadc" stroke-dasharray="60 110" stroke-dashoffset="40"/><circle cx="50" cy="50" r="26" stroke="#c5cfeb" stroke-dasharray="60 110" stroke-dashoffset="-80"/><circle cx="50" cy="50" r="7" fill="#2e4a8f"/></g>`,
  },
  {
    label: "Hierarchy",
    body: `<g><rect x="32" y="4" width="36" height="18" rx="2" fill="#4472c4"/><rect x="4" y="40" width="34" height="18" rx="2" fill="#8faadc"/><rect x="62" y="40" width="34" height="18" rx="2" fill="#8faadc"/><rect x="33" y="76" width="34" height="18" rx="2" fill="#c5cfeb"/><path d="M50 22v18M21 40v18M79 40v18M50 58v18" stroke="#7f7f7f" stroke-width="3" fill="none"/></g>`,
  },
  {
    label: "Matrix",
    body: `<g><rect x="4" y="4" width="40" height="40" fill="#c5cfeb"/><rect x="56" y="4" width="40" height="40" fill="#8faadc"/><rect x="4" y="56" width="40" height="40" fill="#8faadc"/><rect x="56" y="56" width="40" height="40" fill="#4472c4"/></g>`,
  },
] as const;

function barChartSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120">
    <rect width="200" height="120" fill="#ffffff"/>
    <g stroke="#cccccc" stroke-width="1"><line x1="20" y1="12" x2="20" y2="104"/><line x1="20" y1="104" x2="186" y2="104"/></g>
    <rect x="30" y="52" width="26" height="52" fill="#4472c4"/>
    <rect x="62" y="34" width="26" height="70" fill="#5b9bd5"/>
    <rect x="94" y="20" width="26" height="84" fill="#8faadc"/>
    <rect x="126" y="42" width="26" height="62" fill="#9dc3e6"/>
    <rect x="158" y="24" width="26" height="80" fill="#c5cfeb"/>
  </svg>`;
}

function lineChartSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120">
    <rect width="200" height="120" fill="#ffffff"/>
    <g stroke="#cccccc" stroke-width="1"><line x1="20" y1="12" x2="20" y2="104"/><line x1="20" y1="104" x2="186" y2="104"/></g>
    <g fill="none" stroke="#4472c4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M26 92 L62 70 L98 46 L134 58 L174 22"/>
    </g>
    <g fill="#4472c4"><circle cx="26" cy="92" r="4"/><circle cx="62" cy="70" r="4"/><circle cx="98" cy="46" r="4"/><circle cx="134" cy="58" r="4"/><circle cx="174" cy="22" r="4"/></g>
  </svg>`;
}

function pieChartSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120">
    <rect width="200" height="120" fill="#ffffff"/>
    <path d="M88 60 A42 42 0 0 1 60 27 L88 60 Z" fill="#4472c4"/>
    <path d="M88 60 A42 42 0 0 1 130 60 L88 60 Z" fill="#5b9bd5"/>
    <path d="M88 60 A42 42 0 0 1 60 93 L88 60 Z" fill="#8faadc"/>
    <path d="M88 60 A42 42 0 0 0 130 60 L88 60 Z" fill="#9dc3e6"/>
    <path d="M88 60 A42 42 0 0 0 60 27 L88 60 Z" fill="#c5cfeb"/>
    <circle cx="88" cy="60" r="16" fill="#f5f5f5"/>
  </svg>`;
}

const SIGNATURE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80"><rect width="320" height="80" fill="#ffffff"/><line x1="8" y1="70" x2="312" y2="70" stroke="#1a1a1a" stroke-width="2"/><path d="M30 40 C50 20 70 16 84 26 C100 40 92 44 108 38 C122 30 138 56 156 42 C172 30 170 24 186 30 C200 36 194 48 210 40" fill="none" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/><g stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"><line x1="150" y1="46" x2="150" y2="58"/><line x1="144" y1="52" x2="156" y2="52"/></g><text x="244" y="60" font-family="Calibri" font-size="16" fill="#444" text-anchor="middle">Date</text></svg>`;

const OBJECT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#f5f7fa"/><rect x="26" y="18" width="68" height="84" rx="3" fill="#fff" stroke="#c8c8c8" stroke-width="2"/><rect x="26" y="34" width="68" height="10" fill="#e8eef7"/><rect x="36" y="52" width="48" height="28" rx="2" fill="#fff" stroke="#9dc3e6" stroke-width="2"/><line x1="30" y1="80" x2="90" y2="80" stroke="gray"/><line x1="30" y1="88" x2="90" y2="88" stroke="gray"/></svg>`;

const MODEL3D_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#ffffff"/><g fill="none" stroke-width="3" stroke-linejoin="round"><path d="M60 16 L100 36 L60 56 L20 36 Z" fill="#c5cfeb" stroke="#4472c4"/><path d="M20 36 L20 84 L60 104 L60 56 Z" fill="#9dc3e6" stroke="#4472c4"/><path d="M60 56 L60 104 L100 84 L100 36 Z" fill="#8faadc" stroke="#4472c4"/></g></svg>`;

// ---------- Insert tab ----------

export function InsertTab({ editor }: { editor: Editor }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tableOpen, setTableOpen] = useState(false);
  const [shapesOpen, setShapesOpen] = useState(false);
  const [iconsOpen, setIconsOpen] = useState(false);
  const [smartArtOpen, setSmartArtOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [wordArtOpen, setWordArtOpen] = useState(false);
  const [quickPartsOpen, setQuickPartsOpen] = useState(false);
  const [symbolOpen, setSymbolOpen] = useState(false);
  const [dateTimeOpen, setDateTimeOpen] = useState(false);

  const setHeaderOpen = useAppStore((s) => s.setHeaderOpen);
  const setFooterOpen = useAppStore((s) => s.setFooterOpen);
  const showHeader = useAppStore((s) => s.showHeader);
  const showFooter = useAppStore((s) => s.showFooter);

  const closeAll = () => {
    setTableOpen(false);
    setShapesOpen(false);
    setIconsOpen(false);
    setSmartArtOpen(false);
    setChartOpen(false);
    setWordArtOpen(false);
    setQuickPartsOpen(false);
    setSymbolOpen(false);
    setDateTimeOpen(false);
  };

  const insertImageUrl = (src: string, alt = "") => {
    editor.chain().focus().setImage({ src, alt }).run();
  };

  const insertOnlinePicture = () => {
    const url = window.prompt("Insert image from URL", "https://");
    if (url) insertImageUrl(url);
  };

  const insertImageFromFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => insertImageUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  /** Inserts a real snapshot of the current page (styling included) as an image. */
  const screenshotPage = async () => {
    const el = document.querySelector<HTMLElement>(".brit-page");
    if (!el) return;
    try {
      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.margin = "0";
      clone.style.transform = "";
      clone.style.width = `${el.offsetWidth}px`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${el.offsetWidth}" height="${el.offsetHeight}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(clone)}</foreignObject></svg>`;
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("render failed"));
      });
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = el.offsetWidth * scale;
      canvas.height = el.offsetHeight * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas");
      ctx.scale(scale, scale);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, el.offsetWidth, el.offsetHeight);
      ctx.drawImage(img, 0, 0, el.offsetWidth, el.offsetHeight);
      insertImageUrl(canvas.toDataURL("image/png"), "Page screenshot");
    } catch {
      window.alert("Could not capture the page in this browser.");
    }
  };

  const insertTable = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: cols > 1 }).run();
    closeAll();
  };

  const insertCoverPage = () => {
    editor.chain().focus().insertContentAt(editor.state.doc.content.size, [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Document Title" }] },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Subtitle" }],
        marks: [{ type: "textStyle", attrs: { color: "#5b5b5b" } }],
      },
      { type: "pageBreak" },
      { type: "paragraph" },
    ]).run();
  };

  const insertBlankPage = () => {
    editor.chain().focus().insertContent([{ type: "paragraph" }, { type: "pageBreak" }, { type: "paragraph" }]).run();
  };

  const insertDateTime = (label: string, value: string) => {
    editor.chain().focus().insertContent(value).run();
    closeAll();
    void label;
  };

  const insertQuickPart = (label: string, value: string) => {
    editor.chain().focus().insertContent([
      {
        type: "paragraph",
        content: [
          { type: "text", text: label, marks: [{ type: "bold" }] },
          { type: "text", text: ` ${value}` },
        ],
      },
    ]).run();
    closeAll();
  };

  const insertObject = () => {
    editor.chain().focus().setImage({ src: svgUrl(OBJECT_SVG), alt: "Embedded object" }).run();
    closeAll();
  };

  const insertSymbol = (ch: string) => {
    editor.chain().focus().insertContent(ch).run();
    closeAll();
  };

  const insertShape = (body: string) => {
    editor.chain().focus().setImage({ src: svgUrl(thumbSvg(body)), alt: "Shape" }).run();
    closeAll();
  };

  const insertIcon = (body: string) => {
    editor.chain().focus().setImage({ src: svgUrl(thumbSvg(body)), alt: "Icon" }).run();
    closeAll();
  };

  const insertSmartArt = (body: string) => {
    editor.chain().focus().setImage({ src: svgUrl(thumbSvg(body)), alt: "SmartArt" }).run();
    closeAll();
  };

  const insertChart = (svg: string) => {
    editor.chain().focus().setImage({ src: svgUrl(svg), alt: "Chart" }).run();
    closeAll();
  };

  const applyWordArt = (style: string) => {
    const { from, to } = editor.state.selection;
    if (from === to) {
      editor.chain().focus().insertContent(
        [
          {
            type: "text",
            text: "Your text here",
            marks: [{ type: "wordArt", attrs: { style } }],
          },
        ],
      ).run();
    } else {
      editor.chain().focus().setWordArt(style).run();
    }
    closeAll();
  };

  const now = new Date();
  const dateTimeFormats = [
    { label: now.toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" }), value: now.toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" }) },
    { label: now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }), value: now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) },
    { label: now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), value: now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
    { label: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), value: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) },
    { label: now.toLocaleTimeString("en-US", { hour12: false }), value: now.toLocaleTimeString("en-US", { hour12: false }) },
    { label: now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), value: now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) },
  ];

  const symbols = ["©", "®", "™", "§", "¶", "•", "→", "←", "↑", "↓", "∞", "√", "±", "≤", "≥", "∑", "π", "€", "£", "¥", "°", "†", "‡", "…", "÷", "×", "≈", "≠"];

  const wordArtStyles = ["rainbow", "blue", "orange", "green", "outline"];

  return (
    <div className="flex h-[104px] select-none items-stretch bg-[#f3f3f3]">
      {/* Pages */}
      <Group title="Pages">
        <MiniButton title="Cover Page" icon={<IconCoverPage className={SHAPE_ICON} />} onClick={insertCoverPage} />
        <MiniButton title="Blank Page" icon={<IconBlankPage className={SHAPE_ICON} />} onClick={insertBlankPage} />
        <MiniButton title="Page Break" icon={<IconPageBreak className={SHAPE_ICON} />} onClick={() => editor.chain().focus().insertPageBreak().run()} />
      </Group>

      {/* Tables */}
      <Group title="Tables">
        <div className="relative">
          <ToolButton
            title="Insert Table"
            active={tableOpen}
            onClick={() => {
              closeAll();
              setTableOpen(!tableOpen);
            }}
            className="h-[30px] w-[52px] flex-col gap-0.5"
          >
            <IconTable className={SHAPE_ICON} />
            <span className="text-[8px] leading-none">Table</span>
          </ToolButton>
          <Popover open={tableOpen} onClose={closeAll} header="Insert Table" align="left-0">
            {[3, 4, 5, 6, 8].map((cols) => (
              <div key={cols} className="flex">
                {Array.from({ length: cols }).map((_, r) => (
                  <button
                    key={r}
                    title={`Insert table (${r + 1} \u00d7 ${cols})`}
                    aria-label={`Insert table ${r + 1} by ${cols}`}
                    onClick={() => insertTable(r + 1, cols)}
                    className="m-px h-3 w-3 cursor-pointer rounded-[1px] border border-[#9db7d6] bg-white hover:bg-[#4472c4]"
                  />
                ))}
              </div>
            ))}
          </Popover>
        </div>
      </Group>

      {/* Illustrations */}
      <Group title="Illustrations">
        <div className="flex items-center gap-0.5">
          <ToolButton title="Pictures (from file)" onClick={() => fileRef.current?.click()} className="h-[28px] w-[32px]">
            <IconImage className={SHAPE_ICON} />
          </ToolButton>
          <ToolButton title="Online Pictures" onClick={insertOnlinePicture} className="h-[28px] w-[32px]">
            <IconGallery className={SHAPE_ICON} />
          </ToolButton>
          <div className="relative">
            <ToolButton title="Shapes" active={shapesOpen} onClick={() => { closeAll(); setShapesOpen(!shapesOpen); }} className="h-[28px] w-[32px]">
              <IconShapes className={SHAPE_ICON} />
            </ToolButton>
            <Popover open={shapesOpen} onClose={closeAll} header="Insert Shapes">
              <div className="grid w-[190px] grid-cols-5 gap-0.5">
                {SHAPES.map((s) => (
                  <button
                    key={s.label}
                    title={s.label}
                    aria-label={`Insert ${s.label}`}
                    onClick={() => insertShape(s.body)}
                    className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded border hover:border-[#c1d3ec] hover:bg-[#eaf1fa]"
                  >
                    <img src={svgUrl(thumbSvg(s.body))} alt={s.label} className="h-[26px] w-[26px]" />
                  </button>
                ))}
              </div>
            </Popover>
          </div>
          <div className="relative">
            <ToolButton title="Icons" active={iconsOpen} onClick={() => { closeAll(); setIconsOpen(!iconsOpen); }} className="h-[28px] w-[32px]">
              <IconIconGrid className={SHAPE_ICON} />
            </ToolButton>
            <Popover open={iconsOpen} onClose={closeAll} header="Insert Icons">
              <div className="grid w-[190px] grid-cols-5 gap-0.5">
                {ICONS.map((s) => (
                  <button
                    key={s.label}
                    title={s.label}
                    aria-label={`Insert icon ${s.label}`}
                    onClick={() => insertIcon(s.body)}
                    className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded border hover:border-[#c1d3ec] hover:bg-[#eaf1fa]"
                  >
                    <img src={svgUrl(thumbSvg(s.body))} alt={s.label} className="h-[26px] w-[26px]" />
                  </button>
                ))}
              </div>
            </Popover>
          </div>
        </div>
        <div className="mt-0.5 flex items-center gap-0.5">
          <ToolButton title="3D Models" onClick={() => { closeAll(); insertIcon(MODEL3D_SVG); }} className="h-[28px] w-[32px]">
            <IconModel3D className={SHAPE_ICON} />
          </ToolButton>
          <div className="relative">
            <ToolButton title="SmartArt" active={smartArtOpen} onClick={() => { closeAll(); setSmartArtOpen(!smartArtOpen); }} className="h-[28px] w-[32px]">
              <IconSmartArt className={SHAPE_ICON} />
            </ToolButton>
            <Popover open={smartArtOpen} onClose={closeAll} header="Choose a SmartArt Graphic">
              <div className="flex gap-0.5">
                {SMARTART.map((s) => (
                  <button
                    key={s.label}
                    title={s.label}
                    aria-label={`Insert SmartArt ${s.label}`}
                    onClick={() => insertSmartArt(s.body)}
                    className="flex h-[64px] w-[80px] cursor-pointer flex-col items-center justify-center gap-1 rounded border hover:border-[#c1d3ec] hover:bg-[#eaf1fa]"
                  >
                    <img src={svgUrl(thumbSvg(s.body))} alt={s.label} className="h-[34px] w-[34px]" />
                    <span className="text-[9px] leading-none text-[#444]">{s.label}</span>
                  </button>
                ))}
              </div>
            </Popover>
          </div>
          <div className="relative">
            <ToolButton title="Chart" active={chartOpen} onClick={() => { closeAll(); setChartOpen(!chartOpen); }} className="h-[28px] w-[32px]">
              <IconChart className={SHAPE_ICON} />
            </ToolButton>
            <Popover open={chartOpen} onClose={closeAll} header="Insert Chart">
              <div className="flex gap-0.5">
                {[
                  { label: "Column", svg: barChartSvg() },
                  { label: "Line", svg: lineChartSvg() },
                  { label: "Pie", svg: pieChartSvg() },
                ].map((c) => (
                  <button
                    key={c.label}
                    title={c.label}
                    aria-label={`Insert ${c.label} chart`}
                    onClick={() => insertChart(c.svg)}
                    className="flex h-[52px] w-[84px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded border hover:border-[#c1d3ec] hover:bg-[#eaf1fa]"
                  >
                    <img src={svgUrl(c.svg)} alt={c.label} className="h-[34px] w-[60px]" />
                    <span className="text-[9px] leading-none text-[#444]">{c.label}</span>
                  </button>
                ))}
              </div>
            </Popover>
          </div>
          <ToolButton title="Screenshot" onClick={screenshotPage} className="h-[28px] w-[32px]">
            <IconScreenshot className={SHAPE_ICON} />
          </ToolButton>
        </div>
      </Group>

      {/* Header & Footer */}
      <Group title="Header & Footer">
        <MiniButton title="Header" icon={<IconHeader className={SHAPE_ICON} />} active={showHeader} onClick={() => setHeaderOpen(!showHeader)} />
        <MiniButton title="Footer" icon={<IconFooter className={SHAPE_ICON} />} active={showFooter} onClick={() => setFooterOpen(!showFooter)} />
        <MiniButton title="Page Number" icon={<IconPageNumber className={SHAPE_ICON} />} onClick={() => editor.chain().focus().insertPageNumber().run()} />
      </Group>

      {/* Text */}
      <Group title="Text">
        <ToolButton
          title="Text Box"
          onClick={() => editor.chain().focus().insertTextBox().run()}
          className="h-[24px] w-[52px] flex-col gap-[2px]"
        >
          <IconTextBox className={SHAPE_ICON} />
          <span className="text-[8px] leading-none">Text Box</span>
        </ToolButton>
        <div className="mt-[2px] flex items-center gap-0.5">
          <div className="relative">
            <ToolButton title="Quick Parts" active={quickPartsOpen} onClick={() => { closeAll(); setQuickPartsOpen(!quickPartsOpen); }} className="h-[24px] w-[32px]">
              <IconQuickParts className={SHAPE_ICON} />
            </ToolButton>
            <Popover open={quickPartsOpen} onClose={closeAll} header="Document Properties" align="left-0">
              {[
                { label: "Title", value: "Untitled document" },
                { label: "Author", value: "BritDocs User" },
                { label: "Created", value: now.toLocaleDateString() },
                { label: "Last modified", value: now.toLocaleDateString() },
                { label: "File name", value: "Document1" },
              ].map((p) => (
                <button
                  key={p.label}
                  title={`Insert Quick Part: ${p.label}`}
                  onClick={() => insertQuickPart(p.label, p.value)}
                  className="flex w-full cursor-pointer items-center justify-between gap-6 rounded px-2 py-1 text-left text-[11px] text-[#333] hover:bg-[#eaf1fa]"
                >
                  <span>{p.label}</span>
                  <span className="text-[#888]">{p.value}</span>
                </button>
              ))}
            </Popover>
          </div>
          <div className="relative">
            <ToolButton title="WordArt" active={wordArtOpen} onClick={() => { closeAll(); setWordArtOpen(!wordArtOpen); }} className="h-[24px] w-[32px]">
              <IconWordArt className={SHAPE_ICON} />
            </ToolButton>
            <Popover open={wordArtOpen} onClose={closeAll} header="WordArt" align="left-0">
              <div className="flex gap-0.5">
                {wordArtStyles.map((style) => (
                  <button
                    key={style}
                    title={`WordArt style ${style}`}
                    aria-label={`Apply WordArt style ${style}`}
                    onClick={() => applyWordArt(style)}
                    className="flex h-[40px] w-[64px] cursor-pointer flex-col items-center justify-center rounded border hover:border-[#c1d3ec] hover:bg-[#eaf1fa]"
                  >
                    <span className={`brit-word-art brit-word-art-${style} text-[20px] font-bold leading-6`}>Aa</span>
                  </button>
                ))}
              </div>
            </Popover>
          </div>
        </div>
        <div className="mt-[2px] flex items-center gap-0.5">
          <ToolButton title="Drop Cap" onClick={() => editor.chain().focus().toggleDropCap().run()} className="h-[24px] w-[32px]">
            <IconDropCap className={SHAPE_ICON} />
          </ToolButton>
          <ToolButton title="Signature Line" onClick={() => insertChart(SIGNATURE_SVG)} className="h-[24px] w-[32px]">
            <IconSignature className={SHAPE_ICON} />
          </ToolButton>
        </div>
      </Group>

      {/* Symbols */}
      <Group title="Symbols">
        <div className="grid grid-cols-2 gap-[2px]">
          <div className="relative">
            <ToolButton
              title="Equation"
              onClick={() => editor.chain().focus().insertEquation().run()}
              className="h-[24px] w-[52px] flex-col gap-[2px]"
            >
              <IconEquation className={SHAPE_ICON} />
              <span className="text-[8px] leading-none">Equation</span>
            </ToolButton>
          </div>
          <div className="relative">
            <ToolButton
              title="Symbol"
              active={symbolOpen}
              onClick={() => { closeAll(); setSymbolOpen(!symbolOpen); }}
              className="h-[24px] w-[52px] flex-col gap-[2px]"
            >
              <IconSymbol className={SHAPE_ICON} />
              <span className="text-[8px] leading-none">Symbol</span>
            </ToolButton>
            <Popover open={symbolOpen} onClose={closeAll} header="Symbol" align="right-0">
              <div className="grid w-[220px] grid-cols-8 gap-0.5">
                {symbols.map((ch) => (
                  <button
                    key={ch}
                    title={`Insert ${ch}`}
                    aria-label={`Insert symbol ${ch}`}
                    onClick={() => insertSymbol(ch)}
                    className="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded border text-[15px] text-[#333] hover:border-[#c1d3ec] hover:bg-[#eaf1fa]"
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </Popover>
          </div>
          <div className="relative">
            <ToolButton
              title="Date & Time"
              active={dateTimeOpen}
              onClick={() => { closeAll(); setDateTimeOpen(!dateTimeOpen); }}
              className="h-[24px] w-[52px] flex-col gap-[2px]"
            >
              <IconDateTime className={SHAPE_ICON} />
              <span className="text-[8px] leading-none">Date</span>
            </ToolButton>
            <Popover open={dateTimeOpen} onClose={closeAll} header="Date & Time formats" align="left-0">
              {dateTimeFormats.map((f) => (
                <button
                  key={f.label}
                  title={`Insert ${f.label}`}
                  onClick={() => insertDateTime(f.label, f.value)}
                  className="flex w-full cursor-pointer items-center justify-between gap-6 rounded px-2 py-1 text-left text-[11px] text-[#333] hover:bg-[#eaf1fa]"
                >
                  <span>{f.label}</span>
                </button>
              ))}
            </Popover>
          </div>
          <div className="relative">
            <ToolButton
              title="Object"
              onClick={insertObject}
              className="h-[24px] w-[52px] flex-col gap-[2px]"
            >
              <IconObject className={SHAPE_ICON} />
              <span className="text-[8px] leading-none">Object</span>
            </ToolButton>
          </div>
        </div>
      </Group>

      <input ref={fileRef} type="file" accept="image/*" onChange={insertImageFromFiles} hidden />
    </div>
  );
}