import Link from "next/link";
import {Suspense} from "react";
import {notFound} from "next/navigation";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import ProductExperience from "@/components/ProductExperience";
import {cleanTitle,imagesFor,productId,productPrice,related} from "@/lib/catalogue";
import {getProducts} from "@/lib/catalogue-server";
import {getSavedBuckydropProduct} from "@/lib/buckydrop-cache";
import {BuckydropError} from "@/lib/buckydrop";
import {getReferenceCnyGbpRate} from "@/lib/fx-reference";
import type {Product} from "@/lib/types";

const LIVE_LOOKUP=process.env.BUCKYDROP_ENABLE_PRODUCT_LOOKUP==="true"
 && process.env.BUCKYDROP_ENV==="live";

export default async function ProductPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const products=await getProducts();
 const found=products.find(x=>productId(x)===id||x.canonicalId===id);
 if(!found)notFound();
 const product={...found,originalTitle:found.originalTitle||found.title};
 const more=products.filter(x=>product.sellerId&&x.sellerId===product.sellerId&&productId(x)!==id).slice(0,8);
 const similar=related(products,product,8);
 const common={
  product,
  id,
  title:cleanTitle(product),
  images:imagesFor(product),
  price:productPrice(product)
 };
 return <main>
  <Header/>
  <div className="crumbs"><Link href="/">Home</Link><span>/</span><span>{product.category||"Discovery"}</span></div>
  <Suspense key={id} fallback={<ProductLoadingSkeleton/>}>
   <EnrichedCatalogueProduct {...common}/>
  </Suspense>
  {product.sellerId&&<Link className="seller-strip" href={"/seller/"+encodeURIComponent(product.sellerId)}><span><small>SELLER</small><b>{product.sellerName}</b></span><span>Explore all products →</span></Link>}
  {more.length>0&&<ProductSection eyebrow="THE SELLER EDIT" title={"More from "+product.sellerName+"."} products={more}/>}
  <ProductSection eyebrow="CHOSEN FOR YOU" title="You may also like." products={similar} alt/>
 </main>;
}

type CatalogueProps={product:Product;id:string;title:string;images:string[];price:string};
async function EnrichedCatalogueProduct(props:CatalogueProps){
 if(!LIVE_LOOKUP||!props.product.originalMarketplaceUrl){
  return <ProductExperience {...props} buckydropEnabled={false} sourceLookupFailed/>;
 }
 // Product pages read our permanent snapshot ONLY. They never trigger a new
 // billable supplier lookup from automatic rendering or link prefetch.
 let seller:Awaited<ReturnType<typeof getSavedBuckydropProduct>>=null;
 try{seller=await getSavedBuckydropProduct(props.product.originalMarketplaceUrl);}
 catch(err){
  console.warn("[herocon] Saved supplier details unavailable",{
   productId:props.id,
   code:err instanceof BuckydropError?err.code:"UNKNOWN"
  });
 }
 const fx=seller?await getReferenceCnyGbpRate().catch(()=>undefined):undefined;
 return <ProductExperience
  key={props.id}
  {...props}
  buckydropEnabled
  sourceLookupFailed={!seller}
  initialSource={seller||undefined}
  initialFx={fx}
 />;
}

function ProductLoadingSkeleton(){
 return <section className="product-layout hc-product-loading" aria-busy="true" aria-label="Loading seller product details">
  <div>
   <div className="gallery-main hc-skeleton-gallery"><span className="hc-skeleton-spinner" aria-hidden="true"/><p>Loading product photographs…</p></div>
   <div className="hc-skeleton-thumbs">
    {Array.from({length:5},(_,i)=><div className="hc-skeleton-block" key={i}/>)}
   </div>
  </div>
  <aside className="buy-panel hc-skeleton-side">
   <div className="hc-skeleton-block hc-skeleton-small"/>
   <div className="hc-skeleton-block hc-skeleton-title"/>
   <div className="hc-skeleton-block hc-skeleton-title-short"/>
   <div className="hc-skeleton-block hc-skeleton-price"/>
   <p role="status">Fetching the latest seller photos, colours, sizes and prices…</p>
   {Array.from({length:3},(_,i)=><div className="hc-skeleton-block hc-skeleton-variant" key={i}/>)}
  </aside>
 </section>;
}
function ProductSection({eyebrow,title,products,alt=false}:{eyebrow:string;title:string;products:Product[];alt?:boolean}){
 return <section className={"section "+(alt?"alt":"")}>
  <header className="section-head"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></header>
  <div className="catalogue-grid">{products.map((product,i)=><ProductCard key={product.canonicalId||i} product={product}/>)}</div>
 </section>;
}