"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useCart} from "@/components/CartProvider";
import {ArrowIcon} from "@/components/ArrowIcon";

type QuoteSummary={
 id:string;createdAt:string;reviewState:"received"|"reviewing"|"needs_details"|"closed";
 reviewNote:string;reviewedAt:string|null;itemCount:number;unitCount:number;
 paymentStatus:"no_payment_requested";
};
const steps=[
 {step:"01",title:"Purchase",description:"A confirmed purchase must be made through an authorised supplier partner."},
 {step:"02",title:"Warehouse",description:"Arrival, weights and inspection results appear only after the partner reports them."},
 {step:"03",title:"Shipping",description:"Packed freight must be quoted and paid separately before dispatch."},
 {step:"04",title:"Delivery",description:"Tracking appears when the carrier or fulfilment partner provides it."}
];
const reviewLabels:Record<QuoteSummary["reviewState"],string>={
 received:"Request received",reviewing:"Under review",needs_details:"More details needed",closed:"Review closed"
};
const date=(value:string)=>{const d=new Date(value);return Number.isNaN(d.getTime())?"Date unavailable":d.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});};
export default function WarehouseHub(){
 const {account}=useCart();
 const [quotes,setQuotes]=useState<QuoteSummary[]>([]);
 const [state,setState]=useState<"idle"|"loading"|"ready"|"error">("idle");
 const [error,setError]=useState("");
 useEffect(()=>{
  if(account.status!=="authenticated"||!account.id){setQuotes([]);setState("idle");return;}
  const controller=new AbortController();
  setState("loading");setError("");
  fetch("/api/account/quotes",{credentials:"same-origin",cache:"no-store",signal:controller.signal})
   .then(async r=>{const data=await r.json();if(!r.ok)throw Error(typeof data.error==="string"?data.error:"Quote history unavailable.");return data;})
   .then(data=>{if(!controller.signal.aborted){setQuotes(Array.isArray(data.requests)?data.requests:[]);setState("ready");}})
   .catch(e=>{if(!controller.signal.aborted){setError(e instanceof Error?e.message:"Quote history unavailable.");setState("error");}});
  return ()=>controller.abort();
 },[account.status,account.id]);
 return <>
  <section className="hc-wh-timeline" aria-label="How a Herocon shipment works">
   {steps.map(s=><article key={s.step}><span>{s.step}</span><h2>{s.title}</h2><p>{s.description}</p></article>)}
  </section>
  <section className="hc-wh-section" aria-labelledby="hc-wh-heading">
   <div className="hc-wh-section-heading"><div><p className="sc-kicker">YOUR OPERATIONS CENTRE</p><h2 id="hc-wh-heading">Everything in <em>one place.</em></h2></div><span className="hc-wh-stage">Planning tools are free</span></div>
   <div className="hc-wh-tiles">
    <Link href="/orders"><span>ORDER STATUS</span><h3>Track a confirmed Herocon order</h3><p>Look up provider-reported purchases, warehouse updates and delivery events with your private reference and access code.</p><b>Open tracking <ArrowIcon/></b></Link>
    <Link href="/warehouse/consolidate"><span>PARCEL PLANNING</span><h3>Plan a consolidated shipment</h3><p>Combine manually entered parcel weights into a planning summary. Nothing is submitted to a warehouse.</p><b>Open planner <ArrowIcon/></b></Link>
    <Link href="/landed-cost"><span>FREIGHT ESTIMATES</span><h3>Compare shipping routes</h3><p>Use the existing Herocon calculator. Partner quotes are fetched only when you explicitly request them.</p><b>Estimate shipping <ArrowIcon/></b></Link>
    <Link href="/cart"><span>PRODUCTS</span><h3>Your saved cart</h3><p>Review selected products and quantities. Browsing and cart planning do not create supplier orders.</p><b>View cart <ArrowIcon/></b></Link>
   </div>
  </section>
  <section className="hc-wh-section hc-wh-history" aria-labelledby="hc-wh-history-heading">
   <div className="hc-wh-section-heading"><div><p className="sc-kicker">YOUR ACTIVITY</p><h2 id="hc-wh-history-heading">Quote requests.</h2></div></div>
   {account.status==="authenticated"?<>
    {state==="loading"&&<p role="status" className="hc-wh-muted">Loading your saved requests…</p>}
    {state==="error"&&<p role="status" className="hc-wh-muted">{error} Your stored requests have not been changed.</p>}
    {state==="ready"&&quotes.length===0&&<div className="hc-wh-empty"><h3>No quote requests yet.</h3><p>Once you submit a free quote request from your cart, its review status will appear here. This is not a warehouse parcel list.</p><Link href="/cart">View your cart <ArrowIcon/></Link></div>}
    {state==="ready"&&quotes.length>0&&<div className="hc-wh-requests">{quotes.map(q=><article key={q.id} className="hc-wh-request">
     <div><p className="hc-wh-small">Requested {date(q.createdAt)}</p><h3>{q.itemCount} product {q.itemCount===1?"option":"options"} · {q.unitCount} {q.unitCount===1?"unit":"units"}</h3><p className="hc-wh-small">Reference {q.id}</p>{q.reviewNote&&<p className="hc-wh-note">{q.reviewNote}</p>}</div>
     <div className="hc-wh-request-status"><strong>{reviewLabels[q.reviewState]||"Request received"}</strong><small>No payment requested</small></div>
    </article>)}</div>}
   </>:account.status==="checking"?<p className="hc-wh-muted">Checking your account…</p>:
    <div className="hc-wh-empty"><h3>Your requests are private.</h3><p>Sign in to see your own saved quote requests. No warehouse account or subscription is required to use the planning tools.</p><Link href="/account?next=%2Fwarehouse">Sign in to your free account <ArrowIcon/></Link></div>}
  </section>
  <section className="hc-wh-availability">
   <div><p className="sc-kicker">WAREHOUSE AND QC</p><h2>Verified information only.</h2><p>Individual QC photographs, supplier parcel receipts, confirmed packed weights and final shipping invoices will be displayed only when Herocon has authorised order-level data from its fulfilment partner. We never generate sample statuses for actual customer orders.</p></div>
   <div className="hc-wh-availability-grid">
    <p><strong>QC gallery</strong><span>Awaiting authorised provider photos</span></p>
    <p><strong>Consolidation</strong><span>Planning only; warehouse execution unavailable</span></p>
    <p><strong>Shipping payment</strong><span>Not available until final quote and checkout are verified</span></p>
   </div>
  </section>
 </>;
}
