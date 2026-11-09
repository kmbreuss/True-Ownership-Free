const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const { chromium } = require("playwright");
const { installIsolation, proveIsolation } = require("./browser-isolation.cjs");
const out = path.resolve("generated-artifacts/new-member-start");
const base = "http://localhost:80";

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] });
  await proveIsolation(browser);
  const credentials = JSON.parse(fs.readFileSync("/tmp/task88-test-login.json", "utf8"));
  const authContext = await browser.newContext();
  const login = await authContext.request.post(`${base}/api/auth/login`, {
    data: { email: credentials.user.email, password: credentials.tempPassword },
  });
  assert(login.ok(), "Existing synthetic test login works");
  const me = await (await authContext.request.get(`${base}/api/auth/me`)).json();
  assert.equal(me.user.id, credentials.user.id, "Use only the requested test member");
  const before = await (await authContext.request.get(`${base}/api/userdata`)).text();
  const errors = [], checks = [];
  try {
    for (const width of [375, 1280]) for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width, height: width === 375 ? 812 : 800 }, serviceWorkers: "block" });
      const remote = {}, writes = [], unexpected = [];
      await installIsolation(context, writes, unexpected, () => remote);
      await context.route("**/api/auth/me", route => route.fulfill({ json: me }));
      await context.route("**/api/userdata/*", route => {
        if (route.request().method() !== "PUT") return route.fallback();
        const key = decodeURIComponent(new URL(route.request().url()).pathname.split("/").at(-1));
        remote[key] = route.request().postDataJSON().value;
        writes.push(key);
        return route.fulfill({ json: { ok: true, current: remote[key] } });
      });
      await context.addInitScript(theme => {
        localStorage.setItem("na1_theme", theme);
        localStorage.setItem("to_road_phone_tip_seen_v1", "1");
      }, theme);
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      page.on("pageerror", error => errors.push(error.message));
      await page.addInitScript(() => {
        window.addEventListener("error", e => console.error("WINDOW_ERROR", e.message));
        window.addEventListener("unhandledrejection", e => console.error("REJECTION", String(e.reason)));
      });
      page.on("console", msg => { if (/WINDOW_ERROR|REJECTION/.test(msg.text())) errors.push(msg.text()); });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: "Before you start, a reality check." }).waitFor();
      assert.equal(await page.getByText("What's your first name?", { exact: true }).count(), 0);
      await page.getByText("Welcome in.", { exact: true }).waitFor();
      const nameField = page.getByLabel("What should we call you?");
      assert.equal(await nameField.inputValue(), "");
      const header = page.locator(".member-controls");
      const themeButton = header.getByRole("button", { name: "Toggle light or dark theme" });
      const account = header.getByRole("button", { name: "Account", exact: true });
      const themeBox = await themeButton.boundingBox(), accountBox = await account.boundingBox();
      for (const box of [themeBox, accountBox]) assert(box.width >= 44 && box.height >= 44);
      assert(themeBox.x + themeBox.width <= accountBox.x, "Controls do not overlap");
      const begin = page.getByRole("button", { name: "Begin the Reality Check →", exact: true });
      const beginBox = await begin.boundingBox();
      assert(beginBox.y + beginBox.height < (width === 375 ? 812 : 800), "Main action above fold");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      await page.screenshot({ path: path.join(out, `start-${width}-${theme}.png`) });
      await account.click();
      await header.getByRole("button", { name: "Change password", exact: true }).waitFor();
      await header.getByRole("button", { name: "Sign out", exact: true }).waitFor();
      await page.screenshot({ path: path.join(out, `account-${width}-${theme}.png`) });
      await header.getByRole("button", { name: "Change password", exact: true }).click();
      await page.locator('input[type="password"]').first().waitFor();
      await page.getByRole("button", { name: /Cancel/i }).click();
      await nameField.fill("Test Member");
      await begin.click();
      await page.locator(".rc-room").waitFor();
      await page.waitForFunction(() => !document.querySelector(".na1-veil.is-rising,.na1-veil.is-hold"));
      assert.equal(remote.intake.name, "Test Member");
      assert(!remote.rcstate?.complete, "Beginning does not complete Reality Check");
      // The controls remain separate from the room's own close button.
      const close = page.locator(".rc-room button").filter({ hasText: "×" });
      const roomClose = page.locator(".rc-room").getByRole("button", { name: /close/i });
      const closeButton = await roomClose.count() ? roomClose.first() : close.first();
      const closeBox = await closeButton.boundingBox();
      assert(closeBox.y >= 146 || width >= 900 && closeBox.y >= 56, "Room close below top controls/road");
      await closeButton.click();
      await page.locator(".rc-hub").waitFor();
      assert.equal(await page.getByText("Welcome in.", { exact: true }).count(), 0, "Named member has no extra block");
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(await page.getByText("Welcome in.", { exact: true }).count(), 0);
      assert.equal(remote.intake.name, "Test Member", "Name survives reload");
      assert.deepEqual(unexpected, []);
      checks.push({ width, theme, mainActionAboveFold: true, controls44: true, noOverlap: true,
        savedName: true, reload: true, noCompletionChange: true, writesIntercepted: writes.length });
      console.log("PASS", width, theme);
      await context.close();
    }
    // Skip-name path: same main action, no requirement or fake name.
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, serviceWorkers: "block" });
    const remote = {}, writes = [], unexpected = [];
    await installIsolation(context, writes, unexpected, () => remote);
    await context.route("**/api/auth/me", route => route.fulfill({ json: me }));
    await context.route("**/api/userdata/*", route => {
      if (route.request().method() !== "PUT") return route.fallback();
      remote[new URL(route.request().url()).pathname.split("/").at(-1)] = route.request().postDataJSON().value;
      return route.fulfill({ json: { ok: true } });
    });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Begin the Reality Check →", exact: true }).click();
    await page.locator(".rc-room").waitFor();
    assert.equal(remote.intake.name, "");
    await page.locator(".rc-room").getByRole("button", { name: /close/i }).click();
    await page.locator(".rc-hub").getByRole("button", { name: "Entry Hall", exact: true }).click();
    await page.getByRole("heading", { name: "Hi there", exact: true }).waitFor();
    await context.close();
    const after = await (await authContext.request.get(`${base}/api/userdata`)).text();
    assert.equal(after, before, "Real test account answers unchanged");
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, "checks.json"), JSON.stringify({ checks, blankName: true, accountUnchanged: true, errors }, null, 2));
    console.log("PASS blank name, Hi there, real test account unchanged, no runtime errors");
  } finally {
    await authContext.request.post(`${base}/api/auth/logout`);
    await authContext.close();
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
