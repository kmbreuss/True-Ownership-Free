const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {chromium}=require("playwright");
const {fixtures,modules,plain}=require("./a1-fixtures.cjs");
const {proveIsolation,installIsolation}=require("./browser-isolation.cjs");
const f=fixtures(),{load}=modules(),out=path.resolve("generated-artifacts/a1-4");
function data({complete=true,choice="B",notice=false}={}) {
  const v=plain(f.vision);
  for(const area of ["time","wealth","self"])v[area+"_complete"]=true;
  v.time.work.blank1="Mornings for deep work. Evenings are mine.";
  v.wealth.cashflow.blank1="The business pays me first, and runs without me.";
  v.self.selfTreatment.blank1="Rested, clear, and proud of who I'm becoming.";
  if(complete){v.complete=true;v.declaration={claimedAt:"2026-10-31T10:00:00Z",sealSeen:true,revisedAt:[]};}
  const values={...plain(f.values),claimed:true,rank:["v1","v2","v3"],clusters:["Integrity","Hope","Love"].map((name,i)=>({
    id:`v${i+1}`,proposal:name,proposedNames:[],behaviorIds:[],flips:[],userName:name,userDefinition:"",keystoneBehaviorId:null,
  }))};
  const identity={...plain(f.identity),sealCompleted:true,clusters:[["Owl","Wise"],["Bear","Steady"],["Dolphin","Playful"]].map(([animal,word],i)=>({
    id:`c_${i}`,name:word,nameWasEdited:false,animal,animalEmoji:"",descriptorWord1:word,descriptorWord2:"",giftIds:[],
  }))};
  const local={to_map:{purpose_final:"Shine the light.",mirror3:identity,vision:v},to_mirror4_state_v1:values,
    a1_ex2_done:true,a1_ex3_done:true,a1_ex4_done:true,
    to_rc_state_v1:{...plain(f.rc),choice,mirror:load("rcConstants").RC_MIRROR.filter(m=>m.default==="carrying").map(m=>m.id)},
    to_setaside_v1:{version:1,items:[{id:"unrelated",text:"Keep this",source:"reality-check",round:"old",createdAt:"then"}]}};
  if(notice)local.a1_notice={value:"Integrity",lived:"I spoke up.",didnt:"I delayed the call.",savedAt:"2026-10-31T10:00:00Z"};
  return local;
}
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:["--no-sandbox"]});
  await proveIsolation(browser);
  const results=[],writes=[],unexpected=[],errors=[];
  async function check(name,options,fn) {
    if(process.env.A1_END_CASE&&!new RegExp(process.env.A1_END_CASE).test(name))return;
    const context=await browser.newContext({serviceWorkers:"block",viewport:{width:options.width||1366,height:options.height||680}});
    await installIsolation(context,writes,unexpected,()=>({intake:{name:"Fixture"},phase:options.phase||"a1"}));
    const page=await context.newPage();page.setDefaultTimeout(10000);
    page.on("pageerror",e=>errors.push(e.message));
    await page.exposeBinding("__endError",(_,message)=>errors.push(String(message)));
    await page.addInitScript(({local,route,theme,preview})=>{
      window.addEventListener("error",e=>window.__endError(e.message));
      window.addEventListener("unhandledrejection",e=>window.__endError(String(e.reason)));
      if(sessionStorage.getItem("end-fixture"))return;
      sessionStorage.setItem("end-fixture","1");
      for(const [key,value]of Object.entries(local))localStorage.setItem(key,JSON.stringify(value));
      localStorage.setItem("na1_theme",theme);localStorage.setItem("to_app_route_v1",JSON.stringify(route));
      if(preview)sessionStorage.setItem("to_dev_preview","1");
    },{local:options.local||data(),route:options.route||{view:"a1end1",overlay:null},theme:options.theme||"light",preview:!!options.preview});
    try {await page.goto("http://localhost:80/");await page.evaluate(()=>document.fonts.ready);
      await fn(page);results.push({name,pass:true});}
    catch(e){results.push({name,pass:false,error:e.message});await page.screenshot({path:path.join(out,name.replace(/\W/g,"_")+".png")}).catch(()=>{});}
    finally{fs.writeFileSync(path.join(out,process.env.A1_END_CASE?"focused-results.json":"results.json"),JSON.stringify({
      results,runtimeErrors:errors,writesIntercepted:writes.length,unexpected},null,2));await context.close();}
  }
  for(const [width,height]of [[375,812],[1280,800],[1366,680]])for(const theme of ["light","dark"])for(const step of [1,2,3]) {
    await check(`screen ${step} ${width}x${height} ${theme}`,{width,height,theme,route:{view:`a1end${step}`,overlay:null}},async page=>{
      await page.locator(".a1-end-card").waitFor();
      const layout=await page.evaluate(()=>{
        const card=document.querySelector(".a1-end-card"),body=document.querySelector(".a1-end-body"),footer=document.querySelector(".a1-end-footer");
        const r=footer.getBoundingClientRect(),h=document.querySelector(".a1-end-header").getBoundingClientRect(),b=body.getBoundingClientRect();
        return {horizontal:card.scrollWidth>card.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1,
          footerFits:r.bottom<=innerHeight&&r.top>=b.bottom-1,headerFits:b.top>=h.bottom-1,
          scrolling:body.scrollHeight>body.clientHeight+1,font:getComputedStyle(document.querySelector("h1")).fontFamily,
          headingSize:getComputedStyle(document.querySelector("h1")).fontSize,theme:document.documentElement.dataset.theme};
      });
      assert.equal(layout.horizontal,false);assert(layout.footerFits&&layout.headerFits);
      assert.equal(layout.theme,theme);assert(layout.font.includes("Tenor Sans"));
      assert.equal(layout.headingSize,step===1?"36px":step===3?"30px":"28px");
      if(step===1){
        const text=await page.locator(".a1-end-body").textContent();
        for(const expected of ["Carrying, mostly in Time.","Integrity · Hope · Love","Wise Owl · Steady Bear · Playful Dolphin","Shine the light.",
          "Mornings for deep work.","The business pays me first","Rested, clear"])assert(text.includes(expected),expected);
        assert.equal(await page.locator(".a1-end-future blockquote").textContent(),"“"+f.rc.futureB5.tuesday+"”");
        assert.equal(await page.getByRole("button",{name:"Save as a card",exact:true}).count(),0);
      }
      if(step===2){await page.getByPlaceholder("When it happens, a few words…").waitFor();assert((await page.locator(".a1-end-notice-lead").textContent()).includes("Integrity"));}
      if(step===3){assert.equal(await page.locator(".a1-end-seal").textContent(),"Katherine's seal line goes here.");assert(await page.getByRole("button",{name:"Continue to A2 →"}).isEnabled());}
      await page.screenshot({path:path.join(out,`screen-${step}-${width}-${height}-${theme}.png`)});
      results.push({name:`fit details ${step} ${width}x${height} ${theme}`,pass:true,...layout});
    });
  }
  await check("fresh member B Vision claim through ending to A2",{local:data({complete:false}),route:{
    view:"explore2",overlay:{hubId:"explore2",roomId:"declaration"}}},async page=>{
    await page.locator(".na1-room-card").waitFor();await page.getByRole("button",{name:"Continue →",exact:true}).click();
    await page.getByRole("button",{name:"Claim my vision →",exact:true}).click();
    await page.locator(".na2-decl-cer-cta").click();await page.getByRole("heading",{name:"This is you.",exact:true}).waitFor();
    const v=await page.evaluate(()=>JSON.parse(localStorage.getItem("to_map")).vision);
    assert(v.complete&&v.declaration.sealSeen);assert.equal(v.twoFutures.complete,false);
    await page.getByRole("button",{name:"Continue →",exact:true}).click();
    await page.getByRole("button",{name:"I'll do it this week",exact:true}).click();
    await page.getByRole("button",{name:"Continue to A2 →",exact:true}).click();
    await page.locator(".na1-a2-hub, .na1-shell").first().waitFor();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("to_app_route_v1")).view),"a2");
    assert.equal(await page.evaluate(()=>localStorage.getItem("a1_notice")),null);
  });
  for(const mode of ["A","no RC"])
    await check(`summary fallback ${mode}`,{local:(()=>{const d=data({choice:"A"});if(mode==="no RC")delete d.to_rc_state_v1;return d;})()},async page=>{
      await page.locator(".a1-end-card").waitFor();assert.equal(await page.locator(".a1-end-future").count(),0);
      assert((await page.locator(".a1-end-question").textContent()).includes("does this fit who I am?"));
      if(mode==="no RC")assert.equal(await page.getByText("WHERE I WAS",{exact:true}).count(),0);
    });
  await check("already complete hub entry is read only and 2x2",{route:{view:"grid",overlay:null}},async page=>{
    await page.locator(".na1-mirror-grid").waitFor();const before=await page.evaluate(()=>localStorage.getItem("to_map"));
    assert.equal(await page.locator(".na1-mirror-grid > article").count(),4);
    assert.equal(await page.locator(".na1-mirror-grid").evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(" ").length),2);
    await page.getByRole("button",{name:"See the end of A1 →",exact:true}).click();await page.locator(".a1-end-card").waitFor();
    await page.getByRole("button",{name:"Close",exact:true}).click();await page.locator(".na1-mirror-grid").waitFor();
    assert.equal(await page.evaluate(()=>localStorage.getItem("to_map")),before);
  });
  await check("notice save reopen edit deduplicate Map and skip",{route:{view:"a1end2",overlay:null}},async page=>{
    await page.getByPlaceholder("When it happens, a few words…").fill("I kept my word.");
    await page.getByPlaceholder("What happened instead…").fill("I avoided a conversation.");
    await page.locator(".a1-end-footer").getByRole("button",{name:"Save →",exact:true}).click();
    await page.getByRole("heading",{name:"You know who you are now. That's how Future B starts.",exact:true}).waitFor();
    await page.getByRole("button",{name:"Close",exact:true}).click();await page.getByRole("button",{name:"See the end of A1 →"}).click();
    await page.getByRole("button",{name:"Continue →",exact:true}).click();
    assert.equal(await page.getByPlaceholder("When it happens, a few words…").inputValue(),"I kept my word.");
    await page.getByPlaceholder("What happened instead…").fill("I spoke too quickly.");
    await page.locator(".a1-end-footer").getByRole("button",{name:"Save →",exact:true}).click();
    await page.getByRole("button",{name:"See my Map of Me",exact:true}).click();
    assert.equal(await page.locator(".a1-notice-map-row p").textContent(),"Integrity · I kept my word.");
    const items=await page.evaluate(()=>JSON.parse(localStorage.getItem("to_setaside_v1")).items);
    assert.equal(items.length,2);assert.equal(items.filter(i=>i.id==="a1:notice").length,1);
    assert.equal(items[0].text,"Keep this");assert.equal(items[1].text,"I spoke too quickly.");
    await page.getByRole("button",{name:/Back/}).first().click();await page.getByRole("button",{name:"Close",exact:true}).click();
    await page.getByRole("button",{name:"See the end of A1 →"}).click();await page.getByRole("button",{name:"Continue →",exact:true}).click();
    const before=await page.evaluate(()=>[localStorage.getItem("a1_notice"),localStorage.getItem("to_setaside_v1")]);
    await page.getByPlaceholder("When it happens, a few words…").fill("DO NOT SAVE");
    await page.getByRole("button",{name:"I'll do it this week",exact:true}).click();
    assert.deepEqual(await page.evaluate(()=>[localStorage.getItem("a1_notice"),localStorage.getItem("to_setaside_v1")]),before);
  });
  await check("refresh preserves screen even from A2 account",{phase:"a2",route:{view:"a1end2",overlay:null},local:data({notice:true})},async page=>{
    await page.getByPlaceholder("When it happens, a few words…").waitFor();await page.reload();
    assert.equal(await page.getByPlaceholder("When it happens, a few words…").inputValue(),"I spoke up.");
    assert.equal(await page.locator(".a1-end-header > p").textContent(),"THE END OF A1 · 2 OF 3");
  });
  await check("missing values fallback and unchanged A2 gate",{route:{view:"a1end3",overlay:null},local:(()=>{
    const d=data({complete:false});d.to_mirror4_state_v1={...f.values};return d;
  })()},async page=>{
    await page.locator(".a1-end-card").waitFor();assert(await page.getByRole("button",{name:"Continue to A2 →",exact:true}).isDisabled());
    await page.getByRole("button",{name:"Close",exact:true}).click();
  });
  await check("long words wrap and footer stays fixed",{width:375,height:812,local:(()=>{
    const d=data();d.to_map.purpose_final="longword".repeat(45);d.to_map.vision.time.work.blank1="My time is mine. ".repeat(20);
    d.to_rc_state_v1.futureB5.tuesday="My future belongs to me. ".repeat(35);return d;
  })()},async page=>{
    await page.locator(".a1-end-future").waitFor();const box=page.locator(".a1-end-card");
    assert.equal(await box.evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
    assert.equal(await page.locator(".a1-end-future blockquote").textContent(),"“"+"My future belongs to me. ".repeat(35).trim()+"”");
    assert(await page.locator(".a1-end-body").evaluate(e=>e.scrollHeight>e.clientHeight));
    assert(await page.locator(".a1-end-footer").evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight));
  });
  await check("Preview entry all screens no writes and real restore",{preview:true,local:data({complete:false,notice:true}),route:{view:"grid",overlay:null}},async page=>{
    await page.getByRole("button",{name:"See the end of A1 →",exact:true}).click();
    await page.getByRole("button",{name:"Continue →",exact:true}).click();
    const count=writes.length;const before=await page.evaluate(()=>[localStorage.getItem("to_map"),localStorage.getItem("a1_notice"),localStorage.getItem("to_setaside_v1")]);
    await page.getByPlaceholder("When it happens, a few words…").fill("PREVIEW ONLY");
    await page.locator(".a1-end-footer").getByRole("button",{name:"Save →",exact:true}).click();
    await page.locator(".a1-end-seal").waitFor();assert.equal(writes.length,count);
    assert.deepEqual(await page.evaluate(()=>[localStorage.getItem("to_map"),localStorage.getItem("a1_notice"),localStorage.getItem("to_setaside_v1")]),before);
    await page.evaluate(async()=>(await import("/src/devPreview.ts")).setDevPreview(false));
    await page.waitForLoadState("load");await page.locator(".na1-mirror-grid").waitFor();
    assert.equal(await page.getByRole("button",{name:"See the end of A1 →",exact:true}).count(),0);
    assert(!(await page.locator("body").textContent()).includes("PREVIEW ONLY"));
    assert.deepEqual(await page.evaluate(()=>[localStorage.getItem("to_map"),localStorage.getItem("a1_notice"),localStorage.getItem("to_setaside_v1")]),before);
  });
  assert.deepEqual(unexpected,[]);
  console.log(JSON.stringify({results,runtimeErrors:errors,writesIntercepted:writes.length,unexpected},null,2));
  await browser.close();process.exitCode=results.some(r=>!r.pass)||errors.length?1:0;
})().catch(e=>{console.error(e);process.exit(1)});
