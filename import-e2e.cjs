"use strict";
/**
 * End-to-end verification that the BritDocs desktop app really opens Word
 * .docx and RTF files.
 *
 * Real files are written to disk first, then handed to the built executable as
 * an argument, which is the same path the OS uses for a double-click. Nothing
 * is asserted from a status label: the editor's rendered content is checked, so
 * a silent fallback to raw markup cannot pass.
 */
const { spawn, execSync } = require("child_process");
const net = require("net");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const EXE = "D:\\britdocs-target\\debug\\britdocs.exe";
const PORT = 9283;
const WORK = "C:\\Users\\Digital\\AppData\\Local\\Temp\\opencode\\britdoc-import-e2e";
const SEL = ".tiptap.ProseMirror";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
function check(name, ok, extra = "") {
  results.push({ name, ok, extra });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  :: " + extra : ""}`);
}

const kill = () => {
  try {
    execSync("taskkill /f /im britdocs.exe /t", { stdio: "ignore" });
  } catch {
    /* none */
  }
};

async function ensureDead() {
  for (let i = 0; i < 30; i++) {
    kill();
    await sleep(1000);
    let still = false;
    try {
      execSync('tasklist /fi "imagename eq britdocs.exe" | find /i britdocs', { stdio: "ignore" });
      still = true;
    } catch {
      still = false;
    }
    if (!still) return;
  }
}

const whenPort = () =>
  new Promise((res, rej) => {
    const t0 = Date.now();
    (function poll() {
      const s = net.connect({ port: PORT, host: "127.0.0.1" });
      s.on("connect", () => {
        s.destroy();
        res();
      });
      s.on("error", () => {
        s.destroy();
        if (Date.now() - t0 > 240000) rej(new Error("app port timeout"));
        else setTimeout(poll, 1000);
      });
    })();
  });

/* ------------------------------------------------------------------ */
/* Fixture writers                                                     */
/* ------------------------------------------------------------------ */

/** Minimal ZIP writer using stored (uncompressed) entries, which is all the
 *  app's reader supports. */
function zipStore(files) {
  const enc = (s) => Buffer.from(s, "utf8");
  const locals = [];
  const centrals = [];
  let offset = 0;
  const crcTable = (() => {
    const t = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })();
  const crc32 = (buf) => {
    let c = -1;
    for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };

  for (const { name, content } of files) {
    const nameBuf = enc(name);
    const data = enc(content);
    const crc = crc32(data);
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8); // stored
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    nameBuf.copy(local, 30);
    locals.push(local, Buffer.from(data));

    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(20, 8);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    nameBuf.copy(central, 46);
    centrals.push(central);
    offset += local.length + data.length;
  }

  const dir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(dir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, dir, end]);
}

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

const DOCX_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>
<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Word Heading</w:t></w:r></w:p>
<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>BoldFromWord</w:t></w:r><w:r><w:t xml:space="preserve"> plain</w:t></w:r></w:p>
<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>WordBullet</w:t></w:r></w:p>
<w:tbl>
  <w:tr><w:tc><w:p><w:r><w:t>CellA</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>CellB</w:t></w:r></w:p></w:tc></w:tr>
  <w:tr><w:tc><w:p><w:r><w:t>CellC</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>CellD</w:t></w:r></w:p></w:tc></w:tr>
</w:tbl>
<w:p><w:hyperlink r:id="rId7"><w:r><w:t>WordLink</w:t></w:r></w:hyperlink></w:p>
</w:body></w:document>`;

const NUMBERING_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="${W}">
  <w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/></w:lvl></w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>`;

const RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId7" Target="https://example.com/word" TargetMode="External"/>
</Relationships>`;

const RTF = [
  String.raw`{\rtf1\ansi\ansicpg1252\deff0`,
  String.raw`{\fonttbl{\f0\froman Times New Roman;}}`,
  String.raw`{\colortbl ;\red255\green0\blue0;}`,
  String.raw`{\*\generator Riched20 10.0;}`,
  String.raw`{\info{\title Should never show up}}`,
  String.raw`{\pict\wmetafile8 NGsPfseq0g00000}`,
  String.raw`\viewkind4\uc1\pard\sa200\sl252\slmult1`,
  // \plain resets character formatting, so the size must follow it, as Word writes it.
  String.raw`\pard\plain\f0\fs22 \b RTFBold\b0  \i RTFItalic\i0 \par`,
  String.raw`\pard\plain\f0\fs22 \cf1 RTFRed\cf0\par`,
  String.raw`\pard\plain\f0\fs22 \qc RTFCentred\par`,
  String.raw`\pard\plain\f0\fs22 {\field{\*\fldinst {HYPERLINK "https://example.com/rtf" }}{\fldrslt {\ul RTFLink}}}\par`,
  String.raw`\pard\plain\f0\fs22 \li720 RTFIndented\par`,
  String.raw`}`,
].join("");

/* ------------------------------------------------------------------ */
/* App launch                                                          */
/* ------------------------------------------------------------------ */

async function launch(file) {
  await ensureDead();
  const env = Object.assign({}, process.env, {
    WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: "--remote-debugging-port=" + PORT,
  });
  const child = spawn(EXE, file ? [file] : [], { env, stdio: ["ignore", "pipe", "pipe"] });
  let appLog = "";
  child.stdout.on("data", (d) => (appLog += d.toString()));
  child.stderr.on("data", (d) => (appLog += d.toString()));
  child.on("exit", (code) => {
    if (code !== 0 && code !== null) console.log(`   [app exited code=${code}] ${appLog.slice(-600)}`);
  });
  await whenPort();

  let c = null;
  let lastErr = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      c = await chromium.connectOverCDP("http://127.0.0.1:" + PORT);
      if ((c.contexts()[0]?.pages() ?? []).length) break;
      c = null;
    } catch (err) {
      lastErr = err;
      c = null;
    }
    await sleep(1500);
  }
  if (!c) throw lastErr || new Error("could not attach over CDP");

  let p = null;
  for (let i = 0; i < 20; i++) {
    const pages = c.contexts()[0]?.pages() ?? [];
    p = pages.find((pg) => /tauri\.localhost|127\.0\.0\.1/.test(pg.url())) ?? pages[0] ?? null;
    if (p) break;
    await sleep(1000);
  }
  if (!p) throw new Error("no app page");

  p.setDefaultTimeout(45000);
  await p.waitForSelector(SEL, { timeout: 45000 });
  return { client: c, page: p };
}

/** Wait until the editor has stopped changing, then return its content. */
async function settledEditor(p) {
  let prev = null;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    const cur = await p.evaluate((s) => {
      const el = document.querySelector(s);
      return el ? el.innerHTML : null;
    }, SEL);
    if (cur && cur === prev) return cur;
    prev = cur;
  }
  return prev;
}

const editorText = (p) => p.evaluate((s) => document.querySelector(s)?.innerText ?? "", SEL);

async function main() {
  fs.mkdirSync(WORK, { recursive: true });
  const docxPath = path.join(WORK, "Sample.docx");
  const rtfPath = path.join(WORK, "Sample.rtf");
  fs.writeFileSync(
    docxPath,
    zipStore([
      { name: "[Content_Types].xml", content: "" },
      { name: "word/document.xml", content: DOCX_XML },
      { name: "word/numbering.xml", content: NUMBERING_XML },
      { name: "word/_rels/document.xml.rels", content: RELS_XML },
    ]),
  );
  fs.writeFileSync(rtfPath, RTF, "latin1");

  console.log("--- .docx ---");
  let { client, page } = await launch(docxPath);
  try {
    let html = await settledEditor(page);
    const text = await editorText(page);
    check("docx: heading imported", html.includes("<h1") && text.includes("Word Heading"), text.slice(0, 80));
    check("docx: bold run imported", html.includes("<strong") && text.includes("BoldFromWord"));
    check("docx: plain text imported", text.includes("plain"));
    check("docx: bullet list imported", html.includes("<ul") && text.includes("WordBullet"));
    check("docx: table imported", html.includes("<table") && html.includes("<td") && text.includes("CellA") && text.includes("CellD"));
    check("docx: two table rows", (html.match(/<tr/g) ?? []).length >= 2, String((html.match(/<tr/g) ?? []).length));
    check("docx: hyperlink imported", html.includes('href="https://example.com/word"') && text.includes("WordLink"));
    check("docx: no raw markup leaked", !html.includes("w:tbl") && !html.includes("<w:") && !html.includes("WordHeading"));
    const tabs = await page.evaluate(() => [...document.querySelectorAll("[role=tab], .tab")].map((n) => n.textContent ?? "").join("|"));
    check("docx: tab titled from the file", /Sample/i.test(tabs), tabs.slice(0, 120));
  } finally {
    await client.close().catch(() => {});
    kill();
  }

  console.log("--- .rtf ---");
  ({ client, page } = await launch(rtfPath));
  try {
    const html = await settledEditor(page);
    const text = await editorText(page);
    check("rtf: bold run imported", html.includes("<strong") && text.includes("RTFBold"));
    check("rtf: italic run imported", html.includes("<em") && text.includes("RTFItalic"));
    check("rtf: font size imported", /font-size:\s*(11pt|14\.6\dpx)/.test(html), (html.match(/font-size:[^;"']*/) ?? ["none"])[0]);
    check("rtf: colour imported and reset", /color:\s*rgb\(255,\s*0,\s*0\)/.test(html) && (html.match(/color:/g) ?? []).length === 1);
    check("rtf: centred paragraph imported", /text-align:\s*center/.test(html) && text.includes("RTFCentred"));
    check("rtf: indent imported", /margin-left/.test(html) && text.includes("RTFIndented"));
    check("rtf: hyperlink imported", html.includes('href="https://example.com/rtf"') && text.includes("RTFLink"));
    check("rtf: no raw control words leaked", !html.includes("\\pard") && !html.includes("\\b") && !html.includes("{\\rtf1"));
    check("rtf: destination metadata skipped", !text.includes("generator") && !text.includes("Should never show up") && !text.includes("NGsPfseq"));
    const tabs = await page.evaluate(() => [...document.querySelectorAll("[role=tab], .tab")].map((n) => n.textContent ?? "").join("|"));
    check("rtf: tab titled from the file", /Sample/i.test(tabs), tabs.slice(0, 120));
  } finally {
    await client.close().catch(() => {});
    kill();
  }
}

main()
  .then(() => {
    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
    process.exit(failed.length ? 1 : 0);
  })
  .catch((err) => {
    console.error("ERROR", err);
    kill();
    process.exit(2);
  });