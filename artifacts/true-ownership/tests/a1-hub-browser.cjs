const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {chromium}=require("playwright");
const {fixtures}=require("./a1-fixtures.cjs");
const {proveIsolation,installIsolation}=require("./browser-isolation.cjs");
const out=path.resolve("generated-artifacts/a1-hub"),url=process.env.J1_BASE_URL||"http://localhost:80";
const f=fixtures(),none={vision:f.vision,mirror3:f.identity};
const rcComplete={"to_rc_state_v1":f.rc},order=["values","identity","purpose","vision"];
const flags=Object.fromEntries([1,2,3,4].map(n=>["a1_ex"+n+"_done",true]));
const completeMap={vision:{...f.vision,complete:true,time_complete:true,wealth_complete:true,self_complete:true,
  twoFutures:{...f.vision.twoFutures,complete:true}},mirror3:{...f.identity,sealCompleted:true,
  pickedGifts:[{id:"g_wise",label:"Wise",theme:"mind",state:"owned",custom:false}]},purpose_final:"To help people grow."};
const completeValues={...f.values,claimed:true,claimedAt:"2026-10-31T12:00:00Z"};
const completeLocal={...rcComplete,...flags,to_map:completeMap,to_mirror4_state_v1:completeValues};
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:["--no-sandbox"]});
  const results=[],errors=[],writes=[],unexpected=[];
  await proveIsolation(browser);
  async function open(options={}) {
    const context=await browser.newContext({serviceWorkers:"block",viewport:{width:options.width||1366,height:options.height||680}});
    await installIsolation(context,writes,unexpected,()=>({intake:{name:"Fixture"},phase:options.phase||"a1",...(options.cloud||{})}));
    const page=await context.newPage();page.setDefaultTimeout(10000);
    page.on("pageerror",e=>errors.push(e.message));
    await page.exposeBinding("__a1Error",(_,message)=>errors.push(String(message)));
    await page.addInitScript(({local,route,theme,preview})=>{
      window.addEventListener("error",e=>window.__a1Error(e.message));
      window.addEventListener("unhandledrejection",e=>window.__a1Error(String(e.reason)));
      if(sessionStorage.getItem("a1-fixture"))return;
      sessionStorage.setItem("a1-fixture","1");
      for(const [key,value]of Object.entries(local))localStorage.setItem(key,JSON.stringify(value));
      localStorage.setItem("na1_theme",theme);
      localStorage.setItem("to_app_route_v1",JSON.stringify(route));
      if(preview)sessionStorage.setItem("to_dev_preview","1");
    },{local:options.local||{},route:options.route||{view:"grid",overlay:null},theme:options.theme||"light",preview:!!options.preview});
    await page.goto(url+"/");
    if(options.phase!=="_mapofme" && !options.route)await page.locator(".na1-mirror-grid").waitFor();
    await page.evaluate(()=>document.fonts.ready);
    return {page,context};
  }
  async function check(name,options,fn) {
    if(process.env.A1_CASE && !new RegExp(process.env.A1_CASE).test(name))return;
    let context;
    try {const opened=await open(options);context=opened.context;await fn(opened.page);results.push({name,pass:true});}
    catch(e){results.push({name,pass:false,error:e.message});}
    finally{if(context)await context.close();}
  }
  const card=(page,key)=>page.locator(`[data-a1-mirror="${key}"]`);
  const locked=async(page,key)=>await card(page,key).getAttribute("aria-disabled")==="true";
  for(const [width,height]of [[375,812],[1280,800],[1366,680]])for(const theme of ["light","dark"]) {
    await check(`hub ${width}x${height} ${theme}`,{width,height,theme,local:rcComplete},async page=>{
      assert.deepEqual(await page.locator(".na1-mirror-grid > article").evaluateAll(els=>els.map(e=>e.dataset.a1Mirror)),order);
      assert.deepEqual(await page.locator(".na1-mirror-card-num").allTextContents(),["01","02","03","04"]);
      assert.equal(await page.locator(".a1-future-b-thread").count(),4);
      assert((await page.locator(".a1-future-b-card").textContent()).includes(f.rc.futureB5.tuesday));
      assert.equal(await locked(page,"values"),false);
      for(const key of ["identity","purpose","vision"])assert.equal(await locked(page,key),true);
      const geometry=await page.locator(".na1-mirror-grid").evaluate(el=>{
        const r=Array.from(el.children).map(c=>c.getBoundingClientRect());
        return {columns:getComputedStyle(el).gridTemplateColumns.split(" ").length,top:r.map(x=>x.top),
          overflow:document.documentElement.scrollWidth>innerWidth+1};
      });
      assert.equal(geometry.columns,width<768?1:2);
      assert.equal(geometry.overflow,false);
      await page.screenshot({path:path.join(out,`${width}-${height}-${theme}.png`),fullPage:true});
    });
  }
  await check("new account: RC required and no Future B",{},async page=>{
    for(const key of order)assert.equal(await locked(page,key),true);
    assert((await card(page,"values").textContent()).includes("Unlocks after the Reality Check"));
    assert.equal(await page.locator(".a1-future-b-card").count(),0);
    assert.equal(await page.locator(".a1-future-b-thread").count(),0);
  });
  for(const [name,local,cloud]of [
    ["Future A incomplete",{to_rc_state_v1:{...f.rc,choice:"A",complete:false}},{}],
    ["Future A complete",{to_rc_state_v1:{...f.rc,choice:"A"}},{}],
    ["completed round",{to_rc_state_v1:{...f.rc,complete:false,choice:null,rounds:[f.rc]}},{}],
    ["Purpose draft",{to_map:{purpose_draft:"My unfinished why."}},{}],
    ["cloud-only Purpose draft",{}, {map:{purpose_draft:"Cloud-only why."}}],
    ["A3 only",{to_a3_state_v1:{}},{}],
    ["A5 only",{to_a5_state_v1:{}},{}],
  ])await check(name,{local,cloud},async page=>{
    assert.equal(await locked(page,"values"),name==="Future A incomplete");
    if(name.includes("draft"))assert.equal(await locked(page,"purpose"),false);
    assert.equal(await page.locator(".a1-future-b-card").count(),0);
  });
  await check("old-order Purpose claim and Vision draft never relock",{
    local:{...flags,to_map:{purpose_final:"My why",vision:{...f.vision,time:{...f.vision.time,overall:"Time draft"}}}}
  },async page=>{
    for(const key of ["values","purpose","vision"])assert.equal(await locked(page,key),false);
    assert.equal(await locked(page,"identity"),true);
    await page.reload();await page.locator(".na1-mirror-grid").waitFor();
    assert.equal(await locked(page,"vision"),false);
  });
  for(const [label,local,next]of [
    ["Values claimed",{...rcComplete,to_mirror4_state_v1:completeValues},"identity"],
    ["Identity claimed",{...rcComplete,to_map:{mirror3:completeMap.mirror3}},"purpose"],
    ["Purpose complete",{...rcComplete,...flags,to_map:{purpose_final:"My why"}},"vision"],
  ])await check(label,{local},async page=>assert.equal(await locked(page,next),false));
  await check("returning all claimed",{local:completeLocal},async page=>{
    for(const key of order)assert.equal(await locked(page,key),false);
    assert.deepEqual(await page.locator(".na1-mirror-card-status").allTextContents(),["Complete","Complete","Complete","Complete"]);
  });
  await check("Reality Check Begin returns to Values up next",{local:rcComplete,route:{view:"rcroom",overlay:null}},async page=>{
    await page.locator('.rc-room[data-step="13"]').waitFor();
    await page.getByRole("button",{name:"Start my path →",exact:true}).click();
    await page.locator(".na1-mirror-grid").waitFor();
    assert.equal((await card(page,"values").locator(".na1-mirror-card-status").textContent()).trim(),"Up next");
    assert(await card(page,"values").evaluate(e=>e.classList.contains("is-vision-up-next")));
  });
  for(const [width,height]of [[375,812],[1280,800],[1366,680]])for(const theme of ["light","dark"]) {
    await check(`Map ${width}x${height} ${theme}`,{local:completeLocal,phase:"_mapofme",width,height,theme},async page=>{
      await page.getByText("What I value",{exact:true}).waitFor();
      const tops=[];
      for(const title of ["What I value","Who I am","My why","Where I'm going"])
        tops.push(await page.getByText(title,{exact:true}).evaluate(e=>e.getBoundingClientRect().top));
      assert.deepEqual(tops,[...tops].sort((a,b)=>a-b));
      assert.equal(await page.getByText("Big Ass Goal · the integrated three",{exact:true}).count(),1);
    });
  }
  for(const [label,route,button]of [
    ["Values seal",{view:"m4",overlay:{hubId:"m4",roomId:"claim"}},"Continue to Identity →"],
    ["Identity seal",{view:"m3",overlay:{hubId:"m3",roomId:"ownIt"}},"Continue to Purpose →"],
  ])await check(label,{width:375,height:812,local:completeLocal,route},async page=>{
    const forward=page.getByRole("button",{name:button,exact:true});await forward.waitFor();
    await page.reload();await forward.waitFor();
    assert.equal(await page.locator(".na1-veil").count(),0);
    await forward.click();await page.locator(".na1-mirror-grid").waitFor();
  });
  await check("Preview restores real progress without writes",{local:{to_map:{purpose_draft:"Real draft"}},preview:true},async page=>{
    for(const key of order)assert.equal(await locked(page,key),false);
    const writesBefore=writes.length;
    await card(page,"vision").locator(".na1-mirror-card-action button").click();
    await page.locator(".na1-ex-title").waitFor();
    await page.evaluate(async()=>{
      const dev=await import("/src/devPreview.ts");
      dev.previewWrite("to_map",JSON.stringify({purpose_draft:"PREVIEW ONLY"}));
    });
    assert.equal(writes.length,writesBefore,"no userdata writes while Preview is on");
    await page.evaluate(async()=>(await import("/src/devPreview.ts")).setDevPreview(false));
    await page.waitForLoadState("load");await page.locator(".na1-mirror-grid").waitFor();
    assert.equal(await locked(page,"identity"),true);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("to_map")).purpose_draft),"Real draft");
  });
  for(const [view,number]of [["m4",1],["m3",2],["explore",3],["explore2",4]])
    for(const [width,height]of [[375,812],[1280,800],[1366,680]])for(const theme of ["light","dark"])
      await check(`mirror hub ${view} ${width}x${height} ${theme}`,
        {local:completeLocal,route:{view,overlay:null},width,height,theme},async page=>{
          const eyebrow=page.locator(".na1-ex-eyebrow");
          await eyebrow.waitFor();
          assert((await eyebrow.textContent()).includes(`Mirror ${number}`));
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
        });
  await check("Purpose handoff",{local:completeLocal,route:{view:"explore",overlay:null},width:375,height:812},async page=>{
    await page.locator(".na1-ex-row").last().click();
    await page.getByRole("textbox",{name:"Your Purpose",exact:true}).fill("To help people grow together.");
    await page.getByRole("button",{name:/Declare Purpose/}).click();
    const forward=page.getByRole("button",{name:"Continue to Vision →",exact:true});
    await forward.waitFor();await forward.click();await page.locator(".na1-mirror-grid").waitFor();
  });
  await check("Vision handoff",{local:completeLocal,route:{view:"explore2",overlay:null},width:375,height:812},async page=>{
    await page.locator(".na1-ex-row").last().click();
    const forward=page.getByRole("button",{name:"Back to A1 →",exact:true});
    await forward.waitFor();await forward.click();await page.locator(".na1-mirror-grid").waitFor();
  });
  await check("long Future B words remain intact",{width:375,height:812,local:{
    to_rc_state_v1:{...f.rc,futureB5:{...f.rc.futureB5,tuesday:f.rc.futureB5.tuesday.repeat(8)}}
  }},async page=>{
    assert.equal(await page.locator(".a1-future-b-card blockquote").textContent(),`“${f.rc.futureB5.tuesday.repeat(8)}”`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    assert((await page.locator(".a1-future-b-card blockquote").evaluate(e=>getComputedStyle(e).fontFamily)).includes("Cormorant"));
  });
  await check("partial Future B never invents words or dates",{local:{
    to_rc_state_v1:{...f.rc,completedAt:null,futureB5:{tuesday:""},futureB1:{oneThing:""}}
  }},async page=>{
    assert.equal(await page.locator(".a1-future-b-card").count(),1);
    assert.equal(await page.locator(".a1-future-b-card blockquote").count(),0);
    assert.equal(await page.locator(".a1-future-b-week").count(),0);
    assert(!(await page.locator(".a1-future-b-head").textContent()).includes("Chosen"));
  });
  assert.deepEqual(unexpected,[]);
  console.log(JSON.stringify({results,runtimeErrors:errors,writesIntercepted:writes.length},null,2));
  await browser.close();
  process.exitCode=results.some(r=>!r.pass)||errors.length?1:0;
})().catch(e=>{console.error(e);process.exit(1)});
