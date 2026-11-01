const test=require("node:test"),assert=require("node:assert/strict");
const {modules,fixtures,plain}=require("./a1-fixtures.cjs");
test("Vision has four active exercises; retired flags do not count",()=>{
  const {load}=modules(),p=load("visionProgress"),m=load("mirror2Constants");
  assert.deepEqual(plain(m.M2_EXERCISES.map(e=>[e.n,e.key])),[[1,"time"],[2,"wealth"],[3,"self"],[4,"declaration"]]);
  assert.deepEqual(plain(p.visionSteps({ex1:true})),[false,false,false,false]);
  assert.deepEqual(plain(p.visionSteps({ex2:true})),[true,false,false,false]);
  assert.deepEqual(plain(p.visionSteps({complete:true})),[true,true,true,true]);
});
test("room unlocks preserve drafts, claims and Preview but reject Two Futures",()=>{
  const {load}=modules(),{visionRoomUnlocked:open}=load("visionProgress");
  assert(open("time",{}));assert(!open("wealth",{}));
  assert(open("wealth",{wealth:{cashflow:{blank1:"A draft",blank2:""}}}));
  assert(open("self",{self_complete:true}));assert(open("declaration",{self_complete:true}));
  for(const preview of [false,true])assert(!open("twoFutures",{complete:true},preview));
  for(const key of ["time","wealth","self","declaration"]) {
    assert(open(key,{complete:true}));assert(open(key,{},true));
  }
});
test("RC context is read-only, full length and valid only for B with words and focus",()=>{
  const {load}=modules(),{visionRCContext:context}=load("visionContext"),f=fixtures();
  const original=JSON.stringify(f.rc);
  for(const focus of ["time","wealth","self"])for(const area of ["time","wealth","self"]) {
    const c=context(area,{...f.rc,focus});assert.equal(c.matching,focus===area);
    assert.equal(c.words,f.rc.futureB5.tuesday);
  }
  assert.equal(context("time",{...f.rc,choice:"A"}),null);
  assert.equal(context("time",{...f.rc,focus:null}),null);
  assert.equal(context("time",{...f.rc,futureB5:{...f.rc.futureB5,tuesday:" "}}),null);
  assert.equal(JSON.stringify(f.rc),original);
});
test("Declaration uses plain labels without chips and preserves saved-chip prose",()=>{
  const {load}=modules(),{declSentences,declSummary}=load("visionProse"),f=fixtures();
  const v=f.vision;v.time.work={blank1:"four focused days",blank2:"fulfilling"};
  assert.equal(declSentences(v,"time")[0],"Work: I do this by four focused days, and the work itself feels like fulfilling.");
  assert.equal(declSummary(v),"Work.");
  const chip=load("mirror2Constants").VISION_CHIPS.time.work[2];
  v.twoFutures.futureB.time.work=2;
  assert.equal(declSentences(v,"time")[0],chip.charAt(0).toUpperCase()+chip.slice(1)+". I do this by four focused days, and the work itself feels like fulfilling.");
  assert(declSummary(v).startsWith("A life where "));
  const before=JSON.stringify(v);declSentences(v,"time");declSummary(v);assert.equal(JSON.stringify(v),before);
  assert.deepEqual(plain(declSentences({},"time")),[]);assert.equal(declSummary({}),"");
});
test("time estimates use the four active Vision flags",()=>{
  const {load}=modules(),f=fixtures(),{a1RemainingMinutes:minutes}=load("remainingTime");
  const p={ex4:true},i={sealCompleted:true},values={claimed:true};
  assert.equal(minutes(p,{ex1:true},i,values),40);
  assert.equal(minutes(p,{ex2:true},i,values),30);
  assert.equal(minutes(p,{complete:true},i,values),0);
});
