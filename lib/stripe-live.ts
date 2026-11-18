import "server-only";
import {timingSafeEqual} from "node:crypto";

export class LiveStripeError extends Error{
 constructor(public status:number,public code:string,message:string){super(message);}
}

/**
 * Stripe live environment is deliberately independent of test-mode checkout.
 * Never use a credential pasted in chat or commit one to the repository.
 * A production operator must provision a freshly rotated key in Vercel.
 */
export function isLiveStripeConfigured(){
 const key=process.env.STRIPE_LIVE_SECRET_KEY||"";
 const admin=process.env.HEROCON_STRIPE_LIVE_ADMIN_KEY||"";
 const enabled=process.env.HEROCON_STRIPE_LIVE_CONNECTIVITY_ENABLED==="true";
 const prefixValid=key.startsWith("sk_live_");
 const keyLengthValid=key.length>30;
 const keyHasPlaceholder=key.includes(".");
 const adminLengthValid=admin.length>=32;
 // Restricted server-side diagnostics: never log or return credentials.
 if(!enabled||!prefixValid||!keyLengthValid||keyHasPlaceholder||!adminLengthValid){
  console.warn("[herocon-stripe-readiness]",JSON.stringify({
   enabled,hasStripeKey:key.length>0,prefixValid,keyLengthValid,keyHasPlaceholder,
   hasAdminKey:admin.length>0,adminLengthValid
  }));
 }
 return enabled&&prefixValid&&keyLengthValid&&!keyHasPlaceholder&&adminLengthValid;
}
export function authenticateLiveAdmin(supplied:string|null){
 const secret=process.env.HEROCON_STRIPE_LIVE_ADMIN_KEY||"";
 if(secret.length<32||!supplied||supplied.length!==secret.length)return false;
 return timingSafeEqual(Buffer.from(secret),Buffer.from(supplied));
}
const EXPECTED_ACCOUNT="acct_1TGeApDWTSpscVhc";

export type StripeIdentity={
 accountId:string;
 displayName:string|null;
 statementDescriptor:string|null;
 country:string|null;
 defaultCurrency:string|null;
 chargesEnabled:boolean;
 payoutsEnabled:boolean;
};

/** One read-only request; creates no payment, checkout session or charge. */
export async function verifyLiveAccount():Promise<StripeIdentity>{
 if(!isLiveStripeConfigured())throw new LiveStripeError(503,"NOT_CONFIGURED","Live Stripe connectivity is disabled or not configured.");
 let response:Response;
 try{
  response=await fetch("https://api.stripe.com/v1/account",{
   method:"GET",
   headers:{Authorization:"Bearer "+process.env.STRIPE_LIVE_SECRET_KEY},
   cache:"no-store",redirect:"error",signal:AbortSignal.timeout(12000)
  });
 }catch{throw new LiveStripeError(502,"UNREACHABLE","Stripe could not be reached.");}
 if(!response.ok){
  throw new LiveStripeError(response.status===401?503:502,"KEY_REJECTED","Stripe rejected the live credentials or the account is not accessible.");
 }
 let raw:unknown;
 try{raw=await response.json();}catch{throw new LiveStripeError(502,"INVALID_RESPONSE","Stripe returned an invalid account response.");}
 if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new LiveStripeError(502,"INVALID_RESPONSE","Stripe returned an invalid account response.");
 const account=raw as Record<string,unknown>;
 if(account.id!==EXPECTED_ACCOUNT){
  throw new LiveStripeError(409,"ACCOUNT_MISMATCH","This key belongs to a different Stripe account. No changes were made.");
 }
 const settings=(account.settings||{}) as Record<string,unknown>;
 const dashboard=(settings.dashboard||{}) as Record<string,unknown>;
 const payments=(settings.payments||{}) as Record<string,unknown>;
 const safe=(v:unknown,max=100)=>typeof v==="string"?v.slice(0,max):null;
 return {
  accountId:EXPECTED_ACCOUNT,
  displayName:safe(dashboard.display_name),
  statementDescriptor:safe(payments.statement_descriptor),
  country:safe(account.country,2),
  defaultCurrency:safe(account.default_currency,3),
  chargesEnabled:account.charges_enabled===true,
  payoutsEnabled:account.payouts_enabled===true
 };
}
