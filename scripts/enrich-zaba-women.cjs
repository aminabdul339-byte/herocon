// One owner-requested import. No other catalogue records are queried.
const fs=require("node:fs"),path=require("node:path"),ts=require("typescript"),crypto=require("node:crypto");
if(process.env.VERCEL_ENV!=="production"||new Date().toISOString().slice(0,10)!=="2026-11-27"){console.log("[zaba-enrichment] outside authorised import window");process.exit(0);}
const {get,list,put}=require("@vercel/blob");
const cache=new Map();
function load(file){const p=path.resolve(file);if(cache.has(p))return cache.get(p).exports;const m={exports:{}};cache.set(p,m);const js=ts.transpileModule(fs.readFileSync(p,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function("module","exports","require",js)(m,m.exports,n=>n==="server-only"?{}:n==="next/cache"?{unstable_cache:f=>f,revalidateTag:()=>{}}:n.startsWith("@/")?load(n.slice(2)+".ts"):n.startsWith(".")?load(path.resolve(path.dirname(p),n+".ts")):require(n));return m.exports;}
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
const prefix="catalogue/zaba-women-import/v1/";
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function json(p){const r=await get(p,{access:"private"});return r?.statusCode===200&&r.stream?JSON.parse(await new Response(r.stream).text()):null;}
async function main(){
 if(!process.env.BLOB_READ_WRITE_TOKEN)throw Error("storage unavailable");
 const rows=JSON.parse(fs.readFileSync("data/shop-personal-merged.json","utf8")).filter(p=>p.source==="zaba-women-20261127");
 const {getSavedMarketplaceSource,readMarketplaceSource,saveMarketplaceSource}=load("lib/marketplace-source-enrichment.ts");
 const {getSavedBuckydropProduct,getOrSaveBuckydropProduct}=load("lib/buckydrop-cache.ts");
 const report={total:rows.length,existingHioBuy:0,existingBuckyDrop:0,newHioBuy:0,newBuckyDrop:0,hiobuyAttempts:0,buckydropAttempts:0,pending:0,hiobuyIssue:null,buckydropIssue:null};
 // The existing provider retirement flag and documented channel entitlement
 // are respected. One explicit Taobao check is allowed under this import;
 // a rejection stops further requests to that provider.
 const block=await json("catalogue/buckydrop-bulk/v1/block.json").catch(()=>null);
 let bEnabled=process.env.HEROCON_LEGACY_BUCKYDROP_WRITES_ENABLED==="true"&&process.env.BUCKYDROP_ENV==="live"&&process.env.BUCKYDROP_ENABLE_PRODUCT_LOOKUP==="true"&&!!process.env.BUCKYDROP_APP_CODE&&!!process.env.BUCKYDROP_APP_SECRET&&!(block&&block.until>Date.now());
 if(!bEnabled)report.buckydropIssue=block&&block.until>Date.now()?block.code:"PROVIDER_RETIRED_OR_NOT_CONFIGURED";
 let hEnabled=!!process.env.HIOBUY_API_KEY;
 if(!hEnabled)report.hiobuyIssue="NOT_CONFIGURED";
 // Only 55 HioBuy units were displayed before this import. The bounded run
 // can attempt up to 43 unique new listings and stops on provider rejection.
 let last=0;const started=Date.now();
 for(const row of rows){
  const u=row.originalUrl;
  const [h,b]=await Promise.all([getSavedMarketplaceSource(u),getSavedBuckydropProduct(u).catch(()=>null)]);
  if(h)report.existingHioBuy++;
  if(b)report.existingBuckyDrop++;
  if(h||b)continue;
  if(Date.now()-started>250000){report.pending++;continue;}
  let saved=false;
  for(const provider of ["hiobuy","buckydrop"]){
   if((provider==="hiobuy"&&!hEnabled)||(provider==="buckydrop"&&!bEnabled))continue;
   // Persistent per-provider claim stops a rebuild from billing the same URL.
   try{await put(prefix+"attempts/"+provider+"/"+sha(u)+".json",JSON.stringify({at:new Date().toISOString()}),{access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"});}catch{continue;}
   if(last)await wait(Math.max(0,7500-(Date.now()-last)));last=Date.now();
   try{
    if(provider==="hiobuy"){report.hiobuyAttempts++;const v=await readMarketplaceSource(u);await saveMarketplaceSource(v);report.newHioBuy++;}
    else{report.buckydropAttempts++;await getOrSaveBuckydropProduct(u);report.newBuckyDrop++;}
    saved=true;break;
   }catch(e){
    const issue=typeof e?.code==="string"?e.code:"UNKNOWN_ERROR";
    if(provider==="hiobuy"){report.hiobuyIssue=issue;hEnabled=false;}
    else{report.buckydropIssue=issue;bEnabled=false;}
   }
  }
  if(!saved)report.pending++;
 }
 console.log("[zaba-enrichment] SUMMARY "+JSON.stringify(report));
}
main().catch(e=>console.log("[zaba-enrichment] stopped "+(e?.name||"error")));
