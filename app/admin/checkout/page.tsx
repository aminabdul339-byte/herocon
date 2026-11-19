"use client";
import Link from "next/link";
import {useState} from "react";

type Line={marketplaceUrl:string;skuCode:string;quantity:string;unitPriceGBP:string};
const blank=():Line=>({marketplaceUrl:"",skuCode:"",quantity:"1",unitPriceGBP:""});
type QuoteCreated={id:string;checkoutUrl:string;customerEmail:string;totalGBP:string;estimatedLaterShippingGBP:string;paymentStage:"products";expiresAt:string;paymentEnabled:boolean;notice:string};
type FinancialEvent={eventId:string;type:string;objectId:string;receivedAt:string;requiresMerchantReview:boolean};
type PaymentException={sessionId:string;quoteId?:string;expectedQuoteId?:string;code:string;at:string};
type Reconciliation={quoteId:string;sessionId:string;email:string;totalPence:number;
 state:string;reason:string;recordedAt:string;partnerOrderNo:string|null;
 shopOrderNo:string|null;accessCode:string|null;customerEmailSent:boolean;merchantEmailSent:boolean;};
const field:React.CSSProperties={padding:"11px 12px",border:"1px solid #bacfbd",borderRadius:7,width:"100%",background:"#fff"};
const button:React.CSSProperties={padding:"12px 18px",background:"#254832",border:"none",color:"#fff",borderRadius:7,cursor:"pointer",fontWeight:700};
export default function MerchantCheckout(){
 const [key,setKey]=useState(""),[email,setEmail]=useState("");
 const [lines,setLines]=useState<Line[]>([blank()]);
 const [shipping,setShipping]=useState(""),[tax,setTax]=useState("");
 const [approved,setApproved]=useState(false);
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState<QuoteCreated|null>(null);
 const [notice,setNotice]=useState("");
 const [readiness,setReadiness]=useState<{enabled:boolean;missing:string[]}|null>(null);
 const [reconciliation,setReconciliation]=useState<Reconciliation[]|null>(null);
 const [financialEvents,setFinancialEvents]=useState<FinancialEvent[]>([]);
 const [exceptions,setExceptions]=useState<PaymentException[]>([]);
 const [testUrl,setTestUrl]=useState("");
 const update=(i:number,k:keyof Line,v:string)=>setLines(old=>old.map((line,n)=>n===i?{...line,[k]:v}:line));
 async function check(){
  setBusy(true);setNotice("");
  try{
   const res=await fetch("/api/admin/checkout/quotes",{headers:{"x-herocon-checkout-admin":key.trim()},cache:"no-store"});
   const data=await res.json();
   if(!res.ok)throw Error(data.error||"Unable to check launch readiness.");
   setReadiness(data.readiness);
  }catch(e){setNotice(e instanceof Error?e.message:"Unable to check readiness.");}
  finally{setBusy(false);}
 }
 async function startSandboxTest(){
  if(!result)return;
  setBusy(true);setNotice("");setTestUrl("");
  try{
   const r=await fetch("/api/admin/checkout/test-session",{
    method:"POST",headers:{"Content-Type":"application/json","x-herocon-checkout-admin":key.trim()},
    body:JSON.stringify({quoteId:result.id}),cache:"no-store"
   });
   const d=await r.json();
   if(!r.ok||!d.testMode||typeof d.url!=="string")throw Error(d.error||"Stripe sandbox test unavailable.");
   setTestUrl(d.url);
   setNotice("TEST payment session generated. This cannot charge a live customer or submit BuckyDrop goods.");
  }catch(e){setNotice(e instanceof Error?e.message:"Unable to open sandbox test.");}
  finally{setBusy(false);}
 }
 async function checkPaidOrders(){
  setBusy(true);setNotice("");
  try{
   const r=await fetch("/api/admin/checkout/reconciliation",{
    headers:{"x-herocon-checkout-admin":key.trim()},cache:"no-store"
   });
   const data=await r.json();
   if(!r.ok)throw Error(data.error||"Unable to load paid-order reconciliation.");
   setReconciliation(data.results as Reconciliation[]);
   setFinancialEvents(Array.isArray(data.financialEvents)?data.financialEvents:[]);
   setExceptions(Array.isArray(data.exceptions)?data.exceptions:[]);
   setNotice("Read-only merchant reconciliation loaded. This does not resubmit any supplier order.");
  }catch(e){setNotice(e instanceof Error?e.message:"Unable to read reconciliation records.");}
  finally{setBusy(false);}
 }
 async function create(e:React.FormEvent){
  e.preventDefault();setBusy(true);setResult(null);setNotice("");
  try{
   const response=await fetch("/api/admin/checkout/quotes",{
    method:"POST",headers:{"x-herocon-checkout-admin":key.trim(),"Content-Type":"application/json"},
    body:JSON.stringify({
     customerEmail:email.trim(),deliveryCountry:"GB",manualPricingApproved:approved,
     shippingGBP:Number(shipping),taxGBP:Number(tax),
     lines:lines.map(line=>({...line,quantity:Number(line.quantity),unitPriceGBP:Number(line.unitPriceGBP)}))
    })
   });
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"Could not approve this quote.");
   setResult(data as QuoteCreated);
   setNotice("Private buyer quote saved. This is not a customer charge, order or supplier purchase.");
  }catch(err){setNotice(err instanceof Error?err.message:"Quote could not be created.");}
  finally{setBusy(false);}
 }
 return <main style={{padding:"45px 22px 100px",maxWidth:980,margin:"auto",fontFamily:"Arial,sans-serif",lineHeight:1.6}}>
  <p style={{fontSize:12}}><Link href="/">Herocon</Link> / Merchant operations</p>
  <h1 style={{font:"400 46px/1.1 Georgia,serif",color:"#254632"}}>Approve a customer checkout quote</h1>
  <p>Merchant-only pilot tool. Check supplier stock and approve the GBP product payment. International shipping will be quoted and paid separately after warehouse arrival and QC. Include a realistic upfront shipping estimate to disclose before product payment. The payment systems remain disabled until independently tested. Supplier lookups may be billable.</p>
  <section style={{background:"#f3f6f1",padding:22,borderRadius:10,marginTop:26}}>
   <label style={{display:"block",fontWeight:700}}>Independent private checkout admin key</label>
   <input type="password" value={key} onChange={e=>setKey(e.target.value)} autoComplete="off" placeholder="Merchant key — never share" style={field}/>
   <p style={{fontSize:12,color:"#6a7a6c"}}>The key stays in this tab's memory; it is not saved to browser storage. It must be configured separately in Vercel before using this page.</p>
   <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <button type="button" style={button} onClick={check} disabled={busy||key.length<32}>{busy?"Checking…":"Check launch requirements"}</button>
    <button type="button" style={{...button,background:"#48684f"}} onClick={checkPaidOrders} disabled={busy||key.length<32}>Review paid-order ledger</button>
   </div>
   {readiness&&<section style={{marginTop:15}}>
    <strong>{readiness.enabled?"All configured launch gates are present (still complete a controlled purchase test)":"Live payment is still disabled. Missing requirements:"}</strong>
    {!readiness.enabled&&<ul>{readiness.missing.map(x=><li key={x}>{x}</li>)}</ul>}
   </section>}
  </section>
  {reconciliation&&<section style={{border:"1px solid #dce4d8",borderRadius:10,padding:18,marginTop:22}}>
    <h2>Private paid-order reconciliation ({reconciliation.length})</h2>
    {financialEvents.length>0&&<div style={{padding:14,background:"#fff3e6",borderRadius:7,marginBottom:16}}>
     <strong>Stripe refund/dispute and payment events ({financialEvents.length})</strong>
     {financialEvents.map(e=><p key={e.eventId} style={{fontSize:12}}>{e.type} · {e.objectId} · {new Date(e.receivedAt).toLocaleString("en-GB")} {e.requiresMerchantReview?"— review Stripe dashboard":""}</p>)}
    </div>}
    {exceptions.length>0&&<div style={{padding:14,background:"#fff3e6",borderRadius:7,marginBottom:16}}>
     <strong>Paid-session security and duplication issues ({exceptions.length})</strong>
     {exceptions.map(e=><p key={e.sessionId} style={{fontSize:12}}>{e.code} · {e.sessionId} · {e.quoteId||e.expectedQuoteId||"unknown quote"} — reconcile Stripe funds and refunds</p>)}
    </div>}
    <p style={{fontSize:13}}>Review all funds captured but not confirmed as submitted. When BuckyDrop submission is uncertain, search the original partner order reference in the BuckyDrop merchant portal before any manual resubmission or refund.</p>
    {reconciliation.length===0?<p>No paid-order records are available in the current ledger.</p>:
    reconciliation.map(r=><article key={r.sessionId} style={{padding:14,border:"1px solid #e3e9e0",marginBottom:12,borderRadius:7}}>
     <strong>{r.state.replace(/_/g," ")} — {r.totalPence? "£"+(r.totalPence/100).toFixed(2):"Amount needs review"}</strong>
     <p style={{fontSize:12}}>Quote: {r.quoteId} · Stripe session: {r.sessionId} · Buyer: {r.email||"See Stripe"}</p>
     <p style={{fontSize:12}}>BuckyDrop partner ref: {r.partnerOrderNo||"Not confirmed"} · Shop order: {r.shopOrderNo||"Pending"}</p>
     <p style={{fontSize:12,color:"#885a32"}}>{r.reason}</p>
     <p style={{fontSize:12}}>Buyer email: {r.customerEmailSent?"sent":"needs follow-up"} · Merchant email: {r.merchantEmailSent?"sent":"needs follow-up"}</p>
     {r.accessCode&&<p style={{fontSize:12}}>Private tracking access code (share securely with the correct buyer): <code>{r.accessCode}</code></p>}
    </article>)}
   </section>}
  <form onSubmit={create} style={{display:"grid",gap:20,marginTop:30}}>
   <div><label htmlFor="merchant-buyer">Buyer's email</label><input id="merchant-buyer" type="email" style={field} required value={email} onChange={e=>setEmail(e.target.value)} placeholder="buyer@example.com"/></div>
   <section><h2>Product variants</h2>
    {lines.map((line,i)=><div key={i} style={{display:"grid",gap:10,padding:18,border:"1px solid #dce8dd",borderRadius:10,marginBottom:14}}>
     <label>Original marketplace product URL<input type="url" style={field} required value={line.marketplaceUrl} onChange={e=>update(i,"marketplaceUrl",e.target.value)} placeholder="https://detail.1688.com/offer/....html"/></label>
     <label>BuckyDrop seller SKU<input style={field} required value={line.skuCode} onChange={e=>update(i,"skuCode",e.target.value)} placeholder="Exact SKU from BuckyDrop"/></label>
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <label>Quantity<input style={field} type="number" min={1} max={99} value={line.quantity} onChange={e=>update(i,"quantity",e.target.value)} required/></label>
      <label>Final retail price per unit (£)<input style={field} type="number" min=".01" step=".01" max="1000" value={line.unitPriceGBP} onChange={e=>update(i,"unitPriceGBP",e.target.value)} required/></label>
     </div>
     {lines.length>1&&<button type="button" style={{alignSelf:"end"}} onClick={()=>setLines(old=>old.filter((_,n)=>i!==n))}>Remove this line</button>}
    </div>)}
    <button type="button" disabled={lines.length>=5} onClick={()=>setLines(old=>[...old,blank()])}>+ Add another variant (maximum 5)</button>
   </section>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
    <label>Estimated international shipping, paid later (£)<input style={field} type="number" min=".01" max="1000" step=".01" required value={shipping} onChange={e=>setShipping(e.target.value)}/></label>
    <label>Applicable product-stage taxes charged now (£)<input style={field} type="number" min="0" max="1000" step=".01" required value={tax} onChange={e=>setTax(e.target.value)}/></label>
   </div>
   <p style={{fontSize:13,color:"#80633b"}}>The shipping figure is an indicative estimate for the later freight payment and is NOT charged in this first checkout. Base it on a reasonable destination and weight estimate, not an unverified currency conversion. The final packed weight, eligible routes and duties will be checked after warehouse arrival. Explain the estimate and refund/cancellation conditions clearly before the customer buys.</p>
   <label style={{display:"flex",gap:10,alignItems:"start"}}><input style={{marginTop:6}} type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)} required/><span>I have checked product stock, approved the product-only GBP charge, disclosed a reasonable later freight estimate, and understand international shipping is a separate future payment after warehouse receipt and QC.</span></label>
   <button style={button} disabled={busy||key.length<32||!approved} type="submit">{busy?"Verifying seller and saving…":"Create approved private checkout quote"}</button>
  </form>
  {notice&&<p role="status" style={{padding:14,background:"#edf4e9",borderRadius:6}}>{notice}</p>}
  {result&&<section style={{padding:20,border:"1px solid #d3e1d0",borderRadius:10}}>
   <h2>Product-stage quote: £{result.totalGBP} payable first</h2><p>Estimated later international shipping: approximately £{result.estimatedLaterShippingGBP} (not included or charged yet; final quote after warehouse QC).</p><p>For {result.customerEmail}. Expires {new Date(result.expiresAt).toLocaleString("en-GB")}</p>
   <p><Link href={result.checkoutUrl}>{result.checkoutUrl}</Link></p>
   <button type="button" onClick={()=>navigator.clipboard.writeText(result.checkoutUrl)}>Copy private buyer link</button>
   <div style={{marginTop:15}}>
    <button type="button" disabled={busy} onClick={startSandboxTest} style={{...button,background:"#43657b"}}>Generate Stripe TEST payment for this exact quote</button>
    {testUrl&&<p><a href={testUrl} target="_blank" rel="noopener noreferrer">Open Stripe TEST Checkout ↗</a></p>}
    <p style={{fontSize:12}}>Requires Stripe test keys and test webhook configured in Vercel. TEST payments never create a supplier purchase.</p>
   </div>
   <p><strong>{result.paymentEnabled?"Payment route is configured. Verify carefully before sharing.":"Payment remains disabled until the launch requirements pass."}</strong></p>
  </section>}
 </main>;
}
