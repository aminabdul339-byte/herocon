"use client";
import {useState} from "react";
import Link from "next/link";
import Header from "@/components/Header";

type Status={
 partnerOrderNo:string;shopOrderNo:string|null;submittedAt:string;localState:string;
 message:string|null;salesStatus:string|null;
 purchaseOrders:{reference:string|null;status:string}[];
 parcels:{packageCode:string;parcelStatus:string|null;trackingStatus:string|null;carrier:string|null;trackingNumber:string|null;events:{description:string;location:string}[]}[];
};
export default function OrdersPage(){
 const [reference,setReference]=useState("");
 const [accessCode,setAccessCode]=useState("");
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [status,setStatus]=useState<Status|null>(null);
 async function check(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(loading)return;setLoading(true);setError("");setStatus(null);
  try{
   const response=await fetch("/api/buckydrop/orders/status",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({partnerOrderNo:reference.trim(),accessCode:accessCode.trim()}),cache:"no-store"
   });
   const payload=await response.json();
   if(!response.ok)throw Error(typeof payload.error==="string"?payload.error:"We couldn't retrieve this order.");
   setStatus(payload as Status);
  }catch(e){setError(e instanceof Error?e.message:"Your order information could not be retrieved.");}
  finally{setLoading(false);}
 }
 return <main className="sc-guide-page"><Header/>
  <section className="sc-page-hero sc-container"><p className="sc-kicker">ORDER UPDATES</p><h1>Follow your <em>order.</em></h1><p>Once checkout launches, customers will be able to check sourcing progress, parcel details and delivery tracking securely with their Herocon order reference and private access code.</p></section>
  <section className="sc-section sc-container hc-order-check-wrap">
   <div className="hc-order-check-panel"><h2>Track an order</h2><p>Enter the details supplied with your Herocon order confirmation. This is for Herocon orders, not orders placed directly on external marketplace websites.</p>
    <form onSubmit={check} className="hc-order-form">
     <label htmlFor="hc-order-ref">Herocon order reference</label><input id="hc-order-ref" value={reference} onChange={e=>setReference(e.target.value)} placeholder="HC-…" maxLength={50} required autoComplete="off"/>
     <label htmlFor="hc-order-code">Private tracking access code</label><input id="hc-order-code" type="password" value={accessCode} onChange={e=>setAccessCode(e.target.value)} placeholder="Access code" maxLength={200} required autoComplete="off"/>
     <button type="submit" className="sc-button sc-button-dark" disabled={loading}>{loading?"Checking order…":"Check order status ↗"}</button>
    </form>
    {error&&<p className="hc-shipping-error" role="alert">{error}</p>}
   </div>
   {status&&<div className="hc-order-status-panel" aria-live="polite">
    <p className="sc-kicker">ORDER PROGRESS</p><h2>{status.partnerOrderNo}</h2>
    <p><strong>Order record:</strong> {status.localState==="accepted"?"Submitted to fulfilment partner":status.localState==="outcome_unknown"?"Awaiting submission verification":status.localState==="sending"?"Processing":status.localState}</p>
    {status.salesStatus&&<p><strong>Sales order:</strong> {status.salesStatus}</p>}
    {status.message&&<p>{status.message}</p>}
    {status.purchaseOrders.length>0&&<><h3>Purchase progress</h3>{status.purchaseOrders.map((po,i)=><p key={i}><strong>{po.reference||"Supplier purchase"}</strong>: {po.status}</p>)}</>}
    {status.parcels.length>0&&<><h3>Parcels & tracking</h3>{status.parcels.map(parcel=><article className="hc-order-parcel" key={parcel.packageCode}>
     <h4>Parcel {parcel.packageCode}</h4>
     <p><strong>Warehouse status:</strong> {parcel.parcelStatus||"Not reported"}</p>
     <p><strong>Delivery:</strong> {parcel.trackingStatus||"Tracking not available yet"}</p>
     {parcel.carrier&&<p><strong>Carrier:</strong> {parcel.carrier}</p>}
     {parcel.trackingNumber&&<p><strong>Tracking number:</strong> {parcel.trackingNumber}</p>}
     {parcel.events.length>0&&<div className="hc-order-events">{parcel.events.map((event,i)=><p key={i}>{event.description}{event.location&&" · "+event.location}</p>)}</div>}
    </article>)}</>}
    {!status.salesStatus&&!status.parcels.length&&<p>There are no additional provider updates for this order yet.</p>}
   </div>}
  </section>
  <section className="sc-resource-note sc-container">Order creation and online payment are not active on Herocon yet. Existing carts are not paid orders. If you ordered through another agent, use that agent&apos;s order-tracking service.</section>
  <div className="sc-container hc-order-footer"><Link href="/cart" className="sc-button sc-button-outline">View your cart ↗</Link></div>
 </main>;
}
