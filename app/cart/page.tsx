"use client";
import {ArrowIcon} from "@/components/ArrowIcon";
import {useEffect,useState} from "react";
import Link from "next/link";
import Header from "@/components/Header";
import {useCart} from "@/components/CartProvider";

const money=(currency:"CNY"|"GBP",value:number)=>currency==="CNY"?"¥"+value.toFixed(2):"£"+value.toFixed(2);
export default function CartPage(){
 const {items,count,hydrated,account,updateQuantity,setItemSelected,selectAllItems,removeItem,clearCart}=useCart();
 const [fx,setFx]=useState<{rate:number;date:string}|null>(null);
 const [fxUnavailable,setFxUnavailable]=useState(false);
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
 const cny=selectedItems.reduce((sum,item)=>sum+(item.currency==="CNY"&&item.unitPrice!=null?item.unitPrice*item.quantity:0),0);
 const gbp=selectedItems.reduce((sum,item)=>sum+(item.currency==="GBP"&&item.unitPrice!=null?item.unitPrice*item.quantity:0),0);
 const pricesMissing=selectedItems.some(item=>item.unitPrice==null);
 const estimatedGbp=fx?gbp+cny*fx.rate:cny===0?gbp:null;
 const convertedGbp=(value:number)=>fx?money("GBP",value*fx.rate):null;
 return <main className="hc-cart-page"><Header/>
  <section className="sc-page-hero sc-container hc-cart-hero">
   <p className="sc-kicker">YOUR SHOPPING CART</p>
   <h1>Your <em>cart.</em></h1>
   <p>{account.ownerPremium?"Owner Premium active. Verify your selected products with HioBuy before ordering. Live payments remain disabled.":"Keep track of products you like and compare original marketplace listings. Product checkout is currently limited to the owner pilot."}</p>
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
      <div className="hc-cart-copy"><Link href={item.productPath} className="hc-cart-title">{item.title}</Link>{item.variant&&<p>{item.variant}</p>}
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
     <p><span>International delivery</span><strong>Not included</strong></p>
    </div>
    {account.ownerPremium&&<>
     <Link className="hc-cart-bulk-buy" href="/owner/hiobuy">HioBuy fulfilment setup <ArrowIcon direction="right"/></Link>
     <p className="hc-cart-bulk-note">Existing cart selections are preserved. New supplier IDs, variants and costs must be verified before checkout. No order or payment is submitted here.</p>
    </>}
    <Link className="hc-cart-shop" href="/search">Continue shopping</Link>
    </aside></div>}
  </section>
 </main>;
}
