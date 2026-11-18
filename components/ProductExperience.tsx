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
 const[optionChoices,setOptionChoices]=useState<Record<string,string>>({});
 const[skuChoice,setSkuChoice]=useState("");

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
   .then(data=>{if(!controller.signal.aborted){setLookup({status:"ready",data});setImage(0);setBadImages([]);setOptionChoices({});setSkuChoice("");}})
   .catch(()=>{if(!controller.signal.aborted)setLookup({status:"error"});});
  return ()=>controller.abort();
 },[id,buckydropEnabled]);

 const source=buckydropEnabled&&lookup.status==="ready"?lookup.data:null;
 const sourceGroups=useMemo(()=>{
  if(!source)return [];
  const groups=new Map<string,string[]>();
  for(const v of source.variants)for(const prop of v.options){
   const existing=groups.get(prop.name)||[];
   if(!existing.includes(prop.value))existing.push(prop.value);
   groups.set(prop.name,existing);
  }
  return [...groups].map(([name,items])=>({name,items}));
 },[source]);
 const defaultSku=source?.variants.find(v=>v.stock===null||v.stock>0)||source?.variants[0];
 const chosenOptions=Object.fromEntries(sourceGroups.map(group=>[
  group.name,optionChoices[group.name]||defaultSku?.options.find(p=>p.name===group.name)?.value||group.items[0]
 ]));
 const sourceVariant=sourceGroups.length>0
  ?source?.variants.find(v=>sourceGroups.every(group=>v.options.some(p=>p.name===group.name&&p.value===chosenOptions[group.name])))
  :source?.variants.find(v=>v.skuCode===(skuChoice||defaultSku?.skuCode));
 const originalMatching=originalVariants.find(v=>(!colour||!v.colour||v.colour===colour)&&(!size||!v.size||v.size===size)&&(!style||!v.style||v.style===style)&&v.available!==false);
 const sellerImages=source?.images.length?source.images:images;
 const gallery=[...new Set([source?sourceVariant?.image:originalMatching?.image,...sellerImages].filter((x):x is string=>!!x))].filter(x=>!badImages.includes(x));
 const chosenIndex=Math.min(image,Math.max(0,gallery.length-1));
 const priceCNY=sourceVariant?.price??source?.offerPrice;
 const priceLabel=source?(source.variants.length>0&&!sourceVariant?"Option unavailable":priceCNY!=null?formatCNY(priceCNY):"Supplier price unavailable"):originalMatching?.price!=null?"£"+originalMatching.price.toFixed(2):price;
 const selection=source
  ?sourceGroups.length?sourceGroups.map(group=>chosenOptions[group.name]).join(" · "):sourceVariant?.title||"Choose the variant with your agent"
  :[colour,size,style,originalMatching?.label].filter(Boolean).join(" · ")||"Standard option";
 const canSource=Boolean(product.originalMarketplaceUrl||product.sugargooProductUrl||Object.values(product.agentLinks||{}).some(Boolean)||originalVariants.some(v=>Object.values(v.agentLinks||{}).some(Boolean)));
 const marketplace=product.originalMarketplaceUrl;
 const briefQuery=encodeURIComponent(marketplace||title);
 const outOfStock=Boolean(source&&(source.available===false||sourceVariant?.stock===0));
 const noMatchedSku=Boolean(source&&source.variants.length>0&&!sourceVariant);

 return <>
  <section className="product-layout">
   <div>
    <div className="gallery-main">
     {gallery[chosenIndex]?<img src={gallery[chosenIndex]} alt={title} onError={()=>setBadImages(prev=>[...prev,gallery[chosenIndex]])}/>:<div className="hc-image-missing">Product image currently unavailable</div>}
     <span className="gallery-count">{gallery.length?chosenIndex+1:0} / {gallery.length}</span>
    </div>
    {gallery.length>1&&<div className="thumbs">{gallery.slice(0,16).map((src,i)=><button type="button" className={i===chosenIndex?"active":""} onClick={()=>setImage(i)} key={src}><img src={src} alt={"Product view "+(i+1)} onError={()=>setBadImages(prev=>[...prev,src])}/></button>)}</div>}
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
      {sourceGroups.length>0?sourceGroups.map(group=><Selector key={group.name} label={group.name.toUpperCase()} value={chosenOptions[group.name]} items={group.items} set={next=>{setOptionChoices(current=>({...current,[group.name]:next}));setImage(0);}}/>):<div className="sc-supplier-plain-selector"><label htmlFor="hc-sku">SUPPLIER OPTION</label><select id="hc-sku" value={skuChoice||defaultSku?.skuCode||""} onChange={e=>{setSkuChoice(e.target.value);setImage(0);}}>{source.variants.map(v=><option key={v.skuCode} value={v.skuCode}>{v.title}</option>)}</select></div>}
      {sourceVariant&&<p className="sc-supplier-stock">{sourceVariant.stock==null?"Stock not confirmed":sourceVariant.stock===0?"This option is listed as out of stock":sourceVariant.stock+" shown as available by supplier"}{sourceVariant.price!=null?" · "+formatCNY(sourceVariant.price)+" CNY":""}</p>}
      {noMatchedSku&&<p className="sc-supplier-stock sc-supplier-unavailable">This colour/size combination was not returned by the seller. Choose another option.</p>}
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