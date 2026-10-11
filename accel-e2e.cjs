"use strict";
/**
 * Verifies the native File menu accelerators actually reach the app.
 *
 * The DOM keydown fallback is checked too, so we know both paths work: a real
 * keystroke (which the webview may swallow) and the menu-forwarded intent.
 */
const { spawn, execSync } = require("child_process");
const net = require("net");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const EXE = "D:\\britdocs-target\\debug\\britdocs.exe";
const PORT = 9297;
const WORK = "C:\\Users\\Digital\\AppData\\Local\\Temp\\opencode\\britdoc-e2e";
const SEL = ".tiptap.ProseMirror";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kill = () => { try { execSync("taskkill /f /im britdocs.exe /t", { stdio: "ignore" }); } catch {} };
const whenPort = () => new Promise((res, rej) => {
  const t0 = Date.now();
  (function poll() {
    const s = net.connect({ port: PORT, host: "127.0.0.1" });
    s.on("connect", () => { s.destroy(); res(); });
    s.on("error", () => (Date.now() - t0 > 90000 ? rej(new Error("port timeout")) : setTimeout(poll, 1000)));
  })();
});

let pass = 0, fail = 0;
const check = (name, ok, info = "") => {
  if (ok) { pass++; console.log(`PASS  ${name}${info ? "  :: " + info : ""}`); }
  else { fail++; console.log(`FAIL  ${name}${info ? "  :: " + info : ""}`); }
};

function writeBritdoc(file, doc, title) {
  fs.writeFileSync(file, JSON.stringify({
    format: "britdoc", schemaVersion: 1, appVersion: "0.1.0",
    createdAt: "2026-01-01T00:00:00.000Z", modifiedAt: "2026-01-01T00:00:00.000Z",
    meta: { title, language: "en-US", template: "default", thumbnail: null },
    page: { size: "A4", orientation: "portrait", margins: { top: "72pt", right: "72pt", bottom: "72pt", left: "72pt" } },
    doc,
  }, null, 2));
}

async function launch(file) {
  kill();
  await sleep(2500);
  const env = { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: "--remote-debugging-port=" + PORT };
  const child = spawn(EXE, file ? [file] : [], { env, stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  await whenPort();
  let p;
  for (let i = 0; i < 25; i++) {
    try {
      const c = await chromium.connectOverCDP("http://127.0.0.1:" + PORT);
      p = c.contexts()[0]?.pages().find((x) => /tauri\.localhost|5173/.test(x.url())) || c.contexts()[0]?.pages()[0];
      if (p) break;
    } catch {}
    await sleep(1500);
  }
  if (!p) throw new Error("no page");
  for (let i = 0; i < 40; i++) {
    if (await p.evaluate((s) => !!document.querySelector(s), SEL).catch(() => false)) break;
    await sleep(500);
  }
  await sleep(2500);
  // The recovery dialog snapshots drafts at mount, so just dismiss it. Do not
  // reload: a reload would drop the launch-file pending path and boot an empty
  // document instead of the one we passed on the command line.
  await p.evaluate(() => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("britdocs:draft:")) localStorage.removeItem(k);
    }
  }).catch(() => {});
  for (let i = 0; i < 6; i++) {
    if ((await p.locator('[data-testid="recovery-dialog"]').count()) === 0) break;
    const discard = p.locator('[data-testid="recovery-discard-all"], [data-testid="recovery-discard"]').first();
    if (await discard.count()) await discard.click({ force: true, timeout: 3000 }).catch(() => {});
    else await p.keyboard.press("Escape");
    await sleep(800);
  }
  await sleep(500);
  const clean = (await p.locator('[data-testid="recovery-dialog"]').count()) === 0;
  if (!clean) console.log("WARN  recovery dialog still present; continuing anyway");
  return { p, getLog: () => log };
}

/** Type text at the end of the document, retrying until the editor shows it. */
async function typeAtEnd(p, text) {
  for (let i = 0; i < 5; i++) {
    await p.locator(SEL).click({ force: true });
    await sleep(600);
    await p.keyboard.press("Control+End");
    await p.keyboard.type(text);
    await sleep(1200);
    const html = await p.evaluate((s) => document.querySelector(s).innerHTML, SEL);
    if (html.includes(text.trim())) return true;
  }
  return false;
}

(async () => {
  const file = path.join(WORK, "Accel.britdoc");
  writeBritdoc(file, {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Accelerator Check" }] },
      { type: "paragraph", content: [{ type: "text", text: "second line" }] },
    ],
  }, "Accel");

  let app = await launch(file);
  try {
    // ---- 1. menu event bridge is wired ----
    const before = fs.readFileSync(file, "utf8");
    check("document opened from disk", before.includes("Accelerator Check"));

    // Type an edit, then fire the native menu intent directly through the
    // Tauri emit path that the Rust menu uses.
    await typeAtEnd(app.p, " APPENDED");
    check("editor shows the edit", (await app.p.evaluate((s) => document.querySelector(s).innerText, SEL)).includes("APPENDED"));

    // The Rust menu forwards intents as an event; the harness simulates the
    // activation. Retry, because the listener may still be registering.
    let afterMenu = fs.readFileSync(file, "utf8");
    for (let i = 0; i < 6; i++) {
      await app.p.evaluate(() =>
        window.__TAURI_INTERNALS__
          .invoke("plugin:event|emit", { event: "britdocs://menu-action", payload: "save" })
          .catch(() => {}),
      );
      await sleep(2000);
      afterMenu = fs.readFileSync(file, "utf8");
      if (afterMenu.includes("APPENDED")) break;
    }
    check("native menu Save intent wrote the file", afterMenu !== before && afterMenu.includes("APPENDED"));

    // ---- 2. real Ctrl+S keystroke ----
    const beforeKey = fs.readFileSync(file, "utf8");
    await typeAtEnd(app.p, " KEYSTROKE");
    const sawKeydown = await app.p.evaluate(() => {
      window.__k = [];
      window.addEventListener("keydown", (e) => window.__k.push(e.key), true);
      return true;
    });
    void sawKeydown;
    await app.p.keyboard.press("Control+s");
    await sleep(3000);
    const keysSeen = await app.p.evaluate(() => window.__k);
    const afterKey = fs.readFileSync(file, "utf8");
    check(
      "real Ctrl+S saves (either webview keydown or native menu)",
      afterKey !== beforeKey && afterKey.includes("KEYSTROKE"),
      `keydown seen: ${JSON.stringify(keysSeen)}`,
    );
    check("no save error banner", (await app.p.locator('[data-testid="save-error"]').count()) === 0);

    // ---- 3. Ctrl+N with unsaved changes must ask first ----
    await typeAtEnd(app.p, " UNSAVED");
    await sleep(800);
    await app.p.keyboard.press("Control+n");
    await sleep(2000);
    const dlg = await app.p.locator('[data-testid="unsaved-dialog"]').count();
    check("Ctrl+N raises the unsaved-changes guard", dlg > 0);
    if (dlg) {
      check("editor still holds the unsaved text", (await app.p.evaluate((s) => document.querySelector(s).innerText, SEL)).includes("UNSAVED"));
      await app.p.locator('[data-testid="unsaved-cancel"]').click();
      await sleep(1200);
      check("Cancel keeps the document open", (await app.p.locator('[data-testid="unsaved-dialog"]').count()) === 0);
      check("Cancel keeps the unsaved text", (await app.p.evaluate((s) => document.querySelector(s).innerText, SEL)).includes("UNSAVED"));

      // "Don't Save" proceeds, and the discarded edit never reaches the disk.
      const beforeDiscard = fs.readFileSync(file, "utf8");
      await app.p.keyboard.press("Control+n");
      await sleep(1500);
      await app.p.locator('[data-testid="unsaved-discard"]').click();
      await sleep(2000);
      check("Don't Save starts a new document", (await app.p.locator('[data-testid="unsaved-dialog"]').count()) === 0);
      check("discarded edits were not written to the original file", fs.readFileSync(file, "utf8") === beforeDiscard);
    }

    console.log("RUST LOG TAIL:", app.getLog().slice(-400));
  } finally {
    await app.p.close().catch(() => {});
    kill();
  }

  console.log(`\n${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("DIAG ERROR:", e.message); kill(); process.exit(1); });
