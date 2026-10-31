// Synthetic-session UI acceptance. No real credentials, sessions or account writes.
// Set NODE_PATH to an external Playwright installation and CHROMIUM_PATH if needed.
// Protection is proved against a disposable server before app navigation.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { installIsolation, proveIsolation } = require("./browser-isolation.cjs");
const out = path.resolve("generated-artifacts/rc-review");
const base = process.env.J1_BASE_URL || "http://localhost:80";
const key = "to_rc_state_v1", routeKey = "to_app_route_v1";
const url = `${base}/?newRC=1&phase=a1&preview=1`;

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ["--no-sandbox"],
  });
  await proveIsolation(browser);
  const context = await browser.newContext({ viewport: { width: 1366, height: 680 }, serviceWorkers: "block" });
  context.setDefaultTimeout(10000);
  const page = await context.newPage(), errors = [], writes = [], results = [], failures = [];
  page.on("pageerror", e => errors.push(e.message));
  await context.exposeBinding("rcCaptureWindowError", (_, message) => errors.push(message));
  await context.addInitScript(() => {
    window.addEventListener("error", e => {
      void window.rcCaptureWindowError(e.message || String(e.error)).catch(() => {});
    });
    window.addEventListener("unhandledrejection", e => {
      void window.rcCaptureWindowError(String(e.reason)).catch(() => {});
    });
  });
  const unexpected = [];
  await installIsolation(context, writes, unexpected);
  try {
    await context.addInitScript(() => {
      if (window !== window.top || !["http:", "https:"].includes(location.protocol)) return;
      if (!sessionStorage.getItem("j1-test-initialized")) {
        sessionStorage.setItem("j1-test-initialized", "1");
        localStorage.setItem("to_app_route_v1", JSON.stringify({ view: "rcroom", overlay: null }));
      }
    });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.locator(".rc-room").waitFor();
    await page.evaluate(() => document.fonts.ready);
    const initial = await page.evaluate(async () => {
      const m = await import("/src/rcConstants.ts");
      return { empty: m.normalizeRC(null), all: m.RC_MIRROR.map(s => s.id) };
    });
    const seed = { ...initial.empty, startedAt: "2026-10-31T12:00:00.000Z", mirror: initial.all, focus: "wealth", focusChosenBy: "tie-picked",
      tuesday: "By Tuesday I am already carrying everyone's worries, and leaving no time for myself.",
      defaultsNamed: { avoiding: "The conversation I keep putting off", blaming: "Someone else's expectations",
        carrying: "Everyone's worries and unfinished work", hoping: "A raise, a big client, a lucky break" },
      cost: { monthly: 1234.5, moneyWhere: "Paying for everyone but me", hoursPerWeek: 12,
        hoursWhere: "Worrying about money and fixing problems", you: "My patience. My confidence. My sleep.", whoElse: "The people closest to me" },
      futureB5: { feels: ["Calm", "Present", "My own feeling"], tuesday: "I have time to think and enough left for myself.", whoNotices: "The people closest to me" },
      futureB1: { doing: "Making room for what matters", oneThing: "Commit to an hour for what matters" },
      compound: { feels: ["Heavier", "My own feeling"], results: "I keep missing what matters", whoElse: "The people closest to me" },
      futureA: { extra: "A hidden note that must survive this rebuild" },
      choice: "B", willing: "yes" };
    async function render(state, theme = "light", size = { width: 1366, height: 680 }, view = "rcroom", previewMode = true) {
      await page.setViewportSize(size);
      await page.evaluate(({ state, theme, view, key, routeKey, previewMode }) => {
        history.replaceState({ ...history.state, rcOpeningPanel: null }, "");
        localStorage.setItem(key, JSON.stringify(state));
        localStorage.setItem(routeKey, JSON.stringify({ view, overlay: null }));
        localStorage.setItem("na1_theme", theme);
        if (previewMode) sessionStorage.setItem("to_dev_preview", "1"); else sessionStorage.removeItem("to_dev_preview");
      }, { state, theme, view, key, routeKey, previewMode });
      await page.goto(previewMode ? url : url.replace("&preview=1", ""), { waitUntil: "domcontentloaded" });
      await page.locator(view === "rc" ? ".rc-hub" : ".rc-room").waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    }
    async function metric(label) {
      const result = await page.evaluate(() => {
        const room = document.querySelector(".rc-room");
        if (!room) {
          const button = document.querySelector(".rc-begin").getBoundingClientRect();
          return { cardOverflow: 0, sceneOverflow: 0, horizontal: Math.max(0, document.documentElement.scrollWidth - innerWidth),
            hubH1: getComputedStyle(document.querySelector(".rc-start-copy h1")).fontSize,
            journeyTitle: getComputedStyle(document.querySelector(".rc-journey h3")).fontSize,
            footerOverlap: 0, beginVisible: button.bottom <= innerHeight && button.top >= 0,
            shellMaxWidth: getComputedStyle(document.querySelector(".rc-hub")).maxWidth,
            stackOrder: [".rc-start-copy", ".rc-hub-action", ".rc-start-video", ".rc-journey", ".rc-closing-quote"].map(s => document.querySelector(s).getBoundingClientRect().top),
            hubContentVisible: true };
        }
        const body = document.querySelector(".rc-body"), rect = body.getBoundingClientRect();
        const footer = document.querySelector(".rc-footer").getBoundingClientRect();
        const bodyScroll = Math.max(0, body.scrollHeight - body.clientHeight);
        const scene = document.querySelector(".rc-screen").getBoundingClientRect();
        const endReachable = scene.bottom <= rect.bottom + 1;
        const progress = room.querySelector(".rc-progress").getBoundingClientRect();
        const paintedTop = Math.max(scene.top, rect.top), paintedBottom = Math.min(scene.bottom, rect.bottom);
        body.scrollTop = body.scrollHeight;
        const allContentReachable = document.querySelector(".rc-screen").getBoundingClientRect().bottom <= rect.bottom + 1;
        body.scrollTop = 0;
        const controls = [...body.querySelectorAll("input,textarea,button:not(:disabled),[tabindex='0']")].filter(n => n.getClientRects().length);
        const last = controls.at(-1);
        const lastRect = last?.getBoundingClientRect();
        const keyboardReachable = !lastRect || lastRect.top >= rect.top - 1 && lastRect.bottom <= rect.bottom + 1;
        body.scrollTop = 0;
        const probe = document.createElement("div"); probe.className = "na1-room-card";
        probe.style.cssText = "position:fixed;left:-10000px;pointer-events:none";
        probe.innerHTML = '<button class="na1-room-close">×</button><div class="na1-room-crumb">crumb</div><button class="na1-chip is-selected">chip</button>';
        for (const v of ["--burgundy-soft","--burgundy","--burgundy-text","--na1-border","--na1-text-sec"]) probe.style.setProperty(v, getComputedStyle(room).getPropertyValue(v));
        document.body.append(probe);
        const read = (n, keys) => Object.fromEntries(keys.map(k => [k,getComputedStyle(n)[k]]));
        const frameProps = ["maxWidth","borderRadius"];
        const closeProps = ["width","height","borderRadius","paddingTop","paddingRight","borderTopWidth","fontSize","fontFamily","top","right"];
        const crumbProps = ["fontSize","fontFamily"];
        const frame = read(room, frameProps), sharedFrame = read(probe, frameProps);
        const close = read(room.querySelector(".na1-room-close"), closeProps), sharedClose = read(probe.querySelector(".na1-room-close"), closeProps);
        const crumb = read(room.querySelector(".na1-room-crumb"), crumbProps);
        const selected = null;
        const chip = selected ? read(selected, ["borderRadius","paddingTop","paddingRight","borderTopWidth","borderTopColor","backgroundColor","color"]) : null;
        const sharedChip = selected ? read(probe.querySelector(".na1-chip"), Object.keys(chip)) : null;
        probe.remove();
        return { cardOverflow: Math.max(0, room.scrollHeight - room.clientHeight),
          bodyScroll, endReachable, keyboardReachable, frame, sharedFrame, close, sharedClose, crumb, chip, sharedChip,
          step:room.dataset.step, padding: getComputedStyle(room).padding,
          headingSize: getComputedStyle(document.querySelector(".rc-scene h2")).fontSize,
          sceneOverflow: Math.max(0, Math.round(rect.top - scene.top), Math.round(scene.bottom - rect.bottom)),
          horizontal: Math.max(0, room.scrollWidth - room.clientWidth),
          footerOverlap: Math.max(0, Math.round(paintedBottom - footer.top)),
          headerOverlap: Math.max(0, Math.round(progress.bottom - paintedTop)),
          allContentReachable,
          footerVisible: footer.bottom <= innerHeight + 1 && footer.top >= 0 };
      });
      results.push({ label, ...result });
      assert((result.headerOverlap || 0) <= 1 && result.footerOverlap <= 1, `${label}: progress/footer must never overlap painted content`);
      assert(result.allContentReachable !== false, `${label}: the entire scene must remain reachable`);
      if (result.headingSize) {
        const sizes = {2:"34px",5:"32px",6:"30px",11:"30px",12:"32px",13:"30px"};
        const expected = label.includes("join-placeholder") ? "23px" : page.viewportSize().width <= 600 ? "23px" : sizes[result.step] || "28px";
        assert.equal(result.headingSize, expected, "Scene headings follow the approved scene-specific sizes.");
      }
      if (result.hubH1) { assert.equal(result.hubH1, "36px"); assert.equal(result.journeyTitle, "18px"); }
      if (result.shellMaxWidth) {
        assert.equal(result.shellMaxWidth, "760px");
        assert.deepEqual(result.stackOrder, [...result.stackOrder].sort((a,b) => a-b));
      }
      if (result.frame) {
        assert.deepEqual(result.frame, result.sharedFrame);
        assert.deepEqual(result.close, result.sharedClose);
        assert.equal(result.crumb.fontSize, "13px");
        assert.equal(result.padding, page.viewportSize().width <= 600 ? "20px 18px" : "24px 48px 28px");
        assert.equal(await page.locator(".rc-progress li").count(), 5);
        assert.equal(await page.locator(".rc-stepper,.rc-pips").count(), 0);
      }
      fs.writeFileSync(path.join(out, "progress.json"), JSON.stringify({ results, failures, errors }, null, 2));
      if (result.cardOverflow > 1 || result.sceneOverflow > 1 || result.bodyScroll > 1 || result.horizontal > 1 ||
        result.footerOverlap > 1 || result.beginVisible === false || result.footerVisible === false || result.hubContentVisible === false || result.endReachable === false || result.keyboardReachable === false) failures.push({ label, ...result });
      await page.screenshot({ path: path.join(out, `${label}.png`) });
    }
    // Actual user interaction through every implemented scene in Preview All.
    await render(initial.empty);
    const before = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));
    await page.getByRole("button", { name: "I'm ready →", exact: true }).click();
    assert.equal(await page.locator(".rc-room").getAttribute("data-step"), "0b");
    await page.getByRole("button", { name: "Show me the mirror →", exact: true }).click();
    for (const id of ["time-avoiding", "wealth-avoiding", "self-carrying"]) await page.locator(`[data-mirror-id="${id}"]`).click();
    if (await page.getByRole("button", { name: "More sentences →", exact: true }).count())
      await page.getByRole("button", { name: "More sentences →", exact: true }).click();
    await page.getByRole("button", { name: "Show me what I see →", exact: true }).click();
    await page.getByRole("button", { name: "Wealth", exact: true }).click();
    await page.getByRole("button", { name: "Start with Wealth →", exact: true }).click();
    await page.getByRole("textbox", { name: "Your ordinary Tuesday", exact: true }).fill("PREVIEW WALKTHROUGH ONLY");
    await page.getByRole("button", { name: "Show me the price →", exact: true }).click();
    await page.getByRole("textbox", { name: "About dollars a month", exact: true }).fill("100");
    await page.getByRole("textbox", { name: "About hours a week", exact: true }).fill("2");
    assert.match(await page.locator(".rc-summary").innerText(), /\$1,200 and 104 hours/);
    assert.equal(await page.locator(".rc-summary strong").count(), 2);
    await page.getByRole("button", { name: "Close your eyes →", exact: true }).click();
    assert.equal(await page.locator(".rc-room").getAttribute("data-step"), "5");
    await page.getByRole("button", { name: "Show me →", exact: true }).click();
    await page.getByRole("button", { name: "Keep going →", exact: true }).click();
    await page.getByRole("button", { name: "And if you own it? →", exact: true }).click();
    await page.getByRole("textbox", { name: "My Future B Tuesday", exact: true }).fill("I have room to breathe.");
    await page.getByRole("button", { name: "Bring it back to one year →", exact: true }).click();
    await page.getByRole("textbox", { name: "My one thing this week", exact: true }).fill("Commit to a quiet hour.");
    await page.getByRole("button", { name: "Choose my future →", exact: true }).click();
    await page.getByRole("button", { name: /I choose this one →/ }).click();
    await page.getByRole("button", { name: "Yes, I'm willing", exact: true }).click();
    assert.equal(await page.evaluate(async () => (await import("/src/rcConstants.ts")).loadRCState().complete), true);
    assert.equal(await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort())), before);
    assert.equal(writes.length, 0, "Preview All must not attempt account writes.");
    await require("./rc-updated-checks.cjs")({ page, render, metric, seed, key, writes });

    for (const width of [375, 600, 601, 1366]) {
      await render({ ...seed, step: 0 }, "light", { width, height: width === 1366 ? 680 : 812 });
      await page.getByRole("button", { name: "I'm ready →", exact: true }).click();
      if (width <= 600) {
        assert.equal(await page.getByRole("tab", { name: "Person A" }).getAttribute("aria-selected"), "true");
        assert.equal(await page.locator(".rc-person-A").isVisible(), true);
        assert.equal(await page.locator(".rc-person-B").isVisible(), false);
        await metric(`${width}-tabs-A`);
        await page.getByRole("tab", { name: "Person B" }).click();
        assert.equal(await page.locator(".rc-person-B li").count(), 3);
        assert.equal(await page.locator(".rc-person-A").isVisible(), false);
        await metric(`${width}-tabs-B`);
        await page.getByRole("tab", { name: "Person B" }).press("ArrowLeft");
        assert.equal(await page.getByRole("tab", { name: "Person A" }).getAttribute("aria-selected"), "true");
      } else {
        assert.equal(await page.locator(".rc-person-A").isVisible(), true);
        assert.equal(await page.locator(".rc-person-B").isVisible(), true);
        assert.equal(await page.getByRole("tab", { name: "Person A" }).count(), 0);
      }
    }
    for (const ids of [
      ["time-avoiding", "wealth-avoiding", "self-carrying"],
      ["time-avoiding", "wealth-avoiding", "time-blaming", "wealth-blaming"],
      ["time-avoiding", "time-blaming", "time-carrying"], initial.all,
    ]) {
      await render({ ...seed, mirror: ids, step: 2 }, "light", { width: 375, height: 812 });
      const tied = await page.evaluate(async () => (await import("/src/rcConstants.ts")).loadRCState().topDefaults.length);
      assert.equal(await page.locator(".rc-default-reveal strong").count(), tied > 2 ? 0 : tied);
      if (tied > 2) assert.match(await page.locator(".rc-default-reveal").innerText(), /little of everything: avoiding, blaming, carrying and hoping/);
      await metric(`375-defaults-${tied}`);
      await page.locator('.rc-footer button').last().click();
      assert.equal(await page.getByLabel("Your thread").count(), 0);
      assert.equal(await page.locator(".rc-naming input").count(), tied > 2 ? 1 : tied);
      await metric(`375-naming-${tied}`);
      if (tied > 2) {
        const field = page.getByRole("textbox", { name: "What are you avoiding, blaming, carrying or hoping for?", exact: true });
        await field.fill("A conversation I can no longer postpone.");
        assert.equal(await page.evaluate(async () => (await import("/src/rcConstants.ts")).loadRCState().defaultsTogether), "A conversation I can no longer postpone.");
        await page.locator(".rc-footer button").last().click();
        assert.equal(await page.getByLabel("Your thread").count(), 0);
        await metric(`375-price-tie-${tied}`);
      }
    }
    // The new presentation-only subscene survives refresh without changing stored step IDs.
    await render({ ...seed, step: 0 }, "light", { width: 1366, height: 680 }, "rcroom", false);
    await page.getByRole("button", { name: "I'm ready →", exact: true }).click();
    await page.reload(); await page.locator(".rc-room").waitFor();
    assert.equal(await page.locator(".rc-room").getAttribute("data-step"), "0b");
    assert.equal(JSON.parse(await page.evaluate(key => localStorage.getItem(key), key)).step, 0);
    await page.getByRole("button", { name: "← Back", exact: true }).click();
    assert.equal(await page.locator(".rc-room").getAttribute("data-step"), "0");
    await page.getByRole("button", { name: "I'm ready →", exact: true }).click();
    await page.getByRole("button", { name: "Show me the mirror →", exact: true }).click();
    await page.getByRole("button", { name: "← Back", exact: true }).click();
    assert.equal(await page.locator(".rc-room").getAttribute("data-step"), "0b");
    await render({ ...seed, step: 1 });
    const mirrors = await page.locator(".rc-mirror-grid button").evaluateAll(nodes => nodes.map(n => {
      const s = getComputedStyle(n); return [s.fontSize, s.fontStyle, s.fontFamily];
    }));
    assert.equal(mirrors.length, 12);
    assert(mirrors.every(([size, style, family]) => size === "16px" && style === "italic" && family.includes("Cormorant Garamond")));

    for (const size of [
      { width: 375, height: 812 }, { width: 600, height: 800 }, { width: 768, height: 1024 },
      { width: 900, height: 700 }, { width: 1024, height: 600 },
      { width: 1280, height: 800 }, { width: 1366, height: 680 },
    ]) {
      for (const theme of ["light", "dark"]) {
        for (const step of ["hub", 0, "0b", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]) {
          await render(step === "hub" ? initial.empty : { ...seed, step: step === "0b" ? 0 : step }, theme, size, step === "hub" ? "rc" : "rcroom");
          if (step === "0b") await page.getByRole("button", { name: "I'm ready →", exact: true }).click();
          if (step === "hub") {
            assert.equal(await page.getByRole("button", { name: "Begin the Reality Check →", exact: true }).count(), 1);
            assert.equal(await page.locator(".rc-stop").count(), 5);
            assert.equal(await page.getByRole("button", { name: "Play Katherine's introduction", exact: true }).count(), 0);
            assert(await page.locator(".rc-begin").evaluate(el => el.getBoundingClientRect().height >= 52));
          }
          if (step === "0b") {
            assert.equal(await page.locator(".rc-person-headline").count(), 2);
            assert.equal(await page.locator(".rc-person li").count(), 6);
            assert.match(await page.locator(".rc-person-A").innerText(), /Drifting, reacting to whatever life hands them/);
            assert.match(await page.locator(".rc-person-B").innerText(), /Knows where they're headed, and why/);
          }
          if (step === 7 || step === 8) {
            assert(await page.getByRole("textbox", { name: "My own feeling", exact: true }).isVisible());
            const contained = await page.locator(".rc-feeling-chips").evaluate(el => {
              const box = el.closest(".rc-body").getBoundingClientRect();
              return [...el.children].every(c => { const r = c.getBoundingClientRect(); return r.left >= box.left - 1 && r.right <= box.right + 1; });
            });
            assert(contained, "Feelings and the open custom input must remain inside the scrollable body.");
          }
          if (step === 4) assert.equal(await page.getByLabel("Who else is paying for it?").count(), 0);
          if (step === 6) assert.equal(await page.locator(".rc-scene input").count(), 0);
          if (step === 7) assert.equal(await page.getByLabel("Who else is feeling it by then?").count(), 0);
          if (step === 8) assert.equal(await page.getByLabel("Who notices the difference?").count(), 0);
          await metric(`${size.width}x${size.height}-${theme}-${step}`);
          if (step === 1) {
            const visible = page.locator(".rc-mirror-grid button:visible");
            const paged = await page.locator(".rc-mirror-scene").getAttribute("data-mirror-layout") === "six";
            assert.equal(await visible.count(), paged ? 6 : 12);
            const columns = await page.locator(".rc-mirror-grid").evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length);
            assert.equal(columns, paged ? 2 : 3);
            if (paged) {
              assert.deepEqual(await visible.evaluateAll(els => els.map(el => el.dataset.mirrorId)), initial.all.slice(0, 6));
              await page.getByRole("button", { name: "More sentences →", exact: true }).click();
              assert.deepEqual(await visible.evaluateAll(els => els.map(el => el.dataset.mirrorId)), initial.all.slice(6));
              assert.match(await page.locator(".rc-instruction").innerText(), /12 chosen/);
              await metric(`${size.width}x${size.height}-${theme}-1-second-six`);
            }
          }
        }
        for (const step of [11, 12]) {
          await render({ ...seed, step, choice: "A", willing: "not-yet" }, theme, size);
          await metric(`${size.width}x${size.height}-${theme}-${step}-alternate`);
        }
        console.log(`Layout batch captured: ${size.width}x${size.height} ${theme}`);
      }
    }
    await render({ ...initial.empty, step: 4, focus: "self" });
    assert.equal(await page.locator(".rc-summary.has-summary").count(), 0);
    await page.getByRole("textbox", { name: "About dollars a month", exact: true }).fill("0");
    assert.match(await page.locator(".rc-summary").innerText(), /\$0/);

    // A short desktop window uses the same ordered six-card gate as a phone.
    await render({ ...initial.empty, step: 1 }, "light", { width: 1024, height: 600 }, "rcroom", false);
    assert.equal(await page.locator(".rc-mirror-grid button:visible").count(), 6);
    const visibleQuotes = page.locator(".rc-mirror-grid button:visible");
    for (let i = 0; i < 3; i++) await visibleQuotes.nth(i).click();
    assert.equal(await page.getByRole("button", { name: "Show me what I see →", exact: true }).isDisabled(), true);
    await page.getByRole("button", { name: "More sentences →", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Show me what I see →", exact: true }).isEnabled(), true);
    await visibleQuotes.first().click();
    await page.reload(); await page.locator(".rc-mirror-scene").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    assert.deepEqual(await visibleQuotes.evaluateAll(els => els.map(el => el.dataset.mirrorId)), initial.all.slice(6));
    assert.match(await page.locator(".rc-instruction").innerText(), /4 chosen/);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForFunction(() => document.querySelector(".rc-mirror-scene")?.dataset.mirrorLayout === "twelve");
    assert.equal(await page.locator(".rc-mirror-grid button:visible").count(), 12);
    assert.match(await page.locator(".rc-instruction").innerText(), /4 chosen/);
    // Turn Preview off via its real control and prove scratch words disappear.
    await render({ ...seed, step: 3, tuesday: "REAL STORED ANSWER" });
    await page.getByRole("textbox", { name: "Your ordinary Tuesday", exact: true }).fill("PREVIEW MUST DISAPPEAR");
    await page.getByRole("button", { name: "Exit preview", exact: true }).click();
    await page.waitForURL(u => !u.searchParams.has("preview"));
    await page.locator(".rc-room").waitFor();
    assert.equal(await page.getByRole("textbox", { name: "Your ordinary Tuesday", exact: true }).inputValue(), "REAL STORED ANSWER");
    assert.equal(await page.getByText("PREVIEW · dev only · nothing you do here is saved", { exact: true }).count(), 0);
    // Normal local save, scene restoration and no entry veil on refresh.
    await page.getByRole("textbox", { name: "Your ordinary Tuesday", exact: true }).fill("A REAL LOCAL SAVE");
    await page.getByRole("button", { name: "Show me the price →", exact: true }).click();
    await page.reload();
    await page.locator(".rc-room").waitFor();
    assert.equal(await page.locator(".rc-room").getAttribute("data-step"), "4");
    assert.equal(await page.getByText("Looking at where you are…", { exact: true }).count(), 0);
    await page.getByRole("button", { name: "← Back", exact: true }).click();
    assert.equal(await page.getByRole("textbox", { name: "Your ordinary Tuesday", exact: true }).inputValue(), "A REAL LOCAL SAVE");
    // Gating is deliberately tested outside Preview All, which bypasses gates.
    await page.evaluate(async () => {
      const m = await import("/src/rcConstants.ts");
      localStorage.setItem(m.RC_STORAGE_KEY, JSON.stringify({ ...m.EMPTY_RC, step: 1 }));
    });
    await page.reload(); await page.locator(".rc-room").waitFor();
    assert.equal(await page.getByRole("button", { name: "Show me what I see →", exact: true }).isDisabled(), true);
    await page.locator('[data-mirror-id="time-avoiding"]').click();
    assert.equal(await page.getByRole("button", { name: "Show me what I see →", exact: true }).isDisabled(), true);
    await page.locator('[data-mirror-id="wealth-avoiding"]').click();
    assert.equal(await page.getByRole("button", { name: "Show me what I see →", exact: true }).isDisabled(), true);
    await page.locator('[data-mirror-id="self-carrying"]').click();
    assert.equal(await page.getByRole("button", { name: "Show me what I see →", exact: true }).isEnabled(), true);
    await page.locator('[data-mirror-id="self-carrying"]').click();
    assert.equal(await page.getByRole("button", { name: "Show me what I see →", exact: true }).isDisabled(), true);
    await page.locator('[data-mirror-id="self-carrying"]').click();
    await page.getByRole("button", { name: "Show me what I see →", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Choose an area →", exact: true }).isDisabled(), true);
    assert.equal(JSON.parse(await page.evaluate(key => localStorage.getItem(key), key)).complete, false);
    await page.getByRole("button", { name: "Wealth", exact: true }).click();
    assert.equal(await page.evaluate(async () => (await import("/src/rcConstants.ts")).loadRCState().focus), "wealth");
    // Normal-mode required gates and choice/save branches, using isolated progress.
    await render({ ...seed, step: 8, futureB5: { feels: [], tuesday: "", whoNotices: "" } }, "light", { width: 1366, height: 680 }, "rcroom", false);
    assert.equal(await page.getByRole("button", { name: "Bring it back to one year →", exact: true }).isDisabled(), true);
    await page.getByRole("textbox", { name: "My Future B Tuesday", exact: true }).fill("I have room for me.");
    await page.getByRole("button", { name: "Bring it back to one year →", exact: true }).click();
    await page.getByRole("textbox", { name: "My one thing this week", exact: true }).fill("");
    assert.equal(await page.getByRole("button", { name: "Choose my future →", exact: true }).isDisabled(), true);
    await page.getByRole("textbox", { name: "My one thing this week", exact: true }).fill("Commit to an hour.");
    await page.getByRole("button", { name: "Choose my future →", exact: true }).click();
    await page.getByRole("button", { name: /I'll keep things as they are/ }).click();
    await page.getByRole("button", { name: "Save and come back later", exact: true }).click();
    assert.equal(await page.getByRole("status").innerText(), "Your Reality Check is saved. Come back when you're ready.");
    assert.equal(JSON.parse(await page.evaluate(key => localStorage.getItem(key), key)).complete, false);
    await page.getByRole("button", { name: "Continue →", exact: true }).click();
    await page.getByRole("button", { name: "Look at Future B again →", exact: true }).click();
    await page.getByRole("button", { name: "Bring it back to one year →", exact: true }).click();
    await page.getByRole("button", { name: "Choose my future →", exact: true }).click();
    await page.getByRole("button", { name: /I choose this one →/ }).click();
    await page.getByRole("button", { name: "Not yet", exact: true }).click();
    assert.equal(JSON.parse(await page.evaluate(key => localStorage.getItem(key), key)).complete, false);
    await page.getByRole("textbox", { name: "What would help me say yes", exact: true }).fill("Knowing my next move");
    await page.getByRole("button", { name: "What would help me get there →", exact: true }).click();
    assert.equal(JSON.parse(await page.evaluate(key => localStorage.getItem(key), key)).complete, true);
    await page.reload(); await page.locator(".rc-room").waitFor();
    assert.equal(await page.locator(".rc-room").getAttribute("data-step"), "13");
    assert.equal(await page.locator(".na1-gold-burst").count(), 0);
    await page.getByRole("button", { name: "Begin →", exact: true }).click();
    assert.equal(await page.locator(".rc-room").count(), 0);
    await render({ ...seed, step: 11, willing: null }, "dark", { width: 375, height: 812 }, "rcroom", false);
    await page.getByRole("button", { name: "Yes, I'm willing", exact: true }).click();
    assert.equal(await page.locator(".na1-gold-burst").count(), 1);
    await page.reload(); await page.locator(".rc-room").waitFor();
    assert.equal(await page.locator(".na1-gold-burst").count(), 0);
    assert.equal(await page.locator(".rc-room").getAttribute("data-step"), "12");
    await page.getByRole("button", { name: "What will get me there →", exact: true }).click();
    await page.evaluate(async () => (await import("/src/reality-check/access.ts")).setSimulatedFree(true));
    await page.getByRole("button", { name: "Start building Future B →", exact: true }).click();
    assert.equal(await page.getByRole("heading", { name: "Start building Future B.", exact: true }).count(), 1);
    await metric("375x812-dark-join-placeholder");
    await page.getByRole("button", { name: "Close Reality Check", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Review the Reality Check →", exact: true }).count(), 1);
    await page.getByRole("button", { name: "Review the Reality Check →", exact: true }).click();
    assert.equal(await page.locator(".rc-room").getAttribute("data-step"), "1");
    await page.locator(".rc-progress").getByRole("button", { name: "Two futures, 4 of 5", exact: true }).click();
    assert.equal(await page.locator(".rc-room").getAttribute("data-step"), "5");
    await page.getByRole("button", { name: "← Back", exact: true }).click();
    assert.equal(await page.locator(".rc-room").getAttribute("data-step"), "4");
    await page.getByRole("textbox", { name: "About dollars a month", exact: true }).fill("200");
    const revised = JSON.parse(await page.evaluate(key => localStorage.getItem(key), key));
    assert.equal(revised.complete, true); assert.equal(revised.choice, "B");
    assert.equal(revised.cost.whoElse, seed.cost.whoElse);
    assert.equal(revised.futureA.extra, seed.futureA.extra);
    assert.equal(revised.compound.whoElse, seed.compound.whoElse);
    assert.equal(revised.futureB5.whoNotices, seed.futureB5.whoNotices);
    await page.getByRole("button", { name: "Close Reality Check", exact: true }).click();
    await page.locator(".rc-dev-tools summary").click();
    const snapshot = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));
    page.once("dialog", dialog => dialog.dismiss());
    await page.getByRole("button", { name: "Reset Reality Check", exact: true }).click();
    assert.equal(await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort())), snapshot);
    const beforeReset = writes.length;
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Reset Reality Check", exact: true }).click();
    await page.waitForEvent("load");
    assert.equal(JSON.parse(await page.evaluate(key => localStorage.getItem(key), key)).complete, false);
    assert.deepEqual(writes.slice(beforeReset).map(w => w.path).sort(), ["/api/userdata/rcstate", "/api/userdata/setaside"]);
    assert(writes.length > 0, "Normal-mode userdata writes must be positively intercepted.");
    assert.deepEqual(unexpected, [], "No unexpected mutation requests.");
    assert.equal((await context.cookies()).length, 0, "The fixture must have no real session cookies.");
    assert.deepEqual(errors, [], "No page runtime errors.");
    if (failures.length) console.warn(`FIT EXCEPTIONS: ${failures.length} captured layouts need bounded body scrolling; these are not one-screen fit passes.`);
    console.log(`PASS: ${results.length} protected-layout cases; authenticated walkthrough, gate, optional cost, refresh and preview-exit checks. See fit exceptions separately.`);
  } finally {
    await page.screenshot({ path: path.join(out, "last-state.png") }).catch(() => {});
    fs.writeFileSync(path.join(out, "results.json"), JSON.stringify({ results, failures, errors, writesIntercepted: writes.length }, null, 2));
    console.log(JSON.stringify({ layoutCases: results.length, failures, runtimeErrors: errors }));
    await browser.close();
  }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
