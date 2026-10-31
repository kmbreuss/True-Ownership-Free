const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),ts=require("typescript");
function modules() {
  const data=new Map(),session=new Map(),cache={};
  const storage=m=>({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)});
  const localStorage=storage(data),sessionStorage=storage(session),location={search:"",href:"https://example.invalid/"};
  const ctx=vm.createContext({console,URL,URLSearchParams,Date,structuredClone,setTimeout,clearTimeout,localStorage,sessionStorage,location,
    window:{localStorage,sessionStorage,location,addEventListener(){},removeEventListener(){}}});
  function load(name) {
    const file=path.isAbsolute(name)?name:path.resolve(__dirname,"../src",name+".ts");
    if(cache[file])return cache[file].exports;
    const mod={exports:{}};cache[file]=mod;
    const js=ts.transpileModule(fs.readFileSync(file,"utf8").replaceAll("import.meta.env.DEV","true"),
      {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    vm.runInContext(`(function(require,module,exports){${js}\n})`,ctx)(dep=>{
      if(dep==="react")return {useSyncExternalStore(){}};
      return load(path.resolve(path.dirname(file),dep+".ts"));
    },mod,mod.exports);
    return mod.exports;
  }
  return {load,data};
}
const plain=v=>JSON.parse(JSON.stringify(v));
function fixtures() {
  const {load}=modules();
  const rc={...plain(load("rcConstants").EMPTY_RC),complete:true,step:13,maxReached:13,choice:"B",focus:"time",
    completedAt:"2026-10-31T12:00:00Z",startedAt:"2026-10-30T12:00:00Z"};
  rc.futureB5.tuesday="I choose a calm Tuesday with time for what matters.";
  rc.futureB1.oneThing="Protect one evening for myself.";
  const vision=plain(load("mirror2Constants").EMPTY_VISION);
  const identity=plain(load("mirror3Constants").EMPTY_MIRROR3);
  const values=plain(load("mirror4Constants").EMPTY_MIRROR4);
  return {rc,vision,identity,values};
}
module.exports={modules,plain,fixtures};
