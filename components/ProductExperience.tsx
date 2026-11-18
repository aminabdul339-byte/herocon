"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import AgentModal from "./AgentModal";
import {variantsFor} from "@/lib/catalogue";
import type {Product} from "@/lib/types";
import type {BuckydropProduct} from "@/lib/buckydrop";

type Lookup={status:"loading"}|{status:"ready";data:BuckydropProduct}|{status:"error"};
const formatCNY=(amount:number)=>"¥"+amount.toFixed(2);

export default function ProductExperience({product,id,title,images,price,buckydropEnabled=false}:{product:Product;id:string;title:string;images:string[];price:string;buckydropEnabled?:boolean}){
 const originalVariants=useMemo(()=>variantsFor(product),[product]);
 const colours=[...new Set([...(product.colours||[]),...originalVariants.map(v=>v.colour).filter((x):x is string=>!!x)])];
 const sizes=[...new Set([...(product.sizes||[]),...originalVariants.map(v=>v.size).filter((x):x is string=>!!x)])];
 const styles=[...new Set([...(product.styles||[]),...originalVariants.map(v=>v.style).filter((x):x is string=>!!x)])];
 const[colour,setColour]=useState(colours[0]),[size,setSize]=useState(sizes[0]),[style,setStyle]=useState(styles[0]);
 const[image,setImage]=useState(0),[badImages,setBadImages]=useState<string[]>([]),[modal,setModal]=useState(false);
 const[lookup,setLookup]=useState<Lookup>({status:"loading"});
 const[activeSku,setActiveSku]=useState("");
 const[quantities,setQuantities]=useState<Record<string,number>>({});
 const[showAllSkus,setShowAllSkus]=useState(false);
 const[copiedSelection,setCopiedSelection]=useState(false);

 useEffect(()=>{
  if(!buckydropEnabled)return;
  const controller=new AbortController();
  setLookup({status:"loading"});
  fetch("/api/buckydrop/product/"+encodeURIComponent(id),{signal:controller.signal,cache:"no-store"})
   .then(async response=>{
    const data=await response.json();
    if(!response.ok||!data.product)throw Error("Supplier data temporarily unavailable");
    return data.product as BuckydropProduct;
   })
   .then(data=>{if(!controller.signal.aborted){setLookup({status:"ready",data});setImage(0);setBadImages([]);setActiveSku("");setQuantities({});setShowAllSkus(false);setCopiedSelection(false);}})
   .catch(()=>{if(!controller.signal.aborted)setLookup({status:"error"});});
  return ()=>controller.abort();
 },[id,buckydropEnabled]);

 const source=buckydropEnabled&&lookup.status==="ready"?lookup.data:null;
 const defaultSku=source?.variants.find(v=>v.stock===null||v.stock>0)||source?.variants[0];
 const sourceVariant=source?.variants.find(v=>v.skuCode===activeSku)||defaultSku;
 const selectedRows=source?.variants.filter(v=>(quantities[v.skuCode]||0)>0)||[];
 const totalUnits=selectedRows.reduce((sum,v)=>sum+(quantities[v.skuCode]||0),0);
 const subtotal=selectedRows.reduce((sum,v)=>sum+(v.price||0)*(quantities[v.skuCode]||0),0);
 const hasUnknownPrice=selectedRows.some(v=>v.price==null);
 const minOrder=Math.max(1,source?.moq||1);
 const visibleSkus=showAllSkus?source?.variants||[]:source?.variants.slice(0,8)||[];
 const updateQuantity=(skuCode:string,delta:number)=>{
  const variant=source?.variants.find(v=>v.skuCode===skuCode);
  if(!variant||source?.available===false)return;
  setActiveSku(skuCode);
  setImage(0);
  setCopiedSelection(false);
  setQuantities(prev=>{
   const current=prev[skuCode]||0;
   const next=Math.max(0,Math.min(variant.stock??9999,current+delta));
   return {...prev,[skuCode]:next};
  });
 };
 const copyOrder=async()=>{
  if(!source||!marketplace||!selectedRows.length)return;
  const lines=[title,marketplace,"Supplier variants (reselect with your agent):",...selectedRows.map(v=>"- "+v.title+" | SKU "+v.skuCode+" | qty "+quantities[v.skuCode]+(v.price==null?"":" | unit "+formatCNY(v.price))),'Subtotal before shipping/taxes: '+(hasUnknownPrice?"Quote required":formatCNY(subtotal))];
  const note=lines.join("\n");
  try{await navigator.clipboard.writeText(note);setCopiedSelection(true);}catch{window.prompt("Copy sourcing selections:",note);}
 };
 const originalMatching=originalVariants.find(v=>(!colour||!v.colour||v.colour===colour)&&(!size||!v.size||v.size===size)&&(!style||!v.style||v.style===style)&&v.available!==false);
 const sellerImages=source?.images.length?source.images:images;
 // Retain the catalogue image as a last fallback; supplier CDN photos may restrict hotlinking.
 const gallery=[...new Set([source?sourceVariant?.image:originalMatching?.image,...sellerImages,...images].filter((x):x is string=>!!x))].filter(x=>!badImages.includes(x));
 const chosenIndex=Math.min(image,Math.max(0,gallery.length-1));
 const priceCNY=sourceVariant?.price??source?.offerPrice;
 const priceLabel=source?(source.variants.length>0&&!sourceVariant?"Option unavailable":priceCNY!=null?formatCNY(priceCNY):"Supplier price unavailable"):originalMatching?.price!=null?"£"+originalMatching.price.toFixed(2):price;
 const selection=source
  ?selectedRows.length?selectedRows.map(v=>v.title+" × "+quantities[v.skuCode]).join(" · "):sourceVariant?.title||"Choose variant and quantity with your agent"
  :[colour,size,style,originalMatching?.label].filter(Boolean).join(" · ")||"Standard option";
 const canSource=Boolean(product.originalMarketplaceUrl||product.sugargooProductUrl||Object.values(product.agentLinks||{}).some(Boolean)||originalVariants.some(v=>Object.values(v.agentLinks||{}).some(Boolean)));
 const marketplace=product.originalMarketplaceUrl;
 const briefQuery=encodeURIComponent(marketplace||title);
 const outOfStock=Boolean(source&&(source.available===false||sourceVariant?.stock===0));

 return <>
  <section className="product-layout">
   <div>
    <div className="gallery-main">
     {gallery[chosenIndex]?<img src={gallery[chosenIndex]} alt={title} referrerPolicy="no-referrer" onError={()=>{const failed=gallery[chosenIndex];setBadImages(prev=>prev.includes(failed)?prev:[...prev,failed]);}}/>:<div className="hc-image-missing">Product image currently unavailable</div>}
     <span className="gallery-count">{gallery.length?chosenIndex+1:0} / {gallery.length}</span>
    </div>
    {gallery.length>1&&<div className="thumbs">{gallery.slice(0,16).map((src,i)=><button type="button" className={i===chosenIndex?"active":""} onClick={()=>setImage(i)} key={src}><img src={src} alt={"Product view "+(i+1)} referrerPolicy="no-referrer" onError={e=>{e.currentTarget.hidden=true;}}/></button>)}</div>}
   </div>
   <aside className="buy-panel">
    <p className="eyebrow">{product.category||"HEROCON PRODUCT DISCOVERY"}</p>
    <h1>{title}</h1>
    <p className="supplier-title">{source?.sellerName?"Marketplace seller: "+source.sellerName:product.originalTitle||product.title}</p>
    {!source&&product.sellerId&&<Link className="seller-link" href={"/seller/"+encodeURIComponent(product.sellerId)}>{product.sellerName} ↗</Link>}
    {buckydropEnabled&&<p className="sc-source-state" role="status">{lookup.status==="loading"?"Checking seller photos, sizes and prices…":lookup.status==="error"?"Live seller details unavailable. Showing saved listing information.":"Seller details retrieved via BuckyDrop • Unverified"}</p>}
    <div className="product-price">{priceLabel}</div>
    {source&&<p className="sc-source-subprice">Supplier reference price in CNY • Previously saved catalogue reference: {price}</p>}
    <p className="sc-product-disclosure">{source?"Supplier listing information, not a final Herocon price. Availability and product quality are unverified. International delivery, taxes and fees are not included.":"Listed marketplace price only. Variants, stock, MOQ, delivery charges, duty and VAT must be confirmed before ordering. A recorded original link does not mean the supplier has been vetted."}</p>

    {source&&source.variants.length>0? <div className="sc-supplier-variant-area">
      <div className="sc-sku-heading"><strong>Seller options</strong><span>{source.variants.length} variants · Select quantities to prepare a sourcing order</span></div>
      <div className="sc-sku-list">
       {visibleSkus.map(v=>{
        const quantity=quantities[v.skuCode]||0;
        const image=v.image||source.images[0]||images[0];
        const unavailable=source.available===false||v.stock===0;
        return <div key={v.skuCode} className={"sc-sku-row"+(v.skuCode===sourceVariant?.skuCode?" active":"")}>
         <button type="button" className="sc-sku-preview" onClick={()=>{setActiveSku(v.skuCode);setImage(0);}} aria-pressed={v.skuCode===sourceVariant?.skuCode} aria-label={"View "+v.title}>
          {image?<img src={image} alt={v.title} loading="lazy" referrerPolicy="no-referrer" onError={e=>{e.currentTarget.hidden=true;}}/>:<span className="sc-sku-image-fallback">No photo</span>}
          <span className="sc-sku-name">{v.options.map(p=>p.value).join(" / ")||v.title}</span>
         </button>
         <div className="sc-sku-numbers"><strong>{v.price!=null?formatCNY(v.price):"Quote needed"}</strong><span>{v.stock==null?"Stock unknown":v.stock===0?"Out of stock":v.stock+" in stock"}</span></div>
         <div className="sc-sku-qty" aria-label={"Quantity of "+v.title}>
          <button type="button" onClick={()=>updateQuantity(v.skuCode,-1)} disabled={quantity===0} aria-label={"Remove one "+v.title}>−</button>
          <output aria-label={"Quantity "+quantity}>{quantity}</output>
          <button type="button" onClick={()=>updateQuantity(v.skuCode,1)} disabled={unavailable||(v.stock!=null&&quantity>=v.stock)} aria-label={"Add one "+v.title}>+</button>
         </div>
        </div>;
       })}
      </div>
      {source.variants.length>8&&<button type="button" className="sc-sku-show-more" onClick={()=>setShowAllSkus(v=>!v)}>{showAllSkus?"Show fewer options":"Show all "+source.variants.length+" options"} <span aria-hidden="true">{showAllSkus?"↑":"↓"}</span></button>}
      <div className="sc-sku-summary">
       <div><strong>{totalUnits} selected</strong><span>{totalUnits<minOrder?"Minimum order: "+minOrder+" units":"Minimum order of "+minOrder+" met"}</span></div>
       <div><strong>{hasUnknownPrice?"Quote required":formatCNY(subtotal)}</strong><span>Products only · CNY</span></div>
      </div>
      {selectedRows.length>0&&<button type="button" className="sc-sku-copy" onClick={copyOrder}>{copiedSelection?"Selection copied ✓":"Copy variants & quantities for your agent"}</button>}
      <p className="sc-sku-disclaimer">This is a sourcing list, not a basket or confirmed order. You must select quantities again with your purchasing agent. Prices, stock and delivery need reconfirmation.</p>
    </div> : source?null:<>
      <Selector label="COLOUR" value={colour} items={colours} set={setColour}/><Selector label="SIZE" value={size} items={sizes} set={setSize}/><Selector label="STYLE" value={style} items={styles} set={setStyle}/>
    </>}

    {source&&<div className="sc-supplier-facts">
      {source.moq!=null&&<p><strong>Minimum order:</strong> {source.moq}</p>}
      {source.chinaDomesticFreight!=null&&<p><strong>Shipping within China:</strong> {formatCNY(source.chinaDomesticFreight)} CNY (supplier reference)</p>}
      <p><strong>International shipping:</strong> Not calculated; confirm with the agent.</p>
      {outOfStock&&<p className="sc-supplier-unavailable">Supplier listing indicates this item or option is not currently available.</p>}
      {source.descriptionText&&<details><summary>Seller's product description</summary><p>{source.descriptionText.slice(0,2800)}</p></details>}
      <small>Source: {source.marketplace||"Marketplace"} • Seller information may change. Check exact materials, shipping and quality before buying.</small>
    </div>}

    <div className="selected-box">
     {canSource?<button type="button" className="source-btn hc-agent-picker-btn" onClick={()=>setModal(true)}>BUY WITH AN AGENT <span>↗</span></button>:<p className="supplier-title">No original marketplace link is recorded for this product.</p>}
     {marketplace&&<a className="original-btn" href={marketplace} target="_blank" rel="noopener noreferrer">View original marketplace listing ↗</a>}
     <Link className="sc-product-brief-link" href={"/sourcing?product="+briefQuery}>Prepare a sourcing brief for this product ↗</Link>
    </div>
   </aside>
  </section>
  {canSource&&<AgentModal open={modal} onClose={()=>setModal(false)} productId={id} variantId={source?undefined:originalMatching?.id} selection={selection} marketplaceUrl={marketplace} agentLinks={product.agentLinks}/>}
  <div className="mobile-buy"><span><b>{priceLabel}</b><small>{source?"Supplier price CNY • shipping extra":"Marketplace price • shipping extra"}</small></span>{canSource&&<button type="button" onClick={()=>setModal(true)}>USE AN AGENT</button>}</div>
 </>;
}
function Selector({label,value,items,set}:{label:string;value?:string;items:string[];set:(v:string)=>void}){
 if(!items.length)return null;
 return <fieldset className="selector"><legend>{label}<b>{value}</b></legend><div>{items.map(x=><button type="button" key={x} className={x===value?"selected":""} onClick={()=>set(x)}>{x}</button>)}</div></fieldset>;
}