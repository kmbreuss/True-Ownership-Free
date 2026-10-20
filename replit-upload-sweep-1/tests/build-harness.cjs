// Isolated component fixtures; never mounts the authenticated app or calls its API.
// Uses the actual room code before/after, with a fixture-only auth module.
const fs = require("node:fs"), path = require("node:path");
const esbuild = require("../../artifacts/api-server/node_modules/esbuild");
const root = path.resolve(__dirname, "../..");
const live = path.join(root, "artifacts/true-ownership/src");
const stage = path.join(root, "replit-upload-sweep-1/artifacts/true-ownership/src");
const out = path.join(root, "replit-upload-sweep-1/tests/browser");
fs.mkdirSync(out, { recursive: true });
const names = ["CSS","NewA2M2Step2Body","NewA2M3Step1Body","NewA2M3Step2Body","NewA3M3Step2Body","NewA3M5FillBody","NewA1M4NameStandardsBody","NewA1M4RankBody","NewA1M3View","NewA2TwoFuturesBody","NewA1M3OwnItView"];
async function build(mode) {
  const source = mode === "before" ? live : stage;
  await esbuild.build({
    stdin: { contents: fs.readFileSync(path.join(__dirname,"fixture-entry.jsx"),"utf8"), resolveDir: live, loader: "jsx" },
    bundle: true, format: "esm", outfile: path.join(out,mode+".js"),
    nodePaths: [path.join(root,"artifacts/true-ownership/node_modules")],
    define: { "process.env.NODE_ENV": '"development"', "import.meta.env.BASE_URL": '"/"', "import.meta.env.DEV": "true" },
    plugins: [{name:"fixture-auth-and-staged",setup(b){
      b.onResolve({filter:/^__ROOMS__$/},()=>({path:"rooms",namespace:"rooms"}));
      b.onLoad({filter:/.*/,namespace:"rooms"},()=>({contents:fs.readFileSync(path.join(source,"App.tsx"),"utf8")+`\nexport {${names.join(",")}};`,resolveDir:live,loader:"tsx"}));
      b.onResolve({filter:/lib\/auth-context$/},()=>({path:"auth",namespace:"fixture"}));
      b.onLoad({filter:/.*/,namespace:"fixture"},()=>({contents:'export const useAuth=()=>({user:{firstName:"Fixture"},isAuthenticated:false,isLoading:false});',loader:"js"}));
      b.onResolve({filter:/^\.\//},args=>{
        if(mode!=="after") return;
        const candidate=path.resolve(source,args.path);
        for(const ext of [".tsx",".ts",".css"]) if(fs.existsSync(candidate+ext)) return {path:candidate+ext};
      });
    }}],
  });
}
(async()=>{await build("before");await build("after");})();
