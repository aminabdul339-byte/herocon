import "server-only";
import type {Customer} from "@/lib/customer-auth";

/**
 * A free account is sufficient for the cart.
 * Buying is separate and MUST require server-confirmed Stripe membership.
 * No Supabase membership table or Stripe Billing webhooks are configured yet.
 */
export async function checkActiveMembership(customer:Customer):Promise<boolean>{
 const url=process.env.HEROCON_SUPABASE_URL||"";
 const key=process.env.HEROCON_SUPABASE_PUBLISHABLE_KEY||"";
 if(process.env.HEROCON_MEMBERSHIP_PURCHASE_GATE_ENABLED!=="true"||!url||!key)return false;
 try{
  const query=new URL("/rest/v1/herocon_memberships",url);
  query.searchParams.set("user_id","eq."+customer.id);
  query.searchParams.set("select","subscription_status,current_period_end");
  query.searchParams.set("limit","1");
  const response=await fetch(query.toString(),{
   headers:{apikey:key,Authorization:"Bearer "+customer.accessToken},
   redirect:"error",cache:"no-store",signal:AbortSignal.timeout(10000)
  });
  if(!response.ok)return false;
  const data=await response.json() as {subscription_status?:string;current_period_end?:string}[];
  if(!Array.isArray(data)||data.length!==1)return false;
  const row=data[0];
  return ["active","trialing"].includes(row.subscription_status||"")&&
    !!row.current_period_end&&Date.parse(row.current_period_end)>Date.now();
 }catch{return false;}
}
