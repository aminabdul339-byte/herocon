import {NextResponse} from "next/server";
import {currentCustomer,accountOriginValid} from "@/lib/customer-auth";
import {getProducts} from "@/lib/catalogue-server";
import {productId} from "@/lib/catalogue";
import {findPersonalProduct} from "@/lib/personal-shop";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
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
  if(!isOwnerPremiumCustomer(customer))
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
  // Personal Edit entries do not all exist in the committed general catalogue.
  const personal=product?null:findPersonalProduct(id);
  if(!product&&!personal)return reply({ok:false,error:"product_not_found"},404);
  const source=normalizeMarketplaceLink(product?.originalMarketplaceUrl||personal?.originalUrl);
  if(!source)return reply({ok:false,error:"verified_marketplace_link_missing"},422);
  recent.set(key,now);
  try{
    const live=await queryBuckydropProduct(source);
    const variants=live.variants.slice(0,500).map(v=>({
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
    // The previous implementation silently replaced BuckyDrop's exact codes
    // (including ACCOUNT_FUNDS and NOT_FOUND) with "supplier_lookup_failed".
    // Return safe, actionable categories to the authenticated owner instead.
    const code=error instanceof BuckydropError?error.code:"BACKEND_UNEXPECTED";
    const known=new Set([
      "NOT_ENABLED","NOT_CONFIGURED","INVALID_SOURCE","RATE_LIMIT",
      "ACCESS_DENIED","ACCOUNT_FUNDS","NOT_FOUND","EMPTY_PRODUCT",
      "UPSTREAM_UNAVAILABLE","INVALID_RESPONSE","UPSTREAM_HTTP_ERROR"
    ]);
    const providerCode=/^UPSTREAM_([0-9]{1,10})$/.exec(code)?.[1];
    const safeCode=known.has(code)?code:providerCode?"PROVIDER_REJECTED":"BACKEND_UNEXPECTED";
    const status=error instanceof BuckydropError?
      (error.status===429?429:error.status===404?404:503):503;
    // Log only a sanitised category. Never log the signed upstream URL,
    // auth token, supplier payload, email, exception message or product link.
    console.warn("[automatic-purchasing/preflight] supplier check failed",{
      error:safeCode,
      providerCode:providerCode||undefined,
      status
    });
    return reply({
      ok:false,
      error:safeCode,
      ...(providerCode?{providerCode}:{}),
      provider:"BuckyDrop",
      purchaseOrderCreated:false
    },status);
  }
}
