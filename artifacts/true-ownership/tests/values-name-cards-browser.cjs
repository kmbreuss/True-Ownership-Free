const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const { chromium } = require("playwright");
const { fixtures, modules, plain } = require("./a1-fixtures.cjs");
const { proveIsolation, installIsolation } = require("./browser-isolation.cjs");
const f = fixtures(), helpers = modules().load("mirror4Constants");
const out = path.resolve("generated-artifacts/values-name-cards"), url = process.env.J1_BASE_URL || "http://localhost:80";
const names = ["Own It", "Integrity", "Hope", "Love", "Evolve"], sizes = [4, 3, 3, 2, 2];
const texts = ["Problem solves", "Admits mistakes", "Takes responsibility", "Names the issue and takes ownership",
  "Tells the truth kindly", "Does what they commit to", "Speaks honestly", "Looks for possibilities",
  "Encourages others", "Tries again", "Shows up for people", "Makes space for others",
  "Keeps learning", "Listens before responding"];
const irks = ["blames everyone else", "talks over people"].map((text, i) => ({
  id: `ir-${i}`, text, person: "", tier: "turns", inUseByCluster: null,
}));
let offset = 0;
const clusters = names.map((userName, i) => {
  const behaviorIds = texts.slice(offset, offset + sizes[i]).map((_, j) => offset + j >= 12 ? `af-ir-${offset + j - 12}` : `ad-${offset + j}`);
  offset += sizes[i];
  return { id: `cl-${i + 1}`, userName, userDefinition: `My meaning for ${userName}`, behaviorIds, proposal: "",
    proposedNames: [], flips: [], status: "complete", colorIndex: i % 3 + 1, peelChain: [],
    keystoneBehaviorId: behaviorIds[0] };
});
const admire = texts.map((text, i) => ({
  id: i >= 12 ? `af-ir-${i - 12}` : `ad-${i}`, text, person: "",
  tier: i % 3 === 0 || i >= 12 ? "warms" : "lights",
  ...(i >= 12 ? { source: "flipped" } : {}),
  inUseByCluster: clusters.find(c => c.behaviorIds.includes(i >= 12 ? `af-ir-${i - 12}` : `ad-${i}`)).id,
}));
const claimed = { ...f.values, status: "complete", claimed: true, claimedAt: "2026-11-01T12:00:00.000Z",
  admire, irks, clusters, rank: clusters.map(c => c.id),
  flips: irks.map((irk, i) => ({ irkId: irk.id, accepted: true, toText: texts[12 + i] })),
  discoverSections: { admire: true, irks: true, portrait: true },
  portrait: { lights: admire.filter(b => b.tier === "lights").map(b => b.id), warms: admire.filter(b => b.tier === "warms").map(b => b.id), bothers: [], turns: irks.map(b => b.id) },
  pressureTest: { ...f.values.pressureTest, complete: true },
};
const sorting = { ...claimed, claimed: false, claimedAt: null, status: "in_progress",
  admire: admire.map(b => ({ ...b, inUseByCluster: null })),
  clusters: clusters.map(c => ({ ...c, behaviorIds: [], keystoneBehaviorId: null })),
  pressureTest: { ...f.values.pressureTest },
};
const fresh = { ...sorting, clusters: [], rank: [] };
const read = page => page.evaluate(() => JSON.parse(localStorage.getItem("to_mirror4_state_v1")));
const results = [], fits = [], writes = [], unexpected = [], errors = [];
function completion(state) {
  return { claimed: state.claimed, claimedAt: state.claimedAt, status: state.status,
    currentStep: state.currentStep, discoverSections: state.discoverSections, pressure: state.pressureTest.complete };
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"], headless: true });
  await proveIsolation(browser);
  async function open({ width = 1366, height = 680, theme = "light", state = claimed, reduced = false, preview = false } = {}) {
    const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: "block", reducedMotion: reduced ? "reduce" : "no-preference" });
    await installIsolation(context, writes, unexpected, () => ({ intake: { name: "Synthetic" }, phase: "a1" }));
    const page = await context.newPage(); page.setDefaultTimeout(7000);
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(({ state, theme, rc, preview }) => {
      if (sessionStorage.getItem("name-cards-fixture")) return;
      sessionStorage.setItem("name-cards-fixture", "1");
      localStorage.setItem("to_mirror4_state_v1", JSON.stringify(state));
      localStorage.setItem("to_rc_state_v1", JSON.stringify(rc));
      localStorage.setItem("na1_theme", theme);
      localStorage.setItem("to_app_route_v1", JSON.stringify({ view: "m4", overlay: { hubId: "m4", roomId: "name" } }));
      if (preview) sessionStorage.setItem("to_dev_preview", "1");
    }, { state, theme, rc: f.rc, preview });
    await page.goto(url + "/");
    await page.locator(".vxnc-layout").waitFor();
    await page.evaluate(() => document.fonts.ready);
    return { page, context };
  }
  async function check(name, options, run) {
    if (process.env.NAME_CASE && !new RegExp(process.env.NAME_CASE).test(name)) return;
    let context;
    try {
      const opened = await open(options); context = opened.context;
      await run(opened.page);
      results.push({ name, pass: true }); console.log("PASS", name);
    } catch (error) {
      results.push({ name, pass: false, error: error.message }); console.log("FAIL", name, error.message);
    } finally {
      fs.writeFileSync(path.join(out, "results.json"), JSON.stringify({ results, fits, errors, interceptedWrites: writes.length, unexpected }, null, 2));
      if (context) await context.close();
    }
    if (results.filter(r => !r.pass).length >= 2) throw new Error("Stopping after two failed checks; no automatic retries.");
  }
  for (const [width, height] of [[375, 812], [1280, 800], [1366, 680]]) for (const theme of ["light", "dark"]) {
    for (const moment of ["sort", "cards", "turned"]) {
      await check(`fit ${moment} ${width}x${height} ${theme}`, { width, height, theme, state: moment === "sort" ? sorting : claimed }, async page => {
        if (moment === "turned") await page.locator(".vxnc-front").first().click();
        const geometry = await page.evaluate(() => {
          const frame = document.querySelector(".vx-room"), layout = frame.querySelector(".vxnc-layout");
          const body = frame.querySelector(".na1-m4-disc-content"), footer = layout.querySelector("footer");
          const grid = layout.querySelector(".vxnc-grid"), sort = layout.querySelector(".vxnc-sort-body");
          const rect = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
          return { sideways: document.documentElement.scrollWidth - innerWidth, bodyOverflow: body.scrollHeight - body.clientHeight,
            sortOverflow: sort ? sort.scrollHeight - sort.clientHeight : 0, frame: rect(frame), footer: rect(footer),
            columns: grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : null,
            cardListHeight: layout.querySelector(".is-turned .vxnc-card-list")?.clientHeight,
            cards: grid ? [...grid.children].map(rect) : [], oldBoards: frame.querySelectorAll(".na1-m4-ns-board").length,
            progressBottom: frame.querySelector(".vx-progress").getBoundingClientRect().bottom };
        });
        assert(geometry.sideways <= 1 && geometry.bodyOverflow <= 1 && geometry.sortOverflow <= 1, JSON.stringify(geometry));
        assert(geometry.footer.bottom <= height + 1 && geometry.footer.y >= geometry.progressBottom, "fixed footer fits");
        assert.equal(geometry.oldBoards, 0);
        if (moment === "turned") assert(geometry.cardListHeight >= 28, "at least one full behavior row is visible");
        if (moment !== "sort") {
          assert.equal(geometry.columns, width <= 600 ? 2 : 3);
          assert(geometry.cards.every(c => c.height >= 100 && c.y >= geometry.progressBottom - 1 && c.bottom <= geometry.footer.y + 1), "cards stay between progress and footer");
        }
        fits.push({ moment, width, height, theme, ...geometry });
        await page.screenshot({ path: path.join(out, `${moment}-${width}-${theme}.png`), animations: "disabled" });
      });
    }
  }
  const longRows = Array.from({ length: 25 }, (_, i) => ({
    id: `ad-extra-${i}`, text: `Shows up thoughtfully for other people, even when the day is difficult · ${i + 1}`,
    tier: "lights", inUseByCluster: "cl-1",
  }));
  const long = { ...claimed, admire: [...claimed.admire, ...longRows],
    clusters: claimed.clusters.map((c, i) => i === 0 ? { ...c, behaviorIds: [...c.behaviorIds, ...longRows.map(b => b.id)] } : c) };
  for (const [width, height] of [[375, 812], [1280, 800], [1366, 680]]) for (const theme of ["light", "dark"]) {
    await check(`long card back ${width}x${height} ${theme}`, { width, height, theme, state: long }, async page => {
      await page.locator(".vxnc-front").first().click();
      const list = page.locator(".vxnc-standard.is-turned .vxnc-card-list");
      assert.equal(await list.locator(".vxnc-behavior-row").count(), 29);
      const geometry = await list.evaluate(e => {
        const scrollingAncestors = [];
        for (let p = e.parentElement; p; p = p.parentElement) {
          if (/(auto|scroll)/.test(getComputedStyle(p).overflowY) && p.scrollHeight > p.clientHeight + 1) scrollingAncestors.push(p.className);
        }
        return { height: e.clientHeight, overflow: e.scrollHeight - e.clientHeight, scrollingAncestors };
      });
      assert(geometry.height >= 28 && geometry.overflow > 0, JSON.stringify(geometry));
      assert.deepEqual(geometry.scrollingAncestors, [], "long card has no enclosing scroll box");
      await list.evaluate(e => { e.scrollTop = e.scrollHeight; });
      await list.locator(".vxnc-behavior-row").last().click();
      await page.locator(".vxnc-move-menu").getByRole("button", { name: "Integrity", exact: true }).click();
      const saved = await read(page);
      assert.equal(saved.admire.find(b => b.id === longRows.at(-1).id).inUseByCluster, "cl-2");
      assert.deepEqual(completion(saved), completion(long));
      await page.screenshot({ path: path.join(out, `long-back-${width}-${theme}.png`), animations: "disabled" });
    });
  }
  await check("fresh places in existing order with identical persisted results", { state: sorting }, async page => {
    let expected = await read(page);
    const ordered = [...expected.admire.filter(b => b.source !== "flipped" && b.tier === "lights"),
      ...expected.admire.filter(b => b.source !== "flipped" && b.tier !== "lights"),
      ...expected.admire.filter(b => b.source === "flipped")];
    for (let i = 0; i < ordered.length; i++) {
      assert.equal(await page.locator(".vxnc-behavior").getAttribute("data-behavior-id"), ordered[i].id);
      const target = expected.clusters[i % 5].id;
      await page.locator(`.vxnc-tile[data-standard-id="${target}"]`).click();
      expected = plain(helpers.addBehaviorToCluster(expected, target, ordered[i].id));
      assert.deepEqual(await read(page), expected);
    }
    await page.locator('[data-name-moment="cards"]').waitFor();
    for (const cluster of expected.clusters) {
      assert((await page.locator(`.vxnc-standard[data-standard-id="${cluster.id}"] .vxnc-front`).textContent()).includes(`${cluster.behaviorIds.length} behaviors`));
    }
    await page.reload(); await page.locator('[data-name-moment="cards"]').waitFor();
    assert.deepEqual(await read(page), expected);
  });
  await check("skip and Next never save; refresh resumes saved placements", { state: sorting }, async page => {
    const before = await read(page), writesBefore = writes.length;
    const first = await page.locator(".vxnc-behavior").getAttribute("data-behavior-id");
    await page.getByRole("button", { name: "Skip for now", exact: true }).click();
    assert.notEqual(await page.locator(".vxnc-behavior").getAttribute("data-behavior-id"), first);
    await page.getByRole("button", { name: "Next behavior →", exact: true }).click();
    assert.deepEqual(await read(page), before);
    assert.equal(writes.length, writesBefore);
    await page.reload(); await page.locator('[data-name-moment="sort"]').waitFor();
    assert.equal(await page.locator(".vxnc-behavior").getAttribute("data-behavior-id"), first);
    const id = await page.locator(".vxnc-behavior").getAttribute("data-behavior-id");
    await page.locator('.vxnc-tile[data-standard-id="cl-1"]').click();
    const saved = await read(page);
    assert.deepEqual(saved, plain(helpers.addBehaviorToCluster(before, "cl-1", id)));
    await page.reload(); await page.locator('[data-name-moment="sort"]').waitFor();
    assert.notEqual(await page.locator(".vxnc-behavior").getAttribute("data-behavior-id"), id);
    assert.deepEqual(await read(page), saved);
  });
  await check("inline first/new standard creation uses unchanged schema and IDs", { state: fresh }, async page => {
    let expected = await read(page);
    const behaviorId = await page.locator(".vxnc-behavior").getAttribute("data-behavior-id");
    await page.getByRole("button", { name: "+ Name your first standard", exact: true }).click();
    await page.getByRole("textbox", { name: "Name your standard", exact: true }).fill("My standard");
    assert.deepEqual(await read(page), expected, "draft text never writes");
    await page.getByRole("button", { name: "Create standard →", exact: true }).click();
    const created = helpers.createCluster(expected, { proposal: "", proposedNames: [], behaviorIds: [] });
    expected = helpers.updateCluster(created.state, created.cluster.id, c => ({ ...c, userName: "My standard" }));
    expected = plain(helpers.addBehaviorToCluster(expected, created.cluster.id, behaviorId));
    assert.deepEqual(await read(page), expected);
    await page.getByRole("button", { name: "+ New standard", exact: true }).click();
    await page.getByRole("textbox", { name: "Name your standard", exact: true }).fill("Cancelled");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    assert.deepEqual(await read(page), expected);
    await page.reload(); await page.locator('[data-name-moment="sort"]').waitFor();
    assert.deepEqual(await read(page), expected, "user-created named standard survives hydration");
  });
  await check("claimed cards show saved contents and flipping never saves", {}, async page => {
    const before = await read(page), count = writes.length;
    assert.equal(await page.locator('[data-name-moment="cards"]').count(), 1);
    assert.equal(await page.locator(".vxnc-standard").count(), 5);
    for (const cluster of before.clusters) {
      const card = page.locator(`.vxnc-standard[data-standard-id="${cluster.id}"]`);
      await card.locator(".vxnc-front").click();
      assert.equal(await page.locator(".vxnc-standard.is-turned").count(), 1);
      assert.deepEqual(await card.locator(".vxnc-behavior-row").allTextContents(), cluster.behaviorIds.map(id => before.admire.find(b => b.id === id).text));
    }
    await page.locator(".vxnc-standard.is-turned").getByRole("button", { name: "↺ turn back", exact: true }).click();
    assert.equal(await page.locator(".vxnc-standard.is-turned").count(), 0);
    assert.deepEqual(await read(page), before); assert.equal(writes.length, count);
  });
  await check("move/send-back preserve saved answers, IDs and claim flags", {}, async page => {
    const before = await read(page);
    await page.locator('.vxnc-standard[data-standard-id="cl-1"] .vxnc-front').click();
    await page.locator(".vxnc-standard.is-turned .vxnc-behavior-row").first().click();
    await page.locator(".vxnc-move-menu").getByRole("button", { name: "Integrity", exact: true }).click();
    let expected = plain(helpers.addBehaviorToCluster(helpers.removeBehaviorFromCluster(before, "cl-1", "ad-0"), "cl-2", "ad-0"));
    assert.deepEqual(await read(page), expected);
    await page.reload(); await page.locator('[data-name-moment="cards"]').waitFor();
    await page.locator('.vxnc-standard[data-standard-id="cl-2"] .vxnc-front').click();
    await page.locator(".vxnc-standard.is-turned .vxnc-behavior-row").getByText("Problem solves", { exact: true }).click();
    await page.getByRole("button", { name: "↩ Send back", exact: true }).click();
    expected = plain(helpers.removeBehaviorFromCluster(expected, "cl-2", "ad-0"));
    await page.locator('[data-name-moment="sort"]').waitFor();
    assert.equal(await page.locator(".vxnc-behavior").getAttribute("data-behavior-id"), "ad-0");
    assert.deepEqual(await read(page), expected); assert.deepEqual(completion(expected), completion(before));
    await page.reload(); await page.locator('[data-name-moment="sort"]').waitFor();
    assert.deepEqual(await read(page), expected);
    await page.locator('.vxnc-tile[data-standard-id="cl-1"]').click();
    await page.locator('[data-name-moment="cards"]').waitFor();
    assert.deepEqual(await read(page), plain(helpers.addBehaviorToCluster(expected, "cl-1", "ad-0")));
  });
  await check("grid creation and move-to-new preserve existing operations", {}, async page => {
    let expected = await read(page);
    await page.getByRole("button", { name: "+ New standard", exact: true }).click();
    await page.getByRole("textbox", { name: "Name your standard", exact: true }).fill("Courage");
    await page.getByRole("button", { name: "Create standard →", exact: true }).click();
    const created = helpers.createCluster(expected, { proposal: "", proposedNames: [], behaviorIds: [] });
    expected = plain(helpers.updateCluster(created.state, created.cluster.id, c => ({ ...c, userName: "Courage" })));
    assert.deepEqual(await read(page), expected);
    await page.locator('.vxnc-standard[data-standard-id="cl-1"] .vxnc-front').click();
    await page.locator(".vxnc-standard.is-turned .vxnc-behavior-row").first().click();
    await page.locator(".vxnc-move-menu").getByRole("button", { name: "+ New standard", exact: true }).click();
    const stripped = helpers.removeBehaviorFromCluster(expected, "cl-1", "ad-0");
    const next = helpers.createCluster(stripped, { proposal: "", proposedNames: [], behaviorIds: [] });
    expected = plain(helpers.addBehaviorToCluster(next.state, next.cluster.id, "ad-0"));
    assert.deepEqual(await read(page), expected);
    await page.getByRole("button", { name: "More cards →", exact: true }).click();
    assert(await page.locator(`.vxnc-standard[data-standard-id="${next.cluster.id}"]`).count());
  });
  for (const width of [375, 1366]) await check(`Values Back/Next, naming controls, review flags ${width}`, { width, height: width === 375 ? 812 : 680 }, async page => {
    const before = await read(page);
    await page.getByRole("button", { name: "Name them →", exact: true }).click();
    for (let i = 0; i < before.clusters.length; i++) {
      assert.equal(await page.locator(".na1-m4-ns-name:visible").inputValue(), before.clusters[i].userName);
      assert.equal(await page.locator(".na1-m4-ns-def:visible").inputValue(), before.clusters[i].userDefinition);
      await page.locator(".df-nav").getByRole("button").last().click();
    }
    await page.locator('.vx-room[data-values-part="rank"]').waitFor();
    await page.locator(".df-nav").getByRole("button", { name: "← Back", exact: true }).click();
    for (let i = before.clusters.length - 1; i >= 0; i--) {
      assert.equal(await page.locator(".na1-m4-ns-name:visible").inputValue(), before.clusters[i].userName);
      await page.locator(".df-nav").getByRole("button", { name: "← Back", exact: true }).click();
    }
    await page.locator('[data-name-moment="cards"]').waitFor();
    assert.deepEqual(await read(page), before);
    await page.getByRole("button", { name: "← Back", exact: true }).click();
    await page.locator('.vx-room[data-values-part="flip"]').waitFor();
    await page.locator(".vx-progress button").nth(2).click();
    await page.locator('[data-name-moment="cards"]').waitFor();
    await page.getByRole("button", { name: "Name them →", exact: true }).click();
    await page.locator(".na1-m4-ns-name:visible").fill("Own It revised");
    await page.locator(".na1-m4-ns-def:visible").fill("A revised meaning");
    assert.deepEqual(completion(await read(page)), completion(before));
    await page.locator(".vx-progress button").nth(2).click();
    assert.equal(await page.locator(".vxnc-front strong").first().textContent(), "Own It revised");
  });
  await check("reduced motion removes slide/tilt/3D without blocking actions", { reduced: true, state: sorting }, async page => {
    const style = await page.locator(".vxnc-behavior").evaluate(e => ({ transform: getComputedStyle(e).transform, animation: getComputedStyle(e).animationName }));
    assert.equal(style.transform, "none"); assert.equal(style.animation, "none");
    for (const behavior of sorting.admire) await page.locator('.vxnc-tile[data-standard-id="cl-1"]').click();
    await page.locator('[data-name-moment="cards"]').waitFor();
    await page.locator(".vxnc-front").first().click();
    assert.equal(await page.locator(".vxnc-standard.is-turned .vxnc-flipper").evaluate(e => getComputedStyle(e).transform), "none");
    await page.getByRole("button", { name: "↺ turn back", exact: true }).click();
    await page.getByRole("button", { name: "Name them →", exact: true }).click();
    await page.locator(".na1-m4-ns-name:visible").waitFor();
  });
  await check("Preview All edits stay scratch-only and exit restores real progress", { preview: true }, async page => {
    const before = await read(page), count = writes.length;
    await page.locator(".vxnc-front").first().click();
    await page.locator(".vxnc-standard.is-turned .vxnc-behavior-row").first().click();
    await page.getByRole("button", { name: "↩ Send back", exact: true }).click();
    await page.locator('[data-name-moment="sort"]').waitFor();
    assert.deepEqual(await read(page), before); assert.equal(writes.length, count);
    await Promise.all([
      page.waitForEvent("domcontentloaded"),
      page.evaluate(async () => (await import("/src/devPreview.ts")).setDevPreview(false)),
    ]);
    await page.locator(".vx-opening").waitFor();
    await page.getByRole("button", { name: "Revisit →", exact: true }).click();
    await page.locator(".vx-progress button").nth(2).click();
    await page.locator('[data-name-moment="cards"]').waitFor();
    assert.deepEqual(await read(page), before);
  });
  assert.deepEqual(errors, []); assert.deepEqual(unexpected, []);
  console.log(JSON.stringify({ passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, errors, interceptedWrites: writes.length, unexpected }, null, 2));
  await browser.close();
  if (results.some(r => !r.pass)) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
