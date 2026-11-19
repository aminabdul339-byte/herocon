"use client";
import {useState} from "react";
export default function ApprovedCheckoutButton({quoteId,enabled}:{quoteId:string;enabled:boolean}){
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function start(){
  if(!enabled||busy)return;
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/checkout/start-session",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({quoteId}),cache:"no-store"
   });
   const data=await r.json();
   if(!r.ok||typeof data.url!=="string"||!data.url.startsWith("https://checkout.stripe.com/"))
    throw Error(typeof data.error==="string"?data.error:"Secure checkout is unavailable.");
   window.location.assign(data.url);
  }catch(e){setBusy(false);setError(e instanceof Error?e.message:"Checkout is not available.");}
 }
 return <div style={{marginTop:24}}>
  <button onClick={start} type="button" disabled={busy||!enabled}
   style={{width:"100%",background:enabled?"#234830":"#99ad9b",color:"#fff",border:0,padding:"18px 22px",fontWeight:750,fontSize:15,borderRadius:6,cursor:enabled?"pointer":"not-allowed"}}>
   {busy?"Preparing secure checkout…":enabled?"Pay securely with Stripe →":"Secure payment not yet activated"}
  </button>
  {error&&<p role="alert" style={{color:"#a34b37",fontSize:13}}>{error}</p>}
  {!enabled&&<p style={{fontSize:13,color:"#697a6b"}}>Herocon is finishing the required supplier, payment and business checks. Your quote is saved but no money can be taken yet.</p>}
 </div>;
}
