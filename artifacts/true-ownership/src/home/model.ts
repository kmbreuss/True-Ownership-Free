import { M4_ROOMS, m4RoomDone } from "../mirror4Constants";
import { M3_ROOMS } from "../mirror3Constants";
import { identitySteps } from "../remainingTime";
import { purposeSteps } from "../purposeProgress";
import { a1Started, a1Unlocks } from "../a1Progress";
import type { ReadProgress } from "../journey/progress";
import type { VideoSurface } from "../videoConstants";

export interface HomeStep {
  id: string; title: string; description: string; view: string; part?: string;
  minutes?: number; surface?: VideoSurface;
}
/** Read current evidence only; no seeds, timestamps, claims or progress writes. */
export function homeProjection(read: ReadProgress, options: { rcRequired: boolean; freeLocked: boolean; a2: boolean; a3: boolean; preview: boolean }) {
  const map = read("to_map") || {}, values = read("to_mirror4_state_v1"), rc = read("to_rc_state_v1") || {};
  const identity = map.mirror3 || {}, vision = map.vision || {};
  const purpose = { ex2: !!read("a1_ex2_done"), ex3: !!read("a1_ex3_done"), ex4: !!read("a1_ex4_done") };
  const complete = { values: !!values?.claimed, identity: !!identity.sealCompleted,
    purpose: purposeSteps(purpose).every(Boolean), vision: !!vision.complete };
  const access = a1Unlocks(!options.rcRequired, a1Started(read, values), complete, options.preview);
  const a1 = Object.values(complete).every(Boolean);
  const a2 = read("to_a2_state_v1") || {}, a3 = read("to_a3_state_v1") || {}, a4 = read("to_a4_state_v1") || {}, a5 = read("to_a5_state_v1") || {};
  const claims: { name: string; date: number }[] = [];
  const claim = (name: string, done: boolean, date: unknown) => {
    const time = typeof date === "string" ? Date.parse(date) : NaN;
    if (done && Number.isFinite(time) && time <= Date.now()) claims.push({ name, date: time });
  };
  claim("Values", complete.values, values?.claimedAt);
  claim("Identity", complete.identity, identity.sealCompletedAt);
  claim("Vision", complete.vision, vision.declaration?.claimedAt);
  const candidates: (HomeStep & { done: boolean; accessible: boolean })[] = [];
  const add = (s: HomeStep, done: boolean, accessible: boolean, date?: unknown) => {
    candidates.push({ ...s, done, accessible }); claim(s.title, done, date);
  };
  const valuesPart = values && M4_ROOMS.find(r => !r.comingSoon && !m4RoomDone(values, r.key))?.key || "admire";
  add({ id:"a1-values", title:"Values", description:"What you stand for.", view:"m4", part:valuesPart, minutes:20, surface:"m4-hub" },complete.values,access.values);
  add({ id:"a1-identity", title:"Identity", description:"The gifts you carry, and the creatures that carry them.", view:"m3",
    part:M3_ROOMS[Math.max(0,identitySteps(identity).findIndex(done => !done))]?.key || "yourGifts", surface:"m3-hub" },complete.identity,access.identity);
  add({ id:"a1-purpose", title:"Purpose", description:"Why Future B matters to you.", view:"explore",
    part:["to","peel","declare"][Math.max(0,purposeSteps(purpose).findIndex(done => !done))], surface:"m1-hub" },complete.purpose,access.purpose);
  add({ id:"a1-vision", title:"Vision", description:"Where you’re going in ten years.", view:"explore2",
    part:!vision.time_complete ? "time" : !vision.wealth_complete ? "wealth" : !vision.self_complete ? "self" : "declaration", surface:"m2-hub" },complete.vision,access.vision);
  const a2Names = ["Alignment Check","Time Audit","Named Truth"], a2Parts = ["alignment","timeaudit","namedtruth"];
  a2Names.forEach((title,i) => add({id:["a2-alignment-check","a2-time-audit","a2-named-truth"][i],title,
    description:["What matters, and how you’re living it.","Where your hours actually go.","The one thing your time is telling you."][i],
    view:`a2m${i+1}`,part:a2Parts[i]},!!a2[`m${i+1}`]?.claimed,
    options.a2 && (i===0 ? a1 : Array.from({length:i},(_,j)=>a2[`m${j+1}`]?.claimed).every(Boolean)),a2[`m${i+1}`]?.claimedAt));
  const a2Done = [1,2,3].every(i=>a2[`m${i}`]?.claimed);
  ["People","Environment","Thoughts","Energy Map","The Board","The Move"].forEach((title,i) => add({
    id:["a3-people","a3-environment","a3-thoughts","a3-energy-map","a3-the-board","a3-the-move"][i],title,
    description:["Who lifts you, and who drains you.","The places and habits that surround you.","The voice you want to live with.","What lifts your energy.","The people at your table.","Your one move forward."][i],
    view:`a3m${i+1}`,part:["people","environment","thoughts","energymap","board","move"][i]},
    !!a3[`m${i+1}`]?.claimed,options.a3 && a1 && a2Done && Array.from({length:i},(_,j)=>a3[`m${j+1}`]?.claimed).every(Boolean),a3[`m${i+1}`]?.claimedAt));
  const a3Done = [1,2,3,4,5,6].every(i=>a3[`m${i}`]?.claimed);
  ["self","time","wealth"].forEach((key,i)=>add({id:`a4-${key}`,title:`${key[0].toUpperCase()}${key.slice(1)}`,
    description:"The promise you will live.",view:`a4m${i+1}`,part:key},!!a4[key]?.claimed,
    i===0 ? a3Done : !!a4[["self","time"][i-1]]?.claimed,a4[key]?.claimedAt));
  add({id:"a4-promises",title:"My Promises",description:"The promises you’re making to yourself.",view:"a4p",part:"promises"},
    !!a4.a4?.claimed,["self","time","wealth"].every(k=>a4[k]?.claimed),a4.a4?.claimedAt);
  add({id:"a5-commitment",title:"My Commitment",description:"Your plan, your supports, your rhythm.",view:"a5m1",part:"keeping"},
    !!a5.claimed,!!a4.a4?.claimed,a5.claimedAt);
  const next: HomeStep | undefined = options.rcRequired ? {id:"rc",title:"Reality Check",description:"Where you are now, and where it leads.",view:"rcroom",surface:"rc-intro"}
    : options.freeLocked ? undefined : candidates.find(c=>!c.done && c.accessible);
  claims.sort((a,b)=>b.date-a.date);
  return { next, finished:candidates.every(c=>c.done), latestClaim:claims[0]?.name,
    availableSurfaces:new Set<VideoSurface>(["entry-hall","framework","rc-intro","rc-eyes",
      ...candidates.filter(c=>c.accessible && !options.freeLocked).flatMap(c=>c.surface ? [c.surface] : [])]),
    a1Complete:a1, rcComplete:!!rc.complete, a5Claimed:!!a5.claimed };
}
