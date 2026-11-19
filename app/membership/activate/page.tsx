"use client";
import {Suspense,useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import {useCart} from "@/components/CartProvider";
function safeNext(value:string|null){
 return value&&value.startsWith("/")&&!value.startsWith("//")&&!/[\\\r\n]/.test(value)&&value.length<280?value:"/cart?checkout=1";
}
function MembershipGate(){
 const params=useSearchParams();
 const next=safeNext(params.get("next"));
 const {account}=useCart();
 const [loading,setLoading]=useState(true),[active,setActive]=useState(false),[ready,setReady]=useState(false);
 useEffect(()=>{
  if(account.status!=="authenticated"){setLoading(false);return;}
  let alive=true;
  fetch("/api/account/membership",{cache:"no-store"})
   .then(async response=>response.ok?response.json():null)
   .then(data=>{
    if(!alive)return;
    setActive(Boolean(data?.membershipActive));setReady(Boolean(data?.billingReady));setLoading(false);
   }).catch(()=>{if(alive)setLoading(false);});
  return ()=>{alive=false;};
 },[account.status,account.id]);
 return <main className="hc-account-page">
  <Header/>
  <section className="hc-member-purchase-shell">
   <p className="hc-premium-kicker">HEROCON / PURCHASE ACCESS</p>
   <h1>Ready to buy?<br/><em>Membership comes next.</em></h1>
   <p>Your free account and cart cost nothing. When you decide to make a new product purchase, Herocon will check whether you have an active membership. The planned price is £9.99 per month.</p>
   <div className="hc-member-purchase-card">
    <span>HEROCON MEMBERSHIP · PURCHASE STAGE ONLY</span>
    <strong>£9.99 <small>/ month</small></strong>
    {account.status==="checking"||loading?<p>Checking your account and membership…</p>:
     account.status!=="authenticated"?<>
      <p>Sign in or create a <strong>free account</strong> first. No membership payment is required to add products to your cart.</p>
      <Link className="hc-account-primary-link" href={"/account?next="+encodeURIComponent("/membership/activate?next="+encodeURIComponent(next))}>Create free account / Sign in →</Link>
     </>:active?<><p>Your paid membership is verified. You can return to your selection.</p><Link className="hc-account-primary-link" href={next}>Return to purchase review →</Link></>:<>
      <p>{ready?"Your account does not currently have a verified active membership.":"Membership payment is not available yet. We're preparing the secure £9.99/month Stripe subscription and customer account billing system."}</p>
      <p className="hc-member-purchase-caution">You will never be charged a membership fee simply for creating an account, browsing or adding items to your cart. Product purchases and international shipping are billed separately.</p>
      <Link className="hc-account-primary-link" href="/cart">Return to your free cart →</Link>
     </>}
   </div>
   <p>After membership activates in the future, customers will keep access to existing orders, warehouse QC, shipping invoices and refunds even if the membership ends.</p>
  </section>
 </main>;
}
export default function MembershipActivationPage(){
 return <Suspense fallback={<main className="hc-account-page"><Header/><p>Checking purchase access…</p></main>}><MembershipGate/></Suspense>;
}
