"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import Header from "@/components/Header";
import {useCart} from "@/components/CartProvider";
type Row={id:string;createdAt:string;postcode:string;status:"received";lines:{title:string;quantity:number;variant:string|null}[]};
export default function QuoteRequestsPage(){
 const {account}=useCart();
 const [items,setItems]=useState<Row[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{
  if(account.status==="checking")return;
  if(account.status!=="authenticated"){setLoading(false);return;}
  let alive=true;
  fetch("/api/quote-requests",{credentials:"same-origin",cache:"no-store"})
   .then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||"Requests are unavailable.");return d;})
   .then(d=>{if(alive){setItems(Array.isArray(d.requests)?d.requests:[]);setLoading(false);}})
   .catch(e=>{if(alive){setError(e instanceof Error?e.message:"Could not load requests.");setLoading(false);}});
  return ()=>{alive=false;};
 },[account.status,account.id]);
 return <main className="hc-account-page"><Header/><section className="hc-member-purchase-shell">
  <p className="hc-premium-kicker">HEROCON / ACCOUNT</p><h1>Your quote <em>requests.</em></h1>
  <p>Requests are free to submit. An enquiry is not an order and no payment has been taken. Product ordering and shipping checkout are not yet live.</p>
  {account.status==="guest"?<Link className="hc-account-primary-link" href="/account?next=%2Faccount%2Fquotes">Sign in to view requests ↗</Link>:
  account.status==="unavailable"?<p>Account service is unavailable.</p>:loading?<p>Loading your requests…</p>:error?<p role="alert">{error}</p>:
  items.length===0?<p>No quote requests yet. Select products in the cart to request a quote.</p>:
  <div>{items.map(item=><article key={item.id} style={{background:"#fff",padding:24,margin:"16px 0",border:"1px solid #d8e3d4"}}>
   <strong>Request received · {new Date(item.createdAt).toLocaleString("en-GB",{timeZone:"Europe/London"})}</strong>
   <p style={{fontSize:12,color:"#607263"}}>Reference: {item.id} · Delivery postcode: {item.postcode}</p>
   <ul>{item.lines.map((l,i)=><li key={i}>{l.quantity} × {l.title}{l.variant?" — "+l.variant:""}</li>)}</ul>
   <p style={{fontSize:12}}>Awaiting merchant review. No final GBP price, shipping payment or supplier purchase has been approved.</p>
  </article>)}</div>}
  <Link href="/cart" className="hc-account-primary-link">Return to cart ↗</Link>
 </section></main>;
}
