import { writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await ctx.newPage();
await page.goto("http://localhost:5173/?web=1", { waitUntil: "domcontentloaded" });
await page.locator(".tiptap", { timeout: 15000 }).waitFor();
await page.waitForTimeout(1200);

const html =
  "<h1>Main Heading</h1>" +
  "<p>Plain paragraph with <b>bold</b>, <i>italic</i>, <u>underlined</u> and " +
  '<span style="color:#c00000">red text</span>.</p>' +
  "<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>" +
  "<ol><li>Alpha</li><li>Beta</li></ol>" +
  "<p>Quoted “smart” text — with dashes…</p>" +
  "<hr/>" +
  "<p>" + "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ".repeat(140) + "</p>";

const b64 = await page.evaluate(async (h) => {
  const m = await import("/src/app/Editor/pdf.ts");
  const bytes = m.buildPdf(h);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}, html);

await browser.close();

const out = "C:\\Users\\Digital\\AppData\\Local\\Temp\\opencode\\formatting.pdf";
writeFileSync(out, Buffer.from(b64, "base64"));
console.log("SAVED:", out);