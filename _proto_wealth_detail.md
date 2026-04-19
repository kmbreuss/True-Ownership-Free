=== WEALTH_CARDS definition (lines 34-60) ===
  { id: "adventure", label: "Adventure", icon: "🧭" },
  { id: "wellbeing", label: "Wellbeing", icon: "✦" },
];

const WEALTH_CARDS = [
  { id: "retirement", label: "Retirement", icon: "🏖" },
  { id: "assets", label: "Assets", icon: "🏛" },
  { id: "cashflow", label: "Cashflow", icon: "💸" },
  { id: "investments", label: "Investments", icon: "📈" },
  { id: "properties", label: "Properties", icon: "🏠" },
  { id: "business-equity", label: "Business equity", icon: "🏢" },
];

// ─── Shared app state (simulated global store) ──────────────────────
// In real app this would be Redux/context; here it's lifted to root
function useAppState() {
  const [state, setState] = useState({
    bag: {
      timeOverallSentence: "I spend my days building things that matter, present with the people I love, with space for adventure and stillness.",
      timeOverallConfirmed: false,
      timePicked: ["family", "business", "health", "adventure"],
      timeItems: {
        family: { text: "Weekly dinners with my grown kids where they actually want to be. Real conversation, not checking in.", goal: "" },
        business: { text: "My team runs beautifully without me being the bottleneck. I coach, strategize, write.", goal: "" },
        health: { text: "My body feels strong, vibrant, decades younger than my age. I move daily and sleep deeply.", goal: "" },
        adventure: { text: "At least two real adventures a year — somewhere foreign, somewhere new.", goal: "" },
      },
      timeSeeHearFeel: {
        see: "Morning light in a home by the ocean. Kids' faces at dinner, laughing. A calendar with space in it.",
        hear: "My team presenting plans I didn't write. My partner saying 'you seem lighter than ever.' Waves.",
        feel: "Expansive. Clear. Like my work finally matches my life.",

=== Wealth rendering block (lines 880-950) ===
          sourceText={Object.values(one.timeItems).map(i => i.goal || i.text).filter(Boolean).join(" ")}
          existingConfirmed={one.timeOverallConfirmed ? one.timeOverallSentence : null}
          onConfirm={(text) => set1yr({ timeOverallSentence: text, timeOverallConfirmed: true })}
          bottomTitle="In one sentence, my time in 2027 is..."
        />
      </CollapsibleSegment>

      {/* WEALTH */}
      <CollapsibleSegment
        icon="💰" title="Wealth" color={T.wealthColor}
        confirmed={one.wealthOverallConfirmed}
        confirmedSummary={one.wealthOverallConfirmed ? one.wealthOverallSentence : null}
      >
        {bag.wealthPicked.map(id => {
          const card = WEALTH_CARDS.find(c => c.id === id);
          if (!card) return null;
          const item = one.wealthItems[id] || { text: "", goal: "" };
          return (
            <SimpleItemCard
              key={id} icon={card.icon} label={card.label} color={T.wealthColor}
              text={item.text} goal={item.goal}
              promptText="What does this look like in 2027?"
              onTextChange={v => updateItem("wealth", id, "text", v)}
              onGoalChange={v => updateItem("wealth", id, "goal", v)}
            />
          );
        })}
        <SummaryGenerator
          color={T.wealthColor}
          label="Wealth"
          sourceText={Object.values(one.wealthItems).map(i => i.goal || i.text).filter(Boolean).join(" ")}
          existingConfirmed={one.wealthOverallConfirmed ? one.wealthOverallSentence : null}
          onConfirm={(text) => set1yr({ wealthOverallSentence: text, wealthOverallConfirmed: true })}
          bottomTitle="In one sentence, my wealth in 2027 is..."
        />
      </CollapsibleSegment>

      {/* GROWTH */}
      <CollapsibleSegment
        icon="🌱" title="Growth" color={T.growthColor}
        confirmed={one.growthConfirmed}
        confirmedSummary={one.growthConfirmed ? one.growthSentence : null}
      >
        <div style={{
          fontSize: 13, color: T.text2, lineHeight: 1.6, marginBottom: 14,
          padding: "10px 14px",
          background: "rgba(255,255,255,.03)",
          borderLeft: `2px solid ${T.growthColor}`, borderRadius: 4,
        }}>
          Your 1-year Growth pulls from your Identity &amp; Values alignment below.
          Accept the suggestions, edit them, or remove them and add your own.
        </div>

        <GrowthSuggestionsV2
          accepted={one.growthSuggestionsAccepted}
          setAccepted={v => set1yr({ growthSuggestionsAccepted: v })}
          otherText={one.otherGrowth}
          setOtherText={v => set1yr({ otherGrowth: v })}
          isMobile={isMobile}
        />

        <div style={{
          marginBottom: 12, padding: "12px 14px",
          background: "rgba(255,255,255,.03)",
          border: `1px solid ${T.border2}`,
          borderLeft: `3px solid ${T.growthColor}`,
          borderRadius: 6,
        }}>
          <div style={{
            fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase",
            color: T.growthColor, fontWeight: 600, marginBottom: 6,

=== Wealth item card component if any ===
