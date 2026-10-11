import { create } from "zustand";

export interface InkStroke {
  id: string;
  color: string;
  width: number;
  tool: "pen" | "highlighter";
  points: { x: number; y: number }[];
}

interface InkState {
  strokes: InkStroke[];
  selectedIds: string[];
  pencilColor: string;
  penColor: string;
  highlighterColor: string;
  penWidth: number;
  highlighterWidth: number;
  replaying: boolean;
  addStroke: (s: InkStroke) => void;
  eraseNear: (x: number, y: number, radius: number) => void;
  clearStrokes: () => void;
  removeStroke: (id: string) => void;
  removeSelected: () => void;
  setSelection: (ids: string[]) => void;
  clearSelection: () => void;
  setPencilColor: (c: string) => void;
  setPenColor: (c: string) => void;
  setHighlighterColor: (c: string) => void;
  setPenWidth: (w: number) => void;
  setHighlighterWidth: (w: number) => void;
  setReplaying: (r: boolean) => void;
}

let strokeSeq = 1;

export const useInkStore = create<InkState>((set) => ({
  strokes: [],
  selectedIds: [],
  pencilColor: "#1a1a1a",
  penColor: "#c00000",
  highlighterColor: "#fff24d",
  penWidth: 2.5,
  highlighterWidth: 14,
  replaying: false,
  addStroke: (stroke) => set((s) => ({ strokes: [...s.strokes, { ...stroke, id: `st${strokeSeq++}` }] })),
  eraseNear: (x, y, radius) =>
    set((s) => ({
      strokes: s.strokes.filter((st) => {
        const d = st.points.reduce((min, p) => Math.min(min, Math.hypot(p.x - x, p.y - y)), Infinity);
        return d > radius;
      }),
      selectedIds: [],
    })),
  clearStrokes: () => set({ strokes: [], selectedIds: [] }),
  removeStroke: (id) =>
    set((s) => ({ strokes: s.strokes.filter((st) => st.id !== id), selectedIds: s.selectedIds.filter((x) => x !== id) })),
  removeSelected: () =>
    set((s) => {
      const doomed = new Set(s.selectedIds);
      return {
        strokes: s.strokes.filter((st) => !doomed.has(st.id)),
        selectedIds: [],
      };
    }),
  setSelection: (selectedIds) => set({ selectedIds }),
  clearSelection: () => set({ selectedIds: [] }),
  setPencilColor: (c) => set({ pencilColor: c }),
  setPenColor: (c) => set({ penColor: c }),
  setHighlighterColor: (c) => set({ highlighterColor: c }),
  setPenWidth: (w) => set({ penWidth: w }),
  setHighlighterWidth: (w) => set({ highlighterWidth: w }),
  setReplaying: (replaying) => set({ replaying }),
}));

/** Renders the current strokes onto a canvas fitted to a bounding box. */
export function strokesToDataUrl(
  strokes: InkStroke[],
  naturalWidth = 620,
  naturalHeight = 200,
): string | null {
  if (strokes.length === 0) return null;
  const canvas = document.createElement("canvas");
  canvas.width = naturalWidth;
  canvas.height = naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, naturalWidth, naturalHeight);
  const xs = strokes.flatMap((s) => s.points.map((p) => p.x));
  const ys = strokes.flatMap((s) => s.points.map((p) => p.y));
  if (xs.length === 0) return null;
  let minX = Math.min(...xs);
  let minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const pad = 8;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  const w = maxX - minX + pad * 2;
  const h = maxY - minY + pad * 2;
  if (w <= 0 || h <= 0) return null;
  const scale = Math.min(naturalWidth / w, naturalHeight / h, 4);
  ctx.save();
  ctx.translate(naturalWidth / 2 - ((minX + w / 2) * scale) / 1, naturalHeight / 2 - ((minY + h / 2) * scale) / 1);
  ctx.scale(scale, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const st of strokes) {
    ctx.strokeStyle = st.color;
    ctx.globalAlpha = st.tool === "highlighter" ? 0.45 : 1;
    ctx.lineWidth = st.width;
    ctx.beginPath();
    st.points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  }
  ctx.restore();
  return canvas.toDataURL("image/png");
}

/** Replays strokes progressively on a target canvas. */
export function replayStrokes(
  canvas: HTMLCanvasElement,
  strokes: InkStroke[],
  duration = 1800,
  onDone?: () => void,
): () => void {
  let raf = 0;
  const ctx = canvas.getContext("2d");
  if (!ctx || strokes.length === 0) {
    onDone?.();
    return () => cancelAnimationFrame(raf);
  }
  const start = performance.now();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const draw = (t: number) => {
    const progress = Math.min(1, (t - start) / duration);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const total = strokes.reduce((n, s) => n + s.points.length, 0);
    let budget = total * progress;
    for (const st of strokes) {
      ctx.strokeStyle = st.color;
      ctx.globalAlpha = st.tool === "highlighter" ? 0.45 : 1;
      ctx.lineWidth = st.width;
      ctx.beginPath();
      let drawn = 0;
      st.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
        if (drawn <= budget) drawn++;
      });
      ctx.stroke();
      budget -= st.points.length;
    }
    if (progress < 1) raf = requestAnimationFrame(draw);
    else onDone?.();
  };
  raf = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf);
}