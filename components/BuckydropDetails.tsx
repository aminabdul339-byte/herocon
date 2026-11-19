"use client";
import {useEffect,useState} from "react";
import type {BuckydropProduct} from "@/lib/buckydrop";

type LoadState = {loading:true}|{loading:false;product:BuckydropProduct}|{loading:false;message:string};

export default function BuckydropDetails({productId}:{productId:string}){
 const [state,setState]=useState<LoadState>({loading:true});
 const [selected,setSelected]=useState("");
 useEffect(()=>{
  const controller=new AbortController();
  fetch("/api/buckydrop/product/"+encodeURIComponent(productId),{signal:controller.signal,cache:"no-store"})
   .then(async response=>{
      const body=await response.json();
      if(!response.ok)throw new Error(body.error||"Product details are unavailable.");
      return body as {product:BuckydropProduct};
   })
   .then(data=>setState({loading:false,product:data.product}))
   .catch(error=>{if(!controller.signal.aborted)setState({loading:false,message:error.message});});
  return ()=>controller.abort();
 },[productId]);
 return <section className="sc-section sc-container" aria-label="Partner product information">
  <p className="sc-kicker">SOURCING DETAILS</p>
  <h2>Marketplace product information</h2>
  {state.loading?<p>Checking options with our sourcing partner…</p>:
   "message" in state?<p>{state.message} You can still use the original marketplace listing above.</p>:
   <div className="sc-buckydrop-details">
    <p><strong>{state.product.title}</strong></p>
    <p>Supplier price: {state.product.offerPrice==null?"Not supplied":"¥"+state.product.offerPrice.toFixed(2)+" CNY"}
    {" · "}China delivery: {state.product.chinaDomesticFreight==null?"Confirm with supplier":"¥"+state.product.chinaDomesticFreight.toFixed(2)+" CNY"}</p>
    <p>Minimum order: {state.product.moq??"Not supplied"}{" · "}Availability: {state.product.available===null?"Unconfirmed":state.product.available?"Listed as available":"Not currently available"}</p>
    {state.product.images.length>0&&<div className="sc-buckydrop-thumbnails">{state.product.images.slice(0,8).map(src=><img src={src} alt="Supplier product view" loading="lazy" key={src}/>)}</div>}
    {state.product.variants.length>0&&<><label htmlFor="bd-variant-choice">Available supplier variants</label><select id="bd-variant-choice" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choose colour or size</option>{state.product.variants.map(v=><option key={v.skuCode} value={v.skuCode}>{v.title}{v.price!=null?" — ¥"+v.price.toFixed(2):""}{v.stock!=null?" — "+v.stock+" in stock":""}</option>)}</select></>}
    {state.product.descriptionText&&<p>{state.product.descriptionText.slice(0,1200)}</p>}
    <p className="sc-product-disclosure">Supplier prices are shown in CNY. Final GBP pricing, availability and delivery charges are confirmed separately.</p>
   </div>}
 </section>;
}