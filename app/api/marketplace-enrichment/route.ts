import {NextResponse} from "next/server";
import {currentCustomer,accountOriginValid} from "@/lib/customer-auth";
import {getProducts} from "@/lib/catalogue-server";
import {productId} from "@/lib/catalogue";
import {findPersonalProduct} from "@/lib/personal-shop";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {
 readMarketplaceSource,saveMarketplaceSource,SourceEnrichmentError
} from "@/lib/marketplace-source-enrichment";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"private, no-store","Vary":"Cookie","X-Content-Type-Options":"nosniff"};
const lastAttempt=new Map<string,number>();
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:HEADERS});

export async function POST(request:Request){
 if(!accountOriginValid(request))return reply({ok:false,error:"invalid_origin"},403);
 const customer=await currentCustomer();
 const ownerId=process.env.HEROCON_TRIAL_OWNER_USER_ID?.trim()
   ||process.env.HEROCON_MEMBERSHIP_OWNER_TEST_USER_ID?.trim();
 if(!customer||!ownerId||customer.id!==ownerId)
   return reply({ok:false,error:"owner_sign_in_required"},403);
 if(!(request.headers.get("content-type")||"").toLowerCase().startsWith("application/json"))
   return reply({ok:false,error:"json_required"},415);
 let id="",collection="";
 try{
  const raw=await request.text();
  if(raw.length>700)return reply({ok:false,error:"request_too_large"},413);
  const input=JSON.parse(raw) as Record<string,unknown>;
  if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Bad body");
  id=typeof input.productId==="string"?input.productId.trim():"";
  collection=typeof input.collection==="string"?input.collection:"";
 }catch{return reply({ok:false,error:"invalid_json"},400);}
 if(!/^[A-Za-z0-9_-]{5,100}$/.test(id)||!["business","personal"].includes(collection))
   return reply({ok:false,error:"invalid_product_selection"},400);
 if(!process.env.HIOBUY_API_KEY?.trim())
   return reply({ok:false,error:"product_api_not_connected"},503);
 const selected=collection==="personal"?findPersonalProduct(id):null;
 const catalogue=collection==="business"?await getProducts():null;
 const source=normalizeMarketplaceLink(
   selected?.originalUrl||catalogue?.find(p=>productId(p)===id||p.canonicalId===id)?.originalMarketplaceUrl
 );
 if(!source)return reply({ok:false,error:"verified_source_missing"},404);
 // Throttle explicit owner requests, including provider API billable reads.
 const key=customer.id+":"+source;
 const now=Date.now();
 for(const [k,t] of lastAttempt)if(now-t>600000)lastAttempt.delete(k);
 if(lastAttempt.size>500)lastAttempt.clear();
 if(now-(lastAttempt.get(key)||0)<25000)
   return reply({ok:false,error:"check_recently_requested"},429);
 lastAttempt.set(key,now);
 try{
  const result=await readMarketplaceSource(source);
  await saveMarketplaceSource(result);
  return reply({
   ok:true,
   provider:result.provider,
   retrievedAt:result.retrievedAt,
   saved:true,
   title:result.title,
   images:result.images.length,
   variants:result.variants.length,
   descriptionFound:Boolean(result.descriptionText),
   priceCNY:result.priceCNY??null,
   note:"Provider details have been saved; prices and stock are snapshots, not a checkout quote."
  });
 }catch(error){
  const code=error instanceof SourceEnrichmentError?error.code:"enrichment_failed";
  const safe=new Set([
   "product_api_not_connected","hiobuy_not_configured","hiobuy_product_missing","hiobuy_product_empty",
   "hiobuy_unavailable","hiobuy_rate_limited","hiobuy_failed",
   "CHANNEL_NOT_AUTHORIZED","INVALID_API_KEY","INSUFFICIENT_SCOPE",
   "PAID_SUBSCRIPTION_REQUIRED","QUOTA_EXCEEDED","RATE_LIMITED",
   "RATE_LIMIT_EXCEEDED","PLATFORM_QUOTA_EXCEEDED","CHANNEL_CAPABILITY_NOT_SUPPORTED",
   "CHANNEL_UPSTREAM_ERROR","VALIDATION_ERROR",
   "marketplace_unreachable","marketplace_redirected","marketplace_access_restricted",
   "marketplace_unavailable","marketplace_non_html","marketplace_page_too_large",
   "marketplace_empty","public_metadata_unavailable","enrichment_storage_unavailable",
   "enrichment_storage_failed","enrichment_record_too_large","invalid_marketplace_link"
  ]);
  const category=safe.has(code)?code:"enrichment_failed";
  console.warn("[marketplace-enrichment]",{error:category,collection});
  return reply({ok:false,error:category},
    error instanceof SourceEnrichmentError?error.status:503);
 }
}