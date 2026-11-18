import {NextResponse} from "next/server";
import {getProducts} from "@/lib/catalogue-server";
import {productId} from "@/lib/catalogue";
import {BuckydropError} from "@/lib/buckydrop";
import {getSavedBuckydropProduct,getOrSaveBuckydropProduct} from "@/lib/buckydrop-cache";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const visitors=new Map<string,{since:number,count:number}>();
const jsonError=(error:string,status:number,code?:string)=>NextResponse.json({error,code},{status,headers:{"Cache-Control":"no-store"}});
function throttle(request:Request){
 const ip=request.headers.get("x-real-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
 const now=Date.now();
 if(visitors.size>1200)for(const [key,v] of visitors)if(now-v.since>60000)visitors.delete(key);
 const recent=visitors.get(ip);
 if(!recent||now-recent.since>60000){visitors.set(ip,{since:now,count:1});return false;}
 recent.count++;
 return recent.count>4;
}
async function sourceLink(id:string):Promise<string|null>{
 if(!/^[A-Za-z0-9_-]{8,100}$/.test(id))return null;
 const catalogue=await getProducts();
 return catalogue.find(p=>productId(p)===id)?.originalMarketplaceUrl||null;
}
const configured=()=>process.env.BUCKYDROP_ENABLE_PRODUCT_LOOKUP==="true"&&
 process.env.BUCKYDROP_ENV==="live";

// GET only reads saved details, never calls BuckyDrop or incurs a product/detail fee.
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 if(!configured())return jsonError("Supplier product snapshots are unavailable.",503);
 const {id}=await params;
 const link=await sourceLink(id);
 if(!link)return jsonError("Product link not found.",404);
 try{
  const product=await getSavedBuckydropProduct(link);
  if(!product)return jsonError("Product details have not been saved yet.",404,"SNAPSHOT_MISSING");
  return NextResponse.json({product,cacheStatus:"hit"},{headers:{"Cache-Control":"private, no-store","X-Herocon-Product-Snapshot":"hit"}});
 }catch(e){
  if(e instanceof BuckydropError)return jsonError(e.message,e.status,e.code);
  return jsonError("Saved product details are unavailable.",503);
 }
}

// A new, potentially billable lookup requires an explicit same-origin POST.
// The product page does not issue this automatically or via link prefetch.
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!configured())return jsonError("Supplier product lookups are unavailable.",503);
 const origin=request.headers.get("origin");
 try{if(!origin||new URL(origin).origin!==new URL(request.url).origin)return jsonError("Open Herocon to load supplier details.",403);}
 catch{return jsonError("Invalid request origin.",403);}
 if(throttle(request))return jsonError("Too many supplier requests. Please try again in a minute.",429);
 const {id}=await params;
 const link=await sourceLink(id);
 if(!link)return jsonError("Product link not found.",404);
 try{
  const {product,cacheStatus}=await getOrSaveBuckydropProduct(link);
  return NextResponse.json({product,cacheStatus},{headers:{"Cache-Control":"private, no-store","X-Herocon-Product-Snapshot":cacheStatus}});
 }catch(e){
  if(e instanceof BuckydropError)return jsonError(e.message,e.status,e.code);
  return jsonError("Supplier details could not be loaded.",502);
 }
}
