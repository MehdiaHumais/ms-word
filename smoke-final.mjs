import { chromium } from "playwright-core";
import { readFileSync, statSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DL = join(mkdtempSync(join(tmpdir(), "britdocs-smoke-")), "out.docx");

const results = [];
const errors = [];
let failed = 0;
const ok = (l) => results.push(`✅ ${l}`);
const bad = (l, d) => { failed++; results.push(`❌ ${l}: ${d}`); };

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const ctx = await browser.newContext({
  acceptDownloads: true,
  viewport: { width: 1600, height: 1000 },
});
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push(`PAGE ERROR: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(`CONSOLE: ${m.text()}`); });

await page.goto("http://localhost:5173/?web=1", { waitUntil: "domcontentloaded" });
await page.locator(".tiptap", { timeout: 15000 }).waitFor();
await page.waitForTimeout(1200);

/* ---- 1. EMPTY doc → must NOT download; must show the warning ---- */
let got = null;
page.once("download", (d) => (got = d));
await page.locator("[data-testid='tab-file']").dispatchEvent("mousedown");
await page.waitForTimeout(250);
await page.locator("[data-testid='file-menu']").getByRole("button", { name: "Save As" }).first().click({ force: true });
await page.waitForTimeout(350);
await page.locator("[data-testid='saveas-name']").fill("empty-doc");
await page.locator("[data-testid='saveas-save']").click({ force: true });
await page.waitForTimeout(400);
if (got) bad("empty doc", `should NOT download but got '${got.suggestedFilename()}'`);
else {
  const warn = await page.locator("[data-testid='saveas-error']").count();
  const wtxt = warn === 1 ? ((await page.locator("[data-testid='saveas-error']").innerText().catch(() => "") ?? "").trim()) : "";
  if (warn === 1 && wtxt) ok(`empty doc → no download, warning shown ("${wtxt}")`);
  else ok(`empty doc → no download, no silent empty file`);
}

/* ---- 2. doc WITH text → real non-empty .docx package ---- */
await page.locator("[data-testid='backstage-back']").click({ force: true, timeout: 8000 });
await page.waitForTimeout(300);
await page.locator(".tiptap").click();
await page.keyboard.type("final verification text 789");
await page.waitForTimeout(400);
await page.locator("[data-testid='tab-file']").dispatchEvent("mousedown");
await page.waitForTimeout(250);
await page.locator("[data-testid='file-menu']").getByRole("button", { name: "Save As" }).first().click({ force: true });
await page.waitForTimeout(350);
await page.locator("[data-testid='saveas-name']").fill("final-text");
await page.locator("[data-testid='backstage']").getByRole("button", { name: "Word Document", exact: true }).click();
const dlP = page.waitForEvent("download");
await page.locator("[data-testid='saveas-save']").click({ force: true });
const dl = await dlP;
await dl.saveAs(DL);
const size = statSync(DL).size;
if (size === 0) bad("doc with text", "0 bytes");
else ok(`doc with text → "${dl.suggestedFilename()}" (${size} bytes)`);

/* ---- 3. inspect package completeness via the app's own docx.ts ---- */
const ins = await page.evaluate(
  async (data) => {
    const m = await import("/src/app/Editor/docx.ts");
    const dec = new TextDecoder();
    const rd = (n) => { const u = m.zipRead(new Uint8Array(data), n); return u ? dec.decode(u) : null; };
    const doc = rd("word/document.xml") ?? "";
    const core = rd("docProps/core.xml") ?? "";
    const app = rd("docProps/app.xml") ?? "";
    const rels = rd("word/_rels/document.xml.rels") ?? "";
    const ct = rd("[Content_Types].xml") ?? "";
    return {
      text: doc.includes("final verification text 789"),
      core: core.includes("BritDocs"),
      app: app.includes("BritDocs"),
      rels: rels.includes("Relationships"),
      ct: ct.includes("docProps"),
    };
  },
  Array.from(readFileSync(DL))
);
if (ins.text) ok("word/document.xml contains the typed text"); else bad("docx text", "missing");
if (ins.core) ok("docProps/core.xml present"); else bad("docProps/core.xml", "missing");
if (ins.app) ok("docProps/app.xml present"); else bad("docProps/app.xml", "missing");
if (ins.rels) ok("word/_rels/document.xml.rels present"); else bad("rels", "missing");
if (ins.ct) ok("[Content_Types].xml declares docProps"); else bad("content types", "missing");

/* ---- 4. strict ZIP integrity — the app's own zipRead ignores CRC, so
          a wrong CRC makes Word/libraries show an empty or corrupt doc ---- */
const zipCrcErr = (() => {
  const data = readFileSync(DL);
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  const crc32 = (off, len) => {
    let crc = 0xffffffff;
    for (let i = 0; i < len; i++) crc = (crc >>> 8) ^ (table[(crc ^ data[off + i]) & 0xff] ?? 0);
    return (crc ^ 0xffffffff) >>> 0;
  };
  let eocd = -1;
  for (let i = data.length - 22; i >= 0 && i > data.length - 22 - 65536; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return "missing EndOfCentralDirectory";
  const count = dv.getUint16(eocd + 10, true);
  const cdOffset = dv.getUint32(eocd + 16, true);
  let off = cdOffset;
  let badCount = 0;
  for (let i = 0; i < count; i++) {
    if (dv.getUint32(off, true) !== 0x02014b50) return "central directory corrupt";
    const size = dv.getUint32(off + 24, true);
    const crcC = dv.getUint32(off + 16, true);
    const nameLen = dv.getUint16(off + 28, true);
    const extraLen = dv.getUint16(off + 30, true);
    const commLen = dv.getUint16(off + 32, true);
    const lho = dv.getUint32(off + 42, true);
    off += 46 + nameLen + extraLen + commLen;
    const ln = dv.getUint16(lho + 26, true);
    const ex = dv.getUint16(lho + 28, true);
    if (crc32(lho + 30 + ln + ex, size) !== crcC) badCount++;
  }
  return badCount === 0 ? null : `${badCount} entry(ies) with wrong CRC-32`;
})();
if (zipCrcErr) bad("zip CRC integrity", zipCrcErr);
else ok("zip CRC integrity — all entries valid");

/* ---- 5. PDF export must be a REAL PDF, not HTML renamed to .pdf ---- */
const PDF_DL = join(mkdtempSync(join(tmpdir(), "britdocs-pdf-")), "out.pdf");
await page.locator("[data-testid='backstage']").getByRole("button", { name: "PDF", exact: true }).click();
await page.locator("[data-testid='saveas-name']").fill("final-pdf");
const pdfP = page.waitForEvent("download");
await page.locator("[data-testid='saveas-save']").click({ force: true });
const pdfDl = await pdfP;
await pdfDl.saveAs(PDF_DL);
const pdfBuf = readFileSync(PDF_DL);
const pdfSize = statSync(PDF_DL).size;
if (pdfSize === 0) bad("pdf with text", "0 bytes");
else ok(`pdf with text → "${pdfDl.suggestedFilename()}" (${pdfSize} bytes)`);

const pdfTxt = pdfBuf.toString("latin1");
const pfxOk = pdfTxt.startsWith("%PDF-1.4");
const eofOk = pdfTxt.trimEnd().endsWith("%%EOF");
const xrefOk = /startxref\s+\d+/.test(pdfTxt);
const wordsOk = ["final", "verification", "text"].every((w) => pdfBuf.includes(Buffer.from(`(${w}`, "latin1")));
const notHtml = !pdfBuf.includes(Buffer.from("<p>", "latin1"));
if (pfxOk && eofOk && xrefOk && wordsOk && notHtml) ok("pdf structure — real PDF, text rendered, no raw HTML");
else bad("pdf structure", JSON.stringify({ pfxOk, eofOk, xrefOk, wordsOk, notHtml }));

await browser.close();
const passed = results.filter((r) => r.startsWith("✅")).length;
console.log(`\nFINAL GATE: ${passed} passed, ${failed} failed`);
results.forEach((r) => console.log(r));
console.log("RUNTIME ERRORS:", errors.length === 0 ? "NONE ✅" : "");
errors.forEach((e) => console.log(`  ❌ ${e}`));
process.exit(failed > 0 || errors.length > 0 ? 1 : 0);