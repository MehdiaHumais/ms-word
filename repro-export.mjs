import { chromium } from "playwright-core";

const out = process.argv[2] ?? "C:\\Users\\Digital\\AppData\\Local\\Temp\\opencode\\repro.docx";
const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1600, height: 1000 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));

await page.goto("http://localhost:5173/?web=1", { waitUntil: "domcontentloaded" });
await page.locator(".tiptap", { timeout: 15000 }).waitFor();
await page.waitForTimeout(1200);

await page.locator(".tiptap").click();
await page.keyboard.type("DOCX content verification 789 from BritDocs.");
await page.keyboard.press("Enter");
await page.keyboard.type("Second paragraph with bold text.");
await page.waitForTimeout(400);

await page.locator("[data-testid='tab-file']").dispatchEvent("mousedown");
await page.waitForTimeout(250);
await page.locator("[data-testid='file-menu']").getByRole("button", { name: "Save As" }).first().click({ force: true });
await page.waitForTimeout(350);
await page.locator("[data-testid='backstage']").getByRole("button", { name: "Word Document", exact: true }).click();
await page.locator("[data-testid='saveas-name']").fill("repro-docx");
const dlP = page.waitForEvent("download");
await page.locator("[data-testid='saveas-save']").click({ force: true });
const dl = await dlP;
await dl.saveAs(out);
console.log("SAVED:", out, "suggested:", dl.suggestedFilename());

await browser.close();