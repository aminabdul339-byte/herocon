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
 const withLinks=products.filter(item=>Boolean(item.shopUrl)||item.additionalLinks.length>0).length;
 return <main className="hc-self">
  <Header/>
  <section className="hc-self-hero" aria-labelledby="hc-self-hero-title">
   <div className="hc-self-wrap hc-self-hero-grid">
    <div className="hc-self-hero-copy">
     <p className="hc-self-eyebrow"><span className="hc-self-eyebrow-dot"/>THE PERSONAL EDIT <span className="hc-self-edition">HEROCON / 2026</span></p>
     <h1 id="hc-self-hero-title">Shop for<br/><em>yourself.</em></h1>
     <p className="hc-self-hero-lead">A little something for you. Explore footwear, clothing and accessories gathered into one easy-to-browse edit.</p>
     <div className="hc-self-hero-actions"><a className="hc-self-primary" href="#browse-finds">Browse the edit <span aria-hidden="true">↗</span></a><a className="hc-self-subtle-link" href="https://docs.google.com/spreadsheets/d/1UPZerApqDKyhiZk4GOOzr4IY3LvgTZsXCtPdENlEwok/edit" target="_blank" rel="noopener noreferrer">Original spreadsheet <span aria-hidden="true">↗</span></a></div>
     <p className="hc-self-hero-footnote">A snapshot of a third-party spreadsheet, not live inventory. Links open external sites.</p>
    </div>
    <div className="hc-self-art" aria-hidden="true">
     <div className="hc-self-art-disc hc-self-art-disc-a"></div><div className="hc-self-art-disc hc-self-art-disc-b"></div>
     <div className="hc-self-art-ticket"><span>COLLECTION NO. 01</span><strong>FINDS<br/>FOR<br/>YOU.</strong><span>TAKE A LOOK ↗</span></div>
     <span className="hc-self-art-vertical">DISCOVER · EXPLORE · ENJOY</span>
     <div className="hc-self-art-stamp">JUST<br/>FOR<br/>YOU ✳</div>
    </div>
   </div>
  </section>
  <section className="hc-self-stats" aria-label="Collection details">
   <div className="hc-self-wrap hc-self-stats-inner"><span><strong>{products.length.toLocaleString("en-GB")}</strong> listed finds</span><span><strong>{withLinks.toLocaleString("en-GB")}</strong> entries with external links</span><span><strong>5</strong> categories to explore</span></div>
  </section>
  <ShopForYourself products={products}/>
  <section className="hc-self-note">
   <div className="hc-self-wrap hc-self-note-inner"><div><p className="hc-self-eyebrow">GOOD TO KNOW</p><h2>Explore with <em>confidence.</em></h2></div><div><p>This is a directory of information from a third-party spreadsheet, reproduced as a dated snapshot for convenience. Prices are indicative spreadsheet figures, not live quotes. External sellers and agents control their own listings, stock, shipping and checkout. Herocon has not independently verified the products, their authenticity, safety or the accuracy of the listings.</p><p>Herocon does not currently take payment for these products. Before ordering, check the seller, the product, applicable laws, shipping charges and any taxes yourself.</p><a href="https://docs.google.com/spreadsheets/d/1UPZerApqDKyhiZk4GOOzr4IY3LvgTZsXCtPdENlEwok/edit" target="_blank" rel="noopener noreferrer">View source spreadsheet ↗</a></div></div>
  </section>
 </main>;
}