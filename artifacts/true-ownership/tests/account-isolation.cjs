const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const { chromium } = require("playwright");
const { allStagesFixture } = require("./map-of-me-fixtures.cjs");
const base = "http://localhost:80";
const out = path.resolve("generated-artifacts/account-isolation");
const ownerKey = "account-cache-owner:v2";
const quarantinePrefix = "account-cache-quarantine:v1:";

(async () => {
  const [A, B] = JSON.parse(fs.readFileSync("/tmp/account-isolation-members.json", "utf8"));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, serviceWorkers: "block" });
  const auditA = await browser.newContext();
  const errors = [], writes = [];
  const login = async (ctx, account) => {
    const response = await ctx.request.post(base + "/api/auth/login", { data: { email: account.email, password: account.password } });
    assert(response.ok());
    assert.equal((await response.json()).user.id, account.id);
  };
  const getData = async ctx => {
    const response = await ctx.request.get(base + "/api/userdata");
    assert(response.ok());
    return response.json();
  };
  const seed = { ...allStagesFixture(), to_voice: { note: "A_PRIVATE_SENTINEL" },
    to_sync_meta_v1: { a2state: { lt: Date.now() + 1000 } }, to_app_route_v1: { view: "a3", overlay: "mirror" } };
  // Init script runs before application code, modelling caches left by the old app.
  await context.addInitScript(({ seed, ownerKey }) => {
    const flag = "isolation-seed-once";
    if (!sessionStorage.getItem(flag)) {
      sessionStorage.setItem(flag, "yes");
      for (const [key, value] of Object.entries(seed)) localStorage.setItem(key, JSON.stringify(value));
      localStorage.removeItem(ownerKey);
      localStorage.setItem("na1_theme", "light");
    }
  }, { seed, ownerKey });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", req => {
    if (/\/api\/userdata\//.test(req.url()) && req.method() === "PUT") writes.push({ headers: req.headers(), body: req.postData() });
  });
  try {
    await login(context, A);
    await login(auditA, A);
    // Real server data belongs only to disposable A.
    assert((await auditA.request.put(base + "/api/userdata/intake", {
      headers: { "X-Account-Id": A.id }, data: { value: { name: "Isolation A" } },
    })).ok());
    assert((await auditA.request.put(base + "/api/userdata/voice", {
      headers: { "X-Account-Id": A.id }, data: { value: { note: "A_SERVER_SENTINEL" } },
    })).ok());
    await page.goto(base, { waitUntil: "networkidle" });
    await page.locator(".member-controls").waitFor();
    assert.equal(await page.evaluate(key => localStorage.getItem(key), ownerKey), A.id);
    let storage = await page.evaluate(() => ({ ...localStorage }));
    assert(Object.keys(storage).some(key => key.startsWith(quarantinePrefix)));
    assert.equal(storage.to_mirror4_state_v1, undefined, "Unowned claimed Values are not adopted");
    assert.equal(storage.to_app_route_v1, undefined, "Unowned route is cleared");
    assert(!JSON.stringify(await getData(auditA)).includes("A_PRIVATE_SENTINEL"));
    assert(!("m4state" in await getData(auditA)), "No unknown exercise is automatically uploaded");
    const originalA = await getData(auditA);
    console.log("PASS restored session with missing owner: unknown caches quarantined, no uploads");

    // Same-account unsent answers remain eligible for sync after reload.
    await page.evaluate(async () => {
      localStorage.setItem("to_a2_state_v1", JSON.stringify({ ...JSON.parse(localStorage.getItem("to_a2_state_v1") || "{}"), fixtureAnswer: "A_OWN_UNSENT" }));
      const sync = await import("/src/newFlowSync.ts");
      sync.markLocalChange("to_a2_state_v1");
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".member-controls").waitFor();
    assert.equal((await getData(auditA)).a2state.v.fixtureAnswer, "A_OWN_UNSENT");
    const savedA = await getData(auditA);
    console.log("PASS same-account unsent answer survives reload and saves to A");

    // Keep a pending A timer, then change the shared browser cookie to B.
    await page.evaluate(async () => {
      localStorage.setItem("to_a2_state_v1", JSON.stringify({ fixtureAnswer: "A_PENDING_ONLY" }));
      const sync = await import("/src/newFlowSync.ts");
      sync.markLocalChange("to_a2_state_v1");
    });
    await login(context, B);
    const oldClient = await context.request.put(base + "/api/userdata/voice", { data: { value: { note: "MUST_NOT_SAVE" } } });
    assert.equal(oldClient.status(), 412, "Unbound old clients cannot save");
    const wrongClient = await context.request.put(base + "/api/userdata/voice", {
      headers: { "X-Account-Id": A.id }, data: { value: { note: "MUST_NOT_SAVE" } },
    });
    assert.equal(wrongClient.status(), 412, "Stale A tab cannot write through B cookie");
    // The pending timer is rejected too, and the app restores B from /auth/me.
    await page.waitForFunction(({ ownerKey, id }) => localStorage.getItem(ownerKey) === id, { ownerKey, id: B.id });
    await page.locator(".member-controls").waitFor();
    await page.waitForTimeout(1800);
    const cleanB = await getData(context);
    assert(!JSON.stringify(cleanB).includes("A_"));
    assert(!("voice" in cleanB)); assert(!("a2state" in cleanB)); assert(!("m4state" in cleanB));
    assert.deepEqual(await getData(auditA), savedA, "A server data is unchanged by B login");
    storage = await page.evaluate(() => ({ ...localStorage }));
    const recoveries = Object.entries(storage).filter(([key]) => key.startsWith(quarantinePrefix));
    assert(recoveries.some(([, raw]) => raw.includes("A_PENDING_ONLY")), "Unsent A data preserved without attaching it to B");
    await page.locator(".member-controls").getByRole("button", { name: "Account", exact: true }).click();
    await page.locator(".member-controls .member-account-email").filter({ hasText: B.email }).waitFor();
    for (const theme of ["light", "dark"]) {
      await page.evaluate(theme => {
        localStorage.setItem("na1_theme", theme);
        document.documentElement.dataset.theme = theme;
      }, theme);
      await page.screenshot({ path: path.join(out, `account-375-${theme}.png`) });
    }
    console.log("PASS A→B switch, pending timer, old/stale writes rejected, A preserved, email visible");

    // Restored B session faced with A-owned caches before startup.
    await context.addInitScript(({ ownerKey, id }) => {
      if (sessionStorage.getItem("isolation-restored-once")) return;
      sessionStorage.setItem("isolation-restored-once", "1");
      localStorage.setItem(ownerKey, id);
      localStorage.setItem("to_voice", JSON.stringify({ note: "A_RESTORED_CACHE" }));
      localStorage.setItem("to_sync_meta_v1", JSON.stringify({ a2state: { lt: Date.now() + 5000 } }));
    }, { ownerKey, id: A.id });
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".member-controls").waitFor();
    assert.equal(await page.evaluate(key => localStorage.getItem(key), ownerKey), B.id);
    assert(!JSON.stringify(await getData(context)).includes("A_"));
    assert.deepEqual(await getData(auditA), savedA);
    console.log("PASS restored B session ignores different-owner answers and sync timestamps");

    // No cookie: quarantine before rendering sign-in, then use the real sign-in form.
    await context.request.post(base + "/api/auth/logout");
    await page.reload({ waitUntil: "networkidle" });
    await page.locator('input[type="email"]').fill(B.email);
    await page.locator('input[type="password"]').fill(B.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.locator(".member-controls").waitFor();
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".member-controls").waitFor();
    assert(!JSON.stringify(await getData(context)).includes("A_"));
    assert.deepEqual(await getData(auditA), savedA);
    assert(!writes.some(write => /A_PRIVATE_SENTINEL|A_RESTORED_CACHE/.test(write.body || "")));
    assert(writes.every(write => !!write.headers["x-account-id"]));
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, "checks.json"), JSON.stringify({
      missingOwner: true, differentOwner: true, restoredSession: true, freshSignIn: true,
      pendingSaveBlocked: true, unboundSaveRejected: true, sameOwnerUnsyncedSaved: true,
      recoveryPreserved: true, noAAnswersInB: true, aServerUnchanged: true,
      passwordSignInAndReload: true, signedInEmailVisible: true, errors,
    }, null, 2));
    console.log("PASS fresh password sign-in and reload: B clean, no leaked uploads, zero runtime errors");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
