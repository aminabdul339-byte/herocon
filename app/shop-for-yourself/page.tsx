import type {Metadata} from "next";
import Header from "@/components/Header";
import ShopForYourself from "@/components/ShopForYourself";
import products from "@/data/shop-for-yourself.json";
import "./shop-for-yourself.css";

export const metadata:Metadata={
 title:"Shop for Yourself — The Personal Edit",
 description:"Discover fashion, shoes, accessories and the little things worth finding, with original marketplace links and transparent product information."
};

const PERSONAL_PHOTO="https://images.pexels.com/photos/7679685/pexels-photo-7679685.jpeg?auto=compress&cs=tinysrgb&w=1400&q=85";

export default function ShopForYourselfPage(){
 return <main className="hc-self">
  <Header/>
  <section className="hc-self-editorial" aria-labelledby="hc-self-editorial-title">
    <div className="hc-self-editorial-grid">
      <div className="hc-self-editorial-copy">
        <span className="hc-self-editorial-label">THE PERSONAL EDIT / HEROCON 2026</span>
        <h1 id="hc-self-editorial-title">A little<br/>something <em>for you.</em></h1>
        <p>The pieces you&apos;ll reach for, the accessories that make an outfit, the little discoveries that feel like you. Explore our personal shopping edit.</p>
        <div className="hc-self-editorial-actions">
          <a href="#browse-finds" className="hc-self-editorial-cta">Explore the edit <span aria-hidden="true">↗</span></a>
          <a href="#browse-finds" className="hc-self-editorial-links">View the personal edit ↗</a>
        </div>
      </div>
      <div className="hc-self-editorial-image">
        <img src={PERSONAL_PHOTO} alt="Real boutique photograph of warm brown jackets arranged on hangers near a dressing-room mirror" width={800} height={1000} fetchPriority="high"/>
        <span><span>THE EVERYDAY EDIT</span><span>01 / PERSONAL DISCOVERY</span></span>
      </div>
    </div>
    <div className="hc-self-editorial-strip"><span>CURATED FOR YOUR CURIOSITY</span><span>FASHION · ACCESSORIES · EVERYDAY FINDS</span><span>ORIGINAL MARKETPLACE LINKS</span></div>
  </section>
  <ShopForYourself products={products}/>
  <section className="hc-self-note">
   <div className="hc-self-wrap hc-self-note-inner"><div><p className="hc-self-eyebrow">SHOP WITH CLARITY</p><h2>Every find has <em>a source.</em></h2></div><div><p>Product links take you to original Chinese marketplace listings so you can check details before making a decision. We organise the discoveries; external sellers and agents handle their own transactions.</p><p>Herocon has not independently audited supplier identity, authenticity, quality, safety, stock or fulfilment. GBP prices are indicative and may exclude shipping, taxes and agent fees. Herocon product checkout is not yet live.</p></div></div>
  </section>
 </main>;
}
