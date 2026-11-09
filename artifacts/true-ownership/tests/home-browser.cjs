const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { modules, plain } = require("./a1-fixtures.cjs");
const { allStagesFixture } = require("./map-of-me-fixtures.cjs");
const { installIsolation, proveIsolation } = require("./browser-isolation.cjs");
const out="generated-artifacts/phone-home";
const load=modules().load, project=load("home/model").homeProjection;
function fixture(kind) {
  const d=allStagesFixture();
  d.to_a1_practical_v1={version:1,balanceByCreatureId:{},balanceIntent:null,tryCreatureId:"c_0",trySelectionSource:"chosen",
    tryAnswersByCreatureId:{"c_0":"Open Thursday’s meeting with a win."},sharpenedOneThing:"Protect an hour for what matters.",
    weekReviewedAt:"2026-11-08T12:00:00Z"};
  if(kind==="a1") for(const n of [2,3,4,5]) d[`to_a${n}_state_v1`]=plain(load(`a${n}Constants`)[`EMPTY_A${n}`]);
  if(kind==="mid"){
    d.to_mirror4_state_v1.claimed=false;d.to_mirror4_state_v1.status="in_progress";
    d.to_mirror4_state_v1.discoverSections={admire:true,irks:false,portrait:false};
    delete d.to_a1_practical_v1;delete d.a1_notice;
  }
  if(kind==="new"){
    d.to_map={};d.to_rc_state_v1=plain(load("rcConstants").EMPTY_RC);
    delete d.to_mirror4_state_v1;
    for(const n of [2,3,4,5]) delete d[`to_a${n}_state_v1`];
    for(const k of Object.keys(d)) if(k.startsWith("a1_") || k==="to_a1_practical_v1") delete d[k];
  }
  return d;
}
const opts={rcRequired:false,freeLocked:false,a2:true,a3:true,preview:false};
for(const kind of ["new","mid","a1","complete"]){
  const d=fixture(kind), before=JSON.stringify(d), p=project(k=>d[k],{...opts,rcRequired:kind==="new"});
  assert.equal(JSON.stringify(d),before);
  assert.equal(p.next?.title,{new:"Reality Check",mid:"Values",a1:"Alignment Check",complete:undefined}[kind]);
  if(kind==="complete") assert(p.finished);
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:["--no-sandbox"]});
 const checks=[],errors=[],escaped=[],writes=[];
 try{
  await proveIsolation(browser);
  for(const width of [375,1280,1440,1920]) for(const theme of ["light","dark"]){
   for(const kind of (width===375 ? ["new","mid","a1","complete"] : ["a1"])){
    const data=fixture(kind),height=width===375 ? 812 : width===1280 ? 800 : width===1440 ? 900 : 1080;
    const context=await browser.newContext({viewport:{width,height},colorScheme:theme,serviceWorkers:"block"});
    await installIsolation(context,writes,escaped);
    await context.addInitScript(({data,theme})=>{
      if(sessionStorage.getItem("phone-home-fixture")) return;
      sessionStorage.setItem("phone-home-fixture","1");
      for(const [k,v] of Object.entries(data)) localStorage.setItem(k,JSON.stringify(v));
      localStorage.setItem("na1_theme",theme);localStorage.setItem("to_road_phone_tip_seen_v1","1");
      localStorage.setItem("to_app_route_v1",JSON.stringify({view:"entry-hall",overlay:null}));
    },{data,theme});
    const page=await context.newPage();page.setDefaultTimeout(12000);page.on("pageerror",e=>errors.push(e.message));
    await page.goto("http://localhost:80/",{waitUntil:"networkidle"});await page.locator(".phone-home").waitFor();await page.evaluate(()=>document.fonts.ready);
    const next=await page.locator(".ph-next").innerText();
    assert(next.includes(kind==="complete" ? "You've walked the whole road." : {new:"Reality Check",mid:"Values",a1:"Alignment Check"}[kind]),next);
    if(kind==="new") assert.equal(await page.locator(".ph-greeting p").innerText(),"Welcome back.");
    async function capture(tab){
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width} ${theme} ${kind} ${tab} overflow`);
      await page.screenshot({path:`${out}/${width}-${theme}-${kind}-${tab}.png`,fullPage:true,animations:"disabled"});
      checks.push({width,height,theme,kind,tab});
    }
    await capture("today");
    await page.getByRole("tab",{name:"This week",exact:true}).click();
    if(kind==="a1" || kind==="complete"){
      await page.locator(".ph-week-cards").waitFor();
      assert((await page.locator(".ph-week-cards").innerText()).includes("Protect an hour"));
    }else assert((await page.locator(".ph-week-content").innerText()).includes("Your week fills in"));
    await capture("week");
    if(width===375 && kind==="a1"){
      const before=await page.evaluate(()=>localStorage.getItem("to_a1_practical_v1"));
      await page.locator(".ph-week-cards button").first().click();
      await page.getByRole("button",{name:"Done reviewing →",exact:true}).last().click();
      await page.locator(".ph-week-cards").waitFor();
      assert.equal(await page.evaluate(()=>localStorage.getItem("to_a1_practical_v1")),before);
      await page.reload({waitUntil:"networkidle"});
      assert.equal(await page.getByRole("tab",{name:"This week",exact:true}).getAttribute("aria-selected"),"true");
    }
    await page.getByRole("tab",{name:"Future B",exact:true}).click();await capture("future");
    if(width===375){
      await page.getByRole("tab",{name:"Today",exact:true}).click();
      await page.locator(".ph-next .ph-action").click();
      if(kind==="complete") await page.locator(".mom-title-card").waitFor();
      else await page.locator(".na1-room-overlay.is-open").first().waitFor();
      checks.push({width,theme,kind,resume:await page.locator(".na1-room-crumb").first().innerText().catch(()=>"Map")});
    }
    await context.close();
   }
  }
  assert.deepEqual(errors,[]);assert.deepEqual(escaped,[]);
  fs.writeFileSync(`${out}/checks.json`,JSON.stringify({checks,errors,escaped,writes:writes.length},null,2));
  console.log("PASS",checks.length,"Home checks; isolated writes",writes.length);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
