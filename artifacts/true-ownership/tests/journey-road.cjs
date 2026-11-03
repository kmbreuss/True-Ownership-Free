const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const { createRequire } = require("node:module");
const { fixtures, modules, plain } = require("./a1-fixtures.cjs");
const { proveIsolation, installIsolation } = require("./browser-isolation.cjs");
const fixtureFile = path.resolve(__dirname, "values-name-cards-browser.cjs");
const box = { require: createRequire(fixtureFile), process, console };
const source = fs.readFileSync(fixtureFile, "utf8");
vm.runInNewContext(source.slice(0, source.indexOf("const results =")) + "\nglobalThis.sample = {claimed,fresh};", box);
const sample = plain(box.sample), f = fixtures(), model = modules().load("journey/progress");
f.rc.mirror = plain(modules().load("rcConstants").RC_MIRROR.slice(0, 3).map(item => item.id));
f.rc.tuesday = "My calendar fills before I make time to think.";
const read = data => key => data[key];
const initial = { "to_mirror4_state_v1": f.values };
const blank = model.readJourney(read(initial));
assert.equal(blank.bricks.length, 88);
assert.equal(blank.count, 0, "Empty/optional Flip is not a finished exercise");
assert.deepEqual(plain(model.ROAD_GROUPS.map(g => blank.bricks.filter(b => b.group === g.id).length)), [16,18,11,19,19,5]);
const complete = {
  "to_rc_state_v1": f.rc, "to_mirror4_state_v1": sample.claimed,
  "a1_ex4_done": true, "to_map": { mirror3: { ...f.identity, sealCompleted: true }, vision: { ...f.vision, complete: true } },
  "to_a2_state_v1": { m1: {claimed:true}, m2:{claimed:true},m3:{claimed:true} },
  "to_a3_state_v1": Object.fromEntries([1,2,3,4,5,6].map(n => [`m${n}`, {claimed:true}])),
  "to_a4_state_v1": { self:{claimed:true},time:{claimed:true},wealth:{claimed:true},a4:{claimed:true} },
  "to_a5_state_v1": {claimed:true},
};
const before = JSON.stringify(complete);
assert.equal(model.readJourney(read(complete)).count, 88);
assert.equal(JSON.stringify(complete), before, "Projection never mutates saved answers");
for (const group of model.ROAD_GROUPS) {
  const isolated = Object.fromEntries(Object.entries(complete).filter(([k]) =>
    group.id === "rc" ? k === "to_rc_state_v1" : group.id === "a1" ? ["to_map","a1_ex4_done","to_mirror4_state_v1"].includes(k) : k === `to_${group.id}_state_v1`));
  assert.equal(model.readJourney(read(isolated)).count, group.total, `Cloud-only ${group.id}`);
}
assert.equal(model.readJourney(read({"to_a5_state_v1":{step:4,plans:{self:{week:"Prefilled"}},rhythm:{day:"Sunday",time:"09:00"}}})).count,0);
assert.equal(model.readJourney(read({"to_a4_state_v1":{self:{step:5}}})).count,0);
assert.equal(model.readJourney(read({"to_rc_state_v1":{...f.rc,complete:false,step:8,maxReached:8}})).count,10);
assert.equal(new Set(blank.bricks.map(b => b.id)).size,88);
console.log("MODEL PASS: 88 unique slots, all six group counts, blank=0/full=88, cloud-only groups, no mutation, no pointer/prefill credit.");

const out = path.resolve("generated-artifacts/journey-road");
const results = [], writes = [], unexpected = [], errors = [];
const viewports = [{width:375,height:812},{width:1280,height:800},{width:1366,height:680}];
const url = process.env.J1_BASE_URL || "http://localhost:80";
async function browserTests() {
  const { chromium } = require("playwright");
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_PATH, args:["--no-sandbox"]});
  let failures = 0;
  fs.mkdirSync(out,{recursive:true});
  try {
    await proveIsolation(browser);
    async function open(viewport, theme, scene, cloud = false) {
      const state = scene === "closer" ? {...sample.claimed,claimed:false,claimedAt:null,status:"in_progress"} : scene === "hub-before" || scene.startsWith("rc") ? f.values : sample.claimed;
      const rc = scene === "rc-progress" ? {...f.rc,complete:false,step:11,maxReached:11,willing:null} : f.rc;
      const payload = {intake:{name:"Synthetic"},phase:"a1",...(cloud ? {m4state:{t:Date.now(),v:state},rcstate:{t:Date.now(),v:rc}} : {})};
      const context = await browser.newContext({viewport,serviceWorkers:"block"});
      await installIsolation(context,writes,unexpected,async() => { if(cloud) await new Promise(r=>setTimeout(r,250)); return payload; });
      await context.route("**/api/claude",route=>route.fulfill({json:{content:[{text:'{"scenarios":{}}'}]}}));
      const page = await context.newPage(); page.setDefaultTimeout(7000);
      page.on("pageerror",e=>errors.push(e.message));
      await page.addInitScript(({theme,state,rc,scene,cloud})=>{
        if(sessionStorage.getItem("jr-fixture"))return;
        sessionStorage.setItem("jr-fixture","1");
        if(!cloud){localStorage.setItem("to_mirror4_state_v1",JSON.stringify(state));localStorage.setItem("to_rc_state_v1",JSON.stringify(rc));}
        localStorage.setItem("na1_theme",theme);
        const route = scene.startsWith("hub") ? {view:"grid",overlay:null} : scene.startsWith("rc") ? {view:"rcroom",overlay:null} : {view:"m4",overlay:{hubId:"m4",roomId:scene === "name" ? "name" : "claim"}};
        localStorage.setItem("to_app_route_v1",JSON.stringify(route));
      },{theme,state,rc,scene,cloud});
      await page.goto(url+"/");
      await page.locator(viewport.width<900?".jr-phone-bar":".jr-desktop").waitFor();
      await page.evaluate(()=>document.fonts.ready);
      if(scene==="closer"){
        await page.getByRole("button",{name:"Claim it · go to Map of Me →",exact:true}).click();
        await page.getByRole("button",{name:"Continue to Identity →",exact:true}).click();
        await page.locator(".jr-closer").waitFor();
      } else if(scene.startsWith("hub")) await page.locator(".jr-future-b").waitFor();
      else if(scene==="name") await page.locator(".vxnc-layout").waitFor();
      else if(scene.startsWith("rc")) await page.locator(".rc-room").waitFor();
      await page.waitForTimeout(350);
      return {page,context};
    }
    async function check(name, viewport, theme, scene, action, cloud = false) {
      if(process.env.JOURNEY_CASE && !new RegExp(process.env.JOURNEY_CASE).test(name))return;
      if(failures>=2)return;
      let context;
      try {
        const opened=await open(viewport,theme,scene,cloud);context=opened.context;const {page}=opened;
        if(action)await action(page);
        const fit=await page.evaluate(()=>{
          const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=="hidden"&&s.display!=="none";};
          const bad=[...document.querySelectorAll(".jr-phone-bar,.jr-desktop,.jr-future-b,.jr-mirror-card,.jr-closer,.jr-sheet,.na1-room-card")].filter(visible).filter(e=>{
            const r=e.getBoundingClientRect();return r.left<-.6||r.right>innerWidth+.6;
          }).map(e=>e.className);
          const foot=[...document.querySelectorAll(".jr-closer-footer,.rc-footer,.na1-m4-disc-foot")].filter(visible).map(e=>({bottom:e.getBoundingClientRect().bottom,top:e.getBoundingClientRect().top}));
          return {width:innerWidth,doc:document.documentElement.scrollWidth,bad,foot,
            phoneSegments:document.querySelectorAll(".jr-phone-segment").length,roadBricks:document.querySelector(".jr-desktop")?.querySelectorAll("[data-brick]").length};
        });
        assert.equal(fit.doc,viewport.width,`Sideways page overflow: ${JSON.stringify(fit)}`);
        assert.deepEqual(fit.bad,[],`Sideways frame overflow: ${JSON.stringify(fit)}`);
        assert.equal(fit.phoneSegments,6);
        assert.equal(fit.roadBricks,88);
        for(const footer of fit.foot)assert(footer.bottom<=viewport.height+1,`Footer clipped: ${JSON.stringify(fit)}`);
        const filename=`${name}-${viewport.width}x${viewport.height}-${theme}.jpg`;
        await page.screenshot({path:path.join(out,filename)});
        results.push({name,viewport,theme,pass:true,fit,filename});
        console.log("PASS",name,viewport.width,viewport.height,theme,JSON.stringify(fit));
      }catch(e){failures++;results.push({name,viewport,theme,pass:false,error:e.message});console.error("FAIL",name,viewport.width,theme,e.message);}
      finally{if(context)await context.close();}
    }
    for(const viewport of viewports)for(const theme of ["light","dark"]) {
      for(const scene of ["hub-before","hub-after","name","closer","rc"])await check(scene,viewport,theme,scene);
      await check("full-road",viewport,theme,"hub-after",async page=>{
        const stored=await page.evaluate(()=>localStorage.getItem("to_mirror4_state_v1"));
        await page.locator(viewport.width<900?".jr-phone-bar":".jr-desktop .jr-road").click();
        await page.getByRole("dialog",{name:"Your road to Future B"}).waitFor();
        assert.equal(await page.locator(".jr-sheet [data-brick]").count(),88);
        await page.keyboard.press("Escape");
        assert.equal(await page.locator(".jr-sheet").count(),0);
        assert.equal(await page.evaluate(()=>localStorage.getItem("to_mirror4_state_v1")),stored);
        await page.locator(viewport.width<900?".jr-phone-bar":".jr-desktop .jr-road").click();
      });
    }
    await check("claimed-review",viewports[1],"light","claim",async page=>{
      assert.equal(await page.getByRole("button",{name:"Done reviewing →",exact:true}).count(),1);
      assert.equal(await page.locator(".jr-moment").count(),0);
      await page.getByRole("button",{name:"Done reviewing →",exact:true}).click();
      assert.equal(await page.locator(".jr-closer").count(),0);
      assert((await page.evaluate(()=>JSON.parse(localStorage.getItem("to_mirror4_state_v1")).claimed)));
    });
    await check("rc-completion-notice",viewports[1],"light","rc-progress",async page=>{
      assert.equal(await page.locator(".jr-moment").count(),0);
      await page.getByRole("button",{name:"Yes, I'm willing",exact:true}).click();
      await page.getByText("Reality Check done. 16 steps on your road.",{exact:true}).waitFor();
      assert.equal(await page.locator(".jr-moment").count(),1);
      await page.waitForTimeout(4200);
      assert.equal(await page.locator(".jr-moment").count(),0);
      await page.reload();
      await page.locator(".jr-desktop").waitFor();
      await page.waitForTimeout(350);
      assert.equal(await page.locator(".jr-moment").count(),0);
    });
    await check("quiet-rc-progress",viewports[1],"light","rc-progress",async page=>{
      await page.getByRole("button",{name:"Not yet",exact:true}).click();
      await page.waitForTimeout(500);
      assert.equal(await page.locator(".jr-moment").count(),0);
      assert.match(await page.locator(".jr-desktop .jr-road-caption").textContent(),/14 steps/);
    });
    await check("cloud-hydration-baseline",viewports[1],"light","hub-after",async page=>{
      assert.equal(await page.locator(".jr-moment").count(),0);
      assert.equal(await page.locator(".jr-mirror-claimed").count(),1);
    },true);
    assert.deepEqual(unexpected,[]);
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,process.env.JOURNEY_CASE?"targeted-results.json":"results.json"),JSON.stringify({results,writes:writes.length,unexpected,errors},null,2));
    if(failures)throw new Error(`${failures} browser failures; stopped at two failures.`);
    console.log(`BROWSER PASS: ${results.length} cases; ${writes.length} writes intercepted; no escaped mutations or browser errors.`);
  } finally {await browser.close();}
}
if(process.env.JOURNEY_BROWSER==="1")browserTests().catch(e=>{console.error(e);process.exitCode=1;});
