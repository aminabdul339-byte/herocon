"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {cleanTitle,productId,productPrice} from "@/lib/catalogue";
import type {Product} from "@/lib/types";
export default function ProductCard({product,eager=false,titleOverride}:{product:Product;large?:boolean;eager?:boolean;titleOverride?:string}){
 const id=productId(product);
 const images=useMemo(()=>[...new Set([product.imageUrl,...(product.images||[])]
  .filter((url):url is string=>typeof url==="string"&&/^https?:\/\//.test(url)))].slice(0,12),[product.imageUrl,product.images]);
 const [imageIndex,setImageIndex]=useState(0);
 useEffect(()=>setImageIndex(0),[product.doppelProductId,product.imageUrl]);
 const title=titleOverride||cleanTitle(product),price=productPrice(product);
 const variants=product.variantCount??product.variants?.length??0;
 const savedNote=variants>0?
   variants.toLocaleString()+" recorded "+(variants===1?"option":"options")+" · reference price":
   product.hasPartnerDetails?"Saved supplier details · reference price":
   "Listed price · delivery not included";
 return <article className="hc-product-card">
  <div className="hc-image-wrap">
   <Link prefetch={false} className="hc-card-photo-link" href={"/product/"+encodeURIComponent(id)} aria-label={"View "+title}>{images[imageIndex]?<img src={images[imageIndex]} alt={title} loading={eager?"eager":"lazy"} fetchPriority={eager?"high":"auto"} decoding="async" referrerPolicy="no-referrer" onError={()=>setImageIndex(current=>current+1)}/>:<div className="hc-image-missing">Product image unavailable<br/>View product details</div>}</Link>
  </div>
  <div className="hc-card-info"><h3 title={product.title}><Link prefetch={false} className="hc-card-title-link" href={"/product/"+encodeURIComponent(id)}>{title}</Link></h3><strong className="hc-price">{price}</strong><span className="hc-price-note">{savedNote}</span>{product.sellerName&&<div className="hc-seller">{product.sellerId?<Link href={"/seller/"+encodeURIComponent(product.sellerId)}>{product.sellerName}</Link>:product.sellerName}</div>}<div className="hc-card-bottom"><span>{product.sourceMarketplace?"Source: "+product.sourceMarketplace.replace(/^www\./,""):"Marketplace source recorded"}</span><Link prefetch={false} href={"/product/"+encodeURIComponent(id)}>View product</Link></div></div>
 </article>;
}