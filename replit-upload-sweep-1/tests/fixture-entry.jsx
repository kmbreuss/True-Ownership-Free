import React, {useState,useLayoutEffect} from "react";
import {createRoot} from "react-dom/client";
const q = new URLSearchParams(location.search);
import * as m from "__ROOMS__";
import {EMPTY_MIRROR4} from "./mirror4Constants";
import {EMPTY_MIRROR3} from "./mirror3Constants";
// Isolate every fixture write from real account data even on the same origin.
const store=new Map();
Object.defineProperty(window,"localStorage",{value:{
 getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),
 removeItem:k=>store.delete(k),clear:()=>store.clear(),key:i=>[...store.keys()][i]??null,
 get length(){return store.size;}
}});
const seed4=structuredClone(EMPTY_MIRROR4);
seed4.clusters=Array.from({length:6},(_,i)=>({id:`cl-${i+1}`,proposal:"",proposedNames:[],behaviorIds:[`ad-${i}`],flips:[],userName:`Standard ${i+1}`,userDefinition:"",keystoneBehaviorId:`ad-${i}`,status:"named",colorIndex:i%3+1,peelChain:[]}));
seed4.admire=Array.from({length:9},(_,i)=>({id:`ad-${i}`,text:`Keeps a clear promise ${i+1}`,tier:"lights",inUseByCluster:i<6?`cl-${i+1}`:null}));
localStorage.setItem("to_mirror4_state_v1",JSON.stringify(seed4));
const seed3=structuredClone(EMPTY_MIRROR3);
seed3.pickedGifts=["Strategic","Warm","Steady"].map((label,i)=>({id:`g${i}`,label,theme:["mind","heart","spine"][i],state:"owned",custom:false}));
seed3.clusters=["Eagle","Dolphin","Bear"].map((animal,i)=>({id:`c${i}`,name:`My ${animal}`,nameWasEdited:true,animal,animalEmoji:"",descriptorWord1:["Clear","Warm","Calm"][i],descriptorWord2:["Focused","Connected","Steady"][i],giftIds:[`g${i}`],superpower:{blank1:"make room to think",blank2:"stay clear",blank3:"help others move forward"}}));
seed3.shadows=Object.fromEntries(seed3.pickedGifts.map(g=>[g.id,{pickedShadows:["withdraw"],primaryShadow:"withdraw",customShadows:[]}]));
seed3.shadowStories=Object.fromEntries(seed3.clusters.map(c=>[c.id,{blank1:"withdraw",blank2:"connection",blank3:"clarity"}]));
localStorage.setItem("to_map",JSON.stringify({mirror3:seed3}));
const noop = () => {};
const activities = Array.from({length:8},(_,i)=>({id:`a${i}`,name:`Activity ${i+1}`,hrsPerWeek:5,priorityServed:"Family",energy:"drains",rating:2}));
const priorities = ["Family","Health","Work"];
const m2 = {priorities,activities,missingItems:[],awakeHours:112};
const m3 = {activityDecisions:{},missingAssignments:{},priorityCommitments:[],moveText:"",selfFeedback:""};
const thoughts = Array.from({length:6},(_,i)=>({text:`I should be doing more ${i+1}`,verdict:null,reframe:""}));
const seats = Array.from({length:6},(_,i)=>({id:`s${i}`,role:`Seat ${i+1}`,desc:"Someone who challenges me",name:"",inLife:null}));
function Fixture(){
 const [state,setState]=useState(seed4);
 const rooms=["time","gap","rethink","shape","seats","standards","rank","gifts","futures","own"];
 const [index,setIndex]=useState(0);
 const [mountKey,setMountKey]=useState(0);
 const auditing=q.get("room")==="audit";
 const room=auditing?rooms[index]:q.get("room")||"gifts";
 useLayoutEffect(()=>{
  if(!auditing)return;
  const timer=setTimeout(async()=>{
   const samples=[];
   const measure=()=>Math.max(0,...[...document.querySelectorAll(".na1-room-card")].map(e=>e.scrollHeight-e.clientHeight));
   samples.push(measure());
   for(const pip of [...document.querySelectorAll(".dsf-pip")]){
    if(pip.disabled)continue;
    pip.click();await new Promise(r=>setTimeout(r,10));samples.push(measure());
    for(let page=0;page<20;page++){
     const next=[...document.querySelectorAll(".dsf-pager button[aria-label^='Next']")].find(b=>!b.disabled&&b.getClientRects().length);
     if(!next)break;
     next.click();await new Promise(r=>setTimeout(r,10));samples.push(measure());
    }
   }
   const active=()=>document.querySelector(".dsf-pip[aria-selected='true']")?.getAttribute("aria-label")??null;
   const selected=active();
   setMountKey(v=>v+1);await new Promise(r=>setTimeout(r,20));
   const remountRestoresSection=selected===active();
   const cards=[...document.querySelectorAll(".na1-room-card")];
   const row={mode:q.get("mode"),room,vertical:samples,horizontal:cards.map(e=>e.scrollWidth-e.clientWidth),remountRestoresSection};
   parent.postMessage({audit:row},location.origin);
   console.log("OVERFLOW "+JSON.stringify(row));
   if(index<rooms.length-1)setIndex(index+1);
  },10);
  return ()=>clearTimeout(timer);
 },[index]);
 const views={
 time:<m.NewA2M2Step2Body {...m2} onAdd={noop} onUpdate={noop} onRemove={noop} onAwakeChange={noop}/>,
 gap:<m.NewA2M3Step1Body {...m2} intentMap={{}} onSetIntent={noop}/>,
 rethink:<m.NewA2M3Step2Body m2={m2} m3={m3} onSetDecision={noop} onSetMissing={noop} onAddCommitment={noop} onUpdateCommitment={noop} onRemoveCommitment={noop} onMoveText={noop} onSelfFeedback={noop}/>,
 shape:<m.NewA3M3Step2Body thoughts={thoughts} voiceNow="" voiceWant="" onVerdict={noop} onReframe={noop} onVoiceNow={noop} onVoiceWant={noop}/>,
 seats:<m.NewA3M5FillBody seats={seats} advPool={[]} onRole={noop} onDesc={noop} onAssign={noop} onClear={noop} onInLife={noop} onAddSeat={noop} onDelSeat={noop}/>,
 standards:<m.NewA1M4NameStandardsBody state={state} mutate={setState}/>,
 rank:<m.NewA1M4RankBody onCloseRoom={noop} onContinueToClaim={noop}/>,
 gifts:<m.NewA1M3View embedded onBack={noop}/>,
 futures:<m.NewA2TwoFuturesBody onSaved={noop} onBack={noop}/>,
 own:<m.NewA1M3OwnItView embedded onContinueToValues={noop}/>,
 };
 return <><style>{m.CSS}</style><div className="na1-root"><div className="na1-room-overlay is-open"><div className="na1-room-card"><div className="na1-room-crumb">Fixture · {room}</div><React.Fragment key={`${room}-${mountKey}`}>{views[room]}</React.Fragment></div></div></div></>;
}
createRoot(document.getElementById("root")).render(<Fixture/>);
