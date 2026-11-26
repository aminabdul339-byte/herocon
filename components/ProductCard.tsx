"use client";
import Link from "next/link";
import SaveFind from "@/components/SaveFind";
import {ArrowIcon} from "@/components/ArrowIcon";
import {useEffect,useMemo,useState} from "react";
import {cleanTitle,productId,productPrice} from "@/lib/catalogue";
import type {Product} from "@/lib/types";
type CardProps={
 product:Product;large?:boolean;eager?:boolean;titleOverride?:string;
 hrefOverride?:string;priceOverride?:string;priceNoteOverride?:string;sourceLabelOverride?:string
};
export default function ProductCard({product,eager=false,titleOverride,hrefOverride,priceOverride,priceNoteOverride}:CardProps){
 const id=productId(product);
 const images=useMemo(()=>[...new Set([product.imageUrl,...(product.images||[])]
  .filter((url):url is string=>typeof url==="string"&&(/^https?:\/\//.test(url)||url.startsWith("/shop-for-yourself-images/"))))].slice(0,12),[product.imageUrl,product.images]);
 const [imageIndex,setImageIndex]=useState(0);
 useEffect(()=>setImageIndex(0),[product.doppelProductId,product.imageUrl]);
 const title=titleOverride||cleanTitle(product),price=priceOverride??productPrice(product);
 const destination=hrefOverride||"/product/"+encodeURIComponent(id);
 const personal=Boolean(hrefOverride?.startsWith("/shop-for-yourself/"));
 const priceLabel=/^£\s*\d|^¥\s*\d/.test(price)?(priceNoteOverride||(personal?"Reference price":"Wholesale reference price")):"Check price with supplier";
 const hasSavedDetails=product.hasPartnerDetails===true;
 return <article className="hc-product-card hc-refined-card">
  <div className="hc-image-wrap">
   <Link prefetch={false} className="hc-card-photo-link" href={destination} aria-label={"View "+title}>{images[imageIndex]?<img src={images[imageIndex]} alt={title} loading={eager?"eager":"lazy"} fetchPriority={eager?"high":"auto"} decoding="async" referrerPolicy="no-referrer" onError={()=>setImageIndex(current=>current+1)}/>:<div className="hc-image-missing">Product image unavailable<br/>View product details</div>}</Link>
  </div>
  <div className="hc-card-info"><h3 title={product.title}><Link prefetch={false} className="hc-card-title-link" href={destination}>{title}</Link></h3><strong className="hc-price">{price}</strong><span className="hc-price-note">{priceLabel}</span><div className="hc-card-supplier-status">{hasSavedDetails?<><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="m6.5 10 2.3 2.4 4.8-5"/></svg><span>Supplier details available</span></>:<span>Supplier details pending</span>}</div><div className="hc-card-bottom"><Link prefetch={false} href={destination}>Explore product <ArrowIcon direction="right"/></Link></div><SaveFind find={{url:product.originalMarketplaceUrl||"",title,path:destination,image:images[0],seller:product.sellerName,price:product.priceGBP??product.priceCNY,currency:product.priceGBP!=null?"GBP":product.priceCNY!=null?"CNY":undefined,variantCount:product.variantCount}}/></div>
 </article>;
}