import React, { useState, useEffect, useRef, useCallback } from "react";

const KEYS = {
  map:    "to_map",
  done:   "to_done",
  step:   "to_step",
  voice:  "to_voice",
  intake: "to_intake",
  phase:  "to_phase",
};

function saveData(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function loadData(k) { try { const r = localStorage.getItem(k); return Promise.resolve(r ? JSON.parse(r) : null); } catch { return Promise.resolve(null); } }

const VOICES = {
  own:         { id:"own",         label:"Your Voice",             short:"Your Voice",  icon:"◎", color:"#a78bfa", muted:"rgba(167,139,250,0.1)",  border:"rgba(167,139,250,0.3)" },
  coach:       { id:"coach",       label:"Katherine · Coach",      short:"Coach",       icon:"◈", color:"#c9a84c", muted:"rgba(79,203,242,0.1)",   border:"rgba(79,203,242,0.3)"  },
  supportive:  { id:"supportive",  label:"Katherine · Supportive", short:"Supportive",  icon:"◇", color:"#34d399", muted:"rgba(52,211,153,0.1)",   border:"rgba(52,211,153,0.3)"  },
  challenging: { id:"challenging", label:"Katherine · Challenging",short:"Challenging", icon:"◆", color:"#f59e0b", muted:"rgba(245,158,11,0.1)",   border:"rgba(245,158,11,0.3)"  },
  advice:      { id:"advice",      label:"Katherine · Advice",     short:"Advice",      icon:"◉", color:"#c9a84c", muted:"rgba(232,149,109,0.1)",  border:"rgba(232,149,109,0.3)" },
  truth:       { id:"truth",       label:"Uncomfortable Truth",    short:"Hard Truth",  icon:"⬡", color:"#ef4444", muted:"rgba(239,68,68,0.1)",    border:"rgba(239,68,68,0.3)"   },
};
const VOICE_DESC = {
  own:"Reflects your own words back. No advice — just your truth made visible.",
  coach:"Open questions that create insight. You do the thinking.",
  supportive:"In your corner. Sees your strength. Keeps you moving.",
  challenging:"Names the contradiction. Asks what you've been avoiding.",
  advice:"25 years of experience. Direct recommendation. Here's what I'd do.",
  truth:"What you need to hear. Not what you want to.",
};
const VOICE_REASON = {
  own:"You're ready to hear yourself more clearly.",
  coach:"You're searching for clarity — the right questions will get you there faster than any answers.",
  supportive:"You need someone genuinely in your corner right now.",
  challenging:"You already know what you need to do. You need someone who won't let you off the hook.",
  advice:"You're ready to move. Direct guidance will serve you better than more questions.",
  truth:"You're asking for honesty. That takes courage.",
};

function detectVoice(q3) {
  const t = (q3||"").toLowerCase();
  if (/don.t know|scared|lost|not sure|overwhelm|finally|help|afraid|anxious|support/.test(t)) return "supportive";
  if (/clarity|direction|figure|understand|confused|what|why|which|clear/.test(t)) return "coach";
  if (/keep|same|always|stop|tired|excuse|again|know what|stuck|frustrated|push/.test(t)) return "challenging";
  if (/ready|now|do it|build|start|move|time|urgent|action/.test(t)) return "advice";
  if (/truth|honest|real|hard|uncomfortable|brutal/.test(t)) return "truth";
  return "coach";
}

// Build a full context string from everything the client has entered so far
function buildFullContext(name, intake, mapData) {
  const lines = [];
  lines.push(`Client name: ${name}`);
  if (intake?.q1) lines.push(`What brought them here: "${intake.q1}"`);
  if (intake?.q2) lines.push(`Who they are becoming: "${intake.q2}"`);
  if (intake?.q3) lines.push(`What they most need: "${intake.q3}"`);

  // Purpose peeling layers
  const layers = (mapData?.purpose_layers || []).filter(l => (l||"").trim());
  if (layers.length > 0) {
    lines.push(`\nPurpose peeling layers (${layers.length} deep):`);
    layers.forEach((l, i) => lines.push(`  Layer ${i + 1}: "${l}"`));
  }
  if (mapData?.purpose_draft) lines.push(`Purpose draft (AI): "${mapData.purpose_draft}"`);
  if (mapData?.purpose_final) lines.push(`Purpose final (their words): "${mapData.purpose_final}"`);

  // BAG
  if (mapData?.bag_time || mapData?.bag_wealth || mapData?.bag_growth) {
    lines.push(`\nBAG — Big Ass Goal (10–15 years):`);
    if (mapData.bag_time)   lines.push(`  Time: "${mapData.bag_time}"`);
    if (mapData.bag_wealth) lines.push(`  Wealth: "${mapData.bag_wealth}"`);
    if (mapData.bag_growth) lines.push(`  Growth: "${mapData.bag_growth}"`);
  }

  // Identity / Animals
  const animals = (mapData?.animals || []).filter(a => a.name);
  if (animals.length > 0) {
    lines.push(`\nIdentity animals:`);
    animals.forEach(a => lines.push(`  "${a.adjective1}${a.adjective2 ? `, ${a.adjective2}` : ""} ${a.name}" — alignment ${a.alignment}/10`));
  }
  if (mapData?.identity_adjectives) lines.push(`Qualities brain dump: "${mapData.identity_adjectives}"`);
  if (mapData?.capabilities_note) lines.push(`Superpowers note: "${mapData.capabilities_note}"`);

  // Values
  const values = (mapData?.values || []).filter(v => v.name);
  if (values.length > 0) {
    lines.push(`\nValues (top ${values.length}):`);
    values.forEach((v, i) => {
      lines.push(`  ${i + 1}. ${v.name}${v.irk ? ` — revealed by: "${v.irk}"` : ""}${v.behaviors ? ` — behaviors: "${v.behaviors}"` : ""}`);
    });
  }
  if (mapData?.values_irks) lines.push(`Values irks dump: "${mapData.values_irks}"`);
  if (mapData?.behaviors_note) lines.push(`Behaviors note: "${mapData.behaviors_note}"`);

  // Alignment scores
  if (mapData?.align_direction !== undefined || mapData?.align_superpowers !== undefined || mapData?.align_behaviors !== undefined) {
    lines.push(`\nAlignment ratings:`);
    if (mapData.align_direction   !== undefined) lines.push(`  Direction: ${mapData.align_direction}/10`);
    if (mapData.align_superpowers !== undefined) lines.push(`  Superpowers: ${mapData.align_superpowers}/10`);
    if (mapData.align_behaviors   !== undefined) lines.push(`  Behaviors: ${mapData.align_behaviors}/10`);
  }

  // Purpose sessions history
  const sessions = (mapData?.purpose_sessions || []);
  if (sessions.length > 0) {
    lines.push(`\nPurpose peeling sessions (${sessions.length} total):`);
    sessions.forEach((s, i) => lines.push(`  Session ${i + 1} (${s.date || ""}): draft = "${s.draft || ""}", verbs = ${(s.verbs || []).join(", ")}`));
  }

  return lines.join("\n");
}

function buildPrompt(voiceId, name, intake, mapData) {
  const ctx = buildFullContext(name, intake, mapData);

  const voiceInstructions = {
    own:`Mirror ${name}'s OWN words back. Start "You said..." or "What I'm hearing...". Draw directly from what they have written — quote their specific words back. One question from their own words. No advice. Under 120 words.`,
    coach:`Katherine Breuss coaching ${name}. You have read everything they have written — reference specific details from their map. ONE open-ended question per response. Acknowledge in one sentence using their actual words, then ask. End on the question. Under 100 words.`,
    supportive:`Katherine Breuss fully in ${name}'s corner. You can see everything they have put in — reference it specifically. Name something SPECIFIC you see in their work. Celebrate real progress. Make them feel seen, not managed. One forward question. Under 120 words.`,
    challenging:`Katherine Breuss not letting ${name} off the hook — with warmth. You have read everything. Name a specific gap between what they have written and what they are not saying. One observation using their words, one harder question. Under 100 words.`,
    advice:`Katherine Breuss giving direct advice to ${name}. You have read their full map. "Here's what I'd do..." — grounded in their specific purpose, animals, values. Clear recommendation, why, hard part, one first step. Under 150 words.`,
    truth:`Katherine Breuss: ${name} asked for uncomfortable truth. You have read everything they wrote. Find the specific avoidance or contradiction in their actual inputs. Name it plainly. Why it matters. What changes if faced. Under 120 words.`,
  };

  return `${voiceInstructions[voiceId]}\n\nEverything ${name} has entered so far:\n${ctx}`;
}

async function callAI(voiceId, name, intake, mapData, message, history=[]) {
  const res = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:400,
      system: buildPrompt(voiceId, name, intake, mapData),
      messages: [...history.slice(-6), {role:"user", content:message}] }),
  });
  const d = await res.json();
  return d.content?.map(b=>b.text||"").join("")||"Something went wrong.";
}

async function callStructured(prompt) {
  const res = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:800,
      messages:[{role:"user", content:prompt}] }),
  });
  const d = await res.json();
  const text = d.content?.map(b=>b.text||"").join("")||"{}";
  try { return JSON.parse(text.replace(/```json|```/g,"").trim()); } catch { return {}; }
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
:root{--bg:#0d1b2e;--bg2:#112240;--bg3:#1a2f4a;--bg4:#1e3554;--text:#f4f1eb;--text2:#d4cfc5;--text3:#9a9590;--text4:#5c6b7a;--border:#1e3554;--border2:#254060;--warm:#c9a84c;--accent:#c9a84c;--serif:'Cormorant Garamond',serif;--sans:'DM Sans',sans-serif;}
body{background:var(--bg);color:var(--text);font-family:var(--sans);}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
.fade-up{animation:fadeUp .55s cubic-bezier(.22,1,.36,1) both}
.fade-in{animation:fadeIn .35s ease both}
.to-field{background:var(--bg4);border:1px solid var(--border2);border-radius:10px;color:var(--warm);font-family:var(--sans);font-size:13px;line-height:1.7;padding:13px 15px;width:100%;outline:none;transition:border-color .2s;resize:none;}
.to-field:focus{border-color:var(--warm);box-shadow:0 0 0 3px rgba(201,168,76,0.12);}
.to-field::placeholder{color:var(--text3);opacity:.7;}
.to-field-serif{font-family:var(--serif);font-size:13px;font-style:italic;font-weight:400;color:var(--warm);}
input[type=range]{width:100%;cursor:pointer;height:4px;appearance:none;border-radius:4px;outline:none;}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--text);border:3px solid var(--bg2);cursor:pointer;}
.btn{background:var(--warm);border:none;border-radius:60px;color:#0d1b2e;cursor:pointer;font-family:var(--sans);font-size:13px;font-weight:500;letter-spacing:1.5px;padding:13px 30px;text-transform:uppercase;transition:all .22s;display:inline-flex;align-items:center;gap:8px;}
.btn:hover{filter:brightness(1.08);transform:translateY(-1px);}
.btn:disabled{background:var(--bg4);color:var(--text4);cursor:not-allowed;transform:none;filter:none;}
.btn-g{background:none;border:1px solid var(--border2);border-radius:60px;color:var(--text2);cursor:pointer;font-family:var(--sans);font-size:13px;padding:10px 22px;transition:all .2s;}
.btn-g:hover{border-color:var(--text4);color:var(--text2);}
.lbl{color:var(--accent);font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-family:var(--sans);}
.dot-l span{display:inline-block;width:5px;height:5px;border-radius:50%;background:currentColor;animation:pulse 1.2s ease-in-out infinite;margin:0 2px;}
.dot-l span:nth-child(2){animation-delay:.2s}.dot-l span:nth-child(3){animation-delay:.4s}
.vid-block{background:var(--bg2);border:1px solid var(--border2);border-radius:12px;padding:17px 20px;display:flex;align-items:flex-start;gap:13px;margin-bottom:22px;}
.mirror-grid{display:grid;grid-template-columns:1fr 38px 1fr;gap:0;margin-bottom:26px;}
.mirror-side{background:var(--bg3);border:1px solid var(--border2);border-radius:12px;padding:20px;}
.mirror-div{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;}
.mirror-line{flex:1;width:1px;background:var(--border);opacity:.4;}
.sidebar-btn{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;text-align:left;font-family:var(--sans);border:1px solid transparent;background:transparent;transition:all .18s;}
.sidebar-btn.active{background:rgba(201,168,76,.1);border-color:rgba(201,168,76,.3);}
.ai-card{padding:"10px 14px";border-radius:8px;border-left:2px solid;}
`;

const OWN_IT_QUESTIONS = [
  {
    id: "body",
    icon: "◉",
    label: "Body check",
    prompt: "Before you read that back again — take a breath. Where in your body does this land?",
    sub: "Full yes, a no, or 'close but not quite'? Trust the physical signal first.",
    placeholder: "It lands as a yes / no / close but... because...",
  },
  {
    id: "flaw",
    icon: "◈",
    label: "Find the flaw",
    prompt: "What's missing or not quite right in what was reflected?",
    sub: "The AI only knows what you typed. What do you know that would change this?",
    placeholder: "What the AI doesn't know, or got slightly wrong, is...",
  },
  {
    id: "verdict",
    icon: "◆",
    label: "Your verdict",
    prompt: "In your own words — ignoring what was just said — what do you actually know to be true?",
    sub: "Not a summary of the reflection. What do YOU know?",
    placeholder: "What I know to be true is...",
  },
];

function OwnItCheck({ context, onComplete, storageKey }) {
  const [open, setOpen] = useState(true);
  const [answers, setAnswers] = useState({ body: "", flaw: "", verdict: "" });
  const [loading, setLoading] = useState(false);
  const [mirror, setMirror] = useState(null);
  const [done, setDone] = useState(false);
  const savedAnswers = useRef({});

  const setAnswer = useCallback((id, val) => {
    savedAnswers.current[id] = val;
    setAnswers(prev => ({ ...prev, [id]: val }));
  }, []);

  const allAnswered = answers.body.trim() && answers.flaw.trim() && answers.verdict.trim();

  const runMirror = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          messages: [{
            role: "user",
            content: `Mirror back ONLY the person's own words in one sentence. No interpretation. Body: "${answers.body}" Flaw: "${answers.flaw}" Verdict: "${answers.verdict}". JSON: {"reflection": "starting with What you know is... using only their words"}`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "{}";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setMirror(parsed.reflection);
      if (storageKey) await saveData(storageKey, { answers, mirror: parsed.reflection });
      if (onComplete) onComplete({ answers, mirror: parsed.reflection });
    } catch {
      setMirror("What you know is: " + answers.verdict);
    }
    setLoading(false);
    setDone(true);
  };

  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "1px solid rgba(201,168,76,.22)", borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontFamily: "var(--sans)", fontSize: 12, color: "var(--warm)", marginTop: 12 }}>
      <span style={{ fontSize: 10 }}>◎</span> Own It Check
    </button>
  );

  return (
    <div className="fade-in" style={{ marginTop: 16, background: "rgba(232,149,109,.04)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 13, overflow: "hidden" }}>
      <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(201,168,76,.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warm)", animation: "pulse 2s infinite" }} />
          <div style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "var(--warm)" }}>Own It Check</div>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "var(--text4)", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ padding: "14px 18px 0" }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 14, fontStyle: "italic", color: "var(--text3)", lineHeight: 1.7, marginBottom: 14 }}>
          "You are the authority on your own life. This tool helps you think faster — it doesn't think for you."
        </div>
      </div>
      <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
        {OWN_IT_QUESTIONS.map((q, i) => (
          <div key={q.id} style={{ opacity: done ? 0.6 : 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(201,168,76,.12)", border: "1px solid rgba(201,168,76,.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: 9, color: "var(--warm)", fontWeight: 700 }}>{i + 1}</span>
              </div>
              <div>
                <div style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>{q.prompt}</div>
                <div style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text4)", lineHeight: 1.5 }}>{q.sub}</div>
              </div>
            </div>
            <OwnItField id={q.id} value={answers[q.id]} onChange={setAnswer} placeholder={q.placeholder} disabled={done} />
          </div>
        ))}
        {!done && (
          <button onClick={runMirror} disabled={!allAnswered || loading} className="btn"
            style={{ alignSelf: "flex-start", background: allAnswered && !loading ? "var(--warm)" : "var(--bg4)", color: allAnswered && !loading ? "#fff" : "var(--text4)" }}>
            {loading ? <span className="dot-l"><span /><span /><span /></span> : "Own It →"}
          </button>
        )}
        {mirror && (
          <div className="fade-in" style={{ padding: "14px 18px", background: "rgba(201,168,76,.07)", border: "1px solid rgba(201,168,76,.22)", borderRadius: 10 }}>
            <div style={{ fontFamily: "var(--sans)", fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "var(--warm)", marginBottom: 8 }}>Your truth, in your words</div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 17, fontStyle: "italic", fontWeight: 300, color: "var(--text)", lineHeight: 1.8 }}>{mirror}</div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text4)", marginTop: 10, lineHeight: 1.6 }}>
              That's what you carry forward. Not what was reflected at you — what you know.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OwnItField({ id, value, onChange, placeholder, disabled }) {
  const ref = useRef(null);
  const lastVal = useRef(value);
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current && value !== lastVal.current) {
      ref.current.value = value || "";
      lastVal.current = value;
    }
  }, [value]);
  const handleChange = useCallback((e) => { lastVal.current = e.target.value; onChange(id, e.target.value); }, [id, onChange]);
  return (
    <textarea ref={ref} rows={2} placeholder={placeholder} defaultValue={value || ""} onChange={handleChange} disabled={disabled}
      className="to-field" style={{ fontSize: 13, marginTop: 6, opacity: disabled ? 0.5 : 1 }} />
  );
}

const TextArea = ({ value, onChange, rows, placeholder, className, style: s }) => {
  const ref = useRef(null);
  const lastVal = useRef(value);
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current && value !== lastVal.current) {
      ref.current.value = value || "";
      lastVal.current = value;
    }
  }, [value]);
  const handleChange = (e) => { lastVal.current = e.target.value; onChange(e.target.value); };
  return (
    <textarea ref={ref} rows={rows || 4} placeholder={placeholder} defaultValue={value || ""}
      onChange={handleChange} className={`to-field${className ? " " + className : ""}`} style={s} />
  );
};

const TextInput = ({ value, onChange, placeholder, style: s }) => {
  const ref = useRef(null);
  const lastVal = useRef(value);
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current && value !== lastVal.current) {
      ref.current.value = value || "";
      lastVal.current = value;
    }
  }, [value]);
  const handleChange = (e) => { lastVal.current = e.target.value; onChange(e.target.value); };
  return (
    <input type="text" ref={ref} placeholder={placeholder} defaultValue={value || ""}
      onChange={handleChange} className="to-field" style={{ ...(s || {}), resize: "none" }} />
  );
};

function VoiceDropdown({ voiceId, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const v = VOICES[voiceId];
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 7, background: v.muted, border: `1px solid ${v.border}`, borderRadius: 20, padding: "5px 13px", cursor: "pointer" }}>
        <span style={{ color: v.color, fontSize: 13 }}>{v.icon}</span>
        <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: v.color, fontWeight: 700 }}>{v.short}</span>
        <span style={{ color: "var(--text4)", fontSize: 9 }}>▾</span>
      </button>
      {open && (
        <div className="fade-in" style={{ position: "absolute", top: "calc(100% + 7px)", right: 0, background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 12, padding: 7, zIndex: 300, minWidth: 230, boxShadow: "0 20px 60px rgba(0,0,0,.65)" }}>
          {Object.values(VOICES).map(vv => (
            <button key={vv.id} onClick={() => { onSelect(vv.id); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 11px", background: vv.id === voiceId ? vv.muted : "transparent", border: "none", borderRadius: 7, cursor: "pointer", textAlign: "left" }}>
              <span style={{ color: vv.color, fontSize: 14, minWidth: 17 }}>{vv.icon}</span>
              <div>
                <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: vv.id === voiceId ? vv.color : "var(--text)", fontWeight: vv.id === voiceId ? 500 : 400 }}>{vv.label}</div>
                <div style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text4)", marginTop: 1 }}>{VOICE_DESC[vv.id].slice(0, 42)}…</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VoiceGrid({ selected, onSelect }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
      {Object.values(VOICES).map(vv => (
        <button key={vv.id} onClick={() => onSelect(vv.id)}
          style={{ padding: "13px 14px", background: vv.id === selected ? vv.muted : "var(--bg3)", border: `1px solid ${vv.id === selected ? vv.border : "var(--border)"}`, borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all .18s", fontFamily: "var(--sans)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
            <span style={{ color: vv.color, fontSize: 15 }}>{vv.icon}</span>
            <span style={{ fontSize: 12, color: vv.id === selected ? vv.color : "var(--text)", fontWeight: 500 }}>{vv.label}</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text4)", lineHeight: 1.45 }}>{VOICE_DESC[vv.id]}</div>
          {vv.id === selected && <div style={{ marginTop: 7, fontSize: 10, color: vv.color, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase" }}>✓ Selected</div>}
        </button>
      ))}
    </div>
  );
}

// AIChat — Katherine sees EVERYTHING the client has entered so far
function AIChat({ voiceId, onVoiceChange, name, intake, mapData, sectionLabel, placeholder }) {
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const v = VOICES[voiceId];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    const text = inputRef.current?.value?.trim();
    if (!text || loading) return;
    inputRef.current.value = "";
    const newMsgs = [...msgs, { role: "user", content: text }];
    setMsgs(newMsgs);
    setLoading(true);
    try {
      const history = newMsgs.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const reply = await callAI(voiceId, name, intake, mapData, text, history.slice(0, -1));
      setMsgs(prev => [...prev, { role: "assistant", content: reply, vid: voiceId }]);
    } catch {
      setMsgs(prev => [...prev, { role: "assistant", content: "Something went wrong.", vid: voiceId }]);
    }
    setLoading(false);
  };

  // Context awareness strip — shows what Katherine can see
  const contextItems = [];
  if ((mapData?.purpose_layers || []).filter(l => (l||"").trim()).length > 0) contextItems.push("purpose peeling");
  if (mapData?.purpose_final || mapData?.purpose_draft) contextItems.push("purpose statement");
  if (mapData?.bag_time || mapData?.bag_wealth || mapData?.bag_growth) contextItems.push("BAG");
  if ((mapData?.animals || []).filter(a => a.name).length > 0) contextItems.push("animals");
  if ((mapData?.values || []).filter(v => v.name).length > 0) contextItems.push("values");
  if (mapData?.align_direction !== undefined) contextItems.push("alignment scores");

  return (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "9px 13px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: v.color, animation: "pulse 2s infinite" }} />
          <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: v.color, fontWeight: 700 }}>{v.label}</span>
        </div>
        <VoiceDropdown voiceId={voiceId} onSelect={onVoiceChange} />
      </div>

      {/* What Katherine can see — context strip */}
      {contextItems.length > 0 && (
        <div style={{ padding: "7px 13px", borderBottom: "1px solid var(--border)", background: "rgba(201,168,76,.04)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--sans)", fontSize: 10, color: "var(--text4)", letterSpacing: 1, textTransform: "uppercase", flexShrink: 0 }}>Katherine can see:</span>
          {contextItems.map(item => (
            <span key={item} style={{ fontFamily: "var(--sans)", fontSize: 10, color: "var(--warm)", background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 10, padding: "2px 8px" }}>{item}</span>
          ))}
        </div>
      )}

      {/* Messages */}
      {msgs.length > 0 && (
        <div style={{ maxHeight: 270, overflowY: "auto", padding: "13px" }}>
          {msgs.map((m, i) => {
            const mv = m.vid ? VOICES[m.vid] : v;
            return (
              <div key={i} style={{ marginBottom: 13, display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.role === "user"
                  ? <div style={{ background: "var(--bg4)", border: "1px solid var(--border2)", borderRadius: "11px 11px 3px 11px", padding: "9px 13px", maxWidth: "80%", fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{m.content}</div>
                  : <div style={{ maxWidth: "90%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                      <span style={{ color: mv.color, fontSize: 12 }}>{mv.icon}</span>
                      <span style={{ fontSize: 11, color: "var(--text4)", fontWeight: 500 }}>{mv.short}</span>
                    </div>
                    <div style={{ fontFamily: "var(--serif)", fontSize: 17, lineHeight: 1.85, color: "var(--text)", fontWeight: 300, borderLeft: `2px solid ${mv.border}`, paddingLeft: 11 }}>{m.content}</div>
                  </div>
                }
              </div>
            );
          })}
          {loading && <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 13 }}><span style={{ color: v.color, fontSize: 12 }}>{v.icon}</span><div className="dot-l" style={{ color: v.color }}><span /><span /><span /></div></div>}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "9px 11px", borderTop: msgs.length > 0 ? "1px solid var(--border)" : "none", display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea ref={inputRef} rows={2}
          placeholder={placeholder || `Ask Katherine about your ${sectionLabel || "progress"}...`}
          className="to-field"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          style={{ flex: 1, minHeight: 52, fontSize: 13, padding: "9px 11px", borderRadius: 8 }} />
        <button onClick={send} disabled={loading}
          style={{ background: loading ? "var(--bg4)" : v.color, border: "none", borderRadius: 8, color: loading ? "var(--text4)" : "#000", cursor: loading ? "not-allowed" : "pointer", fontSize: 18, padding: "11px 15px", transition: "all .2s", lineHeight: 1 }}>
          →
        </button>
      </div>
      <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "right", padding: "0 11px 7px" }}>Enter to send · Shift+Enter for new line</div>
    </div>
  );
}

function VideoBlock({ title, duration, points }) {
  return (
    <div className="vid-block">
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--warm)", fontSize: 13 }}>▶</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <div style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 400, color: "#e8e4dc", lineHeight: 1.3 }}>{title}</div>
          <div style={{ fontSize: 11, color: "var(--text4)", flexShrink: 0, marginLeft: 10 }}>{duration}</div>
        </div>
        <div style={{ fontSize: 11, color: "#7a9bb0", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 5, fontWeight: 500 }}>Katherine covers:</div>
        {points.map((p, i) => (
          <div key={i} style={{ fontSize: 12, color: "#9eb3c2", lineHeight: 1.6, paddingLeft: 9, position: "relative", marginBottom: 2 }}>
            <span style={{ position: "absolute", left: 0, color: "var(--warm)" }}>·</span>{p}
          </div>
        ))}
        <div style={{ marginTop: 9, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--warm)", background: "rgba(201,168,76,.07)", border: "1px solid rgba(232,149,109,.16)", borderRadius: 18, padding: "3px 11px" }}>
          ▶ Video placeholder — record to this brief
        </div>
      </div>
    </div>
  );
}

function Intake({ onDone }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");
  const [busy, setBusy] = useState(false);
  const [assigned, setAssigned] = useState(null);
  const [chosen, setChosen] = useState(null);

  const submit3 = async () => {
    setBusy(true);
    await new Promise(r => setTimeout(r, 800));
    const v = detectVoice(q3);
    setAssigned(v); setChosen(v);
    setBusy(false); setStep(4);
  };

  const KNote = ({ children }) => (
    <div style={{ padding: "13px 17px", background: "rgba(201,168,76,.07)", border: "1px solid rgba(201,168,76,.14)", borderRadius: 9, marginBottom: 18 }}>
      <div style={{ fontFamily: "var(--serif)", fontSize: 15, fontStyle: "italic", color: "var(--text2)", lineHeight: 1.7 }}>{children}</div>
    </div>
  );

  const screens = [
    <div key="n" className="fade-up" style={{ maxWidth: 480 }}>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: "#c9a84c", marginBottom: 11, fontFamily: "var(--sans)" }}>AG45 · True Ownership</div>
      <h1 style={{ fontFamily: "var(--serif)", fontSize: 48, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.5px", marginBottom: 14 }}>This is where<br /><em>ownership begins.</em></h1>
      <p style={{ fontSize: 15, color: "var(--text)", lineHeight: 1.8, maxWidth: 400, marginBottom: 28 }}>Not the business kind. The kind that changes everything — how you show up, what you build, who you become.</p>
      <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: 13, color: "var(--text3)", marginBottom: 7 }}>What's your first name?</label>
      <TextInput value={name} onChange={setName} placeholder="Your name..." style={{ fontSize: 13, fontWeight: 500, padding: "15px 19px", marginBottom: 20 }} />
      <button className="btn" disabled={!name.trim()} onClick={() => setStep(1)}>Begin →</button>
    </div>,

    <div key="q1" className="fade-up" style={{ maxWidth: 520 }}>
      <div className="lbl" style={{ marginBottom: 9 }}>Question 1 of 3</div>
      <h2 style={{ fontFamily: "var(--serif)", fontSize: 36, fontWeight: 400, lineHeight: 1.15, marginBottom: 18, letterSpacing: "-0.4px" }}>What brought you here, {name}?</h2>
      <KNote>"In one sentence — what's the thing that finally made you say: I need to do this work."</KNote>
      <TextArea value={q1} onChange={setQ1} rows={4} placeholder="What brought me here is..." style={{ marginBottom: 16 }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="btn-g" onClick={() => setStep(0)}>← Back</button>
        <button className="btn" disabled={!q1.trim()} onClick={() => setStep(2)}>Next →</button>
      </div>
    </div>,

    <div key="q2" className="fade-up" style={{ maxWidth: 520 }}>
      <div className="lbl" style={{ marginBottom: 9 }}>Question 2 of 3</div>
      <h2 style={{ fontFamily: "var(--serif)", fontSize: 36, fontWeight: 400, lineHeight: 1.15, marginBottom: 18, letterSpacing: "-0.4px" }}>Who are you becoming?</h2>
      <KNote>"Don't think about your business or role. In 3 years, living fully as yourself — what's one word or phrase that describes who that person is?"</KNote>
      <TextArea value={q2} onChange={setQ2} rows={4} placeholder="In 3 years, I am..." style={{ marginBottom: 16 }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="btn-g" onClick={() => setStep(1)}>← Back</button>
        <button className="btn" disabled={!q2.trim()} onClick={() => setStep(3)}>Next →</button>
      </div>
    </div>,

    <div key="q3" className="fade-up" style={{ maxWidth: 520 }}>
      <div className="lbl" style={{ marginBottom: 9 }}>Question 3 of 3</div>
      <h2 style={{ fontFamily: "var(--serif)", fontSize: 36, fontWeight: 400, lineHeight: 1.15, marginBottom: 18, letterSpacing: "-0.4px" }}>What do you most need?</h2>
      <KNote>"What do you most need from this experience — permission, clarity, a push, or something else? Say it in your own words."</KNote>
      <TextArea value={q3} onChange={setQ3} rows={4} placeholder="What I most need is..." style={{ marginBottom: 16 }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="btn-g" onClick={() => setStep(2)}>← Back</button>
        <button className="btn" disabled={!q3.trim() || busy} onClick={submit3}>
          {busy ? <span className="dot-l"><span /><span /><span /></span> : "Find my voice →"}
        </button>
      </div>
    </div>,

    <div key="v" className="fade-up" style={{ maxWidth: 590 }}>
      {assigned && chosen && (() => {
        const av = VOICES[assigned];
        return <>
          <div className="lbl" style={{ marginBottom: 13 }}>Your default voice</div>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 34, fontWeight: 400, lineHeight: 1.2, marginBottom: 9, letterSpacing: "-0.3px" }}>Based on what you shared,<br /><em>I'm starting you with:</em></h2>
          <div style={{ padding: "19px 22px", background: av.muted, border: `1px solid ${av.border}`, borderRadius: 13, marginBottom: 7 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 9 }}>
              <span style={{ color: av.color, fontSize: 24 }}>{av.icon}</span>
              <div style={{ fontFamily: "var(--serif)", fontSize: 21, color: av.color, fontWeight: 400 }}>{av.label}</div>
            </div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--text2)", lineHeight: 1.7, marginBottom: 7 }}>{VOICE_DESC[assigned]}</div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text3)", fontStyle: "italic" }}>Why: {VOICE_REASON[assigned]}</div>
          </div>
          <div style={{ padding: "9px 13px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 12 }}>
            <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text2)", fontWeight: 500 }}>Not right for today? </span>
            <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text3)" }}>Choose the voice you actually need — you can switch any time.</span>
          </div>
          <VoiceGrid selected={chosen} onSelect={setChosen} />
          <div style={{ marginTop: 18 }}>
            <button className="btn" onClick={() => onDone({ name, q1, q2, q3, defaultVoice: chosen })}>Begin All In It →</button>
          </div>
        </>;
      })()}
    </div>,
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "36px 22px 80px" }}>
      {screens[step]}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(13,27,46,.95)", borderTop: "1px solid #254060", padding: "8px 28px", display: "flex", alignItems: "center", gap: 8, zIndex: 40 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warm)", animation: "pulse 2s infinite", flexShrink: 0 }} />
        <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text4)" }}>Your answers are saved automatically — you can come back to this any time</span>
      </div>
    </div>
  );
}

const STEPS = [
  { id: "intro", label: "Introduction" },
  { id: "mirror1", label: "Purpose · Direction" },
  { id: "mirror2", label: "Identity · Superpowers" },
  { id: "mirror3", label: "Values · Behaviors" },
  { id: "align", label: "Alignment Check" },
  { id: "map", label: "My Map of Me" },
];

const EMPTY_MAP = {
  purpose_layers: [""],
  purpose_draft: "", purpose_final: "",
  bag_time: "", bag_wealth: "", bag_growth: "",
  identity_adjectives: "",
  animals: [{ name: "", adjective1: "", adjective2: "", alignment: 5 }],
  capabilities_note: "",
  values_irks: "",
  values: [{ name: "", irk: "", behaviors: "" }],
  behaviors_note: "",
  align_direction: 5, align_superpowers: 5, align_behaviors: 5,
};

const MIRROR_CARDS = [
  {
    side: "internal", id: "purpose", icon: "🔥", label: "Purpose", color: "#c9a84c",
    colorMuted: "rgba(232,149,109,0.08)", colorBorder: "rgba(232,149,109,0.2)", pair: "mirror1",
    tagline: "Your internal north star",
    description: "Purpose is the internal reason you exist — the impact your presence creates regardless of any role or outcome. Not your business, not your family — those are expressions of it. Your purpose stays constant when everything else changes. Short enough to say in the car. True enough to get you out of bed on a hard day.",
    katherine: "\"When I ask people what their purpose is, they usually say their kids or their business. That's not purpose — those are attachments. Purpose needs to be 100% internal to you.\"",
  },
  {
    side: "internal", id: "identity", icon: "🦁", label: "Identity", color: "#c9a84c",
    colorMuted: "rgba(79,203,242,0.08)", colorBorder: "rgba(79,203,242,0.2)", pair: "mirror2",
    tagline: "Who you are at your best",
    description: "Identity is your internal superpowers anchored to animals — because people remember images, not word lists. Two adjectives make it specific to you, not the generic animal. And if you're too aligned with one animal, you might be in detriment of the others.",
    katherine: "\"I had a client tell me: 'I was in my crazy monkey and I realized I needed to bring the lion out.' That's how this works — you glance at it and immediately know what you need.\"",
  },
  {
    side: "internal", id: "values", icon: "⚖️", label: "Values", color: "#34d399",
    colorMuted: "rgba(52,211,153,0.08)", colorBorder: "rgba(52,211,153,0.2)", pair: "mirror3",
    tagline: "The standards you live by",
    description: "Values are how you make decisions and set boundaries — the standards that, when violated, make your blood boil. The fastest way to find them: what behaviors in others do you absolutely cannot stand? Peel back one layer and you'll find your value underneath.",
    katherine: "\"Someone told me she hated people who weren't accountable. Two minutes later we'd identified accountability as her top value — she'd just never named it.\"",
  },
  {
    side: "external", id: "direction", icon: "⛰️", label: "Direction", color: "#c9a84c",
    colorMuted: "rgba(79,203,242,0.08)", colorBorder: "rgba(79,203,242,0.2)", pair: "mirror1",
    tagline: "Your Big Ass Goal — the summit",
    description: "Your BAG — Big Ass Goal — is the 10–15 year dream across Time (how you live your days), Wealth (financial freedom), and Growth (who you're becoming as a person). It should feel dreamy and a bit scary. About 25% believable. If you can see exactly how to get there, it's not big enough.",
    katherine: "\"Start at the top of the mountain. We work backwards from there. Most people set goals from where they are. We set them from where we want to be.\"",
  },
  {
    side: "external", id: "superpowers", icon: "⚡", label: "Superpowers", color: "#a78bfa",
    colorMuted: "rgba(167,139,250,0.08)", colorBorder: "rgba(167,139,250,0.2)", pair: "mirror2",
    tagline: "How your identity shows up in the world",
    description: "Each animal has a superpower and a detriment. The superpower is what it enables when working for you. The detriment is what happens when it goes too far. Knowing both lets you call on the right animal at the right moment — and catch yourself when one is running unchecked.",
    katherine: "\"The superpower is why you chose this animal. The dark side is the thing that costs you when it's out of balance. Both are data.\"",
  },
  {
    side: "external", id: "behaviors", icon: "🎯", label: "Behaviors", color: "#34d399",
    colorMuted: "rgba(52,211,153,0.08)", colorBorder: "rgba(52,211,153,0.2)", pair: "mirror3",
    tagline: "How your values show up in action",
    description: "Behaviors are the external proof of your values. Not what you believe — how you act when it costs you something. For each value we define what living it looks like, and the violation signal that tells you it's being stomped on. Values become a decision filter, not a motivational poster.",
    katherine: "\"A value without a behavior attached to it is just a word on a wall. We define the behavior so you can actually use it.\"",
  },
];

function SoWhatLayer({ index, value, onChange, isLatest, onGoDeeper, onReachedBottom, loading, done }) {
  const ref = useRef(null);
  const lastVal = useRef(value);
  const isFirst = index === 0;
  const depth = Math.min(index + 1, 5);
  const depthColor = ["rgba(201,168,76,0.45)", "rgba(201,168,76,0.6)", "rgba(201,168,76,0.75)", "rgba(201,168,76,0.9)", "#c9a84c"][depth - 1];

  useEffect(() => {
    if (!isFirst && isLatest && ref.current && !done) {
      setTimeout(() => ref.current?.focus(), 80);
    }
  }, [isLatest, isFirst, done]);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.value = value || "";
      lastVal.current = value;
    }
  }, [value]);

  const handleChange = useCallback((e) => { lastVal.current = e.target.value; onChange(e.target.value); }, [onChange]);
  const handleBlur = useCallback((e) => {
    lastVal.current = e.target.value;
    onChange(e.target.value);
    e.target.style.borderColor = "var(--border2)";
    e.target.style.boxShadow = "none";
  }, [onChange]);

  const hasAnswer = (ref.current?.value || value || "").trim().length > 0;

  return (
    <div className={isFirst ? "" : "fade-up"} style={{ marginBottom: 18, paddingLeft: isFirst ? 0 : 22, borderLeft: isFirst ? "none" : `2px solid ${depthColor}`, position: "relative" }}>
      {!isFirst && (
        <div style={{ position: "absolute", left: -10, top: 13, width: 18, height: 18, borderRadius: "50%", background: "var(--bg3)", border: `2px solid ${depthColor}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 8, color: depthColor, fontWeight: 700 }}>{index + 1}</span>
        </div>
      )}
      <div style={{ marginBottom: 7 }}>
        {isFirst ? (
          <>
            <div style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>When are you most alive?</div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text3)", lineHeight: 1.5 }}>Describe what you're DOING — not just the feeling. What are you creating, solving, connecting?</div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <div style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: depthColor }}>So what's?</div>
              {index >= 3 && <div style={{ fontFamily: "var(--sans)", fontSize: 10, color: "var(--text4)", fontStyle: "italic" }}>{index === 3 ? "Getting deeper..." : index === 4 ? "Almost there..." : "Keep going..."}</div>}
            </div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text3)", lineHeight: 1.5 }}>
              {index === 1 ? "What does that give you? What does it give others? Don't settle for the first answer." : "And what does THAT mean at a deeper level? Keep asking until something feels final."}
            </div>
          </>
        )}
      </div>
      <textarea ref={ref} rows={3} placeholder={isFirst ? "I feel most alive when I'm..." : "And that gives me / means..."}
        defaultValue={value || ""} onChange={handleChange} onBlur={handleBlur} disabled={done && !isLatest}
        className="purpose-peel-ta"
        style={{ width: "100%", background: "var(--bg4)", border: "1px solid var(--border2)", borderRadius: 10, color: "var(--warm)", fontFamily: "var(--sans)", fontSize: 13, lineHeight: 1.7, padding: "12px 14px", outline: "none", resize: "none", opacity: done && !isLatest ? 0.6 : 1 }}
        onFocus={e => { e.target.style.borderColor = "var(--warm)"; e.target.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.12)"; }}
      />
      {isLatest && hasAnswer && !done && (
        <div className="fade-up" style={{ display: "flex", gap: 9, marginTop: 10, flexWrap: "wrap" }}>
          <button onClick={onGoDeeper} disabled={loading}
            style={{ background: "none", border: "1px solid var(--border2)", borderRadius: 20, color: "var(--text2)", cursor: "pointer", fontFamily: "var(--sans)", fontSize: 12, fontWeight: 500, padding: "7px 18px", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--warm)"; e.currentTarget.style.color = "var(--warm)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text2)"; }}>
            {loading ? <span className="dot-l" style={{ color: "var(--warm)" }}><span /><span /><span /></span> : "↓ So what's?"}
          </button>
          <button onClick={onReachedBottom} disabled={loading}
            style={{ background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.3)", borderRadius: 20, color: "var(--warm)", cursor: "pointer", fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, padding: "7px 18px" }}>
            ✓ I've reached the bottom
          </button>
          {index >= 1 && <button onClick={onReachedBottom} disabled={loading} style={{ background: "none", border: "1px solid rgba(201,168,76,.3)", borderRadius: 20, color: "var(--warm)", cursor: "pointer", fontFamily: "var(--sans)", fontSize: 12, fontWeight: 500, padding: "7px 18px" }}>✓ Save this layer</button>}
        </div>
      )}
    </div>
  );
}

function PurposePeelingInline({ layers, onLayersChange, purposeFinal, onFinalChange, purposeResult, onResult, name, intake, allSessions, onSessionSave }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!!purposeResult);
  const [sessionKey, setSessionKey] = useState(0);
  const [peelingExpanded, setPeelingExpanded] = useState(false);
  const sessions = allSessions || [];

  const updateLayer = useCallback((i, val) => {
    const next = [...layers]; next[i] = val; onLayersChange(next);
  }, [layers, onLayersChange]);

  const goDeeper = useCallback(() => {
    const domTextareas = document.querySelectorAll('.purpose-peel-ta');
    if (domTextareas.length > 0) {
      const domValues = Array.from(domTextareas).map(ta => ta.value || "");
      onLayersChange([...domValues, ""]);
    } else {
      onLayersChange([...layers, ""]);
    }
  }, [layers, onLayersChange]);

  const reachedBottom = useCallback(async () => {
    const domTextareas = document.querySelectorAll('.purpose-peel-ta');
    const currentLayers = domTextareas.length > 0
      ? Array.from(domTextareas).map(ta => ta.value || "")
      : layers;
    const filledLayers = currentLayers.filter(l => (l || "").trim());
    if (filledLayers.length === 0) return;
    setLoading(true);
    let errorMsg = null;
    try {
      const layerText = currentLayers.map((l, i) => i === 0 ? `Most alive: "${l}"` : `So what's ${i}: "${l}"`).join("\n");
      const prevContext = sessions.length > 0
        ? `\nPrevious sessions: ${sessions.map((s, si) => `Session ${si + 1} draft: "${s.draft || ""}" verbs: ${(s.verbs || []).join(", ")}`).join("; ")}`
        : "";
      const res = await fetch("/api/claude", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 600,
          messages: [{ role: "user", content: `You are Katherine Breuss. ${name} just completed a purpose peeling exercise. Read their EXACT words carefully and respond based on what THEY specifically wrote — not generic coaching language.\n\nTheir peeling layers:\n${layerText}\n\nWhat brought them here: "${intake?.q1 || ""}"\n${prevContext}\n${sessions.length > 0 ? "This is a return session." : ""}\n\nRespond ONLY with a JSON object. No preamble, no markdown, no explanation. Just the JSON:\n{"working":"1 sentence quoting their actual words","verbs":["verb1","verb2","verb3"],"draft":"short purpose statement built from their specific words — must sound like them not a template","refining_question":"one question specific to what they wrote","deeper_note":"${sessions.length > 0 ? "1 sentence on how this session differs from previous ones" : ""}"}` }]
        })
      });
      const data = await res.json();

      // Check for API errors
      if (data.error) throw new Error(`API error: ${data.error.message}`);

      const rawText = data.content?.map(b => b.text || "").join("") || "";
      if (!rawText) throw new Error("Empty response from API");

      // Try to extract JSON even if there's surrounding text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error(`No JSON found in: ${rawText.slice(0, 100)}`);

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.draft) throw new Error(`Missing draft field in: ${JSON.stringify(parsed)}`);

      if (onSessionSave) onSessionSave({ ...parsed, layers: [...currentLayers], date: new Date().toLocaleDateString() });
      onResult({ ...parsed });
      onFinalChange(parsed.draft || "");
      setDone(true);
    } catch (e) {
      errorMsg = e.message;
      // Fallback uses their actual words, not a template
      const lastLayer = currentLayers.filter(l => (l||"").trim()).slice(-1)[0] || "";
      const firstLayer = currentLayers[0] || "";
      const fallback = {
        working: `You went ${currentLayers.filter(l=>(l||"").trim()).length} layers deep — that takes honesty.`,
        verbs: firstLayer.split(/\s+/).filter(w => w.length > 4).slice(0, 3),
        draft: lastLayer.length > 10 ? lastLayer.slice(0, 120) : firstLayer.slice(0, 120),
        refining_question: "Read back what you wrote in your deepest layer. Is that your purpose, or is there still one more 'so what's?' left?",
        deeper_note: sessions.length > 0 ? "You returned — that alone tells you something." : "",
        _error: errorMsg
      };
      if (onSessionSave) onSessionSave({ ...fallback, layers: [...currentLayers], date: new Date().toLocaleDateString() });
      onResult({ ...fallback });
      onFinalChange(fallback.draft);
      setDone(true);
    }
    setLoading(false);
  }, [name, intake, onResult, onFinalChange, sessions, onSessionSave, purposeFinal, layers]);

  const latestIndex = layers.length - 1;

  const restartPeeling = useCallback(() => {
    onLayersChange([""]);
    onResult(null);
    onFinalChange(""); // clear the pre-filled draft so new session starts fresh
    setDone(false);
    setSessionKey(k => k + 1);
  }, [onLayersChange, onResult, onFinalChange]);

  return (
    <div>
      {sessions.length > 0 && (
        <div style={{ marginBottom: 16, padding: "11px 14px", background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 9 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text4)", marginBottom: 8 }}>Previous sessions</div>
          {sessions.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: i < sessions.length - 1 ? 8 : 0, paddingBottom: i < sessions.length - 1 ? 8 : 0, borderBottom: i < sessions.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontSize: 10, color: "var(--text4)", flexShrink: 0, marginTop: 2 }}>{s.date || `Session ${i + 1}`}</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 13, fontStyle: "italic", color: "var(--text3)", lineHeight: 1.5, flex: 1 }}>"{s.draft || ""}"</div>
              <div style={{ fontSize: 10, color: "var(--text4)", flexShrink: 0 }}>{(s.layers || []).length} layers</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: "11px 14px", background: "rgba(201,168,76,.07)", border: "1px solid rgba(201,168,76,.18)", borderRadius: 9, marginBottom: 18 }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 14, fontStyle: "italic", color: "var(--text2)", lineHeight: 1.7 }}>
          {sessions.length > 0
            ? `"Welcome back, ${name}. Each time you return to this, you go deeper. What surfaces today may be different — and that is the point."`
            : '"Purpose is discovered by peeling — not by thinking hard. Answer each so what\'s? until something feels final."'
          }
        </div>
      </div>

      {done && !peelingExpanded && (
        <div className="fade-in" style={{ marginBottom:14, padding:"12px 14px", background:"rgba(201,168,76,.06)", border:"1px solid rgba(201,168,76,.18)", borderRadius:9 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--text4)", marginBottom:6 }}>Your purpose statement</div>
          <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--warm)", lineHeight:1.6, marginBottom:10 }}>"{purposeFinal || "Not yet written"}"</div>
          <button onClick={() => setPeelingExpanded(true)} style={{ background:"none", border:"1px solid var(--border2)", borderRadius:20, color:"var(--text3)", cursor:"pointer", fontFamily:"var(--sans)", fontSize:11, padding:"5px 14px" }}>▾ Show peeling layers</button>
        </div>
      )}
      {(!done || peelingExpanded) && layers.map((layer, i) => (
        <SoWhatLayer key={`${sessionKey}-${i}`} index={i} value={layer}
          onChange={v => updateLayer(i, v)}
          isLatest={i === latestIndex} onGoDeeper={goDeeper}
          onReachedBottom={reachedBottom} loading={loading} done={done} />
      ))}

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 0", color: "var(--warm)" }}>
          <span className="dot-l"><span /><span /><span /></span>
          <span style={{ fontFamily: "var(--sans)", fontSize: 13 }}>Katherine is reading your layers...</span>
        </div>
      )}

      {purposeResult && (
        <div className="fade-in" style={{ marginTop: 8 }}>
          {purposeResult._error && (
            <div style={{ padding: "8px 12px", background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 7, marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>API fallback fired — Katherine used your raw words instead</div>
              <div style={{ fontSize: 11, color: "var(--text4)", fontFamily: "var(--sans)" }}>Error: {purposeResult._error}</div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "9px 14px", background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.14)", borderRadius: 7 }}>
            <div style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text3)" }}>
              You peeled <span style={{ color: "var(--warm)", fontWeight: 700 }}>{layers.length} layer{layers.length !== 1 ? "s" : ""}</span> deep
              {layers.length >= 3 && <span style={{ color: "var(--warm)" }}> · Good work</span>}
              {sessions.length > 0 && <span style={{ color: "var(--text4)" }}> · Session {sessions.length}</span>}
            </div>
          </div>

          {purposeResult.deeper_note && (
            <div style={{ padding: "10px 14px", background: "rgba(201,168,76,.05)", border: "1px solid rgba(201,168,76,.15)", borderRadius: 7, marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--warm)", marginBottom: 4 }}>Since last time</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 13, fontStyle: "italic", color: "var(--text2)", lineHeight: 1.6 }}>{purposeResult.deeper_note}</div>
            </div>
          )}

          <ResultCard color="#34d399" label="What is working">{purposeResult.working}</ResultCard>

          {purposeResult.verbs && (
            <div style={{ padding: "11px 14px", background: "var(--bg3)", borderLeft: "2px solid var(--warm)", borderRadius: "0 7px 7px 0", marginBottom: 7 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--warm)", marginBottom: 7 }}>Your verbs</div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {purposeResult.verbs.map((v, i) => (
                  <div key={i} style={{ padding: "4px 13px", background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.25)", borderRadius: 20, fontFamily: "var(--serif)", fontSize: 14, fontStyle: "italic", color: "var(--warm)" }}>{v}</div>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: "14px 16px", background: "rgba(201,168,76,.05)", border: "1px solid rgba(201,168,76,.22)", borderRadius: 9, marginBottom: 7 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--warm)", marginBottom: 8 }}>A purpose statement to consider</div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 18, fontStyle: "italic", fontWeight: 400, color: "var(--text)", lineHeight: 1.6, marginBottom: 3 }}>"{purposeResult.draft || ""}"</div>
            <div style={{ fontSize: 11, color: "var(--text4)" }}>Starting point — not a verdict. Edit until it is yours.</div>
          </div>

          {purposeResult.refining_question && (
            <div style={{ padding: "11px 14px", background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 7, marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text4)", marginBottom: 4 }}>A question to sit with</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 14, fontStyle: "italic", color: "var(--text2)", lineHeight: 1.6 }}>{purposeResult.refining_question}</div>
            </div>
          )}

          <OwnItCheck context="purpose feedback" storageKey="ownit_purpose" onComplete={r => { }} />

          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>Your final purpose statement</div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text3)", marginBottom: 8, lineHeight: 1.5 }}>In your own words. Short enough to say in the car. You should feel it.</div>
            <textarea value={purposeFinal} onChange={e => onFinalChange(e.target.value)} rows={2}
              placeholder="My purpose is to..."
              style={{ width: "100%", background: "var(--bg4)", border: "1px solid var(--border2)", borderRadius: 10, color: "var(--warm)", fontFamily: "var(--serif)", fontSize: 17, fontStyle: "italic", fontWeight: 400, lineHeight: 1.7, padding: "12px 14px", outline: "none", resize: "none" }}
              onFocus={e => { e.target.style.borderColor = "var(--warm)"; e.target.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--border2)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div style={{ marginTop: 16, padding: "14px 16px", background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 9 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text4)", marginBottom: 7 }}>This is a living exercise</div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text3)", lineHeight: 1.7, marginBottom: 10 }}>Purpose is not always found in a single sitting. Return when you have fresh eyes — days, weeks, or even months later. Your previous sessions are saved and Katherine will read them alongside your new answers, tracking how you are going deeper each time.</div>
            <button onClick={restartPeeling}
              style={{ background: "none", border: "1px solid var(--border2)", borderRadius: 20, color: "var(--text2)", cursor: "pointer", fontFamily: "var(--sans)", fontSize: 12, fontWeight: 500, padding: "7px 16px" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--warm)"; e.currentTarget.style.color = "var(--warm)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text2)"; }}>
              ↩ Go deeper — peel again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({ color, label, children, serif }) {
  return (
    <div style={{ padding: "9px 13px", background: "var(--bg3)", borderLeft: `2px solid ${color}`, borderRadius: "0 7px 7px 0", marginBottom: 7 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color, marginBottom: 4 }}>{label}</div>
      <div style={serif ? { fontFamily: "var(--serif)", fontSize: 16, fontStyle: "italic", fontWeight: 300, color: "var(--text)", lineHeight: 1.6 } : { fontSize: 13, color: "var(--text)", lineHeight: 1.55 }}>{children}</div>
    </div>
  );
}

function MirrorCard({ card, isOpen, onToggle, onGoto }) {
  return (
    <div onClick={() => onToggle(card.id)}
      style={{ background: isOpen ? card.colorMuted : "var(--bg3)", border: `1px solid ${isOpen ? card.colorBorder : "var(--border2)"}`, borderRadius: 10, cursor: "pointer", transition: "background .22s, border-color .22s", overflow: "hidden", marginBottom: 7 }}>
      <div style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{card.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 500, color: isOpen ? card.color : "var(--text2)", transition: "color .2s", lineHeight: 1.2 }}>{card.label}</div>
          <div style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text4)", marginTop: 2, lineHeight: 1.3 }}>{card.tagline}</div>
        </div>
        <div style={{ fontSize: 10, color: isOpen ? card.color : "var(--text4)", transition: "transform .2s, color .2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>▾</div>
      </div>
      {isOpen && (
        <div className="fade-in" style={{ padding: "0 14px 14px" }}>
          <div style={{ height: 1, background: card.colorBorder, marginBottom: 12 }} />
          <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--text2)", lineHeight: 1.75, marginBottom: 12 }}>{card.description}</div>
          <div style={{ padding: "10px 13px", background: "var(--bg4)", borderLeft: `2px solid ${card.colorBorder}`, borderRadius: "0 7px 7px 0", marginBottom: 12 }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: 13, fontStyle: "italic", color: "var(--text3)", lineHeight: 1.7 }}>{card.katherine}</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onGoto(card.pair); }}
            style={{ background: "none", border: `1px solid ${card.colorBorder}`, borderRadius: 20, color: card.color, cursor: "pointer", fontFamily: "var(--sans)", fontSize: 11, fontWeight: 500, padding: "5px 14px" }}>
            Go to this section →
          </button>
        </div>
      )}
    </div>
  );
}

const MirrorIntroCards = React.memo(function MirrorIntroCards({ goto }) {
  const [expanded, setExpanded] = useState(null);
  const toggle = useCallback((id) => setExpanded(prev => prev === id ? null : id), []);
  const internal = MIRROR_CARDS.filter(c => c.side === "internal");
  const external = MIRROR_CARDS.filter(c => c.side === "external");
  return (
    <div style={{ padding: "17px 20px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 11, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "var(--text4)", fontFamily: "var(--sans)" }}>The Mirror Structure</div>
        <div style={{ fontSize: 11, color: "var(--text4)", fontFamily: "var(--sans)", fontStyle: "italic" }}>Tap any card to learn more</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 30px 1fr", gap: 0, alignItems: "start" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--warm)", fontFamily: "var(--sans)", marginBottom: 9, paddingLeft: 2 }}>Internal</div>
          {internal.map(card => <MirrorCard key={card.id} card={card} isOpen={expanded === card.id} onToggle={toggle} onGoto={goto} />)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 26 }}>
          <div style={{ width: 1, height: 24, background: "var(--border)", opacity: 0.5 }} />
          <div style={{ fontSize: 14, color: "var(--text4)", margin: "4px 0" }}>🪞</div>
          <div style={{ width: 1, flex: 1, background: "var(--border)", opacity: 0.5 }} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--accent)", fontFamily: "var(--sans)", marginBottom: 9, paddingLeft: 2 }}>External</div>
          {external.map(card => <MirrorCard key={card.id} card={card} isOpen={expanded === card.id} onToggle={toggle} onGoto={goto} />)}
        </div>
      </div>
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[{ left: "Purpose", right: "Direction", color: "#c9a84c" }, { left: "Identity", right: "Superpowers", color: "#c9a84c" }, { left: "Values", right: "Behaviors", color: "#34d399" }].map(p => (
          <div key={p.left} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 20 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text4)" }}>{p.left}</span>
            <span style={{ fontFamily: "var(--sans)", fontSize: 10, color: "var(--text4)" }}>🪞</span>
            <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text4)" }}>{p.right}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

function A1({ intake, onDone }) {
  const [step, setStep] = useState("intro");
  const [voice, setVoice] = useState(intake.defaultVoice);
  const [done, setDone] = useState([]);
  const [map, setMap] = useState(EMPTY_MAP);
  const [ai, setAi] = useState({});
  const [busy, setBusy] = useState({});
  const [savedAt, setSavedAt] = useState(null);
  const saveTimer = useRef(null);
  const { name } = intake;

  useEffect(() => {
    Promise.all([loadData(KEYS.map), loadData(KEYS.done), loadData(KEYS.step), loadData(KEYS.voice)]).then(([m, d, s, v]) => {
      if (m) setMap({ ...EMPTY_MAP, ...m });
      if (d) setDone(d);
      if (s) setStep(s);
      if (v) setVoice(v);
    });
  }, []);

  const saveMap = useCallback((next) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveData(KEYS.map, next);
      setSavedAt(new Date());
    }, 800);
  }, []);

  const set = useCallback((key, val) => {
    setMap(prev => {
      const next = { ...prev, [key]: val };
      saveMap(next);
      return next;
    });
  }, [saveMap]);

  const setVoicePersist = (v) => { setVoice(v); saveData(KEYS.voice, v); };
  const goto = (s) => { setStep(s); saveData(KEYS.step, s); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const markDone = (s) => setDone(prev => { const n = [...new Set([...prev, s])]; saveData(KEYS.done, n); return n; });

  const runAI = async (key, prompt) => {
    setBusy(b => ({ ...b, [key]: true }));
    const r = await callStructured(prompt);
    setAi(a => ({ ...a, [key]: r }));
    setBusy(b => ({ ...b, [key]: false }));
  };

  const v = VOICES[voice];

  const hdr = (
    <div style={{ borderBottom: "1px solid #1a1a16", padding: "11px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "rgba(13,27,46,.96)", backdropFilter: "blur(12px)", zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warm)", animation: "pulse 3s ease-in-out infinite" }} />
        <div style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700 }}>True Ownership</div>
        <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text4)" }}>· {name}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, opacity: savedAt ? 1 : 0, transition: "opacity .4s" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399" }} />
          <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "#34d399" }}>
            {savedAt ? `Saved ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
          </span>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {["A1", "A2", "A3", "A4", "A5"].map((a, i) => (
            <div key={a} style={{ width: 25, height: 25, borderRadius: "50%", background: i === 0 ? "rgba(201,168,76,.1)" : "transparent", border: `1px solid ${i === 0 ? "rgba(232,149,109,.32)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "var(--sans)", fontSize: 10, color: i === 0 ? "var(--warm)" : "var(--text4)", fontWeight: 500 }}>{a}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const sidebar = (
    <div style={{ width: 186, flexShrink: 0, paddingRight: 22, borderRight: "1px solid var(--border)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "var(--text2)", marginBottom: 15, fontFamily: "var(--sans)" }}>All In It · A1</div>
      {STEPS.map(s => {
        const active = step === s.id, isDone = done.includes(s.id);
        return (
          <button key={s.id} className={`sidebar-btn${active ? " active" : ""}`} onClick={() => goto(s.id)}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: isDone ? "#34d399" : active ? "var(--warm)" : "var(--border2)", flexShrink: 0, transition: "background .3s" }} />
            <span style={{ fontSize: 12, color: active ? "var(--warm)" : isDone ? "var(--text)" : "var(--text2)", fontWeight: active ? 500 : 400, lineHeight: 1.3 }}>{s.label}</span>
          </button>
        );
      })}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "var(--text4)", marginBottom: 7, fontFamily: "var(--sans)" }}>Voice</div>
        <VoiceDropdown voiceId={voice} onSelect={setVoicePersist} />
      </div>
    </div>
  );

  const wrapContent = (children) => (
    <>
      {hdr}
      <div style={{ display: "flex", gap: 32, padding: "32px 28px 80px", maxWidth: 980, margin: "0 auto" }}>
        {sidebar}
        <div style={{ flex: 1, minWidth: 0 }} className="fade-up">{children}</div>
      </div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--bg2)", borderTop: "1px solid var(--border2)", padding: "8px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {savedAt ? (
            <><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", flexShrink: 0 }} /><span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "#34d399" }}>Auto-saved · {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></>
          ) : (
            <><div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text4)", flexShrink: 0 }} /><span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text4)" }}>Auto-saving your answers as you type</span></>
          )}
        </div>
        <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text4)" }}>Your progress is safe — come back any time</span>
      </div>
    </>
  );

  if (step === "intro") return (
    wrapContent(<>
      <div className="lbl" style={{ marginBottom: 13 }}>A1 · All In It</div>
      <h2 style={{ fontFamily: "var(--serif)", fontSize: 40, fontWeight: 400, lineHeight: 1.1, marginBottom: 14, letterSpacing: "-0.5px" }}>
        The Foundation.<br /><em>Before you can go anywhere,<br />you need to know who's going.</em>
      </h2>
      <p style={{ fontSize: 15, color: "var(--text)", lineHeight: 1.8, marginBottom: 26, maxWidth: 520 }}>
        {name}, the Map of Me is a mirror — your internal world reflected against your external reality. Purpose mirrors Direction. Identity mirrors Superpowers. Values mirror Behaviors. We build both sides together.
      </p>
      <VideoBlock title="All In It — Why the Foundation Changes Everything" duration="~8 min"
        points={["Clarity of self before strategy", "The mirror principle — internal reflects external", "How the Map of Me works as a living document", "Why the order of the three mirror pairs is deliberate"]} />
      <MirrorIntroCards goto={goto} />
      <div style={{ padding: "14px 18px", background: "rgba(201,168,76,.07)", border: "1px solid rgba(201,168,76,.14)", borderRadius: 9, marginBottom: 28 }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 16, fontStyle: "italic", color: "var(--text)", lineHeight: 1.8 }}>"Most people skip this part and go straight to strategy. You can't build a life on someone else's foundation. We start here because everything else depends on it."</div>
      </div>
      <button className="btn" onClick={() => goto("mirror1")}>Start with Purpose →</button>
    </>)
  );

  if (step === "mirror1") return (
    wrapContent(<>
      <div className="lbl" style={{ marginBottom: 12 }}>Mirror 1 of 3</div>
      <h2 style={{ fontFamily: "var(--serif)", fontSize: 34, fontWeight: 400, lineHeight: 1.2, marginBottom: 7, letterSpacing: "-0.3px" }}>Purpose <em style={{ color: "var(--text3)", fontSize: 26 }}>reflects</em> Direction</h2>
      <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7, marginBottom: 20, maxWidth: 540 }}>Discover your internal why first — your direction emerges from it.</p>
      <VideoBlock title="Purpose & Direction — Your Why Meets Your Where" duration="~10 min"
        points={["Purpose is 100% internal — not a role, not a business", "The peeling process: asking 'so what's' until something true surfaces", "Your BAG: Time / Wealth / Growth", "How purpose and direction must align"]} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 38px 1fr", gap: 0, marginBottom: 20 }}>
        <div style={{ padding: "14px 16px", background: "rgba(201,168,76,.08)", border: "1px solid rgba(201,168,76,.25)", borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--warm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#0d1b2e", fontWeight: 700 }}>1</span>
            </div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--warm)", letterSpacing: 0.5 }}>Start here — Purpose</div>
          </div>
          <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>Purpose is discovered first because it can't come from the outside in. Peel back through the 'so what's?' until something feels true at a soul level.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "var(--sans)", fontSize: 18, color: "rgba(201,168,76,.4)" }}>→</div>
        </div>
        <div style={{ padding: "14px 16px", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 10, opacity: 0.7 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--bg4)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700 }}>2</span>
            </div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--text3)", letterSpacing: 0.5 }}>Then — Direction</div>
          </div>
          <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text3)", lineHeight: 1.6 }}>Your BAG becomes a natural extension of your purpose. Time, Wealth, Growth. Complete Purpose first.</div>
        </div>
      </div>

      <div className="mirror-grid">
        <div className="mirror-side">
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <span style={{ fontSize: 17 }}>🔥</span>
            <div><div style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--warm)" }}>PURPOSE · Internal</div><div style={{ fontSize: 11, color: "var(--text3)" }}>Your why — independent of any role</div></div>
          </div>
          <PurposePeelingInline
            layers={map.purpose_layers || [""]}
            onLayersChange={v => set("purpose_layers", v)}
            purposeFinal={map.purpose_final || ""}
            onFinalChange={v => set("purpose_final", v)}
            purposeResult={ai.purpose || null}
            onResult={r => {
              // Always replace — never merge old result into new session
              setAi(a => ({ ...a, purpose: r ? { ...r } : null }));
              if (r) {
                set("purpose_draft", r.draft || "");
                // Only pre-fill purpose_final if user hasn't written their own yet
                // This is handled inside PurposePeelingInline via onFinalChange
              }
            }}
            name={name}
            intake={intake}
            allSessions={map.purpose_sessions || []}
            onSessionSave={s => set("purpose_sessions", [...(map.purpose_sessions || []), s])}
          />
        </div>
        <div className="mirror-div">
          <div className="mirror-line" />
          <div style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--border2)", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--text4)", flexShrink: 0 }}>🪞</div>
          <div className="mirror-line" />
        </div>
        <div className="mirror-side">
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <span style={{ fontSize: 17 }}>⛰️</span>
            <div><div style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>DIRECTION · External</div><div style={{ fontSize: 11, color: "var(--text3)" }}>Your BAG — 10–15 year summit</div></div>
          </div>
          <div style={{ padding: "9px 13px", background: "rgba(201,168,76,.05)", border: "1px solid rgba(201,168,76,.1)", borderRadius: 7, marginBottom: 13 }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: 14, fontStyle: "italic", color: "var(--text2)", lineHeight: 1.7 }}>"Dreamy and a bit scary. 25% believable. If you can see exactly how to get there, it's not big enough."</div>
          </div>
          {[
            { key: "bag_time", icon: "⏳", color: "#c9a84c", label: "Time", sub: "How do you want to live your days?", ph: "In 10–15 years, I'm spending my time..." },
            { key: "bag_wealth", icon: "💰", color: "#34d399", label: "Wealth", sub: "What level of wealth creates freedom?", ph: "In 10–15 years, my wealth looks like..." },
            { key: "bag_growth", icon: "🌱", color: "#a78bfa", label: "Growth", sub: "Who are you as a person — not your role?", ph: "In 10–15 years, as a person I am..." },
          ].map(c => (
            <div key={c.key} style={{ marginBottom: 13 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <span style={{ fontSize: 13 }}>{c.icon}</span>
                <label style={{ fontSize: 12, fontWeight: 500, color: c.color }}>{c.label}</label>
                <span style={{ fontSize: 11, color: "var(--text3)" }}> — {c.sub}</span>
              </div>
              <TextArea value={map[c.key]} onChange={val => set(c.key, val)} rows={3} placeholder={c.ph} />
            </div>
          ))}
          {(map.bag_time || map.bag_wealth || map.bag_growth) && !ai.bag && (
            <button onClick={() => runAI("bag", `You are Katherine Breuss reviewing ${name}'s BAG. Time: "${map.bag_time}" Wealth: "${map.bag_wealth}" Growth: "${map.bag_growth}" Purpose: "${map.purpose_draft}". Big enough? Love? Thread? Missing? JSON: {"love":"...","size_feedback":"...","thread":"...","missing":"..."}`)}
              style={{ background: "none", border: "1px solid var(--border2)", borderRadius: 7, color: "var(--text3)", cursor: "pointer", fontFamily: "var(--sans)", fontSize: 11, padding: "7px 13px", width: "100%", marginBottom: 7 }}>
              {busy.bag ? <span className="dot-l"><span /><span /><span /></span> : "✦ Get Katherine's read on your BAG"}
            </button>
          )}
          {ai.bag && (
            <div className="fade-in">
              {[{ k: "love", c: "#34d399", l: "What I love" }, { k: "size_feedback", c: "var(--accent)", l: "Is it big enough?" }, { k: "thread", c: "var(--warm)", l: "The thread", s: true }, { k: "missing", c: "#f59e0b", l: "Consider adding" }].filter(f => ai.bag[f.k]).map(f => (
                <ResultCard key={f.k} color={f.c} label={f.l} serif={f.s}>{f.s ? `"${ai.bag[f.k]}"` : ai.bag[f.k]}</ResultCard>
              ))}
              <OwnItCheck context="BAG direction feedback" storageKey="ownit_bag" onComplete={(r) => set("ownit_bag", r)} />
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <AIChat voiceId={voice} onVoiceChange={setVoicePersist} name={name} intake={intake} mapData={map}
          sectionLabel="purpose or direction"
          placeholder="Ask Katherine about your purpose or direction — she can see everything you've written..." />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 18, borderTop: "1px solid var(--border)" }}>
        <button className="btn-g" onClick={() => goto("intro")}>← Introduction</button>
        <button className="btn" onClick={() => { markDone("mirror1"); goto("mirror2"); }}>Identity · Superpowers →</button>
      </div>
    </>)
  );

  if (step === "mirror2") {
    const animals = map.animals || [{ name: "", adjective1: "", adjective2: "", alignment: 5 }];
    const setAnimal = (i, field, val) => { const next = [...animals]; next[i] = { ...next[i], [field]: val }; set("animals", next); };
    return (
      wrapContent(<>
        <div className="lbl" style={{ marginBottom: 12 }}>Mirror 2 of 3</div>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 34, fontWeight: 400, lineHeight: 1.2, marginBottom: 7, letterSpacing: "-0.3px" }}>Identity <em style={{ color: "var(--text3)", fontSize: 26 }}>reflects</em> Superpowers</h2>
        <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7, marginBottom: 20, maxWidth: 540 }}>Who you are internally shows up as how you operate in the world. We anchor identity to animals because people remember images, not word lists.</p>
        <VideoBlock title="Identity & Superpowers — Animals as Anchors" duration="~8 min"
          points={["Animals anchor identity visually — not as word lists", "The two-adjective rule — specific to you, not the generic animal", "Qualities list → animal archetypes", "Too aligned with one animal depletes the others"]} />

        <div className="mirror-grid">
          <div className="mirror-side">
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 13 }}>
              <span style={{ fontSize: 17 }}>🦁</span>
              <div><div style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--warm)" }}>IDENTITY · Internal</div><div style={{ fontSize: 11, color: "var(--text3)" }}>Who you are — anchored to animals</div></div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>Brain dump your qualities</label>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 5, lineHeight: 1.6 }}>List every word that describes you at your best. Don't filter.</div>
              <TextArea value={map.identity_adjectives} onChange={v => set("identity_adjectives", v)} rows={3} placeholder="resilient, visionary, playful, intense, strategic, nurturing..." />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 9 }}>Your animals (3–5 max)</div>
            {animals.map((a, i) => (
              <div key={i} style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 9, marginBottom: 9, overflow: "hidden" }}>
                <div style={{ padding: "7px 13px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--accent)" }}>Animal {i + 1}</span>
                  {animals.length > 1 && <button onClick={() => set("animals", animals.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "var(--text4)", cursor: "pointer", fontSize: 15, padding: 0 }}>×</button>}
                </div>
                <div style={{ padding: "11px 13px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginBottom: 9 }}>
                    {[["Animal", "name", "Eagle"], ["Adj 1", "adjective1", "Relentless"], ["Adj 2", "adjective2", "Visionary"]].map(([lbl, field, ph]) => (
                      <div key={field}>
                        <label style={{ display: "block", fontSize: 11, color: "var(--text3)", marginBottom: 3, fontWeight: 500 }}>{lbl}</label>
                        <TextInput value={a[field] || ""} onChange={val => setAnimal(i, field, val)} placeholder={ph} style={{ fontSize: 13, padding: "7px 9px" }} />
                      </div>
                    ))}
                  </div>
                  {a.name && a.adjective1 && (
                    <div style={{ padding: "7px 11px", background: "rgba(201,168,76,.06)", borderRadius: 5, marginBottom: 7, fontFamily: "var(--serif)", fontSize: 13, fontStyle: "italic", color: "var(--text)" }}>
                      "{a.adjective1}{a.adjective2 ? `, ${a.adjective2}` : ""} {a.name}"
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text3)", marginBottom: 3 }}>
                    <span>Not aligned</span>
                    <span style={{ color: a.alignment >= 7 ? "#34d399" : a.alignment >= 4 ? "#f59e0b" : "#ef4444", fontWeight: 500 }}>{a.alignment}/10</span>
                    <span>Fully aligned</span>
                  </div>
                  <input type="range" min={0} max={10} step={1} value={a.alignment} onChange={e => setAnimal(i, "alignment", Number(e.target.value))}
                    style={{ accentColor: a.alignment >= 7 ? "#34d399" : a.alignment >= 4 ? "#f59e0b" : "#ef4444" }} />
                </div>
              </div>
            ))}
            {animals.length < 5 && (
              <button onClick={() => set("animals", [...animals, { name: "", adjective1: "", adjective2: "", alignment: 5 }])}
                style={{ width: "100%", padding: "9px", background: "transparent", border: "1.5px dashed var(--border2)", borderRadius: 7, color: "var(--text4)", cursor: "pointer", fontFamily: "var(--sans)", fontSize: 12, marginBottom: 7 }}>+ Add animal</button>
            )}
          </div>
          <div className="mirror-div">
            <div className="mirror-line" />
            <div style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--border2)", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--text4)", flexShrink: 0 }}>🪞</div>
            <div className="mirror-line" />
          </div>
          <div className="mirror-side">
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 13 }}>
              <span style={{ fontSize: 17 }}>⚡</span>
              <div><div style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>SUPERPOWERS · External</div><div style={{ fontSize: 11, color: "var(--text3)" }}>How your identity shows up in the world</div></div>
            </div>
            <div style={{ padding: "9px 13px", background: "rgba(201,168,76,.05)", border: "1px solid rgba(201,168,76,.1)", borderRadius: 7, marginBottom: 13 }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 14, fontStyle: "italic", color: "var(--text2)", lineHeight: 1.7 }}>"When you're too aligned with one animal, you may be in detriment of the others."</div>
            </div>
            {animals.filter(a => a.name && a.adjective1).map((a, i) => (
              <div key={i} style={{ marginBottom: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 13, fontStyle: "italic", color: "var(--text)" }}>"{a.adjective1}{a.adjective2 ? `, ${a.adjective2}` : ""} {a.name}"</div>
                  <button onClick={() => runAI(`ani${i}`, `You are Katherine Breuss. ${name} chose the ${a.name} with adjectives "${a.adjective1}" and "${a.adjective2}". Give their superpower (1 vivid sentence specific to adjectives), detriment/dark side (1 sentence), and one scenario to call on it. JSON: {"superpower":"...","detriment":"...","scenario":"..."}`)}
                    style={{ background: "none", border: "1px solid var(--border2)", borderRadius: 5, color: "var(--text4)", cursor: "pointer", fontFamily: "var(--sans)", fontSize: 10, padding: "4px 9px", flexShrink: 0 }}>
                    {busy[`ani${i}`] ? <span className="dot-l"><span /><span /><span /></span> : "✦ Unlock"}
                  </button>
                </div>
                {ai[`ani${i}`] && (
                  <div className="fade-in">
                    {[{ k: "superpower", c: "#34d399", l: "Superpower" }, { k: "detriment", c: "#ef4444", l: "Dark side" }, { k: "scenario", c: "var(--warm)", l: "Call on it when" }].map(f => (
                      <ResultCard key={f.k} color={f.c} label={f.l}>{ai[`ani${i}`][f.k]}</ResultCard>
                    ))}
                    <OwnItCheck context={`${a.adjective1} ${a.name} identity insight`} storageKey={`ownit_ani${i}`} onComplete={(r) => set(`ownit_ani${i}`, r)} />
                  </div>
                )}
              </div>
            ))}
            {animals.filter(a => a.name).length === 0 && (
              <div style={{ padding: "18px", textAlign: "center", color: "var(--text4)", fontSize: 13, fontStyle: "italic" }}>Add your animals on the left — superpowers appear here.</div>
            )}
            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 5 }}>Key insight on your superpowers</label>
              <div style={{ fontSize: 11, color: "var(--text4)", marginBottom: 5 }}>Which animal is most underused? What does that cost you?</div>
              <TextArea value={map.capabilities_note} onChange={v => set("capabilities_note", v)} rows={3} placeholder="Looking at my animals and alignment scores, I notice..." />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <AIChat voiceId={voice} onVoiceChange={setVoicePersist} name={name} intake={intake} mapData={map}
            sectionLabel="identity or animals"
            placeholder="Ask Katherine about your identity or animals — she can see everything you've written..." />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 18, borderTop: "1px solid var(--border)" }}>
          <button className="btn-g" onClick={() => goto("mirror1")}>← Purpose · Direction</button>
          <button className="btn" onClick={() => { markDone("mirror2"); goto("mirror3"); }}>Values · Behaviors →</button>
        </div>
      </>)
    );
  }

  if (step === "mirror3") {
    const values = map.values || [{ name: "", irk: "", behaviors: "" }];
    const setVal = (i, field, val) => { const n = [...values]; n[i] = { ...n[i], [field]: val }; set("values", n); };
    return (
      wrapContent(<>
        <div className="lbl" style={{ marginBottom: 12 }}>Mirror 3 of 3</div>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 34, fontWeight: 400, lineHeight: 1.2, marginBottom: 7, letterSpacing: "-0.3px" }}>Values <em style={{ color: "var(--text3)", fontSize: 26 }}>reflect</em> Behaviors</h2>
        <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7, marginBottom: 20, maxWidth: 540 }}>What you stand for internally shows up as how you act. The fastest way to find your values is to find what makes your blood boil.</p>
        <VideoBlock title="Values & Behaviors — The Irks Exercise" duration="~7 min"
          points={["What irritates you is your fastest path to your values", "The peeling question: what are they stomping on?", "How to rank values — which is non-negotiable", "Values as decision filters, not motivational posters"]} />

        <div className="mirror-grid">
          <div className="mirror-side">
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 13 }}>
              <span style={{ fontSize: 17 }}>⚖️</span>
              <div><div style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--warm)" }}>VALUES · Internal</div><div style={{ fontSize: 11, color: "var(--text3)" }}>What you stand for — discovered through irks</div></div>
            </div>
            <div style={{ marginBottom: 13 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>What behaviors in others genuinely irk you?</label>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 5, lineHeight: 1.6 }}>No filter. Be specific — not just "rudeness" but what kind?</div>
              <TextArea value={map.values_irks} onChange={v => set("values_irks", v)} rows={5} placeholder="People who don't follow through. When someone takes credit..." />
            </div>
            <div style={{ padding: "9px 13px", background: "rgba(201,168,76,.05)", border: "1px solid rgba(201,168,76,.1)", borderRadius: 7, marginBottom: 13 }}>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--accent)", marginBottom: 3 }}>Peeling question</div>
              <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.6 }}>"What are they stomping on? If they did the opposite, what would that tell me?" That's your value.</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 9 }}>Your top 3 values</div>
            {values.map((val, i) => (
              <div key={i} style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 9, marginBottom: 9, overflow: "hidden" }}>
                <div style={{ padding: "7px 13px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--warm)" }}>Value {i + 1}{i === 0 ? " · Most important" : ""}</span>
                  {values.length > 1 && <button onClick={() => set("values", values.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "var(--text4)", cursor: "pointer", fontSize: 15, padding: 0 }}>×</button>}
                </div>
                <div style={{ padding: "11px 13px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 7 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text3)", marginBottom: 3, fontWeight: 500 }}>Value name</label>
                      <TextInput value={val.name} onChange={v => setVal(i, "name", v)} placeholder="e.g. Integrity" style={{ fontSize: 13, fontWeight: 500, padding: "7px 9px" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text3)", marginBottom: 3, fontWeight: 500 }}>The irk that revealed it</label>
                      <TextInput value={val.irk} onChange={v => setVal(i, "irk", v)} placeholder="People who..." style={{ fontSize: 13, padding: "7px 9px" }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {values.length < 3 && (
              <button onClick={() => set("values", [...values, { name: "", irk: "", behaviors: "" }])}
                style={{ width: "100%", padding: "9px", background: "transparent", border: "1.5px dashed var(--border2)", borderRadius: 7, color: "var(--text4)", cursor: "pointer", fontFamily: "var(--sans)", fontSize: 12 }}>+ Add value</button>
            )}
          </div>
          <div className="mirror-div">
            <div className="mirror-line" />
            <div style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--border2)", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--text4)", flexShrink: 0 }}>🪞</div>
            <div className="mirror-line" />
          </div>
          <div className="mirror-side">
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 13 }}>
              <span style={{ fontSize: 17 }}>🎯</span>
              <div><div style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>BEHAVIORS · External</div><div style={{ fontSize: 11, color: "var(--text3)" }}>How your values show up in action</div></div>
            </div>
            <div style={{ padding: "9px 13px", background: "rgba(201,168,76,.05)", border: "1px solid rgba(201,168,76,.1)", borderRadius: 7, marginBottom: 13 }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 14, fontStyle: "italic", color: "var(--text2)", lineHeight: 1.7 }}>"Values aren't what you believe — they're how you behave when it costs you something."</div>
            </div>
            {values.filter(v => v.name).map((val, i) => (
              <div key={i} style={{ marginBottom: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--warm)" }}>{val.name}</div>
                  <button onClick={() => runAI(`val${i}`, `You are Katherine Breuss. ${name}'s value is "${val.name}". Irk: "${val.irk}". Give a precise personal definition (not dictionary), 3 observable behaviors proving someone lives this value, and 1 violation signal. JSON: {"definition":"...","behaviors":["...","...","..."],"violation":"..."}`)}
                    style={{ background: "none", border: "1px solid var(--border2)", borderRadius: 5, color: "var(--text4)", cursor: "pointer", fontFamily: "var(--sans)", fontSize: 10, padding: "4px 9px", flexShrink: 0 }}>
                    {busy[`val${i}`] ? <span className="dot-l"><span /><span /><span /></span> : "✦ Define"}
                  </button>
                </div>
                <div style={{ marginBottom: 7 }}>
                  <label style={{ display: "block", fontSize: 11, color: "var(--text3)", marginBottom: 3, fontWeight: 500 }}>How does this show up in behavior?</label>
                  <TextArea value={val.behaviors} onChange={v => setVal(i, "behaviors", v)} rows={2} placeholder="They speak up even when uncomfortable..." style={{ fontSize: 12 }} />
                </div>
                {ai[`val${i}`] && (
                  <div className="fade-in">
                    <ResultCard color="var(--warm)" label="What it really means">{ai[`val${i}`].definition}</ResultCard>
                    {ai[`val${i}`].behaviors && (
                      <div style={{ padding: "9px 13px", background: "var(--bg3)", borderLeft: "2px solid #34d399", borderRadius: "0 7px 7px 0", marginBottom: 7 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#34d399", marginBottom: 4 }}>Behaviors that prove it</div>
                        {ai[`val${i}`].behaviors.map((b, bi) => (
                          <div key={bi} style={{ fontSize: 13, color: "var(--text)", marginBottom: 3, paddingLeft: 10, position: "relative" }}>
                            <span style={{ position: "absolute", left: 0, color: "#34d399" }}>·</span>{b}
                          </div>
                        ))}
                      </div>
                    )}
                    {ai[`val${i}`].violation && <ResultCard color="#ef4444" label="Violation signal">{ai[`val${i}`].violation}</ResultCard>}
                    <OwnItCheck context={`${val.name} value definition`} storageKey={`ownit_val${i}`} onComplete={(r) => set(`ownit_val${i}`, r)} />
                  </div>
                )}
              </div>
            ))}
            {values.filter(v => v.name).length === 0 && (
              <div style={{ padding: "18px", textAlign: "center", color: "var(--text4)", fontSize: 13, fontStyle: "italic" }}>Add your values on the left — behavioral definitions appear here.</div>
            )}
            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 5 }}>Overall behaviors note</label>
              <TextArea value={map.behaviors_note} onChange={v => set("behaviors_note", v)} rows={3} placeholder="When I look at my values and how I'm actually behaving, I notice..." />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <AIChat voiceId={voice} onVoiceChange={setVoicePersist} name={name} intake={intake} mapData={map}
            sectionLabel="values or behaviors"
            placeholder="Ask Katherine about your values or behaviors — she can see everything you've written..." />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 18, borderTop: "1px solid var(--border)" }}>
          <button className="btn-g" onClick={() => goto("mirror2")}>← Identity · Superpowers</button>
          <button className="btn" onClick={() => { markDone("mirror3"); goto("align"); }}>Alignment Check →</button>
        </div>
      </>)
    );
  }

  if (step === "align") return (
    wrapContent(<>
      <div className="lbl" style={{ marginBottom: 12 }}>Alignment Check</div>
      <h2 style={{ fontFamily: "var(--serif)", fontSize: 34, fontWeight: 400, lineHeight: 1.2, marginBottom: 11, letterSpacing: "-0.3px" }}>The gap between<br /><em>who you are and how you're showing up.</em></h2>
      <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.8, marginBottom: 22, maxWidth: 520 }}>Rate how aligned the external side of your mirror actually feels right now — not where you want to be, where you are.</p>
      {[
        { key: "align_direction", label: "Direction", icon: "⛰️", desc: "Aligned with your purpose and BAG?" },
        { key: "align_superpowers", label: "Superpowers", icon: "⚡", desc: "Operating from your animal superpowers?" },
        { key: "align_behaviors", label: "Behaviors", icon: "🎯", desc: "Behaviors reflecting your stated values?" },
      ].map(item => {
        const val = map[item.key] || 5;
        const col = val >= 7 ? "#34d399" : val >= 4 ? "#f59e0b" : "#ef4444";
        return (
          <div key={item.key} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 11, padding: "17px 19px", marginBottom: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 9 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                  <span>{item.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{item.label}</span>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>· external mirror</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.5, paddingLeft: 24 }}>{item.desc}</div>
              </div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 300, color: col, flexShrink: 0, marginLeft: 14 }}>{val}<span style={{ fontSize: 13 }}>/10</span></div>
            </div>
            <input type="range" min={0} max={10} step={1} value={val} onChange={e => set(item.key, Number(e.target.value))} style={{ accentColor: col }} />
            <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 3 }}>
              {val >= 8 ? "Strong — this mirror is clear." : val >= 5 ? "Partial — something is obscuring this mirror." : "Low — this mirror needs attention."}
            </div>
          </div>
        );
      })}
      {!ai.align && (
        <button className="btn" style={{ marginBottom: 22, marginTop: 7 }}
          onClick={() => runAI("align", `You are Katherine Breuss. ${name} alignment: Direction ${map.align_direction}/10, Superpowers ${map.align_superpowers}/10, Behaviors ${map.align_behaviors}/10. Purpose: "${map.purpose_final || map.purpose_draft}". Values: ${(map.values || []).filter(v => v.name).map(v => v.name).join(", ")}. BAG Growth: "${map.bag_growth}". Identify 1 key misalignment in Growth/Direction. Why it matters. Focus first. Bridge to A2. JSON: {"key_misalignment":"...","why_it_matters":"...","focus_first":"...","bridge_to_a2":"..."}`)}>
          {busy.align ? <span className="dot-l"><span /><span /><span /></span> : "See My Key Misalignment →"}
        </button>
      )}
      {ai.align && (
        <div className="fade-up" style={{ padding: "18px 22px", background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 11, marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "#f59e0b", marginBottom: 11 }}>Your key misalignment to focus on</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 400, color: "var(--text)", lineHeight: 1.7, marginBottom: 9 }}>{ai.align.key_misalignment}</div>
          <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, marginBottom: 11 }}>{ai.align.why_it_matters}</div>
          <div style={{ padding: "9px 13px", background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.12)", borderRadius: 7, marginBottom: 9 }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--accent)", marginBottom: 3 }}>Focus first on</div>
            <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{ai.align.focus_first}</div>
          </div>
          {ai.align.bridge_to_a2 && <div style={{ fontSize: 12, color: "var(--text3)", fontStyle: "italic", lineHeight: 1.6, marginBottom: 4 }}>Carries into A2: {ai.align.bridge_to_a2}</div>}
          <OwnItCheck context="alignment check result" storageKey="ownit_align" onComplete={(r) => set("ownit_align", r)} />
        </div>
      )}
      <div style={{ marginBottom: 22 }}>
        <AIChat voiceId={voice} onVoiceChange={setVoicePersist} name={name} intake={intake} mapData={map}
          sectionLabel="alignment"
          placeholder="Ask Katherine about your alignment — she can see everything you've written..." />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 18, borderTop: "1px solid var(--border)" }}>
        <button className="btn-g" onClick={() => goto("mirror3")}>← Values · Behaviors</button>
        <button className="btn" onClick={() => { markDone("align"); goto("map"); }}>Build My Map of Me →</button>
      </div>
    </>)
  );

  if (step === "map") {
    const validA = (map.animals || []).filter(a => a.name);
    const validV = (map.values || []).filter(v => v.name);
    return (
      wrapContent(<>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div className="lbl" style={{ marginBottom: 9, display: "block" }}>Complete · A1</div>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 44, fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.5px", marginBottom: 9 }}>{name}'s<br /><em>Map of Me.</em></h2>
          <p style={{ fontSize: 14, color: "var(--text3)", maxWidth: 400, margin: "0 auto", lineHeight: 1.7 }}>Your living reference. Come back when making decisions, feeling stuck, or checking alignment.</p>
        </div>
        {!ai.close && (
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <button className="btn" onClick={() => runAI("close", `You are Katherine Breuss. Completed Map of Me with ${name}. Purpose: "${map.purpose_final || map.purpose_draft}". Animals: ${validA.map(a => `${a.adjective1} ${a.name}`).join(", ")}. Values: ${validV.map(v => v.name).join(", ")}. BAG Growth: "${map.bag_growth}". Brought here: "${intake.q1}". Write 3-4 sentence closing note referencing something SPECIFIC. One identity line — who they are and what they're building. JSON: {"note":"...","identity_line":"..."}`)}>
              {busy.close ? <span className="dot-l"><span /><span /><span /></span> : "✦ Get Katherine's Closing Note"}
            </button>
          </div>
        )}
        {ai.close && (
          <div className="fade-up" style={{ padding: "22px 26px", background: "linear-gradient(135deg,rgba(201,168,76,.08),rgba(79,203,242,.04))", border: "1px solid rgba(201,168,76,.22)", borderRadius: 13, marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "var(--warm)", marginBottom: 9 }}>Katherine's Note</div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 16, lineHeight: 1.9, color: "var(--text)", marginBottom: 13, fontWeight: 300 }}>{ai.close.note}</div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 19, fontStyle: "italic", fontWeight: 400, color: "var(--accent)", lineHeight: 1.5 }}>"{ai.close.identity_line}"</div>
            <OwnItCheck context="Map of Me closing summary" storageKey="ownit_mapclose" onComplete={(r) => set("ownit_mapclose", r)} />
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 36px 1fr", gap: 0, marginBottom: 18 }}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 11, padding: "17px 19px" }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "var(--warm)", marginBottom: 13 }}>Internal</div>
            <div style={{ marginBottom: 13 }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 3 }}>PURPOSE</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 15, fontStyle: "italic", fontWeight: 300, color: "var(--text)", lineHeight: 1.6 }}>"{map.purpose_final || map.purpose_draft || "Not completed"}"</div>
            </div>
            {validA.length > 0 && (
              <div style={{ marginBottom: 13 }}>
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 5 }}>IDENTITY</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {validA.map((a, i) => (
                    <div key={i} style={{ padding: "4px 9px", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 14, fontSize: 11 }}>
                      <span style={{ fontStyle: "italic", color: "var(--accent)" }}>{a.adjective1}{a.adjective2 ? `, ${a.adjective2}` : ""}</span>
                      <span style={{ color: "var(--text)", fontWeight: 500 }}> {a.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {validV.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 5 }}>VALUES</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {validV.map((val, i) => (
                    <div key={i} style={{ padding: "4px 9px", background: "rgba(52,211,153,.07)", border: "1px solid rgba(52,211,153,.18)", borderRadius: 14, fontSize: 11, color: "#34d399" }}>{i + 1}. {val.name}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <div style={{ flex: 1, width: 1, background: "var(--border)" }} />
            <div style={{ fontSize: 18 }}>🪞</div>
            <div style={{ flex: 1, width: 1, background: "var(--border)" }} />
          </div>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 11, padding: "17px 19px" }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "var(--accent)", marginBottom: 13 }}>External</div>
            <div style={{ marginBottom: 13 }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 5 }}>DIRECTION · BAG</div>
              {[{ k: "bag_time", i: "⏳", c: "#c9a84c", l: "Time" }, { k: "bag_wealth", i: "💰", c: "#34d399", l: "Wealth" }, { k: "bag_growth", i: "🌱", c: "#a78bfa", l: "Growth" }].filter(c => map[c.k]).map(c => (
                <div key={c.k} style={{ padding: "5px 9px", background: "var(--bg3)", borderLeft: `2px solid ${c.c}`, borderRadius: "0 5px 5px 0", marginBottom: 5 }}>
                  <div style={{ fontSize: 10, color: c.c, fontWeight: 500, marginBottom: 1 }}>{c.i} {c.l}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.4 }}>{map[c.k].slice(0, 90)}{map[c.k].length > 90 ? "..." : ""}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 13 }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 5 }}>SUPERPOWERS</div>
              {validA.map((a, i) => ai[`ani${i}`] && (
                <div key={i} style={{ marginBottom: 5, padding: "5px 9px", background: "var(--bg3)", borderLeft: "2px solid #34d399", borderRadius: "0 5px 5px 0" }}>
                  <div style={{ fontSize: 10, fontStyle: "italic", color: "var(--text3)", marginBottom: 1 }}>{a.adjective1} {a.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.4 }}>{ai[`ani${i}`].superpower}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 5 }}>ALIGNMENT</div>
              {[{ l: "Direction", k: "align_direction" }, { l: "Superpowers", k: "align_superpowers" }, { l: "Behaviors", k: "align_behaviors" }].map(s => {
                const val = map[s.k] || 5;
                const col = val >= 7 ? "#34d399" : val >= 4 ? "#f59e0b" : "#ef4444";
                return <div key={s.k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}><span style={{ color: "var(--text3)" }}>{s.l}</span><span style={{ color: col, fontWeight: 500 }}>{val}/10</span></div>;
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 17px", background: "rgba(167,139,250,.05)", border: "1px solid rgba(167,139,250,.17)", borderRadius: 11, marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "#a78bfa", marginBottom: 9 }}>Ask Your Map</div>
          <AIChat voiceId={voice} onVoiceChange={setVoicePersist} name={name} intake={intake} mapData={map}
            sectionLabel="your map"
            placeholder="Ask anything — a decision, which animal you need, whether something aligns..." />
        </div>

        <div style={{ padding: "17px 20px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 11, marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--warm)", marginBottom: 11 }}>How to use this map</div>
          {["Repeat your purpose statement until it becomes the thing that gets you out of bed on hard days.", "When a decision feels unclear — check your values first. If it violates your top value, the answer is no.", "When you feel drained — which animal needs to come up more right now?", "Come back here. Update it. It grows with you. The AI always reflects from your current map."].map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 9, marginBottom: 7, alignItems: "flex-start" }}>
              <span style={{ color: "var(--warm)", flexShrink: 0, marginTop: 1 }}>·</span>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{t}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 18, borderTop: "1px solid var(--border)" }}>
          <button className="btn-g" onClick={() => goto("align")}>← Alignment Check</button>
          <button className="btn" onClick={() => { markDone("map"); onDone(map); }}>Continue to A2 — Align With It →</button>
        </div>
      </>)
    );
  }

  return null;
}

export default function App() {
  const [phase, setPhase] = useState("loading");
  const [intake, setIntake] = useState(null);

  useEffect(() => {
    Promise.all([loadData(KEYS.intake), loadData(KEYS.phase)]).then(([i, p]) => {
      if (i) setIntake(i);
      setPhase(p || (i ? "a1" : "intake"));
    });
  }, []);

  const doneIntake = async (data) => { setIntake(data); await saveData(KEYS.intake, data); await saveData(KEYS.phase, "a1"); setPhase("a1"); };
  const doneA1 = async () => { await saveData(KEYS.phase, "done"); setPhase("done"); };

  if (phase === "loading") return <div style={{ minHeight: "100vh", background: "#0d1b2e", display: "flex", alignItems: "center", justifyContent: "center" }}><style>{CSS}</style><div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "#3d3d38", letterSpacing: 2, animation: "pulse 1.5s infinite" }}>Loading…</div></div>;

  return (
    <div style={{ background: "#0d1b2e", minHeight: "100vh" }}>
      <style>{CSS}</style>
      {phase === "intake" && <Intake onDone={doneIntake} />}
      {phase === "a1" && intake && <A1 intake={intake} onDone={doneA1} />}
      {phase === "done" && (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 36 }}>
          <div className="fade-up" style={{ maxWidth: 480, textAlign: "center" }}>
            <div style={{ fontSize: 38, marginBottom: 14 }}>⛰️</div>
            <div className="lbl" style={{ marginBottom: 11, display: "block" }}>A1 Complete</div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 38, fontWeight: 300, lineHeight: 1.2, marginBottom: 13, letterSpacing: "-0.5px" }}>Your Map of Me is built.<br /><em>Now we align it with your time.</em></h2>
            <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "#7a766e", lineHeight: 1.8, marginBottom: 26 }}>A2 — Align With It — asks: does how you spend your time match where you want to go?</p>
            <button className="btn" style={{ opacity: .5, cursor: "not-allowed", marginBottom: 11 }}>A2 Align With It — Coming Soon</button>
            <div><button className="btn-g" onClick={() => setPhase("a1")}>← Return to Map of Me</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

