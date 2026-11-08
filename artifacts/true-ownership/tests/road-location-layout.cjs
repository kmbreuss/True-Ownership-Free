const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const { fixtures, modules, plain } = require("./a1-fixtures.cjs");
const { installIsolation, proveIsolation } = require("./browser-isolation.cjs");
const sizes = [[375,812],[1280,800],[1440,900],[1920,1080],[2560,1440]];
async function main() {
  const { chromium } = require("playwright");
  const browser = await chromium.launch({ headless:true, executablePath:process.env.CHROMIUM_PATH, args:["--no-sandbox"] });
  const f = fixtures(), m = modules(), writes = [], unexpected = [], errors = [], results = [];
  const a2 = plain(m.load("a2Constants").EMPTY_A2), a3 = plain(m.load("a3Constants").EMPTY_A3);
  for (const mirror of Object.values(a2)) if (mirror && typeof mirror === "object" && "claimed" in mirror) mirror.claimed = true;
  for (const mirror of Object.values(a3)) if (mirror && typeof mirror === "object" && "claimed" in mirror) mirror.claimed = true;
  const data = {
    to_rc_state_v1:f.rc, to_mirror4_state_v1:{...f.values,claimed:true},
    to_a2_state_v1:a2, to_a3_state_v1:a3, a1_ex4_done:true,
    to_map:{mirror3:{...f.identity,sealCompleted:true},vision:{...f.vision,complete:true}},
  };
  const out = path.resolve("generated-artifacts/road-location-layout");
  fs.mkdirSync(out,{recursive:true});
  try {
    await proveIsolation(browser);
    for (const [width,height] of sizes) for (const theme of ["light","dark"]) {
      const phone = width < 900;
      const context = await browser.newContext({viewport:{width,height},isMobile:phone,hasTouch:phone,serviceWorkers:"block"});
      await installIsolation(context,writes,unexpected);
      try {
        const page = await context.newPage(); page.setDefaultTimeout(8000);
        page.on("pageerror",e=>errors.push(e.message));
        await page.addInitScript(({theme,data})=>{
          if (sessionStorage.getItem("road-location-fixture")) return;
          sessionStorage.setItem("road-location-fixture","1");
          for (const [k,v] of Object.entries(data)) localStorage.setItem(k,JSON.stringify(v));
          localStorage.setItem("na1_theme",theme);
          localStorage.setItem("to_road_phone_tip_seen_v1","1");
          localStorage.setItem("to_app_route_v1",JSON.stringify({view:"a2",overlay:null}));
        },{theme,data});
        await page.goto((process.env.J1_BASE_URL||"http://localhost:80")+"/");
        await page.locator(phone?".jr-phone-bar":".jr-desktop").waitFor();
        await page.locator(".na1-hero-title").waitFor();
        await page.evaluate(()=>document.fonts.ready);
        const before = await page.evaluate(()=>[localStorage.getItem("to_a2_state_v1"),localStorage.getItem("to_a3_state_v1")]);
        assert.equal(await page.locator(".jr-you").count(),0,"Newest brick must not say You");
        assert.match(await page.locator(".jr-desktop .jr-latest").getAttribute("data-brick"),/^a3:/);
        assert.equal(await page.locator(".jr-desktop .jr-latest").getAttribute("aria-label"),"Latest step");
        assert.equal(await page.locator(".jr-desktop .jr-latest title").textContent(),"Latest step");
        let geometry;
        if (phone) {
          assert.equal(await page.locator(".jr-phone-head>span").first().textContent(),"YOU ARE HERE · A2 ALIGN");
          const current = page.locator(".jr-phone-segment.is-current");
          assert.equal(await current.count(),1);
          assert.equal(await current.getAttribute("data-road-group"),"a2");
          assert.match(await current.textContent(),/● A2/);
          const look = await current.locator(".jr-segment-track").evaluate(e=>({h:e.getBoundingClientRect().height,shadow:getComputedStyle(e).boxShadow,outline:getComputedStyle(e).outlineStyle}));
          assert(look.h > await page.locator('[data-road-group="a3"] .jr-segment-track').evaluate(e=>e.getBoundingClientRect().height));
          assert.notEqual(look.shadow,"none"); assert.equal(look.outline,"solid");
          assert.equal(await page.locator('[data-road-group="a3"] .jr-segment-track>span').evaluate(e=>e.style.width),"100%");
          assert.equal(await page.locator('[data-road-group="a3"] .jr-segment-track>span').evaluate(e=>getComputedStyle(e).opacity),"0.7");
        } else {
          const active = page.locator('.jr-desktop [aria-current="page"]');
          assert.equal(await active.count(),1);
          assert.equal(await active.getAttribute("data-road-destination"),"a2");
          assert.equal(await active.locator("small").textContent(),"You are here");
          assert.equal(await active.evaluate(e=>getComputedStyle(e).backgroundColor),"rgb(3, 99, 96)");
          assert.equal(await page.locator('.jr-desktop [data-road-destination="a3"] small').textContent(),"Claimed");
          geometry = await page.evaluate(()=>{
            const rail=document.querySelector(".jr-desktop").getBoundingClientRect();
            const root=document.querySelector(".na1-root").getBoundingClientRect();
            const heading=document.querySelector(".na1-hero-title").getBoundingClientRect();
            const shell=document.querySelector(".na1-shell");
            return {left:rail.left,right:innerWidth-root.right,group:root.right-rail.left,gap:heading.left-rail.right,
              maxWidth:getComputedStyle(shell).maxWidth,railRight:rail.right,contentLeft:heading.left,rootWidth:root.width};
          });
          assert.equal(geometry.maxWidth,"760px");
          if (width>1440) {
            assert(Math.abs(geometry.left-geometry.right)<1,"Group margins must be even");
            assert(geometry.group<=1280);
            assert(Math.abs(geometry.gap-56)<1);
          } else {
            assert.equal(geometry.left,0,"Laptop road position unchanged");
            assert.equal(geometry.railRight,290);
          }
        }
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
        await page.screenshot({path:path.join(out,`${width}x${height}-${theme}.jpg`)});
        if (phone) await page.locator(".jr-phone-bar").tap();
        else await page.locator(".jr-desktop .jr-latest").click();
        await page.getByRole("dialog",{name:"Your road to Future B"}).waitFor();
        assert.equal(await page.locator(".jr-sheet .jr-you").count(),0);
        const stage = page.locator(phone?'[data-phone-stage="a2"]':'.jr-sheet [data-road-destination="a2"]');
        await stage.click();
        assert.equal(await page.locator(".jr-sheet").count(),0);
        assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("to_app_route_v1")).view),"a2");
        assert.deepEqual(await page.evaluate(()=>[localStorage.getItem("to_a2_state_v1"),localStorage.getItem("to_a3_state_v1")]),before);
        // Confirm fixed room frames follow the grouped content region too.
        await page.evaluate(()=>localStorage.setItem("to_app_route_v1",JSON.stringify({view:"m4",overlay:{hubId:"m4",roomId:"admire"}})));
        await page.reload(); await page.locator(".na1-room-overlay").waitFor();
        const room = await page.locator(".na1-room-card").boundingBox();
        assert(room.x>=0 && room.x+room.width<=width+.5 && room.y>=0 && room.y+room.height<=height+.5);
        if (width>1440) {
          const frame = await page.locator(".na1-room-overlay").boundingBox();
          const rail = await page.locator(".jr-desktop").boundingBox();
          assert(frame.x>=rail.x+rail.width);
          assert(Math.abs(width-frame.x-frame.width-rail.x)<1);
        }
        results.push({width,height,theme,pass:true,geometry});
        console.log("PASS",width,height,theme,JSON.stringify(geometry||{current:"a2",laterA3:"complete"}));
      } finally {await context.close();}
    }
    assert.deepEqual(unexpected,[]); assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,"results.json"),JSON.stringify({results,writes:writes.length,unexpected,errors},null,2));
    console.log("PASS 10 screenshots/layout cases, A2 current with A3 complete, navigation, room frames; intercepted writes:",writes.length);
  } finally {await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
