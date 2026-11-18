"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {variantsFor} from "@/lib/catalogue";
import type {Product} from "@/lib/types";
import type {BuckydropProduct} from "@/lib/buckydrop";

type Lookup={status:"loading"}|{status:"ready";data:BuckydropProduct}|{status:"error"};
const formatCNY=(amount:number)=>"¥"+amount.toFixed(2);
const formatGBP=(amount:number)=>"£"+amount.toFixed(2);
type ForexRate={rate:number;date:string};

export default function ProductExperience({product,id,title,images,price,buckydropEnabled=false,initialSource,initialFx}:{product:Product;id:string;title:string;images:string[];price:string;buckydropEnabled?:boolean;initialSource?:BuckydropProduct;initialFx?:ForexRate}){
 const originalVariants=useMemo(()=>variantsFor(product),[product]);
 const colours=[...new Set([...(product.colours||[]),...originalVariants.map(v=>v.colour).filter((x):x is string=>!!x)])];
 const sizes=[...new Set([...(product.sizes||[]),...originalVariants.map(v=>v.size).filter((x):x is string=>!!x)])];
 const styles=[...new Set([...(product.styles||[]),...originalVariants.map(v=>v.style).filter((x):x is string=>!!x)])];
 const[colour,setColour]=useState(colours[0]),[size,setSize]=useState(sizes[0]),[style,setStyle]=useState(styles[0]);
 const[image,setImage]=useState(0),[badImages,setBadImages]=useState<string[]>([]);
 const[lookup,setLookup]=useState<Lookup>(initialSource?{status:"ready",data:initialSource}:{status:"loading"});
 const[activeSku,setActiveSku]=useState("");
 const[quantities,setQuantities]=useState<Record<string,number>>({});
 const[showAllSkus,setShowAllSkus]=useState(false);
 const[copiedSelection,setCopiedSelection]=useState(false);
 const[fx,setFx]=useState<ForexRate|null>(initialFx||null);
 useEffect(()=>{
  if(!buckydropEnabled||initialFx)return;
  const controller=new AbortController();
  fetch("/api/fx/cny-gbp",{signal:controller.signal}).then(async response=>{
   if(!response.ok)throw new Error("Exchange rate unavailable");
   return response.json();
  }).then(data=>{
   if(!controller.signal.aborted&&typeof data.rate==="number"&&data.rate>0&&data.rate<0.5
    &&typeof data.date==="string")setFx({rate:data.rate,date:data.date});
  }).catch(()=>{if(!controller.signal.aborted)setFx(null)});
  return ()=>controller.abort();
 },[buckydropEnabled,initialFx]);
 const dualPrice=(cny:number)=>formatCNY(cny)+(fx?" ≈ "+formatGBP(cny*fx.rate):"");

 useEffect(()=>{
  if(!buckydropEnabled||initialSource)return;
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
 },[id,buckydropEnabled,initialSource]);

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
  const lines=[title,marketplace,"Selected supplier variants and quantities:",...selectedRows.map(v=>"- "+v.title+" | SKU "+v.skuCode+" | qty "+quantities[v.skuCode]+(v.price==null?"":" | unit "+formatCNY(v.price))),'Product subtotal before shipping and fees: '+(hasUnknownPrice?"Quote required":dualPrice(subtotal))];
  const note=lines.join("\n");
  try{await navigator.clipboard.writeText(note);setCopiedSelection(true);}catch{window.prompt("Copy sourcing selections:",note);}
 };
 const originalMatching=originalVariants.find(v=>(!colour||!v.colour||v.colour===colour)&&(!size||!v.size||v.size===size)&&(!style||!v.style||v.style===style)&&v.available!==false);
 const sellerImages=source?.images.length?source.images:images;
 // Retain the catalogue image as a last fallback; supplier CDN photos may restrict hotlinking.
 const gallery=[...new Set([source?sourceVariant?.image:originalMatching?.image,...sellerImages,...images].filter((x):x is string=>!!x))].filter(x=>!badImages.includes(x));
 const chosenIndex=Math.min(image,Math.max(0,gallery.length-1));
 const priceCNY=sourceVariant?.price??source?.offerPrice;
 const variantPrices=(source?.variants||[]).map(v=>v.price).filter((x):x is number=>x!=null&&Number.isFinite(x));
 const minPrice=variantPrices.length?Math.min(...variantPrices):null;
 const maxPrice=variantPrices.length?Math.max(...variantPrices):null;
 const priceRange=minPrice!=null&&maxPrice!=null?(minPrice===maxPrice?dualPrice(minPrice):
  formatCNY(minPrice)+" – "+formatCNY(maxPrice)+(fx?" ≈ "+formatGBP(minPrice*fx.rate)+" – "+formatGBP(maxPrice*fx.rate):"")):null;
 const priceLabel=source?(source.variants.length>0&&!sourceVariant?"Option unavailable":
  activeSku&&sourceVariant?.price!=null?dualPrice(sourceVariant.price):priceRange||
  (priceCNY!=null?dualPrice(priceCNY):"Supplier price unavailable")):
  originalMatching?.price!=null?"£"+originalMatching.price.toFixed(2):price;
 const marketplace=product.originalMarketplaceUrl;
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
    {buckydropEnabled&&lookup.status!=="ready"&&<p className="sc-source-state" role="status">{lookup.status==="loading"?"Loading seller options…":"Live seller details are unavailable. Showing the saved listing."}</p>}
    <div className="product-price">{priceLabel}</div>
    {source&&<p className="sc-source-subprice">Supplier unit price · {fx?"GBP is an approximate conversion using the "+fx.date+" reference rate":"Prices are in CNY; GBP conversion is temporarily unavailable"} · Shipping calculated separately</p>}

    {source&&source.variants.length>0? <div className="sc-supplier-variant-area">
      <div className="sc-sku-heading"><strong>Choose options</strong><span>{source.variants.length} seller variants · Select quantities</span></div>
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
         <div className="sc-sku-numbers"><strong>{v.price!=null?dualPrice(v.price):"Quote needed"}</strong><span>{v.stock==null?"Stock unknown":v.stock===0?"Out of stock":v.stock+" in stock"}</span></div>
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
       <div><strong>{hasUnknownPrice?"Quote required":dualPrice(subtotal)}</strong><span>Product subtotal · CNY / approx. GBP</span></div>
      </div>
      {selectedRows.length>0&&<button type="button" className="sc-sku-copy" onClick={copyOrder}>{copiedSelection?"Selection copied ✓":"Copy selected variants & quantities"}</button>}
      <p className="sc-sku-disclaimer">Your selection is saved only on this page. Direct checkout and delivery quotes are being prepared.</p>
    </div> : source?null:<>
      <Selector label="COLOUR" value={colour} items={colours} set={setColour}/><Selector label="SIZE" value={size} items={sizes} set={setSize}/><Selector label="STYLE" value={style} items={styles} set={setStyle}/>
    </>}

    {source&&<div className="sc-supplier-facts">
      {source.moq!=null&&<p><strong>Minimum order:</strong> {source.moq}</p>}
      {source.chinaDomesticFreight!=null&&<p><strong>Shipping within China:</strong> {dualPrice(source.chinaDomesticFreight)}</p>}
      <p><strong>International delivery:</strong> Quote not yet available.</p>
      {outOfStock&&<p className="sc-supplier-unavailable">Supplier listing indicates this item or option is not currently available.</p>}
      {source.descriptionText&&<details><summary>Seller's product description</summary><p>{source.descriptionText.slice(0,2800)}</p></details>}
    </div>}

    <div className="selected-box">
     <div className="sc-checkout-prelaunch"><strong>Direct checkout coming soon</strong><p>Herocon is connecting payments and order fulfilment. No payment will be taken from this page yet.</p></div>
    </div>
   </aside>
  </section>
  <div className="mobile-buy"><span><b>{priceLabel}</b><small>{source?"CNY and approximate GBP · delivery extra":"Listing price · delivery extra"}</small></span><span className="sc-mobile-coming-soon">Checkout coming soon</span></div>
 </>;
}
function Selector({label,value,items,set}:{label:string;value?:string;items:string[];set:(v:string)=>void}){
 if(!items.length)return null;
 return <fieldset className="selector"><legend>{label}<b>{value}</b></legend><div>{items.map(x=><button type="button" key={x} className={x===value?"selected":""} onClick={()=>set(x)}>{x}</button>)}</div></fieldset>;
}