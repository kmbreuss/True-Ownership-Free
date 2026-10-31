// Synthetic-session UI acceptance. No real credentials, sessions or account writes.
// Set NODE_PATH to an external Playwright installation and CHROMIUM_PATH if needed.
// Protection is proved against a disposable server before app navigation.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { installIsolation, proveIsolation } = require("./browser-isolation.cjs");
const out = path.resolve("generated-artifacts/rc-review");
const base = process.env.J1_BASE_URL || "http://localhost:80";
const key = "to_rc_state_v1", routeKey = "to_app_route_v1";
const url = `${base}/?newRC=1&phase=a1&preview=1`;

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ["--no-sandbox"],
  });
  await proveIsolation(browser);
  const context = await browser.newContext({ viewport: { width: 1366, height: 680 }, serviceWorkers: "block" });
  context.setDefaultTimeout(10000);
  const page = await context.newPage(), errors = [], writes = [], results = [], failures = [];
  page.on("pageerror", e => errors.push(e.message));
  const unexpected = [];
  await installIsolation(context, writes, unexpected);
  try {
    await context.addInitScript(() => {
      if (!sessionStorage.getItem("j1-test-initialized")) {
        sessionStorage.setItem("j1-test-initialized", "1");
        localStorage.setItem("to_app_route_v1", JSON.stringify({ view: "rcroom", overlay: null }));
      }
    });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.locator(".rc-room").waitFor();
    await page.evaluate(() => document.fonts.ready);
    const initial = await page.evaluate(async () => {
      const m = await import("/src/rcConstants.ts");
      return { empty: m.normalizeRC(null), all: m.RC_MIRROR.map(s => s.id) };
    });
    const seed = { ...initial.empty, startedAt: "2026-10-31T12:00:00.000Z", mirror: initial.all, focus: "wealth", focusChosenBy: "tie-picked",
      tuesday: "By Tuesday I am already carrying everyone's worries, and leaving no time for myself.",
      defaultsNamed: { avoiding: "The conversation I keep putting off", blaming: "Someone else's expectations",
        carrying: "Everyone's worries and unfinished work", hoping: "A raise, a big client, a lucky break" },
      cost: { monthly: 1234.5, moneyWhere: "Paying for everyone but me", hoursPerWeek: 12,
        hoursWhere: "Worrying about money and fixing problems", you: "My patience. My confidence. My sleep.", whoElse: "The people closest to me" },
      futureB5: { feels: ["Calm", "Present", "My own feeling"], tuesday: "I have time to think and enough left for myself.", whoNotices: "The people closest to me" },
      futureB1: { doing: "Making room for what matters", oneThing: "Commit to an hour for what matters" },
      compound: { feels: ["Heavier", "My own feeling"], results: "I keep missing what matters", whoElse: "The people closest to me" },
      choice: "B", willing: "yes" };
    async function render(state, theme = "light", size = { width: 1366, height: 680 }, view = "rcroom", previewMode = true) {
      await page.setViewportSize(size);
      await page.evaluate(({ state, theme, view, key, routeKey, previewMode }) => {
        localStorage.setItem(key, JSON.stringify(state));
        localStorage.setItem(routeKey, JSON.stringify({ view, overlay: null }));
        localStorage.setItem("na1_theme", theme);
        if (previewMode) sessionStorage.setItem("to_dev_preview", "1"); else sessionStorage.removeItem("to_dev_preview");
      }, { state, theme, view, key, routeKey, previewMode });
      await page.goto(previewMode ? url : url.replace("&preview=1", ""), { waitUntil: "domcontentloaded" });
      await page.locator(view === "rc" ? ".rc-hub" : ".rc-room").waitFor();
      await page.evaluate(() => document.fonts.ready);
    }
    async function metric(label) {
      const result = await page.evaluate(() => {
        const room = document.querySelector(".rc-room");
        if (!room) {
          const button = document.querySelector(".rc-begin").getBoundingClientRect();
          return { cardOverflow: 0, sceneOverflow: 0, horizontal: Math.max(0, document.documentElement.scrollWidth - innerWidth),
            footerOverlap: 0, beginVisible: button.bottom <= innerHeight && button.top >= 0,
            hubContentVisible: innerWidth <= 900 || document.querySelector(".rc-closing-quote").getBoundingClientRect().bottom <= innerHeight };
        }
        const screen = document.querySelector(".rc-screen").getBoundingClientRect();
        const scene = document.querySelector(".rc-scene").getBoundingClientRect();
        const footer = document.querySelector(".rc-footer").getBoundingClientRect();
        return { cardOverflow: Math.max(0, room.scrollHeight - room.clientHeight),
          sceneOverflow: Math.max(0, Math.round(scene.bottom - screen.bottom)),
          horizontal: Math.max(0, room.scrollWidth - room.clientWidth),
          footerOverlap: Math.max(0, Math.round(scene.bottom - footer.top)),
          footerVisible: footer.bottom <= innerHeight + 1 && footer.top >= 0 };
      });
      results.push({ label, ...result });
      fs.writeFileSync(path.join(out, "progress.json"), JSON.stringify({ results, failures, errors }, null, 2));
      if (result.cardOverflow > 1 || result.sceneOverflow > 1 || result.horizontal > 1 ||
        result.footerOverlap > 1 || result.beginVisible === false || result.footerVisible === false || result.hubContentVisible === false) failures.push({ label, ...result });
      await page.screenshot({ path: path.join(out, `${label}.png`) });
    }
    // Actual user interaction through every implemented scene in Preview All.
    await render(initial.empty);
    const before = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));
    await page.getByRole("button", { name: "I'm ready →", exact: true }).click();
    for (const id of ["time-avoiding", "wealth-avoiding", "self-carrying"]) await page.locator(`[data-mirror-id="${id}"]`).click();
    await page.getByRole("button", { name: "Show me what I see →", exact: true }).click();
    await page.getByRole("button", { name: "Wealth · 1", exact: true }).click();
    await page.getByRole("button", { name: "Start with Wealth →", exact: true }).click();
    await page.getByRole("textbox", { name: "Your ordinary Tuesday", exact: true }).fill("PREVIEW WALKTHROUGH ONLY");
    await page.getByRole("button", { name: "Show me the price →", exact: true }).click();
    await page.getByRole("spinbutton", { name: "About dollars a month", exact: true }).fill("100");
    await page.getByRole("spinbutton", { name: "About hours a week", exact: true }).fill("2");
    assert.match(await page.locator(".rc-summary").innerText(), /\$1,200 and 104 hours/);
    assert.equal(await page.locator(".rc-summary strong").count(), 2);
    await page.getByRole("button", { name: "Close your eyes →", exact: true }).click();
    assert.equal(await page.locator(".rc-room").getAttribute("data-step"), "5");
    await page.getByRole("button", { name: "Show me →", exact: true }).click();
    await page.getByRole("button", { name: "Keep going →", exact: true }).click();
    await page.getByRole("button", { name: "And if you own it? →", exact: true }).click();
    await page.getByRole("textbox", { name: "My Future B Tuesday", exact: true }).fill("I have room to breathe.");
    await page.getByRole("button", { name: "Bring it back to one year →", exact: true }).click();
    await page.getByRole("textbox", { name: "My one thing this week", exact: true }).fill("Commit to a quiet hour.");
    await page.getByRole("button", { name: "Choose →", exact: true }).click();
    await page.getByRole("button", { name: /I choose this one →/ }).click();
    await page.getByRole("button", { name: "Yes, I'm willing", exact: true }).click();
    assert.equal(await page.evaluate(async () => (await import("/src/rcConstants.ts")).loadRCState().complete), true);
    assert.equal(await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort())), before);
    assert.equal(writes.length, 0, "Preview All must not attempt account writes.");

    for (const size of [{ width: 1366, height: 680 }, { width: 1280, height: 800 }, { width: 375, height: 812 }]) {
      for (const theme of ["light", "dark"]) {
        for (const step of ["hub", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]) {
          await render(step === "hub" ? initial.empty : { ...seed, step }, theme, size, step === "hub" ? "rc" : "rcroom");
          if (step === "hub") {
            assert.equal(await page.getByRole("button", { name: "Begin the Reality Check →", exact: true }).count(), 1);
            assert.equal(await page.locator(".rc-stop").count(), 5);
            assert.equal(await page.getByRole("button", { name: "Play Katherine's introduction", exact: true }).count(), 0);
            assert(await page.locator(".rc-begin").evaluate(el => el.getBoundingClientRect().height >= 52));
          }
          if (step === 0) {
            assert.equal(await page.locator(".rc-person-headline").count(), 2);
            assert.equal(await page.locator(".rc-person li").count(), 8);
            assert.match(await page.locator(".rc-person-A").innerText(), /Drifting, reacting to whatever life hands them/);
            assert.match(await page.locator(".rc-person-B").innerText(), /Knows where they're headed, and why/);
          }
          if (step === 7 || step === 8) {
            assert(await page.getByRole("textbox", { name: "My own feeling", exact: true }).isVisible());
            const rows = await page.locator(".rc-feeling-chips").evaluate(el => new Set([...el.children].map(c => Math.round(c.getBoundingClientRect().top))).size);
            assert(rows <= 2, "Feelings and the open custom input must use at most two rows.");
          }
          await metric(`${size.width}x${size.height}-${theme}-${step}`);
        }
        for (const step of [11, 12]) {
          await render({ ...seed, step, choice: "A", willing: "not-yet" }, theme, size);
          await metric(`${size.width}x${size.height}-${theme}-${step}-alternate`);
        }
        console.log(`Layout batch captured: ${size.width}x${size.height} ${theme}`);
      }
    }
    await render({ ...initial.empty, step: 4, focus: "self" });
    assert.equal(await page.locator(".rc-summary.has-summary").count(), 0);
    await page.getByRole("spinbutton", { name: "About dollars a month", exact: true }).fill("0");
    assert.match(await page.locator(".rc-summary").innerText(), /\$0/);

    // Turn Preview off via its real control and prove scratch words disappear.
    await render({ ...seed, step: 3, tuesday: "REAL STORED ANSWER" });
    await page.getByRole("textbox", { name: "Your ordinary Tuesday", exact: true }).fill("PREVIEW MUST DISAPPEAR");
    await page.getByRole("button", { name: "Exit preview", exact: true }).click();
    await page.waitForURL(u => !u.searchParams.has("preview"));
    await page.locator(".rc-room").waitFor();
    assert.equal(await page.getByRole("textbox", { name: "Your ordinary Tuesday", exact: true }).inputValue(), "REAL STORED ANSWER");
    assert.equal(await page.getByText("PREVIEW · dev only · nothing you do here is saved", { exact: true }).count(), 0);
    // Normal local save, scene restoration and no entry veil on refresh.
    await page.getByRole("textbox", { name: "Your ordinary Tuesday", exact: true }).fill("A REAL LOCAL SAVE");
    await page.getByRole("button", { name: "Show me the price →", exact: true }).click();
    await page.reload();
    await page.locator(".rc-room").waitFor();
    assert.equal(await page.locator(".rc-room").getAttribute("data-step"), "4");
    assert.equal(await page.getByText("Looking at where you are…", { exact: true }).count(), 0);
    await page.getByRole("button", { name: "← Back", exact: true }).click();
    assert.equal(await page.getByRole("textbox", { name: "Your ordinary Tuesday", exact: true }).inputValue(), "A REAL LOCAL SAVE");
    // Gating is deliberately tested outside Preview All, which bypasses gates.
    await page.evaluate(async () => {
      const m = await import("/src/rcConstants.ts");
      localStorage.setItem(m.RC_STORAGE_KEY, JSON.stringify({ ...m.EMPTY_RC, step: 1 }));
    });
    await page.reload(); await page.locator(".rc-room").waitFor();
    assert.equal(await page.getByRole("button", { name: "Show me what I see →", exact: true }).isDisabled(), true);
    await page.locator('[data-mirror-id="time-avoiding"]').click();
    assert.equal(await page.getByRole("button", { name: "Show me what I see →", exact: true }).isDisabled(), true);
    await page.locator('[data-mirror-id="wealth-avoiding"]').click();
    assert.equal(await page.getByRole("button", { name: "Show me what I see →", exact: true }).isDisabled(), true);
    await page.locator('[data-mirror-id="self-carrying"]').click();
    assert.equal(await page.getByRole("button", { name: "Show me what I see →", exact: true }).isEnabled(), true);
    await page.locator('[data-mirror-id="self-carrying"]').click();
    assert.equal(await page.getByRole("button", { name: "Show me what I see →", exact: true }).isDisabled(), true);
    await page.locator('[data-mirror-id="self-carrying"]').click();
    await page.getByRole("button", { name: "Show me what I see →", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Choose an area →", exact: true }).isDisabled(), true);
    assert.equal(JSON.parse(await page.evaluate(key => localStorage.getItem(key), key)).complete, false);
    await page.getByRole("button", { name: "Wealth · 1", exact: true }).click();
    assert.equal(await page.locator(".rc-area-pills button[aria-pressed=true]").evaluate(el => getComputedStyle(el).backgroundColor),
      await page.locator(".rc-footer .na1-btn-gold").evaluate(el => getComputedStyle(el).backgroundColor));
    // Normal-mode required gates and choice/save branches, using isolated progress.
    await render({ ...seed, step: 8, futureB5: { feels: [], tuesday: "", whoNotices: "" } }, "light", { width: 1366, height: 680 }, "rcroom", false);
    assert.equal(await page.getByRole("button", { name: "Bring it back to one year →", exact: true }).isDisabled(), true);
    await page.getByRole("textbox", { name: "My Future B Tuesday", exact: true }).fill("I have room for me.");
    await page.getByRole("button", { name: "Bring it back to one year →", exact: true }).click();
    await page.getByRole("textbox", { name: "My one thing this week", exact: true }).fill("");
    assert.equal(await page.getByRole("button", { name: "Choose →", exact: true }).isDisabled(), true);
    await page.getByRole("textbox", { name: "My one thing this week", exact: true }).fill("Commit to an hour.");
    await page.getByRole("button", { name: "Choose →", exact: true }).click();
    await page.getByRole("button", { name: /I'll keep things as they are/ }).click();
    await page.getByRole("button", { name: "Save and come back later", exact: true }).click();
    assert.equal(await page.getByRole("status").innerText(), "Your Reality Check is saved. Come back when you're ready.");
    assert.equal(JSON.parse(await page.evaluate(key => localStorage.getItem(key), key)).complete, false);
    await page.getByRole("button", { name: "Continue →", exact: true }).click();
    await page.getByRole("button", { name: "Look at Future B again →", exact: true }).click();
    await page.getByRole("button", { name: "Bring it back to one year →", exact: true }).click();
    await page.getByRole("button", { name: "Choose →", exact: true }).click();
    await page.getByRole("button", { name: /I choose this one →/ }).click();
    await page.getByRole("button", { name: "Not yet", exact: true }).click();
    assert.equal(JSON.parse(await page.evaluate(key => localStorage.getItem(key), key)).complete, false);
    await page.getByRole("textbox", { name: "What would help me say yes", exact: true }).fill("Knowing my next move");
    await page.getByRole("button", { name: "What would help me get there →", exact: true }).click();
    assert.equal(JSON.parse(await page.evaluate(key => localStorage.getItem(key), key)).complete, true);
    await page.reload(); await page.locator(".rc-room").waitFor();
    assert.equal(await page.locator(".rc-room").getAttribute("data-step"), "13");
    assert.equal(await page.locator(".na1-gold-burst").count(), 0);
    await page.getByRole("button", { name: "Begin A1 · All In →", exact: true }).click();
    assert.equal(await page.locator(".rc-room").count(), 0);
    await render({ ...seed, step: 11, willing: null }, "dark", { width: 375, height: 812 }, "rcroom", false);
    await page.getByRole("button", { name: "Yes, I'm willing", exact: true }).click();
    assert.equal(await page.locator(".na1-gold-burst").count(), 1);
    await page.reload(); await page.locator(".rc-room").waitFor();
    assert.equal(await page.locator(".na1-gold-burst").count(), 0);
    assert.equal(await page.locator(".rc-room").getAttribute("data-step"), "12");
    await page.getByRole("button", { name: "What will get me there →", exact: true }).click();
    await page.evaluate(async () => (await import("/src/reality-check/access.ts")).setSimulatedFree(true));
    await page.getByRole("button", { name: "Start building Future B →", exact: true }).click();
    assert.equal(await page.getByRole("heading", { name: "Start building Future B.", exact: true }).count(), 1);
    await metric("375x812-dark-join-placeholder");
    await page.locator(".rc-room-header button").click();
    assert.equal(await page.getByRole("button", { name: "Review the Reality Check →", exact: true }).count(), 1);
    assert(writes.length > 0, "Normal-mode userdata writes must be positively intercepted.");
    assert.deepEqual(unexpected, [], "No unexpected mutation requests.");
    assert.equal((await context.cookies()).length, 0, "The fixture must have no real session cookies.");
    assert.deepEqual(errors, [], "No page runtime errors.");
    assert.deepEqual(failures, [], "Every viewport must fit without scrolling/clipping.");
    console.log(`PASS: ${results.length} layout cases; authenticated walkthrough, gate, optional cost, refresh and preview-exit checks.`);
  } finally {
    await page.screenshot({ path: path.join(out, "last-state.png") }).catch(() => {});
    fs.writeFileSync(path.join(out, "results.json"), JSON.stringify({ results, failures, errors, writesIntercepted: writes.length }, null, 2));
    console.log(JSON.stringify({ layoutCases: results.length, failures, runtimeErrors: errors }));
    await browser.close();
  }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
