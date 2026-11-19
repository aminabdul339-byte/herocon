"use client";
import {useState} from "react";
import Link from "next/link";
import type {AccountStatus,CartItem} from "@/components/CartProvider";
type Props={items:CartItem[];account:AccountStatus};
export default function QuoteRequestForm({items,account}:Props){
 const [postcode,setPostcode]=useState(""),[notes,setNotes]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[saved,setSaved]=useState("");
 const lines=items.slice(0,5);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;
  if(items.length<1||items.length>5){setError("Select one to five product options.");return;}
  setError("");setBusy(true);setSaved("");
  try{
   const res=await fetch("/api/quote-requests",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({postcode,notes,deliveryCountry:"GB",
     lines:lines.map(x=>({title:x.title,marketplaceUrl:x.marketplaceUrl,
      skuCode:x.skuCode||"",variant:x.variant,quantity:x.quantity}))})
   });
   const data=await res.json() as {id?:string;error?:string};
   if(!res.ok||!data.id)throw Error(data.error||"Your request could not be recorded.");
   setSaved(data.id);
  }catch(e){setError(e instanceof Error?e.message:"Your request could not be saved.");}
  finally{setBusy(false);}
 }
 if(items.length===0)return <p>Tick the products you want before requesting a quote.</p>;
 if(items.length>5)return <p>Select up to five options for one request. Untick other products first.</p>;
 if(account.status==="checking")return <p>Checking your account…</p>;
 if(account.status==="unavailable")return <p>Account service is temporarily unavailable. Please contact support to request a quote.</p>;
 if(account.status!=="authenticated")return <Link className="sc-button sc-button-outline hc-cart-shop" href="/account?next=%2Fcart">Sign in free to request a quote ↗</Link>;
 return <form onSubmit={submit} style={{display:"grid",gap:12,marginTop:15}}>
  <label style={{display:"grid",gap:5,fontSize:12,fontWeight:700}}>UK delivery postcode
   <input value={postcode} onChange={e=>setPostcode(e.target.value)} required maxLength={12}
    autoComplete="postal-code" placeholder="SW1A 1AA" style={{border:"1px solid #b9cbbb",borderRadius:4,padding:"11px 12px",fontSize:14,background:"#fff",color:"#24402c"}}/>
  </label>
  <label style={{display:"grid",gap:5,fontSize:12,fontWeight:700}}>Notes or requirements (optional)
   <textarea value={notes} onChange={e=>setNotes(e.target.value)} maxLength={420} rows={3}
    placeholder="Size, colour, quantity or special requirements"
    style={{border:"1px solid #b9cbbb",borderRadius:4,padding:"11px 12px",fontSize:13,background:"#fff",color:"#24402c"}}/>
  </label>
  <button type="submit" className="sc-button sc-button-outline hc-cart-shop" disabled={busy}>
   {busy?"Saving request…":"Send quote request ↗"}
  </button>
  {error&&<p role="alert" style={{color:"#a14235",fontSize:12}}>{error}</p>}
  {saved&&<div role="status" style={{padding:12,background:"#ecf5e8",fontSize:12}}>
   <strong>Request saved successfully.</strong><p>Reference: {saved}. No money has been charged, and this is not an order.</p>
   <Link href="/account/quotes">View your requests ↗</Link>
  </div>}
  <Link href="/account/quotes" style={{fontSize:12}}>View previous quote requests ↗</Link>
  <p style={{fontSize:11,lineHeight:1.6}}>Requests are received for merchant review; no instant approval or reply time is guaranteed. The ordering and shipping payments are not available yet.</p>
 </form>;
}
