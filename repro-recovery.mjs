import { chromium } from "playwright-core";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtempSync } from "node:fs";

const results = [];
const errors = [];
let failed = 0;
const ok = (l) => results.push(`✅ ${l}`);
const bad = (l, d) => { failed++; results.push(`❌ ${l}: ${d}`); };
const out = join(mkdtempSync(join(tmpdir(), "britdocs-recovery-")), "out.britdoc");

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1600, height: 1000 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push(`PAGE ERROR: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(`CONSOLE: ${m.text()}`); });

await page.goto("http://localhost:5173/?web=1", { waitUntil: "domcontentloaded" });
await page.locator(".tiptap").waitFor({ timeout: 15000 });
await page.waitForTimeout(1000);

/* 1. type text → a draft must land in localStorage */
await page.locator(".tiptap").click();
await page.keyboard.type("recoverable draft text 456");
await page.waitForTimeout(600);
const drafts1 = await page.evaluate(() => {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("britdocs:draft:")) out.push(k);
  }
  return out;
});
if (drafts1.length === 1) ok("typing writes exactly one autosave draft");
else bad("autosave draft", `expected 1 key, got ${JSON.stringify(drafts1)}`);

/* 2. reload → Recovery dialog must appear with the draft */
await page.reload({ waitUntil: "domcontentloaded" });
await page.locator(".tiptap").waitFor({ timeout: 15000 });
const dl = page.locator("[data-testid='recovery-dialog']");
const visible = await dl.isVisible().catch(() => false);
if (visible) ok("recovery dialog appears after reload with leftover draft");
else bad("recovery dialog", "not visible after reload");

const hasRestore = await dl.getByRole("button", { name: "Restore" }).count();
const hasDiscard = await dl.getByRole("button", { name: "Discard" }).count();
if (hasRestore === 1 && hasDiscard === 1) ok("dialog offers Restore + Discard per draft");
else bad("dialog actions", `restore=${hasRestore} discard=${hasDiscard}`);

/* 3. Restore → tab opens, editor holds the draft text, dialog closes */
await dl.getByRole("button", { name: "Restore" }).click({ force: true });
await page.waitForTimeout(500);
const dialogGone = await page.locator("[data-testid='recovery-dialog']").count() === 0;
const restoredText = await page.locator(".tiptap").innerText();
if (dialogGone && restoredText.includes("recoverable draft text 456")) ok("restore opens content and closes dialog");
else bad("restore", `dialogGone=${dialogGone} text='${restoredText.trim()}'`);

/* 4. discard-all path: seed two drafts, reload, discard all */
await page.evaluate(() => {
  localStorage.clear();
  const mk = (t, html) => {
    localStorage.setItem(`britdocs:draft:${t}`, JSON.stringify({
      key: `britdocs:draft:${t}`, title: t, html, updatedAt: Date.now(),
    }));
  };
  mk("Leftover One", "<p>leftover one text</p>");
  mk("Leftover Two", "<p>leftover two text</p>");
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.locator(".tiptap").waitFor({ timeout: 15000 });
const dl2 = page.locator("[data-testid='recovery-dialog']");
const rows = await dl2.locator("button", { hasText: "Restore" }).count();
if (rows === 2) ok("discard-all case shows 2 drafts");
else bad("discard-all drafts", `expected 2, got ${rows}`);
await dl2.getByRole("button", { name: "Discard all drafts" }).click({ force: true });
await page.waitForTimeout(400);
const left = await page.evaluate(() => {
  let n = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("britdocs:draft:")) n++;
  }
  return n;
});
if (left === 0) ok("discard all clears the draft keys");
else bad("discard all", `leftover keys = ${left}`);

await browser.close();
const passed = results.filter((r) => r.startsWith("✅")).length;
console.log(`\nRECOVERY GATE: ${passed} passed, ${failed} failed`);
results.forEach((r) => console.log(r));
console.log("RUNTIME ERRORS:", errors.length === 0 ? "NONE ✅" : "");
errors.forEach((e) => console.log(`  ❌ ${e}`));
process.exit(failed > 0 || errors.length > 0 ? 1 : 0);