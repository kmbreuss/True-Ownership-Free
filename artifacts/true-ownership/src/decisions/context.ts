import type { ContextRow } from "../../../../lib/decision-model";
import { a1Sections, type MapSources } from "../mapOfMe/model";
export function decisionContext(src: MapSources, claimed: {values:boolean;identity:boolean;purpose:boolean;vision:boolean}) {
  const sections=a1Sections(src);
  const words=(prefix:string)=>sections.filter(s=>s.id.startsWith(prefix)).flatMap(s=>s.answers.map(a=>a.text)).join(" · ");
  const creatures=(src.map?.mirror3?.clusters || []).map((c:any)=>({id:c.id,name:[c.animalEmoji,c.descriptorWord1,c.descriptorWord2,c.animal].filter(Boolean).join(" ")}));
  const rows:ContextRow[]=[];
  const definitions=[
    ["values","Values","Does this honour what you stand for?",sections.find(s=>s.id==="values-rank")?.ranked?.slice(0,3).join(" · ") || ""],
    ["identity","Identity","Does it use your gifts, or call on the creature you always lean on?",creatures.map((c:any)=>c.name).join(" · ")],
    ["purpose","Purpose","Does it serve your why?",words("purpose")],
    ["vision","Vision","Does it move you toward your Future B?",src.rc?.choice==="B" ? src.rc?.futureB5?.tuesday || words("vision-") : words("vision-")],
  ];
  for(const [id,label,question,context] of definitions) if(claimed[id as keyof typeof claimed]) rows.push({id:`allIn.${id}`,label:`All In · ${label}`,question,words:context || ""});
  if(Object.values(claimed).some(v=>!v)) rows.push({id:"allIn.general",label:"All In",question:"Am I truly all in on this, or here by default?",words:"",general:true});
  rows.push({id:"align",label:"Align To It",question:src.a2?.m2?.claimed
    ? "Does this fit what you said your time is for? What would it take time from?"
    : "Is this aligned to who I am and what I want, or to everyone else's expectations?",
    words:src.a2?.m2?.claimed ? (src.a2.m2.priorities || []).join(" · ") : ""});
  rows.push({id:"advocate.people",label:"Advocate · People",question:"Who will this put you around?",
    words:src.a3?.m1?.claimed ? (src.a3.m1.names || []).filter((n:string)=>src.a3?.m1?.ratings?.[n]==="advocate").join(" · ") : ""});
  rows.push({id:"advocate.environment",label:"Advocate · Environment",question:"Where will this happen?",words:""});
  rows.push({id:"advocate.thoughts",label:"Advocate · Thoughts",question:"What are you telling yourself about this?",
    words:src.a3?.m3?.claimed ? src.a3.m3.voiceWant || "" : ""});
  return {rows,creatures:claimed.identity ? creatures : []};
}
