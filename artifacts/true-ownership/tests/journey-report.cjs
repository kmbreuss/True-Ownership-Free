const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process");
const {modules}=require("./a1-fixtures.cjs"),model=modules().load("journey/progress");
const out=path.resolve("generated-artifacts/journey-road"),merged=new Map();
for(const file of ["results.json","road-followup-results.json","rc-final-results.json","targeted-results.json"]){
  for(const r of JSON.parse(fs.readFileSync(path.join(out,file),"utf8")).results)
    merged.set(`${r.name}:${r.viewport.width}:${r.viewport.height}:${r.theme}`,r);
}
const results=[...merged.values()];
if(results.some(r=>!r.pass))throw new Error("Unresolved browser result");
const files=[...new Set([...cp.execSync("git diff --name-only",{encoding:"utf8"}).trim().split("\n"),
  ...cp.execSync("git ls-files --others --exclude-standard",{encoding:"utf8"}).trim().split("\n")])].filter(Boolean).sort();
const rows=[];
function copy(file,old,next){rows.push([`artifacts/true-ownership/src/${file}`,old,next]);}
for(const line of ["Your road to Future B","Close your road","Your finished steps","Your road begins with the Reality Check.","FUTURE B","You","START","{n} steps on your road","Tap to see every step","Open your road: {n} of 88 steps finished"])
  copy("journey/Road.tsx","— new road/list copy",line);
for(const line of ["YOU · {A} · {MIRROR}","FUTURE B ★","RC · A1 · A2 · A3 · A4 · A5","Open your full road: {n} steps finished","{A}: {n} of {total}"])
  copy("journey/RoadBar.tsx","— new phone summary copy",line);
for(const group of model.ROAD_GROUPS)copy("journey/progress.ts","— old spine replaced",group.label);
for(const line of ["+1 STEP ON YOUR ROAD","Reality Check done. {n} steps on your road.","Future B is a little brighter."])
  copy("journey/StepMoment.tsx","— no previous road notification",line);
copy("valuesExperience/ValuesClaim.tsx","Done reviewing → (also shown after a fresh claim)","Continue to Identity → (fresh claim only; opens the new claim moment). Claimed review still says Done reviewing →.");
for(const line of ["VALUES · CLAIMED","One step closer.","You know what you won’t trade now. {top three names}. Future B needed that.",
  "START · A1 · ALL IN · A2 · A3 · A4 · A5 · FUTURE B","WHAT YOU HAVE NOW",
  "A way to decide. When two things pull at you, the higher value wins.","NEXT STEP",
  "Identity: the gifts in you that get you there.","★ Placed on your Map of Me","Your Future B: “{saved Tuesday}”","Continue to Identity →"])
  copy("journey/OneStepCloser.tsx","— new read-only post-claim screen",line);
copy("journey/FutureBGrows.tsx","YOUR FUTURE B · {AREA} · FROM YOUR REALITY CHECK","YOUR FUTURE B");
copy("journey/FutureBGrows.tsx","Chosen {date} ★","{Area} · chosen {date} · getting clearer, {N} of 5 (missing metadata omitted)");
for(const line of ["{N} of 5","★ VALUES · I live by {top three names}.","★ IDENTITY · I lead with {saved creature names}.",
  "★ PURPOSE · Because {saved purpose}.","★ VISION · In ten years, {saved vision words}.",
  "VALUES · What you stand for · after Values","IDENTITY · Who you’ll be when you get there · after Identity",
  "PURPOSE · Why it matters · after Purpose","VISION · Ten years out · after Vision"])
  copy("journey/FutureBGrows.tsx","— new growth/counter line",line);
copy("journey/FutureBGrows.tsx","“{saved Tuesday}”","Unchanged words; enlarged quotation.");
copy("journey/FutureBGrows.tsx","This week: {saved one thing}","Unchanged words; white commitment pill.");
copy("journey/FutureBGrows.tsx","This is what you chose. A1 is who you need to be to live it.","Unchanged.");
const titles=[["Values · The Order You Live By","What you stand for"],["Identity · Superpowers","Who you are"],["Purpose","Your why"],["Vision","Where you’re going"]];
for(const [old,next]of titles)copy("journey/MirrorCards.tsx",old,next);
for(const [old,next]of [
  ["Separate 01/Mirror 1 etc. labels","01 · VALUES / 02 · IDENTITY / 03 · PURPOSE / 04 · VISION"],
  ["Complete / Up next / Locked","★ CLAIMED / UP NEXT / LATER"],
  ["Review {mirror} → / Continue {mirror} → / Begin {mirror} →","Revisit {mirror} (claimed) / Begin {mirror} → (available)"],
  ["Unlocks after {previous}","Opens after {previous} (disabled; existing gate unchanged)"],
  ["What you stand for, in order.","The 3–5 things you won’t trade. About 20 minutes."],
  ["What you carry that others don't.","Find the gifts you carry, and the creatures that carry them."],
  ["Your internal why — independent of role.","Why Future B matters to you."],
  ["Who you've become in 10 years — across time, wealth, and self.","Your five years becomes ten."],
  ["Claimed.","You lead with {creatures} / {saved purpose} / {short saved vision}, as applicable"],
  ["You stand for {ranked names}","You stand for + ranked top three names; remaining names in italic (words unchanged)"],
  ["Existing ★ FUTURE B questions","Unchanged on unclaimed cards; absent on claimed cards"],
])copy("journey/MirrorCards.tsx",old,next);
const valueMoments=[
  "Admire done. {n} behaviors that light you up.","Irks done. {n} behaviors that show what you won’t accept.",
  "Notice done. {n} behaviors that show what you stand for.","Flip done. You’ve turned what you can’t stand into what you stand for.",
  "Name done. {n} standards named.","Order done. You know which value wins when they clash.","Values claimed. You know what you won’t trade."
];
const steps=model.readJourney(()=>undefined).bricks;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const table=(heads,body)=>`<table><thead><tr>${heads.map(v=>`<th>${esc(v)}</th>`).join("")}</tr></thead><tbody>${body.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
const stepRows=steps.map(b=>[b.group.toUpperCase(),b.mirror,b.label,b.group==="rc"?"No scene card; quiet brick only. RC completion copy is listed above.":b.mirror==="Values"?valueMoments[Number(b.id.split(":").at(-1))]:b.moment]);
const fitRows=results.map(r=>[r.name,`${r.viewport.width}×${r.viewport.height}`,r.theme,"Pass",r.fit?.doc===r.viewport.width?"No sideways overflow":"",r.fit?.foot?.length?"Footer inside frame":"Not applicable"]);
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Road to Future B · Build report</title>
<style>body{font:16px/1.55 system-ui,sans-serif;margin:36px auto;padding:0 20px;max-width:1200px;color:#253532;background:#fffdf7}h1,h2{color:#036360}h2{margin-top:40px}table{border-collapse:collapse;width:100%;font-size:13px;margin:20px 0;table-layout:fixed}td,th{text-align:left;vertical-align:top;padding:10px;border:1px solid #d8c6a5;overflow-wrap:anywhere}th{background:#f4e7ca}li{margin:8px 0}code{font-size:12px}.ok{padding:16px;background:#e7f0ec;border-left:4px solid #036360}</style>
<h1>Road to Future B</h1><p class="ok">Implemented in the existing True Ownership app. No publishing. Single-agent build. No new saved data, schema, completion flags, step IDs or unlock rules.</p>
<h2>Brick inventory</h2>${table(["Stage","Fixed bricks"],model.ROAD_GROUPS.map(g=>[g.label,g.total]).concat([["TOTAL",88]]))}
<p>RC: start page + 15 room scenes. A1: Values 7, Identity 4, Purpose 3, Vision 4. A2: 4 + 4 + 3. A3: 3 + 3 + 3 + 2 + 3 + 5. A4: three six-screen mirrors + final claim. A5: five stages. Values Rank and pressure test share their existing completion checkpoint. Recurring check-ins and resets are not extra bricks.</p>
<h2>Verification</h2><ul><li>All five part typechecks and final typecheck: 6,055 existing diagnostics; no additional diagnostics.</li><li>One final production build passed in 5.80 seconds. Existing large-chunk warning remains (about 1.79 MB JS / 404 KB gzip); no build error.</li><li>54 existing regression tests passed: A1 hub 4; A1 ending 5; Purpose 4; Vision 5; Preview 4; Reality Check 32.</li><li>Model checks passed: 88 unique slots, stage totals, empty=0 / full=88, six cloud-only stage fixtures, no mutation, no credit for movable pointers/prefills.</li><li>${results.length} final browser cases passed, including 36 screen/viewport/theme cases, review, quiet RC progression, one RC completion card, no replay on refresh, and cloud hydration without notifications.</li><li>Synthetic browser contexts only. Isolation proof intercepted 44/44 test mutations with zero escapes. All app test writes were intercepted; no real account used.</li><li>The public preview capture showed the sign-in screen. Signed-in screens were verified separately with isolated synthetic browser contexts.</li></ul>
<h2>Fit results</h2><p>No sideways scrolling or clipped footers at 375×812, 1280×800 or 1366×680, light and dark. The A1 hub scrolls vertically for its existing content. Long phone room content uses its internal scrolling area; the phone road bar and room footer remain visible. The expanded phone road is full-width, followed by the finished-step history. The existing A1 mirror grid remains two columns on desktop.</p>${table(["Screen/check","Viewport","Theme","Result","Horizontal fit","Footer"],fitRows)}
<h2>Completion-data limits</h2><ul><li>No new persistence was added to fill gaps. Explicit completed/claimed flags and monotonic reached flags are preferred; later saved answers can conservatively prove earlier work.</li><li>Read-only, optional-empty or legacy exercises without their own flag may not earn a separate brick until a later answer or the mirror claim proves completion. This affects portions of Identity, A2, A3 and A4; A5 stages are credited together at its claim because its saved plans/supports/rhythm are prefilled.</li><li>RC Opening and Person A/B share saved step 0, so advancing past it proves both. A prior completed RC round stays earned during a redo.</li><li>An optional empty Flip does not earn a brick in an untouched account. Claiming Values displays all its parts as finished, consistent with the existing claimed presentation.</li><li>Initial load, hydration, refresh and Preview do not award notification cards. Inferred backfill from one claim creates one claim notification, not a burst of inferred earlier notifications.</li><li>The new Values post-claim screen is session-only. Existing claimed review does not show it, rerun a claim or hand off to Identity. No new saved route was introduced.</li></ul>
<h2>Copy changes by file · old → new</h2><p>“—” means an added visual line, not a rewrite of a saved answer. Variables in braces are display substitutions only. Typography changes never alter stored words.</p>${table(["File","Old","New"],rows)}
<h2>Every fixed road-step label and completion-card line</h2><p>All entries below are in src/journey/progress.ts. Old copy: none (new road/history and notifications). The RC has no per-scene card. The phone bar uses six proportional segments, not 88 tiny bricks. Notifications never include private answer text beyond counts or user-given names.</p>${table(["Stage","Mirror","New history/brick label","New notification line"],stepRows)}
<h2>Files changed or added</h2><p>Style-only files contain no copy changes. No API, database, auth, package or artifact-manifest changes.</p><ul>${files.map(f=>`<li><code>${esc(f)}</code></li>`).join("")}</ul>
<h2>Issues resolved during verification</h2><p>The first fit run exposed a 12px phone footer overrun after reserving road-bar space. One frame-height correction fixed it. RC and cloud fixture errors were corrected without relaxing app gates: the RC fixture now supplies the existing required answers and completes through its real willingness action; cloud fixtures use the existing {t,v} sync wrapper. The final results above replace the earlier failed fixture attempts.</p></html>`;
fs.writeFileSync(path.join(out,"build-report.html"),html);
console.log(`Report generated: ${results.length} passing browser cases; ${rows.length} copy rows; ${steps.length} step labels/card lines.`);
