import path from "node:path";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { launch } from "./lib/browser.mjs";
import { installMockApi } from "./lib/mock-api.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const out = path.join(root, "generated-artifacts/course-v2");
await mkdir(out, { recursive: true });
const base = process.env.FREE_TEST_URL ?? "http://localhost:5173";
const browser = await launch();
for (const [w, h, label] of [[375, 812, "phone"], [1280, 800, "desktop"]]) {
  const context = await browser.newContext({ viewport: { width: w, height: h } });
  await installMockApi(context);
  const page = await context.newPage();
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto(base);
  await page.getByRole("button", { name: "Begin the Reality Check →" }).waitFor();
  await page.screenshot({ path: path.join(out, `p1-start-${label}-light.png`), fullPage: true });
  await page.evaluate(() => { localStorage.setItem("na1_theme", "dark"); window.dispatchEvent(new StorageEvent("storage", { key: "na1_theme" })); });
  await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
  await page.screenshot({ path: path.join(out, `p1-start-${label}-dark.png`), fullPage: true });
  console.log(label, "errors:", JSON.stringify(errors));
  await context.close();
}
await browser.close();
