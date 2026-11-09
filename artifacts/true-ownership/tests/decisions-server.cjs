const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict"),ts=require("typescript");
const {createRequire}=require("node:module");
const requireApi=createRequire(path.resolve("artifacts/api-server/package.json"));
const express=requireApi("express");
const {modules,plain}=require("./a1-fixtures.cjs");
const load=modules().load;
const model=load(path.resolve("lib/decision-model.ts"));
const rows=new Map();let locks=0,queue=Promise.resolve();
const table={userId:"user",key:"key"};
const find=where=>rows.get(where.map(([column,value])=>value).join(":"));
const identity=where=>where.map(([column,value])=>value).join(":");
const tx={
 execute:async()=>{locks++},
 select:()=>({from:()=>({where:where=>({for:async()=>find(where)?[find(where)]:[]})})}),
 insert:()=>({values:record=>({onConflictDoUpdate:async()=>rows.set(record.userId+":"+record.key,record)})}),
 update:()=>({set:change=>({where:async where=>rows.set(identity(where),{...find(where),...change})})}),
};
const db={transaction:fn=>{const job=queue.then(()=>fn(tx));queue=job.catch(()=>{});return job},
 select:()=>({from:()=>({where:async ([column,user])=>[...rows.values()].filter(row=>row.userId===user)})})};
const js=ts.transpileModule(fs.readFileSync("artifacts/api-server/src/routes/userdata.ts","utf8"),
 {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
vm.runInThisContext(`(function(require,module,exports){${js}\n})`)(dep=>{
 if(dep==="@workspace/db")return {db,userDataTable:table};
 if(dep==="drizzle-orm")return {eq:(a,b)=>[a,b],and:(...x)=>x,sql:()=>({})};
 if(dep.includes("decision-model"))return model;
 if(dep.includes("syncGuard"))return load(path.resolve("artifacts/api-server/src/lib/syncGuard.ts"));
 return requireApi(dep);
},mod,mod.exports);
(async()=>{
 const app=express();app.use(express.json());
 app.use((req,res,next)=>{req.isAuthenticated=()=>!!req.headers["x-fixture-user"];req.user={id:req.headers["x-fixture-user"]};req.log={error(){}};next()});
 app.use("/api",mod.exports.default);
 const server=app.listen(0,"127.0.0.1");await new Promise(r=>server.once("listening",r));
 const base=`http://127.0.0.1:${server.address().port}/api`;
 const seed=JSON.parse(fs.readFileSync("generated-artifacts/decisions/synthetic-record.json","utf8"));
 const put=(record,user="alpha",t=Date.now())=>fetch(base+"/userdata/decisions",{method:"PUT",headers:{"Content-Type":"application/json","x-fixture-user":user},body:JSON.stringify({value:{t,v:{version:1,items:[record]}}})});
 try{
  assert.equal((await fetch(base+"/userdata")).status,401);
  assert.equal((await put({...seed,decision:""})).status,400);
  assert.equal((await put({...seed,answers:{...seed.answers,act:{step:"",date:"2026-02-30"}}})).status,400);
  const first={...seed,id:"first",createdAt:Date.now()+1e12,updatedAt:Date.now()+1e12};
  const second={...seed,id:"second"};
  await Promise.all([put(first),put(second,"alpha",1)]);
  const get=async user=>(await fetch(base+"/userdata",{headers:{"x-fixture-user":user}})).json();
  let state=await get("alpha");
  assert.equal(state.decisions.v.items.length,2);
  assert(state.decisions.v.items.every(r=>r.createdAt<=Date.now()));
  assert.equal((await get("beta")).decisions,undefined);
  const stored=state.decisions.v.items.find(r=>r.id==="first");
  await put({...stored,decision:"Attempted overwrite",followUp:{result:"worked",note:"Kept Friday free",savedAt:Date.now()}});
  state=await get("alpha");
  assert.equal(state.decisions.v.items.find(r=>r.id==="first").decision,seed.decision);
  assert.equal(state.decisions.v.items.find(r=>r.id==="first").followUp.note,"Kept Friday free");
  await put({...second,decision:"Stale overwrite"},"alpha",0);
  state=await get("alpha");
  assert.equal(state.decisions.v.items.length,2);
  assert.equal(state.decisions.v.items.find(r=>r.id==="second").decision,seed.decision);
  assert(locks>=4);
  const general=load("decisions/context").decisionContext({map:{},values:{},rc:{},notice:null},{values:false,identity:false,purpose:false,vision:false});
  assert.equal(general.rows.filter(r=>r.id.startsWith("allIn.")).length,1);
  const f=model.findings(seed);
  assert(f.leaks.includes("act"));assert(f.unsure.includes("accountability"));
  console.log("PASS route checks: authentication, account separation, validation, concurrent first insert, stale union, server dates, immutable walkthrough, outcome-only update; general row once, explicit leak/uncertainty.");
 }finally{server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
