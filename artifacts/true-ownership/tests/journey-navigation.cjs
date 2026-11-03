const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {fixtures,modules,plain}=require("./a1-fixtures.cjs");
const {installIsolation,proveIsolation}=require("./browser-isolation.cjs");
const {spineNavigation}=modules().load("journey/navigation");
const complete={rc:false,a1:false,a2:false,a3:false,a4:false,a5:false};
const options={view:"grid",complete,a2Enabled:true,a3Enabled:true,freeLocked:false,returning:false};
const destinations=["rc","grid","a2","a3","a4","a5"];
assert.deepEqual(plain(spineNavigation(options).map(n=>n.destination)),destinations);
assert.deepEqual(plain(spineNavigation({...options,a2Enabled:false,a3Enabled:false}).map(n=>n.destination)),["rc","grid",null,null,"a4","a5"]);
for(const [view,id]of [["rcroom","rc"],["grid","a1"],["m4","a1"],["a2m1","a2"],["a2m2","a2"],["a2m3","a2"],["a3m6","a3"],["a4p","a4"],["a5r","a5"]]){
  assert.deepEqual(plain(spineNavigation({...options,view}).filter(n=>n.isCurrent).map(n=>n.id)),[id]);
}
assert.equal(spineNavigation({...options,returning:true})[0].status,"Start here · New");
assert.equal(spineNavigation({...options,freeLocked:true})[1].status,"Unlocks when you join");
assert.equal(spineNavigation({...options,complete:{...complete,a1:true}})[1].status,"You are here");
assert.equal(spineNavigation({...options,view:"a2",complete:{...complete,a1:true,rc:true}})[1].status,"Claimed");
console.log("MODEL PASS: all six legacy destinations, feature-locked A2/A3, current/status precedence and every discipline's subroutes.");

async function main(){
  const {chromium}=require("playwright"),browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:["--no-sandbox"]});
  const writes=[],unexpected=[],errors=[],results=[],out=path.resolve("generated-artifacts/journey-navigation");
  fs.mkdirSync(out,{recursive:true});
  const f=fixtures();
  let failures=0;
  async function open(viewport,theme,route="grid",rc=f.rc,values=f.values){
    const context=await browser.newContext({viewport,serviceWorkers:"block"});
    await installIsolation(context,writes,unexpected);
    const page=await context.newPage();page.setDefaultTimeout(7000);
    page.on("pageerror",e=>errors.push(e.message));
    await page.addInitScript(({theme,route,rc,values})=>{
      localStorage.setItem("na1_theme",theme);
      localStorage.setItem("to_rc_state_v1",JSON.stringify(rc));
      localStorage.setItem("to_mirror4_state_v1",JSON.stringify(values));
      localStorage.setItem("to_app_route_v1",JSON.stringify({view:route,overlay:null}));
    },{theme,route,rc,values});
    await page.goto((process.env.J1_BASE_URL||"http://localhost:80")+"/");
    await page.locator(viewport.width<900?".jr-phone-bar":".jr-desktop").waitFor();
    return {page,context};
  }
  async function sheet(page,phone){if(phone){await page.locator(".jr-phone-bar").click();await page.getByRole("dialog",{name:"Your road to Future B"}).waitFor();}}
  async function at(page,destination){
    await page.waitForFunction(destination=>JSON.parse(localStorage.getItem("to_app_route_v1")||"{}").view===destination,destination);
  }
  try{
    await proveIsolation(browser);
    for(const viewport of [{width:375,height:812},{width:1280,height:800},{width:1366,height:680}])for(const theme of ["light","dark"]){
      if(failures>=2)break;
      const {page,context}=await open(viewport,theme),phone=viewport.width<900;
      try{
        const before=await page.evaluate(()=>[localStorage.getItem("to_rc_state_v1"),localStorage.getItem("to_mirror4_state_v1")]);
        for(const destination of destinations){
          await sheet(page,phone);
          const root=page.locator(phone?".jr-sheet":".jr-desktop");
          assert.equal(await root.locator(".jr-road-stop").count(),6);
          const id=destination==="grid"?"a1":destination,button=root.locator(`[data-road-destination="${id}"]`);
          assert.match(await button.getAttribute("aria-label"),/^Go to /);
          await button.click();await at(page,destination);
          assert.equal(await page.locator(".jr-sheet").count(),0,"Navigation closes phone sheet");
          await sheet(page,phone);
          const active=page.locator(phone?".jr-sheet":".jr-desktop").locator('[aria-current="page"]');
          assert.equal(await active.getAttribute("data-road-destination"),id);
          if(phone)await page.getByRole("button",{name:"Close your road",exact:true}).click();
        }
        if(!phone){
          const first=page.locator('.jr-desktop [data-road-destination="rc"]');
          await first.focus();await page.keyboard.press("Tab");
          assert.equal(await page.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle),"solid");
          await page.locator('.jr-desktop [data-road-destination="a2"]').press("Enter");await at(page,"a2");
          await page.locator(".jr-desktop .jr-road-open").click();
        }else await sheet(page,true);
        assert.equal(await page.locator(".jr-sheet [data-brick]").count(),88);
        await page.locator(".jr-sheet .jr-road-open").click();
        assert.equal(await page.locator(".jr-history").evaluate(e=>e===document.activeElement),true);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),viewport.width);
        await page.screenshot({path:path.join(out,`${viewport.width}-${theme}.jpg`)});
        await page.getByRole("button",{name:"Close your road",exact:true}).click();
        assert.deepEqual(await page.evaluate(()=>[localStorage.getItem("to_rc_state_v1"),localStorage.getItem("to_mirror4_state_v1")]),before);
        results.push({viewport,theme,pass:true,destinations});console.log("PASS six destinations + current states + history + fit",viewport.width,theme);
      }catch(e){failures++;results.push({viewport,theme,pass:false,error:e.message});console.error("FAIL",viewport.width,theme,e.message);}
      finally{await context.close();}
    }
    if(failures<2){
      const {page,context}=await open({width:1280,height:800},"light","a2m2");
      try{
        assert.equal(await page.locator('.jr-desktop [aria-current="page"]').getAttribute("data-road-destination"),"a2");
        await page.evaluate(async()=>{const access=await import("/src/reality-check/access.ts");access.setSimulatedFree(true);});
        await at(page,"rc");
        const a5=page.locator('.jr-desktop [data-road-destination="a5"]');
        await a5.getByText("Unlocks when you join",{exact:true}).waitFor();
        await a5.click();await at(page,"rc");
        console.log("PASS A2 subroom highlighting and existing free-access redirect (no bypass).");
      }catch(e){failures++;console.error("FAIL access/subroom",e.message);}
      finally{await context.close();}
    }
    assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,"results.json"),JSON.stringify({results,failures,writes:writes.length,unexpected,errors},null,2));
    assert.equal(failures,0);
    console.log(`BROWSER PASS: ${results.length} viewport/theme cases; 36 label destinations; ${writes.length} writes intercepted, none escaped.`);
  }finally{await browser.close();}
}
if(process.env.JOURNEY_BROWSER)main().catch(e=>{console.error(e);process.exitCode=1;});
