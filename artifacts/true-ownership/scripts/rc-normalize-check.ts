// Answer-format checks for the free course. Run with tsx: pnpm exec tsx scripts/rc-normalize-check.ts
// 1) an answer saved before the course normalises exactly as it did at the baseline commit,
// 2) the new fields round-trip, are clamped, and unknown keys are dropped,
// 3) the 36 mirror statements are tagged three per pattern per area (12 keep their ids).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const src = path.join(here, "../src");
(globalThis as any).window ??= { addEventListener() {}, dispatchEvent() {}, location: { search: "" } };
(globalThis as any).sessionStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
(globalThis as any).localStorage ??= (globalThis as any).sessionStorage;
(globalThis as any).CustomEvent ??= class { constructor(public type: string) {} };

const ref = (() => { try { execFileSync("git", ["rev-parse", "--verify", "pre-free-1^{commit}"], { cwd: root, stdio: "ignore" }); return "pre-free-1"; } catch { return "0fea2a2"; } })();
// tsx has no Vite env, so the check works on temporary copies with import.meta.env fixed to production values.
const { mkdirSync, readFileSync } = await import("node:fs");
const tmp = path.join(src, "__rcCheck");
const fix = (text: string) => text.replaceAll("import.meta.env", '({ DEV: false, PROD: true, BASE_URL: "/" } as any)');
const baselineText = execFileSync("git", ["show", `${ref}:artifacts/true-ownership/src/rcConstants.ts`], { cwd: root, encoding: "utf8" });
for (const dir of ["now", "old"]) {
  mkdirSync(path.join(tmp, dir), { recursive: true });
  for (const f of ["syncHook.ts", "devPreview.ts"]) writeFileSync(path.join(tmp, dir, f), fix(readFileSync(path.join(src, f), "utf8")));
}
writeFileSync(path.join(tmp, "now", "rcConstants.ts"), fix(readFileSync(path.join(src, "rcConstants.ts"), "utf8")));
writeFileSync(path.join(tmp, "old", "rcConstants.ts"), fix(baselineText));
try {
  const now: any = await import(path.join(tmp, "now", "rcConstants.ts"));
  const old: any = await import(path.join(tmp, "old", "rcConstants.ts"));
  const legacyAnswers = [
    old.EMPTY_RC,
    { version: 2, step: 7, startedAt: "2026-10-01T00:00:00.000Z", focus: "time", focusChosenBy: "revealed", tuesday: "A Tuesday.", mirror: ["time-avoiding", "time-carrying", "bogus"],
      cost: { monthly: 50, hoursPerWeek: 12, moneyWhere: "x", hoursWhere: "y", you: "z", whoElse: "" }, futureB1: { doing: "d", oneThing: "o" }, complete: false },
    { version: 2, step: 13, startedAt: "2026-10-01T00:00:00.000Z", focus: "wealth", focusChosenBy: "changed", willing: "not-yet", notYetWhy: "later", choice: "B", complete: true },
  ];
  for (const answer of legacyAnswers) {
    const a = now.normalizeRC(answer), b = old.normalizeRC(answer);
    assert.deepEqual(a, b, "An answer saved before the course must normalise exactly as before.");
    for (const key of ["fcScreen", "pattern", "patternCounts", "patternChosenBy", "oneThing", "underneath", "underneathOther", "partIOwn", "futureAPath", "futureBPath", "futureBScene", "firstStep"]) assert(!(key in a), `Unexpected new field ${key} on an older answer.`);
  }
  const full = {
    version: 2, step: 12, fcScreen: 99, startedAt: "2026-11-01T00:00:00.000Z", focus: "time", focusChosenBy: "picked", pattern: "hoping",
    patternCounts: { avoiding: 1, blaming: 0, carrying: 2, hoping: 3 }, patternChosenBy: "tie-picked", oneThing: "my cash flow", underneath: "guilt", underneathOther: "", partIOwn: "I step in first.",
    mirror: ["time-hoping-2", "self-carrying-3", "nope"], futureAPath: { month: "m", year: "y", threeYears: "t" }, futureBPath: { month: "a", year: "b", threeYears: "c" },
    futureBScene: { morning: "morning:coffee", work: "work:team", family: "family:home", people: "people:real", money: "money:number", feels: ["feels:calm"], ownWords: "w" }, firstStep: "call", surprise: "dropped",
  };
  const n = now.normalizeRC(full);
  assert.equal(n.fcScreen, 26, "fcScreen is clamped to 26.");
  assert.equal(n.pattern, "hoping"); assert.equal(n.patternChosenBy, "tie-picked"); assert.equal(n.focusChosenBy, "picked");
  assert.deepEqual(n.patternCounts, full.patternCounts); assert.equal(n.oneThing, "my cash flow"); assert.equal(n.underneath, "guilt"); assert.equal(n.partIOwn, "I step in first.");
  assert.deepEqual(n.futureAPath, full.futureAPath); assert.deepEqual(n.futureBPath, full.futureBPath); assert.deepEqual(n.futureBScene, full.futureBScene); assert.equal(n.firstStep, "call");
  assert.deepEqual(n.mirror, ["time-hoping-2", "self-carrying-3"], "Valid new statement ids are kept, unknown ones dropped.");
  assert(!("surprise" in n), "Unknown keys are dropped.");
  assert.deepEqual(now.normalizeRC(n), n, "Normalising twice changes nothing.");
  // Older readers drop the new fields (they only know the baseline shape).
  const older = old.normalizeRC(full);
  assert(!("pattern" in older) && !("fcScreen" in older) && older.mirror.length === 0 && older.focusChosenBy !== "picked", "An older reader keeps the old fields and drops the new ones.");

  assert.equal(now.RC_MIRROR.length, 12); assert.equal(now.RC_MIRROR_ALL.length, 36);
  assert.deepEqual(now.RC_MIRROR_ALL.slice(0, 12), old.RC_MIRROR, "The original 12 statements and ids are unchanged.");
  for (const area of ["self", "time", "wealth"]) for (const pattern of ["avoiding", "blaming", "carrying", "hoping"])
    assert.equal(now.RC_MIRROR_ALL.filter((m: any) => m.area === area && m.default === pattern).length, 3, `${area} ${pattern} needs three statements.`);
  assert.equal(new Set(now.RC_MIRROR_ALL.map((m: any) => m.id)).size, 36, "Statement ids are unique.");
  console.log(JSON.stringify({ ok: true, baseline: ref, checks: "older answers identical, new fields round-trip and clamp, older reader drops them, 36 tagged statements" }));
} finally { rmSync(tmp, { recursive: true, force: true }); }
