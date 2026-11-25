import "server-only";
import {createHash} from "node:crypto";
import {get,put,list as listBlobs} from "@vercel/blob";
import {unstable_cache} from "next/cache";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import type {Product,Variant} from "@/lib/types";
import type {BuckydropProduct} from "@/lib/buckydrop";
import {cleanSellerDescription} from "@/lib/supplier-description";

export const ENRICHMENT_PREFIX_V1="catalogue/source-enrichment/v1/";
export const ENRICHMENT_PREFIX_V2="catalogue/source-enrichment/v2/";
const MAX_SNAPSHOT_BYTES=16*1024*1024;
const MAX_BYTES=750_000;
const ALLOWED_HOSTS=new Set([
 "detail.1688.com","item.taobao.com","detail.tmall.com","weidian.com"
]);
export type SourceEnrichment={
 version:1|2;sourceUrl:string;provider:"public-page"|"hiobuy";retrievedAt:string;
 variantCompleteness?:"complete"|"missing_ids"|"unavailable";minOrderQuantity?:number;
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
  else if(typeof record.html==="string")raw=record.html;
  else if(typeof record.translated_html==="string")raw=record.translated_html;
 }
 return raw.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi," ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi," ")
  .replace(/<[^>]*>/g," ").replace(/&nbsp;/gi," ")
  .replace(/&amp;/gi,"&").replace(/&quot;/gi,'"')
  .replace(/\s+/g," ").trim().slice(0,max);
}
const pathFor=(url:string,version:1|2=2)=>(version===2?ENRICHMENT_PREFIX_V2:ENRICHMENT_PREFIX_V1)+createHash("sha256").update(url).digest("hex")+".json";
const canonical=(value:unknown)=>{
 const url=normalizeMarketplaceLink(value);
 if(!url||!ALLOWED_HOSTS.has(new URL(url).hostname))
  throw new SourceEnrichmentError("invalid_marketplace_link",400);
 return url;
};
function attribute(v:unknown):{name:string;value:string}|null{
 const data=obj(v);
 const name=str(data.translated_name||data.name||data.original_name||data.key||data.propName||data.attribute_name,120);
 const value=cleanText(data.translated_value||data.value||data.original_value||data.valueName||data.label,240);
 return name&&value?{name,value}:null;
}
export function fromHiobuy(value:unknown,url:string):SourceEnrichment{
 const root=obj(value),p=obj(root.product);
 if(!Object.keys(p).length)throw new SourceEnrichmentError("hiobuy_product_missing",502);
 // HioBuy detail returns its SKU matrix in one response; no documented SKU paging.
 const supplierVariants=Array.isArray(p.variants)?p.variants:null;
 const variants:Variant[]=(supplierVariants||[]).map(v=>{
  const row=obj(v),id=str(row.sku_id,200);
  if(!id)return null;
  const attrs=list(row.attributes).map(attribute).filter((a):a is {name:string;value:string}=>a!==null);
  const find=(re:RegExp)=>attrs.find(a=>re.test(a.name))?.value;
  const price=obj(row.price),shipping=obj(row.shipping);
  const savedShipping:Record<string,string|number|null>={};
  for(const [key,val] of Object.entries(shipping)){
   if((typeof val==="string"&&val.length<=200)||(typeof val==="number"&&Number.isFinite(val))||val===null)
    savedShipping[key]=val as string|number|null;
  }
  const stock=number(row.stock);
  return {
   id,upstreamSkuId:str(row.upstream_sku_id,150)||undefined,
   label:attrs.map(a=>a.value).join(" / ")||id,attributes:attrs,
   colour:find(/colou?r|color|颜色|顏色|色号|色號/i),
   size:find(/size|尺码|尺寸|规格|規格/i),
   style:find(/style|model|pattern|款式|型号/i),
   material:find(/material|fabric|材质|材質/i),
   priceCNY:number(price.promotion_amount)??number(price.display_amount),
   image:img(row.image),stock:stock??null,
   available:stock===undefined?undefined:stock>0,
   ...(Object.keys(savedShipping).length?{shipping:savedShipping}:{})
  } as Variant;
 }).filter((v):v is Variant=>v!==null);
 const totalVariants=supplierVariants?.length??0;
 const completeness=supplierVariants===null?"unavailable":
  variants.length===totalVariants?"complete":"missing_ids";
 const title=obj(p.title),price=obj(p.price),description=p.description,desc=obj(description);
 const preferredDescription=(typeof desc.translated==="string"&&desc.translated.trim())?desc.translated:
  (typeof desc.original==="string"&&desc.original.trim())?desc.original:description;
 const descriptionText=cleanSellerDescription(cleanText(preferredDescription,45000),30000);
 const sourceSpecs=list(p.attributes).map(attribute).filter((a):a is {name:string;value:string}=>a!==null);
 const gallery=[...new Set([...photos(p.images,Number.MAX_SAFE_INTEGER),...photos(p.image)])];
 const variantImages=photos(variants.map(v=>v.image),Number.MAX_SAFE_INTEGER);
 const all=[...new Set([...gallery,...variantImages])];
 const htmlDesc=typeof description==="string"?description:
  typeof desc.html==="string"?desc.html:
  typeof desc.original==="string"?desc.original:"";
 const detailImages:string[]=[];
 for(const tag of htmlDesc.match(/<img\b[^>]*>/gi)||[]){
  const found=tag.match(/\b(?:data-original|data-lazy-src|data-src|src)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i);
  const image=img(found&&(found[1]||found[2]||found[3]));
  if(image&&!detailImages.includes(image))detailImages.push(image);
 }
 const result:SourceEnrichment={
  version:2,sourceUrl:url,provider:"hiobuy",retrievedAt:new Date().toISOString(),
  title:cleanText(title.translated||title.original,300)||undefined,
  descriptionText:descriptionText||undefined,
  sellerName:str(obj(p.seller).name,140)||undefined,
  images:all,detailImages,variants,
  priceCNY:number(price.promotion_amount)??number(price.display_amount),
  variantCount:totalVariants,variantCompleteness:completeness,
  minOrderQuantity:number(p.min_order_quantity),sourceSpecs
 };
 if(!result.title&&!all.length&&!variants.length)throw new SourceEnrichmentError("hiobuy_product_empty",502);
 return result;
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
   redirect:"error",cache:"no-store",signal:AbortSignal.timeout(20000)
  });
 }catch{throw new SourceEnrichmentError("hiobuy_unavailable",503);}
 if(!response.ok){
  // We do not forward arbitrary provider messages or account data.
  const body=await response.json().catch(()=>({})) as Record<string,unknown>;
  const code=str(obj(body.error).code||body.code,100);
  const allowed=["CHANNEL_NOT_AUTHORIZED","INVALID_API_KEY","INSUFFICIENT_SCOPE",
   "PAID_SUBSCRIPTION_REQUIRED","QUOTA_EXCEEDED","RATE_LIMITED",
   "RATE_LIMIT_EXCEEDED","PLATFORM_QUOTA_EXCEEDED","CHANNEL_CAPABILITY_NOT_SUPPORTED",
   "CHANNEL_UPSTREAM_ERROR","VALIDATION_ERROR","NOT_FOUND"];
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
 const obviousBlock=/just a moment|access denied|captcha|robot check|security check|verify you are human|403 forbidden|安全验证|访问受限|请登录/i;
 if(obviousBlock.test(cleanTitle)||obviousBlock.test(meta.get("description")||""))
  throw new SourceEnrichmentError("marketplace_access_restricted",422);
 const hasProductStructure=elements.length>0||
  /^(?:product|og:product)$/i.test(meta.get("og:type")||"");
 // Reject generic search/home/login pages, even when they have an OG title.
 if(!hasProductStructure&&!(images.length>0&&cleanTitle.length>=12&&description.length>=20))
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
 // Both production catalogues confirmed that raw HTML did not expose product data
 // in ordinary server requests. Avoid silently falling back to a useless response
 // on failed API calls or retrying blocked marketplace URLs in a batch.
 if(!process.env.HIOBUY_API_KEY?.trim())
  throw new SourceEnrichmentError("product_api_not_connected",503);
 return hiobuy(url);
}
export async function getSavedMarketplaceSource(source:unknown):Promise<SourceEnrichment|null>{
 let url:string;
 try{url=canonical(source);}catch{return null;}
 if(!process.env.BLOB_READ_WRITE_TOKEN)return null;
 // Prefer complete v2 records, preserving older snapshots until replacement.
 for(const version of [2,1] as const){
  try{
   const result=await get(pathFor(url,version),{access:"private"});
   if(!result||result.statusCode!==200||!result.stream)continue;
   const raw=await new Response(result.stream).text();
   if(Buffer.byteLength(raw,"utf8")>MAX_SNAPSHOT_BYTES)continue;
   const item=JSON.parse(raw) as SourceEnrichment;
   if(item.version!==version||item.sourceUrl!==url||
    !Array.isArray(item.images)||!Array.isArray(item.variants)||
    !Array.isArray(item.sourceSpecs))continue;
   return item;
  }catch{}
 }
 return null;
}
export async function saveMarketplaceSource(source:SourceEnrichment):Promise<void>{
 const url=canonical(source.sourceUrl);
 if(!process.env.BLOB_READ_WRITE_TOKEN)throw new SourceEnrichmentError("enrichment_storage_unavailable",503);
 if(source.version!==2)throw new SourceEnrichmentError("outdated_enrichment_schema",422);
 const record={...source,sourceUrl:url};
 const body=JSON.stringify(record);
 if(Buffer.byteLength(body,"utf8")>MAX_SNAPSHOT_BYTES)
  throw new SourceEnrichmentError("enrichment_record_too_large",422);
 try{
  await put(pathFor(url,2),body,{
   access:"private",addRandomSuffix:false,allowOverwrite:true,
   contentType:"application/json"
  });
 }catch{throw new SourceEnrichmentError("enrichment_storage_failed",503);}
}
export function withMarketplaceSource(product:Product,source:SourceEnrichment|null):Product{
 if(!source)return product;
 const existingImages=[product.imageUrl,...(product.images||[])].filter((s):s is string=>!!s);
 const images=[...new Set([...source.images,...existingImages])];
 return {
  ...product,
  // Preserve existing editorial names and historical GBP reference prices.
  originalTitle:product.originalTitle||source.title||product.title,
  imageUrl:images[0]||product.imageUrl,
  images,
  descriptionText:source.descriptionText||product.descriptionText,
  sellerName:source.sellerName||product.sellerName,
  detailImages:[...new Set([...(source.detailImages||[]),...(product.detailImages||[])])],
  sourceSpecs:source.sourceSpecs.length?source.sourceSpecs:product.sourceSpecs,
  variants:source.variants.length?source.variants:product.variants,
  variantCount:source.variantCount??(source.variants.length?source.variants.length:product.variantCount),
  priceCNY:source.priceCNY??product.priceCNY,
  hasPartnerDetails:source.variants.length>0||source.images.length>1||Boolean(product.hasPartnerDetails)
 };
}
/**
 * Adapter for the existing, supplier-agnostic product gallery/options UI.
 * Preserves the HioBuy provider identity: never impersonate a BuckyDrop result.
 * Display prices and stock are dated snapshots, never checkout authority.
 */
export type DisplaySupplierDetails=Omit<BuckydropProduct,"source">&{
 source:"buckydrop"|"hiobuy";variantCompleteness?:SourceEnrichment["variantCompleteness"];
 sourceVariantCount?:number
};
export function toDisplaySupplierDetails(data:SourceEnrichment):DisplaySupplierDetails{
 const variants=data.variants.map(v=>{
  const options=v.attributes?.length?v.attributes:[
   v.colour?{name:"Colour",value:v.colour}:null,
   v.size?{name:"Size",value:v.size}:null,
   v.style?{name:"Style",value:v.style}:null,
   v.material?{name:"Material",value:v.material}:null
  ].filter((o):o is {name:string;value:string}=>o!==null);
  if(!options.length&&v.label)options.push({name:"Seller option",value:v.label});
  return {
   skuCode:v.id,
   title:v.label||options.map(o=>o.value).join(" / ")||v.id,
   options,
   price:v.priceCNY??null,
   // An explicit out-of-stock flag is conclusive; an "available" boolean
   // alone is not a numeric inventory count.
   stock:typeof v.stock==="number"?v.stock:v.available===false?0:null,
   image:v.image||null
  };
 });
 const host=new URL(data.sourceUrl).hostname;
 return {
  source:"hiobuy",
  variantCompleteness:data.version===1?"unavailable":data.variantCompleteness,
  sourceVariantCount:data.variantCount,
  environment:"live",
  spuCode:null,
  title:data.title||"Marketplace product",
  originalUrl:data.sourceUrl,
  marketplace:host.includes("1688")?"1688":host.includes("weidian")?"Weidian":"Taobao",
  currency:"CNY",
  snapshotSavedAt:data.retrievedAt,
  productProps:data.sourceSpecs,
  listPrice:data.priceCNY??null,
  offerPrice:data.priceCNY??null,
  chinaDomesticFreight:null,
  moq:data.minOrderQuantity??null,
  available:null,
  images:data.images,
  descriptionText:data.descriptionText||"",
  detailImages:data.detailImages,
  sellerName:data.sellerName||null,
  variants
 };
}

/** Avoid one Blob GET for every catalogue card. Only hydrate visible links
 * whose canonical URL hashes actually have an independent HioBuy snapshot. */
const savedIndex=unstable_cache(async():Promise<string[]>=>{
 if(!process.env.BLOB_READ_WRITE_TOKEN)return [];
 const hashes=new Set<string>();
 for(const prefix of [ENRICHMENT_PREFIX_V2,ENRICHMENT_PREFIX_V1]){
  let cursor:string|undefined;
  do{
   const page=await listBlobs({prefix,limit:1000,cursor});
   for(const entry of page.blobs){
    const key=entry.pathname.slice(prefix.length).replace(/\.json$/,"");
    if(/^[a-f0-9]{64}$/.test(key))hashes.add(key);
   }
   if(!page.hasMore)break;
   cursor=page.cursor;
  }while(cursor);
 }
 return [...hashes];
},["herocon-marketplace-source-index-v2"],{revalidate:60});
export async function savedMarketplaceSourceHashes():Promise<ReadonlySet<string>>{
 try{return new Set(await savedIndex());}catch{return new Set();}
}
export async function enrichVisibleProductCards(products:Product[]):Promise<Product[]>{
 if(!products.length)return products;
 const saved=await savedMarketplaceSourceHashes();
 if(!saved.size)return products;
 return Promise.all(products.map(async product=>{
  const url=normalizeMarketplaceLink(product.originalMarketplaceUrl);
  if(!url||!saved.has(createHash("sha256").update(url).digest("hex")))return product;
  const enrichment=await getSavedMarketplaceSource(url);
  if(!enrichment)return product;
  // Grid cards only need a thumbnail and option count. Do not serialize the
  // entire 1000+ SKU matrix on every 24-card catalogue page.
  return {...product,
   imageUrl:enrichment.images[0]||product.imageUrl,
   images:[...new Set([...enrichment.images.slice(0,12),...(product.images||[])])].slice(0,12),
   sellerName:enrichment.sellerName||product.sellerName,
   variantCount:enrichment.variantCount??enrichment.variants.length,
   hasPartnerDetails:true
  };
 }));
}
