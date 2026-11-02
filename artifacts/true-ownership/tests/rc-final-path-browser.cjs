// Synthetic auth only; prove fail-closed write interception before navigation.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require("playwright");
const { fixtures } = require("./a1-fixtures.cjs");
const { proveIsolation, installIsolation } = require("./browser-isolation.cjs");
const out = "generated-artifacts/rc-final-path";
const expected = [
  ["Know who you are.", "No more second-guessing. Every yes and no gets easier."],
  ["See where your time and money really go.", "The hours and dollars start coming back to what matters."],
  ["Surround yourself with what lifts you.", "The people, places and thoughts around you pull you forward, not back."],
  ["Know your next move.", "One clear step at a time. The overwhelm goes quiet."],
  ["Trust yourself again.", "You do what you said you’d do. And you start to believe you can."],
];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] });
  const results = [], writes = [], unexpected = [], errors = [];
  fs.mkdirSync(out, { recursive: true });
  try {
    await proveIsolation(browser);
    for (const [width, height] of [[375, 812], [1280, 800], [1366, 680]]) for (const theme of ["light", "dark"]) {
      if (process.env.RC_PATH_CASE && !new RegExp(process.env.RC_PATH_CASE).test(`${width}x${height}-${theme}`)) continue;
      const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: "block" });
      await installIsolation(context, writes, unexpected);
      const state = { ...fixtures().rc, step: 13, willing: "yes", cost: {
        monthly: 115, hoursPerWeek: 10, moneyWhere: "Helping others", hoursWhere: "Fixing problems", you: "My patience",
      }, futureB5: { feels: ["Calm"], tuesday: "I have time to think and enough left for myself." } };
      await context.addInitScript(({ state, theme }) => {
        if (sessionStorage.getItem("rc-path-fixture")) return;
        sessionStorage.setItem("rc-path-fixture", "1");
        localStorage.setItem("to_rc_state_v1", JSON.stringify(state));
        localStorage.setItem("to_app_route_v1", JSON.stringify({ view: "rcroom", overlay: null }));
        localStorage.setItem("na1_theme", theme);
      }, { state, theme });
      const page = await context.newPage();
      page.on("pageerror", e => errors.push(e.message));
      await page.goto(process.env.J1_BASE_URL || "http://localhost:80/");
      const wait = async () => {
        await page.locator('.rc-room[data-step="13"] .rc-path-final').waitFor();
        await page.evaluate(() => document.fonts.ready);
      };
      await wait();
      assert.equal(await page.locator(".rc-path-final h2").textContent(), "Willpower won’t get you there. This will.");
      assert.deepEqual(await page.locator(".rc-path-rows li").evaluateAll(rows =>
        rows.map(row => [row.querySelector("h3").textContent, row.querySelector("p").textContent])), expected);
      const typography = await page.locator(".rc-path-rows li").evaluateAll(rows => rows.map(row => {
        const title = getComputedStyle(row.querySelector("h3")), result = getComputedStyle(row.querySelector("p"));
        return [title.fontSize, title.fontFamily, result.fontSize, result.fontStyle, result.color];
      }));
      assert(typography.every(v => v[0] === "17px" && /Tenor/.test(v[1]) && v[2] === "17px" && v[3] === "italic" && v[4] === "rgb(115, 95, 67)"));
      assert.deepEqual(await page.locator(".rc-path-number").evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundColor)),
        ["rgb(2, 72, 69)", "rgb(2, 72, 69)", "rgb(2, 72, 69)", "rgb(2, 72, 69)", "rgb(165, 135, 94)"]);
      assert.equal(await page.locator(".rc-path-waiting p").textContent(),
        "About 10 hours a week and $115 a month back. And a Tuesday where “I have time to think and enough left for myself.”");
      const geometry = await page.evaluate(() => {
        const body = document.querySelector(".rc-body"), footer = document.querySelector(".rc-footer");
        const f = footer.getBoundingClientRect(), b = body.getBoundingClientRect();
        return { scroll: body.scrollHeight - body.clientHeight, sideways: document.documentElement.scrollWidth - innerWidth,
          footerVisible: f.top >= 0 && f.bottom <= innerHeight && b.bottom <= f.top + 1 };
      });
      assert(geometry.sideways <= 1 && geometry.footerVisible, JSON.stringify(geometry));
      if (width >= 1280) assert(geometry.scroll <= 1, JSON.stringify(geometry));
      await page.screenshot({ path: `${out}/${width}x${height}-${theme}.png` });
      await page.locator(".rc-header-back").click();
      await page.locator('.rc-room[data-step="12"]').waitFor();
      await page.getByRole("button", { name: "What will get me there →", exact: true }).click();
      await wait();
      await page.getByRole("button", { name: "Two futures, 4 of 5", exact: true }).click();
      await page.locator('.rc-room[data-step="5"]').waitFor();
      await page.getByRole("button", { name: "Choose, 5 of 5", exact: true }).click();
      await page.locator('.rc-room[data-step="10"]').waitFor();
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("to_rc_state_v1")));
      assert(saved.complete && saved.choice === "B" && saved.willing === "yes");
      assert.equal(saved.futureB5.tuesday, state.futureB5.tuesday);
      await page.evaluate(() => {
        const state = JSON.parse(localStorage.getItem("to_rc_state_v1"));
        localStorage.setItem("to_rc_state_v1", JSON.stringify({ ...state, step: 13 }));
      });
      await page.reload(); await wait();
      // Every combination of missing answers; zero remains a legitimate answer.
      if (width === 1366 && theme === "light") {
        for (let mask = 0; mask < 8; mask++) {
          await page.evaluate(({ mask, state }) => {
            state.cost.hoursPerWeek = mask & 1 ? 10 : null;
            state.cost.monthly = mask & 2 ? 115 : null;
            state.futureB5.tuesday = mask & 4 ? "My Tuesday." : "";
            localStorage.setItem("to_rc_state_v1", JSON.stringify(state));
          }, { mask, state });
          await page.reload(); await wait();
          assert.equal(await page.locator(".rc-path-waiting").count(), mask ? 1 : 0);
          if (mask) {
            const parts = [mask & 1 ? "10 hours a week" : "", mask & 2 ? "$115 a month" : ""].filter(Boolean);
            assert.equal(await page.locator(".rc-path-waiting p").textContent(),
              (parts.length ? `About ${parts.join(" and ")} back.` : "") +
              (mask & 4 ? `${parts.length ? " And a Tuesday where " : "A Tuesday where "}“My Tuesday.”` : ""));
          }
        }
        await page.evaluate(state => {
          state.cost.hoursPerWeek = 0; state.cost.monthly = 0;
          localStorage.setItem("to_rc_state_v1", JSON.stringify(state));
        }, state);
        await page.reload(); await wait();
        assert.match(await page.locator(".rc-path-waiting p").textContent(), /0 hours a week and \$0 a month/);
      }
      await page.getByRole("button", { name: "Start my path →", exact: true }).click();
      await page.locator(".na1-mirror-grid").waitFor();
      results.push({ width, height, theme, ...geometry, back: true, chapters: true, destination: "A1", pass: true });
      console.log(JSON.stringify(results.at(-1)));
      await context.close();
    }
    assert.deepEqual(unexpected, []); assert.deepEqual(errors, []);
    assert(writes.length > 0, "Normal-mode writes must have been intercepted");
  } finally {
    fs.writeFileSync(`${out}/${process.env.RC_PATH_CASE ? "focused-results" : "results"}.json`, JSON.stringify({ results, interceptedWrites: writes.length, unexpected, errors }, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
