import {NextResponse} from "next/server";
import {LiveStripeError,authenticateLiveAdmin,isLiveStripeConfigured,verifyLiveAccount} from "@/lib/stripe-live";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});

/**
 * Operator-only, read-only connection test. Checkout remains separately locked.
 * Key must be freshly rotated and stored as a sensitive Vercel environment var.
 */
export async function POST(request:Request){
 if(!isLiveStripeConfigured())return reply({error:"Stripe live account checking is not configured."},503);
 if(!authenticateLiveAdmin(request.headers.get("x-herocon-stripe-admin-key")))return reply({error:"Not authorised."},401);
 try{
  const account=await verifyLiveAccount();
  return reply({connected:true,account,checkoutEnabled:false,automaticFulfilmentEnabled:false});
 }catch(e){
  if(e instanceof LiveStripeError)return reply({connected:false,error:e.message},e.status);
  return reply({connected:false,error:"Stripe account verification failed."},502);
 }
}
