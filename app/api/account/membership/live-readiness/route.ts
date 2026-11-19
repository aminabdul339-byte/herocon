import {NextResponse} from "next/server";
import {currentCustomer} from "@/lib/customer-auth";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{
 "Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow","Vary":"Cookie"
}});
type StripeRead={id?:string;livemode?:boolean;charges_enabled?:boolean;payouts_enabled?:boolean;country?:string;currency?:string;unit_amount?:number;active?:boolean;type?:string;recurring?:{interval?:string;interval_count?:number};features?:{subscription_cancel?:{enabled?:boolean;mode?:string};payment_method_update?:{enabled?:boolean};invoice_history?:{enabled?:boolean}};is_default?:boolean};
async function readStripe(key:string,path:string):Promise<StripeRead>{
 const response=await fetch("https://api.stripe.com/v1/"+path,{
  method:"GET",headers:{Authorization:"Bearer "+key,"Stripe-Version":"2025-09-30.clover"},
  cache:"no-store",redirect:"error",signal:AbortSignal.timeout(10000)
 });
 if(!response.ok)throw new Error("Stripe could not verify the "+path.split("/")[0]+" resource.");
 return await response.json() as StripeRead;
}
export async function GET(){
 const customer=await currentCustomer();
 if(!customer)return reply({error:"Sign in to check Herocon billing readiness."},401);
 const key=process.env.STRIPE_LIVE_SECRET_KEY||"";
 const price=process.env.HEROCON_MEMBERSHIP_LIVE_PRICE_ID||"";
 const portal=process.env.HEROCON_MEMBERSHIP_LIVE_PORTAL_CONFIGURATION_ID||"";
 const webhook=process.env.HEROCON_MEMBERSHIP_LIVE_WEBHOOK_SECRET||"";
 const base={
  mode:"live",membershipAmountGBP:"9.99",interval:"month",
  liveKeyInstalled:key.startsWith("sk_live_"),
  livePriceConfigured:price.startsWith("price_"),
  liveWebhookSecretInstalled:webhook.startsWith("whsec_"),
  livePortalConfigured:portal.startsWith("bpc_"),
  rotatedKeyAttested:process.env.HEROCON_STRIPE_KEY_ROTATED==="true",
  membershipTermsApproved:process.env.HEROCON_MEMBERSHIP_POLICIES_APPROVED==="true",
  recurringBillingEnabled:process.env.HEROCON_MEMBERSHIP_LIVE_ENABLED==="true",
  productPaymentsEnabled:process.env.HEROCON_STRIPE_LIVE_CHECKOUT_ENABLED==="true",
  supplierPurchasesEnabled:process.env.HEROCON_ORDER_SUBMISSION_ENABLED==="true"
 };
 if(!base.liveKeyInstalled||!base.livePriceConfigured||!base.livePortalConfigured)
  return reply({...base,accountVerified:false,priceVerified:false,cancellationVerified:false,ready:false});
 try{
  const [account,p,config]=await Promise.all([
   readStripe(key,"account"),
   readStripe(key,"prices/"+encodeURIComponent(price)),
   readStripe(key,"billing_portal/configurations/"+encodeURIComponent(portal))
  ]);
  const accountVerified=account.id==="acct_1TGeApDWTSpscVhc"&&
    account.charges_enabled===true&&account.country==="GB";
  const priceVerified=p.id===price&&p.livemode===true&&p.active===true&&
    p.currency==="gbp"&&p.unit_amount===999&&p.type==="recurring"&&
    p.recurring?.interval==="month"&&p.recurring?.interval_count===1;
  const cancellationVerified=config.id===portal&&
    config.livemode===true&&config.features?.subscription_cancel?.enabled===true&&
    config.features?.subscription_cancel?.mode==="at_period_end"&&
    config.features?.payment_method_update?.enabled===true&&
    config.features?.invoice_history?.enabled===true;
  const ready=accountVerified&&priceVerified&&cancellationVerified&&
    base.liveWebhookSecretInstalled&&base.rotatedKeyAttested&&
    base.membershipTermsApproved&&base.recurringBillingEnabled;
  return reply({...base,accountVerified,priceVerified,cancellationVerified,ready});
 }catch{
  return reply({...base,accountVerified:false,priceVerified:false,
    cancellationVerified:false,ready:false,
    notice:"Stripe live credentials or resource permissions could not be verified. No payment was created."});
 }
}