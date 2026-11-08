const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const { chromium } = require("playwright");
const { mapFixture } = require("./map-of-me-fixtures.cjs");
const { proveIsolation, installIsolation } = require("./browser-isolation.cjs");
const out = path.resolve("generated-artifacts/a1-practical"), base = process.env.J1_BASE_URL || "http://localhost:80";
const key = "to_a1_practical_v1";
function fixture(claimed = true, count = 3) {
  const d = mapFixture(), identity = d.to_map.mirror3, first = identity.clusters[0];
  identity.clusters = ["Lion", "Owl", "Dolphin"].slice(0, count).map((animal, i) => ({
    ...structuredClone(first), id: animal.toLowerCase(), animal, name: animal,
    descriptorWord1: ["Bold", "Wise", "Playful"][i], descriptorWord2: "",
    animalEmoji: ["🦁", "🦉", "🐬"][i],
    giftIds: [identity.pickedGifts[i % identity.pickedGifts.length].id],
    superpower: { blank1: "bring people together", blank2: "make space for possibility", blank3: "help others move forward" },
  }));
  identity.sealCompleted = claimed; identity.sealCompletedAt = claimed ? "2026-11-08T12:00:00Z" : null;
  identity.shadowStories = Object.fromEntries(identity.clusters.map(c => [c.id, { blank1: "push too hard", blank2: "my peace", blank3: "their space" }]));
  return d;
}
const practical = () => ({ version: 1, balanceByCreatureId: { lion: "lot", dolphin: "behind", owl: "right" },
  balanceIntent: { lotCreatureId: "lion", behindCreatureId: "dolphin", answer: "no" },
  tryCreatureId: "dolphin", trySelectionSource: "balance", tryAnswersByCreatureId: { dolphin: "Open Thursday's team meeting with a win." },
  sharpenedOneThing: "Protect an hour on Thursday.", weekReviewedAt: null });

async function main() {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/repl/tools/bin/chromium", headless: true, args: ["--no-sandbox"] });
  const writes = [], unexpected = [], errors = [], fits = [];
  async function context(data, route, width = 375, height = 812, theme = "light", preview = false, remote = null) {
    const c = await browser.newContext({ viewport: { width, height }, isMobile: width === 375, hasTouch: width === 375, serviceWorkers: "block" });
    await installIsolation(c, writes, unexpected, () => remote || { intake: { name: "Synthetic preview" }, phase: "a1" });
    await c.addInitScript(({ data, route, theme }) => {
      if (sessionStorage.getItem("practical-fixture")) return;
      sessionStorage.setItem("practical-fixture", "1");
      Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
      localStorage.setItem("na1_theme", theme);
      localStorage.setItem("to_road_phone_tip_seen_v1", "1");
      localStorage.setItem("to_app_route_v1", JSON.stringify(route));
    }, { data, route, theme });
    const page = await c.newPage(); page.setDefaultTimeout(14000);
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(base + (preview ? "/?preview=1" : "/"));
    await page.evaluate(() => document.fonts.ready);
    return { c, page };
  }
  const stored = (page, k) => page.evaluate(k => JSON.parse(localStorage.getItem(k) || "null"), k);
  async function fit(page, name, width, height, theme) {
    await page.getByText("+1 STEP ON YOUR ROAD", { exact: true }).waitFor({ state: "hidden", timeout: 12000 });
    await page.evaluate(() => document.querySelector(".balance-scroll,.a1-end-body")?.scrollTo(0, 0));
    const result = await page.evaluate(() => {
      const body = document.querySelector(".balance-scroll,.a1-end-body");
      const footer = document.querySelector(".balance-footer,.a1-end-footer");
      const rect = footer?.getBoundingClientRect();
      return { sideways: document.documentElement.scrollWidth > innerWidth,
        footerVisible: !rect || rect.bottom <= innerHeight + 1 && rect.top >= 0,
        scroll: body ? Math.max(0, body.scrollHeight - body.clientHeight) : 0 };
    });
    assert.equal(result.sideways, false, name + " sideways");
    assert.equal(result.footerVisible, true, name + " footer");
    fits.push({ name, width, height, theme, ...result });
    await page.screenshot({ path: path.join(out, `${name}-${width}-${height}-${theme}.png`) });
    if (width === 375 && name === "creatures-lately") {
      await page.locator(".balance-question").scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(out, `creatures-intention-${width}-${height}-${theme}.png`) });
    }
    if (width === 375 && name === "this-week") {
      for (const [index, label] of [[1, "try"], [2, "notice"]]) {
        await page.locator(".practical-block").nth(index).scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(out, `this-week-${label}-${width}-${height}-${theme}.png`) });
      }
    }
  }
  try {
    await proveIsolation(browser);
    // Phone first. Fresh claim, then a complete set of viewport/theme screenshots.
    for (const [width, height] of [[375, 812], [1280, 800], [1366, 680]]) for (const theme of ["light", "dark"]) {
      const data = fixture(false), { c, page } = await context(data, { view: "m3", overlay: { hubId: "m3", roomId: "ownIt" } }, width, height, theme);
      await page.locator(".m3-seal").waitFor();
      if (width > 900) {
        for (let i = 0; i < 2; i++) await page.locator(".m3-own-actions .na1-btn-gold").click();
      }
      await page.getByRole("button", { name: "Claim my identity →", exact: true }).click();
      await page.locator(".na2-decl-ceremony.is-on").waitFor();
      const afterClaim = await stored(page, "to_map");
      assert(afterClaim.mirror3.sealCompleted);
      await page.locator(".na2-decl-ceremony.is-on").getByRole("button", { name: "Continue →", exact: true }).click();
      await page.locator(".balance-screen").waitFor();
      await page.getByRole("group", { name: "Bold Lion lately", exact: true }).getByRole("button", { name: "Leaning on it a lot" }).click();
      await page.getByRole("group", { name: "Playful Dolphin lately", exact: true }).getByRole("button", { name: "Left behind" }).click();
      await page.getByRole("button", { name: "Not really", exact: true }).click();
      assert.equal((await stored(page, key)).balanceIntent.answer, "no");
      assert.deepEqual(await stored(page, "to_map"), afterClaim, "Balance never alters Identity/claim answers");
      await fit(page, "creatures-lately", width, height, theme);
      await page.locator(".balance-footer").getByRole("button", { name: "Continue →", exact: true }).click();
      await page.locator(".balance-screen").waitFor({ state: "detached" });
      await c.close();

      const weekData = fixture(), p = practical(); weekData[key] = p;
      const week = await context(weekData, { view: "a1end2", overlay: null }, width, height, theme);
      await week.page.locator(".practical-week").waitFor();
      assert((await week.page.locator(".practical-creature").innerText()).includes("In my power, the dolphin"));
      await fit(week.page, "this-week", width, height, theme);
      await week.page.getByRole("button", { name: "Sharpen it", exact: true }).click();
      await week.page.getByRole("textbox", { name: "Sharpen your one thing" }).fill("Leave Thursday's first hour for my work.");
      await week.page.getByRole("button", { name: "Save", exact: true }).click();
      const originalRC = await stored(week.page, "to_rc_state_v1");
      const beforeMap = await stored(week.page, "to_map"), beforeValues = await stored(week.page, "to_mirror4_state_v1");
      await week.page.getByRole("textbox", { name: "How could your Playful Dolphin show up more this week?" }).fill("Bring a win to the team meeting.");
      await week.page.getByRole("textbox", { name: "A MOMENT I LIVED IT", exact: true }).fill("I made time to listen.");
      await week.page.getByRole("textbox", { name: "A MOMENT I DIDN'T", exact: true }).fill("I accepted a meeting I did not need.");
      await week.page.getByRole("button", { name: "Claim A1 →", exact: true }).click();
      await week.page.locator(".a1-end-claimed").waitFor();
      assert.deepEqual(await stored(week.page, "to_rc_state_v1"), originalRC);
      assert.deepEqual(await stored(week.page, "to_map"), beforeMap);
      assert.deepEqual(await stored(week.page, "to_mirror4_state_v1"), beforeValues);
      const saved = await stored(week.page, key); assert(saved.weekReviewedAt);
      assert.equal(saved.tryAnswersByCreatureId.dolphin, "Bring a win to the team meeting.");
      assert((await stored(week.page, "to_setaside_v1")).items.some(i => i.id === "a1:notice" && i.text === "I accepted a meeting I did not need."));
      await week.c.close();
    }
    // Claimed revisit, unchanged flags and saved edits surviving an immediate close/reload.
    const reviewData = fixture(), review = await context(reviewData, { view: "m3", overlay: { hubId: "m3", roomId: "ownIt" } });
    await review.page.locator(".na2-decl-ceremony.is-on").waitFor();
    const beforeReview = await stored(review.page, "to_map");
    await review.page.locator(".na2-decl-ceremony.is-on").getByRole("button", { name: "Continue →", exact: true }).click();
    await review.page.getByRole("group", { name: "Bold Lion lately", exact: true }).getByRole("button", { name: "About right" }).click();
    await review.page.getByRole("button", { name: "Done reviewing →", exact: true }).click();
    assert.deepEqual(await stored(review.page, "to_map"), beforeReview);
    await review.c.close();

    // Empty/unselected week and the single-creature bypass.
    for (const count of [1, 3]) {
      const empty = await context(fixture(true, count), { view: "a1end2", overlay: null });
      await empty.page.locator(".practical-week").waitFor();
      if (count === 3) {
        await empty.page.getByRole("button", { name: "🐬 Playful Dolphin", exact: true }).click();
        await empty.page.getByRole("textbox", { name: "How could your Playful Dolphin show up more this week?" }).fill("My optional test answer.");
        await empty.page.getByRole("button", { name: "Close", exact: true }).click();
        assert.equal((await stored(empty.page, key)).tryAnswersByCreatureId.dolphin, "My optional test answer.");
      } else {
        assert((await empty.page.locator(".practical-creature").innerText()).includes("Bold Lion"));
        await empty.page.getByRole("button", { name: "Claim A1 →", exact: true }).click();
        await empty.page.locator(".a1-end-claimed").waitFor();
      }
      await empty.c.close();
    }
    // Real frontend cloud hydration in a second, empty browser (controlled response, no real account).
    const cloudAnswer = { ...practical(), weekReviewedAt: "2026-11-08T14:00:00Z" };
    const cloudDevice = await context(fixture(), { view: "a1end2", overlay: null }, 375, 812, "light", false,
      { intake: { name: "Synthetic preview" }, phase: "a1", a1practical: { t: Date.now(), v: cloudAnswer } });
    await cloudDevice.page.locator(".practical-week").waitFor();
    assert.deepEqual(await stored(cloudDevice.page, key), cloudAnswer);
    assert.equal(await cloudDevice.page.getByRole("textbox", { name: "How could your Playful Dolphin show up more this week?" }).inputValue(),
      cloudAnswer.tryAnswersByCreatureId.dolphin);
    const cloudFlags = await stored(cloudDevice.page, "to_map");
    await cloudDevice.page.getByRole("button", { name: "Done reviewing →", exact: true }).click();
    await cloudDevice.page.locator(".a1-end-card").waitFor({ state: "detached" });
    assert.deepEqual(await stored(cloudDevice.page, "to_map"), cloudFlags);
    await cloudDevice.c.close();

    // The small Entry Hall addition and sharpened Future B line; no Home redesign.
    for (const [width, height] of [[375, 812], [1280, 800], [1366, 680]]) for (const theme of ["light", "dark"]) {
      const carry = fixture(); carry[key] = cloudAnswer;
      const home = await context(carry, { view: "entry-hall", overlay: null }, width, height, theme);
      await home.page.locator(".practical-home").waitFor();
      await home.page.locator(".practical-home").scrollIntoViewIfNeeded();
      await fit(home.page, "home-week-summary", width, height, theme);
      assert((await home.page.locator(".practical-home").innerText()).includes(cloudAnswer.sharpenedOneThing));
      await home.c.close();
      const hub = await context(carry, { view: "grid", overlay: null }, width, height, theme);
      await hub.page.locator(".jr-future-week").waitFor();
      assert.equal(await hub.page.locator(".jr-future-week").innerText(), `This week: ${cloudAnswer.sharpenedOneThing}`);
      await fit(hub.page, "future-b-week", width, height, theme);
      await hub.c.close();
    }

    // Preview edits can be walked through but never persist or reach userdata.
    const preview = await context(fixture(), { view: "m3", overlay: { hubId: "m3", roomId: "ownIt" } }, 375, 812, "light", true);
    await preview.page.locator(".na2-decl-ceremony.is-on").waitFor();
    const snapshot = () => preview.page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage))));
    const previewBefore = await snapshot(), writesBefore = writes.length;
    await preview.page.locator(".na2-decl-ceremony.is-on").getByRole("button", { name: "Continue →", exact: true }).click();
    await preview.page.getByRole("group", { name: "Bold Lion lately", exact: true }).getByRole("button", { name: "Leaning on it a lot" }).click();
    await preview.page.getByRole("group", { name: "Playful Dolphin lately", exact: true }).getByRole("button", { name: "Left behind" }).click();
    await preview.page.getByRole("button", { name: "Not really", exact: true }).click();
    assert.equal(await snapshot(), previewBefore);
    assert.equal(writes.length, writesBefore);
    await preview.c.close();
    const previewWeek = await context(fixture(), { view: "a1end2", overlay: null }, 375, 812, "dark", true);
    await previewWeek.page.locator(".practical-week").waitFor();
    const beforeWeek = await previewWeek.page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage))));
    const weekWrites = writes.length;
    await previewWeek.page.getByRole("button", { name: "🐬 Playful Dolphin", exact: true }).click();
    await previewWeek.page.getByRole("textbox", { name: "How could your Playful Dolphin show up more this week?" }).fill("Preview only");
    await previewWeek.page.getByRole("textbox", { name: "A MOMENT I DIDN'T", exact: true }).fill("Never saved");
    assert.equal(await previewWeek.page.getByRole("button", { name: "Claim A1 →", exact: true }).isEnabled(), false,
      "The existing Preview claim restriction remains in place");
    assert.equal(await previewWeek.page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage)))), beforeWeek);
    assert.equal(writes.length, weekWrites);
    await previewWeek.c.close();
    assert.deepEqual(unexpected, []);
    assert.deepEqual(errors, []);
    assert(writes.some(w => w.path.endsWith("/a1practical")), "Normal-mode new-store writes were intercepted");
    fs.writeFileSync(path.join(out, "fit-results.json"), JSON.stringify({ fits, writesIntercepted: writes.length, errors }, null, 2));
    console.log(JSON.stringify({ fits, writesIntercepted: writes.length, errors }, null, 2));
  } finally { await browser.close(); }
}
module.exports = { fixture, practical };
if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
