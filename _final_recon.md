=== Wealth block 620-680 ===
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
              { key:"bag_retirement", label:"Retirement",         icon:"🏡", placeholder:"What does retirement look like -- when, how, what does life feel like when you stop working by necessity?", editable:false },
              { key:"bag_assets",     label:"Assets",             icon:"🏛️",  placeholder:"Property, investments, business equity -- what have you built and what does it generate?", editable:false },
              { key:"bag_cashflow",   label:"Cash flow & Salary", icon:"📈", placeholder:"What does your annual income or cash flow look like? What level creates genuine freedom?", editable:false },
              { key:"bag_other",      label: map.bag_other_label || "Other", icon:"✦", placeholder:"Legacy, giving, philanthropy, financial milestones...", editable:true },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:13 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                  <span style={{ fontSize:13 }}>{f.icon}</span>
                  {f.editable ? (
                    <input type="text" value={map.bag_other_label || ""} placeholder="Other"
                      onChange={e => set("bag_other_label", e.target.value)}
                      style={{ fontSize:12, fontWeight:500, color:"#34d399", background:"transparent", border:"1px dashed rgba(52,211,153,.35)", borderRadius:4, padding:"1px 6px", outline:"none", fontFamily:"var(--sans)", width:140 }} />
                  ) : (
                    <label style={{ fontSize:12, fontWeight:500, color:"#34d399" }}>{f.label}</label>
                  )}
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

=== EMPTY_MAP 1180-1210 ===
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


=== End of LIFE_AREA_PRESETS (200-215) ===
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
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const selectedIds = selected.map(a => a.id);
  const atMax = selected.length >= 5;


=== End of LifeAreaCard (415-425) ===
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
