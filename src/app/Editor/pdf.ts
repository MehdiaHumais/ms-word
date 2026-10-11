/**
 * Minimal, dependency-free PDF writer for BritDocs.
 *
 * Produces a real PDF 1.4 document from the editor's HTML using the
 * base-14 Helvetica family (no font embedding needed) on A4 pages.
 * Text is encoded as CP1252 (WinAnsi) via WinAnsiEncoding, so common
 * smart quotes / dashes survive. Layout supports paragraphs, headings,
 * bulleted & numbered lists, bold/italic/underline and inline sizes.
 */

interface Run {
  text: string;
  b: boolean;
  i: boolean;
  u: boolean;
  size: number;
  color: [number, number, number] | null;
}

interface PhysicalLine {
  runs: Run[];
  y: number;
  rule?: boolean;
}

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 56.7;
const USABLE_W = PAGE_W - 2 * MARGIN;
const TOP = PAGE_H - MARGIN;
const BOTTOM = MARGIN;
const BASE_SIZE = 11;

const HELV_W = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

function byteWidth(b: number, size: number): number {
  if (b >= 32 && b <= 126) return ((HELV_W[b - 32] ?? 500) * size) / 1000;
  if (b === 0xa0) return (278 * size) / 1000;
  return (556 * size) / 1000;
}

const U_TO_CP1252: Record<number, number> = {
  0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86,
  0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b,
  0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93,
  0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98,
  0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0xa0: 0xa0,
  0x017e: 0x9e, 0x0178: 0x9f,
};

function toCpByte(c: number): number {
  if (c >= 0x20 && c <= 0x7e) return c;
  const m = U_TO_CP1252[c];
  if (m !== undefined) return m;
  if (c >= 0xa0 && c <= 0xff) return c;
  if (c === 0x0a || c === 0x0d || c === 0x09) return 0x20;
  return 0x3f;
}

function encText(s: string): Uint8Array {
  const out: number[] = [];
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0x3f;
    const byte = toCpByte(c);
    if (byte === 0x28 || byte === 0x29 || byte === 0x5c) out.push(0x5c);
    out.push(byte);
  }
  return new Uint8Array(out);
}

function encAscii(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

function runWidth(bytes: Uint8Array, size: number): number {
  let w = 0;
  for (const b of bytes) w += byteWidth(b, size);
  return w;
}

function parseColor(css: string): [number, number, number] | null {
  const m = /#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(css.trim());
  if (m) {
    return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
  }
  return null;
}

interface WalkState {
  b: boolean;
  i: boolean;
  u: boolean;
  size: number;
  color: [number, number, number] | null;
}

function pushToken(out: Run[], text: string, st: WalkState) {
  if (!text) return;
  out.push({ text, b: st.b, i: st.i, u: st.u, size: st.size, color: st.color });
}

function walkInline(node: ChildNode, st: WalkState, out: Run[]) {
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      pushToken(out, child.textContent ?? "", st);
      return;
    }
    if (child.nodeType !== 1) return;
    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const next: WalkState = { ...st };
    if (tag === "b" || tag === "strong") next.b = true;
    if (tag === "i" || tag === "em") next.i = true;
    if (tag === "u" || tag === "ins") next.u = true;
    if (tag === "br") {
      pushToken(out, "\n", next);
      return;
    }
    if (tag === "img") {
      pushToken(out, el.getAttribute("alt") || "(image)", next);
      return;
    }
    if (tag === "span") {
      const style = el.getAttribute("style") ?? "";
      const color = /color:\s*(#[0-9a-fA-F]{3,8})/.exec(style)?.[1];
      if (color && color.length === 7) next.color = parseColor(color) ?? next.color;
      const fsize = /font-size:\s*([0-9.]+)(pt|px)?/.exec(style);
      if (fsize) {
        const v = parseFloat(fsize[1]);
        next.size = Math.max(8, Math.min(72, v * (fsize[2] === "px" ? 0.75 : 1)));
      }
    }
    walkInline(child, next, out);
  });
}

interface BlockLine {
  runs: Run[];
  sp: number;
  rule?: boolean;
}

function splitLines(tokens: Run[]): Run[][] {
  const lines: Run[][] = [[]];
  for (const t of tokens) {
    if (t.text === "\n") {
      lines.push([]);
      continue;
    }
    lines[lines.length - 1].push(t);
  }
  return lines;
}

function parseBlocks(html: string): BlockLine[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const out: BlockLine[] = [];
  doc.body.childNodes.forEach((node) => {
    if (node.nodeType !== 1) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (/^h[1-6]$/.test(tag)) {
      const level = Number(tag[1]);
      const tokens: Run[] = [];
      walkInline(el, { b: true, i: false, u: false, size: Math.max(12, 24 - (level - 1) * 4), color: null }, tokens);
      out.push({ runs: tokens, sp: 14 });
      return;
    }

    if (tag === "ul" || tag === "ol") {
      const ordered = tag === "ol";
      let counter = 0;
      el.querySelectorAll("li").forEach((li) => {
        counter += 1;
        const marker = ordered ? `${counter}. ` : "\u2022 ";
        const tokens: Run[] = [];
        walkInline(li, { b: false, i: false, u: false, size: BASE_SIZE, color: null }, tokens);
        out.push({ runs: [{ text: marker, b: false, i: false, u: false, size: BASE_SIZE, color: null }, ...tokens], sp: 2 });
      });
      return;
    }

    if (tag === "table") {
      el.querySelectorAll("tr").forEach((tr) => {
        const cells: string[] = [];
        tr.querySelectorAll("th, td").forEach((td) => {
          const t = (td.textContent ?? "").trim();
          if (t) cells.push(t);
        });
        out.push({ runs: [{ text: cells.join("  "), b: false, i: false, u: false, size: BASE_SIZE, color: null }], sp: 2 });
      });
      return;
    }

    if (tag === "hr") {
      out.push({ runs: [], sp: 6, rule: true });
      return;
    }

    if (tag === "img") {
      out.push({ runs: [{ text: el.getAttribute("alt") || "(image)", b: false, i: false, u: false, size: BASE_SIZE, color: null }], sp: 2 });
      return;
    }

    const tokens: Run[] = [];
    walkInline(el, { b: false, i: false, u: false, size: BASE_SIZE, color: null }, tokens);
    const lines = splitLines(tokens);
    lines.forEach((line, i) => {
      out.push({ runs: line, sp: i === 0 ? 2 : 0 });
    });
  });
  return out;
}

function wrapTokens(tokens: Run[]): Run[][] {
  const wrapped: Run[][] = [];
  let cur: Run[] = [];
  let curW = 0;
  const addWord = (source: Run, word: string): void => {
    const b = encText(word);
    const w = runWidth(b, source.size);
    if (cur.length > 0 && curW + w > USABLE_W) {
      wrapped.push(cur);
      cur = [];
      curW = 0;
    }
    cur.push({ ...source, text: word });
    curW += w;
  };
  for (const run of tokens) {
    const words = run.text.match(/\S+\s*/g) ?? [];
    for (const word of words) {
      const one = encText(word);
      if (runWidth(one, run.size) > USABLE_W) {
        let piece = "";
        let pw = 0;
        const flush = () => {
          if (!piece) return;
          addWord(run, piece);
          piece = "";
          pw = 0;
        };
        for (const ch of word) {
          const cw = byteWidth(toCpByte(ch.codePointAt(0) ?? 0x3f), run.size);
          if (pw + cw > USABLE_W) flush();
          piece += ch;
          pw += cw;
        }
        flush();
      } else {
        addWord(run, word);
      }
    }
  }
  if (cur.length > 0) wrapped.push(cur);
  if (wrapped.length === 0) wrapped.push([]);
  return wrapped;
}

function layout(html: string): PhysicalLine[][] {
  const blocks = parseBlocks(html);
  const phys: { runs: Run[]; sp: number; rule?: boolean }[] = [];

  for (const blk of blocks) {
    const ruleOnly = blk.rule && blk.runs.length === 0;
    const runs = blk.runs.length ? wrapTokens(blk.runs) : [];
    if (runs.length === 0 && !ruleOnly) continue;
    (ruleOnly ? [[]] : runs).forEach((line, i) => {
      phys.push({ runs: line, sp: i === 0 ? blk.sp : 0, rule: i === 0 ? blk.rule : false });
    });
  }
  if (phys.length === 0) phys.push({ runs: [], sp: 0 });

  const pages: PhysicalLine[][] = [[]];
  let y = TOP;
  phys.forEach((p) => {
    y -= p.sp;
    if (y < BOTTOM + 40) {
      pages.push([]);
      y = TOP;
    }
    const maxSize = p.runs.reduce((m, r) => Math.max(m, r.size), BASE_SIZE);
    y -= maxSize * 1.4;
    if (y < BOTTOM) {
      pages.push([]);
      y = TOP - maxSize * 1.4;
    }
    pages[pages.length - 1].push({ runs: p.runs, y, rule: p.rule });
  });
  return pages;
}

function contentStream(page: PhysicalLine[]): Uint8Array {
  const ops: string[] = [];
  page.forEach((line) => {
    let x = MARGIN;
    line.runs.forEach((run) => {
      const bytes = encText(run.text);
      const w = runWidth(bytes, run.size);
      if (run.color) {
        ops.push(`${run.color[0].toFixed(2)} ${run.color[1].toFixed(2)} ${run.color[2].toFixed(2)} rg`);
      }
      if (run.u) {
        ops.push(`${x.toFixed(2)} ${(line.y - 1.5).toFixed(2)} ${w.toFixed(2)} 0.8 re f`);
      }
      const font = run.b ? "F2" : run.i ? "F3" : "F1";
      const rendered = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
      ops.push(`BT /${font} ${run.size.toFixed(2)} Tf ${x.toFixed(2)} ${line.y.toFixed(2)} Td (${rendered}) Tj ET`);
      x += w;
    });
    if (line.rule) {
      ops.push(`${MARGIN.toFixed(2)} ${(line.y - 2).toFixed(2)} ${USABLE_W.toFixed(2)} 0.8 re f`);
    }
  });
  return encAscii(ops.join("\n"));
}

export function buildPdf(html: string): Uint8Array {
  const pages = layout(html);
  const n = pages.length;
  const fontBase = 3 + 2 * n;
  const pageObj = (i: number) => 3 + i;
  const contentObj = (i: number) => 3 + n + i;
  const fontObj = (k: number) => fontBase + k;

  /* one blob per PDF object; blob 0 is the header (free xref entry). */
  const objs: Uint8Array[] = [encAscii("%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n")];
  const obj = (s: string | Uint8Array) => objs.push(typeof s === "string" ? encAscii(s) : s);

  /* object 1: catalog, 2: pages tree */
  obj(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
  obj(`2 0 obj\n<< /Type /Pages /Kids [${pages.map((_, i) => `${pageObj(i)} 0 R`).join(" ")}] /Count ${n} >>\nendobj\n`);

  /* page objects */
  pages.forEach((_, i) => {
    obj(`${pageObj(i)} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${fontObj(0)} 0 R /F2 ${fontObj(1)} 0 R /F3 ${fontObj(2)} 0 R >> >> /Contents ${contentObj(i)} 0 R >>\n`);
  });

  /* content streams */
  pages.forEach((_, i) => {
    const cs = contentStream(pages[i]);
    obj(concat([
      encAscii(`${contentObj(i)} 0 obj\n<< /Length ${cs.length} >>\nstream\n`),
      cs,
      encAscii(`\nendstream\nendobj\n`),
    ]));
  });

  /* font objects */
  const FONT_NAMES = ["Helvetica", "Helvetica-Bold", "Helvetica-Oblique"];
  FONT_NAMES.forEach((name, k) => {
    obj(`${fontObj(k)} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>\nendobj\n`);
  });

  const offsets: number[] = [];
  let running = 0;
  for (const o of objs) {
    offsets.push(running);
    running += o.length;
  }
  const xrefOffset = running;
  const count = objs.length;
  let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let i = 1; i < count; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return concat([...objs, encAscii(xref)]);
}