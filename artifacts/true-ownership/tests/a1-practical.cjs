const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const vm = require("node:vm"), ts = require("typescript");
const root = path.resolve(__dirname, "../src");
const cloud = new Map(), requests = [];
function device(owner) {
  const data = new Map(), cache = {}, events = [];
  let preview = false, change = () => {};
  const localStorage = { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), removeItem: k => data.delete(k) };
  const context = vm.createContext({ console, Date, URLSearchParams, Event, structuredClone,
    location: { search: "", origin: "https://synthetic.invalid" }, localStorage,
    setTimeout: () => 1, clearTimeout() {}, window: { localStorage, dispatchEvent: e => events.push(e.type) },
    fetch: async (url, options) => {
      assert(!preview, "Preview cannot reach cloud");
      const key = url.split("/").pop(), incoming = JSON.parse(options.body).value;
      requests.push({ owner, key });
      const saved = cloud.get(owner) || {}, guard = load(path.resolve(root, "../../api-server/src/lib/syncGuard.ts"));
      assert(guard.SYNC_KEYS.has(key));
      const result = guard.decideWrite(saved[key], incoming, Date.now());
      if (result.action === "conflict") return { status: 409, ok: false, json: async () => ({ current: result.current }) };
      saved[key] = result.value; cloud.set(owner, saved);
      return { status: 200, ok: true, json: async () => ({ ok: true, t: result.value.t }) };
    } });
  function load(file) {
    if (!path.isAbsolute(file)) file = path.resolve(root, file + ".ts");
    if (file.endsWith("/devPreview.ts")) return { isDevPreview: () => preview, previewRead: () => null };
    if (file.endsWith("/syncHook.ts")) return { notifyLocalChange: k => change(k), setChangeHandler: fn => { change = fn; } };
    if (cache[file]) return cache[file].exports;
    const mod = { exports: {} }; cache[file] = mod;
    const source = fs.readFileSync(file, "utf8").replaceAll("import.meta.env.DEV", "true");
    const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInContext(`(function(require,module,exports){${js}\n})`, context)(dep => load(path.resolve(path.dirname(file), dep + ".ts")), mod, mod.exports);
    return mod.exports;
  }
  return { data, load, setPreview: value => { preview = value; } };
}
const plain = x => JSON.parse(JSON.stringify(x));
async function main() {
  const a = device("synthetic-a"), p = a.load("a1End/practical"), sync = a.load("newFlowSync");
  assert.equal(sync.STORES.filter(s => s.sk === "a1practical").length, 1);
  await sync.hydrateNewFlow({});
  assert.equal(requests.length, 0, "Empty defaults do not upload");
  a.data.set("to_rc_state_v1", JSON.stringify({ futureB1: { oneThing: "My original words" } }));
  const original = a.data.get("to_rc_state_v1");
  p.savePractical({ balanceByCreatureId: { lion: "lot", dolphin: "behind" },
    balanceIntent: { lotCreatureId: "lion", behindCreatureId: "dolphin", answer: "no" },
    tryAnswersByCreatureId: { dolphin: "Start with a win", owl: "Ask a question" },
    sharpenedOneThing: "An hour on Thursday" });
  await sync.hydrateNewFlow({});
  assert(cloud.get("synthetic-a").a1practical);
  const b = device("synthetic-a"), pb = b.load("a1End/practical");
  await b.load("newFlowSync").hydrateNewFlow(cloud.get("synthetic-a"));
  assert.deepEqual(plain(pb.loadPractical()), plain(p.loadPractical()), "Second device loads every answer");
  assert.equal(a.data.get("to_rc_state_v1"), original);
  const other = device("synthetic-b"); await other.load("newFlowSync").hydrateNewFlow({});
  assert.equal(other.data.get(p.PRACTICAL_KEY), undefined, "Other account never receives this store");
  sync.bindPracticalAccount("synthetic-a");
  const ownCopy = a.data.get(p.PRACTICAL_KEY);
  sync.bindPracticalAccount("synthetic-b");
  assert.equal(a.data.get(p.PRACTICAL_KEY), undefined, "Same-browser account switch cannot inherit another member's answers");
  sync.bindPracticalAccount(null);
  sync.bindPracticalAccount("synthetic-a");
  assert.equal(a.data.get(p.PRACTICAL_KEY), ownCopy, "Unsent local answers survive logout/login");
  const creatures = ["lion", "owl", "dolphin"].map(id => ({ id, name: id, animal: id, emoji: "", power: "", gifts: [id + " gift"] }));
  const state = p.loadPractical();
  assert.equal(p.resolveTry(state, creatures).creature.id, "dolphin");
  assert.equal(p.weeklyProjection(state, creatures, "original", "Hope").try, "Start with a win");
  assert.equal(p.resolveTry({ ...state, balanceByCreatureId: { lion: "lot", owl: "right" } }, creatures).creature.id, "owl");
  assert.equal(p.resolveTry({ ...state, balanceByCreatureId: {} }, creatures).creature, undefined);
  assert.equal(p.resolveTry({ ...state, balanceByCreatureId: { lion: "right", owl: "right", dolphin: "right" } }, creatures).creature, undefined);
  assert.equal(p.resolveTry(state, [creatures[0]]).creature.id, "lion");
  assert.throws(() => p.normalizePractical({ version: 1, balanceByCreatureId: { lion: "wrong" } }));
  assert.deepEqual(plain(p.normalizePractical(plain(state))), plain(state));
  const before = [...a.data], count = requests.length;
  a.setPreview(true); assert.equal(p.savePractical({ sharpenedOneThing: "Never save this" }), false);
  await sync.hydrateNewFlow(cloud.get("synthetic-a"));
  assert.deepEqual([...a.data], before); assert.equal(requests.length, count);
  console.log("PASS: complete round trip, empty-store safety, account separation, Try fallbacks, per-creature text, RC unchanged, zero Preview writes (controlled cloud harness).");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
