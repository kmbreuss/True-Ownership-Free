import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DEEP, QUICK, findings, normalizeDecisions, rowLabel, validDate, type Call, type DecisionRecord, type Response } from "../../../../lib/decision-model";
import { isDevPreview } from "../devPreview";
import "./decisions.css";

const choices: [Response,string][]=[["yes","Yes"],["not-really","Not really"],["not-sure","Not sure"],["doesnt-apply","Doesn’t apply"]];
const calls: [Call,string][]=[["yes","Yes"],["no","No"],["not-yet","Not yet"],["on-my-terms","Yes, on my terms"]];
const notices=["Blaming someone or something","Avoiding it","Carrying it all myself","Blindly hoping it gets better","I'm ready to own it"];
const noticeIds=["blaming","avoiding","carrying","hoping","ready"];
type Draft=Omit<DecisionRecord,"call"> & {call:Call | null};
function draft(context:DecisionRecord["contextSnapshot"]):Draft {
  return {id:crypto.randomUUID(),createdAt:Date.now(),updatedAt:Date.now(),decision:"",kind:"choice",depth:"quick",call:null,
    answers:{look:"",notice:"",upstream:"",ownershipItems:[],responses:{},preferredCreature:"",timeFrom:"",
      advocate:{people:{text:""},environment:{text:""},thoughts:{text:""}},act:{step:"",date:""},accountability:{person:"",date:""}},
    contextSnapshot:structuredClone(context),leaks:[],followUp:null};
}
export function DecisionEntry() {
  return <section className="decision-entry"><small>◆ FACING A DECISION?</small><h2>Own the decision</h2>
    <p>Walk it through your values, your creatures, your why and your Future B.</p>
    <button onClick={()=>window.dispatchEvent(new Event("open-decision"))}>Start →</button></section>;
}
function Findings({record}:{record:Pick<DecisionRecord,"answers"|"contextSnapshot">}) {
  const {leaks,unsure}=findings(record), labels=(ids:string[])=>ids.map(id=>rowLabel(id,record.contextSnapshot.rows));
  return <>
    {!!leaks.length && <section className="decision-leaks"><h3>The leak</h3>{labels(leaks).map((label,i)=><p key={label}>{label}: {leaks[i].startsWith("advocate.") && leaks[i]!=="advocate.self" ? "Anchor" : "Not really"}</p>)}</section>}
    {!!unsure.length && <section className="decision-gold"><h3>Worth a second look</h3>{labels(unsure).map(label=><p key={label}>{label}</p>)}</section>}
    {!leaks.length && !unsure.length && <section className="decision-gold">No leak. You’re aligned.</section>}
  </>;
}
export function DecisionPage({context,onReturn,autoStart=false}:{context:DecisionRecord["contextSnapshot"];onReturn:()=>void;autoStart?:boolean}) {
  const [items,setItems]=useState<DecisionRecord[]>([]);
  const [current,setCurrent]=useState<Draft|null>(()=>autoStart ? draft(context) : null);
  const [screen,setScreen]=useState(0), [selected,setSelected]=useState<DecisionRecord|null>(null);
  const [leaving,setLeaving]=useState(false), [busy,setBusy]=useState(false), [error,setError]=useState("");
  const [outcome,setOutcome]=useState<"worked"|"partly"|"not-yet"|null>(null), [note,setNote]=useState("");
  const live=useRef(true), saving=useRef(false);
  useEffect(()=>{
    if(!current)return;
    const overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const previous=document.activeElement as HTMLElement|null;
    const frame=document.querySelector<HTMLElement>(".decision-frame[role=dialog]");
    frame?.querySelector<HTMLElement>("button")?.focus();
    const key=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();setLeaving(true);}
      if(event.key==="Tab"){
        const scope=document.querySelector(".decision-confirm") || frame;
        const targets=Array.from(scope?.querySelectorAll<HTMLElement>("button:not(:disabled),input,textarea")||[]);
        const first=targets[0],last=targets[targets.length-1];
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
        if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    document.addEventListener("keydown",key);
    return()=>{document.body.style.overflow=overflow;document.removeEventListener("keydown",key);previous?.focus()};
  },[!!current]);
  useEffect(()=>{
    live.current=true;
    const controller=new AbortController();
    if(!isDevPreview()) fetch("/api/userdata",{credentials:"include",signal:controller.signal}).then(async r=>{
      if(!r.ok) throw new Error("Could not load your decisions. Please try again.");
      const data=await r.json();
      if(live.current && !isDevPreview()) setItems(normalizeDecisions(data.decisions?.v).items);
    }).catch(e=>{if(e.name!=="AbortError" && live.current)setError(e.message)});
    return()=>{live.current=false;controller.abort()};
  },[]);
  async function save(record:DecisionRecord) {
    if(saving.current)return;
    saving.current=true;setBusy(true);setError("");
    const owner=localStorage.getItem("to_a1_practical_owner_v1");
    try {
      if(isDevPreview()){setItems(old=>[record,...old.filter(r=>r.id!==record.id)]);setCurrent(null);setSelected(null);onReturn();return;}
      const response=await fetch("/api/userdata/decisions",{method:"PUT",credentials:"include",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({value:{t:Date.now(),v:{version:1,items:[record]}}})});
      if(!response.ok)throw new Error("Your decision was not saved. Your answers are still here. Please try again.");
      const data=await response.json();
      if(data.current?.v?.version!==1 || !Array.isArray(data.current.v.items))throw new Error("The server did not confirm your saved decision. Please try again.");
      if(!live.current || isDevPreview() || owner!==localStorage.getItem("to_a1_practical_owner_v1"))return;
      const store=normalizeDecisions(data.current?.v);
      setItems(store.items);
      try{localStorage.setItem("to_decisions_v1",JSON.stringify(store));}catch{/* Cloud save succeeded; cache is optional. */}
      if(current){setCurrent(null);onReturn();}else setSelected(store.items.find(r=>r.id===record.id)||null);
    } catch(e){if(live.current)setError(e instanceof Error ? e.message : "Could not save. Please try again.");}
    finally{saving.current=false;if(live.current)setBusy(false);}
  }
  const textInput=(label:string,value:string,onChange:(s:string)=>void,type="text")=><label className="decision-field">{label}
    {type==="date" ? <input aria-label={label} type="date" value={value} onChange={e=>onChange(e.target.value)}/> : <textarea aria-label={label} rows={2} value={value} onChange={e=>onChange(e.target.value)}/>}</label>;
  const taps=(id:string,question:string,allowed=choices)=><fieldset><legend>{question}</legend><div className="decision-taps">
    {allowed.map(([value,label])=><button type="button" key={value} aria-pressed={current?.answers.responses[id]===value}
      className={value==="not-really" ? "leak-choice" : ""} onClick={()=>setCurrent(d=>d&&({...d,answers:{...d.answers,responses:{...d.answers.responses,[id]:value}}}))}>{label}</button>)}</div></fieldset>;
  const change=(key:"look"|"notice"|"upstream"|"timeFrom"|"preferredCreature",value:string)=>setCurrent(d=>d&&({...d,answers:{...d.answers,[key]:value}}));
  const paths=current?.depth==="deep" ? DEEP : QUICK, step=paths[screen];
  const valid= !current || validDate(current.answers.act.date)&&validDate(current.answers.accountability.date);
  const source=(id:string)=>current?.contextSnapshot.rows.find(r=>r.id===id);
  return <main className="decision-page">
    {!current && !selected ? <>
      <p className="decision-kicker">OWN THE DECISION</p><h1>What’s in front of you?</h1>
      <p>Walk it through your values, your creatures, your why and your Future B.</p>
      <button className="decision-primary" onClick={()=>{setCurrent(draft(context));setScreen(0);setError("")}}>Start →</button>
      <h2>My decisions</h2>{!items.length && <p>No saved decisions yet.</p>}
      {items.map(record=>{const f=findings(record);return <button className="decision-saved" key={record.id} onClick={()=>{setSelected(record);setOutcome(record.followUp?.result||null);setNote(record.followUp?.note||"")}}>
        <strong>{record.decision}</strong><span>{calls.find(([id])=>id===record.call)?.[1]}{record.answers.accountability.date && ` · Check-in ${record.answers.accountability.date}`}</span>
        <small>{f.leaks.length ? `LEAK: ${f.leaks.map(id=>rowLabel(id,record.contextSnapshot.rows)).join(" · ")}` : f.unsure.length ? "WORTH A SECOND LOOK" : "ALIGNED"}</small></button>})}
    </> : selected && !current ? <section className="decision-frame">
      <button onClick={()=>setSelected(null)}>← My decisions</button><h1>{selected.decision}</h1>
      <Findings record={selected}/><h2>Your call: {calls.find(([id])=>id===selected.call)?.[1]}</h2>
      <p>My next step: {selected.answers.act.step || "Not added"} {selected.answers.act.date}</p>
      <p>Who I’ll tell: {selected.answers.accountability.person || "Not added"} · Check-in: {selected.answers.accountability.date || "Not set"}</p>
      <h2>Your walkthrough</h2><p>{selected.kind==="choice" ? "A choice in front of me" : "Something isn't working"} · {selected.depth==="quick" ? "Quick" : "Deep"}</p>
      <p>Look: {selected.answers.look || "Not answered"}</p><p>Notice: {notices[noticeIds.indexOf(selected.answers.notice)] || selected.answers.notice || "Not answered"}</p>
      {selected.depth==="deep" && <><p>Go upstream: {selected.answers.upstream || "Not answered"}</p>{selected.answers.ownershipItems.map(item=><p key={item.id}>{item.text} · {item.ownership || "Not sorted"}</p>)}</>}
      {selected.contextSnapshot.rows.map(row=><section key={row.id}><h3>{row.label}</h3><p>{row.question}</p>{row.words&&<p className="decision-gold">{row.words}</p>}
        <p>{choices.find(([v])=>v===selected.answers.responses[row.id])?.[1] || "Not answered"}</p></section>)}
      <p>Creature to bring: {selected.contextSnapshot.creatures.find(c=>c.id===selected.answers.preferredCreature)?.name || "Not chosen"}</p>
      <p>Time from: {selected.answers.timeFrom || "Not answered"}</p>
      {Object.entries(selected.answers.advocate).map(([id,v])=><p key={id}>{id}: {v.text || "Not answered"} · {v.judgment || "Not chosen"}</p>)}
      {["advocate.self","act","accountability"].map(id=><p key={id}>{rowLabel(id,selected.contextSnapshot.rows)}: {choices.find(([v])=>v===selected.answers.responses[id])?.[1] || "Not answered"}</p>)}
      {selected.answers.accountability.date && selected.answers.accountability.date<=new Date().toLocaleDateString("en-CA") && <section>
        <h2>How did it go?</h2><div className="decision-taps">{[["worked","It worked"],["partly","Partly"],["not-yet","Not yet"]].map(([id,label])=><button key={id} aria-pressed={outcome===id} onClick={()=>setOutcome(id as typeof outcome)}>{label}</button>)}</div>
        {textInput("Optional note",note,setNote)}<button disabled={!outcome || busy} className="decision-primary" onClick={()=>outcome&&save({...selected,updatedAt:Date.now(),followUp:{result:outcome,note,savedAt:Date.now()}})}>Save outcome</button>
      </section>}
    </section> : current && createPortal(<div className="decision-page decision-overlay"><section className="decision-frame" role="dialog" aria-modal="true" aria-label="Own the decision">
      <header><span>OWN THE DECISION · {screen+1} OF {paths.length}</span><button aria-label="Close walkthrough" onClick={()=>setLeaving(true)}>×</button></header>
      <progress value={screen+1} max={paths.length} aria-label="Walkthrough progress"/>
      <div className="decision-body"><p className="decision-kicker">{step==="Start" ? "WHAT’S IN FRONT OF YOU" : step.toUpperCase()}</p>
      {step==="Start" && <>
        <h1>What’s the decision?</h1>{textInput("Your decision",current.decision,v=>setCurrent({...current,decision:v}))}
        <fieldset><legend>Which is it?</legend><div className="decision-taps">{[["situation","Something isn't working"],["choice","A choice in front of me"]].map(([id,label])=><button key={id} aria-pressed={current.kind===id} onClick={()=>setCurrent({...current,kind:id as Draft["kind"]})}>{label}</button>)}</div></fieldset>
        <fieldset><legend>How deep?</legend><div className="decision-taps">{[["quick","Quick · 2 min"],["deep","Deep · 8 min"]].map(([id,label])=><button key={id} aria-pressed={current.depth===id} onClick={()=>setCurrent({...current,depth:id as Draft["depth"]})}>{label}</button>)}</div></fieldset>
      </>}
      {step==="Look" && <><h1>Look</h1>{textInput(current.kind==="situation" ? "How did this situation get like this? What's the sore toe, the thing you keep noticing?" : "What's pulling at you about this?",current.answers.look,v=>change("look",v))}</>}
      {step==="Notice" && <><h1>What are you doing with it right now?</h1><div className="decision-taps vertical">{notices.map((label,i)=><button key={label} className={i<4 ? "leak-choice" : ""} aria-pressed={current.answers.notice===noticeIds[i]} onClick={()=>change("notice",noticeIds[i])}>{label}</button>)}</div></>}
      {step==="Go upstream" && textInput("What part of this do I own? Not to blame. To change.",current.answers.upstream,v=>change("upstream",v))}
      {step==="Sort it to own it" && <><h1>Sort it to own it</h1><p>Mine: my decisions, boundaries, yeses, what I tolerate. Not mine: other people's expectations, moods and choices.</p>
        {current.answers.ownershipItems.map((item,i)=><section key={item.id}>{textInput(`Item ${i+1}`,item.text,v=>setCurrent({...current,answers:{...current.answers,ownershipItems:current.answers.ownershipItems.map(it=>it.id===item.id?{...it,text:v}:it)}}))}
          <div className="decision-taps">{(["mine","not-mine"] as const).map(value=><button key={value} aria-pressed={item.ownership===value} onClick={()=>setCurrent({...current,answers:{...current.answers,ownershipItems:current.answers.ownershipItems.map(it=>it.id===item.id?{...it,ownership:value}:it)}})}>{value==="mine" ? "Mine" : "Not mine"}</button>)}</div></section>)}
        <button onClick={()=>setCurrent({...current,answers:{...current.answers,ownershipItems:[...current.answers.ownershipItems,{id:crypto.randomUUID(),text:"",ownership:null}]}})}>+ Add item</button></>}
      {step==="All In" && <><h1>Are you all in on this?</h1>{current.contextSnapshot.rows.filter(r=>r.id.startsWith("allIn.")).map(row=><section key={row.id}>
        <h2>{row.label}</h2>{row.words && <p className="decision-gold">{row.words}</p>}{taps(row.id,row.question)}
        {row.id==="allIn.identity" && current.answers.responses[row.id]==="not-really" && <fieldset><legend>Which creature would you rather bring?</legend><div className="decision-taps">{current.contextSnapshot.creatures.map(c=><button key={c.id} aria-pressed={current.answers.preferredCreature===c.id} onClick={()=>change("preferredCreature",c.id)}>{c.name}</button>)}</div></fieldset>}
      </section>)}<p>A “not really” here is a leak. It’s what stops you committing later.</p></>}
      {step==="Align" && <><h1>Align To It</h1>{source("align")?.words&&<p className="decision-gold">{source("align")?.words}</p>}
        {taps("align",source("align")?.question || "")}{textInput("What would it take time from?",current.answers.timeFrom,v=>change("timeFrom",v))}</>}
      {step==="Advocate" && <><h1>Advocate For It</h1>{["people","environment","thoughts"].map(id=><section key={id}>
        {source(`advocate.${id}`)?.words&&<p className="decision-gold">{id==="people"?"Your advocates: ":"The voice you want: "}{source(`advocate.${id}`)?.words}</p>}
        {textInput(source(`advocate.${id}`)?.question||"",current.answers.advocate[id].text,v=>setCurrent({...current,answers:{...current.answers,advocate:{...current.answers.advocate,[id]:{...current.answers.advocate[id],text:v}}}}))}
        <div className="decision-taps">{(["advocate","anchor"] as const).map(value=><button key={value} className={value==="anchor"?"leak-choice":""} aria-pressed={current.answers.advocate[id].judgment===value} onClick={()=>setCurrent({...current,answers:{...current.answers,advocate:{...current.answers.advocate,[id]:{...current.answers.advocate[id],judgment:value}}}})}>{value==="advocate"?"Advocate":"Anchor"}</button>)}</div>
      </section>)}{taps("advocate.self","And are you advocating for yourself here?",choices.slice(0,2))}</>}
      {step==="Act" && <><h1>Act On It</h1>{taps("act","Am I acting on what I already know, or treating symptoms and waiting?")}
        {textInput("What's the smallest realistic next step you can measure?",current.answers.act.step,v=>setCurrent({...current,answers:{...current.answers,act:{...current.answers.act,step:v}}}))}
        {textInput("By when? (optional)",current.answers.act.date,v=>setCurrent({...current,answers:{...current.answers,act:{...current.answers.act,date:v}}}),"date")}</>}
      {step==="Accountability" && <><h1>Accountability To It</h1>{taps("accountability","Am I accountable to what matters to me, or only to everyone else?")}
        {textInput("Who will you tell? (optional)",current.answers.accountability.person,v=>setCurrent({...current,answers:{...current.answers,accountability:{...current.answers.accountability,person:v}}}))}
        {textInput("When will you check in? (optional)",current.answers.accountability.date,v=>setCurrent({...current,answers:{...current.answers,accountability:{...current.answers.accountability,date:v}}}),"date")}</>}
      {step==="Ending" && <><h1>Your decision</h1><p>{current.decision}</p><Findings record={current}/>
        <fieldset><legend>Your call</legend><div className="decision-taps">{calls.map(([id,label])=><button key={id} aria-pressed={current.call===id} onClick={()=>setCurrent({...current,call:id})}>{label}</button>)}</div></fieldset>
        <h2>My next step</h2><p>{current.answers.act.step || "Not added"} {current.answers.act.date}</p>
        <p>Who I’ll tell: {current.answers.accountability.person || "Not added"} · Check-in: {current.answers.accountability.date || "Not set"}</p></>}
      {!valid && <p role="alert">Please enter a real calendar date, or leave the date blank.</p>}
      {error&&<p role="alert">{error}</p>}
      </div><footer><button disabled={busy} onClick={()=>screen ? setScreen(screen-1) : setLeaving(true)}>← Back</button>
        {step==="Ending" ? <button className="decision-primary" disabled={busy||!current.decision.trim()||!current.call||!valid} onClick={()=>current.call&&save({...current,call:current.call,leaks:findings(current).leaks})}>{busy?"Saving…":"Own it ★"}</button>
          : <button className="decision-primary" disabled={!valid || step==="Start"&&!current.decision.trim()} onClick={()=>setScreen(screen+1)}>{step==="Start"?"Start →":"Next →"}</button>}</footer>
      {leaving&&<div className="decision-confirm" role="alertdialog" aria-label="Leave without saving?"><h2>Leave without saving?</h2>
        <button className="decision-primary" onClick={()=>setLeaving(false)}>Keep going</button>
        <button onClick={()=>{setLeaving(false);setCurrent(null);onReturn()}}>Leave</button></div>}
    </section></div>,document.body)}
    {!current&&error&&<p role="alert">{error}</p>}
  </main>;
}
