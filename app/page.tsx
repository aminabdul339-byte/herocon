import Link from "next/link";
import Header from "@/components/Header";
import HomeMotion from "@/components/HomeMotion";
import ProductCard from "@/components/ProductCard";
import {Instrument_Serif,Manrope} from "next/font/google";
import {getProducts} from "@/lib/catalogue-server";
import {prioritizeSavedPartnerProducts,attachSavedPartnerImages,selectDiscoveryEditProducts} from "@/lib/catalogue-priority";
import type {Metadata} from "next";

export const dynamic="force-dynamic";

export const metadata:Metadata={
 title:"Herocon — An Eye for the Extraordinary",
 description:"Discover beautiful finds and explore original marketplace sources from 1688, Taobao and Weidian. Shop the edit or explore sourcing for your business."
};

const serif=Instrument_Serif({weight:"400",style:["normal","italic"],subsets:["latin"],display:"swap",variable:"--eh-serif"});
const sans=Manrope({subsets:["latin"],display:"swap",variable:"--eh-sans"});

const PHOTOS={
 hero:"https://images.pexels.com/photos/32487723/pexels-photo-32487723.jpeg?auto=compress&cs=tinysrgb&w=1500&q=85",
 personal:"https://images.pexels.com/photos/7679685/pexels-photo-7679685.jpeg?auto=compress&cs=tinysrgb&w=1100&q=85",
 business:"https://images.pexels.com/photos/34221998/pexels-photo-34221998.jpeg?auto=compress&cs=tinysrgb&w=1100&q=85"
};

function Arrow({diagonal=true}:{diagonal?:boolean}){
 return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{diagonal?<path d="M5 19 19 5M8 5h11v11"/>:<path d="M4 12h16m-7-7 7 7-7 7"/>}</svg>;
}

export default async function Home(){
 const products=await prioritizeSavedPartnerProducts(await getProducts());
 const featured=await attachSavedPartnerImages(selectDiscoveryEditProducts(products));
 return <main className={["eh-home",serif.variable,sans.variable].join(" ")}>
  <Header editorial/>
  <HomeMotion/>

  <section className="eh-hero" aria-labelledby="eh-main-title">
    <div className="eh-shell eh-hero-grid">
      <div className="eh-hero-content">
        <div className="eh-kicker eh-hero-kicker"><span className="eh-kicker-rule"/> THE HEROCON EXPERIENCE / 01</div>
        <h1 id="eh-main-title">An eye for the<br/><em>extraordinary.</em></h1>
        <p className="eh-hero-lead">Beautiful finds. Original sources. Endless possibilities.</p>
        <p className="eh-hero-description">Discover pieces worth finding and explore product listings from 1688, Taobao and Weidian. Your next favourite find — or your next big idea — starts here.</p>
        <div className="eh-hero-actions">
          <Link href="/shop-for-yourself" className="eh-btn eh-btn-dark">Explore the edit <Arrow/></Link>
          <Link href="/start-a-business#sourcing-catalogue" className="eh-btn eh-btn-outline">Source for business <Arrow/></Link>
        </div>
        <div className="eh-hero-footnote"><span className="eh-footnote-dot"/> Curated discovery, with original marketplace links.</div>
      </div>

      <figure className="eh-hero-visual">
        <div className="eh-hero-photo">
          <img src={PHOTOS.hero} alt="Editorial photograph of a warm brown leather handbag displayed in an elegant neutral wardrobe" width={900} height={1200} fetchPriority="high" decoding="async"/>
        </div>
        <figcaption className="eh-image-caption">
          <span>THE HEROCON EDIT</span>
          <span>STYLE / DISCOVERY / POSSIBILITY</span>
        </figcaption>
        <div className="eh-image-corner" aria-hidden="true">H.</div>
      </figure>
    </div>
    <div className="eh-hero-bottom eh-shell"><span>ONE WORLD OF DISCOVERY</span><a href="#eh-journeys">SCROLL TO DISCOVER <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" aria-hidden="true"><path d="M12 3v17m-7-7 7 7 7-7"/></svg></a></div>
  </section>

  <section className="eh-journeys eh-shell" id="eh-journeys" aria-labelledby="eh-journeys-title" data-eh-reveal>
    <div className="eh-section-head">
      <div><span className="eh-kicker">02 / TWO WAYS TO DISCOVER</span><h2 id="eh-journeys-title">Find it. <em>Make it yours.</em></h2></div>
      <p>For the things you love, and the things you’re ready to create.</p>
    </div>
    <div className="eh-path-grid">
      <Link className="eh-path eh-path-personal" href="/shop-for-yourself">
        <div className="eh-path-copy"><span className="eh-path-eyebrow">01 / FOR YOURSELF</span><div><h3>Shop for <em>yourself.</em></h3><p>Discover the little things worth finding.</p></div><span className="eh-path-link">Explore the edit <Arrow/></span></div>
        <div className="eh-path-visual"><img src={PHOTOS.personal} alt="Warm brown coats and jackets on a boutique rail" width={600} height={750} loading="lazy" decoding="async"/></div>
      </Link>
      <Link className="eh-path eh-path-business" href="/start-a-business">
        <div className="eh-path-copy"><span className="eh-path-eyebrow">02 / FOR YOUR BUSINESS</span><div><h3>Start a <em>business.</em></h3><p>Explore products and original suppliers.</p></div><span className="eh-path-link">Explore sourcing <Arrow/></span></div>
        <div className="eh-path-visual"><img src={PHOTOS.business} alt="Stacked cardboard cartons in a sourcing warehouse" width={600} height={750} loading="lazy" decoding="async"/></div>
      </Link>
    </div>
  </section>

  <section className="eh-featured eh-shell" aria-labelledby="eh-featured-title" data-eh-reveal>
    <div className="eh-section-head eh-featured-head">
      <div><span className="eh-kicker">03 / THE CURATED EDIT</span><h2 id="eh-featured-title">Currently <em>catching our eye.</em></h2></div>
      <Link className="eh-text-link" href="/search">Explore all products <Arrow/></Link>
    </div>
    {featured.length>0
      ? <div className="eh-featured-grid hc-premium-featured-grid">{featured.slice(0,4).map((product,i)=><ProductCard key={product.canonicalId||product.doppelProductId||i} product={product} eager={i<2}/>)}</div>
      : <div className="eh-empty-edit"><p>Our next edit is on its way.</p><Link href="/search">Explore the catalogue <Arrow/></Link></div>}
  </section>

  <section className="eh-source" aria-labelledby="eh-source-title" data-eh-reveal>
    <div className="eh-shell eh-source-grid">
      <div><span className="eh-kicker">04 / DIRECT SOURCING</span><h2 id="eh-source-title">Behind every great find<br/>is a <em>source.</em></h2></div>
      <div className="eh-source-content"><p>Explore original product listings across 1688, Taobao and Weidian. Discover what’s possible, compare options and follow the source.</p>
        <div className="eh-marketplaces" aria-label="Marketplace sources"><span>1688</span><span>TAOBAO</span><span>WEIDIAN</span></div>
        <Link href="/how-it-works" className="eh-source-link">Discover how sourcing works <Arrow/></Link>
      </div>
    </div>
  </section>
  <div className="eh-site-note eh-shell">Herocon currently supports discovery and original marketplace links. Product purchases and fulfilment via Herocon are not yet live. Images in editorial sections are illustrative stock photographs, not listed products.</div>
 </main>;
}
