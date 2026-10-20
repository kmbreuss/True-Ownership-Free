// PLAYWRIGHT_MODULE must point to an installed playwright package.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs=require("node:fs");
const path=require("node:path");
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined,args:["--no-sandbox"],env:{...process.env,LD_LIBRARY_PATH:process.env.BROWSER_LIBRARY_PATH||process.env.LD_LIBRARY_PATH||""}});
 const rows=[];
 for(const mode of (process.argv[2]?[process.argv[2]]:["before","after"])){
  for(const room of ["time","gap","rethink","shape","seats","standards","rank","gifts","futures","own"]){
   const context=await browser.newContext({viewport:{width:1280,height:800}});
   const page=await context.newPage();const errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   await page.goto(`http://localhost:80/@fs${path.resolve(__dirname,"browser/index.html")}?mode=${mode}&room=${room}`);
   await page.waitForTimeout(900);
   const result=await page.evaluate(()=>({
    bodyOverflow:document.documentElement.scrollHeight-innerHeight,
    cards:[...document.querySelectorAll(".na1-room-card")].map(e=>({vertical:e.scrollHeight-e.clientHeight,horizontal:e.scrollWidth-e.clientWidth})),
    text:document.body.innerText.slice(0,160),
   }));
   rows.push({mode,room,...result,errors});
   console.log(JSON.stringify(rows.at(-1)));
   await context.close();
  }
 }
 fs.writeFileSync(path.join(__dirname,`overflow-${process.argv[2]||"all"}.json`),JSON.stringify(rows,null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
