"use client";
import Link from "next/link";
import {useSaved} from "./SavedProvider";
import {cleanTitle,productId,productPrice} from "@/lib/catalogue";
import type {Product} from "@/lib/types";
export default function ProductCard({product,large=false}:{product:Product;large?:boolean}){
  const id=productId(product),{saved,toggle}=useSaved();
  return <article className={`card ${large?"hero-card":""}`}>
    <Link className="card-main" href={`/product/${encodeURIComponent(id)}`}>
      <div className="card-photo">{product.imageUrl?<img src={product.imageUrl} alt={cleanTitle(product)} loading="lazy"/>:<span>Image coming soon</span>}<span className="card-tag">{(product.category||"Discover").toUpperCase()}</span></div>
      <div className="card-row"><h3>{cleanTitle(product)}</h3>{(product.price||product.priceGBP!=null)&&<b>{productPrice(product)}</b>}</div>
    </Link>
    <div className="card-foot">{product.sellerId?<Link href={`/seller/${encodeURIComponent(product.sellerId)}`}>{product.sellerName||"View seller"} →</Link>:<span>{product.originalMarketplaceUrl?"SOURCE AVAILABLE":"DISCOVER"}</span>}<button onClick={()=>toggle(id)} aria-label={saved.has(id)?"Remove saved product":"Save product"}>{saved.has(id)?"♥":"♡"}</button></div>
  </article>;
}
