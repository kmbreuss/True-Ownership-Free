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
  own:"Reflects your own words back. No advice -- just your truth made visible.",
  coach:"Open questions that create insight. You do the thinking.",
  supportive:"In your corner. Sees your strength. Keeps you moving.",
  challenging:"Names the contradiction. Asks what you've been avoiding.",
  advice:"25 years of experience. Direct recommendation. Here's what I'd do.",
  truth:"What you need to hear. Not what you want to.",
};
const VOICE_REASON = {
  own:"You're ready to hear yourself more clearly.",
  coach:"You're searching for clarity -- the right questions will get you there faster than any answers.",
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

function buildFullContext(name, intake, mapData) {
  const lines = [];
  lines.push(`Client name: ${name}`);
  if (intake?.q1) lines.push(`What brought them here: "${intake.q1}"`);
  if (intake?.q2) lines.push(`Who they are becoming: "${intake.q2}"`);
  if (intake?.q3) lines.push(`What they most need: "${intake.q3}"`);
  const layers = (mapData?.purpose_layers || []).filter(l => (l||"").trim());
  if (layers.length > 0) {
    lines.push(`\nPurpose peeling layers (${layers.length} deep):`);
    layers.forEach((l, i) => lines.push(`  Layer ${i + 1}: "${l}"`));
  }
  if (mapData?.purpose_draft) lines.push(`Purpose draft (AI): "${mapData.purpose_draft}"`);
  if (mapData?.purpose_final) lines.push(`Purpose final (their words): "${mapData.purpose_final}"`);
  if (mapData?.bag_year) lines.push(`BAG target year: ${mapData.bag_year}`);
  const areas = (mapData?.life_areas || []);
  if (areas.length > 0) {
    lines.push(`\nLife priorities (ranked):`);
    areas.forEach((a, i) => {
      lines.push(`  ${i+1}. ${a.label}`);
      if (a.see) lines.push(`     See: "${a.see}"`);
      if (a.hear) lines.push(`     Hear: "${a.hear}"`);
      if (a.feel) lines.push(`     Feel: "${a.feel}"`);
    });
  }
  if (mapData?.time_summary) lines.push(`Time summary: "${mapData.time_summary}"`);
  const goals = (mapData?.life_areas || []).filter(a => a.goal);
  if (goals.length > 0) {
    lines.push(`\nLife goals:`);
    goals.forEach((a, i) => lines.push(`  ${i+1}. ${a.label}: "${a.goal}"`));
  }
  if (mapData?.bag_retirement) lines.push(`Wealth - Retirement: "${mapData.bag_retirement}"`);
  if (mapData?.bag_assets) lines.push(`Wealth - Assets: "${mapData.bag_assets}"`);
  if (mapData?.bag_cashflow) lines.push(`Wealth - Cash flow: "${mapData.bag_cashflow}"`);
  if (mapData?.bag_other) lines.push(`Wealth - Other: "${mapData.bag_other}"`);
  if (mapData?.wealth_summary) lines.push(`Wealth summary: "${mapData.wealth_summary}"`);
  if (mapData?.growth_summary) lines.push(`Growth summary: "${mapData.growth_summary}"`);
  if (mapData?.bag_growth) lines.push(`Growth: "${mapData.bag_growth}"`);
  const animals = (mapData?.animals || []).filter(a => a.name);
  if (animals.length > 0) {
    lines.push(`\nIdentity animals:`);
    animals.forEach(a => lines.push(`  "${a.adjective1}${a.adjective2 ? `, ${a.adjective2}` : ""} ${a.name}" -- alignment ${a.alignment}/10`));
  }
  if (mapData?.identity_adjectives) lines.push(`Qualities brain dump: "${mapData.identity_adjectives}"`);
  if (mapData?.capabilities_note) lines.push(`Superpowers note: "${mapData.capabilities_note}"`);
  const values = (mapData?.values || []).filter(v => v.name);
  if (values.length > 0) {
    lines.push(`\nValues (top ${values.length}):`);
    values.forEach((v, i) => {
      lines.push(`  ${i + 1}. ${v.name}${v.irk ? ` -- revealed by: "${v.irk}"` : ""}${v.behaviors ? ` -- behaviors: "${v.behaviors}"` : ""}`);
    });
  }
  if (mapData?.values_irks) lines.push(`Values irks dump: "${mapData.values_irks}"`);
  if (mapData?.behaviors_note) lines.push(`Behaviors note: "${mapData.behaviors_note}"`);
  if (mapData?.align_direction !== undefined || mapData?.align_superpowers !== undefined || mapData?.align_behaviors !== undefined) {
    lines.push(`\nAlignment ratings:`);
    if (mapData.align_direction   !== undefined) lines.push(`  Direction: ${mapData.align_direction}/10`);
    if (mapData.align_superpowers !== undefined) lines.push(`  Superpowers: ${mapData.align_superpowers}/10`);
    if (mapData.align_behaviors   !== undefined) lines.push(`  Behaviors: ${mapData.align_behaviors}/10`);
  }
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
    own:`Mirror ${name}'s OWN words back. Start "You said..." or "What I'm hearing...". Draw directly from what they have written -- quote their specific words back. One question from their own words. No advice. Under 120 words.`,
    coach:`Katherine Breuss coaching ${name}. You have read everything they have written -- reference specific details from their map. ONE open-ended question per response. Acknowledge in one sentence using their actual words, then ask. End on the question. Under 100 words.`,
    supportive:`Katherine Breuss fully in ${name}'s corner. You can see everything they have put in -- reference it specifically. Name something SPECIFIC you see in their work. Celebrate real progress. Make them feel seen, not managed. One forward question. Under 120 words.`,
    challenging:`Katherine Breuss not letting ${name} off the hook -- with warmth. You have read everything. Name a specific gap between what they have written and what they are not saying. One observation using their words, one harder question. Under 100 words.`,
    advice:`Katherine Breuss giving direct advice to ${name}. You have read their full map. "Here's what I'd do..." -- grounded in their specific purpose, animals, values. Clear recommendation, why, hard part, one first step. Under 150 words.`,
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
input[type=range]{width:100%;cursor:pointer;height:5px;appearance:none;-webkit-appearance:none;border-radius:4px;outline:none;background:var(--bg4);border:1px solid var(--border2);}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:var(--text);border:3px solid var(--bg2);cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.4);}
input[type=range]::-moz-range-track{height:5px;border-radius:4px;background:var(--bg4);border:1px solid var(--border2);}
input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:var(--text);border:3px solid var(--bg2);cursor:pointer;}
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
.to-field.summary-field::placeholder{font-family:var(--sans);font-style:normal;font-size:13px;color:var(--text3);opacity:.6;}
.to-field.summary-field{font-family:var(--serif);font-style:italic;font-size:15px;line-height:1.7;}
`;

// ─── DIRECTION: Life Areas ────────────────────────────────────────────────────

const LIFE_AREA_PRESETS = [
  { id:"family",    label:"Family",       icon:"👨‍👩‍👧‍👦", hint:"Where will your kids be? What does your relationship with your partner look like? What do you do together?" },
  { id:"business",  label:"Business",     icon:"🏔️",  hint:"What are you building? Who are you leading? How much are you working? What is your role?" },
  { id:"health",    label:"Health",       icon:"⚡",  hint:"How do you feel physically? What are you doing regularly? What have you let go of?" },
  { id:"friends",   label:"Friends",      icon:"🤝",  hint:"Who is still in your life? How often do you connect? What do you do together?" },
  { id:"spiritual", label:"Spirituality", icon:"🌿",  hint:"How do you connect to something bigger? What practices ground you?" },
  { id:"community", label:"Community",    icon:"🌍",  hint:"What are you contributing to? Who do you serve beyond your immediate circle?" },
  { id:"adventure", label:"Adventure",    icon:"🧭",  hint:"Where have you been? What have you experienced? What risks have you taken?" },
];

function LifeAreaSelector({ selected, onToggle, onAddCustom }) {
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const selectedIds = selected.map(a => a.id);
  const atMax = selected.length >= 5;

  const addCustom = () => {
    const label = customInput.trim();
    if (!label) return;
    const id = "custom_" + label.toLowerCase().replace(/\s+/g, "_");
    onAddCustom({ id, label, icon:"✦", hint:`Describe your vision for ${label} in 10–15 years.`, see:"", hear:"", feel:"" });
    setCustomInput("");
    setShowCustom(false);
  };

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:12, color:"var(--text3)", marginBottom:10, lineHeight:1.5 }}>
        Pick up to 5 areas that matter most in your 10–15 year life. You will rank them after.
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:10 }}>
        {LIFE_AREA_PRESETS.map(area => {
          const isSelected = selectedIds.includes(area.id);
          const rank = selected.findIndex(a => a.id === area.id) + 1;
          return (
            <button key={area.id}
              onClick={() => (!atMax || isSelected) && onToggle(area)}
              style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"7px 13px",
                background: isSelected ? "rgba(201,168,76,.15)" : "var(--bg3)",
                border: isSelected ? "1px solid rgba(201,168,76,.5)" : "1px solid var(--border2)",
                borderRadius:20, cursor: atMax && !isSelected ? "not-allowed" : "pointer",
                fontFamily:"var(--sans)", fontSize:12,
                color: isSelected ? "var(--warm)" : atMax ? "var(--text4)" : "var(--text2)",
                opacity: atMax && !isSelected ? 0.5 : 1, transition:"all .18s"
              }}>
              <span style={{fontSize:13}}>{area.icon}</span>
              {area.label}
              {isSelected && (
                <span style={{fontSize:10,fontWeight:700,background:"var(--warm)",color:"#0d1b2e",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {rank}
                </span>
              )}
            </button>
          );
        })}
        {!showCustom && !atMax && (
          <button onClick={() => setShowCustom(true)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 13px", background:"transparent", border:"1.5px dashed var(--border2)", borderRadius:20, cursor:"pointer", fontFamily:"var(--sans)", fontSize:12, color:"var(--text4)" }}>
            + Add your own
          </button>
        )}
        {showCustom && (
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <input value={customInput} onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustom()}
              placeholder="e.g. Creative work" autoFocus
              style={{ background:"var(--bg4)", border:"1px solid var(--warm)", borderRadius:20, color:"var(--warm)", fontFamily:"var(--sans)", fontSize:12, padding:"7px 13px", outline:"none", width:150 }} />
            <button onClick={addCustom} style={{ background:"var(--warm)", border:"none", borderRadius:20, color:"#0d1b2e", cursor:"pointer", fontSize:12, fontWeight:700, padding:"7px 13px" }}>Add</button>
            <button onClick={() => setShowCustom(false)} style={{ background:"none", border:"none", color:"var(--text4)", cursor:"pointer", fontSize:16 }}>×</button>
          </div>
        )}
      </div>
      {atMax && <div style={{ fontSize:11, color:"var(--text4)", fontStyle:"italic" }}>Maximum 5 areas -- remove one to add another.</div>}
    </div>
  );
}

function LifeAreaCard({ area, rank, total, onMoveUp, onMoveDown, onRemove, onChange }) {
  const [expanded, setExpanded] = useState(true);
  const [summarising, setSummarising] = useState(false);

  const summarise = async () => {
    if (!area.see && !area.hear && !area.feel) return;
    setSummarising(true);
    try {
      const res = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:120,
          messages:[{ role:"user", content:`Write a single vivid goal statement for someone's ${area.label} life in 10-15 years. Start with "My ${area.label.toLowerCase()} " then complete the sentence. Use their exact words where possible. Keep it to 1-2 sentences maximum -- punchy and personal, not generic.\n\nThey wrote:\nI will see: "${area.see || ""}"\nI will hear: "${area.hear || ""}"\nI will feel: "${area.feel || ""}"\n\nRespond with ONLY the goal statement, no quotes, no preamble.` }]
        })
      });
      const data = await res.json();
      const goal = data.content?.map(b => b.text || "").join("").trim() || "";
      if (goal) onChange("goal", goal);
    } catch {}
    setSummarising(false);
  };

  const hasContent = area.see || area.hear || area.feel;

  return (
    <div className="fade-up" style={{ background:"var(--bg3)", border:"1px solid var(--border2)", borderRadius:11, marginBottom:10, overflow:"hidden" }}>
      <div style={{ padding:"11px 14px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:26, height:26, borderRadius:"50%", background:"var(--warm)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <span style={{ fontSize:11, fontWeight:700, color:"#0d1b2e" }}>{rank}</span>
        </div>
        <span style={{ fontSize:16 }}>{area.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:700, color:"var(--text)" }}>{area.label}</div>
          {area.goal
            ? <div style={{ fontFamily:"var(--serif)", fontSize:12, fontStyle:"italic", color:"rgba(201,168,76,.7)", lineHeight:1.4, marginTop:2 }}>{area.goal.slice(0, 80)}{area.goal.length > 80 ? "..." : ""}</div>
            : <div style={{ fontSize:11, color:"var(--text4)" }}>Priority {rank} of {total} · add your vision below</div>
          }
        </div>
        <div style={{ display:"flex", gap:4 }}>
          <button onClick={onMoveUp} disabled={rank === 1}
            style={{ background:"none", border:"1px solid var(--border2)", borderRadius:5, color: rank === 1 ? "var(--text4)" : "var(--text3)", cursor: rank === 1 ? "not-allowed" : "pointer", fontSize:11, padding:"3px 7px" }}>▲</button>
          <button onClick={onMoveDown} disabled={rank === total}
            style={{ background:"none", border:"1px solid var(--border2)", borderRadius:5, color: rank === total ? "var(--text4)" : "var(--text3)", cursor: rank === total ? "not-allowed" : "pointer", fontSize:11, padding:"3px 7px" }}>▼</button>
        </div>
        <button onClick={() => setExpanded(e => !e)}
          style={{ background:"none", border:"none", color:"var(--text4)", cursor:"pointer", fontSize:14, padding:"0 4px", transform: expanded ? "rotate(180deg)" : "none", transition:"transform .2s" }}>▾</button>
        <button onClick={onRemove} style={{ background:"none", border:"none", color:"var(--text4)", cursor:"pointer", fontSize:16, padding:0 }}>×</button>
      </div>
      {expanded && (
        <div className="fade-in" style={{ padding:"0 14px 14px", borderTop:"1px solid var(--border)" }}>
          <div style={{ padding:"9px 12px", background:"rgba(201,168,76,.05)", border:"1px solid rgba(201,168,76,.12)", borderRadius:7, marginBottom:12, marginTop:10 }}>
            <div style={{ fontFamily:"var(--serif)", fontSize:13, fontStyle:"italic", color:"var(--text3)", lineHeight:1.6 }}>{area.hint}</div>
          </div>
          {[
            { key:"see",  label:"I will see...",  icon:"👁",  placeholder:"The scenes, moments, people around me..." },
            { key:"hear", label:"I will hear...", icon:"👂",  placeholder:"The words, sounds, conversations I experience..." },
            { key:"feel", label:"I will feel...", icon:"💛",  placeholder:"The emotions, energy, sense of self I carry..." },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
                <span style={{ fontSize:13 }}>{f.icon}</span>
                <label style={{ fontFamily:"var(--sans)", fontSize:12, fontWeight:700, color:"var(--warm)", letterSpacing:0.5 }}>{f.label}</label>
              </div>
              <textarea rows={2} value={area[f.key] || ""} onChange={e => onChange(f.key, e.target.value)}
                placeholder={f.placeholder} className="to-field"
                style={{ fontSize:13, fontFamily:"var(--sans)", fontStyle:"normal", color:"var(--warm)", lineHeight:1.7 }} />
            </div>
          ))}

          {/* Goal statement */}
          {area.goal && (
            <div style={{ padding:"11px 14px", background:"rgba(201,168,76,.08)", border:"1px solid rgba(201,168,76,.25)", borderRadius:9, marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--warm)", marginBottom:6 }}>Your {area.label} goal</div>
              <div style={{ fontFamily:"var(--serif)", fontSize:16, fontStyle:"italic", color:"var(--text)", lineHeight:1.7, marginBottom:8 }}>{area.goal}</div>
              <textarea rows={2} value={area.goal} onChange={e => onChange("goal", e.target.value)}
                className="to-field" style={{ fontSize:14, fontFamily:"var(--serif)", fontStyle:"italic", color:"var(--warm)", marginBottom:0 }} />
            </div>
          )}

          {/* Summarise button */}
          <button onClick={summarise} disabled={!hasContent || summarising}
            style={{ display:"flex", alignItems:"center", gap:7, background:"none", border:"1px solid rgba(201,168,76,.3)", borderRadius:20, color:"var(--warm)", cursor: !hasContent || summarising ? "not-allowed" : "pointer", fontFamily:"var(--sans)", fontSize:12, fontWeight:500, padding:"7px 16px", opacity: !hasContent ? 0.5 : 1, transition:"all .2s" }}
            onMouseEnter={e => { if(hasContent && !summarising) e.currentTarget.style.background = "rgba(201,168,76,.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
            {summarising
              ? <><span className="dot-l" style={{ color:"var(--warm)" }}><span /><span /><span /></span> Summarising...</>
              : <>{area.goal ? "↺ Regenerate goal" : "✦ Summarise into a goal"}</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

function DirectionSection({ map, set }) {
  const areas = map.life_areas || [];

  const toggleArea = (area) => {
    const ids = areas.map(a => a.id);
    if (ids.includes(area.id)) {
      set("life_areas", areas.filter(a => a.id !== area.id));
    } else if (areas.length < 5) {
      set("life_areas", [...areas, { ...area, see:"", hear:"", feel:"" }]);
    }
  };

  const addCustom = (area) => { if (areas.length < 5) set("life_areas", [...areas, area]); };
  const removeArea = (id) => set("life_areas", areas.filter(a => a.id !== id));

  const moveArea = (index, dir) => {
    const next = [...areas];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    set("life_areas", next);
  };

  const updateArea = (id, field, val) => {
    set("life_areas", areas.map(a => a.id === id ? { ...a, [field]: val } : a));
  };

  const [timeOpen, setTimeOpen] = useState(true);
  const [wealthOpen, setWealthOpen] = useState(false);
  const [growthOpen, setGrowthOpen] = useState(false);

  const SectionHeader = ({ icon, label, color, isOpen, onToggle, summary, summaryColor }) => (
    <button onClick={onToggle}
      style={{ display:"flex", alignItems:"center", gap:10, width:"100%", background:"none", border:"none", cursor:"pointer", padding:"13px 0", textAlign:"left" }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:700, color }}>{label}</div>
        {!isOpen && summary && (
          <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color: summaryColor || "var(--text3)", lineHeight:1.5, marginTop:4 }}>{summary}</div>
        )}
      </div>
      <div style={{
        width:28, height:28, borderRadius:"50%",
        background: isOpen ? "rgba(201,168,76,.15)" : "var(--bg4)",
        border: `1px solid ${isOpen ? "rgba(201,168,76,.4)" : "var(--border2)"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        flexShrink:0, transition:"all .2s"
      }}>
        <span style={{ fontSize:13, color: isOpen ? "var(--warm)" : "var(--text3)", transform: isOpen ? "rotate(180deg)" : "none", transition:"transform .2s", display:"block", lineHeight:1 }}>▾</span>
      </div>
    </button>
  );

  return (
    <div>
      {/* BAG Date */}
      <div style={{ marginBottom:20, padding:"13px 16px", background:"rgba(201,168,76,.06)", border:"1px solid rgba(201,168,76,.2)", borderRadius:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"var(--sans)", fontSize:12, fontWeight:700, color:"var(--warm)", letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>BAG Target Year</div>
            <div style={{ fontSize:11, color:"var(--text3)" }}>When does this version of your life exist?</div>
          </div>
          <input type="text" value={map.bag_year || ""} onChange={e => set("bag_year", e.target.value)}
            placeholder={String(new Date().getFullYear() + 12)}
            style={{ background:"var(--bg4)", border:"1px solid rgba(201,168,76,.3)", borderRadius:8, color:"var(--warm)", fontFamily:"var(--serif)", fontSize:22, fontStyle:"italic", fontWeight:400, width:100, padding:"7px 13px", outline:"none", textAlign:"center" }} />
        </div>
      </div>

      <div style={{ padding:"9px 13px", background:"rgba(201,168,76,.05)", border:"1px solid rgba(201,168,76,.1)", borderRadius:7, marginBottom:20 }}>
        <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--text2)", lineHeight:1.7 }}>"Dreamy and a bit scary. 25% believable. If you can see exactly how to get there, it's not big enough."</div>
      </div>

      {/* BAG SUMMARY DASHBOARD -- shows once any section has content */}
      {(map.time_summary || areas.some(a=>a.goal) || map.wealth_summary || map.growth_summary) && (
        <div style={{ marginBottom:20, background:"var(--bg2)", border:"1px solid rgba(201,168,76,.2)", borderRadius:11, overflow:"hidden" }}>
          <div style={{ padding:"10px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:13 }}>🪞</span>
            <div style={{ fontFamily:"var(--sans)", fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"var(--warm)" }}>
              Your BAG {map.bag_year ? `· ${map.bag_year}` : ""}
            </div>
          </div>
          <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:14 }}>

            {/* TIME */}
            {(map.time_summary || areas.some(a=>a.goal)) && (
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"#c9a84c", marginBottom:7, display:"flex", alignItems:"center", gap:6 }}>
                  <span>⏳</span> Time
                </div>
                {map.time_summary && (
                  <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--warm)", lineHeight:1.6, marginBottom: areas.some(a=>a.goal) ? 8 : 0 }}>
                    {map.time_summary}
                  </div>
                )}
                {areas.filter(a=>a.goal).map((area, i) => (
                  <div key={area.id} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:5 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0, marginTop:3 }}>
                      <div style={{ width:14, height:14, borderRadius:"50%", background:"rgba(201,168,76,.3)", border:"1px solid rgba(201,168,76,.5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ fontSize:7, fontWeight:700, color:"var(--warm)" }}>{areas.findIndex(a=>a.id===area.id)+1}</span>
                      </div>
                      <span style={{ fontSize:11 }}>{area.icon}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"var(--sans)", fontSize:11, fontWeight:700, color:"var(--warm)", marginBottom:2 }}>{area.label}</div>
                      <div style={{ fontFamily:"var(--serif)", fontSize:13, fontStyle:"italic", color:"var(--text2)", lineHeight:1.5 }}>{area.goal}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* WEALTH */}
            {map.wealth_summary && (
              <div style={{ paddingTop:14, borderTop:"1px solid var(--border)" }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"#34d399", marginBottom:7, display:"flex", alignItems:"center", gap:6 }}>
                  <span>💰</span> Wealth
                </div>
                <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"#34d399", lineHeight:1.6, marginBottom: (map.bag_retirement || map.bag_assets || map.bag_cashflow || map.bag_other) ? 8 : 0 }}>
                  {map.wealth_summary}
                </div>
                {[
                  { key:"bag_retirement", icon:"🏡", label:"Retirement" },
                  { key:"bag_assets",     icon:"🏛️",  label:"Assets" },
                  { key:"bag_cashflow",   icon:"📈", label:"Cash flow" },
                  { key:"bag_other",      icon:"✦",  label:"Other" },
                ].filter(f => map[f.key]).map(f => (
                  <div key={f.key} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:5 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0, marginTop:3 }}>
                      <span style={{ fontSize:11, color:"#34d399" }}>·</span>
                      <span style={{ fontSize:11 }}>{f.icon}</span>
                      <span style={{ fontSize:10, fontWeight:600, color:"#34d399", textTransform:"uppercase", letterSpacing:0.5 }}>{f.label}</span>
                    </div>
                    <div style={{ fontFamily:"var(--serif)", fontSize:13, fontStyle:"italic", color:"var(--text3)", lineHeight:1.5, flex:1 }}>{map[f.key].slice(0,100)}{map[f.key].length > 100 ? "..." : ""}</div>
                  </div>
                ))}
              </div>
            )}

            {/* GROWTH */}
            {(map.growth_summary || map.bag_growth) && (
              <div style={{ paddingTop:14, borderTop:"1px solid var(--border)" }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"#a78bfa", marginBottom:7, display:"flex", alignItems:"center", gap:6 }}>
                  <span>🌱</span> Growth
                </div>
                {map.growth_summary && (
                  <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"#a78bfa", lineHeight:1.6, marginBottom: map.bag_growth ? 8 : 0 }}>
                    {map.growth_summary}
                  </div>
                )}
                {map.bag_growth && (
                  <div style={{ fontFamily:"var(--serif)", fontSize:13, fontStyle:"italic", color:"var(--text3)", lineHeight:1.5 }}>
                    {map.bag_growth.slice(0, 150)}{map.bag_growth.length > 150 ? "..." : ""}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* TIME -- collapsible */}
      <div style={{ marginBottom:10, background:"var(--bg3)", border:"1px solid var(--border2)", borderRadius:11, overflow:"hidden" }}>
        <div style={{ padding:"4px 14px 0", borderBottom: timeOpen ? "1px solid var(--border)" : "none" }}>
          <SectionHeader icon="⏳" label="Time -- Your Life Priorities" color="#c9a84c"
            isOpen={timeOpen} onToggle={() => setTimeOpen(o => !o)}
            summary={map.time_summary || (areas.some(a=>a.goal) ? areas.filter(a=>a.goal).map(a=>a.goal).join(" · ") : null)}
            summaryColor="var(--warm)" />
        </div>
        {timeOpen && (
          <div className="fade-in" style={{ padding:"14px 14px 18px" }}>
            <div style={{ fontSize:12, color:"var(--text3)", marginBottom:12, lineHeight:1.6 }}>
              In 10–15 years, where does your time go -- and does it match what matters most to you?
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <span style={{ fontSize:12 }}>✍️</span>
                <label style={{ fontFamily:"var(--sans)", fontSize:12, fontWeight:700, color:"var(--warm)" }}>In one sentence -- my time in {String(new Date().getFullYear() + 12)} looks like...</label>
              </div>
              <div style={{ fontSize:11, color:"var(--text4)", marginBottom:6 }}>This is what gets shown in your mirror. Make it vivid.</div>
              <textarea rows={2} value={map.time_summary || ""} onChange={e => set("time_summary", e.target.value)}
                placeholder="e.g. I spend my days building things that matter, present with the people I love, with space for adventure and stillness..."
                className="to-field summary-field" style={{ fontSize:15, fontFamily:"var(--serif)", fontStyle:"italic", color:"var(--warm)", lineHeight:1.7 }} />
            </div>
            {areas.some(a => a.goal) && (
              <div className="fade-in" style={{ marginBottom:16, padding:"14px 16px", background:"var(--bg2)", border:"1px solid rgba(201,168,76,.2)", borderRadius:10 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--warm)", marginBottom:10 }}>
                  Your Life Goals {map.bag_year ? `· ${map.bag_year}` : ""}
                </div>
                {areas.filter(a => a.goal).map((area, i) => (
                  <div key={area.id} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom: i < areas.filter(a=>a.goal).length - 1 ? 10 : 0, paddingBottom: i < areas.filter(a=>a.goal).length - 1 ? 10 : 0, borderBottom: i < areas.filter(a=>a.goal).length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0, marginTop:3 }}>
                      <div style={{ width:18, height:18, borderRadius:"50%", background:"var(--warm)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <span style={{ fontSize:8, fontWeight:700, color:"#0d1b2e" }}>{areas.findIndex(a => a.id === area.id) + 1}</span>
                      </div>
                      <span style={{ fontSize:14 }}>{area.icon}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"var(--sans)", fontSize:12, fontWeight:700, color:"var(--warm)", marginBottom:2 }}>{area.label}</div>
                      <div style={{ fontFamily:"var(--serif)", fontSize:15, fontStyle:"italic", color:"var(--text)", lineHeight:1.6 }}>{area.goal}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <LifeAreaSelector selected={areas} onToggle={toggleArea} onAddCustom={addCustom} />
            {areas.length > 0 && (
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--text4)", marginBottom:10 }}>
                  Priority order -- use ▲▼ to reorder · 1 = most important
                </div>
                {areas.map((area, i) => (
                  <LifeAreaCard key={area.id} area={area} rank={i + 1} total={areas.length}
                    onMoveUp={() => moveArea(i, -1)} onMoveDown={() => moveArea(i, 1)}
                    onRemove={() => removeArea(area.id)}
                    onChange={(field, val) => updateArea(area.id, field, val)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* WEALTH -- collapsible */}
      <div style={{ marginBottom:10, background:"var(--bg3)", border:"1px solid var(--border2)", borderRadius:11, overflow:"hidden" }}>
        <div style={{ padding:"4px 14px 0", borderBottom: wealthOpen ? "1px solid var(--border)" : "none" }}>
          <SectionHeader icon="💰" label="Wealth" color="#34d399"
            isOpen={wealthOpen} onToggle={() => setWealthOpen(o => !o)}
            summary={map.wealth_summary} summaryColor="#34d399" />
        </div>
        {wealthOpen && (
          <div className="fade-in" style={{ padding:"14px 14px 18px" }}>
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <span style={{ fontSize:12 }}>✍️</span>
                <label style={{ fontFamily:"var(--sans)", fontSize:12, fontWeight:700, color:"#34d399" }}>In one sentence -- my financial life in {String(new Date().getFullYear() + 12)} looks like...</label>
              </div>
              <div style={{ fontSize:11, color:"var(--text4)", marginBottom:6 }}>This is what gets shown in your mirror. Make it vivid.</div>
              <textarea rows={2} value={map.wealth_summary || ""} onChange={e => set("wealth_summary", e.target.value)}
                placeholder="e.g. I have complete financial freedom -- my assets generate income, my family is secure, and I give generously without thinking twice..."
                className="to-field summary-field" style={{ fontSize:15, fontFamily:"var(--serif)", fontStyle:"italic", color:"#34d399", lineHeight:1.7 }} />
            </div>
            {[
              { key:"bag_retirement", label:"Retirement",         icon:"🏡", placeholder:"What does retirement look like -- when, how, what does life feel like when you stop working by necessity?" },
              { key:"bag_assets",     label:"Assets",             icon:"🏛️",  placeholder:"Property, investments, business equity -- what have you built and what does it generate?" },
              { key:"bag_cashflow",   label:"Cash flow & Salary", icon:"📈", placeholder:"What does your annual income or cash flow look like? What level creates genuine freedom?" },
              { key:"bag_other",      label:"Other",              icon:"✦",  placeholder:"Legacy, giving, philanthropy, financial milestones..." },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:13 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                  <span style={{ fontSize:13 }}>{f.icon}</span>
                  <label style={{ fontSize:12, fontWeight:500, color:"#34d399" }}>{f.label}</label>
                </div>
                <textarea rows={3} value={map[f.key] || ""} onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder} className="to-field" style={{ fontSize:13 }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GROWTH -- collapsible */}
      <div style={{ marginBottom:10, background:"var(--bg3)", border:"1px solid var(--border2)", borderRadius:11, overflow:"hidden" }}>
        <div style={{ padding:"4px 14px 0", borderBottom: growthOpen ? "1px solid var(--border)" : "none" }}>
          <SectionHeader icon="🌱" label="Growth" color="#a78bfa"
            isOpen={growthOpen} onToggle={() => setGrowthOpen(o => !o)}
            summary={map.growth_summary} summaryColor="#a78bfa" />
        </div>
        {growthOpen && (
          <div className="fade-in" style={{ padding:"14px 14px 18px" }}>
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <span style={{ fontSize:12 }}>✍️</span>
                <label style={{ fontFamily:"var(--sans)", fontSize:12, fontWeight:700, color:"#a78bfa" }}>In one sentence -- who I am in {String(new Date().getFullYear() + 12)}...</label>
              </div>
              <div style={{ fontSize:11, color:"var(--text4)", marginBottom:6 }}>This is what gets shown in your mirror. Make it personal.</div>
              <textarea rows={2} value={map.growth_summary || ""} onChange={e => set("growth_summary", e.target.value)}
                placeholder="e.g. I am deeply grounded, I show up with full presence, I have let go of needing to prove myself..."
                className="to-field summary-field" style={{ fontSize:15, fontFamily:"var(--serif)", fontStyle:"italic", color:"#a78bfa", lineHeight:1.7 }} />
            </div>
            <div style={{ padding:"9px 13px", background:"rgba(167,139,250,.05)", border:"1px solid rgba(167,139,250,.15)", borderRadius:7, marginBottom:10 }}>
              <div style={{ fontFamily:"var(--serif)", fontSize:13, fontStyle:"italic", color:"var(--text3)", lineHeight:1.6 }}>
                Describe more fully -- who are you? How do you show up? What have you let go of? What have you stepped into?
              </div>
            </div>
            <textarea rows={5} value={map.bag_growth || ""} onChange={e => set("bag_growth", e.target.value)}
              placeholder="In 10–15 years, as a person I am... I show up... I have let go of... I have become..."
              className="to-field" style={{ fontSize:13, fontFamily:"var(--serif)", fontStyle:"italic", color:"var(--warm)" }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

// OWN_IT_QUESTIONS removed -- replaced by slider-based OwnItCheck

function OwnItCheck({ context, onComplete, storageKey, purposeFinal, onFinalChange }) {
  const [open, setOpen] = useState(true);
  const [scores, setScores] = useState({ body:5, lights:5, meant:5 });
  const [missing, setMissing] = useState("");
  const [confirmed, setConfirmed] = useState(null); // null | true | false
  const [saved, setSaved] = useState(false);

  const avg = Math.round((scores.body + scores.lights + scores.meant) / 3 * 10) / 10;
  const allHigh = scores.body >= 7 && scores.lights >= 7 && scores.meant >= 7;

  const confirm = async (yes) => {
    setConfirmed(yes);
    if (yes && purposeFinal) {
      if (storageKey) await saveData(storageKey, { scores, missing, confirmed: true });
      if (onComplete) onComplete({ scores, missing, confirmed: true });
      setSaved(true);
    }
  };

  const ScoreSlider = ({ id, label, emoji }) => {
    const val = scores[id];
    const col = val >= 8 ? "#34d399" : val >= 5 ? "#f59e0b" : "#ef4444";
    return (
      <div style={{ marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <span style={{ fontSize:15 }}>{emoji}</span>
            <span style={{ fontFamily:"var(--sans)", fontSize:13, color:"var(--text)" }}>{label}</span>
          </div>
          <div style={{ fontFamily:"var(--serif)", fontSize:18, fontWeight:300, color:col }}>{val}<span style={{ fontSize:11 }}>/10</span></div>
        </div>
        <input type="range" min={1} max={10} step={1} value={val}
          onChange={e => setScores(s => ({ ...s, [id]: Number(e.target.value) }))}
          style={{ accentColor:col, width:"100%" }} />
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--text4)", marginTop:4 }}>
          <span style={{ color:"#ef4444" }}>1 · In the dark</span>
          {[2,3,4,5,6,7,8,9].map(n => <span key={n} style={{ opacity:0.3 }}>|</span>)}
          <span style={{ color:"#34d399" }}>10 · That's it</span>
        </div>
      </div>
    );
  };

  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ display:"flex", alignItems:"center", gap:8, background:"none", border:"1px solid rgba(201,168,76,.22)", borderRadius:20, padding:"6px 14px", cursor:"pointer", fontFamily:"var(--sans)", fontSize:12, color:"var(--warm)", marginTop:12 }}>
      <span style={{ fontSize:10 }}>◎</span> {saved ? "✓ Purpose confirmed" : "Own It Check"}
    </button>
  );

  return (
    <div className="fade-in" style={{ marginTop:16, background:"rgba(232,149,109,.04)", border:"1px solid rgba(201,168,76,.2)", borderRadius:13, overflow:"hidden" }}>
      <div style={{ padding:"12px 18px", borderBottom:"1px solid rgba(201,168,76,.12)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--warm)", animation:"pulse 2s infinite" }} />
          <div style={{ fontFamily:"var(--sans)", fontSize:11, fontWeight:500, letterSpacing:2, textTransform:"uppercase", color:"var(--warm)" }}>Own It Check</div>
          {avg > 0 && (
            <div style={{ fontSize:10, color: avg >= 7 ? "#34d399" : avg >= 5 ? "#f59e0b" : "#ef4444", fontWeight:600 }}>avg {avg}/10</div>
          )}
        </div>
        <button onClick={() => setOpen(false)} style={{ background:"none", border:"none", color:"var(--text4)", cursor:"pointer", fontSize:16, padding:0, lineHeight:1 }}>×</button>
      </div>

      <div style={{ padding:"16px 18px" }}>
        {/* Instruction */}
        <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--text3)", lineHeight:1.7, marginBottom:18 }}>
          Read your purpose statement back. When I read my purpose statement...
        </div>

        {/* 3 sliders */}
        <ScoreSlider id="body"   label="Feels right in my body"             emoji="🫀" />
        <ScoreSlider id="lights" label="Lights me up"                        emoji="✨" />
        <ScoreSlider id="meant"  label="Sounds like what I'm meant to do"    emoji="🧭" />

        {/* What's missing */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:500, color:"var(--text)", marginBottom:3 }}>What's missing or not quite right?</div>
          <div style={{ fontSize:11, color:"var(--text4)", marginBottom:7 }}>Use the Voice below for guidance -- then iterate on your statement above.</div>
          <textarea rows={3} value={missing} onChange={e => setMissing(e.target.value)}
            placeholder="What I'd change or add is..."
            className="to-field" style={{ fontSize:13 }} />
        </div>

        {/* Yes / No confirmation */}
        {confirmed === null && (
          <div style={{ padding:"13px 16px", background:"var(--bg3)", border:"1px solid var(--border2)", borderRadius:9 }}>
            <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:500, color:"var(--text)", marginBottom:10 }}>
              Now -- does this check all the boxes above?
            </div>
            <div style={{ display:"flex", gap:9 }}>
              <button onClick={() => confirm(true)}
                style={{ flex:1, padding:"10px", background:"rgba(52,211,153,.1)", border:"1px solid #34d399", borderRadius:8, color:"#34d399", cursor:"pointer", fontFamily:"var(--sans)", fontSize:13, fontWeight:700, transition:"all .2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(52,211,153,.2)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(52,211,153,.1)"}>
                ✓ Yes -- this is it
              </button>
              <button onClick={() => confirm(false)}
                style={{ flex:1, padding:"10px", background:"rgba(245,158,11,.08)", border:"1px solid rgba(245,158,11,.4)", borderRadius:8, color:"#f59e0b", cursor:"pointer", fontFamily:"var(--sans)", fontSize:13, fontWeight:500, transition:"all .2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,.18)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(245,158,11,.08)"}>
                Not yet -- still working on it
              </button>
            </div>
          </div>
        )}

        {/* Confirmed YES */}
        {confirmed === true && saved && (
          <div className="fade-in" style={{ padding:"14px 16px", background:"rgba(52,211,153,.07)", border:"1px solid rgba(52,211,153,.25)", borderRadius:9 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <span style={{ fontSize:16 }}>✓</span>
              <div style={{ fontFamily:"var(--sans)", fontSize:12, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:"#34d399" }}>Purpose confirmed</div>
            </div>
            <div style={{ fontFamily:"var(--serif)", fontSize:16, fontStyle:"italic", color:"var(--text)", lineHeight:1.7 }}>"{purposeFinal}"</div>
            <div style={{ fontSize:11, color:"var(--text4)", marginTop:8 }}>This is your final purpose statement. You can still edit it above and re-confirm.</div>
            <button onClick={() => { setConfirmed(null); setSaved(false); }}
              style={{ marginTop:10, background:"none", border:"1px solid var(--border2)", borderRadius:20, color:"var(--text4)", cursor:"pointer", fontFamily:"var(--sans)", fontSize:11, padding:"4px 12px" }}>
              ↺ Re-check
            </button>
          </div>
        )}

        {/* Confirmed NO */}
        {confirmed === false && (
          <div className="fade-in" style={{ padding:"13px 16px", background:"rgba(245,158,11,.06)", border:"1px solid rgba(245,158,11,.2)", borderRadius:9 }}>
            <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"var(--text2)", lineHeight:1.6, marginBottom:8 }}>
              Good -- keep going. Use the notes above and ask the Voice for help refining it. Come back when it feels right.
            </div>
            <button onClick={() => setConfirmed(null)}
              style={{ background:"none", border:"1px solid var(--border2)", borderRadius:20, color:"var(--text4)", cursor:"pointer", fontFamily:"var(--sans)", fontSize:11, padding:"4px 12px" }}>
              ↺ Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// OwnItField removed -- no longer used

const TextArea = ({ value, onChange, rows, placeholder, className, style: s }) => {
  const ref = useRef(null);
  const lastVal = useRef(value);
  useEffect(() => { if (ref.current && document.activeElement !== ref.current && value !== lastVal.current) { ref.current.value = value || ""; lastVal.current = value; } }, [value]);
  const handleChange = (e) => { lastVal.current = e.target.value; onChange(e.target.value); };
  return <textarea ref={ref} rows={rows || 4} placeholder={placeholder} defaultValue={value || ""} onChange={handleChange} className={`to-field${className ? " " + className : ""}`} style={s} />;
};

const TextInput = ({ value, onChange, placeholder, style: s }) => {
  const ref = useRef(null);
  const lastVal = useRef(value);
  useEffect(() => { if (ref.current && document.activeElement !== ref.current && value !== lastVal.current) { ref.current.value = value || ""; lastVal.current = value; } }, [value]);
  const handleChange = (e) => { lastVal.current = e.target.value; onChange(e.target.value); };
  return <input type="text" ref={ref} placeholder={placeholder} defaultValue={value || ""} onChange={handleChange} className="to-field" style={{ ...(s || {}), resize:"none" }} />;
};

function VoiceDropdown({ voiceId, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const v = VOICES[voiceId];
  useEffect(() => { const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler); }, []);
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button onClick={() => setOpen(!open)} style={{ display:"flex", alignItems:"center", gap:7, background:v.muted, border:`1px solid ${v.border}`, borderRadius:20, padding:"5px 13px", cursor:"pointer" }}>
        <span style={{ color:v.color, fontSize:13 }}>{v.icon}</span>
        <span style={{ fontFamily:"var(--sans)", fontSize:12, color:v.color, fontWeight:700 }}>{v.short}</span>
        <span style={{ color:"var(--text4)", fontSize:9 }}>▾</span>
      </button>
      {open && (
        <div className="fade-in" style={{ position:"absolute", top:"calc(100% + 7px)", right:0, background:"var(--bg2)", border:"1px solid var(--border2)", borderRadius:12, padding:7, zIndex:300, minWidth:230, boxShadow:"0 20px 60px rgba(0,0,0,.65)" }}>
          {Object.values(VOICES).map(vv => (
            <button key={vv.id} onClick={() => { onSelect(vv.id); setOpen(false); }} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"9px 11px", background:vv.id === voiceId ? vv.muted : "transparent", border:"none", borderRadius:7, cursor:"pointer", textAlign:"left" }}>
              <span style={{ color:vv.color, fontSize:14, minWidth:17 }}>{vv.icon}</span>
              <div>
                <div style={{ fontFamily:"var(--sans)", fontSize:13, color:vv.id === voiceId ? vv.color : "var(--text)", fontWeight:vv.id === voiceId ? 500 : 400 }}>{vv.label}</div>
                <div style={{ fontFamily:"var(--sans)", fontSize:11, color:"var(--text4)", marginTop:1 }}>{VOICE_DESC[vv.id].slice(0, 42)}…</div>
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
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
      {Object.values(VOICES).map(vv => (
        <button key={vv.id} onClick={() => onSelect(vv.id)} style={{ padding:"13px 14px", background:vv.id === selected ? vv.muted : "var(--bg3)", border:`1px solid ${vv.id === selected ? vv.border : "var(--border)"}`, borderRadius:10, cursor:"pointer", textAlign:"left", transition:"all .18s", fontFamily:"var(--sans)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
            <span style={{ color:vv.color, fontSize:15 }}>{vv.icon}</span>
            <span style={{ fontSize:12, color:vv.id === selected ? vv.color : "var(--text)", fontWeight:500 }}>{vv.label}</span>
          </div>
          <div style={{ fontSize:11, color:"var(--text4)", lineHeight:1.45 }}>{VOICE_DESC[vv.id]}</div>
          {vv.id === selected && <div style={{ marginTop:7, fontSize:10, color:vv.color, fontWeight:500, letterSpacing:1, textTransform:"uppercase" }}>✓ Selected</div>}
        </button>
      ))}
    </div>
  );
}

function AIChat({ voiceId, onVoiceChange, name, intake, mapData, sectionLabel, placeholder }) {
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const v = VOICES[voiceId];
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);
  const send = async () => {
    const text = inputRef.current?.value?.trim();
    if (!text || loading) return;
    inputRef.current.value = "";
    const newMsgs = [...msgs, { role:"user", content:text }];
    setMsgs(newMsgs);
    setLoading(true);
    try {
      const history = newMsgs.slice(-8).map(m => ({ role:m.role, content:m.content }));
      const reply = await callAI(voiceId, name, intake, mapData, text, history.slice(0, -1));
      setMsgs(prev => [...prev, { role:"assistant", content:reply, vid:voiceId }]);
    } catch {
      setMsgs(prev => [...prev, { role:"assistant", content:"Something went wrong.", vid:voiceId }]);
    }
    setLoading(false);
  };
  const contextItems = [];
  if ((mapData?.purpose_layers || []).filter(l => (l||"").trim()).length > 0) contextItems.push("purpose peeling");
  if (mapData?.purpose_final || mapData?.purpose_draft) contextItems.push("purpose statement");
  if ((mapData?.life_areas || []).length > 0) contextItems.push("life priorities");
  if (mapData?.bag_growth) contextItems.push("growth vision");
  if ((mapData?.animals || []).filter(a => a.name).length > 0) contextItems.push("animals");
  if ((mapData?.values || []).filter(v => v.name).length > 0) contextItems.push("values");
  if (mapData?.align_direction !== undefined) contextItems.push("alignment scores");
  return (
    <div style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:13, overflow:"hidden" }}>
      <div style={{ padding:"9px 13px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:v.color, animation:"pulse 2s infinite" }} />
          <span style={{ fontFamily:"var(--sans)", fontSize:12, color:v.color, fontWeight:700 }}>{v.label}</span>
        </div>
        <VoiceDropdown voiceId={voiceId} onSelect={onVoiceChange} />
      </div>
      {contextItems.length > 0 && (
        <div style={{ padding:"7px 13px", borderBottom:"1px solid var(--border)", background:"rgba(201,168,76,.04)", display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <span style={{ fontFamily:"var(--sans)", fontSize:10, color:"var(--text4)", letterSpacing:1, textTransform:"uppercase", flexShrink:0 }}>Katherine can see:</span>
          {contextItems.map(item => <span key={item} style={{ fontFamily:"var(--sans)", fontSize:10, color:"var(--warm)", background:"rgba(201,168,76,.1)", border:"1px solid rgba(201,168,76,.2)", borderRadius:10, padding:"2px 8px" }}>{item}</span>)}
        </div>
      )}
      {msgs.length > 0 && (
        <div style={{ maxHeight:270, overflowY:"auto", padding:"13px" }}>
          {msgs.map((m, i) => {
            const mv = m.vid ? VOICES[m.vid] : v;
            return (
              <div key={i} style={{ marginBottom:13, display:"flex", flexDirection:"column", alignItems:m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.role === "user"
                  ? <div style={{ background:"var(--bg4)", border:"1px solid var(--border2)", borderRadius:"11px 11px 3px 11px", padding:"9px 13px", maxWidth:"80%", fontSize:13, color:"var(--text2)", lineHeight:1.6 }}>{m.content}</div>
                  : <div style={{ maxWidth:"90%" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5 }}>
                        <span style={{ color:mv.color, fontSize:12 }}>{mv.icon}</span>
                        <span style={{ fontSize:11, color:"var(--text4)", fontWeight:500 }}>{mv.short}</span>
                      </div>
                      <div style={{ fontFamily:"var(--serif)", fontSize:17, lineHeight:1.85, color:"var(--text)", fontWeight:300, borderLeft:`2px solid ${mv.border}`, paddingLeft:11 }}>{m.content}</div>
                    </div>
                }
              </div>
            );
          })}
          {loading && <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:13 }}><span style={{ color:v.color, fontSize:12 }}>{v.icon}</span><div className="dot-l" style={{ color:v.color }}><span /><span /><span /></div></div>}
          <div ref={bottomRef} />
        </div>
      )}
      <div style={{ padding:"9px 11px", borderTop:msgs.length > 0 ? "1px solid var(--border)" : "none", display:"flex", gap:8, alignItems:"flex-end" }}>
        <textarea ref={inputRef} rows={2}
          placeholder={placeholder || `Ask Katherine about your ${sectionLabel || "progress"}...`}
          className="to-field"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          style={{ flex:1, minHeight:52, fontSize:13, padding:"9px 11px", borderRadius:8 }} />
        <button onClick={send} disabled={loading} style={{ background:loading ? "var(--bg4)" : v.color, border:"none", borderRadius:8, color:loading ? "var(--text4)" : "#000", cursor:loading ? "not-allowed" : "pointer", fontSize:18, padding:"11px 15px", transition:"all .2s", lineHeight:1 }}>→</button>
      </div>
      <div style={{ fontSize:11, color:"var(--text3)", textAlign:"right", padding:"0 11px 7px" }}>Enter to send · Shift+Enter for new line</div>
    </div>
  );
}

function VideoBlock({ title, duration, points }) {
  return (
    <div className="vid-block">
      <div style={{ width:38, height:38, borderRadius:"50%", background:"rgba(201,168,76,.1)", border:"1px solid rgba(201,168,76,.22)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"var(--warm)", fontSize:13 }}>▶</div>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <div style={{ fontFamily:"var(--sans)", fontSize:14, fontWeight:400, color:"#e8e4dc", lineHeight:1.3 }}>{title}</div>
          <div style={{ fontSize:11, color:"var(--text4)", flexShrink:0, marginLeft:10 }}>{duration}</div>
        </div>
        <div style={{ fontSize:11, color:"#7a9bb0", textTransform:"uppercase", letterSpacing:1.4, marginBottom:5, fontWeight:500 }}>Katherine covers:</div>
        {points.map((p, i) => (
          <div key={i} style={{ fontSize:12, color:"#9eb3c2", lineHeight:1.6, paddingLeft:9, position:"relative", marginBottom:2 }}>
            <span style={{ position:"absolute", left:0, color:"var(--warm)" }}>·</span>{p}
          </div>
        ))}
        <div style={{ marginTop:9, display:"inline-flex", alignItems:"center", gap:5, fontSize:11, color:"var(--warm)", background:"rgba(201,168,76,.07)", border:"1px solid rgba(232,149,109,.16)", borderRadius:18, padding:"3px 11px" }}>
          ▶ Video placeholder -- record to this brief
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
  const submit3 = async () => { setBusy(true); await new Promise(r => setTimeout(r, 800)); const v = detectVoice(q3); setAssigned(v); setChosen(v); setBusy(false); setStep(4); };
  const KNote = ({ children }) => (
    <div style={{ padding:"13px 17px", background:"rgba(201,168,76,.07)", border:"1px solid rgba(201,168,76,.14)", borderRadius:9, marginBottom:18 }}>
      <div style={{ fontFamily:"var(--serif)", fontSize:15, fontStyle:"italic", color:"var(--text2)", lineHeight:1.7 }}>{children}</div>
    </div>
  );
  const screens = [
    <div key="n" className="fade-up" style={{ maxWidth:540 }}>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:4, textTransform:"uppercase", color:"#c9a84c", marginBottom:14, fontFamily:"var(--sans)" }}>AG45 · True Ownership</div>

      <h1 style={{ fontFamily:"var(--serif)", fontSize:52, fontWeight:400, lineHeight:1.0, letterSpacing:"-0.5px", marginBottom:18 }}>
        To own your life,<br /><em>you must first<br />belong to yourself.</em>
      </h1>

      <p style={{ fontSize:15, color:"var(--text2)", lineHeight:1.85, maxWidth:480, marginBottom:22 }}>
        True Ownership is not about your business or your role. It is about being the CEO of your life -- knowing who you are, what you want, and where you are going. And beginning to live by that person.
      </p>

      <p style={{ fontSize:15, color:"var(--text2)", lineHeight:1.85, maxWidth:480, marginBottom:28 }}>
        That means trusting yourself -- your intuition, your logic, your experiences. It also means building the right advocates around you. But you cannot choose them wisely until you are clear about yourself. Everything starts with you.
      </p>

      {/* The 5 As */}
      <div style={{ marginBottom:28, padding:"18px 20px", background:"var(--bg2)", border:"1px solid var(--border2)", borderRadius:11 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"var(--warm)", marginBottom:14, fontFamily:"var(--sans)" }}>The Five As -- Your Journey</div>
        {[
          { a:"A1", label:"All In It",     color:"var(--warm)", desc:"Know yourself. Purpose, identity, values and direction. The foundation everything is built on." },
          { a:"A2", label:"Align With It", color:"#c9a84c",     desc:"Does how you spend your time, energy and money match who you are and where you are going?" },
          { a:"A3", label:"Advocate",      color:"#a78bfa",     desc:"Build your board. Who belongs around you? You cannot choose your advocates wisely until you know yourself." },
          { a:"A4", label:"Act On It",     color:"#34d399",     desc:"Your goals and daily behaviours. The bridge between who you are and the life you are building." },
          { a:"A5", label:"Accountable",   color:"#f59e0b",     desc:"Own your commitments. Track, reflect, adjust. This is where ownership becomes a daily practice." },
        ].map((item, i) => (
          <div key={item.a} style={{ display:"flex", alignItems:"flex-start", gap:13, marginBottom: i < 4 ? 13 : 0, paddingBottom: i < 4 ? 13 : 0, borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background: i === 0 ? "rgba(201,168,76,.15)" : "var(--bg3)", border:`1px solid ${i === 0 ? "rgba(201,168,76,.4)" : "var(--border2)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
              <span style={{ fontFamily:"var(--sans)", fontSize:10, fontWeight:700, color: i === 0 ? "var(--warm)" : "var(--text4)" }}>{item.a}</span>
            </div>
            <div>
              <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:700, color: i === 0 ? item.color : "var(--text3)", marginBottom:3 }}>{item.label}{i === 0 ? " · Where we begin" : ""}</div>
              <div style={{ fontSize:13, color: i === 0 ? "var(--text2)" : "var(--text4)", lineHeight:1.6 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding:"14px 18px", background:"rgba(201,168,76,.06)", border:"1px solid rgba(201,168,76,.14)", borderRadius:9, marginBottom:28 }}>
        <div style={{ fontFamily:"var(--serif)", fontSize:16, fontStyle:"italic", color:"var(--text)", lineHeight:1.8 }}>
          "This system is one of your board of advisors -- a mirror that reflects your own thinking back more clearly. It does not think for you. You are the authority on your own life."
        </div>
      </div>

      <label style={{ display:"block", fontFamily:"var(--sans)", fontSize:13, color:"var(--text3)", marginBottom:7 }}>What's your first name?</label>
      <TextInput value={name} onChange={setName} placeholder="Your name..." style={{ fontSize:13, fontWeight:500, padding:"15px 19px", marginBottom:20 }} />
      <button className="btn" disabled={!name.trim()} onClick={() => setStep(1)}>Begin →</button>
    </div>,
    <div key="q1" className="fade-up" style={{ maxWidth:520 }}>
      <div className="lbl" style={{ marginBottom:9 }}>Question 1 of 3</div>
      <h2 style={{ fontFamily:"var(--serif)", fontSize:36, fontWeight:400, lineHeight:1.15, marginBottom:18, letterSpacing:"-0.4px" }}>What brought you here, {name}?</h2>
      <KNote>"In one sentence -- what's the thing that finally made you say: I need to do this work."</KNote>
      <TextArea value={q1} onChange={setQ1} rows={4} placeholder="What brought me here is..." style={{ marginBottom:16 }} />
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <button className="btn-g" onClick={() => setStep(0)}>← Back</button>
        <button className="btn" disabled={!q1.trim()} onClick={() => setStep(2)}>Next →</button>
      </div>
    </div>,
    <div key="q2" className="fade-up" style={{ maxWidth:520 }}>
      <div className="lbl" style={{ marginBottom:9 }}>Question 2 of 3</div>
      <h2 style={{ fontFamily:"var(--serif)", fontSize:36, fontWeight:400, lineHeight:1.15, marginBottom:18, letterSpacing:"-0.4px" }}>Who are you becoming?</h2>
      <KNote>"Don't think about your business or role. In 3 years, living fully as yourself -- what's one word or phrase that describes who that person is?"</KNote>
      <TextArea value={q2} onChange={setQ2} rows={4} placeholder="In 3 years, I am..." style={{ marginBottom:16 }} />
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <button className="btn-g" onClick={() => setStep(1)}>← Back</button>
        <button className="btn" disabled={!q2.trim()} onClick={() => setStep(3)}>Next →</button>
      </div>
    </div>,
    <div key="q3" className="fade-up" style={{ maxWidth:520 }}>
      <div className="lbl" style={{ marginBottom:9 }}>Question 3 of 3</div>
      <h2 style={{ fontFamily:"var(--serif)", fontSize:36, fontWeight:400, lineHeight:1.15, marginBottom:18, letterSpacing:"-0.4px" }}>What do you most need?</h2>
      <KNote>"What do you most need from this experience -- permission, clarity, a push, or something else? Say it in your own words."</KNote>
      <TextArea value={q3} onChange={setQ3} rows={4} placeholder="What I most need is..." style={{ marginBottom:16 }} />
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <button className="btn-g" onClick={() => setStep(2)}>← Back</button>
        <button className="btn" disabled={!q3.trim() || busy} onClick={submit3}>{busy ? <span className="dot-l"><span /><span /><span /></span> : "Find my voice →"}</button>
      </div>
    </div>,
    <div key="v" className="fade-up" style={{ maxWidth:590 }}>
      {assigned && chosen && (() => {
        const av = VOICES[assigned];
        return <>
          <div className="lbl" style={{ marginBottom:13 }}>Your default voice</div>
          <h2 style={{ fontFamily:"var(--serif)", fontSize:34, fontWeight:400, lineHeight:1.2, marginBottom:9, letterSpacing:"-0.3px" }}>Based on what you shared,<br /><em>I'm starting you with:</em></h2>
          <div style={{ padding:"19px 22px", background:av.muted, border:`1px solid ${av.border}`, borderRadius:13, marginBottom:7 }}>
            <div style={{ display:"flex", alignItems:"center", gap:11, marginBottom:9 }}>
              <span style={{ color:av.color, fontSize:24 }}>{av.icon}</span>
              <div style={{ fontFamily:"var(--serif)", fontSize:21, color:av.color, fontWeight:400 }}>{av.label}</div>
            </div>
            <div style={{ fontFamily:"var(--sans)", fontSize:13, color:"var(--text2)", lineHeight:1.7, marginBottom:7 }}>{VOICE_DESC[assigned]}</div>
            <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"var(--text3)", fontStyle:"italic" }}>Why: {VOICE_REASON[assigned]}</div>
          </div>
          <div style={{ padding:"9px 13px", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:8, marginBottom:12 }}>
            <span style={{ fontFamily:"var(--sans)", fontSize:12, color:"var(--text2)", fontWeight:500 }}>Not right for today? </span>
            <span style={{ fontFamily:"var(--sans)", fontSize:12, color:"var(--text3)" }}>Choose the voice you actually need -- you can switch any time.</span>
          </div>
          <VoiceGrid selected={chosen} onSelect={setChosen} />
          <div style={{ marginTop:18 }}>
            <button className="btn" onClick={() => onDone({ name, q1, q2, q3, defaultVoice:chosen })}>Begin All In It →</button>
          </div>
        </>;
      })()}
    </div>,
  ];
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"36px 22px 80px" }}>
      {screens[step]}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(13,27,46,.95)", borderTop:"1px solid #254060", padding:"8px 28px", display:"flex", alignItems:"center", gap:8, zIndex:40 }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--warm)", animation:"pulse 2s infinite", flexShrink:0 }} />
        <span style={{ fontFamily:"var(--sans)", fontSize:11, color:"var(--text4)" }}>Your answers are saved automatically -- you can come back to this any time</span>
      </div>
    </div>
  );
}

const STEPS = [
  { id:"intro",   label:"Introduction" },
  { id:"mirror1", label:"Purpose · Direction" },
  { id:"mirror2", label:"Identity · Superpowers" },
  { id:"mirror3", label:"Values · Behaviors" },
  { id:"align",   label:"Alignment Check" },
  { id:"map",     label:"My Map of Me" },
];

const EMPTY_MAP = {
  purpose_layers: [""],
  purpose_draft: "", purpose_final: "",
  bag_year: "",
  life_areas: [],
  bag_retirement: "", bag_assets: "", bag_cashflow: "", bag_other: "",
  time_summary: "", wealth_summary: "", growth_summary: "",
  mirror1_reflection: "", mirror1_reflection_done: false,
  mirror2_sub: "qualities",
  lovedones_who: "", lovedones_input: "", lovedones_reflection: "",
  bag_growth: "",
  identity_adjectives: "",
  animals: [{ name:"", adjective1:"", adjective2:"", alignment:5 }],
  capabilities_note: "",
  values_irks: "",
  values: [{ name:"", irk:"", behaviors:"" }],
  behaviors_note: "",
  align_direction:5, align_superpowers:5, align_behaviors:5,
};

const MIRROR_CARDS = [
  { side:"internal", id:"purpose",    icon:"🔥", label:"Purpose",    color:"#c9a84c", colorMuted:"rgba(232,149,109,0.08)", colorBorder:"rgba(232,149,109,0.2)", pair:"mirror1", tagline:"Your internal north star",          description:"Purpose is the internal reason you exist -- the impact your presence creates regardless of any role or outcome. Not your business, not your family -- those are expressions of it. Your purpose stays constant when everything else changes. Short enough to say in the car. True enough to get you out of bed on a hard day.", katherine:"\"When I ask people what their purpose is, they usually say their kids or their business. That's not purpose -- those are attachments. Purpose needs to be 100% internal to you.\"" },
  { side:"internal", id:"identity",   icon:"🦁", label:"Identity",   color:"#c9a84c", colorMuted:"rgba(79,203,242,0.08)",  colorBorder:"rgba(79,203,242,0.2)",  pair:"mirror2", tagline:"Who you are at your best",           description:"Identity is your internal superpowers anchored to animals -- because people remember images, not word lists. Two adjectives make it specific to you, not the generic animal. And if you're too aligned with one animal, you might be in detriment of the others.", katherine:"\"I had a client tell me: 'I was in my crazy monkey and I realized I needed to bring the lion out.' That's how this works -- you glance at it and immediately know what you need.\"" },
  { side:"internal", id:"values",     icon:"⚖️", label:"Values",     color:"#34d399", colorMuted:"rgba(52,211,153,0.08)",  colorBorder:"rgba(52,211,153,0.2)",  pair:"mirror3", tagline:"The standards you live by",           description:"Values are how you make decisions and set boundaries -- the standards that, when violated, make your blood boil. The fastest way to find them: what behaviors in others do you absolutely cannot stand? Peel back one layer and you'll find your value underneath.", katherine:"\"Someone told me she hated people who weren't accountable. Two minutes later we'd identified accountability as her top value -- she'd just never named it.\"" },
  { side:"external", id:"direction",  icon:"⛰️", label:"Direction",  color:"#c9a84c", colorMuted:"rgba(79,203,242,0.08)",  colorBorder:"rgba(79,203,242,0.2)",  pair:"mirror1", tagline:"Your Big Ass Goal -- the summit",       description:"Your BAG -- Big Ass Goal -- is the 10–15 year dream across Time (how you live your days), Wealth (financial freedom), and Growth (who you're becoming as a person). It should feel dreamy and a bit scary. About 25% believable. If you can see exactly how to get there, it's not big enough.", katherine:"\"Start at the top of the mountain. We work backwards from there. Most people set goals from where they are. We set them from where we want to be.\"" },
  { side:"external", id:"superpowers",icon:"⚡", label:"Superpowers",color:"#a78bfa", colorMuted:"rgba(167,139,250,0.08)", colorBorder:"rgba(167,139,250,0.2)", pair:"mirror2", tagline:"How your identity shows up in the world",description:"Each animal has a superpower and a detriment. The superpower is what it enables when working for you. The detriment is what happens when it goes too far. Knowing both lets you call on the right animal at the right moment -- and catch yourself when one is running unchecked.", katherine:"\"The superpower is why you chose this animal. The dark side is the thing that costs you when it's out of balance. Both are data.\"" },
  { side:"external", id:"behaviors",  icon:"🎯", label:"Behaviors",  color:"#34d399", colorMuted:"rgba(52,211,153,0.08)",  colorBorder:"rgba(52,211,153,0.2)",  pair:"mirror3", tagline:"How your values show up in action",     description:"Behaviors are the external proof of your values. Not what you believe -- how you act when it costs you something. For each value we define what living it looks like, and the violation signal that tells you it's being stomped on. Values become a decision filter, not a motivational poster.", katherine:"\"A value without a behavior attached to it is just a word on a wall. We define the behavior so you can actually use it.\"" },
];

function SoWhatLayer({ index, value, onChange, isLatest, onGoDeeper, onReachedBottom, loading, done }) {
  const ref = useRef(null);
  const lastVal = useRef(value);
  const isFirst = index === 0;
  const depth = Math.min(index + 1, 5);
  const depthColor = ["rgba(201,168,76,0.45)","rgba(201,168,76,0.6)","rgba(201,168,76,0.75)","rgba(201,168,76,0.9)","#c9a84c"][depth - 1];
  useEffect(() => { if (!isFirst && isLatest && ref.current && !done) { setTimeout(() => ref.current?.focus(), 80); } }, [isLatest, isFirst, done]);
  useEffect(() => { if (ref.current && document.activeElement !== ref.current) { ref.current.value = value || ""; lastVal.current = value; } }, [value]);
  const handleChange = useCallback((e) => { lastVal.current = e.target.value; onChange(e.target.value); }, [onChange]);
  const handleBlur = useCallback((e) => { lastVal.current = e.target.value; onChange(e.target.value); e.target.style.borderColor = "var(--border2)"; e.target.style.boxShadow = "none"; }, [onChange]);
  const hasAnswer = (ref.current?.value || value || "").trim().length > 0;
  return (
    <div className={isFirst ? "" : "fade-up"} style={{ marginBottom: isFirst ? 20 : 0 }}>
      {!isFirst && (
        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"18px 0 14px" }}>
          <div style={{ width:24, height:24, borderRadius:"50%", background:"var(--bg3)", border:`2px solid ${depthColor}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ fontSize:9, color:depthColor, fontWeight:700 }}>{index + 1}</span>
          </div>
          <div style={{ flex:1, height:1, background:`linear-gradient(to right, ${depthColor}44, transparent)` }} />
          {index >= 3 && <div style={{ fontFamily:"var(--sans)", fontSize:10, color:"var(--text4)", fontStyle:"italic", flexShrink:0 }}>{index === 3 ? "Getting deeper..." : index === 4 ? "Almost there..." : "Keep going..."}</div>}
        </div>
      )}
      <div style={{ paddingLeft: isFirst ? 0 : 14, borderLeft: isFirst ? "none" : `2px solid ${depthColor}` }}>
      <div style={{ marginBottom:7 }}>
        {isFirst ? (
          <>
            <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:3 }}>When are you most alive?</div>
            <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"var(--text3)", lineHeight:1.5 }}>Describe what you're DOING -- not just the feeling. What are you creating, solving, connecting?</div>
          </>
        ) : (
          <>
            <div style={{ fontFamily:"var(--sans)", fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:depthColor, marginBottom:4 }}>So what's that give you?</div>
            <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"var(--text3)", lineHeight:1.5 }}>{index === 1 ? "What does that give you? What does it give others? Don't settle for the first answer." : "And what does THAT mean at a deeper level? Keep asking until something feels final."}</div>
          </>
        )}
      </div>
      <textarea ref={ref} rows={3} placeholder={isFirst ? "I feel most alive when I'm..." : "And that gives me / means..."}
        defaultValue={value || ""} onChange={handleChange} onBlur={handleBlur} disabled={done && !isLatest}
        className="purpose-peel-ta"
        style={{ width:"100%", background:"var(--bg4)", border:"1px solid var(--border2)", borderRadius:10, color:"var(--warm)", fontFamily:"var(--sans)", fontSize:13, lineHeight:1.7, padding:"12px 14px", outline:"none", resize:"none", opacity:done && !isLatest ? 0.6 : 1 }}
        onFocus={e => { e.target.style.borderColor = "var(--warm)"; e.target.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.12)"; }}
      />
      </div>
      {isLatest && hasAnswer && !done && (
        <div className="fade-up" style={{ display:"flex", gap:9, marginTop:12, flexWrap:"wrap", alignItems:"center" }}>
          <button onClick={onGoDeeper} disabled={loading}
            style={{ background:"none", border:"1px solid var(--border2)", borderRadius:20, color:"var(--text2)", cursor:"pointer", fontFamily:"var(--sans)", fontSize:12, fontWeight:500, padding:"8px 20px", transition:"all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--warm)"; e.currentTarget.style.color = "var(--warm)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text2)"; }}>
            {loading ? <span className="dot-l" style={{ color:"var(--warm)" }}><span /><span /><span /></span> : "↓ Go deeper -- so what's?"}
          </button>
          <div style={{ width:1, height:18, background:"var(--border2)" }} />
          <button onClick={onReachedBottom} disabled={loading}
            style={{ background:"rgba(201,168,76,.12)", border:"1px solid rgba(201,168,76,.4)", borderRadius:20, color:"var(--warm)", cursor:"pointer", fontFamily:"var(--sans)", fontSize:12, fontWeight:700, padding:"8px 20px", transition:"all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,.22)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(201,168,76,.12)"; }}>
            ✓ This is my bottom -- get my purpose
          </button>
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
    const currentLayers = domTextareas.length > 0 ? Array.from(domTextareas).map(ta => ta.value || "") : layers;
    const filledLayers = currentLayers.filter(l => (l || "").trim());
    if (filledLayers.length === 0) return;
    setLoading(true);
    let errorMsg = null;
    try {
      const layerText = currentLayers.map((l, i) => i === 0 ? `Most alive: "${l}"` : `So what's ${i}: "${l}"`).join("\n");
      const prevContext = sessions.length > 0 ? `\nPrevious sessions: ${sessions.map((s, si) => `Session ${si + 1} draft: "${s.draft || ""}" verbs: ${(s.verbs || []).join(", ")}`).join("; ")}` : "";
      const res = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:600,
          messages:[{ role:"user", content:`You are Katherine Breuss. ${name} just completed a purpose peeling exercise. Read their EXACT words carefully and respond based on what THEY specifically wrote -- not generic coaching language.\n\nTheir peeling layers:\n${layerText}\n\nWhat brought them here: "${intake?.q1 || ""}"\n${prevContext}\n${sessions.length > 0 ? "This is a return session." : ""}\n\nRespond ONLY with a JSON object. No preamble, no markdown, no explanation. Just the JSON:\n{"working":"1 sentence quoting their actual words","verbs":["verb1","verb2","verb3"],"draft":"short purpose statement built from their specific words -- must sound like them not a template","refining_question":"one question specific to what they wrote","deeper_note":"${sessions.length > 0 ? "1 sentence on how this session differs from previous ones" : ""}"}` }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(`API error: ${data.error.message}`);
      const rawText = data.content?.map(b => b.text || "").join("") || "";
      if (!rawText) throw new Error("Empty response from API");
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error(`No JSON found in: ${rawText.slice(0, 100)}`);
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.draft) throw new Error(`Missing draft field in: ${JSON.stringify(parsed)}`);
      if (onSessionSave) onSessionSave({ ...parsed, layers:[...currentLayers], date:new Date().toLocaleDateString() });
      onResult({ ...parsed });
      onFinalChange(parsed.draft || "");
      setDone(true);
    } catch (e) {
      errorMsg = e.message;
      const lastLayer = currentLayers.filter(l => (l||"").trim()).slice(-1)[0] || "";
      const firstLayer = currentLayers[0] || "";
      const fallback = { working:`You went ${currentLayers.filter(l=>(l||"").trim()).length} layers deep -- that takes honesty.`, verbs:firstLayer.split(/\s+/).filter(w => w.length > 4).slice(0, 3), draft:lastLayer.length > 10 ? lastLayer.slice(0, 120) : firstLayer.slice(0, 120), refining_question:"Read back what you wrote in your deepest layer. Is that your purpose, or is there still one more 'so what's?' left?", deeper_note:sessions.length > 0 ? "You returned -- that alone tells you something." : "", _error:errorMsg };
      if (onSessionSave) onSessionSave({ ...fallback, layers:[...currentLayers], date:new Date().toLocaleDateString() });
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
    onFinalChange("");
    setDone(false);
    setPeelingExpanded(false);
    setSessionKey(k => k + 1);
  }, [onLayersChange, onResult, onFinalChange]);

  return (
    <div>
      {sessions.length > 0 && (
        <div style={{ marginBottom:16, padding:"11px 14px", background:"var(--bg2)", border:"1px solid var(--border2)", borderRadius:9 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--text4)", marginBottom:8 }}>Previous sessions</div>
          {sessions.map((s, i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:i < sessions.length - 1 ? 8 : 0, paddingBottom:i < sessions.length - 1 ? 8 : 0, borderBottom:i < sessions.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontSize:10, color:"var(--text4)", flexShrink:0, marginTop:2 }}>{s.date || `Session ${i + 1}`}</div>
              <div style={{ fontFamily:"var(--serif)", fontSize:13, fontStyle:"italic", color:"var(--text3)", lineHeight:1.5, flex:1 }}>"{s.draft || ""}"</div>
              <div style={{ fontSize:10, color:"var(--text4)", flexShrink:0 }}>{(s.layers || []).length} layers</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding:"11px 14px", background:"rgba(201,168,76,.07)", border:"1px solid rgba(201,168,76,.18)", borderRadius:9, marginBottom:18 }}>
        <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--text2)", lineHeight:1.7 }}>
          {sessions.length > 0 ? `"Welcome back, ${name}. Each time you return to this, you go deeper. What surfaces today may be different -- and that is the point."` : '"Purpose is discovered by peeling -- not by thinking hard. Answer each so what\'s? until something feels final."'}
        </div>
      </div>

      {/* COLLAPSED VIEW */}
      {done && !peelingExpanded && (
        <div className="fade-in" style={{ marginBottom:14, padding:"12px 14px", background:"rgba(201,168,76,.06)", border:"1px solid rgba(201,168,76,.18)", borderRadius:9 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--text4)", marginBottom:6 }}>Your purpose statement</div>
          <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--warm)", lineHeight:1.6, marginBottom:10 }}>"{purposeFinal || "Not yet written"}"</div>
          <button onClick={() => setPeelingExpanded(true)} style={{ background:"none", border:"1px solid var(--border2)", borderRadius:20, color:"var(--text3)", cursor:"pointer", fontFamily:"var(--sans)", fontSize:11, padding:"5px 14px" }}>▾ Show peeling layers</button>
        </div>
      )}

      {/* EXPANDED VIEW */}
      {(!done || peelingExpanded) && (
        <>
          {layers.map((layer, i) => (
            <SoWhatLayer key={`${sessionKey}-${i}`} index={i} value={layer}
              onChange={v => updateLayer(i, v)}
              isLatest={i === latestIndex} onGoDeeper={goDeeper}
              onReachedBottom={reachedBottom} loading={loading} done={done} />
          ))}
          {loading && (
            <div style={{ display:"flex", alignItems:"center", gap:9, padding:"12px 0", color:"var(--warm)" }}>
              <span className="dot-l"><span /><span /><span /></span>
              <span style={{ fontFamily:"var(--sans)", fontSize:13 }}>Katherine is reading your layers...</span>
            </div>
          )}
        </>
      )}

      {purposeResult && (
        <div className="fade-in" style={{ marginTop:8 }}>
          {purposeResult._error && (
            <div style={{ padding:"8px 12px", background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", borderRadius:7, marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#ef4444", letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>API fallback fired</div>
              <div style={{ fontSize:11, color:"var(--text4)", fontFamily:"var(--sans)" }}>Error: {purposeResult._error}</div>
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, padding:"9px 14px", background:"rgba(201,168,76,.06)", border:"1px solid rgba(201,168,76,.14)", borderRadius:7 }}>
            <div style={{ fontFamily:"var(--sans)", fontSize:11, color:"var(--text3)" }}>
              You peeled <span style={{ color:"var(--warm)", fontWeight:700 }}>{layers.length} layer{layers.length !== 1 ? "s" : ""}</span> deep
              {layers.length >= 3 && <span style={{ color:"var(--warm)" }}> · Good work</span>}
              {sessions.length > 0 && <span style={{ color:"var(--text4)" }}> · Session {sessions.length}</span>}
            </div>
          </div>
          {purposeResult.deeper_note && (
            <div style={{ padding:"10px 14px", background:"rgba(201,168,76,.05)", border:"1px solid rgba(201,168,76,.15)", borderRadius:7, marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--warm)", marginBottom:4 }}>Since last time</div>
              <div style={{ fontFamily:"var(--serif)", fontSize:13, fontStyle:"italic", color:"var(--text2)", lineHeight:1.6 }}>{purposeResult.deeper_note}</div>
            </div>
          )}
          <ResultCard color="#34d399" label="What is working">{purposeResult.working}</ResultCard>
          {purposeResult.verbs && (
            <div style={{ padding:"11px 14px", background:"var(--bg3)", borderLeft:"2px solid var(--warm)", borderRadius:"0 7px 7px 0", marginBottom:7 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--warm)", marginBottom:7 }}>Your verbs</div>
              <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                {purposeResult.verbs.map((v, i) => <div key={i} style={{ padding:"4px 13px", background:"rgba(201,168,76,.1)", border:"1px solid rgba(201,168,76,.25)", borderRadius:20, fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--warm)" }}>{v}</div>)}
              </div>
            </div>
          )}
          <div style={{ padding:"14px 16px", background:"rgba(201,168,76,.05)", border:"1px solid rgba(201,168,76,.22)", borderRadius:9, marginBottom:7 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--warm)", marginBottom:8 }}>A purpose statement to consider</div>
            <div style={{ fontFamily:"var(--serif)", fontSize:18, fontStyle:"italic", fontWeight:400, color:"var(--text)", lineHeight:1.6, marginBottom:3 }}>"{purposeResult.draft || ""}"</div>
            <div style={{ fontSize:11, color:"var(--text4)" }}>Starting point -- not a verdict. Edit until it is yours.</div>
          </div>
          {purposeResult.refining_question && (
            <div style={{ padding:"11px 14px", background:"var(--bg2)", border:"1px solid var(--border2)", borderRadius:7, marginBottom:14 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--text4)", marginBottom:4 }}>A question to sit with</div>
              <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--text2)", lineHeight:1.6 }}>{purposeResult.refining_question}</div>
            </div>
          )}
          <OwnItCheck context="purpose feedback" storageKey="ownit_purpose" onComplete={r => {}} purposeFinal={purposeFinal} onFinalChange={onFinalChange} />
          <div style={{ marginTop:14 }}>
            <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:3 }}>Your final purpose statement</div>
            <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"var(--text3)", marginBottom:8, lineHeight:1.5 }}>In your own words. Short enough to say in the car. You should feel it.</div>
            <textarea value={purposeFinal} onChange={e => onFinalChange(e.target.value)} rows={2}
              placeholder="My purpose is to..."
              style={{ width:"100%", background:"var(--bg4)", border:"1px solid var(--border2)", borderRadius:10, color:"var(--warm)", fontFamily:"var(--serif)", fontSize:17, fontStyle:"italic", fontWeight:400, lineHeight:1.7, padding:"12px 14px", outline:"none", resize:"none" }}
              onFocus={e => { e.target.style.borderColor = "var(--warm)"; e.target.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--border2)"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <div style={{ marginTop:16, padding:"14px 16px", background:"var(--bg2)", border:"1px solid var(--border2)", borderRadius:9 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--text4)", marginBottom:7 }}>This is a living exercise</div>
            <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"var(--text3)", lineHeight:1.7, marginBottom:10 }}>Purpose is not always found in a single sitting. Return when you have fresh eyes -- days, weeks, or even months later. Your previous sessions are saved and Katherine will read them alongside your new answers, tracking how you are going deeper each time.</div>
            <button onClick={restartPeeling}
              style={{ background:"none", border:"1px solid var(--border2)", borderRadius:20, color:"var(--text2)", cursor:"pointer", fontFamily:"var(--sans)", fontSize:12, fontWeight:500, padding:"7px 16px" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--warm)"; e.currentTarget.style.color = "var(--warm)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text2)"; }}>
              ↩ Go deeper -- peel again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({ color, label, children, serif }) {
  return (
    <div style={{ padding:"9px 13px", background:"var(--bg3)", borderLeft:`2px solid ${color}`, borderRadius:"0 7px 7px 0", marginBottom:7 }}>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color, marginBottom:4 }}>{label}</div>
      <div style={serif ? { fontFamily:"var(--serif)", fontSize:16, fontStyle:"italic", fontWeight:300, color:"var(--text)", lineHeight:1.6 } : { fontSize:13, color:"var(--text)", lineHeight:1.55 }}>{children}</div>
    </div>
  );
}

function MirrorCard({ card, isOpen, onToggle, onGoto }) {
  return (
    <div onClick={() => onToggle(card.id)} style={{ background:isOpen ? card.colorMuted : "var(--bg3)", border:`1px solid ${isOpen ? card.colorBorder : "var(--border2)"}`, borderRadius:10, cursor:"pointer", transition:"background .22s, border-color .22s", overflow:"hidden", marginBottom:7 }}>
      <div style={{ padding:"11px 14px", display:"flex", alignItems:"center", gap:9 }}>
        <span style={{ fontSize:16, lineHeight:1, flexShrink:0 }}>{card.icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:500, color:isOpen ? card.color : "var(--text2)", transition:"color .2s", lineHeight:1.2 }}>{card.label}</div>
          <div style={{ fontFamily:"var(--sans)", fontSize:11, color:"var(--text4)", marginTop:2, lineHeight:1.3 }}>{card.tagline}</div>
        </div>
        <div style={{ fontSize:10, color:isOpen ? card.color : "var(--text4)", transition:"transform .2s, color .2s", transform:isOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink:0 }}>▾</div>
      </div>
      {isOpen && (
        <div className="fade-in" style={{ padding:"0 14px 14px" }}>
          <div style={{ height:1, background:card.colorBorder, marginBottom:12 }} />
          <div style={{ fontFamily:"var(--sans)", fontSize:13, color:"var(--text2)", lineHeight:1.75, marginBottom:12 }}>{card.description}</div>
          <div style={{ padding:"10px 13px", background:"var(--bg4)", borderLeft:`2px solid ${card.colorBorder}`, borderRadius:"0 7px 7px 0", marginBottom:12 }}>
            <div style={{ fontFamily:"var(--serif)", fontSize:13, fontStyle:"italic", color:"var(--text3)", lineHeight:1.7 }}>{card.katherine}</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onGoto(card.pair); }} style={{ background:"none", border:`1px solid ${card.colorBorder}`, borderRadius:20, color:card.color, cursor:"pointer", fontFamily:"var(--sans)", fontSize:11, fontWeight:500, padding:"5px 14px" }}>Go to this section →</button>
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
    <div style={{ padding:"17px 20px", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:11, marginBottom:24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:500, letterSpacing:2, textTransform:"uppercase", color:"var(--text4)", fontFamily:"var(--sans)" }}>The Mirror Structure</div>
        <div style={{ fontSize:11, color:"var(--text4)", fontFamily:"var(--sans)", fontStyle:"italic" }}>Tap any card to learn more</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 30px 1fr", gap:0, alignItems:"start" }}>
        <div>
          <div style={{ fontSize:10, fontWeight:500, letterSpacing:1.5, textTransform:"uppercase", color:"var(--warm)", fontFamily:"var(--sans)", marginBottom:9, paddingLeft:2 }}>Internal</div>
          {internal.map(card => <MirrorCard key={card.id} card={card} isOpen={expanded === card.id} onToggle={toggle} onGoto={goto} />)}
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", paddingTop:26 }}>
          <div style={{ width:1, height:24, background:"var(--border)", opacity:0.5 }} />
          <div style={{ fontSize:14, color:"var(--text4)", margin:"4px 0" }}>🪞</div>
          <div style={{ width:1, flex:1, background:"var(--border)", opacity:0.5 }} />
        </div>
        <div>
          <div style={{ fontSize:10, fontWeight:500, letterSpacing:1.5, textTransform:"uppercase", color:"var(--accent)", fontFamily:"var(--sans)", marginBottom:9, paddingLeft:2 }}>External</div>
          {external.map(card => <MirrorCard key={card.id} card={card} isOpen={expanded === card.id} onToggle={toggle} onGoto={goto} />)}
        </div>
      </div>
      <div style={{ marginTop:14, paddingTop:12, borderTop:"1px solid var(--border)", display:"flex", gap:8, flexWrap:"wrap" }}>
        {[{ left:"Purpose", right:"Direction", color:"#c9a84c" }, { left:"Identity", right:"Superpowers", color:"#c9a84c" }, { left:"Values", right:"Behaviors", color:"#34d399" }].map(p => (
          <div key={p.left} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:20 }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background:p.color, flexShrink:0 }} />
            <span style={{ fontFamily:"var(--sans)", fontSize:11, color:"var(--text4)" }}>{p.left}</span>
            <span style={{ fontFamily:"var(--sans)", fontSize:10, color:"var(--text4)" }}>🪞</span>
            <span style={{ fontFamily:"var(--sans)", fontSize:11, color:"var(--text4)" }}>{p.right}</span>
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
    saveTimer.current = setTimeout(async () => { await saveData(KEYS.map, next); setSavedAt(new Date()); }, 800);
  }, []);

  const set = useCallback((key, val) => {
    setMap(prev => { const next = { ...prev, [key]:val }; saveMap(next); return next; });
  }, [saveMap]);

  const setVoicePersist = (v) => { setVoice(v); saveData(KEYS.voice, v); };
  const goto = (s) => { setStep(s); saveData(KEYS.step, s); window.scrollTo({ top:0, behavior:"smooth" }); };
  const markDone = (s) => setDone(prev => { const n = [...new Set([...prev, s])]; saveData(KEYS.done, n); return n; });
  const runAI = async (key, prompt) => { setBusy(b => ({ ...b, [key]:true })); const r = await callStructured(prompt); setAi(a => ({ ...a, [key]:r })); setBusy(b => ({ ...b, [key]:false })); };

  const hdr = (
    <div style={{ borderBottom:"1px solid #1a1a16", padding:"11px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:"rgba(13,27,46,.96)", backdropFilter:"blur(12px)", zIndex:50 }}>
      <div style={{ display:"flex", alignItems:"center", gap:11 }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--warm)", animation:"pulse 3s ease-in-out infinite" }} />
        <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:700 }}>True Ownership</div>
        <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"var(--text4)" }}>· {name}</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5, opacity:savedAt ? 1 : 0, transition:"opacity .4s" }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:"#34d399" }} />
          <span style={{ fontFamily:"var(--sans)", fontSize:11, color:"#34d399" }}>{savedAt ? `Saved ${savedAt.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}` : ""}</span>
        </div>
        <div style={{ display:"flex", gap:5 }}>
          {["A1","A2","A3","A4","A5"].map((a, i) => (
            <div key={a} style={{ width:25, height:25, borderRadius:"50%", background:i === 0 ? "rgba(201,168,76,.1)" : "transparent", border:`1px solid ${i === 0 ? "rgba(232,149,109,.32)" : "var(--border)"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontFamily:"var(--sans)", fontSize:10, color:i === 0 ? "var(--warm)" : "var(--text4)", fontWeight:500 }}>{a}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const sidebar = (
    <div style={{ width:186, flexShrink:0, paddingRight:22, borderRight:"1px solid var(--border)" }}>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"var(--text2)", marginBottom:15, fontFamily:"var(--sans)" }}>All In It · A1</div>
      {STEPS.map(s => {
        const active = step === s.id, isDone = done.includes(s.id);
        return (
          <button key={s.id} className={`sidebar-btn${active ? " active" : ""}`} onClick={() => { if (s.id === "mirror1") set("mirror1_sub", "purpose"); goto(s.id); }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:isDone ? "#34d399" : active ? "var(--warm)" : "var(--border2)", flexShrink:0, transition:"background .3s" }} />
            <span style={{ fontSize:12, color:active ? "var(--warm)" : isDone ? "var(--text)" : "var(--text2)", fontWeight:active ? 500 : 400, lineHeight:1.3 }}>{s.label}</span>
          </button>
        );
      })}
      <div style={{ marginTop:18, paddingTop:14, borderTop:"1px solid var(--border)" }}>
        <div style={{ fontSize:10, fontWeight:500, letterSpacing:2, textTransform:"uppercase", color:"var(--text4)", marginBottom:7, fontFamily:"var(--sans)" }}>Voice</div>
        <VoiceDropdown voiceId={voice} onSelect={setVoicePersist} />
      </div>
    </div>
  );

  const wrapContent = (children) => (
    <>
      {hdr}
      <div style={{ display:"flex", gap:32, padding:"32px 28px 80px", maxWidth:980, margin:"0 auto" }}>
        {sidebar}
        <div style={{ flex:1, minWidth:0 }} className="fade-up">{children}</div>
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"var(--bg2)", borderTop:"1px solid var(--border2)", padding:"8px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", zIndex:40 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {savedAt ? (<><div style={{ width:6, height:6, borderRadius:"50%", background:"#34d399", flexShrink:0 }} /><span style={{ fontFamily:"var(--sans)", fontSize:11, color:"#34d399" }}>Auto-saved · {savedAt.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}</span></>) : (<><div style={{ width:6, height:6, borderRadius:"50%", background:"var(--text4)", flexShrink:0 }} /><span style={{ fontFamily:"var(--sans)", fontSize:11, color:"var(--text4)" }}>Auto-saving your answers as you type</span></>)}
        </div>
        <span style={{ fontFamily:"var(--sans)", fontSize:11, color:"var(--text4)" }}>Your progress is safe -- come back any time</span>
      </div>
    </>
  );

  if (step === "intro") return wrapContent(<>
    <div className="lbl" style={{ marginBottom:11 }}>A1 · All In It</div>

    <h2 style={{ fontFamily:"var(--serif)", fontSize:42, fontWeight:400, lineHeight:1.1, marginBottom:16, letterSpacing:"-0.5px" }}>
      The foundation.<br /><em>Know yourself.<br />Then build everything else.</em>
    </h2>

    <p style={{ fontSize:15, color:"var(--text2)", lineHeight:1.85, marginBottom:14, maxWidth:540 }}>
      {name}, before you can build a life that is truly yours -- you need to know who is building it. Not the role. Not the title. <em>You.</em>
    </p>

    <p style={{ fontSize:15, color:"var(--text2)", lineHeight:1.85, marginBottom:24, maxWidth:540 }}>
      A1 is your Map of Me. Your internal world -- purpose, identity, values -- reflected against your external world -- direction, superpowers, behaviours. We build both sides together, then hold them up to the mirror.
    </p>

    {/* Core principle */}
    <div style={{ padding:"18px 20px", background:"rgba(201,168,76,.07)", border:"1px solid rgba(201,168,76,.18)", borderRadius:11, marginBottom:22 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"var(--warm)", marginBottom:10, fontFamily:"var(--sans)" }}>Before we start -- one principle</div>
      <div style={{ fontFamily:"var(--serif)", fontSize:17, fontStyle:"italic", color:"var(--text)", lineHeight:1.85, marginBottom:10 }}>
        "You are the authority on your own life. This system is a mirror -- it reflects your own thinking back more clearly. It does not give you answers. You already have them."
      </div>
      <div style={{ fontSize:13, color:"var(--text3)", lineHeight:1.7 }}>
        The voices here -- Katherine, the coach, the challenger -- are a board of advisors. They help you think. But your voice leads. That is why in this programme, you write first. The board responds after.
      </div>
    </div>

    <VideoBlock title="All In It -- Why the Foundation Changes Everything" duration="~8 min"
      points={[
        "Why belonging to yourself comes before building anything else",
        "The mirror principle -- internal reflects external",
        "How the Map of Me works as a living document",
        "Why the order of the three mirror pairs is deliberate"
      ]} />

    <MirrorIntroCards goto={goto} />

    {/* What you will build */}
    <div style={{ padding:"16px 18px", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:11, marginBottom:28 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"var(--warm)", marginBottom:12, fontFamily:"var(--sans)" }}>What you build in A1</div>
      {[
        { icon:"🔥", label:"Purpose", desc:"Your internal why -- the reason you exist that has nothing to do with your role." },
        { icon:"⛰️", label:"Direction", desc:"Your BAG -- the 10–15 year summit your purpose is pointing toward." },
        { icon:"🦁", label:"Identity", desc:"Who you are at your best, anchored to animals and built from your own evidence." },
        { icon:"⚡", label:"Superpowers", desc:"How your identity shows up in the world -- and what happens when it goes too far." },
        { icon:"⚖️", label:"Values",  desc:"The standards you live by -- discovered through what makes your blood boil." },
        { icon:"🎯", label:"Behaviors", desc:"The proof that your values are real -- how you act when it costs you something." },
      ].map((item, i) => (
        <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:11, marginBottom: i < 5 ? 10 : 0 }}>
          <span style={{ fontSize:15, flexShrink:0, marginTop:1 }}>{item.icon}</span>
          <div>
            <span style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:600, color:"var(--text)" }}>{item.label} -- </span>
            <span style={{ fontSize:13, color:"var(--text3)", lineHeight:1.6 }}>{item.desc}</span>
          </div>
        </div>
      ))}
    </div>

    <button className="btn" onClick={() => { set("mirror1_sub", "purpose"); goto("mirror1"); }}>Start with Purpose →</button>
  </>);

  if (step === "mirror1") {
    const m1sub = map.mirror1_sub || "purpose";

    // Sub-step progress indicator
    const M1Progress = () => (
      <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:22 }}>
        {[
          { id:"purpose",   label:"Purpose",   icon:"🔥" },
          { id:"direction", label:"Direction", icon:"⛰️" },
          { id:"output",    label:"The Mirror",icon:"🪞" },
        ].map((s, i) => {
          const isActive = m1sub === s.id;
          const isDone = (m1sub === "direction" && s.id === "purpose") || (m1sub === "output" && s.id !== "output");
          return (
            <React.Fragment key={s.id}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background: isActive ? "var(--warm)" : isDone ? "rgba(52,211,153,.2)" : "var(--bg3)", border: isActive ? "none" : isDone ? "1px solid #34d399" : "1px solid var(--border2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, cursor: isDone ? "pointer" : "default", transition:"all .2s" }}
                  onClick={() => isDone && set("mirror1_sub", s.id)}>
                  {isDone ? <span style={{ fontSize:13, color:"#34d399" }}>✓</span> : <span>{s.icon}</span>}
                </div>
                <span style={{ fontSize:10, fontWeight: isActive ? 700 : 400, color: isActive ? "var(--warm)" : isDone ? "#34d399" : "var(--text4)", letterSpacing:0.5, textTransform:"uppercase", whiteSpace:"nowrap" }}>{s.label}</span>
              </div>
              {i < 2 && <div style={{ flex:1, height:1, background: isDone || (m1sub === "output" && s.id === "direction") ? "#34d399" : "var(--border2)", margin:"0 8px", marginBottom:18, transition:"background .3s" }} />}
            </React.Fragment>
          );
        })}
      </div>
    );

    // 1a -- PURPOSE
    if (m1sub === "purpose") return wrapContent(<>
      <div className="lbl" style={{ marginBottom:12 }}>Mirror 1 of 3 · Step 1</div>
      {M1Progress()}
      <h2 style={{ fontFamily:"var(--serif)", fontSize:34, fontWeight:400, lineHeight:1.2, marginBottom:7, letterSpacing:"-0.3px" }}>Purpose</h2>
      <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.7, marginBottom:20, maxWidth:540 }}>Your internal why -- independent of any role, business, or outcome. We find it by peeling.</p>
      <VideoBlock title="Purpose -- Your Internal Why" duration="~6 min"
        points={["Purpose is 100% internal -- not a role, not a business","The peeling process: asking 'so what's' until something true surfaces","Short enough to say in the car. True enough to get you out of bed on a hard day."]} />
      <div style={{ marginBottom:20, padding:"13px 16px", background:"rgba(201,168,76,.06)", border:"1px solid rgba(201,168,76,.18)", borderRadius:10 }}>
        <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--text2)", lineHeight:1.7 }}>"When I ask people what their purpose is, they usually say their kids or their business. That's not purpose -- those are attachments. Purpose needs to be 100% internal to you."</div>
      </div>
      <PurposePeelingInline
        layers={map.purpose_layers || [""]}
        onLayersChange={v => set("purpose_layers", v)}
        purposeFinal={map.purpose_final || ""}
        onFinalChange={v => set("purpose_final", v)}
        purposeResult={ai.purpose || null}
        onResult={r => { setAi(a => ({ ...a, purpose:r ? { ...r } : null })); if (r) { set("purpose_draft", r.draft || ""); } }}
        name={name} intake={intake}
        allSessions={map.purpose_sessions || []}
        onSessionSave={s => set("purpose_sessions", [...(map.purpose_sessions || []), s])}
      />
      <div style={{ marginBottom:22, marginTop:8 }}>
        <AIChat voiceId={voice} onVoiceChange={setVoicePersist} name={name} intake={intake} mapData={map}
          sectionLabel="purpose"
          placeholder="Ask Katherine about your purpose -- she can see everything you've written..." />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", paddingTop:18, borderTop:"1px solid var(--border)" }}>
        <button className="btn-g" onClick={() => goto("intro")}>← Introduction</button>
        <button className="btn" onClick={() => set("mirror1_sub", "direction")}>Direction → Your BAG</button>
      </div>
    </>);

    // 1b -- DIRECTION
    if (m1sub === "direction") return wrapContent(<>
      <div className="lbl" style={{ marginBottom:12 }}>Mirror 1 of 3 · Step 2</div>
      {M1Progress()}
      <h2 style={{ fontFamily:"var(--serif)", fontSize:34, fontWeight:400, lineHeight:1.2, marginBottom:7, letterSpacing:"-0.3px" }}>Direction</h2>
      <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.7, marginBottom:20, maxWidth:540 }}>Your BAG -- Big Ass Goal. The 10–15 year summit that your purpose points toward.</p>
      <VideoBlock title="Direction -- Your Big Ass Goal" duration="~6 min"
        points={["Your BAG: Time priorities, Wealth, and Growth","What you will see, hear, and feel in each life area","Dreamy and a bit scary -- 25% believable","How your BAG reflects your purpose"]} />
      <DirectionSection map={map} set={set} />
      <div style={{ marginBottom:22, marginTop:8 }}>
        <AIChat voiceId={voice} onVoiceChange={setVoicePersist} name={name} intake={intake} mapData={map}
          sectionLabel="direction and BAG"
          placeholder="Ask Katherine about your direction or life priorities -- she can see everything you've written..." />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", paddingTop:18, borderTop:"1px solid var(--border)" }}>
        <button className="btn-g" onClick={() => set("mirror1_sub", "purpose")}>← Purpose</button>
        <button className="btn" onClick={() => set("mirror1_sub", "output")}>See the Mirror →</button>
      </div>
    </>);

    // 1c -- OUTPUT / MIRROR
    return wrapContent(<>
      <div className="lbl" style={{ marginBottom:12 }}>Mirror 1 of 3 · The Mirror</div>
      {M1Progress()}
      <h2 style={{ fontFamily:"var(--serif)", fontSize:34, fontWeight:400, lineHeight:1.2, marginBottom:7, letterSpacing:"-0.3px" }}>Purpose <em style={{ color:"var(--text3)", fontSize:26 }}>reflects</em> Direction</h2>
      <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.7, marginBottom:24, maxWidth:540 }}>Your internal why, mirrored against your external summit. This is where alignment begins.</p>

      {/* THE MIRROR -- side by side output */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 40px 1fr", gap:0, marginBottom:28 }}>
        {/* PURPOSE side */}
        <div style={{ background:"var(--bg2)", border:"1px solid rgba(201,168,76,.25)", borderRadius:12, padding:"22px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
            <span style={{ fontSize:18 }}>🔥</span>
            <div>
              <div style={{ fontFamily:"var(--sans)", fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"var(--warm)" }}>Purpose · Internal</div>
              <div style={{ fontSize:11, color:"var(--text4)" }}>Your why -- independent of any role</div>
            </div>
          </div>
          <div style={{ fontFamily:"var(--serif)", fontSize:20, fontStyle:"italic", fontWeight:300, color:"var(--text)", lineHeight:1.7, marginBottom:14 }}>
            "{map.purpose_final || map.purpose_draft || "Not yet written"}"
          </div>
          {(map.purpose_sessions || []).length > 0 && (
            <div style={{ fontSize:11, color:"var(--text4)", fontStyle:"italic" }}>
              {(map.purpose_sessions || []).length} peeling session{(map.purpose_sessions || []).length > 1 ? "s" : ""} completed
            </div>
          )}
          <button onClick={() => set("mirror1_sub", "purpose")}
            style={{ marginTop:12, background:"none", border:"1px solid rgba(201,168,76,.3)", borderRadius:20, color:"var(--warm)", cursor:"pointer", fontFamily:"var(--sans)", fontSize:11, padding:"5px 13px" }}>
            ✎ Edit Purpose
          </button>
        </div>

        {/* Mirror divider */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}>
          <div style={{ flex:1, width:1, background:"var(--border)", opacity:0.4 }} />
          <div style={{ width:32, height:32, borderRadius:"50%", border:"1px solid var(--border2)", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>🪞</div>
          <div style={{ flex:1, width:1, background:"var(--border)", opacity:0.4 }} />
        </div>

        {/* DIRECTION side */}
        <div style={{ background:"var(--bg2)", border:"1px solid rgba(79,203,242,.2)", borderRadius:12, padding:"22px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
            <span style={{ fontSize:18 }}>⛰️</span>
            <div>
              <div style={{ fontFamily:"var(--sans)", fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"var(--accent)" }}>Direction · External</div>
              <div style={{ fontSize:11, color:"var(--text4)" }}>Your BAG{map.bag_year ? ` · ${map.bag_year}` : " · 10–15 year summit"}</div>
            </div>
          </div>

          {/* Time summary */}
          {map.time_summary && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--text4)", marginBottom:5 }}>Time</div>
              <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--warm)", lineHeight:1.6 }}>"{map.time_summary}"</div>
            </div>
          )}

          {/* Life goals list -- show goals if any, else chips */}
          {(map.life_areas || []).length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--text4)", marginBottom:8 }}>
                Life Goals {map.bag_year ? `· ${map.bag_year}` : ""}
              </div>
              {(map.life_areas || []).map((area, i) => (
                <div key={area.id} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:9 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0, marginTop:3 }}>
                    <div style={{ width:15, height:15, borderRadius:"50%", background:"var(--warm)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontSize:7, fontWeight:700, color:"#0d1b2e" }}>{i+1}</span>
                    </div>
                    <span style={{ fontSize:12 }}>{area.icon}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"var(--sans)", fontSize:10, fontWeight:700, color:"var(--warm)", letterSpacing:0.5, textTransform:"uppercase", marginBottom:2 }}>{area.label}</div>
                    {area.goal
                      ? <div style={{ fontFamily:"var(--serif)", fontSize:13, fontStyle:"italic", color:"var(--text2)", lineHeight:1.5 }}>{area.goal}</div>
                      : <div style={{ fontSize:11, color:"var(--text4)", fontStyle:"italic" }}>Goal not yet written</div>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Wealth summary */}
          {map.wealth_summary && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--text4)", marginBottom:5 }}>Wealth</div>
              <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"#34d399", lineHeight:1.6 }}>"{map.wealth_summary}"</div>
            </div>
          )}

          {/* Growth summary */}
          {(map.growth_summary || map.bag_growth) && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--text4)", marginBottom:5 }}>Growth</div>
              <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"#a78bfa", lineHeight:1.6 }}>"{map.growth_summary || map.bag_growth.slice(0, 120)}{!map.growth_summary && map.bag_growth.length > 120 ? "..." : ""}"</div>
            </div>
          )}

          <button onClick={() => set("mirror1_sub", "direction")}
            style={{ marginTop:4, background:"none", border:"1px solid rgba(79,203,242,.3)", borderRadius:20, color:"var(--accent)", cursor:"pointer", fontFamily:"var(--sans)", fontSize:11, padding:"5px 13px" }}>
            ✎ Edit Direction
          </button>
        </div>
      </div>

      {/* Katherine's read on alignment */}
      {!ai.mirror1_align && (map.purpose_final || map.purpose_draft) && (map.life_areas || []).length > 0 && (
        <div style={{ textAlign:"center", marginBottom:22 }}>
          <button className="btn" onClick={() => (() => {
              const prioritiesList = (map.life_areas || []).map((a,i) => (i+1) + ". " + a.label + (a.feel ? " (feel: " + a.feel.slice(0,60) + ")" : "")).join(", ");
              runAI("mirror1_align",
                "You are Katherine Breuss. " + name + " has completed their Purpose and Direction. Purpose: \"" + (map.purpose_final || map.purpose_draft) + "\". Life priorities ranked: " + prioritiesList + ". BAG year: " + (map.bag_year || "not set") + ". Growth: \"" + (map.bag_growth || "") + "\". In 2-3 sentences: what is the thread between their purpose and their priorities? Does the ranking reflect their purpose? Name one specific alignment you see and one potential tension. Respond ONLY with a JSON object, no preamble: {\"thread\":\"...\",\"alignment\":\"...\",\"tension\":\"...\"}"
              );
            })()}>
            {busy.mirror1_align ? <span className="dot-l"><span /><span /><span /></span> : "✦ See how Purpose and Direction align"}
          </button>
        </div>
      )}

      {ai.mirror1_align && (
        <div className="fade-up" style={{ padding:"18px 22px", background:"rgba(201,168,76,.06)", border:"1px solid rgba(201,168,76,.2)", borderRadius:11, marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:500, letterSpacing:2, textTransform:"uppercase", color:"var(--warm)", marginBottom:11 }}>Katherine's read on your mirror</div>
          <ResultCard color="var(--warm)" label="The thread">{ai.mirror1_align.thread}</ResultCard>
          <ResultCard color="#34d399" label="What aligns">{ai.mirror1_align.alignment}</ResultCard>
          <ResultCard color="#f59e0b" label="A tension to notice">{ai.mirror1_align.tension}</ResultCard>

          {/* Reflection -- replaces Own It Check */}
          <div style={{ marginTop:16, padding:"16px 18px", background:"var(--bg3)", border:"1px solid var(--border2)", borderRadius:10 }}>
            <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:4 }}>
              Based on this -- what, if anything, would you go back and change?
            </div>
            <div style={{ fontSize:12, color:"var(--text4)", marginBottom:10, lineHeight:1.5 }}>
              In your purpose, your priorities, or how they connect. You can go back and update either at any time.
            </div>
            <textarea rows={3} value={map.mirror1_reflection || ""} onChange={e => set("mirror1_reflection", e.target.value)}
              placeholder="What I'd go back and change or refine is..."
              className="to-field" style={{ fontSize:13, marginBottom:12 }} />
            <div style={{ display:"flex", gap:9 }}>
              <button
                onClick={() => { set("mirror1_reflection_done", true); }}
                style={{ flex:1, padding:"10px", background:"rgba(52,211,153,.1)", border:"1px solid #34d399", borderRadius:8, color:"#34d399", cursor:"pointer", fontFamily:"var(--sans)", fontSize:13, fontWeight:700, transition:"all .2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(52,211,153,.2)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(52,211,153,.1)"}>
                ✓ Yes -- this is it
              </button>
              <button
                onClick={() => { set("mirror1_sub", map.mirror1_reflection?.toLowerCase().includes("purpose") ? "purpose" : "direction"); }}
                style={{ flex:1, padding:"10px", background:"rgba(245,158,11,.08)", border:"1px solid rgba(245,158,11,.4)", borderRadius:8, color:"#f59e0b", cursor:"pointer", fontFamily:"var(--sans)", fontSize:13, fontWeight:500, transition:"all .2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,.18)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(245,158,11,.08)"}>
                Not yet -- go back and update
              </button>
            </div>
            {map.mirror1_reflection_done && (
              <div className="fade-in" style={{ marginTop:10, fontSize:12, color:"#34d399", display:"flex", alignItems:"center", gap:6 }}>
                <span>✓</span> Confirmed -- your mirror is set. You can still update anytime.
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginBottom:22 }}>
        <AIChat voiceId={voice} onVoiceChange={setVoicePersist} name={name} intake={intake} mapData={map}
          sectionLabel="purpose and direction"
          placeholder="Ask Katherine about how your purpose and direction connect..." />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", paddingTop:18, borderTop:"1px solid var(--border)" }}>
        <button className="btn-g" onClick={() => set("mirror1_sub", "direction")}>← Direction</button>
        <button className="btn" onClick={() => { markDone("mirror1"); goto("mirror2"); }}>Identity · Superpowers →</button>
      </div>
    </>);
  }

  if (step === "mirror2") {
    const m2sub = map.mirror2_sub || "qualities";
    const m2animals = map.animals || [];
    const validAnimals = m2animals.filter(a => a.name);

    // Sub-step progress
    const M2Progress = () => {
      const order = ["qualities","capabilities","pressure","lovedones"];
      const currentIdx = order.indexOf(m2sub);
      const steps = [
        { id:"qualities",    label:"Qualities", icon:"✦" },
        { id:"capabilities", label:"Capabilities", icon:"⚡" },
        { id:"pressure",     label:"Under Pressure", icon:"🔥" },
        { id:"lovedones",    label:"Loved Ones", icon:"🤝" },
      ];
      return (
        <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:22 }}>
          {steps.map((s, i) => {
            const isActive = m2sub === s.id;
            const isDone = order.indexOf(s.id) < currentIdx;
            return (
              <React.Fragment key={s.id}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ width:30, height:30, borderRadius:"50%", background: isActive ? "var(--warm)" : isDone ? "rgba(52,211,153,.2)" : "var(--bg3)", border: isActive ? "none" : isDone ? "1px solid #34d399" : "1px solid var(--border2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, cursor: isDone ? "pointer" : "default" }}
                    onClick={() => isDone && set("mirror2_sub", s.id)}>
                    {isDone ? <span style={{ fontSize:12, color:"#34d399" }}>✓</span> : <span>{s.icon}</span>}
                  </div>
                  <span style={{ fontSize:9, fontWeight: isActive ? 700 : 400, color: isActive ? "var(--warm)" : isDone ? "#34d399" : "var(--text4)", textTransform:"uppercase", whiteSpace:"nowrap", maxWidth:60, textAlign:"center", lineHeight:1.3 }}>{s.label}</span>
                </div>
                {i < 3 && <div style={{ flex:1, height:1, background: order.indexOf(steps[i+1].id) <= currentIdx ? "#34d399" : "var(--border2)", margin:"0 6px", marginBottom:22 }} />}
              </React.Fragment>
            );
          })}
        </div>
      );
    };

    // ── STEP 1: QUALITIES & ANIMALS ──────────────────────────────────────────
    if (m2sub === "qualities") {
      const wordCount = (map.identity_adjectives || "").split(",").map(w => w.trim()).filter(w => w.length > 0).length;
      const hasEnoughQualities = wordCount >= 5;
      const hasThreeAnimals = validAnimals.length >= 3;
      const aiUnlocked = hasEnoughQualities && hasThreeAnimals;

      return wrapContent(<>
        <div className="lbl" style={{ marginBottom:12 }}>Mirror 2 of 3 · Step 1</div>
        {M2Progress()}
        <h2 style={{ fontFamily:"var(--serif)", fontSize:34, fontWeight:400, lineHeight:1.2, marginBottom:7, letterSpacing:"-0.3px" }}>Identity</h2>
        <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.7, marginBottom:18, maxWidth:540 }}>
          Start with yourself. Write the qualities that describe you at your best -- unfiltered. Then choose 3 animals and sort your qualities to each one.
        </p>
        <VideoBlock title="Identity -- Who You Are at Your Best" duration="~6 min"
          points={["Why we anchor identity to animals -- images over word lists","The two-adjective rule -- specific to you, not the generic animal","How to sort your qualities without overthinking it","You write first. The board advises after."]} />

        <div style={{ padding:"13px 16px", background:"rgba(201,168,76,.06)", border:"1px solid rgba(201,168,76,.14)", borderRadius:9, marginBottom:20 }}>
          <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--text2)", lineHeight:1.7 }}>
            "You are the authority on your own identity. Write your qualities first. Then sort them to your animals. The AI can suggest -- you decide."
          </div>
        </div>

        {/* Brain dump */}
        <div style={{ marginBottom:22 }}>
          <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:4 }}>Step 1 -- Brain dump your qualities (aim for 15–30)</div>
          <div style={{ fontSize:12, color:"var(--text3)", marginBottom:10, lineHeight:1.6 }}>Every word that describes you at your best. Comma separated. Don't filter.</div>
          <TextArea value={map.identity_adjectives} onChange={v => set("identity_adjectives", v)} rows={4}
            placeholder="resilient, visionary, playful, intense, strategic, nurturing, decisive, creative, loyal, curious..." />
          <div style={{ fontSize:11, color:"var(--text4)", marginTop:5 }}>{wordCount} {wordCount === 1 ? "quality" : "qualities"}</div>
        </div>

        {/* 3 animals */}
        <div style={{ marginBottom:22 }}>
          <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:4 }}>Step 2 -- Choose exactly 3 animals</div>
          <div style={{ fontSize:12, color:"var(--text3)", marginBottom:12, lineHeight:1.6 }}>Which 3 animals best represent different sides of who you are? Trust your instinct.</div>
          {[0,1,2].map(i => {
            const a = m2animals[i] || { name:"", adjective1:"" };
            const setAnimal = (field, val) => {
              const next = m2animals.length >= 3 ? [...m2animals] : [...m2animals, ...Array(3 - m2animals.length).fill({ name:"", adjective1:"" })];
              next[i] = { ...next[i], [field]: val };
              set("animals", next);
            };
            return (
              <div key={i} style={{ background:"var(--bg3)", border:"1px solid var(--border2)", borderRadius:9, marginBottom:10, padding:"13px 15px" }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--warm)", marginBottom:9 }}>Animal {i+1}</div>
                <TextInput value={a.name || ""} onChange={v => setAnimal("name", v)}
                  placeholder={["e.g. Lion","e.g. Eagle","e.g. Dolphin"][i]} style={{ fontSize:13, marginBottom:8 }} />
                {a.name && (
                  <div style={{ marginTop:6 }}>
                    <div style={{ fontSize:11, color:"var(--text4)", marginBottom:6 }}>From your qualities -- which ones fit this animal? (comma separated)</div>
                    <TextInput value={a.adjective1 || ""} onChange={v => setAnimal("adjective1", v)}
                      placeholder="e.g. strategic, decisive, bold" style={{ fontSize:13 }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* AI sort suggestion */}
        <div style={{ padding:"14px 16px", background: aiUnlocked ? "var(--bg2)" : "var(--bg3)", border:"1px solid var(--border2)", borderRadius:9, marginBottom:22, opacity: aiUnlocked ? 1 : 0.6 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color: aiUnlocked ? "var(--warm)" : "var(--text4)", marginBottom:6 }}>
            ✦ Ask AI to suggest how to sort your qualities
          </div>
          <div style={{ fontSize:12, color:"var(--text3)", marginBottom:10, lineHeight:1.5 }}>
            {aiUnlocked
              ? "You have written your qualities and chosen your animals. The AI can now suggest how to sort them -- you decide whether it is right."
              : "Write at least 5 qualities and name all 3 animals first -- you lead, the board advises."
            }
          </div>
          {aiUnlocked && !ai.identity_sort && (
            <button onClick={() => {
              const animalNames = validAnimals.map(a => a.name).join(", ");
              runAI("identity_sort",
                `You are a mirror -- not an authority. ${name} has written these qualities: "${map.identity_adjectives || ""}" Their 3 animals are: ${animalNames}. Suggest how to sort the qualities to each animal -- 3 to 5 per animal. Explain briefly why each grouping makes sense. Respond ONLY with valid JSON, no other text: {"animal1":{"name":"...","qualities":["..."],"reason":"..."},"animal2":{"name":"...","qualities":["..."],"reason":"..."},"animal3":{"name":"...","qualities":["..."],"reason":"..."}}`
              );
            }}
              style={{ background:"none", border:"1px solid rgba(201,168,76,.3)", borderRadius:20, color:"var(--warm)", cursor:"pointer", fontFamily:"var(--sans)", fontSize:12, padding:"7px 16px" }}>
              {busy.identity_sort ? <span className="dot-l"><span /><span /><span /></span> : "✦ Get sorting suggestion"}
            </button>
          )}
          {ai.identity_sort && (
            <div className="fade-in">
              <div style={{ fontSize:11, color:"var(--text4)", fontStyle:"italic", marginBottom:10 }}>This is a suggestion -- adjust it until it feels right to you.</div>
              {["animal1","animal2","animal3"].map(k => ai.identity_sort[k] ? (
                <div key={k} style={{ marginBottom:10, padding:"10px 13px", background:"var(--bg3)", border:"1px solid var(--border2)", borderRadius:8 }}>
                  <div style={{ fontFamily:"var(--sans)", fontSize:12, fontWeight:700, color:"var(--warm)", marginBottom:5 }}>{ai.identity_sort[k].name}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:6 }}>
                    {(ai.identity_sort[k].qualities || []).map((q, qi) => (
                      <span key={qi} style={{ fontSize:11, padding:"2px 9px", background:"rgba(201,168,76,.1)", border:"1px solid rgba(201,168,76,.2)", borderRadius:12, color:"var(--warm)" }}>{q}</span>
                    ))}
                  </div>
                  <div style={{ fontSize:11, color:"var(--text4)", fontStyle:"italic" }}>{ai.identity_sort[k].reason}</div>
                </div>
              ) : null)}
            </div>
          )}
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", paddingTop:18, borderTop:"1px solid var(--border)" }}>
          <button className="btn-g" onClick={() => goto("mirror1")}>← Purpose · Direction</button>
          <button className="btn" onClick={() => set("mirror2_sub", "capabilities")}>Capabilities →</button>
        </div>
      </>);
    }

    // ── STEP 2: CAPABILITIES ─────────────────────────────────────────────────
    if (m2sub === "capabilities") return wrapContent(<>
      <div className="lbl" style={{ marginBottom:12 }}>Mirror 2 of 3 · Step 2</div>
      {M2Progress()}
      <h2 style={{ fontFamily:"var(--serif)", fontSize:34, fontWeight:400, lineHeight:1.2, marginBottom:7, letterSpacing:"-0.3px" }}>Capabilities</h2>
      <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.7, marginBottom:18, maxWidth:540 }}>
        For each animal, name 3–5 capabilities -- what your qualities actually enable in practice. Describe each one in your own words and give two real examples of when you lived it.
      </p>
      <div style={{ padding:"13px 16px", background:"rgba(201,168,76,.06)", border:"1px solid rgba(201,168,76,.14)", borderRadius:9, marginBottom:22 }}>
        <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--text2)", lineHeight:1.7 }}>
          "The examples are the most important part. They are your evidence -- your own proof that you are this person."
        </div>
      </div>
      {validAnimals.length === 0 && (
        <div style={{ padding:20, textAlign:"center", color:"var(--text4)", fontSize:13, fontStyle:"italic" }}>Go back to Step 1 and name your animals first.</div>
      )}
      {validAnimals.map((animal, animalIdx) => {
        const caps = animal.capabilities || [{ name:"", description:"", example1:"", example2:"", score:7 }];
        const filledCaps = caps.filter(c => c.name);
        const avgScore = filledCaps.length > 0
          ? Math.round(filledCaps.reduce((sum, c) => sum + (c.score || 5), 0) / filledCaps.length * 10) / 10
          : null;
        const updateCap = (ci, field, val) => {
          const nextAnimals = [...m2animals];
          const nextCaps = [...caps];
          nextCaps[ci] = { ...nextCaps[ci], [field]: val };
          nextAnimals[animalIdx] = { ...nextAnimals[animalIdx], capabilities: nextCaps };
          set("animals", nextAnimals);
        };
        const addCap = () => {
          const nextAnimals = [...m2animals];
          const nextCaps = [...caps, { name:"", description:"", example1:"", example2:"", score:7 }];
          nextAnimals[animalIdx] = { ...nextAnimals[animalIdx], capabilities: nextCaps };
          set("animals", nextAnimals);
        };
        return (
          <div key={animalIdx} style={{ marginBottom:26 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, padding:"10px 14px", background:"var(--bg2)", border:"1px solid rgba(201,168,76,.2)", borderRadius:9 }}>
              <span style={{ fontFamily:"var(--serif)", fontSize:16, fontStyle:"italic", color:"var(--warm)" }}>{animal.name}</span>
              {animal.adjective1 && <span style={{ fontSize:12, color:"var(--text3)" }}>· {animal.adjective1}</span>}
              {avgScore && <div style={{ marginLeft:"auto", fontSize:11, fontWeight:700, color: avgScore >= 7 ? "#34d399" : avgScore >= 5 ? "#f59e0b" : "#ef4444" }}>avg {avgScore}/10</div>}
            </div>
            {caps.map((cap, ci) => {
              const capScore = cap.score || 7;
              const capCol = capScore >= 7 ? "#34d399" : capScore >= 5 ? "#f59e0b" : "#ef4444";
              return (
                <div key={ci} style={{ marginBottom:14, padding:"14px 16px", background:"var(--bg3)", border:"1px solid var(--border2)", borderRadius:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--text4)", marginBottom:8 }}>Capability {ci+1}</div>
                  <div style={{ marginBottom:9 }}>
                    <label style={{ display:"block", fontSize:11, color:"var(--text3)", marginBottom:4, fontWeight:500 }}>Name this capability</label>
                    <TextInput value={cap.name || ""} onChange={v => updateCap(ci, "name", v)} placeholder="e.g. Strategic clarity under pressure" style={{ fontSize:13 }} />
                  </div>
                  {cap.name && (
                    <div>
                      <div style={{ marginBottom:9 }}>
                        <label style={{ display:"block", fontSize:11, color:"var(--text3)", marginBottom:4, fontWeight:500 }}>Describe it in your own words</label>
                        <TextArea value={cap.description || ""} onChange={v => updateCap(ci, "description", v)} rows={2} placeholder="What does this capability actually enable? How does it show up?" style={{ fontSize:13 }} />
                      </div>
                      <div style={{ marginBottom:9 }}>
                        <label style={{ display:"block", fontSize:11, color:"var(--text3)", marginBottom:4, fontWeight:500 }}>Example 1 -- a real time you demonstrated this</label>
                        <TextArea value={cap.example1 || ""} onChange={v => updateCap(ci, "example1", v)} rows={2} placeholder="A specific moment -- what happened, what did you do?" style={{ fontSize:13 }} />
                      </div>
                      <div style={{ marginBottom:12 }}>
                        <label style={{ display:"block", fontSize:11, color:"var(--text3)", marginBottom:4, fontWeight:500 }}>Example 2 -- another real moment</label>
                        <TextArea value={cap.example2 || ""} onChange={v => updateCap(ci, "example2", v)} rows={2} placeholder="Another specific moment -- different context if possible" style={{ fontSize:13 }} />
                      </div>
                      <div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                          <label style={{ fontSize:11, color:"var(--text3)", fontWeight:500 }}>How well are you living this right now?</label>
                          <div style={{ fontSize:14, fontWeight:300, fontFamily:"var(--serif)", color:capCol }}>{capScore}<span style={{ fontSize:10 }}>/10</span></div>
                        </div>
                        <input type="range" min={1} max={10} step={1} value={capScore}
                          onChange={e => updateCap(ci, "score", Number(e.target.value))}
                          style={{ accentColor:capCol, width:"100%" }} />
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--text4)", marginTop:2 }}>
                          <span style={{ color:"#ef4444" }}>1 · Detriment</span>
                          <span style={{ color:"#34d399" }}>10 · Superpower</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {caps.length < 5 && (
              <button onClick={addCap} style={{ width:"100%", padding:"9px", background:"transparent", border:"1.5px dashed var(--border2)", borderRadius:7, color:"var(--text4)", cursor:"pointer", fontFamily:"var(--sans)", fontSize:12, marginBottom:6 }}>
                + Add capability
              </button>
            )}
          </div>
        );
      })}
      <div style={{ display:"flex", justifyContent:"space-between", paddingTop:18, borderTop:"1px solid var(--border)" }}>
        <button className="btn-g" onClick={() => set("mirror2_sub", "qualities")}>← Qualities & Animals</button>
        <button className="btn" onClick={() => set("mirror2_sub", "pressure")}>Under Pressure →</button>
      </div>
    </>);

    // ── STEP 3: UNDER PRESSURE ───────────────────────────────────────────────
    if (m2sub === "pressure") return wrapContent(<>
      <div className="lbl" style={{ marginBottom:12 }}>Mirror 2 of 3 · Step 3</div>
      {M2Progress()}
      <h2 style={{ fontFamily:"var(--serif)", fontSize:34, fontWeight:400, lineHeight:1.2, marginBottom:7, letterSpacing:"-0.3px" }}>Under Pressure</h2>
      <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.7, marginBottom:18, maxWidth:540 }}>
        Character is not revealed when things are easy. For each animal -- how do you actually show up when things go wrong?
      </p>
      <div style={{ padding:"13px 16px", background:"rgba(239,68,68,.05)", border:"1px solid rgba(239,68,68,.15)", borderRadius:9, marginBottom:22 }}>
        <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--text2)", lineHeight:1.7 }}>
          "This is the most important question in this section. Not who you are when things are good -- who you are when things are hard. Be honest."
        </div>
      </div>
      {validAnimals.length === 0 && (
        <div style={{ padding:20, textAlign:"center", color:"var(--text4)", fontSize:13, fontStyle:"italic" }}>Go back to Step 1 and name your animals first.</div>
      )}
      {validAnimals.map((animal, i) => {
        const updatePressure = (val) => {
          const next = [...m2animals];
          next[i] = { ...next[i], under_pressure: val };
          set("animals", next);
        };
        return (
          <div key={i} style={{ marginBottom:20, padding:"16px 18px", background:"var(--bg3)", border:"1px solid var(--border2)", borderRadius:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <span style={{ fontFamily:"var(--serif)", fontSize:15, fontStyle:"italic", color:"var(--warm)" }}>{animal.name}</span>
              {animal.adjective1 && <span style={{ fontSize:11, color:"var(--text4)" }}>· {animal.adjective1}</span>}
            </div>
            <label style={{ display:"block", fontFamily:"var(--sans)", fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:6 }}>
              When this animal is under pressure -- how do you actually show up?
            </label>
            <div style={{ fontSize:12, color:"var(--text4)", marginBottom:8, lineHeight:1.5 }}>
              Not how you want to show up. What actually happens -- the patterns you know about yourself.
            </div>
            <TextArea value={animal.under_pressure || ""} onChange={updatePressure} rows={4}
              placeholder="When things go wrong and this animal takes over, I tend to..." style={{ fontSize:13 }} />
          </div>
        );
      })}
      <div style={{ display:"flex", justifyContent:"space-between", paddingTop:18, borderTop:"1px solid var(--border)" }}>
        <button className="btn-g" onClick={() => set("mirror2_sub", "capabilities")}>← Capabilities</button>
        <button className="btn" onClick={() => set("mirror2_sub", "lovedones")}>Loved Ones →</button>
      </div>
    </>);

    // ── STEP 4: LOVED ONES ───────────────────────────────────────────────────
    return wrapContent(<>
      <div className="lbl" style={{ marginBottom:12 }}>Mirror 2 of 3 · Step 4</div>
      {M2Progress()}
      <h2 style={{ fontFamily:"var(--serif)", fontSize:34, fontWeight:400, lineHeight:1.2, marginBottom:7, letterSpacing:"-0.3px" }}>The Loved Ones Check</h2>
      <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.7, marginBottom:18, maxWidth:540 }}>
        Share your animals, your capabilities and your under-pressure answers with someone who knows you well. Ask them what they see. Then record it here.
      </p>
      <div style={{ padding:"13px 16px", background:"rgba(167,139,250,.06)", border:"1px solid rgba(167,139,250,.18)", borderRadius:9, marginBottom:22 }}>
        <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--text2)", lineHeight:1.7 }}>
          "We are so reliant on others telling us who we are without exploring within ourselves first. You have now done that work. Does what you see match what those closest to you see?"
        </div>
      </div>
      <div style={{ marginBottom:18 }}>
        <label style={{ display:"block", fontFamily:"var(--sans)", fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:6 }}>Who did you share this with?</label>
        <TextInput value={map.lovedones_who || ""} onChange={v => set("lovedones_who", v)} placeholder="e.g. My partner, my closest friend..." style={{ fontSize:13, marginBottom:14 }} />
        <label style={{ display:"block", fontFamily:"var(--sans)", fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:6 }}>What did they say?</label>
        <TextArea value={map.lovedones_input || ""} onChange={v => set("lovedones_input", v)} rows={5}
          placeholder="Their words -- what did they see in you that confirmed or surprised you?" style={{ fontSize:13, marginBottom:14 }} />
        <label style={{ display:"block", fontFamily:"var(--sans)", fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:6 }}>What surprised you? What confirmed what you already knew?</label>
        <TextArea value={map.lovedones_reflection || ""} onChange={v => set("lovedones_reflection", v)} rows={4}
          placeholder="What I didn't expect was... / What confirmed what I already knew was..." style={{ fontSize:13 }} />
      </div>
      <div style={{ padding:"13px 16px", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:9, marginBottom:22 }}>
        <div style={{ fontSize:12, color:"var(--text3)", lineHeight:1.7 }}>
          The gap between what you wrote and what they saw -- that is data. Not judgment. You cannot choose your advocates wisely until you know yourself. You have done that work here.
        </div>
      </div>
      <div style={{ marginBottom:22 }}>
        <AIChat voiceId={voice} onVoiceChange={setVoicePersist} name={name} intake={intake} mapData={map}
          sectionLabel="identity and animals"
          placeholder="Ask Katherine about your identity -- she can see everything you've written..." />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", paddingTop:18, borderTop:"1px solid var(--border)" }}>
        <button className="btn-g" onClick={() => set("mirror2_sub", "pressure")}>← Under Pressure</button>
        <button className="btn" onClick={() => { markDone("mirror2"); goto("mirror3"); }}>Values · Behaviors →</button>
      </div>
    </>);
  }
  if (step === "mirror3") {
    const values = map.values || [{ name:"", irk:"", behaviors:"" }];
    const setVal = (i, field, val) => { const n = [...values]; n[i] = { ...n[i], [field]:val }; set("values", n); };
    return wrapContent(<>
      <div className="lbl" style={{ marginBottom:12 }}>Mirror 3 of 3</div>
      <h2 style={{ fontFamily:"var(--serif)", fontSize:34, fontWeight:400, lineHeight:1.2, marginBottom:7, letterSpacing:"-0.3px" }}>Values <em style={{ color:"var(--text3)", fontSize:26 }}>reflect</em> Behaviors</h2>
      <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.7, marginBottom:20, maxWidth:540 }}>What you stand for internally shows up as how you act. The fastest way to find your values is to find what makes your blood boil.</p>
      <VideoBlock title="Values & Behaviors -- The Irks Exercise" duration="~7 min" points={["What irritates you is your fastest path to your values","The peeling question: what are they stomping on?","How to rank values -- which is non-negotiable","Values as decision filters, not motivational posters"]} />
      <div className="mirror-grid">
        <div className="mirror-side">
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:13 }}>
            <span style={{ fontSize:17 }}>⚖️</span>
            <div><div style={{ fontFamily:"var(--sans)", fontSize:12, fontWeight:700, color:"var(--warm)" }}>VALUES · Internal</div><div style={{ fontSize:11, color:"var(--text3)" }}>What you stand for -- discovered through irks</div></div>
          </div>
          <div style={{ marginBottom:13 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:3 }}>What behaviors in others genuinely irk you?</label>
            <div style={{ fontSize:12, color:"var(--text3)", marginBottom:5, lineHeight:1.6 }}>No filter. Be specific -- not just "rudeness" but what kind?</div>
            <TextArea value={map.values_irks} onChange={v => set("values_irks", v)} rows={5} placeholder="People who don't follow through. When someone takes credit..." />
          </div>
          <div style={{ padding:"9px 13px", background:"rgba(201,168,76,.05)", border:"1px solid rgba(201,168,76,.1)", borderRadius:7, marginBottom:13 }}>
            <div style={{ fontSize:11, fontWeight:500, letterSpacing:1.5, textTransform:"uppercase", color:"var(--accent)", marginBottom:3 }}>Peeling question</div>
            <div style={{ fontSize:12, color:"var(--text3)", lineHeight:1.6 }}>"What are they stomping on? If they did the opposite, what would that tell me?" That's your value.</div>
          </div>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:9 }}>Your top 3 values</div>
          {values.map((val, i) => (
            <div key={i} style={{ background:"var(--bg3)", border:"1px solid var(--border2)", borderRadius:9, marginBottom:9, overflow:"hidden" }}>
              <div style={{ padding:"7px 13px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--warm)" }}>Value {i + 1}{i === 0 ? " · Most important" : ""}</span>
                {values.length > 1 && <button onClick={() => set("values", values.filter((_, idx) => idx !== i))} style={{ background:"none", border:"none", color:"var(--text4)", cursor:"pointer", fontSize:15, padding:0 }}>×</button>}
              </div>
              <div style={{ padding:"11px 13px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:7 }}>
                  <div>
                    <label style={{ display:"block", fontSize:11, color:"var(--text3)", marginBottom:3, fontWeight:500 }}>Value name</label>
                    <TextInput value={val.name} onChange={v => setVal(i, "name", v)} placeholder="e.g. Integrity" style={{ fontSize:13, fontWeight:500, padding:"7px 9px" }} />
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:11, color:"var(--text3)", marginBottom:3, fontWeight:500 }}>The irk that revealed it</label>
                    <TextInput value={val.irk} onChange={v => setVal(i, "irk", v)} placeholder="People who..." style={{ fontSize:13, padding:"7px 9px" }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {values.length < 3 && <button onClick={() => set("values", [...values, { name:"", irk:"", behaviors:"" }])} style={{ width:"100%", padding:"9px", background:"transparent", border:"1.5px dashed var(--border2)", borderRadius:7, color:"var(--text4)", cursor:"pointer", fontFamily:"var(--sans)", fontSize:12 }}>+ Add value</button>}
        </div>
        <div className="mirror-div">
          <div className="mirror-line" />
          <div style={{ width:30, height:30, borderRadius:"50%", border:"1px solid var(--border2)", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"var(--text4)", flexShrink:0 }}>🪞</div>
          <div className="mirror-line" />
        </div>
        <div className="mirror-side">
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:13 }}>
            <span style={{ fontSize:17 }}>🎯</span>
            <div><div style={{ fontFamily:"var(--sans)", fontSize:12, fontWeight:700, color:"var(--accent)" }}>BEHAVIORS · External</div><div style={{ fontSize:11, color:"var(--text3)" }}>How your values show up in action</div></div>
          </div>
          <div style={{ padding:"9px 13px", background:"rgba(201,168,76,.05)", border:"1px solid rgba(201,168,76,.1)", borderRadius:7, marginBottom:13 }}>
            <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"var(--text2)", lineHeight:1.7 }}>"Values aren't what you believe -- they're how you behave when it costs you something."</div>
          </div>
          {values.filter(v => v.name).map((val, i) => (
            <div key={i} style={{ marginBottom:13 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                <div style={{ fontSize:13, fontWeight:500, color:"var(--warm)" }}>{val.name}</div>
                <button onClick={() => runAI(`val${i}`, `You are Katherine Breuss. ${name}'s value is "${val.name}". Irk: "${val.irk}". Give a precise personal definition (not dictionary), 3 observable behaviors proving someone lives this value, and 1 violation signal. JSON: {"definition":"...","behaviors":["...","...","..."],"violation":"..."}`)}
                  style={{ background:"none", border:"1px solid var(--border2)", borderRadius:5, color:"var(--text4)", cursor:"pointer", fontFamily:"var(--sans)", fontSize:10, padding:"4px 9px", flexShrink:0 }}>
                  {busy[`val${i}`] ? <span className="dot-l"><span /><span /><span /></span> : "✦ Define"}
                </button>
              </div>
              <div style={{ marginBottom:7 }}>
                <label style={{ display:"block", fontSize:11, color:"var(--text3)", marginBottom:3, fontWeight:500 }}>How does this show up in behavior?</label>
                <TextArea value={val.behaviors} onChange={v => setVal(i, "behaviors", v)} rows={2} placeholder="They speak up even when uncomfortable..." style={{ fontSize:12 }} />
              </div>
              {ai[`val${i}`] && (
                <div className="fade-in">
                  <ResultCard color="var(--warm)" label="What it really means">{ai[`val${i}`].definition}</ResultCard>
                  {ai[`val${i}`].behaviors && (
                    <div style={{ padding:"9px 13px", background:"var(--bg3)", borderLeft:"2px solid #34d399", borderRadius:"0 7px 7px 0", marginBottom:7 }}>
                      <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"#34d399", marginBottom:4 }}>Behaviors that prove it</div>
                      {ai[`val${i}`].behaviors.map((b, bi) => <div key={bi} style={{ fontSize:13, color:"var(--text)", marginBottom:3, paddingLeft:10, position:"relative" }}><span style={{ position:"absolute", left:0, color:"#34d399" }}>·</span>{b}</div>)}
                    </div>
                  )}
                  {ai[`val${i}`].violation && <ResultCard color="#ef4444" label="Violation signal">{ai[`val${i}`].violation}</ResultCard>}
                  <OwnItCheck context={`${val.name} value definition`} storageKey={`ownit_val${i}`} onComplete={(r) => set(`ownit_val${i}`, r)} />
                </div>
              )}
            </div>
          ))}
          {values.filter(v => v.name).length === 0 && <div style={{ padding:"18px", textAlign:"center", color:"var(--text4)", fontSize:13, fontStyle:"italic" }}>Add your values on the left -- behavioral definitions appear here.</div>}
          <div style={{ marginTop:12 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:5 }}>Overall behaviors note</label>
            <TextArea value={map.behaviors_note} onChange={v => set("behaviors_note", v)} rows={3} placeholder="When I look at my values and how I'm actually behaving, I notice..." />
          </div>
        </div>
      </div>
      <div style={{ marginBottom:22 }}>
        <AIChat voiceId={voice} onVoiceChange={setVoicePersist} name={name} intake={intake} mapData={map} sectionLabel="values or behaviors" placeholder="Ask Katherine about your values or behaviors -- she can see everything you've written..." />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", paddingTop:18, borderTop:"1px solid var(--border)" }}>
        <button className="btn-g" onClick={() => goto("mirror2")}>← Identity · Superpowers</button>
        <button className="btn" onClick={() => { markDone("mirror3"); goto("align"); }}>Alignment Check →</button>
      </div>
    </>);
  }

  if (step === "align") {
    // Helper: slider with score display
    const AlignSlider = ({ storeKey, label, desc, color="#c9a84c", indent=false }) => {
      const val = map[storeKey] !== undefined ? map[storeKey] : 5;
      const col = val >= 7 ? "#34d399" : val >= 4 ? "#f59e0b" : "#ef4444";
      return (
        <div style={{ marginBottom:10, paddingLeft: indent ? 14 : 0, borderLeft: indent ? "2px solid var(--border2)" : "none" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
            <div>
              <div style={{ fontSize: indent ? 12 : 13, fontWeight: indent ? 400 : 600, color: indent ? "var(--text2)" : "var(--text)" }}>{label}</div>
              {desc && <div style={{ fontSize:11, color:"var(--text4)", marginTop:1 }}>{desc}</div>}
            </div>
            <div style={{ fontFamily:"var(--serif)", fontSize: indent ? 16 : 19, fontWeight:300, color:col, flexShrink:0, marginLeft:12 }}>{val}<span style={{ fontSize:10 }}>/10</span></div>
          </div>
          <input type="range" min={0} max={10} step={1} value={val}
            onChange={e => set(storeKey, Number(e.target.value))}
            style={{ accentColor:col, width:"100%" }} />
          <div style={{ fontSize:10, color:"var(--text4)", marginTop:2 }}>
            {val >= 8 ? "Strong alignment" : val >= 5 ? "Partial -- something in the way" : "Low -- needs attention"}
          </div>
        </div>
      );
    };

    // Helper: section avg badge
    const AvgBadge = ({ scores }) => {
      const valid = scores.filter(s => s !== undefined && s !== null);
      if (valid.length === 0) return null;
      const avg = Math.round(valid.reduce((a,b) => a+b, 0) / valid.length * 10) / 10;
      const col = avg >= 7 ? "#34d399" : avg >= 4 ? "#f59e0b" : "#ef4444";
      return (
        <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", background:`rgba(${avg >= 7 ? "52,211,153" : avg >= 4 ? "245,158,11" : "239,68,68"},.1)`, border:`1px solid ${col}`, borderRadius:20, marginLeft:10 }}>
          <span style={{ fontSize:11, fontWeight:700, color:col }}>avg {avg}/10</span>
        </div>
      );
    };

    // Compute all sub-scores for the final Katherine prompt
    const lifeAreas = map.life_areas || [];
    const animals = (map.animals || []).filter(a => a.name);
    const values = (map.values || []).filter(v => v.name);

    const dirScores = [
      ...lifeAreas.map((a,i) => map[`align_time_${a.id}`]),
      ...["bag_retirement","bag_assets","bag_cashflow","bag_other"].map(k => map[`align_wealth_${k}`]),
      map.align_growth,
    ].filter(s => s !== undefined);

    const spScores = animals.flatMap((a,i) => {
      const caps = ai[`ani${i}`];
      if (!caps) return [];
      return ["superpower","scenario"].map(k => map[`align_sp_${i}_${k}`]).filter(s => s !== undefined);
    });

    const bhvScores = values.flatMap((v,i) => {
      const def = ai[`val${i}`];
      if (!def || !def.behaviors) return [];
      return def.behaviors.map((_,bi) => map[`align_bh_${i}_${bi}`]).filter(s => s !== undefined);
    });

    const avg = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length*10)/10 : null;

    return wrapContent(<>
      <div className="lbl" style={{ marginBottom:12 }}>Alignment Check</div>
      <h2 style={{ fontFamily:"var(--serif)", fontSize:34, fontWeight:400, lineHeight:1.2, marginBottom:7, letterSpacing:"-0.3px" }}>The gap between<br /><em>who you are and how you're showing up.</em></h2>
      <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.8, marginBottom:26, maxWidth:520 }}>Rate each area honestly -- not where you want to be, where you are right now.</p>

      {/* ── DIRECTION ── */}
      <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:11, marginBottom:14, overflow:"hidden" }}>
        <div style={{ padding:"13px 18px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:9 }}>
          <span style={{ fontSize:17 }}>⛰️</span>
          <span style={{ fontFamily:"var(--sans)", fontSize:14, fontWeight:700, color:"var(--text)" }}>Direction</span>
          <AvgBadge scores={dirScores} />
          <span style={{ fontSize:11, color:"var(--text4)", marginLeft:2 }}>· external mirror</span>
        </div>
        <div style={{ padding:"14px 18px" }}>

          {/* Time priorities */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"#c9a84c", marginBottom:10 }}>⏳ Time Priorities</div>
            {lifeAreas.length === 0 && (
              <div style={{ fontSize:12, color:"var(--text4)", fontStyle:"italic", padding:"8px 0" }}>No life priorities set yet -- go back to Direction to add them.</div>
            )}
            {lifeAreas.map((area, i) => (
              <AlignSlider key={area.id}
                storeKey={`align_time_${area.id}`}
                label={`${area.icon} ${area.label}`}
                desc={`How aligned is how you actually spend time with ${area.label}?`}
                indent={true} />
            ))}
          </div>

          {/* Wealth */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"#34d399", marginBottom:10 }}>💰 Wealth</div>
            {[
              { key:"align_wealth_bag_retirement", label:"Retirement", desc:"How on track are you for your retirement vision?" },
              { key:"align_wealth_bag_assets",     label:"Assets",     desc:"How close are you to your assets target?" },
              { key:"align_wealth_bag_cashflow",   label:"Cash flow & Salary", desc:"Does your income match your BAG?" },
              { key:"align_wealth_bag_other",      label:"Other",      desc:"Other wealth goals -- how aligned?" },
            ].map(f => <AlignSlider key={f.key} storeKey={f.key} label={f.label} desc={f.desc} indent={true} />)}
          </div>

          {/* Growth */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"#a78bfa", marginBottom:10 }}>🌱 Growth</div>
            <AlignSlider storeKey="align_growth" label="Personal growth" desc="How aligned is who you are today with who you described in Growth?" indent={true} />
          </div>

        </div>
      </div>

      {/* ── SUPERPOWERS ── */}
      <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:11, marginBottom:14, overflow:"hidden" }}>
        <div style={{ padding:"13px 18px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:9 }}>
          <span style={{ fontSize:17 }}>⚡</span>
          <span style={{ fontFamily:"var(--sans)", fontSize:14, fontWeight:700, color:"var(--text)" }}>Superpowers</span>
          <AvgBadge scores={spScores} />
          <span style={{ fontSize:11, color:"var(--text4)", marginLeft:2 }}>· how well you're living your animal capabilities</span>
        </div>
        <div style={{ padding:"14px 18px" }}>
          {animals.length === 0 && (
            <div style={{ fontSize:12, color:"var(--text4)", fontStyle:"italic" }}>No animals set yet -- go back to Identity to add them.</div>
          )}
          {animals.map((a, i) => {
            const caps = ai[`ani${i}`];
            const animalScores = caps
              ? ["superpower","scenario"].map(k => map[`align_sp_${i}_${k}`]).filter(s => s !== undefined)
              : [];
            return (
              <div key={i} style={{ marginBottom:18 }}>
                {/* Animal header */}
                <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:8, padding:"8px 12px", background:"var(--bg3)", borderRadius:8 }}>
                  <div style={{ fontFamily:"var(--serif)", fontSize:15, fontStyle:"italic", color:"var(--warm)" }}>"{a.adjective1}{a.adjective2 ? `, ${a.adjective2}` : ""} {a.name}"</div>
                  <AvgBadge scores={animalScores} />
                </div>
                {!caps ? (
                  <div style={{ fontSize:12, color:"var(--text4)", fontStyle:"italic", paddingLeft:14, borderLeft:"2px solid var(--border2)" }}>
                    Go to Identity · Superpowers and click "✦ Unlock" for this animal first.
                  </div>
                ) : (
                  <div>
                    <AlignSlider
                      storeKey={`align_sp_${i}_superpower`}
                      label="Superpower"
                      desc={caps.superpower}
                      indent={true} />
                    <AlignSlider
                      storeKey={`align_sp_${i}_scenario`}
                      label="Calling it when needed"
                      desc={caps.scenario}
                      indent={true} />
                    {caps.detriment && (
                      <div style={{ padding:"8px 12px", background:"rgba(239,68,68,.05)", border:"1px solid rgba(239,68,68,.15)", borderRadius:7, marginTop:4, marginLeft:14 }}>
                        <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:"#ef4444", marginBottom:2 }}>Watch -- dark side</div>
                        <div style={{ fontSize:11, color:"var(--text3)" }}>{caps.detriment}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BEHAVIORS / VALUES ── */}
      <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:11, marginBottom:22, overflow:"hidden" }}>
        <div style={{ padding:"13px 18px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:9 }}>
          <span style={{ fontSize:17 }}>🎯</span>
          <span style={{ fontFamily:"var(--sans)", fontSize:14, fontWeight:700, color:"var(--text)" }}>Behaviors</span>
          <AvgBadge scores={bhvScores} />
          <span style={{ fontSize:11, color:"var(--text4)", marginLeft:2 }}>· how consistently you're living your values</span>
        </div>
        <div style={{ padding:"14px 18px" }}>
          {values.length === 0 && (
            <div style={{ fontSize:12, color:"var(--text4)", fontStyle:"italic" }}>No values set yet -- go back to Values · Behaviors to add them.</div>
          )}
          {values.map((val, i) => {
            const def = ai[`val${i}`];
            const valScores = def?.behaviors
              ? def.behaviors.map((_,bi) => map[`align_bh_${i}_${bi}`]).filter(s => s !== undefined)
              : [];
            return (
              <div key={i} style={{ marginBottom:18 }}>
                {/* Value header */}
                <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:8, padding:"8px 12px", background:"var(--bg3)", borderRadius:8 }}>
                  <div style={{ fontFamily:"var(--sans)", fontSize:14, fontWeight:700, color:"#34d399" }}>{val.name}</div>
                  {val.irk && <div style={{ fontSize:11, color:"var(--text4)", fontStyle:"italic" }}>revealed by: "{val.irk.slice(0,50)}{val.irk.length > 50 ? "..." : ""}"</div>}
                  <AvgBadge scores={valScores} />
                </div>
                {!def ? (
                  <div style={{ fontSize:12, color:"var(--text4)", fontStyle:"italic", paddingLeft:14, borderLeft:"2px solid var(--border2)" }}>
                    Go to Values · Behaviors and click "✦ Define" for this value first.
                  </div>
                ) : (
                  <div>
                    {def.definition && (
                      <div style={{ fontSize:12, color:"var(--text3)", fontStyle:"italic", paddingLeft:14, marginBottom:8, borderLeft:"2px solid rgba(52,211,153,.3)" }}>{def.definition}</div>
                    )}
                    {(def.behaviors || []).map((b, bi) => (
                      <AlignSlider key={bi}
                        storeKey={`align_bh_${i}_${bi}`}
                        label={b}
                        desc="How consistently are you doing this?"
                        indent={true} />
                    ))}
                    {def.violation && (
                      <div style={{ padding:"8px 12px", background:"rgba(239,68,68,.05)", border:"1px solid rgba(239,68,68,.15)", borderRadius:7, marginTop:4, marginLeft:14 }}>
                        <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:"#ef4444", marginBottom:2 }}>Violation signal</div>
                        <div style={{ fontSize:11, color:"var(--text3)" }}>{def.violation}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Katherine's key misalignment read */}
      {!ai.align && (
        <button className="btn" style={{ marginBottom:22 }}
          onClick={() => {
            const dAvg = avg(dirScores);
            const sAvg = avg(spScores);
            const bAvg = avg(bhvScores);
            const areaSummary = lifeAreas.map((a,i) => `${a.label}: ${map[`align_time_${a.id}`] ?? "?"}/10`).join(", ");
            const animalSummary = animals.map((a,i) => {
              const sc = ["superpower","scenario"].map(k => map[`align_sp_${i}_${k}`]).filter(s=>s!==undefined);
              return `${a.adjective1} ${a.name}: ${avg(sc) ?? "not rated"}/10`;
            }).join(", ");
            const valueSummary = values.map((v,i) => {
              const def = ai[`val${i}`];
              const sc = def?.behaviors ? def.behaviors.map((_,bi) => map[`align_bh_${i}_${bi}`]).filter(s=>s!==undefined) : [];
              return `${v.name}: ${avg(sc) ?? "not rated"}/10`;
            }).join(", ");
            runAI("align",
              `You are Katherine Breuss. ${name} has completed a detailed alignment check. Direction avg: ${dAvg}/10 (${areaSummary}). Superpowers avg: ${sAvg}/10 (${animalSummary}). Behaviors avg: ${bAvg}/10 (${valueSummary}). Purpose: "${map.purpose_final || map.purpose_draft}". Identify the single most important misalignment -- be specific and name the exact area or behavior. Why does it matter? What to focus on first. How it connects to A2. JSON: {"key_misalignment":"...","why_it_matters":"...","focus_first":"...","bridge_to_a2":"..."}`
            );
          }}>
          {busy.align ? <span className="dot-l"><span /><span /><span /></span> : "See My Key Misalignment →"}
        </button>
      )}
      {ai.align && (
        <div className="fade-up" style={{ padding:"18px 22px", background:"rgba(245,158,11,.06)", border:"1px solid rgba(245,158,11,.2)", borderRadius:11, marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:500, letterSpacing:2, textTransform:"uppercase", color:"#f59e0b", marginBottom:11 }}>Your key misalignment to focus on</div>
          <div style={{ fontFamily:"var(--serif)", fontSize:17, fontWeight:400, color:"var(--text)", lineHeight:1.7, marginBottom:9 }}>{ai.align.key_misalignment}</div>
          <div style={{ fontSize:13, color:"var(--text2)", lineHeight:1.7, marginBottom:11 }}>{ai.align.why_it_matters}</div>
          <div style={{ padding:"9px 13px", background:"rgba(201,168,76,.06)", border:"1px solid rgba(201,168,76,.12)", borderRadius:7, marginBottom:9 }}>
            <div style={{ fontSize:11, fontWeight:500, letterSpacing:1.5, textTransform:"uppercase", color:"var(--accent)", marginBottom:3 }}>Focus first on</div>
            <div style={{ fontSize:13, color:"var(--text)", lineHeight:1.6 }}>{ai.align.focus_first}</div>
          </div>
          {ai.align.bridge_to_a2 && <div style={{ fontSize:12, color:"var(--text3)", fontStyle:"italic", lineHeight:1.6, marginBottom:4 }}>Carries into A2: {ai.align.bridge_to_a2}</div>}
          <OwnItCheck context="alignment check result" storageKey="ownit_align" onComplete={(r) => set("ownit_align", r)} />
        </div>
      )}
      <div style={{ marginBottom:22 }}>
        <AIChat voiceId={voice} onVoiceChange={setVoicePersist} name={name} intake={intake} mapData={map} sectionLabel="alignment" placeholder="Ask Katherine about your alignment -- she can see everything you've written..." />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", paddingTop:18, borderTop:"1px solid var(--border)" }}>
        <button className="btn-g" onClick={() => goto("mirror3")}>← Values · Behaviors</button>
        <button className="btn" onClick={() => { markDone("align"); goto("map"); }}>Build My Map of Me →</button>
      </div>
    </>);
  }

  if (step === "map") {
    const validA = (map.animals || []).filter(a => a.name);
    const validV = (map.values || []).filter(v => v.name);
    const validAreas = (map.life_areas || []);
    return wrapContent(<>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div className="lbl" style={{ marginBottom:9, display:"block" }}>Complete · A1</div>
        <h2 style={{ fontFamily:"var(--serif)", fontSize:44, fontWeight:400, lineHeight:1.1, letterSpacing:"-0.5px", marginBottom:9 }}>{name}'s<br /><em>Map of Me.</em></h2>
        <p style={{ fontSize:14, color:"var(--text3)", maxWidth:400, margin:"0 auto", lineHeight:1.7 }}>Your living reference. Come back when making decisions, feeling stuck, or checking alignment.</p>
      </div>
      {!ai.close && (
        <div style={{ textAlign:"center", marginBottom:22 }}>
          <button className="btn" onClick={() => runAI("close", `You are Katherine Breuss. Completed Map of Me with ${name}. Purpose: "${map.purpose_final || map.purpose_draft}". Animals: ${validA.map(a => `${a.adjective1} ${a.name}`).join(", ")}. Values: ${validV.map(v => v.name).join(", ")}. Life priorities: ${validAreas.map((a,i) => `${i+1}. ${a.label}`).join(", ")}. BAG Growth: "${map.bag_growth}". Brought here: "${intake.q1}". Write 3-4 sentence closing note referencing something SPECIFIC. One identity line -- who they are and what they're building. JSON: {"note":"...","identity_line":"..."}`)}>
            {busy.close ? <span className="dot-l"><span /><span /><span /></span> : "✦ Get Katherine's Closing Note"}
          </button>
        </div>
      )}
      {ai.close && (
        <div className="fade-up" style={{ padding:"22px 26px", background:"linear-gradient(135deg,rgba(201,168,76,.08),rgba(79,203,242,.04))", border:"1px solid rgba(201,168,76,.22)", borderRadius:13, marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"var(--warm)", marginBottom:9 }}>Katherine's Note</div>
          <div style={{ fontFamily:"var(--serif)", fontSize:16, lineHeight:1.9, color:"var(--text)", marginBottom:13, fontWeight:300 }}>{ai.close.note}</div>
          <div style={{ fontFamily:"var(--serif)", fontSize:19, fontStyle:"italic", fontWeight:400, color:"var(--accent)", lineHeight:1.5 }}>"{ai.close.identity_line}"</div>
          <OwnItCheck context="Map of Me closing summary" storageKey="ownit_mapclose" onComplete={(r) => set("ownit_mapclose", r)} />
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 36px 1fr", gap:0, marginBottom:18 }}>
        <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:11, padding:"17px 19px" }}>
          <div style={{ fontSize:10, fontWeight:500, letterSpacing:2, textTransform:"uppercase", color:"var(--warm)", marginBottom:13 }}>Internal</div>
          <div style={{ marginBottom:13 }}>
            <div style={{ fontSize:11, color:"var(--text3)", marginBottom:3 }}>PURPOSE</div>
            <div style={{ fontFamily:"var(--serif)", fontSize:15, fontStyle:"italic", fontWeight:300, color:"var(--text)", lineHeight:1.6 }}>"{map.purpose_final || map.purpose_draft || "Not completed"}"</div>
          </div>
          {validA.length > 0 && (
            <div style={{ marginBottom:13 }}>
              <div style={{ fontSize:11, color:"var(--text3)", marginBottom:5 }}>IDENTITY</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {validA.map((a, i) => <div key={i} style={{ padding:"4px 9px", background:"var(--bg3)", border:"1px solid var(--border2)", borderRadius:14, fontSize:11 }}><span style={{ fontStyle:"italic", color:"var(--accent)" }}>{a.adjective1}{a.adjective2 ? `, ${a.adjective2}` : ""}</span><span style={{ color:"var(--text)", fontWeight:500 }}> {a.name}</span></div>)}
              </div>
            </div>
          )}
          {validV.length > 0 && (
            <div>
              <div style={{ fontSize:11, color:"var(--text3)", marginBottom:5 }}>VALUES</div>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {validV.map((val, i) => <div key={i} style={{ padding:"4px 9px", background:"rgba(52,211,153,.07)", border:"1px solid rgba(52,211,153,.18)", borderRadius:14, fontSize:11, color:"#34d399" }}>{i + 1}. {val.name}</div>)}
              </div>
            </div>
          )}
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
          <div style={{ flex:1, width:1, background:"var(--border)" }} />
          <div style={{ fontSize:18 }}>🪞</div>
          <div style={{ flex:1, width:1, background:"var(--border)" }} />
        </div>
        <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:11, padding:"17px 19px" }}>
          <div style={{ fontSize:10, fontWeight:500, letterSpacing:2, textTransform:"uppercase", color:"var(--accent)", marginBottom:13 }}>External</div>
          {validAreas.length > 0 && (
            <div style={{ marginBottom:13 }}>
              <div style={{ fontSize:11, color:"var(--text3)", marginBottom:5 }}>DIRECTION · LIFE PRIORITIES {map.bag_year ? `· ${map.bag_year}` : ""}</div>
              {validAreas.map((a, i) => (
                <div key={a.id} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4, padding:"4px 8px", background:"var(--bg3)", borderLeft:"2px solid rgba(201,168,76,.4)", borderRadius:"0 5px 5px 0" }}>
                  <span style={{ fontSize:10, fontWeight:700, color:"var(--warm)", minWidth:14 }}>{i+1}</span>
                  <span style={{ fontSize:11 }}>{a.icon}</span>
                  <span style={{ fontSize:12, color:"var(--text2)" }}>{a.label}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginBottom:13 }}>
            <div style={{ fontSize:11, color:"var(--text3)", marginBottom:5 }}>SUPERPOWERS</div>
            {validA.map((a, i) => ai[`ani${i}`] && (
              <div key={i} style={{ marginBottom:5, padding:"5px 9px", background:"var(--bg3)", borderLeft:"2px solid #34d399", borderRadius:"0 5px 5px 0" }}>
                <div style={{ fontSize:10, fontStyle:"italic", color:"var(--text3)", marginBottom:1 }}>{a.adjective1} {a.name}</div>
                <div style={{ fontSize:12, color:"var(--text)", lineHeight:1.4 }}>{ai[`ani${i}`].superpower}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:11, color:"var(--text3)", marginBottom:5 }}>ALIGNMENT</div>
            {[{ l:"Direction", k:"align_direction" }, { l:"Superpowers", k:"align_superpowers" }, { l:"Behaviors", k:"align_behaviors" }].map(s => {
              const val = map[s.k] || 5;
              const col = val >= 7 ? "#34d399" : val >= 4 ? "#f59e0b" : "#ef4444";
              return <div key={s.k} style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}><span style={{ color:"var(--text3)" }}>{s.l}</span><span style={{ color:col, fontWeight:500 }}>{val}/10</span></div>;
            })}
          </div>
        </div>
      </div>
      <div style={{ padding:"14px 17px", background:"rgba(167,139,250,.05)", border:"1px solid rgba(167,139,250,.17)", borderRadius:11, marginBottom:18 }}>
        <div style={{ fontSize:11, fontWeight:500, letterSpacing:2, textTransform:"uppercase", color:"#a78bfa", marginBottom:9 }}>Ask Your Map</div>
        <AIChat voiceId={voice} onVoiceChange={setVoicePersist} name={name} intake={intake} mapData={map} sectionLabel="your map" placeholder="Ask anything -- a decision, which animal you need, whether something aligns..." />
      </div>
      <div style={{ padding:"17px 20px", background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:11, marginBottom:22 }}>
        <div style={{ fontSize:11, fontWeight:500, letterSpacing:1.5, textTransform:"uppercase", color:"var(--warm)", marginBottom:11 }}>How to use this map</div>
        {["Repeat your purpose statement until it becomes the thing that gets you out of bed on hard days.", "When a decision feels unclear -- check your values first. If it violates your top value, the answer is no.", "When you feel drained -- which animal needs to come up more right now?", "Come back here. Update it. It grows with you. The AI always reflects from your current map."].map((t, i) => (
          <div key={i} style={{ display:"flex", gap:9, marginBottom:7, alignItems:"flex-start" }}>
            <span style={{ color:"var(--warm)", flexShrink:0, marginTop:1 }}>·</span>
            <div style={{ fontSize:13, color:"var(--text2)", lineHeight:1.6 }}>{t}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:18, borderTop:"1px solid var(--border)" }}>
        <button className="btn-g" onClick={() => goto("align")}>← Alignment Check</button>
        <button className="btn" onClick={() => { markDone("map"); onDone(map); }}>Continue to A2 -- Align With It →</button>
      </div>
    </>);
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
  if (phase === "loading") return <div style={{ minHeight:"100vh", background:"#0d1b2e", display:"flex", alignItems:"center", justifyContent:"center" }}><style>{CSS}</style><div style={{ fontFamily:"var(--sans)", fontSize:12, color:"#3d3d38", letterSpacing:2, animation:"pulse 1.5s infinite" }}>Loading…</div></div>;
  return (
    <div style={{ background:"#0d1b2e", minHeight:"100vh" }}>
      <style>{CSS}</style>
      {phase === "intake" && <Intake onDone={doneIntake} />}
      {phase === "a1" && intake && <A1 intake={intake} onDone={doneA1} />}
      {phase === "done" && (
        <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:36 }}>
          <div className="fade-up" style={{ maxWidth:480, textAlign:"center" }}>
            <div style={{ fontSize:38, marginBottom:14 }}>⛰️</div>
            <div className="lbl" style={{ marginBottom:11, display:"block" }}>A1 Complete</div>
            <h2 style={{ fontFamily:"var(--serif)", fontSize:38, fontWeight:300, lineHeight:1.2, marginBottom:13, letterSpacing:"-0.5px" }}>Your Map of Me is built.<br /><em>Now we align it with your life.</em></h2>
            <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"#7a766e", lineHeight:1.8, marginBottom:26 }}>A2 -- Align With It -- asks: does how you actually live match who you now know yourself to be?</p>
            <button className="btn" style={{ opacity:.5, cursor:"not-allowed", marginBottom:11 }}>A2 Align With It -- Coming Soon</button>
            <div><button className="btn-g" onClick={() => setPhase("a1")}>← Return to Map of Me</button></div>
          </div>
        </div>
      )}
    </div>
  );
}