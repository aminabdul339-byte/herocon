import {NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";

/**
 * Read-only compatibility check for Fulfillbot's separately published
 * /api/v1/open product search API. Their current API uses /v1 and pak_ keys;
 * the older product-search guide uses /api/v1/open and sk- keys.
 *
 * This sends exactly ONE catalogue search using a real Herocon marketplace
 * link. No order, sourcing request or import is created. No production-wide
 * import is attempted until the provider confirms the relevant API contract.
 */
export const runtime="nodejs";
export const dynamic="force-dynamic";
const url="https://api.fulfillbot.com/api/v1/open/products/search";
const sample="https://detail.1688.com/offer/833950031114.html";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
function allowed(request:Request):boolean{
 const expected=(process.env.HEROCON_CATALOGUE_IMPORT_KEY||"").trim();
 const value=request.headers.get("x-herocon-catalogue-admin")||"";
 if(expected.length<48||value.length!==expected.length)return false;
 return timingSafeEqual(Buffer.from(expected),Buffer.from(value));
}
function responseType(contentType:string){
 return contentType.includes("application/json")?"json":
  contentType.includes("text/html")?"html":"other";
}
function safeId(input:string|null):string|null {
 return input&&/^[A-Za-z0-9_-]{3,128}$/.test(input)?input:null;
}
export async function GET(request:Request){
 if(!allowed(request))return NextResponse.json({ok:false,error:"unauthorized"},{status:401,headers});
 const key=process.env.FULFILLBOT_API_KEY?.trim();
 if(!key)return NextResponse.json({ok:false,error:"api_key_unavailable"},{status:503,headers});
 const target=new URL(url);
 target.searchParams.set("q",sample);
 target.searchParams.set("page","1");
 target.searchParams.set("limit","1");
 let response:Response;
 try{
  response=await fetch(target.toString(),{
   method:"GET",headers:{Authorization:"Bearer "+key,Accept:"application/json"},
   cache:"no-store",signal:AbortSignal.timeout(10000)
  });
 }catch{
  return NextResponse.json({ok:false,status:null,compatible:false,error:"network_or_timeout",
   message:"The older marketplace API could not be reached. Current /v1 access may still be working."},{headers});
 }
 const type=responseType((response.headers.get("content-type")||"").toLowerCase());
 const requestId=safeId(response.headers.get("x-request-id"));
 const ray=safeId(response.headers.get("cf-ray"));
 // Never return the upstream text, auth token, product titles, account data,
 // marketplace response body or any untrusted error message.
 let itemCount:null|number=null,containsRichFields=false,matchingUrl=false;
 if(response.ok&&type==="json"){
  try{
   const raw:unknown=await response.json();
   if(raw&&typeof raw==="object"&&!Array.isArray(raw)){
    const root=raw as Record<string,unknown>;
    const data=root.data&&typeof root.data==="object"&&!Array.isArray(root.data)?root.data as Record<string,unknown>:null;
    const arr=Array.isArray(data?.items)?data.items:Array.isArray(root.items)?root.items:null;
    if(arr){
     itemCount=arr.length;
     const first=arr[0];
     if(first&&typeof first==="object"&&!Array.isArray(first)){
      const item=first as Record<string,unknown>;
      containsRichFields=Array.isArray(item.skus)||Array.isArray(item.variants)||
       Array.isArray(item.images)||typeof item.imageUrl==="string";
      matchingUrl=[item.originalUrl,item.productUrl,item.url,item.link]
       .some(x=>x===sample);
     }
    }
   }
  }catch{}
 }
 const code=response.status===401?"key_not_accepted_by_legacy_api":
  response.status===403?"access_denied_by_legacy_api":
  response.status===404?"legacy_endpoint_not_found":
  response.status===429?"rate_limited":
  response.ok&&itemCount===0?"endpoint_accessible_no_link_match":
  response.ok&&itemCount!==null?"endpoint_accessible_check_mapping":
  response.ok?"response_shape_unknown":"legacy_api_error";
 return NextResponse.json({
  ok:response.ok,httpStatus:response.status,
  compatibility:response.ok?"access_possible":"not_confirmed",
  requestId,edgeRequestId:ray,responseType:type,
  sampleMarketplace:"1688",sampleReference:"833950031114",
  itemCount,containsRichFields,exactUrlMatched:matchingUrl,
  code,
  note:"Read-only compatibility probe only. An accessible search endpoint does not establish that it accepts marketplace URLs, grants bulk use, or provides a full product-data export."
 },{headers});
}
