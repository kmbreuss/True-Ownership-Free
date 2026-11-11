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
const prefix = process.env.SHOT_PREFIX ?? "p3";
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
  await click("Keep going →");
  await page.getByText("Life is a mirror.").waitFor(); await shot("FC-05"); await click("Show me mine →");
  for (const id of ["time-carrying", "time-carrying-2", "time-carrying-3", "time-hoping"]) await page.locator(`[data-mirror-id="${id}"]`).click();
  await shot("FC-06"); await click("Show me what I see →");
  await page.getByText("You lean toward").first().waitFor(); await shot("FC-07"); await click("Look underneath →");
  await page.getByLabel("The one thing I've been carrying").fill("Every client problem, even the ones my team could handle.");
  await shot("FC-08"); await click("That's it →");
  await page.getByRole("button", { name: "Guilt", exact: true }).click(); await shot("FC-09"); await click("Keep going →");
  await page.getByText("Guilt has been protecting you.").waitFor(); await shot("FC-10"); await click("Look beyond it →");
  await page.getByText("It's time to look beyond it.").waitFor(); await shot("FC-11"); await click("Ask it →");
  await page.getByLabel("The part I own is").fill("I don't let my team try first. I step in before they can.");
  await shot("FC-12"); await click("See where it leads →");
  await page.getByText("Now close your eyes.").waitFor(); await page.waitForTimeout(400); await shot("Eyes");
  // Resume: a refresh must land on the same screen, with the saved words.
  await page.reload(); await page.getByRole("button", { name: "Continue →" }).click(); await page.waitForTimeout(300);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("to_rc_state_v1")));
  console.log(label, "pattern", saved.pattern, saved.patternChosenBy, JSON.stringify(saved.topDefaults), "named", saved.defaultsNamed.carrying.slice(0, 12), "underneath", saved.underneath, "part", saved.partIOwn?.slice(0, 12), "mirror", saved.mirror.length, "fcScreen", saved.fcScreen, "step", saved.step, "focus", saved.focus, saved.focusChosenBy, "monthly", saved.cost.monthly, "hours", saved.cost.hoursPerWeek, "errors", JSON.stringify(errors));
  await context.close();
}
// A tie: two patterns equally strong. Both are shown and the reader picks the truer one.
{
  const seed = { version: 2, step: 4, fcScreen: 6, startedAt: "2026-11-01T00:00:00.000Z", focus: "time", focusChosenBy: "picked", tuesday: "x", complete: false };
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await installMockApi(context, { userdata: { rcstate: { t: 1, v: seed } } });
  const page = await context.newPage();
  await page.goto(base); await page.getByRole("button", { name: "Continue →" }).click(); await page.locator(".fc-quotes").waitFor();
  for (const id of ["time-avoiding", "time-avoiding-2", "time-carrying", "time-carrying-2"]) await page.locator(`[data-mirror-id="${id}"]`).click();
  await page.getByRole("button", { name: "Show me what I see →" }).click();
  await page.getByText("Tap the one that's truer.").waitFor();
  const before = await page.getByRole("button", { name: "Look underneath →" }).isDisabled();
  await page.getByRole("button", { name: /Carrying/ }).click();
  await page.screenshot({ path: path.join(out, `${prefix}-FC-07-tie-phone.png`) });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("to_rc_state_v1")));
  console.log("tie: continue disabled before pick:", before, "| pattern", saved.pattern, saved.patternChosenBy, JSON.stringify(saved.topDefaults), JSON.stringify(saved.patternCounts));
  await context.close();
}
await browser.close();
