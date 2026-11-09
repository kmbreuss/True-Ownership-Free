import base64, html, pathlib, json
root=pathlib.Path("generated-artifacts/phone-home")
def image(name):
    p=root/name
    return f'<figure><figcaption>{html.escape(name)}</figcaption><img loading="lazy" src="data:image/png;base64,{base64.b64encode(p.read_bytes()).decode()}"></figure>'
mapping=[
("Appearance and development controls","Retained at the top; original visibility and permissions."),
("Reality Check start/review card","Today’s next step for new members; compact Begin/Review link remains for everyone."),
("Entry Hall breadcrumb and Welcome greeting","Personalized Home greeting; the road continues to provide navigation context."),
("A5 reminder card","Today, below the next-step card, with original controls."),
("A5 commitments, marks, check-in and reminders","This week, below the A1 summary; original controls and writers."),
("A1 practical-week summary","Three numbered Do / Try / Notice cards; each opens current A1 ending screen 2 in review and returns to Home."),
("True Ownership · Welcome, mirror quote, Everything starts with you, introductory paragraph","Preserved verbatim under Before you start."),
("Welcome VideoCard","Today’s playable recording card and existing Audio library; existing player."),
("Authority principle, advisors explanation and AI/inner-trust paragraph","Preserved verbatim in the introductory disclosure."),
("See the framework / Skip to A1 / access wording","Compact links with original callbacks and access rules."),
("Copyright/legal footer","Existing page-bottom footer retained; redundant fixed Home footer removed so it cannot cover the new content."),
("Future B","Existing full gold card in its tab and the desktop right column."),
]
copy=[
("Welcome, {name}. / Welcome.","Hi, {first name} / Hi there"),
("No claim-history line","Last time you claimed your {latest valid dated claim}. / Welcome back."),
("No Home tab switch","TODAY · THIS WEEK · FUTURE B"),
("Separate hub entry cards","YOUR NEXT STEP [· ABOUT 20 MIN for Values] · {mirror name} · Continue →"),
("No finished-road Home card","YOUR ROAD · You've walked the whole road. · See your Map of Me →"),
("Existing restricted A1 link","Unlocks when you join (unchanged; also shown if no next step is accessible)"),
("Katherine · {length}","{length} · KATHERINE (Home player only; registry title and actual duration unchanged)"),
("This week, just three things.","Numbered DO · TRY [creature] · NOTICE [value] cards; answers remain the shared projection"),
("No pre-handoff Home panel","Your week fills in at the end of A1. · For now: “{original Reality Check one thing}”"),
("No weekly closing line","Everything else is set aside, not lost."),
("Existing optional-answer fallback","Optional · not chosen yet. (unchanged)"),
("No pre-RC Future B panel","Your Future B appears after the Reality Check. · Start the Reality Check →"),
("Expanded introductory content","Before you start (disclosure label; introduction itself unchanged)"),
("Existing route controls","See the framework → · Skip to A1 · All In It → · Begin/Review the Reality Check → (retained)"),
("Weekly review footer","Done reviewing → (existing review behavior, now also returning to Home)"),
("New next-step descriptions","Reality Check: Where you are now, and where it leads. | Values: What you stand for. | Identity: The gifts you carry, and the creatures that carry them. | Purpose: Why Future B matters to you. | Vision: Where you’re going in ten years."),
("New next-step descriptions","Alignment Check: What matters, and how you’re living it. | Time Audit: Where your hours actually go. | Named Truth: The one thing your time is telling you."),
("New next-step descriptions","People: Who lifts you, and who drains you. | Environment: The places and habits that surround you. | Thoughts: The voice you want to live with. | Energy Map: What lifts your energy. | The Board: The people at your table. | The Move: Your one move forward."),
("New next-step descriptions","Self/Time/Wealth: The promise you will live. | My Promises: The promises you’re making to yourself. | My Commitment: Your plan, your supports, your rhythm."),
]
def table(rows):
    return "<table>"+''.join("<tr>"+''.join("<td>"+html.escape(c)+"</td>" for c in r)+"</tr>" for r in rows)+"</table>"
files=["src/App.tsx","src/home/model.ts","src/home/PhoneHome.tsx","src/home/home.css","src/home/claimEmphasis.ts","src/journey/mirror-cards.css","src/syncHook.ts","tests/home-browser.cjs","tests/home-edge-browser.cjs","tests/home-report.py"]
body="<h1>Phone Home · build report</h1><p>Synthetic accounts only. No publishing, no Decision build, no new saved account fields.</p>"
body+="<h2>Block mapping</h2>"+table(mapping)+"<h2>Copy: old → new</h2>"+table(copy)
body+="<h2>Data and media limits</h2><p>No claim date means “Welcome back.” Invalid/future timestamps are excluded. Existing Purpose completion has no trustworthy claim date, so it never invents one. Claim dates are not visit history. Values reuses its existing 20-minute estimate; other next-step mirrors have no single approved mirror estimate in the current catalog, so no duration is invented. Recordings use the shared source/access filter and existing player; Welcome is 7:43. Missing sources produce no card. Do/Try/Notice reuse the practical-week projection and existing notice evidence. No answers are rewritten by Home.</p>"
body+="<h2>Checks</h2><p>375×812, 1280×800, 1440×900 and 1920×1080, light and dark. Phone fixtures: new member, mid-A1, end-A1 and completed road. Native Continue, weekly review return, preserved weekly data, remembered tab and horizontal fit checked. Additional checks cover missing dates, long/no name, Preview tab isolation, missing media, one-card claim emphasis and reduced motion.</p>"
body+="<h2>Phone first</h2>"
for theme in ["light","dark"]:
    for tab in ["today","week","future"]: body+=image(f"375-{theme}-a1-{tab}.png")
for kind in ["new","mid","complete"]: body+=image(f"375-light-{kind}-today.png")
body+="<h2>Desktop</h2>"
for width in [1280,1440,1920]:
    for theme in ["light","dark"]:body+=image(f"{width}-{theme}-a1-today.png")
body+="<h2>Files</h2><ul>"+''.join(f"<li>artifacts/true-ownership/{f}</li>" for f in files)+"</ul>"
(root/"report.html").write_text("<!doctype html><meta charset='utf-8'><title>Phone Home report</title><style>body{max-width:1100px;margin:32px auto;padding:20px;font:16px/1.5 system-ui;color:#243c3c;background:#faf9f5}table{border-collapse:collapse;width:100%}td{border:1px solid #c8b99f;padding:12px;vertical-align:top}td:first-child{width:34%}img{max-width:100%;max-height:1400px;height:auto;border:1px solid #c8b99f}figure{margin:28px 0}figcaption{font-weight:bold;margin-bottom:8px}</style>"+body)
print("Wrote",root/"report.html")
