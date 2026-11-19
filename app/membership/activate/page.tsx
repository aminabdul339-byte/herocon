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
   <h1>Your membership.<br/><em>£9.99/month.</em></h1>
   <p>Membership gives you full sourcing access when purchasing products. Browsing and adding to cart are free.</p>
   <div className="hc-member-purchase-card">
    <span>FULL SOURCING ACCESS</span>
    <strong>£9.99 <small>/ month</small></strong>
    {account.status==="checking"||loading?<p>Checking your account and membership…</p>:
     account.status!=="authenticated"?<>
      <p>Sign in or create a free account to continue.</p>
      <Link className="hc-account-primary-link" href={"/account?next="+encodeURIComponent("/membership/activate?next="+encodeURIComponent(next))}>Create free account / Sign in →</Link>
     </>:active?<><p>Membership active.</p><Link className="hc-account-primary-link" href={next}>Return to purchase review →</Link></>:<>
      <p>{ready?"An active membership is required to purchase products.":"Membership checkout is currently unavailable."}</p>
      <p className="hc-member-purchase-caution">Products and international shipping are charged separately from membership.</p>
      <Link className="hc-account-primary-link" href="/cart">Return to cart →</Link>
     </>}
   </div>
  </section>
 </main>;
}
export default function MembershipActivationPage(){
 return <Suspense fallback={<main className="hc-account-page"><Header/><p>Checking purchase access…</p></main>}><MembershipGate/></Suspense>;
}
