import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import ProductExperience from "@/components/ProductExperience";
import products from "@/data/shop-for-yourself.json";
import type {Product} from "@/lib/types";
import type {BuckydropProduct} from "@/lib/buckydrop";
import {getSavedBuckydropProduct} from "@/lib/buckydrop-cache";
import {getReferenceCnyGbpRate,type FxRate} from "@/lib/fx-reference";
import "../shop-for-yourself.css";

// Read-only detail pages. Never request paid supplier lookups when browsing.
export const dynamic="force-dynamic";

type ProductParams={params:Promise<{id:string}>};
const priceText=(amount:number|null)=>amount===null?"Price on request":"£"+amount.toFixed(2);

export async function generateMetadata({params}:ProductParams):Promise<Metadata>{
 const {id}=await params;
 const item=products.find(p=>p.id===id);
 if(!item)return {title:"Product not found"};
 return {title:item.name+" | Shop for Yourself",description:"Explore "+item.name+" with an original marketplace link, GBP reference price and Herocon shopping notes."};
}

export default async function PersonalShopProductPage({params}:ProductParams){
 const {id}=await params;
 const item=products.find(p=>p.id===id);
 if(!item)notFound();
 const localPhoto="/shop-for-yourself-images/"+item.id+".webp";
 const product:Product={
  canonicalId:"personal:"+item.id,
  doppelProductId:item.id,
  title:item.name,
  originalTitle:item.name,
  category:item.category,
  priceGBP:item.priceGBP??undefined,
  price:priceText(item.priceGBP),
  imageUrl:localPhoto,
  originalMarketplaceUrl:item.originalUrl,
  sourceMarketplace:new URL(item.originalUrl).hostname
 };
 let saved:BuckydropProduct|null=null;
 let fx:FxRate|undefined;
 // The BuckyDrop import will eventually populate permanent snapshots.
 // This reads any existing snapshot only; it NEVER invokes the billable API.
 try {saved=await getSavedBuckydropProduct(item.originalUrl);}
 catch {saved=null;}
 if(saved){try{fx=await getReferenceCnyGbpRate();}catch{fx=undefined;}}
 const related=products.filter(p=>p.category===item.category&&p.id!==item.id).slice(0,4);
 return <main className="hc-self">
  <Header/>
  <div className="hc-self-product-top">
   <nav aria-label="Breadcrumb"><Link href="/shop-for-yourself">Shop for Yourself</Link><span>/</span><span>{item.category}</span></nav>
   <a className="hc-self-product-shop-link" href={item.shopUrl} target="_blank" rel="noopener noreferrer nofollow sponsored">Shop using an agent ↗</a>
  </div>
  <ProductExperience
   key={item.id}
   product={product}
   id={item.id}
   title={item.name}
   images={[localPhoto]}
   price={priceText(item.priceGBP)}
   initialSource={saved||undefined}
   initialFx={fx}
   buckydropEnabled={Boolean(saved)}
   sourceLookupFailed={!saved}
   gbpOnly
   customProductPath={"/shop-for-yourself/"+encodeURIComponent(item.id)}
  />
  <section className="hc-self-item-notes" aria-labelledby="hc-self-notes-title">
   <div><p className="hc-self-eyebrow">INSIDER NOTES</p><h2 id="hc-self-notes-title">Notes from <em>Herocon.</em></h2></div>
   <div>{item.itemTip?<p className="hc-self-note-copy">{item.itemTip}</p>:<p>No additional product tips are available yet.</p>}
    <small>Curated product guidance. Supplier claims, product quality and authenticity have not been independently verified by Herocon.</small>
    {item.additionalLinks.length>0&&<div className="hc-self-extra-listings">{item.additionalLinks.map((link,i)=><a key={link.url+i} href={link.url} target="_blank" rel="noopener noreferrer nofollow sponsored">Additional purchasing option {i+1} ↗</a>)}</div>}
   </div>
  </section>
  {related.length>0&&<section className="hc-self-product-related">
   <p className="hc-self-eyebrow">MORE TO EXPLORE</p><h2>More in {item.category.toLowerCase()}.</h2>
   <div className="hc-self-product-related-grid">{related.map(p=><Link className="hc-self-product-related-card" key={p.id} href={"/shop-for-yourself/"+encodeURIComponent(p.id)}>
    <img src={"/shop-for-yourself-images/"+p.id+".webp"} alt={p.name} width={330} height={330} loading="lazy"/>
    <span>{p.name} · {priceText(p.priceGBP)}</span>
   </Link>)}</div>
  </section>}
 </main>;
}
