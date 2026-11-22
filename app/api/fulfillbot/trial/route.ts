import {NextResponse} from "next/server";
import {currentCustomer,accountOriginValid} from "@/lib/customer-auth";
import {GET as adminGet, POST as adminPost} from "@/app/api/admin/fulfillbot-trial/route";
import {partnerRead,PartnerReadError} from "@/lib/fulfillbot-read";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"private, no-store","Vary":"Cookie","X-Content-Type-Options":"nosniff"};
function response(data:unknown,status=200) {
  return NextResponse.json(data,{status,headers:HEADERS});
}

/** Temporary owner-only bridge: no provider/admin secrets ever reach browser JS. */
async function isTrialOwner():Promise<boolean> {
  const customer=await currentCustomer();
  const id=process.env.HEROCON_TRIAL_OWNER_USER_ID?.trim()
    || process.env.HEROCON_MEMBERSHIP_OWNER_TEST_USER_ID?.trim();
  return Boolean(customer&&id&&customer.id===id);
}
function adminSecret():string|null {
  return process.env.HEROCON_CHECKOUT_ADMIN_KEY?.trim()||null;
}
const idPattern=/^[A-Za-z0-9_-]{5,128}$/;

export async function GET(request:Request) {
  if(!await isTrialOwner())return response({ok:false,error:"owner_sign_in_required"},403);
  const params=new URL(request.url).searchParams;
  const requestId=params.get("requestId");
  if(requestId!==null) {
    if(!idPattern.test(requestId))return response({ok:false,error:"invalid_request_id"},400);
    try {
      const result=await partnerRead("requests",{id:requestId});
      // Fulfillbot's own response, scoped to a verified owner. No caching.
      return response({ok:true,request:result});
    }catch(error) {
      const code=error instanceof PartnerReadError?error.code:"partner_unavailable";
      return response({ok:false,error:code},503);
    }
  }
  const secret=adminSecret();
  if(!secret)return response({ok:false,error:"owner_backend_unavailable"},503);
  const internalRequest=new Request(request.url,{headers:{"x-herocon-admin-key":secret}});
  const upstream=await adminGet(internalRequest);
  const body=await upstream.json().catch(()=>({ok:false,error:"invalid_response"}));
  return response(body,upstream.status);
}

export async function POST(request:Request) {
  if(!accountOriginValid(request))return response({ok:false,error:"invalid_origin"},403);
  if(!await isTrialOwner())return response({ok:false,error:"owner_sign_in_required"},403);
  const secret=adminSecret();
  if(!secret)return response({ok:false,error:"owner_backend_unavailable"},503);
  const type=request.headers.get("content-type")||"";
  if(!type.toLowerCase().startsWith("application/json"))
    return response({ok:false,error:"json_required"},415);
  let body:string;
  try{
    body=await request.text();
    if(!body||body.length>8192)return response({ok:false,error:"invalid_body_size"},413);
  }catch{return response({ok:false,error:"invalid_body"},400);}
  // Reuse the owner-gated backend's catalogue lookup, required confirmation,
  // write-disable feature flag and Fulfillbot API transport.
  const internalRequest=new Request(request.url,{
    method:"POST",
    headers:{"x-herocon-admin-key":secret,"content-type":"application/json"},
    body
  });
  const upstream=await adminPost(internalRequest);
  const data=await upstream.json().catch(()=>({ok:false,error:"invalid_response"}));
  return response(data,upstream.status);
}
