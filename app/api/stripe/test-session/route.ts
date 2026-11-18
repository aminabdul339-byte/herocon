import {NextResponse} from "next/server";
import {StripeGatewayError,authorizeTestAdmin,createTestSession,stripeTestConfigured} from "@/lib/stripe-gateway";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const jsonError=(error:string,status:number)=>NextResponse.json({error},{status,headers:{"Cache-Control":"no-store"}});

/**
 * Operator-only Stripe TEST payment. £1 sandbox charge; no cart, no real goods,
 * no BuckyDrop order and no delivery. Not accessible from the public cart.
 * Requires two independent private controls before it creates a session.
 */
export async function POST(request:Request){
 if(!stripeTestConfigured())return jsonError("Stripe test checkout is not configured.",503);
 if(!authorizeTestAdmin(request.headers.get("x-herocon-test-admin-key")))return jsonError("Not authorized.",401);
 const origin=request.headers.get("origin");
 // This endpoint is server- or operator-invoked; allow no Origin with a valid admin key.
 try{if(origin&&new URL(origin).origin!==(process.env.HEROCON_SITE_ORIGIN||"https://herocon-app-pi.vercel.app"))return jsonError("Invalid origin.",403);}catch{return jsonError("Invalid origin.",403);}
 try{
  const {id,url}=await createTestSession(process.env.HEROCON_SITE_ORIGIN||"https://herocon-app-pi.vercel.app");
  return NextResponse.json({sessionId:id,url,environment:"test",fulfilment:false},{headers:{"Cache-Control":"no-store"}});
 }catch(e){
  if(e instanceof StripeGatewayError)return jsonError(e.message,e.status);
  return jsonError("Stripe test checkout could not be created.",502);
 }
}
