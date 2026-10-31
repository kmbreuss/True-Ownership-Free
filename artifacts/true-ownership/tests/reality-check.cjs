const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function env(preview = false, dev = true) {
  const data = new Map(), session = new Map(), requests = [];
  const storage = map => ({ getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: k => map.delete(k) });
  const localStorage = storage(data), sessionStorage = storage(session);
  const location = { search: `?newRC=1${preview ? "&preview=1" : ""}`, href: "https://example.test/?newRC=1", origin: "https://example.test", replace: url => requests.push(url) };
  const ctx = vm.createContext({ console, URL, URLSearchParams, Date, structuredClone, setTimeout, clearTimeout, localStorage, sessionStorage, location,
    window: { localStorage, sessionStorage, location },
    fetch: async (...args) => { requests.push(args); return { ok: true, json: async () => ({}) }; },
  });
  const cache = {};
  function load(name) {
    const file = name.startsWith("/") ? name : path.resolve(__dirname, "../src", `${name}.ts`);
    if (cache[file]) return cache[file].exports;
    const module = { exports: {} }; cache[file] = module;
    const source = fs.readFileSync(file, "utf8").replaceAll("import.meta.env.DEV", String(dev));
    const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInContext(`(function(require,module,exports){${js}\n})`, ctx)(dep => {
      if (dep === "react") return { useSyncExternalStore: () => {} };
      return load(path.resolve(path.dirname(file), `${dep}.ts`));
    }, module, module.exports);
    return module.exports;
  }
  return { load, data, requests, location, ctx };
}
const plain = value => JSON.parse(JSON.stringify(value));
function select(m, ids) {
  return ids.reduce((s, id) => m.toggleMirror(s, id), m.normalizeRC(null));
}
test("version 2 starts clean; RC-1 reset never touches other stores", () => {
  const e = env(), m = e.load("rcConstants");
  const old = { version: 1, step: 4, complete: true, defaultsNamed: { time: { carrying: "Old RC draft" } } };
  e.data.set(m.RC_STORAGE_KEY, JSON.stringify(old)); e.data.set("to_a4_state_v1", '{"my":"real progress"}');
  assert.deepEqual(plain(m.loadRCState()), plain(m.EMPTY_RC));
  assert.equal(JSON.parse(e.data.get(m.RC_STORAGE_KEY)).version, 2);
  assert.equal(e.data.get("to_a4_state_v1"), '{"my":"real progress"}');
  assert.equal(m.EMPTY_RC.step, 0);
  assert.equal(m.EMPTY_RC.complete, false);
});
test("12 mirror sentences stay in mixed order with stable unique IDs", () => {
  const m = env().load("rcConstants");
  assert.equal(m.RC_MIRROR.length, 12);
  assert.equal(new Set(m.RC_MIRROR.map(v => v.id)).size, 12);
  assert.equal(m.RC_MIRROR[0].id, "time-avoiding");
  assert.equal(m.RC_MIRROR.at(-1).id, "self-blaming");
});
test("mirror gate blocks fewer than 3 and unique top area is revealed", () => {
  const m = env().load("rcConstants");
  let s = { ...m.normalizeRC(null), step: 1 };
  assert.equal(m.rcReady(s), false);
  s = m.toggleMirror(s, "time-avoiding"); s = m.toggleMirror(s, "time-blaming");
  assert.equal(m.rcReady(s), false);
  s = m.toggleMirror(s, "wealth-avoiding");
  assert.equal(m.rcReady(s), true);
  assert.equal(s.focus, "time"); assert.equal(s.focusChosenBy, "revealed");
  assert.deepEqual(plain(s.topDefaults), ["avoiding"]);
  assert.equal(s.areaCounts.time, 2); assert.equal(s.defaultCounts.avoiding, 2);
});
test("two-area and three-area ties require a deliberate area choice", () => {
  const m = env().load("rcConstants");
  let s = select(m, ["time-avoiding", "wealth-avoiding", "self-carrying"]);
  assert.deepEqual(plain(m.topAreas(s)), ["self", "time", "wealth"]);
  s.step = 2; assert.equal(s.focus, null); assert.equal(m.rcReady(s), false);
  s = m.chooseFocus(s, "wealth"); assert.equal(s.focusChosenBy, "tie-picked"); assert.equal(m.rcReady(s), true);
  s = select(m, ["time-avoiding", "time-blaming", "wealth-avoiding", "wealth-blaming"]);
  assert.deepEqual(plain(m.topAreas(s)), ["time", "wealth"]); assert.equal(s.focus, null);
});
test("area override and back-edits recompute reveal but preserve written drafts", () => {
  const m = env().load("rcConstants");
  let s = select(m, ["time-avoiding", "time-blaming", "self-carrying"]);
  s = m.chooseFocus(s, "self"); assert.equal(s.focusChosenBy, "changed");
  s.tuesday = "My own Tuesday"; s.defaultsNamed.carrying = "My words";
  s = m.toggleMirror(s, "time-blaming");
  assert.equal(s.focus, null); assert.equal(s.tuesday, "My own Tuesday"); assert.equal(s.defaultsNamed.carrying, "My words");
});
test("all tied top defaults survive in stable order; named words stay optional", () => {
  const m = env().load("rcConstants");
  const s = select(m, ["time-avoiding", "time-blaming", "self-carrying", "wealth-hoping"]);
  assert.deepEqual(plain(s.topDefaults), ["avoiding", "blaming", "carrying", "hoping"]);
  s.step = 3; s.focus = "self"; assert.equal(m.rcReady(s), false);
  s.tuesday = "  "; assert.equal(m.rcReady(s), false);
  s.tuesday = "I feel stretched."; assert.equal(m.rcReady(s), true);
  assert.deepEqual(plain(s.defaultsNamed), { avoiding: "", blaming: "", carrying: "", hoping: "" });
});
test("v2 hydration preserves fields and scene, reconciles dishonest counts and invalid IDs", () => {
  const m = env().load("rcConstants");
  const s = m.normalizeRC({ ...m.EMPTY_RC, step: 4, mirror: ["time-avoiding", "time-avoiding", "invented"],
    areaCounts: { time: 999 }, topDefaults: ["hoping"], defaultsNamed: { avoiding: "A real answer" }, cost: { monthly: -5, hoursPerWeek: 0 } });
  assert.equal(s.step, 4); assert.deepEqual(plain(s.mirror), ["time-avoiding"]); assert.equal(s.areaCounts.time, 1);
  assert.deepEqual(plain(s.topDefaults), ["avoiding"]); assert.equal(s.defaultsNamed.avoiding, "A real answer");
  assert.equal(s.defaultsNamed.hoping, ""); assert.equal(s.cost.monthly, null); assert.equal(s.cost.hoursPerWeek, 0);
});
test("cost with no inputs hides summary; missing and genuine zero amounts differ", () => {
  const m = env().load("rcConstants"), s = m.normalizeRC(null);
  assert.equal(m.costSummary(s.cost), "");
  s.cost.monthly = 0; assert.match(m.costSummary(s.cost), /\$0/); assert.doesNotMatch(m.costSummary(s.cost), /hours/);
  s.cost.monthly = 100; s.cost.hoursPerWeek = 2;
  assert.equal(m.costSummary(s.cost), "Over a year, that's about $1,200 and 104 hours. And you're paying too.");
  s.cost.monthly = null; assert.match(m.costSummary(s.cost), /104 hours/); assert.doesNotMatch(m.costSummary(s.cost), /\$/);
  s.cost.hoursPerWeek = null; s.cost.you = "My sleep"; assert.equal(m.costSummary(s.cost), "And you're paying too.");
});
test("every J1 scene leaves completion false, including the placeholder", () => {
  const m = env().load("rcConstants");
  for (let step = 0; step <= 5; step++) {
    const s = m.normalizeRC({ ...m.EMPTY_RC, step });
    assert.equal(s.step, step); assert.equal(s.complete, false); assert.equal(s.completedAt, null);
  }
});
test("real saves and blanking persist; preview saves nothing and exit reloads", async () => {
  const normal = env(), m = normal.load("rcConstants");
  const s = m.normalizeRC(null); s.step = 3; s.defaultsNamed.carrying = "My words";
  m.saveRCState(s); assert.equal(m.loadRCState().defaultsNamed.carrying, "My words");
  s.defaultsNamed.carrying = ""; m.saveRCState(s); assert.equal(m.loadRCState().defaultsNamed.carrying, "");
  const e = env(true), pm = e.load("rcConstants");
  e.data.set(m.RC_STORAGE_KEY, JSON.stringify(s));
  const before = JSON.stringify([...e.data]);
  const scratch = pm.loadRCState(); scratch.tuesday = "Not saved"; pm.saveRCState(scratch);
  assert.equal(pm.loadRCState().tuesday, "Not saved"); assert.equal(JSON.stringify([...e.data]), before);
  await e.load("newFlowSync").hydrateNewFlow({}); assert.equal(e.requests.length, 0);
  e.load("devPreview").setDevPreview(false); assert.equal(e.requests.length, 1);
  assert.equal(e.data.get(m.RC_STORAGE_KEY), JSON.stringify(s));
  const reloaded = env(); reloaded.data.set(m.RC_STORAGE_KEY, e.data.get(m.RC_STORAGE_KEY));
  assert.equal(reloaded.load("rcConstants").loadRCState().tuesday, "");
});
test("preview RC-1 normalization also stays in scratch storage", () => {
  const e = env(true), m = e.load("rcConstants"), raw = '{"version":1,"step":4}';
  e.data.set(m.RC_STORAGE_KEY, raw); assert.equal(m.loadRCState().version, 2);
  assert.equal(e.data.get(m.RC_STORAGE_KEY), raw);
});
test("cloud RC-1 resets only RC; version 2 cloud words load unchanged", async () => {
  const e = env(), m = e.load("rcConstants"), sync = e.load("newFlowSync");
  e.data.set("unrelated", "preserve");
  await sync.hydrateNewFlow({ rcstate: { t: 10, v: { version: 1, complete: true } } });
  assert.deepEqual(JSON.parse(e.data.get(m.RC_STORAGE_KEY)), plain(m.EMPTY_RC)); assert.equal(e.data.get("unrelated"), "preserve");
  const words = { ...m.EMPTY_RC, step: 3, tuesday: "My Tuesday" };
  await sync.hydrateNewFlow({ rcstate: { t: 20, v: words } });
  assert.equal(m.loadRCState().tuesday, "My Tuesday");
  assert.equal(sync.STORES.find(v => v.sk === "rcstate").empty.version, 2);
});
test("imports and exports normalize RC only and retain future stable fields", () => {
  const e = env(), m = e.load("rcConstants"), sync = e.load("newFlowSync");
  const v = { ...m.EMPTY_RC, tuesday: "My words", futureB1: { doing: "", oneThing: "Reserved for later" } };
  const file = JSON.stringify({ kind: "true-ownership-answers", keys: { [m.RC_STORAGE_KEY]: JSON.stringify(v) } });
  assert.equal(sync.importLocalAnswers(file).ok, true);
  const exported = JSON.parse(sync.exportLocalAnswers());
  assert.equal(JSON.parse(exported.keys[m.RC_STORAGE_KEY]).futureB1.oneThing, "Reserved for later");
  const legacy = env(), lm = legacy.load("rcConstants"), ls = legacy.load("newFlowSync");
  const old = JSON.stringify({ kind: "true-ownership-answers", keys: { [lm.RC_STORAGE_KEY]: '{"version":1,"complete":true}' } });
  assert.equal(ls.importLocalAnswers(old).ok, true); assert.equal(lm.loadRCState().complete, false);
});
test("free access remains DEV-only and nonpersistent", () => {
  for (const dev of [true, false]) {
    const e = env(false, dev), access = e.load("reality-check/access");
    access.setSimulatedFree(true); assert.equal(access.simulatedAccess(), dev ? "free" : "member");
    assert.equal(e.data.size, 0);
    assert.equal(env(false, dev).load("reality-check/access").simulatedAccess(), "member");
  }
  const e = env(true), access = e.load("reality-check/access");
  access.setSimulatedFree(true); assert.equal(access.rcFreeLocked(), false);
});
test("existing-user exemption ignores pristine stores but recognizes real progress", () => {
  const e = env(), p = e.load("reality-check/progress");
  const stores = {
    to_a2_state_v1: e.load("a2Constants").EMPTY_A2, to_a3_state_v1: e.load("a3Constants").EMPTY_A3,
    to_a4_state_v1: e.load("a4Constants").EMPTY_A4, to_a5_state_v1: e.load("a5Constants").EMPTY_A5,
    to_mirror4_state_v1: e.load("mirror4Constants").EMPTY_MIRROR4,
    to_map: { vision: e.load("mirror2Constants").EMPTY_VISION, mirror3: e.load("mirror3Constants").EMPTY_MIRROR3 },
  };
  assert.equal(p.hasPriorProgress(k => stores[k]), false);
  assert.equal(p.substantive({ step: 4, version: 1 }), false);
  stores.a1_peel_draft = "My reason"; assert.equal(p.hasPriorProgress(k => stores[k]), true);
});
test("existing server allow-list and newer-wins rule are unchanged", () => {
  const e = env(), guard = e.load(path.resolve(__dirname, "../../api-server/src/lib/syncGuard.ts"));
  assert.equal(guard.SYNC_KEYS.has("rcstate"), true);
  assert.equal(guard.SYNC_KEYS.has("setaside"), true);
  assert.equal(guard.decideWrite({ t: 20, v: "new" }, { t: 10, v: "old" }, 30).action, "conflict");
});
test("J2 preserves J1 words and extends refresh restoration to scene 13", () => {
  const m = env().load("rcConstants");
  const s = m.normalizeRC({ ...m.EMPTY_RC, step: 13, tuesday: "My J1 Tuesday", defaultsNamed: { carrying: "Not mine" },
    futureB1: { doing: "My one-year direction", oneThing: "My next move" } });
  assert.equal(s.step, 13); assert.equal(s.version, 2); assert.equal(s.tuesday, "My J1 Tuesday");
  assert.equal(s.defaultsNamed.carrying, "Not mine"); assert.equal(s.futureB1.oneThing, "My next move");
});
test("Future B Tuesday and one thing are required, optional feelings are not", () => {
  const m = env().load("rcConstants"), s = m.normalizeRC(null);
  s.step = 8; assert.equal(m.rcReady(s), false);
  s.futureB5.tuesday = "I feel calm"; assert.equal(m.rcReady(s), true);
  s.step = 9; assert.equal(m.rcReady(s), false);
  s.futureB1.oneThing = "  "; assert.equal(m.rcReady(s), false);
  s.futureB1.oneThing = "Commit to a quiet hour"; assert.equal(m.rcReady(s), true);
  assert.equal(s.futureB5.feels.length, 0);
});
test("future calculations omit missing values, preserve zero and convert days precisely", () => {
  const e = env(), m = e.load("rcConstants"), j = e.load("reality-check/rcJourney"), s = m.normalizeRC(null);
  assert.deepEqual(plain(j.annualAmounts(s, 5)), { money: "", hours: "" });
  s.cost.monthly = 100; s.cost.hoursPerWeek = 2;
  assert.deepEqual(plain(j.annualAmounts(s, 3, "threshold")), { money: "$3,600", hours: "312 hours" });
  assert.deepEqual(plain(j.annualAmounts(s, 5, "always")), { money: "$6,000", hours: "22 days" });
  s.cost.hoursPerWeek = 20;
  assert.equal(j.annualAmounts(s, 1, "threshold").hours, "43 days");
  s.cost.monthly = 0; s.cost.hoursPerWeek = 0;
  assert.deepEqual(plain(j.annualAmounts(s)), { money: "$0", hours: "0 hours" });
});
test("Future A reflects their words and only currently top named defaults", () => {
  const e = env(), m = e.load("rcConstants"), j = e.load("reality-check/rcJourney");
  const s = select(m, ["time-avoiding", "wealth-avoiding", "self-carrying"]);
  s.tuesday = "My actual Tuesday"; s.defaultsNamed.avoiding = "The conversation";
  s.defaultsNamed.blaming = "Hidden draft"; s.cost.hoursPerWeek = 2; s.cost.hoursWhere = "My evenings";
  const words = j.futureAReadback(s);
  assert.match(words, /My actual Tuesday/); assert.match(words, /the conversation/);
  assert.match(words, /104 hours/); assert.match(words, /your evenings/); assert.doesNotMatch(words, /Hidden draft|\$/);
});
test("completion and set aside are idempotent and preserve other entries/metadata", () => {
  const e = env(), m = e.load("rcConstants"), j = e.load("reality-check/rcJourney");
  let s = select(m, ["time-avoiding", "wealth-avoiding", "self-carrying"]);
  s.focus = "time"; s.startedAt = "2026-10-31T12:00:00.000Z"; s.defaultsNamed.avoiding = "My optional words";
  s.defaultsNamed.blaming = "Hidden draft";
  const manual = { id: "manual", text: "Keep my existing item", source: "manual", round: "", createdAt: "", sorted: true };
  e.data.set(j.SETASIDE_KEY, JSON.stringify({ version: 1, items: [manual] }));
  s = j.persistRCCompletion({ ...s, step: 12, choice: "B", willing: "yes" });
  const first = JSON.parse(e.data.get(j.SETASIDE_KEY));
  assert.equal(s.complete, true); assert.ok(s.completedAt);
  assert.equal(first.items.length, 4); assert.deepEqual(first.items[0], manual);
  assert.ok(first.items.some(v => v.text.includes('Wealth · "I don')));
  assert.ok(first.items.some(v => v.text.includes("My optional words")));
  assert.ok(!first.items.some(v => v.text.includes("Hidden draft")));
  const again = j.persistRCCompletion(s), second = JSON.parse(e.data.get(j.SETASIDE_KEY));
  assert.equal(again.completedAt, s.completedAt);
  assert.deepEqual(second, first); assert.equal(new Set(second.items.map(v => v.id)).size, second.items.length);
});
test("preview completion and set-aside writes are both scratch-only", () => {
  const e = env(true), m = e.load("rcConstants"), j = e.load("reality-check/rcJourney");
  e.data.set("unrelated", "Real progress"); e.data.set(m.RC_STORAGE_KEY, JSON.stringify(m.EMPTY_RC));
  const before = JSON.stringify([...e.data]);
  let s = select(m, ["time-avoiding", "wealth-avoiding", "self-carrying"]);
  s = j.persistRCCompletion({ ...s, startedAt: "2026-10-31T12:00:00Z", focus: "time" });
  assert.equal(s.complete, true); assert.equal(m.loadRCState().complete, true);
  assert.equal(j.loadSetAside().items.length, 2);
  assert.equal(JSON.stringify([...e.data]), before); assert.equal(e.requests.length, 0);
});
test("redo preserves a flat completed round, prior words and the Map reflection", () => {
  const e = env(), m = e.load("rcConstants"), j = e.load("reality-check/rcJourney");
  const old = j.completeRC({ ...m.normalizeRC(null), startedAt: "2026-01-01T00:00:00Z", tuesday: "My last Tuesday", focus: "wealth" }, "2026-01-01T00:00:00Z");
  assert.equal(j.redoDue(old, Date.parse("2026-01-02T00:00:00Z")), false);
  assert.equal(j.redoDue(old, Date.parse("2026-04-01T00:00:00Z")), true);
  const next = j.startRedo(old, "2026-04-01T00:00:00Z");
  assert.equal(next.complete, false); assert.equal(next.step, 0); assert.equal(next.tuesday, "");
  assert.equal(next.rounds.length, 1); assert.equal("rounds" in next.rounds[0], false);
  assert.equal(j.lastCompletedRC(next).tuesday, "My last Tuesday");
  assert.equal(j.lastTimeWords(next.rounds[0], 3), "My last Tuesday");
  assert.equal(m.normalizeRC(next).rounds[0].tuesday, "My last Tuesday");
});
test("RC polish preserves reached chapters and completion, and cleans sentences", () => {
  const e = env(), m = e.load("rcConstants"), j = e.load("reality-check/rcJourney");
  const s = m.normalizeRC({ ...m.EMPTY_RC, step: 1, maxReached: 13, complete: true, choice: "B" });
  m.saveRCState(s);
  assert.equal(m.loadRCState().maxReached, 13);
  assert.equal(m.loadRCState().choice, "B");
  assert.equal(j.endClean("My sleep..."), "My sleep");
  assert.equal(j.defaultList({ topDefaults: ["avoiding", "blaming", "carrying", "hoping"] }), "avoiding, blaming, carrying and blindly hoping");
  assert.equal(j.reflectionClause("I'm carrying my worries."), "carrying your worries");
});
test("calm RC preserves combined tie words, blanking and old individual words", () => {
  const e = env(), m = e.load("rcConstants"), j = e.load("reality-check/rcJourney");
  const legacy = m.normalizeRC({ ...m.EMPTY_RC, mirror: m.RC_MIRROR.map(v => v.id), defaultsNamed: { avoiding: "Old conversation", blaming: "Old blame", carrying: "", hoping: "" } });
  assert.equal("defaultsTogether" in legacy, false);
  const edited = m.normalizeRC({ ...legacy, defaultsTogether: "A difficult conversation." });
  m.saveRCState(edited);
  assert.equal(m.loadRCState().defaultsTogether, "A difficult conversation.");
  assert.equal(m.loadRCState().defaultsNamed.avoiding, "Old conversation");
  assert.match(j.futureAReadback(edited), /A difficult conversation/);
  assert.doesNotMatch(j.futureAReadback(edited), /Old conversation/);
  assert(j.setAsideFor(edited).some(v => v.text.includes("A difficult conversation")));
  const cleared = m.normalizeRC({ ...edited, defaultsTogether: "" });
  assert.doesNotMatch(j.futureAReadback(cleared), /Old conversation|A difficult conversation/);
  assert(!j.setAsideFor(cleared).some(v => /named:/.test(v.id)));
  assert.equal(m.rcMoney(1234.5), "$1,235");
  const hours = { ...legacy, cost: { ...legacy.cost, hoursPerWeek: 2 } };
  assert.match(j.futureAReadback(hours), /104 hours are gone/);
  assert.match(j.futureAReadback({ ...hours, cost: { ...hours.cost, monthly: 100, hoursPerWeek: null } }), /\$1,200 is gone/);
});
test("DEV reset changes only the two RC stores and their metadata", async () => {
  const e = env(), sync = e.load("newFlowSync");
  e.data.set("to_map", '{"untouched":true}');
  e.data.set("to_a4_state_v1", '{"untouched":true}');
  e.data.set("to_sync_meta_v1", '{"a4state":{"lt":123}}');
  await sync.resetRealityCheckForDev();
  assert.equal(e.data.get("to_map"), '{"untouched":true}');
  assert.equal(e.data.get("to_a4_state_v1"), '{"untouched":true}');
  assert.equal(JSON.parse(e.data.get("to_sync_meta_v1")).a4state.lt, 123);
  assert.equal(JSON.parse(e.data.get("to_rc_state_v1")).complete, false);
  assert.deepEqual(e.requests.filter(r => r[1]?.method === "PUT").map(r => r[0]), ["/api/userdata/rcstate", "/api/userdata/setaside"]);
});
test("DEV reset reports partial failure and is blocked in Preview and production", async () => {
  const e = env(), sync = e.load("newFlowSync");
  e.data.set("to_setaside_v1", '{"version":1,"items":[{"id":"keep"}]}');
  e.ctx.fetch = async url => ({ ok: !url.endsWith("/setaside"), json: async () => ({}) });
  await assert.rejects(sync.resetRealityCheckForDev(), /partially complete/);
  assert.equal(e.data.get("to_setaside_v1"), '{"version":1,"items":[{"id":"keep"}]}');
  for (const blocked of [env(true), env(false, false)]) {
    await assert.rejects(blocked.load("newFlowSync").resetRealityCheckForDev(), /unavailable/);
    assert.equal(blocked.requests.length, 0);
  }
});
