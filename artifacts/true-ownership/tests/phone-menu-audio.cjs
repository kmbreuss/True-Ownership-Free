const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const { fixtures } = require("./a1-fixtures.cjs");
const { installIsolation, proveIsolation } = require("./browser-isolation.cjs");
const out = path.resolve("generated-artifacts/phone-menu-audio");
const base = process.env.J1_BASE_URL || "http://localhost:80";

async function main() {
  const { chromium } = require("playwright");
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH,
    args: ["--no-sandbox"] });
  const writes = [], unexpected = [], errors = [], results = [], f = fixtures();
  const data = {
    to_rc_state_v1: f.rc, to_mirror4_state_v1: { ...f.values, claimed: true }, a1_ex4_done: true,
    to_map: { mirror3: { ...f.identity, sealCompleted: true }, vision: { ...f.vision, complete: true } },
  };
  fs.mkdirSync(out, { recursive: true });
  async function open(theme, width = 375, fresh = false) {
    const context = await browser.newContext({ viewport: { width, height: width < 900 ? 812 : 800 },
      isMobile: width < 900, hasTouch: width < 900, serviceWorkers: "block" });
    await installIsolation(context, writes, unexpected);
    // Keep provider analytics out of the isolated fixture. Verify the exact
    // existing embed target/hash, not third-party streaming in this test.
    await context.route("https://player.vimeo.com/**", route => route.fulfill({
      contentType: "text/html", body: "<title>Isolated existing Vimeo target</title>",
    }));
    const page = await context.newPage();
    page.setDefaultTimeout(9000);
    page.on("pageerror", e => errors.push(e.message));
    await page.addInitScript(({ data, theme, fresh }) => {
      if (sessionStorage.getItem("menu-audio-fixture")) return;
      sessionStorage.setItem("menu-audio-fixture", "1");
      if (!fresh) for (const [key, value] of Object.entries(data)) localStorage.setItem(key, JSON.stringify(value));
      localStorage.setItem("na1_theme", theme);
      localStorage.setItem("to_road_phone_tip_seen_v1", "1");
      localStorage.setItem("to_app_route_v1", JSON.stringify({ view: "entry-hall", overlay: null }));
    }, { data, theme, fresh });
    await page.goto(base + "/");
    await page.locator(".jr-phone-bar").or(page.locator(".jr-desktop")).first().waitFor({ state: "attached" });
    await page.evaluate(() => document.fonts.ready);
    return { context, page };
  }
  async function jump(page, view, overlay = null) {
    await page.evaluate(({ view, overlay }) =>
      localStorage.setItem("to_app_route_v1", JSON.stringify({ view, overlay })), { view, overlay });
    await page.reload(); await page.locator(".jr-phone-bar").waitFor({ state: "attached" });
    await page.waitForTimeout(180);
  }
  async function photo(page, name, width = 375) {
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, "No sideways overflow");
    await page.screenshot({ path: path.join(out, `${name}.jpg`) });
  }
  const menu = page => page.getByRole("navigation", { name: "Main navigation", exact: true });
  async function tap(page, label) { await menu(page).getByRole("button", { name: label, exact: true }).click(); }
  async function library(page, count = 2) {
    await page.getByRole("heading", { name: "Katherine’s recordings", exact: true }).waitFor();
    await page.waitForFunction(count => document.querySelectorAll("[data-recording]").length === count, count);
    assert.equal(await page.getByText("More of Katherine’s recordings are on the way.", { exact: true }).count(), 1);
    assert.equal(await page.locator(".ap-root").getByText(/Later|coming soon/).count(), 0);
  }
  try {
    await proveIsolation(browser);
    for (const theme of ["light", "dark"]) {
      const { context, page } = await open(theme);
      try {
        await menu(page).waitFor();
        const before = await page.evaluate(keys => keys.map(key => localStorage.getItem(key)), Object.keys(data));
        assert.equal(await menu(page).getByRole("button").count(), 4);
        assert.equal(await menu(page).locator('[aria-current="page"]').textContent(), "Home");
        const navBox = await menu(page).boundingBox();
        assert.equal(navBox.y + navBox.height, 812);
        for (const button of await menu(page).getByRole("button").all()) {
          const box = await button.boundingBox(); assert(box.height >= 44 && box.width >= 44);
        }
        assert.equal(await menu(page).evaluate(el => getComputedStyle(el).backgroundColor), "rgb(255, 255, 255)");
        assert(await page.evaluate(() => parseFloat(getComputedStyle(document.body).paddingBottom) >= 64));
        await photo(page, `375x812-home-${theme}`);
        await tap(page, "Road"); await page.locator(".jr-sheet").waitFor();
        assert.equal(await menu(page).count(), 0);
        await photo(page, `375x812-road-sheet-${theme}`);
        await page.locator('[data-phone-stage="a2"]').click(); await menu(page).waitFor();
        assert.equal(await menu(page).locator('[aria-current="page"]').textContent(), "Road");
        await photo(page, `375x812-a2-${theme}`);
        for (const stage of ["a1", "a3", "a4", "a5"]) {
          await tap(page, "Road"); await page.locator(`[data-phone-stage="${stage}"]`).click();
          await menu(page).waitFor(); assert.equal(await menu(page).locator('[aria-current="page"]').textContent(), "Road");
        }
        await tap(page, "Map of Me"); await page.locator(".map-of-me-page").waitFor();
        assert.equal(await menu(page).locator('[aria-current="page"]').textContent(), "Map of Me");
        await photo(page, `375x812-map-${theme}`);
        await tap(page, "Audio"); await library(page);
        assert.equal(await page.locator(".ap-shell h1").evaluate(el => getComputedStyle(el).color),
          theme === "light" ? "rgb(53, 51, 52)" : "rgb(245, 245, 247)", "Heading readable in each theme");
        assert.equal(await page.locator(".ap-more").evaluate(el => getComputedStyle(el).color),
          theme === "light" ? "rgb(79, 77, 78)" : "rgb(201, 209, 211)", "Closing copy readable in each theme");
        assert.equal(await menu(page).locator('[aria-current="page"]').textContent(), "Audio");
        assert.equal(await page.locator('[data-recording="entry-hall"]').getByText("7:43", { exact: false }).count(), 1);
        assert.equal(await page.locator('[data-recording="framework"]').getByText("6:28", { exact: false }).count(), 1);
        assert.deepEqual(await page.locator("[data-recording]").evaluateAll(els => els.map(e => e.dataset.recording)),
          ["entry-hall", "framework"]);
        await photo(page, `375x812-audio-${theme}`);
        await page.getByRole("button", { name: "Play Walk your spine — the 5A Framework", exact: true }).click();
        await page.locator(".na1-video-overlay").waitFor();
        await page.waitForFunction(() => !document.querySelector(".pn-menu"));
        const frame = page.locator(".na1-video-overlay iframe");
        assert.match(await frame.getAttribute("src"), /player\.vimeo\.com\/video\/1198243013\?h=705008f567/);
        await page.getByRole("button", { name: "Close video", exact: true }).click(); await menu(page).waitFor();
        // Membership filtering does not depend on whether a stage was visited.
        await page.evaluate(async () => (await import("/src/reality-check/access.ts")).setSimulatedFree(true));
        await library(page, 1);
        assert.equal(await page.locator("[data-recording]").getAttribute("data-recording"), "entry-hall");
        assert(await menu(page).getByRole("button", { name: /Map of Me/ }).isDisabled());
        await page.evaluate(async () => (await import("/src/reality-check/access.ts")).setSimulatedFree(false));
        await library(page);
        await tap(page, "Home"); await menu(page).locator('[aria-current="page"]').getByText("Home").waitFor();
        await page.getByRole("button", { name: "Play Welcome to True Ownership", exact: true }).click();
        await page.locator(".na1-video-overlay").waitFor(); await page.waitForFunction(() => !document.querySelector(".pn-menu"));
        await page.getByRole("button", { name: "Close video", exact: true }).click(); await menu(page).waitFor();
        // Navigation itself must preserve the saved answers and claims.
        assert.deepEqual(await page.evaluate(keys => keys.map(key => localStorage.getItem(key)), Object.keys(data)), before);
        for (const [view, overlay] of [["rcroom", null], ["a1end3", null],
          ["m4", { hubId: "m4", roomId: "admire" }]]) {
          await jump(page, view, overlay);
          assert.equal(await menu(page).count(), 0, `Menu hidden in ${view}`);
        }
        await jump(page, "a2");
        await tap(page, "Map of Me"); await page.locator(".map-of-me-page").waitFor();
        // Existing Map return controls still call the original page's onBack;
        // global-menu return context is UI-only, not a write to map origin.
        await page.getByRole("button", { name: "← Back to A2", exact: true }).click();
        await menu(page).waitFor();
        await page.waitForFunction(() => JSON.parse(localStorage.getItem("to_app_route_v1")).view === "a2");
        results.push({ theme, width: 375, passed: true, screens: 5 });
        console.log("PASS", theme, "phone: all hubs, menu routes, map, source-only library, free access, players, overlays, fit and unchanged data");
      } finally { await context.close(); }
    }
    const fresh = await open("light", 375, true);
    try {
      const { page } = fresh;
      await menu(page).waitFor(); await tap(page, "Audio"); await library(page);
      const checks = await page.evaluate(async () => {
        const { availableRecordings } = await import("/src/components/AudioPage.tsx");
        const { VIDEOS, isVideoReady } = await import("/src/videoConstants.ts");
        const ready = Object.fromEntries(Object.entries(VIDEOS).map(([key, value]) =>
          [key, { ...value, vimeoId: value.mediaType === "video" ? "123456789" : null,
            audioUrl: value.mediaType === "audio" ? "https://example.invalid/recording.wav" : null }]));
        return {
          automatic: availableRecordings(() => true, ready).map(v => v.surface),
          allowedOnly: availableRecordings(s => s === "entry-hall", ready).map(v => v.surface),
          blankNotReady: !isVideoReady({ ...VIDEOS["a1-hub"], vimeoId: " " }),
        };
      });
      assert.deepEqual(checks.automatic, ["entry-hall", "rc-intro", "rc-eyes", "framework", "a1-hub", "m4-hub", "m3-hub", "m1-hub", "m2-hub"]);
      assert.deepEqual(checks.allowedOnly, ["entry-hall"]); assert(checks.blankNotReady);
      await page.evaluate(async () => {
        const { VIDEOS } = await import("/src/videoConstants.ts");
        for (const meta of Object.values(VIDEOS)) {
          if (meta.surface !== "rc-intro" && meta.surface !== "rc-eyes") meta.vimeoId ||= "123456789";
        }
      });
      await tap(page, "Home"); await tap(page, "Audio"); await library(page, 3);
      assert.deepEqual(await page.locator("[data-recording]").evaluateAll(els => els.map(e => e.dataset.recording)),
        ["entry-hall", "framework", "a1-hub"], "Unopened but accessible hub; RC-gated mirrors remain hidden");
      console.log("PASS fresh member: no opening tracking, available unvisited recordings, automatic source appearance and existing mirror gates");
    } finally { await fresh.context.close(); }
    for (const theme of ["light", "dark"]) {
      const { context, page } = await open(theme, 1280);
      try {
        const links = page.getByRole("navigation", { name: "More pages" }); await links.waitFor();
        assert.equal(await menu(page).isVisible(), false);
        assert.equal(await page.evaluate(() => parseFloat(getComputedStyle(document.body).paddingBottom)), 0);
        await links.getByRole("button", { name: "Audio", exact: true }).click(); await library(page);
        await photo(page, `1280x800-audio-links-${theme}`, 1280);
        await page.getByRole("button", { name: "Play Welcome to True Ownership", exact: true }).click();
        await page.locator(".ap-root .na1-video-card.is-playing iframe").waitFor();
        assert.equal(await page.locator(".na1-video-overlay").count(), 0);
        await page.getByRole("button", { name: "Close video", exact: true }).click();
        await links.getByRole("button", { name: "Map of Me", exact: true }).click();
        await page.locator(".map-of-me-page").waitFor(); await photo(page, `1280x800-map-links-${theme}`, 1280);
        await page.setViewportSize({ width: 900, height: 800 }); assert.equal(await menu(page).isVisible(), false);
        await page.setViewportSize({ width: 899, height: 812 }); await menu(page).waitFor();
        results.push({ theme, width: 1280, passed: true, screens: 2 });
        console.log("PASS", theme, "desktop: map/audio links, player, width boundary, fit");
      } finally { await context.close(); }
    }
    assert.deepEqual(errors, []); assert.deepEqual(unexpected, []);
    fs.writeFileSync(path.join(out, "results.json"), JSON.stringify({
      results, pageErrors: errors, unexpectedMutations: unexpected, interceptedWrites: writes.length,
      providerStreaming: "Not exercised; existing Vimeo embed targets verified with provider frames isolated",
    }, null, 2));
    console.log("ALL PASS", JSON.stringify({ results, interceptedWrites: writes.length, errors, unexpected }));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
