import { chromium } from "playwright";

const token = "roundtrip-supercali-42";
const downloadPath = "C:\\Users\\Digital\\AppData\\Local\\Temp\\opencode\\rt-test.britdoc";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();

page.on("dialog", (d) => d.accept());
const dismissRecovery = async () => {
  const all = page.locator('[data-testid="recovery-discard-all"]');
  if (await all.count()) await all.first().click();
};

const ed = () => page.locator('[contenteditable="true"]').first();

await page.goto("http://127.0.0.1:5173/?web=1", { waitUntil: "commit", timeout: 180000 });
await page.waitForSelector('[contenteditable="true"]', { timeout: 180000 });
await dismissRecovery();

await ed().click();
await page.keyboard.type(token);
await page.waitForTimeout(400);
const before = await ed().innerText();
console.log("TEXT BEFORE SAVE:", JSON.stringify(before));

// Save As (web mode -> download)
await page.click('[data-testid="tab-file"]');
await dismissRecovery();
await page.getByText("Save As", { exact: true }).click();
await page.fill('[data-testid="saveas-name"]', "rt-test");
const [download] = await Promise.all([
  page.waitForEvent("download", { timeout: 30000 }),
  page.click('[data-testid="saveas-save"]'),
]);
await download.saveAs(downloadPath);
console.log("SAVED DOWNLOAD:", downloadPath);

// leave backstage
await page.click('[data-testid="backstage-back"]');
await page.waitForTimeout(300);
await dismissRecovery();

// Open the saved file via Browse
await page.click('[data-testid="tab-file"]');
await dismissRecovery();
await page.getByText("Open", { exact: true }).click();
await dismissRecovery();
const [chooser] = await Promise.all([
  page.waitForEvent("filechooser", { timeout: 30000 }),
  page.locator('button:has-text("Choose a file from your computer")').click(),
]);
await chooser.setFiles(downloadPath);
await page.waitForTimeout(800);
await dismissRecovery();

// leave backstage to see the document
await page.click('[data-testid="backstage-back"]', { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(500);

await ed().click();
const after = await ed().innerText();
console.log("TEXT AFTER OPEN:", JSON.stringify(after));
console.log("ROUNDTRIP OK:", after.includes(token));

await browser.close();
