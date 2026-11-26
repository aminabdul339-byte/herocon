"use client";
import {ArrowIcon} from "@/components/ArrowIcon";
import {useEffect,useState} from "react";
import Link from "next/link";
import Header from "@/components/Header";
import ShoppingCenterNav from "@/components/ShoppingCenterNav";
import {freightSummary,validFreight,productPayment} from "@/lib/cart-pricing";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {useCart} from "@/components/CartProvider";

const money=(currency:"CNY"|"GBP",value:number)=>currency==="CNY"?"¥"+value.toFixed(2):"£"+value.toFixed(2);
export default function CartPage(){
 const {items,count,hydrated,account,updateQuantity,setItemSelected,selectAllItems,removeItem,clearCart,updateFreight}=useCart();
 const [fx,setFx]=useState<{rate:number;date:string}|null>(null);
 const [fxUnavailable,setFxUnavailable]=useState(false);
 const [freightEstimates,setFreightEstimates]=useState<Record<string,number>>({});
 const selectedItems=items.filter(item=>item.selected!==false);
 const selectedLines=selectedItems.length;

 const selectedUnits=selectedItems.reduce((sum,item)=>sum+item.quantity,0);
 const allSelected=items.length>0&&selectedLines===items.length;
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
 const lookupKey=JSON.stringify([...new Set(items.filter(i=>!validFreight(i.domesticFreightCny)).map(i=>normalizeMarketplaceLink(i.marketplaceUrl)).filter((x):x is string=>!!x))].sort());
 useEffect(()=>{if(!hydrated||account.status!=="authenticated")return;const urls=JSON.parse(lookupKey) as string[];if(!urls.length)return;const controller=new AbortController();(async()=>{for(let i=0;i<urls.length;i+=30){try{const r=await fetch("/api/cart/domestic-freight",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({urls:urls.slice(i,i+30)}),signal:controller.signal,cache:"no-store"});if(r.ok&&!controller.signal.aborted){const d=await r.json();if(!controller.signal.aborted){updateFreight(d.freight||{});setFreightEstimates(previous=>{const next={...previous};for(const url of urls.slice(i,i+30)){delete next[url];if(d.estimates?.[url]===99)next[url]=99;}return next;});}}}catch{}}})();return ()=>controller.abort();},[lookupKey,hydrated,account.status,account.id]);
 const cny=selectedItems.reduce((sum,item)=>sum+(item.currency==="CNY"&&item.unitPrice!=null?item.unitPrice*item.quantity:0),0);
 const gbp=selectedItems.reduce((sum,item)=>sum+(item.currency==="GBP"&&item.unitPrice!=null?item.unitPrice*item.quantity:0),0);
 const pricesMissing=selectedItems.some(item=>item.unitPrice==null);
 const estimatedGbp=fx?gbp+cny*fx.rate:cny===0?gbp:null;
 const freight=freightSummary(selectedItems.map(i=>({...i,marketplaceUrl:normalizeMarketplaceLink(i.marketplaceUrl)||i.marketplaceUrl})));
 const grouped=new Map<string,typeof selectedItems>();for(const i of selectedItems){const key=normalizeMarketplaceLink(i.marketplaceUrl)||i.marketplaceUrl;grouped.set(key,[...(grouped.get(key)||[]),i]);}
 const fallbackCount=[...grouped.entries()].filter(([url,lines])=>freightEstimates[url]===99&&lines.every(i=>!validFreight(i.domesticFreightCny))).length;
 const remainingUnknown=Math.max(0,freight.unknown-fallbackCount);
 const domesticGbp=freight.knownFen===0?fallbackCount*.99:fx?(Math.round(freight.knownFen*fx.rate)+fallbackCount*99)/100:null;
 const payment=selectedLines>0&&!pricesMissing&&estimatedGbp!==null&&domesticGbp!==null&&remainingUnknown===0?productPayment(Math.round(estimatedGbp*100),Math.round(domesticGbp*100)):null;
 const convertedGbp=(value:number)=>fx?money("GBP",value*fx.rate):null;
 return <main className="hc-cart-page"><Header/><ShoppingCenterNav/>
  <section className="sc-page-hero sc-container hc-cart-hero">
   <p className="sc-kicker">YOUR SHOPPING CART</p>
   <h1>Your <em>cart.</em></h1>
   <p>{account.ownerPremium?"Review your selected products and proceed to the private test checkout.":"Review your selected products. Online purchasing is coming soon."}</p>
  </section>
  <section className="sc-container hc-cart-wrap" aria-live="polite">
   {!hydrated?<p>Loading your cart…</p>:items.length===0?
    <div className="hc-cart-empty"><h2>Your cart is empty.</h2><p>Explore the catalogue and add products to get started.</p><Link href="/search" className="sc-button sc-button-dark">Explore products <ArrowIcon/></Link></div>:
    <div className="hc-cart-layout"><div className="hc-cart-lines">
     <div className="hc-cart-head"><div><h2>{count} {count===1?"item":"items"} in your cart</h2><p className="hc-cart-selection-count">{selectedLines} of {items.length} product options selected</p></div><button type="button" onClick={clearCart}>Clear cart</button></div>
     <div className="hc-cart-select-toolbar"><label className="hc-cart-select-all"><input type="checkbox" checked={allSelected} onChange={event=>selectAllItems(event.target.checked)}/><span>Select all ({items.length})</span></label><span>{selectedUnits} {selectedUnits===1?"item":"items"} selected</span></div>
     {items.map(item=><article className={"hc-cart-line"+(item.selected===false?" hc-cart-line-unselected":"")} key={item.key}>
      <label className="hc-cart-select-item" title={"Select "+item.title}><input type="checkbox" checked={item.selected!==false} onChange={event=>setItemSelected(item.key,event.target.checked)} aria-label={"Select "+item.title+" to buy"}/></label>
      <Link href={item.productPath} className="hc-cart-image">{item.image?<img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer"/>:<span>Product</span>}</Link>
      <div className="hc-cart-copy"><Link href={item.productPath} className="hc-cart-title">{item.title}</Link>{item.variant&&<p>{item.variant}</p>}<p className="hc-cart-domestic">China delivery: {validFreight(item.domesticFreightCny)?item.domesticFreightCny===0?"Free (recorded)":(convertedGbp(item.domesticFreightCny)?"≈ "+convertedGbp(item.domesticFreightCny)+" · ":"")+money("CNY",item.domesticFreightCny)+" (estimate)":freightEstimates[normalizeMarketplaceLink(item.marketplaceUrl)||item.marketplaceUrl]===99?"£0.99 (Herocon estimate, unconfirmed)":"Not yet confirmed"}</p>
       <div className="hc-cart-controls"><span>Quantity</span><div className="hc-cart-quantity"><button type="button" className="hc-cart-quantity-step" aria-label={"Decrease quantity of "+item.title} disabled={item.quantity<=1} onClick={()=>updateQuantity(item.key,item.quantity-1)}>−</button><input aria-label={"Quantity of "+item.title} type="number" min={1} max={999} value={item.quantity} onChange={e=>{const v=Number(e.target.value);if(Number.isInteger(v)&&v>=1&&v<=999)updateQuantity(item.key,v);}}/><button type="button" className="hc-cart-quantity-step" aria-label={"Increase quantity of "+item.title} disabled={item.quantity>=999} onClick={()=>updateQuantity(item.key,item.quantity+1)}>+</button></div><button type="button" className="hc-cart-remove" onClick={()=>removeItem(item.key)}>Remove</button>{account.ownerPremium&&<Link href={"/find-product?url="+encodeURIComponent(item.marketplaceUrl||"")} className="hc-cart-owner-buy-link">Verify with HioBuy</Link>}</div>
      </div>
      <strong className="hc-cart-price">{item.unitPrice==null?"Price unavailable":<>
       <span>{money(item.currency,item.unitPrice*item.quantity)}</span>
       {item.currency==="CNY"&&<small>{fx?"≈ "+convertedGbp(item.unitPrice*item.quantity):fxUnavailable?"GBP estimate unavailable":"Calculating GBP…"}</small>}
      </>}</strong>
     </article>)}
    </div>
    <aside className="hc-cart-summary"><h2>Selected items summary</h2><p className="hc-cart-selected-note">{selectedLines} product {selectedLines===1?"option":"options"} · {selectedUnits} {selectedUnits===1?"item":"items"} selected</p><div className="hc-cart-totals">
     {selectedLines===0&&<p className="hc-cart-select-prompt">Tick at least one item to see your selected total.</p>}
     {cny>0&&<p><span>Products priced in CNY</span><strong className="hc-cart-dual-total">{money("CNY",cny)}<small>{fx?"≈ "+convertedGbp(cny):fxUnavailable?"GBP estimate unavailable":"Calculating GBP…"}</small></strong></p>}
     {gbp>0&&<p><span>Products priced in GBP</span><strong>{money("GBP",gbp)}</strong></p>}
     {selectedLines>0&&estimatedGbp!==null&&<p className="hc-cart-gbp-total"><span>{pricesMissing?"Priced items, approx. GBP":"Estimated product subtotal (GBP)"}</span><strong>{(cny>0?"≈ ":"")+money("GBP",estimatedGbp)}</strong></p>}
     {pricesMissing&&<p><span>Some prices</span><strong>Unavailable</strong></p>}
     {selectedLines>0&&estimatedGbp!==null&&!pricesMissing&&<p><span>Herocon procurement fee</span><strong>≈ {money("GBP",Math.round(estimatedGbp*7)/100)}</strong></p>}<p><span>Chinese domestic delivery</span><strong>{!selectedLines?"—":remainingUnknown===0?(domesticGbp!==null?money("GBP",domesticGbp):money("CNY",freight.knownFen/100)+(fallbackCount?" + "+money("GBP",fallbackCount*.99):""))+ (fallbackCount?" (estimate)":""):((freight.knownFen>0||fallbackCount)?(domesticGbp!==null?money("GBP",domesticGbp):money("CNY",freight.knownFen/100)+(fallbackCount?" + "+money("GBP",fallbackCount*.99):""))+" + unconfirmed":"Unconfirmed")}</strong></p>{selectedLines>0&&<><p className="hc-cart-gbp-total"><span>Estimated first payment</span><strong>{payment?"≈ "+money("GBP",payment.totalMinor/100):"Pending quote"}</strong></p><p className="hc-cart-bulk-note">Recorded freight counted once per listing, not per option. {fallbackCount>0&&"Lightweight listings without recorded freight use a £0.99 Herocon estimate, not a supplier quote. "}Final freight depends on quantity, seller grouping and warehouse address.</p></>}<p><span>International delivery</span><strong>Paid separately</strong></p>
    </div>
    {account.ownerPremium&&<>
     {selectedLines>0?<Link className="hc-cart-bulk-buy" href="/owner/checkout">Checkout <ArrowIcon direction="right"/></Link>:<button className="hc-cart-bulk-buy" disabled>Select products to buy</button>}
     <p className="hc-cart-bulk-note">Owner-only test checkout. Verify supplier options, review the order and make a simulated payment. No actual money is charged.</p>
    </>}
    {!account.ownerPremium&&<><button className="hc-cart-bulk-buy" disabled>Checkout coming soon</button><p className="hc-cart-bulk-note">Final supplier price and delivery must be verified before payment.</p></>}
    <Link className="hc-cart-shop" href="/search">Continue shopping</Link>
    </aside></div>}
  </section>
 </main>;
}
