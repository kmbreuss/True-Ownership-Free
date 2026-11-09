import { useEffect } from "react";
import { isDevPreview } from "../devPreview";
import { inMapReview } from "../mapOfMe/review";
import type { ReadProgress } from "../journey/progress";

export function claimedMirrors(read: ReadProgress): Record<string, boolean> {
  const map=read("to_map") || {}, a2=read("to_a2_state_v1") || {}, a3=read("to_a3_state_v1") || {};
  const a4=read("to_a4_state_v1") || {}, a5=read("to_a5_state_v1") || {};
  return {
    "a1-values":!!read("to_mirror4_state_v1")?.claimed,"a1-identity":!!map.mirror3?.sealCompleted,
    "a1-purpose":!!read("a1_ex4_done"),"a1-vision":!!map.vision?.complete,
    ...Object.fromEntries(["alignment-check","time-audit","named-truth"].map((s,i)=>[`a2-${s}`,!!a2[`m${i+1}`]?.claimed])),
    ...Object.fromEntries(["people","environment","thoughts","energy-map","the-board","the-move"].map((s,i)=>[`a3-${s}`,!!a3[`m${i+1}`]?.claimed])),
    ...Object.fromEntries(["self","time","wealth"].map(s=>[`a4-${s}`,!!a4[s]?.claimed])),
    "a5-commitment":!!a5.claimed,
    "a5-weekly-check-in":!!a5.checkins?.length,"a5-90-day-look-back":!!a5.reset90,
  };
}
/** Session-only reaction to an actual local save, never a hydration/reload animation. */
export function useClaimEmphasis(read: ReadProgress) {
  useEffect(()=>{
    let previous=claimedMirrors(read), pending:string|undefined, timer:number|undefined, active:Element|undefined, alive=true;
    const show=()=>{
      if(!pending || isDevPreview() || inMapReview() || document.querySelector(".na1-room-overlay.is-open")) return;
      const card=document.querySelector(`[data-illustration="${pending}"]`)?.closest(".jr-mirror-claimed");
      if(!card || !card.getBoundingClientRect().width) return;
      pending=undefined;
      active?.classList.remove("ph-just-claimed");window.clearTimeout(timer);
      if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      active=card;card.classList.add("ph-just-claimed");
      timer=window.setTimeout(()=>{card.classList.remove("ph-just-claimed");active=undefined;},2000);
    };
    const saved=()=>queueMicrotask(()=>{
      if(!alive) return;
      const next=claimedMirrors(read);
      if(!isDevPreview() && !inMapReview()){
        const added=Object.keys(next).filter(id=>next[id] && !previous[id]);
        if(added.length===1) pending=added[0];
      } else pending=undefined;
      previous=next;show();
    });
    const observer=new MutationObserver(show);
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
    window.addEventListener("to-answer-saved",saved);
    return ()=>{alive=false;observer.disconnect();window.removeEventListener("to-answer-saved",saved);window.clearTimeout(timer);active?.classList.remove("ph-just-claimed");};
  },[read]);
}
