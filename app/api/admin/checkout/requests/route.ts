import {NextResponse} from "next/server";
import {authorizedCheckoutAdmin} from "@/lib/approved-checkout";
import {merchantRequests,merchantUpdateRequest,QuoteRequestError} from "@/lib/quote-requests";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 if(!authorizedCheckoutAdmin(request.headers.get("x-herocon-checkout-admin")))
  return NextResponse.json({error:"Unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
 try{
  const requests=await merchantRequests(50);
  return NextResponse.json({requests,notice:"Customer requests are informational and do not approve or charge for products."},{headers:{"Cache-Control":"private, no-store"}});
 }catch{return NextResponse.json({error:"Merchant quote queue is temporarily unavailable."},{status:503,headers:{"Cache-Control":"no-store"}});}
}

export async function POST(request:Request){
 if(!authorizedCheckoutAdmin(request.headers.get("x-herocon-checkout-admin")))
  return NextResponse.json({error:"Unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
 const origin=request.headers.get("origin");
 try{
  if(!origin||new URL(origin).origin!==new URL(request.url).origin)
   return NextResponse.json({error:"Invalid request origin."},{status:403});
 }catch{return NextResponse.json({error:"Invalid origin."},{status:403});}
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))
  return NextResponse.json({error:"JSON required."},{status:415});
 let body:Record<string,unknown>;
 try{
  const raw=await request.text();
  if(raw.length>1100)return NextResponse.json({error:"Request too long."},{status:413});
  const parsed:unknown=JSON.parse(raw);
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error("invalid");
  body=parsed as Record<string,unknown>;
 }catch{return NextResponse.json({error:"Invalid update."},{status:400});}
 try{
  const record=await merchantUpdateRequest(String(body.userId||""),String(body.id||""),String(body.status||""),body.note);
  return NextResponse.json({request:record,notice:"Review updated. This did not create a payable quote or order."},{headers:{"Cache-Control":"no-store"}});
 }catch(e){
  return NextResponse.json({error:e instanceof QuoteRequestError?e.message:"Could not update request."},{
   status:e instanceof QuoteRequestError?e.status:503,headers:{"Cache-Control":"no-store"}
  });
 }
}
