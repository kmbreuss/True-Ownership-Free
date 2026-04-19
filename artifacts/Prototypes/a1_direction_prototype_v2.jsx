import React, { useState, useMemo, useEffect } from "react";

// ─── Design tokens ──────────────────────────────────────────────────
const T = {
  bg: "#0d1b2e", bg2: "#152844", bg3: "#1e3560",
  text: "#f5f1e8", text2: "#b8c5d9", text3: "#7a8ba8", text4: "#5a6b88",
  gold: "#c9a84c", goldSoft: "#f59e0b",
  border: "rgba(201,168,76,.3)", border2: "rgba(255,255,255,.08)",
  green: "#4ade80", red: "#f87171", amber: "#fbbf24",
  timeColor: "#8b5cf6", wealthColor: "#10b981", growthColor: "#f59e0b",
  sans: '"Calibri", "Segoe UI", system-ui, sans-serif',
  serif: '"Cormorant Garamond", Georgia, serif',
};

const TIERS = [
  { id: "non-neg", label: "Non-negotiable", color: T.red },
  { id: "imp", label: "Important", color: T.amber },
  { id: "nth", label: "Nice to have", color: T.text3 },
];

// ─── Card options matching the live app ─────────────────────────────
const TIME_CARDS = [
  { id: "family", label: "Family", icon: "👨‍👩‍👧" },
  { id: "love", label: "Love", icon: "💛" },
  { id: "business", label: "Business", icon: "🏔️" },
  { id: "health", label: "Health", icon: "⚡" },
  { id: "friends", label: "Friends", icon: "🤝" },
  { id: "spirituality", label: "Spirituality", icon: "🌿" },
  { id: "community", label: "Community", icon: "🌍" },
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
      },
      wealthOverallSentence: "I have more than I need, flowing in ways that don't require me to keep selling my time.",
      wealthOverallConfirmed: false,
      wealthPicked: ["retirement", "cashflow", "properties", "business-equity"],
      wealthItems: {
        retirement: { text: "Fully funded. I could stop working tomorrow and live better than I do now.", goal: "" },
        cashflow: { text: "Six figures a year arrives without me chasing it — from rentals, royalties, licensing.", goal: "" },
        properties: { text: "Three properties — primary residence, coastal retreat, one rental generating income.", goal: "" },
        "business-equity": { text: "The business is valuable enough to sell or pass down. I own it; it doesn't own me.", goal: "" },
      },
      wealthSeeHearFeel: {
        see: "Account balances that make me smile, not flinch. Properties that hold memory, not stress.",
        hear: "My accountant saying 'you're ahead of plan.' My kids saying 'we're proud of you, Mom.'",
        feel: "Safe. Generous. Free.",
      },
      growthSentence: "I'm a best-selling author with a thriving coaching empire, living in a home by the ocean, fully present with my grown kids, healthy and vibrant.",
      growthConfirmed: false,
      growthSeeHearFeel: {
        see: "My name on book spines in shop windows. A wall of thank-you notes. My own reflection looking rested.",
        hear: "'Your book changed my life.' From strangers, years after launch.",
        feel: "Known. Useful. Deeply myself, without apology.",
      },
    },
    threeYear: {
      timeOverallSentence: "",
      timeOverallConfirmed: false,
      timeItems: {}, // populated from BAG on first load
      wealthOverallSentence: "",
      wealthOverallConfirmed: false,
      wealthItems: {},
      growthText: "", // free writing space for growth
      growthSentence: "I'm giving keynotes at major conferences, my second book is out, I have a team of 4 strategists, and my health is the best it's been in a decade.",
      growthConfirmed: false,
    },
    oneYear: {
      timeOverallSentence: "",
      timeOverallConfirmed: false,
      timeItems: {},
      wealthOverallSentence: "",
      wealthOverallConfirmed: false,
      wealthItems: {},
      growthText: "",
      growthSentence: "I've launched the 45-day program, onboarded two new strategists, finished the book proposal, and I'm running 3x a week.",
      growthConfirmed: false,
      growthSuggestionsAccepted: [true, true],
      otherGrowth: "",
    },
    tiers: {
      bag: {
        // 3 non-negotiables to demonstrate the cap
        t_family: "non-neg",
        t_health: "non-neg",
        g_main: "non-neg",
        // Some Important
        t_business: "imp",
        w_cashflow: "imp",
        w_retirement: "imp",
        // Some Nice to have
        t_adventure: "nth",
        w_properties: "nth",
        "w_business-equity": "nth",
      },
      threeYear: {},
      oneYear: {},
    },
    rankingConfirmed: {
      bag: false,
      threeYear: false,
      oneYear: false,
    },
    futureSelfLetter: "",
    letterConfirmed: false,
  });
  return [state, setState];
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════
export default function A1DirectionPrototypeV2() {
  const [tab, setTab] = useState("bag");
  const [viewport, setViewport] = useState("desktop");
  const [state, setState] = useAppState();
  const isMobile = viewport === "mobile";
  const frameWidth = isMobile ? 390 : 1280;

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0f1a", fontFamily: T.sans,
      padding: isMobile ? "16px 8px" : "20px",
    }}>
      {/* Prototype controls */}
      <div style={{
        maxWidth: 1400, margin: "0 auto 16px", padding: "14px 20px",
        background: "rgba(0,0,0,.4)", border: `1px solid ${T.border2}`,
        borderRadius: 8, display: "flex", alignItems: "center", gap: 20,
        flexWrap: "wrap",
      }}>
        <div style={{
          fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
          color: T.gold, fontWeight: 700,
        }}>Prototype controls</div>
        <div style={{ display: "flex", gap: 4 }}>
          {["desktop", "mobile"].map(v => (
            <button key={v} onClick={() => setViewport(v)} style={{
              padding: "6px 14px", borderRadius: 14, fontSize: 12, fontWeight: 600,
              background: viewport === v ? T.gold : "transparent",
              color: viewport === v ? T.bg : T.text2,
              border: `1px solid ${viewport === v ? T.gold : T.border2}`,
              cursor: "pointer",
            }}>{v === "desktop" ? "🖥 Desktop" : "📱 Mobile"}</button>
          ))}
        </div>
        <div style={{ width: 1, height: 24, background: T.border2 }} />
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[
            { k: "bag", l: "BAG" },
            { k: "3yr", l: "3-Year" },
            { k: "1yr", l: "1-Year" },
            { k: "align", l: "Direction Alignment" },
            { k: "letter", l: "A2 Future Self Letter" },
            { k: "insertion", l: "Insertion Map" },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              padding: "6px 12px", borderRadius: 14, fontSize: 12, fontWeight: 600,
              background: tab === t.k ? T.bg3 : "transparent",
              color: tab === t.k ? T.gold : T.text2,
              border: `1px solid ${tab === t.k ? T.gold : T.border2}`,
              cursor: "pointer",
            }}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* Device frame */}
      <div style={{
        margin: "0 auto", width: "100%", maxWidth: frameWidth,
        background: T.bg,
        borderRadius: isMobile ? 32 : 12,
        border: `${isMobile ? 8 : 1}px solid ${isMobile ? "#000" : T.border2}`,
        overflow: "hidden",
        boxShadow: isMobile ? "0 10px 40px rgba(0,0,0,.5)" : "none",
        color: T.text, transition: "max-width .3s ease",
      }}>
        {isMobile && (
          <div style={{
            height: 28, background: "#000",
            display: "flex", justifyContent: "center", alignItems: "flex-start",
            paddingTop: 6,
          }}>
            <div style={{ width: 100, height: 20, background: "#000", borderRadius: 12 }} />
          </div>
        )}
        <AppHeader isMobile={isMobile} />
        <DirectionTimeline
          activeHorizon={tab === "bag" ? "bag" : tab === "3yr" ? "3yr" : tab === "1yr" ? "1yr" : null}
          completed={{ bag: true, "3yr": true, "1yr": true }}
          sentences={{
            bag: state.bag.growthSentence,
            "3yr": state.threeYear.growthSentence,
            "1yr": state.oneYear.growthSentence,
          }}
        />

        {tab === "bag" && <BagPage state={state} setState={setState} isMobile={isMobile} />}
        {tab === "3yr" && <ThreeYearPage state={state} setState={setState} isMobile={isMobile} />}
        {tab === "1yr" && <OneYearPage state={state} setState={setState} isMobile={isMobile} />}
        {tab === "align" && <DirectionAlignmentPage state={state} isMobile={isMobile} />}
        {tab === "letter" && <A2FutureSelfLetter state={state} setState={setState} isMobile={isMobile} />}
        {tab === "insertion" && <InsertionMap isMobile={isMobile} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PERSISTENT TIMELINE (unchanged from last version — clean tap-to-reveal)
// ═══════════════════════════════════════════════════════════════════════════
function DirectionTimeline({ activeHorizon, completed, sentences }) {
  const points = [
    { key: "1yr", label: "1-YEAR", year: "2027" },
    { key: "3yr", label: "3-YEAR", year: "2029" },
    { key: "bag", label: "BAG", year: "2038" },
  ];
  const [expandedKey, setExpandedKey] = useState(null);

  return (
    <div style={{
      background: "linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.05))",
      borderBottom: `1px solid ${T.border2}`,
      padding: "14px 32px 18px",
      position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{
        fontSize: 9, letterSpacing: 2, textTransform: "uppercase",
        color: T.text3, fontWeight: 600, textAlign: "center", marginBottom: 10,
      }}>Your Direction · Near to Far</div>

      <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
        <div style={{
          position: "absolute", left: "16%", right: "16%", top: 11,
          height: 2, background: T.border2, borderRadius: 1,
        }} />
        <div style={{
          position: "absolute", left: "16%", top: 11,
          height: 2, background: T.gold, borderRadius: 1,
          width: completed["1yr"] && completed["3yr"] && completed.bag ? "68%"
            : completed["3yr"] && completed.bag ? "34%" : "0%",
          transition: "width .4s ease",
        }} />

        <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
          {points.map(p => {
            const isComplete = completed[p.key];
            const isActive = activeHorizon === p.key;
            return (
              <div key={p.key}
                onClick={() => isComplete && setExpandedKey(expandedKey === p.key ? null : p.key)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  width: "33%", cursor: isComplete ? "pointer" : "default", padding: "4px 0",
                }}>
                <div style={{
                  width: isActive ? 20 : 14, height: isActive ? 20 : 14, borderRadius: 10,
                  background: isActive || isComplete ? T.gold : T.bg,
                  border: `2px solid ${isActive || isComplete ? T.gold : T.border2}`,
                  display: "grid", placeItems: "center",
                  boxShadow: isActive ? `0 0 0 4px rgba(201,168,76,.2)` : "none",
                  color: T.bg, fontSize: 9, fontWeight: 700, transition: "all .2s ease",
                }}>{isComplete && !isActive && "✓"}</div>
                <div style={{ marginTop: 6, textAlign: "center" }}>
                  <div style={{
                    fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase",
                    color: isActive ? T.gold : isComplete ? T.text2 : T.text4, fontWeight: 600,
                  }}>{p.label}</div>
                  <div style={{
                    fontFamily: T.serif, fontSize: 12,
                    color: isActive ? T.gold : isComplete ? T.text : T.text4,
                  }}>{p.year}</div>
                  {isComplete && (
                    <div style={{
                      fontSize: 9, color: T.text3, marginTop: 2,
                      opacity: expandedKey === p.key ? 1 : 0.6,
                    }}>{expandedKey === p.key ? "▴ hide" : "▾ preview"}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {expandedKey && completed[expandedKey] && (
          <div style={{
            marginTop: 12, padding: "12px 16px",
            background: "rgba(201,168,76,.08)", border: `1px solid ${T.gold}`,
            borderRadius: 6, fontFamily: T.serif, fontSize: 14, fontStyle: "italic",
            color: T.text, lineHeight: 1.5, maxWidth: 640, margin: "12px auto 0",
          }}>
            <div style={{
              fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase",
              color: T.gold, fontWeight: 600, marginBottom: 4, fontStyle: "normal",
              fontFamily: T.sans,
            }}>
              {points.find(p => p.key === expandedKey)?.label} · {points.find(p => p.key === expandedKey)?.year}
            </div>
            "{sentences[expandedKey]}"
          </div>
        )}
      </div>
    </div>
  );
}

function AppHeader({ isMobile }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: isMobile ? "10px 16px" : "12px 28px",
      borderBottom: `1px solid ${T.border2}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: 4, background: T.gold }} />
        <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 500 }}>True Ownership</span>
        {!isMobile && <span style={{ color: T.text3, marginLeft: 6, fontSize: 13 }}>· Katherine</span>}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {["A1","A2","A3","A4","A5"].map(a => (
          <div key={a} style={{
            width: isMobile ? 24 : 28, height: isMobile ? 24 : 28, borderRadius: 14,
            display: "grid", placeItems: "center",
            border: `1px solid ${a === "A1" ? T.gold : T.border2}`,
            background: a === "A1" ? "rgba(201,168,76,.15)" : "transparent",
            color: a === "A1" ? T.gold : T.text3, fontSize: 10, fontWeight: 600,
          }}>{a}</div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BAG PAGE — richest horizon
// ═══════════════════════════════════════════════════════════════════════════
function BagPage({ state, setState, isMobile }) {
  const bag = state.bag;
  const setBag = (patch) => setState(s => ({ ...s, bag: { ...s.bag, ...patch } }));

  const togglePick = (segment, id) => {
    const key = segment === "time" ? "timePicked" : "wealthPicked";
    const itemsKey = segment === "time" ? "timeItems" : "wealthItems";
    const picked = bag[key];
    const isPicked = picked.includes(id);
    setBag({
      [key]: isPicked ? picked.filter(x => x !== id) : [...picked, id],
      [itemsKey]: isPicked
        ? (() => { const c = { ...bag[itemsKey] }; delete c[id]; return c; })()
        : { ...bag[itemsKey], [id]: { text: "", goal: "" } },
    });
  };

  const updateItem = (segment, id, field, value) => {
    const itemsKey = segment === "time" ? "timeItems" : "wealthItems";
    setBag({
      [itemsKey]: {
        ...bag[itemsKey],
        [id]: { ...bag[itemsKey][id], [field]: value },
      },
    });
  };

  const updateSHF = (segment, field, value) => {
    const key = segment === "time" ? "timeSeeHearFeel"
             : segment === "wealth" ? "wealthSeeHearFeel"
             : "growthSeeHearFeel";
    setBag({ [key]: { ...bag[key], [field]: value } });
  };

  // All items that flow to tier ranking
  const allItems = useMemo(() => {
    const items = [];
    bag.timePicked.forEach(id => {
      const card = TIME_CARDS.find(c => c.id === id);
      if (card) items.push({ id: `t_${id}`, segment: "Time", label: card.label, icon: card.icon });
    });
    bag.wealthPicked.forEach(id => {
      const card = WEALTH_CARDS.find(c => c.id === id);
      if (card) items.push({ id: `w_${id}`, segment: "Wealth", label: card.label, icon: card.icon });
    });
    if (bag.growthSentence.trim()) {
      items.push({ id: "g_main", segment: "Growth", label: "Growth vision" });
    }
    return items;
  }, [bag.timePicked, bag.wealthPicked, bag.growthSentence]);

  return (
    <div style={{
      padding: isMobile ? "20px 16px" : "28px 40px",
      maxWidth: isMobile ? "100%" : 820, margin: "0 auto",
    }}>
      <div style={breadcrumbStyle}>MIRROR 1 OF 3 · DIRECTION · BAG</div>
      <h1 style={h1Style(isMobile)}>BAG · 2038</h1>
      <p style={leadStyle}>
        The far horizon. Your 10–15 year summit. This is where your imagination does its deepest work —
        the sensory detail you build here seeds the rest of your Direction.
      </p>

      {/* ═══ TIME SEGMENT ═══ */}
      <CollapsibleSegment
        icon="⏳" title="Time — Your Life Priorities" color={T.timeColor}
        confirmed={bag.timeOverallConfirmed}
        confirmedSummary={bag.timeOverallConfirmed ? bag.timeOverallSentence : null}
      >
        <SubLabel>Pick the areas of life that matter most. You'll write a bit about each.</SubLabel>
        <CardPicker
          cards={TIME_CARDS} picked={bag.timePicked}
          onToggle={id => togglePick("time", id)}
          color={T.timeColor}
        />

        {bag.timePicked.map(id => {
          const card = TIME_CARDS.find(c => c.id === id);
          if (!card) return null;
          const item = bag.timeItems[id] || { text: "", goal: "" };
          return (
            <PriorityItemCard
              key={id} icon={card.icon} label={card.label} color={T.timeColor}
              text={item.text} goal={item.goal}
              promptText="How does your time shape this? What are you doing regularly? What have you let go of?"
              onTextChange={v => updateItem("time", id, "text", v)}
              onGoalChange={v => updateItem("time", id, "goal", v)}
            />
          );
        })}

        {/* Overall Time See/Hear/Feel */}
        <SeeHearFeelBlock
          title="Overall Time — See · Hear · Feel"
          subtitle="When you picture your whole life in 2038, what's the sensory texture?"
          color={T.timeColor}
          values={bag.timeSeeHearFeel}
          onChange={(field, value) => updateSHF("time", field, value)}
        />

        <SummaryGenerator
          color={T.timeColor}
          label="Time"
          sourceText={[
            bag.timeSeeHearFeel.see,
            bag.timeSeeHearFeel.hear,
            bag.timeSeeHearFeel.feel,
            ...Object.values(bag.timeItems).map(i => i.goal || i.text),
          ].filter(Boolean).join(" ")}
          existingConfirmed={bag.timeOverallConfirmed ? bag.timeOverallSentence : null}
          onConfirm={(text) => setBag({ timeOverallSentence: text, timeOverallConfirmed: true })}
          bottomTitle="In one sentence, my time in 2038 is..."
        />
      </CollapsibleSegment>

      {/* ═══ WEALTH SEGMENT ═══ */}
      <CollapsibleSegment
        icon="💰" title="Wealth — What you own, what flows" color={T.wealthColor}
        confirmed={bag.wealthOverallConfirmed}
        confirmedSummary={bag.wealthOverallConfirmed ? bag.wealthOverallSentence : null}
      >
        <SubLabel>Pick the wealth categories that matter for this horizon.</SubLabel>
        <CardPicker
          cards={WEALTH_CARDS} picked={bag.wealthPicked}
          onToggle={id => togglePick("wealth", id)}
          color={T.wealthColor}
        />

        {bag.wealthPicked.map(id => {
          const card = WEALTH_CARDS.find(c => c.id === id);
          if (!card) return null;
          const item = bag.wealthItems[id] || { text: "", goal: "" };
          return (
            <PriorityItemCard
              key={id} icon={card.icon} label={card.label} color={T.wealthColor}
              text={item.text} goal={item.goal}
              promptText="What does this look like in 2038? Be specific — numbers, structures, what you own."
              onTextChange={v => updateItem("wealth", id, "text", v)}
              onGoalChange={v => updateItem("wealth", id, "goal", v)}
            />
          );
        })}

        {/* Overall Wealth See/Hear/Feel */}
        <SeeHearFeelBlock
          title="Overall Wealth — See · Hear · Feel"
          subtitle="When you picture your financial life in 2038, what do you see, hear, feel?"
          color={T.wealthColor}
          values={bag.wealthSeeHearFeel}
          onChange={(field, value) => updateSHF("wealth", field, value)}
        />

        <SummaryGenerator
          color={T.wealthColor}
          label="Wealth"
          sourceText={[
            bag.wealthSeeHearFeel.see,
            bag.wealthSeeHearFeel.hear,
            bag.wealthSeeHearFeel.feel,
            ...Object.values(bag.wealthItems).map(i => i.goal || i.text),
          ].filter(Boolean).join(" ")}
          existingConfirmed={bag.wealthOverallConfirmed ? bag.wealthOverallSentence : null}
          onConfirm={(text) => setBag({ wealthOverallSentence: text, wealthOverallConfirmed: true })}
          bottomTitle="In one sentence, my wealth in 2038 is..."
        />
      </CollapsibleSegment>

      {/* ═══ GROWTH SEGMENT ═══ */}
      <CollapsibleSegment
        icon="🌱" title="Growth — Who you are becoming" color={T.growthColor}
        confirmed={bag.growthConfirmed}
        confirmedSummary={bag.growthConfirmed ? bag.growthSentence : null}
      >
        <div style={{
          fontSize: 13, color: T.text2, lineHeight: 1.6, marginBottom: 18,
          padding: "12px 16px",
          background: "rgba(255,255,255,.03)",
          borderLeft: `2px solid ${T.growthColor}`, borderRadius: 4,
        }}>
          Growth is who you become. Do the See/Hear/Feel below to paint who you are in 2038,
          then summarise it into one sentence at the bottom.
        </div>

        {/* Overall Growth See/Hear/Feel */}
        <SeeHearFeelBlock
          title="Growth — See · Hear · Feel"
          subtitle="When you picture the person you've become in 2038, what do you see, hear, feel?"
          color={T.growthColor}
          values={bag.growthSeeHearFeel}
          onChange={(field, value) => updateSHF("growth", field, value)}
        />

        <SummaryGenerator
          color={T.growthColor}
          label="Growth"
          sourceText={[
            bag.growthSeeHearFeel.see,
            bag.growthSeeHearFeel.hear,
            bag.growthSeeHearFeel.feel,
          ].filter(Boolean).join(" ")}
          existingConfirmed={bag.growthConfirmed ? bag.growthSentence : null}
          onConfirm={(text) => setBag({ growthSentence: text, growthConfirmed: true })}
          bottomTitle="In one sentence, who I am in 2038..."
        />
      </CollapsibleSegment>

      {/* ═══ TIER RANKING ═══ */}
      <TierRankingSection
        items={allItems}
        tiers={state.tiers.bag}
        setTiers={(updater) => setState(s => ({
          ...s, tiers: { ...s.tiers, bag: typeof updater === "function" ? updater(s.tiers.bag) : updater }
        }))}
        horizonLabel="2038" isMobile={isMobile}
        confirmed={state.rankingConfirmed.bag}
        onConfirmed={() => setState(s => ({
          ...s, rankingConfirmed: { ...s.rankingConfirmed, bag: true }
        }))}
      />

      <BagCompleteNote />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3-YEAR PAGE — pre-fills from BAG, no sensory work
// ═══════════════════════════════════════════════════════════════════════════
function ThreeYearPage({ state, setState, isMobile }) {
  const bag = state.bag;
  const three = state.threeYear;

  // Pre-fill from BAG on first visit
  useEffect(() => {
    const needsInit = Object.keys(three.timeItems).length === 0 && bag.timePicked.length > 0;
    if (needsInit) {
      const timeItems = {};
      bag.timePicked.forEach(id => { timeItems[id] = { text: "", goal: "" }; });
      const wealthItems = {};
      bag.wealthPicked.forEach(id => { wealthItems[id] = { text: "", goal: "" }; });
      setState(s => ({
        ...s,
        threeYear: { ...s.threeYear, timeItems, wealthItems },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set3yr = (patch) => setState(s => ({ ...s, threeYear: { ...s.threeYear, ...patch } }));
  const updateItem = (segment, id, field, value) => {
    const itemsKey = segment === "time" ? "timeItems" : "wealthItems";
    set3yr({
      [itemsKey]: {
        ...three[itemsKey],
        [id]: { ...(three[itemsKey][id] || { text: "", goal: "" }), [field]: value },
      },
    });
  };

  const allItems = useMemo(() => {
    const items = [];
    bag.timePicked.forEach(id => {
      const card = TIME_CARDS.find(c => c.id === id);
      if (card) items.push({ id: `t_${id}`, segment: "Time", label: card.label, icon: card.icon });
    });
    bag.wealthPicked.forEach(id => {
      const card = WEALTH_CARDS.find(c => c.id === id);
      if (card) items.push({ id: `w_${id}`, segment: "Wealth", label: card.label, icon: card.icon });
    });
    if (three.growthSentence.trim()) {
      items.push({ id: "g_main", segment: "Growth", label: "Growth vision" });
    }
    return items;
  }, [bag.timePicked, bag.wealthPicked, three.growthSentence]);

  return (
    <div style={{
      padding: isMobile ? "20px 16px" : "28px 40px",
      maxWidth: isMobile ? "100%" : 820, margin: "0 auto",
    }}>
      <div style={breadcrumbStyle}>MIRROR 1 OF 3 · DIRECTION · 3-YEAR</div>
      <h1 style={h1Style(isMobile)}>3-Year · 2029</h1>
      <p style={leadStyle}>
        Pull the horizon closer. Same priorities, refined for 2029.
        No sensory work here — just get specific about what each area looks like.
      </p>

      <PrefillNote>
        Your priorities from BAG have been carried forward. Refine what each one looks like at 3 years out,
        or adjust the list below if 2029 needs something different than 2038.
      </PrefillNote>

      {/* TIME */}
      <CollapsibleSegment
        icon="⏳" title="Time" color={T.timeColor}
        confirmed={three.timeOverallConfirmed}
        confirmedSummary={three.timeOverallConfirmed ? three.timeOverallSentence : null}
      >
        {bag.timePicked.map(id => {
          const card = TIME_CARDS.find(c => c.id === id);
          if (!card) return null;
          const item = three.timeItems[id] || { text: "", goal: "" };
          return (
            <SimpleItemCard
              key={id} icon={card.icon} label={card.label} color={T.timeColor}
              text={item.text} goal={item.goal}
              promptText="What does this look like in 2029?"
              onTextChange={v => updateItem("time", id, "text", v)}
              onGoalChange={v => updateItem("time", id, "goal", v)}
            />
          );
        })}
        <SummaryGenerator
          color={T.timeColor}
          label="Time"
          sourceText={Object.values(three.timeItems).map(i => i.goal || i.text).filter(Boolean).join(" ")}
          existingConfirmed={three.timeOverallConfirmed ? three.timeOverallSentence : null}
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
        icon="🌱" title="Growth" color={T.growthColor}
        confirmed={three.growthConfirmed}
        confirmedSummary={three.growthConfirmed ? three.growthSentence : null}
      >
        <div style={{
          fontSize: 13, color: T.text2, lineHeight: 1.6, marginBottom: 14,
          padding: "10px 14px",
          background: "rgba(255,255,255,.03)",
          borderLeft: `2px solid ${T.growthColor}`, borderRadius: 4,
        }}>
          Who are you in 2029? Write freely about who you're becoming — then summarise into one sentence at the bottom.
        </div>
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
          }}>Who you are in 2029 — write freely</div>
          <textarea
            value={three.growthText}
            onChange={e => set3yr({ growthText: e.target.value })}
            placeholder="Who have you become? What have you built? What's different about you?"
            rows={4}
            style={{
              width: "100%", background: "rgba(0,0,0,.2)",
              border: `1px solid ${T.border2}`, borderRadius: 4,
              padding: "8px 10px", color: T.text,
              fontFamily: T.serif, fontSize: 14, outline: "none",
              resize: "vertical", lineHeight: 1.5,
            }} />
        </div>
        <SummaryGenerator
          color={T.growthColor}
          label="Growth"
          sourceText={three.growthText}
          existingConfirmed={three.growthConfirmed ? three.growthSentence : null}
          onConfirm={(text) => set3yr({ growthSentence: text, growthConfirmed: true })}
          bottomTitle="In one sentence, who I am in 2029..."
        />
      </CollapsibleSegment>

      {/* TIER RANKING */}
      <TierRankingSection
        items={allItems}
        tiers={state.tiers.threeYear}
        setTiers={(updater) => setState(s => ({
          ...s, tiers: { ...s.tiers, threeYear: typeof updater === "function" ? updater(s.tiers.threeYear) : updater }
        }))}
        horizonLabel="2029" isMobile={isMobile}
        confirmed={state.rankingConfirmed.threeYear}
        onConfirmed={() => setState(s => ({
          ...s, rankingConfirmed: { ...s.rankingConfirmed, threeYear: true }
        }))}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 1-YEAR PAGE — pre-fills from 3-Year + Growth suggestions
// ═══════════════════════════════════════════════════════════════════════════
const IDENTITY_VALUES_SEEDS = [
  { id: "iv1", label: "Playful energy", source: "Identity · Dolphin", score: 4 },
  { id: "iv2", label: "Impact over activity", source: "Values · MAKE IT COUNT", score: 4 },
];

function OneYearPage({ state, setState, isMobile }) {
  const bag = state.bag;
  const three = state.threeYear;
  const one = state.oneYear;

  useEffect(() => {
    const needsInit = Object.keys(one.timeItems).length === 0 && bag.timePicked.length > 0;
    if (needsInit) {
      const timeItems = {};
      bag.timePicked.forEach(id => { timeItems[id] = { text: "", goal: "" }; });
      const wealthItems = {};
      bag.wealthPicked.forEach(id => { wealthItems[id] = { text: "", goal: "" }; });
      setState(s => ({ ...s, oneYear: { ...s.oneYear, timeItems, wealthItems } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set1yr = (patch) => setState(s => ({ ...s, oneYear: { ...s.oneYear, ...patch } }));
  const updateItem = (segment, id, field, value) => {
    const itemsKey = segment === "time" ? "timeItems" : "wealthItems";
    set1yr({
      [itemsKey]: {
        ...one[itemsKey],
        [id]: { ...(one[itemsKey][id] || { text: "", goal: "" }), [field]: value },
      },
    });
  };

  const allItems = useMemo(() => {
    const items = [];
    bag.timePicked.forEach(id => {
      const card = TIME_CARDS.find(c => c.id === id);
      if (card) items.push({ id: `t_${id}`, segment: "Time", label: card.label, icon: card.icon });
    });
    bag.wealthPicked.forEach(id => {
      const card = WEALTH_CARDS.find(c => c.id === id);
      if (card) items.push({ id: `w_${id}`, segment: "Wealth", label: card.label, icon: card.icon });
    });
    if (one.growthSentence.trim()) {
      items.push({ id: "g_main", segment: "Growth", label: "Growth vision" });
    }
    IDENTITY_VALUES_SEEDS.forEach((s, i) => {
      if (one.growthSuggestionsAccepted[i]) {
        items.push({ id: `g_seed_${s.id}`, segment: "Growth", label: s.label, suggested: true });
      }
    });
    if (one.otherGrowth.trim()) {
      items.push({ id: "g_other", segment: "Growth", label: one.otherGrowth });
    }
    return items;
  }, [bag.timePicked, bag.wealthPicked, one.growthSentence, one.growthSuggestionsAccepted, one.otherGrowth]);

  return (
    <div style={{
      padding: isMobile ? "20px 16px" : "28px 40px",
      maxWidth: isMobile ? "100%" : 820, margin: "0 auto",
    }}>
      <div style={breadcrumbStyle}>MIRROR 1 OF 3 · DIRECTION · 1-YEAR</div>
      <h1 style={h1Style(isMobile)}>1-Year · 2027</h1>
      <p style={leadStyle}>
        Closest horizon. This is what you can commit to. Your 1-year Growth draws
        from your Identity &amp; Values alignment — the lowest-scoring items surface below as suggestions.
      </p>

      <PrefillNote>
        Pre-filled from your 3-Year. Refine what each looks like for 2027.
      </PrefillNote>

      {/* TIME */}
      <CollapsibleSegment
        icon="⏳" title="Time" color={T.timeColor}
        confirmed={one.timeOverallConfirmed}
        confirmedSummary={one.timeOverallConfirmed ? one.timeOverallSentence : null}
      >
        {bag.timePicked.map(id => {
          const card = TIME_CARDS.find(c => c.id === id);
          if (!card) return null;
          const item = one.timeItems[id] || { text: "", goal: "" };
          return (
            <SimpleItemCard
              key={id} icon={card.icon} label={card.label} color={T.timeColor}
              text={item.text} goal={item.goal}
              promptText="What does this look like in 2027?"
              onTextChange={v => updateItem("time", id, "text", v)}
              onGoalChange={v => updateItem("time", id, "goal", v)}
            />
          );
        })}
        <SummaryGenerator
          color={T.timeColor}
          label="Time"
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
          }}>Who you are in 2027 — write freely</div>
          <textarea
            value={one.growthText}
            onChange={e => set1yr({ growthText: e.target.value })}
            placeholder="What are you becoming this year? What are you doing differently?"
            rows={4}
            style={{
              width: "100%", background: "rgba(0,0,0,.2)",
              border: `1px solid ${T.border2}`, borderRadius: 4,
              padding: "8px 10px", color: T.text,
              fontFamily: T.serif, fontSize: 14, outline: "none",
              resize: "vertical", lineHeight: 1.5,
            }} />
        </div>
        <SummaryGenerator
          color={T.growthColor}
          label="Growth"
          sourceText={one.growthText}
          existingConfirmed={one.growthConfirmed ? one.growthSentence : null}
          onConfirm={(text) => set1yr({ growthSentence: text, growthConfirmed: true })}
          bottomTitle="In one sentence, who I am in 2027..."
        />
      </CollapsibleSegment>

      {/* TIER RANKING */}
      <TierRankingSection
        items={allItems}
        tiers={state.tiers.oneYear}
        setTiers={(updater) => setState(s => ({
          ...s, tiers: { ...s.tiers, oneYear: typeof updater === "function" ? updater(s.tiers.oneYear) : updater }
        }))}
        horizonLabel="2027" isMobile={isMobile}
        confirmed={state.rankingConfirmed.oneYear}
        onConfirmed={() => setState(s => ({
          ...s, rankingConfirmed: { ...s.rankingConfirmed, oneYear: true }
        }))}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DIRECTION ALIGNMENT PAGE
// ═══════════════════════════════════════════════════════════════════════════
function DirectionAlignmentPage({ state, isMobile }) {
  const [activeHorizon, setActiveHorizon] = useState("1yr");

  // Build alignment data for each horizon
  const buildData = (horizonKey) => {
    const tiers = state.tiers[horizonKey === "1yr" ? "oneYear" : horizonKey === "3yr" ? "threeYear" : "bag"] || {};
    const buckets = { "non-neg": [], imp: [], nth: [] };

    const addItem = (id, segment, label, pseudoScore) => {
      const tier = tiers[id] || "nth";
      buckets[tier].push({ label: `${label} (${segment})`, score: pseudoScore });
    };

    // Seed scores for demo
    state.bag.timePicked.forEach((id, i) => {
      const card = TIME_CARDS.find(c => c.id === id);
      if (card) addItem(`t_${id}`, "Time", card.label, Math.max(3, 7 - i));
    });
    state.bag.wealthPicked.forEach((id, i) => {
      const card = WEALTH_CARDS.find(c => c.id === id);
      if (card) addItem(`w_${id}`, "Wealth", card.label, Math.max(2, 5 - i));
    });
    if (state.bag.growthSentence.trim()) {
      addItem("g_main", "Growth", "Growth vision", 5);
    }
    return buckets;
  };

  const data = {
    "1yr": { label: "1-Year · 2027", year: "2027", ...buildData("1yr") },
    "3yr": { label: "3-Year · 2029", year: "2029", ...buildData("3yr") },
    bag: { label: "BAG · 2038", year: "2038", ...buildData("bag") },
  };

  const avgFor = (horizon, tier) => {
    const arr = data[horizon][tier];
    if (!arr.length) return 0;
    return (arr.reduce((s, i) => s + i.score, 0) / arr.length).toFixed(1);
  };

  const horizonKeys = ["1yr", "3yr", "bag"];

  return (
    <div style={{
      padding: isMobile ? "20px 16px" : "28px 40px",
      maxWidth: isMobile ? "100%" : 900, margin: "0 auto",
    }}>
      <div style={breadcrumbStyle}>MIRROR 1 OF 3 · DIRECTION ALIGNMENT</div>
      <h1 style={h1Style(isMobile)}>Direction Alignment</h1>
      <p style={leadStyle}>
        You've built your ladder. Now score TODAY's reality against each horizon.
        The further the horizon, the bigger the gap should be — unless something's misaligned.
      </p>

      <InfoNote tone="gold">
        <strong style={{ color: T.gold }}>How to read this:</strong> Your 1-Year Non-negotiable average
        should be higher than your BAG Non-negotiable average — because 1-year is closer to today.
        If a far-horizon Non-negotiable scores higher than a near-horizon Non-negotiable, that IS the misalignment.
      </InfoNote>

      {isMobile ? (
        <div>
          <div style={{
            display: "flex", gap: 4, marginTop: 20, marginBottom: 14,
            padding: 4, background: "rgba(0,0,0,.3)", borderRadius: 24,
          }}>
            {horizonKeys.map(h => (
              <button key={h} onClick={() => setActiveHorizon(h)} style={{
                flex: 1, padding: "8px 10px", borderRadius: 20,
                background: activeHorizon === h ? T.gold : "transparent",
                color: activeHorizon === h ? T.bg : T.text2,
                border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              }}>{data[h].label.split("·")[0].trim()}</button>
            ))}
          </div>
          <HorizonAlignmentColumn horizon={data[activeHorizon]} avgFor={avgFor} horizonKey={activeHorizon} isMobile={isMobile} />
        </div>
      ) : (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 24,
        }}>
          {horizonKeys.map(h => (
            <HorizonAlignmentColumn key={h} horizon={data[h]} avgFor={avgFor} horizonKey={h} isMobile={isMobile} />
          ))}
        </div>
      )}

      <InfoNote tone="gold">
        <strong style={{ color: T.gold }}>Feeds into A2:</strong> these scores become the raw data for
        A2's Key Misalignment surfacing. The biggest gap between tier priority and actual score —
        especially Non-negotiable items at 1-year — is where the misalignment diagnosis starts.
      </InfoNote>
    </div>
  );
}

function HorizonAlignmentColumn({ horizon, avgFor, horizonKey, isMobile }) {
  return (
    <div style={{
      padding: isMobile ? "14px 16px" : "16px",
      background: "rgba(255,255,255,.03)",
      border: `1px solid ${T.border2}`, borderRadius: 8,
    }}>
      <div style={{
        fontFamily: T.serif, fontSize: isMobile ? 18 : 16, fontStyle: "italic",
        color: T.gold, marginBottom: 14, textAlign: "center",
      }}>{horizon.label}</div>
      {TIERS.map(tier => {
        const items = horizon[tier.id] || [];
        const avg = avgFor(horizonKey, tier.id);
        return (
          <CollapsibleTier
            key={tier.id}
            tier={tier}
            items={items}
            avg={avg}
          />
        );
      })}
    </div>
  );
}

// ─── Collapsible tier inside Direction Alignment column
// Non-negotiable opens by default; Important and Nice to have collapse by default
function CollapsibleTier({ tier, items, avg }) {
  const defaultOpen = tier.id === "non-neg";
  const [open, setOpen] = useState(defaultOpen);

  const avgColor = avg <= 4 ? T.red : avg <= 6 ? T.amber : T.green;

  return (
    <div style={{
      marginBottom: 12,
      background: `${tier.color}10`,
      border: `1px solid ${tier.color}40`,
      borderRadius: 6,
      overflow: "hidden",
    }}>
      {/* Clickable header row */}
      <div onClick={() => setOpen(!open)} style={{
        padding: "10px 12px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        cursor: "pointer", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase",
            color: tier.color, fontWeight: 700,
          }}>{tier.label}</span>
          <span style={{
            fontSize: 10, color: T.text3, fontWeight: 500,
          }}>{items.length} {items.length === 1 ? "item" : "items"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {items.length > 0 && (
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: avgColor,
              padding: "2px 8px", borderRadius: 10,
              background: `${avgColor}15`,
              border: `1px solid ${avgColor}40`,
            }}>avg {avg}</span>
          )}
          <span style={{
            fontSize: 14, color: T.text3,
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform .2s ease",
          }}>▾</span>
        </div>
      </div>

      {/* Expanded: per-item sliders */}
      {open && (
        <div style={{ padding: "0 12px 10px" }}>
          {items.length === 0 ? (
            <div style={{ fontSize: 11, color: T.text4, fontStyle: "italic" }}>—</div>
          ) : items.map((item, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{
                display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3,
              }}>
                <span style={{ color: T.text2 }}>{item.label}</span>
                <span style={{
                  color: item.score <= 4 ? T.red : item.score <= 6 ? T.amber : T.green,
                  fontWeight: 600,
                }}>{item.score}</span>
              </div>
              <div style={{ height: 3, background: T.bg2, borderRadius: 2 }}>
                <div style={{
                  height: 3, borderRadius: 2,
                  background: item.score <= 4 ? T.red : item.score <= 6 ? T.amber : T.green,
                  width: `${item.score * 10}%`,
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// A2 FUTURE SELF LETTER — pre-filled from BAG S/H/F
// ═══════════════════════════════════════════════════════════════════════════
function A2FutureSelfLetter({ state, setState, isMobile }) {
  const [sourcesOpen, setSourcesOpen] = useState(true);

  const regenerateFromBag = () => {
    const bag = state.bag;
    const letter = stitchLetterFromBag(bag);
    setState(s => ({ ...s, futureSelfLetter: letter }));
  };

  useEffect(() => {
    if (!state.futureSelfLetter) regenerateFromBag();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      padding: isMobile ? "20px 16px" : "28px 40px",
      maxWidth: isMobile ? "100%" : 820, margin: "0 auto",
    }}>
      <div style={breadcrumbStyle}>A2 · FUTURE SELF LETTER</div>
      <h1 style={h1Style(isMobile)}>Letter from Your 2038 Self</h1>
      <p style={leadStyle}>
        Your BAG self wrote to you. This letter is stitched from the See/Hear/Feel material you wrote on BAG —
        read it, edit it, expand it. The parts that don't ring true, rewrite. What's missing, add.
      </p>

      {/* Alignment review panel — collapsible */}
      <div style={{ marginTop: 20 }}>
        <AlignmentReviewPanel state={state} setState={setState} isMobile={isMobile} />
      </div>

      <div style={{
        marginTop: 8,
        display: isMobile ? "block" : "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 300px",
        gap: 20,
      }}>
        {/* Letter editor */}
        <div>
          <div style={{
            padding: "22px 26px",
            background: state.letterConfirmed
              ? "linear-gradient(135deg, rgba(74,222,128,.08), rgba(201,168,76,.04))"
              : "linear-gradient(135deg, rgba(201,168,76,.08), rgba(255,255,255,.02))",
            border: `1px solid ${state.letterConfirmed ? T.green : T.gold}`,
            borderRadius: 10,
            position: "relative",
          }}>
            {state.letterConfirmed && (
              <div style={{
                position: "absolute", top: -10, right: 14,
                background: T.green, color: T.bg,
                fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
                fontWeight: 700, padding: "2px 10px", borderRadius: 10,
              }}>✓ Confirmed letter</div>
            )}
            <div style={{
              fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
              color: state.letterConfirmed ? T.green : T.gold, fontWeight: 600, marginBottom: 14,
            }}>From my 2038 self · to me today</div>
            <textarea
              value={state.futureSelfLetter}
              onChange={e => setState(s => ({
                ...s,
                futureSelfLetter: e.target.value,
                letterConfirmed: false, // un-confirm on manual edit
              }))}
              rows={isMobile ? 20 : 24}
              style={{
                width: "100%", background: "transparent", border: "none", outline: "none",
                color: T.text, fontFamily: T.serif, fontSize: 16, lineHeight: 1.7,
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
            {!state.letterConfirmed && state.futureSelfLetter.trim() && (
              <button onClick={() => setState(s => ({ ...s, letterConfirmed: true }))} style={{
                padding: "10px 20px", borderRadius: 16,
                background: T.green, color: T.bg,
                border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700,
              }}>✓ Confirm letter</button>
            )}
            <button onClick={regenerateFromBag} style={{
              padding: "8px 14px", borderRadius: 14,
              background: "transparent", color: T.gold,
              border: `1px solid ${T.gold}`, cursor: "pointer",
              fontSize: 12, fontWeight: 600,
            }}>↻ Regenerate from BAG</button>
            <div style={{
              padding: "8px 14px", borderRadius: 14,
              background: "rgba(74,222,128,.1)", color: T.green,
              border: `1px solid ${T.green}40`, fontSize: 12, fontWeight: 500,
            }}>
              {state.letterConfirmed ? "✓ Confirmed" : "Saved"} · {state.futureSelfLetter.length} chars
            </div>
          </div>

          {/* Keep expanding prompt */}
          <div style={{
            marginTop: 18, padding: "14px 18px",
            background: "rgba(255,255,255,.03)",
            borderLeft: `2px solid ${T.gold}`, borderRadius: 4,
            fontSize: 14, color: T.text2, lineHeight: 1.6, fontStyle: "italic",
          }}>
            What else does your 2038 self want your current self to know?
            Add it to the letter above — anywhere that feels right.
          </div>
        </div>

        {/* Source panel */}
        {!isMobile && (
          <aside style={{
            padding: "18px 20px", background: "rgba(255,255,255,.02)",
            border: `1px solid ${T.border2}`, borderRadius: 10,
            alignSelf: "start", position: "sticky", top: 88,
          }}>
            <div onClick={() => setSourcesOpen(!sourcesOpen)} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              cursor: "pointer", marginBottom: sourcesOpen ? 14 : 0,
            }}>
              <div style={{
                fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
                color: T.gold, fontWeight: 600,
              }}>Pulled from your BAG</div>
              <span style={{ color: T.text3, fontSize: 12 }}>{sourcesOpen ? "▾" : "▸"}</span>
            </div>
            {sourcesOpen && (
              <div>
                <SourceFragment segment="Time" color={T.timeColor}
                  see={state.bag.timeSeeHearFeel.see}
                  hear={state.bag.timeSeeHearFeel.hear}
                  feel={state.bag.timeSeeHearFeel.feel}
                />
                <SourceFragment segment="Wealth" color={T.wealthColor}
                  see={state.bag.wealthSeeHearFeel.see}
                  hear={state.bag.wealthSeeHearFeel.hear}
                  feel={state.bag.wealthSeeHearFeel.feel}
                />
                <SourceFragment segment="Growth" color={T.growthColor}
                  see={state.bag.growthSeeHearFeel.see}
                  hear={state.bag.growthSeeHearFeel.hear}
                  feel={state.bag.growthSeeHearFeel.feel}
                />
              </div>
            )}
          </aside>
        )}
      </div>

      {isMobile && (
        <div style={{
          marginTop: 18, padding: "14px 18px",
          background: "rgba(255,255,255,.02)",
          border: `1px solid ${T.border2}`, borderRadius: 10,
        }}>
          <div style={{
            fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
            color: T.gold, fontWeight: 600, marginBottom: 14,
          }}>Pulled from your BAG</div>
          <SourceFragment segment="Time" color={T.timeColor}
            see={state.bag.timeSeeHearFeel.see}
            hear={state.bag.timeSeeHearFeel.hear}
            feel={state.bag.timeSeeHearFeel.feel}
          />
          <SourceFragment segment="Wealth" color={T.wealthColor}
            see={state.bag.wealthSeeHearFeel.see}
            hear={state.bag.wealthSeeHearFeel.hear}
            feel={state.bag.wealthSeeHearFeel.feel}
          />
          <SourceFragment segment="Growth" color={T.growthColor}
            see={state.bag.growthSeeHearFeel.see}
            hear={state.bag.growthSeeHearFeel.hear}
            feel={state.bag.growthSeeHearFeel.feel}
          />
        </div>
      )}
    </div>
  );
}

function SourceFragment({ segment, color, see, hear, feel }) {
  return (
    <div style={{
      padding: "10px 12px", marginBottom: 10,
      background: "rgba(0,0,0,.2)",
      borderLeft: `3px solid ${color}`, borderRadius: 4,
    }}>
      <div style={{
        fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase",
        color, fontWeight: 600, marginBottom: 6,
      }}>{segment}</div>
      <div style={{ fontSize: 11, color: T.text2, lineHeight: 1.5, marginBottom: 4 }}>
        <span style={{ color: T.text3 }}>See: </span>{see || "—"}
      </div>
      <div style={{ fontSize: 11, color: T.text2, lineHeight: 1.5, marginBottom: 4 }}>
        <span style={{ color: T.text3 }}>Hear: </span>{hear || "—"}
      </div>
      <div style={{ fontSize: 11, color: T.text2, lineHeight: 1.5 }}>
        <span style={{ color: T.text3 }}>Feel: </span>{feel || "—"}
      </div>
    </div>
  );
}

function stitchLetterFromBag(bag) {
  const t = bag.timeSeeHearFeel || {};
  const w = bag.wealthSeeHearFeel || {};
  const g = bag.growthSeeHearFeel || {};
  return `Dear me —

It's 2038. I'm writing to you from the other side of everything you're building right now. I want you to know: you made it.

When I look around, here's what I see: ${t.see || "[your vision]"} ${w.see ? `And — ${w.see}` : ""} ${g.see ? g.see : ""}

I hear voices that matter. ${t.hear || ""} ${w.hear || ""} ${g.hear ? g.hear : ""}

And I feel — this is the part I want you to hold onto — ${t.feel || "[the feeling]"} ${w.feel ? `and ${w.feel.toLowerCase()}` : ""} ${g.feel ? `Most of all, ${g.feel.toLowerCase()}` : ""}

${bag.growthSentence ? `You become the person who is: ${bag.growthSentence}` : ""}

The work you're doing right now — it matters. Every hour you spend getting closer to this is an hour spent right. Keep going.

With love from your future,
2038-you`;
}

// ═══════════════════════════════════════════════════════════════════════════
// TIER RANKING SECTION (reused)
// ═══════════════════════════════════════════════════════════════════════════
const NON_NEG_CAP = 3;

function TierRankingSection({ items, tiers, setTiers, horizonLabel, isMobile, confirmed, onConfirmed }) {
  const [openPill, setOpenPill] = useState(null);
  const [capWarning, setCapWarning] = useState(false);
  // Local user-override for open/closed (null = follow auto-rule)
  const [userState, setUserState] = useState(null);

  const byTier = useMemo(() => {
    const g = { "non-neg": [], imp: [], nth: [] };
    items.forEach(i => {
      const t = tiers[i.id] || "nth";
      g[t].push(i);
    });
    return g;
  }, [items, tiers]);

  const nonNegCount = byTier["non-neg"].length;
  const nonNegFull = nonNegCount >= NON_NEG_CAP;
  const hasAnyRanking = nonNegCount > 0 || byTier.imp.length > 0;

  // Auto-rule: open unless confirmed, then closed
  const autoOpen = !confirmed;
  const isOpen = userState === null ? autoOpen : userState;
  const toggle = () => setUserState(!isOpen);

  const setTier = (itemId, tierId) => {
    const currentTier = tiers[itemId] || "nth";
    if (tierId === "non-neg" && currentTier !== "non-neg" && nonNegFull) {
      setCapWarning(true);
      setTimeout(() => setCapWarning(false), 2500);
      setOpenPill(null);
      return;
    }
    setTiers(prev => ({ ...prev, [itemId]: tierId }));
    setOpenPill(null);
  };

  return (
    <div style={{
      marginTop: 36, marginBottom: 14,
      background: "rgba(201,168,76,.08)",
      borderRadius: 8, borderLeft: `4px solid ${T.gold}`,
      overflow: "hidden",
      transition: "all .2s ease",
    }}>
      {/* Collapsible header */}
      <div onClick={toggle} style={{
        padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        cursor: "pointer", gap: 10,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          flex: 1, minWidth: 0,
        }}>
          <div style={{
            fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.text,
            flexShrink: 0,
          }}>📊 Rank your priorities</div>
          <div style={{
            fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase",
            fontWeight: 600, padding: "2px 8px", borderRadius: 10,
            background: confirmed ? `${T.green}20` : `${T.gold}15`,
            color: confirmed ? T.green : T.gold,
            border: `1px solid ${confirmed ? T.green : T.gold}40`,
            flexShrink: 0,
          }}>{confirmed ? "✓ Confirmed" : hasAnyRanking ? "In progress" : "Not started"}</div>
        </div>
        <div style={{
          fontSize: 18, color: T.text3,
          transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "transform .2s ease",
          flexShrink: 0,
        }}>▾</div>
      </div>

      {/* Collapsed: show compact ranking summary */}
      {!isOpen && (
        <div style={{ padding: "0 16px 14px" }}>
          {/* Show Non-negotiable items as pills */}
          <div style={{
            padding: "10px 14px",
            background: "rgba(0,0,0,.2)",
            borderRadius: 6,
          }}>
            <div style={{
              fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
              color: T.red, fontWeight: 700, marginBottom: 8,
            }}>Non-negotiable · {nonNegCount}/{NON_NEG_CAP}</div>
            {byTier["non-neg"].length === 0 ? (
              <div style={{ fontSize: 12, color: T.text4, fontStyle: "italic" }}>
                — none yet —
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {byTier["non-neg"].map(item => (
                  <div key={item.id} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 10px", borderRadius: 12,
                    background: "rgba(0,0,0,.3)",
                    borderLeft: `3px solid ${segColor(item.segment)}`,
                    fontSize: 12, color: T.text,
                  }}>
                    {item.icon && <span>{item.icon}</span>}
                    {item.label}
                  </div>
                ))}
              </div>
            )}
            <div style={{
              marginTop: 10, fontSize: 11, color: T.text3,
              display: "flex", gap: 14, flexWrap: "wrap",
            }}>
              <span>{byTier.imp.length} Important</span>
              <span>{byTier.nth.length} Nice to have</span>
            </div>
          </div>
          <div style={{
            fontSize: 11, color: T.text3, fontStyle: "italic",
            marginTop: 6, textAlign: "center",
          }}>Click above to expand and edit.</div>
        </div>
      )}

      {/* Open: full ranking UI */}
      {isOpen && (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{
            padding: isMobile ? "14px 16px" : "18px 20px",
            background: "rgba(255,255,255,.03)",
            border: `1px solid ${T.border2}`, borderRadius: 10,
          }}>
            <div style={{
              fontSize: 12, color: T.text3, fontStyle: "italic", marginBottom: 4,
            }}>What matters MOST for {horizonLabel}? Tap each to assign a tier.</div>

            <div style={{
              marginTop: 10, padding: "8px 12px",
              background: nonNegFull ? "rgba(248,113,113,.08)" : "rgba(201,168,76,.05)",
              borderLeft: `2px solid ${nonNegFull ? T.amber : T.gold}`,
              borderRadius: 4,
              fontSize: 12, color: T.text2, lineHeight: 1.5,
            }}>
              <strong style={{ color: T.gold }}>Rule:</strong> Non-negotiable is capped at {NON_NEG_CAP} items — only three
              things can truly be non-negotiable for this horizon. Currently: <strong style={{
                color: nonNegFull ? T.amber : T.green,
              }}>{nonNegCount}/{NON_NEG_CAP}</strong>.
              {nonNegFull && " To pick a different Non-negotiable, move one of your current three to Important first."}
            </div>

            {capWarning && (
              <div style={{
                marginTop: 10, padding: "10px 14px",
                background: "rgba(248,113,113,.15)",
                border: `1px solid ${T.red}`, borderRadius: 6,
                fontSize: 13, color: T.text, lineHeight: 1.5,
              }}>
                You've already got 3 Non-negotiables. Move one to Important first, then try again.
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              {items.map(item => {
                const currentTier = tiers[item.id] || "nth";
                const tierObj = TIERS.find(t => t.id === currentTier);
                const isPillOpen = openPill === item.id;
                return (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px 8px 12px", marginBottom: 4,
                    background: "rgba(0,0,0,.2)",
                    borderLeft: `3px solid ${segColor(item.segment)}`,
                    borderRadius: 4, flexWrap: isMobile ? "wrap" : "nowrap",
                  }}>
                    <div style={{
                      fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase",
                      color: segColor(item.segment), fontWeight: 600,
                      width: isMobile ? "auto" : 60, flexShrink: 0,
                    }}>{item.segment}</div>
                    <div style={{ flex: 1, fontSize: 13, color: T.text, minWidth: 0 }}>
                      {item.icon && <span style={{ marginRight: 6 }}>{item.icon}</span>}
                      {item.label}
                      {item.suggested && (
                        <span style={{
                          fontSize: 9, marginLeft: 6, color: T.gold,
                          padding: "1px 6px", borderRadius: 4,
                          background: "rgba(201,168,76,.1)", border: `1px solid ${T.border}`,
                        }}>FROM INNER WORK</span>
                      )}
                    </div>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <button onClick={() => setOpenPill(isPillOpen ? null : item.id)} style={{
                        padding: "5px 12px", borderRadius: 12,
                        background: `${tierObj.color}20`, color: tierObj.color,
                        border: `1px solid ${tierObj.color}60`,
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: T.sans, display: "flex", alignItems: "center", gap: 6,
                        minHeight: 28,
                      }}>{tierObj.label}<span style={{ fontSize: 9 }}>▾</span></button>
                      {isPillOpen && (
                        <div style={{
                          position: "absolute", top: "calc(100% + 4px)", right: 0,
                          background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6,
                          minWidth: 160, zIndex: 20, boxShadow: "0 8px 20px rgba(0,0,0,.4)",
                        }}>
                          {TIERS.map(t => {
                            const isDisabled = t.id === "non-neg"
                              && currentTier !== "non-neg"
                              && nonNegFull;
                            return (
                              <div key={t.id}
                                onClick={() => !isDisabled && setTier(item.id, t.id)}
                                title={isDisabled ? `${NON_NEG_CAP}/${NON_NEG_CAP} Non-negotiables used` : undefined}
                                style={{
                                  padding: "8px 12px", fontSize: 12,
                                  color: isDisabled ? T.text4 : t.color,
                                  cursor: isDisabled ? "not-allowed" : "pointer",
                                  borderBottom: `1px solid ${T.border2}`,
                                  background: currentTier === t.id ? "rgba(255,255,255,.05)" : "transparent",
                                  opacity: isDisabled ? 0.5 : 1,
                                  display: "flex", justifyContent: "space-between", alignItems: "center",
                                }}>
                                <span>{t.label}</span>
                                {t.id === "non-neg" && (
                                  <span style={{
                                    fontSize: 10, color: isDisabled ? T.red : T.text3,
                                    fontWeight: 600,
                                  }}>{nonNegCount}/{NON_NEG_CAP}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{
              fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
              color: T.text3, fontWeight: 600, marginBottom: 10, textAlign: "center",
            }}>Your ranking for {horizonLabel}</div>
            {TIERS.map(tier => {
              const itemsInTier = byTier[tier.id];
              const isNonNeg = tier.id === "non-neg";
              const atCap = isNonNeg && itemsInTier.length === NON_NEG_CAP;
              return (
                <div key={tier.id} style={{
                  marginBottom: 10, padding: "12px 14px",
                  background: `${tier.color}10`,
                  border: `1px solid ${atCap ? tier.color : `${tier.color}40`}`,
                  borderRadius: 8,
                  boxShadow: atCap ? `0 0 0 1px ${tier.color}40` : "none",
                }}>
                  <div style={{
                    fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
                    color: tier.color, fontWeight: 700, marginBottom: 8,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span>
                      {tier.label}
                      {atCap && <span style={{ marginLeft: 8, fontSize: 9, color: T.green }}>✓ FULL</span>}
                    </span>
                    <span style={{ color: T.text3, fontWeight: 500 }}>
                      {isNonNeg
                        ? `${itemsInTier.length}/${NON_NEG_CAP}`
                        : `${itemsInTier.length} items`}
                    </span>
                  </div>
                  {itemsInTier.length === 0 ? (
                    <div style={{ fontSize: 12, color: T.text4, fontStyle: "italic" }}>
                      {isNonNeg
                        ? `— pick your top ${NON_NEG_CAP} only —`
                        : "— nothing here —"}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {itemsInTier.map(item => (
                        <div key={item.id} style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "4px 10px", borderRadius: 12,
                          background: "rgba(0,0,0,.25)",
                          borderLeft: `3px solid ${segColor(item.segment)}`,
                          fontSize: 12, color: T.text,
                        }}>
                          {item.icon && <span>{item.icon}</span>}
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Confirm ranking button */}
          {!confirmed && hasAnyRanking && onConfirmed && (
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button onClick={onConfirmed} style={{
                padding: "10px 22px", borderRadius: 16,
                background: T.green, color: T.bg,
                border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700,
              }}>✓ Confirm my ranking</button>
              <div style={{
                fontSize: 11, color: T.text3, fontStyle: "italic", marginTop: 8,
              }}>Once you confirm, this section collapses to a compact view. You can expand and change it anytime.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INSERTION MAP (unchanged content, lighter)
// ═══════════════════════════════════════════════════════════════════════════
function InsertionMap({ isMobile }) {
  const rows = [
    { step: 1, name: "Purpose", status: "existing", note: "No change." },
    { step: 2, name: "Direction · BAG", status: "modified",
      note: "Wealth uses card-picker like Time (with Add your own). Per-priority S/H/F removed, replaced with ONE overall S/H/F per segment (Time/Wealth/Growth). No top 'In one sentence...' field anywhere — summary lives ONLY at the bottom of each segment via the Summary Generator (generates draft → user edits → Confirm → becomes segment summary). Tier ranking at bottom with Non-negotiable capped at 3." },
    { step: 3, name: "Direction · 3-Year", status: "NEW",
      note: "Pre-fills Time/Wealth categories from BAG. Simple text box per item (no per-item summarise button). ONE segment-level summariser at the bottom of each segment. Growth = one-sentence with manual Confirm button. Tier ranking at bottom." },
    { step: 4, name: "Identity · Superpowers", status: "existing", note: "No change." },
    { step: 5, name: "Values · Behaviors", status: "existing", note: "No change." },
    { step: 6, name: "Identity & Values Alignment", status: "trimmed",
      note: "Keeps Identity (capability sliders) + Values (behavior sliders) only. The three old 'See My Key Misalignment' outputs already removed. Lowest-scoring items flow directly to 1-Year Growth suggestions." },
    { step: 7, name: "Direction · 1-Year", status: "NEW",
      note: "Pre-fills from 3-Year. Simple text box per Time/Wealth item, segment-level summariser at end. Growth section shows Identity/Values suggestions with Accept / Edit wording / Remove per item + Add your own Growth focus + manual one-sentence Growth field with Confirm. Tier ranking at bottom." },
    { step: 8, name: "Direction Alignment", status: "NEW",
      note: "Sliders score TODAY against each of BAG/3-Year/1-Year tiers. Final A1 scoring page. Feeds A2's Misalignment." },
    { step: 9, name: "My Map of Me", status: "modified",
      note: "Synthesis includes three-horizon ladder + tier rankings + identity/values lowest scores and where they flowed. Needs its own prototype round." },
    { step: "A2", name: "Future Self Letter (A2)", status: "NEW",
      note: "Pre-filled from BAG's three See/Hear/Feel blocks. Collapsible Alignment Review Panel at top lets user re-score Identity/Values inline — changes sync back to A1. Regenerate from BAG button. Confirm letter button at bottom with green confirmed badge. Letter only draws from BAG (not 3-Year or 1-Year)." },
  ];
  const statusColor = (s) => s === "NEW" ? T.gold : s === "modified" ? T.amber : s === "trimmed" ? T.amber : T.green;

  return (
    <div style={{
      padding: isMobile ? "20px 16px" : "28px 40px",
      maxWidth: isMobile ? "100%" : 900, margin: "0 auto",
    }}>
      <div style={breadcrumbStyle}>INSERTION MAP</div>
      <h1 style={h1Style(isMobile)}>Where Each Piece Slots In</h1>
      <p style={leadStyle}>
        The new A1 has 9 pages (vs 6 today). <strong style={{ color: T.green }}>Green</strong> = no change.
        <strong style={{ color: T.amber }}> Amber</strong> = modified. <strong style={{ color: T.gold }}>Gold</strong> = new page.
      </p>
      <div style={{ marginTop: 24 }}>
        {rows.map(r => (
          <div key={r.step} style={{
            display: "flex", gap: 14, padding: "14px 16px", marginBottom: 8,
            background: "rgba(255,255,255,.03)", border: `1px solid ${T.border2}`,
            borderLeft: `4px solid ${statusColor(r.status)}`, borderRadius: 6,
            flexWrap: isMobile ? "wrap" : "nowrap",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 18,
              background: `${statusColor(r.status)}20`, color: statusColor(r.status),
              display: "grid", placeItems: "center", flexShrink: 0, fontWeight: 700, fontSize: 14,
            }}>{r.step}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                <div style={{
                  fontFamily: T.serif, fontSize: 17, fontWeight: 500, color: T.text,
                }}>{r.name}</div>
                <div style={{
                  fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase",
                  color: statusColor(r.status), fontWeight: 700,
                  padding: "2px 8px", borderRadius: 4,
                  background: `${statusColor(r.status)}15`, border: `1px solid ${statusColor(r.status)}40`,
                }}>{r.status}</div>
              </div>
              <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.5 }}>{r.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
function SegmentHeader({ icon, title, color }) {
  return (
    <div style={{
      marginTop: 36, marginBottom: 14,
      padding: "12px 16px",
      background: `${color}10`, borderRadius: 8,
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{
        fontFamily: T.serif, fontSize: 22, fontWeight: 500, color: T.text,
      }}>{icon} {title}</div>
    </div>
  );
}

// ─── CollapsibleSegment — wraps Time/Wealth/Growth section content
// Auto-collapses when confirmed, but user can expand again
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

function SubLabel({ children }) {
  return (
    <div style={{ fontSize: 12, color: T.text3, fontStyle: "italic", marginBottom: 10, marginTop: 14 }}>
      {children}
    </div>
  );
}

function SectionHeaderInline({ title, subtitle }) {
  return (
    <div>
      <div style={{ fontFamily: T.serif, fontSize: 18, color: T.text, fontWeight: 500 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: T.text3, fontStyle: "italic", marginTop: 2 }}>
        {subtitle}
      </div>}
    </div>
  );
}

function LabeledField({ label, emoji, value, onChange, placeholder, multiline, featured, confirmed }) {
  return (
    <div style={{
      marginBottom: 20, padding: "14px 16px",
      background: confirmed
        ? "linear-gradient(135deg, rgba(74,222,128,.08), rgba(201,168,76,.04))"
        : featured
          ? "linear-gradient(135deg, rgba(201,168,76,.08), rgba(255,255,255,.02))"
          : "rgba(255,255,255,.03)",
      border: `1px solid ${confirmed ? T.green : value.trim() ? T.gold : T.border2}`,
      borderRadius: 8,
      position: "relative",
    }}>
      {confirmed && (
        <div style={{
          position: "absolute", top: -10, right: 14,
          background: T.green, color: T.bg,
          fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
          fontWeight: 700, padding: "2px 10px", borderRadius: 10,
        }}>✓ Confirmed summary</div>
      )}
      <div style={{
        fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase",
        color: confirmed ? T.green : T.gold, fontWeight: 600, marginBottom: 8,
      }}>{emoji && <span style={{ marginRight: 6 }}>{emoji}</span>}{label}</div>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} rows={3}
          style={{
            width: "100%", background: "transparent", border: "none", outline: "none",
            color: T.text, fontFamily: T.serif, fontSize: 16, lineHeight: 1.5, resize: "none",
          }} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%", background: "transparent", border: "none", outline: "none",
            color: T.text, fontFamily: T.sans, fontSize: 14,
          }} />
      )}
    </div>
  );
}

function CardPicker({ cards, picked, onToggle, color }) {
  const [customText, setCustomText] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
      {cards.map(c => {
        const isPicked = picked.includes(c.id);
        return (
          <div key={c.id} onClick={() => onToggle(c.id)} style={{
            padding: "8px 14px", borderRadius: 18,
            background: isPicked ? `${color}20` : "rgba(255,255,255,.03)",
            color: isPicked ? color : T.text2,
            border: `1px solid ${isPicked ? color : T.border2}`,
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            {c.icon && <span>{c.icon}</span>}
            {c.label}
            {isPicked && (
              <span style={{
                fontSize: 10, background: color, color: T.bg,
                borderRadius: 8, padding: "1px 6px", fontWeight: 700,
                marginLeft: 2,
              }}>✓</span>
            )}
          </div>
        );
      })}
      {addingCustom ? (
        <input autoFocus value={customText}
          onChange={e => setCustomText(e.target.value)}
          onBlur={() => { setAddingCustom(false); setCustomText(""); }}
          onKeyDown={e => {
            if (e.key === "Enter" && customText.trim()) {
              // For prototype demo we don't persist custom; visual only
              setAddingCustom(false); setCustomText("");
            } else if (e.key === "Escape") {
              setAddingCustom(false); setCustomText("");
            }
          }}
          placeholder="Type and press Enter..."
          style={{
            padding: "8px 14px", borderRadius: 18,
            background: "transparent", color: T.text,
            border: `1px dashed ${color}`, fontSize: 13,
            fontFamily: T.sans, outline: "none", minWidth: 180,
          }} />
      ) : (
        <div onClick={() => setAddingCustom(true)} style={{
          padding: "8px 14px", borderRadius: 18,
          background: "transparent", color: T.text3,
          border: `1px dashed ${T.border2}`,
          fontSize: 13, cursor: "pointer",
        }}>+ Add your own</div>
      )}
    </div>
  );
}

function PriorityItemCard({ icon, label, color, text, goal, promptText, onTextChange, onGoalChange }) {
  const [summarising, setSummarising] = useState(false);
  const summarise = () => {
    setSummarising(true);
    // Simulated AI summarisation
    setTimeout(() => {
      const first = (text || "").split(/[.!?]/)[0].trim();
      onGoalChange(first ? `${first}.` : "Goal will be generated from your writing above.");
      setSummarising(false);
    }, 600);
  };
  return (
    <div style={{
      marginBottom: 14, padding: "16px 18px",
      background: "rgba(255,255,255,.03)",
      border: `1px solid ${T.border2}`, borderLeft: `3px solid ${color}`,
      borderRadius: 8,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
      }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <div style={{
          fontFamily: T.serif, fontSize: 19, fontWeight: 500, color: T.text,
        }}>{label}</div>
      </div>
      <div style={{
        fontSize: 12, color: T.text3, fontStyle: "italic", marginBottom: 8,
      }}>{promptText}</div>
      <textarea value={text} onChange={e => onTextChange(e.target.value)}
        placeholder="Write freely here..." rows={3}
        style={{
          width: "100%", background: "rgba(0,0,0,.2)",
          border: `1px solid ${T.border2}`, borderRadius: 4,
          padding: "10px 12px", color: T.text,
          fontFamily: T.serif, fontSize: 15, lineHeight: 1.6,
          resize: "vertical", outline: "none",
        }} />

      <div style={{
        display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap",
        alignItems: "center",
      }}>
        <button onClick={summarise} disabled={!text.trim() || summarising} style={{
          padding: "6px 14px", borderRadius: 14,
          background: "transparent",
          color: text.trim() ? T.gold : T.text4,
          border: `1px solid ${text.trim() ? T.gold : T.border2}`,
          cursor: text.trim() ? "pointer" : "default",
          fontSize: 12, fontWeight: 600,
        }}>{summarising ? "..." : "✨ Summarise into a goal"}</button>
        {goal && (
          <div style={{
            flex: 1, minWidth: 200,
            padding: "6px 10px", borderRadius: 6,
            background: `${color}15`, color: T.text,
            fontSize: 13, fontStyle: "italic",
          }}>
            <span style={{
              fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase",
              color, fontWeight: 600, marginRight: 8,
            }}>GOAL</span>
            {goal}
          </div>
        )}
      </div>
    </div>
  );
}

function PriorityItemCardCompact({ icon, label, color, text, goal, promptText, onTextChange, onGoalChange }) {
  const [summarising, setSummarising] = useState(false);
  const summarise = () => {
    setSummarising(true);
    setTimeout(() => {
      const first = (text || "").split(/[.!?]/)[0].trim();
      onGoalChange(first ? `${first}.` : "Goal will be generated from your writing above.");
      setSummarising(false);
    }, 600);
  };
  return (
    <div style={{
      marginBottom: 10, padding: "12px 14px",
      background: "rgba(255,255,255,.02)",
      borderLeft: `3px solid ${color}`, borderRadius: 6,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
      }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <div style={{
          fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: T.text,
        }}>{label}</div>
      </div>
      <input value={text} onChange={e => onTextChange(e.target.value)}
        placeholder={promptText}
        style={{
          width: "100%", background: "rgba(0,0,0,.2)",
          border: `1px solid ${T.border2}`, borderRadius: 4,
          padding: "8px 10px", color: T.text,
          fontFamily: T.serif, fontSize: 14, outline: "none",
        }} />
      <div style={{
        display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center",
      }}>
        <button onClick={summarise} disabled={!text.trim() || summarising} style={{
          padding: "4px 10px", borderRadius: 10,
          background: "transparent",
          color: text.trim() ? T.gold : T.text4,
          border: `1px solid ${text.trim() ? T.gold : T.border2}`,
          cursor: text.trim() ? "pointer" : "default",
          fontSize: 11, fontWeight: 600,
        }}>{summarising ? "..." : "✨ Summarise"}</button>
        {goal && (
          <div style={{
            flex: 1, minWidth: 180, padding: "4px 8px", borderRadius: 4,
            background: `${color}15`, fontSize: 12, fontStyle: "italic", color: T.text,
          }}>{goal}</div>
        )}
      </div>
    </div>
  );
}

function SeeHearFeelBlock({ title, subtitle, color, values, onChange }) {
  return (
    <div style={{
      marginTop: 20, marginBottom: 14,
      padding: "18px 20px",
      background: `linear-gradient(135deg, ${color}10, rgba(255,255,255,.02))`,
      border: `1px solid ${color}40`, borderRadius: 10,
    }}>
      <div style={{
        fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
        color, fontWeight: 700, marginBottom: 4,
      }}>{title}</div>
      <div style={{
        fontSize: 12, color: T.text3, fontStyle: "italic", marginBottom: 14,
      }}>{subtitle}</div>

      <SHFField label="👁 I will see..."
        placeholder="The scenes, people, spaces..."
        value={values.see}
        onChange={v => onChange("see", v)} />
      <SHFField label="👂 I will hear..."
        placeholder="The words, sounds, conversations..."
        value={values.hear}
        onChange={v => onChange("hear", v)} />
      <SHFField label="❤ I will feel..."
        placeholder="The emotions, energy, sense of self..."
        value={values.feel}
        onChange={v => onChange("feel", v)} />
    </div>
  );
}

function SHFField({ label, placeholder, value, onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: 11, color: T.gold, fontWeight: 600, marginBottom: 4,
      }}>{label}</div>
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={2}
        style={{
          width: "100%", background: "rgba(0,0,0,.2)",
          border: `1px solid ${T.border2}`, borderRadius: 4,
          padding: "8px 10px", color: T.text,
          fontFamily: T.serif, fontSize: 14, lineHeight: 1.5,
          resize: "vertical", outline: "none",
        }} />
    </div>
  );
}

// ─── Summary Generator — AI drafts one sentence from all section content,
// user edits, confirms → fills the segment-level sentence
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

// ─── SimpleItemCard — for 3yr and 1yr: text box per item + per-item summarise into goal
function SimpleItemCard({ icon, label, color, text, goal, promptText, onTextChange, onGoalChange }) {
  const [summarising, setSummarising] = useState(false);
  const summarise = () => {
    if (!text.trim()) return;
    setSummarising(true);
    setTimeout(() => {
      const first = (text || "").split(/[.!?]/)[0].trim();
      onGoalChange(first ? `${first}.` : "");
      setSummarising(false);
    }, 600);
  };
  return (
    <div style={{
      marginBottom: 10, padding: "12px 14px",
      background: "rgba(255,255,255,.02)",
      borderLeft: `3px solid ${color}`, borderRadius: 6,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
      }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <div style={{
          fontFamily: T.serif, fontSize: 16, fontWeight: 500, color: T.text,
        }}>{label}</div>
      </div>
      <textarea value={text} onChange={e => onTextChange(e.target.value)}
        placeholder={promptText} rows={2}
        style={{
          width: "100%", background: "rgba(0,0,0,.2)",
          border: `1px solid ${T.border2}`, borderRadius: 4,
          padding: "8px 10px", color: T.text,
          fontFamily: T.serif, fontSize: 14, outline: "none",
          resize: "vertical", lineHeight: 1.5,
        }} />
      <div style={{
        display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center",
      }}>
        <button onClick={summarise} disabled={!text.trim() || summarising} style={{
          padding: "5px 12px", borderRadius: 12,
          background: "transparent",
          color: text.trim() ? color : T.text4,
          border: `1px solid ${text.trim() ? color : T.border2}`,
          cursor: text.trim() ? "pointer" : "default",
          fontSize: 11, fontWeight: 600,
        }}>{summarising ? "..." : "✨ Summarise into a goal"}</button>
        {goal && (
          <div style={{
            flex: 1, minWidth: 180,
            padding: "4px 10px", borderRadius: 6,
            background: `${color}15`, color: T.text,
            fontSize: 12, fontStyle: "italic",
          }}>
            <span style={{
              fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase",
              color, fontWeight: 600, marginRight: 6,
            }}>GOAL</span>
            {goal}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SimpleSentenceField — for Growth on 3yr/1yr: one sentence with manual Confirm
function SimpleSentenceField({ color, value, onChange, placeholder, label, confirmed, onConfirm }) {
  return (
    <div style={{
      marginTop: 10, marginBottom: 20,
      padding: "14px 16px",
      background: confirmed
        ? "linear-gradient(135deg, rgba(74,222,128,.08), rgba(201,168,76,.04))"
        : "rgba(255,255,255,.03)",
      border: `1px solid ${confirmed ? T.green : value.trim() ? color : T.border2}`,
      borderRadius: 8,
      position: "relative",
    }}>
      {confirmed && (
        <div style={{
          position: "absolute", top: -10, right: 14,
          background: T.green, color: T.bg,
          fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
          fontWeight: 700, padding: "2px 10px", borderRadius: 10,
        }}>✓ Confirmed</div>
      )}
      {label && (
        <div style={{
          fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase",
          color: confirmed ? T.green : color, fontWeight: 600, marginBottom: 8,
        }}>{label}</div>
      )}
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={3}
        style={{
          width: "100%", background: "transparent", border: "none", outline: "none",
          color: T.text, fontFamily: T.serif, fontSize: 16, lineHeight: 1.5, resize: "none",
        }} />
      {!confirmed && value.trim() && (
        <button onClick={onConfirm} style={{
          marginTop: 8, padding: "6px 14px", borderRadius: 14,
          background: color, color: T.bg,
          border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 700,
        }}>✓ Confirm</button>
      )}
    </div>
  );
}

// ─── GrowthSuggestionsV2 — Accept / Edit / Remove each suggestion
function GrowthSuggestionsV2({ accepted, setAccepted, otherText, setOtherText, isMobile }) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [editedLabels, setEditedLabels] = useState(
    Object.fromEntries(IDENTITY_VALUES_SEEDS.map(s => [s.id, s.label]))
  );
  const [removed, setRemoved] = useState({});
  const [customItems, setCustomItems] = useState([]);
  const [newCustom, setNewCustom] = useState("");

  const saveEdit = (idx, id) => {
    setEditingIdx(null);
  };

  const removeItem = (id) => {
    setRemoved(r => ({ ...r, [id]: true }));
  };

  const addCustom = () => {
    if (!newCustom.trim()) return;
    setCustomItems(c => [...c, { id: `custom_${Date.now()}`, label: newCustom.trim() }]);
    setNewCustom("");
  };

  return (
    <div style={{
      marginTop: 14, padding: isMobile ? "14px 16px" : "18px 20px",
      background: "linear-gradient(135deg, rgba(201,168,76,.12), rgba(245,158,11,.05))",
      border: `1px solid ${T.gold}`, borderRadius: 10, marginBottom: 16,
    }}>
      <div style={{
        fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
        color: T.gold, fontWeight: 600, marginBottom: 4,
      }}>Growth suggestions from your inner work</div>
      <div style={{ fontSize: 13, color: T.text2, marginBottom: 14, lineHeight: 1.5 }}>
        Lowest-scoring items from your Identity &amp; Values alignment. Accept, edit the wording, or remove any that don't fit.
        Accepted items flow into your tier ranking below.
      </div>

      {IDENTITY_VALUES_SEEDS.map((s, i) => {
        if (removed[s.id]) return null;
        const isEditing = editingIdx === i;
        const isAccepted = accepted[i];
        return (
          <div key={s.id} style={{
            padding: "10px 12px", marginBottom: 8,
            background: isAccepted ? "rgba(201,168,76,.12)" : "rgba(255,255,255,.02)",
            border: `1px ${isAccepted ? "solid" : "dashed"} ${T.gold}`,
            borderRadius: 6,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div onClick={() => setAccepted(accepted.map((v, j) => j === i ? !v : v))}
                style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                  background: isAccepted ? T.gold : "transparent",
                  border: `1px solid ${T.gold}`,
                  display: "grid", placeItems: "center", cursor: "pointer",
                  color: T.bg, fontWeight: 700, fontSize: 12,
                }}>{isAccepted && "✓"}</div>

              <div style={{ flex: 1, minWidth: 180 }}>
                {isEditing ? (
                  <input autoFocus
                    value={editedLabels[s.id]}
                    onChange={e => setEditedLabels(l => ({ ...l, [s.id]: e.target.value }))}
                    onBlur={() => saveEdit(i, s.id)}
                    onKeyDown={e => {
                      if (e.key === "Enter") saveEdit(i, s.id);
                      if (e.key === "Escape") { setEditedLabels(l => ({ ...l, [s.id]: s.label })); setEditingIdx(null); }
                    }}
                    style={{
                      width: "100%", background: "rgba(0,0,0,.3)",
                      border: `1px solid ${T.gold}`, borderRadius: 4,
                      padding: "4px 8px", color: T.text,
                      fontSize: 14, fontFamily: T.sans, outline: "none",
                    }} />
                ) : (
                  <>
                    <div style={{ fontSize: 14, color: T.text }}>{editedLabels[s.id]}</div>
                    <div style={{ fontSize: 10, color: T.text3, marginTop: 2 }}>
                      {s.source} · scored {s.score}/10
                    </div>
                  </>
                )}
              </div>

              {!isEditing && (
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setEditingIdx(i)} title="Edit wording" style={{
                    padding: "4px 8px", borderRadius: 10,
                    background: "transparent", color: T.text3,
                    border: `1px solid ${T.border2}`, cursor: "pointer",
                    fontSize: 11,
                  }}>✎ Edit</button>
                  <button onClick={() => removeItem(s.id)} title="Remove this suggestion" style={{
                    padding: "4px 8px", borderRadius: 10,
                    background: "transparent", color: T.red,
                    border: `1px solid ${T.red}40`, cursor: "pointer",
                    fontSize: 11,
                  }}>× Remove</button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Custom items added by user */}
      {customItems.map(item => (
        <div key={item.id} style={{
          padding: "10px 12px", marginBottom: 8,
          background: "rgba(201,168,76,.12)",
          border: `1px solid ${T.gold}`, borderRadius: 6,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: 4,
            background: T.gold, display: "grid", placeItems: "center",
            color: T.bg, fontWeight: 700, fontSize: 12,
          }}>✓</div>
          <div style={{ flex: 1, fontSize: 14 }}>{item.label}</div>
          <div style={{
            fontSize: 9, color: T.gold, padding: "1px 6px", borderRadius: 4,
            background: "rgba(201,168,76,.1)", border: `1px solid ${T.border}`,
          }}>YOUR OWN</div>
          <button onClick={() => setCustomItems(c => c.filter(x => x.id !== item.id))} style={{
            padding: "4px 8px", borderRadius: 10,
            background: "transparent", color: T.red,
            border: `1px solid ${T.red}40`, cursor: "pointer", fontSize: 11,
          }}>× Remove</button>
        </div>
      ))}

      {/* Add your own */}
      <div style={{
        padding: "10px 12px", marginTop: 8,
        background: "rgba(255,255,255,.02)",
        border: `1px dashed ${T.border2}`, borderRadius: 6,
      }}>
        <div style={{
          fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
          color: T.text3, marginBottom: 6, fontWeight: 600,
        }}>+ Add your own Growth focus</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newCustom} onChange={e => setNewCustom(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCustom()}
            placeholder="Something else that matters..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: T.text, fontSize: 14, fontFamily: T.sans,
            }} />
          {newCustom.trim() && (
            <button onClick={addCustom} style={{
              padding: "4px 10px", borderRadius: 10,
              background: T.gold, color: T.bg,
              border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700,
            }}>Add</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AlignmentReviewPanel — collapsible on A2 showing Identity & Values sliders
// with two-way sync back to A1
function AlignmentReviewPanel({ state, setState, isMobile }) {
  const [open, setOpen] = useState(false);

  // Sample Identity & Values items from a1 (in real app pulled from actual state)
  const [identityValuesScores, setIdentityValuesScores] = useState({
    "lioness-direct": 7,
    "dolphin-intuitive": 7,
    "dolphin-playful": 4,
    "eagle-vision": 8,
    "evolve-learn": 7,
    "ownit-resp": 8,
    "walk-align": 5,
    "count-impact": 4,
  });

  const updateScore = (id, val) => {
    setIdentityValuesScores(s => ({ ...s, [id]: val }));
    // In real app: also sync to A1 state here
  };

  const items = [
    { id: "lioness-direct", animal: "Lioness", label: "Boldly direct" },
    { id: "dolphin-intuitive", animal: "Dolphin", label: "Intuitive read" },
    { id: "dolphin-playful", animal: "Dolphin", label: "Playful energy" },
    { id: "eagle-vision", animal: "Eagle", label: "Long-range vision" },
    { id: "evolve-learn", animal: "EVOLVE", label: "Learn daily" },
    { id: "ownit-resp", animal: "OWN IT", label: "Take full responsibility" },
    { id: "walk-align", animal: "WALK THE TALK", label: "Actions match words" },
    { id: "count-impact", animal: "MAKE IT COUNT", label: "Impact over activity" },
  ];

  return (
    <div style={{
      marginBottom: 24,
      background: "rgba(255,255,255,.03)",
      border: `1px solid ${T.border2}`,
      borderRadius: 10, overflow: "hidden",
    }}>
      <div onClick={() => setOpen(!open)} style={{
        padding: "14px 18px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        cursor: "pointer",
      }}>
        <div>
          <div style={{
            fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
            color: T.gold, fontWeight: 600, marginBottom: 4,
          }}>← Back to Identity &amp; Values Alignment</div>
          <div style={{
            fontSize: 14, color: T.text, fontFamily: T.serif, fontStyle: "italic",
          }}>Re-score any of your capabilities or behaviors here. Changes sync back to A1 and update your misalignment below.</div>
        </div>
        <span style={{ color: T.gold, fontSize: 18 }}>{open ? "▴" : "▾"}</span>
      </div>

      {open && (
        <div style={{
          padding: "8px 18px 18px",
          borderTop: `1px solid ${T.border2}`,
        }}>
          {items.map(item => {
            const score = identityValuesScores[item.id];
            return (
              <div key={item.id} style={{
                marginBottom: 14, padding: "10px 12px",
                background: "rgba(0,0,0,.15)", borderRadius: 6,
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "baseline",
                  marginBottom: 6,
                }}>
                  <div>
                    <span style={{
                      fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
                      color: T.text3, fontWeight: 600, marginRight: 8,
                    }}>{item.animal}</span>
                    <span style={{ fontSize: 14, color: T.text }}>{item.label}</span>
                  </div>
                  <span style={{
                    fontSize: 14, fontWeight: 600,
                    color: score <= 4 ? T.red : score <= 6 ? T.amber : T.green,
                  }}>{score}/10</span>
                </div>
                <input type="range" min="1" max="10" value={score}
                  onChange={e => updateScore(item.id, parseInt(e.target.value))}
                  style={{
                    width: "100%",
                    accentColor: score <= 4 ? T.red : score <= 6 ? T.amber : T.green,
                  }} />
              </div>
            );
          })}
          <div style={{
            padding: "10px 12px", marginTop: 12,
            background: "rgba(74,222,128,.08)",
            borderLeft: `3px solid ${T.green}`, borderRadius: 4,
            fontSize: 12, color: T.text2, fontStyle: "italic",
          }}>
            Changes here sync to your Identity &amp; Values Alignment page in A1 and also update your 1-Year Growth suggestions.
          </div>
        </div>
      )}
    </div>
  );
}

function GrowthSuggestions({ accepted, setAccepted, otherText, setOtherText, isMobile }) {
  return (
    <div style={{
      marginTop: 20, padding: isMobile ? "14px 16px" : "18px 20px",
      background: "linear-gradient(135deg, rgba(201,168,76,.12), rgba(245,158,11,.05))",
      border: `1px solid ${T.gold}`, borderRadius: 10, marginBottom: 16,
    }}>
      <div style={{
        fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
        color: T.gold, fontWeight: 600, marginBottom: 4,
      }}>Growth suggestions from your inner work</div>
      <div style={{ fontSize: 13, color: T.text2, marginBottom: 14, lineHeight: 1.5 }}>
        Your lowest-scoring items from Identity &amp; Values alignment. Accept or add your own.
        Accepted items appear in the tier ranking below.
      </div>
      {IDENTITY_VALUES_SEEDS.map((s, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 12px", marginBottom: 8,
          background: accepted[i] ? "rgba(201,168,76,.12)" : "rgba(255,255,255,.02)",
          border: `1px ${accepted[i] ? "solid" : "dashed"} ${T.gold}`,
          borderRadius: 6,
        }}>
          <div onClick={() => setAccepted(accepted.map((v, j) => j === i ? !v : v))}
            style={{
              width: 20, height: 20, borderRadius: 4, flexShrink: 0,
              background: accepted[i] ? T.gold : "transparent",
              border: `1px solid ${T.gold}`,
              display: "grid", placeItems: "center", cursor: "pointer",
              color: T.bg, fontWeight: 700, fontSize: 12,
            }}>{accepted[i] && "✓"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: T.text }}>{s.label}</div>
            <div style={{ fontSize: 10, color: T.text3, marginTop: 2 }}>
              {s.source} · scored {s.score}/10
            </div>
          </div>
        </div>
      ))}
      <div style={{
        padding: "10px 12px", marginTop: 8,
        background: "rgba(255,255,255,.02)",
        border: `1px dashed ${T.border2}`, borderRadius: 6,
      }}>
        <div style={{
          fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
          color: T.text3, marginBottom: 6, fontWeight: 600,
        }}>+ Other</div>
        <input value={otherText} onChange={e => setOtherText(e.target.value)}
          placeholder="Something else that matters..."
          style={{
            width: "100%", background: "transparent", border: "none", outline: "none",
            color: T.text, fontSize: 14, fontFamily: T.sans,
          }} />
      </div>
    </div>
  );
}

function PrefillNote({ children }) {
  return (
    <div style={{
      marginTop: 20, padding: "10px 14px",
      background: "rgba(74,222,128,.08)",
      borderLeft: `3px solid ${T.green}`, borderRadius: 4,
      fontSize: 12, color: T.text2, fontStyle: "italic", lineHeight: 1.5,
    }}>{children}</div>
  );
}

function InfoNote({ tone, children }) {
  const color = tone === "gold" ? T.gold : tone === "green" ? T.green : T.text3;
  return (
    <div style={{
      marginTop: 20, padding: "12px 16px",
      background: `${color}08`, borderLeft: `3px solid ${color}`, borderRadius: 4,
      fontSize: 13, color: T.text2, lineHeight: 1.6,
    }}>{children}</div>
  );
}

function BagCompleteNote() {
  return (
    <div style={{
      marginTop: 28, padding: "14px 18px",
      background: "rgba(201,168,76,.08)",
      border: `1px solid ${T.gold}`, borderRadius: 8,
    }}>
      <div style={{
        fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
        color: T.gold, fontWeight: 700, marginBottom: 6,
      }}>BAG complete · feeds forward</div>
      <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.6 }}>
        Your sensory work here seeds the A2 Future Self Letter — you'll see your own See/Hear/Feel
        stitched into a letter when you get there. Your tier ranking carries forward for A4 to act on.
      </div>
    </div>
  );
}

function segColor(seg) {
  return seg === "Time" ? T.timeColor : seg === "Wealth" ? T.wealthColor : T.growthColor;
}

const breadcrumbStyle = {
  fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase",
  color: T.gold, fontWeight: 600, marginBottom: 6,
};
const h1Style = (isMobile) => ({
  fontFamily: T.serif, fontSize: isMobile ? 32 : 40, fontWeight: 500,
  margin: "6px 0 10px", lineHeight: 1.1, color: T.text,
});
const leadStyle = {
  fontSize: 14, lineHeight: 1.6, color: T.text2, maxWidth: 640,
};
