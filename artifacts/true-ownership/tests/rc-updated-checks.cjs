const assert = require("node:assert/strict");

// Called only after the parent suite has proved fail-closed write interception.
module.exports = async function ({ page, render, metric, seed, empty, key, writes }) {
  const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  const next = name => page.getByRole("button", { name, exact: true });
  const settled = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const sizes = [[375,812],[600,800],[768,1024],[900,700],[1024,600],[1280,800],[1366,680]];
  const long = "Helping everyone else with bills and missed payments while leaving my own plans waiting. Making room for my own needs too.";
  for (const [width,height] of sizes) for (const theme of ["light","dark"]) {
    await render({ ...seed, step:4, cost:{...seed.cost,moneyWhere:long,hoursWhere:long,you:long} },theme,{width,height});
    const geometry = await page.locator(".rc-where-answer").evaluateAll(els => els.map(el => {
      const s=getComputedStyle(el);return { max:s.maxHeight, padding:s.padding, scroll:el.scrollHeight-el.clientHeight, border:s.borderBottomWidth };
    }));
    assert.equal(geometry.length,3);
    assert(geometry.every(v => v.max==="none" && v.padding==="0px" && v.scroll<=1 && v.border==="0px"),"Ledger answers must expose all lines without clipping");
    assert.equal(await page.locator('input[type="number"]').count(),0);
    await metric(`${width}x${height}-${theme}-4-long-answers`);
    await render({ ...seed, step:9, futureB1:{doing:long,oneThing:long} },theme,{width,height});
    assert.equal(await page.getByRole("textbox",{name:"My one thing this week",exact:true}).getAttribute("contenteditable"),"plaintext-only");
    assert.match(await page.locator(".rc-letter-stamp").innerText(),/OCTOBER\s+2027/i);
    await metric(`${width}x${height}-${theme}-9-long-answers`);
  }
  for (const count of [99,100,120,144]) {
    const text="Making room for what matters ".repeat(6).slice(0,count);
    await render({...seed,step:4,cost:{...seed.cost,moneyWhere:text,hoursWhere:text,you:text}},"light",{width:375,height:812},"rcroom",false);
    assert.equal(await page.locator(".rc-answer-counter").count(),count>=100?3:0);
    assert((await page.locator(".rc-where-answer").evaluateAll(els=>els.map(el=>el.value))).every(t=>t===text));
    assert.equal((await saved()).cost.you,text,"Soft limits must never truncate loaded answers");
    assert(await next("Close your eyes →").isEnabled());
    await render({...seed,step:9,futureB1:{doing:text,oneThing:text}},"dark",{width:375,height:812},"rcroom",false);
    assert.equal(await page.locator(".rc-answer-counter").count(),count>=100?2:0);
    if(count>=100) assert.deepEqual(await page.locator(".rc-answer-counter").allTextContents(),[`${count}/120`,`${count}/120`]);
    assert.match(await page.locator(".rc-letter-card").innerText(),/I'm making room/);
    assert.match(await page.locator(".rc-letter-card").innerText(),/chose to making room/);
    assert.equal((await saved()).futureB1.doing,text);
    assert(await next("Choose my future →").isEnabled(),"Soft guidance cannot block Continue");
  }
  await page.reload(); await page.locator(".rc-letter-card").waitFor();
  assert.equal((await saved()).futureB1.oneThing.length,144);
  await render({ ...seed,step:4 },"light",{width:1366,height:680},"rcroom",false);
  const snapshot=await saved();
  assert.equal(await page.getByRole("textbox",{name:"About dollars a month",exact:true}).inputValue(),"1,235");
  const manyLines="The first full line\nThe second full line\nThe third full line\nThe fourth full line";
  await page.locator(".rc-where-answer").first().fill(manyLines);
  await settled();
  const four=await page.locator(".rc-where-answer").first().evaluate(el=>({height:el.clientHeight,line:parseFloat(getComputedStyle(el).lineHeight),overflow:el.scrollHeight-el.clientHeight}));
  assert(four.height>=4*four.line-1 && four.overflow<=1,"The obsolete two-line cap must not return");
  await page.reload(); await page.locator(".rc-where-answer").first().waitFor();
  assert.equal(await page.locator(".rc-where-answer").first().inputValue(),manyLines);
  assert.equal((await saved()).cost.monthly,snapshot.cost.monthly,"Display formatting cannot rewrite a saved fractional amount");
  assert.deepEqual((await saved()).futureA,snapshot.futureA);
  assert.equal((await saved()).cost.whoElse,snapshot.cost.whoElse);
  await page.getByRole("textbox",{name:"About dollars a month",exact:true}).fill("2500");
  await page.getByRole("heading",{name:"Where are you leaking power?",exact:true}).click();
  assert.equal(await page.getByRole("textbox",{name:"About dollars a month",exact:true}).inputValue(),"2,500");
  assert.equal((await saved()).cost.monthly,2500);

  await render({...seed,step:9,complete:true,maxReached:13},"light",{width:900,height:700},"rcroom",false);
  const letter=page.getByRole("textbox",{name:"My one thing this week",exact:true});
  await letter.fill(long);
  await letter.press("End"); await letter.pressSequentially("!");
  assert.equal(await letter.textContent(),long+"!");
  assert.equal(await letter.innerText(),(long+"!").replace(/^H/,"h"),"Display case cannot rewrite editable DOM text");
  await page.reload(); await letter.waitFor();
  assert.equal(await letter.textContent(),long+"!");
  const edited=await saved();
  assert(edited.complete && edited.choice==="B" && edited.willing==="yes");
  assert.deepEqual(edited.defaultsNamed,seed.defaultsNamed);
  assert.equal(edited.futureB5.whoNotices,seed.futureB5.whoNotices);

  // A genuinely first visit has no answers, choice or commitment from later scenes.
  const live={...empty,startedAt:seed.startedAt,step:5,maxReached:5,focus:seed.focus,
    mirror:["self-carrying","time-carrying","wealth-carrying"],tuesday:seed.tuesday,
    defaultsNamed:seed.defaultsNamed,cost:seed.cost};
  const checkRevealFrames = async selector => {
    const frames=await page.locator(selector).evaluateAll(els=>els.map(el=>{
      const a=el.getAnimations()[0]; a.pause();
      const delay=Number(a.effect.getTiming().delay), duration=Number(a.effect.getTiming().duration);
      a.currentTime=delay-1; const before=Number(getComputedStyle(el).opacity);
      a.currentTime=delay+duration/2; const during=Number(getComputedStyle(el).opacity);
      a.currentTime=delay+duration; const after=Number(getComputedStyle(el).opacity);
      return {before,during,after};
    }));
    assert(frames.length && frames.every(v=>v.before===0 && v.during>0 && v.during<1 && v.after===1),"Every beat must reveal across its actual animation interval");
  };
  await render(live,"light",{width:1366,height:680},"rcroom",false);
  await next("Show me →").click();
  assert.equal(await page.locator(".rc-arriving").count(),1);
  const animation = await page.locator("[data-beat]").evaluateAll(els=>els.map(el=>({name:getComputedStyle(el).animationName,delay:parseFloat(getComputedStyle(el).animationDelay)*1000,duration:getComputedStyle(el).animationDuration})));
  assert.deepEqual(animation.map(v=>v.delay),[400,1300,2200,3100]);
  assert(animation.every(v=>v.name==="rc-beat-enter" && v.duration==="0.6s"));
  assert(await next("Keep going →").isEnabled(),"Reveals must not gate navigation");
  await checkRevealFrames("[data-beat]");
  assert.match(await page.locator(".rc-still-line").first().innerText(),/carrying everyone's/);
  assert.match(await page.locator(".rc-still-line").last().innerText(),/into worrying/);
  assert.equal((await saved()).defaultsNamed.carrying,seed.defaultsNamed.carrying);
  await next("Keep going →").click();
  assert.equal(await page.locator(".rc-arriving").count(),1);
  assert.deepEqual(await page.locator(".rc-timeline-point").evaluateAll(els=>els.map(el=>parseFloat(getComputedStyle(el).animationDelay)*1000)),[400,1000,1600]);
  await checkRevealFrames(".rc-timeline-point");
  assert.deepEqual(await page.locator(".rc-timeline strong").evaluateAll(els=>els.map(el=>getComputedStyle(el).whiteSpace)),["nowrap","nowrap","nowrap"]);
  assert.match(await page.locator(".rc-timeline").innerText(),/\$74,070/);
  assert.match(await page.locator(".rc-timeline").innerText(),/130 days gone/);
  await page.getByRole("button",{name:"heavier",exact:true}).click();
  assert.deepEqual((await saved()).compound.feels,["Heavier"],"Lower-case labels cannot rewrite stored selections");
  await next("+ my own").click();
  const own=page.getByRole("textbox",{name:"My own feeling",exact:true});
  assert(await own.evaluate(el=>{
    const s=getComputedStyle(el), canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
    ctx.font=s.font; return ctx.measureText(el.placeholder).width<=el.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight);
  }),"The whole placeholder must be visible");
  const feeling="Ready to stop repeating the same exhausting pattern and make something different";
  await own.fill(feeling); await settled();
  assert(await own.evaluate(el=>el.scrollHeight<=el.clientHeight+1 && el.scrollWidth<=el.clientWidth+1),"Custom feelings must wrap without clipping");
  assert((await saved()).compound.feels.includes(feeling));
  await next("← Back").click();
  assert.equal(await page.locator(".rc-arriving").count(),0);
  await page.reload(); await page.locator(".rc-future-a-beats").waitFor();
  assert.equal(await page.locator(".rc-arriving").count(),0);
  await render(live,"dark",{width:1366,height:680},"rcroom",false);
  await page.emulateMedia({colorScheme:"dark",reducedMotion:"reduce"});
  await next("Show me →").click();
  assert(await page.locator("[data-beat]").evaluateAll(els=>els.every(el=>getComputedStyle(el).animationName==="none" && getComputedStyle(el).opacity==="1")));
  await next("Keep going →").click();
  assert(await page.locator(".rc-timeline-point").evaluateAll(els=>els.every(el=>getComputedStyle(el).animationName==="none" && getComputedStyle(el).opacity==="1")));
  await page.emulateMedia({reducedMotion:"no-preference"});
  for(const [monthly,hoursPerWeek] of [[null,12],[100,null],[null,null]]) {
    await render({...seed,step:6,cost:{...seed.cost,monthly,hoursPerWeek}});
    assert.equal(await page.locator(".rc-cost-moment strong").count(),Number(monthly!==null)+Number(hoursPerWeek!==null));
    assert.equal(await page.locator(".rc-cost-moment>span:not(.rc-gone)").count(),0);
  }
  await render({...seed,step:12,complete:true,maxReached:13},"light",{width:1366,height:680},"rc",false);
  await page.locator(".rc-dev-tools>summary").click();
  const reset=next("Reset Reality Check");
  const prior=await saved();
  page.once("dialog",d=>d.dismiss());
  await reset.click();
  assert.deepEqual(await saved(),prior,"Cancelling reset must do nothing");
  const progress=()=>page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>/^(to_a[1-5]_state|to_mirror4_state|to_map|to_intake)/.test(k))));
  const beforeProgress=await progress(), beforeWrites=writes.length;
  page.once("dialog",d=>d.accept());
  await Promise.all([page.waitForEvent("domcontentloaded"),reset.click()]);
  await page.locator(".rc-hub").waitFor();
  assert.deepEqual(await progress(),beforeProgress,"DEV reset must preserve unrelated progress");
  assert.equal((await saved()).mirror.length,0);
  assert.equal((await saved()).complete,false);
  const aside=await page.evaluate(()=>JSON.parse(localStorage.getItem("to_setaside_v1")||"null"));
  assert(!aside || aside.items.length===0);
  assert(writes.length-beforeWrites>=2,"The actual two-store reset must be intercepted");
  assert(writes.slice(beforeWrites).every(w=>/\/api\/userdata\/(rcstate|setaside)$/.test(w.path)),"Reset can write only RC and set-aside");
  console.log("UPDATED SCENES PASSED: soft counters at 100/120/144 without truncation/gating, display-only lower-case and caret preservation, wrapping custom feelings, ledger growth/formatting, saved answers/completion, actual first-arrival timing, review/refresh instant, reduced motion, missing amounts and confirmed/cancelled isolated DEV reset.");
};
