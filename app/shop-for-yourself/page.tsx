import type {Metadata} from "next";
import Header from "@/components/Header";
import ShopForYourself from "@/components/ShopForYourself";
import products from "@/data/shop-for-yourself.json";
import "./shop-for-yourself.css";

export const metadata:Metadata={
 title:"Shop for Yourself",
 description:"Explore shoes, clothing, outerwear and accessories from a linked third-party shopping spreadsheet. Browse names, reference prices and external listings."
};

export default function ShopForYourselfPage(){
 return <main className="hc-self">
  <Header/>
  <section className="hc-self-hero" aria-labelledby="hc-self-hero-title">
   <div className="hc-self-wrap hc-self-hero-grid">
    <div className="hc-self-hero-copy">
     <p className="hc-self-eyebrow"><span className="hc-self-eyebrow-dot"/>THE PERSONAL EDIT <span className="hc-self-edition">HEROCON / 2026</span></p>
     <h1 id="hc-self-hero-title">Shop for<br/><em>yourself.</em></h1>
     <p className="hc-self-hero-lead">A little something for you. Explore footwear, clothing and accessories gathered into one easy-to-browse edit.</p>
     <div className="hc-self-hero-actions"><a className="hc-self-primary" href="#browse-finds">Browse the edit <span aria-hidden="true">↗</span></a><a className="hc-self-subtle-link" href="https://docs.google.com/spreadsheets/d/1UPZerApqDKyhiZk4GOOzr4IY3LvgTZsXCtPdENlEwok/edit" target="_blank" rel="noopener noreferrer">Original spreadsheet <span aria-hidden="true">↗</span></a></div>
    </div>
    <div className="hc-self-hero-image">
     <img src="https://cdn.shopify.com/s/files/1/1127/4915/0598/files/herocon-clothing-card.webp?v=1794862181" alt="Curated clothing displayed in a stylish neutral setting" width={720} height={820} fetchPriority="high" />
     <div className="hc-self-hero-image-caption"><span>THE EVERYDAY EDIT</span><span>HEROCON / 01</span></div>
    </div>
   </div>
  </section>
  <ShopForYourself products={products}/>
  <section className="hc-self-note">
   <div className="hc-self-wrap hc-self-note-inner"><div><p className="hc-self-eyebrow">GOOD TO KNOW</p><h2>Explore with <em>confidence.</em></h2></div><div><p>This is a directory of information from a third-party spreadsheet, reproduced as a dated snapshot for convenience. Prices are indicative spreadsheet figures, not live quotes. External sellers and agents control their own listings, stock, shipping and checkout. Herocon has not independently verified the products, their authenticity, safety or the accuracy of the listings.</p><p>Herocon does not currently take payment for these products. Before ordering, check the seller, the product, applicable laws, shipping charges and any taxes yourself.</p><a href="https://docs.google.com/spreadsheets/d/1UPZerApqDKyhiZk4GOOzr4IY3LvgTZsXCtPdENlEwok/edit" target="_blank" rel="noopener noreferrer">View source spreadsheet ↗</a></div></div>
  </section>
 </main>;
}