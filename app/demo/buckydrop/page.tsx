"use client";

import {useState} from "react";
import styles from "./demo.module.css";

const MARKETPLACE_URL="https://detail.1688.com/offer/707894765921.html";
const PHOTO="https://img.alicdn.com/img/ibank/O1CN01R69vNP2IJQToY4OGh_!!2201218109265-0-cib.jpg_720x720q70.jpg_.webp";
const PRODUCT_PRICE=19.95;
const POSTAGE=5.00; // Sample upfront estimated shipping, not a live BuckyDrop quote.
const SERVICE_FEE=0.99; // One transparent Herocon service fee per order.
const TOP_UP_REVIEW_LIMIT=5.00; // Illustrative approval threshold, not an agreed legal term.
const money=(n:number)=>new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(n);
const stages=[
 {title:"Order received",detail:"Herocon records the initial payment, including estimated postage and its 99p service fee.",owner:"Validated Stripe payment would trigger an idempotent order handoff."},
 {title:"Purchasing",detail:"Your item is being purchased from the supplier.",owner:"BuckyDrop Shop Order created; prepaid procurement must be independently confirmed."},
 {title:"Warehouse shipping review",detail:"The actual packed weight is confirmed and shipping is reconciled.",owner:"Warehouse receipt and carrier quotation trigger an adjustment review, not an automatic new charge."},
 {title:"Dispatched",detail:"Your parcel is on its way.",owner:"Provider creates parcel and sends tracking to Herocon."},
 {title:"Delivered",detail:"Delivery completed.",owner:"Carrier tracking records delivery; customer status updated."},
];

export default function BuckydropDemo(){
 const [size,setSize]=useState("M");
 const [quantity,setQuantity]=useState(1);
 const [screen,setScreen]=useState<"product"|"checkout"|"tracking">("product");
 const [deliveryStep,setDeliveryStep]=useState(0);
 const [showOwner,setShowOwner]=useState(false);
 const [photoFailed,setPhotoFailed]=useState(false);
 const [accepted,setAccepted]=useState(false);
 const [actualShipping,setActualShipping]=useState(7.40);
 const [adjustmentDone,setAdjustmentDone]=useState(false);
 const initialTotal=Number((PRODUCT_PRICE*quantity+POSTAGE+SERVICE_FEE).toFixed(2));
 const difference=Number((actualShipping-POSTAGE).toFixed(2));
 const topUp=Math.max(0,difference);
 const refund=Math.max(0,-difference);
 const reviewRequired=topUp>TOP_UP_REVIEW_LIMIT;
 const adjustmentRequired=difference!==0;
 function reset(){setScreen("product");setDeliveryStep(0);setAccepted(false);setActualShipping(7.40);setAdjustmentDone(false);}
 return <div className={styles.root}>
  <div className={styles.topStrip}>INTERACTIVE PREVIEW · NO REAL PAYMENTS · NO SUPPLIER ORDERS</div>
  <header className={styles.header}>
   <a href="/demo/buckydrop" className={styles.logo}>HEROCON<span className={styles.logoDot}>.</span></a>
   <nav aria-label="Demo navigation" className={styles.nav}><span>Discover</span><span>New arrivals</span><span>About</span></nav>
   <div className={styles.headerRight}><span className={styles.tag}>Fulfilment concept</span><button className={styles.ownerSwitch} onClick={()=>setShowOwner(!showOwner)} aria-pressed={showOwner}>{showOwner?"View as customer":"View as merchant"}</button></div>
  </header>
  <main className={styles.main}>
   <div className={styles.eyebrow}>HEROCON / PRODUCT EXPERIENCE / DEMO 01</div>
   <div className={styles.intro}>
    <div><h1>One product.<br/><em>Clear shipping costs.</em></h1><p>Pay for your items and estimated delivery, then review any final warehouse shipping adjustment before dispatch.</p></div>
    <div className={styles.stepPills}>
     {["01 Select","02 Checkout","03 Track"].map((label,i)=><span key={label} className={i===(screen==="product"?0:screen==="checkout"?1:2)?styles.stepActive:styles.stepPill}>{label}</span>)}
    </div>
   </div>
   <div className={styles.layout}>
    <section className={styles.productCard}>
     <div className={styles.photoBox}>
      {!photoFailed?<img className={styles.productPhoto} src={PHOTO} alt="230gsm cotton T-shirt product listing image" referrerPolicy="no-referrer" onError={()=>setPhotoFailed(true)}/>:<div className={styles.fallback}><span>HEROCON</span><strong>Heavyweight cotton tee</strong><small>Catalogue image unavailable</small></div>}
      <span className={styles.photoBadge}>From the Herocon catalogue</span>
     </div>
     <div className={styles.productInfo}>
      <div className={styles.productEyebrow}>EVERYDAY ESSENTIALS / 230G COTTON</div>
      <h2>Heavyweight cotton<br/>crewneck T-shirt</h2>
      <p className={styles.productSub}>Loose fit · Unisex · Plain white</p>
      <div className={styles.price}>{money(PRODUCT_PRICE)} <span>/ piece · sample retail price</span></div>
      <div className={styles.separator}/>
      <p className={styles.detail}>This example uses a real Herocon catalogue product link. Sizes, retail pricing, stock and shipping amounts are <b>illustrative</b>, not verified live supplier quotations.</p>
      <div className={styles.perks}><span>Initial GBP price shown clearly</span><span>99p Herocon service fee per order</span><span>Final shipping adjustment only with your approval</span></div>
      {showOwner&&<div className={styles.ownerBox}>
       <div className={styles.ownerBoxTitle}>Merchant-only sourcing data</div>
       <p>Source: 1688 · Catalogue ID: 75hQ5VG5QTLdpDC1MluyLg</p>
       <p>Exact BuckyDrop SKU: <strong>not verified</strong></p>
       <a href={MARKETPLACE_URL} target="_blank" rel="noreferrer">Open original supplier listing </a>
      </div>}
     </div>
    </section>
    <section className={styles.actionPanel}>
     {screen==="product"&&<>
      <div className={styles.panelKicker}>STEP ONE</div><h3>Make it yours.</h3><p className={styles.muted}>Choose a sample variant and quantity to try the checkout journey.</p>
      <div className={styles.fieldLabel}>Size <span>Demo selection</span></div>
      <div className={styles.sizes}>{["S","M","L","XL"].map(s=><button key={s} onClick={()=>setSize(s)} aria-pressed={size===s} className={size===s?styles.sizeActive:styles.size}>{s}</button>)}</div>
      <div className={styles.fieldLabel}>Quantity</div>
      <div className={styles.quantity}><button aria-label="Decrease quantity" onClick={()=>setQuantity(Math.max(1,quantity-1))}>−</button><strong>{quantity}</strong><button aria-label="Increase quantity" onClick={()=>setQuantity(Math.min(5,quantity+1))}>+</button></div>
      <div className={styles.separator}/>
      <div className={styles.line}><span>Items</span><strong>{money(PRODUCT_PRICE*quantity)}</strong></div>
      <div className={styles.line}><span>Estimated international delivery</span><strong>{money(POSTAGE)}</strong></div>
      <div className={styles.line}><span>Herocon service fee · per order</span><strong>{money(SERVICE_FEE)}</strong></div>
      <div className={styles.total}><span>Initial estimated total</span><strong>{money(initialTotal)}</strong></div>
      <p className={styles.bottomNote}>Actual shipping is confirmed after warehouse packing and may require a separate customer-approved payment.</p>
      <button className={styles.primary} onClick={()=>setScreen("checkout")}>Continue to secure checkout <span></span></button>
      <p className={styles.bottomNote}>No payment is requested in this demonstration.</p>
     </>}
     {screen==="checkout"&&<>
      <div className={styles.panelKicker}>STEP TWO</div><h3>Clear upfront<br/>pricing.</h3><p className={styles.muted}>The customer pays this estimated total first. Any shipping adjustment needs separate approval before dispatch.</p>
      <div className={styles.summaryBox}>
       <div className={styles.line}><span>Heavyweight cotton T-shirt<br/><small>White · Size {size} · Qty {quantity}</small></span><strong>{money(PRODUCT_PRICE*quantity)}</strong></div>
       <div className={styles.line}><span>Estimated UK international delivery</span><strong>{money(POSTAGE)}</strong></div>
       <div className={styles.line}><span>Herocon service fee · per order</span><strong>{money(SERVICE_FEE)}</strong></div>
      </div>
      <div className={styles.total}><span>Pay initially, in GBP</span><strong>{money(initialTotal)}</strong></div>
      <div className={styles.checkoutNotice}><strong>Estimated shipping — may change.</strong> Once the parcel is weighed in China, Herocon will notify you if shipping is higher and request your separate approval and payment before dispatch. For this demonstration, differences above £5 require manual review rather than automatic collection. No extra payment is taken without your confirmation.</div>
      <label className={styles.accept}><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>I understand this is a demo and the £5.00 shipping price is an estimate. A real order could require an additional shipping payment after warehouse weighing, which I would need to review and approve separately before dispatch.</span></label>
      <button className={styles.primary} disabled={!accepted} onClick={()=>{setScreen("tracking");setDeliveryStep(0);setAdjustmentDone(false);}}>Simulate initial £{initialTotal.toFixed(2)} payment <span></span></button>
      <button className={styles.secondary} onClick={()=>setScreen("product")}> Back to product</button>
     </>}
     {screen==="tracking"&&<>
      <div className={styles.panelKicker}>STEP THREE</div>
      <div className={styles.checkCircle}>Included: </div>
      <h3>Order preview<br/><em>confirmed.</em></h3>
      <p className={styles.muted}>Reference <strong>HC-DEMO-001</strong><br/>Initial payment: <strong>{money(initialTotal)}</strong><br/>Service fee included: <strong>{money(SERVICE_FEE)}</strong></p>
      <div className={styles.timeline}>{stages.map((item,i)=><div key={item.title} className={styles.timelineRow}>
       <div className={i<=deliveryStep?styles.timelineDotActive:styles.timelineDot}>{i<deliveryStep?"Included: ":i===deliveryStep?"Active":""}</div>
       <div><strong className={i<=deliveryStep?styles.timelineTextActive:styles.timelineText}>{item.title}</strong>{i===deliveryStep&&<p>{item.detail}</p>}</div>
      </div>)}</div>
      {deliveryStep===2&&<div className={styles.shippingReview}>
       <div className={styles.ownerBoxTitle}>Warehouse freight reconciliation · simulated</div>
       <p className={styles.muted}>Choose a sample final freight cost to see what the customer would be asked to do.</p>
       <label className={styles.fieldLabel} htmlFor="final-shipping">Carrier-confirmed international shipping</label>
       <select id="final-shipping" className={styles.shippingSelect} value={actualShipping} onChange={e=>{setActualShipping(Number(e.target.value));setAdjustmentDone(false);}}>
        <option value="4">£4.00 — cheaper than estimate</option>
        <option value="5">£5.00 — same as estimate</option>
        <option value="7.4">£7.40 — moderate increase</option>
        <option value="12.5">£12.50 — larger increase</option>
       </select>
       <div className={styles.line}><span>Shipping already paid</span><strong>{money(POSTAGE)}</strong></div>
       <div className={styles.line}><span>Final shipping</span><strong>{money(actualShipping)}</strong></div>
       {difference>0&&<div className={styles.adjustmentTotal}><span>Additional shipping requested</span><strong>{money(topUp)}</strong></div>}
       {difference<0&&<div className={styles.adjustmentTotal}><span>Shipping overpayment to refund</span><strong>{money(refund)}</strong></div>}
       {difference===0&&<p className={styles.shippingSuccess}>No shipping adjustment required. The original estimate was correct.</p>}
       {reviewRequired&&<p className={styles.checkoutNotice}>This increase is above the example £5 review threshold. Shipping is paused; Herocon must offer a revised quote and appropriate refund or cancellation options. No extra payment is processed automatically.</p>}
       {!reviewRequired&&adjustmentRequired&&!adjustmentDone&&<button className={styles.primary} onClick={()=>setAdjustmentDone(true)}>
        {difference>0?"Simulate customer approval and £"+topUp.toFixed(2)+" top-up":"Simulate £"+refund.toFixed(2)+" refund"} <span></span>
       </button>}
       {!reviewRequired&&adjustmentRequired&&adjustmentDone&&<p className={styles.shippingSuccess}>{difference>0?"Customer-approved extra payment simulated.":"Shipping refund simulated."} Ready for dispatch.</p>}
      </div>}
      {showOwner&&<div className={styles.ownerBox}><div className={styles.ownerBoxTitle}>BuckyDrop merchant event</div><p>{stages[deliveryStep].owner}</p><p>No external API call is made in this demo.</p></div>}
      {deliveryStep<stages.length-1&&<button className={styles.primary} disabled={deliveryStep===2&&(reviewRequired||(adjustmentRequired&&!adjustmentDone))} onClick={()=>setDeliveryStep(Math.min(stages.length-1,deliveryStep+1))}>Simulate next order update <span></span></button>}
      <button className={styles.secondary} onClick={reset}> Restart demo</button>
     </>}
    </section>
   </div>
   <footer className={styles.footer}><span>HEROCON · PREVIEW EXPERIENCE</span><span>Catalogue product reference is real. All GBP prices, payment, adjustments and fulfilment events are simulated.</span></footer>
  </main>
 </div>
}
