"use client";
import {useEffect,useRef,useState} from "react";
import type {FormEvent} from "react";
import Link from "next/link";
import {useCart} from "@/components/CartProvider";
type Variant={id:string;name:string;price:number|null;stock:number|null;image:string};
type Item={id:string;channel:string;domesticFreightCny?:number|null;title:string;url:string;images:string[];price:number|null;seller:string;minimum:number|null;variants:Variant[];attributes:{name:string;value:string}[]};
type Rate={rate:number;date:string};
type SavedSearch={id:string;label:string;savedAt:string;action:string};
type Result={history?:SavedSearch[];cacheStatus?:string;savedAt?:string|null;items?:Item[];product?:Item;page?:number;total?:number|null;fx?:Rate|null;error?:string};
type Mode="parse"|"search"|"image";
const names={parse:"Paste a link",search:"Keyword search",image:"Image search"};
const market=(s:string)=>s==="taobao"?"Taobao":s==="weidian"?"Weidian":"1688";
const money=(v:number|null,fx:Rate|null)=>v===null?"Price unavailable":"¥"+v.toFixed(2)+(fx?" · ≈ £"+(v*fx.rate).toFixed(2):"");
export default function HiobuyDiscovery({initialUrl,initialId="",initialChannel="",owner=true,initialMode="parse"}:{initialUrl:string;initialId?:string;initialChannel?:string;owner?:boolean;initialMode?:Mode}){
 const {items:cartItems,addItems,hydrated,account}=useCart();
 const [quantity,setQuantity]=useState(1),[cartMessage,setCartMessage]=useState(""),[savedSearches,setSavedSearches]=useState<SavedSearch[]>([]),[cacheMessage,setCacheMessage]=useState("");
 async function loadHistory(){try{const r=await fetch("/api/hiobuy/discovery",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"history"}),cache:"no-store"});const data:Result=await r.json();if(r.ok&&data.history)setSavedSearches(data.history);}catch{}}
 const [mode,setMode]=useState<Mode>(initialMode),[url,setUrl]=useState(initialUrl),[keyword,setKeyword]=useState(""),[image,setImage]=useState(""),[fileName,setFileName]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[items,setItems]=useState<Item[]|null>(null),[detail,setDetail]=useState<Item|null>(null),[fx,setFx]=useState<Rate|null>(null),[page,setPage]=useState(1),[total,setTotal]=useState<number|null>(null),[activePhoto,setActivePhoto]=useState(0),[variant,setVariant]=useState<Variant|null>(null);
 const last=useRef<Record<string,unknown>|null>(null),abort=useRef<AbortController|null>(null);
 async function run(body:Record<string,unknown>,isDetail=false){
  abort.current?.abort();const controller=new AbortController();abort.current=controller;
  setBusy(true);setError("");setCacheMessage("");setCartMessage("");setDetail(null);setVariant(null);setActivePhoto(0);setQuantity(1);
  if(!isDetail){setItems(null);last.current=body.action==="saved"?null:body;}
  try{
   const response=await fetch("/api/hiobuy/discovery",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store",signal:controller.signal});
   const result:Result=await response.json();
   if(!response.ok)throw new Error(result.error||"Product discovery failed.");
   if(controller.signal.aborted)return;
   setFx(result.fx??null);
   if(result.product){setDetail(result.product);setQuantity(Math.max(1,Math.min(999,Math.ceil(result.product.minimum??1))));}
   setCacheMessage(!owner?"":result.cacheStatus==="hit"?"Saved reference data · "+(result.savedAt?new Date(result.savedAt).toLocaleString():""):result.cacheStatus==="stored"?"Search saved to Herocon":result.cacheStatus==="unavailable"?"Results retrieved, but storage is temporarily unavailable.":"");
   if(owner&&result.cacheStatus==="stored")void loadHistory();
   if(result.items){setItems(result.items);setPage(result.page??1);setTotal(result.total??null);}
  }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Something went wrong.");}
  finally{if(!controller.signal.aborted)setBusy(false);}
 }
 useEffect(()=>{if(owner)void loadHistory();if(initialId&&initialChannel)void run({action:"detail",id:initialId,channel:initialChannel});else if(initialUrl)void run({action:"parse",url:initialUrl});return()=>abort.current?.abort();},[initialUrl,initialId,initialChannel,owner]);
 const min=Math.max(1,Math.ceil(detail?.minimum??1));
 const sku=variant?.id||"";
 const cartKey=detail?"hiobuy:"+detail.channel+":"+detail.id+":"+sku:"";
 const existingQuantity=cartItems.find(x=>x.key===cartKey)?.quantity??0;
 const max=Math.min(999-existingQuantity,variant?.stock==null?999:Math.max(0,Math.floor(variant.stock)-existingQuantity));
 const canAdd=!!detail?.id&&!!detail.url&&hydrated&&account.status==="authenticated"&&(!detail.variants.length||!!variant?.id)&&quantity>=min&&quantity<=max&&(cartItems.length<100||existingQuantity>0);
 function addToCart(){if(!detail||!canAdd)return;addItems([{key:cartKey,source:"hiobuy",productId:"hiobuy:"+detail.channel+":"+detail.id,productPath:"/find-product?hioId="+encodeURIComponent(detail.id)+"&hioChannel="+encodeURIComponent(detail.channel),title:detail.title,image:variant?.image||detail.images[0],marketplaceUrl:detail.url,variant:variant?.name||"",skuCode:variant?.id||undefined,quantity,unitPrice:variant?variant.price:detail.price,currency:"CNY",domesticFreightCny:detail.domesticFreightCny??null}]);setCartMessage("Added to your cart.");}
 function submit(e:FormEvent){e.preventDefault();void run(mode==="parse"?{action:"parse",url}:mode==="search"?{action:"search",channel:"1688",keyword,page:1}:{action:"image",channel:"1688",image,page:1});}
 function changeMode(m:Mode){abort.current?.abort();setBusy(false);setMode(m);setError("");setItems(null);setDetail(null);last.current=null;}
 function readImage(file:File|undefined){setImage("");setFileName("");setError("");if(!file)return;if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>2*1024*1024){setError("Choose a JPEG, PNG or WebP image under 2 MB.");return;}const r=new FileReader();r.onload=()=>{if(typeof r.result==="string"){setImage(r.result);setFileName(file.name);}};r.onerror=()=>setError("Could not read that image.");r.readAsDataURL(file);}
 return <>
 <section className="hc-link-intro"><div className="hc-link-intro-inner"><p className="sc-kicker">HEROCON DISCOVERY</p><h1>Find products</h1><p className="hc-link-intro-copy">Search the 1688 marketplace by keyword or photo. {owner?"Owner access also includes live product link lookup.":"Find supplier products and save them to your cart."}</p>
 <div className="hc-link-input-panel hio-panel">
 <div className="hio-tabs hc-discovery-nav" role="group" aria-label="Discovery method">{!owner&&<Link href="/find-product">Product link</Link>}{(Object.keys(names) as Mode[]).filter(m=>owner||m!=="parse").map(m=><button key={m} type="button" aria-pressed={mode===m} onClick={()=>changeMode(m)}>{names[m]}</button>)}</div>
 <form onSubmit={submit} className="hio-form">
 {mode==="parse"?<label>Marketplace product link<input required type="url" value={url} maxLength={1000} onChange={e=>setUrl(e.target.value)} placeholder="https://detail.1688.com/offer/…"/></label>:mode==="search"?<label>What are you looking for?<input required value={keyword} maxLength={160} onChange={e=>setKeyword(e.target.value)} placeholder="e.g. ceramic vase, linen dress"/></label>:<label>Upload a product photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>readImage(e.target.files?.[0])}/>{fileName&&<small>{fileName}</small>}{image&&<img className="hio-upload-preview" src={image} alt="Selected product photo"/>}</label>}
 <button className="hio-primary" type="submit" disabled={busy||(mode==="image"&&!image)}>{busy?"Searching…":mode==="parse"?"Find product":mode==="search"?"Search products":"Find similar products"}</button></form>
 {mode==="image"&&<p className="hio-note">Upload a product photo only, without personal or sensitive information. Your image is sent to our sourcing partner Hiobuy to find matches. <Link href="/privacy-policy">Privacy policy</Link>.</p>}
 <p className="hio-note">{mode==="parse"?"1688 · Weidian":"1688"} · {owner?"Owner access.":"Up to 10 new live requests per account daily, including product details and result pages. Shared capacity also applies."} Purchasing is not yet available.</p>{owner&&savedSearches.length>0&&<details className="hio-history"><summary>Recent saved searches</summary><div>{savedSearches.map(s=><button type="button" key={s.id} disabled={busy} onClick={()=>void run({action:"saved",id:s.id})}>{s.label}<small>{new Date(s.savedAt).toLocaleDateString()}</small></button>)}</div></details>}</div></div></section>
 <section className="hio-results" aria-live="polite">
 {busy&&<p role="status" className="hio-status">Retrieving marketplace data…</p>}
 {cacheMessage&&<p className="hio-note" role="status">{cacheMessage}</p>}
 {error&&<p role="alert" className="hio-status hio-error">{error}</p>}
 {detail&&<article className="hio-detail">
 <div><div className="hio-photo">{(detail.images[activePhoto]||variant?.image)?<img src={detail.images[activePhoto]||variant?.image} alt={detail.title} referrerPolicy="no-referrer"/>:<span>No product photo supplied</span>}</div><div className="hio-thumbs">{detail.images.map((src,i)=><button key={src} onClick={()=>{setActivePhoto(i);}} aria-label={"View photo "+(i+1)} aria-pressed={!variant&&activePhoto===i}><img src={src} alt="" referrerPolicy="no-referrer" loading="lazy"/></button>)}</div></div>
 <div className="hio-detail-info"><p className="sc-kicker">{market(detail.channel)} · Product details</p><h2>{detail.title}</h2><p className="hio-price">{money(variant?variant.price??detail.price:detail.price,fx)}</p>{detail.seller&&<p>Seller: {detail.seller}</p>}{detail.minimum!==null&&<p>Minimum order: {detail.minimum}</p>}
 {detail.variants.length>0&&<label className="hio-variant">Available options<select value={variant?.id??""} onChange={e=>{const v=detail.variants.find(v=>v.id===e.target.value)||null;setVariant(v);setCartMessage("");setQuantity(min);if(v?.image){const i=detail.images.indexOf(v.image);if(i>=0)setActivePhoto(i);}}}><option value="">Choose a variant</option>{detail.variants.map((v,i)=><option key={v.id||i} value={v.id} disabled={v.stock===0}>{v.name} — {money(v.price,fx)}{v.stock===0?" (out of stock)":""}</option>)}</select></label>}
 {variant&&<p>{variant.stock===null?"Stock not supplied":"Available stock: "+variant.stock}</p>}
 <div className="hio-cart-controls"><label>Quantity<input type="number" min={min} max={Math.max(min,max)} value={quantity} onChange={e=>{setQuantity(Number(e.target.value));setCartMessage("");}}/></label><button className="hio-primary" disabled={!canAdd} onClick={addToCart}>Add to cart</button></div>
 {detail.variants.length>0&&!variant&&<p className="hio-note">Select an available option to add it to your cart.</p>}{max<min&&<p className="hio-note">Not enough recorded stock for another minimum order.</p>}{cartMessage&&<p role="status" className="hio-note">{cartMessage} <Link href="/cart">View cart</Link>{owner&&<> · <Link href="/owner/checkout">Checkout</Link></>}</p>}
 {detail.attributes.length>0&&<details><summary>Product specifications</summary><dl>{detail.attributes.map((a,i)=><div key={i}><dt>{a.name}</dt><dd>{a.value}</dd></div>)}</dl></details>}
 {detail.url&&<p className="hio-note">Original source: {detail.url}</p>}
 <p className="hio-note">Reference product price. China delivery: {typeof detail.domesticFreightCny==="number"?money(detail.domesticFreightCny,fx)+" (estimate)":"Unconfirmed"}. International shipping is separate.</p>{items&&<button className="hio-secondary" onClick={()=>{setDetail(null);setVariant(null);}}>Back to results</button>}</div>
 </article>}
 {items&&!detail&&<><div className="hio-results-head"><h2>Search results</h2><span>{total!==null?total.toLocaleString()+" matches · ":""}Page {page}</span></div>
 {items.length===0?<p className="hio-status">No products found. Try a different search.</p>:<div className="hio-grid">{items.map((p,i)=><button className="hio-card" key={p.channel+":"+p.id+":"+i} onClick={()=>void run({action:"detail",channel:p.channel,id:p.id},true)} disabled={busy||!p.id}><div className="hio-card-image">{p.images[0]?<img src={p.images[0]} alt={p.title} loading="lazy" referrerPolicy="no-referrer"/>:<span>No image</span>}</div><strong>{p.title}</strong><b>{money(p.price,fx)}</b><small>{market(p.channel)}{p.seller?" · "+p.seller:""}</small></button>)}</div>}
 <div className="hio-pagination"><button disabled={busy||!last.current||page<=1} onClick={()=>last.current&&void run({...last.current,page:page-1})}>Previous</button><button disabled={busy||!last.current||page>=50||items.length<20||(total!==null&&page*20>=total)} onClick={()=>last.current&&void run({...last.current,page:page+1})}>Next page</button></div></>}
 </section></>;
}
