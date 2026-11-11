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
  await page.getByText("Imagine nothing changes.").waitFor();
  await click("Show me →");
  await page.getByText("Future A · the same path").waitFor();
  await page.getByLabel("What's still the same in one month?").fill("Still saying yes to every call. Still the last one out.");
  await page.getByLabel("What's still the same in one year?").fill("The team still waits for me. I'm short with the kids by six.");
  await page.getByLabel("What's still the same in three years?").fill("Same desk. Same problems. The kids stopped asking me to come.");
  await page.getByText("−40 hours · −$500").waitFor(); await page.getByText("−520 hours · −$6,000").waitFor(); await page.getByText("−1,560 hours · −$18,000").waitFor();
  await shot("FC-13"); await click("Now turn around →");
  await page.getByText("Future B isn't escaping something.").waitFor(); await page.waitForTimeout(300); await shot("FC-14"); await click("Show me →");
  await page.getByLabel("What are you doing instead in one month?").fill("I let my team take the first call. Home by five, twice a week.");
  await page.getByLabel("What are you doing instead in one year?").fill("My team handles the client calls. Coffee before anyone needs me.");
  await page.getByLabel("What are you doing instead in three years?").fill("Building the work I love. The kids know they come first.");
  await page.getByText("+40 hours · +$500").waitFor(); await page.getByText("+520 hours · +$6,000").waitFor(); await page.getByText("+1,560 hours · +$18,000").waitFor();
  await shot("FC-15"); await click("Picture it →");
  const picks = ["Coffee before anyone needs me", "My team takes the first call", "Home in time for what matters", "People who know the real me", "I check my account without dread"];
  for (let n = 0; n < 5; n++) {
    await page.getByRole("button", { name: picks[n], exact: true }).click();
    if (n === 0) await shot("FC-16");
    if (n === 4) await shot("FC-16-money");
    await page.getByRole("button", { name: /^(Next · .*|Show me) →$/ }).click();
  }
  for (const f of ["Calm", "Trusted", "Free"]) await page.getByRole("button", { name: f, exact: true }).click();
  await shot("FC-16-feels"); await click("Show me →");
  await page.getByText("This is what owning your part looks like.").waitFor(); await page.waitForTimeout(200); await shot("FC-17"); await click("Choose my future →");
  await page.getByLabel(/What will you be doing by next/).fill("I have time to think and enough left for myself.");
  await page.getByLabel("My one thing this week", { exact: true }).fill("let my team take Thursday's client call.");
  await page.getByText("The thing you chose to start comes with you when your road opens.").waitFor();
  await shot("Letter"); await click("Choose my future →");
  await page.getByText("Which future are you building?").waitFor(); await shot("Choose");
  // Future A: an honest answer, then back to FC-17.
  await page.locator(".rc-choose-a").click(); await page.getByRole("heading", { name: "That's an honest answer." }).waitFor();
  await click("Look at Future B again →"); await page.getByText("This is what owning your part looks like.").waitFor();
  await click("Choose my future →"); await click("Choose my future →");
  await page.locator(".rc-choose-b").click(); await page.getByText(/Are you willing to do what it takes/).waitFor(); await shot("Willing");
  await page.getByRole("button", { name: "Yes, I'm willing" }).click();
  await page.getByText("You're moving toward something now.").waitFor(); await page.waitForTimeout(2300); await shot("FC-18");
  const download = page.waitForEvent("download");
  await click("Save my Future B");
  const dl = await Promise.race([download, page.waitForTimeout(8000).then(async () => { throw new Error("No poster download. Alerts: " + JSON.stringify(await page.locator("[role=alert]").allInnerTexts()) + " errors: " + JSON.stringify(errors)); })]);
  await dl.saveAs(path.join(out, `${prefix}-poster-${label}.png`));
  const final = await page.evaluate(() => JSON.parse(localStorage.getItem("to_rc_state_v1")));
  console.log(label, "complete", final.complete, "screen", final.fcScreen, "step", final.step, "| B line:", final.futureB5.tuesday.slice(0, 60), "| feels", JSON.stringify(final.futureB5.feels),
    "| oneThing", final.futureB1.oneThing, "| firstStep", final.firstStep, "| pathA.year", final.futureAPath?.year?.slice(0, 20), "| scene", JSON.stringify(final.futureBScene?.morning), "errors", JSON.stringify(errors));
  // FC-18 on to the waitlist: FC-19, FC-20, FC-21, then the existing ending.
  await click("Where to next →"); await page.getByText("Decades of my own life").waitFor(); await shot("FC-19");
  await click("Show me the five →"); await page.getByText("Five parts of your operating system.").waitFor(); await shot("FC-20");
  await click("What I get →"); await page.getByText("Here's what you get when you own it.").waitFor(); await shot("FC-21");
  await click("Join the waitlist →");
  await page.getByText("On the waitlist ✓", { exact: true }).waitFor(); await page.getByText("You're on the list.").waitFor(); await shot("Ending");
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
await browser.close();
