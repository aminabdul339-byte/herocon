"use client";
import {ArrowIcon} from "@/components/ArrowIcon";
import {Suspense,useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import "@/components/membership-plans.css";
import {useCart} from "@/components/CartProvider";

type State={
 complimentaryOwnerPremium?:boolean;ownerBuyAccess?:boolean;paidMembershipActive?:boolean;billingLookupUnavailable?:boolean;
 membershipActive?:boolean;testMembershipActive?:boolean;billingReady?:boolean;
 canSubscribe?:boolean;ownerLiveTest?:boolean;mode?:"test"|"live";status?:string;renewalAt?:string|null;
 cancelAtPeriodEnd?:boolean;hasBillingAccount?:boolean;
};
function safeNext(value:string|null){
 return value&&value.startsWith("/")&&!value.startsWith("//")&&!/[\\\r\n]/.test(value)&&value.length<280?value:"/cart?checkout=1";
}
function MembershipGate(){
 const params=useSearchParams();
 const next=safeNext(params.get("next"));
 const {account}=useCart();
 const [loading,setLoading]=useState(true),[working,setWorking]=useState(false);
 const [membership,setMembership]=useState<State>({});
 const [error,setError]=useState("");
 const [consents,setConsents]=useState(false);
 useEffect(()=>{
  if(account.status!=="authenticated"){setLoading(false);return;}
  let alive=true;
  setLoading(true);setError("");setMembership({});
  fetch("/api/account/membership",{cache:"no-store",credentials:"same-origin"})
   .then(async response=>response.ok?response.json():Promise.reject(new Error("Unable to verify membership.")))
   .then(data=>{if(alive){setMembership(data||{});setLoading(false);}})
   .catch(()=>{if(alive){setLoading(false);setError("Unable to check membership.");}});
  return ()=>{alive=false;};
 },[account.status,account.id]);
 async function launch(kind:"checkout"|"portal"){
  if(working)return;
  if(kind==="checkout"&&!consents){setError("Please confirm the monthly billing terms before continuing.");return;}
  setWorking(true);setError("");
  try{
   const response=await fetch("/api/membership/"+kind,{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(kind==="checkout"?{recurringBillingAcknowledged:consents}:{}),cache:"no-store"
   });
   const result=await response.json() as {url?:string;error?:string};
   if(!response.ok)throw Error(result.error||"Stripe Billing is unavailable.");
   if(!result.url||!(kind==="checkout"?result.url.startsWith("https://checkout.stripe.com/"):result.url.startsWith("https://billing.stripe.com/")))
    throw Error("Invalid Stripe billing link.");
   window.location.assign(result.url);
  }catch(e){setError(e instanceof Error?e.message:"Unable to open Stripe Billing.");setWorking(false);}
 }
 const active=Boolean(membership.membershipActive||membership.testMembershipActive);
 const trialActive=!!account.trialEndsAt&&Date.parse(account.trialEndsAt)>Date.now();
 const isTest=membership.mode==="test";
 const through=membership.renewalAt?new Date(membership.renewalAt).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}):null;
 const owner=Boolean(membership.complimentaryOwnerPremium);
 const checking=account.status==="checking"||loading;
 const signedIn=account.status==="authenticated";
 const button=(label:string,kind:"checkout"|"portal",primary=true)=><button type="button" className={"hc-billing-action"+(primary?" hc-billing-primary":"")} disabled={working||(kind==="checkout"&&!consents)} onClick={()=>void launch(kind)}>{working?"Opening Stripe…":label}<ArrowIcon direction="right"/></button>;
 return <main className="hc-member-page hc-membership-clean">
  <Header/>
  <section className="hc-billing-shell" aria-labelledby="hc-billing-title">
   <Link href="/membership" className="hc-billing-back"><ArrowIcon direction="left"/> Membership plans</Link>
   <header className="hc-billing-heading"><h1 id="hc-billing-title">{owner||active?"Your membership":"Join Premium"}</h1><p>{owner||active?"Manage your access and billing.":"Full catalogue access and sourcing tools."}</p></header>
   <div className="hc-billing-card">
    <div className="hc-billing-top"><div><h2>Herocon Premium</h2><p>{owner?"Complimentary owner access":active?isTest?"Test membership":"Active subscription":"Monthly membership"}</p></div><div className="hc-billing-price"><strong>{owner?"£0":"£9.99"}</strong>{!owner&&<small> / month</small>}</div></div>
    {checking?<p role="status" className="hc-billing-status">Checking membership…</p>:!signedIn?<><p>Create a free account or sign in to continue.</p><Link className="hc-billing-action hc-billing-primary" href={"/account?next="+encodeURIComponent("/membership/activate?next="+encodeURIComponent(next))}>Sign in or create an account <ArrowIcon direction="right"/></Link></>:owner?<>
      <div className="hc-billing-facts"><span>Access</span><strong>Premium · Complimentary</strong><span>Recurring charge</span><strong>None for owner access</strong></div>
      <p>No paid subscription is needed while your owner account is authorised.</p>
      {membership.paidMembershipActive&&<p className="hc-billing-warning">You also have an existing paid subscription. It may renew until cancelled separately.</p>}
      {membership.billingLookupUnavailable&&<p className="hc-billing-warning">Previous billing could not be verified. Check Stripe if you have paid for membership before.</p>}
      <Link className="hc-billing-action hc-billing-primary" href="/search">Browse the catalogue <ArrowIcon direction="right"/></Link>
      <Link className="hc-billing-action" href="/pilot/buckydrop">Private purchasing test <ArrowIcon direction="right"/></Link>
      {membership.hasBillingAccount&&button("Manage existing billing","portal",false)}
     </>:active?<>
      <div className="hc-billing-facts"><span>Status</span><strong>{isTest?"Test mode":"Active"}</strong>{through&&<><span>{membership.cancelAtPeriodEnd?"Access ends":"Paid through"}</span><strong>{through}</strong></>}{membership.cancelAtPeriodEnd&&<><span>Renewal</span><strong>Cancelled at period end</strong></>}</div>
      {isTest&&<p className="hc-billing-warning">No real payment has been made in Stripe test mode.</p>}
      <Link className="hc-billing-action hc-billing-primary" href="/search">Browse the catalogue <ArrowIcon direction="right"/></Link>
      {button("Manage billing or cancel","portal",false)}
     </>:<>
      {trialActive&&<p>Your existing promotional access remains active until {new Date(account.trialEndsAt!).toLocaleDateString("en-GB",{timeZone:"Europe/London"})}. No automatic renewal. <Link href="/account">View account</Link>.</p>}<ul className="hc-billing-benefits">{["Full Herocon catalogue","Unlimited internal catalogue search","Unlimited saved marketplace link lookups","Up to 50 new live requests per month, subject to availability","Full supplier and product details"].map(label=><li key={label}><svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg>{label}</li>)}</ul>
      <p className="hc-billing-rollout"><strong>In rollout</strong> Product purchasing and international shipping are not yet available to public customers. Live 1688 searches include up to 50 new requests per UTC calendar month, subject to shared availability. Product and delivery charges will be separate.</p>
      {membership.ownerLiveTest&&<p className="hc-billing-warning">Owner-only live billing test: £9.99 is charged now and renews monthly until cancelled. Product ordering and shipping are not enabled.</p>}
      {membership.billingReady&&membership.canSubscribe?<>
        {isTest&&<p className="hc-billing-warning">Stripe test mode — no real money will be charged.</p>}
        <label className="hc-billing-consent"><input type="checkbox" checked={consents} onChange={e=>setConsents(e.target.checked)}/><span>I agree to £9.99 today and every month until I cancel. I understand that product ordering and shipping are not yet available, and have reviewed the <Link href="/terms-and-conditions">Terms</Link> and <Link href="/privacy-policy">Privacy Policy</Link>.</span></label>
        {button(isTest?"Try Stripe test membership":"Subscribe for £9.99/month","checkout")}
        <p className="hc-billing-fine">Cancel through Stripe. Access continues until the end of the paid period, with no further monthly payment. Cancellation does not automatically refund unused time; statutory cancellation and refund rights are unaffected.</p>
       </>:<p className="hc-billing-status">Membership payments are currently unavailable.</p>}
      {membership.hasBillingAccount&&button("Manage existing billing","portal",false)}
     </>}
    {error&&<p role="alert" className="hc-billing-warning">{error}</p>}
   </div>
   {!owner&&active&&!isTest&&<p className="hc-billing-fine">Product ordering and international shipping payments are not yet available.</p>}
   <p className="hc-billing-footer"><Link href="/membership">Compare plans</Link><span aria-hidden="true">·</span><Link href="/account">My account</Link></p>
  </section>
 </main>;
}
export default function MembershipActivationPage(){
 return <Suspense fallback={<main className="hc-member-page hc-membership-clean"><Header/><section className="hc-billing-shell"><p role="status">Loading membership…</p></section></main>}><MembershipGate/></Suspense>;
}
