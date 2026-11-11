// Walks the free course against the mocked API and captures each screen. Local Mac use.
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { launch } from "./lib/browser.mjs";
import { installMockApi } from "./lib/mock-api.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const out = path.join(root, "generated-artifacts/course-v2");
await mkdir(out, { recursive: true });
const base = process.env.FREE_TEST_URL ?? "http://localhost:5173";
const prefix = process.env.SHOT_PREFIX ?? "p2";
const browser = await launch();
for (const [w, h, label] of [[375, 812, "phone"], [1280, 800, "desktop"]]) {
  const context = await browser.newContext({ viewport: { width: w, height: h } });
  const mock = await installMockApi(context);
  const page = await context.newPage();
  const errors = []; page.on("pageerror", e => errors.push(e.message)); page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  const shot = name => page.screenshot({ path: path.join(out, `${prefix}-${name}-${label}.png`) });
  const click = text => page.getByRole("button", { name: text, exact: true }).click();
  await page.goto(base);
  await click("Begin the Reality Check →");
  await page.locator(".fc-bar").waitFor(); await page.waitForTimeout(2900);
  await shot("FC-01"); await click("I'm ready →");
  await page.getByText("Owning your life isn't about control.").waitFor(); await shot("FC-02"); await click("Show me where →");
  await page.getByRole("button", { name: /^Time/ }).click(); await shot("FC-03"); await click("This one →");
  await page.getByLabel("Your ordinary Tuesday", { exact: true }).fill("Every day ends with the thing I meant to do still waiting.");
  await shot("Tuesday"); await click("Show me the price →");
  await page.getByRole("button", { name: "$500", exact: true }).click();
  await page.getByRole("button", { name: "10", exact: true }).click();
  await page.getByLabel("Where does the money go?").fill("work I turn down, help I don't hire");
  await page.getByLabel("Where do the hours go?").fill("doing what someone else could do");
  await page.getByLabel("What is it costing you?").fill("“I'm short with my kids by six o'clock.”");
  await page.locator(".fc-scroll").evaluate(el => { el.scrollTop = 0; }); await shot("FC-04");
  // Resume: a refresh must land on the same screen, with the saved words.
  await page.reload(); await page.getByRole("button", { name: "Continue →" }).click(); await page.waitForTimeout(300);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("to_rc_state_v1")));
  console.log(label, "fcScreen", saved.fcScreen, "step", saved.step, "focus", saved.focus, saved.focusChosenBy, "monthly", saved.cost.monthly, "hours", saved.cost.hoursPerWeek, "errors", JSON.stringify(errors));
  await context.close();
}
await browser.close();
