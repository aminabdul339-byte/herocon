"use client";

import {useEffect,useState} from "react";
import Link from "next/link";

type Variant={skuCode:string;label:string;priceCNY:number|null;stock:number|null;available:boolean};
type SnapshotResult={
 ok:boolean;error?:string;title?:string;checkedAt?:string|null;available?:boolean|null;
 minimumQuantity?:number|null;variants?:Variant[];sourceVariantCount?:number;
 savedSnapshotOnly?:boolean;
};
type Prepared={checkoutUrl?:string;error?:string;customerTotalGBP?:string;missing?:string[]};
type Props={
 productId:string;title:string;imageUrl?:string;recordedPrice?:number;
 sourceUrl:string;initialSku?:string;initialQuantity?:number;
};
const formatCNY=(x:number|null)=>x!=null?"¥"+x.toFixed(2):"Not available";
const box:React.CSSProperties={borderRadius:21,padding:"clamp(20px,3vw,31px)",border:"1px solid #dce7d7",background:"#fffefa",minWidth:0};
const field:React.CSSProperties={width:"100%",padding:"14px 15px",borderRadius:13,border:"1px solid #d0dfcc",fontSize:14,background:"#fff",color:"#25432e",boxSizing:"border-box"};

export default function BuckydropPilotPreflight({productId,title,imageUrl,recordedPrice,initialSku="",initialQuantity=1}:Props){
 const [details,setDetails]=useState<SnapshotResult|null>(null);
 const [fetching,setFetching]=useState(true);
 const [selected,setSelected]=useState(initialSku);
 const [quantity,setQuantity]=useState(initialQuantity);
 const [preparing,setPreparing]=useState(false);
 const [error,setError]=useState("");
 const [missing,setMissing]=useState<string[]>([]);
 const selectedVariant=details?.variants?.find(x=>x.skuCode===selected);
 useEffect(()=>{
  let active=true;
  (async()=>{
   try{
    const r=await fetch("/api/automatic-purchasing/preflight",{
     method:"POST",credentials:"same-origin",cache:"no-store",
     headers:{"Content-Type":"application/json"},body:JSON.stringify({productId})
    });
    const data=await r.json() as SnapshotResult;
    if(!r.ok||!data.ok)throw Error(data.error||"Saved BuckyDrop details not found.");
    if(!active)return;
    setDetails(data);
    const available=(data.variants||[]).find(x=>x.priceCNY!=null&&x.priceCNY>0&&x.available&&x.stock!=null&&x.stock>0);
    const preferred=(data.variants||[]).find(x=>x.skuCode===initialSku&&x.priceCNY!=null&&x.available&&x.stock!=null&&x.stock>0);
    setSelected(preferred?.skuCode||available?.skuCode||"");
    setQuantity(x=>Math.max(x,data.minimumQuantity||1));
   }catch(e){
    if(active)setError(e instanceof Error?e.message:"Saved supplier options could not be loaded.");
   }finally{if(active)setFetching(false);}
  })();
  return()=>{active=false;};
 },[productId,initialSku]);

 async function buy(){
  if(preparing||!selectedVariant||!Number.isInteger(quantity)||quantity<1||quantity>3)return;
  setPreparing(true);setError("");setMissing([]);
  try{
   const response=await fetch("/api/owner/automatic-purchase/prepare",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({productId,skuCode:selectedVariant.skuCode,quantity})
   });
   const data=await response.json() as Prepared;
   if(!response.ok||!data.checkoutUrl)throw Error(data.error||"Could not prepare payment.");
   if(!/^\/checkout\/hq_[a-f0-9]{40}$/.test(data.checkoutUrl))throw Error("Unexpected checkout URL.");
   window.location.assign(data.checkoutUrl);
  }catch(e){
   setError(e instanceof Error?e.message:"Checkout unavailable.");
  }finally{setPreparing(false);}
 }
 const max=Math.min(3,selectedVariant?.stock||3);
 return <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,330px),1fr))",gap:20,marginTop:25}}>
  <article style={box}>
   <div style={{height:310,background:"#f0f1eb",borderRadius:16,overflow:"hidden",display:"grid",placeItems:"center"}}>
    {imageUrl?<img src={imageUrl} alt={title} referrerPolicy="no-referrer" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<span style={{font:"29px Georgia,serif"}}>Herocon</span>}
   </div>
   <p style={{color:"#809381",fontSize:11,letterSpacing:1.6,fontWeight:800,margin:"24px 0 8px"}}>YOUR SELECTED PRODUCT</p>
   <h2 style={{font:"400 28px Georgia,serif",lineHeight:1.2,margin:"0 0 14px"}}>{title}</h2>
   <p style={{fontSize:12,lineHeight:1.7,color:"#718272"}}>
    {typeof recordedPrice==="number"?"Catalogue display price £"+recordedPrice.toFixed(2)+". ":""}
    Final Herocon price includes verified merchant budgets for supplier costs, international delivery and processing fees.
   </p>
   <Link href={"/product/"+encodeURIComponent(productId)} style={{color:"#2c6140",fontSize:13}}>See product page</Link>
  </article>
  <article style={box}>
   <p style={{fontSize:11,letterSpacing:1.6,fontWeight:800,color:"#849a85"}}>OWNER PREMIUM / AUTOMATIC PURCHASE</p>
   <h2 style={{font:"400 33px Georgia,serif",margin:"12px 0 12px"}}>Choose and buy.</h2>
   <p style={{fontSize:13,lineHeight:1.75,color:"#687f6b"}}>We use saved BuckyDrop catalogue details automatically. No manual quote or repeat paid supplier-detail lookup. You pay Herocon in GBP; a verified payment can then be sent to BuckyDrop for fulfilment from the funded wallet once the pilot is activated.</p>
   {fetching?<p role="status" style={{fontSize:13}}>Loading saved colour and size options…</p>:
    details?.ok?<>
     <label htmlFor="owner-sku" style={{display:"block",fontSize:12,fontWeight:800,margin:"18px 0 8px"}}>Colour / size</label>
     <select id="owner-sku" style={field} value={selected} onChange={e=>{setSelected(e.target.value);setError("");}}>
      <option value="">Select a product option</option>
      {(details.variants||[]).map(v=><option key={v.skuCode} value={v.skuCode}
       disabled={!v.available||v.stock==null||v.stock<=0||v.priceCNY==null}>
       {v.label} · {formatCNY(v.priceCNY)} supplier snapshot
      </option>)}
     </select>
     <p style={{fontSize:11,color:"#879588",lineHeight:1.6}}>Last saved BuckyDrop data: {details.checkedAt?new Date(details.checkedAt).toLocaleDateString("en-GB"):"Unknown"}. This is not a real-time stock guarantee.</p>
     <label htmlFor="owner-quantity" style={{display:"block",fontSize:12,fontWeight:800,margin:"16px 0 8px"}}>Quantity · initial pilot maximum 3</label>
     <input id="owner-quantity" style={field} type="number" min={Math.max(1,details.minimumQuantity||1)}
      max={max} step={1} value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/>
     <div style={{borderTop:"1px solid #dce9d8",margin:"22px 0",paddingTop:18,fontSize:13}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:14,margin:"12px 0"}}><span>Saved supplier cost</span><strong>{selectedVariant?.priceCNY!=null?formatCNY(selectedVariant.priceCNY*quantity):"Select a variant"}</strong></div>
      <div style={{display:"flex",justifyContent:"space-between",gap:14,margin:"12px 0"}}><span>Herocon service fee</span><strong>£0.99</strong></div>
      <div style={{display:"flex",justifyContent:"space-between",gap:14,margin:"12px 0"}}><span>Full GBP retail and delivery</span><strong>Calculated at checkout</strong></div>
     </div>
     <button type="button" onClick={buy} disabled={preparing||!selectedVariant||
      selectedVariant.stock==null||quantity>selectedVariant.stock||
      quantity>3||quantity<(details.minimumQuantity||1)||!Number.isInteger(quantity)}
      style={{display:"block",width:"100%",background:"#244c35",color:"#fff",border:0,borderRadius:14,padding:"16px 18px",fontWeight:800,fontSize:14,cursor:"pointer",opacity:preparing?.65:1}}>
      {preparing?"Calculating safe GBP price…":"Buy now · calculate total"}
     </button>
    </>:null}
   {error&&<p role="alert" style={{fontSize:12,lineHeight:1.7,background:"#fff3e5",padding:15,borderRadius:12,color:"#815b34",overflowWrap:"anywhere"}}>{error}</p>}
   {missing.length>0&&<p style={{fontSize:11,color:"#815b34"}}>Awaiting: {missing.join(", ")}</p>}
   <p style={{fontSize:11,color:"#7d8b7e",lineHeight:1.7,marginTop:18}}>
    Automatic checkout only becomes payable after the merchant-configured delivery and wallet fees, Stripe live payment webhooks and BuckyDrop pre-funded order processing have passed verification.
    No credit card is charged just by viewing this page.
   </p>
  </article>
 </section>;
}
