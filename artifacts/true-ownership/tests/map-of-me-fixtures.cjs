const { fixtures, modules, plain } = require("./a1-fixtures.cjs");
function mapFixture() {
  const { load } = modules(), f = fixtures(), m3 = load("mirror3Constants"), rc = load("rcConstants");
  const theme = Object.keys(m3.GIFTS_BY_THEME)[0];
  const creatures = ["Owl", "Bear"].map((animal, i) => ({
    id: `c_${i}`, name: animal, nameWasEdited: true, animal, animalEmoji: ["🦉", "🐻"][i],
    descriptorWord1: ["Clear", "Steady"][i], descriptorWord2: ["Wise", "Kind"][i],
    giftIds: [`g_custom_${i}`], superpower: { blank1: `I see possibilities ${i}`,
      blank2: `I make space ${i}`, blank3: `I help others ${i}` },
  }));
  const pickedGifts = creatures.map((c, i) => ({ id: c.giftIds[0], label: ["Sees possibilities", "Makes space"][i],
    theme, state: "owned", custom: true, manuallyPlaced: true }));
  const names = ["Integrity", "Own It", "Hope", "Love", "Evolve"];
  const admire = names.map((name, i) => ({ id: `ad-${i}`, text: `My behavior for ${name}`, person: "",
    tier: "lights", inUseByCluster: `cl-${i}` }));
  const clusters = names.map((name, i) => ({ id: `cl-${i}`, userName: name, userDefinition: `My own meaning of ${name}`,
    proposal: "", proposedNames: [], behaviorIds: [`ad-${i}`], keystoneBehaviorId: `ad-${i}`,
    flips: [], peelChain: [], status: "complete", colorIndex: i % 3 + 1 }));
  const identity = { ...f.identity, clusters: creatures, pickedGifts, sealCompleted: true,
    sealCompletedAt: "2026-11-08T12:00:00Z",
    shadows: Object.fromEntries(pickedGifts.map(g => [g.id, { pickedShadows: ["Overthinking"], primaryShadow: "Overthinking" }])),
    shadowStories: Object.fromEntries(creatures.map(c => [c.id, { blank1: `overthink as ${c.animal}`,
      blank2: "my peace", blank3: "their patience" }])) };
  const vision = { ...f.vision, complete: true, time_complete: true, wealth_complete: true, self_complete: true };
  const vc = load("mirror2Constants");
  for (const area of ["time", "wealth", "self"]) for (const domain of vc.LENS_DOMAINS[area]) {
    vision[area][domain] = { blank1: `My ${area} ${domain} first full answer`,
      blank2: `My ${area} ${domain} second full answer` };
    vision.twoFutures.futureB[area][domain] = 3;
    vision.twoFutures.futureA[area][domain] = 1;
  }
  vision.twoFutures.complete = true; vision.twoFutures.futureA_complete = true;
  vision.twoFutures.futureB_complete = true;
  vision.declaration.claimedAt = "2026-11-08T12:00:00Z";
  const mirror = rc.RC_MIRROR.filter(row => row.area === "time").slice(0, 4).map(row => row.id);
  const reality = { ...f.rc, mirror, ...plain(rc.mirrorCounts(mirror)), focus: "time",
    tuesday: "I am doing everyone else's work.", willing: "yes",
    cost: { monthly: 115, hoursPerWeek: 10, moneyWhere: "Missed opportunities", hoursWhere: "My evenings",
      you: "My calm", whoElse: "My family" },
    futureA: { extra: "Still rushing." }, compound: { feels: ["Tired"], results: "No time for me.", whoElse: "My family" },
    futureB5: { feels: ["Calm"], tuesday: "I have time to think and enough left for myself.", whoNotices: "My family" },
    futureB1: { doing: "Making deliberate choices.", oneThing: "Protect one evening." } };
  const values = { ...f.values, admire, clusters, rank: clusters.map(c => c.id), claimed: true,
    claimedAt: "2026-11-08T12:00:00Z", status: "complete",
    discoverSections: { admire: true, irks: true, portrait: true },
    pressureTest: { ...f.values.pressureTest, complete: true } };
  return {
    to_map: { purpose_final: "To help people see their possibilities.", purpose_seededFrom: "To help people see their possibilities.",
      purpose_layers: ["To help people see their possibilities."], mirror3: identity, vision,
      val_0_name: "WRONG LEGACY VALUE", animals: [{ name: "WRONG LEGACY CREATURE" }],
      threeyr_growth_sentence: "NEVER SHOW RETIRED THREE YEAR", a2_fsl_s1: "NEVER SHOW RETIRED LETTER",
      a3_best_friend: "NEVER SHOW RETIRED BEST FRIEND" },
    to_mirror4_state_v1: values, to_rc_state_v1: reality,
    a1_ex1_done: true, a1_ex2_done: true, a1_ex3_done: true, a1_ex4_done: true,
    a1_sym_holdback: "I held back my own voice.",
    a1_notice: { value: "Integrity", lived: "I said no clearly.", didnt: "I overcommitted once.", savedAt: "2026-11-08T12:00:00Z" },
  };
}
module.exports = { mapFixture };
function allStagesFixture() {
  const data = mapFixture(), { load } = modules();
  const a2 = plain(load("a2Constants").EMPTY_A2), a3 = plain(load("a3Constants").EMPTY_A3);
  const a4 = plain(load("a4Constants").EMPTY_A4), a5 = plain(load("a5Constants").EMPTY_A5);
  const at = "2026-11-08T12:00:00Z";
  for (const state of [a2.m1, a2.m2, a2.m3, ...Object.values(a3), a4.self, a4.time, a4.wealth, a4.a4, a5]) {
    state.claimed = true; state.claimedAt = at;
  }
  a2.m1.bottleneck = "purpose"; a2.m1.purposeRating = 6;
  a2.m1.ratings = { g_custom_0: 3, g_custom_1: 4, "ad-0": 3 };
  a2.m2.priorities = ["Family", "Health"]; a2.m2.awakeHoursPerWeek = 112;
  a2.m2.activities = [{ id: "act-1", name: "Long meetings", hrsPerWeek: 18, feeling: "dislike", priorityServed: "Family" }];
  a2.m2.missingItems = [{ id: "missing-1", name: "Evening walks", priorityTag: "Health" }];
  a2.m3.intentMap = { Family: "yes", Health: "no" };
  a2.m3.activityDecisions = { "act-1": { decision: "reduce", newHrs: 10, who: "A shorter agenda" } };
  a2.m3.missingAssignments = { "missing-1": 3 };
  a2.m3.priorityCommitments = [{ priority: "Health", addedHrs: 3, activity: "Evening walks" }];
  a2.m3.moveText = "Protect Friday evening."; a2.m3.selfFeedback = "I can make room.";
  a3.m1.names = ["Morgan", "Jamie"]; a3.m1.ratings = { Morgan: "advocate", Jamie: "anchor" };
  a3.m2.items = [{ name: "Walking", kind: "habit", rating: "advocate" }, { name: "Clutter", kind: "place", rating: "anchor" }];
  a3.m3.thoughts = [{ text: "I can learn.", verdict: "coach", reframe: "" },
    { text: "I am never ready.", verdict: "critic", reframe: "One small step is enough." }];
  a3.m3.voiceNow = "A demanding critic."; a3.m3.voiceWant = "A patient coach.";
  a3.m5.seats = Array.from({ length: 6 }, (_, i) => ({ role: `Role ${i + 1}`, desc: `My need ${i + 1}`,
    name: i === 5 ? "Selected sixth seat" : `Advocate ${i + 1}`, inLife: "life" }));
  a3.m6 = { ...a3.m6, person: "Jamie", env: "Clutter", thought: "I am never ready.", bottleneck: "person" };
  for (const key of ["self", "time", "wealth"]) {
    Object.assign(a4[key], { picked: "own", own: { kind: "behavior", said: `My ${key} gap`, evidence: "My saved evidence" },
      gap: { id: "own", kind: "behavior", tag: "", said: `My ${key} gap`, evidence: "My saved evidence", source: "Your own words" },
      every: "I rush", prove: "My priorities wait", will: `protect an hour for ${key}`, when: "Friday",
      year: `My ${key} evenings are mine.`, gives: "Calm.", stop: "Meetings", plan: "Block the calendar", sure: "yes" });
    a5.plans[key] = { ninety: `My ${key} ninety-day answer`, ninetyBy: "2027-02-06", week: `My ${key} weekly answer`,
      days: ["Mon"], time: "18:00" };
    a5.supports[key] = { person: { name: "Morgan", from: "own" }, place: { name: "The park", from: "own" },
      system: { name: "My calendar", own: true } };
  }
  a4.wealth.moneyCheck = Object.fromEntries(Array.from({ length: 5 }, (_, i) => [String(i), "Sometimes"]));
  a5.checkins = [{ week: "2026-11-02", date: "2026-11-08", at,
    entries: Object.fromEntries(["self", "time", "wealth"].map(key => [key,
      { kept: "partly", gotInWay: "PRIVATE OBSTACLE NOT FOR MAP", supportHelped: "yes" }])) }];
  a5.reset90 = { at, next: "2027-02-06", choices: { self: "keep", time: "grow", wealth: "keep" } };
  return { ...data, to_a2_state_v1: a2, to_a3_state_v1: a3, to_a4_state_v1: a4, to_a5_state_v1: a5 };
}
module.exports.allStagesFixture = allStagesFixture;
