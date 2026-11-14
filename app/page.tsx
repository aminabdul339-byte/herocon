import Link from "next/link";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import {getProducts} from "@/lib/catalogue-server";
const categories=["Tops","Shoes","Bags","Outerwear","Bottoms","Jewelry","Other"];
export default async function Home(){
 const products=await getProducts();
 const featured=products.filter(p=>p.imageUrl).slice(0,12);
 const tiles=categories.map(category=>({category,product:products.find(p=>p.category===category&&p.imageUrl)})).filter(x=>x.product).slice(0,4);
 return <main><Header/>
  <section className="hc-home-hero"><div><p className="eyebrow">HEROCON · ORIGINAL MARKETPLACE DISCOVERY</p><h1>Find it.<br/>Source it.<br/><em>Make it yours.</em></h1><p>Discover fashion and accessories from original Chinese marketplaces. Browse the collection, explore individual product pages and shop using the original seller links.</p><form action="/search" className="hc-search"><input name="q" aria-label="Search products" placeholder="Search the collection…"/><button type="submit">Search →</button></form></div><aside><p className="eyebrow">THE CURRENT EDIT</p><strong>{products.length.toLocaleString()} products</strong><p>Our current collection, with direct links to 1688, Weidian and Taobao. More products are on the way.</p><Link className="hc-view-all" href="/search">Explore all products →</Link></aside></section>
  <section className="hc-home-section"><p className="eyebrow">EXPLORE BY CATEGORY</p><h2>Find your style.</h2><div className="hc-category-tiles">{tiles.map(({category,product})=><Link key={category} className="hc-category-tile" href={`/search?category=${encodeURIComponent(category)}`}><img src={product!.imageUrl} alt={category}/><span>{category} ↗</span></Link>)}</div></section>
  <section className="hc-home-section hc-home-section-dark"><div className="section-head"><div><p className="eyebrow">DISCOVER THE EDIT</p><h2>Fresh finds.</h2></div><Link className="hc-view-all" href="/search">VIEW ALL PRODUCTS →</Link></div><div className="hc-store-grid">{featured.map(p=><ProductCard key={p.doppelProductId} product={p}/>)}</div></section>
  <section className="hc-home-section"><div className="section-head"><div><p className="eyebrow">EXPLORE MORE</p><h2>The full collection.</h2></div><Link href="/search" className="hc-view-all">SHOP ALL {products.length.toLocaleString()} PRODUCTS →</Link></div><div className="hc-store-grid">{products.slice(12,36).map(p=><ProductCard key={p.doppelProductId} product={p}/>)}</div></section>
 </main>;
}