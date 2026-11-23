"use client";

import {useState} from "react";
import styles from "./demo.module.css";

const MARKETPLACE_URL="https://detail.1688.com/offer/707894765921.html";
const PHOTO="https://img.alicdn.com/img/ibank/O1CN01R69vNP2IJQToY4OGh_!!2201218109265-0-cib.jpg_720x720q70.jpg_.webp";
const PRODUCT_PRICE=19.95;
const POSTAGE=5.00;
const money=(n:number)=>new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(n);
const stages=[
 {title:"Order received",detail:"Herocon records the single sample payment.",owner:"Validated Stripe payment would trigger an idempotent order handoff."},
 {title:"Purchasing",detail:"Your item is being purchased from the supplier.",owner:"BuckyDrop Shop Order created; prepaid procurement must be independently confirmed."},
 {title:"Warehouse inspection",detail:"The item has arrived and is being checked.",owner:"Warehouse receipt and QC event; verify actual parcel weight and shipping."},
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
 const total=PRODUCT_PRICE*quantity+POSTAGE;
 function reset(){setScreen("product");setDeliveryStep(0);setAccepted(false);}
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
    <div><h1>One product.<br/><em>One seamless order.</em></h1><p>See how shopping, a single GBP payment and behind-the-scenes fulfilment could work on Herocon.</p></div>
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
      <div className={styles.perks}><span>Included:  One clear GBP payment</span><span>Included:  Shipping included at checkout</span><span>Included:  Order updates on Herocon</span></div>
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
      <div className={styles.line}><span>International delivery</span><strong>{money(POSTAGE)}</strong></div>
      <div className={styles.line}><span>Extra shipping later</span><strong>£0.00</strong></div>
      <div className={styles.total}><span>Total today</span><strong>{money(total)}</strong></div>
      <button className={styles.primary} onClick={()=>setScreen("checkout")}>Continue to secure checkout <span></span></button>
      <p className={styles.bottomNote}>No payment is requested in this demonstration.</p>
     </>}
     {screen==="checkout"&&<>
      <div className={styles.panelKicker}>STEP TWO</div><h3>One payment.<br/>Everything included.</h3><p className={styles.muted}>This is how the customer would review their order before paying with Stripe.</p>
      <div className={styles.summaryBox}>
       <div className={styles.line}><span>Heavyweight cotton T-shirt<br/><small>White · Size {size} · Qty {quantity}</small></span><strong>{money(PRODUCT_PRICE*quantity)}</strong></div>
       <div className={styles.line}><span>Delivery to United Kingdom</span><strong>{money(POSTAGE)}</strong></div>
       <div className={styles.line}><span>Additional payment after checkout</span><strong>£0.00</strong></div>
      </div>
      <div className={styles.total}><span>Pay once, in GBP</span><strong>{money(total)}</strong></div>
      <div className={styles.checkoutNotice}>Illustrative checkout only. Actual shipping, supplier stock, taxes and final costs need verification before a real order can be accepted.</div>
      <label className={styles.accept}><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>I understand this is a simulation and no real payment will be processed.</span></label>
      <button className={styles.primary} disabled={!accepted} onClick={()=>{setScreen("tracking");setDeliveryStep(0);}}>Simulate £{total.toFixed(2)} payment <span></span></button>
      <button className={styles.secondary} onClick={()=>setScreen("product")}> Back to product</button>
     </>}
     {screen==="tracking"&&<>
      <div className={styles.panelKicker}>STEP THREE</div>
      <div className={styles.checkCircle}>Included: </div>
      <h3>Order preview<br/><em>confirmed.</em></h3>
      <p className={styles.muted}>Reference <strong>HC-DEMO-001</strong><br/>Total simulated: <strong>{money(total)}</strong></p>
      <div className={styles.timeline}>{stages.map((item,i)=><div key={item.title} className={styles.timelineRow}>
       <div className={i<=deliveryStep?styles.timelineDotActive:styles.timelineDot}>{i<deliveryStep?"Included: ":i===deliveryStep?"Active":""}</div>
       <div><strong className={i<=deliveryStep?styles.timelineTextActive:styles.timelineText}>{item.title}</strong>{i===deliveryStep&&<p>{item.detail}</p>}</div>
      </div>)}</div>
      {showOwner&&<div className={styles.ownerBox}><div className={styles.ownerBoxTitle}>BuckyDrop merchant event</div><p>{stages[deliveryStep].owner}</p><p>No external API call is made in this demo.</p></div>}
      {deliveryStep<stages.length-1&&<button className={styles.primary} onClick={()=>setDeliveryStep(Math.min(stages.length-1,deliveryStep+1))}>Simulate next order update <span></span></button>}
      <button className={styles.secondary} onClick={reset}> Restart demo</button>
     </>}
    </section>
   </div>
   <footer className={styles.footer}><span>HEROCON · PREVIEW EXPERIENCE</span><span>Catalogue product reference is real. Variant, GBP prices, payment and fulfilment are simulated.</span></footer>
  </main>
 </div>
}
