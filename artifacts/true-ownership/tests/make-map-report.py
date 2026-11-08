"""Create self-contained, synthetic-fixture screenshot reports; never reads app storage."""
from pathlib import Path
import base64
import html
import json

root = Path("generated-artifacts/map-visual")

def image(path):
    return "data:image/jpeg;base64," + base64.b64encode(path.read_bytes()).decode()

def document(title, body):
    return f"""<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)}</title>
<style>body{{font:16px/1.5 system-ui;background:#f4f2ed;color:#143c38;max-width:1400px;margin:30px auto;padding:0 20px}}
h1{{font:38px Georgia}}h2{{margin-top:40px}}.pair{{display:grid;grid-template-columns:1fr 1fr;gap:20px}}
figure{{margin:0;background:white;border:1px solid #a5875e;border-radius:12px;padding:12px;min-width:0}}
img{{display:block;max-width:100%;height:auto;margin:auto}}figcaption{{font-weight:600;margin-bottom:12px}}
code{{overflow-wrap:anywhere}}@media(max-width:650px){{.pair{{grid-template-columns:1fr}}}}
</style><h1>{html.escape(title)}</h1>
<p>Synthetic accounts only. No real member account was accessed. No publishing.</p>{body}</html>"""

part1 = root / "part1"
if (part1 / "audit.json").exists():
    audit = json.loads((part1 / "audit.json").read_text())
    body = "<p>Each pair shows the Map edit destination on the left and the current normal mirror room on the right, at 375 × 812. Review footers intentionally return to the Map.</p>"
    body += "<p>The Map uses the claimed fixture throughout. Normal A4 and My Commitment counterparts use separate pre-claim fixtures with identical answers, because their normal claimed entries always open their seal. No Re-claim action is run. The normal 90-day fixture is date-eligible; the real access gate is unchanged.</p>"
    body += f"<p>{len(audit['pairs'])} destinations checked. Source snapshots stay unchanged when opening and closing editors. Mutations are intercepted in the test browser.</p>"
    missing = [label for kind, label in [("a5-checkin", "Weekly Check-In"), ("a5-lookback", "90-Day Look-Back")]
               if not any(pair["target"]["kind"] == kind for pair in audit["pairs"])]
    if missing:
        body += f"<p><strong>Comparison coverage is incomplete: {html.escape(', '.join(missing))}.</strong> Its Map review screen passed the phone/desktop checks in both themes, but the normal-route test capture encountered an unexpected overlapping room. No access rule was relaxed to force a screenshot.</p>"
    body += """<h2>Part 1 · copy and controls</h2><ul>
<li>Separate “FROM MY MAP OF ME · REVIEW” wrapper → current mirror breadcrumb, frame and part indicators.</li>
<li>Map-only Next / Continue actions → “Done reviewing →”. Normal journey buttons are unchanged.</li>
<li>Values breadcrumb “Order” → “Rank”; “Name” → “Name the Standards”. Both now use the same room registry as the normal Values route.</li>
<li>Values standard editor → current Name cards, with the selected standard turned.</li>
<li>“Your next 90 days.” → “Grow the promise, or keep it?”; “Grow it a little” → “Grow the promise”. These now reuse the normal 90-day controls.</li>
<li>Separate holding-back editor → an expandable “What I was holding back” control in the current True Ownership room, only for an explicitly saved answer. Its field is labelled “My words”.</li>
<li>“Save notice →” separate editor → current A1 “This week, just three things.” screen. Map review does not mark that week complete.</li>
<li>The normal Alignment Check now also exposes explicitly saved numeric ratings omitted by its current A1 question builder. They use the same “Saved alignment” rows as the Map. No unanswered requirements are added.</li>
<li>Bare A5 plan pane → the current “YOUR PLAN · From a year to this week.” room, including its native area tabs.</li>
<li>Bare A5 supports pane → “YOUR SUPPORTS · What outside you helps you keep it?” and “In A3 you named who and what surrounds you. Now ask them to help.” The normal journey copy is unchanged.</li>
<li>Separate weekly-check-in body tabs → tappable native part indicators in Map review. The selected area's current answer screen opens without completing a check-in.</li>
</ul><p>Answers, claims, unlocks and completion evidence are not changed by opening and closing these screens. Actual edits use their existing writers.</p>"""
    for pair in audit["pairs"]:
        body += f"<h2>{html.escape(pair['id'])}</h2><p><code>{html.escape(json.dumps(pair['target']))}</code></p><div class='pair'>"
        for key, label in [("mapImage", "From Map of Me"), ("normalImage", "Through the normal mirror")]:
            path = part1 / pair[key]
            body += f"<figure><figcaption>{label}</figcaption><img loading='lazy' alt='{html.escape(pair['id'])}: {label}' src='{image(path)}'></figure>"
        body += "</div>"
    (root / "part1-comparisons.html").write_text(document("Map of Me · edit destination comparisons", body))

shots = root / "screens"
if shots.exists():
    body = "<p>Phone first, followed by desktop. All answers shown belong to synthetic fixtures.</p>"
    body += """<h2>Part 2 · copy changes</h2><p>Member answers are never rewritten. The full-answer panels retain the original section labels and every saved answer.</p>
<table><thead><tr><th>Before</th><th>After</th></tr></thead><tbody>
<tr><td>{name}'s Map of Me</td><td>MAP OF ME™ · {first name} · MY FUTURE B</td></tr>
<tr><td>A living reflection of who you are — and what you're building.</td><td>Removed in favour of the personal title card</td></tr>
<tr><td>Not finished. Not meant to be. This grows as you do.</td><td>Removed</td></tr>
<tr><td>Separate Reality Check text sections</td><td>WHERE I WAS / WHERE I'M GOING; original full answers remain in their panel</td></tr>
<tr><td>This week I'm noticing</td><td>THIS WEEK · Do: · Try: · Notice:</td></tr>
<tr><td>What I value</td><td>WHAT I STAND FOR</td></tr>
<tr><td>Separate creature and pressure previews</td><td>WHO I AM · UNDER PRESSURE · swipe →</td></tr>
<tr><td>My why</td><td>MY WHY</td></tr>
<tr><td>10-year vision · Time / Wealth / Self</td><td>WHERE I'M GOING · 10 YEARS · TIME / WEALTH / SELF</td></tr>
<tr><td>Separate A2–A5 lists</td><td>THE REST OF YOUR ROAD; current hub finding lead-ins reused without rewriting answers</td></tr>
<tr><td>✓ Claimed / Complete headings</td><td>RC ✓ / A1 ✓ … A5 ✓ pills</td></tr>
<tr><td>View full answers ↗</td><td>› and Edit in Values / Identity / Purpose / Vision →; cards still open full-answer panels first</td></tr>
<tr><td>No image export</td><td>Share as a card · Preparing card…</td></tr>
<tr><td>As of {long month date}</td><td>As of {short month date}</td></tr>
</tbody></table><p>Download PDF and its Preparing PDF… state are unchanged. Empty later stages use Fills in after A2 / A3 / A4 / A5.</p>
<h3>Image-export errors (new)</h3><ul>
<li>Your browser could not create the card. Please try another browser.</li>
<li>These answers are too long for a single image. Download the full PDF instead.</li>
<li>Your card could not be created. Please try again.</li>
<li>Your card could not be downloaded. Please try again.</li></ul>
<h2>Data and control boundaries</h2>
<p>The current Reality Check stores focus, defaults and answers, but no numeric Own It score. The Map shows those actual answers; no score is invented.</p>
<p>Full-answer panels now group related sections, with each original exact-part Edit button beside its answer. Native room footers return to the Map. The Board opens at the selected seat; the road's current-stage marker follows the review room using temporary UI state only. A5 part indicators follow their selected area.</p>
<p>The existing PDF pipeline is retained. The same full-answer model also includes the already saved Do/Try/Notice week. The retired 3-year, Future Self Letter and Best friend response panels remain absent. Share as a card downloads a local PNG; nothing is posted or uploaded.</p>
<h2>Files</h2><ul>
<li>src/App.tsx — current room frames, exact-part adapters and original writers</li>
<li>src/mapOfMe/MapOfMe.tsx, model.ts, later.ts, review.ts, map.css</li>
<li>src/mapOfMe/PictureMap.tsx, picture-map.css, roomReview.ts, roomTarget.ts, share.ts</li>
<li>src/a1End/A1End.tsx, PracticalWeek.tsx</li>
<li>src/reality-check/RealityCheck.tsx; src/valuesExperience/NameCards.tsx; src/journey/Road.tsx</li>
<li>tests/map-native-rooms.cjs, map-native-desktop.cjs, map-picture-browser.cjs, make-map-report.py</li>
<li>.agents/memory/map-of-me-policy.md — durable product boundaries</li></ul>"""
    for path in sorted(shots.glob("*.jpg"), key=lambda path: ("phone" not in path.name and "scenario" not in path.name, path.name)):
        body += f"<h2>{html.escape(path.stem)}</h2><figure><figcaption>{html.escape(path.stem)}</figcaption><img loading='lazy' alt='{html.escape(path.stem)}' src='{image(path)}'></figure>"
    (root / "visual-checks.html").write_text(document("Map of Me · visual and fit checks", body))
