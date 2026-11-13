"use client";
import {useState} from "react";
import {useSaved} from "./SavedProvider";
import {cleanTitle,productId,productPrice} from "@/lib/catalogue";
import type {Product} from "@/lib/types";
const agentNames=[["superbuy","Superbuy"],["cssbuy","CSSBuy"],["sugargoo","Sugargoo"],["basetao","Basetao"],["kakobuy","KakoBuy"],["oopbuy","Oopbuy"],["hipobuy","HipoBuy"],["litbuy","LitBuy"],["lovegobuy","LoveGoBuy"],["usfans","USFans"],["joyagoo","Joyagoo"],["mulebuy","Mulebuy"]];
export default function ProductCard({product}:{product:Product;large?:boolean}){
 const id=productId(product),{saved,toggle}=useSaved(),[open,setOpen]=useState(false);
 const title=cleanTitle(product);
 const agentLink=(key:string)=>{const raw=product.agentLinks?.[key]||(key==="sugargoo"?product.sugargooProductUrl:undefined);if(!raw)return null;try{const url=new URL(raw);return url.protocol==="https:"?url.href:null}catch{return null}};
 return <article className="hc-product-card">
   <div className="hc-image-wrap">{product.imageUrl?<img src={product.imageUrl} alt={title} loading="lazy"/>:<div className="hc-image-missing">Image unavailable</div>}<button className="hc-favourite" onClick={()=>toggle(id)} aria-label={saved.has(id)?"Remove from saved":"Save product"} aria-pressed={saved.has(id)}>{saved.has(id)?"♥":"♡"}</button></div>
   <div className="hc-card-info"><h3 title={product.title}>{title}</h3><strong className="hc-price">{productPrice(product)}</strong><div className="hc-seller">♧ {product.sellerName||"Marketplace seller"}</div>
   <div className="hc-actions">
     {product.originalMarketplaceUrl?<a className="hc-buy" href={product.originalMarketplaceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Buy ${title} at original marketplace`}>Buy ↗</a>:<span className="hc-buy hc-disabled">Unavailable</span>}
     <div className="hc-agent-container"><button className="hc-agent-trigger" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-label={`Buy ${title} with an agent`}>Buy with Agent <span>⌄</span></button>
       {open&&<div className="hc-agent-menu"><div className="hc-agent-heading">Choose an agent <button onClick={()=>setOpen(false)} aria-label="Close agent menu">×</button></div>{agentNames.map(([key,name])=>{const link=agentLink(key);return link?<a key={key} href={link} target="_blank" rel="noopener noreferrer" onClick={()=>setOpen(false)}>{name}<span>↗</span></a>:<div key={key} className="hc-agent-unavailable" title="Affiliate link not configured yet">{name}<small>Coming soon</small></div>})}</div>}
     </div>
   </div></div>
 </article>
}