"use client";
import {useState} from "react";
import Link from "next/link";
import {useCart} from "@/components/CartProvider";
import {ArrowIcon} from "@/components/ArrowIcon";

export default function CartQuoteRequest(){
 const {account,items,hydrated}=useCart();
 const chosen=items.filter(item=>item.selected!==false);
 const quantityValid=chosen.every(item=>Number.isInteger(item.quantity)&&item.quantity>=1&&item.quantity<=99);
 const eligible=hydrated&&chosen.length>=1&&chosen.length<=5&&quantityValid;
 const [postcode,setPostcode]=useState("");
 const [notes,setNotes]=useState("");
 const [agreed,setAgreed]=useState(false);
 const [working,setWorking]=useState(false);
 const [error,setError]=useState("");
 const [reference,setReference]=useState("");
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!eligible||working||!agreed||account.status!=="authenticated")return;
  setWorking(true);setError("");setReference("");
  try{
   const response=await fetch("/api/account/quotes",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     deliveryCountry:"GB",postcode:postcode.trim(),notes:notes.trim(),
     lines:chosen.map(item=>({
      title:item.title,marketplaceUrl:item.marketplaceUrl,
      skuCode:item.skuCode||null,variant:item.variant||null,quantity:item.quantity
     }))
    })
   });
   const data=await response.json();
   if(!response.ok)throw Error(typeof data.error==="string"?data.error:"Could not save your quote request.");
   if(typeof data.id!=="string")throw Error("The quote reference was not returned.");
   setReference(data.id);
  }catch(e){setError(e instanceof Error?e.message:"Quote request unavailable.");}
  finally{setWorking(false);}
 }
 return <section className="hc-wh-cart-request" aria-labelledby="hc-wh-cart-request-title">
  <p className="sc-kicker">OPTIONAL / NO PAYMENT</p>
  <h2 id="hc-wh-cart-request-title">Request a free review of your items.</h2>
  <p>Send up to five selected product options to Herocon for a manual UK sourcing quote. This does not buy products or book warehouse space.</p>
  {account.status!=="authenticated"?<p><Link href="/account?next=%2Fcart">Sign in to request a quote <ArrowIcon/></Link></p>:
   reference?<div className="hc-wh-cart-confirmation" role="status">
    <strong>Request saved.</strong>
    <p>Reference: {reference}. We have not charged you or submitted an order.</p>
    <Link href="/warehouse">View your request in Warehouse <ArrowIcon/></Link>
    <button type="button" onClick={()=>setReference("")}>Request another review</button>
   </div>:<form onSubmit={submit}>
    <p className="hc-wh-muted">{chosen.length} selected product {chosen.length===1?"option":"options"}. {chosen.length>5?"Select no more than five.":!quantityValid?"Limit each quantity to 99.":chosen.length===0?"Select at least one item.":""}</p>
    <label htmlFor="hc-wh-postcode">UK delivery postcode</label>
    <input id="hc-wh-postcode" value={postcode} onChange={e=>setPostcode(e.target.value.toUpperCase())} placeholder="SW1A 1AA" maxLength={12} required autoComplete="postal-code"/>
    <label htmlFor="hc-wh-notes">Additional details (optional)</label>
    <textarea id="hc-wh-notes" rows={3} maxLength={420} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any sourcing or delivery questions?"/>
    <label className="hc-wh-consent"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/><span>I understand this is a free request only. Product procurement and international delivery are not included; a separate quote and explicit payment authorisation would be required.</span></label>
    {error&&<p className="hc-shipping-error" role="alert">{error}</p>}
    <button type="submit" disabled={!eligible||!agreed||working}>{working?"Saving your request…":"Send free quote request"}</button>
    <small>Up to three distinct requests per customer per 24 hours. No HIOBuy account or subscription is needed.</small>
   </form>}
 </section>;
}
