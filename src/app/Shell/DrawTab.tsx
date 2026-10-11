import { useEffect, useRef, useState } from "react";
import { useEditorContext } from "../Editor/EditorContext";
import { useAppStore } from "../../stores/appStore";
import { useInkStore, replayStrokes, strokesToDataUrl } from "../../stores/inkStore";
import { Group, RvCell, Popover, MenuSection, MenuItem, Modal } from "./tabKit";
import {
  IconLasso,
  IconEraser,
  IconPencil,
  IconPen,
  IconHighlighter,
  IconInkReplay,
  IconInkConvert,
  IconTouch,
  IconInkText,
  IconInkShape,
  IconInkMath,
} from "./icons";

const SWATCHES = ["#1a1a1a", "#ffffff", "#c00000", "#ed7d31", "#548235", "#2e75b6", "#7030a0", "#ffc000"];

function ReplayOverlay({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [done, setDone] = useState(false);
  const [keep, setKeep] = useState(false);
  const strokes = useInkStore((s) => s.strokes);
  const setReplaying = useInkStore((s) => s.setReplaying);

  useEffect(() => {
    setReplaying(true);
    return () => setReplaying(false);
  }, [setReplaying]);

  useEffect(() => {
    let raf = 0;
    const c = canvasRef.current;
    if (!c) return;
    c.width = 620;
    c.height = 400;
    const cancel = replayStrokes(c, strokes, 2200, () => setDone(true));
    return () => {
      cancelAnimationFrame(raf);
      cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal title="Replay Ink" onClose={onClose} testid="replay-dialog">
      <div className="rounded border border-[#e0e0e0] bg-[#fafafa] p-2">
        <canvas ref={canvasRef} data-testid="replay-canvas" className="h-[400px] w-full bg-white" />
        <div className="mt-1 text-center text-[11px] text-[#8a8a8a]">
          {done ? "Replay finished." : "Replaying your ink strokes…"}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <label className="flex items-center gap-1.5 text-[12px] text-[#333]">
          <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
          Keep ink on the page
        </label>
        <button
          onClick={() => {
            if (!keep) useInkStore.getState().clearStrokes();
            onClose();
          }}
          className="rounded border border-[#4472c4] bg-[#d6e4f7] px-3 py-1 text-[12px] font-semibold text-[#1e4a80] hover:bg-[#c9dcf3]"
        >
          Done
        </button>
      </div>
    </Modal>
  );
}

export function DrawTab() {
  const editor = useEditorContext();
  const tool = useAppStore((s) => s.inkTool);
  const showInk = useAppStore((s) => s.showInk);
  const setInkTool = useAppStore((s) => s.setInkTool);
  const penColor = useInkStore((s) => s.penColor);
  const highlighterColor = useInkStore((s) => s.highlighterColor);
  const penWidth = useInkStore((s) => s.penWidth);
  const highlighterWidth = useInkStore((s) => s.highlighterWidth);
  const setPenColor = useInkStore((s) => s.setPenColor);
  const setHighlighterColor = useInkStore((s) => s.setHighlighterColor);
  const setPenWidth = useInkStore((s) => s.setPenWidth);
  const setHighlighterWidth = useInkStore((s) => s.setHighlighterWidth);
  const strokes = useInkStore((s) => s.strokes);
  const clearStrokes = useInkStore((s) => s.clearStrokes);

  const [replay, setReplay] = useState(false);
  const [convertMenu, setConvertMenu] = useState(false);

  const activeTool = (t: "pen" | "highlighter" | "eraser" | "lasso") =>
    tool !== "off" && tool === t;

  const startTool = (t: "pen" | "highlighter" | "eraser" | "lasso") => {
    setInkTool(tool === t ? "off" : t);
  };

  const convert = (kind: "text" | "shape" | "math") => {
    if (!editor || strokes.length === 0) {
      setConvertMenu(false);
      return;
    }
    const url = strokesToDataUrl(strokes);
    if (!url) {
      setConvertMenu(false);
      return;
    }
    editor.chain().focus().setImage({ src: url, alt: `Ink to ${kind}` }).run();
    clearStrokes();
    setConvertMenu(false);
  };

  const color = tool === "highlighter" ? highlighterColor : penColor;

  return (
    <div className="flex h-[104px] items-stretch px-1" data-testid="draw-tab">
      {/* Tools */}
      <Group title="Tools">
        <RvCell title="Lasso Select" icon={<IconLasso />} testid="btnLasso" active={activeTool("lasso")} onClick={() => startTool("lasso")} />
        <RvCell title="Eraser" icon={<IconEraser />} testid="btnEraser" active={activeTool("eraser")} onClick={() => startTool("eraser")} />
      </Group>

      {/* Pens */}
      <Group title="Pens">
        <RvCell title="Pencil" icon={<IconPencil />} testid="btnPencil" active={activeTool("pen") && tool === "pen"} onClick={() => startTool("pen")} />
        <RvCell title="Pen" icon={<IconPen />} testid="btnPen" active={activeTool("pen")} onClick={() => startTool("pen")} />
        <RvCell title="Highlighter" icon={<IconHighlighter />} testid="btnHighlighter" active={activeTool("highlighter")} onClick={() => startTool("highlighter")} />
      </Group>

      {/* Color / thickness */}
      <Group title="Color & Thickness">
        <div className="flex items-center gap-0.5">
          {SWATCHES.map((c) => (
            <button
              key={c}
              title={c}
              aria-label={`Ink color ${c}`}
              onClick={() => (tool === "highlighter" ? setHighlighterColor(c) : setPenColor(c))}
              className={`h-[18px] w-[18px] rounded-sm border transition-transform ${
                color.toLowerCase() === c.toLowerCase() ? "scale-110 border-[#0078d4] ring-2 ring-[#8ab4f8]" : "border-[#c8c8c8]"
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <input
            type="range"
            min={1}
            max={24}
            value={tool === "highlighter" ? highlighterWidth : penWidth}
            aria-label="Ink thickness"
            onChange={(e) => (tool === "highlighter" ? setHighlighterWidth(+e.target.value) : setPenWidth(+e.target.value))}
            className="w-[64px]"
          />
          <span className="text-[9px] text-[#5b5b5b]">{tool === "highlighter" ? highlighterWidth : penWidth}px</span>
        </div>
      </Group>

      {/* Convert */}
      <Group title="Convert">
        <RvCell title="Ink to Text" icon={<IconInkText />} testid="btnInkToText" disabled={strokes.length === 0} onClick={() => convert("text")} />
        <RvCell title="Ink to Shape" icon={<IconInkShape />} testid="btnInkToShape" disabled={strokes.length === 0} onClick={() => convert("shape")} />
        <RvCell title="Ink to Math" icon={<IconInkMath />} testid="btnInkToMath" disabled={strokes.length === 0} onClick={() => convert("math")} />
      </Group>

      {/* Replay + Delete */}
      <Group title="Replay">
        <RvCell title="Replay Ink" icon={<IconInkReplay />} testid="btnReplay" disabled={strokes.length === 0} onClick={() => setReplay(true)} />
        <RvCell title="Delete Ink" icon={<IconInkConvert />} testid="btnClearInk" disabled={strokes.length === 0} onClick={clearStrokes} />
      </Group>

      {/* Touch + convert menu fallback */}
      <Group title="Touch">
        <button
          data-testid="btnTouchMode"
          aria-pressed={!showInk}
          onClick={() => setInkTool("off")}
          className="relative flex h-[32px] w-[64px] cursor-pointer flex-col items-center justify-center gap-[2px] rounded-[3px] border border-transparent text-[#474747] transition-colors duration-75 hover:border-[#c1d3ec] hover:bg-[#eaf1fa]"
        >
          <IconTouch />
          <span className="w-full text-center text-[7.5px] leading-[8px] text-[#444]">Touch Mode</span>
        </button>
        <RvCell title="Ink to…" icon={<IconInkConvert />} testid="btnInkConvert" onClick={() => setConvertMenu(true)} />
      </Group>

      {replay && <ReplayOverlay onClose={() => setReplay(false)} />}
      <Popover open={convertMenu} onClose={() => setConvertMenu(false)} align="right-0">
        <MenuSection title="Ink to Content" />
        <MenuItem onClick={() => convert("text")}>Ink to Text</MenuItem>
        <MenuItem onClick={() => convert("shape")}>Ink to Shape</MenuItem>
        <MenuItem onClick={() => convert("math")}>Ink to Math</MenuItem>
      </Popover>
    </div>
  );
}