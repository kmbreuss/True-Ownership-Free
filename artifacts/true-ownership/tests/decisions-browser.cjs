const {chromium}=require("playwright");
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {modules}=require("./a1-fixtures.cjs");
const {allStagesFixture}=require("./map-of-me-fixtures.cjs");
const {installIsolation,proveIsolation}=require("./browser-isolation.cjs");
const model=modules().load(path.resolve("lib/decision-model.ts"));
const out="generated-artifacts/decisions";
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:["--no-sandbox"]});
 const checks=[],errors=[],escaped=[],writes=[];
 let cloud={version:1,items:[]};
 try{
  await proveIsolation(browser);
  assert.equal(model.QUICK.length,9);assert.equal(model.DEEP.length,11);
  assert(!model.validDate("2026-02-30"));assert(model.validDate("2028-02-29"));
  for(const width of [375,1280])for(const theme of ["light","dark"]){
   const data=allStagesFixture();
   const context=await browser.newContext({viewport:{width,height:width===375?812:800},colorScheme:theme,serviceWorkers:"block"});
   await installIsolation(context,writes,escaped,()=>({intake:{name:"Synthetic"},phase:"a1",decisions:{t:Date.now(),v:cloud}}));
   await context.route("**/api/userdata/decisions",async route=>{
    if(route.request().method()!=="PUT")return route.fallback();
    const incoming=route.request().postDataJSON().value.v;
    assert.equal(model.normalizeDecisions(incoming).items.length,incoming.items.length);
    cloud=model.mergeDecisions(incoming,cloud);
    writes.push({path:"/api/userdata/decisions",method:"PUT"});
    return route.fulfill({json:{ok:true,current:{t:Date.now(),v:cloud}}});
   });
   await context.addInitScript(({data,theme})=>{
    if(sessionStorage.getItem("decision-fixture"))return;
    sessionStorage.setItem("decision-fixture","1");
    for(const [k,v] of Object.entries(data))localStorage.setItem(k,JSON.stringify(v));
    localStorage.setItem("na1_theme",theme);
    localStorage.setItem("to_road_phone_tip_seen_v1","1");
    localStorage.setItem("to_app_route_v1",JSON.stringify({view:"entry-hall",overlay:null}));
   },{data,theme});
   const page=await context.newPage();page.setDefaultTimeout(12000);page.on("pageerror",e=>errors.push(e.message));
   await page.goto("http://localhost:80/",{waitUntil:"networkidle"});
   await page.locator(".phone-home").waitFor();
   async function shot(name){
    await page.evaluate(()=>document.fonts.ready);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+" horizontal overflow");
      if(await page.locator(".decision-overlay").count()){
        const box=await page.locator(".decision-frame").boundingBox();
        assert(box.y>=0 && box.y+box.height<= (width===375?812:800)+1,`${name}: frame outside viewport ${JSON.stringify(box)}`);
        assert.equal(await page.locator(".pn-menu").count(),0,"Navigation must hide in walkthroughs");
      } else if(width===375 && await page.locator(".pn-menu").count()){
        const boxes=await page.locator(".pn-menu button").evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {top:r.top,width:r.width,height:r.height}}));
        assert.equal(boxes.length,5);assert(boxes.every(b=>b.width>=44 && b.height>=44 && b.top===boxes[0].top));
      }
    await page.screenshot({path:`${out}/${width}-${theme}-${name}.png`,fullPage:!(await page.locator(".decision-overlay").count()),animations:"disabled"});
    checks.push({width,theme,name});
   }
   await shot("home");
   const before=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>/^to_(map$|a[2345]_state|mirror4_state|rc_state)/.test(k)).map(k=>[k,localStorage.getItem(k)])));
   await page.locator(".decision-entry button").click();
   await page.getByLabel("Your decision",{exact:true}).fill(`Protect Friday for focused work · ${width} ${theme}`);
   await shot("start");
   await page.locator(".decision-frame footer").getByRole("button",{name:"Start →",exact:true}).click();
   await page.locator(".decision-body textarea").fill("I keep giving that time away.");
   await page.getByRole("button",{name:"Next →",exact:true}).click();
   await page.getByRole("button",{name:"Carrying it all myself",exact:true}).click();
   await shot("notice");
   await page.getByRole("button",{name:"Next →",exact:true}).click();
   assert.equal(await page.locator(".decision-body h1").innerText(),"Are you all in on this?");
   await page.getByRole("button",{name:"Not sure",exact:true}).first().click();
   await shot("all-in");
   await page.getByRole("button",{name:"Next →",exact:true}).click();
   await page.getByRole("button",{name:"Next →",exact:true}).click();
   await page.getByRole("button",{name:"Anchor",exact:true}).first().click();
   await shot("advocate");
   await page.getByRole("button",{name:"Next →",exact:true}).click();
   await page.getByRole("button",{name:"Not really",exact:true}).click();
   await shot("act");
   await page.getByRole("button",{name:"Next →",exact:true}).click();
   await page.getByRole("button",{name:"Not sure",exact:true}).click();
   await page.getByRole("button",{name:"Next →",exact:true}).click();
   assert((await page.locator(".decision-frame header").innerText()).includes("9 OF 9"));
   assert((await page.locator(".decision-leaks").innerText()).includes("Act On It"));
   assert((await page.locator(".decision-gold").innerText()).includes("Accountability To It"));
   assert(!(await page.locator(".decision-body").innerText()).includes("No leak. You’re aligned."));
   await page.getByRole("button",{name:"Yes, on my terms",exact:true}).click();
   await shot("ending");
   await page.getByRole("button",{name:"Own it ★",exact:true}).click();
   await page.locator(".phone-home").waitFor();
   const after=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>/^to_(map$|a[2345]_state|mirror4_state|rc_state)/.test(k)).map(k=>[k,localStorage.getItem(k)])));
   assert.deepEqual(after,before);
   const nav=width===375?page.locator(".pn-menu"):page.locator(".pn-desktop-links");
   await nav.getByRole("button",{name:width===375?"Decide":"Own the decision",exact:true}).click();
   await page.locator(".decision-saved").first().waitFor();
   await shot("list");
   await page.locator(".decision-saved").first().click();
   assert((await page.locator(".decision-frame").innerText()).includes("I keep giving that time away."));
   await shot("readback");
   await page.reload({waitUntil:"networkidle"});
   await page.locator(".decision-saved").first().waitFor();
   // Deep: every optional answer may be skipped; Back keeps the required decision.
   await page.getByRole("button",{name:"Start →",exact:true}).click();
   await page.getByLabel("Your decision",{exact:true}).fill("A deep synthetic decision");
   await page.getByRole("button",{name:"Deep · 8 min",exact:true}).click();
   await page.locator(".decision-frame footer").getByRole("button",{name:"Start →",exact:true}).click();
   for(let i=1;i<10;i++)await page.getByRole("button",{name:"Next →",exact:true}).click();
   assert((await page.locator(".decision-frame header").innerText()).includes("11 OF 11"));
   await page.getByRole("button",{name:"Close walkthrough",exact:true}).click();
   await page.getByRole("button",{name:"Keep going",exact:true}).click();
   assert((await page.locator(".decision-body").innerText()).includes("A deep synthetic decision"));
   const count=cloud.items.length;
   await page.getByRole("button",{name:"Close walkthrough",exact:true}).click();
   await page.getByRole("button",{name:"Leave",exact:true}).click();
   assert.equal(cloud.items.length,count);
   await context.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(escaped,[]);
  assert.equal(cloud.items.length,4);
  fs.writeFileSync(`${out}/checks.json`,JSON.stringify({checks,errors,escaped,records:cloud.items.length},null,2));
  fs.writeFileSync(`${out}/synthetic-record.json`,JSON.stringify(cloud.items[0],null,2));
  console.log("PASS",checks.length,"captures; Quick/Deep, leaks/uncertainty, reload, optional fields, discard, saved answers, journey invariance; four records retained across isolated sessions.");
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
