"use client";
import {useState} from "react";
import Link from "next/link";
import {ExternalArrowIcon} from "@/components/ShopIcons";
import type {PersonalShopProduct} from "@/lib/personal-shop";
import {productPrice} from "@/lib/personal-shop";

export default function ShopPersonalCard({product}:{product:PersonalShopProduct}){
 const [imageFailed,setImageFailed]=useState(false);
 if(imageFailed)return null;
 const path="/shop-for-yourself/"+encodeURIComponent(product.id);
 return <article className="hc-self-item hc-personal-item">
   <Link className="hc-self-thumbnail hc-personal-thumbnail" href={path} prefetch={false} aria-label={"View "+product.name}>
     <img className="hc-self-thumb-photo" src={product.imageUrl} alt={product.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setImageFailed(true)}/>
     <span className="hc-self-thumb-label">{product.category}</span>
   </Link>
   <div className="hc-self-item-body">
     <p className="hc-self-item-category">{product.category} <span>·</span> ORIGINAL MARKETPLACE SOURCE</p>
     <h3><Link href={path} prefetch={false}>{product.name}</Link></h3>
     <div className="hc-self-item-price"><strong>{productPrice(product)}</strong><span>source reference price*</span></div>
     <div className="hc-self-item-actions">
       <Link href={path} prefetch={false} className="hc-self-link-primary">View product <span aria-hidden="true">→</span></Link>
       <a href={product.originalUrl} target="_blank" rel="noopener noreferrer nofollow" className="hc-self-link-secondary">Original listing <ExternalArrowIcon/></a>
     </div>
   </div>
 </article>;
}
