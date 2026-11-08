const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { installIsolation } = require("./browser-isolation.cjs");
const { fixture } = require("./map-picture-browser.cjs");
const { modules } = require("./a1-fixtures.cjs");
async function main() {
  const data = fixture("all-stages"), load = modules().load;
  const src = { map:data.to_map, values:data.to_mirror4_state_v1, rc:data.to_rc_state_v1, notice:data.a1_notice,
    holdback:data.a1_sym_holdback, a2:data.to_a2_state_v1, a3:data.to_a3_state_v1, a4:data.to_a4_state_v1, a5:data.to_a5_state_v1 };
  const rows = [...load("mapOfMe/model").a1Sections(src), ...load("mapOfMe/later").laterSections(src)];
  const labels = load("a5Constants").A5_LABEL;
  const kinds = ["values-rank","values-name","identity-gifts","identity-power","identity-pressure","purpose","vision",
    "alignment-gap","time-priorities","truth-move","board","a4-promise","a4-plan","a5-plan","a5-checkin","a5-lookback"];
  const samples = kinds.map(kind => rows.find(row => row.target.kind === kind)).filter(Boolean);
  const browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH, args:["--no-sandbox"], headless:true });
  const width = Number(process.env.WIDTH || 1280), height = width === 375 ? 812 : 800;
  const checks = [], errors = [], writes = [], escaped = [];
  try {
    for (const theme of ["light","dark"]) {
      const context = await browser.newContext({ viewport:{width,height}, serviceWorkers:"block", colorScheme:theme });
      await installIsolation(context,writes,escaped);
      await context.addInitScript(({data,theme}) => {
        for (const [key,value] of Object.entries(data)) localStorage.setItem(key,JSON.stringify(value));
        localStorage.setItem("na1_theme",theme); localStorage.setItem("to_road_phone_tip_seen_v1","1");
      },{data,theme});
      const page = await context.newPage(); page.on("pageerror",e=>errors.push(e.message));
      await page.goto("http://localhost:80/",{waitUntil:"networkidle"});
      await page.locator(".mom-title-card").waitFor();
      for (const row of samples) {
        await page.locator(`[data-map-members~="${row.id}"]`).first().click();
        await page.locator(`[data-map-edit="${row.id}"]`).click();
        await page.locator("[data-map-review-target]").waitFor();
        await page.waitForTimeout(120);
        const box = await page.locator(".na1-room-card").last().boundingBox();
        assert(box && box.x >= -1 && box.x + box.width <= width + 1,`${row.id}: room overflows ${width}px`);
        await page.screenshot({ path:`generated-artifacts/map-visual/screens/05-editor-${width === 375 ? "phone" : "desktop"}-${theme}-${row.id}.jpg`,type:"jpeg",quality:75,animations:"disabled" });
        checks.push({ id:row.id,theme,box });
        if (row.target.kind === "a5-checkin") {
          const original = await page.evaluate(() => localStorage.getItem("to_a5_state_v1"));
          for (const key of ["time","wealth","self"]) {
            const phase = labels[key];
            await page.getByRole("button",{name:`Review ${phase}`,exact:true}).click();
            await page.waitForFunction(phase => document.querySelector(".mom-native-review .na1-room-crumb .current")?.textContent === phase,phase);
            await page.waitForTimeout(40);
            const content = await page.locator(".mom-native-review .na1-room-card").innerText();
            assert(content.includes(data.to_a5_state_v1.plans[key].week),`${phase}: wrong saved weekly answer`);
          }
          assert.equal(await page.evaluate(() => localStorage.getItem("to_a5_state_v1")),original,"Review navigation changed A5 data");
        }
        await page.getByRole("button",{name:"Done reviewing →",exact:true}).last().click();
        await page.locator("[data-map-review-target]").waitFor({state:"hidden"});
      }
      await context.close();
    }
    assert.deepEqual(errors,[]); assert.deepEqual(escaped,[]);
    await fs.writeFile(`generated-artifacts/map-visual/${width}-edit-audit.json`,JSON.stringify({checks,errors,escaped,writes:writes.length},null,2));
    console.log(`${checks.length} ${width}px editor checks passed; review tabs preserve answers; no errors or escaped writes.`);
  } finally { await browser.close(); }
}
main().catch(e=>{console.error(e);process.exit(1)});
