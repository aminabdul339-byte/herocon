import {NextResponse} from "next/server";
import {getProducts} from "@/lib/catalogue-server";
import {getOpenCliSnapshot,mergeOpenCliProduct} from "@/lib/opencli-snapshots";
import {getSavedBuckydropProduct} from "@/lib/buckydrop-cache";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {productId} from "@/lib/catalogue";
import type {Product} from "@/lib/types";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers});
const MAX_PER_MINUTE=8;
const recent=new Map<string,{since:number;count:number}>();
function throttled(request:Request){
 const address=request.headers.get("x-real-ip")||
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
 const now=Date.now();
 if(recent.size>1500)for(const [key,value] of recent)if(now-value.since>60000)recent.delete(key);
 const item=recent.get(address);
 if(!item||now-item.since>60000){recent.set(address,{since:now,count:1});return false;}
 item.count++;
 return item.count>MAX_PER_MINUTE;
}
export async function POST(request:Request){
 const origin=request.headers.get("origin");
 try{
  if(!origin||new URL(origin).origin!==new URL(request.url).origin)
   return reply({error:"Submit marketplace links from Herocon."},403);
 }catch{return reply({error:"Invalid request origin."},403);}
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))
  return reply({error:"JSON required."},415);
 if(throttled(request))return reply({error:"Too many searches. Try again shortly."},429);
 let url:string|null=null;
 try{
  const raw=await request.text();
  if(raw.length>1500)return reply({error:"Link is too long."},413);
  const data:unknown=JSON.parse(raw);
  url=normalizeMarketplaceLink(data&&typeof data==="object"&&!Array.isArray(data)?
   (data as {url?:unknown}).url:null);
 }catch{return reply({error:"Invalid product-link request."},400);}
 if(!url)return reply({error:"Paste a complete supported 1688, Taobao, Tmall or Weidian product URL."},400);
 try{
  // All reads below use Herocon's existing private snapshots; neither calls
  // the marketplace nor requests a billable BuckyDrop product detail.
  const [products,browser,savedPartner]=await Promise.all([
   getProducts(),getOpenCliSnapshot(url),getSavedBuckydropProduct(url).catch(()=>null)
  ]);
  const existing=products.find(p=>normalizeMarketplaceLink(p.originalMarketplaceUrl)===url);
  if(!existing&&!browser&&!savedPartner)return reply({
   code:"NOT_COLLECTED",error:"Herocon has not collected this listing yet. View the original marketplace page, or check again after the local OpenCLI collector processes it.",
   productLink:url
  },404);
  const fallback:Product={
   title:browser?.title||savedPartner?.title||"Marketplace product",
   originalTitle:browser?.title||savedPartner?.title||undefined,
   originalMarketplaceUrl:url,
   imageUrl:browser?.images[0]||savedPartner?.images[0],
   images:browser?.images||savedPartner?.images||[],
   sellerName:browser?.sellerName||savedPartner?.sellerName||undefined,
   priceCNY:browser?.priceCNY??savedPartner?.offerPrice??savedPartner?.listPrice??undefined,
   sourceSpecs:browser?.sourceSpecs||[],
   detailImages:browser?.detailImages||[],
   category:"Marketplace product"
  };
  const base=existing||fallback;
  const product=mergeOpenCliProduct(base,browser);
  return reply({
   product,productLink:url,
   productId:existing?productId(existing):"linked-product",
   savedPartner:savedPartner||null,
   sourceKind:savedPartner?"saved-partner":browser?"opencli-browser":"catalogue",
   openCliCapturedAt:browser?.collectedAt||null,
   notice:"Historical marketplace information only. No supplier or payment lookup was performed."
  });
 }catch{
  return reply({error:"Saved marketplace details are temporarily unavailable. No paid lookup was attempted."},503);
 }
}
