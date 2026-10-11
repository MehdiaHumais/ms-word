// Generates BritDocs app icons (PNG + ICO) into src-tauri/icons without any
// external dependencies. Solid blue tile with a white "B", like Word's mark.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src-tauri", "icons");
mkdirSync(OUT, { recursive: true });

const BG = [0x18, 0x5a, 0xbd];
const BG_EDGE = [0x0f, 0x3e, 0x8a];
const WHITE = [255, 255, 255];

// Coarse "B" glyph (6 wide x 9 tall).
const GLYPH = [
  "###.#.",
  "#....#",
  "#....#",
  "#....#",
  "###.#.",
  "#....#",
  "#....#",
  "#....#",
  "###.#.",
];

const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = (crcTable[(c ^ buf[i]) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function makePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = size * 4;
  const rows = Buffer.alloc(size * (1 + stride));
  for (let y = 0; y < size; y++) {
    rows[y * (1 + stride)] = 0;
    rgba.copy(rows, y * (1 + stride) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(rows, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function draw(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const gcw = GLYPH[0].length;
  const gch = GLYPH.length;
  const cell = Math.floor(size / 11);
  const glyphW = gcw * cell;
  const glyphH = gch * cell;
  const ox = Math.floor((size - glyphW) / 2);
  const oy = Math.floor((size - glyphH) / 2);
  const r = size * 0.2;
  const edge = Math.max(1, size * 0.02);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = Math.max(
        Math.abs(x + 0.5 - size / 2) - (size / 2 - r),
        0,
      );
      const dy = Math.max(
        Math.abs(y + 0.5 - size / 2) - (size / 2 - r),
        0,
      );
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > r) continue; // transparent corner
      const nearEdge =
        dist > r - edge || x < edge || y < edge || x > size - 1 - edge || y > size - 1 - edge;
      let color = nearEdge ? BG_EDGE : BG;
      const gx = Math.floor((x - ox) / cell);
      const gy = Math.floor((y - oy) / cell);
      if (gx >= 0 && gx < gcw && gy >= 0 && gy < gch && GLYPH[gy]?.[gx] === "#") {
        color = WHITE;
      }
      rgba[i] = color[0];
      rgba[i + 1] = color[1];
      rgba[i + 2] = color[2];
      rgba[i + 3] = 255;
    }
  }
  return makePng(size, rgba);
}

function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length;
  const dirs = [];
  const parts = [];
  for (const e of entries) {
    const d = Buffer.alloc(16);
    d[0] = e.size >= 256 ? 0 : e.size;
    d[1] = e.size >= 256 ? 0 : e.size;
    d[2] = 0;
    d[3] = 0;
    d.writeUInt16LE(1, 4);
    d.writeUInt16LE(32, 6);
    d.writeUInt32LE(e.buf.length, 8);
    d.writeUInt32LE(offset, 12);
    dirs.push(d);
    parts.push(e.buf);
    offset += e.buf.length;
  }
  return Buffer.concat([header, ...dirs, ...parts]);
}

const p32 = draw(32);
const p48 = draw(48);
const p128 = draw(128);
const p256 = draw(256);
const p512 = draw(512);

writeFileSync(join(OUT, "32x32.png"), p32);
writeFileSync(join(OUT, "128x128.png"), p128);
writeFileSync(join(OUT, "128x128@2x.png"), p256);
writeFileSync(join(OUT, "icon.png"), p512);
writeFileSync(
  join(OUT, "icon.ico"),
  buildIco([
    { size: 48, buf: p48 },
    { size: 32, buf: p32 },
    { size: 256, buf: p256 },
  ]),
);
console.log("icons written to", OUT);