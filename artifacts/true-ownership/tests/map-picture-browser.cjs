const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");
const { installIsolation, proveIsolation } = require("./browser-isolation.cjs");
const { allStagesFixture } = require("./map-of-me-fixtures.cjs");
const { modules } = require("./a1-fixtures.cjs");
const clone = value => JSON.parse(JSON.stringify(value));
const out = "generated-artifacts/map-visual";
const practical = { version: 1, balanceByCreatureId: {}, balanceIntent: null, tryCreatureId: "c_0",
  trySelectionSource: "chosen", tryAnswersByCreatureId: { c_0: "Ask one clearer question before deciding." },
  sharpenedOneThing: "An hour for what matters.", weekReviewedAt: "2026-11-08T12:00:00Z" };

function fixture(scenario) {
  const data = clone(allStagesFixture());
  data.to_a1_practical_v1 = clone(practical);
  if (scenario !== "all-stages") {
    for (const key of Object.keys(data)) if (/^to_a[345]_/.test(key) || scenario !== "a2-done" && /^to_a2_/.test(key)) delete data[key];
  }
  if (["rc-only", "mid-a1"].includes(scenario)) {
    data.to_map = {};
    const empty = clone(modules().load("mirror4Constants").EMPTY_MIRROR4);
    data.to_mirror4_state_v1 = scenario === "rc-only" ? empty : { ...empty, admire: data.to_mirror4_state_v1.admire };
    delete data.a1_notice; delete data.to_a1_practical_v1;
    for (const key of Object.keys(data)) if (/^a1_/.test(key) && key !== "a1_notice") delete data[key];
  }
  if (["three-creatures", "five-creatures", "long"].includes(scenario)) {
    const count = scenario === "three-creatures" ? 3 : 5;
    const animals = [["Owl", "🦉"], ["Lion", "🦁"], ["Dolphin", "🐬"], ["Wolf", "🐺"], ["Bear", "🐻"]];
    const identity = data.to_map.mirror3, first = clone(identity.clusters[0]);
    identity.clusters = animals.slice(0, count).map(([animal, emoji], index) => ({ ...clone(first), id: `c_${index}`, animal,
      animalEmoji: emoji, descriptorWord1: "Clear", descriptorWord2: "Kind", name: `${animal}`,
      superpower: { blank1: "see the whole picture", blank2: "make room for other people", blank3: "find a thoughtful way forward" } }));
  }
  if (scenario === "one-creature") data.to_map.mirror3.clusters = data.to_map.mirror3.clusters.slice(0, 1);
  if (scenario === "long") {
    data.to_map.purpose_final = "I make space for every person's full story, " + "even when the answer is not simple. ".repeat(12);
    data.to_rc_state_v1.futureB5.tuesday = "A thoughtful morning with space for my family and myself. ".repeat(8);
    data.to_mirror4_state_v1.clusters[0].userName = "Averylongstandardwithoutspaces".repeat(4);
  }
  data.to_app_route_v1 = { view: "a1map", overlay: null };
  return data;
}

async function main() {
  await fs.mkdir(`${out}/screens`, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ["--no-sandbox"] });
  await proveIsolation(browser);
  const report = { fits: [], scenarios: [], links: [], errors: [], downloads: [], escaped: [] };
  const writes = [], sizes = [[375,812], [1280,800], [1440,900]];
  async function open(data, width, height, theme) {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: theme, serviceWorkers: "block", acceptDownloads: true });
    await installIsolation(context, writes, report.escaped);
    await context.addInitScript(({ data, theme }) => {
      for (const [key, value] of Object.entries(data)) localStorage.setItem(key, JSON.stringify(value));
      localStorage.setItem("na1_theme", theme); localStorage.setItem("to_road_phone_tip_seen_v1", "1");
    }, { data, theme });
    const page = await context.newPage();
    page.on("pageerror", error => { report.errors.push(error.message); console.error("Synthetic page error:", error.message); });
    await page.goto("http://localhost:80/", { waitUntil: "networkidle" });
    try { await page.locator(".mom-title-card").waitFor({ timeout: 10000 }); }
    catch (error) {
      console.error("Synthetic route diagnostic", await page.evaluate(() => ({
        route: localStorage.getItem("to_app_route_v1"), rc: localStorage.getItem("to_rc_state_v1"),
        body: document.body.innerText.slice(0,1400),
      })));
      throw error;
    }
    await page.evaluate(() => document.fonts.ready);
    return { page, context };
  }
  async function fit(page, label) {
    const result = await page.evaluate(() => ({
      width: innerWidth, pageWidth: document.documentElement.scrollWidth,
      creatures: document.querySelectorAll(".mom-creature").length,
      hiddenText: [...document.querySelectorAll(".mom-picture,.mom-creature")].some(el => el.scrollWidth > el.clientWidth + 2 && !el.classList.contains("mom-picture-identity")),
      sidebar: getComputedStyle(document.querySelector(".mom-picture-sidebar")).position,
    }));
    assert(result.pageWidth <= result.width, `${label}: horizontal overflow ${JSON.stringify(result)}`);
    assert(!result.hiddenText, `${label}: clipped card`);
    report.fits.push({ label, ...result });
  }
  for (const [width,height] of process.env.SCENARIOS_ONLY ? [] : sizes) for (const theme of ["light","dark"]) {
    const data = fixture("all-stages"), { page, context } = await open(data,width,height,theme);
    await fit(page, `${width}×${height} ${theme}`);
    const name = `${width === 375 ? "01-phone" : width === 1280 ? "02-desktop" : "03-desktop"}-${width}x${height}-${theme}`;
    await page.screenshot({ path: `${out}/screens/${name}-top.jpg`, type: "jpeg", quality: 85 });
    await page.screenshot({ path: `${out}/screens/${name}-full.jpg`, type: "jpeg", quality: 80, fullPage: true });
    if (width === 375 && theme === "light" && !process.env.SKIP_LINKS) {
      const before = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(data).filter(k => k !== "to_app_route_v1"));
      const ids = await page.locator("[data-map-members]").evaluateAll(nodes => [...new Set(nodes.flatMap(el => el.dataset.mapMembers.split(" ")).filter(Boolean))]);
      for (const id of ids) {
        await page.locator(`[data-map-members~="${id}"]`).first().click();
        await page.locator(".mom-panel").waitFor();
        const edit = page.locator(`[data-map-edit="${id}"]`);
        assert.equal(await edit.count(), 1, `${id}: exact editor missing`);
        if (await edit.isEnabled()) {
          await edit.click(); await page.locator("[data-map-review-target]").waitFor();
          const target = JSON.parse(await page.locator("[data-map-review-target]").getAttribute("data-map-review-target"));
          report.links.push({ id, target });
          const done = page.getByRole("button", { name: "Done reviewing →", exact: true }).last();
          if (await done.isVisible()) await done.click(); else await page.getByRole("button", { name: /^Close/ }).last().click();
          await page.locator(".mom-title-card").waitFor();
          await page.locator("[data-map-review-target]").waitFor({ state: "hidden" });
        } else await page.getByRole("button", { name: "Close full answers" }).click();
        const after = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(before));
        assert.deepEqual(after, before, `${id}: opening/reviewing changed source data`);
      }
      for (const [name, signature] of [["Download PDF", "%PDF"], ["Share as a card", "PNG"]]) {
        const waiting = page.waitForEvent("download");
        await page.getByRole("button", { name, exact: true }).click();
        const download = await waiting, file = `${out}/${download.suggestedFilename()}`;
        await download.saveAs(file);
        const bytes = await fs.readFile(file);
        assert(bytes.subarray(0, 8).toString("latin1").includes(signature), `${name}: invalid file`);
        report.downloads.push({ file, bytes: bytes.length });
      }
    }
    await context.close();
  }
  if (!process.env.MATRIX_ONLY) {
    const data = fixture("all-stages"), { page, context } = await open(data,375,812,"light");
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem("to_map")));
    await page.locator('[data-map-members~="purpose"]').first().click();
    await page.locator('[data-map-edit="purpose"]').click();
    const textbox = page.getByRole("textbox").first();
    await textbox.fill("A clear synthetic purpose edit, kept in my own words.");
    await textbox.blur();
    await page.getByRole("button", { name: "Done reviewing →", exact: true }).last().click();
    await page.locator("[data-map-review-target]").waitFor({ state: "hidden" });
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem("to_map")));
    assert.equal(after.purpose_final, "A clear synthetic purpose edit, kept in my own words.", "Purpose edit was not saved");
    delete before.purpose_final; delete after.purpose_final;
    assert.deepEqual(after,before,"Purpose edit changed unrelated answers or flags");
    report.savedEdit = "Purpose · Declare: saved; unrelated answers and flags unchanged";
    await context.close();
  }
  for (const scenario of process.env.MATRIX_ONLY ? [] : ["rc-only","mid-a1","a1-done","a2-done","one-creature","three-creatures","five-creatures","long"]) {
    console.log("Scenario",scenario);
    const { page, context } = await open(fixture(scenario),375,812,"light");
    await fit(page, scenario);
    await page.screenshot({ path: `${out}/screens/04-scenario-${scenario}.jpg`, type: "jpeg", quality: 75, fullPage: true });
    report.scenarios.push(scenario); await context.close();
  }
  assert.deepEqual(report.escaped, []); assert.deepEqual(report.errors, []);
  report.interceptedWrites = writes.length;
  await fs.writeFile(`${out}/visual-${process.env.MATRIX_ONLY ? "matrix" : process.env.SCENARIOS_ONLY ? "scenarios" : "audit"}.json`, JSON.stringify(report,null,2));
  await browser.close();
  console.log(JSON.stringify({ fits: report.fits.length, exactEditorLinks: report.links.length, scenarios: report.scenarios.length, downloads: report.downloads, interceptedWrites: writes.length, errors: report.errors, escaped: report.escaped },null,2));
}
module.exports = { fixture };
if (require.main === module) main().catch(error => { console.error(error); process.exit(1); });
