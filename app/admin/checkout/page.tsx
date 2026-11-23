"use client";
import {useState,type FormEvent} from "react";
import Link from "next/link";

type Result={error?:string;checkoutUrl?:string;totalGBP?:string;paymentEnabled?:boolean;id?:string};
export default function MerchantCheckoutQuotes(){
 const [secret,setSecret]=useState("");
 const [email,setEmail]=useState("");
 const [url,setUrl]=useState("");
 const [sku,setSku]=useState("");
 const [qty,setQty]=useState("1");
 const [retail,setRetail]=useState("");
 const [freight,setFreight]=useState("");
 const [tax,setTax]=useState("0");
 const [approved,setApproved]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [result,setResult]=useState<Result|null>(null);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;
  setBusy(true);setMessage("");setResult(null);
  try{
   const response=await fetch("/api/admin/checkout/quotes",{
    method:"POST",headers:{"content-type":"application/json","x-herocon-checkout-admin":secret},
    body:JSON.stringify({
     customerEmail:email,deliveryCountry:"GB",paymentStage:"all_in",
     manualPricingApproved:approved,allInCostApproved:approved,
     shippingGBP:Number(freight),taxGBP:Number(tax),
     lines:[{marketplaceUrl:url,skuCode:sku,quantity:Number(qty),unitPriceGBP:Number(retail)}]
    }),cache:"no-store"
   });
   const data=await response.json() as Result;
   if(!response.ok)throw new Error(data.error||"Could not create an approved quote.");
   setResult(data);
   setMessage("Approved quote saved. Customer payments remain disabled unless every independent launch check passes.");
  }catch(error){setMessage(error instanceof Error?error.message:"Request failed.");}
  finally{setBusy(false);}
 }
 const labelStyle={display:"block",fontWeight:700,fontSize:13,marginBottom:6} as const;
 const inputStyle={display:"block",boxSizing:"border-box",width:"100%",padding:"12px 13px",border:"1px solid #bacaba",borderRadius:10,marginBottom:16,background:"#fff",fontSize:15} as const;
 return <main style={{background:"#f7f9f5",color:"#22432d",minHeight:"100vh",padding:"48px 20px"}}>
  <section style={{maxWidth:640,margin:"auto"}}>
   <Link href="/" style={{color:"#345d42"}}>Herocon</Link>
   <h1 style={{font:"normal 42px Georgia,serif",margin:"22px 0 8px"}}>Merchant order quotes</h1>
   <p style={{lineHeight:1.7}}>Prepare a private, all-inclusive GBP quote for a verified supplier SKU. This page never takes payment or purchases anything from BuckyDrop.</p>
   <p style={{fontSize:13,lineHeight:1.65,color:"#7c5630",padding:15,borderRadius:12,background:"#fff3df"}}>
    Merchant-only pilot. You must independently confirm supplier availability, packed-freight allowance, duties and taxes, processing fees, reserve for overruns, legal terms and BuckyDrop prepaid automatic fulfilment. Do not share an unapproved price or activate live payments just because a quote is saved.
   </p>
   <form onSubmit={submit} style={{padding:24,background:"#fff",border:"1px solid #d9e5d8",borderRadius:18}}>
    <label style={labelStyle} htmlFor="quote-secret">Merchant secret (not stored in browser)</label>
    <input id="quote-secret" style={inputStyle} type="password" required value={secret} autoComplete="off" onChange={e=>setSecret(e.target.value)}/>
    <label style={labelStyle} htmlFor="quote-email">Customer email</label>
    <input id="quote-email" style={inputStyle} type="email" required value={email} onChange={e=>setEmail(e.target.value)}/>
    <label style={labelStyle} htmlFor="quote-link">Original 1688, Taobao, Tmall or Weidian URL</label>
    <input id="quote-link" style={inputStyle} type="url" required value={url} onChange={e=>setUrl(e.target.value)}/>
    <label style={labelStyle} htmlFor="quote-sku">Exact seller variant SKU code</label>
    <input id="quote-sku" style={inputStyle} required maxLength={40} value={sku} onChange={e=>setSku(e.target.value)}/>
    <label style={labelStyle} htmlFor="quote-qty">Quantity</label>
    <input id="quote-qty" style={inputStyle} type="number" min="1" max="99" step="1" required value={qty} onChange={e=>setQty(e.target.value)}/>
    <label style={labelStyle} htmlFor="quote-retail">Herocon retail price per item (£)</label>
    <input id="quote-retail" style={inputStyle} type="number" min="0.01" max="1000" step="0.01" required value={retail} onChange={e=>setRetail(e.target.value)}/>
    <label style={labelStyle} htmlFor="quote-freight">Included international shipping allowance (£)</label>
    <input id="quote-freight" style={inputStyle} type="number" min="0.01" max="1000" step="0.01" required value={freight} onChange={e=>setFreight(e.target.value)}/>
    <label style={labelStyle} htmlFor="quote-tax">Applicable tax/duties amount included (£)</label>
    <input id="quote-tax" style={inputStyle} type="number" min="0" max="1000" step="0.01" required value={tax} onChange={e=>setTax(e.target.value)}/>
    <label style={{display:"flex",gap:12,lineHeight:1.55,fontSize:13,marginBottom:18}}>
     <input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/>
     <span>I have independently reviewed the final delivered GBP total, included duties/taxes and all supplier and logistics costs. Herocon will absorb any extra freight charge and will not send a second freight invoice.</span>
    </label>
    <button type="submit" disabled={busy||!approved} style={{background:"#234830",color:"#fff",padding:"14px 22px",border:0,borderRadius:12,fontWeight:700,opacity:busy||!approved?.55:1}}>
     {busy?"Checking supplier and saving quote…":"Create private all-inclusive quote"}
    </button>
    {message&&<p role="status" style={{lineHeight:1.6}}>{message}</p>}
    {result?.checkoutUrl&&<p><a href={result.checkoutUrl} style={{color:"#245d41",overflowWrap:"anywhere"}}>{result.checkoutUrl}</a><br/>Total: £{result.totalGBP} · Live payment {result.paymentEnabled?"enabled":"disabled"}</p>}
   </form>
  </section>
 </main>;
}
