"use strict";
/**
 * End-to-end verification of the Word-style right-click context menu.
 *
 * Drives the built desktop app, then exercises the menu: opening, clipboard
 * cut/copy/paste, Styles, Align, Line Spacing, Font…/Paragraph… dialogs,
 * hyperlink insert + link actions, New Comment, Thesaurus/Translate panels and
 * Escape-to-close.
 */
const { spawn, execSync } = require("child_process");
const net = require("net");
const { chromium } = require("playwright");

const EXE = "D:\\britdocs-target\\debug\\britdocs.exe";
const PORT = 9286;
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

async function launch() {
  await ensureDead();
  const env = Object.assign({}, process.env, {
    WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: "--remote-debugging-port=" + PORT,
  });
  const child = spawn(EXE, [], { env, stdio: ["ignore", "pipe", "pipe"] });
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

  const ctx = c.contexts()[0];
  try {
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: "https://tauri.localhost",
    });
  } catch {
    /* clipboard checks degrade if permissions unavailable */
  }
  return { client: c, page: p };
}

async function dismissRecovery(page) {
  for (let i = 0; i < 6; i++) {
    const dialog = await page.$('[data-testid="recovery-dialog"]');
    if (!dialog) {
      if (i === 0) {
        await sleep(800);
        continue;
      }
      break;
    }
    const all = await page.$('[data-testid="recovery-discard-all"]');
    if (all) await all.click().catch(() => {});
    else {
      const one = await page.$('[data-testid="recovery-discard"]');
      if (one) await one.click().catch(() => {});
    }
    await sleep(600);
  }
  await page.waitForSelector(SEL, { timeout: 15000 }).catch(() => {});
}

const menuOpen = (page) => page.$('[data-testid="editor-context-menu"]');

async function rightClickMenu(page) {
  await page.click(SEL, { button: "right" });
  await page.waitForSelector('[data-testid="editor-context-menu"]', { timeout: 5000 });
  await sleep(150);
}

async function openSub(page, testid) {
  await page.hover(`[data-testid="${testid}"]`);
  await sleep(120);
}

/** Right-click on the first text block (h1 or p) so the menu acts on it. */
async function rightClickOnText(page, sel = `${SEL} h1`) {
  const loc = page.locator(sel);
  const box = await loc.boundingBox();
  if (!box) throw new Error("no block bbox for " + sel);
  await page.mouse.click(box.x + 6, box.y + box.height / 2, { button: "right" });
  await page.waitForSelector('[data-testid="editor-context-menu"]', { timeout: 5000 });
  await sleep(150);
  return box;
}

async function main() {
  const { client, page } = await launch();
  try {
    await dismissRecovery(page);

    /* ---- A. Menu opens with the expected Word items -------------------- */
    await page.click(SEL);
    await page.keyboard.type("PhoenixWord");
    await sleep(200);

    await rightClickMenu(page);
    for (const id of ["cm-cut", "cm-paste", "cm-font", "cm-para", "cm-hyperlink"]) {
      const count = await page.locator(`[data-testid="${id}"]`).count();
      check(`menu shows ${id}`, count === 1, String(count));
    }
    check(
      "cut is disabled without a selection",
      (await page.getAttribute('[data-testid="cm-cut"]', "disabled")) !== null,
    );
    check(
      "copy is disabled without a selection",
      (await page.getAttribute('[data-testid="cm-copy"]', "disabled")) !== null,
    );

    // Submenu triggers present.
    for (const id of ["cm-styles"]) {
      check(`submenu trigger ${id} present`, (await page.$(`[data-testid="${id}"]`)) !== null);
    }

    // Escape closes the menu.
    await page.keyboard.press("Escape");
    await sleep(150);
    check("Escape closes the menu", (await menuOpen(page)) === null);

    /* ---- B. Clipboard: selection-aware cut/copy + paste --------------- */
    await page.click(SEL);
    await page.keyboard.press("Control+a");
    await rightClickMenu(page);
    check(
      "copy is enabled with a selection",
      (await page.getAttribute('[data-testid="cm-copy"]', "disabled")) === null,
    );
    check(
      "cut is enabled with a selection",
      (await page.getAttribute('[data-testid="cm-cut"]', "disabled")) === null,
    );
    // Copy writes the OS clipboard; the Paste round-trip below is the proof —
    // reading the clipboard back outside a user gesture is not allowed in WebView2.
    await page.click('[data-testid="cm-copy"]');
    await sleep(200);

    // Paste into the same paragraph: cursor at end, selection re-opened.
    await page.click(SEL);
    await page.keyboard.press("End");
    await rightClickMenu(page);
    await page.click('[data-testid="cm-paste"]');
    await sleep(400);
    const txt1 = await page.evaluate((s) => document.querySelector(s).textContent, SEL);
    check(
      "Copy + Paste round-trip duplicates the text",
      (txt1.match(/PhoenixWord/g) || []).length === 2,
      txt1,
    );

    /* ---- C. Styles submenu: Normal / Heading 1 ------------------------ */
    await rightClickMenu(page);
    await openSub(page, "cm-styles");
    await page.click('[data-testid="cm-style-normal"]');
    await sleep(250);
    const paraCount = await page.locator(`${SEL} p`).count();
    check("Styles > Normal turns the block into a paragraph", paraCount >= 1, String(paraCount));

    await rightClickMenu(page);
    await openSub(page, "cm-styles");
    await page.click('[data-testid="cm-style-h1"]');
    await sleep(250);
    const h1text = await page.locator(`${SEL} h1`).textContent().catch(() => null);
    check("Styles > Heading 1 makes the block an h1", !!h1text && /PhoenixWord/.test(h1text), h1text || "");

    /* ---- D. Align submenu -------------------------------------------- */
    await rightClickOnText(page);
    await openSub(page, "cm-align");
    await page.click('[data-testid="cm-align-center"]');
    await sleep(250);
    const align = await page.evaluate(
      (s) => getComputedStyle(document.querySelector(`${s} h1`)).textAlign,
      SEL,
    );
    check("Align > Center applies text-align: center", align === "center", align);

    /* ---- E. Line spacing submenu ------------------------------------- */
    await rightClickOnText(page);
    await openSub(page, "cm-line");
    await page.click('[data-testid="cm-line-1.5"]');
    await sleep(250);
    const spacing = await page.evaluate((s) => {
      const el = document.querySelector(`${s} h1`) || document.querySelector(`${s} p`);
      return `${el?.getAttribute("style") ?? ""} || ${el ? getComputedStyle(el).lineHeight : ""}`;
    }, SEL);
    check("Line Spacing 1.5 applied line-height", /line-height\s*:\s*1\.5/i.test(spacing), spacing);

    /* ---- F. Font… dialog --------------------------------------------- */
    await page.keyboard.press("Control+a");
    await rightClickMenu(page);
    await page.click('[data-testid="cm-font"]');
    await page.waitForSelector('[data-testid="cm-font-dialog"]', { timeout: 5000 });
    await page.selectOption('[data-testid="cm-font-family"]', "Consolas");
    await page.selectOption('[data-testid="cm-font-size"]', "14");
    await page.click('[data-testid="cm-font-apply"]');
    await sleep(300);
    const fontSpan = await page.evaluate((s) => {
      const h1 = document.querySelector(`${s} h1`);
      const span = h1 ? h1.querySelector("span[style]") : null;
      const text = h1 ? h1.textContent : "";
      const docFont = document.querySelector(s) ? getComputedStyle(document.querySelector(s)).fontFamily : "";
      const spans = h1 && !span ? Array.from(h1.querySelectorAll("span")).map((x) => x.getAttribute("style")) : [];
      return { text, style: span ? span.getAttribute("style") : "", spans, docFont };
    }, SEL);
    const fontOk = /Consolas/i.test(fontSpan.style) || fontSpan.spans.some((x) => /Consolas/i.test(x)) || /Consolas/i.test(fontSpan.docFont);
    const sizeOk =
      /18\.6667px|19px/i.test(fontSpan.style) || fontSpan.spans.some((x) => /18\.6667px|19px/i.test(x));
    check("Font… dialog applied Consolas", fontOk, fontSpan.style || fontSpan.spans.join(" | "));
    check("Font… dialog applied 14pt (~18.7px)", sizeOk, fontSpan.style || fontSpan.spans.join(" | "));

    /* ---- G. Paragraph… dialog ---------------------------------------- */
    await rightClickOnText(page);
    await page.click('[data-testid="cm-para"]');
    await page.waitForSelector('[data-testid="cm-para-dialog"]', { timeout: 5000 });
    await page.click('[data-testid="cm-para-right"]');
    await page.click('[data-testid="cm-para-center"]');
    await page.click('[data-testid="cm-para-right"]');
    await page.click('[data-testid="cm-para-after-inc"]');
    await page.click('[data-testid="cm-para-apply"]');
    await sleep(300);
    const afterState = await page.evaluate((s) => {
      const el = document.querySelector(`${s} h1`) || document.querySelector(`${s} p`);
      return {
        align: getComputedStyle(el).textAlign,
        marginBottom: getComputedStyle(el).marginBottom,
        style: el.getAttribute("style") || "",
      };
    }, SEL);
    check("Paragraph… dialog sets alignment", afterState.align === "right", afterState.align);
    check("Paragraph… dialog Space After stepper", /6pt/.test(afterState.style), afterState.style);

    /* ---- H. Hyperlink: insert, contextual actions -------------------- */
    await rightClickMenu(page);
    await page.click('[data-testid="cm-hyperlink"]');
    await page.waitForSelector('[data-testid="cm-link-dialog"]', { timeout: 5000 });
    await page.fill('[data-testid="cm-link-url"]', "https://example.com");
    await page.fill('[data-testid="cm-link-text"]', "WebBtn");
    await page.click('[data-testid="cm-link-insert"]');
    await sleep(300);
    const linkCount = await page.evaluate((s) => document.querySelectorAll(`${s} a[href]`).length, SEL);
    check("Hyperlink… inserted an anchor", linkCount >= 1, String(linkCount));

    const box = await page.locator(`${SEL} a[href*="example.com"]`).first().boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: "right" });
      await page.waitForSelector('[data-testid="editor-context-menu"]', { timeout: 5000 });
      await sleep(150);
      for (const id of ["cm-link-open", "cm-link-copy", "cm-link-edit", "cm-link-remove"]) {
        check(`link context shows ${id}`, (await page.$(`[data-testid="${id}"]`)) !== null);
      }
      await page.click('[data-testid="cm-link-copy"]');
      await sleep(250);
      const linkClip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ""));
      check("Copy Hyperlink copied the URL", /example\.com/.test(linkClip), linkClip);

      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: "right" });
      await page.waitForSelector('[data-testid="editor-context-menu"]', { timeout: 5000 });
      await page.click('[data-testid="cm-link-remove"]');
      await sleep(300);
      const afterRemove = await page.evaluate((s) => {
        const anchors = document.querySelectorAll(`${s} a[href]`);
        return { count: anchors.length, text: document.querySelector(s).textContent || "" };
      }, SEL);
      check(
        "Remove Hyperlink unwrapped the link",
        afterRemove.count === 0 && /WebBtn/.test(afterRemove.text),
        JSON.stringify(afterRemove),
      );
    } else {
      check("link bounding box available", false, "no bbox");
    }

    /* ---- I. Review tools --------------------------------------------- */
    // Put the cursor inside a word so New Comment can expand to it.
    const h1box = await page.locator(`${SEL} h1`).boundingBox();
    if (h1box) {
      await page.mouse.click(h1box.x + 8, h1box.y + Math.min(6, h1box.height / 2));
      await page.mouse.click(h1box.x + 8, h1box.y + Math.min(6, h1box.height / 2), { button: "right" });
      await page.waitForSelector('[data-testid="editor-context-menu"]', { timeout: 5000 });
      await page.click('[data-testid="cm-comment"]');
      await page.waitForSelector('[data-testid="review-panel-comments"]', { timeout: 5000 });
      check("New Comment opens the comments pane", true);
    } else {
      check("New Comment opens the comments pane", false, "no h1 bbox");
    }

    await rightClickMenu(page);
    await page.click('[data-testid="cm-thesaurus"]');
    await page.waitForSelector('[data-testid="review-panel-thesaurus"]', { timeout: 5000 });
    check("Thesaurus opens the Thesaurus pane", true);

    await rightClickMenu(page);
    await page.click('[data-testid="cm-translate"]');
    await page.waitForSelector('[data-testid="review-panel-translator"]', { timeout: 5000 });
    check("Translate opens the Translator pane", true);

    await rightClickMenu(page);
    await page.click('[data-testid="cm-select-all"]');
    await sleep(250);
    const selTxt = await page.evaluate((s) => {
      const win = document.defaultView;
      const sel = win.getSelection();
      return sel ? sel.toString() : "";
    }, SEL);
    check("Select All selects the document text", selTxt.trim().length > 0, selTxt.slice(0, 40));
  } finally {
    await client.close().catch(() => {});
    kill();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error("ERROR", err);
  kill();
  process.exit(2);
});