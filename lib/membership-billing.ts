import "server-only";
import {get,put} from "@vercel/blob";
import {currentCustomer,type Customer} from "@/lib/customer-auth";

export type MembershipMode="test"|"live";
type StripeCustomer={id:string;email?:string;metadata?:Record<string,string>};
type StripePrice={id:string;active:boolean;currency:string;unit_amount:number;type:string;recurring?:{interval:string;interval_count:number}};
type StripeSubscription={
 id:string;customer:string;livemode:boolean;status:string;cancel_at_period_end?:boolean;
 items?:{data?:{price?:StripePrice;current_period_end?:number}[]};
};
const PREFIX="billing/memberships/v1/";
const UUID=/^[a-f0-9-]{36}$/i;
const BILLING_VERSION="2025-09-30.clover";
export class MembershipBillingError extends Error{
 constructor(public status:number,message:string){super(message);}
}
function stripeConfig(mode:MembershipMode){
 const key=mode==="test"?process.env.STRIPE_SECRET_KEY:process.env.STRIPE_LIVE_SECRET_KEY;
 const price=mode==="test"?process.env.HEROCON_MEMBERSHIP_TEST_PRICE_ID:process.env.HEROCON_MEMBERSHIP_LIVE_PRICE_ID;
 if(!key?.startsWith(mode==="test"?"sk_test_":"sk_live_")||
    !price?.startsWith("price_"))throw new MembershipBillingError(503,"Membership payment setup is incomplete.");
 return {key,price};
}
export function enabledMembershipMode():MembershipMode|null{
 const test=process.env.HEROCON_MEMBERSHIP_TEST_ENABLED==="true"&&
  process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")&&
  process.env.HEROCON_MEMBERSHIP_TEST_PRICE_ID?.startsWith("price_")&&
  process.env.HEROCON_MEMBERSHIP_TEST_WEBHOOK_SECRET?.startsWith("whsec_");
 if(test)return "test";
 const live=process.env.HEROCON_MEMBERSHIP_LIVE_ENABLED==="true"&&
  process.env.HEROCON_STRIPE_KEY_ROTATED==="true"&&
  process.env.STRIPE_LIVE_SECRET_KEY?.startsWith("sk_live_")&&
  process.env.HEROCON_MEMBERSHIP_LIVE_PRICE_ID?.startsWith("price_")&&
  process.env.HEROCON_MEMBERSHIP_LIVE_WEBHOOK_SECRET?.startsWith("whsec_")&&
  process.env.HEROCON_MEMBERSHIP_POLICIES_APPROVED==="true";
 return live?"live":null;
}
export function billingConfigured(mode:MembershipMode){
 try{
  stripeConfig(mode);
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)&&enabledMembershipMode()===mode;
 }catch{return false;}
}
async function stripe<T>(mode:MembershipMode,path:string,fields?:URLSearchParams,idempotency?:string):Promise<T>{
 const {key}=stripeConfig(mode);
 const response=await fetch("https://api.stripe.com/v1/"+path,{
  method:fields?"POST":"GET",
  headers:{"Authorization":"Bearer "+key,"Stripe-Version":BILLING_VERSION,
   ...(fields?{"Content-Type":"application/x-www-form-urlencoded"}:{}),
   ...(idempotency?{"Idempotency-Key":idempotency}:{})},
  ...(fields?{body:fields.toString()}:{}),
  redirect:"error",cache:"no-store",signal:AbortSignal.timeout(16000)
 });
 if(!response.ok)throw new MembershipBillingError(502,"Stripe Billing is currently unavailable.");
 return await response.json() as T;
}
async function customerMapping(userId:string,mode:MembershipMode):Promise<string|null>{
 if(!UUID.test(userId)||!process.env.BLOB_READ_WRITE_TOKEN)return null;
 try{
  const result=await get(PREFIX+mode+"/"+userId+".json",{access:"private"});
  if(!result||result.statusCode!==200||!result.stream)return null;
  const raw=await new Response(result.stream).text();
  if(raw.length>1000)return null;
  const row=JSON.parse(raw) as {userId?:string;mode?:string;customerId?:string};
  if(row.userId===userId&&row.mode===mode&&typeof row.customerId==="string"&&/^cus_[A-Za-z0-9]+$/.test(row.customerId))return row.customerId;
  return null;
 }catch{return null;}
}
async function saveCustomerMapping(userId:string,mode:MembershipMode,customerId:string):Promise<void>{
 if(!process.env.BLOB_READ_WRITE_TOKEN||!UUID.test(userId)||!/^cus_[A-Za-z0-9]+$/.test(customerId))
  throw new MembershipBillingError(503,"Private membership storage is unavailable.");
 await put(PREFIX+mode+"/"+userId+".json",JSON.stringify({version:1,userId,mode,customerId}),{
  access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"
 }).catch(async()=>{
  const current=await customerMapping(userId,mode);
  if(current!==customerId)throw new MembershipBillingError(503,"Unable to securely link your Stripe account.");
 });
}
export async function memberStripeCustomer(user:Customer,mode:MembershipMode,create=false):Promise<string|null>{
 if(!UUID.test(user.id))return null;
 let id=await customerMapping(user.id,mode);
 if(!id&&create){
  const fields=new URLSearchParams();
  fields.set("email",user.email);
  fields.set("metadata[herocon_user_id]",user.id);
  fields.set("metadata[herocon_membership]","yes");
  const customer=await stripe<StripeCustomer>(mode,"customers",fields,"herocon-member-"+mode+"-"+user.id);
  if(!/^cus_[A-Za-z0-9]+$/.test(customer.id))throw new MembershipBillingError(502,"Stripe did not return a valid customer account.");
  await saveCustomerMapping(user.id,mode,customer.id);
  id=customer.id;
 }
 return id;
}
export type MembershipStatus={
 active:boolean;status:string;cancelAtPeriodEnd:boolean;renewalAt:string|null;
 subscriptionId:string|null;mode:MembershipMode|null;
};
export async function getMembershipStatus(user:Customer,mode:MembershipMode):Promise<MembershipStatus>{
 const customerId=await memberStripeCustomer(user,mode,false);
 const blank={active:false,status:"none",cancelAtPeriodEnd:false,renewalAt:null,
  subscriptionId:null,mode};
 if(!customerId)return blank;
 const {price}=stripeConfig(mode);
 const list=await stripe<{data:StripeSubscription[]}>(mode,
  "subscriptions?customer="+encodeURIComponent(customerId)+"&status=all&limit=100");
 const matches=(list.data||[]).filter(sub=>
  sub.customer===customerId&&sub.livemode===(mode==="live")&&
  sub.items?.data?.some(item=>item.price?.id===price));
 matches.sort((a,b)=>Number(b.status==="active"||b.status==="trialing")-
  Number(a.status==="active"||a.status==="trialing"));
 const subscription=matches[0];
 if(!subscription)return blank;
 const item=subscription.items?.data?.find(i=>i.price?.id===price);
 const expiry=item?.current_period_end;
 const entitled=["active","trialing"].includes(subscription.status)&&
  typeof expiry==="number"&&expiry*1000>Date.now();
 return {active:entitled,status:subscription.status,
  cancelAtPeriodEnd:Boolean(subscription.cancel_at_period_end),
  renewalAt:typeof expiry==="number"?new Date(expiry*1000).toISOString():null,
  subscriptionId:subscription.id,mode};
}
async function verifyMonthlyPrice(mode:MembershipMode){
 const {price}=stripeConfig(mode);
 const object=await stripe<StripePrice>(mode,"prices/"+encodeURIComponent(price));
 if(object.id!==price||object.active!==true||object.currency!=="gbp"||
  object.unit_amount!==999||object.type!=="recurring"||
  object.recurring?.interval!=="month"||object.recurring?.interval_count!==1)
  throw new MembershipBillingError(503,"The configured membership is not the approved £9.99 monthly plan.");
}
export async function createMembershipCheckout(user:Customer,mode:MembershipMode):Promise<string>{
 if(!billingConfigured(mode))throw new MembershipBillingError(503,"Membership checkout is not enabled.");
 await verifyMonthlyPrice(mode);
 const existing=await getMembershipStatus(user,mode);
 if(existing.active)throw new MembershipBillingError(409,"Your Herocon membership is already active.");
 if(["past_due","unpaid","incomplete","paused"].includes(existing.status))
  throw new MembershipBillingError(409,"Please manage your existing subscription or contact support before starting another.");
 const customer=await memberStripeCustomer(user,mode,true);
 if(!customer)throw new MembershipBillingError(503,"Membership customer could not be created.");
 const {price}=stripeConfig(mode);
 const form=new URLSearchParams();
 form.set("mode","subscription");
 form.set("customer",customer);
 form.set("line_items[0][price]",price);
 form.set("line_items[0][quantity]","1");
 form.set("client_reference_id",user.id);
 form.set("metadata[herocon_user_id]",user.id);
 form.set("metadata[purpose]","herocon_membership");
 form.set("subscription_data[metadata][herocon_user_id]",user.id);
 form.set("subscription_data[metadata][herocon_plan]","gbp_999_month");
 form.set("success_url","https://herocon.store/membership/activate?status=success");
 form.set("cancel_url","https://herocon.store/membership/activate?status=cancelled");
 form.set("payment_method_types[0]","card");
 form.set("billing_address_collection","required");
 const checkout=await stripe<{id:string;url?:string;livemode:boolean;mode:string}>(mode,
  "checkout/sessions",form,"herocon-member-checkout-"+mode+"-"+user.id+"-"+Math.floor(Date.now()/600000));
 if(checkout.livemode!==(mode==="live")||checkout.mode!=="subscription"||
  typeof checkout.url!=="string"||!checkout.url.startsWith("https://checkout.stripe.com/"))
  throw new MembershipBillingError(502,"Stripe returned an unexpected subscription checkout.");
 return checkout.url;
}
export async function createMembershipPortal(user:Customer,mode:MembershipMode):Promise<string>{
 // Keep cancellation and billing history available even if checkout is disabled.
 if(!process.env.BLOB_READ_WRITE_TOKEN)throw new MembershipBillingError(503,"The billing portal is unavailable.");
 const customer=await memberStripeCustomer(user,mode);
 if(!customer)throw new MembershipBillingError(404,"No membership billing account is linked.");
 const form=new URLSearchParams();
 form.set("customer",customer);
 form.set("return_url","https://herocon.store/membership/activate");
 const portal=await stripe<{url?:string}>(mode,"billing_portal/sessions",form);
 if(!portal.url?.startsWith("https://billing.stripe.com/"))
  throw new MembershipBillingError(502,"Stripe's billing portal is not available.");
 return portal.url;
}
/** Never confer live product-purchase access from a Stripe TEST subscription. */
export async function hasLiveMembership(user:Customer):Promise<boolean>{
 if(enabledMembershipMode()!=="live")return false;
 return (await getMembershipStatus(user,"live")).active;
}
export async function currentAccountMembership(){
 const user=await currentCustomer();
 if(!user)return null;
 const mode=enabledMembershipMode();
 if(!mode)return {user,mode:null,status:null};
 return {user,mode,status:await getMembershipStatus(user,mode)};
}

/** Subscription management stays accessible when new signups are paused. */
export async function managementMode(user:Customer):Promise<MembershipMode|null>{
 const modes:MembershipMode[]=["live","test"];
 for(const mode of modes){
  const key=mode==="live"?process.env.STRIPE_LIVE_SECRET_KEY:process.env.STRIPE_SECRET_KEY;
  const price=mode==="live"?process.env.HEROCON_MEMBERSHIP_LIVE_PRICE_ID:process.env.HEROCON_MEMBERSHIP_TEST_PRICE_ID;
  if(!key?.startsWith(mode==="live"?"sk_live_":"sk_test_")||!price?.startsWith("price_"))continue;
  if(await customerMapping(user.id,mode))return mode;
 }
 return enabledMembershipMode();
}
