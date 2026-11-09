const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const { chromium } = require("playwright");
const { allStagesFixture } = require("./map-of-me-fixtures.cjs");
const out = path.resolve("generated-artifacts/account-isolation");
const base = "http://localhost:80";

(async () => {
  const { user, sid } = JSON.parse(fs.readFileSync("/tmp/account-isolation-reset-session.json", "utf8"));
  assert.equal(user.email, "katherine+test@accelerategrowth45.com");
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] });
  const errors = [], checks = [];
  try {
    for (const width of [375, 1280]) for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width, height: width === 375 ? 812 : 800 }, serviceWorkers: "block" });
      const page = await context.newPage();
      page.on("pageerror", error => errors.push(error.message));
      const writes = [];
      page.on("request", request => {
        if (request.method() === "PUT" && /\/api\/userdata\//.test(request.url())) writes.push(request.postData());
      });
      // Revoked-session startup with same-owner stale data must quarantine it,
      // even before a new session is established for the same member.
      await context.addInitScript(({ data, theme, id }) => {
        if (sessionStorage.getItem("reset-seeded-once")) return;
        sessionStorage.setItem("reset-seeded-once", "1");
        for (const [key, value] of Object.entries(data)) localStorage.setItem(key, JSON.stringify(value));
        localStorage.setItem("account-cache-owner:v2", id);
        localStorage.setItem("na1_theme", theme);
      }, { data: allStagesFixture(), theme, id: user.id });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator('input[type="password"]').waitFor();
      assert.equal(writes.length, 0);
      const rawAtSignIn = await page.evaluate(() => ({ ...localStorage }));
      assert(!rawAtSignIn.to_map && !rawAtSignIn.to_mirror4_state_v1 && !rawAtSignIn.a1_ex1_done);
      assert(!rawAtSignIn["account-cache-owner:v2"]);
      await context.addCookies([{ name: "sid", value: sid, url: base, httpOnly: true, sameSite: "Lax" }]);
      await page.reload({ waitUntil: "networkidle" });
      await page.getByText("Welcome in.", { exact: true }).waitFor();
      await page.getByRole("heading", { name: "Before you start, a reality check.", exact: true }).waitFor();
      assert.equal(await page.getByLabel("What should we call you?").inputValue(), "");
      await page.getByRole("button", { name: "Begin the Reality Check →", exact: true }).waitFor();
      const data = await (await context.request.get(base + "/api/userdata")).json();
      assert.deepEqual(data, {}, "Reset member has zero answer/progress rows");
      await page.reload({ waitUntil: "networkidle" });
      await page.getByText("Welcome in.", { exact: true }).waitFor();
      assert.deepEqual(await (await context.request.get(base + "/api/userdata")).json(), {});
      assert.equal(writes.length, 0, "Restoring or reloading does not repopulate reset data");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      await page.locator(".member-controls").getByRole("button", { name: "Account", exact: true }).click();
      await page.locator(".member-account-email").filter({ hasText: user.email }).waitFor();
      await page.screenshot({ path: path.join(out, `reset-${width}-${theme}.png`) });
      checks.push({ width, theme, emptyServer: true, emptyReload: true, noUploads: true, revokedSessionCacheCleared: true });
      console.log("PASS reset", width, theme, "no answers or progress, reload empty, no stale uploads");
      await context.close();
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, "reset-checks.json"), JSON.stringify({ checks, errors,
      authenticationMethod: "Disposable verification session via existing issuer; original password unchanged, not re-entered" }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
