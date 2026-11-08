const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const { chromium } = require("playwright");
const { mapFixture, allStagesFixture } = require("./map-of-me-fixtures.cjs");
const { modules } = require("./a1-fixtures.cjs");
const { proveIsolation, installIsolation } = require("./browser-isolation.cjs");
const out = path.resolve("generated-artifacts/map-of-me"), base = process.env.J1_BASE_URL || "http://localhost:80";
async function run() {
  fs.mkdirSync(out, { recursive: true });
  const all = process.env.ALL_STAGES === "1";
  const data = all ? allStagesFixture() : mapFixture(), model = modules().load("mapOfMe/model");
  const sources = { map: data.to_map, values: data.to_mirror4_state_v1, rc: data.to_rc_state_v1,
    notice: data.a1_notice, holdback: data.a1_sym_holdback };
  const original = JSON.stringify(sources), sections = model.a1Sections(sources);
  assert.deepEqual(Array.from(sections.find(s => s.id === "values-rank").ranked), ["Integrity", "Own It", "Hope", "Love", "Evolve"]);
  assert(sections.find(s => s.id === "creature-c_0").answers.some(a => a.text.startsWith("In my power, the owl")));
  assert(!JSON.stringify(sections).includes("WRONG LEGACY"));
  assert(!JSON.stringify(sections).includes("NEVER SHOW RETIRED"));
  assert.equal(JSON.stringify(sources), original, "Projection never mutates sources");
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ["--no-sandbox"] });
  const writes = [], unexpected = [], errors = [], results = [];
  try {
    await proveIsolation(browser);
    for (const width of [375, 1280]) for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width, height: width === 375 ? 812 : 800 },
        serviceWorkers: "block", isMobile: width === 375, hasTouch: width === 375 });
      await installIsolation(context, writes, unexpected);
      await context.addInitScript(({ data, theme }) => {
        if (sessionStorage.getItem("map-fixture")) return;
        sessionStorage.setItem("map-fixture", "1");
        for (const [key, value] of Object.entries(data)) localStorage.setItem(key, JSON.stringify(value));
        localStorage.setItem("na1_theme", theme);
        localStorage.setItem("to_road_phone_tip_seen_v1", "1");
        localStorage.setItem("to_app_route_v1", JSON.stringify({ view: "a1map", overlay: null }));
      }, { data, theme });
      const page = await context.newPage(); page.setDefaultTimeout(14000);
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(base + "/"); await page.locator("[data-map-section='values-rank']").waitFor();
      await page.evaluate(() => document.fonts.ready);
      const snapshot = () => page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(data));
      const before = await snapshot();
      assert.equal(await page.locator(".mom-ranked li").count(), 3);
      assert.equal(await page.locator(".mom-rank-rest").textContent(), "Love · Evolve");
      assert.equal(await page.getByText(/WRONG LEGACY|NEVER SHOW RETIRED/).count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      await page.screenshot({ path: path.join(out, `${all ? "all" : "a1"}-${width}-${theme}-map.jpg`), fullPage: true });
      await page.screenshot({ path: path.join(out, `${all ? "all" : "a1"}-${width}-${theme}-map-viewport.jpg`) });
      const layout = await page.locator(".mom-page").boundingBox();
      assert(width !== 1280 || layout.x >= 270, "Map stays beside the desktop road");
      assert.equal(await page.locator(".na1-root").first().evaluate(el => getComputedStyle(el).backgroundColor),
        theme === "light" ? "rgb(245, 245, 247)" : "rgb(1, 35, 37)", "Map theme surface");
      for (const id of ["values-rank", "creature-c_0", "creature-c_1", "pressure-c_0", "purpose", "vision-time"]) {
        await page.locator(`[data-map-section='${id}']`).click();
        await page.locator(".mom-panel").waitFor();
        const rect = await page.locator(".mom-panel").boundingBox();
        assert(rect.x >= 0 && rect.x + rect.width <= width + 1);
        await page.screenshot({ path: path.join(out, `a1-${width}-${theme}-${id}.jpg`) });
        await page.getByRole("button", { name: "Close full answers", exact: true }).click();
      }
      // Enter every current A1/RC editor, close without edits, compare every saved source.
      const reviewCards = all ? (await page.locator("[data-map-section]").evaluateAll(els => els.map(el => ({ id: el.dataset.mapSection })))) : sections;
      for (const card of reviewCards) {
        console.log("REVIEW", width, theme, card.id);
        await page.locator(`[data-map-section='${card.id}']`).click();
        const edit = page.locator(".mom-panel").getByRole("button", { name: /^Edit in/ });
        if (await edit.isDisabled()) {
          assert(!all, `Populated synthetic section unexpectedly restricted: ${card.id}`);
          await page.getByRole("button", { name: "Close full answers", exact: true }).click(); continue;
        }
        await edit.click();
        await page.locator(".mom-review").waitFor();
        assert.equal(await page.getByRole("alert").filter({ hasText: "not available" }).count(), 0);
        await page.waitForTimeout(150);
        assert(await page.locator(".mom-review").evaluate(el => el.scrollWidth <= el.clientWidth + 1), `Review fit: ${card.id}`);
        if (card.id === "creature-c_0") assert((await page.locator(".mom-review").textContent()).includes("Owl"));
        if (card.id === "creature-c_1") assert((await page.locator(".mom-review").textContent()).includes("Bear"));
        if (card.id === "board-5") assert((await page.locator(".mom-review").textContent()).includes("Selected sixth seat"));
        if (card.id === "truth-move") assert(await page.locator(".mom-review .na1-a2m3-move-text").isVisible(), "Exact move screen");
        if (all && ["a4-time-year", "a5-checkin-2026-11-02", "truth-move"].includes(card.id)) {
          await page.screenshot({ path: path.join(out, `all-${width}-${theme}-${card.id}-editor.jpg`) });
        }
        await page.getByRole("button", { name: "Close and return to Map of Me", exact: true }).click();
        await page.locator(".mom-review").waitFor({ state: "detached" });
        assert.deepEqual(await snapshot(), before, `No source or flag changes: ${card.id}`);
      }
      // An immediate close must flush the last keystroke to its original field.
      await page.locator("[data-map-section='purpose']").click();
      await page.locator(".mom-panel").getByRole("button", { name: /^Edit in/ }).click();
      const textarea = page.locator(".mom-review input[aria-label='Your Purpose']");
      await textarea.fill("My deliberately edited purpose, kept exactly.");
      await page.getByRole("button", { name: "Close and return to Map of Me", exact: true }).click();
      await page.waitForTimeout(100);
      const changed = await snapshot(), oldMap = JSON.parse(before.to_map), newMap = JSON.parse(changed.to_map);
      assert.equal(newMap.purpose_final, "My deliberately edited purpose, kept exactly.");
      assert.deepEqual({ ...newMap, purpose_final: oldMap.purpose_final }, oldMap);
      for (const key of Object.keys(data).filter(key => key !== "to_map")) assert.equal(changed[key], before[key]);
      assert((await page.locator("[data-map-section='purpose']").textContent()).includes("My deliberately edited purpose"));
      if (all) {
        for (const [id, field, expected] of [
          ["truth-move", ".na1-a2m3-move-text", "My exact new move."],
          ["a4-time-year", "textarea", "My exact one-year answer."],
          ["thought-voice", 'input[aria-label="The voice on your side"]', "My revised patient voice."],
          ["a5-self-plan", "textarea", "My revised ninety-day answer."],
        ]) {
          const prior = await snapshot();
          await page.locator(`[data-map-section='${id}']`).click();
          await page.locator(".mom-panel").getByRole("button", { name: /^Edit in/ }).click();
          const input = page.locator(`.mom-review ${field}`);
          await (id === "thought-voice" ? input.last() : input.first()).fill(expected);
          await page.getByRole("button", { name: "Close and return to Map of Me", exact: true }).click();
          const now = await snapshot(), key = id === "truth-move" ? "to_a2_state_v1"
            : id === "thought-voice" ? "to_a3_state_v1" : id === "a5-self-plan" ? "to_a5_state_v1" : "to_a4_state_v1";
          const oldValue = JSON.parse(prior[key]), newValue = JSON.parse(now[key]);
          if (id === "truth-move") {
            assert.equal(newValue.m3.moveText, expected); newValue.m3.moveText = oldValue.m3.moveText;
          } else if (id === "thought-voice") {
            assert.equal(newValue.m3.voiceWant, expected); newValue.m3.voiceWant = oldValue.m3.voiceWant;
          } else if (id === "a5-self-plan") {
            assert.equal(newValue.plans.self.ninety, expected); newValue.plans.self.ninety = oldValue.plans.self.ninety;
          } else { assert.equal(newValue.time.year, expected); newValue.time.year = oldValue.time.year; }
          assert.deepEqual(newValue, oldValue);
          for (const other of Object.keys(prior).filter(k => k !== key)) assert.equal(now[other], prior[other]);
        }
        const pending = page.waitForEvent("download");
        await page.getByRole("button", { name: "Download PDF", exact: true }).click();
        const pdf = await pending;
        await pdf.saveAs(path.join(out, `map-${width}-${theme}.pdf`));
        assert.equal((await fs.promises.readFile(path.join(out, `map-${width}-${theme}.pdf`))).subarray(0, 4).toString(), "%PDF");
      }
      results.push({ width, theme, sections: reviewCards.length, noOverflow: true, safeReview: true, exactSave: true });
      await context.close();
    }
    assert.deepEqual(unexpected, []); assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, `${all ? "all" : "a1"}-results.json`), JSON.stringify({ results, errors, writesIntercepted: writes.length }, null, 2));
    console.log(JSON.stringify({ results, errors, writesIntercepted: writes.length }, null, 2));
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
