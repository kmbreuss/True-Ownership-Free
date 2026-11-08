const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const { fixtures, modules, plain } = require("./a1-fixtures.cjs");
const { installIsolation, proveIsolation } = require("./browser-isolation.cjs");
const out = path.resolve("generated-artifacts/mirror-illustrations");
const base = process.env.J1_BASE_URL || "http://localhost:80";

function fixture() {
  const { load } = modules(), f = fixtures();
  const a2 = plain(load("a2Constants").EMPTY_A2);
  const a3 = plain(load("a3Constants").EMPTY_A3);
  const a4 = plain(load("a4Constants").EMPTY_A4);
  const a5 = plain(load("a5Constants").EMPTY_A5);
  for (const mirror of [a2.m1, a2.m2, a2.m3, ...Object.values(a3), a4.self, a4.time, a4.wealth, a4.a4]) mirror.claimed = true;
  a2.m1.bottleneck = "purpose";
  a2.m2.priorities = ["Deep work", "Family time"];
  a2.m3.moveText = "Delegate invoicing and protect Friday mornings.";
  a3.m1.names = ["Morgan", "Lee"]; a3.m1.ratings = { Morgan: "advocate", Lee: "anchor" };
  a3.m2.items = [{ name: "morning walk", kind: "habit", rating: "advocate" }];
  a3.m2.takeaway = "My desk helps me focus.";
  a3.m3.voiceWant = "I can be direct and kind.";
  a3.m3.thoughts = [{ text: "I can ask for help.", verdict: "coach", reframe: "" }];
  a3.m5.seats = [{ role: "Accountability", desc: "", name: "Morgan", inLife: "life" }];
  a3.m6.bottleneck = "env"; a3.m6.env = "morning walk";
  a4.self.will = "take a walk before opening email";
  a4.time.will = "I will protect Tuesday mornings for deep work.";
  a4.wealth.will = "review my numbers every Friday";
  a5.claimed = true; a5.claimedAt = "2026-08-01T12:00:00Z";
  for (const key of ["self", "time", "wealth"]) {
    a5.plans[key].week = `${key}: finish what I started.`;
    a5.plans[key].ninety = `${key}: build a calmer routine.`;
    a5.plans[key].ninetyBy = "2027-01-28";
  }
  const entries = Object.fromEntries(["self", "time", "wealth"].map(key =>
    [key, { kept: "yes", gotInWay: "NEVER DISPLAY THIS PRIVATE REFLECTION", supportHelped: null }]));
  a5.checkins = [{ week: "2026-11-02", date: "2026-11-08", at: "2026-11-08T12:00:00Z", entries }];
  a5.reset90 = { at: "2026-10-30T12:00:00Z", next: "2027-01-28", choices: { self: "keep", time: "grow", wealth: "keep" } };
  const creatures = [
    { animal: "Owl", animalEmoji: "🦉" }, { animal: "Bear", animalEmoji: "🐻" },
    { animal: "Lynx", animalEmoji: "" }, { animal: "Dolphin", animalEmoji: "🐬" },
    { animal: "Fox", animalEmoji: "🦊" },
  ].map((c, i) => ({ ...c, id: `fixture-${i}`, name: c.animal, nameWasEdited: false,
    descriptorWord1: "Steady", descriptorWord2: "Wise", giftIds: [] }));
  return {
    to_rc_state_v1: f.rc, to_mirror4_state_v1: { ...f.values, claimed: true },
    a1_ex2_done: true, a1_ex3_done: true, a1_ex4_done: true,
    to_map: { purpose_final: "Shine the light.", mirror3: { ...f.identity, clusters: creatures, sealCompleted: true },
      vision: { ...f.vision, complete: true } },
    to_a2_state_v1: a2, to_a3_state_v1: a3, to_a4_state_v1: a4, to_a5_state_v1: a5,
  };
}

async function main() {
  const { chromium } = require("playwright"), { load } = modules();
  const format = load("mirrorIllustrations/findings"), data = fixture();
  assert.equal(format.a2CardFindings(data.to_a2_state_v1, "")[0].answer, "", "No implicit alignment answer");
  assert.equal(format.a4CardFindings(data.to_a4_state_v1)[1].lead, "", "Do not double I will");
  assert.equal(format.a5CardFindings(data.to_a5_state_v1)[1].answer, "Nov 8");
  assert(!JSON.stringify(format.a5CardFindings(data.to_a5_state_v1)).includes("PRIVATE REFLECTION"));
  assert.equal(format.a3CardFindings(data.to_a3_state_v1)[0].answer, "Morgan", "Only saved advocates");
  const beforeFormatting = JSON.stringify(data);
  format.a2CardFindings(data.to_a2_state_v1, "Shine the light.");
  format.a3CardFindings(data.to_a3_state_v1);
  format.a4CardFindings(data.to_a4_state_v1); format.a5CardFindings(data.to_a5_state_v1);
  assert.equal(JSON.stringify(data), beforeFormatting, "Formatters are read-only");
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] });
  const writes = [], unexpected = [], errors = [], warnings = [], results = [];
  fs.mkdirSync(out, { recursive: true });
  try {
    await proveIsolation(browser);
    // Phone first, then desktop. Never use a real account.
    for (const width of [375, 1280]) for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width, height: width === 375 ? 812 : 800 },
        isMobile: width === 375, hasTouch: width === 375, serviceWorkers: "block" });
      await installIsolation(context, writes, unexpected);
      const page = await context.newPage(); page.setDefaultTimeout(12000);
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => { if (message.type() === "error") warnings.push(message.text()); });
      await page.addInitScript(({ data, theme }) => {
        if (sessionStorage.getItem("illustration-fixture")) return;
        sessionStorage.setItem("illustration-fixture", "1");
        for (const [key, value] of Object.entries(data)) localStorage.setItem(key, JSON.stringify(value));
        localStorage.setItem("na1_theme", theme); localStorage.setItem("to_road_phone_tip_seen_v1", "1");
        localStorage.setItem("to_app_route_v1", JSON.stringify({ view: "grid", overlay: null }));
      }, { data, theme });
      await page.goto(base + "/");
      async function jump(view) {
        await page.evaluate(view => localStorage.setItem("to_app_route_v1", JSON.stringify({ view, overlay: null })), view);
        await page.reload(); await page.locator("[data-illustration]").first().waitFor();
        await page.evaluate(() => document.fonts.ready);
      }
      const saved = () => page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(data));
      await page.locator("[data-illustration]").first().waitFor();
      const before = await saved();
      for (const [view, count] of [["grid", 4], ["a2", 3], ["a3", 6], ["a4", 3], ["a5", 3]]) {
        await jump(view);
        assert.equal(await page.locator("[data-illustration]").count(), count);
        assert.equal(await page.locator("[data-illustration] svg").count(), count);
        assert.equal(await page.locator("[data-illustration] img").count(), 0);
        assert.equal(await page.locator('[data-state="claimed"]').count(), count);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, `${view} ${width} ${theme}: no sideways overflow`);
        const bounds = await page.locator("[data-illustration]").evaluateAll(els => els.map(el => {
          const r = el.getBoundingClientRect(), card = el.parentElement;
          const heading = card.querySelector("h2").getBoundingClientRect();
          return { left: r.left, right: r.right, bottom: r.bottom, heading: heading.top, height: r.height,
            warm: getComputedStyle(el).getPropertyValue("--ill-warm").trim() };
        }));
        for (const box of bounds) {
          assert(box.left >= 0 && box.right <= width && box.bottom <= box.heading);
          assert.equal(box.warm, "#F3D99A");
          if (width === 375) assert.equal(box.height, 96);
        }
        if (view === "grid") {
          const crest = page.locator('[data-illustration="a1-identity"]');
          assert.deepEqual(await crest.locator("[data-creature-index] text").allTextContents(), ["🦉", "🐻", "L"]);
          assert.equal(await crest.getByText("+2", { exact: true }).count(), 1);
          assert.equal(await page.locator('[data-illustration="a1-purpose"]').evaluate(el => getComputedStyle(el).getPropertyValue("--ill-rays").trim()), "#A5875E");
        } else {
          assert.equal(await page.locator(".mi-grid .na1-mirror-card-status").getByText("★ CLAIMED", { exact: true }).count(), count);
          assert.equal(await page.locator(".mi-grid").getByText("Claimed.", { exact: true }).count(), 0);
          for (const button of await page.locator(".mi-grid article button").all()) assert.match(await button.textContent(), /^Revisit /);
          assert.equal(await page.locator(".mi-grid").getByText(/In A\d you found:/).count(), 0);
        }
        if (view === "a2") assert.equal(await page.locator('[data-finding="a2-alignment-check"]').textContent(), "The gap to close:Shine the light.");
        if (view === "a5") {
          assert.equal(await page.locator('[data-finding="a5-weekly-check-in"]').textContent(), "Last check-in:Nov 8");
          assert.equal(await page.locator(".mi-grid").getByText("NEVER DISPLAY THIS PRIVATE REFLECTION").count(), 0);
          assert.equal(await page.locator(".mi-grid article").nth(2).getByRole("button").count(), 0, "No invented A5 access");
        }
        if (width === 375) {
          assert.equal(await page.locator(".jr-phone-head-right").textContent(), "Road ▾");
          assert.equal(await page.locator(".jr-phone-segment").count(), 6);
          assert.equal(await page.locator(".jr-phone-segments").last().locator(":scope > :last-child").textContent(), "★");
        }
        await page.screenshot({ path: path.join(out, `${width}-${theme}-${view}.jpg`), fullPage: true });
        if (width === 375) {
          await page.locator("[data-illustration]").first().evaluate(el => el.scrollIntoView({ block: "start" }));
          await page.evaluate(() => window.scrollBy(0, -120));
        }
        await page.screenshot({ path: path.join(out, `${width}-${theme}-${view}-viewport.jpg`) });
        assert.deepEqual(await saved(), before, `No changed progress/answers on ${view}`);
        results.push({ width, theme, view, inlinePanels: count, fit: true });
      }
      // Explicit-answer absence, mixed states, and unchanged launch handlers.
      await page.evaluate(() => {
        const a2 = JSON.parse(localStorage.getItem("to_a2_state_v1")); a2.m1.bottleneck = null;
        a2.m2.claimed = false; a2.m3.claimed = false;
        localStorage.setItem("to_a2_state_v1", JSON.stringify(a2));
      });
      await jump("a2");
      assert.equal(await page.locator('[data-finding="a2-alignment-check"]').count(), 0);
      assert.deepEqual(await page.locator("[data-illustration]").evaluateAll(els => els.map(el => el.dataset.state)), ["claimed", "next", "later"]);
      assert.equal(await page.locator('[data-state="next"]').evaluate(el => getComputedStyle(el).getPropertyValue("--ill-warm").trim()), "none");
      assert.equal(await page.locator('[data-state="next"]').evaluate(el => getComputedStyle(el.parentElement).backgroundColor), "rgb(255, 255, 255)", "Readable current-card background in both themes");
      assert.equal(await page.getByRole("button", { name: "Begin Time Audit →", exact: true }).count(), 1);
      assert.equal(await page.locator(".mi-grid article").nth(2).getByRole("button").count(), 0);
      await page.screenshot({ path: path.join(out, `${width}-${theme}-mixed.jpg`), fullPage: true });
      await page.getByRole("button", { name: "Revisit Alignment Check", exact: true }).click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem("to_app_route_v1")).view !== "a2");
      await jump("a2");
      await page.getByRole("button", { name: "Begin Time Audit →", exact: true }).click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem("to_app_route_v1")).view !== "a2");
      // Before claim, Identity is the original plain face and Purpose has no rays.
      await page.evaluate(() => {
        const map = JSON.parse(localStorage.getItem("to_map")); map.mirror3.sealCompleted = false;
        localStorage.setItem("to_map", JSON.stringify(map)); localStorage.setItem("a1_ex4_done", "false");
      });
      await jump("grid");
      assert.equal(await page.locator('[data-illustration="a1-identity"] [data-creature-index]').count(), 0);
      assert.equal(await page.locator('[data-illustration="a1-purpose"]').evaluate(el => getComputedStyle(el).getPropertyValue("--ill-rays").trim()), "none");
      if (width === 375) {
        await page.locator(".jr-phone-bar").click(); await page.locator(".jr-sheet").waitFor();
        assert.equal(await page.locator("[data-phone-stage]").count(), 6);
      }
      await context.close();
      console.log("PASS", width, theme, "five hubs, 19 inline panels, fit, own words, unchanged data, mixed states, existing routes");
    }
    assert.deepEqual(errors, []); assert.deepEqual(warnings, []); assert.deepEqual(unexpected, []);
    fs.writeFileSync(path.join(out, "results.json"), JSON.stringify({ results, errors, warnings, unexpected,
      interceptedWrites: writes.length }, null, 2));
    console.log("ALL PASS", results.length, "hub screenshots; isolated writes:", writes.length);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
