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
export async function GET(request:Request){
  if(!authorised(request))return NextResponse.json({ok:false,error:"unauthorised"},{status:401,headers});
  const secretConfigured=Boolean(process.env.FULFILLBOT_WEBHOOK_SECRET?.trim());
  if(!partnerKeyConfigured())
    return NextResponse.json({ok:true,connection:"awaiting_api_key",apiKeyConfigured:false,webhookSecretConfigured:secretConfigured,writeActionsEnabled:false},{headers});
  try{
    const result=await partnerRead("me");
    const payload=result&&typeof result==="object"?result as {success?:boolean}:{};
    return NextResponse.json({ok:payload.success!==false,connection:"connected",apiKeyConfigured:true,webhookSecretConfigured:secretConfigured,writeActionsEnabled:false},{headers});
  }catch(error){
    const code=error instanceof PartnerReadError?error.code:"unknown_error";
    return NextResponse.json({ok:false,connection:"failed",apiKeyConfigured:true,webhookSecretConfigured:secretConfigured,writeActionsEnabled:false,error:code},{status:503,headers});
  }
}
