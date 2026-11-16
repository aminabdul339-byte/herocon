"use client";
import Link from "next/link";
import {useState} from "react";
import {useSaved} from "./SavedProvider";
import {cleanTitle,productId,productPrice} from "@/lib/catalogue";
import type {Product} from "@/lib/types";
export default function ProductCard({product}:{product:Product;large?:boolean}){
 const id=productId(product),{saved,toggle}=useSaved();
 const [imageError,setImageError]=useState(false);
 const title=cleanTitle(product),price=productPrice(product);
 return <article className="hc-product-card">
  <div className="hc-image-wrap">
   <Link className="hc-card-photo-link" href={"/product/"+encodeURIComponent(id)} aria-label={"View "+title}>{product.imageUrl&&!imageError?<img src={product.imageUrl} alt={title} loading="lazy" onError={()=>setImageError(true)}/>:<div className="hc-image-missing">Product image unavailable<br/>View product details ↗</div>}</Link>
   <button type="button" className="hc-favourite" onClick={()=>toggle(id)} aria-label={saved.has(id)?"Remove from saved products":"Save product"} aria-pressed={saved.has(id)}>{saved.has(id)?"♥":"♡"}</button>
  </div>
  <div className="hc-card-info"><h3 title={product.title}><Link className="hc-card-title-link" href={"/product/"+encodeURIComponent(id)}>{title}</Link></h3><strong className="hc-price">{price}</strong><span className="hc-price-note">Listed price · delivery not included</span>{product.sellerName&&<div className="hc-seller">{product.sellerId?<Link href={"/seller/"+encodeURIComponent(product.sellerId)}>{product.sellerName}</Link>:product.sellerName}</div>}<div className="hc-card-bottom"><span>{product.sourceMarketplace?"Source: "+product.sourceMarketplace.replace(/^www\./,""):"Marketplace source recorded"}</span><Link href={"/product/"+encodeURIComponent(id)}>View source ↗</Link></div></div>
 </article>;
}