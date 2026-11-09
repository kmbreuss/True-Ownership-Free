const { chromium }=require("playwright"),assert=require("node:assert/strict");
const {allStagesFixture}=require("./map-of-me-fixtures.cjs");
const {installIsolation}=require("./browser-isolation.cjs");
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:["--no-sandbox"]});
 const errors=[],escaped=[];
 try{
 for(const mode of ["missing-date","long-name","no-name","preview","no-media","claim","reduced-motion"]){
  const d=allStagesFixture();
  if(mode==="claim" || mode==="reduced-motion") d.to_mirror4_state_v1.claimed=false;
  if(mode==="missing-date"){
   const clear=o=>{for(const k in o) if(/At$/.test(k)) o[k]="invalid";else if(o[k] && typeof o[k]==="object")clear(o[k]);};clear(d);
  }
  const context=await browser.newContext({viewport:{width:375,height:812},serviceWorkers:"block",reducedMotion:mode==="reduced-motion"?"reduce":"no-preference"});
  const name=mode==="no-name"?"":mode==="long-name"?"A".repeat(70):"Synthetic";
  await installIsolation(context,[],escaped,()=>({intake:{name},phase:"a1"}));
  if(mode==="no-name") await context.route("**/api/auth/me",r=>r.fulfill({json:{user:{id:"synthetic",firstName:"",lastName:"",email:"",role:"member"}}}));
  await context.addInitScript(({d,mode})=>{
    for(const[k,v]of Object.entries(d))localStorage.setItem(k,JSON.stringify(v));
    localStorage.setItem("to_app_route_v1",JSON.stringify({view:"entry-hall",overlay:null}));
    localStorage.setItem("to_road_phone_tip_seen_v1","1");
    if(mode==="no-media") sessionStorage.setItem("no-media","1");
  },{d,mode});
  if(mode==="no-media") await context.route("**/src/videoConstants.ts",async r=>{
    const response=await r.fetch();let text=await response.text();
    text+="\nObject.values(VIDEOS).forEach(v=>{v.vimeoId=null;v.audioUrl=null});\n";
    await r.fulfill({response,body:text});
  });
  const page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));
  await page.goto("http://localhost:80/"+(mode==="preview"?"?preview=1":""),{waitUntil:"networkidle"});
  await page.locator(".phone-home").waitFor();
  if(mode==="missing-date")assert.equal(await page.locator(".ph-greeting p").innerText(),"Welcome back.");
  if(mode==="no-name")assert.equal(await page.locator(".ph-greeting h1").innerText(),"Hi there");
  if(mode==="long-name")assert(await page.evaluate(()=>document.documentElement.scrollWidth<=375));
  if(mode==="preview"){
    await page.getByRole("tab",{name:"Future B",exact:true}).click();
    assert.equal(await page.evaluate(()=>localStorage.getItem("to_home_tab_v1")),null);
  }
  if(mode==="no-media")assert.equal(await page.locator(".ph-audio").count(),0);
  if(mode==="claim"||mode==="reduced-motion"){
    assert.equal(await page.locator(".ph-just-claimed").count(),0);
    await page.evaluate(async()=>{const m=await import("/src/mirror4Constants.ts");m.saveMirror4State({...m.loadMirror4State(),claimed:true,claimedAt:new Date().toISOString()});});
    await page.getByRole("button",{name:"Skip to A1 · All In It →",exact:true}).click();
    await page.locator('[data-a1-mirror="values"]').waitFor();
    if(mode==="claim"){
      await page.locator(".ph-just-claimed").waitFor();assert.equal(await page.locator(".ph-just-claimed").count(),1);
      await page.locator(".ph-just-claimed").waitFor({state:"detached"});
    }else assert.equal(await page.locator(".ph-just-claimed").count(),0);
  }
  console.log("PASS",mode);await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(escaped,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
