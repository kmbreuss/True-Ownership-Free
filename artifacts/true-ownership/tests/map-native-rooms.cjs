const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const { chromium } = require("playwright");
const { allStagesFixture } = require("./map-of-me-fixtures.cjs");
const { installIsolation, proveIsolation } = require("./browser-isolation.cjs");
const out = path.resolve("generated-artifacts/map-visual/part1");
const base = process.env.J1_BASE_URL || "http://localhost:80";
const clone = value => JSON.parse(JSON.stringify(value));
function normalDestination(t, data) {
  let view, hubId, roomId;
  const keys = { "alignment-rate": ["a2m1", "alignment", "m1", 2], "alignment-gap": ["a2m1", "alignment", "m1", 3],
    "time-priorities": ["a2m2", "timeaudit", "m2", 1], "time-activities": ["a2m2", "timeaudit", "m2", 2],
    "time-missing": ["a2m2", "timeaudit", "m2", 3], "truth-intentions": ["a2m3", "namedtruth", "m3", 1],
    "truth-decisions": ["a2m3", "namedtruth", "m3", 2], "truth-move": ["a2m3", "namedtruth", "m3", 2],
    "people-names": ["a3m1", "people", "m1", 1], "people-ratings": ["a3m1", "people", "m1", 2],
    "environment-items": ["a3m2", "environment", "m2", 1], "environment-ratings": ["a3m2", "environment", "m2", 2],
    "thought-moment": ["a3m3", "thoughts", "m3", 1], thoughts: ["a3m3", "thoughts", "m3", 2],
    "thought-voice": ["a3m3", "thoughts", "m3", 2], board: ["a3m5", "board", "m5", 1],
    "move-pick": ["a3m6", "move", "m6", Math.max(0, ["person", "env", "thought"].indexOf(t.part)) + 1],
    "move-bottleneck": ["a3m6", "move", "m6", 4] };
  if (t.kind === "rc") { view = "rcroom"; data.to_rc_state_v1.step = t.screen; }
  else if (t.kind === "notice") view = "a1end2";
  else if (t.kind.startsWith("values-")) { view = hubId = "m4"; roomId = t.kind === "values-rank" ? "rank" : "name"; }
  else if (t.kind.startsWith("identity-")) { view = hubId = "m3"; roomId = t.kind === "identity-gifts" ? "yourGifts" : t.kind === "identity-power" ? "animals" : "underPressure"; }
  else if (t.kind === "purpose" || t.kind === "holdback") { view = "explore"; hubId = "m1"; roomId = t.kind === "purpose" ? "declare" : "to"; if (t.kind === "holdback") data.a1_to_curq = 0; }
  else if (t.kind === "vision") { view = "explore2"; hubId = "m2"; roomId = t.part; }
  else if (keys[t.kind]) {
    [view, roomId] = keys[t.kind]; hubId = view;
    const [, , mirror] = keys[t.kind];
    data[`to_${t.stage}_state_v1`][mirror].currentStep = require("./a1-fixtures.cjs").modules().load("mapOfMe/roomTarget").mapRoomTarget(t).step;
  } else if (t.stage === "a4") {
    const index = ["self", "time", "wealth"].indexOf(t.part), steps = { "a4-money": 0, "a4-gap": 1, "a4-name": 2, "a4-promise": 3, "a4-year": 4, "a4-plan": 5 };
    view = hubId = `a4m${index + 1}`; roomId = t.part; data.to_a4_state_v1[t.part].step = steps[t.kind];
    // Ordinary A4 entries always show the seal once claimed. The normal-room
    // counterpart is a separate pre-claim fixture with identical answers.
    // Never press Re-claim or alter the claimed Map fixture.
    data.to_a4_state_v1[t.part].claimed = false;
    data.to_a4_state_v1[t.part].claimedAt = null;
    data.to_a4_state_v1.a4 = { claimed: false, claimedAt: null };
  } else if (t.stage === "a5") {
    if (t.kind === "a5-lookback") for (const plan of Object.values(data.to_a5_state_v1.plans)) plan.ninetyBy = "2026-11-01";
    view = hubId = t.kind === "a5-checkin" ? "a5c" : t.kind === "a5-lookback" ? "a5r" : "a5m1";
    roomId = t.kind === "a5-checkin" ? "checkin" : t.kind === "a5-lookback" ? "lookback" : "keeping";
    if (roomId === "keeping") {
      data.to_a5_state_v1.claimed = false;
      data.to_a5_state_v1.claimedAt = null;
    }
    data.to_a5_state_v1.step = t.kind === "a5-checkin" ? 0 : t.kind === "a5-plan" ? 1 : t.kind === "a5-supports" ? 2 : 3;
    data.fixtureSession = { [`to_a5_draft_v1:${roomId}`]: t.kind === "a5-lookback"
      ? { screen: 1, choice: data.to_a5_state_v1.reset90.choices, edit: {} }
      : { screen: data.to_a5_state_v1.step } };
    if (t.kind === "a5-checkin") {
      const record = data.to_a5_state_v1.checkins.find(value => value.week === t.id);
      data.fixtureSession["to_a5_draft_v1:checkin"] = { week: record.week, screen: 0, entries: record.entries };
      data.to_a5_state_v1.checkins = data.to_a5_state_v1.checkins.filter(value => value.week !== record.week);
    }
  }
  if (["board", "thought-voice", "truth-move"].includes(t.kind)) data.to_flow_step_v1 = {
    ...(data.to_flow_step_v1 || {}), [t.kind === "board" ? "a3m5-fill" : t.kind === "thought-voice" ? "a3m3-shape" : "a2m3-rethink"]:
      t.kind === "board" ? 1 : t.kind === "thought-voice" ? 2 : Number.MAX_SAFE_INTEGER };
  assert(view, `Normal destination exists for ${t.kind}`);
  return { view, overlay: hubId ? { hubId, roomId } : null };
}
async function run() {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ["--no-sandbox"] });
  const data = allStagesFixture(), writes = [], unexpected = [], errors = [], pairs = [], failed = [];
  async function open(seed, route, width = 375, theme = "light") {
    const context = await browser.newContext({ viewport: { width, height: width === 375 ? 812 : 800 }, serviceWorkers: "block" });
    await installIsolation(context, writes, unexpected);
    await context.addInitScript(({ seed, route, theme }) => {
      if (sessionStorage.getItem("map-native-fixture")) return;
      sessionStorage.setItem("map-native-fixture", "1");
      for (const [key, value] of Object.entries(seed)) {
        if (key === "fixtureSession") { for (const [k, v] of Object.entries(value)) sessionStorage.setItem(k, JSON.stringify(v)); }
        else localStorage.setItem(key, JSON.stringify(value));
      }
      localStorage.setItem("to_app_route_v1", JSON.stringify(route));
      localStorage.setItem("na1_theme", theme); localStorage.setItem("to_road_phone_tip_seen_v1", "1");
    }, { seed, route, theme });
    const page = await context.newPage(); page.setDefaultTimeout(10000);
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(base + "/"); await page.evaluate(() => document.fonts.ready);
    return { context, page };
  }
  try {
    await proveIsolation(browser);
    const { context, page } = await open(data, { view: "a1map", overlay: null });
    await page.locator("[data-map-section='values-rank']").waitFor();
    let ids = await page.locator("[data-map-members]").evaluateAll(nodes => [...new Set(nodes.flatMap(n => n.dataset.mapMembers.split(" ")).filter(Boolean))]);
    if (process.env.START_AT) ids = ids.slice(ids.indexOf(process.env.START_AT));
    const snapshot = () => page.evaluate(keys => Object.fromEntries(keys.map(k => [k, localStorage.getItem(k)])), Object.keys(data));
    const before = await snapshot();
    for (const id of ids) {
      console.log("Checking", id);
      try {
        await page.locator(`[data-map-members~="${id}"]`).first().click();
        const edit = page.locator(`[data-map-edit="${id}"]`);
        if (await edit.isDisabled()) { await page.getByRole("button", { name: "Close full answers" }).click(); continue; }
        await edit.click();
        await page.locator(".na1-room-overlay.is-open").last().waitFor();
        const t = JSON.parse(await page.locator(".mom-page").getAttribute("data-map-review-target"));
        await page.waitForTimeout(150);
        const mapCrumbs = page.locator(".na1-room-overlay.is-open").last().locator('[class*="crumb"]');
        const mapCrumb = await mapCrumbs.count() ? await mapCrumbs.first().textContent() : "";
        const file = id.replace(/[^a-z0-9_-]/ig, "-"), mapImage = `${file}-map.jpg`;
        await page.screenshot({ path: path.join(out, mapImage), animations: "disabled" });
        const rect = await page.locator(".na1-room-card").last().boundingBox();
        assert(rect.x >= -1 && rect.x + rect.width <= 376, `Phone room width: ${id}`);
        await page.locator(".na1-room-overlay.is-open").last().getByRole("button", { name: /^Close/ }).first().click();
        await page.locator(".na1-room-overlay.is-open").waitFor({ state: "detached" });
        assert.deepEqual(await snapshot(), before, `Opening/closing changed source data: ${id}`);
        const normalData = clone(data), route = normalDestination(t, normalData);
        const native = await open(normalData, route);
        try {
          if (t.kind === "a5-checkin" && !await native.page.locator(".na1-room-overlay.is-open").count()) {
            await native.page.getByRole("button", { name: /^Start.*check-in/i }).first().click();
          }
          // Vision intentionally returns to its exercise list on hydration. Enter
          // through the ordinary exercise button, not an alternative renderer.
          if (t.kind === "vision" && !await native.page.locator(".na1-room-overlay.is-open").count()) {
            const name = { time: "Time · 10-Year", wealth: "Wealth · 10-Year", self: "Self · 10-Year" }[t.part];
            await native.page.getByText(name, { exact: true }).click();
            await native.page.waitForTimeout(2800);
          }
          await native.page.locator(".na1-room-overlay.is-open").last().waitFor();
          await native.page.waitForTimeout(250);
          if (t.kind === "alignment-rate" && t.screen) await native.page.locator(".na1-a2m1-pip").nth(t.screen).click();
          if (t.kind === "holdback") await native.page.locator(".purpose-holdback-answer summary").click();
          if (t.kind === "values-name") {
            const name = normalData.to_mirror4_state_v1.clusters.find(c => c.id === t.id)?.userName;
            if (name) await native.page.getByRole("button", { name: new RegExp(name) }).first().click();
          }
          if (t.kind === "identity-pressure") {
            const index = normalData.to_map.mirror3.clusters.findIndex(c => c.id === t.id);
            await native.page.locator(".m3-under-pip").nth(index).click();
          } else if (t.kind === "identity-power") {
            const index = normalData.to_map.mirror3.clusters.findIndex(c => c.id === t.id);
            for (let i = 0; i < index; i++) await native.page.locator(".m3-shape-super-btn").click();
          }
          if (t.kind === "board" && !await native.page.locator("[data-board-seat-index]").count()) {
            const back = native.page.getByRole("button", { name: "← Back", exact: true });
            if (await back.count()) await back.last().click();
          }
          if (["a5-plan","a5-supports"].includes(t.kind) && t.part !== "self") {
            await native.page.getByRole("tab", { name: new RegExp(t.part,"i") }).first().click();
          }
          const normalCrumbs = native.page.locator(".na1-room-overlay.is-open").last().locator('[class*="crumb"]');
          let normalCrumb = await normalCrumbs.count() ? await normalCrumbs.first().textContent() : "";
          const normalize = value => value.replace(/\s+/g," ").trim().toLowerCase();
          if (normalize(normalCrumb) !== normalize(mapCrumb) && mapCrumb.includes("›")) {
            // Claimed mirrors may deliberately resume on Claim. Use the member's
            // real revisit overview rather than bypassing that normal behavior.
            await native.page.locator(".na1-room-overlay.is-open").last().getByRole("button", { name: /^Close/ }).first().click();
            const part = mapCrumb.split("›").at(-1).trim();
            const stepCard = native.page.getByText(part, { exact: true }).first();
            if (!await stepCard.count()) {
              const revisit = native.page.getByRole("button", { name: `Revisit ${t.mirror}`, exact: true });
              if (await revisit.count()) await revisit.click();
            }
            await stepCard.waitFor({ state: "visible" });
            await stepCard.click();
            await native.page.locator(".na1-room-overlay.is-open").last().waitFor();
            const opened = native.page.locator(".na1-room-overlay.is-open").last().locator('[class*="crumb"]');
            normalCrumb = await opened.count() ? await opened.first().textContent() : "";
          }
          assert.equal(normalize(normalCrumb), normalize(mapCrumb), `${id}: normal and Map room parts differ`);
          if (t.kind === "board") await native.page.locator(`[data-board-seat-index="${t.screen || 0}"]`).evaluate(el => el.scrollIntoView({ block: "center" }));
          const normalImage = `${file}-normal.jpg`;
          await native.page.screenshot({ path: path.join(out, normalImage), animations: "disabled" });
          pairs.push({ id, target: t, route, mapImage, normalImage });
        } catch (error) {
          await native.page.screenshot({ path: path.join(out, `failure-normal-${id}.jpg`) });
          console.error("Normal route diagnostic", await native.page.evaluate(() => ({ route: localStorage.getItem("to_app_route_v1"), text: document.body.innerText.slice(-1800) })));
          throw error;
        } finally { await native.context.close(); }
      } catch (error) {
        failed.push({ id, error: error.message }); console.error(id, error.message);
        await page.screenshot({ path: path.join(out, `failure-${id}.jpg`) }).catch(() => {});
        break;
      }
    }
    await context.close();
    assert.equal(unexpected.length, 0, `Escaped writes: ${unexpected}`);
    const prior = process.env.START_AT && fs.existsSync(path.join(out, "audit.json")) ? JSON.parse(fs.readFileSync(path.join(out, "audit.json"), "utf8")).pairs : [];
    const verified = [...prior.filter(pair => !pairs.some(next => next.id === pair.id)), ...pairs];
    fs.writeFileSync(path.join(out, "audit.json"), JSON.stringify({ pairs: verified, failed, errors, writes: writes.length, unexpected }, null, 2));
    assert.equal(failed.length, 0); assert.equal(errors.length, 0, JSON.stringify(errors));
    console.log(`Verified ${pairs.length} edit destinations; ${writes.length} writes intercepted, none escaped.`);
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
