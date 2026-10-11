import { useState } from "react";
import { useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import { ptToPx } from "../Editor/editorConfig";
import { useAppStore } from "../../stores/appStore";
import {
  IconAlignCenter,
  IconAlignJustify,
  IconAlignLeft,
  IconAlignRight,
  IconBold,
  IconBorders,
  IconChevronDown,
  IconClearFormat,
  IconCopy,
  IconFormatPainter,
  IconGrowFont,
  IconHighlight,
  IconIndentDecrease,
  IconIndentIncrease,
  IconItalic,
  IconListBullet,
  IconListOrdered,
  IconMultilevel,
  IconPaste,
  IconReplace,
  IconScissors,
  IconSearch,
  IconSelect,
  IconShrinkFont,
  IconStrike,
  IconSubscript,
  IconSuperscript,
  IconTextColor,
  IconUnderline,
} from "./icons";

const FONTS = [
  "Arial",
  "Calibri",
  "Cambria",
  "Consolas",
  "Courier New",
  "Georgia",
  "Segoe UI",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72, 96];

const LINE_HEIGHTS = [
  { value: "default", label: "1.0" },
  { value: "1.15", label: "1.15" },
  { value: "1.5", label: "1.5" },
  { value: "2", label: "2.0" },
];

const BULLET_LIBRARY = [
  { type: "disc", glyph: "\u2022", label: "Bullet" },
  { type: "circle", glyph: "\u25CB", label: "Hollow circle" },
  { type: "square", glyph: "\u25AA", label: "Square" },
];

const NUMBER_LIBRARY = [
  { type: "1", glyph: "1.", label: "1. 2. 3." },
  { type: "A", glyph: "A.", label: "A. B. C." },
  { type: "a", glyph: "a.", label: "a. b. c." },
  { type: "I", glyph: "I.", label: "I. II. III." },
  { type: "i", glyph: "i.", label: "i. ii. iii." },
];

const HIGHLIGHT_COLORS = [
  "#FFFF00",
  "#00FF00",
  "#00FFFF",
  "#FF00FF",
  "#0000FF",
  "#FF0000",
  "#000080",
  "#008080",
  "#008000",
  "#800080",
  "#800000",
  "#808000",
];

const TEXT_COLORS = [
  "#000000",
  "#C00000",
  "#FF0000",
  "#FFC000",
  "#FFFF00",
  "#92D050",
  "#00B050",
  "#00B0F0",
  "#0070C0",
  "#002060",
  "#7030A0",
];

const STYLES = [
  {
    label: "Normal",
    preview: "font-normal",
    exec: (e: Editor) => e.chain().focus().setParagraph().unsetAllMarks().run(),
    active: (e: Editor) => e.isActive("paragraph") && !e.isActive("heading"),
  },
  {
    label: "Heading 1",
    preview: "font-bold text-[15px] text-[#1f4e79]",
    exec: (e: Editor) => e.chain().focus().setHeading({ level: 1 }).run(),
    active: (e: Editor) => e.isActive("heading", { level: 1 }),
  },
  {
    label: "Heading 2",
    preview: "font-bold text-[13px] text-[#2e74b5]",
    exec: (e: Editor) => e.chain().focus().setHeading({ level: 2 }).run(),
    active: (e: Editor) => e.isActive("heading", { level: 2 }),
  },
  {
    label: "Heading 3",
    preview: "font-bold text-[12px] text-[#1f4e79]",
    exec: (e: Editor) => e.chain().focus().setHeading({ level: 3 }).run(),
    active: (e: Editor) => e.isActive("heading", { level: 3 }),
  },
];

// ---------- Shared building blocks ----------

const btnBase =
  "relative flex items-center justify-center rounded-[3px] text-[#474747] transition-colors duration-75 ";

const btnHover =
  "border border-transparent hover:border-[#c1d3ec] hover:bg-[#eaf1fa]";

const btnActive =
  "border border-[#9fc4ec] bg-[#cfe3fb] text-[#1e4a80]";

function ToolButton({
  title,
  active,
  disabled,
  onClick,
  children,
  big,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  big?: boolean;
}) {
  const size = big ? "h-[44px] w-[52px] flex-col gap-1" : "h-[28px] w-[32px]";
  return (
    <button
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`${btnBase} ${size} ${active ? btnActive : btnHover} ${
        disabled ? "cursor-default opacity-35 hover:border-transparent hover:bg-transparent" : "cursor-pointer"
      }`}
    >
      {children}
    </button>
  );
}

function ComboBox({
  title,
  value,
  onChange,
  children,
  selectClass = "",
  arrowClass = "",
}: {
  title: string;
  value: string | number;
  onChange: (v: string) => void;
  children: React.ReactNode;
  selectClass?: string;
  arrowClass?: string;
}) {
  return (
    <div className="flex h-[28px] items-center rounded-[3px] border border-transparent text-[#474747] hover:border-[#c1d3ec] hover:bg-[#eaf1fa]">
      <select
        title={title}
        aria-label={title}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-full appearance-none border-none bg-transparent pl-1.5 text-[13px] text-[#333] focus:outline-none ${selectClass}`}
      >
        {children}
      </select>
      <IconChevronDown className={`shrink-0 ${arrowClass}`} />
    </div>
  );
}

function ListSplitButton({
  title,
  libraryTitle,
  icon,
  active,
  options,
  currentType,
  onToggle,
  onPick,
}: {
  title: string;
  libraryTitle: string;
  icon: React.ReactNode;
  active: boolean;
  options: { type: string; glyph: string; label: string }[];
  currentType: string;
  onToggle: () => void;
  onPick: (type: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-stretch rounded-[3px] border border-transparent hover:border-[#c1d3ec] hover:bg-[#eaf1fa]">
      <button
        title={title}
        aria-label={title}
        onClick={onToggle}
        className={`flex h-[28px] w-[24px] cursor-pointer items-center justify-center rounded-l-[3px] ${
          active ? "bg-[#cfe3fb] text-[#1e4a80]" : ""
        }`}
      >
        {icon}
      </button>
      <span className="my-1 w-px bg-[#d5d5d5]" />
      <button
        title={libraryTitle}
        aria-label={libraryTitle}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-[28px] w-[14px] cursor-pointer items-center justify-center rounded-r-[3px] ${
          open ? "bg-[#cfe3fb] text-[#1e4a80]" : ""
        }`}
      >
        <IconChevronDown className="h-3 w-3 text-[#474747]" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-max rounded border border-[#c8c8c8] bg-white p-1 shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
            <div className="mb-1 px-1 text-[11px] font-medium text-[#333]">{libraryTitle}</div>
            <div className="flex gap-0.5">
              {options.map((o) => (
                <button
                  key={o.type}
                  title={o.label}
                  onClick={() => {
                    onPick(o.type);
                    setOpen(false);
                  }}
                  className={`flex h-[36px] w-[40px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded border text-[#333] hover:border-[#c1d3ec] hover:bg-[#eaf1fa] ${
                    currentType === o.type
                      ? "border-[#9fc4ec] bg-[#cfe3fb]"
                      : "border-transparent"
                  }`}
                >
                  <span className="text-[14px] leading-none">{o.glyph}</span>
                  <span className="text-[9px] leading-none text-[#666]">{o.label.split(" ").pop()}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** A button that opens a popover palette of swatches (e.g. text colour / highlight). */
function ColorPopover({
  title,
  icon,
  current,
  colors,
  onPick,
  onClear,
  clearLabel,
}: {
  title: string;
  icon: React.ReactNode;
  current: string;
  colors: string[];
  onPick: (hex: string) => void;
  onClear: () => void;
  clearLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        title={title}
        aria-label={title}
        onClick={() => setOpen((o) => !o)}
        className={`${btnBase} h-[28px] w-[32px] flex-col ${open ? btnActive : btnHover}`}
      >
        {icon}
        <span
          className="mt-0.5 h-[3px] w-[18px] rounded-[1px]"
          style={{ background: current }}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-max rounded border border-[#c8c8c8] bg-white p-1 shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
            <div className="grid grid-cols-6 gap-0.5">
              {colors.map((c) => (
                <button
                  key={c}
                  title={c}
                  aria-label={c}
                  onClick={() => {
                    onPick(c);
                    setOpen(false);
                  }}
                  className="h-[18px] w-[26px] cursor-pointer rounded-[2px] border border-black/20 hover:border-[#6582b0]"
                  style={{ background: c }}
                />
              ))}
              <label
                title={title + " (custom…)"}
                className="relative flex h-[18px] w-[26px] cursor-pointer items-center justify-center overflow-hidden rounded-[2px] border border-black/20 bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] hover:border-[#6582b0]"
              >
                <input
                  type="color"
                  onChange={(e) => {
                    onPick(e.target.value);
                    setOpen(false);
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>
            <button
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="mt-1 w-full cursor-pointer rounded px-1 py-0.5 text-left text-[11px] text-[#333] hover:bg-[#eaf1fa]"
            >
              {clearLabel}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Snapshot adapter ----------

interface EditorState {
  active: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    subscript: boolean;
    superscript: boolean;
    bulletList: boolean;
    orderedList: boolean;
  };
  listType: "bullet" | "number" | null;
  bulletType: string;
  numberType: string;
  align: "left" | "center" | "right" | "justify" | null;
  fontFamily: string;
  fontSizePt: string;
  highlight: string;
  color: string;
  lineHeight: string;
}

function pxToPt(px: string): string {
  const n = /^\d+(?:\.\d+)?/.exec(px);
  if (!n) return "";
  return String(Math.round(Number(n[0]) * 0.75));
}

function useEditorSnapshot(editor: Editor): EditorState {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      active: {
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        strike: e.isActive("strike"),
        subscript: e.isActive("subscript"),
        superscript: e.isActive("superscript"),
        bulletList: e.isActive("bulletList"),
        orderedList: e.isActive("orderedList"),
      },
      listType: e.isActive("bulletList")
        ? "bullet"
        : e.isActive("orderedList")
          ? "number"
          : null,
      bulletType: e.isActive("bulletList")
        ? ((e.getAttributes("bulletList").type as string) ?? "disc")
        : "disc",
      numberType: e.isActive("orderedList")
        ? ((e.getAttributes("orderedList").type as string) ?? "1")
        : "1",
      align: e.isActive({ textAlign: "left" })
        ? "left"
        : e.isActive({ textAlign: "center" })
          ? "center"
          : e.isActive({ textAlign: "right" })
            ? "right"
            : e.isActive({ textAlign: "justify" })
              ? "justify"
              : null,
      fontFamily: (e.getAttributes("textStyle").fontFamily as string) ?? "",
      fontSizePt: pxToPt((e.getAttributes("textStyle").fontSize as string) ?? ""),
      highlight: (e.getAttributes("highlight").color as string) ?? "",
      color: (e.getAttributes("textStyle").color as string) ?? "#000000",
      lineHeight: (e.getAttributes("paragraph").lineHeight as string) ?? "default",
    }),
  });
}

// ---------- Home tab ----------

export function HomeTab({ editor }: { editor: Editor }) {
  const s = useEditorSnapshot(editor);
  const openFind = useAppStore((st) => st.openFind);
  const selectAll = () => editor.chain().focus().selectAll().run();

  const setFontSizePt = (pt: number) => {
    if (Number.isFinite(pt) && pt > 0) {
      editor.chain().focus().setFontSize(ptToPx(pt)).run();
    } else {
      editor.chain().focus().unsetFontSize().run();
    }
  };

  const activeFontSize = s.fontSizePt ? Number(s.fontSizePt) : 11;

  const applyHighlight = (hex: string) => editor.chain().focus().setHighlight({ color: hex }).run();
  const clearHighlight = () => editor.chain().focus().unsetHighlight().run();
  const applyColor = (hex: string) => editor.chain().focus().setColor(hex).run();
  const clearColor = () => editor.chain().focus().unsetColor().run();

  const setBulletType = (type: string) => {
    if (editor.isActive("bulletList")) {
      editor.chain().focus().updateAttributes("bulletList", { type }).run();
    } else if (editor.isActive("orderedList")) {
      editor.chain().focus().toggleOrderedList().toggleBulletList().updateAttributes("bulletList", { type }).run();
    } else {
      editor.chain().focus().toggleBulletList().updateAttributes("bulletList", { type }).run();
    }
  };

  const setNumberType = (type: string) => {
    if (editor.isActive("orderedList")) {
      editor.chain().focus().updateAttributes("orderedList", { type }).run();
    } else if (editor.isActive("bulletList")) {
      editor.chain().focus().toggleBulletList().toggleOrderedList().updateAttributes("orderedList", { type }).run();
    } else {
      editor.chain().focus().toggleOrderedList().updateAttributes("orderedList", { type }).run();
    }
  };

  const copy = () => {
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const text = editor.state.doc.textBetween(from, to, " ");
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const cut = () => {
    copy();
    editor.chain().focus().deleteSelection().run();
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      editor.chain().focus().insertContent(text).run();
    } catch {
      /* clipboard read rejected — user pastes with Ctrl+V instead */
    }
  };

  return (
    <div className="flex h-[104px] select-none items-stretch bg-[#f3f3f3]">
      {/* Clipboard */}
      <Group title="Clipboard">
        <ToolButton title="Paste (Ctrl+V)" onClick={paste} big>
          <IconPaste />
          <span className="text-[10px] leading-none">Paste</span>
        </ToolButton>
        <div className="mt-1 flex items-center gap-0.5">
          <ToolButton title="Cut (Ctrl+X)" onClick={cut}>
            <IconScissors />
          </ToolButton>
          <ToolButton title="Copy (Ctrl+C)" onClick={copy}>
            <IconCopy />
          </ToolButton>
          <ToolButton title="Format Painter — soon" disabled>
            <IconFormatPainter />
          </ToolButton>
        </div>
      </Group>

      {/* Font */}
      <Group title="Font">
        <div className="flex items-center gap-0.5">
          <ComboBox
            title="Font"
            value={s.fontFamily}
            onChange={(v) =>
              v
                ? editor.chain().focus().setFontFamily(v).run()
                : editor.chain().focus().unsetFontFamily().run()
            }
            selectClass="w-[118px]"
            arrowClass="mr-1"
          >
            <option value="">Font&hellip;</option>
            {FONTS.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>
                {f}
              </option>
            ))}
          </ComboBox>
          <ComboBox
            title="Font size"
            value={s.fontSizePt}
            onChange={(v) => setFontSizePt(Number(v))}
            selectClass="w-[38px] text-center"
            arrowClass="mr-1"
          >
            <option value="">11</option>
            {FONT_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </ComboBox>
          <ToolButton title="Grow font" onClick={() => setFontSizePt(Math.min(163, activeFontSize + 2))}>
            <IconGrowFont />
          </ToolButton>
          <ToolButton title="Shrink font" onClick={() => setFontSizePt(Math.max(1, activeFontSize - 2))}>
            <IconShrinkFont />
          </ToolButton>
          <ToolButton title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
            <IconClearFormat />
          </ToolButton>
        </div>
        <div className="mt-1 flex items-center gap-0.5">
          <ToolButton title="Bold (Ctrl+B)" active={s.active.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
            <IconBold />
          </ToolButton>
          <ToolButton title="Italic (Ctrl+I)" active={s.active.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <IconItalic />
          </ToolButton>
          <ToolButton title="Underline (Ctrl+U)" active={s.active.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <IconUnderline />
          </ToolButton>
          <ToolButton title="Strikethrough" active={s.active.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <IconStrike />
          </ToolButton>
          <ToolButton title="Subscript" active={s.active.subscript} onClick={() => editor.chain().focus().toggleSubscript().run()}>
            <IconSubscript />
          </ToolButton>
          <ToolButton title="Superscript" active={s.active.superscript} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
            <IconSuperscript />
          </ToolButton>
          <ColorPopover
            title="Text highlight colour"
            icon={<IconHighlight />}
            current={s.highlight || "#ffff00"}
            colors={HIGHLIGHT_COLORS}
            onPick={applyHighlight}
            onClear={clearHighlight}
            clearLabel="No Colour"
          />
          <ColorPopover
            title="Font colour"
            icon={<IconTextColor />}
            current={s.color}
            colors={TEXT_COLORS}
            onPick={applyColor}
            onClear={clearColor}
            clearLabel="Automatic"
          />
        </div>
      </Group>

      {/* Paragraph */}
      <Group title="Paragraph">
        <div className="flex items-center gap-0.5">
          <ListSplitButton
            title="Bullet list"
            libraryTitle="Bullet Library"
            icon={<IconListBullet />}
            active={s.active.bulletList}
            options={BULLET_LIBRARY}
            currentType={s.bulletType}
            onToggle={() => editor.chain().focus().toggleBulletList().run()}
            onPick={setBulletType}
          />
          <ListSplitButton
            title="Numbering"
            libraryTitle="Numbering Library"
            icon={<IconListOrdered />}
            active={s.active.orderedList}
            options={NUMBER_LIBRARY}
            currentType={s.numberType}
            onToggle={() => editor.chain().focus().toggleOrderedList().run()}
            onPick={setNumberType}
          />
          <ToolButton title="Multilevel list — soon" disabled>
            <IconMultilevel />
          </ToolButton>
          <ToolButton title="Decrease indent" onClick={() => editor.chain().focus().decreaseIndent().run()}>
            <IconIndentDecrease />
          </ToolButton>
          <ToolButton title="Increase indent" onClick={() => editor.chain().focus().increaseIndent().run()}>
            <IconIndentIncrease />
          </ToolButton>
        </div>
        <div className="mt-1 flex items-center gap-0.5">
          {(
            [
              ["left", IconAlignLeft, "Align left"],
              ["center", IconAlignCenter, "Center"],
              ["right", IconAlignRight, "Align right"],
              ["justify", IconAlignJustify, "Justify"],
            ] as const
          ).map(([align, Icon, label]) => (
            <ToolButton
              key={align}
              title={label}
              active={s.align === align}
              onClick={() =>
                align === "left"
                  ? editor.chain().focus().setTextAlign("left").run()
                  : editor.chain().focus().toggleTextAlign(align).run()
              }
            >
              <Icon />
            </ToolButton>
          ))}
          <ToolButton title="Borders — soon" disabled>
            <IconBorders />
          </ToolButton>
          <ComboBox
            title="Line spacing"
            value={s.lineHeight}
            onChange={(v) => editor.chain().focus().setLineHeight(v).run()}
            selectClass="w-[46px]"
            arrowClass="mr-1"
          >
            {LINE_HEIGHTS.map((lh) => (
              <option key={lh.value} value={lh.value}>
                {lh.label}
              </option>
            ))}
          </ComboBox>
        </div>
      </Group>

      {/* Styles */}
      <Group title="Styles">
        <div className="grid grid-cols-2 gap-1">
          {STYLES.map((st) => (
            <button
              key={st.label}
              title={st.label}
              onClick={() => st.exec(editor)}
              className={`flex h-[34px] w-[92px] cursor-pointer items-center rounded-[3px] border px-2 text-left transition-colors duration-75 ${
                st.active(editor)
                  ? "border-[#9fc4ec] bg-[#cfe3fb]"
                  : "border-[#dddddd] bg-white hover:border-[#c1d3ec] hover:bg-[#eaf1fa]"
              }`}
            >
              <span className={`w-full truncate ${st.preview}`}>{st.label}</span>
            </button>
          ))}
        </div>
      </Group>

      {/* Editing */}
      <Group title="Editing">
        <div className="flex min-w-[54px] flex-col gap-1">
          <ToolButton title="Find (Ctrl+F)" onClick={() => openFind("find")} big>
            <IconSearch />
            <span className="text-[10px] leading-none">Find</span>
          </ToolButton>
          <div className="flex items-center justify-center gap-0.5">
            <ToolButton title="Replace (Ctrl+H)" onClick={() => openFind("replace")}>
              <IconReplace />
            </ToolButton>
            <ToolButton title="Select all (Ctrl+A)" onClick={selectAll}>
              <IconSelect />
            </ToolButton>
          </div>
        </div>
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-between border-r border-[#e0e0e0] px-2.5 py-1.5">
      <div className="flex flex-1 flex-col justify-center">{children}</div>
      <span className="mt-1 text-[10px] leading-none text-[#5b5b5b]">{title}</span>
    </div>
  );
}