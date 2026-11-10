import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const output = path.join(root, "generated-artifacts/free-verification");
await mkdir(output, { recursive: true });
const base = process.env.FREE_TEST_URL ?? (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:80");
assert(!base.includes("replit.app"), "Never run synthetic signup tests against production.");
// The protected scene sources and inherited style text must be byte-identical.
for (const name of ["rcConstants.ts", "reality-check/RealityCheckScreens.tsx", "reality-check/RealityCheckFutures.tsx", "reality-check/RCFutureScenes.tsx",
  "reality-check/reality-check.css", "reality-check/rc-polish.css", "reality-check/rc-true-size.css", "reality-check/rc-updated-scenes.css"]) {
  const file = `artifacts/true-ownership/src/${name}`;
  assert.equal(await readFile(path.join(root, file), "utf8"), execFileSync("git", ["show", `pre-free-1:${file}`], { cwd: root, encoding: "utf8" }), `Protected file changed: ${name}`);
}
const legacy = "artifacts/true-ownership/src/App.tsx";
const baseline = execFileSync("git", ["show", `pre-free-1:${legacy}`], { cwd: root, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
const current = await readFile(path.join(root, legacy), "utf8");
assert.equal(current.replace("export { CSS as inheritedCSS, NewA1Veil, NA1_VEIL_TIMING };\n", ""), baseline, "Inherited styles or full-app source changed beyond the style exports.");

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/repl/tools/bin/chromium", args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 375, height: 812 }, acceptDownloads: true });
const page = await context.newPage();
const runtimeErrors = [];
page.on("pageerror", error => runtimeErrors.push(error.message));
await page.addInitScript(() => {
  window.__freeErrors = [];
  window.addEventListener("error", e => window.__freeErrors.push(e.message || "window error"));
  window.addEventListener("unhandledrejection", e => window.__freeErrors.push(String(e.reason)));
});
const suffix = `${Date.now()}-${randomBytes(3).toString("hex")}`;
const email = `free-regression-${suffix}@example.invalid`;
const password = randomBytes(18).toString("base64url");
let fixtureId;
let boundWrites = 0;
await context.route("**/api/userdata**", async route => {
  const request = route.request();
  if (request.method() !== "GET") {
    assert(fixtureId, "Never write answers without the synthetic fixture identity.");
    assert.equal(request.headers()["x-account-id"], fixtureId, "Unsafe cross-account test write.");
    boundWrites++;
  }
  await route.continue();
});
async function screenshot(name, fullPage = false) {
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage });
}
async function click(text) { await page.getByRole("button", { name: text, exact: true }).click(); }
async function step(number) { await page.locator(`.rc-room[data-step="${number}"]`).waitFor(); }
async function api(url, method = "GET", body, headers = {}) {
  return page.evaluate(async ({ url, method, body, headers }) => {
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json", ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: r.status, body: await r.text() };
  }, { url, method, body, headers });
}
try {
  await page.goto(base);
  await page.getByRole("heading", { name: "Welcome in." }).waitFor();
  await screenshot("01-phone-signup-light", true);
  await page.getByLabel("First name", { exact: true }).fill("Test Reader");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const loginResponse = page.waitForResponse(r => r.url().endsWith("/api/auth/login") && r.status() === 200);
  await click("Begin my Reality Check →");
  fixtureId = (await (await loginResponse).json()).user.id;
  await page.getByRole("button", { name: "Begin the Reality Check →", exact: true }).waitFor();
  assert.equal((await api("/api/free/leads.csv")).status, 403);
  assert.equal((await api("/api/free/waitlist", "POST", undefined, { "X-Account-Id": fixtureId })).status, 409, "Incomplete RC cannot join.");
  await screenshot("02-phone-start-light", true);
  await click("Begin the Reality Check →"); await step(0);
  await page.waitForTimeout(2900);
  await screenshot("03-phone-opening-light");
  await click("I'm ready →"); await step("0b"); await screenshot("04-phone-person-light");
  await click("Show me the mirror →"); await step(1);
  await page.locator('[data-mirror-id="time-avoiding"]').click();
  await page.locator('[data-mirror-id="time-blaming"]').click();
  if (await page.getByRole("button", { name: "More sentences →", exact: true }).isVisible()) await click("More sentences →");
  await page.locator('[data-mirror-id="time-carrying"]').click();
  await screenshot("05-phone-mirror-light");
  await click("Show me what I see →"); await step(2);
  await click("Start with Time →"); await step(3);
  await page.getByLabel("Your ordinary Tuesday", { exact: true }).fill("I give my evenings away and never have time to think.");
  await click("Show me the price →"); await step(4);
  await page.getByLabel("About dollars a month", { exact: true }).fill("50");
  await page.getByLabel("About hours a week", { exact: true }).fill("12");
  await screenshot("06-phone-price-light");
  await click("Close your eyes →"); await step(5); await click("Show me →"); await step(6);
  await click("Keep going →"); await step(7);
  await page.getByRole("button", { name: /^exhausted$/i }).click();
  await page.getByLabel("What has it cost you by then?", { exact: true }).fill("My energy and my family time.");
  await click("And if you own it? →"); await step(8);
  await page.getByLabel("My Future B Tuesday", { exact: true }).fill("Mornings that are mine, work that fits, dinner without my phone.");
  await click("Bring it back to one year →"); await step(9);
  await page.getByLabel(/What will you be doing by next/).fill("I have time to think and enough left for myself.");
  await page.getByLabel("My one thing this week", { exact: true }).fill("one hour for what matters.");
  await click("Choose my future →"); await step(10);
  // Exercise the Future A branch without losing the draft.
  await page.locator(".rc-choose-a").click(); await step(11);
  await page.getByRole("heading", { name: "That's an honest answer." }).waitFor();
  await click("Look at Future B again →"); await step(8);
  await click("Bring it back to one year →"); await click("Choose my future →");
  await page.locator(".rc-choose-b").click(); await step(11);
  await click("Not yet"); await step(12);
  await page.getByLabel("What would help me say yes", { exact: true }).fill("Space to take the next small step.");
  await click("What would help me get there →"); await step(13);
  await page.getByRole("button", { name: "Join the waitlist →", exact: true }).waitFor();
  await screenshot("07-phone-ending-notyet-light");
  // Return via the unchanged Back actions and verify 14A also reaches only ending.
  await click("← Back"); await step(12); await click("← Back"); await step(11);
  await click("Yes, I'm willing"); await step(12);
  await screenshot("08-phone-all-in-light");
  await click("What will get me there →"); await step(13);
  await click("Join the waitlist →");
  await page.getByText("On the waitlist ✓", { exact: true }).waitFor();
  await screenshot("09-phone-waitlist-light", true);
  const metadata = JSON.parse((await api("/api/free/account")).body);
  assert(metadata.waitlistedAt);
  const again = await api("/api/free/waitlist", "POST", undefined, { "X-Account-Id": fixtureId });
  assert.equal(JSON.parse(again.body).waitlistedAt, metadata.waitlistedAt, "Waitlist date must be idempotent.");
  const download = page.waitForEvent("download");
  await click("Save my Future B");
  await (await download).saveAs(path.join(output, "My-Future-B.png"));
  const png = await readFile(path.join(output, "My-Future-B.png"));
  assert.equal(png.readUInt32BE(16), 1080); assert.equal(png.readUInt32BE(20), 1920);
  await click("Not yet. Keep my Future B saved");
  await page.getByText("Your Future B is saved. Your road will be here when you're ready.", { exact: true }).waitFor();
  await page.reload();
  await page.getByRole("button", { name: /Your Future B · On the waitlist/ }).click();
  await step(13);
  await page.getByText("On the waitlist ✓", { exact: true }).waitFor();
  for (const [width, height, label] of [[375, 812, "phone"], [1280, 800, "desktop"]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(150);
    await page.locator(".rc-body").evaluate(el => { el.scrollTop = 0; });
    await screenshot(`10-${label}-ending-light`);
    await page.getByRole("button", { name: "Not yet. Keep my Future B saved", exact: true }).scrollIntoViewIfNeeded();
    await screenshot(`10-${label}-ending-light-actions`);
    await page.locator(".rc-body").evaluate(el => { el.scrollTop = 0; });
    // Theme control lives outside the modal; changing appearance through storage is
    // exactly the provider's cross-tab interface, not a bypass of journey/auth.
    await page.evaluate(() => { localStorage.setItem("na1_theme", "dark"); window.dispatchEvent(new StorageEvent("storage", { key: "na1_theme" })); });
    await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
    await screenshot(`11-${label}-ending-dark`);
    await page.getByRole("button", { name: "Not yet. Keep my Future B saved", exact: true }).scrollIntoViewIfNeeded();
    await screenshot(`11-${label}-ending-dark-actions`);
    await page.locator(".rc-body").evaluate(el => { el.scrollTop = 0; });
    await page.evaluate(() => { localStorage.setItem("na1_theme", "light"); window.dispatchEvent(new StorageEvent("storage", { key: "na1_theme" })); });
  }
  // Every retained legacy destination is neutralized at the entry boundary.
  await page.locator(".na1-room-close").click();
  for (const target of ["/a1", "/a2", "/a3", "/a4", "/a5", "/home", "/map-of-me", "/decisions", "/audio", "/framework", "/?preview=1&view=grid", "/#a2"]) {
    await page.goto(base + target);
    await page.getByRole("button", { name: "Review the Reality Check →", exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, "/"); assert.equal(new URL(page.url()).search, ""); assert.equal(new URL(page.url()).hash, "");
    assert.equal(await page.locator(".pn-menu,.jr-phone-bar,.rc-dev-tools,.dev-preview-banner").count(), 0);
  }
  const rc = JSON.parse((await api("/api/userdata")).body).rcstate.v;
  assert.equal(rc.complete, true); assert.equal(rc.futureB1.doing, "I have time to think and enough left for myself.");
  // Server rejects stale account saves, including nested userdata paths.
  const stale = await page.request.put(base + "/api/userdata/rcstate", { headers: { "X-Account-Id": "other-account" }, data: { value: { t: Date.now(), v: {} } } });
  assert.equal(stale.status(), 412);
  const locked = await api("/api/userdata/a2state", "PUT", { value: { t: Date.now(), v: {} } });
  assert.equal(locked.status, 400);
  const badOrigin = await page.request.post(base + "/api/free/waitlist", { headers: { Origin: "https://foreign.invalid", "X-Account-Id": fixtureId } });
  assert.equal(badOrigin.status(), 403);
  await page.getByText("Account ▾", { exact: true }).click();
  await click("Sign out");
  await page.getByRole("heading", { name: "Welcome in." }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem("to_rc_state_v1")), null);
  assert.equal(await page.evaluate(() => localStorage.getItem("na1_theme")), "light");
  assert(boundWrites > 0, "No account-owned writes were observed.");
  assert.deepEqual(runtimeErrors, []);
  assert.deepEqual(await page.evaluate(() => window.__freeErrors), []);
  console.log(JSON.stringify({ ok: true, syntheticAccountId: fixtureId, boundWrites, checks: "source preservation, signup, scenes, A/not-yet/yes branches, 14A/14B routing, waitlist/reload/idempotence, poster, themes, routes, save isolation, logout", output }));
} catch (error) {
  await screenshot("FAILURE", true).catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  execFileSync(process.execPath, [path.join(root, "artifacts/api-server/scripts/free-fixture-cleanup.mjs"), email], { cwd: root, stdio: "inherit" });
}
