"use client";
import {useState} from "react";
import Link from "next/link";
import Header from "@/components/Header";

type Status={
 partnerOrderNo:string;shopOrderNo:string|null;submittedAt:string;localState:string;
 message:string|null;salesStatus:string|null;
 purchaseOrders:{reference:string|null;status:string}[];
 parcels:{packageCode:string;parcelStatus:string|null;trackingStatus:string|null;carrier:string|null;trackingNumber:string|null;events:{description:string;location:string}[]}[];
 warehouse?:{
  stage:"awaiting_provider_update"|"supplier_procurement"|"arriving_at_warehouse"|"warehouse_arrival_reported"|"international_dispatched";
  arrivalReported:boolean;arrivalVerifiedForShipping:boolean;
  qcInspection:"not_connected";qcPhotos:string[];
  finalShippingQuote:"not_available";shippingPaymentEnabled:boolean;note:string;
 };
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
  <section className="sc-page-hero sc-container"><p className="sc-kicker">ORDER UPDATES</p><h1>Follow your <em>order.</em></h1><p>Follow sourcing and warehouse progress, then review quality-check photos and a separate international shipping invoice when those features become available. Tracking requires a Herocon order reference and private access code.</p></section>
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
    <section style={{margin:"26px 0",border:"1px solid #dbe8dc",borderRadius:12,padding:"20px 22px",background:"#f9fcf8"}}>
     <h3 style={{marginTop:0}}>Warehouse, QC & delivery payments</h3>
     <p style={{fontSize:13,color:"#617a66",lineHeight:1.7}}>Herocon is preparing a two-stage purchase journey. Product payment and international delivery will be separate. No second charge is possible unless an independently verified final freight quote has been approved and the customer explicitly pays it.</p>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
      {[
       {title:"1. Supplier purchase",status:status.purchaseOrders.length>0?"BuckyDrop has reported purchasing progress":"Awaiting supplier status"},
       {title:"2. Warehouse arrival",status:status.warehouse?.arrivalReported?"Arrival reported by supplier":"Not confirmed"},
       {title:"3. QC photos",status:"Not available through the current integration"},
       {title:"4. International shipping",status:"Final delivery quote not available; payment closed"},
       {title:"5. Dispatch",status:status.warehouse?.stage==="international_dispatched"?"A parcel has been reported as dispatched":"Not reported"}
      ].map(entry=><div key={entry.title} style={{padding:14,borderRadius:8,background:"#fff",border:"1px solid #e0e8dd"}}>
       <strong style={{fontSize:13,display:"block",marginBottom:8}}>{entry.title}</strong>
       <span style={{fontSize:12,color:"#5d7663",lineHeight:1.5}}>{entry.status}</span>
      </div>)}
     </div>
     {status.warehouse?.note&&<p style={{fontSize:12,color:"#617a66",lineHeight:1.7}}>{status.warehouse.note}</p>}
     <div style={{padding:"16px 18px",background:"#edf3ea",borderRadius:8,marginTop:16}}>
      <strong>Shipping payment: not available yet</strong>
      <p style={{fontSize:13,marginBottom:0}}>Once verified warehouse dimensions, eligible carrier services, final delivery cost and customer billing are integrated, the confirmed GBP shipping invoice will appear here. Herocon will not take a shipping payment based solely on a provisional estimator.</p>
     </div>
    </section>
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
  <section className="sc-resource-note sc-container">Live ordering and separate shipping payments are not active yet. Supplier warehouse milestones come from BuckyDrop status reports; QC photos, a verified final shipping invoice and online freight payment are still awaiting integration. Existing carts are not paid orders. For items bought through a different agent, contact that agent.</section>
  <div className="sc-container hc-order-footer"><Link href="/cart" className="sc-button sc-button-outline">View your cart ↗</Link></div>
 </main>;
}
