# Prototype Wealth Reference


===== WEALTH_CARDS =====

const WEALTH_CARDS = [
  { id: "retirement", label: "Retirement", icon: "🏖" },
  { id: "assets", label: "Assets", icon: "🏛" },
  { id: "cashflow", label: "Cashflow", icon: "💸" },
  { id: "investments", label: "Investments", icon: "📈" },
  { id: "properties", label: "Properties", icon: "🏠" },
  { id: "business-equity", label: "Business equity", icon: "🏢" },
];


===== CollapsibleSegment component =====

function CollapsibleSegment({ icon, title, color, confirmed, confirmedSummary, children }) {
  // Track user's explicit open/close action separately from auto-behavior
  // userExpanded: null = no explicit action (follow auto-rule), true = force open, false = force closed
  const [userState, setUserState] = useState(null);

  // Auto-rule: open unless confirmed, then closed
  const autoOpen = !confirmed;
  const isOpen = userState === null ? autoOpen : userState;

  const toggle = () => {
    // Clicking toggles based on current visible state
    setUserState(!isOpen);
  };

  return (
    <div style={{
      marginTop: 36, marginBottom: 14,
      background: `${color}10`,
      borderRadius: 8, borderLeft: `4px solid ${color}`,
      overflow: "hidden",
      transition: "all .2s ease",
    }}>
      {/* Clickable header */}
      <div onClick={toggle} style={{
        padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        cursor: "pointer",
        gap: 10,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          flex: 1, minWidth: 0,
        }}>
          <div style={{
            fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.text,
            flexShrink: 0,
          }}>{icon} {title}</div>
          {/* Status pill */}
          <div style={{
            fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase",
            fontWeight: 600, padding: "2px 8px", borderRadius: 10,
            background: confirmed ? `${T.green}20` : `${color}15`,
            color: confirmed ? T.green : color,
            border: `1px solid ${confirmed ? T.green : color}40`,
            flexShrink: 0,
          }}>{confirmed ? "✓ Confirmed" : "In progress"}</div>
        </div>
        <div style={{
          fontSize: 18, color: T.text3,
          transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "transform .2s ease",
          flexShrink: 0,
        }}>▾</div>
      </div>

      {/* Collapsed state: show summary if confirmed */}
      {!isOpen && confirmedSummary && (
        <div style={{
          padding: "0 16px 14px",
        }}>
          <div style={{
            padding: "10px 14px",
            background: "rgba(0,0,0,.2)",
            borderRadius: 6,
            fontFamily: T.serif, fontSize: 15, fontStyle: "italic",
            color: T.text, lineHeight: 1.5,
          }}>
            "{confirmedSummary}"
          </div>
          <div style={{
            fontSize: 11, color: T.text3, fontStyle: "italic",
            marginTop: 6, textAlign: "center",
          }}>Click above to expand and edit.</div>
        </div>
      )}

      {/* Open state: full content */}
      {isOpen && (
        <div style={{
          padding: "0 16px 16px",
        }}>
          {children}
        </div>
      )}
    </div>
  );
}


===== SummaryGenerator component =====

function SummaryGenerator({ color, label, sourceText, onConfirm, existingConfirmed, bottomTitle }) {
  const [state, setState] = useState("idle"); // idle | generating | editing
  const [draft, setDraft] = useState("");

  const generate = () => {
    if (!sourceText.trim()) return;
    setState("generating");
    setTimeout(() => {
      const sentences = sourceText.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 10);
      const compressed = sentences[0] || sourceText.slice(0, 180);
      setDraft(compressed);
      setState("editing");
    }, 700);
  };

  const confirm = () => {
    if (!draft.trim()) return;
    onConfirm(draft.trim());
    setState("idle");
  };

  const startOver = () => {
    setState("idle");
    setDraft("");
  };

  // If already confirmed, show the confirmed summary prominently + small regenerate option
  if (existingConfirmed && state === "idle") {
    return (
      <div style={{
        marginTop: 18, marginBottom: 24,
        padding: "16px 18px",
        background: "linear-gradient(135deg, rgba(74,222,128,.08), rgba(201,168,76,.04))",
        border: `1px solid ${T.green}`, borderRadius: 10,
        position: "relative",
      }}>
        <div style={{
          position: "absolute", top: -10, right: 14,
          background: T.green, color: T.bg,
          fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
          fontWeight: 700, padding: "2px 10px", borderRadius: 10,
        }}>✓ Confirmed summary</div>
        <div style={{
          fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
          color: T.green, fontWeight: 600, marginBottom: 8,
        }}>{bottomTitle || `${label} summary`}</div>
        <div style={{
          fontFamily: T.serif, fontSize: 17, lineHeight: 1.5,
          color: T.text, fontStyle: "italic", marginBottom: 10,
        }}>"{existingConfirmed}"</div>
        <button onClick={generate} style={{
          padding: "5px 12px", borderRadius: 12,
          background: "transparent", color: T.text3,
          border: `1px solid ${T.border2}`, cursor: "pointer",
          fontSize: 11,
        }}>↻ Regenerate from my writing</button>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 18, marginBottom: 24,
      padding: "14px 16px",
      background: "rgba(0,0,0,.25)",
      border: `1px dashed ${color}`, borderRadius: 8,
    }}>
      <div style={{
        fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase",
        color, fontWeight: 600, marginBottom: 6,
      }}>{bottomTitle || `Ready to summarise ${label}?`}</div>
      <div style={{
        fontSize: 13, color: T.text2, lineHeight: 1.5, marginBottom: 12, fontStyle: "italic",
      }}>
        You've done the writing. Let me stitch it into one sentence you can edit, then confirm.
      </div>

      {state === "idle" && (
        <button onClick={generate} disabled={!sourceText.trim()} style={{
          padding: "8px 16px", borderRadius: 16,
          background: sourceText.trim() ? color : "transparent",
          color: sourceText.trim() ? T.bg : T.text4,
          border: `1px solid ${sourceText.trim() ? color : T.border2}`,
          cursor: sourceText.trim() ? "pointer" : "default",
          fontSize: 13, fontWeight: 600,
        }}>
          ✨ Summarise into one sentence
        </button>
      )}

      {state === "generating" && (
        <div style={{
          padding: "8px 14px", fontSize: 13, color: T.text3, fontStyle: "italic",
        }}>
          ✨ Reading your writing and stitching...
        </div>
      )}

      {state === "editing" && (
        <div>
          <div style={{
            fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase",
            color: T.text3, fontWeight: 600, marginBottom: 6,
          }}>Draft — edit freely, then confirm</div>
          <textarea value={draft} onChange={e => setDraft(e.target.value)}
            rows={3}
            style={{
              width: "100%", background: "rgba(0,0,0,.3)",
              border: `1px solid ${color}60`, borderRadius: 4,
              padding: "10px 12px", color: T.text,
              fontFamily: T.serif, fontSize: 16, lineHeight: 1.5,
              resize: "vertical", outline: "none", marginBottom: 10,
            }} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={confirm} disabled={!draft.trim()} style={{
              padding: "8px 18px", borderRadius: 16,
              background: draft.trim() ? color : "transparent",
              color: draft.trim() ? T.bg : T.text4,
              border: `1px solid ${draft.trim() ? color : T.border2}`,
              cursor: draft.trim() ? "pointer" : "default",
              fontSize: 13, fontWeight: 700,
            }}>✓ Confirm</button>
            <button onClick={generate} style={{
              padding: "8px 14px", borderRadius: 16,
              background: "transparent", color: T.text2,
              border: `1px solid ${T.border2}`, cursor: "pointer",
              fontSize: 12,
            }}>↻ Try again</button>
            <button onClick={startOver} style={{
              padding: "8px 14px", borderRadius: 16,
              background: "transparent", color: T.text3,
              border: "none", cursor: "pointer", fontSize: 12,
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}


===== Wealth render block #1 =====

{/* WEALTH */}
      <CollapsibleSegment
        icon="💰" title="Wealth" color={T.wealthColor}
        confirmed={three.wealthOverallConfirmed}
        confirmedSummary={three.wealthOverallConfirmed ? three.wealthOverallSentence : null}
      >
        {bag.wealthPicked.map(id => {
          const card = WEALTH_CARDS.find(c => c.id === id);
          if (!card) return null;
          const item = three.wealthItems[id] || { text: "", goal: "" };
          return (
            <SimpleItemCard
              key={id} icon={card.icon} label={card.label} color={T.wealthColor}
              text={item.text} goal={item.goal}
              promptText="What does this look like in 2029?"
              onTextChange={v => updateItem("wealth", id, "text", v)}
              onGoalChange={v => updateItem("wealth", id, "goal", v)}
            />
          );
        })}
        <SummaryGenerator
          color={T.wealthColor}
          label="Wealth"
          sourceText={Object.values(three.wealthItems).map(i => i.goal || i.text).filter(Boolean).join(" ")}
          existingConfirmed={three.wealthOverallConfirmed ? three.wealthOverallSentence : null}
          onConfirm={(text) => set3yr({ wealthOverallSentence: text, wealthOverallConfirmed: true })}
          bottomTitle="In one sentence, my wealth in 2029 is..."
        />
      </CollapsibleSegment>


===== Wealth render block #2 =====

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


===== bag state shape =====

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
      },
      wealthOverallSentence: "I have more than I need, flowing in ways that don't require me to keep selling my time.",
      wealthOverallConfirmed: false,
      wealthPicked: ["retirement", "cashflow", "properties", "business-equity"],
      wealthItems: {
        retirement: { text: "Fully funded. I could stop working tomorrow and live better than I do now.", goal: "" },


===== Wealth block context (wider) =====

   onConfirm={(text) => set3yr({ timeOverallSentence: text, timeOverallConfirmed: true })}
          bottomTitle="In one sentence, my time in 2029 is..."
        />
      </CollapsibleSegment>

      {/* WEALTH */}
      <CollapsibleSegment
        icon="💰" title="Wealth" color={T.wealthColor}
        confirmed={three.wealthOverallConfirmed}
        confirmedSummary={three.wealthOverallConfirmed ? three.wealthOverallSentence : null}
      >
        {bag.wealthPicked.map(id => {
          const card = WEALTH_CARDS.find(c => c.id === id);
          if (!card) return null;
          const item = three.wealthItems[id] || { text: "", goal: "" };
          return (
            <SimpleItemCard
              key={id} icon={card.icon} label={card.label} color={T.wealthColor}
              text={item.text} goal={item.goal}
              promptText="What does this look like in 2029?"
              onTextChange={v => updateItem("wealth", id, "text", v)}
              onGoalChange={v => updateItem("wealth", id, "goal", v)}
            />
          );
        })}
        <SummaryGenerator
          color={T.wealthColor}
          label="Wealth"
          sourceText={Object.values(three.wealthItems).map(i => i.goal || i.text).filter(Boolean).join(" ")}
          existingConfirmed={three.wealthOverallConfirmed ? three.wealthOverallSentence : null}
          onConfirm={(text) => set3yr({ wealthOverallSentence: text, wealthOverallConfirmed: true })}
          bottomTitle="In one sentence, my wealth in 2029 is..."
        />
      </CollapsibleSegment>

      {/* GROWTH */}
      <CollapsibleSegment
        icon="🌱" title="Growth" color={T.growthColo
