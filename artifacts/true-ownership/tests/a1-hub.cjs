const test=require("node:test"),assert=require("node:assert/strict");
const {modules,plain,fixtures}=require("./a1-fixtures.cjs");
test("empty normalized mirrors do not grandfather untouched cards",()=>{
  const {load}=modules(),f=fixtures(),p=load("a1Progress");
  const map={vision:f.vision,mirror3:f.identity};
  assert.deepEqual(plain(p.a1Started(k=>k==="to_map"?map:null,f.values)),
    {purpose:false,vision:false,identity:false,values:false});
});
test("each mirror preserves its own unfinished answer independently",()=>{
  const {load}=modules(),f=fixtures(),p=load("a1Progress");
  for(const [mirror,map,values] of [
    ["purpose",{purpose_draft:"My first why"},f.values],
    ["vision",{vision:{...f.vision,time:{...f.vision.time,overall:"My Tuesday"}}},f.values],
    ["identity",{mirror3:{...f.identity,pickedGifts:[{gift:"Wise",state:"owned"}]}},f.values],
    ["values",{}, {...f.values,status:"in_progress"}],
  ]) {
    const started=p.a1Started(k=>k==="to_map"?map:null,values);
    assert.equal(started[mirror],true,mirror);
    assert.equal(p.a1Unlocks(false,started,{purpose:false,vision:false,identity:false,values:false})[mirror],true,mirror);
  }
  assert.equal(p.a1Started(k=>k==="a1_to_curq"?0:null,f.values).purpose,true);
});
test("new chain, individual claims, returning eligibility and Preview",()=>{
  const {load}=modules(),{a1Unlocks}=load("a1Progress");
  const none={purpose:false,vision:false,identity:false,values:false};
  assert.deepEqual(plain(a1Unlocks(false,none,none)),none);
  assert.deepEqual(plain(a1Unlocks(true,none,none)),{values:true,identity:false,purpose:false,vision:false});
  for(const [prior,next] of [["values","identity"],["identity","purpose"],["purpose","vision"]])
    assert.equal(a1Unlocks(true,none,{...none,[prior]:true})[next],true);
  for(const mirror of Object.keys(none))assert.equal(a1Unlocks(false,none,{...none,[mirror]:true})[mirror],true);
  assert(Object.values(a1Unlocks(false,none,none,true)).every(Boolean));
});
test("cloud-only drafts and A3/A5-only work preserve returning eligibility",()=>{
  const {load}=modules(),p=load("reality-check/progress");
  for(const cache of [{map:{purpose_draft:"Draft"}},{a3state:{m1:{currentStep:1}}},{a5state:{started:true}}])
    assert.equal(p.hasCloudProgress(cache),true);
  assert.equal(p.hasCloudProgress({}),false);
});
