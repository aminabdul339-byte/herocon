import Link from "next/link";
import {notFound} from "next/navigation";
import type {Metadata} from "next";
import Header from "@/components/Header";
import {getProducts} from "@/lib/catalogue-server";
import {cleanTitle,imagesFor,productId,productPrice,variantsFor} from "@/lib/catalogue";
import {findPersonalProduct} from "@/lib/personal-shop";
import {getPersonalShopRates} from "@/lib/personal-shop-fx";
import {shopPrice} from "@/lib/shop-price";
import {getSavedPersonalSource} from "@/lib/personal-shop-enrichment";
import {marketplaceIdentity} from "@/lib/catalogue-identity";
import type {Product} from "@/lib/types";
import type {BuckydropProduct} from "@/lib/buckydrop";
import "./editorial.css";

export const dynamic="force-dynamic";
export const runtime="nodejs";
export const metadata:Metadata={title:"Editorial product page | Design preview",robots:{index:false,follow:false}};

const safeImage=(value:unknown):value is string=>
 typeof value==="string"&&(value.startsWith("https://")||value.startsWith("/shop-for-yourself-images/"));
const unique=(arr:(string|null|undefined)[])=>[...new Set(arr.filter(safeImage))];
type Params={params:Promise<{id:string}>};
export default async function EditorialProductPreview({params}:Params){
 const {id}=await params;
 // This branch does not change the public product pages or production assets.
 // Source content is real data already present in Herocon or previously saved
 // authorised supplier snapshots. Opening this preview never makes a paid lookup.
 const personal=findPersonalProduct(id);
 let product:Product;
 let price:string;
 let existingPath:string;
 let section:string;
 if(personal){
  const rates=await getPersonalShopRates();
  price=shopPrice(personal,rates);
  product={
   canonicalId:"personal:"+personal.id,doppelProductId:personal.id,
   title:personal.name,originalTitle:personal.name,category:personal.category,
   imageUrl:personal.imageUrl,images:[personal.imageUrl],
   originalMarketplaceUrl:personal.originalUrl,price
  };
  existingPath="/shop-for-yourself/"+encodeURIComponent(id);
  section="Shop for Yourself";
 }else{
  const all=await getProducts();
  const found=all.find(p=>productId(p)===id||p.canonicalId===id);
  if(!found)notFound();
  product=found;
  price=productPrice(product);
  existingPath="/product/"+encodeURIComponent(id);
  section="Marketplace Catalogue";
 }
 const source:BuckydropProduct|null=product.originalMarketplaceUrl
  ?await getSavedPersonalSource(product.originalMarketplaceUrl)
  :null;
 const title=personal?personal.name:cleanTitle(product);
 const images=unique([
  ...imagesFor(product),
  ...(source?.images||[]),
  ...(source?.variants||[]).map(v=>v.image),
  ...(product.detailImages||[])
 ]).slice(0,12);
 const gallery=images.length?images:unique([product.imageUrl]);
 const info=marketplaceIdentity(product.originalMarketplaceUrl);
 const seller=source?.sellerName||product.sellerName||null;
 const sourceOptions=source?.variants||[];
 const simpleOptions=variantsFor(product);
 const colours=sourceOptions.length
   ?[...new Set(sourceOptions.flatMap(v=>v.options.filter(o=>/colou?r|color classification/i.test(o.name)).map(o=>o.value)))]
   :[...new Set([...(product.colours||[]),...simpleOptions.map(v=>v.colour).filter((v):v is string=>Boolean(v))])];
 const sizes=sourceOptions.length
   ?[...new Set(sourceOptions.flatMap(v=>v.options.filter(o=>/size/i.test(o.name)).map(o=>o.value)))]
   :[...new Set([...(product.sizes||[]),...simpleOptions.map(v=>v.size).filter((v):v is string=>Boolean(v))])];
 const specs=source?.productProps?.length?source.productProps:product.sourceSpecs||[];
 const desc=source?.descriptionText||product.descriptionText||"A detailed seller description has not yet been supplied for this listing. View the original marketplace page for additional information.";
 const sourceLink=info?.url||"";
 return <main id="hc-real-preview" className="hc-real-preview">
  <Header/>
  <div className="erp-notice"><strong>HEROCON PRODUCT PAGE · DESIGN PREVIEW</strong><span>Real catalogue product · Visual preview only · Public website unchanged</span></div>
  <div className="erp-shell">
   <nav className="erp-breadcrumb" aria-label="Breadcrumb">
    <Link href="/">Herocon</Link><span>/</span>
    <Link href={personal?"/shop-for-yourself":"/search"}>{section}</Link><span>/</span>
    <span>{product.category||"Products"}</span><span>/</span><b>Product details</b>
   </nav>
   <div className="erp-layout">
    <section className={"erp-gallery"+(gallery.length===1?" erp-one":"")} aria-label="Real product photos">
     {gallery.slice(0,8).map((src,i)=>
      <figure key={src} className="erp-image">
       <img src={src} alt={title+" · photograph "+(i+1)} loading={i===0?"eager":"lazy"} decoding="async" referrerPolicy="no-referrer"/>
       <figcaption>IMAGE {String(i+1).padStart(2,"0")}</figcaption>
      </figure>
     )}
     {gallery.length===0&&<div className="erp-image erp-empty-photo">Supplier photographs not yet available</div>}
    </section>
    <aside className="erp-aside">
     <p className="erp-eyebrow">THE HEROCON EDIT <span> / </span> {product.category||"DISCOVER"}</p>
     <h1>{title}</h1>
     <div className="erp-price">{price}<small>Previously recorded marketplace reference price · delivery not included</small></div>
     <div className="erp-sep"/>
     {colours.length>0?<div className="erp-choice">
      <label htmlFor="erp-color">COLOUR <span>{colours.length} recorded option{colours.length===1?"":"s"}</span></label>
      <select id="erp-color" defaultValue=""><option value="">Select a recorded colour</option>{colours.map(c=><option key={c} value={c}>{c}</option>)}</select>
     </div>:null}
     {sizes.length>0?<div className="erp-choice">
      <label htmlFor="erp-size">SIZE <span>Supplier-listed sizes</span></label>
      <select id="erp-size" defaultValue=""><option value="">Select a recorded size</option>{sizes.map(s=><option key={s} value={s}>{s}</option>)}</select>
     </div>:null}
     {!colours.length&&!sizes.length&&<p className="erp-no-options">Colour and size choices have not yet been confirmed by the supplier.</p>}
     {sourceOptions.length>0&&<p className="erp-source-count">{sourceOptions.length} saved SKU {sourceOptions.length===1?"option":"options"} available in the current product detail page.</p>}
     <div className="erp-actions">
      <span className="erp-disabled" aria-disabled="true">ADD TO CART <em>PREVIEW ONLY</em></span>
      {sourceLink?<a href={sourceLink} target="_blank" rel="noopener noreferrer nofollow">VIEW ORIGINAL MARKETPLACE <span>↗</span></a>:<span className="erp-disabled">Marketplace link unavailable</span>}
     </div>
     <p className="erp-help">Real product data, photographs and supplier options only. This design preview cannot place orders or charge your account.</p>
     <div className="erp-facts">
      <details open><summary>DESCRIPTION <span>+</span></summary><div className="erp-detail">{desc}</div></details>
      <details><summary>PRODUCT DETAILS <span>+</span></summary><div className="erp-detail">
       <dl>
       <dt>Marketplace</dt><dd>{info?.marketplace||"Not recorded"}</dd>
       <dt>Seller</dt><dd>{seller||"Not recorded"}</dd>
       <dt>Marketplace product ID</dt><dd>{info?.productId||"Not recorded"}</dd>
       {source?.snapshotSavedAt&&<><dt>Supplier details saved</dt><dd>{new Date(source.snapshotSavedAt).toLocaleDateString("en-GB")}</dd></>}
       {specs.slice(0,18).map((p,i)=><div key={p.name+i}><dt>{p.name}</dt><dd>{p.value}</dd></div>)}
       </dl>
      </div></details>
      <details><summary>SOURCING & DELIVERY <span>+</span></summary><div className="erp-detail">Original marketplace prices are references and may change. Shipping, duties, taxes and service fees are not included. Stock and authenticity are not independently verified by Herocon.</div></details>
     </div>
     <div className="erp-benefits"><span>◇ &nbsp; Original marketplace source</span><span>◇ &nbsp; Pricing and availability subject to confirmation</span></div>
     <Link className="erp-existing" href={existingPath}>Compare with current product page ↗</Link>
    </aside>
   </div>
   <footer className="erp-under"><strong>Considered details. Clear sourcing.</strong><span>Only actual marketplace photographs and recorded product specifications are used in this preview.</span></footer>
  </div>
 </main>;
}
