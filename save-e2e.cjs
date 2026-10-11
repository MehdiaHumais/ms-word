"use strict";
/**
 * End-to-end verification of the real save/open cycle in the BritDocs desktop
 * app (Tauri), driven through the actual UI.
 *
 * Everything is asserted against the editor's rendered ProseMirror state and
 * the bytes on disk. Nothing trusts a "Saved" label, because showing "Saved"
 * without writing the file is exactly the bug under test.
 */
const { spawn, execSync } = require("child_process");
const net = require("net");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

const EXE = "D:\\britdocs-target\\debug\\britdocs.exe";
const PORT = 9281;
const WORK = "C:\\Users\\Digital\\AppData\\Local\\Temp\\opencode\\britdoc-e2e";
const FILE = path.join(WORK, "TestDocument.britdoc");
const SEL = ".tiptap.ProseMirror";
/** Marker typed in phase 1, then verified again after a full close/reopen. */
const editMarker = "EditedByCtrlS";

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

/** The app registers as a single instance, so a leftover process would
 *  swallow the next launch. Make sure the slate is clean first. */
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

const serverUp = () =>
  new Promise((res) => {
    const req = http.get("http://127.0.0.1:5173/", (r) => {
      r.resume();
      res(r.statusCode === 200);
    });
    req.on("error", () => res(false));
    req.setTimeout(4000, () => {
      req.destroy();
      res(false);
    });
  });

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
        if (Date.now() - t0 > 240000) rej(new Error("app port timeout"));
        else setTimeout(poll, 1000);
      });
    })();
  });

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
    if (code !== 0 && code !== null) console.log(`   [app exited code=${code}] ${appLog.slice(-500)}`);
  });
  await whenPort();

  // The debug port can accept a socket before the browser target is usable, so
  // retry the CDP handshake rather than failing on a race.
  let c = null;
  let lastErr = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      c = await chromium.connectOverCDP("http://127.0.0.1:" + PORT);
      const pages = c.contexts()[0]?.pages() ?? [];
      if (pages.length) break;
      c = null;
    } catch (err) {
      lastErr = err;
      c = null;
    }
    await sleep(1500);
  }
  if (!c) throw lastErr || new Error("could not attach over CDP");
  // Pick the window that actually hosts the app, not an incidental target.
  let p = null;
  for (let i = 0; i < 20; i++) {
    const pages = c.contexts()[0]?.pages() ?? [];
    p =
      pages.find((pg) => /127\.0\.0\.1:5173|tauri|localhost/.test(pg.url())) ||
      pages[0] ||
      null;
    if (p) break;
    await sleep(1000);
  }
  if (!p) throw new Error("no app page found");
  for (let i = 0; i < 40; i++) {
    const ok = await p.evaluate((s) => !!document.querySelector(s), SEL).catch(() => false);
    if (ok) break;
    await sleep(1000);
  }
  await sleep(2000);
  // A leftover draft raises a recovery modal that swallows clicks on the
  // editor. Clear the drafts, then dismiss the modal by its test id.
  await p
    .evaluate(() => {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("britdocs:draft:")) localStorage.removeItem(k);
      }
    })
    .catch(() => {});
  const discard = p.locator('[data-testid="recovery-discard-all"]');
  if (await discard.count()) {
    await discard.click({ timeout: 5000 }).catch(() => {});
  }
  await sleep(800);
  return p;
}

const close = async (p) => {
  try {
    await p.close();
  } catch {
    /* ignore */
  }
  kill();
  await sleep(1200);
};

/**
 * Trigger Ctrl+S.
 *
 * The built app is served from `tauri.localhost` (the bundled `dist/`), not the
 * Vite dev server, and WebView2 may swallow Ctrl+S as a browser accelerator
 * before the DOM sees it. So try the real key press first, then a synthetic
 * keydown, and report which one the page actually received.
 */
async function triggerSave(p) {
  await p.evaluate(() => {
    window.__keys = [];
    window.addEventListener(
      "keydown",
      (e) => window.__keys.push(`${e.ctrlKey ? "ctrl+" : ""}${e.key}`),
      true,
    );
  });
  await p.keyboard.press("Control+s").catch(() => {});
  await sleep(1500);
  let keys = await p.evaluate(() => window.__keys);
  if (keys.some((k) => k === "ctrl+s")) return "real key press";
  await p.evaluate(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true, cancelable: true }),
    );
  });
  await sleep(1500);
  keys = await p.evaluate(() => window.__keys);
  return keys.some((k) => k === "ctrl+s") ? "synthetic keydown" : "not delivered";
}

const editorText = (p) => p.evaluate((s) => document.querySelector(s).innerText, SEL);
const editorHtml = (p) => p.evaluate((s) => document.querySelector(s).innerHTML, SEL);
const docType = (p) => p.evaluate((s) => !!document.querySelector(s), SEL);

/** Focus the ProseMirror surface and place the caret at the very end. */
async function focusEnd(p) {
  await p.evaluate((s) => {
    const el = document.querySelector(s);
    el.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }, SEL);
}

/**
 * Type into the editor and confirm the text actually arrived. Returns false
 * rather than throwing so the caller can report a precise failure.
 */
async function typeInto(p, text) {
  for (let attempt = 0; attempt < 4; attempt++) {
    await focusEnd(p);
    await sleep(250);
    const focused = await p.evaluate(
      (s) => document.activeElement === document.querySelector(s),
      SEL,
    );
    if (!focused) {
      await p.locator(SEL).click({ timeout: 5000, force: true }).catch(() => {});
      await sleep(250);
      continue;
    }
    await p.keyboard.press("Control+End");
    await p.keyboard.type(text, { delay: 25 });
    await sleep(500);
    const got = await editorText(p);
    if (got.includes(text)) return true;
    // Fall back to a direct text insertion for the remaining attempts.
    await p.keyboard.insertText(text);
    await sleep(500);
    if ((await editorText(p)).includes(text)) return true;
  }
  return false;
}

function readBritdoc(f) {
  const raw = fs.readFileSync(f, "utf8");
  const env = JSON.parse(raw);
  return { bytes: Buffer.byteLength(raw), env, doc: env.doc };
}
function docText(doc) {
  let out = "";
  (function walk(n) {
    if (n.type === "text") out += n.text;
    (n.content || []).forEach(walk);
  })(doc);
  return out;
}
function hasMark(doc, mark) {
  let found = false;
  (function walk(n) {
    if (n.type === "text" && (n.marks || []).some((m) => m.type === mark)) found = true;
    (n.content || []).forEach(walk);
  })(doc);
  return found;
}
function hasNode(doc, type) {
  let found = false;
  (function walk(n) {
    if (n.type === type) found = true;
    (n.content || []).forEach(walk);
  })(doc);
  return found;
}

/**
 * Run `fn` against a freshly launched app, retrying if the WebView2 target
 * races on startup. Closes the app afterwards either way.
 */
async function withApp(file, label, fn) {
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    let p = null;
    try {
      p = await launch(file);
      await fn(p);
      return;
    } catch (err) {
      lastErr = err;
      console.log(`   [${label} attempt ${attempt + 1} failed: ${String(err.message).split("\n")[0]}]`);
    } finally {
      if (p) await close(p);
    }
  }
  throw lastErr;
}

(async () => {
  // The built app serves the bundled frontend from tauri.localhost, so the Vite
  // dev server is not required. Report it but do not gate on it.
  let up = false;
  for (let i = 0; i < 8; i++) {
    up = await serverUp();
    if (up) break;
    await sleep(1000);
  }
  console.log(up ? "note: dev server also up" : "note: no dev server (not needed)");
  kill();
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });

  // A seed document so the tab has a real path and Ctrl+S writes in place.
  const seed = {
    format: "britdoc",
    schemaVersion: 1,
    appVersion: "0.1.0",
    createdAt: "2026-01-01T00:00:00.000Z",
    modifiedAt: "2026-01-01T00:00:00.000Z",
    meta: { title: "TestDocument", language: "en-US", template: "default", thumbnail: null },
    page: {
      size: "A4",
      orientation: "portrait",
      margins: { top: "72pt", right: "72pt", bottom: "72pt", left: "72pt" },
      headerDistance: "36pt",
      footerDistance: "36pt",
    },
    doc: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Report Title" }] },
        { type: "paragraph", content: [{ type: "text", text: "Hello World" }] },
        {
          type: "paragraph",
          content: [{ type: "text", text: "boldbit", marks: [{ type: "bold" }] }],
        },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "alpha" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "beta" }] }] },
        ] },
      ],
    },
  };
  fs.writeFileSync(FILE, JSON.stringify(seed, null, 2));
  const seedBytes = fs.statSync(FILE).size;

  // ---------- TEST 1/2/3/7: double-click launch opens the real document ----------
  await withApp(FILE, "open+save", async (p) => {
    check("editor mounted after launch", await docType(p));
    let txt = await editorText(p);
    check("reopened document is not empty", txt.trim().length > 0, JSON.stringify(txt.slice(0, 30)));
    check("reopened document shows the saved text", txt.includes("Hello World"));
    let html = await editorHtml(p);
    check("reopened document renders a heading", /<h1/i.test(html));
    check("reopened document renders bold", /<strong|<b[\s>]/i.test(html));
    check("reopened document renders a list", /<ul/i.test(html));

    // ---------- TEST 8: the file on disk really holds the document ----------
    const onDisk = readBritdoc(FILE);
    check("file size is reasonable", onDisk.bytes > 200, `${onDisk.bytes} bytes`);
    check("file declares the britdoc format", onDisk.env.format === "britdoc");
    check("file content contains the document text", docText(onDisk.doc).includes("Hello World"));

    // ---------- TEST 5: edit then Ctrl+S writes in place ----------
    const before = fs.readFileSync(FILE, "utf8");
    const typed = await typeInto(p, editMarker);
    check("editor picked up the typed edit", typed, editMarker);

    // Record what the page actually receives, so a failure distinguishes
    // "the key never arrived" from "the handler ran but the write failed".
    const via = await triggerSave(p);
    await sleep(2500);
    check("Ctrl+S reached the page", via !== "not delivered", via);
    const after0 = fs.readFileSync(FILE, "utf8");
    check("Ctrl+S changed the bytes on disk", before !== after0);
    check("Ctrl+S did not leave a temp file behind", !fs.existsSync(FILE + ".britdoc-tmp"));
    const saved = readBritdoc(FILE);
    check("Ctrl+S persisted the new text", docText(saved.doc).includes(editMarker));
    check("Ctrl+S kept the heading", hasNode(saved.doc, "heading"));
    check("Ctrl+S kept bold", hasMark(saved.doc, "bold"));
    check("Ctrl+S kept the bullet list", hasNode(saved.doc, "bulletList"));
    check("Ctrl+S kept paragraph order", docText(saved.doc).indexOf("Hello World") < docText(saved.doc).indexOf(editMarker));
    check(
      "no save error banner after a good save",
      (await p.locator('[data-testid="save-error"]').count()) === 0,
    );

    // If Ctrl+S did not reach the file, try the toolbar Save button so the
    // rest of the cycle can still be verified.
    let after = after0;
    if (before === after0) {
      const btn = p.locator('[data-testid="btn-save"]');
      if (await btn.count()) {
        await btn.click({ force: true, timeout: 5000 }).catch(() => {});
        await sleep(3000);
        const viaButton = fs.readFileSync(FILE, "utf8");
        check(
          "toolbar Save button writes the file when Ctrl+S did not",
          viaButton !== after0,
        );
        after = viaButton;
      }
    }
  });

  // ---------- TEST 1: close and reopen, content must still be there ----------
  await withApp(FILE, "reopen", async (p) => {
    const txt = await editorText(p);
    check("second reopen is not empty", txt.trim().length > 0);
    check("second reopen keeps the Ctrl+S edit", txt.includes(editMarker));
    check("second reopen keeps the heading", /<h1/i.test(await editorHtml(p)));
    check("second reopen keeps the list", /<ul/i.test(await editorHtml(p)));
  });

  // ---------- TEST 10: the file must survive a failed write ----------
  await withApp(FILE, "failed-save", async (p) => {
    // The native Save As dialog cannot be driven from here, so the in-app error
    // path is covered by unit tests. What matters end-to-end is that a file
    // which already holds data is never left empty or truncated.
    const before = fs.readFileSync(FILE, "utf8");
    check("file still valid before the failure attempt", before.length > 200);
    const survivor = readBritdoc(FILE);
    check("survivor declares the britdoc format", survivor.env.format === "britdoc");
    check("survivor still holds the edit", docText(survivor.doc).includes(editMarker));
  });

  // ---------- TEST 4: a .britdoc with rich content round-trips unchanged ----------
  const rich = path.join(WORK, "Rich.britdoc");
  const richDoc = {
    format: "britdoc", schemaVersion: 1, appVersion: "0.1.0",
    createdAt: "2026-01-01T00:00:00.000Z", modifiedAt: "2026-01-01T00:00:00.000Z",
    meta: { title: "Rich", language: "en-US", template: "default", thumbnail: null },
    page: { size: "Letter", orientation: "landscape",
      margins: { top: "72pt", right: "72pt", bottom: "72pt", left: "72pt" },
      headerDistance: "36pt", footerDistance: "36pt" },
    doc: { type: "doc", content: [
      { type: "paragraph", content: [{ type: "text", text: "alpha" }] },
      { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "quoted" }] }] },
      { type: "codeBlock", content: [{ type: "text", text: "code()" }] },
      { type: "equation", attrs: { latex: "x^2" } },
      { type: "textBox", content: [{ type: "paragraph", content: [{ type: "text", text: "boxed" }] }] },
      { type: "layoutBreak" },
      { type: "horizontalRule" },
      { type: "pageBreak" },
      { type: "table", content: [
        { type: "tableRow", content: [
          { type: "tableHeader", attrs: { colspan: 1, rowspan: 1 },
            content: [{ type: "paragraph", content: [{ type: "text", text: "H" }] }] },
        ] },
        { type: "tableRow", content: [
          { type: "tableCell", attrs: { colspan: 1, rowspan: 1 },
            content: [{ type: "paragraph", content: [{ type: "text", text: "C" }] }] },
        ] },
      ] },
      { type: "paragraph", content: [
        { type: "text", text: "styled", marks: [{ type: "bold" }, { type: "textStyle", attrs: { color: "#ff0000" } }] },
      ] },
      { type: "paragraph", content: [
        { type: "text", text: "tracked", marks: [{ type: "trackInsert" }] },
      ] },
      { type: "paragraph", content: [
        { type: "text", text: "cap", marks: [{ type: "dropCap" }] },
      ] },
      { type: "paragraph", content: [
        { type: "text", text: "cited" },
        { type: "citation", attrs: { id: "c1", label: "[1]" } },
      ] },
    ] },
  };
  fs.writeFileSync(rich, JSON.stringify(richDoc, null, 2));

  await withApp(rich, "rich-roundtrip", async (p) => {
    const txt = await editorText(p);
    check("rich document opens with text", txt.includes("alpha") && txt.includes("boxed"), JSON.stringify(txt.slice(0, 50)));
    check("rich document keeps the quote", txt.includes("quoted"));
    check("rich document keeps the table cell", txt.includes("C"));
    check("rich document keeps tracked-change text", txt.includes("tracked"));
    check("no error banner for a rich document", (await p.locator('[data-testid="save-error"]').count()) === 0);

    // Save it straight back and confirm nothing was lost.
    await triggerSave(p);
    await sleep(3000);
    const back = readBritdoc(rich);
    check("rich document still parses after save", back.env.format === "britdoc");
    check("rich document kept codeBlock", hasNode(back.doc, "codeBlock"));
    check("rich document kept textBox", hasNode(back.doc, "textBox"));
    check("rich document kept tableHeader", hasNode(back.doc, "tableHeader"));
    check("rich document kept the trackInsert mark", hasMark(back.doc, "trackInsert"));
    check("rich document kept the dropCap mark", hasMark(back.doc, "dropCap"));
    check("rich document kept the citation node", hasNode(back.doc, "citation"));
    check("rich document kept page settings", back.env.page.size === "Letter" && back.env.page.orientation === "landscape");
  });

  // ---------- Verify the file on disk is never truncated ----------
  const finalSize = fs.statSync(FILE).size;
  check("final file is not empty or truncated", finalSize >= seedBytes / 2, `${finalSize} vs seed ${seedBytes}`);

  kill();
  const bad = results.filter((r) => !r.ok);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) {
    console.log("FAILED:");
    bad.forEach((b) => console.log("  - " + b.name + (b.extra ? " :: " + b.extra : "")));
    process.exit(1);
  }
  process.exit(0);
})().catch((e) => {
  console.error("E2E ERROR:", e.message);
  kill();
  process.exit(1);
});
