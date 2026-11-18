"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import Header from "@/components/Header";
import {useCart} from "@/components/CartProvider";

const money=(currency:"CNY"|"GBP",value:number)=>currency==="CNY"?"¥"+value.toFixed(2):"£"+value.toFixed(2);
export default function CartPage(){
 const {items,count,hydrated,updateQuantity,removeItem,clearCart}=useCart();
 const [checkout,setCheckout]=useState(false);
 const [fx,setFx]=useState<{rate:number;date:string}|null>(null);
 const [fxUnavailable,setFxUnavailable]=useState(false);
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
 const cny=items.reduce((sum,item)=>sum+(item.currency==="CNY"&&item.unitPrice!=null?item.unitPrice*item.quantity:0),0);
 const gbp=items.reduce((sum,item)=>sum+(item.currency==="GBP"&&item.unitPrice!=null?item.unitPrice*item.quantity:0),0);
 const pricesMissing=items.some(item=>item.unitPrice==null);
 const estimatedGbp=fx?gbp+cny*fx.rate:cny===0?gbp:null;
 const convertedGbp=(value:number)=>fx?money("GBP",value*fx.rate):null;
 return <main className="hc-cart-page"><Header/>
  <section className="sc-page-hero sc-container hc-cart-hero">
   <p className="sc-kicker">{checkout?"ORDER REVIEW":"YOUR SHOPPING CART"}</p>
   <h1>{checkout?"Review your ":"Your "}<em>{checkout?"selection.":"cart."}</em></h1>
   <p>Keep your favourite products and seller options together.</p>
  </section>
  <section className="sc-container hc-cart-wrap" aria-live="polite">
   {!hydrated?<p>Loading your cart…</p>:items.length===0?
    <div className="hc-cart-empty"><h2>Your cart is empty.</h2><p>Explore the catalogue and add products to get started.</p><Link href="/search" className="sc-button sc-button-dark">Explore products ↗</Link></div>:
    <div className="hc-cart-layout"><div className="hc-cart-lines">
     <div className="hc-cart-head"><h2>{count} {count===1?"item":"items"}</h2><button type="button" onClick={clearCart}>Clear cart</button></div>
     {items.map(item=><article className="hc-cart-line" key={item.key}>
      <Link href={item.productPath} className="hc-cart-image">{item.image?<img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer"/>:<span>Product</span>}</Link>
      <div className="hc-cart-copy"><Link href={item.productPath} className="hc-cart-title">{item.title}</Link>{item.variant&&<p>{item.variant}</p>}
       <a href={item.marketplaceUrl} target="_blank" rel="noopener noreferrer">Direct product link ↗</a>
       <div className="hc-cart-controls"><label htmlFor={"cart-qty-"+items.indexOf(item)}>Quantity</label><input id={"cart-qty-"+items.indexOf(item)} type="number" min={1} max={999} value={item.quantity} onChange={e=>{const v=Number(e.target.value);if(Number.isFinite(v)&&v>0)updateQuantity(item.key,v);}}/><button type="button" onClick={()=>removeItem(item.key)}>Remove</button></div>
      </div>
      <strong className="hc-cart-price">{item.unitPrice==null?"Price on request":<>
       <span>{money(item.currency,item.unitPrice*item.quantity)}</span>
       {item.currency==="CNY"&&<small>{fx?"≈ "+convertedGbp(item.unitPrice*item.quantity):fxUnavailable?"GBP estimate unavailable":"Calculating GBP…"}</small>}
      </>}</strong>
     </article>)}
    </div>
    <aside className="hc-cart-summary"><h2>{checkout?"Order summary":"Cart summary"}</h2><div className="hc-cart-totals">
     {cny>0&&<p><span>Products priced in CNY</span><strong className="hc-cart-dual-total">{money("CNY",cny)}<small>{fx?"≈ "+convertedGbp(cny):fxUnavailable?"GBP estimate unavailable":"Calculating GBP…"}</small></strong></p>}
     {gbp>0&&<p><span>Products priced in GBP</span><strong>{money("GBP",gbp)}</strong></p>}
     {estimatedGbp!==null&&<p className="hc-cart-gbp-total"><span>{pricesMissing?"Priced items, approx. GBP":"Estimated product subtotal (GBP)"}</span><strong>{(cny>0?"≈ ":"")+money("GBP",estimatedGbp)}</strong></p>}
     {pricesMissing&&<p><span>Some prices</span><strong>On request</strong></p>}
     <p><span>Shipping and taxes</span><strong>Not calculated</strong></p>
    </div>
    {fx&&cny>0&&<p className="hc-cart-fx-note">Approximate CNY to GBP conversion using the {fx.date} reference exchange rate. Actual rates may differ.</p>}
    <div className="hc-cart-checkout-note"><strong>Checkout is coming soon</strong><p>Your cart is saved in this browser. You can compare delivery estimates now; payment and supplier order submission remain disabled until secure checkout is verified.</p></div>
    <Link className="sc-button sc-button-dark hc-cart-shop" href="/landed-cost">Estimate shipping ↗</Link><Link className="sc-button sc-button-outline hc-cart-shop" href="/orders">Track an order ↗</Link><Link className="hc-cart-shop" href="/search">Continue shopping ↗</Link>
    </aside></div>}
  </section>
 </main>;
}
