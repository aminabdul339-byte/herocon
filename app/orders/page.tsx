"use client";
import {ArrowIcon} from "@/components/ArrowIcon";
import {useState} from "react";
import Link from "next/link";
import Header from "@/components/Header";
import ShoppingCenterNav from "@/components/ShoppingCenterNav";
import FulfilmentPreview from "@/components/FulfilmentPreview";
import "../warehouse/warehouse.css";

type Status={
 partnerOrderNo:string;shopOrderNo:string|null;submittedAt:string;localState:string;shippingPrepaid?:boolean;
 message:string|null;salesStatus:string|null;
 purchaseOrders:{reference:string|null;status:string}[];
 parcels:{packageCode:string;parcelStatus:string|null;trackingStatus:string|null;carrier:string|null;trackingNumber:string|null;events:{description:string;location:string}[]}[];
 warehouse?:{
  stage:"awaiting_provider_update"|"supplier_procurement"|"arriving_at_warehouse"|"warehouse_arrival_reported"|"international_dispatched";
  arrivalReported:boolean;arrivalVerifiedForShipping:boolean;
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
 return <main className="sc-guide-page"><Header/><ShoppingCenterNav/><FulfilmentPreview view="orders"/>
  <section className="sc-container"><details><summary>Track an existing order with a reference and access code</summary><p>For existing Herocon pilot orders.</p>
  <section className="sc-section sc-container hc-order-check-wrap">
   <div className="hc-order-check-panel"><h2>Track an order</h2><p>Enter the details supplied with your Herocon order confirmation. This is for Herocon orders, not orders placed directly on external marketplace websites.</p>
    <form onSubmit={check} className="hc-order-form">
     <label htmlFor="hc-order-ref">Herocon order reference</label><input id="hc-order-ref" value={reference} onChange={e=>setReference(e.target.value)} placeholder="HC-…" maxLength={50} required autoComplete="off"/>
     <label htmlFor="hc-order-code">Private tracking access code</label><input id="hc-order-code" type="password" value={accessCode} onChange={e=>setAccessCode(e.target.value)} placeholder="Access code" maxLength={200} required autoComplete="off"/>
     <button type="submit" className="sc-button sc-button-dark" disabled={loading}>{loading?"Checking order…":<>Check order status <ArrowIcon/></>}</button>
    </form>
    {error&&<p className="hc-shipping-error" role="alert">{error}</p>}
   </div>
   {status&&<div className="hc-order-status-panel" aria-live="polite">
    <p className="sc-kicker">ORDER PROGRESS</p><h2>{status.partnerOrderNo}</h2>
    <p><strong>Order record:</strong> {status.localState==="accepted"?"Submitted to fulfilment partner":status.localState==="outcome_unknown"?"Awaiting submission verification":status.localState==="sending"?"Processing":status.localState}</p>
    {status.salesStatus&&<p><strong>Sales order:</strong> {status.salesStatus}</p>}
    <section style={{margin:"26px 0",border:"1px solid #dbe8dc",borderRadius:12,padding:"20px 22px",background:"#f9fcf8"}}>
     <h3 style={{marginTop:0}}>Order progress</h3>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
      {[
       {title:"01 / Purchase",value:status.purchaseOrders.length>0?"Purchase in progress":"Awaiting update"},
       {title:"02 / Warehouse",value:status.warehouse?.arrivalReported?"Received at warehouse":"Awaiting arrival"},
       {title:"03 / Shipping",value:status.shippingPrepaid?"Included in original payment":"Pay separately before dispatch"},
       {title:"04 / Delivery",value:status.warehouse?.stage==="international_dispatched"?"Dispatched":"Awaiting dispatch"}
      ].map(step=><div key={step.title} style={{padding:14,borderRadius:8,background:"#fff",border:"1px solid #e0e8dd"}}>
       <strong style={{fontSize:13,display:"block",marginBottom:8}}>{step.title}</strong>
       <span style={{fontSize:12,color:"#5d7663",lineHeight:1.5}}>{step.value}</span>
      </div>)}
     </div>
     <p style={{fontSize:12,color:"#617a66",marginTop:15}}>{status.shippingPrepaid?"Your approved Herocon payment includes international shipping. No second payment is due for this order.":"International shipping is quoted and paid separately. Online shipping payment is currently unavailable."}</p>
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
  </details></section>
  <div className="sc-container hc-order-footer"><Link href="/cart" className="sc-button sc-button-outline">View your cart <ArrowIcon/></Link></div>
 </main>;
}
