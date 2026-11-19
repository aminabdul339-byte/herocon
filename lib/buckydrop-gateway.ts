import "server-only";
import {createHash} from "node:crypto";
import {BuckydropError} from "@/lib/buckydrop";

/**
 * BuckyDrop OpenAPI v1.2.6, using Herocon's existing server-only live credentials.
 * The request JSON is serialized exactly once; body bytes and signature must match.
 * No signed URLs, credentials or upstream customer records are logged or exposed.
 */
const ROOT="https://bdopenapi.buckydrop.com";
export type BuckyOperation="shipping-quote"|"create-shop-order"|"order-detail"|"package-detail"|"logistics-tracking";
const PATHS:Record<BuckyOperation,string>={
 "shipping-quote":"/api/rest/v2/adapt/adaptation/logistics/channel-carriage-list",
 "create-shop-order":"/api/rest/v2/adapt/adaptation/order/shop-order/create",
 "order-detail":"/api/rest/v2/adapt/adaptation/order/detail",
 "package-detail":"/api/rest/v2/adapt/adaptation/pkg/detail",
 "logistics-tracking":"/api/rest/v2/adapt/adaptation/logistics/query-info"
};
export function liveReady(){
 return process.env.BUCKYDROP_ENV==="live" &&
  typeof process.env.BUCKYDROP_APP_CODE==="string"&&!!process.env.BUCKYDROP_APP_CODE &&
  typeof process.env.BUCKYDROP_APP_SECRET==="string"&&!!process.env.BUCKYDROP_APP_SECRET;
}
export async function callBucky<T extends Record<string,unknown>>(op:BuckyOperation,body:Record<string,unknown>):Promise<T>{
 if(!liveReady())throw new BuckydropError("LIVE_NOT_CONFIGURED",503,"Live shipping and order services are not configured.");
 const raw=JSON.stringify(body);
 const timestamp=String(Date.now());
 const appCode=process.env.BUCKYDROP_APP_CODE!;
 const sign=createHash("md5").update(appCode+raw+timestamp+process.env.BUCKYDROP_APP_SECRET!).digest("hex");
 const url=new URL(PATHS[op],ROOT);
 url.searchParams.set("appCode",appCode);
 url.searchParams.set("timestamp",timestamp);
 url.searchParams.set("sign",sign);
 let response:Response;
 try{
  response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json",lang:"en"},body:raw,cache:"no-store",signal:AbortSignal.timeout(15000),redirect:"error"});
 }catch{throw new BuckydropError("UPSTREAM_TIMEOUT",502,"BuckyDrop is temporarily unavailable. Please try again later.");}
 if(!response.ok)throw new BuckydropError("UPSTREAM_HTTP",502,"BuckyDrop did not return a successful response.");
 let payload:unknown;
 try{payload=await response.json();}catch{throw new BuckydropError("UPSTREAM_FORMAT",502,"BuckyDrop returned an invalid response.");}
 if(!payload||typeof payload!=="object"||Array.isArray(payload))throw new BuckydropError("UPSTREAM_FORMAT",502,"BuckyDrop returned an invalid response.");
 const obj=payload as Record<string,unknown>;
 if(obj.success!==true||obj.code!==0){
  const code=String(obj.code??"UNKNOWN");
  if(code==="70000014")throw new BuckydropError("PERMISSION_NOT_GRANTED",503,"BuckyDrop has not enabled this operation for Herocon's account.");
  if(["70000015","70000022","70011103"].includes(code))throw new BuckydropError("UPSTREAM_RATE_LIMIT",429,"The shipping provider is temporarily busy. Please try again later.");
  if(code==="70000028")throw new BuckydropError("ACCOUNT_FUNDS",503,"The shipping provider cannot process this request for this account.");
  throw new BuckydropError("UPSTREAM_ERROR",502,"BuckyDrop could not complete the request.");
 }
 // BuckyDrop OpenAPI v1.2.6 (client 0.5.7): Shop Order creation can be
 // accepted (success=true, code=0) without an echoed data object. Preserve
 // acceptance and let the caller reconcile the original partnerOrderNo.
 // Never treat a missing write echo as permission to resubmit the order.
 if(op==="create-shop-order"&&(obj.data===undefined||obj.data===null))return {} as T;
 if(!obj.data||typeof obj.data!=="object"||Array.isArray(obj.data))throw new BuckydropError("UPSTREAM_EMPTY",502,"BuckyDrop did not return the requested details.");
 return obj.data as T;
}
