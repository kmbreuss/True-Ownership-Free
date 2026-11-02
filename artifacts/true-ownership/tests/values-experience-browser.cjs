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
const savedPairs = [["c0", "c1"], ["c1", "c2"], ["c0", "c2"]].map(([aId, bId]) => ({ aId, bId, pickedId: aId, matchedRank: true }));
const reviewFixture = { ...claimed, pressureTest: { ...values.pressureTest, complete: true, activePairIdx: 3, pairs: savedPairs } };
const midFixture = { ...reviewFixture, claimed: false, claimedAt: null,
  discoverSections: { admire: true, irks: false, portrait: false },
  pressureTest: { ...reviewFixture.pressureTest, complete: false, activePairIdx: 0 } };
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
        if (width > 767 && ["admire", "flip", "rank"].includes(room)) {
          assert(geometry.bodyOverflow <= 1, `${room}: only the ranked list may scroll, not the body (${geometry.bodyOverflow}px)`);
        }
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
      await page.locator(".df-nav").getByRole("button", { name: "Continue →", exact: true }).click();
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
      await page.locator(".df-nav").getByRole("button", { name: "Continue →", exact: true }).click();
      await page.getByText("When these two pull against each other, which one wins?", { exact: true }).waitFor();
      assert.equal(await page.locator(".na1-m4-pt-card").count(), 2);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      const r = await page.locator(".na1-m4-pt-modal").boundingBox();
      assert(r && r.y >= 0 && r.y + r.height <= height + 1, "pressure frame fits");
      const cards = await page.locator(".na1-m4-pt-card").evaluateAll(nodes => nodes.map(node => {
        const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom };
      }));
      assert(cards.every(c => c.x >= r.x && c.right <= r.x + r.width + 1 && c.y >= r.y && c.bottom <= r.y + r.height + 1), "both choices stay inside the frame");
      if (width <= 600) assert(cards[1].y >= cards[0].bottom, "phone choices stack vertically");
      await page.screenshot({ path: path.join(out, `pressure-${width}-${theme}.png`) });
      await page.locator(".na1-m4-pt-card").first().click();
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("to_mirror4_state_v1")).pressureTest.activePairIdx), 1, "review does not move the persisted completion cursor");
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("to_mirror4_state_v1")).claimed), true);
    });
  }
  for (const [width, height] of [[375, 812], [1280, 800], [1366, 680]]) for (const theme of ["light", "dark"]) {
    for (const room of ["admire", "irks"]) for (const long of [false, true]) {
      const tiers = room === "admire" ? ["lights", "warms"] : ["turns", "bothers"];
      const behaviors = long ? Array.from({ length: 20 }, (_, i) => ({
        id: `single-${room}-${i}`, text: `Synthetic behavior ${i + 1}`, person: "", tier: tiers[i % 2], inUseByCluster: null,
      })) : values[room];
      await check(`single list ${room} ${long ? "long" : "short"} ${width}x${height} ${theme}`,
        { width, height, theme, room, state: { ...claimed, [room]: behaviors } }, async page => {
        const input = page.locator(`#m4-ai-${room}-input`), list = page.locator(".na1-m4-ai-cols");
        assert.equal(await page.getByText("How to add and edit", { exact: true }).count(), 0);
        assert.equal(await page.locator(".na1-m4-ai-item").count(), behaviors.length, "all behaviors are in the shared list");
        const expected = tiers.flatMap(tier => behaviors.filter(b => b.tier === tier).map(b => b.text));
        assert.deepEqual(await page.locator(".na1-m4-ai-item-text").allTextContents(), expected, "strongest behaviors come first");
        const before = await page.evaluate(() => {
          const rect = selector => {
            const r = document.querySelector(selector).getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, bottom: r.bottom };
          };
          const list = document.querySelector(".na1-m4-ai-cols"), body = document.querySelector(".na1-m4-disc-content");
          return { input: rect(".na1-m4-input"), content: rect(".na1-m4-disc-content"),
            footer: rect(".na1-m4-disc-foot"), list: rect(".na1-m4-ai-cols"),
            bodyOverflow: body.scrollHeight - body.clientHeight, listOverflow: list.scrollHeight - list.clientHeight,
            nestedScrollers: [...list.querySelectorAll("*")].filter(e => /(auto|scroll)/.test(getComputedStyle(e).overflowY)).length,
            sideways: document.documentElement.scrollWidth > innerWidth + 1 };
        });
        assert(Math.abs(before.input.width - before.content.width) <= 1, "input fills content width");
        assert(!before.sideways && before.bodyOverflow <= 1, "only the shared list may scroll");
        assert.equal(before.nestedScrollers, 0, "no separate strength scroll boxes");
        assert(before.footer.bottom <= height + 1 && before.list.bottom <= before.footer.y, "list and footer stay inside the frame");
        assert(before.list.bottom - before.list.y > 40, "list has usable space");
        if (long) assert(before.listOverflow > 0, "long list scrolls");
        await list.evaluate(e => { e.scrollTop = e.scrollHeight; });
        assert(Math.abs((await input.boundingBox()).y - before.input.y) <= 1, "input stays fixed when the list scrolls");
        assert(Math.abs((await page.locator(".na1-m4-disc-foot").boundingBox()).y - before.footer.y) <= 1, "footer stays fixed when the list scrolls");
        await page.screenshot({ path: path.join(out, `single-${room}-${long ? "long" : "short"}-${width}-${theme}.png`) });
        await input.fill("Synthetic new behavior");
        await page.locator(".na1-m4-ai-buttons button").first().click();
        await page.waitForFunction(({ room, count }) => JSON.parse(localStorage.getItem("to_mirror4_state_v1"))[room].length === count,
          { room, count: behaviors.length + 1 });
        assert(Math.abs((await input.boundingBox()).y - before.input.y) <= 1, "adding preserves fixed input position");
      });
    }
  }
  for (const [width, height] of [[375, 812], [1280, 800], [1366, 680]]) for (const theme of ["light", "dark"]) {
    for (const room of ["flip", "rank", "pressure"]) {
      await check(`navigation fit ${room} ${width}x${height} ${theme}`,
        { width, height, theme, room: room === "pressure" ? "rank" : room, state: reviewFixture }, async page => {
        if (room === "pressure") await page.locator(".vx-room .df-nav").getByRole("button").last().click();
        const geometry = await page.evaluate(() => {
          const box = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom }; };
          const frame = document.querySelector(".vx-room"), footer = [...frame.querySelectorAll(".df-nav,.na1-m4-disc-foot")].find(e => e.getBoundingClientRect().height > 0);
          const body = frame.querySelector(".na1-m4-pt-body,.na1-m4-disc-content,.df-sec:not([hidden])");
          const cards = [...frame.querySelectorAll(".na1-m4-pt-card")];
          return { frame: box(frame), footer: box(footer), bodyOverflow: body.scrollHeight - body.clientHeight,
            cards: cards.map(box), sideways: document.documentElement.scrollWidth > innerWidth + 1,
            listOverflow: frame.querySelector(".na1-m4-rank-stack")?.scrollHeight - frame.querySelector(".na1-m4-rank-stack")?.clientHeight };
        });
        assert(!geometry.sideways && geometry.footer.bottom <= height + 1, "footer visible, no sideways overflow");
        if (width > 767) assert(geometry.bodyOverflow <= 1, `${room} body fits (${geometry.bodyOverflow}px)`);
        if (room === "pressure") {
          assert.equal(geometry.cards.length, 2);
          assert(geometry.cards.every(c => c.x >= geometry.frame.x && c.right <= geometry.frame.right + 1 && c.y >= geometry.frame.y && c.bottom <= geometry.footer.y + 1), "choices fit inside frame above footer");
          if (width <= 600) assert(geometry.cards[1].y >= geometry.cards[0].bottom, "phone choices stack");
        }
        fits.push({ room, width, height, theme, ...geometry });
        await page.screenshot({ path: path.join(out, `navigation-${room}-${width}-${theme}.png`) });
      });
    }
    for (const complete of [true, false]) await check(`navigation hub ${complete ? "claimed" : "draft"} ${width}x${height} ${theme}`,
      { width, height, theme, grid: true, state: complete ? reviewFixture : midFixture }, async page => {
      const card = page.locator('[data-a1-mirror="values"]');
      assert.equal(await card.locator(".a1-future-b-thread").count(), complete ? 0 : 1);
      for (const label of await page.locator(".a1-future-b-thread > span").allTextContents()) assert.equal(label, "★ FUTURE B");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.screenshot({ path: path.join(out, `navigation-hub-${complete ? "claimed" : "draft"}-${width}-${theme}.png`), fullPage: true });
    });
  }
  for (const width of [375, 1366]) for (const complete of [true, false]) {
    await check(`navigation walk ${complete ? "claimed" : "midway"} ${width}`, { width, height: width === 375 ? 812 : 680, state: complete ? reviewFixture : midFixture }, async page => {
      const read = () => page.evaluate(() => JSON.parse(localStorage.getItem("to_mirror4_state_v1")));
      const before = await read();
      const snapshot = s => ({ claimed: s.claimed, claimedAt: s.claimedAt, status: s.status, discoverSections: s.discoverSections, pressure: s.pressureTest.complete });
      const footer = () => page.locator(".vx-room .df-nav,.vx-room .na1-m4-disc-foot").filter({ visible: true }).last();
      const next = () => footer().getByRole("button").last().click();
      const back = () => footer().getByRole("button", { name: "← Back", exact: true }).click();
      const expectRoom = async room => { await page.locator(`.vx-room[data-values-part="${room}"]`).waitFor(); assert.equal(await page.locator(".na1-root .na1-mirror-grid:visible").count(), 0); };
      if (complete) await page.getByRole("button", { name: "Revisit →", exact: true }).click();
      else await page.locator(".vx-stop").first().click();
      for (const room of ["admire", "irks", "portrait", "flip"]) { await expectRoom(room); await next(); }
      await expectRoom("name");
      await next(); // grouping -> first standard
      for (let i = 0; i < 3; i++) {
        assert.equal(await page.locator(".na1-m4-ns-name:visible").inputValue(), before.clusters[i].userName);
        await next();
      }
      await expectRoom("rank"); await next();
      for (let i = 0; i < 3; i++) {
        await page.locator(".vx-pressure-inline").waitFor();
        assert.equal(await page.locator(".na1-m4-pt-card.is-picked").count(), 1, "saved pick visible");
        await next();
      }
      if (!complete) await next(); // done -> claim, navigation alone never completes
      await expectRoom("claim");
      assert.deepEqual(snapshot(await read()), snapshot(before), "forward navigation never changes flags");
      if (complete) assert.equal(await page.getByRole("button", { name: "Done reviewing →", exact: true }).count(), 1);
      await back(); // last pressure pair / done
      if (!complete) await back(); // done -> last pair
      for (let i = 0; i < 3; i++) await back();
      await expectRoom("rank"); await back();
      await expectRoom("name");
      for (let i = 2; i >= 0; i--) {
        assert.equal(await page.locator(".na1-m4-ns-name:visible").inputValue(), before.clusters[i].userName);
        await back();
      }
      await back(); // grouping -> Flip
      for (const room of ["flip", "portrait", "irks", "admire"]) { await expectRoom(room); await back(); }
      await page.locator(".vx-opening").waitFor();
      assert.deepEqual(await read(), before, "round trip loses no answers and makes no writes");
      // Each stop and each progress part jumps to its first screen, even from that part.
      for (const [i, room] of ["admire", "flip", "name", "rank"].entries()) {
        await page.locator(".vx-stop").nth(i).click(); await expectRoom(room);
        await page.locator(".vx-progress button").nth((i + 1) % 4).click();
        await page.locator(".vx-progress button").nth(i).click(); await expectRoom(room);
        if (room === "name") assert.equal(await page.locator(".na1-m4-ns-name:visible").count(), 0, "Name starts at grouping");
        await page.locator(".na1-room-crumb a").click();
      }
      if (complete) {
        await page.getByRole("button", { name: "Revisit →", exact: true }).click();
        await page.locator(".vx-progress button").nth(2).click(); await next();
        await page.locator(".na1-m4-ns-name:visible").fill("Integrity edited");
        await page.locator(".vx-progress button").nth(3).click(); await next();
        await page.locator(".na1-m4-pt-card").last().click();
        for (let i = 0; i < 3; i++) await next();
        await page.getByRole("button", { name: "Done reviewing →", exact: true }).click();
        await page.locator(".vx-opening").waitFor();
        const edited = await read();
        assert.equal(edited.clusters[0].userName, "Integrity edited");
        assert.deepEqual(snapshot(edited), snapshot(before), "review edits preserve flags");
        assert.equal(edited.pressureTest.pairs.find(p => p.aId === "c0" && p.bId === "c1").pickedId, "c1");
      }
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
    await page.locator("#m4-ai-irks-input").fill("a synthetic irk");
    await page.getByRole("button", { name: /\+ ⚡ Turns my stomach/ }).click();
    await page.getByRole("button", { name: "I've got them →", exact: true }).click();
    await page.getByRole("button", { name: "Edit portrait", exact: true }).click();
    await page.getByRole("button", { name: "← Your portrait", exact: true }).click();
    await page.getByRole("button", { name: "Find what's underneath →", exact: true }).click();
    await page.locator('.vx-room[data-values-part="flip"]').waitFor();
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
    await page.getByRole("button", { name: "Done reviewing →", exact: true }).click();
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
