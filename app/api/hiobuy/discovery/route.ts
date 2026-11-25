import {domesticFromProduct} from "@/lib/cart-pricing";
import {NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {get,put,list} from "@vercel/blob";
import {currentCustomer,accountOriginValid} from "@/lib/customer-auth";
import {membershipEntitlement} from "@/lib/membership-access";
import {discoveryAllowed} from "@/lib/discovery-access-model";
import {reserveDiscovery} from "@/lib/discovery-quota";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {getReferenceCnyGbpRate} from "@/lib/fx-reference";
import {saveSupplierDiscovery,type DiscoverySaveResult} from "@/lib/discovered-products";
import {getBaseProducts} from "@/lib/catalogue-server";
import {productId} from "@/lib/catalogue";
import {classifyProduct} from "@/lib/product-taxonomy";
import {fromHiobuy,getSavedMarketplaceSource,saveMarketplaceSource,type SourceEnrichment} from "@/lib/marketplace-source-enrichment";
import {excludedCatalogueListing} from "@/lib/catalogue-editorial-exclusions";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=45;
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
const fail=(error:string,status=400)=>reply({error},status);
const asRecord=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
const string=(v:unknown,max=500)=>typeof v==="string"?v.slice(0,max):"";
const numeric=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)&&v>=0?v:typeof v==="string"&&/^\d+(\.\d+)?$/.test(v)&&Number.isFinite(Number(v))?Number(v):null;
const array=(v:unknown)=>Array.isArray(v)?v:[];
function label(v:unknown){const x=asRecord(v);return string(x.translated)||string(x.original)||string(v);}
function httpsImage(v:unknown){try{const u=new URL(string(v,2000));return u.protocol==="https:"&&!u.username&&!u.password?u.href:"";}catch{return "";}}
function price(v:unknown){const p=asRecord(v);return numeric(p.promotion_amount)??numeric(p.display_amount)??numeric(p.original_amount);}
function sourceUrl(channel:string,id:string){if(!/^\d{5,20}$/.test(id))return "";return channel==="1688"?"https://detail.1688.com/offer/"+id+".html":channel==="weidian"?"https://weidian.com/item.html?itemID="+id:"";}
function normalize(raw:unknown,channel:string){
 const p=asRecord(raw),seller=asRecord(p.seller);
 const id=string(p.id,500)||string(p.source_product_id,500)||String(numeric(p.id)??"");
 const market=string(p.channel)||channel;
 const images=Array.from(new Set([httpsImage(p.image),...array(p.images).map(x=>httpsImage(asRecord(x).url))].filter(Boolean))).slice(0,40);
 return {id,channel:market,title:label(p.title)||"Untitled product",url:normalizeMarketplaceLink(p.source_url)||sourceUrl(market,id),images,price:price(p.price),domesticFreightCny:domesticFromProduct(p),seller:string(seller.name),minimum:numeric(p.min_order_quantity),
 variants:array(p.variants).slice(0,300).map(v=>{const x=asRecord(v);return {id:string(x.sku_id,500)||String(numeric(x.sku_id)??""),name:array(x.attributes).map(a=>{const r=asRecord(a);return [string(r.translated_name)||string(r.original_name)||label(r.name),string(r.translated_value)||string(r.original_value)||label(r.value)].filter(Boolean).join(": ");}).filter(Boolean).join(" / ")||"Variant",price:price(x.price),stock:numeric(x.stock),image:httpsImage(x.image)};}),
 attributes:array(p.attributes).slice(0,60).map(a=>{const x=asRecord(a);return {name:string(x.translated_name)||string(x.original_name)||label(x.name),value:string(x.translated_value)||string(x.original_value)||label(x.value)};}).filter(a=>a.name&&a.value)};
}
// Per-instance burst protection in addition to durable public daily limits.
let windowStart=0,used=0;
function allow(){const now=Date.now();if(now-windowStart>=60_000){windowStart=now;used=0;}return ++used<=10;}
// Private reference snapshots, never a checkout price/stock authority.
const PREFIX="hiobuy/discovery/v1/";
const PUBLIC_PREFIX="hiobuy/customer-discovery/v1/";
const TTL=24*60*60*1000;
type Saved={version:1;savedAt:string;label:string;action:string;result:Record<string,unknown>};
const hash=(s:string)=>createHash("sha256").update(s).digest("hex");
async function readSaved(id:string,prefix=PREFIX):Promise<Saved|null>{
 if(!/^[a-f0-9]{64}$/.test(id))return null;
 try{const b=await get(prefix+id+".json",{access:"private"});if(!b||b.statusCode!==200||!b.stream)return null;const raw=await new Response(b.stream).text();if(raw.length>8_000_000)return null;const x=JSON.parse(raw) as Saved;return x.version===1&&x.result&&Number.isFinite(Date.parse(x.savedAt))?x:null;}catch{return null;}
}
async function store(id:string,action:string,label:string,result:Record<string,unknown>,prefix=PREFIX){
 const savedAt=new Date().toISOString();try{await put(prefix+id+".json",JSON.stringify({version:1,savedAt,label,action,result} satisfies Saved),{access:"private",addRandomSuffix:false,allowOverwrite:true,contentType:"application/json"});return {cacheStatus:"stored",savedAt};}catch{return {cacheStatus:"unavailable",savedAt:null};}
}
async function history(){
 const page=await list({prefix:PREFIX,limit:1000});
 const rows=page.blobs.sort((a,b)=>new Date(b.uploadedAt).getTime()-new Date(a.uploadedAt).getTime()).slice(0,60);
 const entries=await Promise.all(rows.map(async b=>{const id=b.pathname.slice(PREFIX.length,-5),s=await readSaved(id);return s&&s.action!=="detail"?{id,label:s.label,savedAt:s.savedAt,action:s.action}:null;}));
 return entries.filter(Boolean).slice(0,20);
}
// Only a successful full product view (parse/detail), never a search-result
// list, may publish a business catalogue entry. Use provider data, not the
// customer's search text, uploaded image, or client-supplied product fields.
async function persistCatalogue(productValue:unknown,fxValue:unknown,raw?:unknown):Promise<DiscoverySaveResult>{
 const unavailable:DiscoverySaveResult={status:"unavailable",productId:null};
 try{
  const p=asRecord(productValue),link=normalizeMarketplaceLink(p.url);
  const title=string(p.title,320).trim(),channel=string(p.channel);
  if(!link||!title||title==="Untitled product"||excludedCatalogueListing(link,title))return unavailable;
  const host=new URL(link).hostname;
  if(!((channel==="1688"&&host==="detail.1688.com")||(channel==="weidian"&&host==="weidian.com")))return unavailable;
  const gallery=array(p.images).map(httpsImage).filter(Boolean);
  const previous=await getSavedMarketplaceSource(link);
  let source:SourceEnrichment;
  if(raw){
   const full=fromHiobuy(raw,link);
   source={...full,title:full.title||title,images:[...new Set([...full.images,...gallery])],
    priceCNY:full.priceCNY??numeric(p.price)??undefined,sellerName:full.sellerName||string(p.seller)||undefined};
  }else{
   // Legacy cached details lack the raw SKU matrix and descriptions. Preserve
   // known fields without falsely claiming complete SKU coverage.
   source={version:2,provider:"hiobuy",sourceUrl:link,retrievedAt:new Date().toISOString(),
    title,images:gallery,detailImages:[],sellerName:string(p.seller)||undefined,
    priceCNY:numeric(p.price)??undefined,minOrderQuantity:numeric(p.minimum)??undefined,
    variantCompleteness:"unavailable",
    variants:array(p.variants).map(v=>{const x=asRecord(v);return {
     id:string(x.id,200),label:string(x.name,300),priceCNY:numeric(x.price)??undefined,
     stock:numeric(x.stock),image:httpsImage(x.image)||undefined
    };}).filter(v=>v.id),
    sourceSpecs:array(p.attributes).map(v=>{const x=asRecord(v);return {name:string(x.name,120),value:string(x.value,240)};}).filter(v=>v.name&&v.value)};
  }
  // Never let a partial or cached response overwrite a richer saved snapshot.
  const upgrade=!!raw&&source.variantCompleteness==="complete"&&previous?.variantCompleteness!=="complete"&&source.variants.length>=(previous?.variants.length??0);
  const selected=previous&&!upgrade?previous:source;
  const images=[...new Set([...selected.images,...gallery])];
  if(!images.length||excludedCatalogueListing(link,title,selected.title))return unavailable;
  if(!previous||upgrade)await saveMarketplaceSource(selected);
  const existing=(await getBaseProducts()).find(item=>normalizeMarketplaceLink(item.originalMarketplaceUrl)===link);
  if(existing)return {status:"existing",productId:productId(existing)};
  const variantPrices=selected.variants.map(v=>v.priceCNY).filter((v):v is number=>typeof v==="number"&&Number.isFinite(v)&&v>=0);
  const priceCNY=variantPrices.length?Math.min(...variantPrices):selected.priceCNY??numeric(p.price)??undefined;
  const rate=numeric(asRecord(fxValue).rate);
  const priceGBP=priceCNY!==undefined&&rate!==null&&rate>0?Math.round(priceCNY*rate*100)/100:undefined;
  return await saveSupplierDiscovery({url:link,title:selected.title||title,images,priceCNY,priceGBP,
   sellerName:selected.sellerName||string(p.seller)||undefined,
   category:classifyProduct(selected.title||title),sourceBatch:"hiobuy-customer-discovery"});
 }catch(e){
  console.error("[hiobuy] Catalogue persistence failed:",e instanceof Error?e.message:"unknown");
  return unavailable;
 }
}
async function cachedResult(saved:Saved){
 const result=saved.result;
 const catalogueSave=(saved.action==="parse"||saved.action==="detail")&&result.product
  ?await persistCatalogue(result.product,result.fx):undefined;
 return {...result,cacheStatus:"hit",savedAt:saved.savedAt,...(catalogueSave?{catalogueSave}:{})};
}

export async function POST(request:Request){
 if(!accountOriginValid(request))return fail("Please use the Herocon website.",403);
 const customer=await currentCustomer();if(!customer)return fail("Sign in to use marketplace discovery.",401);
 const owner=isOwnerPremiumCustomer(customer);
 const premium=owner||(await membershipEntitlement(customer)).premium;
 if(!premium)return fail("Marketplace keyword and image search require Premium or an active free trial.",403);
 const key=process.env.HIOBUY_API_KEY?.trim();
 if(!key)return fail("HIOBuy is not configured on this deployment.",503);
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))return fail("Invalid request format.",415);
 if(Number(request.headers.get("content-length")||0)>3_000_000)return fail("Image is too large. Choose an image under 2 MB.",413);
 let body:Record<string,unknown>;
 try{const raw=await request.text();if(raw.length>3_000_000)return fail("Image is too large.",413);body=asRecord(JSON.parse(raw));}catch{return fail("Invalid request.");}
 const action=body.action,channel=string(body.channel);
 if(!discoveryAllowed(owner,premium,action))return fail("This discovery action is not available.",403);
 if(action==="history"){try{return reply({history:await history()});}catch{return fail("Saved searches are temporarily unavailable.",503);}}
 if(action==="saved"){const saved=await readSaved(string(body.id,65));if(!saved)return fail("Saved search not found.",404);return reply(await cachedResult(saved));}
 const common={language:"en"};
 const searchChannel=channel==="1688";
 const page=typeof body.page==="number"&&Number.isInteger(body.page)&&body.page>=1&&body.page<=50?body.page:1;
 let endpoint:string,payload:Record<string,unknown>;
 if(action==="parse"){
  const raw=string(body.url,1001),url=normalizeMarketplaceLink(raw);
  // HIOBuy supports selected shortened sharing links; do not resolve them on Herocon.
  let short="";
  try{const u=new URL(raw);if(u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&["qr.1688.com","a.1688.com","k.youshop10.com","weidian.com"].includes(u.hostname)&&u.pathname.length>1&&raw.length<=1000)short=u.href;}catch{}
  if(url&&!/^https:\/\/(detail\.1688\.com|weidian\.com)\//.test(url))return fail("Only 1688 and Weidian links are enabled for this test.");
  if(!url&&!short)return fail("Paste a valid 1688 or Weidian product link.");
  endpoint="parse";payload={...common,url:url||short};
 }else if(action==="search"){
  const keyword=string(body.keyword,160).trim();
  if(!searchChannel||!keyword)return fail("Enter a keyword to search 1688.");
  endpoint="search";payload={...common,channel,keyword,page,page_size:20};
 }else if(action==="image"){
  const image=string(body.image,2_800_001);
  const match=image.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if(!searchChannel||!match||match[2].length>2_800_000)return fail("Choose a JPEG, PNG or WebP image under 2 MB for 1688 search.");
  endpoint="search-by-image";payload={...common,channel,image_base64:match[2],page,page_size:20};
 }else if(action==="detail"){
  const id=string(body.id,501);
  if(!["1688","weidian"].includes(channel)||!id||id.length>500)return fail("Invalid product reference.");
  endpoint="detail";payload={...common,channel,id};
 }else return fail("Unsupported action.");
 const cacheId=hash(JSON.stringify({endpoint,payload})); // image bytes hashed, not persisted
 const prefix=owner?PREFIX:PUBLIC_PREFIX+(action==="image"?hash(customer.id)+"/":"shared/");
 const existing=await readSaved(cacheId,prefix);
 if(existing&&Date.now()-Date.parse(existing.savedAt)<TTL)return reply(await cachedResult(existing));
 if(!allow())return fail("Please wait a minute before another search.",429);
 if(!owner){try{const reservation=await reserveDiscovery(customer.id);if(reservation!=="ok")return fail(reservation==="account"?"Your daily live marketplace search allowance has been reached. Try again tomorrow (UTC).":"Herocon’s shared live search allowance has been reached for today. Please try again tomorrow (UTC).",429);}catch{return fail("Live search is temporarily unavailable. Please try again later.",503);}}
 const searchLabel=endpoint==="search"?string(payload.keyword)+" · page "+page:endpoint==="search-by-image"?"Image search · page "+page:endpoint==="parse"?string(payload.url):"Product "+string(payload.id);
 try{
  const response=await fetch("https://api.hiobuy.com/v1/products/"+endpoint,{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify(payload),cache:"no-store",redirect:"error",signal:AbortSignal.timeout(30_000)});
  const raw=asRecord(await response.json().catch(()=>null));
  const code=string(asRecord(raw.error).code)||string(raw.code);
  if(!response.ok){
   const reference=string(raw.request_id,100)||string(response.headers.get("x-request-id"),100);
   const suffix=reference?" (Request: "+reference+")":"";
   const message=code==="PAID_SUBSCRIPTION_REQUIRED"?"Taobao requires a paid HIOBuy subscription.":code==="CHANNEL_NOT_AUTHORIZED"?"This marketplace is not authorised in the HIOBuy developer portal.":response.status===429?"HIOBuy quota or rate limit reached.":response.status===401?"HIOBuy rejected the API credentials.":"HIOBuy could not complete this request ("+response.status+").";
   return fail(message+suffix,response.status===429?429:response.status===403?403:502);
  }
  const fx=await getReferenceCnyGbpRate().catch(()=>null);
  if(endpoint==="parse"||endpoint==="detail"){
   if(!raw.product||typeof raw.product!=="object")return fail("HIOBuy did not return product details.",502);
   const fallbackChannel=channel||(string(payload.url).includes("1688.com")?"1688":"weidian");
   const product=normalize(raw.product,fallbackChannel);
   if(!["1688","weidian"].includes(product.channel))return fail("This marketplace is not enabled.",400);
   const result={product,fx};
   const catalogueSave=await persistCatalogue(product,fx,raw);
   return reply({...result,...await store(cacheId,endpoint,owner?searchLabel:"Marketplace reference",result,prefix),catalogueSave});
  }
  if(!Array.isArray(raw.items))return fail("HIOBuy did not return a product list.",502);
  const result={items:raw.items.slice(0,20).map(p=>normalize(p,channel)).filter(p=>["1688","weidian"].includes(p.channel)),page:numeric(raw.page)??page,total:numeric(raw.total),fx};return reply({...result,...await store(cacheId,endpoint,owner?searchLabel:"Marketplace reference",result,prefix)});
 }catch{return fail("HIOBuy is temporarily unreachable. Please try again.",502);}
}
