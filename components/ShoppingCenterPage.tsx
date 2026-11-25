"use client";
import Link from "next/link";
import {Suspense} from "react";
import {useSearchParams} from "next/navigation";
import {useCart} from "@/components/CartProvider";
import OwnerTestOrders from "@/components/OwnerTestOrders";
import type {ShoppingSection} from "@/lib/shopping-center-stage";
const copy={orders:{word:"orders",description:"Follow your purchases as they make their way to our warehouse.",empty:"No purchases yet",message:"Your paid products will appear here until they arrive at the warehouse.",href:"/cart",action:"View your cart"},warehouse:{word:"warehouse",description:"Review received products and arrange international shipping.",empty:"No items in your warehouse",message:"Items will appear here once warehouse arrival is confirmed.",href:"/orders",action:"View your orders"},parcels:{word:"parcels",description:"Track your paid international shipments, from dispatch to delivery.",empty:"No parcels yet",message:"Your parcels will appear here once international shipping has been paid.",href:"/warehouse",action:"View your warehouse"}} as const;
function CenterContent({section,children}:{section:ShoppingSection;children?:React.ReactNode}){
 const {account}=useCart();const c=copy[section];const params=useSearchParams();const testMode=account.status==="authenticated"&&account.ownerPremium===true&&params.get("test")==="1";
 return <div className="hc-center-body"><section className="hc-center-hero"><p className="sc-kicker">YOUR SHOPPING ACCOUNT</p><h1>Your <em>{c.word}.</em></h1><p>{c.description}</p></section>
 {account.status==="checking"?<section className="hc-center-panel"><p>Loading your account…</p></section>:account.status==="unavailable"?<section className="hc-center-panel"><h2>Account unavailable</h2><p>Please try again shortly.</p></section>:testMode?<section className="hc-owner-order"><p className="hc-center-test-exit"><Link href={"/"+section}>Exit test workspace</Link></p><OwnerTestOrders key={account.id} section={section}/></section>:<section className="hc-center-panel hc-center-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/></svg><div><h2>{account.status==="guest"?"Sign in to view your "+c.word:c.empty}</h2><p>{account.status==="guest"?"Access your personal shopping account.":c.message+" Online purchasing is not yet available."}</p><Link href={account.status==="guest"?"/account?next=/"+section:c.href}>{account.status==="guest"?"Sign in":c.action}</Link></div></section>}
 {children}</div>;
}

export default function ShoppingCenterPage(props:{section:ShoppingSection;children?:React.ReactNode}){return <Suspense fallback={<div className="hc-center-body"><section className="hc-center-panel"><p>Loading your account…</p></section></div>}><CenterContent {...props}/></Suspense>;}
