const {chromium}=require("playwright");
const assert=require("node:assert/strict"),fs=require("node:fs");
const {allStagesFixture}=require("./map-of-me-fixtures.cjs");
const {modules,plain}=require("./a1-fixtures.cjs");
const {installIsolation,proveIsolation}=require("./browser-isolation.cjs");
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:["--no-sandbox"]});
 const writes=[],escaped=[],errors=[],checks=[];
 try{
  await proveIsolation(browser);
  for(const scenario of ["rc-only","preview","failure","outcome"]){
   const data=allStagesFixture();
   if(scenario==="rc-only"){
    data.to_map={};data.to_mirror4_state_v1=plain(modules().load("mirror4Constants").EMPTY_MIRROR4);
    for(const key of ["a1_ex1_done","a1_ex2_done","a1_ex3_done","a1_ex4_done"])data[key]=false;
   }
   let record=JSON.parse(fs.readFileSync("generated-artifacts/decisions/synthetic-record.json","utf8"));
   record.answers.accountability.date="2020-01-01";
   let cloud=scenario==="outcome"?{version:1,items:[record]}:{version:1,items:[]};
   const context=await browser.newContext({viewport:{width:375,height:812},serviceWorkers:"block"});
   await installIsolation(context,writes,escaped,()=>({phase:"a1",intake:{name:"Synthetic"},decisions:{t:Date.now(),v:cloud}}));
   let decisionWrites=0;
   await context.route("**/api/userdata/decisions",async route=>{
    decisionWrites++;assert.notEqual(scenario,"preview");
    if(scenario==="failure")return route.fulfill({status:500,json:{error:"Synthetic failure"}});
    cloud=route.request().postDataJSON().value.v;
    return route.fulfill({json:{ok:true,current:{t:Date.now(),v:cloud}}});
   });
   await context.addInitScript(({data,scenario})=>{
    for(const [k,v] of Object.entries(data))localStorage.setItem(k,JSON.stringify(v));
    localStorage.setItem("to_app_route_v1",JSON.stringify({view:"decide",overlay:null}));
    localStorage.setItem("to_road_phone_tip_seen_v1","1");
    if(scenario==="preview")sessionStorage.setItem("to_dev_preview","1");
   },{data,scenario});
   const page=await context.newPage();page.setDefaultTimeout(12000);page.on("pageerror",e=>errors.push(e.message));
   await page.goto(`http://localhost:80/${scenario==="preview"?"?preview=1":""}`,{waitUntil:"networkidle"});
   await page.locator(".decision-page").first().waitFor();
   if(scenario==="outcome"){
    await page.locator(".decision-saved").click();
    await page.getByRole("button",{name:"It worked",exact:true}).click();
    await page.getByLabel("Optional note",{exact:true}).fill("Synthetic outcome only");
    await page.getByRole("button",{name:"Save outcome",exact:true}).click();
    await page.waitForFunction(()=>localStorage.getItem("to_decisions_v1")?.includes("Synthetic outcome only"));
    assert.equal(cloud.items[0].followUp.note,"Synthetic outcome only");
    assert.equal(cloud.items[0].decision,record.decision);checks.push(scenario);await context.close();continue;
   }
   const before=await page.evaluate(()=>localStorage.getItem("to_decisions_v1"));
   await page.getByRole("button",{name:"Start →",exact:true}).click();
   await page.getByLabel("Your decision",{exact:true}).fill("A synthetic optional-fields decision");
   await page.locator(".decision-frame footer").getByRole("button",{name:"Start →",exact:true}).click();
   await page.getByRole("heading",{name:"Look",exact:true}).waitFor();
   await page.getByRole("button",{name:"← Back",exact:true}).click();
   assert.equal(await page.getByLabel("Your decision",{exact:true}).inputValue(),"A synthetic optional-fields decision");
   await page.locator(".decision-frame footer").getByRole("button",{name:"Start →",exact:true}).click();
   await page.getByRole("button",{name:"Next →",exact:true}).click();
   await page.getByRole("button",{name:"Next →",exact:true}).click();
   if(scenario==="rc-only"){
    assert.equal(await page.locator(".decision-body fieldset").count(),1);
    await page.getByRole("button",{name:"Not sure",exact:true}).click();
   }
   for(let i=3;i<8;i++)await page.getByRole("button",{name:"Next →",exact:true}).click();
   if(scenario==="rc-only"){
    assert.equal(await page.locator(".decision-leaks").count(),0);
    assert((await page.locator(".decision-gold").innerText()).includes("Worth a second look"));
    assert(!(await page.locator(".decision-body").innerText()).includes("No leak."));
   }else assert((await page.locator(".decision-gold").innerText()).includes("No leak. You’re aligned."));
   await page.getByRole("button",{name:"No",exact:true}).click();
   await page.getByRole("button",{name:"Own it ★",exact:true}).click();
   if(scenario==="failure"){
    await page.getByRole("alert").filter({hasText:"not saved"}).waitFor();
    assert((await page.locator(".decision-body").innerText()).includes("A synthetic optional-fields decision"));
    assert.equal(await page.evaluate(()=>localStorage.getItem("to_decisions_v1")),before);
   }else{
    await page.getByRole("heading",{name:"My decisions",exact:true}).waitFor();
    if(scenario==="preview"){
      assert.equal(decisionWrites,0);
      assert.equal(await page.evaluate(()=>localStorage.getItem("to_decisions_v1")),before);
    }else assert.equal(decisionWrites,1);
   }
   checks.push(scenario);await context.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(escaped,[]);
  fs.writeFileSync("generated-artifacts/decisions/edge-checks.json",JSON.stringify({checks,errors,escaped},null,2));
  console.log("PASS",checks.join(", "),"— optional-only saving, Back retention, uncertainty-only ending, due outcome, failure preservation and Preview isolation.");
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
