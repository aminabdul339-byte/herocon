import {NextResponse} from "next/server";
import {currentCustomer,accountOriginValid} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {getReferenceCnyGbpRate} from "@/lib/fx-reference";

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
function normalize(raw:unknown,channel:string){
 const p=asRecord(raw),seller=asRecord(p.seller);
 const images=Array.from(new Set([httpsImage(p.image),...array(p.images).map(x=>httpsImage(asRecord(x).url))].filter(Boolean))).slice(0,40);
 return {id:string(p.id,500)||string(p.source_product_id,500),channel:string(p.channel)||channel,title:label(p.title)||"Untitled product",url:normalizeMarketplaceLink(p.source_url)||"",images,price:price(p.price),seller:string(seller.name),minimum:numeric(p.min_order_quantity),
 variants:array(p.variants).slice(0,300).map(v=>{const x=asRecord(v);return {id:string(x.sku_id,500),name:array(x.attributes).map(a=>{const r=asRecord(a);return [string(r.translated_name)||string(r.original_name)||label(r.name),string(r.translated_value)||string(r.original_value)||label(r.value)].filter(Boolean).join(": ");}).filter(Boolean).join(" / ")||"Variant",price:price(x.price),stock:numeric(x.stock),image:httpsImage(x.image)};}),
 attributes:array(p.attributes).slice(0,60).map(a=>{const x=asRecord(a);return {name:string(x.translated_name)||string(x.original_name)||label(x.name),value:string(x.translated_value)||string(x.original_value)||label(x.value)};}).filter(a=>a.name&&a.value)};
}
// Owner-only trial: coarse in-memory protection; provider quotas remain authoritative.
let windowStart=0,used=0;
function allow(){const now=Date.now();if(now-windowStart>=60_000){windowStart=now;used=0;}return ++used<=10;}
export async function POST(request:Request){
 if(!accountOriginValid(request))return fail("Please use the Herocon website.",403);
 if(!isOwnerPremiumCustomer(await currentCustomer()))return fail("Sign in with your Herocon owner account to test HIOBuy.",403);
 const key=process.env.HIOBUY_API_KEY?.trim();
 if(!key)return fail("HIOBuy is not configured on this deployment.",503);
 if(!allow())return fail("Please wait a minute before another test.",429);
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))return fail("Invalid request format.",415);
 if(Number(request.headers.get("content-length")||0)>3_000_000)return fail("Image is too large. Choose an image under 2 MB.",413);
 let body:Record<string,unknown>;
 try{const raw=await request.text();if(raw.length>3_000_000)return fail("Image is too large.",413);body=asRecord(JSON.parse(raw));}catch{return fail("Invalid request.");}
 const action=body.action,channel=string(body.channel);
 const common={language:"en"};
 const searchChannel=channel==="1688"||channel==="taobao";
 const page=typeof body.page==="number"&&Number.isInteger(body.page)&&body.page>=1&&body.page<=50?body.page:1;
 let endpoint:string,payload:Record<string,unknown>;
 if(action==="parse"){
  const raw=string(body.url,1001),url=normalizeMarketplaceLink(raw);
  // HIOBuy supports selected shortened sharing links; do not resolve them on Herocon.
  let short="";
  try{const u=new URL(raw);if(u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&["m.tb.cn","qr.1688.com","a.1688.com","k.youshop10.com","weidian.com"].includes(u.hostname)&&u.pathname.length>1&&raw.length<=1000)short=u.href;}catch{}
  if(!url&&!short)return fail("Paste a valid 1688, Taobao or Weidian product link.");
  if(url?.includes("detail.tmall.com"))return fail("Tmall is not a separately documented HIOBuy channel; try a Taobao listing.");
  endpoint="parse";payload={...common,url:url||short};
 }else if(action==="search"){
  const keyword=string(body.keyword,160).trim();
  if(!searchChannel||!keyword)return fail("Choose 1688 or Taobao and enter a keyword.");
  endpoint="search";payload={...common,channel,keyword,page,page_size:20};
 }else if(action==="image"){
  const image=string(body.image,2_800_001);
  const match=image.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if(!searchChannel||!match||match[2].length>2_800_000)return fail("Choose a JPEG, PNG or WebP image under 2 MB and select 1688 or Taobao.");
  endpoint="search-by-image";payload={...common,channel,image_base64:match[2],page,page_size:20};
 }else if(action==="detail"){
  const id=string(body.id,501);
  if(!["1688","taobao","weidian"].includes(channel)||!id||id.length>500)return fail("Invalid product reference.");
  endpoint="detail";payload={...common,channel,id};
 }else return fail("Unsupported action.");
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
   return reply({product:normalize(raw.product,channel),fx});
  }
  if(!Array.isArray(raw.items))return fail("HIOBuy did not return a product list.",502);
  return reply({items:raw.items.slice(0,20).map(p=>normalize(p,channel)),page:numeric(raw.page)??page,total:numeric(raw.total),fx});
 }catch{return fail("HIOBuy is temporarily unreachable. Please try again.",502);}
}
