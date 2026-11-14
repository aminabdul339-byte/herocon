"use client";
import Link from "next/link";
import {useSaved} from "./SavedProvider";
import {cleanTitle,productId,productPrice} from "@/lib/catalogue";
import type {Product} from "@/lib/types";
export default function ProductCard({product}:{product:Product;large?:boolean}){
 const id=productId(product),{saved,toggle}=useSaved();
 const title=cleanTitle(product);
 return <article className="hc-product-card">
   <div className="hc-image-wrap"><Link className="hc-card-photo-link" href={`/product/${encodeURIComponent(id)}`} aria-label={`View ${title}`}>{product.imageUrl?<img src={product.imageUrl} alt={title} loading="lazy"/>:<div className="hc-image-missing">Image unavailable</div>}</Link><button className="hc-favourite" onClick={()=>toggle(id)} aria-label={saved.has(id)?"Remove from saved":"Save product"} aria-pressed={saved.has(id)}>{saved.has(id)?"♥":"♡"}</button></div>
   <div className="hc-card-info"><h3 title={product.title}><Link className="hc-card-title-link" href={`/product/${encodeURIComponent(id)}`}>{title}</Link></h3><strong className="hc-price">{productPrice(product)}</strong>{product.sellerName&&<div className="hc-seller">♧ {product.sellerId?<Link href={`/seller/${encodeURIComponent(product.sellerId)}`}>{product.sellerName}</Link>:product.sellerName}</div>}</div>
 </article>
}