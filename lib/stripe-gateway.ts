import "server-only";
import {createHmac,timingSafeEqual} from "node:crypto";

/**
 * Stripe test-mode adapter. The Herocon site never receives Stripe secrets.
 * This adapter NEVER creates a live-mode charge and is not customer checkout.
 * Live commercial checkout needs verified total and shipping/tax configuration.
 */
export class StripeGatewayError extends Error{
 constructor(public status:number,public code:string,message:string){super(message);}
}
function testKey(){
 const key=process.env.STRIPE_SECRET_KEY||"";
 if(!key.startsWith("sk_test_")||key.length<20)throw new StripeGatewayError(503,"TEST_NOT_CONFIGURED","Stripe test credentials are not configured.");
 return key;
}
export function stripeTestConfigured(){
 return process.env.HEROCON_STRIPE_TEST_CHECKOUT_ENABLED==="true"&&
  (process.env.STRIPE_SECRET_KEY||"").startsWith("sk_test_")&&
  !!process.env.STRIPE_WEBHOOK_SECRET&&
  !!process.env.HEROCON_STRIPE_TEST_ADMIN_KEY&&
  process.env.HEROCON_STRIPE_TEST_ADMIN_KEY.length>=32;
}
export function authorizeTestAdmin(provided:string|null){
 const expected=process.env.HEROCON_STRIPE_TEST_ADMIN_KEY||"";
 if(!expected||expected.length<32||!provided||provided.length!==expected.length)return false;
 return timingSafeEqual(Buffer.from(expected),Buffer.from(provided));
}
type StripeCheckoutSession={
 id:string;object:string;url?:string|null;mode?:string;livemode?:boolean;
 payment_status?:string;amount_total?:number;currency?:string;
 metadata?:Record<string,string>;
};
export async function createTestSession(siteOrigin:string):Promise<{id:string;url:string}>{
 const key=testKey();
 if(process.env.HEROCON_STRIPE_TEST_CHECKOUT_ENABLED!=="true")throw new StripeGatewayError(503,"TEST_DISABLED","Stripe sandbox checkout has not been enabled.");
 const allowedOrigin=process.env.HEROCON_SITE_ORIGIN||"https://herocon-app-pi.vercel.app";
 if(siteOrigin!==allowedOrigin)throw new StripeGatewayError(403,"INVALID_ORIGIN","Please use Herocon's official test checkout.");
 const values=new URLSearchParams();
 values.set("mode","payment");
 values.set("line_items[0][price_data][currency]","gbp");
 values.set("line_items[0][price_data][product_data][name]","Herocon sandbox payment test — no goods will be ordered");
 values.set("line_items[0][price_data][unit_amount]","100");
 values.set("line_items[0][quantity]","1");
 values.set("metadata[purpose]","herocon_integration_test");
 values.set("metadata[fulfilment]","disabled");
 values.set("success_url",siteOrigin+"/payments/test-result?session_id={CHECKOUT_SESSION_ID}");
 values.set("cancel_url",siteOrigin+"/cart");
 let response:Response;
 try{
  response=await fetch("https://api.stripe.com/v1/checkout/sessions",{
   method:"POST",
   headers:{"Authorization":"Bearer "+key,"Content-Type":"application/x-www-form-urlencoded","Stripe-Version":"2025-09-30.clover"},
   body:values.toString(),cache:"no-store",redirect:"error",signal:AbortSignal.timeout(12000)
  });
 }catch{throw new StripeGatewayError(502,"STRIPE_UNAVAILABLE","Stripe sandbox is temporarily unavailable.");}
 if(!response.ok){
  // Never send provider response details or merchant keys to the browser.
  throw new StripeGatewayError(502,"STRIPE_REJECTED","The Stripe test session could not be created.");
 }
 const value:unknown=await response.json().catch(()=>null);
 if(!value||typeof value!=="object"||Array.isArray(value))throw new StripeGatewayError(502,"INVALID_RESPONSE","Stripe returned an invalid test session.");
 const session=value as StripeCheckoutSession;
 if(!session.id?.startsWith("cs_test_")||session.livemode!==false||!session.url?.startsWith("https://checkout.stripe.com/"))throw new StripeGatewayError(502,"INVALID_TEST_SESSION","Stripe did not return an authorised test-mode session.");
 return {id:session.id,url:session.url};
}
export type StripeWebhookEvent={id:string;type:string;livemode:boolean;data:{object:StripeCheckoutSession}};
/** Stripe-Signature v1 verification over the EXACT raw UTF-8 request body, 5m replay window. */
export function verifyStripeWebhook(raw:string,header:string|null,webhookSecret?:string):StripeWebhookEvent{
 const secret=webhookSecret??process.env.STRIPE_WEBHOOK_SECRET??"";
 if(!secret.startsWith("whsec_")||!header)throw new StripeGatewayError(400,"SIGNATURE_MISSING","Invalid webhook signature.");
 const fields=header.split(",").map(v=>v.trim());
 const stamp=fields.find(x=>x.startsWith("t="))?.slice(2)||"";
 const signatures=fields.filter(x=>x.startsWith("v1=")).map(x=>x.slice(3));
 if(!/^[0-9]{10,13}$/.test(stamp)||!signatures.length)throw new StripeGatewayError(400,"SIGNATURE_MALFORMED","Invalid webhook signature.");
 const timestamp=Number(stamp);
 if(!Number.isFinite(timestamp)||Math.abs(Date.now()/1000-timestamp)>300)throw new StripeGatewayError(400,"SIGNATURE_EXPIRED","Webhook signature expired.");
 const expected=createHmac("sha256",secret).update(stamp+"."+raw).digest();
 const verified=signatures.some(signature=>{
  if(!/^[a-f0-9]{64}$/.test(signature))return false;
  return timingSafeEqual(expected,Buffer.from(signature,"hex"));
 });
 if(!verified)throw new StripeGatewayError(400,"SIGNATURE_BAD","Webhook signature verification failed.");
 let parsed:unknown;
 try{parsed=JSON.parse(raw);}catch{throw new StripeGatewayError(400,"INVALID_EVENT","Invalid webhook event.");}
 if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new StripeGatewayError(400,"INVALID_EVENT","Invalid webhook event.");
 const event=parsed as StripeWebhookEvent;
 if(typeof event.id!=="string"||!/^evt_[A-Za-z0-9]+$/.test(event.id)||typeof event.type!=="string"||typeof event.livemode!=="boolean"||!event.data?.object)throw new StripeGatewayError(400,"INVALID_EVENT","Invalid webhook event.");
 return event;
}
