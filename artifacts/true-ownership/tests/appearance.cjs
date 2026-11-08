const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const { fixtures } = require("./a1-fixtures.cjs");
const { installIsolation, proveIsolation } = require("./browser-isolation.cjs");
const out = path.resolve("generated-artifacts/appearance");
const base = process.env.J1_BASE_URL || "http://localhost:80";

async function main() {
  const { chromium } = require("playwright");
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] });
  const writes = [], unexpected = [], errors = [], f = fixtures();
  const data = { to_rc_state_v1: f.rc, to_mirror4_state_v1: { ...f.values, claimed: true }, a1_ex4_done: true,
    to_map: { mirror3: { ...f.identity, sealCompleted: true }, vision: { ...f.vision, complete: true } } };
  fs.mkdirSync(out, { recursive: true });
  async function open(device, saved = null, width = 375, blocked = false) {
    const context = await browser.newContext({ viewport: { width, height: width < 900 ? 812 : 800 },
      isMobile: width < 900, hasTouch: width < 900, colorScheme: device, serviceWorkers: "block" });
    await installIsolation(context, writes, unexpected);
    const page = await context.newPage(); page.setDefaultTimeout(12000);
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(({ data, saved, blocked }) => {
      if (!sessionStorage.getItem("appearance-fixture")) {
        sessionStorage.setItem("appearance-fixture", "1");
        for (const [key, value] of Object.entries(data)) localStorage.setItem(key, JSON.stringify(value));
        localStorage.setItem("to_road_phone_tip_seen_v1", "1");
        localStorage.setItem("to_app_route_v1", JSON.stringify({ view: "entry-hall", overlay: null }));
        if (saved === null) localStorage.removeItem("na1_theme"); else localStorage.setItem("na1_theme", saved);
      }
      if (blocked) {
        const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
        Storage.prototype.getItem = function(key) { if (key === "na1_theme") throw new Error("Fixture: storage unavailable"); return get.call(this, key); };
        Storage.prototype.setItem = function(key, value) { if (key === "na1_theme") throw new Error("Fixture: storage unavailable"); return set.call(this, key, value); };
      }
    }, { data, saved, blocked });
    await page.goto(base + "/"); await page.locator(".appearance-home-button").waitFor({ state: "attached" });
    await page.evaluate(() => document.fonts.ready);
    return { context, page };
  }
  const theme = page => page.locator("html").getAttribute("data-theme");
  const preference = page => page.evaluate(() => localStorage.getItem("na1_theme"));
  const answers = page => page.evaluate(keys => keys.map(key => localStorage.getItem(key)), Object.keys(data));
  const options = page => page.getByRole("group", { name: "Appearance", exact: true });
  async function road(page) { await page.locator(".jr-phone-bar").click(); await options(page).waitFor(); }
  async function choose(page, label) { await options(page).getByText(label, { exact: true }).click(); }
  async function photo(page, name, width = 375) {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await page.screenshot({ path: path.join(out, `${name}.jpg`) });
  }
  try {
    await proveIsolation(browser);
    for (const device of ["light", "dark"]) {
      const { context, page } = await open(device);
      try {
        const opposite = device === "dark" ? "light" : "dark";
        assert.equal(await theme(page), device); assert.equal(await preference(page), null, "No automatic saved choice");
        const before = await answers(page), button = page.locator(".appearance-home-button");
        assert.equal(await page.locator(".na1-theme-toggle").isVisible(), false);
        const box = await button.boundingBox(), bar = await page.locator(".jr-phone-bar").boundingBox();
        assert(box.width >= 44 && box.height >= 44 && box.y >= bar.y + bar.height, "Home control is not under the road");
        assert.equal(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest("button")?.className,
          { x: box.x + box.width / 2, y: box.y + box.height / 2 }), "appearance-home-button");
        await photo(page, `375-home-${device}`);
        await road(page);
        assert(await options(page).getByRole("radio", { name: "Match my phone", exact: true }).isChecked());
        for (const option of await options(page).locator("label").all()) {
          const rect = await option.boundingBox(); assert(rect.height >= 44 && rect.x >= 0 && rect.x + rect.width <= 375);
        }
        await photo(page, `375-road-${device}`);
        await choose(page, opposite === "dark" ? "Dark" : "Light");
        assert.equal(await theme(page), opposite); assert.equal(await preference(page), opposite);
        assert.equal(await page.locator(".jr-sheet").count(), 1, "Choosing a theme leaves the sheet open");
        // Native radio keyboard interaction and modal focus wrapping.
        await options(page).getByRole("radio", { name: "Match my phone", exact: true }).focus();
        await page.keyboard.press("ArrowLeft"); assert(await options(page).getByRole("radio", { name: "Dark", exact: true }).isChecked());
        await page.keyboard.press("Tab");
        assert.equal(await page.getByRole("button", { name: "Close your road", exact: true }).evaluate(el => el === document.activeElement), true);
        await choose(page, "Match my phone"); assert.equal(await preference(page), "system");
        await page.emulateMedia({ colorScheme: opposite }); await page.waitForFunction(t => document.documentElement.dataset.theme === t, opposite);
        await page.reload(); await page.locator(".appearance-home-button").waitFor(); assert.equal(await theme(page), opposite);
        await page.locator(".appearance-home-button").click(); assert.equal(await preference(page), device);
        await page.emulateMedia({ colorScheme: opposite }); assert.equal(await theme(page), device, "Explicit choice overrides device");
        await page.reload(); await page.locator(".appearance-home-button").waitFor(); assert.equal(await theme(page), device);
        await road(page); assert(await options(page).getByRole("radio", { name: device === "dark" ? "Dark" : "Light", exact: true }).isChecked());
        assert.deepEqual(await answers(page), before, "Theme changes do not change answers or completion");
        // Existing road navigation stays live and Home-only button stays scoped.
        await page.locator('[data-phone-stage="a1"]').click(); await page.locator("[data-a1-mirror]").first().waitFor();
        assert.equal(await page.locator(".appearance-home-button").count(), 0);
        await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("button", { name: "Home", exact: true }).click();
        await page.locator(".appearance-home-button").waitFor();
        const persisted = await preference(page);
        await page.evaluate(() => sessionStorage.setItem("to_dev_preview", "1"));
        await page.locator(".appearance-home-button").click();
        assert.equal(await preference(page), persisted, "Preview does not persist theme changes");
        await page.evaluate(() => sessionStorage.removeItem("to_dev_preview"));
        await page.reload(); await page.locator(".appearance-home-button").waitFor(); assert.equal(await theme(page), persisted);
        console.log("PASS phone", device, "device matching, Home tap, three options, persistence, keyboard, focus, routes, unchanged answers and Preview");
      } finally { await context.close(); }
    }
    for (const saved of ["light", "dark"]) {
      const { context, page } = await open(saved === "light" ? "dark" : "light", saved, 1280);
      try {
        assert.equal(await theme(page), saved); assert.equal(await preference(page), saved, "Preserve existing choice");
        assert.equal(await page.locator(".appearance-home-button").isVisible(), false);
        const button = page.locator(".na1-theme-toggle"); assert(await button.isVisible());
        const box = await button.boundingBox(); assert(box.y < 20 && box.x > 1100, "Original desktop location");
        await button.click(); const next = saved === "light" ? "dark" : "light";
        assert.equal(await theme(page), next); assert.equal(await preference(page), next);
        await page.setViewportSize({ width: 900, height: 812 }); assert(await button.isVisible());
        await page.setViewportSize({ width: 899, height: 812 }); assert.equal(await button.isVisible(), false);
        assert(await page.locator(".appearance-home-button").isVisible());
        console.log("PASS preserved", saved, "desktop toggle and 900px boundary");
      } finally { await context.close(); }
    }
    const blocked = await open("dark", null, 375, true);
    try {
      assert.equal(await theme(blocked.page), "dark"); await blocked.page.locator(".appearance-home-button").click();
      assert.equal(await theme(blocked.page), "light"); await road(blocked.page); await choose(blocked.page, "Match my phone");
      assert.equal(await theme(blocked.page), "dark"); console.log("PASS unavailable browser storage");
    } finally { await blocked.context.close(); }
    assert.deepEqual(errors, []); assert.deepEqual(unexpected, []);
    fs.writeFileSync(path.join(out, "results.json"), JSON.stringify({ passed: true, errors, unexpected, interceptedWrites: writes.length }, null, 2));
    console.log("ALL PASS; locally intercepted writes:", writes.length);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
