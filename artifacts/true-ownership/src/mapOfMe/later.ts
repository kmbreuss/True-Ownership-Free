import { answer, list, section, text, type Answer, type EditTarget, type MapSection, type MapSources, type Stage } from "./model";
import { A4_MONEY_QUESTIONS } from "../a4Constants";

/** Keep explicit saved ratings visible when today's question builder no longer emits their item. */
export function alignmentScreens(src: MapSources) {
  const screens = [...(src.rateScreens || [])], seen = new Set(screens.flatMap(screen => list(screen.items).map(item => item.id)));
  const names = new Map<string, string>();
  for (const item of [...list(src.values?.admire), ...list(src.values?.irks)]) names.set(item.id, text(item.text));
  for (const gift of list(src.map?.mirror3?.pickedGifts)) names.set(gift.id, text(gift.label));
  for (const id of Object.keys(src.a2?.m1?.ratings || {})) {
    if (seen.has(id)) continue;
    const name = names.get(id) || "Saved alignment rating";
    screens.push({ kind: "value", sectionLabel: "Saved alignment", itemName: name,
      sectionIndex: 1, sectionCount: 1, items: [{ id, name, shadowWord: null, isKeystone: false }] });
  }
  return screens;
}

/** Current A2–A5 answers only. No legacy Map aliases, invented letters, or lowest-rating inference. */
export function laterSections(src: MapSources): MapSection[] {
  const out: MapSection[] = [];
  const add = (id: string, stage: Stage, title: string, mirror: string, kind: string,
    answers: Answer[], detail: Partial<EditTarget> = {}, empty?: string) => {
    out.push(section(id, stage, title, mirror, kind, answers, {
      target: { kind, stage, mirror, ...detail }, ...(empty ? { empty } : {}),
    }));
  };
  const a2 = src.a2 || {}, screens = alignmentScreens(src);
  const rateName = (id: string) => id === "purpose" ? text(src.map?.purpose_final)
    : screens.flatMap((s: any) => list(s.items)).find((item: any) => item.id === id)?.name || "";
  add("alignment-gap", "a2", "The gap to close", "Alignment Check", "alignment-gap", [
    answer("The gap to close", a2.m1?.bottleneck ? rateName(a2.m1.bottleneck) : ""),
    answer("Keep in focus", a2.m1?.keepInFocus ? rateName(a2.m1.keepInFocus) : ""),
  ]);
  screens.forEach((screen: any, i: number) => add(`alignment-ratings-${i}`, "a2",
    `Alignment · ${screen.itemName}`, "Alignment Check", "alignment-rate",
    screen.kind === "purpose" ? [answer("Purpose alignment", a2.m1?.purposeRating)]
      : list(screen.items).map(item => answer(item.name, a2.m1?.ratings?.[item.id])), { screen: i }));
  add("time-priorities", "a2", "Protecting · my priorities", "Time Audit", "time-priorities",
    list(a2.m2?.priorities).map(v => answer("Priority", v)));
  add("time-activities", "a2", "Where my time goes", "Time Audit", "time-activities", [
    answer("Awake hours each week", a2.m2?.activities?.length ? a2.m2.awakeHoursPerWeek : ""),
    ...list(a2.m2?.activities).flatMap(v => [
      answer("Activity", v.name), answer("Hours per week", v.hrsPerWeek),
      answer("How it feels", v.feeling), answer("Priority served", v.priorityServed),
    ]),
  ]);
  add("time-missing", "a2", "What is missing", "Time Audit", "time-missing",
    list(a2.m2?.missingItems).flatMap(v => [answer("Missing", v.name), answer("Priority", v.priorityTag)]));
  add("truth-intentions", "a2", "My intentions", "Named Truth", "truth-intentions",
    Object.entries(a2.m3?.intentMap || {}).map(([name, value]) => answer(name, value)));
  add("truth-decisions", "a2", "My time decisions", "Named Truth", "truth-decisions", [
    ...Object.entries(a2.m3?.activityDecisions || {}).flatMap(([id, value]: [string, any]) => {
      const name = list(a2.m2?.activities).find(v => v.id === id)?.name;
      return name ? [answer(name, value.decision), answer("Hours", value.newHrs), answer("Who or what takes the rest", value.who)] : [];
    }),
    ...Object.entries(a2.m3?.missingAssignments || {}).map(([id, value]) =>
      answer(list(a2.m2?.missingItems).find(v => v.id === id)?.name || "Missing time", value)),
    ...list(a2.m3?.priorityCommitments).flatMap(v => [
      answer("Priority", v.priority), answer("Activity", v.activity), answer("Hours", v.addedHrs),
    ]),
  ]);
  add("truth-move", "a2", "My move", "Named Truth", "truth-move", [
    answer("My move", a2.m3?.moveText), answer("My reflection", a2.m3?.selfFeedback),
  ]);
  const a3 = src.a3 || {};
  add("people-names", "a3", "People · my inner circle", "People", "people-names",
    list(a3.m1?.names).map(name => answer("Person", name)));
  add("people-ratings", "a3", "My advocates", "People", "people-ratings",
    list(a3.m1?.names).map(name => answer(name, a3.m1?.ratings?.[name])));
  add("environment-items", "a3", "My habits and places", "Environment", "environment-items",
    list(a3.m2?.items).map(v => answer(v.kind === "habit" ? "Habit" : "Place", v.name)));
  add("environment-ratings", "a3", "What helps me", "Environment", "environment-ratings",
    list(a3.m2?.items).map(v => answer(v.name, v.rating)));
  list(a3.m3?.thoughts).forEach((thought, i) => add(`thought-moment-${i}`, "a3",
    `My thought · ${i + 1}`, "Thoughts", "thought-moment", [answer("My thought", thought.text)], { screen: i }));
  add("thoughts", "a3", "My thoughts and reframes", "Thoughts", "thoughts",
    list(a3.m3?.thoughts).flatMap(v => [
      answer("Thought", v.text), answer("The voice", v.verdict), answer("My reframe", v.reframe),
    ]));
  add("thought-voice", "a3", "The voice I want", "Thoughts", "thought-voice", [
    answer("The voice now", a3.m3?.voiceNow), answer("The voice I want", a3.m3?.voiceWant),
  ]);
  add("energy-people", "a3", "What lifts me · people", "People", "people-ratings",
    list(a3.m1?.names).filter(name => a3.m1?.ratings?.[name] === "advocate").map(v => answer("Advocate", v)));
  add("energy-environment", "a3", "What lifts me · habits and places", "Environment", "environment-ratings",
    list(a3.m2?.items).filter(v => v.rating === "advocate").map(v => answer("What helps", v.name)));
  add("energy-thoughts", "a3", "What lifts me · thoughts", "Thoughts", "thoughts",
    list(a3.m3?.thoughts).filter(v => v.verdict === "coach").flatMap(v => [
      answer("Coach", v.text), answer("My reframe", v.reframe),
    ]));
  const seats = list(a3.m5?.seats);
  if (!seats.length) add("board", "a3", "At my table", "The Board", "board", []);
  seats.forEach((v, i) => add(`board-${i}`, "a3", `At my table · ${text(v.role) || `seat ${i + 1}`}`,
    "The Board", "board", [answer("Role", v.role), answer("What I need", v.desc),
      answer("Person", v.name), answer("In my life", v.inLife)], { screen: i }));
  for (const lane of ["person", "env", "thought"]) add(`move-${lane}`, "a3",
    `My next move · ${lane === "env" ? "environment" : lane}`, "The Move", "move-pick",
    [answer("My choice", a3.m6?.[lane])], { part: lane });
  add("move-bottleneck", "a3", "My one move", "The Move", "move-bottleneck", [
    answer("My one move", a3.m6?.bottleneck ? a3.m6[a3.m6.bottleneck] : ""),
  ]);
  for (const area of ["self", "time", "wealth"]) {
    const name = area[0].toUpperCase() + area.slice(1), m = src.a4?.[area] || {};
    add(`a4-${area}-gap`, "a4", `${name} · my gap`, name, "a4-gap", [
      answer("My gap", m.gap?.said), answer("The evidence", m.gap?.evidence),
    ], { part: area });
    add(`a4-${area}-name`, "a4", `${name} · what I prove`, name, "a4-name", [
      answer("Every time I", m.every), answer("I prove to myself", m.prove),
    ], { part: area });
    add(`a4-${area}-promise`, "a4", `${name} · my promise`, name, "a4-promise", [
      answer("I will", m.will), answer("When", m.when), answer("I will say no to", m.sayNo),
    ], { part: area });
    add(`a4-${area}-year`, "a4", `1-year · ${name}`, name, "a4-year", [
      answer("A year from now", m.year), answer("Keeping this gives me", m.gives),
    ], { part: area });
    add(`a4-${area}-plan`, "a4", `${name} · my obstacle and plan`, name, "a4-plan", [
      answer("What might stop me", m.stop), answer("When that happens, I will", m.plan),
      answer("How sure I am", m.sure),
    ], { part: area });
    const plan = src.a5?.plans?.[area], support = src.a5?.supports?.[area];
    add(`a5-${area}-plan`, "a5", `This week · ${name}`, "My Commitment", "a5-plan", [
      answer("In 90 days", plan?.ninety), answer("By", plan?.ninetyBy),
      answer("This week", plan?.week), answer("Days", list(plan?.days).join(" · ")), answer("Time", plan?.time),
    ], { part: area });
    add(`a5-${area}-supports`, "a5", `My support · ${name}`, "My Commitment", "a5-supports", [
      answer("Person", support?.person?.name), answer("Place", support?.place?.name),
      answer("System", support?.system?.name),
    ], { part: area });
  }
  const rhythm = src.a5?.rhythm;
  add("a5-rhythm", "a5", "My check-in rhythm", "My Commitment", "a5-rhythm",
    src.a5?.claimed || Object.values(src.a5?.plans || {}).some((p: any) => p.week || p.ninety) ? [
      answer("Check-in day", rhythm?.checkinDay), answer("Check-in time", rhythm?.checkinTime),
      answer("Person day", rhythm?.personDay), answer("Reminder day", rhythm?.reminderDay), answer("Reminder time", rhythm?.reminderTime),
    ] : []);
  // Each record links back to that exact week, not the current week's editor.
  const checkins = [...list(src.a5?.checkins)].sort((a, b) => text(b.date).localeCompare(text(a.date)));
  if (!checkins.length) add("a5-checkin", "a5", "Weekly Check-In", "Weekly Check-In", "a5-checkin", [], {},
    "Fills in after your first A5 weekly check-in");
  for (const record of checkins) add(`a5-checkin-${record.week}`, "a5", `Last check-in: ${record.date}`,
    "Weekly Check-In", "a5-checkin", ["self", "time", "wealth"].flatMap(area => [
      answer(`${area} · did I do what I committed to?`, record.entries?.[area]?.kept),
      answer(`${area} · did my support help?`, record.entries?.[area]?.supportHelped),
    ]), { id: record.week });
  const reset = src.a5?.reset90;
  add("a5-lookback", "a5", "Next 90 days", "90-Day Look-Back", "a5-lookback",
    reset ? ["self", "time", "wealth"].flatMap(area => [
      answer(area, reset.choices?.[area]), answer("My 90-day plan", src.a5?.plans?.[area]?.ninety),
    ]) : [], {}, "Fills in after your first A5 90-day look-back");
  add("a4-money", "a4", "My money check", "Wealth", "a4-money",
    A4_MONEY_QUESTIONS.map((question, i) => answer(question, src.a4?.wealth?.moneyCheck?.[String(i)])),
    { part: "wealth" });
  return out;
}
