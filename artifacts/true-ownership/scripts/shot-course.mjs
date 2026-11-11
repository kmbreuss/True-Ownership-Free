// Walks the free course against the mocked API and captures each screen. Local Mac use.
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { launch } from "./lib/browser.mjs";
import { walkYesPath } from "./lib/course-walk.mjs";
import { installMockApi } from "./lib/mock-api.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const out = path.join(root, "generated-artifacts/course-v2");
await mkdir(out, { recursive: true });
const base = process.env.FREE_TEST_URL ?? "http://localhost:5173";
const prefix = process.env.SHOT_PREFIX ?? "p3";
const browser = await launch();
// Warm the dev server first so a dependency re-optimisation cannot reload the page mid-walk.
{ const warm = await browser.newPage(); await warm.goto(base); await warm.waitForTimeout(2500); await warm.close(); }
// The Vite dev server can reload the page right after files change; a failed walk is retried once (and logged), so only a repeatable failure fails the run.
async function walk(w, h, label) {
  const context = await browser.newContext({ viewport: { width: w, height: h } });
  const mock = await installMockApi(context);
  const page = await context.newPage();
  const errors = []; page.on("pageerror", e => errors.push(e.message)); page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  const shot = name => page.screenshot({ path: path.join(out, `${prefix}-${name}-${label}.png`) });
  const click = text => page.getByRole("button", { name: text, exact: true }).click();
  await page.goto(base);
  const final = await walkYesPath(page, { shot, errors, saveDownload: dl => dl.saveAs(path.join(out, `${prefix}-poster-${label}.png`)) });
  console.log(label, "complete", final.complete, "screen", final.fcScreen, "step", final.step, "| B line:", final.futureB5.tuesday.slice(0, 60), "| feels", JSON.stringify(final.futureB5.feels),
    "| oneThing", final.futureB1.oneThing, "| firstStep", final.firstStep, "| pathA.year", final.futureAPath?.year?.slice(0, 20), "| scene", JSON.stringify(final.futureBScene?.morning), "errors", JSON.stringify(errors));
  console.log(label, "yes path: waitlistedAt", !!mock.account.waitlistedAt, "| server rc complete", mock.data.rcstate?.v?.complete);
  await page.reload(); await page.getByRole("button", { name: "Review the Reality Check →" }).waitFor();
  await context.close();
}
for (const [w, h, label] of [[375, 812, "phone"], [1280, 800, "desktop"]]) {
  try { await walk(w, h, label); }
  catch (err) { console.log(label, "first attempt failed, retrying once:", String(err.message).split("\n")[0]); await walk(w, h, label); }
}
// Not yet still reaches the waitlist, with the poster on the reflection.
{
  const seed = { version: 2, step: 11, fcScreen: 21, startedAt: "2026-11-01T00:00:00.000Z", focus: "time", focusChosenBy: "picked", tuesday: "Every day ends with the thing I meant to do still waiting.",
    mirror: ["time-carrying", "time-carrying-2", "time-carrying-3"], pattern: "carrying", patternChosenBy: "revealed", topDefaults: ["carrying"], oneThing: "every client problem",
    cost: { monthly: 500, moneyWhere: "", hoursPerWeek: 10, hoursWhere: "", you: "", whoElse: "" }, futureB5: { feels: ["Calm"], tuesday: "Coffee before anyone needs me.", whoNotices: "" },
    futureB1: { doing: "I have time to think.", oneThing: "let my team take Thursday's client call." }, firstStep: "let my team take Thursday's client call.",
    futureBScene: { morning: "morning:coffee", work: "work:team", family: "family:home", people: "people:real", money: "money:number", feels: ["feels:calm"], ownWords: "Coffee before anyone needs me." }, choice: "B", complete: false };
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, acceptDownloads: true });
  const mock = await installMockApi(context, { userdata: { rcstate: { t: 1, v: seed } } });
  const page = await context.newPage(); const errors = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto(base); await page.getByRole("button", { name: "Continue →" }).click();
  await page.getByRole("button", { name: "Not yet", exact: true }).click();
  await page.getByLabel("What would help me say yes").fill("Space to take the next small step.");
  await page.getByText("That's often the real work. Your Future B is saved for when you're ready.", { exact: true }).waitFor();
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Save my Future B", exact: true }).click();
  await (await download).saveAs(path.join(out, `${prefix}-poster-notyet-phone.png`));
  await page.screenshot({ path: path.join(out, `${prefix}-NotYet-phone.png`) });
  await page.getByRole("button", { name: "What would help me get there →", exact: true }).click();
  await page.getByText("Decades of my own life").waitFor();
  await page.getByRole("button", { name: "Show me the five →" }).click(); await page.getByRole("button", { name: "What I get →" }).click();
  await page.getByRole("button", { name: "Join the waitlist →", exact: true }).click();
  await page.getByText("On the waitlist ✓", { exact: true }).waitFor();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("to_rc_state_v1")));
  console.log("not-yet path: complete", saved.complete, "willing", saved.willing, "why", saved.notYetWhy.slice(0, 14), "waitlisted", !!mock.account.waitlistedAt, "errors", JSON.stringify(errors));
  await context.close();
}
// Blindly hoping copy.
{
  const base2 = { version: 2, step: 4, startedAt: "2026-11-01T00:00:00.000Z", focus: "time", focusChosenBy: "picked", tuesday: "x", pattern: "hoping", oneThing: "my cash flow", underneath: "fear", complete: false };
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await installMockApi(context, { userdata: { rcstate: { t: 1, v: { ...base2, fcScreen: 8 } } } });
  const page = await context.newPage(); await page.goto(base); await page.getByRole("button", { name: "Continue →" }).click();
  const h8 = await page.locator(".fc-screen h1").innerText();
  await page.getByRole("button", { name: "← Back" }).waitFor(); await page.locator(".fc-field").fill("my cash flow");
  await page.getByRole("button", { name: "That's it →" }).click(); await page.getByRole("button", { name: "Fear", exact: true }).click(); await page.getByRole("button", { name: "Keep going →" }).click();
  const para = await page.locator(".fc-center p.fc-body").innerText();
  console.log("hoping copy:", JSON.stringify(h8), "|", para.endsWith("They keep you waiting."));
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
// An answer saved before the course (no fcScreen) still opens in the original screens, and the ending keeps its road list.
{
  const legacy = { version: 2, step: 13, startedAt: "2026-10-01T00:00:00.000Z", focus: "time", focusChosenBy: "revealed", tuesday: "An old Tuesday.", mirror: ["time-avoiding", "time-carrying"],
    cost: { monthly: 50, hoursPerWeek: 12, moneyWhere: "", hoursWhere: "", you: "", whoElse: "" }, futureB1: { doing: "Time to think.", oneThing: "one hour." }, choice: "B", willing: "yes", complete: true };
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await installMockApi(context, { userdata: { rcstate: { t: 1, v: legacy } } });
  const page = await context.newPage(); const errors = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto(base); await page.getByRole("button", { name: "Review the Reality Check →" }).click();
  await page.locator(".rc-room").first().waitFor();
  const course = await page.locator(".fc-root").count();
  await page.screenshot({ path: path.join(out, `${prefix}-legacy-review-phone.png`) });
  await page.locator(".na1-room-close").click(); await page.locator(".rc-overlay").waitFor({ state: "detached" });
  await page.getByRole("button", { name: "Your Future B · Join the waitlist →" }).click(); await page.getByText("YOU CHOSE FUTURE B", { exact: true }).waitFor();
  const road = await page.locator(".free-ending .free-road-ahead").count();
  console.log("legacy review: course screens", course, "(want 0) | legacy ending road list", road, "(want 1) | errors", JSON.stringify(errors));
  if (course !== 0 || road !== 1) process.exitCode = 1;
  await context.close();
}
// A finished new-flow answer reviews on the course, from FC-01.
{
  const seed = { version: 2, step: 13, fcScreen: 26, startedAt: "2026-11-01T00:00:00.000Z", focus: "time", focusChosenBy: "picked", tuesday: "x", pattern: "hoping", oneThing: "cash flow", futureB1: { doing: "Time.", oneThing: "call." }, choice: "B", willing: "yes", complete: true };
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await installMockApi(context, { userdata: { rcstate: { t: 1, v: seed } } });
  const page = await context.newPage(); await page.goto(base); await page.getByRole("button", { name: "Review the Reality Check →" }).click();
  await page.locator(".fc-bar").waitFor();
  const first = await page.evaluate(() => JSON.parse(localStorage.getItem("to_rc_state_v1")).fcScreen);
  console.log("new-flow review starts on FC-01:", first === 0);
  if (first !== 0) process.exitCode = 1;
  await context.close();
}
// Dark theme: the card stays cream; no console errors across screens.
{
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await context.addInitScript(() => localStorage.setItem("na1_theme", "dark"));
  await installMockApi(context);
  const page = await context.newPage(); const errors = []; page.on("pageerror", e => errors.push(e.message)); page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(base); await page.getByRole("button", { name: "Begin the Reality Check →" }).click(); await page.locator(".fc-bar").waitFor(); await page.waitForTimeout(2900);
  await page.screenshot({ path: path.join(out, `${prefix}-FC-01-dark-phone.png`) });
  await page.getByRole("button", { name: "I'm ready →" }).click(); await page.getByRole("button", { name: "Show me where →" }).click();
  await page.getByRole("button", { name: /^Time/ }).click(); await page.screenshot({ path: path.join(out, `${prefix}-FC-03-dark-phone.png`) });
  console.log("dark theme:", await page.evaluate(() => document.documentElement.dataset.theme), "errors", JSON.stringify(errors));
  if (errors.length) process.exitCode = 1;
  await context.close();
}
await browser.close();
