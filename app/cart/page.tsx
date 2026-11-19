"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import Header from "@/components/Header";
import {useCart} from "@/components/CartProvider";

type AvailabilityLine={title:string;skuCode:string;quantity:number;status:"confirmed"|"unavailable"|"unverified";reason:string;supplierUnitCny:number|null;supplierStock:number|null};
type AvailabilityReport={verifiedAt:string;allConfirmed:boolean;checkoutReady:false;lines:AvailabilityLine[];checkoutBlockers:string[]};
const money=(currency:"CNY"|"GBP",value:number)=>currency==="CNY"?"¥"+value.toFixed(2):"£"+value.toFixed(2);
export default function CartPage(){
 const {items,count,hydrated,updateQuantity,setItemSelected,selectAllItems,removeItem,clearCart}=useCart();
 const [checkout,setCheckout]=useState(false);
 const [fx,setFx]=useState<{rate:number;date:string}|null>(null);
 const [fxUnavailable,setFxUnavailable]=useState(false);
 const [verification,setVerification]=useState<AvailabilityReport|null>(null);
 const [verifying,setVerifying]=useState(false);
 const [verificationError,setVerificationError]=useState("");
 const selectedItems=items.filter(item=>item.selected!==false);
 const selectedLines=selectedItems.length;
 const selectedUnits=selectedItems.reduce((sum,item)=>sum+item.quantity,0);
 const allSelected=items.length>0&&selectedLines===items.length;
 useEffect(()=>{setVerification(null);setVerificationError("");},[items]);
 async function verifySupplierCart(){
  if(verifying||selectedLines===0||selectedLines>5||selectedItems.some(item=>!item.skuCode))return;
  setVerifying(true);setVerification(null);setVerificationError("");
  try{
   const response=await fetch("/api/checkout/readiness",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({lines:selectedItems.map(item=>({marketplaceUrl:item.marketplaceUrl,skuCode:item.skuCode||"",quantity:item.quantity,title:item.title}))}),cache:"no-store"
   });
   const result:unknown=await response.json();
   if(!response.ok)throw Error(result&&typeof result==="object"&&"error" in result&&typeof result.error==="string"?result.error:"Supplier check is unavailable.");
   setVerification(result as AvailabilityReport);
  }catch(err){setVerificationError(err instanceof Error?err.message:"Supplier check is unavailable.");}
  finally{setVerifying(false);}
 }
 useEffect(()=>{setCheckout(new URLSearchParams(window.location.search).get("checkout")==="1");},[]);
 useEffect(()=>{
  const controller=new AbortController();
  fetch("/api/fx/cny-gbp",{signal:controller.signal})
   .then(async response=>{if(!response.ok)throw Error("Exchange rate unavailable");return response.json();})
   .then(data=>{
    if(typeof data.rate!=="number"||!Number.isFinite(data.rate)||data.rate<=0.01||data.rate>=0.5
      ||typeof data.date!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(data.date))throw Error("Invalid exchange rate");
    if(!controller.signal.aborted)setFx({rate:data.rate,date:data.date});
   })
   .catch(()=>{if(!controller.signal.aborted)setFxUnavailable(true);});
  return ()=>controller.abort();
 },[]);
 const cny=selectedItems.reduce((sum,item)=>sum+(item.currency==="CNY"&&item.unitPrice!=null?item.unitPrice*item.quantity:0),0);
 const gbp=selectedItems.reduce((sum,item)=>sum+(item.currency==="GBP"&&item.unitPrice!=null?item.unitPrice*item.quantity:0),0);
 const pricesMissing=selectedItems.some(item=>item.unitPrice==null);
 const estimatedGbp=fx?gbp+cny*fx.rate:cny===0?gbp:null;
 const convertedGbp=(value:number)=>fx?money("GBP",value*fx.rate):null;
 const requestQuoteHref="mailto:aminabdul339@outlook.com?subject="+
  encodeURIComponent("Herocon request for final GBP checkout quote")+"&body="+
  encodeURIComponent([
   "Hello Herocon, I would like a final all-in GBP price for these selected items:",
   ...selectedItems.slice(0,5).map((item,i)=>
    [String(i+1)+". "+item.title,"Variant: "+(item.variant||"Not selected"),
     "Supplier SKU: "+(item.skuCode||"Not available"),
     "Quantity: "+item.quantity,"Marketplace link: "+item.marketplaceUrl].join("\n")),
   "Please reply with the final shipping, taxes and any additional charges, plus a private Herocon checkout link when payments become available.",
   "My destination country and postcode:"
  ].join("\n\n"));
 return <main className="hc-cart-page"><Header/>
  <section className="sc-page-hero sc-container hc-cart-hero">
   <p className="sc-kicker">{checkout?"ORDER REVIEW":"YOUR SHOPPING CART"}</p>
   <h1>{checkout?"Review your ":"Your "}<em>{checkout?"selection.":"cart."}</em></h1>
   <p>Tick the products you want to buy, choose the quantity of each, and review your selected total.</p>
  </section>
  <section className="sc-container hc-cart-wrap" aria-live="polite">
   {!hydrated?<p>Loading your cart…</p>:items.length===0?
    <div className="hc-cart-empty"><h2>Your cart is empty.</h2><p>Explore the catalogue and add products to get started.</p><Link href="/search" className="sc-button sc-button-dark">Explore products ↗</Link></div>:
    <div className="hc-cart-layout"><div className="hc-cart-lines">
     <div className="hc-cart-head"><div><h2>{count} {count===1?"item":"items"} in your cart</h2><p className="hc-cart-selection-count">{selectedLines} of {items.length} product options selected</p></div><button type="button" onClick={clearCart}>Clear cart</button></div>
     <div className="hc-cart-select-toolbar"><label className="hc-cart-select-all"><input type="checkbox" checked={allSelected} onChange={event=>selectAllItems(event.target.checked)}/><span>Select all ({items.length})</span></label><span>{selectedUnits} {selectedUnits===1?"item":"items"} selected to buy</span></div>
     {items.map(item=><article className={"hc-cart-line"+(item.selected===false?" hc-cart-line-unselected":"")} key={item.key}>
      <label className="hc-cart-select-item" title={"Select "+item.title}><input type="checkbox" checked={item.selected!==false} onChange={event=>setItemSelected(item.key,event.target.checked)} aria-label={"Select "+item.title+" to buy"}/></label>
      <Link href={item.productPath} className="hc-cart-image">{item.image?<img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer"/>:<span>Product</span>}</Link>
      <div className="hc-cart-copy"><Link href={item.productPath} className="hc-cart-title">{item.title}</Link>{item.variant&&<p>{item.variant}</p>}
       <a href={item.marketplaceUrl} target="_blank" rel="noopener noreferrer">Direct product link ↗</a>
       <div className="hc-cart-controls"><span>Quantity</span><div className="hc-cart-quantity"><button type="button" className="hc-cart-quantity-step" aria-label={"Decrease quantity of "+item.title} disabled={item.quantity<=1} onClick={()=>updateQuantity(item.key,item.quantity-1)}>−</button><input aria-label={"Quantity of "+item.title} type="number" min={1} max={999} value={item.quantity} onChange={e=>{const v=Number(e.target.value);if(Number.isInteger(v)&&v>=1&&v<=999)updateQuantity(item.key,v);}}/><button type="button" className="hc-cart-quantity-step" aria-label={"Increase quantity of "+item.title} disabled={item.quantity>=999} onClick={()=>updateQuantity(item.key,item.quantity+1)}>+</button></div><button type="button" className="hc-cart-remove" onClick={()=>removeItem(item.key)}>Remove</button></div>
      </div>
      <strong className="hc-cart-price">{item.unitPrice==null?"Price on request":<>
       <span>{money(item.currency,item.unitPrice*item.quantity)}</span>
       {item.currency==="CNY"&&<small>{fx?"≈ "+convertedGbp(item.unitPrice*item.quantity):fxUnavailable?"GBP estimate unavailable":"Calculating GBP…"}</small>}
      </>}</strong>
     </article>)}
    </div>
    <aside className="hc-cart-summary"><h2>{checkout?"Selected order review":"Selected items summary"}</h2><p className="hc-cart-selected-note">{selectedLines} product {selectedLines===1?"option":"options"} · {selectedUnits} {selectedUnits===1?"item":"items"} selected to buy</p><div className="hc-cart-totals">
     {selectedLines===0&&<p className="hc-cart-select-prompt">Tick at least one item to see your selected total.</p>}
     {cny>0&&<p><span>Products priced in CNY</span><strong className="hc-cart-dual-total">{money("CNY",cny)}<small>{fx?"≈ "+convertedGbp(cny):fxUnavailable?"GBP estimate unavailable":"Calculating GBP…"}</small></strong></p>}
     {gbp>0&&<p><span>Products priced in GBP</span><strong>{money("GBP",gbp)}</strong></p>}
     {selectedLines>0&&estimatedGbp!==null&&<p className="hc-cart-gbp-total"><span>{pricesMissing?"Priced items, approx. GBP":"Estimated product subtotal (GBP)"}</span><strong>{(cny>0?"≈ ":"")+money("GBP",estimatedGbp)}</strong></p>}
     {pricesMissing&&<p><span>Some prices</span><strong>On request</strong></p>}
     <p><span>Shipping and taxes</span><strong>Not calculated</strong></p>
    </div>
    {fx&&cny>0&&<p className="hc-cart-fx-note">Approximate CNY to GBP conversion using the {fx.date} reference exchange rate. Actual rates may differ.</p>}
    <div className="hc-cart-checkout-note"><strong>Live supplier check</strong><p>Only the products you tick above will be checked. This is not a final GBP checkout quote.</p>
     <button type="button" className="sc-button sc-button-dark hc-cart-shop" onClick={verifySupplierCart} disabled={verifying||selectedLines===0||selectedLines>5||selectedItems.some(item=>!item.skuCode)}>
      {verifying?"Checking seller options…":"Verify supplier stock & prices ↗"}
     </button>
     {selectedLines===0&&<p>Tick the products you want to buy before checking availability.</p>}
     {selectedLines>5&&<p>Verify up to five selected options at a time. Untick some options to continue.</p>}
     {selectedItems.some(item=>!item.skuCode)&&<p>Some selected items have no verified seller SKU. Return to the product page and choose a supplier option, or untick those items.</p>}
     {verificationError&&<p role="alert">{verificationError}</p>}
     {verification&&<div role="status">
      <p><strong>{verification.allConfirmed?"Supplier options verified":"Some supplier options need attention"}</strong></p>
      <p>Checked {new Date(verification.verifiedAt).toLocaleString("en-GB")}. Supplier prices are in CNY only.</p>
      {verification.lines.map((line,i)=><p key={line.skuCode+"-"+i}>
       <strong>{line.status==="confirmed"?"✓":line.status==="unavailable"?"×":"!"} {line.title}</strong>
       {" · "}{line.quantity} item(s) · {line.reason}
       {line.supplierUnitCny!=null?" · Seller ¥"+line.supplierUnitCny.toFixed(2)+" per item":""}
      </p>)}
      <p><strong>Live checkout not yet available.</strong> Final GBP delivery, duties, taxes and fulfilment still need confirmation.</p>
     </div>}
     <p>Payment and supplier purchasing remain disabled until the complete checkout total and delivery process can be verified.</p>
    </div>
    <div className="hc-cart-checkout-note">
     <strong>Request your final GBP checkout quote</strong>
     <p>Herocon currently verifies supplier stock and product costs, but delivery and taxes need a merchant-approved final amount. You can request an all-in quote for up to five selected options. We will provide a private checkout link when payment processing is ready.</p>
     {selectedLines>0?<a className="sc-button sc-button-outline hc-cart-shop" href={requestQuoteHref}>Request a final quote by email ↗</a>:<p>Tick the products you want before requesting your quote.</p>}
    </div>
    <Link className="sc-button sc-button-dark hc-cart-shop" href="/landed-cost">Estimate shipping ↗</Link><Link className="sc-button sc-button-outline hc-cart-shop" href="/orders">Track an order ↗</Link><Link className="hc-cart-shop" href="/search">Continue shopping ↗</Link>
    </aside></div>}
  </section>
 </main>;
}
