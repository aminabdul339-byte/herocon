"use client";
import {Suspense,useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import {useCart} from "@/components/CartProvider";

type State={
 membershipActive?:boolean;testMembershipActive?:boolean;billingReady?:boolean;
 canSubscribe?:boolean;mode?:"test"|"live";status?:string;renewalAt?:string|null;
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
 useEffect(()=>{
  if(account.status!=="authenticated"){setLoading(false);return;}
  let alive=true;
  setLoading(true);
  fetch("/api/account/membership",{cache:"no-store",credentials:"same-origin"})
   .then(async response=>response.ok?response.json():null)
   .then(data=>{if(alive){setMembership(data||{});setLoading(false);}})
   .catch(()=>{if(alive){setLoading(false);setError("Unable to check membership.");}});
  return ()=>{alive=false;};
 },[account.status,account.id]);
 async function launch(kind:"checkout"|"portal"){
  if(working)return;
  setWorking(true);setError("");
  try{
   const response=await fetch("/api/membership/"+kind,{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:"{}",cache:"no-store"
   });
   const result=await response.json() as {url?:string;error?:string};
   if(!response.ok)throw Error(result.error||"Stripe Billing is unavailable.");
   if(!result.url||!(kind==="checkout"?result.url.startsWith("https://checkout.stripe.com/"):result.url.startsWith("https://billing.stripe.com/")))
    throw Error("Invalid Stripe billing link.");
   window.location.assign(result.url);
  }catch(e){setError(e instanceof Error?e.message:"Unable to open Stripe Billing.");setWorking(false);}
 }
 const active=Boolean(membership.membershipActive||membership.testMembershipActive);
 const isTest=membership.mode==="test";
 const through=membership.renewalAt?new Date(membership.renewalAt).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}):null;
 return <main className="hc-account-page">
  <Header/>
  <section className="hc-member-purchase-shell">
   <p className="hc-premium-kicker">HEROCON MEMBERSHIP</p>
   <h1>Full sourcing access.<br/><em>£9.99/month.</em></h1>
   <p>Access 1688, Taobao, Weidian and other Chinese marketplaces. Your account and cart are free. Membership is required when you purchase products.</p>
   <div className="hc-member-purchase-card">
    <span>MONTHLY MEMBERSHIP</span>
    <strong>£9.99 <small>/ month</small></strong>
    {account.status==="checking"||loading?<p>Checking membership…</p>:
     account.status!=="authenticated"?<>
      <p>Create a free account or sign in to continue.</p>
      <Link className="hc-account-primary-link" href={"/account?next="+encodeURIComponent("/membership/activate?next="+encodeURIComponent(next))}>Sign in / Create an account →</Link>
     </>:active?<>
      <p><strong>{isTest?"Test membership active":"Membership active"}</strong>{through?" · Paid through "+through:""}{membership.cancelAtPeriodEnd?" · Cancels at period end.":""}</p>
      {isTest?<p>Stripe test mode. No real payment has been made, and product purchases remain locked.</p>:
       <Link className="hc-account-primary-link" href={next}>Continue to checkout →</Link>}
      <button className="hc-member-billing-button" type="button" disabled={working} onClick={()=>launch("portal")}>Manage billing and cancellation ↗</button>
     </>:<>
      <p>£9.99 billed monthly. Products and international shipping are paid separately.</p>
      {membership.billingReady&&membership.canSubscribe?
       <>
        {isTest&&<p style={{color:"#a36632"}}>Stripe test mode — no real money will be charged.</p>}
        <button type="button" className="hc-account-primary-link hc-member-billing-button" disabled={working}
         onClick={()=>launch("checkout")}>{working?"Opening Stripe…":isTest?"Try membership in Stripe Test Mode":"Subscribe for £9.99/month →"}</button>
       </>:
       <p>Membership payments are currently unavailable.</p>}
      {membership.hasBillingAccount&&<button className="hc-member-billing-button" type="button" disabled={working} onClick={()=>launch("portal")}>Manage existing billing →</button>}
      <Link className="hc-membership-secondary" href="/cart">Return to cart →</Link>
     </>}
    {error&&<p role="alert" style={{color:"#a14235"}}>{error}</p>}
   </div>
   <p>Manage or cancel your membership through Stripe. Existing orders and their delivery payments remain accessible after cancellation.</p>
  </section>
 </main>;
}
export default function MembershipActivationPage(){
 return <Suspense fallback={<main className="hc-account-page"><Header/><p>Loading membership…</p></main>}><MembershipGate/></Suspense>;
}
