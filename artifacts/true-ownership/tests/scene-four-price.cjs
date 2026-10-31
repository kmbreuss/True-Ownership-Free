const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {chromium}=require("playwright");
const {proveIsolation,installIsolation}=require("./browser-isolation.cjs");
const out=path.resolve("generated-artifacts/rc-price");
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const cost={monthly:100,moneyWhere:"My bills.",hoursPerWeek:2,hoursWhere:"My evenings.",you:"My patience.",whoElse:"Preserve this hidden answer"};
  const seed={version:2,step:4,maxReached:4,startedAt:"2026-10-01T12:00:00Z",focus:"self",complete:false,cost};
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:["--no-sandbox"]});
  const writes=[],unexpected=[],errors=[],results=[];
  let page;
  try {
    await proveIsolation(browser);
    const context=await browser.newContext({serviceWorkers:"block"});
    await installIsolation(context,writes,unexpected);
    page=await context.newPage();page.setDefaultTimeout(10000);
    page.on("pageerror",e=>errors.push(e.message));
    await page.exposeBinding("__priceError",(_,v)=>errors.push(String(v)));
    await page.addInitScript(({seed})=>{
      window.addEventListener("error",e=>window.__priceError(e.message));
      window.addEventListener("unhandledrejection",e=>window.__priceError(String(e.reason)));
      if(!sessionStorage.getItem("price-seeded")) {
        sessionStorage.setItem("price-seeded","1");
        localStorage.setItem("to_rc_state_v1",JSON.stringify(seed));
        localStorage.setItem("to_app_route_v1",JSON.stringify({view:"rcroom",overlay:null}));
      }
    },{seed});
    const url=(process.env.J1_BASE_URL||"http://localhost:80")+"/";
    await page.goto(url);await page.locator('.rc-room[data-step="4"]').waitFor();
    const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem("to_rc_state_v1")));
    async function render(state,theme,width,height) {
      await page.setViewportSize({width,height});
      await page.evaluate(({state,theme})=>{
        localStorage.setItem("to_rc_state_v1",JSON.stringify(state));
        localStorage.setItem("na1_theme",theme);
      },{state,theme});
      await page.goto(url);await page.locator('.rc-room[data-step="4"]').waitFor();
      await page.evaluate(()=>document.fonts.ready);
    }
    for(const [width,height] of [[1366,680],[375,812]]) for(const theme of ["light","dark"]) {
      await render(seed,theme,width,height);
      const pills=page.locator(".rc-you-amount button"),summary=page.locator(".rc-summary");
      assert.equal(await pills.count(),3);
      assert((await summary.textContent()).includes("And it’s costing you my patience."));
      for(const amount of ["a little","a lot","most of me"]) {
        await page.getByRole("button",{name:amount,exact:true}).click();
        assert.equal(await page.locator('.rc-you-amount button[aria-pressed="true"]').count(),1);
        assert.equal((await saved()).cost.youAmount,amount);
        const mapped=amount==="most of me"?"most":amount;
        assert((await summary.textContent()).includes(`And it’s taking ${mapped} of you: my patience.`));
      }
      assert((await summary.textContent()).includes("Over a year, that’s about $1,200 going to my bills, and 104 hours going to my evenings."));
      assert.deepEqual((await saved()).cost,{...cost,youAmount:"most of me"});
      await page.reload();await page.locator('.rc-room[data-step="4"]').waitFor();await page.evaluate(()=>document.fonts.ready);
      assert.equal(await page.getByRole("button",{name:"most of me",exact:true}).getAttribute("aria-pressed"),"true");
      const styles=await page.locator(".rc-summary em").evaluateAll(nodes=>nodes.map(el=>{const s=getComputedStyle(el);return [s.fontFamily,s.fontStyle]}));
      assert(styles.every(([family,style])=>family.includes("Cormorant")&&style==="italic"));
      assert(await page.locator(".rc-summary strong").evaluateAll(nodes=>nodes.every(n=>Number(getComputedStyle(n).fontWeight)>=700)));
      const geometry=await page.evaluate(()=>{
        const body=document.querySelector(".rc-body"),footer=document.querySelector(".rc-footer"),room=document.querySelector(".rc-room");
        return {bodyScroll:body.scrollHeight-body.clientHeight,cardScroll:room.scrollHeight-room.clientHeight,
          footerVisible:footer.getBoundingClientRect().bottom<=innerHeight,sceneBottom:document.querySelector(".rc-price").getBoundingClientRect().bottom,bodyBottom:body.getBoundingClientRect().bottom};
      });
      results.push({width,height,theme,...geometry});
      await page.screenshot({path:path.join(out,`${width}-${height}-${theme}.png`)});
      assert(geometry.bodyScroll<=1&&geometry.cardScroll<=1&&geometry.footerVisible,JSON.stringify(results.at(-1)));
      await page.getByRole("button",{name:"most of me",exact:true}).click();
      assert.equal((await saved()).cost.youAmount,undefined);
      assert((await summary.textContent()).includes("And it’s costing you my patience."));
      assert.equal(await page.getByRole("button",{name:"Close your eyes →",exact:true}).isEnabled(),true);
    }
    const sentences="My patience. My confidence. My sleep.";
    await render({...seed,cost:{...cost,you:sentences,youAmount:"most of me"}},"light",1366,680);
    assert((await page.locator(".rc-summary").textContent()).includes("And it’s taking most of you: my patience, my confidence and my sleep."));
    assert.equal((await saved()).cost.you,sentences);
    for(const patch of [
      {monthly:null,moneyWhere:"",hoursPerWeek:2,hoursWhere:"",you:""},
      {monthly:100,moneyWhere:"",hoursPerWeek:null,hoursWhere:"",you:"",youAmount:"a little"},
      {monthly:null,moneyWhere:"",hoursPerWeek:null,hoursWhere:"",you:""},
    ]) {
      await render({...seed,cost:{...cost,...patch}},"light",1366,680);
      const text=await page.locator(".rc-summary").textContent();
      assert(!/undefined|NaN|going to\s*[.,]|:\s*[.]/.test(text),text);
      assert(text.includes("This isn't blame. It's the diagnosis. And it can change."));
      assert.equal(await page.getByRole("button",{name:"Close your eyes →",exact:true}).isEnabled(),true);
    }
    assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
    console.log(JSON.stringify({results,runtimeErrors:errors,writesIntercepted:writes.length}));
  } finally {await browser.close()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
