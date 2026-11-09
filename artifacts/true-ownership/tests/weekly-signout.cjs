const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const { chromium } = require("playwright");
const { allStagesFixture } = require("./map-of-me-fixtures.cjs");
const { installIsolation, proveIsolation } = require("./browser-isolation.cjs");
const out = path.resolve("generated-artifacts/task88");

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] });
  await proveIsolation(browser);
  const results = [], errors = [];
  try {
    for (const width of [375, 1280]) for (const theme of ["light", "dark"]) {
      const data = allStagesFixture(), requests = [], writes = [], unexpected = [];
      data.to_a1_practical_v1 = { version: 1, balanceByCreatureId: { c_0: "behind", c_1: "lot" }, balanceIntent: null,
        tryCreatureId: "c_0", trySelectionSource: "balance", tryAnswersByCreatureId: { c_0: "Make space before answering." },
        sharpenedOneThing: "Protect one evening.", weekReviewedAt: "2026-11-08T12:00:00Z" };
      const context = await browser.newContext({ viewport: { width, height: 812 - (width > 900 ? 12 : 0) }, serviceWorkers: "block" });
      const remote = { intake: { name: "Synthetic" }, phase: "a1" };
      let signedIn = true, failSaves = false;
      await installIsolation(context, writes, unexpected, () => remote);
      await context.route("**/api/auth/me", route => route.fulfill({ json: { user: signedIn ? {
        id: "00000000-0000-4000-8000-000000000001", email: "fixture@example.invalid", role: "client", firstName: "Synthetic",
      } : null } }));
      await context.route("**/api/auth/logout", route => {
        requests.push("logout");
        signedIn = false;
        return route.fulfill({ json: { ok: true } });
      });
      await context.route("**/api/userdata/*", async route => {
        const req = route.request();
        if (req.method() !== "PUT") return route.fallback();
        requests.push("save:" + new URL(req.url()).pathname);
        writes.push(req.url());
        if (failSaves) return route.fulfill({ status: 503, json: { error: "Synthetic save failure" } });
        const key = new URL(req.url()).pathname.split("/").at(-1);
        remote[key] = req.postDataJSON().value;
        return route.fulfill({ json: { ok: true, current: remote[key] } });
      });
      await context.addInitScript(({ data, theme }) => {
        if (sessionStorage.getItem("task88-seeded")) return;
        sessionStorage.setItem("task88-seeded", "1");
        for (const [key, value] of Object.entries(data)) localStorage.setItem(key, JSON.stringify(value));
        localStorage.setItem("na1_theme", theme);
        localStorage.setItem("to_road_phone_tip_seen_v1", "1");
        localStorage.setItem("to_app_route_v1", JSON.stringify({ view: "entry-hall", overlay: null }));
        localStorage.setItem("unrelated-browser-key", "keep");
      }, { data, theme });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      page.on("pageerror", error => errors.push(error.message));
      await page.goto("http://localhost:80/", { waitUntil: "networkidle" });
      await page.locator(width < 900 ? ".jr-phone-bar" : ".jr-desktop").waitFor().catch(async error => {
        console.error("Startup diagnostics:", errors, (await page.locator("body").innerText()).slice(0, 1600), unexpected, requests);
        throw error;
      });
      if (width === 375) {
        await page.getByRole("tab", { name: "This week", exact: true }).click();
        const weeklyText = await page.locator(".phone-home").textContent();
        assert.match(weeklyText, /BE/); assert.match(weeklyText, /LIVE/);
        assert.doesNotMatch(weeklyText, /\bTRY\b|\bNOTICE\b/);
      }
      // The exact same section projection supplies the Map panels and the PDF.
      const model = await page.evaluate(async () => {
        const { a1Sections } = await import("/src/mapOfMe/model.ts");
        const read = key => JSON.parse(localStorage.getItem(key) || "null");
        return a1Sections({ map: read("to_map"), rc: read("to_rc_state_v1"), values: read("to_mirror4_state_v1"),
          notice: read("a1_notice"), practical: read("to_a1_practical_v1") }).find(row => row.id === "notice");
      });
      assert.equal(model.title, "This week I'm living");
      assert.deepEqual(model.answers.slice(0, 3).map(row => row.label), ["Do", "Be", "Live"]);
      assert.equal(model.answers[2].text, "One moment Integrity showed up this week. And one moment it didn't.");
      if (width < 900) await page.locator(".jr-phone-bar").click();
      const signOut = page.locator(width < 900 ? ".jr-signout-row button" : ".pn-desktop-links button").filter({ hasText: /^Sign out$/ });
      await signOut.waitFor();
      const box = await signOut.boundingBox();
      assert(box.y >= 0 && box.y + box.height <= (width === 375 ? 812 : 800));
      assert(box.height >= 44 && box.width >= 44);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      if (width === 375) {
        assert(await page.locator(".appearance-options").evaluate(e => !!(e.compareDocumentPosition(document.querySelector(".jr-signout-row")) & Node.DOCUMENT_POSITION_FOLLOWING)));
      }
      await page.screenshot({ path: path.join(out, `signout-${width}-${theme}.png`) });
      if (process.env.VISUAL_ONLY) {
        const color = await signOut.evaluate(element => getComputedStyle(element).color);
        if (width === 375) assert.equal(color, theme === "light" ? "rgb(53, 51, 52)" : "rgb(249, 246, 238)");
        console.log("PASS screenshot", width, theme, color);
        await context.close();
        continue;
      }
      // Failed saves must keep the session and local answers, not silently discard them.
      failSaves = true;
      await signOut.click();
      await page.getByRole("alert").filter({ hasText: /latest answers could not be saved/ }).waitFor();
      assert.equal(signedIn, true);
      assert.equal(requests.includes("logout"), false);
      assert(await page.evaluate(() => !!localStorage.getItem("to_map")));
      failSaves = false;
      const expectedMap = await page.evaluate(() => JSON.parse(localStorage.getItem("to_map")));
      // Queue a legacy save immediately before logout as a member might do while editing.
      await page.evaluate(async () => {
        const { trackAccountSave } = await import("/src/lib/accountSignOut.ts");
        trackAccountSave("map", () => fetch("/api/userdata/map", { method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: JSON.parse(localStorage.getItem("to_map")) }) }));
      });
      await Promise.all([page.waitForEvent("domcontentloaded"), signOut.click()]);
      await page.waitForFunction(() => !!document.querySelector('input[type="password"]'));
      assert.equal(signedIn, false);
      assert.equal(requests.at(-1), "logout", "All writes precede session termination");
      assert.deepEqual(remote.map, expectedMap, "Server answers survive sign out");
      const storage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
      assert(!Object.keys(storage.local).some(key => (key.startsWith("to_") && key !== "to_road_phone_tip_seen_v1") || key.startsWith("a1_")));
      assert.equal(storage.local.na1_theme, theme);
      assert.equal(storage.local["unrelated-browser-key"], "keep");
      assert.deepEqual(unexpected, []);
      results.push({ width, theme, saveFailureBlockedLogout: true, cacheCleared: true, answersPreserved: true, writesIntercepted: writes.length });
      console.log("PASS", width, theme, "copy/PDF-model, fit, save failure/retry, logout order, cache clearing, preserved answers");
      await context.close();
    }
    assert.deepEqual(errors, []);
    if (!process.env.VISUAL_ONLY) fs.writeFileSync(path.join(out, "checks.json"), JSON.stringify({ results, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
