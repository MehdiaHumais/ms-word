import { useEffect, useRef } from "react";
import { useAppStore } from "../../stores/appStore";
import { useInkStore, type InkStroke } from "../../stores/inkStore";

/**
 * Transparent drawing surface rendered on top of the page. Pens / highlighter
 * add smooth strokes, eraser deletes nearby strokes, lasso selects strokes
 * inside a marquee (later deleted via Delete key / "Ink to …" uses selection).
 * Manages its own redraw on a 60 fps loop from the store.
 */
export function InkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const drawing = useRef(false);
  const currentStroke = useRef<InkStroke | null>(null);
  const lasso = useRef<{ x0: number; y0: number; x: number; y: number } | null>(null);

  const tool = useAppStore((s) => s.inkTool);
  const strokes = useInkStore((s) => s.strokes);
  const selectedIds = useInkStore((s) => s.selectedIds);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const paint = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const st of useInkStore.getState().strokes) {
        ctx.strokeStyle = st.color;
        ctx.globalAlpha = st.tool === "highlighter" ? 0.45 : 1;
        ctx.lineWidth = st.width;
        if (useInkStore.getState().selectedIds.includes(st.id)) {
          ctx.setLineDash([4, 4]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.beginPath();
        st.points.forEach((p, i) => {
          const x = p.x - rect.left;
          const y = p.y - rect.top;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
      ctx.setLineDash([]);
      if (lasso.current) {
        const { x0, y0, x, y } = lasso.current;
        ctx.strokeStyle = "#0078d4";
        ctx.fillStyle = "rgba(0,120,212,0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(Math.min(x0, x), Math.min(y0, y), Math.abs(x - x0), Math.abs(y - y0));
        ctx.fill();
        ctx.stroke();
      }
      raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, []);

  const localPoint = (e: React.PointerEvent) => {
    const wrap = wrapRef.current;
    if (!wrap) return { x: 0, y: 0 };
    const rect = wrap.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent) => {
    if (tool === "off") return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    e.preventDefault();
    wrap.setPointerCapture(e.pointerId);
    const p = localPoint(e);
    if (tool === "eraser") {
      drawing.current = true;
      useInkStore.getState().eraseNear(p.x, p.y, 14);
      return;
    }
    if (tool === "lasso") {
      lasso.current = { x0: p.x, y0: p.y, x: p.x, y: p.y };
      return;
    }
    const st = useInkStore.getState();
    drawing.current = true;
    const width = tool === "highlighter" ? st.highlighterWidth : st.penWidth;
    const color =
      tool === "highlighter"
        ? st.highlighterColor
        : tool === "pen"
          ? st.penColor
          : st.pencilColor;
    currentStroke.current = {
      id: "tmp",
      color,
      width,
      tool: tool === "highlighter" ? "highlighter" : "pen",
      points: [p],
    };
  };

  const onMove = (e: React.PointerEvent) => {
    if (tool === "off") return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const p = localPoint(e);
    if (tool === "eraser" && drawing.current) {
      useInkStore.getState().eraseNear(p.x, p.y, 14);
      return;
    }
    if (tool === "lasso") {
      if (lasso.current) lasso.current = { ...lasso.current, x: p.x, y: p.y };
      return;
    }
    if (drawing.current && currentStroke.current) {
      const last = currentStroke.current.points[currentStroke.current.points.length - 1];
      if (last && Math.hypot(p.x - last.x, p.y - last.y) < 1.5) return;
      currentStroke.current.points = [...currentStroke.current.points, p];
    }
  };

  const onUp = (e: React.PointerEvent) => {
    if (tool === "off") return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.releasePointerCapture?.(e.pointerId);
    if (tool === "eraser") {
      drawing.current = false;
      return;
    }
    if (tool === "lasso") {
      const box = lasso.current;
      lasso.current = null;
      if (!box) return;
      const { x0, y0, x, y } = box;
      const lx = Math.min(x0, x);
      const lx2 = Math.max(x0, x);
      const ly = Math.min(y0, y);
      const ly2 = Math.max(y0, y);
      const inside = useInkStore
        .getState()
        .strokes.filter(
          (st) =>
            st.points.length > 0 &&
            st.points.every((p) => p.x >= lx && p.x <= lx2 && p.y >= ly && p.y <= ly2),
        )
        .map((st) => st.id);
      useInkStore.getState().setSelection(inside);
      return;
    }
    if (drawing.current && currentStroke.current && currentStroke.current.points.length > 0) {
      useInkStore.getState().addStroke(currentStroke.current);
    }
    drawing.current = false;
    currentStroke.current = null;
  };

  if (tool === "off") return null;

  return (
    <div
      ref={wrapRef}
      data-testid="ink-canvas-overlay"
      className="pointer-events-auto absolute inset-0 z-20 touch-none"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute left-1 top-1 rounded bg-white/85 px-1.5 py-0.5 text-[10px] font-semibold text-[#444] shadow">
        {tool === "pen" || tool === "highlighter" ? "Draw onto the page" : tool === "eraser" ? "Drag across ink to erase" : "Drag to lasso-select ink"}
      </div>
      {strokes.length > 0 && selectedIds.length > 0 && (
        <button
          onClick={() => useInkStore.getState().removeSelected()}
          className="pointer-events-auto absolute left-1 top-7 rounded border border-[#d0d0d0] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#8a1f1f] shadow hover:bg-[#fde8e8]"
        >
          Delete {selectedIds.length} selected
        </button>
      )}
    </div>
  );
}