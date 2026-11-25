import "server-only";
import {get,put,list,del} from "@vercel/blob";
import {createHash} from "node:crypto";
import {getProducts} from "@/lib/catalogue-server";
import {personalShopProducts} from "@/lib/personal-shop";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {unavailableSourceHashes} from "@/lib/catalogue-unavailable";
import {getSavedMarketplaceSource,readMarketplaceSource,saveMarketplaceSource,SourceEnrichmentError} from "@/lib/marketplace-source-enrichment";
import {getSavedBuckydropProduct} from "@/lib/buckydrop-cache";
import {validFreight} from "@/lib/cart-pricing";
const ROOT="catalogue/domestic-freight/v1/";
const key=(url:string)=>createHash("sha256").update(url).digest("hex");
export type FreightRecord={url:string;amountCny:number|null;source:"hiobuy"|"historical"|"unknown";checkedAt:string;providerAttemptAt?:string;issue?:string};
export async function readFreightRecord(url:string):Promise<FreightRecord|null>{try{const r=await get(ROOT+"records/"+key(url)+".json",{access:"private",useCache:false});if(!r||r.statusCode!==200||!r.stream)return null;const d=JSON.parse(await new Response(r.stream).text());return d.url===url&&(d.amountCny===null||validFreight(d.amountCny))?d:null;}catch{return null;}}
async function save(r:FreightRecord){const hash=key(r.url);await put(ROOT+"records/"+hash+".json",JSON.stringify(r),{access:"private",addRandomSuffix:false,allowOverwrite:true,contentType:"application/json"});const marker=ROOT+"missing/"+hash+".json";if(r.amountCny===null){const retryAfter=r.providerAttemptAt?Date.parse(r.providerAttemptAt)+7*86400000:0;await put(marker,JSON.stringify({retryAfter}),{access:"private",addRandomSuffix:false,allowOverwrite:true,contentType:"application/json"});}else{try{await del(marker);}catch{}}}
export async function auditSavedFreight(url:string,hio:unknown,historical:unknown){
 const prior=await readFreightRecord(url);
 // Fresh, actual provider value wins. Never replace a known value with null.
 const amountCny=validFreight(hio)?hio:prior?.source==="hiobuy"&&validFreight(prior.amountCny)?prior.amountCny:validFreight(historical)?historical:prior?.amountCny??null;
 const source=validFreight(hio)||prior?.source==="hiobuy"&&validFreight(prior.amountCny)?"hiobuy":validFreight(historical)?"historical":prior?.source??"unknown";
 const r:FreightRecord={...prior,url,amountCny,source,checkedAt:new Date().toISOString()};
 await save(r);return r;
}
export async function freightCatalogue(){
 const [products,hidden]=await Promise.all([getProducts(),unavailableSourceHashes()]);
 const urls=[...new Set([...personalShopProducts.map(x=>x.originalUrl),...products.map(x=>x.originalMarketplaceUrl)].map(normalizeMarketplaceLink).filter((x):x is string=>!!x))].filter(x=>!hidden.has(key(x)));
 return urls;
}
export async function auditFreightBatch(offset:number){
 const urls=(await freightCatalogue()).sort();const batch=urls.slice(offset,offset+60);let known=0,unknown=0,free=0;
 for(let i=0;i<batch.length;i+=8)await Promise.all(batch.slice(i,i+8).map(async url=>{
  const [h,b]=await Promise.all([getSavedMarketplaceSource(url),getSavedBuckydropProduct(url).catch(()=>null)]);
  const r=await auditSavedFreight(url,h?.chinaDomesticFreight,b?.chinaDomesticFreight);
  if(validFreight(r.amountCny)){known++;if(r.amountCny===0)free++;}else unknown++;
 }));
 return {total:urls.length,checked:batch.length,known,unknown,free,nextOffset:offset+batch.length,complete:offset+batch.length>=urls.length};
}
export async function missingFreightHashes(){const hashes=new Set<string>();let cursor:string|undefined;do{const page=await list({prefix:ROOT+"missing/",limit:1000,cursor});for(const b of page.blobs){const h=b.pathname.slice((ROOT+"missing/").length,-5);if(/^[a-f0-9]{64}$/.test(h))hashes.add(h);}cursor=page.hasMore?page.cursor:undefined;}while(cursor);return hashes;}
export async function freightNeedsRefresh(url:string){const r=await readFreightRecord(url);return !!r&&r.amountCny===null&&(!r.providerAttemptAt||Date.now()-Date.parse(r.providerAttemptAt)>7*86400000);}
export async function recordFreightRefresh(url:string,amount:unknown,issue?:string){
 const previous=await readFreightRecord(url),now=new Date().toISOString();
 const r:FreightRecord={url,amountCny:validFreight(amount)?amount:previous?.amountCny??null,source:validFreight(amount)?"hiobuy":previous?.source??"unknown",checkedAt:now,providerAttemptAt:now,issue};await save(r);return r;
}
