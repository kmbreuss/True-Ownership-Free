// Fail-closed synthetic session; never authenticate a real account.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { installIsolation, proveIsolation } = require("./browser-isolation.cjs");
const priceOnly = process.argv.includes("--price-only");
const out = path.resolve(`generated-artifacts/rc-four-fixes${priceOnly ? "-price" : ""}`);
const base = process.env.J1_BASE_URL || "http://localhost:80";
const key = "to_rc_state_v1";

// Conservative contrast bounds: evaluate every ancestor gradient stop behind
// each text node, compositing transparent tile/button backgrounds and opacity.
function contrastAudit() {
  const parse = s => {
    const n = s.match(/[\d.]+/g)?.map(Number);
    if (!n || n.length < 3) throw Error(`Unsupported colour: ${s}`);
    return [n[0], n[1], n[2], n[3] ?? 1];
  };
  const over = (a, b) => [0, 1, 2].map(i => a[i] * a[3] + b[i] * (1 - a[3])).concat(1);
  const luminance = c => c.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
  const cache = new Map();
  function backgrounds(el) {
    if (!el) return [[255, 255, 255, 1]];
    if (cache.has(el)) return cache.get(el);
    const css = getComputedStyle(el);
    let result = backgrounds(el.parentElement).map(bg => over(parse(css.backgroundColor), bg));
    if (css.backgroundImage !== "none") {
      const stops = css.backgroundImage.match(/rgba?\([^)]+\)/g);
      if (!stops) throw Error(`Unsupported background: ${css.backgroundImage}`);
      result = result.flatMap(bg => stops.map(stop => over(parse(stop), bg)));
    }
    cache.set(el, result);
    return result;
  }
  const checks = [];
  function check(el, text, pseudo) {
    const css = getComputedStyle(el, pseudo || null), rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height || css.visibility === "hidden" || css.display === "none") return;
    if (el.closest(".rc-sr-only") || (el.tagName === "SPAN" && css.display === "none")) return;
    let opacity = pseudo ? Number(css.opacity) : 1;
    for (let p = el; p; p = p.parentElement) opacity *= Number(getComputedStyle(p).opacity);
    if (!opacity) return;
    const fg = parse(css.color); fg[3] *= opacity;
    const score = Math.min(...backgrounds(el).map(bg => ratio(over(fg, bg), bg)));
    checks.push({ text: text.slice(0, 75), tag: el.tagName, class: el.className, color: css.color, opacity, ratio: +score.toFixed(3) });
  }
  const room = document.querySelector(".rc-room");
  const walker = document.createTreeWalker(room, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) if (node.textContent.trim()) check(node.parentElement, node.textContent.trim());
  room.querySelectorAll("input,textarea").forEach(el => {
    if (el.value) check(el, el.value);
    if (el.placeholder) check(el, el.placeholder, "::placeholder");
  });
  return { minimum: Math.min(...checks.map(x => x.ratio)), failures: checks.filter(x => x.ratio < 4.5), checks };
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox"] });
  const results = [], errors = [], writes = [], unexpected = [];
  let captures = 0, contrastAudits = 0, priceChecks = 0;
  let context;
  try {
    await proveIsolation(browser);
    context = await browser.newContext({ serviceWorkers: "block" });
    await installIsolation(context, writes, unexpected);
    await context.exposeBinding("rcCaptureWindowError", (_, message) => errors.push(message));
    await context.addInitScript(() => {
      window.addEventListener("error", e => {
        void window.rcCaptureWindowError(e.message || String(e.error)).catch(() => {});
      });
      window.addEventListener("unhandledrejection", e => {
        void window.rcCaptureWindowError(String(e.reason)).catch(() => {});
      });
      // Init scripts also run in blank/sandboxed frames, which may deny storage.
      // Initialize only the top-level app document; do not suppress its errors.
      if (window !== window.top || !["http:", "https:"].includes(location.protocol)) return;
      if (!sessionStorage.getItem("rc-four-init")) {
        sessionStorage.setItem("rc-four-init", "1");
        localStorage.setItem("to_app_route_v1", JSON.stringify({ view: "rcroom", overlay: null }));
      }
    });
    const page = await context.newPage();
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(`${base}/?newRC=1&phase=a1`);
    await page.locator(".rc-room").waitFor();
    const seed = await page.evaluate(async () => {
      const m = await import("/src/rcConstants.ts");
      return { ...m.normalizeRC(null), startedAt: "2026-10-31T12:00:00.000Z",
        mirror: m.RC_MIRROR.map(x => x.id), focus: "wealth", focusChosenBy: "tie-picked",
        maxReached: 13, complete: true, completedAt: "2026-10-31T13:00:00.000Z", choice: "B", willing: "yes",
        tuesday: "I'm still fixing everyone else's problems.",
        cost: { monthly: 1235, hoursPerWeek: 12, moneyWhere: "Paying for everyone but me",
          hoursWhere: "Worrying about money and fixing problems", you: "My patience. My confidence. My sleep.", whoElse: "Hidden preserved answer" },
        compound: { feels: ["Heavier", "My own feeling"], results: "I keep missing what matters", whoElse: "Hidden compound answer" } };
    });
    const render = async (step, theme, size) => {
      await page.setViewportSize(size);
      await page.evaluate(({ seed, step, theme, key }) => {
        localStorage.setItem(key, JSON.stringify({ ...seed, step }));
        localStorage.setItem("na1_theme", theme);
      }, { seed, step, theme, key });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.locator(`.rc-room[data-step="${step}"]`).waitFor();
      await page.evaluate(async () => { await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); });
    };
    for (const size of [{ width: 1366, height: 680 }, { width: 1280, height: 800 }, { width: 375, height: 812 }]) {
      for (const theme of ["light", "dark"]) {
        for (const step of priceOnly ? [4] : [4, 5, 6, 7, 12]) {
          await render(step, theme, size);
          const label = `${size.width}-${theme}-${step}`;
          if (step >= 5 && step <= 7) {
            const audit = await page.evaluate(contrastAudit);
            contrastAudits++;
            results.push({ label, contrast: audit });
            fs.writeFileSync(path.join(out, "progress.json"), JSON.stringify(results, null, 2));
            assert.deepEqual(audit.failures, [], `${label} contrast below 4.5:1`);
            if (step === 6) assert.deepEqual(await page.locator(".rc-room .rc-eyebrow").evaluate(el => ({ color: getComputedStyle(el).color, opacity: getComputedStyle(el).opacity })),
              { color: "rgb(233, 201, 201)", opacity: "1" });
            if (step === 7) {
              for (const selector of [".rc-future-tile strong", ".rc-feelings>label", ".rc-scene>label", ".rc-scene>label textarea"])
                for (const el of await page.locator(selector).all()) assert.equal(await el.evaluate(e => getComputedStyle(e).color), "rgb(249, 246, 238)");
              for (const el of await page.locator(".rc-future-tile h3").all()) assert.equal(await el.evaluate(e => getComputedStyle(e).color), "rgb(233, 201, 201)");
            }
          }
          if (step === 4) {
            priceChecks++;
            // Exercise loaded and edited answers, two lines and overflow beyond
            // the cap, then leave exactly two visible lines for the fit check.
            const fields = page.locator(".rc-where-answer");
            await assert.equal(await fields.count(), 3);
            for (const field of await fields.all()) {
              await field.fill("Short");
              const oneLine = await field.evaluate(e => e.getBoundingClientRect().height);
              await field.fill("My longer answer\ncontinues here");
              const twoLines = await field.evaluate(e => e.getBoundingClientRect().height);
              assert(twoLines > oneLine, `${label} answer must grow`);
              const geometry = await field.evaluate(e => {
                const c = getComputedStyle(e);
                const line = parseFloat(c.lineHeight);
                const padding = parseFloat(c.paddingTop) + parseFloat(c.paddingBottom);
                const borders = parseFloat(c.borderTopWidth) + parseFloat(c.borderBottomWidth);
                return { padding: [c.paddingTop, c.paddingRight, c.paddingBottom, c.paddingLeft],
                  line, resize: c.resize, overflowX: c.overflowX, overflowY: c.overflowY,
                  max: parseFloat(c.maxHeight), expectedMax: 2 * line + padding,
                  content: e.getBoundingClientRect().height - padding - borders };
              });
              assert.deepEqual(geometry.padding, ["4px", "2px", "6px", "2px"]);
              assert(Math.abs(geometry.line - 19 * 1.35) < .001);
              assert.equal(geometry.resize, "none");
              assert.equal(geometry.overflowX, "hidden"); assert.equal(geometry.overflowY, "hidden");
              assert(Math.abs(geometry.max - geometry.expectedMax) < .02);
              assert(Math.abs(geometry.content - 2 * geometry.line) < .02, `${label} must show two complete line boxes: ${JSON.stringify(geometry)}`);
              results.push({ label: `${label}-field-lines`, geometry });
              await field.fill("First line\nSecond line\nThird line stays saved and editable");
              assert.equal(await field.evaluate(e => e.getBoundingClientRect().height), twoLines);
              assert.equal(await field.evaluate(e => e.value), "First line\nSecond line\nThird line stays saved and editable");
              await field.fill("Helping everyone else with bills and missed payments while leaving my own plans waiting.");
              assert.equal(await field.evaluate(e => getComputedStyle(e).fontSize), "19px");
            }
            const fit = await page.evaluate(() => {
              const body = document.querySelector(".rc-body"), scene = document.querySelector(".rc-price");
              const b = body.getBoundingClientRect(), s = scene.getBoundingClientRect(), f = document.querySelector(".rc-footer").getBoundingClientRect();
              const tiles = [...document.querySelectorAll(".rc-price-tile")].map(el => { const r = el.getBoundingClientRect(); return { top: r.top, left: r.left, right: r.right }; });
              return { bodyOverflow: Math.max(0, body.scrollHeight - body.clientHeight), above: Math.max(0, b.top - s.top),
                footerOverlap: Math.max(0, s.bottom - f.top), horizontal: Math.max(0, document.documentElement.scrollWidth - innerWidth),
                footerVisible: f.bottom <= innerHeight, tiles };
            });
            results.push({ label, fit });
            fs.writeFileSync(path.join(out, "progress.json"), JSON.stringify(results, null, 2));
            assert(fit.bodyOverflow <= 1 && fit.above <= 1 && fit.footerOverlap <= 1 && fit.horizontal <= 1 && fit.footerVisible, `${label} price must fit: ${JSON.stringify(fit)}`);
            if (size.width === 375) {
              assert(Math.abs(fit.tiles[0].top - fit.tiles[1].top) < 1);
              assert(fit.tiles[2].top > fit.tiles[1].top && fit.tiles[2].left === fit.tiles[0].left);
            }
            const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
            await page.reload(); await page.locator(".rc-where-answer").first().waitFor();
            assert.equal(await fields.first().inputValue(), before.cost.moneyWhere);
            assert.equal(await fields.nth(1).inputValue(), before.cost.hoursWhere);
            assert.equal(await page.getByRole("textbox", { name: "What is it costing you?", exact: true }).inputValue(), before.cost.you);
            const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
            assert.equal(after.complete, true); assert.equal(after.choice, "B"); assert.equal(after.cost.whoElse, seed.cost.whoElse);
          }
          if (step === 12) {
            const text = await page.locator(".rc-full-reflection").innerText();
            assert.match(text, /624 hours, my patience, my confidence and my sleep\./);
            assert.doesNotMatch(text, /\.\./);
            assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).cost.you, key), seed.cost.you);
          }
          await page.screenshot({ path: path.join(out, `${label}.png`) });
          captures++;
        }
      }
    }
    assert.deepEqual(errors, []); assert.deepEqual(unexpected, []);
    assert.equal((await context.cookies()).length, 0);
    fs.writeFileSync(path.join(out, "results.json"), JSON.stringify({ results, errors, writesIntercepted: writes.length }, null, 2));
    console.log(`PASS: ${captures} scene captures, ${contrastAudits} dark-scene contrast audits, ${priceChecks} price fit/edit/refresh checks; ${writes.length} writes intercepted, zero real-account writes.`);
  } finally { await context?.close(); await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
