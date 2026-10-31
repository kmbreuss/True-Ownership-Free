const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {chromium}=require("playwright");
const {fixtures,modules}=require("./a1-fixtures.cjs");
const {proveIsolation,installIsolation}=require("./browser-isolation.cjs");
const f=fixtures(),{load}=modules(),out=path.resolve("generated-artifacts/a1-2");
const url=process.env.J1_BASE_URL||"http://localhost:80";
const identity={...f.identity,sealCompleted:true,pickedGifts:[{id:"g_wise",label:"Wise",theme:"mind",state:"owned",custom:false}],
  clusters:[{id:"c_eagle",name:"The guide",animal:"Eagle",descriptorWord1:"Clear",descriptorWord2:"Bold",giftIds:["g_wise"]}]};
const values={...f.values,claimed:true,rank:["v2","v1"],clusters:[
  {id:"v1",userName:"Kindness",proposal:"",proposedNames:[],behaviorIds:[],flips:[],userDefinition:"Care",status:"complete",colorIndex:1,peelChain:[]},
  {id:"v2",userName:"Freedom",proposal:"",proposedNames:[],behaviorIds:[],flips:[],userDefinition:"Choice",status:"complete",colorIndex:2,peelChain:[]}]};
const rc={...f.rc,tuesday:"I feel stretched thin. I never finish.",futureB5:{...f.rc.futureB5,
  tuesday:"My future Tuesday makes room for the things that I care about and the people I love."}};
const base={to_rc_state_v1:rc,to_mirror4_state_v1:values,to_map:{mirror3:identity}};
const flags={a1_ex2_done:true,a1_ex3_done:true,a1_ex4_done:true};
const complete={...base,...flags,to_map:{mirror3:identity,purpose_final:"To help people grow.",
  vision:{...f.vision,complete:true}},to_a2_state_v1:{...load("a2Constants").EMPTY_A2,
    m1:{...load("a2Constants").EMPTY_A2.m1,claimed:true},
    m2:{...load("a2Constants").EMPTY_A2.m2,claimed:true},
    m3:{...load("a2Constants").EMPTY_A2.m3,claimed:true}}};
const room=key=>({view:"explore",overlay:{hubId:"m1",roomId:key}});
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:["--no-sandbox"]});
  await proveIsolation(browser);
  const results=[],writes=[],unexpected=[],errors=[];
  async function open(options) {
    const context=await browser.newContext({serviceWorkers:"block",
      viewport:{width:options.width||1366,height:options.height||680}});
    await installIsolation(context,writes,unexpected,()=>({intake:{name:"Fixture"},phase:options.phase||"a1",...(options.cloud||{})}));
    const page=await context.newPage();page.setDefaultTimeout(10000);
    page.on("pageerror",e=>errors.push(e.message));
    await page.exposeBinding("__purposeError",(_,message)=>errors.push(String(message)));
    await page.addInitScript(({local,route,theme,preview})=>{
      window.addEventListener("error",e=>window.__purposeError(e.message));
      window.addEventListener("unhandledrejection",e=>window.__purposeError(String(e.reason)));
      if(sessionStorage.getItem("purpose-seeded"))return;
      sessionStorage.setItem("purpose-seeded","1");
      for(const [key,value]of Object.entries(local))localStorage.setItem(key,JSON.stringify(value));
      localStorage.setItem("na1_theme",theme);localStorage.setItem("to_app_route_v1",JSON.stringify(route));
      if(preview)sessionStorage.setItem("to_dev_preview","1");
    },{local:options.local||base,route:options.route||{view:"grid",overlay:null},theme:options.theme||"light",preview:!!options.preview});
    await page.goto(url+"/");await page.evaluate(()=>document.fonts.ready);
    return {context,page};
  }
  async function check(name,options,fn) {
    if(process.env.PURPOSE_CASE&&!new RegExp(process.env.PURPOSE_CASE).test(name))return;
    let current;
    try{current=await open(options);await fn(current.page);results.push({name,pass:true});}
    catch(e){results.push({name,pass:false,error:e.message});if(current)await current.page.screenshot({path:path.join(out,name.replace(/\W/g,"_")+".png")}).catch(()=>{});}
    finally{
      fs.writeFileSync(path.join(out,"results.json"),JSON.stringify({results,runtimeErrors:errors,writesIntercepted:writes.length},null,2));
      if(current)await current.context.close();
    }
  }
  for(const [width,height]of [[375,812],[1280,800],[1366,680]])for(const theme of ["light","dark"])
    for(const screen of ["A1","Purpose","to","peel","declare","Map","A2"]) {
      const options={width,height,theme,local:complete,
        route:["to","peel","declare"].includes(screen)?room(screen):
          {view:screen==="Purpose"?"explore":screen==="A2"?"a2":"grid",overlay:null},
        phase:screen==="Map"?"_mapofme":"a1"};
      await check(`${screen} ${width}x${height} ${theme}`,options,async page=>{
        if(["to","peel","declare"].includes(screen)) {
          await page.locator(".na1-room-card").waitFor();
          assert.equal(await page.locator(".na1-veil").count(),0);
          if(screen==="to") {
            assert((await page.locator(".na1-q1-callout").textContent()).includes('In your Reality Check you wrote: "I feel stretched thin."'));
          } else {
            const strip=page.locator(".purpose-named-context");await strip.waitFor();
            assert((await strip.textContent()).includes("Freedom, Kindness"));
            assert((await strip.textContent()).includes("Clear Bold Eagle"));
            const positioning=await page.locator(".purpose-context-layout").evaluate(e=>{
              const a=e.children[0].getBoundingClientRect(),b=e.children[1].getBoundingClientRect();
              return {asideTop:a.top,mainTop:b.top,asideLeft:a.left,mainLeft:b.left};
            });
            assert(width<=600?positioning.asideTop<positioning.mainTop:positioning.asideLeft<positioning.mainLeft);
            if(screen==="peel")assert.equal(await page.locator(".purpose-future-prompt").count(),1);
            else assert.equal(await page.getByText("Your why comes from what you stand for and what you carry.",{exact:true}).count(),1);
          }
          assert.equal(await page.locator(".na1-room-card").evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
        } else if(screen==="Map") {
          await page.getByText("What I was holding back",{exact:true}).waitFor();
          assert.equal(await page.getByText("I feel stretched thin.",{exact:true}).count(),1);
        } else if(screen==="Purpose") {
          await page.locator(".na1-ex-row").first().waitFor();
          assert.deepEqual(await page.locator(".na1-ex-name").allTextContents(),["True Ownership","The Peel","Declare"]);
          assert((await page.locator(".na1-ex-sub").textContent()).includes("Three exercises."));
        } else {
          await page.locator(".na1-mirror-grid").waitFor();
          const meta=await page.locator(".na1-hero-meta").textContent();
          assert(!meta.includes("remaining"));
          assert(meta.includes(screen==="A1"?"4 of 4":"3 of 3"));
          if(screen==="A1")assert((await page.locator('[data-a1-mirror="purpose"] .na1-mirror-card-meta').textContent()).includes("3 exercises"));
        }
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
        assert.equal(await page.getByRole("button",{name:/Owned Symptoms/}).count(),0);
        await page.screenshot({path:path.join(out,`${screen}-${width}-${height}-${theme}.png`)});
      });
    }
  await check("Future A has fallback but no B prompt",{local:{...base,...flags,to_rc_state_v1:{...rc,choice:"A"}},route:room("peel")},async page=>{
    await page.locator(".na1-room-card").waitFor();assert.equal(await page.locator(".purpose-future-prompt").count(),0);
  });
  await check("existing answer wins without writes to retired fields",{local:{...complete,a1_ex1_done:true,a1_sym_holdback:"My original answer"},route:room("to")},async page=>{
    await page.locator(".na1-q1-callout").waitFor();
    assert((await page.locator(".na1-q1-callout").textContent()).includes('You named your one thing: "My original answer"'));
    await page.reload();await page.locator(".na1-q1-callout").waitFor();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("a1_sym_holdback"))),"My original answer");
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("a1_ex1_done"))),true);
  });
  const answers=["feeling-only","heavy","feeling-only","feeling-only","completion","heavy"]
    .map(type=>({type,text:"Saved draft",feeling:"Hopeful",c1:"Saved",c2:"answer"}));
  await check("midway user restores question and drafts",{local:{...base,a1_ex1_done:true,a1_to_curq:2,a1_to_answers:answers},route:room("to")},async page=>{
    await page.locator('.na1-substep-dots[aria-label="Question 3 of 6"]').waitFor();
    assert.equal(await page.locator(".na1-q1-callout").count(),0);
    await page.reload();await page.locator('.na1-substep-dots[aria-label="Question 3 of 6"]').waitFor();
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem("a1_to_answers"))),answers);
  });
  await check("stale Owned Symptoms route never opens",{local:complete,route:room("sym")},async page=>{
    await page.locator(".na1-ex-row").first().waitFor();
    assert.equal(await page.locator(".na1-room-card").count(),0);
    assert.equal(await page.getByRole("button",{name:/Owned Symptoms/}).count(),0);
  });
  await check("empty context and answers stay hidden",{local:{...flags,to_rc_state_v1:{...rc,tuesday:"",choice:"A"}},route:room("declare")},async page=>{
    await page.locator(".na1-room-card").waitFor();
    assert.equal(await page.locator(".purpose-named-context").count(),0);
  });
  await check("each active room refreshes without veil and clears on close",{local:complete,route:room("peel")},async page=>{
    for(const key of ["peel","declare","to"]) {
      await page.evaluate(key=>localStorage.setItem("to_app_route_v1",JSON.stringify({view:"explore",overlay:{hubId:"m1",roomId:key}})),key);
      await page.reload();await page.locator(".na1-room-card").waitFor();
      assert.equal(await page.locator(".na1-veil").count(),0);
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("to_app_route_v1")).overlay.roomId),key);
    }
    await page.getByRole("button",{name:"Close",exact:true}).click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem("to_app_route_v1")).overlay===null);
  });
  await check("fresh and partial time uses unfinished exercises",{local:base},async page=>{
    await page.locator(".na1-mirror-grid").waitFor();
    const before=await page.locator(".na1-hero-meta").textContent();
    assert(before.includes("remaining"));
    await page.evaluate(()=>localStorage.setItem("a1_ex2_done","true"));
    await page.reload();await page.locator(".na1-mirror-grid").waitFor();
    const after=await page.locator(".na1-hero-meta").textContent();
    assert.notEqual(before,after);
  });
  await check("Preview opens active rooms and restores real answers",{local:{...base,a1_sym_holdback:"Real answer"},preview:true,route:{view:"explore",overlay:null}},async page=>{
    await page.locator(".na1-ex-row").first().waitFor();
    assert.equal(await page.locator(".na1-ex-row:disabled").count(),0);
    const count=writes.length;
    await page.getByRole("button",{name:/The Peel —/}).click();
    await page.locator(".na1-room-card").waitFor();
    await page.evaluate(async()=>{
      const dev=await import("/src/devPreview.ts");dev.previewWrite("a1_sym_holdback",JSON.stringify("PREVIEW ONLY"));
    });
    assert.equal(writes.length,count);
    await page.evaluate(async()=>(await import("/src/devPreview.ts")).setDevPreview(false));
    await page.waitForLoadState("load");await page.locator(".na1-ex-row").first().waitFor();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("a1_sym_holdback"))),"Real answer");
    assert.equal(await page.locator(".na1-ex-row:disabled").count(),2);
  });
  assert.deepEqual(unexpected,[]);
  const report={results,runtimeErrors:errors,writesIntercepted:writes.length};
  fs.writeFileSync(path.join(out,"results.json"),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));await browser.close();
  process.exitCode=results.some(r=>!r.pass)||errors.length?1:0;
})().catch(e=>{console.error(e);process.exit(1)});
