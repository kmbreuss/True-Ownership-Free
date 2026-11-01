const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {chromium}=require("playwright");
const {fixtures,modules,plain}=require("./a1-fixtures.cjs");
const {proveIsolation,installIsolation}=require("./browser-isolation.cjs");
const {load}=modules(),f=fixtures(),areas=["self","time","wealth"];
const out=path.resolve("generated-artifacts/post-a1-fixes");
const own="I kept my word. Keeping My Word is what I wrote.";
function data(spec) {
  const vision=plain(f.vision),values=plain(f.values),rc=plain(f.rc);
  for(const area of areas) {
    vision[area+"_complete"]=true;
    for(const domain of load("mirror2Constants").LENS_DOMAINS[area])
      vision[area][domain]={blank1:"Make room for what matters",blank2:"Calm and fulfilling"};
  }
  vision.complete=true;vision.declaration={...vision.declaration,complete:true,sealSeen:true};
  values.claimed=true;rc.focus=spec.area||"time";rc.futureB5.tuesday=own;
  const a4=plain(load("a4Constants").EMPTY_A4),a5=plain(load("a5Constants").EMPTY_A5);
  for(const area of areas) {
    Object.assign(a4[area],{step:5,will:own,when:"I start my day",year:"Make room for myself",gives:"Calm",
      plan:"Follow through",sure:8,claimed:true,claimedAt:"2026-01-01T12:00:00Z"});
    Object.assign(a5.plans[area],{ninety:own,ninetyBy:"2026-04-01",week:own,days:["Mon"],time:"09:00"});
  }
  a4.a4={claimed:true,claimedAt:"2026-01-01T12:00:00Z"};
  a5.claimed=!spec.unclaimed;a5.claimedAt=a5.claimed?"2026-01-01T12:00:00Z":null;a5.step=spec.step??4;
  const a2=plain(load("a2Constants").EMPTY_A2),a3=plain(load("a3Constants").EMPTY_A3);
  for(const value of Object.values(a2))value.claimed=true;
  for(const value of Object.values(a3))value.claimed=true;
  return {to_map:{purpose_final:own,mirror3:{...f.identity,sealCompleted:true},vision,
      a2_one_thing:"Protect my mornings",a3_board_candidates:[]},
    to_rc_state_v1:rc,to_mirror4_state_v1:values,to_a2_state_v1:a2,to_a3_state_v1:a3,
    to_a4_state_v1:a4,to_a5_state_v1:a5,a1_ex2_done:true,a1_ex3_done:true,a1_ex4_done:true};
}
const specs=[
  {name:"Map",route:{view:"a1map",overlay:null}},
  {name:"Framework",route:{view:"framework",overlay:null}},
  {name:"A4 hub",route:{view:"a4",overlay:null}},
  {name:"A4 Self seal",route:{view:"a4m1",overlay:{hubId:"a4m1",roomId:"self"}}},
  ...[{name:"Begin",step:0,unclaimed:true},{name:"Continue",step:1,unclaimed:true},{name:"Review"}]
    .map(s=>({...s,name:"A5 hub "+s.name,route:{view:"a5",overlay:null}})),
  ...[0,1,2,3,4].map(step=>({name:"A5 room "+step,step,unclaimed:step<4,
    route:{view:"a5m1",overlay:{hubId:"a5m1",roomId:"keeping"}}})),
  {name:"Weekly seal",route:{view:"a5c",overlay:{hubId:"a5c",roomId:"checkin"}}},
  {name:"90-day renewal seal",route:{view:"a5r",overlay:{hubId:"a5r",roomId:"lookback"}}},
  {name:"A1 end seal",route:{view:"a1end3",overlay:null}},
  ...areas.map(area=>({name:"Vision "+area,area,route:{view:"explore2",overlay:{hubId:"explore2",roomId:area}}})),
];
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:["--no-sandbox"]});
  await proveIsolation(browser);
  const previous=process.env.POST_A1_RESUME
    ? JSON.parse(fs.readFileSync(path.join(out,"results.json"),"utf8")) : null;
  const results=previous?previous.results.filter(r=>r.pass):[],writes=[],unexpected=[],errors=[];
  for(const [width,height]of [[375,812],[1280,800],[1366,680]])for(const theme of ["light","dark"])for(const spec of specs) {
    const name=`${spec.name} ${width}x${height} ${theme}`;
    if(process.env.POST_A1_CASE&&!new RegExp(process.env.POST_A1_CASE).test(name))continue;
    if(previous&&results.some(r=>r.name===name&&r.pass))continue;
    const context=await browser.newContext({serviceWorkers:"block",viewport:{width,height}});
    await installIsolation(context,writes,unexpected,()=>({intake:{name:"Fixture"},phase:"a1"}));
    const local=data(spec),page=await context.newPage();page.setDefaultTimeout(6000);
    page.on("pageerror",e=>errors.push({name,error:e.message}));
    await page.addInitScript(({local,route,theme})=>{
      if(sessionStorage.getItem("post-a1-fixture"))return;
      sessionStorage.setItem("post-a1-fixture","1");
      for(const [key,value]of Object.entries(local))localStorage.setItem(key,JSON.stringify(value));
      localStorage.setItem("na1_theme",theme);localStorage.setItem("to_app_route_v1",JSON.stringify(route));
    },{local,route:spec.route,theme});
    try {
      await page.goto("http://localhost:80/");await page.evaluate(()=>document.fonts.ready);
      const card=page.locator(".na1-room-card").last();
      if(spec.name==="Map") {
        await page.locator(".map-of-me-page").waitFor();
        await page.getByRole("button",{name:/Expand all/}).click();
        assert((await page.locator(".map-main").textContent()).includes(own));
        if(width<=600) {
          const stacked=await page.locator(".map-progress-strip").evaluate(strip=>{
            const rows=[...strip.children].map(el=>el.getBoundingClientRect());
            return rows.length===5&&rows.every((r,i)=>i===0||r.top>=rows[i-1].bottom);
          });
          assert(stacked,"Phone progress tiles must stack, not squeeze into columns");
          await page.locator(".map-progress-strip").scrollIntoViewIfNeeded();
        }
        if(width>600)assert(await page.evaluate(()=>{
          const style=document.querySelector('style[data-vite-dev-id$="/map-of-me.css"]');
          const measure=()=>[".map-topbar",".map-layout",".map-sidebar",".map-main"]
            .map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [r.x,r.y,r.width,r.height]});
          const styled=measure();style.sheet.disabled=true;const original=measure();style.sheet.disabled=false;
          return JSON.stringify(styled)===JSON.stringify(original);
        }),"Desktop Map geometry changed");
      } else if(spec.name.startsWith("Vision")) {
        await page.locator(".vision-rc-heading").waitFor();
        const fit=await page.locator(".vision-rc-heading").evaluate(el=>{
          const range=document.createRange();range.selectNodeContents(el);
          return {size:parseFloat(getComputedStyle(el).fontSize),lines:range.getClientRects().length,width:el.clientWidth};
        });
        if(width>600){assert(fit.size>=26);assert.equal(fit.lines,1);}
        results.push({name:"heading "+name,pass:true,...fit});
      } else if(spec.name==="Weekly seal") {
        await card.waitFor();
        for(let i=0;i<3;i++) {
          await card.getByRole("radio",{name:"Yes",exact:true}).first().click();
          await card.getByRole("button",{name:i===2?"Save check-in →":i===0?"Next: Time →":"Next: Wealth →",exact:true}).click();
        }
        await card.getByText(/Every week you do what you committed to/).waitFor({state:width<=600?"attached":"visible"});
      } else if(spec.name==="90-day renewal seal") {
        await card.waitFor();await card.getByRole("button",{name:"Grow it, or keep it →",exact:true}).click();
        for(const area of ["Self","Time","Wealth"]) {
          const tab=card.getByRole("tab",{name:new RegExp("^"+area)});
          if(await tab.count())await tab.click();
          else await card.getByRole("button",{name:new RegExp("^"+area)}).first().click();
          await card.getByRole("radio",{name:"Keep it as is",exact:true}).click();
        }
        await card.getByRole("button",{name:"Start my next 90 days →",exact:true}).click();
        await card.getByText(/another chance to follow through on your commitment/).waitFor({state:width<=600?"attached":"visible"});
      } else if(spec.name==="A1 end seal") {
        await page.locator(".a1-end-seal").waitFor();
        assert.equal(await page.locator(".a1-end-seal").textContent(),"PUT YOUR CHOSEN LINE HERE");
      } else if(spec.name==="A4 Self seal") {
        await card.waitFor();await card.getByText(/self-trust starts: doing what you committed to/).waitFor();
      } else if(spec.name==="Framework") {
        await page.locator(".na1-a-deliverable").filter({hasText:"My Commitment"}).scrollIntoViewIfNeeded();
      } else if(spec.name==="A4 hub") {
        await page.getByText(/rhythm — so you do what you committed to/).waitFor();
      } else if(spec.name.startsWith("A5 hub")) {
        await page.getByRole("heading",{name:"Commit to yourself.",exact:true}).waitFor();
        assert(await page.getByRole("button",{name:spec.name.split(" ").at(-1)+" My Commitment →",exact:true}).isVisible());
      } else {
        await card.waitFor();assert((await card.textContent()).includes("My Commitment"));
      }
      const overflow=await page.evaluate(()=>({
        page:document.documentElement.scrollWidth>innerWidth+1,
        card:[...document.querySelectorAll(".na1-room-card")].some(c=>c.scrollWidth>c.clientWidth+1),
      }));
      assert.equal(overflow.page,false,"Page has horizontal overflow");
      assert.equal(overflow.card,false,"Room has horizontal overflow");
      const stored=await page.evaluate(()=>({map:JSON.parse(localStorage.getItem("to_map")),
        a4:JSON.parse(localStorage.getItem("to_a4_state_v1")),a5:JSON.parse(localStorage.getItem("to_a5_state_v1"))}));
      assert.equal(stored.map.purpose_final,own);
      for(const area of areas){assert.equal(stored.a4[area].will,own);assert.equal(stored.a5.plans[area].week,own);}
      await page.screenshot({path:path.join(out,name.replace(/\W/g,"_")+".png")});
      results.push({name,pass:true,...overflow});
    }catch(e){results.push({name,pass:false,error:e.message});await page.screenshot({path:path.join(out,name.replace(/\W/g,"_")+"_FAILED.png")}).catch(()=>{});}
    finally{await context.close();fs.writeFileSync(path.join(out,process.env.POST_A1_CASE?"focused-results.json":"results.json"),
      JSON.stringify({results,runtimeErrors:errors,writesIntercepted:writes.length,unexpected},null,2));}
  }
  console.log(JSON.stringify({results,runtimeErrors:errors,writesIntercepted:writes.length,unexpected},null,2));
  await browser.close();process.exitCode=results.some(r=>!r.pass)||errors.length||unexpected.length?1:0;
})().catch(e=>{console.error(e);process.exit(1)});
