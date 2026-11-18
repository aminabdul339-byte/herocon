import {NextResponse} from "next/server";
import {unstable_cache} from "next/cache";
import {BuckydropError,queryBuckydropProduct} from "@/lib/buckydrop";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {saveDiscoveredProduct,type DiscoverySaveResult} from "@/lib/discovered-products";
import {getBaseProducts} from "@/lib/catalogue-server";
import {productId} from "@/lib/catalogue";

export const dynamic="force-dynamic";

const lookup=unstable_cache(
 async (url:string)=>queryBuckydropProduct(url),
 ["herocon-external-link-lookup-v1"],
 {revalidate:3600}
);

// Best-effort per-instance throttling. Upgrade to a shared rate-limit store
// before public high-volume use, since individual Vercel instances do not share memory.
const visitors=new Map<string,{start:number;count:number}>();
const MAX_REQUESTS=8;
const WINDOW_MS=60_000;
function rateLimited(ip:string){
 const now=Date.now();
 if(visitors.size>1500)for(const [key,value] of visitors){
  if(now-value.start>WINDOW_MS)visitors.delete(key);
 }
 const rec=visitors.get(ip);
 if(!rec||now-rec.start>WINDOW_MS){visitors.set(ip,{start:now,count:1});return false;}
 rec.count++;
 return rec.count>MAX_REQUESTS;
}
const jsonError=(message:string,status:number)=>NextResponse.json(
 {error:message},{status,headers:{"Cache-Control":"no-store"}}
);

export async function POST(request:Request){
 if(process.env.BUCKYDROP_ENABLE_PRODUCT_LOOKUP!=="true"||process.env.BUCKYDROP_ENV!=="live"){
  return jsonError("Product link lookup is not available right now.",503);
 }
 const origin=request.headers.get("origin");
 if(!origin)return jsonError("Please submit product links from the Herocon website.",403);
 try {
  if(new URL(origin).origin!==new URL(request.url).origin)return jsonError("Invalid request origin.",403);
 }catch{return jsonError("Invalid request origin.",403);}
 const contentType=request.headers.get("content-type")||"";
 if(!contentType.startsWith("application/json"))return jsonError("Invalid request format.",415);
 const declaredSize=Number(request.headers.get("content-length")||0);
 if(declaredSize>1500)return jsonError("The supplied link is too long.",413);
 let body:unknown;
 try{body=await request.json();}catch{return jsonError("Invalid request body.",400);}
 if(!body||typeof body!=="object"||Array.isArray(body))return jsonError("Invalid request body.",400);
 const input=(body as Record<string,unknown>).url;
 const productLink=normalizeMarketplaceLink(input);
 if(!productLink){
  return jsonError("Paste a full 1688, Taobao, Tmall or Weidian product URL. Shortened or unrelated links are not supported.",400);
 }
 const ip=request.headers.get("x-real-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
 if(rateLimited(ip))return jsonError("Too many searches. Please try again shortly.",429);
 try {
  const product=await lookup(productLink);
  // Avoid duplicating a listing already in the original committed catalogue.
  let catalogueSave:DiscoverySaveResult={status:"unavailable",productId:null};
  try{
   const originalCatalogue=await getBaseProducts();
   const existing=originalCatalogue.find(item=>normalizeMarketplaceLink(item.originalMarketplaceUrl)===productLink);
   if(existing)catalogueSave={status:"existing",productId:productId(existing)};
   else catalogueSave=await saveDiscoveredProduct(productLink,product);
  }catch(error){
   console.error("[lookup] Unable to save discovered product:",error instanceof Error?error.message:"unknown");
  }
  return NextResponse.json({product,productLink,catalogueSave},{
   headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}
  });
 }catch(error){
  if(error instanceof BuckydropError){
   // Do not reveal anything from credentials, signed URLs, or upstream internals.
   return jsonError(error.message,error.status);
  }
  return jsonError("This product could not be retrieved right now.",502);
 }
}