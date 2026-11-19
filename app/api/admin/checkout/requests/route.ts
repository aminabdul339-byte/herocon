import {NextResponse} from "next/server";
import {authorizedCheckoutAdmin} from "@/lib/approved-checkout";
import {merchantRequests} from "@/lib/quote-requests";
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
