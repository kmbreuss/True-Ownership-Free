=== LINE COUNT ===
2867 ./artifacts/Prototypes/a1_direction_prototype_v2.jsx

=== ALL WEALTH LINE NUMBERS ===
10:  timeColor: "#8b5cf6", wealthColor: "#10b981", growthColor: "#f59e0b",
34:const WEALTH_CARDS = [
62:      wealthOverallSentence: "I have more than I need, flowing in ways that don't require me to keep selling my time.",
63:      wealthOverallConfirmed: false,
64:      wealthPicked: ["retirement", "cashflow", "properties", "business-equity"],
65:      wealthItems: {
71:      wealthSeeHearFeel: {
88:      wealthOverallSentence: "",
89:      wealthOverallConfirmed: false,
90:      wealthItems: {},
99:      wealthOverallSentence: "",
100:      wealthOverallConfirmed: false,
101:      wealthItems: {},
369:    const key = segment === "time" ? "timePicked" : "wealthPicked";
370:    const itemsKey = segment === "time" ? "timeItems" : "wealthItems";
382:    const itemsKey = segment === "time" ? "timeItems" : "wealthItems";
393:             : segment === "wealth" ? "wealthSeeHearFeel"
405:    bag.wealthPicked.forEach(id => {
406:      const card = WEALTH_CARDS.find(c => c.id === id);
407:      if (card) items.push({ id: `w_${id}`, segment: "Wealth", label: card.label, icon: card.icon });
413:  }, [bag.timePicked, bag.wealthPicked, bag.growthSentence]);
479:      {/* ═══ WEALTH SEGMENT ═══ */}
481:        icon="💰" title="Wealth — What you own, what flows" color={T.wealthColor}
482:        confirmed={bag.wealthOverallConfirmed}
483:        confirmedSummary={bag.wealthOverallConfirmed ? bag.wealthOverallSentence : null}
485:        <SubLabel>Pick the wealth categories that matter for this horizon.</SubLabel>
487:          cards={WEALTH_CARDS} picked={bag.wealthPicked}
488:          onToggle={id => togglePick("wealth", id)}
489:          color={T.wealthColor}
492:        {bag.wealthPicked.map(id => {
493:          const card = WEALTH_CARDS.find(c => c.id === id);
495:          const item = bag.wealthItems[id] || { text: "", goal: "" };
498:              key={id} icon={card.icon} label={card.label} color={T.wealthColor}
501:              onTextChange={v => updateItem("wealth", id, "text", v)}
502:              onGoalChange={v => updateItem("wealth", id, "goal", v)}
507:        {/* Overall Wealth See/Hear/Feel */}
509:          title="Overall Wealth — See · Hear · Feel"
511:          color={T.wealthColor}
512:          values={bag.wealthSeeHearFeel}
513:          onChange={(field, value) => updateSHF("wealth", field, value)}
517:          color={T.wealthColor}
518:          label="Wealth"
520:            bag.wealthSeeHearFeel.see,
521:            bag.wealthSeeHearFeel.hear,
522:            bag.wealthSeeHearFeel.feel,
523:            ...Object.values(bag.wealthItems).map(i => i.goal || i.text),
525:          existingConfirmed={bag.wealthOverallConfirmed ? bag.wealthOverallSentence : null}
526:          onConfirm={(text) => setBag({ wealthOverallSentence: text, wealthOverallConfirmed: true })}
527:          bottomTitle="In one sentence, my wealth in 2038 is..."
602:      const wealthItems = {};
603:      bag.wealthPicked.forEach(id => { wealthItems[id] = { text: "", goal: "" }; });
606:        threeYear: { ...s.threeYear, timeItems, wealthItems },
614:    const itemsKey = segment === "time" ? "timeItems" : "wealthItems";
629:    bag.wealthPicked.forEach(id => {
630:      const card = WEALTH_CARDS.find(c => c.id === id);
631:      if (card) items.push({ id: `w_${id}`, segment: "Wealth", label: card.label, icon: card.icon });
637:  }, [bag.timePicked, bag.wealthPicked, three.growthSentence]);
686:      {/* WEALTH */}
688:        icon="💰" title="Wealth" color={T.wealthColor}
689:        confirmed={three.wealthOverallConfirmed}
690:        confirmedSummary={three.wealthOverallConfirmed ? three.wealthOverallSentence : null}
692:        {bag.wealthPicked.map(id => {
693:          const card = WEALTH_CARDS.find(c => c.id === id);
695:          const item = three.wealthItems[id] || { text: "", goal: "" };
698:              key={id} icon={card.icon} label={card.label} color={T.wealthColor}
701:              onTextChange={v => updateItem("wealth", id, "text", v)}
702:              onGoalChange={v => updateItem("wealth", id, "goal", v)}
707:          color={T.wealthColor}
708:          label="Wealth"
709:          sourceText={Object.values(three.wealthItems).map(i => i.goal || i.text).filter(Boolean).join(" ")}
710:          existingConfirmed={three.wealthOverallConfirmed ? three.wealthOverallSentence : null}
711:          onConfirm={(text) => set3yr({ wealthOverallSentence: text, wealthOverallConfirmed: true })}
712:          bottomTitle="In one sentence, my wealth in 2029 is..."
799:      const wealthItems = {};
800:      bag.wealthPicked.forEach(id => { wealthItems[id] = { text: "", goal: "" }; });
801:      setState(s => ({ ...s, oneYear: { ...s.oneYear, timeItems, wealthItems } }));
808:    const itemsKey = segment === "time" ? "timeItems" : "wealthItems";
823:    bag.wealthPicked.forEach(id => {
824:      const card = WEALTH_CARDS.find(c => c.id === id);
825:      if (card) items.push({ id: `w_${id}`, segment: "Wealth", label: card.label, icon: card.icon });
839:  }, [bag.timePicked, bag.wealthPicked, one.growthSentence, one.growthSuggestionsAccepted, one.otherGrowth]);
887:      {/* WEALTH */}
889:        icon="💰" title="Wealth" color={T.wealthColor}
890:        confirmed={one.wealthOverallConfirmed}
891:        confirmedSummary={one.wealthOverallConfirmed ? one.wealthOverallSentence : null}
893:        {bag.wealthPicked.map(id => {
894:          const card = WEALTH_CARDS.find(c => c.id === id);
896:          const item = one.wealthItems[id] || { text: "", goal: "" };
899:              key={id} icon={card.icon} label={card.label} color={T.wealthColor}
902:              onTextChange={v => updateItem("wealth", id, "text", v)}
903:              onGoalChange={v => updateItem("wealth", id, "goal", v)}
908:          color={T.wealthColor}
909:          label="Wealth"
910:          sourceText={Object.values(one.wealthItems).map(i => i.goal || i.text).filter(Boolean).join(" ")}
911:          existingConfirmed={one.wealthOverallConfirmed ? one.wealthOverallSentence : null}
912:          onConfirm={(text) => set1yr({ wealthOverallSentence: text, wealthOverallConfirmed: true })}
913:          bottomTitle="In one sentence, my wealth in 2027 is..."
1013:    state.bag.wealthPicked.forEach((id, i) => {
1014:      const card = WEALTH_CARDS.find(c => c.id === id);
1015:      if (card) addItem(`w_${id}`, "Wealth", card.label, Math.max(2, 5 - i));
1337:                <SourceFragment segment="Wealth" color={T.wealthColor}
1338:                  see={state.bag.wealthSeeHearFeel.see}
1339:                  hear={state.bag.wealthSeeHearFeel.hear}
1340:                  feel={state.bag.wealthSeeHearFeel.feel}
1368:          <SourceFragment segment="Wealth" color={T.wealthColor}
1369:            see={state.bag.wealthSeeHearFeel.see}
1370:            hear={state.bag.wealthSeeHearFeel.hear}
1371:            feel={state.bag.wealthSeeHearFeel.feel}
1410:  const w = bag.wealthSeeHearFeel || {};
1761:      note: "Wealth uses card-picker like Time (with Add your own). Per-priority S/H/F removed, replaced with ONE overall S/H/F per segment (Time/Wealth/Growth). No top 'In one sentence...' field anywhere — summary lives ONLY at the bottom of each segment via the Summary Generator (generates draft → user edits → Confirm → becomes segment summary). Tier ranking at bottom with Non-negotiable capped at 3." },
1763:      note: "Pre-fills Time/Wealth categories from BAG. Simple text box per item (no per-item summarise button). ONE segment-level summariser at the bottom of each segment. Growth = one-sentence with manual Confirm button. Tier ranking at bottom." },
1769:      note: "Pre-fills from 3-Year. Simple text box per Time/Wealth item, segment-level summariser at end. Growth section shows Identity/Values suggestions with Accept / Edit wording / Remove per item + Add your own Growth focus + manual one-sentence Growth field with Confirm. Tier ranking at bottom." },
1842:// ─── CollapsibleSegment — wraps Time/Wealth/Growth section content
2854:  return seg === "Time" ? T.timeColor : seg === "Wealth" ? T.wealthColor : T.growthColor;
