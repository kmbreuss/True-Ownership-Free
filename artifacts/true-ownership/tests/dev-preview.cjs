const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function environment(dev = true, search = "?preview=1") {
  const data = new Map([["unrelated", "keep exactly"]]);
  const session = new Map();
  const storage = (map) => ({
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  });
  const localStorage = storage(data), sessionStorage = storage(session);
  const calls = [];
  const location = { search, href: `http://localhost/${search}`, replace: (url) => calls.push(["reload", url]) };
  const context = vm.createContext({
    console, URL, URLSearchParams, Date, setTimeout, clearTimeout,
    localStorage, sessionStorage, location,
    window: { localStorage, sessionStorage, location },
    fetch: async (...args) => { calls.push(["fetch", ...args]); return { ok: true, json: async () => ({}) }; },
  });
  const cache = {};
  function load(name) {
    const file = path.resolve(__dirname, "../src", name.endsWith(".ts") ? name : `${name}.ts`);
    if (cache[file]) return cache[file].exports;
    const module = { exports: {} };
    cache[file] = module;
    const source = fs.readFileSync(file, "utf8").replaceAll("import.meta.env.DEV", String(dev));
    const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const run = vm.runInContext(`(function(require,module,exports){${js}\n})`, context);
    run((dep) => load(path.relative(path.resolve(__dirname, "../src"), path.resolve(path.dirname(file), dep))), module, module.exports);
    return module.exports;
  }
  return { load, data, session, calls, location };
}

test("preview state writers preserve byte-for-byte real storage and support ephemeral reads", () => {
  const e = environment();
  const before = JSON.stringify([...e.data]);
  for (const [file, save, read, empty] of [
    ["a2Constants", "saveA2State", "loadA2State", "EMPTY_A2"],
    ["a3Constants", "saveA3State", "loadA3State", "EMPTY_A3"],
    ["a4Constants", "saveA4State", "loadA4State", "EMPTY_A4"],
    ["a5Constants", "saveA5State", "loadA5State", "EMPTY_A5"],
    ["mirror4Constants", "saveMirror4State", "loadMirror4State", "EMPTY_MIRROR4"],
  ]) {
    const m = e.load(file);
    m[save](m[empty]);
    assert.ok(m[read]());
  }
  assert.equal(JSON.stringify([...e.data]), before);
  assert.equal(e.calls.length, 0);
});

test("startup reconciliation, notifications, imports and replacement cannot save in preview", async () => {
  const e = environment(), s = e.load("newFlowSync");
  const before = JSON.stringify([...e.data]);
  await s.hydrateNewFlow({ a2state: { t: Date.now(), v: { example: "server" } } });
  await s.autoPushLegacy({});
  s.markLocalChange("to_a2_state_v1");
  assert.equal(s.importLocalAnswers("{}").ok, false);
  assert.equal((await s.replaceAccountCopy({ sk: "map", lk: "to_map", fileValue: {} })).ok, false);
  assert.equal(JSON.stringify([...e.data]), before);
  assert.equal(e.calls.length, 0);
});

test("exit clears query/session flag and reloads; old-page callbacks stay blocked", () => {
  const e = environment(), p = e.load("devPreview");
  assert.equal(p.isDevPreview(), true);
  p.previewWrite("answer", '"temporary"');
  p.setDevPreview(false);
  assert.equal(e.session.has("to_dev_preview"), false);
  assert.deepEqual(e.calls, [["reload", "http://localhost/"]]);
  assert.equal(p.isDevPreview(), true); // Until unload; prevents late outgoing writes.
  const fresh = environment(true, "");
  assert.equal(fresh.load("devPreview").isDevPreview(), false);
  assert.equal(fresh.load("devPreview").previewRead("answer"), undefined);
});

test("production ignores query/session flag and retains real saves", () => {
  const e = environment(false);
  e.session.set("to_dev_preview", "1");
  const p = e.load("devPreview");
  assert.equal(p.isDevPreview(), false);
  p.setDevPreview(true);
  const a = e.load("a2Constants");
  a.saveA2State(a.EMPTY_A2);
  assert.equal(e.data.has("to_a2_state_v1"), true);
  assert.equal(e.calls.length, 0);
});
