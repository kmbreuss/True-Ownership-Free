// Default-release acceptance: fake member, fail-closed writes, no real login.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const http=require("node:http");
const {chromium}=require("playwright");
const {installIsolation,proveIsolation}=require("./browser-isolation.cjs");
const production=process.env.RC_RELEASE_PRODUCTION==="1";
const out=path.resolve("generated-artifacts/rc-release");
const fixtureFile=path.join(out,"fixtures.json");
const pause=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
  fs.mkdirSync(out,{recursive:true});
  let server, base=process.env.J1_BASE_URL||"http://localhost:80";
  if(production) {
    const root=path.resolve(__dirname,"../dist/public");
    assert(fs.existsSync(path.join(root,"index.html")),"Build production first");
    const mime={".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".png":"image/png",".woff2":"font/woff2"};
    server=http.createServer((req,res)=>{
      const file=path.resolve(root,"."+decodeURIComponent(new URL(req.url,"http://test").pathname));
      if(file!==root && !file.startsWith(root+path.sep)) {res.writeHead(403);return res.end();}
      const target=fs.existsSync(file)&&fs.statSync(file).isFile()?file:path.join(root,"index.html");
      res.setHeader("Content-Type",mime[path.extname(target)]||"text/html");res.end(fs.readFileSync(target));
    });
    await new Promise(r=>server.listen(0,"127.0.0.1",r));
    base=`http://127.0.0.1:${server.address().port}`;
  }
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:["--no-sandbox"]});
  const writes=[],unexpected=[],errors=[],checks=[];
  let page;
  try {
    await proveIsolation(browser);
    const context=await browser.newContext({viewport:{width:1366,height:680},serviceWorkers:"block"});
    let cloud={},delay=0,cloudGate=null,failCloud=false;
    await installIsolation(context,writes,unexpected,async()=>{
      if(cloudGate) await cloudGate;
      if(delay) await pause(delay);
      return {intake:{name:"Synthetic preview"},phase:"a1",...cloud};
    });
    await context.route("**/api/userdata",route=>{
      if(failCloud && route.request().method()==="GET")
        return route.fulfill({status:503,json:{error:"Synthetic unavailable cloud"}});
      return route.fallback(); // All mutations still pass through fail-closed isolation.
    });
    page=await context.newPage();page.setDefaultTimeout(10000);
    page.on("pageerror",e=>errors.push(e.message));
    await page.exposeBinding("__rcError",(_,v)=>errors.push(String(v)));
    await page.addInitScript(()=>{
      window.addEventListener("error",e=>window.__rcError(e.message||"error event"));
      window.addEventListener("unhandledrejection",e=>window.__rcError(String(e.reason)));
    });
    await page.goto(base+"/");
    await page.locator(".na1-root").first().waitFor();
    let fixtures;
    if(!production) {
      fixtures=await page.evaluate(async()=>{
        const rc=await import("/src/rcConstants.ts");
        const defs=[
          ["a2state","to_a2_state_v1","a2Constants","EMPTY_A2"],
          ["a3state","to_a3_state_v1","a3Constants","EMPTY_A3"],
          ["a4state","to_a4_state_v1","a4Constants","EMPTY_A4"],
          ["a5state","to_a5_state_v1","a5Constants","EMPTY_A5"],
        ];
        function fillFirst(obj,trail=[]) {
          for(const [k,v] of Object.entries(obj)) {
            if(/^(version|step|currentStep|maxReached|updatedAt|createdAt|lastSaved|lastViewed|lastOpened|activeTab|section)$/.test(k)) continue;
            if(v==="") {obj[k]="An existing reflection";return [...trail,k].join(".");}
            if(v && typeof v==="object" && !Array.isArray(v)) {
              const result=fillFirst(v,[...trail,k]);if(result)return result;
            }
          }
          return null;
        }
        const progress=[
          {name:"A1 Purpose draft",sk:"a1progress",local:{a1_peel_draft:"My existing reason"},value:{a1_peel_draft:"My existing reason"}},
          {name:"A1 first answer",sk:"a1progress",local:{a1_sym_holdback:"My existing answer"},value:{a1_sym_holdback:"My existing answer"}},
          {name:"A1 claimed mirror",sk:"a1progress",
            local:{a1_ex1_done:true,a1_ex2_done:true,a1_ex3_done:true,a1_ex4_done:true},
            value:{a1_ex1_done:true,a1_ex2_done:true,a1_ex3_done:true,a1_ex4_done:true}},
          {name:"A1 started exercise only",sk:"a1progress",local:{a1_to_curq:0},value:{a1_to_curq:0}},
        ];
        for(const [sk,key,file,exportName] of defs) {
          const m=await import(`/src/${file}.ts`), value=structuredClone(m[exportName]);
          const answer=fillFirst(value);if(!answer)throw new Error(`No real answer field found in ${file}`);
          progress.push({name:sk+" "+answer,sk,value,local:{[key]:value}});
          if(sk==="a3state"||sk==="a5state") {
            const firstScreen=structuredClone(m[exportName]);
            progress.push({name:sk+" saved first screen",sk,value:firstScreen,local:{[key]:firstScreen}});
          }
        }
        const empty=rc.normalizeRC(null);
        const complete=rc.normalizeRC({...empty,startedAt:"2026-10-01T12:00:00Z",completedAt:"2026-10-01T12:10:00Z",
          step:13,maxReached:13,mirror:rc.RC_MIRROR.map(v=>v.id),complete:true,choice:"B",willing:"yes",
          futureB1:{doing:"Making room",oneThing:"Commit to one hour"}});
        return {empty,complete,progress};
      });
      fs.writeFileSync(fixtureFile,JSON.stringify(fixtures,null,2));
    } else fixtures=JSON.parse(fs.readFileSync(fixtureFile));
    async function render({route="grid",stores={},remote={},lag=0,query=""}={}) {
      cloud=remote;delay=lag;
      await page.evaluate(({route,stores})=>{
        localStorage.clear();sessionStorage.clear();
        for(const [k,v] of Object.entries(stores)) localStorage.setItem(k,JSON.stringify(v));
        localStorage.setItem("to_app_route_v1",JSON.stringify({view:route,overlay:null}));
        localStorage.setItem("na1_theme","light");
      },{route,stores});
      await page.goto(base+"/"+query,{waitUntil:"domcontentloaded"});
      await page.locator(".na1-spine,.rc-hub,.rc-room,.na1-root").first().waitFor();
      await page.evaluate(()=>document.fonts.ready);
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    }
    const start=()=>page.locator(".na1-spine button").filter({hasText:"Reality Check"});
    await render();
    assert.equal(new URL(page.url()).search,"");
    assert.equal(await start().count(),1);
    assert.equal(await start().locator(".na1-vertebra-num").innerText(),"Start");
    assert.equal(await page.getByRole("button",{name:"Begin the Reality Check →",exact:true}).count(),1);
    await start().click();await page.locator(".rc-hub").waitFor();
    assert.equal(await page.getByRole("heading",{name:"Before you start, a reality check.",exact:true}).count(),1);
    await page.screenshot({path:path.join(out,`${production?"production":"development"}-default.png`)});
    checks.push("plain URL: Start spine, current start page, A1 locked");
    for(const route of ["explore","explore2","m3","m4"]) {
      await render({route});
      // Empty Identity/Values restores deliberately fall back to the locked
      // grid before the route guard. Preserve that existing room-eligibility rule.
      if(await page.locator(".rc-hub").count()===0) {
        assert(["m3","m4"].includes(route));
        await page.getByRole("button",{name:"Begin the Reality Check →",exact:true}).click();
        await page.locator(".rc-hub").waitFor();
      }
      assert.equal(await page.locator(".rc-hub").count(),1,route+" cannot bypass RC");
    }
    checks.push("all four A1 room routes block pristine accounts");
    await render({route:"explore",stores:{to_map:{}}});
    assert.equal(await page.locator(".rc-hub").count(),1,"Intake and navigation alone cannot grant exemption");
    for(const p of fixtures.progress) for(const remote of [false,true]) {
      await render({stores:remote?{}:p.local,
        remote:remote?{[p.sk]:{t:Date.now()+10000,v:p.value}}:{},lag:remote?180:0});
      assert.equal(await page.locator(".rc-hub").count(),0,p.name);
      assert(await start().textContent().then(v=>v.includes("Start here · New")),p.name+" optional badge");
      await page.getByRole("button",{name:/^(Enter Purpose|Begin Purpose|Continue Purpose|Review Purpose)/}).first().click();
      assert.equal(await page.locator(".rc-hub").count(),0,p.name+" cannot be re-locked");
      await page.reload();
      await page.locator(".na1-root,.na1-spine").first().waitFor();
      assert.equal(await page.locator(".rc-hub").count(),0,p.name+" refresh");
      checks.push(`${p.name}: ${remote?"delayed cloud":"local"} progress stays unlocked`);
    }
    const cloudOnly=fixtures.progress.find(p=>p.sk==="a3state");
    let releaseCloud;
    cloudGate=new Promise(resolve=>{releaseCloud=resolve});
    const waitingRequest=page.waitForRequest(r=>new URL(r.url()).pathname==="/api/userdata"&&r.method()==="GET");
    const waitingRender=render({remote:{[cloudOnly.sk]:{t:Date.now(),v:cloudOnly.value}}});
    await waitingRequest;
    await page.waitForTimeout(200);
    assert.equal(await page.locator(".na1-spine,.rc-hub").count(),0,"Do not classify before cloud hydration");
    releaseCloud();cloudGate=null;await waitingRender;
    assert((await start().textContent()).includes("Start here · New"));
    checks.push("held cloud response: no premature new-user decision");
    failCloud=true;
    await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();localStorage.setItem("to_app_route_v1",JSON.stringify({view:"grid",overlay:null}))});
    await page.goto(base+"/");
    await page.getByRole("alert").waitFor();
    assert.equal(await page.locator(".na1-spine,.rc-hub").count(),0,"Cloud failure is not an empty account");
    failCloud=false;
    await page.getByRole("button",{name:"Retry loading progress",exact:true}).click();
    await start().waitFor();
    assert((await start().textContent()).includes("Start here · New"));
    checks.push("cloud failure: explicit retry, never classified new; cloud-only answers restored");
    for(const state of [fixtures.complete,{...fixtures.empty,rounds:[fixtures.complete]}]) {
      await render({route:"explore",stores:{to_rc_state_v1:state}});
      assert.equal(await page.locator(".rc-hub").count(),0,"Completion/redo cannot re-lock A1");
      assert.equal(JSON.parse(await page.evaluate(()=>localStorage.getItem("to_rc_state_v1"))).rounds.length,state.rounds.length);
    }
    checks.push("completion and completed-round redo preserve access");
    for(let step=0;step<=13;step++) {
      await render({route:"rcroom",stores:{to_rc_state_v1:{...fixtures.complete,step}}});
      assert.equal(await page.locator(".rc-room").getAttribute("data-step"),String(step));
      assert.equal(await page.getByText("Two futures · coming next",{exact:true}).count(),0);
    }
    checks.push("all current scene IDs render without feature flags");
    await render({route:"rc",query:"?newRC=0"});
    assert.equal(await page.locator(".rc-hub").count(),1,"Retired flag cannot disable RC");
    if(production) {
      await render({route:"explore",query:"?preview=1"});
      assert.equal(await page.locator(".rc-hub").count(),1,"Production Preview cannot bypass member gating");
      assert.equal(await page.getByText("Simulate free access (not saved)",{exact:true}).count(),0);
      checks.push("production remains member-only; DEV Preview/free simulation unavailable");
    }
    assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
    console.log(JSON.stringify({mode:production?"production":"development",checks,writesIntercepted:writes.length,runtimeErrors:errors}));
  } finally {
    if(page) await page.screenshot({path:path.join(out,`${production?"production":"development"}-last.png`)}).catch(()=>{});
    await browser.close();
    if(server)await new Promise(r=>server.close(r));
  }
})().catch(e=>{console.error(e.stack);process.exitCode=1});
