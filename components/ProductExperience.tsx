"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import AgentModal from "./AgentModal";
import {variantsFor} from "@/lib/catalogue";
import type {Product} from "@/lib/types";
export default function ProductExperience({product,id,title,images,price}:{product:Product;id:string;title:string;images:string[];price:string}){
 const variants=useMemo(()=>variantsFor(product),[product]);
 const colours=[...new Set([...(product.colours||[]),...variants.map(v=>v.colour).filter((x):x is string=>!!x)])];
 const sizes=[...new Set([...(product.sizes||[]),...variants.map(v=>v.size).filter((x):x is string=>!!x)])];
 const styles=[...new Set([...(product.styles||[]),...variants.map(v=>v.style).filter((x):x is string=>!!x)])];
 const[colour,setColour]=useState(colours[0]),[size,setSize]=useState(sizes[0]),[style,setStyle]=useState(styles[0]);
 const[image,setImage]=useState(0),[badImages,setBadImages]=useState<string[]>([]),[modal,setModal]=useState(false);
 const matching=variants.find(v=>(!colour||!v.colour||v.colour===colour)&&(!size||!v.size||v.size===size)&&(!style||!v.style||v.style===style)&&v.available!==false);
 const gallery=[...new Set([matching?.image,...images].filter((x):x is string=>!!x))].filter(x=>!badImages.includes(x));
 const chosenIndex=Math.min(image,Math.max(0,gallery.length-1));
 const selection=[colour,size,style,matching?.label].filter(Boolean).join(" · ")||"Standard option";
 const canSource=Boolean(product.originalMarketplaceUrl||product.sugargooProductUrl||Object.values(product.agentLinks||{}).some(Boolean)||variants.some(v=>Object.values(v.agentLinks||{}).some(Boolean)));
 const priceLabel=matching?.price!=null?"£"+matching.price.toFixed(2):price;
 const marketplace=product.originalMarketplaceUrl;
 const briefQuery=encodeURIComponent(marketplace||title);
 return <><section className="product-layout">
 <div><div className="gallery-main">{gallery[chosenIndex]?<img src={gallery[chosenIndex]} alt={title} onError={()=>setBadImages(prev=>[...prev,gallery[chosenIndex]])}/>:<div className="hc-image-missing">Product image currently unavailable</div>}<span className="gallery-count">{gallery.length?chosenIndex+1:0} / {gallery.length}</span></div>{gallery.length>1&&<div className="thumbs">{gallery.slice(0,12).map((src,i)=><button type="button" className={i===chosenIndex?"active":""} onClick={()=>setImage(i)} key={src}><img src={src} alt={"Product view "+(i+1)} onError={()=>setBadImages(prev=>[...prev,src])}/></button>)}</div>}</div>
 <aside className="buy-panel"><p className="eyebrow">{product.category||"HEROCON PRODUCT DISCOVERY"}</p><h1>{title}</h1><p className="supplier-title">{product.originalTitle||product.title}</p>{product.sellerId&&<Link className="seller-link" href={"/seller/"+encodeURIComponent(product.sellerId)}>{product.sellerName} ↗</Link>}
 <div className="product-price">{priceLabel}</div><p className="sc-product-disclosure">Listed marketplace price only. Variants, stock, MOQ, delivery charges, duty and VAT must be confirmed before ordering. A recorded original link does not mean the supplier has been vetted.</p>
 <Selector label="COLOUR" value={colour} items={colours} set={setColour}/><Selector label="SIZE" value={size} items={sizes} set={setSize}/><Selector label="STYLE" value={style} items={styles} set={setStyle}/>
 <div className="selected-box">{canSource?<button type="button" className="source-btn hc-agent-picker-btn" onClick={()=>setModal(true)}>BUY WITH AN AGENT <span>↗</span></button>:<p className="supplier-title">No original marketplace link is recorded for this product.</p>}
 {marketplace&&<a className="original-btn" href={marketplace} target="_blank" rel="noopener noreferrer">View original marketplace listing ↗</a>}
 <Link className="sc-product-brief-link" href={"/sourcing?product="+briefQuery}>Prepare a sourcing brief for this product ↗</Link></div>
 </aside></section>
 {canSource&&<AgentModal open={modal} onClose={()=>setModal(false)} productId={id} variantId={matching?.id} selection={selection} marketplaceUrl={marketplace} agentLinks={product.agentLinks}/>}
 <div className="mobile-buy"><span><b>{priceLabel}</b><small>Marketplace price • shipping extra</small></span>{canSource&&<button type="button" onClick={()=>setModal(true)}>USE AN AGENT</button>}</div></>;
}
function Selector({label,value,items,set}:{label:string;value?:string;items:string[];set:(v:string)=>void}){if(!items.length)return null;return <fieldset className="selector"><legend>{label}<b>{value}</b></legend><div>{items.map(x=><button type="button" key={x} className={x===value?"selected":""} onClick={()=>set(x)}>{x}</button>)}</div></fieldset>}