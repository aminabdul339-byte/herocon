import "server-only";
import {createHash} from "node:crypto";
import {get,put} from "@vercel/blob";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import type {Product,Variant} from "@/lib/types";

const PREFIX="catalogue/source-enrichment/v1/";
const MAX_BYTES=750_000;
const ALLOWED_HOSTS=new Set([
 "detail.1688.com","item.taobao.com","detail.tmall.com","weidian.com"
]);
export type SourceEnrichment={
 version:1;sourceUrl:string;provider:"public-page"|"hiobuy";retrievedAt:string;
 title?:string;descriptionText?:string;sellerName?:string;
 images:string[];detailImages:string[];variants:Variant[];
 priceCNY?:number;variantCount?:number;sourceSpecs:{name:string;value:string}[];
};
export class SourceEnrichmentError extends Error{
 constructor(public readonly code:string,public readonly status=502){super(code);}
}
const obj=(v:unknown):Record<string,unknown>=>v!==null&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
const list=(v:unknown):unknown[]=>Array.isArray(v)?v:[];
const str=(v:unknown,max=500):string=>typeof v==="string"?v.trim().slice(0,max):"";
const number=(v:unknown):number|undefined=>{
 const x=typeof v==="number"?v:typeof v==="string"&&v.length<30?Number(v):NaN;
 return Number.isFinite(x)&&x>=0?x:undefined;
};
function img(v:unknown):string|undefined{
 const raw=str(v,2000);
 if(!raw)return;
 try{
  const url=new URL(raw.startsWith("//")?"https:"+raw:raw);
  if(url.protocol==="https:"&&!url.username&&!url.password&&!url.port&&url.href.length<=2048)
   return url.href;
 }catch{}
}
function photos(v:unknown,max=40):string[]{
 const result:string[]=[];
 for(const row of Array.isArray(v)?v:[v]){
  const val=typeof row==="string"?row:obj(row).url||obj(row).src;
  const image=img(val);
  if(image&&!result.includes(image))result.push(image);
  if(result.length>=max)break;
 }
 return result;
}
function cleanText(v:unknown,max=10000):string{
 let raw="";
 if(typeof v==="string")raw=v;
 else {
  const record=obj(v);
  if(typeof record.translated==="string")raw=record.translated;
  else if(typeof record.original==="string")raw=record.original;
  else if(typeof record.text==="string")raw=record.text;
 }
 return raw.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi," ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi," ")
  .replace(/<[^>]*>/g," ").replace(/&nbsp;/gi," ")
  .replace(/&amp;/gi,"&").replace(/&quot;/gi,'"')
  .replace(/\s+/g," ").trim().slice(0,max);
}
const pathFor=(url:string)=>PREFIX+createHash("sha256").update(url).digest("hex")+".json";
const canonical=(value:unknown)=>{
 const url=normalizeMarketplaceLink(value);
 if(!url||!ALLOWED_HOSTS.has(new URL(url).hostname))
  throw new SourceEnrichmentError("invalid_marketplace_link",400);
 return url;
};
function attribute(v:unknown):{name:string;value:string}|null{
 const data=obj(v);
 const name=str(data.name||data.key||data.propName||data.attribute_name,120);
 const value=cleanText(data.value||data.valueName||data.label,240);
 return name&&value?{name,value}:null;
}
function fromHiobuy(value:unknown,url:string):SourceEnrichment{
 const root=obj(value),p=obj(root.product);
 if(!Object.keys(p).length)throw new SourceEnrichmentError("hiobuy_product_missing",502);
 const variants:Variant[]=list(p.variants).slice(0,200).map(v=>{
  const row=obj(v);
  const id=str(row.sku_id,150);
  if(!id)return null;
  const attrs=list(row.attributes).map(attribute).filter((a):a is {name:string;value:string}=>a!==null);
  const find=(re:RegExp)=>attrs.find(a=>re.test(a.name))?.value;
  const price=obj(row.price);
  return {
   id,
   label:attrs.map(a=>a.value).join(" / ")||id,
   colour:find(/colou?r|color/i),
   size:find(/size/i),
   style:find(/style|model|specification/i),
   material:find(/material|fabric/i),
   priceCNY:number(price.promotion_amount)??number(price.display_amount),
   image:img(row.image),
   available:typeof row.stock==="number"?row.stock>0:undefined
  } as Variant;
 }).filter((v):v is Variant=>v!==null);
 const title=obj(p.title),price=obj(p.price),description=p.description;
 const sourceSpecs=list(p.attributes).slice(0,50).map(attribute).filter((a):a is {name:string;value:string}=>a!==null);
 const gallery=photos(p.images,40);
 const variantImages=photos(variants.map(v=>v.image),30);
 const all=[...new Set([...gallery,...variantImages])].slice(0,40);
 const providerRecord:SourceEnrichment={
  version:1,sourceUrl:url,provider:"hiobuy",retrievedAt:new Date().toISOString(),
  title:cleanText(title.translated||title.original,300)||undefined,
  descriptionText:cleanText(description,10000)||undefined,
  sellerName:str(obj(p.seller).name,140)||undefined,
  images:all,detailImages:[],variants,
  priceCNY:number(price.promotion_amount)??number(price.display_amount),
  variantCount:variants.length,
  sourceSpecs
 };
 if(!providerRecord.title&&!all.length&&!variants.length)throw new SourceEnrichmentError("hiobuy_product_empty",502);
 return providerRecord;
}
async function hiobuy(url:string):Promise<SourceEnrichment>{
 const token=process.env.HIOBUY_API_KEY?.trim();
 if(!token)throw new SourceEnrichmentError("hiobuy_not_configured",503);
 const host=new URL(url).hostname;
 const channel=host==="detail.1688.com"?"1688":host==="weidian.com"?"weidian":"taobao";
 let response:Response;
 try{
  response=await fetch("https://api.hiobuy.com/v1/products/detail",{
   method:"POST",headers:{
    "Authorization":"Bearer "+token,"Content-Type":"application/json","Accept":"application/json"
   },
   body:JSON.stringify({channel,url,language:"en",response_format:"standard"}),
   redirect:"error",cache:"no-store",signal:AbortSignal.timeout(12000)
  });
 }catch{throw new SourceEnrichmentError("hiobuy_unavailable",503);}
 if(!response.ok){
  // We do not forward arbitrary provider messages or account data.
  const body=await response.json().catch(()=>({})) as Record<string,unknown>;
  const code=str(obj(body.error).code||body.code,100);
  const allowed=["CHANNEL_NOT_AUTHORIZED","INVALID_API_KEY","INSUFFICIENT_SCOPE",
   "PAID_SUBSCRIPTION_REQUIRED","QUOTA_EXCEEDED","RATE_LIMITED"];
  throw new SourceEnrichmentError(
   allowed.includes(code)?code:response.status===429?"hiobuy_rate_limited":"hiobuy_failed",
   response.status===429?429:503
  );
 }
 const data=await response.json().catch(()=>null);
 return fromHiobuy(data,url);
}
const attributeFromTag=(tag:string,name:string)=>{
 const re=new RegExp("(?:^|\\s)"+name+"\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))","i");
 const match=tag.match(re);
 return match?(match[1]||match[2]||match[3]||""):"";
};
function decode(s:string){
 return s.replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;/gi,"'")
  .replace(/&lt;/gi,"<").replace(/&gt;/gi,">")
  .replace(/&#(\d{1,7});/g,(_,n)=>String.fromCodePoint(Math.min(Number(n),0x10ffff)))
  .replace(/&#x([a-f0-9]{1,6});/gi,(_,n)=>String.fromCodePoint(Math.min(parseInt(n,16),0x10ffff)));
}
function metadata(html:string,url:string):SourceEnrichment{
 const meta=new Map<string,string>();
 for(const tag of html.slice(0,Math.min(html.length,250000)).match(/<meta\b[^>]*>/gi)||[]){
  const name=(attributeFromTag(tag,"property")||attributeFromTag(tag,"name")).toLowerCase();
  const value=decode(attributeFromTag(tag,"content"));
  if(name&&value&&!meta.has(name))meta.set(name,value.slice(0,5000));
 }
 const elements:Record<string,unknown>[]=[];
 for(const block of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)){
  try{
   const parsed:unknown=JSON.parse(block[1]);
   const visit=(v:unknown,depth:number)=>{
    if(depth>3)return;
    for(const item of (Array.isArray(v)?v:[v])){
     const record=obj(item);
     if(!Object.keys(record).length)continue;
     if(/(?:^|\W)Product(?:Group)?(?:$|\W)/i.test(
       Array.isArray(record["@type"])?record["@type"].join(" "):String(record["@type"]||"")))
      elements.push(record);
     if(record["@graph"])visit(record["@graph"],depth+1);
    }
   };
   visit(parsed,0);
  }catch{}
  if(elements.length>5)break;
 }
 const product=elements[0]||{};
 const candidateImages=photos(product.image,20);
 const og=img(meta.get("og:image")||meta.get("twitter:image"));
 const images=[...new Set([...candidateImages,...(og?[og]:[])])].slice(0,30);
 const offers=obj(product.offers);
 const currency=str(offers.priceCurrency||meta.get("product:price:currency")).toUpperCase();
 const amount=number(offers.price??meta.get("product:price:amount"));
 const cleanTitle=cleanText(product.name||meta.get("og:title")||meta.get("twitter:title")||
  (html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)||[])[1],300);
 const description=cleanText(product.description||meta.get("og:description")||meta.get("description"));
 // Only preserve a monetary value when the source explicitly labelled it CNY.
 const priceCNY=currency==="CNY"?amount:undefined;
 if(!cleanTitle&&!images.length&&!description)
  throw new SourceEnrichmentError("public_metadata_unavailable",422);
 return {
  version:1,sourceUrl:url,provider:"public-page",retrievedAt:new Date().toISOString(),
  title:cleanTitle||undefined,descriptionText:description||undefined,
  sellerName:cleanText(obj(product.brand).name||obj(product.seller).name,140)||undefined,
  images,detailImages:[],variants:[],priceCNY,sourceSpecs:[]
 };
}
async function publicPage(url:string):Promise<SourceEnrichment>{
 let response:Response;
 try{
  response=await fetch(url,{
   method:"GET",headers:{"Accept":"text/html,application/xhtml+xml","User-Agent":"HeroconProductMetadata/1.0"},
   cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(9000)
  });
 }catch{throw new SourceEnrichmentError("marketplace_unreachable",503);}
 if(response.status>=300&&response.status<400)
  throw new SourceEnrichmentError("marketplace_redirected",422);
 if(response.status===401||response.status===403||response.status===429)
  throw new SourceEnrichmentError("marketplace_access_restricted",422);
 if(!response.ok)throw new SourceEnrichmentError("marketplace_unavailable",502);
 if(!String(response.headers.get("content-type")||"").toLowerCase().includes("text/html"))
  throw new SourceEnrichmentError("marketplace_non_html",422);
 const advertised=Number(response.headers.get("content-length")||0);
 if(advertised>MAX_BYTES)throw new SourceEnrichmentError("marketplace_page_too_large",422);
 const reader=response.body?.getReader();
 if(!reader)throw new SourceEnrichmentError("marketplace_empty",422);
 const chunks:Uint8Array[]=[];
 let size=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   size+=value.byteLength;
   if(size>MAX_BYTES)throw new SourceEnrichmentError("marketplace_page_too_large",422);
   chunks.push(value);
  }
 }finally{await reader.cancel().catch(()=>{});}
 const data=new Uint8Array(size);let offset=0;
 for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength;}
 return metadata(new TextDecoder("utf-8").decode(data),url);
}
export async function readMarketplaceSource(source:unknown):Promise<SourceEnrichment>{
 const url=canonical(source);
 // A licensed API gives richer SKU/stock/description fields where configured.
 // Without it, only inspect public HTML/structured metadata; do not bypass challenges.
 if(process.env.HIOBUY_API_KEY?.trim()){
  try{return await hiobuy(url);}
  catch(e){
   // No silent alternate scraping of an explicitly forbidden/auth-rejected channel.
   if(e instanceof SourceEnrichmentError&&
      ["CHANNEL_NOT_AUTHORIZED","INVALID_API_KEY","PAID_SUBSCRIPTION_REQUIRED","INSUFFICIENT_SCOPE"].includes(e.code))
    throw e;
  }
 }
 return publicPage(url);
}
export async function getSavedMarketplaceSource(source:unknown):Promise<SourceEnrichment|null>{
 let url:string;
 try{url=canonical(source);}catch{return null;}
 if(!process.env.BLOB_READ_WRITE_TOKEN)return null;
 try{
  const result=await get(pathFor(url),{access:"private"});
  if(!result||result.statusCode!==200||!result.stream)return null;
  const raw=await new Response(result.stream).text();
  if(raw.length>120000)return null;
  const item=JSON.parse(raw) as SourceEnrichment;
  if(item.version!==1||item.sourceUrl!==url||
    !Array.isArray(item.images)||!Array.isArray(item.variants)||
    !Array.isArray(item.sourceSpecs))return null;
  return item;
 }catch{return null;}
}
export async function saveMarketplaceSource(source:SourceEnrichment):Promise<void>{
 const url=canonical(source.sourceUrl);
 if(!process.env.BLOB_READ_WRITE_TOKEN)throw new SourceEnrichmentError("enrichment_storage_unavailable",503);
 const record={...source,sourceUrl:url};
 const body=JSON.stringify(record);
 if(body.length>120000)throw new SourceEnrichmentError("enrichment_record_too_large",422);
 try{
  await put(pathFor(url),body,{
   access:"private",addRandomSuffix:false,allowOverwrite:true,
   contentType:"application/json"
  });
 }catch{throw new SourceEnrichmentError("enrichment_storage_failed",503);}
}
export function withMarketplaceSource(product:Product,source:SourceEnrichment|null):Product{
 if(!source)return product;
 const existingImages=[product.imageUrl,...(product.images||[])].filter((s):s is string=>!!s);
 const images=[...new Set([...source.images,...existingImages])].slice(0,40);
 return {
  ...product,
  // Preserve existing editorial names and historical GBP reference prices.
  originalTitle:product.originalTitle||source.title||product.title,
  imageUrl:images[0]||product.imageUrl,
  images,
  descriptionText:source.descriptionText||product.descriptionText,
  sellerName:source.sellerName||product.sellerName,
  detailImages:[...new Set([...(source.detailImages||[]),...(product.detailImages||[])])].slice(0,30),
  sourceSpecs:source.sourceSpecs.length?source.sourceSpecs:product.sourceSpecs,
  variants:source.variants.length?source.variants:product.variants,
  variantCount:source.variants.length?source.variants.length:product.variantCount,
  priceCNY:source.priceCNY??product.priceCNY,
  hasPartnerDetails:source.variants.length>0||source.images.length>1||Boolean(product.hasPartnerDetails)
 };
}