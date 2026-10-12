"use strict";
/**
 * End-to-end verification that Design-tab themes actually restyle the document.
 *
 * Before the fix, choosing a theme only moved a highlight: nothing in the
 * document changed. This harness drives the built desktop app, creates a real
 * heading, then switches themes and reads *computed* styles (not class names)
 * for the heading, body font and links. A regression to "highlight only" fails
 * because the computed colours stop changing.
 */
const { spawn, execSync } = require("child_process");
const net = require("net");
const { chromium } = require("playwright");

const EXE = "D:\\britdocs-target\\debug\\britdocs.exe";
const PORT = 9285;
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
  return { client: c, page: p };
}

/** Read the live theme styling as the browser actually computes it. */
async function readTheme(p) {
  return p.evaluate((sel) => {
    const content = document.querySelector(sel);
    const pageEl = content?.closest(".brit-page") ?? null;
    const cs = pageEl ? getComputedStyle(pageEl) : null;
    const h1 = content?.querySelector("h1");
    let linkColor = null;
    if (content) {
      const a = document.createElement("a");
      a.textContent = "probe";
      content.appendChild(a);
      linkColor = getComputedStyle(a).color;
      a.remove();
    }
    return {
      headingVar: cs ? cs.getPropertyValue("--brit-heading-color").trim() : "",
      linkVar: cs ? cs.getPropertyValue("--brit-link-color").trim() : "",
      headingColor: h1 ? getComputedStyle(h1).color : null,
      headingFont: h1 ? getComputedStyle(h1).fontFamily : null,
      bodyFont: content ? getComputedStyle(content).fontFamily : "",
      linkColor,
    };
  }, SEL);
}

/** A previous killed run can leave a crash-recovery draft; clear it first. */
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

async function main() {
  const { client, page } = await launch();
  try {
    await dismissRecovery(page);
    // Create a real Heading 1 so the heading rules have something to style.
    await page.click(SEL);
    await page.keyboard.type("ThemeTest");
    await page.getByTitle("Heading 1").click();
    await sleep(400);

    // Switch to the Design tab.
    await page.getByRole("tab", { name: "Design" }).click();
    await page.waitForSelector('[data-testid="design-tab"]', { timeout: 10000 });

    const office = await readTheme(page);
    check("office heading colour is theme-derived (not hard-coded)", office.headingColor === "rgb(41, 68, 118)", office.headingColor);
    check("office link colour is theme-derived", office.linkColor === "rgb(68, 114, 196)", office.linkColor);
    check("office body font is theme body font", /Calibri/.test(office.bodyFont), office.bodyFont);
    check("office heading font is theme heading font", /Calibri Light/.test(office.headingFont || ""), office.headingFont || "");

    // Choose the Gallery theme from the ribbon swatch row.
    await page.click('[data-testid="theme-gallery"]');
    await sleep(500);
    const gallery = await readTheme(page);

    check("gallery heading colour changed", gallery.headingColor === "rgb(67, 29, 96)", gallery.headingColor);
    check("gallery link colour changed", gallery.linkColor === "rgb(112, 48, 160)", gallery.linkColor);
    check("gallery body font changed to Verdana", /Verdana/.test(gallery.bodyFont), gallery.bodyFont);
    check("gallery heading font changed to Georgia", /Georgia/.test(gallery.headingFont || ""), gallery.headingFont || "");
    check(
      "heading colour actually differs between themes",
      office.headingColor !== gallery.headingColor,
      `${office.headingColor} -> ${gallery.headingColor}`,
    );
    check("body font actually differs between themes", office.bodyFont !== gallery.bodyFont);

    // Colours popover now shows the real palette.
    await page.click('[data-testid="btnThemeColors"]');
    await page.waitForSelector('[data-testid="theme-color-1"]', { timeout: 5000 });
    const swatches = await page.$$eval('[data-testid^="theme-color-"]', (els) => els.length);
    check("Colors popover shows a 6-swatch palette", swatches === 6, String(swatches));
    const sw1 = await page.getAttribute('[data-testid="theme-color-1"]', "aria-label");
    check("Colours popover reflects the active theme", /#7030a0/i.test(sw1 || ""), sw1 || "");
    await page.keyboard.press("Escape");

    // Fonts popover now shows the real font pair.
    await page.click('[data-testid="btnThemeFonts"]');
    await page.waitForSelector('[data-testid="theme-font-heading"]', { timeout: 5000 });
    const fontsText = await page.evaluate(() => {
      const h = document.querySelector('[data-testid="theme-font-heading"]');
      const b = document.querySelector('[data-testid="theme-font-body"]');
      return `${h?.textContent ?? ""} | ${b?.textContent ?? ""}`;
    });
    check("Fonts popover lists Georgia (heading) and Verdana (body)", /Georgia/.test(fontsText) && /Verdana/.test(fontsText), fontsText);
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
