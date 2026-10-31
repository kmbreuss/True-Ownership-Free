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
  const location = { search: `?newRC=1${preview ? "&preview=1" : ""}`, href: "https://example.test/?newRC=1", replace: url => requests.push(url) };
  const ctx = vm.createContext({ console, URL, URLSearchParams, Date, setTimeout, clearTimeout, localStorage, sessionStorage, location,
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
  return { load, data, requests, location };
}
const plain = value => JSON.parse(JSON.stringify(value));
test("RC starts unscored; additive hydration preserves named drafts and other areas", () => {
  const m = env().load("rcConstants"), s = m.normalizeRC(null);
  assert.deepEqual(plain(s.scores), { self: null, time: null, wealth: null });
  assert.equal(s.complete, false);
  const imported = m.normalizeRC({ step: 4, defaultsNamed: { time: { carrying: "Someone else's work" } } });
  assert.equal(imported.defaultsNamed.time.carrying, "Someone else's work");
  assert.equal(imported.defaultsNamed.time.hoping, "");
  assert.equal(imported.defaultsNamed.self.carrying, "");
});
test("focus requires all scores; unique lowest suggests, ties/all-high require choice", () => {
  const m = env().load("rcConstants");
  let s = { ...m.normalizeRC(null), step: 2 };
  assert.equal(m.rcReady(s), false);
  s = m.withScore(s, "time", 3); s = m.withScore(s, "self", 6); s = m.withScore(s, "wealth", 8);
  assert.equal(s.focus, "time"); assert.equal(s.focusChosenBy, "suggested"); assert.equal(m.rcReady(s), true);
  s = { ...s, focus: "wealth", focusChosenBy: "picked" };
  assert.equal(m.rcReady(s), true);
  s = m.withScore(s, "self", 3);
  assert.equal(s.focus, null); assert.equal(m.focusOptions(s.scores).kind, "tie");
  s = m.withScore(s, "self", 8); s = m.withScore(s, "time", 9);
  assert.equal(s.focus, null); assert.equal(m.focusOptions(s.scores).kind, "high");
  assert.equal(m.rcReady(s), false);
  assert.deepEqual([1,3,5,7,9].map(m.scoreWords), ["It owns me","Mostly, it owns me","Some days I own it, some days it owns me","Mostly, I own it","I own it"]);
});
test("symptom toggles preserve own prose and do not cross areas", () => {
  const m = env().load("rcConstants"), s = m.normalizeRC(null);
  s.reality.time.text = "My original words.";
  const picked = m.toggleSymptom(s, "time", 3);
  assert.equal(picked.reality.time.text, `My original words.\n${m.RC_SYMPTOMS[3]}`);
  assert.equal(m.toggleSymptom(picked, "time", 3).reality.time.text, "My original words.");
  assert.equal(picked.reality.self.text, "");
  picked.reality.time.text = "Edited words that should stay.";
  assert.equal(m.toggleSymptom(picked, "time", 3).reality.time.text, picked.reality.time.text);
});
test("defaults naming is optional; explicit None of these is enough", () => {
  const m = env().load("rcConstants"), s = m.normalizeRC(null);
  s.step = 4; s.focus = "self"; assert.equal(m.rcReady(s), false);
  s.defaults.self = ["carrying"]; assert.equal(m.rcReady(s), true);
  assert.equal(s.defaultsNamed.self.carrying, "");
  s.defaults.self = []; s.defaultsNone.self = true; assert.equal(m.rcReady(s), true);
});
test("cost summary computes annual values, omits zeros, supports own entries", () => {
  const m = env().load("rcConstants"), s = m.normalizeRC(null);
  assert.equal(m.costSummary(s.cost), "");
  s.cost.wealth.monthly = 0; s.cost.time.hoursPerWeek = 0;
  assert.equal(m.costSummary(s.cost), "");
  s.cost.wealth.monthly = 100; s.cost.time.hoursPerWeek = 2;
  s.cost.self.chips = ["My energy", "My sleep"]; s.cost.self.whoElse = "my family";
  assert.match(m.costSummary(s.cost), /\$1,200 and 104 hours/);
  assert.match(m.costSummary(s.cost), /your energy and your sleep and my family/);
});
test("real RC state syncs; preview edits do not write, and exit clears drafts", async () => {
  const normal = env(), m = normal.load("rcConstants");
  const s = m.normalizeRC(null); s.step = 4; s.defaultsNamed.time.carrying = "My words";
  m.saveRCState(s); assert.equal(m.loadRCState().defaultsNamed.time.carrying, "My words");
  const e = env(true), pm = e.load("rcConstants");
  e.data.set(m.RC_STORAGE_KEY, JSON.stringify(s));
  const before = JSON.stringify([...e.data]);
  const scratch = pm.loadRCState(); scratch.defaultsNamed.time.carrying = "Not saved";
  pm.saveRCState(scratch);
  assert.equal(pm.loadRCState().defaultsNamed.time.carrying, "Not saved");
  assert.equal(JSON.stringify([...e.data]), before);
  const sync = e.load("newFlowSync");
  assert.equal(sync.STORES.find(v => v.sk === "rcstate").label, "Reality Check");
  await sync.hydrateNewFlow({}); sync.markLocalChange(m.RC_STORAGE_KEY);
  assert.equal(e.requests.length, 0);
  e.load("devPreview").setDevPreview(false);
  assert.equal(e.requests.length, 1);
  assert.equal(e.data.get(m.RC_STORAGE_KEY), JSON.stringify(s));
});
test("free access is DEV-only and non-persistent; Preview bypasses it", () => {
  for (const dev of [true, false]) {
    const e = env(false, dev), access = e.load("reality-check/access");
    access.setSimulatedFree(true);
    assert.equal(access.simulatedAccess(), dev ? "free" : "member");
    assert.equal(e.data.size, 0);
    assert.equal(env(false, dev).load("reality-check/access").simulatedAccess(), "member");
  }
  const preview = env(true), access = preview.load("reality-check/access");
  access.setSimulatedFree(true); assert.equal(access.rcFreeLocked(), false);
});
test("legacy exemption ignores pristine stores and cursors but recognizes answers", () => {
  const e = env(), p = e.load("reality-check/progress");
  const stores = {
    to_a2_state_v1: e.load("a2Constants").EMPTY_A2,
    to_a3_state_v1: e.load("a3Constants").EMPTY_A3,
    to_a4_state_v1: e.load("a4Constants").EMPTY_A4,
    to_a5_state_v1: e.load("a5Constants").EMPTY_A5,
    to_mirror4_state_v1: e.load("mirror4Constants").EMPTY_MIRROR4,
    to_map: { vision: e.load("mirror2Constants").EMPTY_VISION, mirror3: e.load("mirror3Constants").EMPTY_MIRROR3 },
  };
  assert.equal(p.hasPriorProgress(k => stores[k]), false);
  assert.equal(p.substantive({ step: 4, version: 1 }), false);
  stores.a1_peel_draft = "My reason";
  assert.equal(p.hasPriorProgress(k => stores[k]), true);
});
test("server accepts rcstate with existing newer-wins rule", () => {
  const e = env(), guard = e.load(path.resolve(__dirname, "../../api-server/src/lib/syncGuard.ts"));
  assert.equal(guard.SYNC_KEYS.has("rcstate"), true);
  assert.equal(guard.decideWrite({ t: 20, v: "new" }, { t: 10, v: "old" }, 30).action, "conflict");
  assert.equal(guard.decideWrite(undefined, { t: 10, v: {} }, 30).action, "insert");
});
