import { useState } from "react";
import { useEditorContext } from "../Editor/EditorContext";
import { useAppStore } from "../../stores/appStore";
import { THEMES, getTheme, type ThemeDef } from "../../stores/themes";
import { Group, RvCell, Popover, MenuSection, MenuItem, Modal } from "./tabKit";
import {
  IconTheme,
  IconColors,
  IconFonts,
  IconSpacing,
  IconEffects,
  IconWatermark,
  IconPageColor,
  IconPageBorder,
  IconBorderLine,
} from "./icons";

const PAGE_COLORS = ["#ffffff", "#fbf6e9", "#eef4f0", "#f2f5fb", "#fdeeef", "#faf3e6"];

const WATERMARKS = ["Confidential", "Draft", "Do Not Copy", "Sample", "Urgent"];

const PAGE_BORDERS = [
  { id: "none", name: "None" },
  { id: "simple", name: "Simple Box" },
  { id: "thick", name: "Thick Box" },
  { id: "double", name: "Double Box" },
  { id: "thin", name: "Thin Box" },
];

export function DesignTab() {
  const editor = useEditorContext();
  const themeId = useAppStore((s) => s.themeId);
  const setThemeId = useAppStore((s) => s.setThemeId);
  const pageColor = useAppStore((s) => s.pageColor);
  const setPageColor = useAppStore((s) => s.setPageColor);
  const watermark = useAppStore((s) => s.watermark);
  const setWatermark = useAppStore((s) => s.setWatermark);
  const pageBorder = useAppStore((s) => s.pageBorder);
  const setPageBorder = useAppStore((s) => s.setPageBorder);

  const [menu, setMenu] = useState<null | string>(null);
  const [showWatermark, setShowWatermark] = useState(false);

  const theme = getTheme(themeId);

  const applyTheme = (t: ThemeDef) => {
    setThemeId(t.id);
    setMenu(null);
  };

  const applyTextColor = (hex: string) => {
    editor?.chain().focus().setColor(hex).run();
    setMenu(null);
  };

  const applyFontFamily = (family: string) => {
    editor?.chain().focus().setFontFamily(family).run();
    setMenu(null);
  };

  const hasSelection = editor ? !editor.state.selection.empty : false;

  return (
    <div className="flex h-[104px] items-stretch px-1" data-testid="design-tab">
      {/* Document formatting */}
      <Group title="Document Formatting">
        <div className="flex items-center gap-1">
          {THEMES.slice(0, 4).map((t) => (
            <button
              key={t.id}
              title={t.name}
              aria-label={`Theme ${t.name}`}
              data-testid={`theme-${t.id}`}
              onClick={() => applyTheme(t)}
              className={`cursor-pointer rounded p-0.5 ring-2 transition ${
                themeId === t.id ? "bg-[#cfe3fb] ring-[#0078d4]" : "bg-white ring-transparent hover:bg-[#eaf1fa]"
              }`}
            >
              <span className="flex h-[20px] w-[20px] overflow-hidden rounded-sm border border-[#d5d5d5]">
                {t.colors.slice(0, 4).map((c, i) => (
                  <span key={i} className="flex-1" style={{ background: c }} />
                ))}
              </span>
              <span className="block text-center text-[7px] leading-[9px] text-[#555]">{t.name}</span>
            </button>
          ))}
        </div>
        <RvCell
          title="Colors"
          icon={<IconColors />}
          testid="btnThemeColors"
          active={menu === "colors"}
          onClick={() => setMenu(menu === "colors" ? null : "colors")}
        />
        <RvCell
          title="Fonts"
          icon={<IconFonts />}
          testid="btnThemeFonts"
          active={menu === "fonts"}
          onClick={() => setMenu(menu === "fonts" ? null : "fonts")}
        />
      </Group>

      {/* Page background */}
      <Group title="Page Background">
        <RvCell
          title="Watermark"
          icon={<IconWatermark />}
          testid="btnWatermark"
          active={!!watermark}
          onClick={() => {
            setMenu(null);
            setShowWatermark(true);
          }}
        />
        <RvCell
          title="Page Color"
          icon={<IconPageColor />}
          testid="btnPageColor"
          active={menu === "pagecolor"}
          onClick={() => setMenu(menu === "pagecolor" ? null : "pagecolor")}
        />
        <RvCell
          title="Page Borders"
          icon={<IconPageBorder />}
          testid="btnPageBorders"
          active={menu === "pageborder"}
          onClick={() => setMenu(menu === "pageborder" ? null : "pageborder")}
        />
      </Group>

      {/* Paragraph spacing */}
      <Group title="Paragraph Spacing">
        <RvCell
          title="Spacing"
          icon={<IconSpacing />}
          testid="btnSpacing"
          active={menu === "spacing"}
          onClick={() => setMenu(menu === "spacing" ? null : "spacing")}
        />
        <RvCell
          title="Effects"
          icon={<IconEffects />}
          testid="btnEffects"
          active={menu === "effects"}
          onClick={() => setMenu(menu === "effects" ? null : "effects")}
        />
      </Group>

      {/* Themes nav */}
      <Group title="Themes">
        <button
          data-testid="btnThemesGallery"
          onClick={() => setMenu(menu === "themes" ? null : "themes")}
          className="flex h-[32px] w-[64px] cursor-pointer flex-col items-center justify-center gap-[2px] rounded-[3px] border border-transparent text-[#474747] hover:border-[#c1d3ec] hover:bg-[#eaf1fa]"
        >
          <IconTheme />
          <span className="w-full text-center text-[7.5px] leading-[8px] text-[#444]">Themes</span>
        </button>
        <button
          data-testid="btnBorderLine"
          onClick={() => {
            const cur = pageBorder === "thin" ? "none" : "thin";
            setPageBorder(cur);
          }}
          className={`flex h-[32px] w-[64px] cursor-pointer flex-col items-center justify-center gap-[2px] rounded-[3px] border border-transparent ${
            pageBorder === "thin" ? "border border-[#9fc4ec] bg-[#cfe3fb]" : ""
          } hover:border-[#c1d3ec] hover:bg-[#eaf1fa]`}
        >
          <IconBorderLine />
          <span className="w-full text-center text-[7.5px] leading-[8px] text-[#444]">Border Line</span>
        </button>
      </Group>

      {/* Theme gallery popover */}
      <Popover open={menu === "themes"} onClose={() => setMenu(null)} align="left-0">
        <MenuSection title="Themes" />
        <div className="grid w-[360px] grid-cols-3 gap-1 p-1">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTheme(t)}
              className={`cursor-pointer rounded border p-1.5 text-left transition ${
                themeId === t.id ? "border-[#0078d4] bg-[#eaf1fa]" : "border-[#e0e0e0] hover:bg-[#f5f8fd]"
              }`}
            >
              <span className="flex h-[14px] w-full overflow-hidden rounded-sm border border-[#d5d5d5]">
                {t.colors.map((c, i) => (
                  <span key={i} className="flex-1" style={{ background: c }} />
                ))}
              </span>
              <span className="mt-1 block text-[10px] font-medium text-[#333]">{t.name}</span>
              <span className="block text-[8px] text-[#8a8a8a]">{`${t.headingFont} / ${t.bodyFont}`}</span>
            </button>
          ))}
        </div>
      </Popover>

      {/* Theme colours popover — the active theme's palette */}
      <Popover open={menu === "colors"} onClose={() => setMenu(null)} align="left-0">
        <MenuSection title={`Colors — ${theme.name}`} />
        <div className="grid w-[210px] grid-cols-3 gap-1 p-1">
          {theme.colors.map((c, i) => (
            <button
              key={`${c}-${i}`}
              title={`Accent ${i + 1} ${c}`}
              aria-label={`Accent ${i + 1} ${c}`}
              data-testid={`theme-color-${i + 1}`}
              onClick={() => applyTextColor(c)}
              className="flex h-[26px] w-full cursor-pointer items-end justify-start rounded-sm border border-[#d0d0d0] p-0.5"
              style={{ background: c }}
            >
              <span className="rounded-[2px] bg-white/80 px-1 text-[8px] leading-tight text-[#333]">{`A${i + 1}`}</span>
            </button>
          ))}
        </div>
        <p className="px-1 pb-1 text-[9px] text-[#8a8a8a]">Click a swatch to apply it to the selected text.</p>
      </Popover>

      {/* Theme fonts popover — the active theme's font pair */}
      <Popover open={menu === "fonts"} onClose={() => setMenu(null)} align="left-0">
        <MenuSection title={`Fonts — ${theme.name}`} />
        <div className="flex w-[230px] flex-col p-0.5">
          <button
            data-testid="theme-font-heading"
            onClick={() => applyFontFamily(theme.headingFont)}
            className="flex cursor-pointer items-center justify-between gap-3 rounded px-2 py-1.5 text-left hover:bg-[#eaf1fa]"
          >
            <span className="text-[13px] text-[#333]" style={{ fontFamily: theme.headingFont }}>
              {theme.headingFont}
            </span>
            <span className="text-[9px] uppercase tracking-wide text-[#8a8a8a]">Heading</span>
          </button>
          <button
            data-testid="theme-font-body"
            onClick={() => applyFontFamily(theme.bodyFont)}
            className="flex cursor-pointer items-center justify-between gap-3 rounded px-2 py-1.5 text-left hover:bg-[#eaf1fa]"
          >
            <span className="text-[13px] text-[#333]" style={{ fontFamily: theme.bodyFont }}>
              {theme.bodyFont}
            </span>
            <span className="text-[9px] uppercase tracking-wide text-[#8a8a8a]">Body</span>
          </button>
        </div>
        <p className="px-2 pb-1 text-[9px] text-[#8a8a8a]">Click a font to apply it to the selected text.</p>
      </Popover>

      {/* Page color popover */}
      <Popover open={menu === "pagecolor"} onClose={() => setMenu(null)} align="left-0">
        <MenuSection title="Page Color" />
        <div className="flex items-center gap-1 p-1">
          {PAGE_COLORS.map((c) => (
            <button
              key={c}
              title={c}
              aria-label={`Page color ${c}`}
              onClick={() => {
                setPageColor(c);
                setMenu(null);
              }}
              className={`h-[24px] w-[24px] cursor-pointer rounded-sm border ${
                pageColor.toLowerCase() === c.toLowerCase() ? "border-[#0078d4] ring-2 ring-[#8ab4f8]" : "border-[#d0d0d0]"
              }`}
              style={{ background: c }}
            />
          ))}
          <button
            onClick={() => {
              setPageColor("#ffffff");
              setMenu(null);
            }}
            className="ml-1 rounded border border-[#d0d0d0] px-2 py-1 text-[10px] text-[#333] hover:bg-[#f0f4fa]"
          >
            No Color
          </button>
        </div>
      </Popover>

      {/* Page border popover */}
      <Popover open={menu === "pageborder"} onClose={() => setMenu(null)} align="left-0">
        <MenuSection title="Page Borders" />
        {PAGE_BORDERS.map((b) => (
          <MenuItem
            key={b.id}
            active={pageBorder === b.id}
            onClick={() => {
              setPageBorder(b.id === "none" ? null : b.id);
              setMenu(null);
            }}
          >
            {b.name}
          </MenuItem>
        ))}
      </Popover>

      {/* Paragraph spacing popover */}
      <Popover open={menu === "spacing"} onClose={() => setMenu(null)} align="left-0">
        <MenuSection title="Paragraph Spacing" />
        {[
          { n: "Compact", before: 0, after: 4, line: 1 },
          { n: "Relaxed", before: 4, after: 10, line: 1.3 },
          { n: "Double", before: 6, after: 14, line: 2 },
          { n: "No Spacing", before: 0, after: 0, line: 1 },
        ].map((s) => (
          <MenuItem
            key={s.n}
            onClick={() => {
              if (editor) {
                editor.chain().focus().command(({ tr, state, dispatch }) => {
                  const type = state.selection.$head.parent.type.name;
                  if (type !== "paragraph" && type !== "heading") return false;
                  tr.setNodeMarkup(state.selection.$head.before(), undefined, {
                    spaceBefore: s.before > 0 ? `${s.before * 6}pt` : null,
                    spaceAfter: s.after > 0 ? `${s.after * 6}pt` : null,
                  });
                  dispatch?.(tr);
                  return true;
                }).run();
              }
              setMenu(null);
            }}
          >
            {s.n}
          </MenuItem>
        ))}
      </Popover>

      {/* Effects popover */}
      <Popover open={menu === "effects"} onClose={() => setMenu(null)} align="left-0">
        <MenuSection title="Text Effects" />
        {[
          { n: "Subtle", p: { fontSize: "14px" } },
          { n: "Strong", p: { fontSize: "16px" } },
          { n: "Reflection", p: { fontSize: "16px", textShadow: "0 1px 2px rgba(0,0,0,.35)" } },
          { n: "Glow", p: { fontSize: "16px", textShadow: "0 0 6px rgba(68,114,196,.55)" } },
        ].map((fx) => (
          <MenuItem
            key={fx.n}
            onClick={() => {
              if (editor) {
                editor.chain().focus().setFontSize(fx.p.fontSize).run();
              }
              setMenu(null);
            }}
          >
            {fx.n}
          </MenuItem>
        ))}
      </Popover>

      {showWatermark && (
        <Modal title="Watermark" onClose={() => setShowWatermark(false)} testid="watermark-dialog">
          <div className="flex flex-col gap-1">
            {WATERMARKS.map((w) => (
              <button
                key={w}
                onClick={() => {
                  setWatermark(w);
                  setShowWatermark(false);
                }}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] hover:bg-[#eaf1fa] ${
                  watermark === w ? "bg-[#cfe3fb] text-[#1e4a80]" : "text-[#333]"
                }`}
              >
                <span className="w-3 text-[11px]">{watermark === w ? "✓" : ""}</span>
                {w}
              </button>
            ))}
            <button
              onClick={() => {
                setWatermark(null);
                setShowWatermark(false);
              }}
              className="mt-2 rounded border border-[#d0d0d0] px-2 py-1 text-[12px] text-[#333] hover:bg-[#f0f4fa]"
            >
              Remove watermark
            </button>
            <p className="mt-2 text-[11px] text-[#8a8a8a]">
              The watermark appears faintly across every page.
            </p>
          </div>
        </Modal>
      )}
      {void hasSelection}
    </div>
  );
}