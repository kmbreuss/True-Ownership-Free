const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const { fixtures } = require("./a1-fixtures.cjs");
const { installIsolation, proveIsolation } = require("./browser-isolation.cjs");
const TIP_KEY = "to_road_phone_tip_seen_v1";
const out = path.resolve("generated-artifacts/road-phone-polish");

async function main() {
  const { chromium } = require("playwright");
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] });
  const writes = [], unexpected = [], errors = [], results = [], f = fixtures();
  fs.mkdirSync(out, { recursive: true });
  async function open(theme, width = 375, blocked = false) {
    const context = await browser.newContext({ viewport: { width, height: 812 }, isMobile: true, hasTouch: true, serviceWorkers: "block" });
    await installIsolation(context, writes, unexpected);
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    page.on("pageerror", e => errors.push(e.message));
    await page.addInitScript(({ theme, f, blocked, key }) => {
      if (!sessionStorage.getItem("phone-polish-fixture")) {
        sessionStorage.setItem("phone-polish-fixture", "1");
        localStorage.setItem("na1_theme", theme);
        localStorage.setItem("to_rc_state_v1", JSON.stringify(f.rc));
        localStorage.setItem("to_mirror4_state_v1", JSON.stringify(f.values));
        localStorage.setItem("to_app_route_v1", JSON.stringify({ view: "grid", overlay: null }));
      }
      if (blocked) {
        for (const method of ["getItem", "setItem"]) {
          const original = Storage.prototype[method];
          Storage.prototype[method] = function (name, ...args) {
            if (name === key) throw new DOMException("Storage unavailable", "SecurityError");
            return original.call(this, name, ...args);
          };
        }
      }
    }, { theme, f, blocked, key: TIP_KEY });
    await page.goto((process.env.J1_BASE_URL || "http://localhost:80") + "/");
    await page.locator(width <= 900 ? ".jr-phone-bar" : ".jr-desktop").waitFor();
    await page.evaluate(() => document.fonts.ready);
    return { context, page };
  }
  async function screenshot(page, name) {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 375);
    await page.screenshot({ path: path.join(out, name + ".jpg") });
  }
  try {
    await proveIsolation(browser);
    for (const theme of ["light", "dark"]) {
      const { context, page } = await open(theme);
      try {
        const before = await page.evaluate(() => [localStorage.getItem("to_rc_state_v1"), localStorage.getItem("to_mirror4_state_v1")]);
        const bar = page.locator(".jr-phone-bar"), tip = page.locator(".jr-phone-tip");
        await tip.waitFor();
        assert.equal(await tip.textContent(), "Tap your road to see your progress or jump to any step.");
        assert.equal(await bar.getByText("Road ▾", { exact: true }).count(), 1);
        assert.equal(await bar.locator(".jr-phone-segment").count(), 6);
        const box = await bar.boundingBox();
        assert.equal(box.y, 0); assert.equal(box.width, 375); assert(box.height >= 44);
        const tipBox = await tip.boundingBox(); assert(tipBox.y >= box.height);
        await screenshot(page, "bar-and-tip-" + theme);
        await bar.tap({ position: { x: 15, y: 70 } });
        assert.equal(await tip.count(), 0, "Tapping anywhere on the bar dismisses the tip");
        await page.locator(".jr-phone-stage-nav").waitFor();
        const rows = page.locator(".jr-phone-stage");
        assert.equal(await rows.count(), 6);
        for (const row of await rows.all()) {
          const r = await row.boundingBox();
          assert(r.width > 310 && r.height >= 44 && r.x >= 0 && r.x + r.width <= 375);
          assert.equal(await row.isDisabled(), false, "No sequential A locks");
        }
        assert.equal(await page.locator('.jr-phone-stage[aria-current="page"]').getAttribute("data-phone-stage"), "a1");
        assert.equal(await page.locator('.jr-phone-stage[aria-current="page"] small').textContent(), "You are here");
        const currentColor = await page.locator('.jr-phone-stage[aria-current="page"]').evaluate(e => getComputedStyle(e).color);
        assert.equal(currentColor, theme === "light" ? "rgb(3, 99, 96)" : "rgb(156, 216, 207)");
        await screenshot(page, "stage-rows-" + theme);
        assert.equal(await page.locator(".jr-sheet [data-brick]").count(), 88);
        const order = await page.evaluate(() => {
          const nav = document.querySelector(".jr-phone-stage-nav"), road = document.querySelector(".jr-sheet .jr-road"), history = document.querySelector(".jr-history");
          return !!(nav.compareDocumentPosition(road) & Node.DOCUMENT_POSITION_FOLLOWING) &&
            !!(road.compareDocumentPosition(history) & Node.DOCUMENT_POSITION_FOLLOWING);
        });
        assert(order, "Stage rows, full road, history in that order");
        await page.locator(".jr-sheet .jr-road-open").click();
        assert(await page.locator(".jr-history").evaluate(e => e === document.activeElement));
        await screenshot(page, "history-" + theme);
        await page.getByRole("button", { name: "Close your road", exact: true }).click();
        await page.reload(); await bar.waitFor(); assert.equal(await tip.count(), 0, "Tip never repeats after reload");
        await bar.tap();
        await page.locator('[data-phone-stage="a2"]').tap();
        await page.waitForFunction(() => JSON.parse(localStorage.getItem("to_app_route_v1")).view === "a2");
        assert.equal(await page.locator(".jr-sheet").count(), 0);
        await page.evaluate(async () => (await import("/src/reality-check/access.ts")).setSimulatedFree(true));
        await page.waitForFunction(() => JSON.parse(localStorage.getItem("to_app_route_v1")).view === "rc");
        await bar.tap();
        for (const id of ["a1", "a2", "a3", "a4", "a5"]) {
          const row = page.locator(`[data-phone-stage="${id}"]`);
          assert(await row.isDisabled());
          assert.match(await row.textContent(), /Unlocks when you join/);
          assert.match(await row.textContent(), /🔒/);
          await row.dispatchEvent("click");
        }
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("to_app_route_v1")).view), "rc");
        assert.equal(await page.locator('[data-phone-stage="rc"]').isDisabled(), false);
        assert.equal(await page.getByText(/Opens after/).count(), 0);
        await screenshot(page, "restricted-rows-" + theme);
        assert.deepEqual(await page.evaluate(() => [localStorage.getItem("to_rc_state_v1"), localStorage.getItem("to_mirror4_state_v1")]), before);
        results.push({ theme, passed: true, screenshots: 4 });
        console.log("PASS", theme, "bar, tip/tap/reload, stage rows, route, access, history, fit, unchanged answers");
      } finally { await context.close(); }
    }
    for (const blocked of [false, true]) {
      const { context, page } = await open("light", 375, blocked);
      try {
        await page.locator(".jr-phone-tip").waitFor();
        await page.waitForTimeout(6300);
        assert.equal(await page.locator(".jr-phone-tip").count(), 0);
        if (!blocked) {
          await page.reload(); await page.locator(".jr-phone-bar").waitFor();
          assert.equal(await page.locator(".jr-phone-tip").count(), 0);
        }
        await page.locator(".jr-phone-bar").tap(); await page.locator(".jr-phone-stage-nav").waitFor();
        console.log("PASS six-second dismissal", blocked ? "storage throws, navigation still works" : "persisted across reload");
      } finally { await context.close(); }
    }
    const { context, page } = await open("light", 1280);
    try {
      assert.equal(await page.locator(".jr-phone-tip").count(), 0);
      assert.equal(await page.evaluate(key => localStorage.getItem(key), TIP_KEY), null, "Desktop must not consume the phone tip");
      await page.setViewportSize({ width: 900, height: 812 });
      await page.locator(".jr-phone-bar").waitFor(); await page.locator(".jr-phone-tip").waitFor();
      assert.equal(await page.locator(".jr-desktop").isVisible(), false);
      await page.locator(".jr-phone-bar").click();
      await page.locator(".jr-phone-stage-nav").waitFor();
      await page.setViewportSize({ width: 1280, height: 812 });
      assert.equal(await page.locator(".jr-phone-stage-nav").isVisible(), false);
      assert.equal(await page.locator(".jr-desktop").isVisible(), true);
      console.log("PASS desktop unchanged, inclusive 900px phone breakpoint, desktop does not consume tip");
    } finally { await context.close(); }
    assert.deepEqual(unexpected, []); assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, "results.json"), JSON.stringify({ results, interceptedWrites: writes.length, unexpected, errors }, null, 2));
    console.log("PASS phone polish; synthetic identity only;", writes.length, "writes intercepted; zero escaped mutations.");
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
