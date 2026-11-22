"use client";
import {useEffect,useState} from "react";
import ProductExperience from "@/components/ProductExperience";
import {cleanTitle,imagesFor,productPrice} from "@/lib/catalogue";
import type {BuckydropProduct} from "@/lib/buckydrop";
import type {Product} from "@/lib/types";

type Lookup={
 product:Product;productLink:string;productId:string;
 savedPartner:BuckydropProduct|null;
 sourceKind:"opencli-browser"|"saved-partner"|"catalogue";
 openCliCapturedAt:string|null;
};
type Status=
 |{phase:"idle"}|{phase:"loading"}|{phase:"error";message:string}
 |{phase:"ready";result:Lookup};

export default function ProductLinkResults({initialUrl}:{initialUrl:string}){
 const [status,setStatus]=useState<Status>({phase:initialUrl?"loading":"idle"});
 useEffect(()=>{
  if(!initialUrl){setStatus({phase:"idle"});return;}
  const controller=new AbortController();
  setStatus({phase:"loading"});
  // Public product links use saved snapshots only; this never initiates
  // a billable BuckyDrop product lookup or live marketplace browser visit.
  fetch("/api/marketplace/lookup",{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({url:initialUrl}),signal:controller.signal,cache:"no-store"
  }).then(async response=>{
   const value=await response.json();
   if(!response.ok||!value.product)throw Error(typeof value.error==="string"?value.error:"No saved product details are available.");
   return value as Lookup;
  }).then(result=>{
   if(!controller.signal.aborted)setStatus({phase:"ready",result});
  }).catch(error=>{
   if(!controller.signal.aborted)setStatus({phase:"error",message:error instanceof Error?error.message:"Product details are unavailable."});
  });
  return ()=>controller.abort();
 },[initialUrl]);
 if(status.phase==="idle")return null;
 if(status.phase==="loading")return <div className="hc-link-loading sc-container" role="status" aria-live="polite">
  <span className="hc-link-loader" aria-hidden="true"/>
  <div><strong>Checking saved marketplace details…</strong><p>Searching Herocon's existing catalogue without a paid supplier lookup.</p></div>
 </div>;
 if(status.phase==="error")return <div className="hc-link-error sc-container" role="alert">
  <strong>Product details are not yet available</strong>
  <p>{status.message}</p>
  <p>Only previously collected products can be shown instantly. New links must be collected through Herocon's local OpenCLI worker. No BuckyDrop lookup fee was incurred.</p>
 </div>;
 const {product,productLink,productId,savedPartner,sourceKind,openCliCapturedAt}=status.result;
 const title=cleanTitle(product);
 return <div className="hc-link-product-found">
  <div className="sc-container hc-link-found-header">
   <div>
    <p className="sc-kicker">PRODUCT FOUND</p><h2>{title}</h2>
    <p className="hc-link-connection-status" role="status">
     {sourceKind==="opencli-browser"?"Previously collected marketplace details loaded from Herocon's free OpenCLI snapshots.":
      sourceKind==="saved-partner"?"Previously saved supplier details loaded. No new partner request was made.":
      "This product is in Herocon's catalogue. No live supplier lookup was performed."}
    </p>
   </div>
  </div>
  <ProductExperience key={productLink} product={product} id={productId}
   title={title} images={imagesFor(product)} price={productPrice(product)}
   buckydropEnabled={Boolean(savedPartner)} initialSource={savedPartner||undefined}
   openCliCapturedAt={openCliCapturedAt||undefined}/>
 </div>;
}
