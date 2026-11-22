#!/usr/bin/env node
/**
 * Herocon free marketplace enrichment via OpenCLI 2.x.
 * Runs on the merchant's computer with their logged-in Chrome and browser bridge.
 * Does not use BuckyDrop, HIOBuy or other paid product-detail APIs.
 *
 * Usage:
 *   HEROCON_CATALOGUE_IMPORT_KEY=... node scripts/opencli-enrich.mjs \
 *     --site http://localhost:3000 --limit 20 --marketplace 1688
 */
import {spawn} from "node:child_process";
import {pathToFileURL} from "node:url";

function fail(message){throw new Error(message);}
function safeText(value,max=220){return typeof value==="string"?value.replace(/[\x00-\x1f\x7f]/g," ").replace(/\s+/g," ").trim().slice(0,max):"";}
function asNumber(value,max=1000000){
 const n=typeof value==="number"?value:typeof value==="string"&&value.trim()?Number(value.trim()):NaN;
 return Number.isFinite(n)&&n>=0&&n<=max?n:null;
}
function parseCnyPrice(text){
 if(typeof text!=="string"||!/[¥￥元]/.test(text))return null;
 const m=text.match(/[¥￥]\s*(\d+(?:\.\d{1,2})?)/)||text.match(/(\d+(?:\.\d{1,2})?)\s*元/);
 return m?asNumber(m[1]):null;
}
function safeImages(values,max=24){
 if(!Array.isArray(values))return [];
 const urls=[];
 for(const v of values){
  if(typeof v!=="string"||v.length>2048)continue;
  try{
   const u=new URL(v);
   if(u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&!urls.includes(u.href))urls.push(u.href);
  }catch{}
  if(urls.length>=max)break;
 }
 return urls;
}
export function unwrapCliJson(stdout){
 const json=JSON.parse(stdout.trim());
 if(json&&typeof json==="object"&&!Array.isArray(json)&&json.ok===false)
  fail("OpenCLI reported an error: "+safeText(json.error?.message||json.error?.code||"unknown",250));
 const data=Array.isArray(json)?json:json?.data??json?.result?.data;
 if(!Array.isArray(data))fail("OpenCLI did not return the expected JSON data array.");
 return data;
}
function validateIdentity(sourceUrl,productId){
 const url=new URL(sourceUrl);
 const id=url.hostname==="detail.1688.com"?url.pathname.match(/^\/offer\/(\d+)\.html$/)?.[1]:
  url.searchParams.get("id");
 if(!id||id!==productId)fail("OpenCLI product ID does not match the queued marketplace link.");
}
export function normalise1688(item,queue,assets){
 const id=safeText(String(item?.offer_id??""),30);
 validateIdentity(queue.url,id);
 const title=safeText(item.title,250);
 const gallery=safeImages([...(item.main_images||[]),...(assets?.main_images||[]),
  ...(assets?.sku_images||[]),queue.imageUrl].filter(Boolean),24);
 const prices=Array.isArray(item.price_tiers)?item.price_tiers.slice(0,30).map(v=>{
  const minQuantity=asNumber(v.quantity_min,100000),priceCNY=asNumber(v.price);
  return minQuantity!==null&&Number.isInteger(minQuantity)&&minQuantity>=1&&priceCNY!==null&&v.currency==="CNY"
   ?{minQuantity,priceCNY}:null;
 }).filter(Boolean):[];
 const minimum=prices.length?[...prices].sort((a,b)=>a.minQuantity-b.minQuantity)[0].priceCNY:parseCnyPrice(item.price_text);
 const sourceSpecs=Array.isArray(item.visible_attributes)?item.visible_attributes.slice(0,35).map(v=>({
  name:safeText(v.key,90),value:safeText(v.value,220)
 })).filter(v=>v.name&&v.value):[];
 const moq=asNumber(item.moq_value,100000);
 const record={
  provider:"opencli-browser",originalMarketplaceUrl:queue.url,sourceProductId:id,
  title,sellerName:safeText(item.seller_name,160)||null,
  priceCNY:minimum,moq:moq!==null&&Number.isInteger(moq)&&moq>=1?moq:null,
  priceTiers:prices,
  images:gallery,detailImages:safeImages(assets?.detail_images,24),
  sourceSpecs,collectedAt:new Date().toISOString()
 };
 if(!title||(!record.images.length&&record.priceCNY===null&&!record.sellerName))fail("1688 item did not provide enough useful data.");
 return record;
}
export function normaliseTaobao(rows,queue){
 validateIdentity(queue.url,queue.id);
 const fields=new Map(rows.filter(x=>x&&typeof x==="object")
  .map(x=>[safeText(x.field,80),safeText(x.value,260)]));
 const reported=fields.get("ID");
 if(reported&&reported!==queue.id)fail("Taobao browser output points to a different product.");
 const title=fields.get("商品名称")||"";
 const priceCNY=parseCnyPrice(fields.get("价格"));
 const record={
  provider:"opencli-browser",originalMarketplaceUrl:queue.url,sourceProductId:queue.id,
  title,sellerName:fields.get("店铺")||null,
  priceCNY,moq:null,priceTiers:[],images:safeImages([queue.imageUrl]),
  detailImages:[],sourceSpecs:[],collectedAt:new Date().toISOString()
 };
 if(!title)fail("Taobao item did not provide a product title.");
 // Taobao's current OpenCLI adapter does not return product photos.
 // Existing Herocon image is retained only as a catalogue fallback.
 if(!record.images.length&&record.priceCNY===null&&!record.sellerName)fail("No usable Taobao detail fields were found.");
 return record;
}
function cli(args,timeoutMs=90000){
 return new Promise((resolve,reject)=>{
  const child=spawn("opencli",args,{stdio:["ignore","pipe","pipe"],shell:false});
  let out="",err="";
  const timer=setTimeout(()=>child.kill("SIGTERM"),timeoutMs);
  child.stdout.setEncoding("utf8");child.stderr.setEncoding("utf8");
  child.stdout.on("data",chunk=>{out+=chunk;if(out.length>4_000_000)child.kill("SIGTERM");});
  child.stderr.on("data",chunk=>{err+=chunk;if(err.length>10000)err=err.slice(-10000);});
  child.on("error",error=>{clearTimeout(timer);reject(error);});
  child.on("close",code=>{
   clearTimeout(timer);
   if(code!==0)return reject(Error("OpenCLI failed: "+safeText(err||out,380)));
   try{resolve(unwrapCliJson(out));}catch(e){reject(e);}
  });
 });
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function options(argv){
 const v={site:"http://localhost:3000",limit:20,marketplace:"all",assets:false,dryRun:false,delayMs:4000};
 for(let i=0;i<argv.length;i++){
  const token=argv[i];
  if(token==="--assets"){v.assets=true;continue;}
  if(token==="--dry-run"){v.dryRun=true;continue;}
  if(["--site","--limit","--marketplace","--delay-ms"].includes(token)){
   if(!argv[i+1])fail("Missing value for "+token);
   const value=argv[++i];
   if(token==="--site")v.site=value;
   if(token==="--limit")v.limit=Number(value);
   if(token==="--marketplace")v.marketplace=value;
   if(token==="--delay-ms")v.delayMs=Number(value);
   continue;
  }
  fail("Unknown option "+token);
 }
 if(!Number.isInteger(v.limit)||v.limit<1||v.limit>20)fail("--limit must be 1–20.");
 if(!Number.isInteger(v.delayMs)||v.delayMs<3000||v.delayMs>60000)fail("--delay-ms must be 3000–60000.");
 if(!["all","1688","Taobao"].includes(v.marketplace))fail("--marketplace must be all, 1688, or Taobao.");
 const url=new URL(v.site);
 if(url.username||url.password||url.search||url.hash||
  !((url.protocol==="http:"&&["localhost","127.0.0.1"].includes(url.hostname))||
    (url.protocol==="https:"&&(url.hostname==="herocon.store"||
    (url.hostname.startsWith("herocon-")&&url.hostname.endsWith(".vercel.app"))))))
  fail("Site must be Herocon HTTPS, a Herocon Vercel preview, or local development.");
 v.site=url.origin;
 return v;
}
async function api(site,key,path,init={}){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),30000);
 try{
  const response=await fetch(site+path,{...init,signal:controller.signal,
   headers:{"x-herocon-catalogue-admin":key,...(init.body?{"Content-Type":"application/json"}:{})}});
  const data=await response.json();
  if(!response.ok)fail("Herocon "+response.status+": "+safeText(data.error||"request failed"));
  return data;
 }finally{clearTimeout(timer);}
}
async function run(){
 const cfg=options(process.argv.slice(2));
 const key=process.env.HEROCON_CATALOGUE_IMPORT_KEY||"";
 if(key.length<48)fail("Set your existing HEROCON_CATALOGUE_IMPORT_KEY locally (do not paste it into chat or commit it).");
 const params=new URLSearchParams({limit:String(cfg.limit),marketplace:cfg.marketplace});
 const result=await api(cfg.site,key,"/api/admin/opencli?"+params);
 const queue=Array.isArray(result.queue)?result.queue:[];
 console.log("Herocon OpenCLI collection: "+queue.length+" queued, "+result.alreadySaved+" already saved, "+result.unsupported+" unsupported.");
 if(cfg.dryRun){queue.forEach((row,i)=>console.log((i+1)+". "+row.marketplace+" "+row.url));return;}
 if(!queue.length){console.log("No new supported links to collect.");return;}
 let saved=0,existing=0,failed=0;
 for(let i=0;i<queue.length;i++){
  const row=queue[i];
  try{
   const args=row.marketplace==="1688"?["1688","item",row.url,"-f","json"]:
    ["taobao","detail",row.id,"-f","json"];
   const data=await cli(args);
   if(data.length!==1&&row.marketplace==="1688")fail("Unexpected 1688 item count.");
   let assets=null;
   if(row.marketplace==="1688"&&cfg.assets){
    const images=await cli(["1688","assets",row.url,"-f","json"]);
    assets=images[0]||null;
   }
   const record=row.marketplace==="1688"?normalise1688(data[0],row,assets):
    normaliseTaobao(data,row);
   const response=await api(cfg.site,key,"/api/admin/opencli",{
    method:"POST",body:JSON.stringify({sourceUrl:row.url,record})
   });
   if(response.result==="saved")saved++;else existing++;
   console.log("["+String(i+1)+"/"+queue.length+"] "+response.result+": "+row.marketplace+" "+row.id);
  }catch(error){
   failed++;
   const message=error instanceof Error?error.message:String(error);
   console.error("["+String(i+1)+"/"+queue.length+"] skipped "+row.marketplace+" "+row.id+": "+message.slice(0,350));
   // Stop on security challenges, login requirements, and rate limiting;
   // never attempt to evade or automate around marketplace protections.
   if(/auth|login|verification|captcha|slider|challenge|blocked|403|429|rate.limit|security/i.test(message)){
    console.error("Marketplace requires login, verification or a cooldown. Stopping this run.");
    break;
   }
  }
  if(i+1<queue.length)await pause(cfg.delayMs);
 }
 console.log("Finished: "+saved+" saved, "+existing+" existing, "+failed+" failed. No BuckyDrop product lookups were sent.");
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 run().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
}
