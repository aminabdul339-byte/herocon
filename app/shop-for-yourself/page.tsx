import type {Metadata} from "next";
import Header from "@/components/Header";
import {ExternalArrowIcon} from "@/components/ShopIcons";
import ShopForYourself from "@/components/ShopForYourself";
import products from "@/data/shop-for-yourself.json";
import "./shop-for-yourself.css";

export const metadata:Metadata={
 title:"Shop for Yourself",
 description:"Discover clothing, shoes and accessories with direct links to original Chinese marketplace listings, GBP reference prices and product notes."
};

export default function ShopForYourselfPage(){
 return <main className="hc-self">
  <Header/>
  <section className="hc-self-hero" aria-labelledby="hc-self-hero-title">
   <div className="hc-self-wrap hc-self-hero-grid">
    <div className="hc-self-hero-copy">
     <p className="hc-self-eyebrow"><span className="hc-self-eyebrow-dot"/>THE PERSONAL EDIT <span className="hc-self-edition">HEROCON / 2026</span></p>
     <h1 id="hc-self-hero-title">Shop for<br/><em>yourself.</em></h1>
     <p className="hc-self-hero-lead">A little something for you. Discover clothes, footwear and accessories with verified original marketplace links and carefully organised finds.</p>
     <div className="hc-self-hero-actions"><a className="hc-self-primary" href="#browse-finds">Browse the edit <ExternalArrowIcon/></a></div>
    </div>
    <div className="hc-self-hero-image">
     <img src="https://cdn.shopify.com/s/files/1/1127/4915/0598/files/herocon-clothing-card.webp?v=1794862181" alt="Curated clothing displayed in a stylish neutral setting" width={720} height={820} fetchPriority="high" />
     <div className="hc-self-hero-image-caption"><span>THE EVERYDAY EDIT</span><span>HEROCON / 01</span></div>
    </div>
   </div>
  </section>
  <ShopForYourself products={products}/>
  <section className="hc-self-note">
   <div className="hc-self-wrap hc-self-note-inner"><div><p className="hc-self-eyebrow">SHOP SMARTER</p><h2>Shop with <em>confidence.</em></h2></div><div><p>Every product in this edit has a direct link to a recognised Chinese marketplace listing. We verify the link format and keep the original destination visible so you can check the product yourself.</p><p>Supplier identity, authenticity, quality, safety, stock and fulfilment have not been independently audited by Herocon. Prices are estimates in GBP and exclude delivery, agent fees and taxes.</p></div></div>
  </section>
 </main>;
}