=== LIFE_AREA_PRESETS (195-210) ===
`;

// ─── DIRECTION: Life Areas ────────────────────────────────────────────────────

const LIFE_AREA_PRESETS = [
  { id:"family",    label:"Family",       icon:"👨‍👩‍👧‍👦", hint:"Where will your kids be? What does your relationship with your partner look like? What do you do together?" },
  { id:"love",      label:"Love",         icon:"💛", hint:"Your romantic life -- partner, intimacy, the relationship you choose to build. What does love look like at your best?" },
  { id:"business",  label:"Business",     icon:"🏔️",  hint:"What are you building? Who are you leading? How much are you working? What is your role?" },
  { id:"health",    label:"Health",       icon:"⚡",  hint:"How do you feel physically? What are you doing regularly? What have you let go of?" },
  { id:"friends",   label:"Friends",      icon:"🤝",  hint:"Who is still in your life? How often do you connect? What do you do together?" },
  { id:"spiritual", label:"Spirituality", icon:"🌿",  hint:"How do you connect to something bigger? What practices ground you?" },
  { id:"community", label:"Community",    icon:"🌍",  hint:"What are you contributing to? Who do you serve beyond your immediate circle?" },
  { id:"adventure", label:"Adventure",    icon:"🧭",  hint:"Where have you been? What have you experienced? What risks have you taken?" },
];

function LifeAreaSelector({ selected, onToggle, onAddCustom }) {

=== LifeAreaSelector (210-302) ===
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
        {selected.filter(a => !LIFE_AREA_PRESETS.some(p => p.id === a.id)).map(area => {
          const rank = selected.findIndex(a2 => a2.id === area.id) + 1;
          return (
            <button key={area.id}
              onClick={() => onToggle(area)}
              style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"7px 13px",
                background:"rgba(201,168,76,.15)",
                border:"1px solid rgba(201,168,76,.5)",
                borderRadius:20, cursor:"pointer",
                fontFamily:"var(--sans)", fontSize:12,
                color:"var(--warm)", transition:"all .18s"
              }}>
              <span style={{fontSize:13}}>{area.icon || "✦"}</span>
              {area.label}
              <span style={{fontSize:10,fontWeight:700,background:"var(--warm)",color:"#0d1b2e",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {rank}
              </span>
              <span style={{fontSize:13, color:"var(--text4)", marginLeft:2}}>×</span>
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

=== LifeAreaCard (302-420) ===
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

  const addCustom = (area) => {
    if (areas.length >= 5) return;
    if (areas.some(a => a.id === area.id)) return;
    set("life_areas", [...areas, { see:"", hear:"", feel:"", ...area }]);
  };
  const removeArea = (id) => set("life_areas", areas.filter(a => a.id !== id));

  const moveArea = (index, dir) => {
    const next = [...areas];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    set("life_areas", next);

=== Wealth rendering block 505-630 ===
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

=== EMPTY_MAP first 40 lines 1180-1220 ===
const EMPTY_MAP = {
  purpose_layers: [""],
  purpose_draft: "", purpose_final: "",
  bag_year: "",
  life_areas: [],
  bag_retirement: "", bag_assets: "", bag_cashflow: "", bag_other: "",
  time_summary: "", wealth_summary: "", growth_summary: "",
  mirror1_reflection: "", mirror1_reflection_done: false,
  mirror2_sub: "qualities",
  mirror3_sub: "values",
  lovedones_who: "", lovedones_input: "", lovedones_reflection: "",
  bag_growth: "",
  identity_adjectives: "",
  identity_chips: [],
  animals: [{ name:"", adj1:"", adj2:"", adjective1:"", adjective2:"", alignment:5 }],
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
