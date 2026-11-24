import Link from "next/link";
import Header from "@/components/Header";
import AtelierHero from "@/components/AtelierHero";
import ProductCard from "@/components/ProductCard";
import {getProducts} from "@/lib/catalogue-server";
import {prioritizeSavedPartnerProducts,attachSavedPartnerImages,selectDiscoveryEditProducts} from "@/lib/catalogue-priority";
import type {Metadata} from "next";
import "./discovery-studio.css";

export const dynamic="force-dynamic";

export const metadata:Metadata={
  title:"Herocon — Discover Products. Explore the Source.",
  description:"Find fashion, accessories and original product listings from 1688, Taobao and Weidian. Discover for yourself or explore sourcing for your business."
};

function Arrow({up=false}:{up?:boolean}){
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" focusable="false">{up?<path d="M5 19 19 5M8 5h11v11"/>:<path d="M4 12h16m-7-7 7 7-7 7"/>}</svg>;
}

export default async function Home(){
  const products=await prioritizeSavedPartnerProducts(await getProducts());
  // Two deliberately curated swaps for the homepage Discovery Edit.
  // Select from actual existing catalogue records; never invent listing data.
  // Keep the wig and nail entries picked by the existing editorial selection.
  const featuredDefaults=selectDiscoveryEditProducts(products);
  const featuredIds:Readonly<Record<number,string>>={
    1:"4QucBqTfsk76WbDuGGzyBA", // Sculpture bookends replace wedding ornaments
    3:"zmcFLXhlnDI9AyHB3zO8LA", // Summer lace dress replaces winter slippers
  };
  const featuredSelection=featuredDefaults.map((product,index)=>{
    const replacement=featuredIds[index];
    return replacement
      ? products.find(candidate=>candidate.doppelProductId===replacement&&candidate.imageUrl&&candidate.originalMarketplaceUrl)||product
      : product;
  });
  const featured=await attachSavedPartnerImages(featuredSelection);
  const editorialNames:Readonly<Record<string,string>>={
    "4QucBqTfsk76WbDuGGzyBA":"Simple Modern Abstract Sculpture Character Bookends",
    "zmcFLXhlnDI9AyHB3zO8LA":"INS European and American-style 2023 Summer Lace Dress",
  };
  return <main className="hm-home">
    <Header/>
    <AtelierHero products={products}/>

    <section className="hm-featured hm-shell" aria-labelledby="hm-featured-title">
      <div className="hm-featured-heading">
        <div><span className="hm-featured-eyebrow">THE DISCOVERY EDIT</span><h2 id="hm-featured-title">Currently <em>catching our eye.</em></h2></div>
        <Link className="hm-featured-view-all" href="/search">Explore all products <Arrow up/></Link>
      </div>
      {featured.length>0
        ? <div className="hm-featured-grid hc-premium-featured-grid">{featured.slice(0,4).map((product,i)=><ProductCard key={product.canonicalId||product.doppelProductId||i} product={product} eager={i<2} titleOverride={editorialNames[product.doppelProductId||""]}/>)}</div>
        : <div className="hm-featured-empty"><p>Our next edit is on its way.</p><Link href="/search">Browse all products <Arrow up/></Link></div>}
    </section>

    <div className="hm-bottom hm-shell">
      <p>Real finds. Original marketplace links. <span>One place to discover more.</span></p>
      <div><Link href="/search">Search all products <Arrow up/></Link></div>
    </div>
    <p className="hm-disclaimer hm-shell">Herocon helps you discover products and original sources. Purchases are currently handled by external marketplaces or buying agents.</p>
  </main>;
}
