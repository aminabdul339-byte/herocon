"use client";
import {ArrowIcon} from "@/components/ArrowIcon";
import {useState} from "react";
export default function ApprovedCheckoutButton({quoteId,enabled}:{quoteId:string;enabled:boolean}){
 const [busy,setBusy]=useState(false);
 const [shippingAcknowledged,setShippingAcknowledged]=useState(false);
 const [error,setError]=useState("");
 async function start(){
  if(!enabled||busy||!shippingAcknowledged)return;
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/checkout/start-session",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({quoteId,shippingAcknowledged}),cache:"no-store"
   });
   const data=await r.json();
   if(!r.ok||typeof data.url!=="string"||!data.url.startsWith("https://checkout.stripe.com/"))
    throw Error(typeof data.error==="string"?data.error:"Secure checkout is unavailable.");
   window.location.assign(data.url);
  }catch(e){setBusy(false);setError(e instanceof Error?e.message:"Checkout is not available.");}
 }
 return <div style={{marginTop:24}}>
  <label style={{display:"flex",gap:12,alignItems:"start",fontSize:13,lineHeight:1.65,marginBottom:16}}>
   <input type="checkbox" checked={shippingAcknowledged} onChange={e=>setShippingAcknowledged(e.target.checked)} style={{marginTop:5}}/>
   <span>I understand this payment is for the products only. If the goods reach the warehouse, a separate international shipping charge will be quoted and must be paid before dispatch. The displayed shipping estimate is not guaranteed, and I have reviewed the cancellation and refund terms.</span>
  </label>
  <button onClick={start} type="button" disabled={busy||!enabled||!shippingAcknowledged}
   style={{width:"100%",background:enabled?"#234830":"#99ad9b",color:"#fff",border:0,padding:"18px 22px",fontWeight:750,fontSize:15,borderRadius:6,cursor:enabled?"pointer":"not-allowed"}}>
   {busy?"Preparing secure checkout…":enabled?<>Pay for products with Stripe <ArrowIcon direction="right"/></>:"Product payments not yet activated"}
  </button>
  {error&&<p role="alert" style={{color:"#a34b37",fontSize:13}}>{error}</p>}
  {!enabled&&<p style={{fontSize:13,color:"#697a6b"}}>Herocon is finishing the required supplier, payment and business checks. Your quote is saved but no money can be taken yet.</p>}
 </div>;
}
