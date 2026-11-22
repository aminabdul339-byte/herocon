import {NextResponse} from "next/server";
import {currentCustomer,accountOriginValid} from "@/lib/customer-auth";
import {getProducts} from "@/lib/catalogue-server";
import {productId} from "@/lib/catalogue";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {BuckydropError,queryBuckydropProduct} from "@/lib/buckydrop";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"private, no-store","Vary":"Cookie","X-Content-Type-Options":"nosniff"};
const recent=new Map<string,number>();
function reply(value:unknown,status=200){return NextResponse.json(value,{status,headers:HEADERS});}

/**
 * Owner-only explicit live supplier preflight.
 * Reads SKU/price/stock/MOQ from BuckyDrop using the canonical Herocon source URL.
 * Does not create an order, reserve stock, submit a sourcing request or charge funds.
 */
export async function POST(request:Request){
  if(!accountOriginValid(request))return reply({ok:false,error:"invalid_origin"},403);
  const customer=await currentCustomer();
  const ownerId=process.env.HEROCON_TRIAL_OWNER_USER_ID?.trim()
    ||process.env.HEROCON_MEMBERSHIP_OWNER_TEST_USER_ID?.trim();
  if(!customer||!ownerId||customer.id!==ownerId)
    return reply({ok:false,error:"owner_sign_in_required"},403);
  if(!(request.headers.get("content-type")||"").toLowerCase().startsWith("application/json"))
    return reply({ok:false,error:"json_required"},415);
  let id:string;
  try{
    const raw=await request.text();
    if(raw.length>1000)return reply({ok:false,error:"request_too_large"},413);
    const parsed:unknown=JSON.parse(raw);
    if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error("Invalid input");
    const value=(parsed as Record<string,unknown>).productId;
    id=typeof value==="string"?value.trim():"";
  }catch{return reply({ok:false,error:"invalid_json"},400);}
  if(!/^[A-Za-z0-9_-]{5,100}$/.test(id))
    return reply({ok:false,error:"invalid_product_id"},400);
  // Avoid accidental repeated billable/limited supplier API calls.
  const key=customer.id+":"+id;
  const now=Date.now();
  for(const [k,t] of recent)if(now-t>600000)recent.delete(k);
  if(recent.size>3000)recent.clear();
  if(recent.get(key)&&now-(recent.get(key)||0)<45000)
    return reply({ok:false,error:"check_recently_requested"},429);
  const catalogue=await getProducts();
  const product=catalogue.find(item=>productId(item)===id||item.canonicalId===id);
  if(!product)return reply({ok:false,error:"product_not_found"},404);
  const source=normalizeMarketplaceLink(product.originalMarketplaceUrl);
  if(!source)return reply({ok:false,error:"verified_marketplace_link_missing"},422);
  recent.set(key,now);
  try{
    const live=await queryBuckydropProduct(source);
    const variants=live.variants.slice(0,160).map(v=>({
      skuCode:v.skuCode,
      label:v.title,
      options:v.options,
      priceCNY:v.price,
      stock:v.stock,
      available:v.stock===null||v.stock>0
    }));
    return reply({
      ok:true,
      provider:"BuckyDrop",
      sourceMarketplaceUrl:source,
      checkedAt:new Date().toISOString(),
      title:live.title,
      supplierProductCode:live.spuCode,
      minimumQuantity:live.moq,
      available:live.available,
      currency:"CNY",
      variants,
      sourceVariantCount:live.variants.length,
      priceConfirmedBySupplierLookup:true,
      purchaseOrderCreated:false,
      automaticPurchaseEnabled:false,
      note:"This is a live product availability and SKU read, not proof the partner accepts automated order creation. No order or payment has been made."
    });
  }catch(error){
    const known=error instanceof BuckydropError?error.code:"supplier_unavailable";
    const allowed=new Set(["NOT_ENABLED","NOT_CONFIGURED","INVALID_SOURCE","RATE_LIMIT","ACCESS_DENIED","UPSTREAM_UNAVAILABLE","INVALID_RESPONSE","UPSTREAM_HTTP_ERROR"]);
    // Never return an arbitrary upstream message or credential.
    return reply({ok:false,error:allowed.has(known)?known:"supplier_lookup_failed"},503);
  }
}
