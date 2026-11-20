"use client";
import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {ExternalArrowIcon} from "@/components/ShopIcons";
import {variantsFor} from "@/lib/catalogue";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {useCart,type CartItem,PENDING_CART_KEY} from "@/components/CartProvider";
import type {Product} from "@/lib/types";
import type {BuckydropProduct} from "@/lib/buckydrop";

type ForexRate={rate:number;date:string};
const formatCNY=(amount:number)=>"¥"+amount.toFixed(2);
const formatGBP=(amount:number)=>"£"+amount.toFixed(2);

export default function ProductExperience({product,id,title,images,price,buckydropEnabled=false,initialSource,initialFx,sourceLookupFailed=false,gbpOnly=false,customProductPath}:{product:Product;id:string;title:string;images:string[];price:string;buckydropEnabled?:boolean;initialSource?:BuckydropProduct;initialFx?:ForexRate;sourceLookupFailed?:boolean;gbpOnly?:boolean;customProductPath?:string}){
 const router=useRouter();
 const {addItems,account,refreshAccount}=useCart();
 const originalVariants=useMemo(()=>variantsFor(product),[product]);
 const colours=[...new Set([...(product.colours||[]),...originalVariants.map(v=>v.colour).filter((x):x is string=>!!x)])];
 const sizes=[...new Set([...(product.sizes||[]),...originalVariants.map(v=>v.size).filter((x):x is string=>!!x)])];
 const styles=[...new Set([...(product.styles||[]),...originalVariants.map(v=>v.style).filter((x):x is string=>!!x)])];
 const [colour,setColour]=useState(colours[0]),[size,setSize]=useState(sizes[0]),[style,setStyle]=useState(styles[0]);
 const [image,setImage]=useState(0),[badImages,setBadImages]=useState<string[]>([]);
 const [activeSku,setActiveSku]=useState("");
 const [quantities,setQuantities]=useState<Record<string,number>>({});
 const [showAllSkus,setShowAllSkus]=useState(false);
 const [singleQuantity,setSingleQuantity]=useState(1);
 const [cartMessage,setCartMessage]=useState("");
 const [showFullDescription,setShowFullDescription]=useState(false);
 const [fx,setFx]=useState<ForexRate|null>(initialFx||null);

 useEffect(()=>{
  if(!initialSource||initialFx)return;
  const controller=new AbortController();
  fetch("/api/fx/cny-gbp",{signal:controller.signal})
   .then(async response=>{if(!response.ok)throw Error("Exchange rate unavailable");return response.json();})
   .then(data=>{if(!controller.signal.aborted&&typeof data.rate==="number"&&data.rate>0&&data.rate<0.5&&typeof data.date==="string")setFx({rate:data.rate,date:data.date});})
   .catch(()=>{if(!controller.signal.aborted)setFx(null);});
  return ()=>controller.abort();
 },[buckydropEnabled,initialFx]);
 const dualPrice=(cny:number)=>gbpOnly?(fx?formatGBP(cny*fx.rate):"GBP price unavailable"):formatCNY(cny)+(fx?" ≈ "+formatGBP(cny*fx.rate):"");

 // Partner details are merged server-side from permanent storage. Never call a
 // billable partner endpoint merely because a customer opened the product page.
 const source=initialSource||null;
 const marketplace=normalizeMarketplaceLink(product.originalMarketplaceUrl)||normalizeMarketplaceLink(source?.originalUrl);
 const sellerName=source?.sellerName||product.sellerName;
 const defaultSku=source?.variants.find(v=>v.stock===null||v.stock>0)||source?.variants[0];
 const sourceVariant=source?.variants.find(v=>v.skuCode===activeSku)||defaultSku;
 const selectedRows=source?.variants.filter(v=>(quantities[v.skuCode]||0)>0)||[];
 const totalUnits=selectedRows.reduce((sum,v)=>sum+(quantities[v.skuCode]||0),0);
 const subtotal=selectedRows.reduce((sum,v)=>sum+(v.price||0)*(quantities[v.skuCode]||0),0);
 const hasUnknownPrice=selectedRows.some(v=>v.price==null);
 const minOrder=Math.max(1,source?.moq||1);
 const visibleSkus=showAllSkus?source?.variants||[]:source?.variants.slice(0,8)||[];
 const originalMatching=originalVariants.find(v=>(!colour||!v.colour||v.colour===colour)&&(!size||!v.size||v.size===size)&&(!style||!v.style||v.style===style)&&v.available!==false);
 const sellerImages=source?.images.length?source.images:images;
 const gallery=[...new Set([source?sourceVariant?.image:originalMatching?.image,...sellerImages,...images].filter((x):x is string=>!!x))].filter(x=>!badImages.includes(x));
 const chosenIndex=Math.min(image,Math.max(0,gallery.length-1));
 const priceCNY=sourceVariant?.price??source?.offerPrice??source?.listPrice;
 const variantPrices=(source?.variants||[]).map(v=>v.price).filter((x):x is number=>x!=null&&Number.isFinite(x));
 const minPrice=variantPrices.length?Math.min(...variantPrices):null;
 const maxPrice=variantPrices.length?Math.max(...variantPrices):null;
 const priceRange=minPrice!=null&&maxPrice!=null?(minPrice===maxPrice?dualPrice(minPrice):
  gbpOnly?(fx?formatGBP(minPrice*fx.rate)+" – "+formatGBP(maxPrice*fx.rate):"GBP price unavailable"):
  formatCNY(minPrice)+" – "+formatCNY(maxPrice)+(fx?" ≈ "+formatGBP(minPrice*fx.rate)+" – "+formatGBP(maxPrice*fx.rate):"")):null;
 const cataloguePrice=price&&price!=="View marketplace price"?price:"Price to be confirmed";
 const priceLabel=source?(gbpOnly&&!fx?cataloguePrice:source.variants.length>0&&!sourceVariant?"Option unavailable":
  activeSku&&sourceVariant?.price!=null?dualPrice(sourceVariant.price):priceRange||
  (priceCNY!=null?dualPrice(priceCNY):cataloguePrice)):
  cataloguePrice;
 const outOfStock=Boolean(source&&(source.available===false||(source.variants.length>0&&!source.variants.some(v=>v.stock===null||v.stock>0))));
 const detailImages=(source?.detailImages||[]).filter((url,i,all)=>all.indexOf(url)===i).slice(0,36);
 const skuOptions=new Map<string,Set<string>>();
 for(const variant of source?.variants||[])for(const option of variant.options){
  if(!skuOptions.has(option.name))skuOptions.set(option.name,new Set());
  skuOptions.get(option.name)?.add(option.value);
 }
 const savedProps=source?.productProps||[];
 const savedNames=new Set(savedProps.map(p=>p.name.toLowerCase()));
 const detailAttributes=[...savedProps,...[...skuOptions]
  .filter(([name])=>!savedNames.has(name.toLowerCase()))
  .map(([name,values])=>({name,value:[...values].slice(0,18).join(", ")}))].slice(0,32);
 const description=source?.descriptionText||"";
 const updateQuantity=(skuCode:string,delta:number)=>{
  const variant=source?.variants.find(v=>v.skuCode===skuCode);
  if(!variant||source?.available===false)return;
  setActiveSku(skuCode);
  setImage(0);
  setCartMessage("");
  setQuantities(previous=>{
   const current=previous[skuCode]||0;
   const next=Math.max(0,Math.min(variant.stock??999,current+delta));
   return {...previous,[skuCode]:next};
  });
 };

 async function handleCart(buyNow:boolean){
  // Catalogue-only items can still be saved to a draft cart. Live checkout
  // remains disabled; final selected SKU, price and stock require a fresh check.
  if(!marketplace){setCartMessage("This product does not have a direct marketplace link.");return;}
  if(outOfStock){setCartMessage("The seller currently lists this product as unavailable.");return;}
  const productPath=customProductPath|| (id==="linked-product"?"/find-product?url="+encodeURIComponent(marketplace):"/product/"+encodeURIComponent(id));
  const common={productId:id,productPath,title,image:gallery[chosenIndex]||product.imageUrl,marketplaceUrl:marketplace};
  let rows:CartItem[]=[];
  if(source&&source.variants.length>0){
   const chosen=selectedRows.length?selectedRows:(sourceVariant&&sourceVariant.stock!==0?[sourceVariant]:[]);
   rows=chosen.map(variant=>({
    ...common,
    key:marketplace+"::"+variant.skuCode,
    skuCode:variant.skuCode,
    variant:variant.options.map(p=>p.name+": "+p.value).join(" / ")||variant.title,
    quantity:selectedRows.length?quantities[variant.skuCode]:1,
    unitPrice:variant.price??source.offerPrice??source.listPrice,
    currency:"CNY" as const
   }));
  }else{
   if(originalVariants.length&&!originalMatching){setCartMessage("Please choose an available option.");return;}
   const variantName=[colour&&"Colour: "+colour,size&&"Size: "+size,style&&"Style: "+style,originalMatching?.label].filter(Boolean).join(" / ");
   const fallbackPrice=originalMatching?.price??product.priceGBP??(price.startsWith("£")?Number(price.slice(1).replace(/,/g,"")):null);
   rows=[{
    ...common,
    key:marketplace+"::"+(originalMatching?.id||"standard"),
    variant:variantName,
    quantity:singleQuantity,
    unitPrice:source?(source.offerPrice??source.listPrice):typeof fallbackPrice==="number"&&Number.isFinite(fallbackPrice)?fallbackPrice:null,
    currency:source?"CNY":"GBP"
   }];
  }
  if(!rows.length){setCartMessage("Please choose an available seller option.");return;}
  // Adding to the cart requires a FREE verified account; no membership or
  // payment is asked for until the buyer actually requests checkout.
  const verified=account.status==="checking"?await refreshAccount():account;
  if(verified.status!=="authenticated"){
   try{
    localStorage.setItem(PENDING_CART_KEY,JSON.stringify({
     version:1,rows,buyNow,requestedAt:Date.now()
    }));
   }catch{
    setCartMessage("Your browser did not allow us to save your selection before sign-up. Please enable browser storage and try again.");
    return;
   }
   const destination=buyNow?"/membership/activate?next="+encodeURIComponent("/cart?checkout=1"):"/cart";
   router.push("/account?next="+encodeURIComponent(destination));
   setCartMessage("Create a free account or sign in to keep this selection. No membership charge is required to add products.");
   return;
  }
  addItems(rows);
  setCartMessage(rows.length===1?"Added to your cart.":"Selected options added to your cart.");
  if(buyNow)router.push("/membership/activate?next="+encodeURIComponent("/cart?checkout=1"));
 }

 return <>
  <section className="product-layout">
   <div>
    <div className="gallery-main">
     {gallery[chosenIndex]?<img src={gallery[chosenIndex]} alt={title} referrerPolicy="no-referrer" onError={()=>{const failed=gallery[chosenIndex];setBadImages(previous=>previous.includes(failed)?previous:[...previous,failed]);}}/>:<div className="hc-image-missing">Product image currently unavailable</div>}
     <span className="gallery-count">{gallery.length?chosenIndex+1:0} / {gallery.length}</span>
    </div>
    {gallery.length>1&&<div className="thumbs">{gallery.slice(0,16).map((src,i)=><button type="button" className={i===chosenIndex?"active":""} onClick={()=>setImage(i)} key={src}><img src={src} alt={"Product view "+(i+1)} referrerPolicy="no-referrer" onError={e=>{e.currentTarget.hidden=true;}}/></button>)}</div>}
    {detailImages.length>0&&<a className="hc-gallery-details-link" href="#product-details">See seller's product photos and description ↓</a>}
   </div>
   <aside className="buy-panel">
    <p className="eyebrow">{product.category||"PRODUCT DETAILS"}</p>
    <h1>{title}</h1>
    <div className="hc-seller-row">
     <span className="supplier-title">{sellerName?"Marketplace seller: "+sellerName:"Marketplace seller"}</span>
     {marketplace&&<a className="hc-direct-link" href={marketplace} target="_blank" rel="noopener noreferrer">Direct product link <ExternalArrowIcon/></a>}
    </div>
    {!source&&product.sellerId&&<Link className="seller-link" href={"/seller/"+encodeURIComponent(product.sellerId)}>More from this seller ↗</Link>}
    <div className="product-price">{priceLabel}</div>
    {source&&cataloguePrice!=="Price to be confirmed"&&<p className="sc-source-subprice">Original catalogue price: {cataloguePrice} · Previously listed, excluding delivery.</p>}
    {!source&&<p className="sc-source-subprice" role="note">Previously listed product price. Our sourcing partner's detailed options are being updated behind the scenes. The price is indicative and excludes delivery.</p>}
    {source&&<p className="sc-source-subprice">{gbpOnly?"Supplier estimates in GBP · Shipping separate":fx?"Supplier prices · Approximate GBP equivalents · Shipping separate":"Supplier prices · CNY · Shipping separate"}</p>}
    {source?.snapshotSavedAt&&<p className="sc-source-subprice" role="note">Supplier details dated {new Date(source.snapshotSavedAt).toLocaleDateString("en-GB")}. Prices and availability can change.</p>}
    {source&&source.variants.length===0&&<p className="hc-source-unverified" role="status">Supplier options are unavailable for this listing. You can still add the item to your cart.</p>}
    {source&&source.variants.length>0?<div className="sc-supplier-variant-area">
      <div className="sc-sku-heading"><strong>Choose your options</strong><span>{source.variants.length} seller variants · Select quantities</span></div>
      <div className="sc-sku-list">
       {visibleSkus.map(v=>{
        const quantity=quantities[v.skuCode]||0;
        const optionImage=v.image||source.images[0]||images[0];
        const unavailable=source.available===false||v.stock===0;
        return <div key={v.skuCode} className={"sc-sku-row"+(v.skuCode===sourceVariant?.skuCode?" active":"")}>
         <button type="button" className="sc-sku-preview" onClick={()=>{setActiveSku(v.skuCode);setImage(0);}} aria-pressed={v.skuCode===sourceVariant?.skuCode} aria-label={"View "+v.title}>
          {optionImage?<img src={optionImage} alt={v.title} loading="lazy" referrerPolicy="no-referrer" onError={e=>{e.currentTarget.hidden=true;}}/>:<span className="sc-sku-image-fallback">No photo</span>}
          <span className="sc-sku-name">{v.options.map(p=>p.value).join(" / ")||v.title}</span>
         </button>
         <div className="sc-sku-numbers"><strong>{v.price!=null?dualPrice(v.price):"Price on request"}</strong><span>{v.stock==null?"Stock unknown":v.stock===0?"Out of stock":v.stock+" in stock"}</span></div>
         <div className="sc-sku-qty" aria-label={"Quantity of "+v.title}>
          <button type="button" onClick={()=>updateQuantity(v.skuCode,-1)} disabled={quantity===0} aria-label={"Remove one "+v.title}>−</button>
          <output aria-label={"Quantity "+quantity}>{quantity}</output>
          <button type="button" onClick={()=>updateQuantity(v.skuCode,1)} disabled={unavailable||(v.stock!=null&&quantity>=v.stock)} aria-label={"Add one "+v.title}>+</button>
         </div>
        </div>;
       })}
      </div>
      {source.variants.length>8&&<button type="button" className="sc-sku-show-more" onClick={()=>setShowAllSkus(value=>!value)}>{showAllSkus?"Show fewer options":"Show all "+source.variants.length+" options"} <span aria-hidden="true">{showAllSkus?"↑":"↓"}</span></button>}
      {selectedRows.length>0&&<div className="sc-sku-summary"><div><strong>{totalUnits} selected</strong><span>{totalUnits<minOrder?"Seller minimum: "+minOrder+" units":"Seller minimum met"}</span></div><div><strong>{hasUnknownPrice?"Price on request":dualPrice(subtotal)}</strong><span>Product subtotal</span></div></div>}
    </div>:<>
      <Selector label="COLOUR" value={colour} items={colours} set={value=>{setColour(value);setCartMessage("");}}/>
      <Selector label="SIZE" value={size} items={sizes} set={value=>{setSize(value);setCartMessage("");}}/>
      <Selector label="STYLE" value={style} items={styles} set={value=>{setStyle(value);setCartMessage("");}}/>
      <div className="hc-simple-quantity"><span>Quantity</span><div className="sc-sku-qty"><button type="button" onClick={()=>setSingleQuantity(Math.max(1,singleQuantity-1))} disabled={singleQuantity<=1}>−</button><output>{singleQuantity}</output><button type="button" onClick={()=>setSingleQuantity(Math.min(999,singleQuantity+1))}>+</button></div></div>
    </>}
    <div className="hc-buy-actions">
     <button type="button" className="hc-add-cart-button" onClick={()=>handleCart(false)} disabled={outOfStock}>Add to cart</button>
     <button type="button" className="hc-buy-now-button" onClick={()=>handleCart(true)} disabled={outOfStock}>Buy now</button>
    </div>
    {cartMessage&&<p className="hc-cart-feedback" role="status">{cartMessage} {cartMessage.includes("Added")&&<Link href="/cart">View cart →</Link>}</p>}
    <p className="hc-checkout-note">Adding to cart requires a free account. Membership is £9.99/month when you buy. Online checkout is currently unavailable.</p>
    {source&&<div className="sc-supplier-facts">
      {source.moq!=null&&<p><strong>Minimum order:</strong> {source.moq}</p>}
      {source.chinaDomesticFreight!=null&&<p><strong>Shipping within China:</strong> {dualPrice(source.chinaDomesticFreight)}</p>}
      {source.available===false&&<p className="sc-supplier-unavailable">This seller listing is currently unavailable.</p>}
      <p><strong>International delivery:</strong> Quoted and paid separately after your items reach the warehouse.</p>
    </div>}
    <a className="hc-product-details-anchor" href="#product-details">View product details ↓</a>
   </aside>
  </section>
  <section id="product-details" className="hc-product-detail-panel">
   <div className="hc-product-detail-title"><p className="eyebrow">ABOUT THIS PRODUCT</p><h2>Product details</h2><p>Product information and images supplied by the marketplace seller, where available.</p></div>
   <div className="hc-product-detail-grid">
    <div className="hc-seller-description">
     <h3>Seller description</h3>
     {description?<><p className="hc-description-text">{showFullDescription?description:description.slice(0,4200)}</p>{description.length>4200&&<button type="button" className="hc-show-description" onClick={()=>setShowFullDescription(v=>!v)}>{showFullDescription?"Show less":"Read full description"} ↓</button>}</>:
      <p className="hc-description-empty">The seller has not provided additional written details for this listing.{marketplace&&<> <a href={marketplace} target="_blank" rel="noopener noreferrer">See the original listing ↗</a></>}</p>}
     {detailImages.length>0&&<div className="hc-detail-photos"><h3>Seller's detailed photos</h3>{detailImages.map((src,index)=><img key={src} src={src} alt={"Seller product detail "+(index+1)} loading="lazy" referrerPolicy="no-referrer"/>)}</div>}
    </div>
    <aside className="hc-product-specs">
     <h3>Specifications & seller information</h3>
     <dl>
      {sellerName&&<><dt>Seller</dt><dd>{sellerName}</dd></>}
      <dt>Marketplace</dt><dd>{marketplace?new URL(marketplace).hostname.replace(/^www\./,""):"Not provided"}</dd>
      {source?.spuCode&&<><dt>Product reference</dt><dd>{source.spuCode}</dd></>}
      {source?.moq!=null&&<><dt>Minimum order</dt><dd>{source.moq} units</dd></>}
      {source?.variants.length? <><dt>Seller options</dt><dd>{source.variants.length} variants</dd></>:null}
      {product.weight&&<><dt>Weight</dt><dd>{product.weight}</dd></>}
      {product.dimensions&&<><dt>Dimensions</dt><dd>{product.dimensions}</dd></>}
      {detailAttributes.map(attr=><div className="hc-spec-pair" key={attr.name}><dt>{attr.name}</dt><dd>{attr.value}</dd></div>)}
     </dl>
     {marketplace&&<a className="hc-detail-source-button" href={marketplace} target="_blank" rel="noopener noreferrer">View original product <ExternalArrowIcon/></a>}
     <small>Details and availability can change at the source marketplace.</small>
    </aside>
   </div>
  </section>
  <div className="mobile-buy"><span><b>{priceLabel}</b><small>Delivery calculated separately</small></span><Link href="/cart">View cart →</Link></div>
 </>;
}
function Selector({label,value,items,set}:{label:string;value?:string;items:string[];set:(v:string)=>void}){
 if(!items.length)return null;
 return <fieldset className="selector"><legend>{label}<b>{value}</b></legend><div>{items.map(item=><button type="button" key={item} className={item===value?"selected":""} onClick={()=>set(item)}>{item}</button>)}</div></fieldset>;
}
