import {NextResponse} from "next/server";
import {classifyProduct} from "@/lib/product-taxonomy";
import {timingSafeEqual} from "node:crypto";
import {put} from "@vercel/blob";
import {getProducts} from "@/lib/catalogue-server";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {getReferenceCnyGbpRate} from "@/lib/fx-reference";
import {saveSupplierDiscovery} from "@/lib/discovered-products";
import {fromHiobuy,saveMarketplaceSource,getSavedMarketplaceSource,readMarketplaceSource,SourceEnrichmentError} from "@/lib/marketplace-source-enrichment";
import {getSavedBuckydropProduct} from "@/lib/buckydrop-cache";
import {unavailableSourceHashes} from "@/lib/catalogue-unavailable";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=420;
const SEED="908313261357";
const URL_FOR=(id:string)=>"https://detail.1688.com/offer/"+id+".html";
const ROOT="catalogue/supplier-shop-imports/supplier-908313261357-20261126/";
const rec=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
const str=(v:unknown)=>typeof v==="string"?v.trim():"";
const idOf=(v:unknown)=>typeof v==="string"?v:typeof v==="number"&&Number.isSafeInteger(v)?String(v):"";
const amount=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)&&v>=0?v:typeof v==="string"&&/^\d+(\.\d+)?$/.test(v)&&Number.isFinite(Number(v))?Number(v):undefined;
const photo=(v:unknown)=>{try{const u=new URL(str(v));return u.protocol==="https:"&&!u.username&&!u.password&&!u.port?u.href:"";}catch{return "";}};
const reply=(v:unknown,status=200)=>NextResponse.json(v,{status,headers:{"Cache-Control":"private, no-store"}});
const hard=new Set(["QUOTA_EXCEEDED","PLATFORM_QUOTA_EXCEEDED","RATE_LIMITED","RATE_LIMIT_EXCEEDED","hiobuy_rate_limited","INVALID_API_KEY","INSUFFICIENT_SCOPE","CHANNEL_NOT_AUTHORIZED","PAID_SUBSCRIPTION_REQUIRED","CHANNEL_CAPABILITY_NOT_SUPPORTED","enrichment_storage_failed","enrichment_storage_unavailable"]);
class ApiIssue extends Error{constructor(public code:string){super(code);}}
export async function GET(req:Request){
 const secret=process.env.CRON_SECRET||"",a=Buffer.from(req.headers.get("authorization")||""),b=Buffer.from("Bearer "+secret);
 if(secret.length<32||a.length!==b.length||!timingSafeEqual(a,b))return reply({error:"unauthorized"},401);
 if(process.env.VERCEL_ENV!=="production"||new Date().toISOString().slice(0,10)!=="2026-11-26")return reply({error:"not_eligible"},403);
 const token=process.env.HIOBUY_API_KEY?.trim();
 if(!token||!process.env.BLOB_READ_WRITE_TOKEN)return reply({error:"not_configured"},503);
 try{await put(ROOT+"lock.json",JSON.stringify({startedAt:new Date().toISOString()}),{access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"});}catch{return reply({status:"already_started_or_storage_unavailable"},409);}
 const started=Date.now();let units=0,last=0;
 // Reserve up to 80 trial units; the provider's actual shared quota is authoritative.
 const budget=80,expired=()=>Date.now()-started>350_000;
 async function api(path:string,payload:Record<string,unknown>,cost:number){
  if(units+cost>budget||expired())throw new ApiIssue("LOCAL_BUDGET_OR_TIME");
  const pause=1500-(Date.now()-last);if(last&&pause>0)await new Promise<void>(r=>setTimeout(r,pause));last=Date.now();units+=cost;
  const response=await fetch("https://api.hiobuy.com/v1/products/"+path,{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({channel:"1688",language:"en",...payload}),redirect:"error",cache:"no-store",signal:AbortSignal.timeout(20000)});
  const body=rec(await response.json().catch(()=>null));if(!response.ok){const code=str(rec(body.error).code||body.code);throw new ApiIssue(/^[A-Z_]{3,80}$/.test(code)?code:response.status===429?"RATE_LIMITED":"HTTP_"+response.status);}return body;
 }
 const report={status:"partial",sellerName:"",pages:0,discovered:0,added:0,existing:0,enriched:0,detailAlreadySaved:0,missingPhotos:0,notFound:0,confirmedHidden:0,issues:[] as string[],discoveryComplete:false,estimatedUnits:0};
 const links=new Set<string>();const pending:string[]=[];
 const complete=async()=>{report.estimatedUnits=units;report.status=report.discoveryComplete&&report.enriched+report.detailAlreadySaved===report.discovered&&report.missingPhotos===0&&report.issues.length===0?"complete":"partial";
  await put(ROOT+"result.json",JSON.stringify({...report,links:[...links],updatedAt:new Date().toISOString()}),{access:"private",addRandomSuffix:false,allowOverwrite:true,contentType:"application/json"});console.info("[herocon-shop-908313261357-import]",report);return reply(report);};
 try{
  report.confirmedHidden=(await unavailableSourceHashes()).size;
  const existing=new Set((await getProducts()).map(p=>normalizeMarketplaceLink(p.originalMarketplaceUrl)).filter(Boolean));
  const fx=await getReferenceCnyGbpRate().catch(()=>null);
  const seed=await api("detail",{url:URL_FOR(SEED)},1),p=rec(seed.product),seller=rec(p.seller);
  const sellerId=idOf(seller.seller_open_id)||idOf(seller.open_id)||idOf(seller.id);
  if(!sellerId||sellerId.length>200)throw new ApiIssue("SELLER_ID_MISSING");
  report.sellerName=str(seller.name).slice(0,140);
  async function add(row:Record<string,unknown>,full=false){
   const id=idOf(row.source_product_id)||idOf(row.id);if(!/^\d{5,20}$/.test(id))return;
   const returned=rec(row.seller),returnedId=idOf(returned.seller_open_id)||idOf(returned.open_id)||idOf(returned.id);
   if(returnedId&&returnedId!==sellerId){report.issues.push("SELLER_MISMATCH");return;}
   const url=URL_FOR(id);if(links.has(url))return;links.add(url);report.discovered++;
   const source=full?fromHiobuy({product:row},url):null;
   const title=str(rec(row.title).translated)||str(rec(row.title).original)||str(row.title)||source?.title||"";
   const images=[...new Set([...(source?.images||[]),photo(row.image),...(Array.isArray(row.images)?row.images.map(x=>photo(typeof x==="string"?x:rec(x).url)):[])].filter(Boolean))];
   const price=rec(row.price);const cny=source?.priceCNY??amount(price.promotion_amount)??amount(price.display_amount)??amount(price.original_amount);
   if(existing.has(url))report.existing++;
   else if(title&&images.length){
    const r=await saveSupplierDiscovery({url,title,images,priceCNY:cny,priceGBP:fx&&cny!==undefined?Math.round(cny*fx.rate*100)/100:undefined,sellerName:report.sellerName,sellerId,category:classifyProduct(title),sourceBatch:"flower-gifts-20261125"});
    if(r.status==="added"){report.added++;existing.add(url);}else if(r.status==="existing"){report.existing++;existing.add(url);}else report.missingPhotos++;
   }else report.missingPhotos++;
   if(source&&source.images.length){await saveMarketplaceSource(source);report.enriched++;}
   else pending.push(url);
  }
  if((idOf(p.source_product_id)||idOf(p.id))!==SEED)throw new ApiIssue("SEED_ID_MISMATCH");
  await add(p,true);
  // Seller-scoped search only, not general keyword matching. Follow pagination
  // and persist each verified result before continuing.
  for(let page=1;page<=30;page++){
   const data=await api("seller/search",{seller_open_id:sellerId,page,page_size:20},2);report.pages++;
   if(!Array.isArray(data.items))throw new ApiIssue("INVALID_SELLER_RESULTS");
   const before=links.size;for(const row of data.items)await add(rec(row));
   const total=amount(data.total);
   if(data.has_next===false||data.items.length===0||(total!==undefined&&page*20>=total)){report.discoveryComplete=true;break;}
   if(links.size===before){report.issues.push("REPEATED_PAGE");break;}
   if(expired()||units+2>budget){report.issues.push("LOCAL_BUDGET_OR_TIME");break;}
  }
  // Save all real links discovered, including cards without a thumbnail.
  await put(ROOT+"links.json",JSON.stringify({sellerName:report.sellerName,links:[...links],discoveryComplete:report.discoveryComplete}),{access:"private",addRandomSuffix:false,allowOverwrite:true,contentType:"application/json"});
  // Enrich the remaining cards using the existing full-detail adapter.
  // Reuse either provider's saved record. No new BuckyDrop calls on the
  // low-balance account; regular BuckyDrop enrichment can handle unsaved cards.
  for(const url of pending){
   if(expired()||units+1>budget){report.issues.push("DETAIL_BUDGET_OR_TIME");break;}
   const [hio,bucky]=await Promise.all([getSavedMarketplaceSource(url),getSavedBuckydropProduct(url).catch(()=>null)]);
   if(hio?.images.length||bucky?.images.length){report.detailAlreadySaved++;continue;}
   const delay=1500-(Date.now()-last);if(last&&delay>0)await new Promise<void>(r=>setTimeout(r,delay));last=Date.now();units++;
   try{const source=await readMarketplaceSource(url);if(!source.images.length){report.issues.push("DETAIL_WITHOUT_PHOTOS");continue;}await saveMarketplaceSource(source);report.enriched++;
    if(!existing.has(url)&&source.title){const cny=source.priceCNY;const r=await saveSupplierDiscovery({url,title:source.title,images:source.images,priceCNY:cny,priceGBP:fx&&cny!==undefined?Math.round(cny*fx.rate*100)/100:undefined,sellerName:report.sellerName,sellerId,category:classifyProduct(source.title),sourceBatch:"flower-gifts-20261125"});if(r.status==="added"){report.added++;existing.add(url);report.missingPhotos=Math.max(0,report.missingPhotos-1);}}
   }catch(e){const code=e instanceof SourceEnrichmentError?e.code:"DETAIL_FAILED";report.issues.push(code);if(code==="NOT_FOUND")report.notFound++;if(hard.has(code))break;}
  }
 }catch(e){report.issues.push(e instanceof ApiIssue?e.code:e instanceof SourceEnrichmentError?e.code:"IMPORT_FAILED");}
 return complete();
}
