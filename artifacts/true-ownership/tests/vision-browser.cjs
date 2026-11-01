const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {chromium}=require("playwright");
const {fixtures,modules,plain}=require("./a1-fixtures.cjs");
const {proveIsolation,installIsolation}=require("./browser-isolation.cjs");
const f=fixtures(),{load}=modules(),constants=load("mirror2Constants");
const out=path.resolve("generated-artifacts/a1-3"),url=process.env.J1_BASE_URL||"http://localhost:80";
function vision() {
  const v=plain(f.vision);
  for(const lens of ["time","wealth","self"]) {
    v[lens+"_complete"]=true;
    for(const d of constants.LENS_DOMAINS[lens])v[lens][d]={blank1:"Make room for what matters",blank2:"Calm and fulfilling"};
  }
  return v;
}
function local(v=vision(),rc=f.rc) {
  return {to_rc_state_v1:rc,to_mirror4_state_v1:{...f.values,claimed:true},
    to_map:{purpose_final:"To help people grow",mirror3:{...f.identity,sealCompleted:true},vision:v},
    a1_ex2_done:true,a1_ex3_done:true,a1_ex4_done:true};
}
const room=key=>({view:"explore2",overlay:{hubId:"explore2",roomId:key}});
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:["--no-sandbox"]});
  await proveIsolation(browser);
  const results=[],writes=[],unexpected=[],errors=[];
  async function check(name,options,fn) {
    if(process.env.VISION_CASE&&!new RegExp(process.env.VISION_CASE).test(name))return;
    const context=await browser.newContext({serviceWorkers:"block",viewport:{width:options.width||1366,height:options.height||680}});
    await installIsolation(context,writes,unexpected,()=>({intake:{name:"Fixture"},phase:"a1"}));
    const page=await context.newPage();page.setDefaultTimeout(10000);
    page.on("pageerror",e=>errors.push(e.message));
    await page.exposeBinding("__visionError",(_,message)=>errors.push(String(message)));
    await page.addInitScript(({data,route,theme,preview})=>{
      window.addEventListener("error",e=>window.__visionError(e.message));
      window.addEventListener("unhandledrejection",e=>window.__visionError(String(e.reason)));
      if(sessionStorage.getItem("vision-fixture"))return;
      sessionStorage.setItem("vision-fixture","1");
      for(const [key,value]of Object.entries(data))localStorage.setItem(key,JSON.stringify(value));
      localStorage.setItem("na1_theme",theme);localStorage.setItem("to_app_route_v1",JSON.stringify(route));
      if(preview)sessionStorage.setItem("to_dev_preview","1");
    },{data:options.local||local(),route:options.route||room("time"),theme:options.theme||"light",preview:!!options.preview});
    try {
      await page.goto(url+"/");await page.evaluate(()=>document.fonts.ready);
      await fn(page);results.push({name,pass:true});
    } catch(e) {
      results.push({name,pass:false,error:e.message});
      await page.screenshot({path:path.join(out,name.replace(/\W/g,"_")+".png")}).catch(()=>{});
    } finally {
      fs.writeFileSync(path.join(out,"results.json"),JSON.stringify({results,runtimeErrors:errors,writesIntercepted:writes.length},null,2));
      await context.close();
    }
  }
  for(const [width,height]of [[375,812],[1280,800],[1366,680]])for(const theme of ["light","dark"])
    for(const screen of ["A1","Vision","time","wealth","self","declaration"]) {
      await check(`${screen} ${width}x${height} ${theme}`,{width,height,theme,
        route:screen==="A1"?{view:"grid",overlay:null}:screen==="Vision"?{view:"explore2",overlay:null}:room(screen)},async page=>{
        if(screen==="A1") {
          await page.locator(".na1-mirror-grid").waitFor();
          const card=page.locator('[data-a1-mirror="vision"]');
          assert((await card.locator(".na1-mirror-card-meta").textContent()).includes("4 exercises · 4 videos"));
        } else if(screen==="Vision") {
          await page.locator(".na1-ex-row").first().waitFor();
          assert.deepEqual(await page.locator(".na1-ex-name").allTextContents(),
            ["Time · 10-Year","Wealth · 10-Year","Self · 10-Year","Vision Declaration"]);
          assert((await page.locator(".na1-ex-sub").textContent()).includes("Four exercises. Dream"));
        } else {
          await page.locator(".na1-room-card").waitFor();
          assert.equal(await page.locator(".na1-veil").count(),0);
          const index=["time","wealth","self","declaration"].indexOf(screen)+1;
          assert.equal(await page.locator(`.na2-pip-bar[aria-label="Step ${index} of 4"]`).count(),1);
          if(screen!=="declaration") {
            assert.equal(await page.locator(".na2-prose-chip-pill").count(),0);
            assert.equal(await page.getByText(/You claimed these .* chips for Future B/).count(),0);
            const text=await page.locator(".na2-prose-stem-lead").first().textContent();
            assert(text.startsWith("In 10 years, my "));
            if(screen==="time") {
              assert.equal(await page.locator(".vision-rc-strip blockquote").textContent(),"“"+f.rc.futureB5.tuesday+"”");
              assert.equal(await page.locator(".na1-room-title").textContent(),"Now look out ten. What does your time look like?");
            } else assert((await page.locator(".na2-prose-subtitle").textContent()).includes(`focused on Time. Now look at ${screen} too.`));
          } else {
            const text=await page.locator(".na1-room-card").textContent();
            assert(!text.includes("undefined"));assert(text.includes("Work:"));
          }
          assert.equal(await page.locator(".na1-room-card").evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
        }
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
        await page.screenshot({path:path.join(out,`${screen}-${width}-${height}-${theme}.png`)});
      });
    }
  for(const focus of ["time","wealth","self"])for(const area of ["time","wealth","self"])
    await check(`B focus ${focus} opens ${area}`,{local:local(vision(),{...f.rc,focus}),route:room(area)},async page=>{
      await page.locator(".na1-room-card").waitFor();
      assert.equal(await page.locator(".vision-rc-strip").count(),focus===area?1:0);
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("to_map")).vision.twoFutures.complete),false);
    });
  for(const mode of ["A","missing words","missing RC"]) {
    const data=local(vision(),{...f.rc,choice:mode==="A"?"A":"B",futureB5:{...f.rc.futureB5,tuesday:mode==="missing words"?"":f.rc.futureB5.tuesday}});
    if(mode==="missing RC")delete data.to_rc_state_v1;
    await check(`original opening ${mode}`,{local:data},async page=>{
      await page.locator(".na1-room-card").waitFor();
      assert.equal(await page.locator(".vision-rc-strip").count(),0);
      assert.equal(await page.locator(".na1-room-title").textContent(),"Now write what owning your time looks like.");
    });
  }
  await check("fresh Vision starts Time without Two Futures",{local:local(f.vision),route:{view:"explore2",overlay:null}},async page=>{
    await page.locator(".na1-ex-row").first().waitFor();
    assert.equal(await page.locator(".na1-ex-row").count(),4);
    assert.equal(await page.locator(".na1-ex-row:disabled").count(),3);
    await page.locator(".na1-ex-row").first().click();await page.locator(".na1-room-card").waitFor();
    assert.equal(await page.locator(".vision-rc-strip").count(),1);
  });
  for(const preview of [false,true])
    await check(`retired route rejected preview ${preview}`,{preview,route:room("twoFutures")},async page=>{
      await page.locator(".na1-ex-row").first().waitFor();
      assert.equal(await page.locator(".na1-room-card").count(),0);
    });
  await check("legacy complete and chip prose survive refresh",{local:(()=>{
    const v=vision();v.complete=true;v.twoFutures.complete=true;v.twoFutures.futureB.time.work=2;
    return local(v);
  })()},async page=>{
    await page.locator(".na1-room-card").waitFor();
    const chip=constants.VISION_CHIPS.time.work[2];
    assert.equal(await page.locator(".na2-prose-chip-pill").textContent(),chip);
    assert.equal(await page.locator(".na2-prose-stem-lead").textContent(),"In 10 years, "+chip+".");
    await page.reload();await page.locator(".na1-room-card").waitFor();
    const state=await page.evaluate(()=>JSON.parse(localStorage.getItem("to_map")).vision);
    assert(state.complete);assert(state.twoFutures.complete);assert.equal(state.twoFutures.futureB.time.work,2);
  });
  await check("midway draft resumes correct part with no veil",{local:(()=>{
    const v=plain(f.vision);v.twoFutures.complete=true;
    v.time.work={blank1:"Saved working week",blank2:"My pace"};
    return {...local(v),to_vision_step_v1:{time:2}};
  })()},async page=>{
    await page.locator('[data-section="friends"]').waitFor();
    await page.reload();await page.locator('[data-section="friends"]').waitFor();
    assert.equal(await page.locator(".na1-veil").count(),0);
    const v=await page.evaluate(()=>JSON.parse(localStorage.getItem("to_map")).vision);
    assert.equal(v.time.work.blank1,"Saved working week");assert(v.twoFutures.complete);
  });
  await check("long quote wraps without seeding or clipping",{width:375,height:812,local:local(vision(),{
    ...f.rc,futureB5:{...f.rc.futureB5,tuesday:"Every morning is mine. ".repeat(25)+"A".repeat(160)}})},async page=>{
      await page.locator(".vision-rc-strip").waitFor();
      assert.equal(await page.locator(".vision-rc-strip").evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
      const v=await page.evaluate(()=>JSON.parse(localStorage.getItem("to_map")).vision);
      assert.equal(v.time.work.blank1,"Make room for what matters");
      assert.equal(await page.locator(".vision-rc-strip blockquote").textContent(),"“"+"Every morning is mine. ".repeat(25)+"A".repeat(160)+"”");
    });
  await check("completed A1 has no remaining estimate",{local:local({...vision(),complete:true}),route:{view:"grid",overlay:null}},async page=>{
    await page.locator(".na1-mirror-grid").waitFor();
    const text=await page.locator(".na1-hero-meta").textContent();assert(text.includes("4 of 4"));assert(!text.includes("remaining"));
  });
  await check("new chip-free Vision can be claimed without Two Futures",{route:room("declaration")},async page=>{
    await page.locator(".na1-room-card").waitFor();
    await page.getByRole("button",{name:"Continue →",exact:true}).click();
    await page.getByRole("button",{name:"Claim my vision →",exact:true}).click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem("to_map")).vision.declaration.claimedAt);
    const v=await page.evaluate(()=>JSON.parse(localStorage.getItem("to_map")).vision);
    assert.equal(v.twoFutures.complete,false);
    assert(v.declaration.claimedAt);assert.equal(v.time.work.blank1,"Make room for what matters");
    await page.getByRole("button",{name:"Back to A1 →",exact:true}).click();
    await page.locator(".na1-mirror-grid").waitFor();
    const text=await page.locator(".na1-hero-meta").textContent();
    assert(text.includes("4 of 4"));assert(!text.includes("remaining"));
  });
  await check("Preview opens four rooms, saves nothing and restores fixture",{local:local(f.vision),
    preview:true,route:{view:"explore2",overlay:null}},async page=>{
    await page.locator(".na1-ex-row").first().waitFor();
    assert.equal(await page.locator(".na1-ex-row:disabled").count(),0);
    const before=writes.length;
    await page.evaluate(async()=>{
      const dev=await import("/src/devPreview.ts");
      const map=JSON.parse(localStorage.getItem("to_map"));map.vision.time.work.blank1="PREVIEW ONLY";
      dev.previewWrite("to_map",JSON.stringify(map));
    });
    assert.equal(writes.length,before);
    await page.evaluate(async()=>(await import("/src/devPreview.ts")).setDevPreview(false));
    await page.waitForLoadState("load");await page.locator(".na1-ex-row").first().waitFor();
    assert.equal(await page.locator(".na1-ex-row:disabled").count(),3);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("to_map")).vision.time.work.blank1),"");
  });
  assert.deepEqual(unexpected,[]);console.log(JSON.stringify({results,runtimeErrors:errors,writesIntercepted:writes.length},null,2));
  await browser.close();process.exitCode=results.some(r=>!r.pass)||errors.length?1:0;
})().catch(e=>{console.error(e);process.exit(1)});
