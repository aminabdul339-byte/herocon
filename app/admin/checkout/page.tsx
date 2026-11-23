"use client";
import {useEffect,useState,type FormEvent} from "react";
import Link from "next/link";

type Result={error?:string;checkoutUrl?:string;totalGBP?:string;paymentEnabled?:boolean;id?:string;merchantPricingForecast?:{projectedProfitGBP:string;stripeFeeReserveGBP:string;minRequiredProfitGBP:string;minCustomerTotalGBP:string}|null};
export default function MerchantCheckoutQuotes(){
 const [secret,setSecret]=useState("");
 const [email,setEmail]=useState("");
 const [url,setUrl]=useState("");
 const [sku,setSku]=useState("");
 const [qty,setQty]=useState("1");
 const [retail,setRetail]=useState("");
 const [freight,setFreight]=useState("");
 const [tax,setTax]=useState("0");
 const [fxRate,setFxRate]=useState("");
 const [buckyFees,setBuckyFees]=useState("");
 const [walletFees,setWalletFees]=useState("");
 const [shippingBuffer,setShippingBuffer]=useState("");
 const [fxApproved,setFxApproved]=useState(false);
 const [approved,setApproved]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [result,setResult]=useState<Result|null>(null);
 useEffect(()=>{const query=new URLSearchParams(window.location.search);const source=query.get("source"),prefillSku=query.get("sku");if(source&&/^https:\/\//i.test(source))setUrl(source.slice(0,500));if(prefillSku&&/^[A-Za-z0-9_-]{1,40}$/.test(prefillSku))setSku(prefillSku);},[]);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;
  setBusy(true);setMessage("");setResult(null);
  try{
   const response=await fetch("/api/admin/checkout/quotes",{
    method:"POST",headers:{"content-type":"application/json","x-herocon-checkout-admin":secret},
    body:JSON.stringify({
     customerEmail:email,deliveryCountry:"GB",paymentStage:"all_in",
     manualPricingApproved:approved,allInCostApproved:approved,
     supplierFxGBPperCNY:Number(fxRate),supplierFxReviewed:fxApproved,
     buckydropFeesGBP:Number(buckyFees),walletAndFxFeesGBP:Number(walletFees),shippingRiskReserveGBP:Number(shippingBuffer),
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
   <p style={{lineHeight:1.7}}>Prepare a private GBP quote for a verified supplier SKU. Every new quote includes a clearly disclosed 99p Herocon service fee per order, plus internal safeguards covering supplier purchase, international shipping, BuckyDrop, wallet/FX costs, Stripe and a profit reserve. This page never takes payment or purchases anything from BuckyDrop.</p>
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
    <label style={labelStyle} htmlFor="quote-fx">Approved effective purchasing FX rate (GBP paid per 1 CNY)</label>
    <input id="quote-fx" style={inputStyle} type="number" min="0.01" max="0.75" step="0.000001" required placeholder="Enter verified BuckyDrop wallet settlement rate" value={fxRate} onChange={e=>setFxRate(e.target.value)}/>
    <label style={labelStyle} htmlFor="quote-bucky">BuckyDrop procurement, domestic freight, packing &amp; fulfilment allowance (£)</label>
    <input id="quote-bucky" style={inputStyle} type="number" min="0.01" max="1000" step="0.01" required value={buckyFees} onChange={e=>setBuckyFees(e.target.value)}/>
    <label style={labelStyle} htmlFor="quote-wallet">Wallet top-up, conversion &amp; bank charges (£)</label>
    <input id="quote-wallet" style={inputStyle} type="number" min="0.01" max="1000" step="0.01" required value={walletFees} onChange={e=>setWalletFees(e.target.value)}/>
    <label style={labelStyle} htmlFor="quote-buffer">Parcel reweighing and shipping contingency (£)</label>
    <input id="quote-buffer" style={inputStyle} type="number" min="0.50" max="1000" step="0.01" required value={shippingBuffer} onChange={e=>setShippingBuffer(e.target.value)}/>
    <p style={{fontSize:12,lineHeight:1.6,color:"#687b68",background:"#eef4ed",padding:12,borderRadius:9}}>The server automatically budgets 6% + 30p for Stripe processing and requires an additional profit allowance of at least £2 or 12% of the full customer payment (whichever is higher). These are conservative <strong>planning allowances</strong>, not confirmed charges; refunds, disputes and changed costs can still cause losses.</p>
    <label style={{display:"flex",gap:12,lineHeight:1.55,fontSize:13,marginBottom:18}}>
     <input type="checkbox" checked={fxApproved} onChange={e=>setFxApproved(e.target.checked)}/>
     <span>I checked the BuckyDrop funding and FX arrangement, supplier domestic charges and international delivery route. This amount includes the complete expected BuckyDrop wallet / handling / bank cost, without double-counting exchange charges.</span>
    </label>
    <label style={labelStyle} htmlFor="quote-tax">Applicable tax/duties amount included (£)</label>
    <input id="quote-tax" style={inputStyle} type="number" min="0" max="1000" step="0.01" required value={tax} onChange={e=>setTax(e.target.value)}/>
    <label style={{display:"flex",gap:12,lineHeight:1.55,fontSize:13,marginBottom:18}}>
     <input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/>
     <span>I have independently reviewed the final delivered GBP total, included duties/taxes and all supplier and logistics costs. Herocon will absorb any extra freight charge and will not send a second freight invoice.</span>
    </label>
    <button type="submit" disabled={busy||!approved||!fxApproved} style={{background:"#234830",color:"#fff",padding:"14px 22px",border:0,borderRadius:12,fontWeight:700,opacity:busy||!approved||!fxApproved?.55:1}}>
     {busy?"Checking supplier and saving quote…":"Create private all-inclusive quote"}
    </button>
    {message&&<p role="status" style={{lineHeight:1.6}}>{message}</p>}
    {result?.checkoutUrl&&<p><a href={result.checkoutUrl} style={{color:"#245d41",overflowWrap:"anywhere"}}>{result.checkoutUrl}</a><br/>Total: £{result.totalGBP} · Live payment {result.paymentEnabled?"enabled":"disabled"}</p>}
    {result?.merchantPricingForecast&&<div role="status" style={{background:"#eef5eb",padding:17,borderRadius:12,marginTop:16,fontSize:13,lineHeight:1.8}}><strong>Internal order economics (estimates only)</strong><p>Stripe processing reserve: £{result.merchantPricingForecast.stripeFeeReserveGBP}<br/>Minimum acceptable full customer total: £{result.merchantPricingForecast.minCustomerTotalGBP}<br/>Minimum profit requirement: £{result.merchantPricingForecast.minRequiredProfitGBP}<br/><strong>Projected Herocon profit after stated costs: £{result.merchantPricingForecast.projectedProfitGBP}</strong></p><small>Reconcile with actual Stripe balance fees and BuckyDrop wallet and carrier charges after fulfilment. These estimates cannot guarantee profit.</small></div>}
   </form>
  </section>
 </main>;
}
