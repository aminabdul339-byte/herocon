"use client";

import {useState} from "react";
import Link from "next/link";

type SupplierVariant={
 skuCode:string;label:string;priceCNY:number|null;stock:number|null;
 available:boolean;options:Array<{name:string;value:string}>;
};
type Preflight={
 ok:boolean;error?:string;title?:string;provider?:string;
 sourceMarketplaceUrl?:string;checkedAt?:string;minimumQuantity?:number|null;
 available?:boolean|null;variants?:SupplierVariant[];sourceVariantCount?:number;
 note?:string;
};
type Props={
 productId:string;title:string;imageUrl?:string;recordedPrice?:number;
 sourceUrl:string;initialSku?:string;initialQuantity?:number;
};

const baseInput:React.CSSProperties={boxSizing:"border-box",width:"100%",padding:"13px",borderRadius:12,border:"1px solid #cbd9c7",background:"#fff",color:"#284a31",fontSize:13};
const money=(n:number)=>new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(n);

export default function BuckydropPilotPreflight({productId,title,imageUrl,recordedPrice,sourceUrl,initialSku="",initialQuantity=1}:Props){
 const [loading,setLoading]=useState(false);
 const [result,setResult]=useState<Preflight|null>(null);
 const [variant,setVariant]=useState("");
 const [quantity,setQuantity]=useState(initialQuantity);
 const [reviewing,setReviewing]=useState(false);
 const chosen=result?.variants?.find(x=>x.skuCode===variant);
 async function check(){
  if(loading)return;
  setLoading(true);setResult(null);setVariant("");setReviewing(false);
  try{
   const response=await fetch("/api/automatic-purchasing/preflight",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({productId})
   });
   const data=await response.json() as Preflight;
   if(!response.ok||!data.ok)throw new Error(data.error||"Supplier lookup failed.");
   setResult(data);
   const usable=(data.variants||[]).find(v=>v.available&&v.stock!=null&&v.stock>0&&v.priceCNY!=null);
   const preferred=(data.variants||[]).find(v=>v.skuCode===initialSku&&v.available&&v.priceCNY!=null&&v.stock!=null&&v.stock>0);
   setVariant(preferred?.skuCode||usable?.skuCode||"");
   setQuantity(q=>Math.max(q,data.minimumQuantity||1));
  }catch(e){setResult({ok:false,error:e instanceof Error?e.message:"Supplier not available."});}
  finally{setLoading(false);}
 }
 return <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,320px),1fr))",gap:20,marginTop:25}}>
  <article style={{background:"#fff",border:"1px solid #d9e6d5",borderRadius:23,padding:24,minWidth:0}}>
   <div style={{height:290,background:"#f0eee8",borderRadius:16,overflow:"hidden",display:"grid",placeItems:"center"}}>
    {imageUrl?<img src={imageUrl} alt={title} referrerPolicy="no-referrer" style={{height:"100%",width:"100%",objectFit:"contain"}}/>:<span style={{fontFamily:"Georgia,serif",fontSize:24}}>Herocon</span>}
   </div>
   <p style={{fontSize:10,fontWeight:800,color:"#718b75",letterSpacing:1.7,marginTop:24}}>01 / SELECTED CATALOGUE PRODUCT</p>
   <h2 style={{font:"400 25px/1.2 Georgia,serif",margin:"9px 0 12px"}}>{title}</h2>
   <p style={{color:"#708472",fontSize:12}}>Existing catalogue price: {typeof recordedPrice==="number"?money(recordedPrice):"Not recorded"}. This is not a confirmed purchase price.</p>
   <p style={{fontSize:11,color:"#7b8b7c",overflowWrap:"anywhere"}}>Product ID: {productId}</p>
   <Link href={"/product/"+encodeURIComponent(productId)} style={{color:"#24563c",fontSize:12,textDecoration:"underline"}}>View product details</Link>
  </article>
  <article style={{background:"#fff",border:"1px solid #d9e6d5",borderRadius:23,padding:"clamp(23px,3vw,32px)",minWidth:0}}>
   <p style={{fontSize:10,fontWeight:800,color:"#718b75",letterSpacing:1.7}}>02 / VERIFY WITH BUCKYDROP</p>
   <h2 style={{font:"400 31px/1.2 Georgia,serif",margin:"16px 0 12px"}}>Check the live supplier.</h2>
   <p style={{fontSize:13,color:"#69806c",lineHeight:1.7}}>Choose a size or colour from the exact BuckyDrop SKU list. This uses the live partner product API, which can be metered or billable. It never reserves stock or purchases goods.</p>
   <button type="button" onClick={check} disabled={loading} style={{display:"block",width:"100%",background:"#244b34",color:"white",border:0,borderRadius:13,padding:"15px 17px",fontWeight:800,fontSize:13,cursor:loading?"wait":"pointer",opacity:loading?.55:1}}>
    {loading?"Checking supplier stock…":"Check live BuckyDrop SKU and stock"}
   </button>
   {result&&!result.ok&&<p role="alert" style={{background:"#fff3e4",color:"#895231",padding:15,borderRadius:10,overflowWrap:"anywhere",fontSize:12,lineHeight:1.6}}>{result.error}</p>}
   {result?.ok&&<div style={{marginTop:20}}>
    <p style={{fontSize:12,color:"#3e6446",fontWeight:800}}>BuckyDrop lookup succeeded</p>
    <p style={{fontSize:12,color:"#768779",lineHeight:1.6}}>Product: {result.title}<br/>MOQ: {result.minimumQuantity??"Not specified"}<br/>Variants: {result.sourceVariantCount??result.variants?.length??0}<br/>Supplier price currency: CNY</p>
    <label htmlFor="sample-sku" style={{fontSize:12,fontWeight:800,display:"block",marginBottom:8}}>Select one variant to test</label>
    <select id="sample-sku" style={baseInput} value={variant} onChange={e=>{setVariant(e.target.value);setReviewing(false);}}>
     <option value="">Choose SKU</option>
     {(result.variants||[]).map(x=><option key={x.skuCode} value={x.skuCode} disabled={!x.available||x.priceCNY==null}>{x.label} · {x.priceCNY==null?"No price":x.priceCNY.toFixed(2)+" CNY"} · {x.stock??"Unknown"} available</option>)}
    </select>
    {chosen&&<div style={{background:"#f3f6ef",padding:16,borderRadius:12,marginTop:15,fontSize:12,lineHeight:1.8}}>
     <strong>Selected supplier SKU</strong>
     <div style={{overflowWrap:"anywhere"}}>{chosen.skuCode}</div>
     <div>Supplier cost: {chosen.priceCNY?.toFixed(2)??"Unconfirmed"} CNY</div>
     <div>Supplier stock: {chosen.stock??"Unconfirmed"}</div>
     <div>Minimum quantity: {result.minimumQuantity??1}</div>
    </div>}
    {chosen&&<>
     <label htmlFor="owner-buy-quantity" style={{fontSize:12,fontWeight:800,display:"block",margin:"15px 0 8px"}}>Quantity</label>
     <input id="owner-buy-quantity" style={baseInput} type="number" min={Math.max(1,result.minimumQuantity||1)} max={Math.min(99,chosen.stock??99)} step="1" value={quantity} onChange={e=>{setQuantity(Number(e.target.value));setReviewing(false);}}/>
     <button type="button" disabled={!Number.isInteger(quantity)||quantity<(result.minimumQuantity||1)||quantity>Math.min(99,chosen.stock??99)} onClick={()=>setReviewing(true)} style={{marginTop:17,padding:"14px 18px",width:"100%",border:"none",background:"#244b34",color:"#fff",borderRadius:12,fontSize:13,fontWeight:800,cursor:"pointer"}}>Continue to owner checkout</button>
    </>}
    {reviewing&&chosen&&<div style={{background:"#f7f8f1",border:"1px solid #cbddc6",padding:19,borderRadius:14,marginTop:18}}>
     <h3 style={{font:"400 26px Georgia,serif",margin:"0 0 16px"}}>Your direct purchase</h3>
     <p style={{fontSize:12,lineHeight:1.6}}>Selected: {chosen.label} · Quantity {quantity}</p>
     <div style={{display:"flex",justifyContent:"space-between",gap:12,fontSize:13,margin:"12px 0"}}><span>Verified supplier subtotal</span><strong>{chosen.priceCNY!=null?(chosen.priceCNY*quantity).toFixed(2)+" CNY":"Unavailable"}</strong></div>
     <div style={{display:"flex",justifyContent:"space-between",gap:12,fontSize:13,margin:"12px 0"}}><span>Herocon service fee</span><strong>£0.99</strong></div>
     <div style={{display:"flex",justifyContent:"space-between",gap:12,fontSize:13,margin:"12px 0"}}><span>Delivery, duties and final GBP price</span><strong>Not confirmed</strong></div>
     <p style={{fontSize:12,lineHeight:1.7,color:"#745c3c",background:"#fff1dd",borderRadius:10,padding:12}}>The complete GBP price and BuckyDrop shipping / parcel hold arrangements are not verified. We cannot safely charge you or issue a supplier purchase yet. This checkout is restricted to your owner account and does not require the £9.99 membership.</p>
     <button type="button" disabled style={{background:"#9aab9e",color:"#fff",border:0,borderRadius:12,padding:"14px 16px",width:"100%",fontWeight:800}}>Pay now — awaiting provider setup</button>
    </div>}
    <p style={{fontSize:11,lineHeight:1.65,color:"#8c956f",marginTop:14}}>A successful lookup is not proof BuckyDrop has purchased this item, settled freight, or agreed to hold its parcel. The real sale remains blocked until payment and fulfilment approvals are complete.</p>
   </div>}
  </article>
 </section>;
}
