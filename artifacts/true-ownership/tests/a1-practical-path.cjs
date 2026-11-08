// Synthetic saved-answer drafts: walk the real claim/handoff controls, never an owner's session.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { fixture } = require("./a1-practical-browser.cjs");
const { installIsolation } = require("./browser-isolation.cjs");
async function main() {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/repl/tools/bin/chromium", headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const c = await browser.newContext({ viewport: { width: 375, height: 812 }, serviceWorkers: "block" });
  const writes = [], unexpected = [], data = fixture(false);
  data.a1_ex4_done = false;
  data.to_map.vision.complete = false;
  delete data.to_map.vision.declaration.claimedAt;
  await installIsolation(c, writes, unexpected);
  await c.addInitScript(d => {
    for (const [k, v] of Object.entries(d)) localStorage.setItem(k, JSON.stringify(v));
    localStorage.setItem("to_app_route_v1", JSON.stringify({ view: "m3", overlay: { hubId: "m3", roomId: "ownIt" } }));
  }, data);
  const p = await c.newPage();
  p.setDefaultTimeout(14000);
  try {
    await p.goto(process.env.APP_URL || "http://localhost:80");
    const originalRC = await p.evaluate(() => localStorage.getItem("to_rc_state_v1"));
    await p.getByRole("button", { name: "Claim my identity →", exact: true }).click();
    await p.locator(".na2-decl-ceremony.is-on").waitFor();
    await p.locator(".na2-decl-ceremony.is-on").getByRole("button", { name: "Continue →", exact: true }).click();
    await p.locator(".balance-screen").waitFor();
    await p.locator(".balance-footer").getByRole("button", { name: "Continue →", exact: true }).click();
    await p.locator(".balance-screen").waitFor({ state: "detached" });
    await p.getByRole("button", { name: /^(Begin|Continue) Purpose/ }).click();
    await p.getByRole("button", { name: /^Declare —/ }).click();
    await p.getByRole("button", { name: "✓ Declare", exact: true }).click();
    await p.getByRole("button", { name: "Continue to Vision →", exact: true }).click();
    await p.getByRole("button", { name: /^(Begin|Continue) Vision/ }).click();
    await p.getByRole("button", { name: /^Vision Declaration/ }).click();
    await p.getByRole("button", { name: "Claim my vision →", exact: true }).click();
    await p.locator(".na2-decl-ceremony.is-on").getByRole("button", { name: "Continue →", exact: true }).click();
    await p.locator(".a1-end-card").waitFor();
    await p.getByRole("button", { name: "Continue →", exact: true }).click();
    await p.locator(".practical-week").waitFor();
    await p.getByRole("button", { name: "Claim A1 →", exact: true }).click();
    await p.locator(".a1-end-claimed").waitFor();
    assert.equal(await p.evaluate(() => localStorage.getItem("to_rc_state_v1")), originalRC);
    assert.deepEqual(unexpected, []);
    console.log("PASS: first Identity claim → optional balance (no taps) → Purpose claim → Vision claim → A1 week → A1 claimed; RC unchanged.");
  } catch (e) {
    console.error("Visible buttons:", await p.getByRole("button").allTextContents());
    await p.screenshot({ path: "generated-artifacts/a1-practical/path-diagnostic.png" });
    throw e;
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
