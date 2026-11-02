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
let activeBrowser;
function completion(state) {
  return { claimed: state.claimed, claimedAt: state.claimedAt, status: state.status,
    currentStep: state.currentStep, discoverSections: state.discoverSections, pressure: state.pressureTest.complete };
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"], headless: true });
  activeBrowser = browser;
  await proveIsolation(browser);
  async function open({ width = 1366, height = 680, theme = "light", state = claimed, reduced = false, preview = false } = {}) {
    const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: "block", reducedMotion: reduced ? "reduce" : "no-preference" });
    await installIsolation(context, writes, unexpected, () => ({ intake: { name: "Synthetic" }, phase: "a1" }));
    await context.route("**/api/claude", route => route.fulfill({ json: { content: [{ text: '{"scenarios":{}}' }] } }));
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
            cards: grid ? [...grid.children].filter(e => getComputedStyle(e).display !== "none").map(rect) : [], oldBoards: frame.querySelectorAll(".na1-m4-ns-board").length,
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
  const footer = page => page.locator(".vx-room .df-nav,.vx-room .na1-m4-disc-foot").filter({ visible: true }).last();
  const next = page => footer(page).getByRole("button").last().click();
  const back = page => footer(page).getByRole("button", { name: "← Back", exact: true }).click();
  const many = { ...claimed, clusters: [...claimed.clusters, ...Array.from({ length: 8 }, (_, i) => ({
    ...claimed.clusters[0], id: `cl-${i + 6}`, userName: `Extra ${i + 1}`, behaviorIds: [], keystoneBehaviorId: null,
  }))] };
  for (const [width, height] of [[375, 812], [1280, 800], [1366, 680]]) for (const theme of ["light", "dark"]) {
    for (const moment of ["first", "inline", "pages", "remove", "rename", "add", "summary"]) {
      await check(`new fit ${moment} ${width}x${height} ${theme}`,
        { width, height, theme, state: ["first", "inline"].includes(moment) ? fresh : moment === "pages" ? many : claimed }, async page => {
          if (moment === "inline") {
            await page.getByRole("button", { name: "+ Name your first standard", exact: true }).click();
            assert(await page.getByText("you can rename it later", { exact: true }).isVisible());
          }
          if (moment === "pages") {
            const seen = new Set();
            for (let i = 0; i < 3; i++) {
              for (const id of await page.locator(".vxnc-standard").evaluateAll(es => es.map(e => e.dataset.standardId))) seen.add(id);
              const control = page.getByRole("button", { name: "Next cards", exact: true });
              assert(await control.evaluate(e => e.clientWidth >= 44 && e.clientHeight >= 44));
              if (i < 2) await control.click();
            }
            assert.equal(seen.size, many.clusters.length);
            assert(await page.getByRole("button", { name: "Next cards", exact: true }).isDisabled());
          }
          if (moment === "remove") {
            await page.locator(".vxnc-front").first().click();
            await page.getByRole("button", { name: "Remove this standard", exact: true }).click();
            assert(await page.getByRole("button", { name: "Keep it", exact: true }).isVisible());
          }
          if (moment === "rename" || moment === "add") {
            await page.locator(".vxnc-front").first().click();
            await page.getByRole("button", { name: moment === "rename" ? "Change the name" : "+ Add a behavior", exact: true }).click();
            await page.getByRole("textbox", { name: moment === "rename" ? "Standard name" : "Add a behavior", exact: true }).fill(moment === "rename" ? "Ownership" : "Makes time for what matters");
          }
          if (moment === "summary") {
            await next(page);
            await page.locator('[data-name-moment="summary"]').waitFor();
            assert.equal(await page.locator(".vxnc-summary dd").count(), 5);
          }
          const geometry = await page.locator(".vx-room").evaluate(frame => {
            const content = frame.querySelector(".na1-m4-disc-content"), sort = frame.querySelector(".vxnc-sort-body");
            const footer = frame.querySelector(".vxnc-layout footer").getBoundingClientRect();
            return { sideways: document.documentElement.scrollWidth - innerWidth, bodyOverflow: content.scrollHeight - content.clientHeight,
              sortOverflow: sort ? sort.scrollHeight - sort.clientHeight : 0, footerBottom: footer.bottom };
          });
          assert(geometry.sideways <= 1 && geometry.bodyOverflow <= 1 && geometry.sortOverflow <= 1 && geometry.footerBottom <= height + 1, JSON.stringify(geometry));
          await page.screenshot({ path: path.join(out, `new-${moment}-${width}-${theme}.png`), animations: "disabled" });
        });
    }
  }
  await check("opening stops route to their own part without saving", {}, async page => {
    const before = await read(page);
    await page.locator(".vx-room .na1-room-crumb a").click();
    for (const [index, key] of [[0, "admire"], [1, "flip"], [2, "name"], [3, "rank"]]) {
      await page.locator(".vx-stop").nth(index).click();
      await page.locator(`.vx-room[data-values-part="${key}"]`).waitFor();
      if (key === "name") await page.locator('[data-name-moment="cards"]').waitFor();
      await page.locator(".vx-room .na1-room-crumb a").click();
    }
    assert.deepEqual(await read(page), before);
  });
  await check("remove named ranked standard preserves every behavior and flags", {}, async page => {
    const before = await read(page), id = before.clusters[0].id;
    await page.locator(".vxnc-front").first().click();
    await page.getByRole("button", { name: "Remove this standard", exact: true }).click();
    await page.getByRole("button", { name: "Keep it", exact: true }).click();
    assert.deepEqual(await read(page), before);
    await page.getByRole("button", { name: "Remove this standard", exact: true }).click();
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    await page.locator('[data-name-moment="cards"]').waitFor();
    const saved = await read(page);
    assert.equal(saved.admire.length, before.admire.length); assert.equal(saved.irks.length, before.irks.length);
    assert.deepEqual(saved.admire.map(b => [b.id, b.text]), before.admire.map(b => [b.id, b.text]));
    assert.deepEqual(saved.rank, before.rank.filter(k => k !== id));
    assert(!saved.clusters.some(c => c.id === id));
    assert(saved.admire.filter(b => before.clusters[0].behaviorIds.includes(b.id)).every(b => b.inUseByCluster == null));
    assert.deepEqual(completion(saved), completion(before));
    await page.reload(); await page.locator('[data-name-moment="cards"]').waitFor();
    assert.deepEqual(await read(page), saved);
  });
  await check("fresh account completes Values through first-time sorting and summary", { state: f.values }, async page => {
    await page.locator(".vx-room .na1-room-crumb a").click();
    await page.locator(".vx-stop").first().click();
    for (const text of ["Shows up for people", "Takes responsibility", "Keeps learning"]) {
      await page.locator("#m4-ai-admire-input").fill(text);
      await page.getByRole("button", { name: /\+ ★ Lights me up/ }).click();
    }
    await page.getByRole("button", { name: "Next: what you can’t stand →", exact: true }).click();
    await page.locator("#m4-ai-irks-input").fill("Blames everyone else");
    await page.getByRole("button", { name: /\+ ⚡ Turns my stomach/ }).click();
    await page.getByRole("button", { name: "See my portrait →", exact: true }).click();
    await next(page); await page.locator('.vx-room[data-values-part="flip"]').waitFor();
    await next(page); await page.locator('[data-name-moment="sort"]').waitFor();
    assert(await page.getByText("You don’t have any standards yet. Start one with this behavior. What does it point to?", { exact: true }).isVisible());
    await page.getByRole("button", { name: "+ Name your first standard", exact: true }).click();
    await page.getByRole("textbox", { name: "Name your standard", exact: true }).fill("Care");
    await page.getByRole("button", { name: "Start this standard →", exact: true }).click();
    assert(await page.getByText("Same standard, or a new one?", { exact: true }).isVisible());
    assert((await page.locator(".vxnc-tile").first().textContent()).includes("1 behavior"));
    assert(!(await page.locator(".vxnc-tile").first().textContent()).includes("1 behaviors"));
    await page.getByRole("button", { name: "+ New standard", exact: true }).click();
    await page.getByRole("textbox", { name: "Name your standard", exact: true }).fill("Ownership");
    await page.getByRole("button", { name: "Start this standard →", exact: true }).click();
    await page.locator(".vxnc-tile[data-standard-id]").first().click();
    await page.locator('[data-name-moment="cards"]').waitFor();
    const sorted = await read(page);
    for (const cluster of sorted.clusters) {
      await page.locator(`.vxnc-standard[data-standard-id="${cluster.id}"] .vxnc-front`).click();
      await page.locator(".vxnc-standard.is-turned .vxnc-evidence-star").first().click();
      await page.getByRole("button", { name: "↺ turn back", exact: true }).click();
    }
    await page.locator(".vxnc-front").first().click();
    await page.getByRole("button", { name: "Change the name", exact: true }).click();
    await page.getByRole("textbox", { name: "Standard name", exact: true }).fill("Caring");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await next(page);
    await page.locator('[data-name-moment="summary"]').waitFor();
    assert.equal(await page.locator(".na1-m4-ns-name:visible").count(), 0, "no repeated naming step");
    assert(await page.locator(".vxnc-summary dt").getByText("Caring", { exact: true }).isVisible());
    assert(await page.getByRole("button", { name: "Next: which one wins →", exact: true }).isVisible());
    await next(page); await next(page);
    await page.getByRole("button", { name: "Got it — start →", exact: true }).click();
    await page.locator(".na1-m4-pt-cards button").first().click();
    await page.getByRole("heading", { name: "Order tested.", exact: true }).waitFor();
    assert.equal((await read(page)).pressureTest.complete, false);
    await next(page); // answered Done footer -> complete and Claim
    await page.locator('.vx-room[data-values-part="claim"]').waitFor();
    assert.equal((await read(page)).pressureTest.complete, true, "answered footer saves completion before Claim loads");
    await page.getByRole("button", { name: /Claim it/ }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("to_mirror4_state_v1")).claimed === true);
    const saved = await read(page);
    assert.equal(saved.claimed, true); assert.equal(saved.admire.length, 3); assert.equal(saved.irks.length, 1);
    assert(saved.admire.every(b => b.inUseByCluster));
    assert.equal(saved.clusters.length, 2);
  });
  await check("claimed review walks every screen forward and back without writes", {}, async page => {
    const before = await read(page), count = writes.length;
    await page.locator(".vx-room .na1-room-crumb a").click();
    await page.getByRole("button", { name: "Revisit →", exact: true }).click();
    for (const room of ["admire", "irks", "portrait", "flip"]) {
      await page.locator(`.vx-room[data-values-part="${room}"]`).waitFor();
      assert.equal((await footer(page).getByRole("button").last().textContent()).trim(), "Next →");
      await next(page);
    }
    await page.locator('[data-name-moment="cards"]').waitFor(); await next(page);
    await page.locator('[data-name-moment="summary"]').waitFor(); await next(page);
    await page.locator('.vx-room[data-values-part="rank"]').waitFor(); await next(page);
    const pairCount = helpers.m4PressureTestPairs(before.rank).length;
    for (let i = 0; i < pairCount; i++) await next(page);
    await page.locator('.vx-room[data-values-part="claim"]').waitFor();
    assert(await page.getByRole("button", { name: "Done reviewing →", exact: true }).isVisible());
    await back(page);
    for (let i = 0; i < pairCount; i++) await back(page);
    await page.locator('.vx-room[data-values-part="rank"]').waitFor(); await back(page);
    await page.locator('[data-name-moment="summary"]').waitFor(); await back(page);
    await page.locator('[data-name-moment="cards"]').waitFor(); await back(page);
    for (const room of ["flip", "portrait", "irks", "admire"]) {
      await page.locator(`.vx-room[data-values-part="${room}"]`).waitFor(); await back(page);
    }
    await page.getByRole("button", { name: "Revisit →", exact: true }).waitFor();
    assert.deepEqual(await read(page), before); assert.equal(writes.length, count);
    await page.locator(".vx-stop").last().click(); await next(page);
    for (let i = 0; i < pairCount; i++) await next(page);
    await page.getByRole("button", { name: "Done reviewing →", exact: true }).click();
    await page.getByRole("button", { name: "Revisit →", exact: true }).waitFor();
    assert.deepEqual(await read(page), before);
  });
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
      assert((await page.locator(`.vxnc-standard[data-standard-id="${cluster.id}"] .vxnc-front`).textContent()).includes(`${cluster.behaviorIds.length} ${cluster.behaviorIds.length === 1 ? "behavior" : "behaviors"}`));
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
    await page.getByRole("button", { name: "Start this standard →", exact: true }).click();
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
    await page.locator('[data-name-moment="cards"]').waitFor();
    assert.equal(expected.admire.find(b => b.id === "ad-0").inUseByCluster, null);
    assert.deepEqual(await read(page), expected); assert.deepEqual(completion(expected), completion(before));
    await page.reload(); await page.locator('[data-name-moment="cards"]').waitFor();
    assert.deepEqual(await read(page), expected);
  });
  await check("grid creation and move-to-new preserve existing operations", {}, async page => {
    let expected = await read(page);
    await page.getByRole("button", { name: "+ New standard", exact: true }).click();
    await page.getByRole("textbox", { name: "Name your standard", exact: true }).fill("Courage");
    await page.getByRole("button", { name: "Start this standard →", exact: true }).click();
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
    await page.getByRole("button", { name: "Next cards", exact: true }).click();
    assert(await page.locator(`.vxnc-standard[data-standard-id="${next.cluster.id}"]`).count());
  });
  for (const width of [375, 1366]) await check(`Values Back/Next, naming controls, review flags ${width}`, { width, height: width === 375 ? 812 : 680 }, async page => {
    const before = await read(page);
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.locator('[data-name-moment="summary"]').waitFor();
    assert.deepEqual(await page.locator(".vxnc-summary dd").allTextContents(), before.clusters.map(c => c.userDefinition));
    assert.equal(await page.locator(".na1-m4-ns-name:visible").count(), 0);
    assert.deepEqual(await read(page), before, "summary display never saves");
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.locator('.vx-room[data-values-part="rank"]').waitFor();
    await page.locator(".df-nav").getByRole("button", { name: "← Back", exact: true }).click();
    await page.locator('[data-name-moment="summary"]').waitFor();
    await page.getByRole("button", { name: "← Back", exact: true }).click();
    await page.locator('[data-name-moment="cards"]').waitFor();
    assert.deepEqual(await read(page), before);
    await page.getByRole("button", { name: "← Back", exact: true }).click();
    await page.locator('.vx-room[data-values-part="flip"]').waitFor();
    await page.locator(".vx-progress button").nth(2).click();
    await page.locator('[data-name-moment="cards"]').waitFor();
    await page.locator(".vxnc-front").first().click();
    await page.getByRole("button", { name: "Change the name", exact: true }).click();
    await page.getByRole("textbox", { name: "Standard name", exact: true }).fill("Own It revised");
    await page.getByRole("button", { name: "Save", exact: true }).click();
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
    await page.getByRole("button", { name: "Next: the standards you hold →", exact: true }).click();
    await page.locator('[data-name-moment="summary"]').waitFor();
  });
  await check("Preview All on/off restores real claimed Values and Revisit", {}, async page => {
    const before = await read(page);
    await Promise.all([
      page.waitForEvent("domcontentloaded"),
      page.evaluate(async () => (await import("/src/devPreview.ts")).setDevPreview(true)),
    ]);
    await page.locator('[data-name-moment="cards"]').waitFor();
    const count = writes.length;
    await page.locator(".vxnc-front").first().click();
    await page.locator(".vxnc-standard.is-turned .vxnc-evidence-star").first().click();
    await page.getByRole("button", { name: "Change the name", exact: true }).click();
    await page.getByRole("textbox", { name: "Standard name", exact: true }).fill("Preview rename only");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.getByRole("button", { name: "+ Add a behavior", exact: true }).click();
    await page.getByRole("textbox", { name: "Add a behavior", exact: true }).fill("Preview evidence only");
    await page.locator(".vxnc-add").getByRole("button", { name: "Add", exact: true }).click();
    await page.locator(".vxnc-standard.is-turned .vxnc-behavior-row").first().click();
    await page.getByRole("button", { name: "↩ Send back", exact: true }).click();
    await page.locator('[data-name-moment="sort"],[data-name-moment="cards"]').waitFor();
    assert.deepEqual(await read(page), before); assert.equal(writes.length, count);
    await Promise.all([
      page.waitForEvent("domcontentloaded"),
      page.evaluate(async () => (await import("/src/devPreview.ts")).setDevPreview(false)),
    ]);
    await page.locator('[data-name-moment="cards"]').waitFor();
    assert.deepEqual(await read(page), before, "real claimed assignments restored");
    await page.locator(".vx-room .na1-room-crumb a").click();
    await page.locator(".vx-opening").waitFor();
    assert.equal(await page.locator(".vx-finding").allTextContents().then(a => a.join("|")), "Claimed|Claimed|Claimed|Claimed");
    await page.getByRole("button", { name: "Revisit →", exact: true }).click();
    await page.locator(".vx-progress button").nth(2).click();
    await page.locator('[data-name-moment="cards"]').waitFor();
    assert.deepEqual(await read(page), before);
  });
  await check("card-back rename star add and Remove match existing saves across refresh", {}, async page => {
    let expected = await read(page);
    const flags = completion(expected), first = expected.clusters[0];
    await page.locator(".vxnc-front").first().click();
    await page.getByRole("button", { name: "Change the name", exact: true }).click();
    await page.getByRole("textbox", { name: "Standard name", exact: true }).fill("Cancelled name");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    assert.deepEqual(await read(page), expected);
    await page.getByRole("button", { name: "Change the name", exact: true }).click();
    await page.getByRole("textbox", { name: "Standard name", exact: true }).fill("Ownership");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    expected = plain(helpers.updateCluster(expected, first.id, c => ({ ...c, userName: "Ownership" })));
    assert.deepEqual(await read(page), expected);
    await page.locator(".is-turned .vxnc-evidence-star").first().click();
    expected = plain(helpers.m4SetKeystone(expected, first.id, first.behaviorIds[0]));
    assert.deepEqual(await read(page), expected);
    assert(await page.getByText("4 OF 5 CHECKED", { exact: false }).isVisible());
    await page.locator(".is-turned .vxnc-evidence-star").nth(1).click();
    expected = plain(helpers.m4SetKeystone(expected, first.id, first.behaviorIds[1]));
    assert.deepEqual(await read(page), expected);
    await page.getByRole("button", { name: "+ Add a behavior", exact: true }).click();
    await page.getByRole("textbox", { name: "Add a behavior", exact: true }).fill("Names what matters");
    await page.locator(".vxnc-add").getByRole("button", { name: "Add", exact: true }).click();
    expected = plain(helpers.addEvidenceBehaviorToCluster(expected, first.id, "Names what matters"));
    assert.deepEqual(await read(page), expected);
    const added = expected.clusters[0].behaviorIds.at(-1);
    await page.locator(".is-turned .vxnc-evidence-star").last().click();
    expected = plain(helpers.m4SetKeystone(expected, first.id, added));
    await page.locator(".is-turned .vxnc-behavior-row").getByText("Names what matters", { exact: true }).click();
    await page.locator(".vxnc-move-menu").getByRole("button", { name: "Remove", exact: true }).click();
    expected = plain(helpers.removeBehaviorFromCluster(expected, first.id, added));
    assert.deepEqual(await read(page), expected);
    assert.equal(expected.admire.find(b => b.id === added).text, "Names what matters");
    assert.equal(expected.admire.find(b => b.id === added).inUseByCluster, null);
    assert.equal(expected.clusters[0].keystoneBehaviorId, null);
    assert.deepEqual(completion(expected), flags);
    await page.reload(); await page.locator('[data-name-moment="cards"]').waitFor();
    assert.deepEqual(await read(page), expected);
    await page.locator(".vxnc-front").first().click();
    await page.locator(".is-turned .vxnc-evidence-star").first().click();
    expected = plain(helpers.m4SetKeystone(expected, first.id, first.behaviorIds[0]));
    await page.getByRole("button", { name: "↺ turn back", exact: true }).click();
    assert((await page.locator(".vxnc-front small").first().textContent()).startsWith("✓ ★ Problem solves"));
    assert.deepEqual(await read(page), expected);
  });
  await check("Next remains available without stars or standards", { state: f.values }, async page => {
    const button = page.getByRole("button", { name: "Next: the standards you hold →", exact: true });
    assert(await button.isEnabled()); await button.click();
    await page.locator('[data-name-moment="summary"]').waitFor();
    assert.equal(await page.locator(".na1-m4-ns-name:visible").count(), 0);
    await back(page); await page.locator('[data-name-moment="cards"]').waitFor();
  });
  const guardSeq = plain(helpers.m4PressureTestPairs(claimed.rank));
  for (const mode of ["missing", "skipped", "invalid", "answered"]) {
    const pairs = guardSeq.map(p => ({ ...p, pickedId: p.aId, matchedRank: true }));
    if (mode === "missing") pairs.shift();
    if (mode === "skipped") pairs[0].pickedId = null;
    if (mode === "invalid") pairs[0].pickedId = "not-a-standard";
    const state = { ...claimed, claimed: false, claimedAt: null, status: "in_progress",
      pressureTest: { ...claimed.pressureTest, complete: false, activePairIdx: guardSeq.length, pairs } };
    for (const exit of ["footer", "Done"]) await check(`pressure completion guard ${mode} ${exit}`, { state }, async page => {
      await next(page); await next(page); await next(page);
      await page.getByRole("heading", { name: "Order tested.", exact: true }).waitFor();
      const before = await read(page);
      assert.equal(before.pressureTest.complete, false);
      if (exit === "Done") await page.getByRole("button", { name: "Done → Back to Values", exact: true }).click();
      else await next(page);
      await page.locator('.vx-room[data-values-part="claim"]').waitFor();
      const after = await read(page), answered = mode === "answered";
      assert.equal(after.pressureTest.complete, answered);
      assert.equal(await page.getByRole("button", { name: /Claim it/ }).isEnabled(), answered);
      assert.deepEqual(after.pressureTest.pairs, before.pressureTest.pairs);
      assert.equal(after.claimed, false);
      assert.deepEqual(after, answered ? { ...before, pressureTest: { ...before.pressureTest, complete: true } } : before);
    });
  }
  assert.deepEqual(errors, []); assert.deepEqual(unexpected, []);
  console.log(JSON.stringify({ passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, errors, interceptedWrites: writes.length, unexpected }, null, 2));
  await browser.close();
  if (results.some(r => !r.pass)) process.exitCode = 1;
})().catch(async error => { console.error(error); await activeBrowser?.close(); process.exitCode = 1; });
