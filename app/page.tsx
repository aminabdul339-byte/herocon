import Link from "next/link";
import Header from "@/components/Header";
import HomepageMembership from "@/components/HomepageMembership";
import {freeBusinessEdit} from "@/lib/business-catalogue-edit";
import {featuredPreviewIds} from "@/lib/catalogue-access-model";
import {productId} from "@/lib/catalogue";
import AtelierHero from "@/components/AtelierHero";
import ProductCard from "@/components/ProductCard";
import {getProducts} from "@/lib/catalogue-server";
import {selectDiscoveryEditProducts} from "@/lib/catalogue-priority";
import type {Metadata} from "next";
import "./discovery-studio.css";

export const revalidate=300;

export const metadata:Metadata={
  title:"Herocon — Your link to China",
  description:"Explore original listings from Chinese marketplaces. Shop for yourself or source for your business with Herocon."
};

function Arrow({up=false}:{up?:boolean}){
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" focusable="false">{up?<path d="M5 19 19 5M8 5h11v11"/>:<path d="M4 12h16m-7-7 7 7-7 7"/>}</svg>;
}

export default async function Home(){
  const all=await getProducts();
  const products=[...new Map([...freeBusinessEdit(all),...all.filter(p=>featuredPreviewIds.some(id=>id===productId(p)))].map(p=>[productId(p),p])).values()];
  // Keep the existing first three cards; resolve the founder-selected dress independently of the default shoe slot.
  const defaults=selectDiscoveryEditProducts(products);
  const bookends=all.find(p=>productId(p)==="4QucBqTfsk76WbDuGGzyBA"&&p.imageUrl&&p.originalMarketplaceUrl);
  const dress=all.find(p=>productId(p)==="8t3fo9eRc1lLdPqNSasQ2w"&&p.imageUrl&&p.originalMarketplaceUrl);
  const featured=[...defaults.slice(0,3).map((p,i)=>i===1&&bookends?bookends:p),...(dress?[dress]:defaults.slice(3,4))];
  const editorialNames:Readonly<Record<string,string>>={
    "4QucBqTfsk76WbDuGGzyBA":"Simple Modern Abstract Sculpture Character Bookends",
    "8t3fo9eRc1lLdPqNSasQ2w":"Bodycon Square-Neck Dress",
  };
  return <main className="hm-home">
    <Header/>
    <AtelierHero products={products}/>

    <section className="hm-featured hm-shell" aria-labelledby="hm-featured-title">
      <div className="hm-featured-heading">
        <div><h2 id="hm-featured-title">Explore the catalogue</h2><p className="hm-featured-subtitle">A selection of products from our marketplace directory.</p></div>
        <Link className="hm-featured-view-all" href="/search">Explore all products <Arrow up/></Link>
      </div>
      {featured.length>0
        ? <div className="hm-featured-grid hc-premium-featured-grid">{featured.slice(0,4).map((product,i)=><ProductCard key={product.canonicalId||product.doppelProductId||i} product={product} eager={i<2} titleOverride={editorialNames[product.doppelProductId||""]}/>)}</div>
        : <div className="hm-featured-empty"><p>Our next edit is on its way.</p><Link href="/search">Browse all products <Arrow up/></Link></div>}
    </section>

    <div className="hm-bottom hm-shell">
      <p>Found something elsewhere? <span>Bring the original product link to Herocon.</span></p>
      <div><Link href="/find-product">Paste a product link <Arrow up/></Link></div>
    </div>
    <HomepageMembership/>
    <p className="hm-disclaimer hm-shell">Herocon helps you discover products and original sources. Purchases are currently handled by external marketplaces or buying agents.</p>
  </main>;
}
