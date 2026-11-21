"use client";
import {ArrowIcon} from "@/components/ArrowIcon";
import {useState} from "react";
import Link from "next/link";
import {ExternalArrowIcon} from "@/components/ShopIcons";
import type {EnrichedPersonalProduct} from "@/lib/personal-shop-enrichment";
import {shopPrice,priceIsConverted,type ShopFxRates} from "@/lib/shop-price";

export default function ShopPersonalCard({product,rates,audience}:{product:EnrichedPersonalProduct;rates:ShopFxRates;audience:"women"|"men"}){
 const [imageIndex,setImageIndex]=useState(0);
 const photos=[...new Set([product.imageUrl,...(product.savedDetails?.photos||[])])].filter(Boolean);
 if(imageIndex>=photos.length)return null;
 const path="/shop-for-yourself/"+encodeURIComponent(product.id)+"?audience="+audience;
 return <article className="hc-self-item hc-personal-item">
   <Link className="hc-self-thumbnail hc-personal-thumbnail" href={path} prefetch={false} aria-label={"View "+product.name}>
     <img className="hc-self-thumb-photo" src={photos[imageIndex]} alt={product.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setImageIndex(i=>i+1)}/>
   </Link>
   <div className="hc-self-item-body">
     <p className="hc-self-item-category">{product.category} <span>·</span> ORIGINAL MARKETPLACE SOURCE</p>
     <h3><Link href={path} prefetch={false}>{product.name}</Link></h3>
     <div className="hc-self-item-price"><strong>{shopPrice(product,rates)}</strong><span>{priceIsConverted(product)?"approx. GBP*":"reference price*"}</span></div>
     {product.savedDetails&&<p style={{fontSize:11,lineHeight:1.65,color:"#667b6b",margin:"6px 0 0"}}>
       {product.savedDetails.sellerName?product.savedDetails.sellerName+" · ":"Saved supplier record · "}
       {product.savedDetails.variantCount>0?product.savedDetails.variantCount+" recorded options":"Supplier details saved"}
       {photos.length>1?" · "+photos.length+" photos":""}
     </p>}
     <div className="hc-self-item-actions">
       <Link href={path} prefetch={false} className="hc-self-link-primary">View product <span aria-hidden="true"><ArrowIcon direction="right"/></span></Link>
       <a href={product.originalUrl} target="_blank" rel="noopener noreferrer nofollow" className="hc-self-link-secondary">Original listing <ExternalArrowIcon/></a>
     </div>
   </div>
 </article>;
}
