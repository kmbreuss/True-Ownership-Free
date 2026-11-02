const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const { chromium } = require("playwright");
const { fixtures } = require("./a1-fixtures.cjs");
const { proveIsolation, installIsolation } = require("./browser-isolation.cjs");
const f = fixtures(), out = path.resolve("generated-artifacts/values-experience");
const url = process.env.J1_BASE_URL || "http://localhost:80";
const admire = ["does what they commit to", "tells the truth kindly", "keeps learning", "shows up for people"]
  .map((text, i) => ({ id: `ad-${i}`, text, person: "", tier: i === 3 ? "warms" : "lights", inUseByCluster: i < 3 ? `c${i}` : null }));
const irks = ["blames everyone else", "breaks promises", "talks over people"]
  .map((text, i) => ({ id: `ir-${i}`, text, person: "", tier: i === 2 ? "bothers" : "turns", inUseByCluster: null }));
const values = { ...f.values, status: "in_progress", admire, irks,
  portrait: { lights: admire.slice(0, 3).map(b => b.id), warms: ["ad-3"], turns: ["ir-0", "ir-1"], bothers: ["ir-2"] },
  discoverSections: { admire: true, irks: true, portrait: true },
  clusters: ["Integrity", "Care", "Curiosity"].map((userName, i) => ({
    id: `c${i}`, userName, userDefinition: ["doing what I commit to", "being present", "always learning"][i],
    proposal: "", proposedNames: [], behaviorIds: [`ad-${i}`], flips: [], status: "complete",
    colorIndex: i + 1, peelChain: [], keystoneBehaviorId: `ad-${i}`,
  })), rank: ["c0", "c1", "c2"],
};
const claimed = { ...values, claimed: true, claimedAt: "2026-11-01T12:00:00.000Z" };
const results = [], fits = [], errors = [], writes = [], unexpected = [];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ["--no-sandbox"] });
  await proveIsolation(browser);
  async function open({ width = 1366, height = 680, theme = "light", state = claimed, room = null, grid = false, preview = false, rc = f.rc } = {}) {
    const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: "block" });
    await installIsolation(context, writes, unexpected, () => ({ intake: { name: "Synthetic" }, phase: "a1" }));
    const page = await context.newPage(); page.setDefaultTimeout(7000);
    page.on("pageerror", e => errors.push(e.message));
    await page.addInitScript(({ state, theme, room, grid, preview, rc }) => {
      if (sessionStorage.getItem("values-fixture")) return;
      sessionStorage.setItem("values-fixture", "1");
      localStorage.setItem("to_mirror4_state_v1", JSON.stringify(state));
      localStorage.setItem("to_rc_state_v1", JSON.stringify(rc));
      localStorage.setItem("na1_theme", theme);
      localStorage.setItem("to_app_route_v1", JSON.stringify({
        view: grid ? "grid" : "m4", overlay: room ? { hubId: "m4", roomId: room } : null,
      }));
      if (preview) sessionStorage.setItem("to_dev_preview", "1");
    }, { state, theme, room, grid, preview, rc });
    await page.goto(url + "/");
    await page.locator(grid ? ".na1-mirror-grid" : room ? ".vx-room" : ".vx-opening").waitFor();
    await page.evaluate(() => document.fonts.ready);
    return { context, page };
  }
  async function check(name, options, run) {
    if (process.env.VALUES_CASE && !new RegExp(process.env.VALUES_CASE).test(name)) return;
    let context;
    try {
      const opened = await open(options); context = opened.context;
      await run(opened.page); results.push({ name, pass: true }); console.log("PASS", name);
    } catch (e) { results.push({ name, pass: false, error: e.message }); console.log("FAIL", name, e.message.split("\n")[0]); }
    finally {
      fs.writeFileSync(path.join(out, "results.json"), JSON.stringify({ results, fits, errors, interceptedWrites: writes.length, unexpected }, null, 2));
      if (context) await context.close();
    }
  }
  for (const [width, height] of [[375, 812], [1280, 800], [1366, 680]]) for (const theme of ["light", "dark"]) {
    for (const room of [null, "admire", "irks", "portrait", "flip", "name", "rank", "claim"]) {
      await check(`fit ${room || "opening"} ${width}x${height} ${theme}`, { width, height, theme, room }, async page => {
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
        const geometry = await page.evaluate(() => {
          const frame = document.querySelector(".vx-room"), footer = frame?.querySelector(".na1-m4-disc-foot,.df-nav");
          const body = frame?.querySelector(".na1-m4-disc-content,.vx-claim-body,.df-sec:not([hidden])");
          const r = footer?.getBoundingClientRect();
          return { bodyOverflow: body ? Math.max(0, body.scrollHeight - body.clientHeight) : 0,
            footerVisible: !r || (r.top >= 0 && r.bottom <= innerHeight + 1),
            frameWidth: frame?.getBoundingClientRect().width ?? 0 };
        });
        fits.push({ room: room || "opening", width, height, theme, ...geometry });
        assert(geometry.footerVisible, "footer remains visible");
        if (width > 600 && room) assert(geometry.frameWidth <= 721, "720px frame");
        await page.screenshot({ path: path.join(out, `${room || "opening"}-${width}-${theme}.png`) });
        if (room) {
          const before = await page.evaluate(() => localStorage.getItem("to_mirror4_state_v1"));
          await page.reload(); await page.locator(".vx-room").waitFor();
          assert.equal(await page.locator(".na1-veil").count(), 0);
          assert.equal(await page.evaluate(() => localStorage.getItem("to_mirror4_state_v1")), before, "view/refresh preserve answers");
        }
      });
    }
    await check(`hub ${width}x${height} ${theme}`, { width, height, theme, grid: true }, async page => {
      assert.equal(await page.locator(".vx-hub-values").count(), 1);
      assert.equal(await page.locator('[data-a1-mirror="values"] .na1-mirror-pips').count(), 0);
      assert((await page.locator('[data-a1-mirror="values"]').textContent()).includes("★ CLAIMED"));
      assert.equal(await page.locator(".na1-mirror-grid").evaluate(e => getComputedStyle(e).gridTemplateColumns.split(" ").length), width < 768 ? 1 : 2);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.screenshot({ path: path.join(out, `hub-${width}-${theme}.png`), fullPage: true });
    });
  }
  for (const [width, height] of [[375, 812], [1280, 800], [1366, 680]]) for (const theme of ["light", "dark"]) {
    await check(`naming controls ${width}x${height} ${theme}`, { width, height, theme, room: "name" }, async page => {
      if (width > 767) await page.locator(".df-nav").getByRole("button", { name: "Continue →", exact: true }).click();
      const field = page.locator(".na1-m4-ns-name").filter({ visible: true }).first();
      await field.waitFor(); assert.equal(await field.inputValue(), "Integrity");
      const geometry = await page.evaluate(() => {
        const e = document.querySelector(".df-sec:not([hidden]):last-of-type");
        return { bodyOverflow: e ? e.scrollHeight - e.clientHeight : 0 };
      });
      fits.push({ room: "naming controls", width, height, theme, ...geometry });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.screenshot({ path: path.join(out, `name-controls-${width}-${theme}.png`) });
    });
    const pressure = { ...claimed, pressureTest: { ...claimed.pressureTest,
      pairs: [{ aId: "c0", bId: "c1", pickedId: "c0", matchedRank: true }], activePairIdx: 1 } };
    await check(`pressure pair ${width}x${height} ${theme}`, { width, height, theme, room: "rank", state: pressure }, async page => {
      if (width > 767) await page.locator(".df-nav").getByRole("button", { name: "Continue →", exact: true }).click();
      await page.locator(".na1-m4-rank-pt-btn").filter({ visible: true }).first().click();
      await page.getByText("When these two pull against each other, which one wins?", { exact: true }).waitFor();
      assert.equal(await page.locator(".na1-m4-pt-card").count(), 2);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      const r = await page.locator(".na1-m4-pt-modal").boundingBox();
      assert(r && r.y >= 0 && r.y + r.height <= height + 1, "pressure frame fits");
      await page.screenshot({ path: path.join(out, `pressure-${width}-${theme}.png`) });
      await page.locator(".na1-m4-pt-card").first().click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem("to_mirror4_state_v1")).pressureTest.activePairIdx >= 2);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("to_mirror4_state_v1")).claimed), true);
    });
  }
  await check("claimed overrides unfinished Rank without rewriting flags", {}, async page => {
    assert.equal(await page.locator(".vx-finding").allTextContents().then(a => a.join("|")), "Claimed|Claimed|Claimed|Claimed");
    assert.equal(await page.locator(".vx-stop-circle").allTextContents().then(a => a.join("")), "✓✓✓✓");
    assert(!(await page.locator(".vx-opening").textContent()).includes("You are here"));
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("to_mirror4_state_v1")));
    assert.equal(saved.claimed, true); assert.equal(saved.pressureTest.complete, false);
    await page.getByRole("button", { name: "Revisit →", exact: true }).click();
    await page.locator('.vx-room[data-values-part="admire"]').waitFor();
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("to_mirror4_state_v1"))), saved);
  });
  const legacy = { ...claimed }; delete legacy.discoverSections;
  await check("legacy missing discovery flags stay claimed", { state: legacy }, async page => {
    assert.equal(await page.locator(".vx-finding").count(), 4);
    assert.equal(await page.evaluate(() => "discoverSections" in JSON.parse(localStorage.getItem("to_mirror4_state_v1"))), false);
  });
  await check("fresh member save, Notice resume, portrait editing and Flip access", { state: f.values }, async page => {
    await page.getByRole("button", { name: "Continue with Notice →", exact: true }).click();
    await page.locator("#m4-ai-admire-input").fill("a synthetic commitment");
    await page.getByRole("button", { name: /\+ ★ Lights me up/ }).click();
    await page.getByText("a synthetic commitment", { exact: true }).waitFor();
    assert((await page.locator(".vx-just-added").textContent()).includes("JUST ADDED"));
    await page.getByRole("button", { name: "I've got them →", exact: true }).click();
    await page.getByRole("button", { name: "Continue with Notice →", exact: true }).click();
    await page.locator("#m4-ai-irks-input").fill("a synthetic irk");
    await page.getByRole("button", { name: /\+ ⚡ Turns my stomach/ }).click();
    await page.getByRole("button", { name: "I've got them →", exact: true }).click();
    await page.getByRole("button", { name: "Continue with Notice →", exact: true }).click();
    await page.getByRole("button", { name: "Edit portrait", exact: true }).click();
    await page.getByRole("button", { name: "← Your portrait", exact: true }).click();
    await page.getByRole("button", { name: "Find what's underneath →", exact: true }).click();
    await page.getByRole("button", { name: "Continue with Flip →", exact: true }).waitFor();
  });
  await check("mid Name resumes at Name", { state: { ...values, clusters: [], flips: irks.map(b => ({ irkId: b.id, accepted: false, toText: "" })) } }, async page => {
    await page.getByRole("button", { name: "Continue with Name →", exact: true }).waitFor();
    await page.getByRole("button", { name: "Continue with Name →", exact: true }).click();
    await page.locator('.vx-room[data-values-part="name"]').waitFor();
  });
  await check("Name edits meaning and evidence without clearing claim", { room: "name" }, async page => {
    await page.locator(".df-nav").getByRole("button", { name: "Continue →", exact: true }).click();
    await page.locator(".na1-m4-ns-name").filter({ visible: true }).first().fill("Integrity revised");
    await page.locator(".na1-m4-ns-def").filter({ visible: true }).first().fill("a revised meaning");
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem("to_mirror4_state_v1")));
    assert.equal(state.claimed, true); assert.equal(state.clusters[0].userName, "Integrity revised");
  });
  await check("existing claim saves and unlocks Identity", { room: "claim", state: { ...values, pressureTest: { ...values.pressureTest, complete: true } } }, async page => {
    await page.getByRole("button", { name: "Claim it · go to Map of Me →", exact: true }).click();
    await page.getByRole("button", { name: "Revisit →", exact: true }).waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("to_mirror4_state_v1")).claimed), true);
    await page.getByRole("button", { name: "← Back to A1", exact: true }).click();
    assert.notEqual(await page.locator('[data-a1-mirror="identity"]').getAttribute("aria-disabled"), "true");
  });
  await check("no Future B means no thread", { rc: { ...f.rc, choice: "A" } }, async page => {
    assert.equal(await page.locator(".vx-thread").count(), 0);
  });
  const long = { ...claimed, admire: claimed.admire.map(b => ({ ...b, text: b.text.repeat(8) })),
    clusters: claimed.clusters.map(c => ({ ...c, userName: c.userName.repeat(8) })) };
  for (const room of ["admire", "portrait", "name", "claim"]) await check(`long text ${room}`, { width: 375, height: 812, room, state: long }, async page => {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("to_mirror4_state_v1")).admire[0].text), long.admire[0].text);
  });
  await check("Preview scratch never saves and exit restores", { state: claimed, preview: true }, async page => {
    const before = writes.length;
    await page.evaluate(async () => {
      const preview = await import("/src/devPreview.ts");
      preview.previewWrite("to_mirror4_state_v1", JSON.stringify({ claimed: false, admire: [{ text: "PREVIEW ONLY" }] }));
    });
    assert.equal(writes.length, before);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("to_mirror4_state_v1")).claimed), true);
    await page.evaluate(async () => (await import("/src/devPreview.ts")).setDevPreview(false));
    await page.waitForLoadState("load"); await page.locator(".vx-opening").waitFor();
    assert.equal(await page.locator(".vx-finding").allTextContents().then(a => a.join("|")), "Claimed|Claimed|Claimed|Claimed");
    assert(!(await page.locator(".vx-opening").textContent()).includes("PREVIEW ONLY"));
  });
  assert.deepEqual(unexpected, []);
  assert(writes.length > 0, "normal-mode userdata mutations were intercepted");
  const report = { results, fits, errors, interceptedWrites: writes.length, unexpected };
  fs.writeFileSync(path.join(out, "results.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length,
    errors, desktopOverflow: fits.filter(f => f.width > 600 && f.bodyOverflow > 1), interceptedWrites: writes.length }, null, 2));
  await browser.close();
  if (results.some(r => !r.pass) || errors.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
