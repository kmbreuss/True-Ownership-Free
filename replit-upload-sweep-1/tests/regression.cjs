// Offline regression tests. No server, credentials, or real user data.
// Run: node replit-upload-sweep-1/tests/regression.cjs
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const ts = require("typescript");
const root = path.resolve(__dirname, "../../");
const staged = path.join(root, "replit-upload-sweep-1/artifacts/true-ownership/src");
const original = path.join(root, "artifacts/true-ownership/src");
const cache = new Map();
const storage = new Map();
const localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
};
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const file = [staged, original].map(dir => path.join(dir, name + ".ts")).find(fs.existsSync);
  if (!file) throw new Error(`Missing module ${name}`);
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  cache.set(name, module.exports);
  vm.runInNewContext(output, {
    module, exports: module.exports, console, Date, JSON, Math, Number, Set, Map,
    localStorage, window: { localStorage },
    require: dep => {
      if (!dep.startsWith(".")) throw new Error(`Unexpected external dependency ${dep}`);
      return load(path.posix.normalize(path.posix.join(path.posix.dirname(name), dep)));
    },
  }, { filename: file });
  return module.exports;
}
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`PASS ${name}`); }
  catch (error) { failed++; console.error(`FAIL ${name}: ${error.message}`); }
}
const copy = x => JSON.parse(JSON.stringify(x));
const a4 = load("a4Constants");
const a5 = load("a5Constants");
const vision = load("mirror2Constants");
test("A4 empty state cannot claim any mirror", () => {
  for (const key of a4.A4_MIRROR_KEYS) assert.equal(a4.a4PromiseReady(a4.EMPTY_A4[key]), false);
});
test("A4 screen gates require a gap and both reflection fields", () => {
  const m = copy(a4.EMPTY_A4_MIRROR);
  assert.equal(a4.a4ScreenReady(m, 0), true);
  assert.equal(a4.a4ScreenReady(m, 1), false);
  m.picked = "own"; m.own = { kind: "own", said: "Protect focus", evidence: "Meetings all day" };
  assert.equal(a4.a4ScreenReady(m, 1), true);
  m.every = "accept a meeting"; assert.equal(a4.a4ScreenReady(m, 2), false);
  m.prove = "my focus can wait"; assert.equal(a4.a4ScreenReady(m, 2), true);
});
test("A4 full promise requires certainty and optional say-no gate", () => {
  const m = { ...copy(a4.EMPTY_A4_MIRROR), picked: "own",
    own: { kind: "own", said: "Focus", evidence: "Meetings" },
    every: "accept", prove: "wait", will: "protect an hour", when: "Monday",
    year: "Finish work", gives: "Confidence", stop: "Overbooking", plan: "Block calendar", sure: "yes" };
  assert.equal(a4.a4PromiseReady(m), true);
  assert.equal(a4.a4PromiseReady(m, { needSayNo: true }), false);
  assert.equal(a4.a4PromiseReady({ ...m, sayNo: "Extra meetings" }, { needSayNo: true }), true);
  assert.equal(a4.a4PromiseReady({ ...m, sure: "not-yet" }), false);
  assert.equal(a4.a4PromiseReady({ ...m, plan: "  " }), false);
});
test("A4 restore keeps screen and claim flags independently", () => {
  const state = copy(a4.EMPTY_A4); state.self.step = 3; state.self.every = "Keep this answer";
  a4.saveA4State(state);
  const restored = a4.loadA4State();
  assert.equal(restored.self.step, 3); assert.equal(restored.self.every, "Keep this answer");
  assert.equal(a4.a4MirrorsClaimed(restored), false);
  for (const key of a4.A4_MIRROR_KEYS) restored[key].claimed = true;
  assert.equal(a4.a4MirrorsClaimed(restored), true);
});
test("A4 malformed state is normalized without unlocking claims", () => {
  for (const raw of [null, {}, { self: { step: 999, claimed: "true" } }]) {
    const state = a4.normalizeA4(raw);
    assert.equal(state.self.claimed, false);
    assert.ok(state.self.step >= 0 && state.self.step <= 5);
  }
});
test("A5 plan requires 90-day goal, weekly commitment and days", () => {
  const p = copy(a5.EMPTY_A5_PLAN);
  assert.equal(a5.a5PlanDone(p), false);
  p.ninety = "Finish draft"; p.week = "Write twice";
  assert.equal(a5.a5PlanDone(p), false);
  p.days = ["Mon", "Thu"]; assert.equal(a5.a5PlanDone(p), true);
});
test("A5 all three plans and support sets gate continuation", () => {
  const s = copy(a5.EMPTY_A5);
  assert.equal(a5.a5ScreenReady(s, 1), false);
  for (const k of a5.A5_KEYS) s.plans[k] = { ...s.plans[k], ninety: "Goal", week: "Action", days: ["Mon"] };
  assert.equal(a5.a5ScreenReady(s, 1), true);
  assert.equal(a5.a5ScreenReady(s, 2), false);
  for (const k of a5.A5_KEYS) s.supports[k] = {
    person: { name: "Alex", from: "own" }, place: { name: "Office", from: "own" },
    system: { name: "Calendar", own: true },
  };
  assert.equal(a5.a5ScreenReady(s, 2), true);
  assert.equal(a5.a5ScreenReady(s, 3), true);
  s.plans.time.week = ""; assert.equal(a5.a5ScreenReady(s, 3), false);
});
test("A5 persistence restores exact screen without claiming", () => {
  const s = copy(a5.EMPTY_A5); s.step = 2; s.plans.self.week = "Preserved";
  a5.saveA5State(s);
  const restored = a5.loadA5State();
  assert.equal(restored.step, 2); assert.equal(restored.plans.self.week, "Preserved");
  assert.equal(restored.claimed, false);
});
test("A5 normalization clamps invalid screens and separates defaults", () => {
  assert.equal(a5.normalizeA5({ step: 999 }).step, 4);
  assert.equal(a5.normalizeA5({ step: -5 }).step, 0);
  const x = a5.normalizeA5(null); x.plans.self.week = "Changed";
  assert.equal(a5.normalizeA5(null).plans.self.week, "");
});
test("Vision all domains offer four tiers and sentence templates", () => {
  for (const lens of ["self", "time", "wealth"]) {
    assert.ok(vision.LENS_DOMAINS[lens].length > 0);
    for (const domain of vision.LENS_DOMAINS[lens]) {
      assert.ok(vision.SENTENCE_TEMPLATES[lens][domain]);
      for (const tier of [1, 2, 3, 4]) assert.equal(typeof vision.VISION_CHIPS[lens][domain][tier], "string");
    }
  }
});
test("Vision defaults keep future A/B independent and incomplete", () => {
  const v = copy(vision.EMPTY_VISION);
  assert.equal(v.twoFutures.complete, false);
  const d = vision.LENS_DOMAINS.time[0];
  v.twoFutures.futureA.time[d] = 4;
  assert.notEqual(v.twoFutures.futureB.time[d], 4);
  assert.notEqual(vision.EMPTY_VISION.twoFutures.futureA.time[d], 4);
});
test("Vision seeded shuffle is repeatable without mutating input", () => {
  const items = ["a", "b", "c", "d", "e"];
  const before = [...items];
  assert.deepEqual([...vision.shuffleSeeded(items, 42)], [...vision.shuffleSeeded(items, 42)]);
  assert.deepEqual(items, before);
});
console.log(`\n${passed} passed, ${failed} failed. Pure-state tests only; browser layout is separate.`);
process.exitCode = failed ? 1 : 0;
