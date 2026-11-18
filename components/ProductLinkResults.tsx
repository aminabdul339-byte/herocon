"use client";
import {useEffect,useState} from "react";
import ProductExperience from "@/components/ProductExperience";
import type {BuckydropProduct} from "@/lib/buckydrop";
import type {Product} from "@/lib/types";
import type {ProductLinkLookupResult} from "@/lib/marketplace-links";

type Status={phase:"idle"}|{phase:"loading"}|{phase:"error";message:string}|{phase:"ready";product:BuckydropProduct;url:string};

export default function ProductLinkResults({initialUrl}:{initialUrl:string}){
 const [status,setStatus]=useState<Status>({phase:initialUrl?"loading":"idle"});
 useEffect(()=>{
  if(!initialUrl){setStatus({phase:"idle"});return;}
  const controller=new AbortController();
  setStatus({phase:"loading"});
  fetch("/api/buckydrop/lookup",{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({url:initialUrl}),
   signal:controller.signal,
   cache:"no-store"
  }).then(async response=>{
   const result:ProductLinkLookupResult&{error?:string}=await response.json();
   if(!response.ok||!result.product)throw new Error(result.error||"We couldn't retrieve this product.");
   return result;
  }).then(result=>{
   if(!controller.signal.aborted)setStatus({phase:"ready",product:result.product,url:result.productLink});
  }).catch(error=>{
   if(!controller.signal.aborted)setStatus({phase:"error",message:error instanceof Error?error.message:"The product could not be retrieved."});
  });
  return ()=>controller.abort();
 },[initialUrl]);

 if(status.phase==="idle")return <div className="hc-link-help sc-container">
  <strong>How it works</strong>
  <p>Paste the original marketplace URL above. Herocon will load the seller's images, variants, availability and source prices when available through BuckyDrop.</p>
  <p>Example format: <code>https://detail.1688.com/offer/717984673196.html</code></p>
 </div>;

 if(status.phase==="loading")return <div className="hc-link-loading sc-container" role="status" aria-live="polite">
  <span className="hc-link-loader" aria-hidden="true"/>
  <div><strong>Looking up the seller's product…</strong><p>Retrieving product details, photographs and available options.</p></div>
 </div>;

 if(status.phase==="error")return <div className="hc-link-error sc-container" role="alert">
  <strong>We couldn't load that product</strong>
  <p>{status.message}</p>
  <p>Check that the URL is a full 1688, Taobao, Tmall or Weidian product link, rather than a shortened sharing link.</p>
 </div>;

 const source=status.product;
 const product:Product={
  title:source.title,
  originalTitle:source.title,
  originalMarketplaceUrl:status.url,
  imageUrl:source.images[0],
  images:source.images,
  sellerName:source.sellerName,
  sourceMarketplace:source.marketplace||undefined,
  category:"Marketplace product"
 };
 return <div className="hc-link-product-found">
   <div className="sc-container hc-link-found-header">
    <div><p className="sc-kicker">PRODUCT FOUND</p><h2>{source.title}</h2><p>Product details loaded from the original marketplace link.</p></div>
    <a href={status.url} target="_blank" rel="noopener noreferrer">Original listing ↗</a>
   </div>
   <ProductExperience
    key={status.url}
    product={product}
    id="linked-product"
    title={source.title}
    images={source.images}
    price="Supplier price"
    buckydropEnabled
    initialSource={source}
   />
   <div className="sc-container hc-link-import-note">
    This product was found using your link. It has not been added to Herocon's curated catalogue or approved for direct checkout.
   </div>
  </div>;
}