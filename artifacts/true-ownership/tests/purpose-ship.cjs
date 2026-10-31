const test=require("node:test"),assert=require("node:assert/strict");
const {modules,fixtures,plain}=require("./a1-fixtures.cjs");
test("three active Purpose exercises keep original flag meanings and prior claims",()=>{
  const {load}=modules(),{purposeSteps,purposeRoomUnlocked}=load("purposeProgress");
  assert.deepEqual(plain(purposeSteps({ex1:true,ex2:false,ex3:false,ex4:false})),[false,false,false]);
  assert.deepEqual(plain(purposeSteps({ex2:true,ex3:false,ex4:false})),[true,false,false]);
  assert.deepEqual(plain(purposeSteps({ex2:false,ex3:false,ex4:true})),[true,true,true]);
  for(const preview of [false,true])assert.equal(purposeRoomUnlocked("sym",{},{},"",preview),false);
  assert.equal(purposeRoomUnlocked("to",{}),true);
  assert.equal(purposeRoomUnlocked("peel",{},{},"unfinished"),true);
  assert.equal(purposeRoomUnlocked("declare",{},{purpose_final:"An unclaimed draft"}),true);
  assert.equal(purposeSteps({ex2:false,ex3:false,ex4:false}).every(Boolean),false);
});
test("holdback precedence is read-only across current and nested legacy shapes",()=>{
  const {load}=modules(),{purposeHoldback}=load("purposeContext");
  const map={state:{a1:{purpose:{symptoms:{holdingBack:"My original answer"}}}}},before=JSON.stringify(map);
  assert.equal(purposeHoldback("Saved first",map,"RC. Next.").text,"Saved first");
  assert.equal(purposeHoldback("",map,"RC. Next.").text,"My original answer");
  assert.equal(purposeHoldback(" ",{},"I am stretched thin. Another sentence.").text,"I am stretched thin.");
  assert.equal(purposeHoldback("",{},"No punctuation").text,"No punctuation");
  assert.equal(purposeHoldback("",{},"").text,"");
  assert.equal(purposeHoldback("",map,"RC").fromRealityCheck,false);
  assert.equal(purposeHoldback("",{},"RC").fromRealityCheck,true);
  assert.equal(JSON.stringify(map),before);
});
test("ranked names and creatures are conditional; shortening never mutates saved words",()=>{
  const {load}=modules(),{purposeNamedContext,shortFutureWords}=load("purposeContext");
  const values={rank:["b","a","missing"],clusters:[{id:"a",userName:"Kindness"},{id:"b",userName:"Freedom"}]};
  assert.deepEqual(plain(purposeNamedContext(values,{clusters:[{animal:"Eagle",descriptorWord1:"Clear",descriptorWord2:"Bold"}]})),
    {ranked:["Freedom","Kindness"],creatures:["Clear Bold Eagle"]});
  assert.deepEqual(plain(purposeNamedContext({},{})),{ranked:[],creatures:[]});
  const long="My future Tuesday makes room for the things that I care about and the people I love.";
  assert.equal(shortFutureWords(long),"My future Tuesday makes room for the things that I care…");
  assert.equal(long.endsWith("love."),true);
});
test("remaining time excludes retired work and entire claimed mirrors",()=>{
  const {load}=modules(),f=fixtures(),t=load("remainingTime"),vision={ex1:false,ex2:false,ex3:false,ex4:false,ex5:false,complete:false};
  const purpose={ex2:false,ex3:false,ex4:false};
  const fresh=t.a1RemainingMinutes(purpose,vision,f.identity,f.values);
  assert.equal(t.a1RemainingMinutes({...purpose,ex1:true},vision,f.identity,f.values),fresh);
  assert.equal(t.a1RemainingMinutes({...purpose,ex2:true},vision,f.identity,f.values),fresh-10);
  assert.equal(t.a1RemainingMinutes({ex4:true},{complete:true},{sealCompleted:true},{claimed:true}),0);
  assert.equal(t.remainingTimeLabel(0),"");
  assert.equal(t.remainingTimeLabel(70),"~1 hr 10 min remaining");
  assert.equal(t.a2RemainingMinutes({m1:{claimed:true},m2:{claimed:true},m3:{claimed:true}}),0);
  assert.equal(t.a2RemainingMinutes({m1:{maxReached:4},m2:{claimed:true},m3:{claimed:true}}),10);
  assert.equal(t.a2RemainingMinutes({m1:{currentStep:1,maxReached:4},m2:{claimed:true},m3:{claimed:true}}),10);
});
