import { useState } from "react";
import { useEditorContext } from "../Editor/EditorContext";
import { useAppStore } from "../../stores/appStore";
import { Group, RvCell, Popover, MenuSection, MenuItem } from "./tabKit";
import {
  IconPrintLayout,
  IconWebLayout,
  IconOutlineView,
  IconDraftView,
  IconReadMode,
  IconRuler,
  IconGridlines,
  IconNavPane,
  IconZoom,
  IconOnePage,
  IconMultiplePages,
  IconNewWindow,
  IconArrangeAll,
  IconSplit,
  IconMacros,
  IconWatermark,
} from "./icons";

export function ViewTab() {
  const editor = useEditorContext();
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const showRuler = useAppStore((s) => s.showRuler);
  const toggleRuler = useAppStore((s) => s.toggleRuler);
  const showGridlines = useAppStore((s) => s.showGridlines);
  const toggleGridlines = useAppStore((s) => s.toggleGridlines);
  const showNavPane = useAppStore((s) => s.showNavPane);
  const toggleNavPane = useAppStore((s) => s.toggleNavPane);
  const splitView = useAppStore((s) => s.splitView);
  const toggleSplit = useAppStore((s) => s.toggleSplit);
  const zoom = useAppStore((s) => s.zoom);
  const setZoom = useAppStore((s) => s.setZoom);
  const setFullScreen = useAppStore((s) => s.setFullScreen);
  const showFullScreen = useAppStore((s) => s.showFullScreen);
  const setMacrosOpen = useAppStore((s) => s.setMacrosOpen);
  const setInkTool = useAppStore((s) => s.setInkTool);

  const [menu, setMenu] = useState<null | string>(null);

  const modeBtn = (mode: typeof viewMode, label: string, Icon: React.ComponentType, testid: string) => {
    return (
      <button
        data-testid={testid}
        aria-pressed={viewMode === mode}
        title={label}
        aria-label={label}
        onClick={() => {
          setMenu(null);
          setViewMode(mode);
          if (mode === "outline") {
            useAppStore.getState().setOutlineActive(true);
          }
        }}
        className={`relative flex h-[36px] w-[50px] cursor-pointer flex-col items-center justify-center gap-[3px] rounded-[3px] border border-transparent transition-colors duration-75 ${
          viewMode === mode ? "border border-[#9fc4ec] bg-[#cfe3fb] text-[#1e4a80]" : "text-[#474747] hover:border-[#c1d3ec] hover:bg-[#eaf1fa]"
        }`}
      >
        <Icon />
        <span className="text-center text-[7px] leading-[8px]">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-[104px] items-stretch px-1" data-testid="view-tab">
      {/* Views */}
      <Group title="Views">
        <div className="flex items-center gap-0.5">
          {modeBtn("print", "Print Layout", IconPrintLayout, "btnPrintLayout")}
          {modeBtn("web", "Web Layout", IconWebLayout, "btnWebLayout")}
          {modeBtn("draft", "Draft", IconDraftView, "btnDraftView")}
          {modeBtn("outline", "Outline", IconOutlineView, "btnOutlineView")}
        </div>
      </Group>

      {/* Immersive */}
      <Group title="Immersive">
        <RvCell
          title="Focus"
          icon={<IconReadMode />}
          testid="btnFocus"
          active={showFullScreen}
          onClick={() => {
            setMenu(null);
            setInkTool("off");
            setFullScreen(!showFullScreen);
          }}
        />
        <RvCell
          title="Read Mode"
          icon={<IconWatermark />}
          testid="btnReadMode"
          active={viewMode === "read"}
          onClick={() => {
            setMenu(null);
            setViewMode(viewMode === "read" ? "print" : "read");
          }}
        />
      </Group>

      {/* Show */}
      <Group title="Show">
        <RvCell title="Ruler" icon={<IconRuler />} testid="btnRuler" active={showRuler} onClick={() => { setMenu(null); toggleRuler(); }} />
        <RvCell title="Gridlines" icon={<IconGridlines />} testid="btnGridlines" active={showGridlines} onClick={() => { setMenu(null); toggleGridlines(); }} />
        <RvCell title="Navigation Pane" icon={<IconNavPane />} testid="btnNavPane" active={showNavPane} onClick={() => { setMenu(null); toggleNavPane(); }} />
      </Group>

      {/* Zoom */}
      <Group title="Zoom">
        <RvCell title="Zoom" icon={<IconZoom />} testid="btnZoom" active={menu === "zoom"} onClick={() => setMenu(menu === "zoom" ? null : "zoom")} />
        <div className="flex items-center gap-1">
          <button
            data-testid="btnZoom100"
            onClick={() => setZoom(100)}
            className="rounded border border-[#d0d0d0] px-2 py-0.5 text-[10px] text-[#333] hover:bg-[#eaf1fa]"
          >
            100%
          </button>
          <button
            data-testid="btnOnePage"
            aria-label="One page"
            onClick={() => setZoom(120)}
            className="rounded border border-[#d0d0d0] px-1.5 py-0.5 text-[10px] text-[#333] hover:bg-[#eaf1fa]"
          >
            <IconOnePage />
          </button>
          <button
            data-testid="btnMultiPage"
            aria-label="Multiple pages"
            onClick={() => setZoom(90)}
            className="rounded border border-[#d0d0d0] px-1.5 py-0.5 text-[10px] text-[#333] hover:bg-[#eaf1fa]"
          >
            <IconMultiplePages />
          </button>
        </div>
      </Group>

      {/* Window */}
      <Group title="Window">
        <RvCell title="New Window" icon={<IconNewWindow />} testid="btnNewWindow" onClick={() => { setMenu(null); toggleSplit(); }} />
        <RvCell title="Arrange All" icon={<IconArrangeAll />} testid="btnArrangeAll" onClick={() => { setMenu(null); toggleSplit(); }} />
        <RvCell title="Split" icon={<IconSplit />} testid="btnSplit" active={splitView} onClick={() => { setMenu(null); toggleSplit(); }} />
      </Group>

      {/* Macros */}
      <Group title="Macros">
        <RvCell
          title="Macros"
          icon={<IconMacros />}
          testid="btnMacros"
          onClick={() => {
            setMenu(null);
            setMacrosOpen(true);
          }}
        />
      </Group>

      {/* Zoom popover */}
      <Popover open={menu === "zoom"} onClose={() => setMenu(null)} align="right-0">
        <MenuSection title="Zoom" />
        <div className="px-1 pb-1">
          <input
            data-testid="zoom-slider"
            type="range"
            min={50}
            max={200}
            step={5}
            value={zoom}
            onChange={(e) => setZoom(+e.target.value)}
            className="w-[160px]"
            aria-label="Zoom"
          />
          <div className="flex items-center justify-between text-[11px] text-[#555]">
            <span>50%</span>
            <span className="font-semibold" data-testid="zoom-value">{zoom}%</span>
            <span>200%</span>
          </div>
        </div>
        {[
          { n: "100%", v: 100 },
          { n: "One Page", v: 120 },
          { n: "Multiple Pages", v: 90 },
          { n: "Page Width", v: 110 },
        ].map((z) => (
          <MenuItem key={z.n} onClick={() => { setZoom(z.v); setMenu(null); }}>
            {z.n}
          </MenuItem>
        ))}
        <MenuSection title="Move to Another Window" />
        <MenuItem onClick={() => { toggleSplit(); setMenu(null); }}>
          Split / Switch Window
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (editor) {
              window.open(window.location.href, "_blank");
            }
            setMenu(null);
          }}
        >
          Open in New Window
        </MenuItem>
      </Popover>
    </div>
  );
}