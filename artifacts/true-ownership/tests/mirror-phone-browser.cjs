// Scene 1 only. Synthetic identity, fail-closed write interception, no real login.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { installIsolation, proveIsolation } = require("./browser-isolation.cjs");
const base = process.env.J1_BASE_URL || "http://localhost:80";
const out = path.resolve("generated-artifacts/mirror-phone");
const key = "to_rc_state_v1", routeKey = "to_app_route_v1";
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ["--no-sandbox"] });
  await proveIsolation(browser);
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, serviceWorkers: "block" });
  const writes = [], unexpected = [], errors = [], results = [];
  await installIsolation(context, writes, unexpected);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on("pageerror", e => errors.push(e.message));
  const next = () => page.getByRole("button", { name: "Show me what I see →", exact: true });
  const more = () => page.getByRole("button", { name: "More sentences →", exact: true });
  const first = () => page.getByRole("button", { name: "← First six", exact: true });
  const ids = () => page.locator("[data-mirror-id]").evaluateAll(nodes => nodes.map(n => n.dataset.mirrorId));
  await context.addInitScript(() => {
    if (!sessionStorage.getItem("mirror-fixture-start")) {
      sessionStorage.setItem("mirror-fixture-start", "1");
      localStorage.setItem("to_app_route_v1", JSON.stringify({ view: "rcroom", overlay: null }));
      localStorage.setItem("to_rc_state_v1", JSON.stringify({ version: 2, step: 1, mirror: [] }));
    }
  });
  const url = preview => `${base}/?newRC=1&phase=a1${preview ? "&preview=1" : ""}`;
  async function loaded() { await page.locator(".rc-mirror-grid").waitFor(); await page.evaluate(() => document.fonts.ready); }
  await page.goto(url(true)); await loaded();
  const initial = await page.evaluate(async () => {
    const m = await import("/src/rcConstants.ts");
    return { empty: m.normalizeRC({ version: 2, step: 1 }), all: m.RC_MIRROR.map(v => v.id) };
  });
  async function render(state, theme, width, preview) {
    await page.setViewportSize({ width, height: width === 1366 ? 680 : width === 1280 ? 800 : 812 });
    await page.evaluate(({ state, theme, preview, key, routeKey }) => {
      localStorage.setItem(key, JSON.stringify(state));
      localStorage.setItem(routeKey, JSON.stringify({ view: "rcroom", overlay: null }));
      localStorage.setItem("na1_theme", theme);
      if (preview) sessionStorage.setItem("to_dev_preview", "1"); else sessionStorage.removeItem("to_dev_preview");
    }, { state, theme, preview, key, routeKey });
    await page.goto(url(preview)); await loaded();
  }
  async function capture(label) {
    const result = await page.evaluate(() => {
      const room = document.querySelector(".rc-room"), screen = document.querySelector(".rc-screen").getBoundingClientRect();
      const scene = document.querySelector(".rc-scene").getBoundingClientRect(), footer = document.querySelector(".rc-footer").getBoundingClientRect();
      return { cardOverflow: Math.max(0, room.scrollHeight - room.clientHeight), sceneOverflow: Math.max(0, scene.bottom - screen.bottom),
        footerOverlap: Math.max(0, scene.bottom - footer.top), horizontal: Math.max(0, document.documentElement.scrollWidth - innerWidth),
        fonts: [...document.querySelectorAll("[data-mirror-id]")].map(n => { const s = getComputedStyle(n); return [s.fontSize, s.fontStyle, s.fontFamily, Math.max(18, parseFloat(s.getPropertyValue("--b-min")) || 0)]; }) };
    });
    results.push({ label, ...result });
    await page.screenshot({ path: path.join(out, `${label}.png`) });
  }
  try {
    for (const theme of ["light", "dark"]) {
      await render(initial.empty, theme, 375, true);
      const before = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));
      const beforeWrites = writes.length;
      assert.deepEqual(await ids(), initial.all.slice(0, 6));
      assert.equal(await next().isDisabled(), true);
      await capture(`375-${theme}-first-six`);
      for (const id of initial.all.slice(0, 3)) await page.locator(`[data-mirror-id="${id}"]`).click();
      assert.equal(await page.getByText("(3 selected)", { exact: true }).count(), 1);
      assert.equal(await next().isDisabled(), true, "Preview must not bypass this phone gate.");
      await more().click();
      assert.deepEqual(await ids(), initial.all.slice(6));
      assert.equal(await next().isEnabled(), true);
      assert.equal(await page.getByRole("img", { name: "Set 2 of 2" }).count(), 1);
      await capture(`375-${theme}-second-six`);
      await page.locator(`[data-mirror-id="${initial.all[6]}"]`).click();
      assert.equal(await page.getByText("(4 selected)", { exact: true }).count(), 1);
      await first().press("Enter");
      for (const id of initial.all.slice(0, 3)) assert.equal(await page.locator(`[data-mirror-id="${id}"]`).getAttribute("aria-pressed"), "true");
      await page.locator(`[data-mirror-id="${initial.all[0]}"]`).click();
      assert.equal(await next().isEnabled(), true);
      await more().click();
      await page.locator(`[data-mirror-id="${initial.all[6]}"]`).click();
      assert.equal(await next().isDisabled(), true);
      await page.locator(`[data-mirror-id="${initial.all[6]}"]`).click();
      assert.equal(await next().isEnabled(), true);
      assert.equal(await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort())), before);
      assert.equal(writes.length, beforeWrites, "Preview remains scratch-only.");
    }
    // Real-mode fixture proves persistence and positive write interception.
    await render(initial.empty, "light", 375, false);
    for (const id of initial.all.slice(0, 3)) await page.locator(`[data-mirror-id="${id}"]`).click();
    assert.equal(await next().isDisabled(), true);
    await Promise.all([
      page.waitForResponse(r => r.url().endsWith("/api/userdata/rcstate") && r.request().method() === "PUT"),
      more().click(),
    ]);
    assert.equal(await next().isEnabled(), true);
    await page.locator(`[data-mirror-id="${initial.all[6]}"]`).click();
    await page.reload(); await loaded();
    assert.deepEqual(await ids(), initial.all.slice(6));
    assert.equal(await page.getByText("(4 selected)", { exact: true }).count(), 1);
    assert.equal(await next().isEnabled(), true);
    await next().click();
    assert.equal(await page.locator(".rc-room").getAttribute("data-step"), "2");
    await page.getByRole("button", { name: "← Back", exact: true }).click(); await loaded();
    assert.deepEqual(await ids(), initial.all.slice(6));
    // Exit/re-enter preserves set and selections too.
    await page.getByRole("button", { name: "Close Reality Check", exact: true }).click();
    await page.locator(".rc-begin").click(); await loaded();
    assert.deepEqual(await ids(), initial.all.slice(6));
    await first().click();
    await page.reload(); await loaded();
    assert.deepEqual(await ids(), initial.all.slice(0, 6));
    assert.equal(await next().isEnabled(), true);
    // Breakpoint and unchanged desktop behavior.
    const three = { ...initial.empty, mirror: initial.all.slice(0, 3) };
    for (const width of [600, 601, 1280, 1366]) {
      await render(three, "light", width, false);
      assert.deepEqual(await ids(), width <= 600 ? initial.all.slice(0, 6) : initial.all);
      assert.equal(await next().isDisabled(), width <= 600);
      assert.equal(await page.locator(".rc-mirror-pages").count(), width <= 600 ? 1 : 0);
      await capture(`width-${width}`);
    }
    await page.setViewportSize({ width: 600, height: 812 });
    await more().waitFor(); assert.equal(await next().isDisabled(), true);
    await page.setViewportSize({ width: 601, height: 812 });
    await page.waitForFunction(() => document.querySelectorAll("[data-mirror-id]").length === 12);
    assert.equal(await next().isEnabled(), true);
    assert.equal((await context.cookies()).length, 0);
    assert(writes.length > 0);
    assert(writes.every(w => w.path === "/api/userdata/rcstate"));
    assert.deepEqual(unexpected, []); assert.deepEqual(errors, []);
    const failures = results.filter(r => r.cardOverflow > 1 || r.sceneOverflow > 1 || r.footerOverlap > 1 || r.horizontal > 1);
    for (const r of results) assert(r.fonts.every(([size, style, family, minimum]) => parseFloat(size) === minimum && style === "italic" && family.includes("Cormorant Garamond")));
    assert.deepEqual(failures, [], "Scene 1 must fit every captured viewport.");
    console.log(JSON.stringify({ cases: results.length, failures, interceptedWrites: writes.length, runtimeErrors: errors }));
  } finally {
    fs.writeFileSync(path.join(out, "results.json"), JSON.stringify({ results, writesIntercepted: writes.length, unexpected, errors }, null, 2));
    await context.close(); await browser.close();
  }
})().catch(e => { console.error(e.stack); process.exitCode = 1; });
