import Link from "next/link";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import {getProducts} from "@/lib/catalogue-server";
import {prioritizeSavedPartnerProducts,attachSavedPartnerImages,selectDiscoveryEditProducts} from "@/lib/catalogue-priority";

export const dynamic = "force-dynamic";

const IMAGES = {
  personal: "https://images.unsplash.com/photo-1762605135012-56a59a059e60?auto=format&fit=crop&w=1400&q=85",
  business: "https://images.unsplash.com/photo-1773146916231-e6aeae932080?auto=format&fit=crop&w=1400&q=85",
  wardrobe: "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?auto=format&fit=crop&w=1100&q=85"
};

function Arrow({diagonal=false}:{diagonal?:boolean}){
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">{diagonal?<path d="M5 19 19 5M8 5h11v11"/>:<path d="M4 12h16m-7-7 7 7-7 7"/>}</svg>;
}

const interests = [
  {name:"Fashion & clothing",hint:"Pieces worth finding",href:"/search?collection=clothing",number:"01"},
  {name:"Jewellery",hint:"The finishing touches",href:"/search?category=Jewellery",number:"02"},
  {name:"Home & living",hint:"Everyday objects, thoughtfully found",href:"/search?category=Home%20%26%20Decor",number:"03"},
  {name:"Hair & accessories",hint:"Small details, big difference",href:"/search?category=Hair%20Accessories",number:"04"}
];

export default async function Home(){
  const products=await prioritizeSavedPartnerProducts(await getProducts());
  const featured=await attachSavedPartnerImages(selectDiscoveryEditProducts(products));
  const total=products.length;

  return <main className="hc-premium-home hc-choice-home">
    <Header/>
    <section className="hc-choice-intro hc-choice-container" aria-labelledby="hc-choice-title">
      <div className="hc-choice-intro-top"><span className="hc-choice-eyebrow"><span className="hc-choice-sun"/> WELCOME TO HEROCON</span><span className="hc-choice-volume">CURATED DISCOVERY · EST. 2026</span></div>
      <div className="hc-choice-intro-body">
        <h1 id="hc-choice-title">A world of finds.<br/><em>Yours to explore.</em></h1>
        <div className="hc-choice-intro-aside"><p>Whether it&apos;s something for you or the start of something bigger, discover products and possibilities in one place.</p><span>CHOOSE YOUR EXPERIENCE <Arrow/></span></div>
      </div>
    </section>

    <section className="hc-choice-paths hc-choice-container" aria-label="Choose your Herocon experience">
      <Link className="hc-choice-path hc-choice-personal" href="/shop-for-yourself" aria-label="Shop for yourself — explore the personal edit">
        <img src={IMAGES.personal} alt="Fashion model wearing a taupe outfit in a minimalist architectural studio" width={950} height={1170} fetchPriority="high"/>
        <span className="hc-choice-path-shade" aria-hidden="true"/>
        <div className="hc-choice-path-top"><span>01 / THE PERSONAL EDIT</span><span>DISCOVER & ENJOY</span></div>
        <div className="hc-choice-path-bottom">
          <div><span className="hc-choice-path-label">FOR THE EVERYDAY DISCOVERER</span><h2>Shop for<br/><em>yourself.</em></h2><p>Fashion, accessories and little discoveries that feel like you.</p></div>
          <span className="hc-choice-round-arrow"><Arrow diagonal/></span>
        </div>
      </Link>

      <Link className="hc-choice-path hc-choice-business" href="/start-a-business" aria-label="Start a business — explore sourcing for your brand">
        <img src={IMAGES.business} alt="Small-business owner preparing orders in a warm, sunlit packaging studio" width={950} height={1170} fetchPriority="high"/>
        <span className="hc-choice-path-shade" aria-hidden="true"/>
        <div className="hc-choice-path-top"><span>02 / THE FOUNDER'S EDIT</span><span>DISCOVER & BUILD</span></div>
        <div className="hc-choice-path-bottom">
          <div><span className="hc-choice-path-label">FOR THE IDEAS WORTH PURSUING</span><h2>Start a<br/><em>business.</em></h2><p>Find products, explore suppliers and take your first step towards a brand.</p></div>
          <span className="hc-choice-round-arrow"><Arrow diagonal/></span>
        </div>
      </Link>
    </section>
    <div className="hc-choice-after-cards hc-choice-container"><span>ONE DESTINATION. TWO WAYS TO DISCOVER.</span><span>SCROLL TO EXPLORE <span aria-hidden="true">↓</span></span></div>

    <section className="hc-choice-search-section" aria-labelledby="hc-choice-search-title">
      <div className="hc-choice-container hc-choice-search-grid">
        <div><span className="hc-choice-eyebrow">FIND WHAT MOVES YOU</span><h2 id="hc-choice-search-title">Something in mind?<br/><em>Let&apos;s find it.</em></h2></div>
        <div className="hc-choice-search-right"><p>Search products from 1688, Taobao and Weidian, or browse the collections below.</p><form action="/search" role="search" className="hc-choice-search-field"><label htmlFor="hc-choice-search-input" className="hc-choice-sr-only">Search the catalogue</label><input id="hc-choice-search-input" type="search" name="q" placeholder="Try a product, style or supplier" required/><button type="submit" aria-label="Search Herocon"><Arrow/></button></form></div>
      </div>
    </section>

    <section className="hc-choice-discover hc-choice-container" aria-labelledby="hc-choice-discover-title">
      <div className="hc-choice-section-heading"><div><span className="hc-choice-eyebrow">01 / EXPLORE THE EDIT</span><h2 id="hc-choice-discover-title">Find your <em>next thing.</em></h2></div><Link href="/search" className="hc-choice-underlined">Browse all categories <Arrow diagonal/></Link></div>
      <div className="hc-choice-collection-layout">
        <div className="hc-choice-collection-photo"><img src={IMAGES.wardrobe} alt="Real photograph of neutral clothing arranged on minimalist boutique rails" width={720} height={880} loading="lazy" decoding="async"/><span>THE CURATED EDIT / 2026</span></div>
        <div className="hc-choice-collection-list">{interests.map((item)=><Link href={item.href} key={item.name} className="hc-choice-collection-row"><span className="hc-choice-collection-number">{item.number}</span><span className="hc-choice-collection-copy"><strong>{item.name}</strong><small>{item.hint}</small></span><span className="hc-choice-collection-icon"><Arrow diagonal/></span></Link>)}</div>
      </div>
    </section>

    <section className="hc-choice-what-is" aria-labelledby="hc-choice-how-title">
      <div className="hc-choice-container">
        <div className="hc-choice-section-heading"><div><span className="hc-choice-eyebrow">02 / THE HEROCON WAY</span><h2 id="hc-choice-how-title">More than <em>a search.</em></h2></div><p>Go from inspiration to an original marketplace listing, with the information you need to make a considered decision.</p></div>
        <div className="hc-choice-how-grid">
          <article><span>01 — DISCOVER</span><h3>Explore freely.</h3><p>Browse curated edits or search the wider catalogue for something specific.</p></article>
          <article><span>02 — COMPARE</span><h3>See the source.</h3><p>Check original marketplace destinations, product details and available variants.</p></article>
          <article><span>03 — PLAN</span><h3>Make it yours.</h3><p>Save finds and evaluate the full sourcing and shipping cost before deciding.</p></article>
        </div>
        <div className="hc-choice-disclaimer"><span>PLEASE NOTE</span><p>Herocon currently supports product discovery and links to external marketplaces. Direct Herocon purchasing and warehouse/shipping checkout are not yet available.</p><Link href="/how-it-works">How sourcing works <Arrow diagonal/></Link></div>
      </div>
    </section>

    <section className="hc-choice-products hc-choice-container" aria-labelledby="hc-choice-products-title">
      <div className="hc-choice-section-heading"><div><span className="hc-choice-eyebrow">03 / PRODUCT DISCOVERY</span><h2 id="hc-choice-products-title">Currently <em>catching our eye.</em></h2></div><Link className="hc-choice-underlined" href="/search">Explore {total.toLocaleString("en-GB")} products <Arrow diagonal/></Link></div>
      <div className="hc-premium-featured-grid hc-choice-featured-grid">{featured.slice(0,4).map((product,i)=><ProductCard key={product.canonicalId||product.doppelProductId||i} product={product} eager={i<2}/>)}</div>
      <div className="hc-choice-products-footer"><span>DISCOVER SOMETHING NEW EVERY TIME</span><Link href="/search">View the full catalogue <Arrow/></Link></div>
    </section>

    <section className="hc-choice-end" aria-labelledby="hc-choice-end-title"><div className="hc-choice-container hc-choice-end-inner"><span className="hc-choice-eyebrow">THE POSSIBILITIES ARE YOURS</span><h2 id="hc-choice-end-title">Small finds. <em>Big ideas.</em></h2><p>For the things you love, and the things you&apos;re dreaming of building.</p><div><Link href="/shop-for-yourself" className="hc-choice-button hc-choice-button-light">Shop for yourself <Arrow diagonal/></Link><Link href="/start-a-business" className="hc-choice-button hc-choice-button-outline">Start a business <Arrow diagonal/></Link></div></div></section>
  </main>;
}
