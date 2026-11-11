import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { walkYesPath } from "./lib/course-walk.mjs";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const output = path.join(root, "generated-artifacts/free-verification");
await mkdir(output, { recursive: true });
const base = process.env.FREE_TEST_URL ?? (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:80");
assert(!base.includes("replit.app"), "Never run synthetic signup tests against production.");
// Baseline: the `pre-free-1` tag where it exists, otherwise the commit it marks (0fea2a2).
const BASE = (() => { try { execFileSync("git", ["rev-parse", "--verify", "pre-free-1^{commit}"], { cwd: root, stdio: "ignore" }); return "pre-free-1"; } catch { return "0fea2a2"; } })();
// The protected scene sources and inherited style text must be byte-identical.
for (const name of ["reality-check/RealityCheckScreens.tsx", "reality-check/RealityCheckFutures.tsx", "reality-check/RCFutureScenes.tsx",
  "reality-check/reality-check.css", "reality-check/rc-polish.css", "reality-check/rc-true-size.css", "reality-check/rc-updated-scenes.css"]) {
  const file = `artifacts/true-ownership/src/${name}`;
  assert.equal(await readFile(path.join(root, file), "utf8"), execFileSync("git", ["show", `${BASE}:${file}`], { cwd: root, encoding: "utf8" }), `Protected file changed: ${name}`);
}
// rcConstants.ts may only grow: every removed line must be one of the five known, additive-compatible edits.
{
  const diff = execFileSync("git", ["diff", "--unified=0", BASE, "--", "artifacts/true-ownership/src/rcConstants.ts"], { cwd: root, encoding: "utf8" });
  const removed = diff.split("\n").filter(l => l.startsWith("-") && !l.startsWith("---")).map(l => l.slice(1).trim());
  const allowed = ["focus: RCArea | null; focusChosenBy:", "for (const sentence of RC_MIRROR)", "const mirror = [...new Set(texts(v.mirror))]", "focus, focusChosenBy: !focus ? null", "notYetWhy: text(v.notYetWhy), complete: v.complete === true,"];
  for (const line of removed) assert(allowed.some(a => line.startsWith(a)), `Legacy part of rcConstants.ts changed: ${line}`);
  const answers = execFileSync("node_modules/.bin/tsx", ["scripts/rc-normalize-check.ts"], { cwd: path.join(root, "artifacts/true-ownership"), encoding: "utf8" });
  assert(answers.includes('"ok":true'), "Answer-format check failed.");
}
const legacy = "artifacts/true-ownership/src/App.tsx";
const baseline = execFileSync("git", ["show", `${BASE}:${legacy}`], { cwd: root, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
const current = await readFile(path.join(root, legacy), "utf8");
// `pre-free-1` predates the style exports; `0fea2a2` already has them. Either way, nothing else may change.
assert.equal(baseline.includes("export { CSS as inheritedCSS") ? current : current.replace("export { CSS as inheritedCSS, NewA1Veil, NA1_VEIL_TIMING };\n", ""), baseline, "Inherited styles or full-app source changed beyond the style exports.");

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
  // The whole new course, FC-01 to FC-21, then the waitlist (answers are saved on the real account first).
  const posterFile = path.join(output, "My-Future-B.png");
  const saved = await walkYesPath(page, {
    shot: name => screenshot(`03-phone-${name}-light`), errors: runtimeErrors, saveDownload: dl => dl.saveAs(posterFile),
  });
  assert.equal(saved.complete, true); assert.equal(saved.willing, "yes"); assert.equal(saved.choice, "B");
  assert.equal(saved.firstStep, saved.futureB1.oneThing, "The first step matches the letter's one thing.");
  assert(saved.pattern && saved.oneThing && saved.underneath && saved.partIOwn && saved.futureAPath?.year && saved.futureBScene?.morning, "New course fields were saved.");
  assert.equal(saved.focusChosenBy, "picked");
  const poster = await readFile(posterFile);
  assert.equal(poster.readUInt32BE(16), 1080); assert.equal(poster.readUInt32BE(20), 1920);
  const metadata = JSON.parse((await api("/api/free/account")).body);
  assert(metadata.waitlistedAt);
  const again = await api("/api/free/waitlist", "POST", undefined, { "X-Account-Id": fixtureId });
  assert.equal(JSON.parse(again.body).waitlistedAt, metadata.waitlistedAt, "Waitlist date must be idempotent.");
  // The poster is also offered on the ending, saving first.
  const endingDownload = page.waitForEvent("download");
  await click("Save my Future B");
  await (await endingDownload).saveAs(path.join(output, "My-Future-B-ending.png"));
  await click("Not yet. Keep my Future B saved");
  await page.getByText("Your Future B is saved. Your road will be here when you're ready.", { exact: true }).waitFor();
  await page.reload();
  await page.getByRole("button", { name: /Your Future B · On the waitlist/ }).click();
  await page.getByText("YOU CHOSE FUTURE B", { exact: true }).waitFor();
  await page.getByText("On the waitlist ✓", { exact: true }).waitFor();
  for (const [width, height, label] of [[375, 812, "phone"], [1280, 800, "desktop"]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(150);
    await page.locator(".fc-scroll").evaluate(el => { el.scrollTop = 0; });
    await screenshot(`10-${label}-ending-light`);
    await page.getByRole("button", { name: "Not yet. Keep my Future B saved", exact: true }).scrollIntoViewIfNeeded();
    await screenshot(`10-${label}-ending-light-actions`);
    await page.locator(".fc-scroll").evaluate(el => { el.scrollTop = 0; });
    // Theme control lives outside the modal; changing appearance through storage is
    // exactly the provider's cross-tab interface, not a bypass of journey/auth.
    await page.evaluate(() => { localStorage.setItem("na1_theme", "dark"); window.dispatchEvent(new StorageEvent("storage", { key: "na1_theme" })); });
    await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
    await screenshot(`11-${label}-ending-dark`);
    await page.getByRole("button", { name: "Not yet. Keep my Future B saved", exact: true }).scrollIntoViewIfNeeded();
    await screenshot(`11-${label}-ending-dark-actions`);
    await page.locator(".fc-scroll").evaluate(el => { el.scrollTop = 0; });
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
  assert.equal(rc.complete, true); assert.equal(rc.futureB1.doing, "I have time to think and enough left for myself."); assert.equal(rc.fcScreen, 26);
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
  console.log(JSON.stringify({ ok: true, syntheticAccountId: fixtureId, boundWrites, checks: "source preservation, answer format, signup, FC-01 to FC-21 incl. Future A branch, Yes path to the waitlist, saved fields, waitlist idempotence, poster, reload, themes, routes, save isolation, logout", output }));
} catch (error) {
  await screenshot("FAILURE", true).catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  execFileSync(process.execPath, [path.join(root, "artifacts/api-server/scripts/free-fixture-cleanup.mjs"), email], { cwd: root, stdio: "inherit" });
}
