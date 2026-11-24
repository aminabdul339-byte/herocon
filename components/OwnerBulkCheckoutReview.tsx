"use client";

import {useState} from "react";
import Link from "next/link";
import {ArrowIcon} from "@/components/ArrowIcon";
import {useCart} from "@/components/CartProvider";
import styles from "./owner-bulk.module.css";

type VerifiedLine={
 marketplaceUrl:string;skuCode:string;quantity:number;title:string;
 status:"confirmed"|"unverified"|"unavailable";reason:string;
 supplierUnitCny:number|null;supplierSubtotalCny:number|null;supplierStock:number|null;
};
type VerificationResponse={
 lines?:VerifiedLine[];allConfirmed?:boolean;verifiedAt?:string;error?:string;
};
type Verification={key:string;rows:VerifiedLine[];allConfirmed:boolean;at:string};

const MAX_OPTIONS=10;
const MAX_PER_CHECK=5;
const money=(currency:"CNY"|"GBP",value:number)=>(currency==="CNY"?"¥":"£")+value.toFixed(2);

/** The cart is client-side preference storage, not an authority for a bill.
 * Only the server's current BuckyDrop SKU/stock response can validate availability.
 * No Stripe or supplier write is reachable from this review component. */
export default function OwnerBulkCheckoutReview(){
 const {items,hydrated,account}=useCart();
 const selected=items.filter(item=>item.selected!==false);
 const count=selected.reduce((n,item)=>n+item.quantity,0);
 const missingSku=selected.filter(item=>!item.skuCode);
 const invalidQuantity=selected.filter(item=>!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>99);
 const hasHio=selected.some(item=>item.source==="hiobuy"||item.productId.startsWith("hiobuy:"));
 const canVerify=!hasHio&&selected.length>0&&selected.length<=MAX_OPTIONS&&missingSku.length===0&&invalidQuantity.length===0;
 const key=selected.map(item=>[item.key,item.skuCode||"",item.quantity,item.selected].join("::")).join("|");
 const [working,setWorking]=useState(false);
 const [error,setError]=useState("");
 const [verification,setVerification]=useState<Verification|null>(null);
 const current=verification?.key===key?verification:null;
 const cny=selected.reduce((n,item)=>n+(item.currency==="CNY"&&item.unitPrice!=null?item.unitPrice*item.quantity:0),0);
 const gbp=selected.reduce((n,item)=>n+(item.currency==="GBP"&&item.unitPrice!=null?item.unitPrice*item.quantity:0),0);

 async function verifySelected(){
  if(working||!canVerify||account.ownerPremium!==true)return;
  setWorking(true);setError("");setVerification(null);
  try{
   const rows:VerifiedLine[]=[];
   // Two explicit requests maximum; existing server route accepts only five
   // source variants per request and rate-limits billable provider lookups.
   for(let start=0;start<selected.length;start+=MAX_PER_CHECK){
    const chunk=selected.slice(start,start+MAX_PER_CHECK);
    const response=await fetch("/api/checkout/readiness",{
     method:"POST",credentials:"same-origin",cache:"no-store",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({lines:chunk.map(item=>({
      marketplaceUrl:item.marketplaceUrl,skuCode:item.skuCode,
      quantity:item.quantity,title:item.title
     }))})
    });
    const data=await response.json() as VerificationResponse;
    if(!response.ok||!Array.isArray(data.lines)||data.lines.length!==chunk.length)
     throw Error(data.error||"BuckyDrop could not verify the selected supplier products.");
    rows.push(...data.lines);
   }
   setVerification({
    key,rows,allConfirmed:rows.every(x=>x.status==="confirmed"),
    at:new Date().toISOString()
   });
  }catch(e){
   setError(e instanceof Error?e.message:"Supplier verification failed. No order was submitted.");
  }finally{setWorking(false);}
 }
 return <section className={styles.shell}>
  <div className={styles.eyebrow}>HEROCON / OWNER PREMIUM / MULTI-ITEM PURCHASE</div>
  <Link className={styles.back} href="/cart"><ArrowIcon direction="left"/> Back to cart</Link>
  <div className={styles.heading}>
   <div>
    <h1>Buy your <em>selected items.</em></h1>
    <p>Bulk-buy review for your complimentary Owner Premium account. Only checked items from your cart appear here. You can verify their supplier availability without paying £9.99 or requesting a manual quote.</p>
   </div>
   <span className={styles.privateTag}>OWNER-ONLY PILOT</span>
  </div>
  {!hydrated||account.status==="checking"?<div className={styles.empty}>Loading your selected products…</div>:
   account.ownerPremium!==true?<div className={styles.empty}>Your verified Owner Premium account is required to review an order. <Link href="/account">Refresh your sign-in</Link>.</div>:
   selected.length===0?<div className={styles.empty}>
    <h2>No products selected.</h2>
    <p>Tick the products you want to buy in your cart, then return here.</p>
    <Link href="/cart">Choose items in your cart</Link>
   </div>:
   <div className={styles.columns}>
    <div className={styles.items}>
     <div className={styles.itemHeading}>
      <h2>Your selected products</h2>
      <span>{selected.length} {selected.length===1?"option":"options"} · {count} {count===1?"item":"items"}</span>
     </div>
     {selected.map((item,i)=>{
      const check=current?.rows[i];
      return <article className={styles.item} key={item.key}>
       <Link href={item.productPath} className={styles.imageLink}>
        {item.image?<img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer"/>:<span>Product image</span>}
       </Link>
       <div className={styles.itemContent}>
        <Link href={item.productPath} className={styles.itemTitle}>{item.title}</Link>
        {item.variant&&<p className={styles.variant}>{item.variant}</p>}
        <div className={styles.itemDetails}>
         <span>Quantity <strong>{item.quantity}</strong></span>
         <span>Recorded item total <strong>{item.unitPrice==null?"Unpriced":money(item.currency,item.unitPrice*item.quantity)}</strong></span>
        </div>
        {(item.source==="hiobuy"||item.productId.startsWith("hiobuy:"))?<p className={styles.warning}>HIOBuy checkout pending.</p>:!item.skuCode?<p className={styles.warning}>Exact BuckyDrop SKU not saved. <Link href={"/pilot/buckydrop?productId="+encodeURIComponent(item.productId)+"&quantity="+Math.min(99,item.quantity)}>Choose supplier variant</Link> before live verification.</p>:
         <p className={styles.sku}>Supplier SKU: {item.skuCode}</p>}
        {item.quantity>99&&<p className={styles.warning}>For this trial, reduce this item to 99 units or fewer in the cart.</p>}
        {check&&<div className={check.status==="confirmed"?styles.verified:styles.warning}>
         <strong>{check.status==="confirmed"?"Supplier stock confirmed":check.status==="unavailable"?"Supplier unavailable":"Supplier not verified"}</strong>
         <span>{check.reason}</span>
         {check.status==="confirmed"&&<span>Current supplier subtotal: {check.supplierSubtotalCny?.toFixed(2)} CNY</span>}
        </div>}
       </div>
      </article>;
     })}
     <p className={styles.info}>Supplier stock, costs and options can change. Catalogue prices shown above are references, not a payment offer. Your selected items stay in the cart until you decide to remove them.</p>
    </div>
    <aside className={styles.summary}>
     <div className={styles.summaryEyebrow}>BULK ORDER SUMMARY</div>
     <h2>{count} selected {count===1?"item":"items"}</h2>
     <div className={styles.line}><span>Selected supplier options</span><strong>{selected.length}</strong></div>
     {cny>0&&<div className={styles.line}><span>Recorded CNY subtotal</span><strong>{money("CNY",cny)}</strong></div>}
     {gbp>0&&<div className={styles.line}><span>Recorded GBP subtotal</span><strong>{money("GBP",gbp)}</strong></div>}
     <div className={styles.line}><span>Herocon service fee</span><strong>£0.99</strong></div>
     <div className={styles.line}><span>Estimated international delivery</span><strong>To confirm</strong></div>
     <div className={styles.line}><span>Applicable taxes and duties</span><strong>To confirm</strong></div>
     <div className={styles.total}><span>Final GBP payable</span><strong>Not yet available</strong></div>
     {hasHio&&<p className={styles.warning}>HIOBuy items cannot be verified through BuckyDrop. Return to your cart and deselect them.</p>}
     {selected.length>MAX_OPTIONS&&<p className={styles.warning}>The first pilot supports up to {MAX_OPTIONS} options at a time. Return to your cart and deselect some options to check a smaller group.</p>}
     {missingSku.length>0&&<p className={styles.warning}>{missingSku.length} option(s) need their exact BuckyDrop SKU selected. Use the links beside those items.</p>}
     <button className={styles.verifyButton} type="button" onClick={verifySelected} disabled={!canVerify||working}>
      {working?"Checking selected supplier stock…":current?"Recheck current supplier stock":"Check live supplier stock"}
     </button>
     {current&&<p className={current.allConfirmed?styles.verified:styles.warning}>
      {current.allConfirmed?"All selected supplier SKUs and stock confirmed.":"Some items need your attention before purchase."}
     </p>}
     {error&&<p role="alert" className={styles.warning}>{error}</p>}
     <p className={styles.info}>Checking stock can use metered BuckyDrop product lookups. This is a read-only check; no goods are ordered or paid for.</p>
     <button className={styles.payButton} type="button" disabled>
      Pay for selected items · not enabled
     </button>
     <p className={styles.paymentNote}>Actual checkout is still disabled while Herocon verifies final GBP pricing, shipping adjustments, BuckyDrop parcel hold/release and payment settlement. No card charge will occur on this page.</p>
     <Link className={styles.secondary} href="/cart">Edit selected products</Link>
    </aside>
   </div>}
 </section>;
}
