=== IIFE ZONE (1090-1098) ===
      <div style={{ padding:"14px 18px", background:"rgba(201,168,76,.06)", border:"1px solid rgba(201,168,76,.14)", borderRadius:9, marginBottom:28 }}>
        <div style={{ fontFamily:"var(--serif)", fontSize:16, fontStyle:"italic", color:"var(--text)", lineHeight:1.8 }}>
          "This system is one of your board of advisors -- a mirror that reflects your own thinking back more clearly. It does not think for you. You are the authority on your own life."
        </div>
      </div>

      <label style={{ display:"block", fontFamily:"var(--sans)", fontSize:13, color:"var(--text3)", marginBottom:7 }}>What's your first name?</label>
      <TextInput value={name} onChange={setName} placeholder="Your name..." style={{ fontSize:13, fontWeight:500, padding:"15px 19px", marginBottom:20 }} />
      <button className="btn" disabled={!name.trim()} onClick={() => setStep(1)}>Begin →</button>

=== LIFE_AREA_PRESETS location ===
199:const LIFE_AREA_PRESETS = [
231:        {LIFE_AREA_PRESETS.map(area => {
257:        {selected.filter(a => !LIFE_AREA_PRESETS.some(p => p.id === a.id)).map(area => {

=== LifeAreaSelector function signature ===
210:function LifeAreaSelector({ selected, onToggle, onAddCustom }) {

=== LifeAreaCard function signature ===
302:function LifeAreaCard({ area, rank, total, onMoveUp, onMoveDown, onRemove, onChange }) {

=== EMPTY_MAP location ===
1180:const EMPTY_MAP = {
1703:  const [map, setMap] = useState(EMPTY_MAP);
1714:      if (m) setMap({ ...EMPTY_MAP, ...m });

=== Wealth/WEALTH related lines ===
80:  if (mapData?.bag_retirement) lines.push(`Wealth - Retirement: "${mapData.bag_retirement}"`);
81:  if (mapData?.bag_assets) lines.push(`Wealth - Assets: "${mapData.bag_assets}"`);
82:  if (mapData?.bag_cashflow) lines.push(`Wealth - Cash flow: "${mapData.bag_cashflow}"`);
83:  if (mapData?.bag_other) lines.push(`Wealth - Other: "${mapData.bag_other}"`);
84:  if (mapData?.wealth_summary) lines.push(`Wealth summary: "${mapData.wealth_summary}"`);
428:  const [wealthOpen, setWealthOpen] = useState(false);
473:      {(map.time_summary || areas.some(a=>a.goal) || map.wealth_summary || map.growth_summary) && (
511:            {/* WEALTH */}
512:            {map.wealth_summary && (
515:                  <span>💰</span> Wealth
517:                <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"#34d399", lineHeight:1.6, marginBottom: (map.bag_retirement || map.bag_assets || map.bag_cashflow || map.bag_other) ? 8 : 0 }}>
518:                  {map.wealth_summary}
521:                  { key:"bag_retirement", icon:"🏡", label:"Retirement" },
522:                  { key:"bag_assets",     icon:"🏛️",  label:"Assets" },
523:                  { key:"bag_cashflow",   icon:"📈", label:"Cash flow" },
524:                  { key:"bag_other",      icon:"✦",  label:"Other" },
623:      {/* WEALTH -- collapsible */}
625:        <div style={{ padding:"4px 14px 0", borderBottom: wealthOpen ? "1px solid var(--border)" : "none" }}>
626:          <SectionHeader icon="💰" label="Wealth" color="#34d399"
627:            isOpen={wealthOpen} onToggle={() => setWealthOpen(o => !o)}
628:            summary={map.wealth_summary} summaryColor="#34d399" />
630:        {wealthOpen && (
638:              <textarea rows={2} value={map.wealth_summary || ""} onChange={e => set("wealth_summary", e.target.value)}
643:              { key:"bag_retirement", label:"Retirement",         icon:"🏡", placeholder:"What does retirement look like -- when, how, what does life feel like when you stop working by necessity?", editable:false },
644:              { key:"bag_assets",     label:"Assets",             icon:"🏛️",  placeholder:"Property, investments, business equity -- what have you built and what does it generate?", editable:false },
645:              { key:"bag_cashflow",   label:"Cash flow & Salary", icon:"📈", placeholder:"What does your annual income or cash flow look like? What level creates genuine freedom?", editable:false },
646:              { key:"bag_other",      label: map.bag_other_label || "Other", icon:"✦", placeholder:"Legacy, giving, philanthropy, financial milestones...", editable:true },
652:                    <input type="text" value={map.bag_other_label || ""} placeholder="Other"
653:                      onChange={e => set("bag_other_label", e.target.value)}
1185:  bag_retirement: "", bag_assets: "", bag_cashflow: "", bag_other: "",
1186:  time_summary: "", wealth_summary: "", growth_summary: "",
1206:  { side:"external", id:"direction",  icon:"⛰️", label:"Direction",  color:"#c9a84c", colorMuted:"rgba(79,203,242,0.08)",  colorBorder:"rgba(79,203,242,0.2)",  pair:"mirror1", tagline:"Your Big Ass Goal -- the summit",       description:"Your BAG -- Big Ass Goal -- is the 10–15 year dream across Time (how you live your days), Wealth (financial freedom), and Growth (who you're becoming as a person). It should feel dreamy and a bit scary. About 25% believable. If you can see exactly how to get there, it's not big enough.", katherine:"\"Start at the top of the mountain. We work backwards from there. Most people set goals from where they are. We set them from where we want to be.\"" },
2116:        points={["Your BAG: Time priorities, Wealth, and Growth","What you will see, hear, and feel in each life area","Dreamy and a bit scary -- 25% believable","How your BAG reflects your purpose"]} />
2212:          {/* Wealth summary */}
2213:          {map.wealth_summary && (
2215:              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--text4)", marginBottom:5 }}>Wealth</div>
2216:              <div style={{ fontFamily:"var(--serif)", fontSize:14, fontStyle:"italic", color:"#34d399", lineHeight:1.6 }}>"{map.wealth_summary}"</div>
2306:      const wealthItems = [
2310:        { key:"other",      label: map.bag_other_label || "Other", editable:true, labelKey:"bag_other_label" },
2320:        { id:"wealth", label:"Wealth", icon:"$",  sentence: map.wealth_summary || "", emptySentence:"Add your wealth vision in Direction first." },

=== SectionHeader ===
431:  const SectionHeader = ({ icon, label, color, isOpen, onToggle, summary, summaryColor }) => (
564:          <SectionHeader icon="⏳" label="Time -- Your Life Priorities" color="#c9a84c"
626:          <SectionHeader icon="💰" label="Wealth" color="#34d399"
670:          <SectionHeader icon="🌱" label="Growth" color="#a78bfa"
