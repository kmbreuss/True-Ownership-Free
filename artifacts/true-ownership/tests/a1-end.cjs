const {test}=require("node:test"),assert=require("node:assert/strict");
const {modules,fixtures,plain}=require("./a1-fixtures.cjs");
test("summary reads ranked current answers without changing source records",()=>{
  const {load}=modules(),{rc,vision,identity,values}=fixtures();
  rc.topDefaults=["carrying"];
  values.rank=["second","first"];values.clusters=[{id:"first",userName:"Hope"},{id:"second",userName:"Integrity"}];
  identity.clusters=[{animal:"Owl",descriptorWord1:"Wise",descriptorWord2:"Steady"}];
  vision.time.work.blank1="Mornings for deep work.";
  vision.declaration.sentences={wealth:"My business runs without me."};
  const map={purpose_final:"Shine the light.",mirror3:identity,vision};
  const before=JSON.stringify({map,values,rc});
  const s=load("a1End/summary").endSummary(map,values,rc);
  assert.deepEqual(plain(s.names),["Integrity","Hope"]);
  assert.deepEqual(plain(s.creatures),["Wise Steady Owl"]);
  assert.equal(s.where,"Carrying, mostly in Time.");
  assert.deepEqual(plain(s.vision),[{area:"time",words:"Mornings for deep work."},{area:"wealth",words:"My business runs without me."}]);
  assert.equal(JSON.stringify({map,values,rc}),before);
});
test("empty/A summaries hide missing rows and long answers trim at a word break",()=>{
  const {load}=modules(),{rc}=fixtures(),api=load("a1End/summary");
  const s=api.endSummary({}, {},{...rc,choice:"A",focus:null,topDefaults:[]});
  assert.equal(s.futureB,"");assert.equal(s.where,"");assert.deepEqual(plain(s.vision),[]);
  assert(api.shortLine("whole words ".repeat(15)).length<=91);
  assert(/(?:whole|words)…$/.test(api.shortLine("whole words ".repeat(15))));
  assert.equal(api.shortLine("x".repeat(150)).length,91);
});
test("notice saves and edits one stable set-aside item, preserving unrelated data",()=>{
  const item={id:"rc-old",source:"reality-check",round:"old",createdAt:"then",text:"Keep me"};
  const {load,data}=modules();
  data.set("to_setaside_v1",JSON.stringify({version:1,items:[item]}));
  data.set("to_map",'{"purpose_final":"Untouched"}');
  const changed=[];load("syncHook").setChangeHandler(key=>changed.push(key));
  const api=load("a1End/notice");
  api.saveNotice({value:"Integrity",lived:"I spoke up.",didnt:"I said yes too quickly."});
  const first=JSON.parse(data.get("to_setaside_v1")).items[1];
  api.saveNotice({value:"Integrity",lived:"I spoke kindly.",didnt:"I avoided the call."});
  const items=JSON.parse(data.get("to_setaside_v1")).items;
  assert.equal(items.length,2);assert.deepEqual(items[0],item);assert.equal(items[1].createdAt,first.createdAt);
  assert.equal(items[1].source,"a1");assert.equal(items[1].kind,"notice");assert.equal(items[1].area,null);
  assert.equal(items[1].text,"I avoided the call.");assert.equal(api.loadNotice().lived,"I spoke kindly.");
  assert.equal(data.get("to_map"),'{"purpose_final":"Untouched"}');
  assert.deepEqual(changed,["a1_notice","to_setaside_v1","a1_notice","to_setaside_v1"]);
});
test("empty optional notice does not create a blank set-aside item",()=>{
  const {load,data}=modules();load("a1End/notice").saveNotice({value:"your top value",lived:"",didnt:""});
  assert(!data.has("to_setaside_v1"));assert.equal(JSON.parse(data.get("a1_notice")).didnt,"");
});
test("Preview notice save cannot change storage or notify synchronization",()=>{
  const {load,data,session}=modules();session.set("to_dev_preview","1");
  const changed=[];load("syncHook").setChangeHandler(key=>changed.push(key));
  load("a1End/notice").saveNotice({value:"Hope",lived:"Preview",didnt:"Preview"});
  assert.equal(data.size,0);assert.deepEqual(changed,[]);
});
