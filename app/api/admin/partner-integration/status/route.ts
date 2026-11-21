import {NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {partnerKeyConfigured,partnerRead,PartnerReadError} from "@/lib/fulfillbot-read";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
function authorised(request:Request):boolean {
  const expected=process.env.HEROCON_CATALOGUE_IMPORT_KEY?.trim();
  const supplied=request.headers.get("x-herocon-catalogue-admin")||"";
  if(!expected||!supplied)return false;
  const a=Buffer.from(expected),b=Buffer.from(supplied);
  return a.length===b.length&&timingSafeEqual(a,b);
}
type SafeKeyDiagnostics={keyPrefixMatches:"yes"|"no"|"not_checked";keyFormatValid:boolean};
function inspectKey(request:Request):SafeKeyDiagnostics {
 const configured=process.env.FULFILLBOT_API_KEY?.trim()||"";
 const entered=request.headers.get("x-herocon-partner-key-prefix")||"";
 const keyFormatValid=/^pak_[A-Za-z0-9_-]{20,}$/.test(configured);
 if(!/^pak_[A-Za-z0-9_-]{6,18}$/.test(entered))
   return {keyPrefixMatches:"not_checked",keyFormatValid};
 const a=Buffer.from(configured.slice(0,entered.length));
 const b=Buffer.from(entered);
 return {keyPrefixMatches:a.length===b.length&&timingSafeEqual(a,b)?"yes":"no",keyFormatValid};
}
function invalidReply(
 error:string,status=503,requestId?:string,diagnostics?:SafeKeyDiagnostics,
 upstreamResponseType?:string,edgeRequestId?:string,upstreamHttpStatus?:number
){
 return NextResponse.json({ok:false,connection:"failed",apiKeyConfigured:true,
  webhookSecretConfigured:Boolean(process.env.FULFILLBOT_WEBHOOK_SECRET?.trim()),
  writeActionsEnabled:false,error,requestId,upstreamResponseType,edgeRequestId,
  upstreamHttpStatus,...diagnostics},{status,headers});
}
export async function GET(request:Request){
  if(!authorised(request))return NextResponse.json({ok:false,error:"unauthorised"},{status:401,headers});
  const webhookSecretConfigured=Boolean(process.env.FULFILLBOT_WEBHOOK_SECRET?.trim());
  const diagnostics=inspectKey(request);
  if(!partnerKeyConfigured())return NextResponse.json({
    ok:false,connection:"awaiting_api_key",apiKeyConfigured:false,
    webhookSecretConfigured,writeActionsEnabled:false,...diagnostics
  },{headers});
  try{
    // Never return the customer's identity, balances, API token or any
    // order/product records; the private page needs status flags only.
    const me=await partnerRead("me");
    if(!me||typeof me!=="object"||(me as {success?:boolean}).success===false)
      return invalidReply("invalid_partner_response",503,undefined,diagnostics);
    let catalogue:"readable"|"unavailable"="unavailable";
    let productCount:number|null=null;
    let catalogueError:string|null=null;
    try{
      const listed=await partnerRead("products",{page:1});
      const result=listed&&typeof listed==="object"?listed as {
        success?:boolean;data?:unknown;meta?:{total?:number}
      }:{};
      if(result.success===false)throw new PartnerReadError(502,"partner_products_error");
      catalogue="readable";
      if(Array.isArray(result.data))productCount=result.data.length;
    }catch(error){
      catalogueError=error instanceof PartnerReadError?error.code:"partner_unavailable";
    }
    return NextResponse.json({
      ok:true,connection:"connected",apiKeyConfigured:true,
      webhookSecretConfigured,catalogue,productCountFirstPage:productCount,
      catalogueError,writeActionsEnabled:false,...diagnostics
    },{headers});
  }catch(error){
    return invalidReply(
      error instanceof PartnerReadError?error.code:"partner_unavailable",
      503,error instanceof PartnerReadError?error.requestId:undefined,diagnostics,
      error instanceof PartnerReadError?error.upstreamResponseType:undefined,
      error instanceof PartnerReadError?error.edgeRequestId:undefined,
      error instanceof PartnerReadError?error.status:undefined
    );
  }
}
