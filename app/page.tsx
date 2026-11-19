import Link from "next/link";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import {getProducts} from "@/lib/catalogue-server";
import {prioritizeSavedPartnerProducts,attachSavedPartnerImages,leadWithShowcaseMix} from "@/lib/catalogue-priority";

export const dynamic="force-dynamic";

const PHOTO={
  home:"https://cdn.shopify.com/s/files/1/1127/4915/0598/files/herocon-home-lifestyle-card.webp?v=1794862172",
  jewellery:"https://cdn.shopify.com/s/files/1/1127/4915/0598/files/herocon-jewellery-card.webp?v=1794862176",
  hair:"https://cdn.shopify.com/s/files/1/1127/4915/0598/files/herocon-hair-accessories-card.webp?v=1794862166",
  clothing:"https://cdn.shopify.com/s/files/1/1127/4915/0598/files/herocon-clothing-card.webp?v=1794862181"
};

const collections=[
 {number:"01",name:"Home & living",subtitle:"Objects with a point of view",href:"/search?category=Home%20%26%20Decor",image:PHOTO.home,alt:"Thoughtfully styled home décor and ceramic accessories"},
 {number:"02",name:"Jewellery",subtitle:"A little something special",href:"/search?category=Jewellery",image:PHOTO.jewellery,alt:"Curated jewellery and delicate accessories"},
 {number:"03",name:"Hair & accessories",subtitle:"Finishing touches, found",href:"/search?category=Hair%20Accessories",image:PHOTO.hair,alt:"Elegant hair accessories and everyday details"},
 {number:"04",name:"Clothing",subtitle:"The building blocks of style",href:"/search?collection=clothing",image:PHOTO.clothing,alt:"Contemporary clothing and fashion pieces"}
];

export default async function Home(){
 const products=await prioritizeSavedPartnerProducts(await getProducts());
 const total=products.length;
 const featured=await attachSavedPartnerImages(leadWithShowcaseMix(products,1).slice(0,4));

 return <main className="hc-premium-home">
  <Header/>
  <section className="hc-premium-hero" aria-labelledby="hc-premium-hero-title">
   <div className="hc-premium-container hc-premium-hero-inner">
    <div className="hc-premium-hero-copy">
     <div className="hc-premium-eyebrow"><span className="hc-premium-eyebrow-line"/>A NEW WAY TO DISCOVER <span className="hc-premium-edition">HEROCON · EST. 2026</span></div>
     <h1 id="hc-premium-hero-title">Discover what&apos;s next.<br/><em>Create what&apos;s yours.</em></h1>
     <p className="hc-premium-hero-lead">Thoughtful product discovery for ideas worth bringing to life. Explore original wholesale finds, compare sourcing options, and start building something of your own.</p>
     <div className="hc-premium-hero-ctas">
      <Link className="hc-premium-button hc-premium-button-dark" href="/search">Explore the collection <span aria-hidden="true">↗</span></Link>
      <Link className="hc-premium-text-link" href="/how-it-works">Discover our approach <span aria-hidden="true">↗</span></Link>
     </div>
     <div className="hc-premium-hero-foot">
      <span className="hc-premium-star" aria-hidden="true">✳</span>
      <div><strong>{total.toLocaleString("en-GB")} products to explore</strong><span>One considered place to begin.</span></div>
     </div>
    </div>
    <div className="hc-premium-hero-art" aria-label="Herocon lifestyle and product inspiration">
     <div className="hc-premium-hero-art-frame">
      <img className="hc-premium-hero-main-photo" src={PHOTO.home} alt="Neutral home and lifestyle product styling" width={780} height={920} fetchPriority="high"/>
      <div className="hc-premium-hero-image-mark"><span>THE DISCOVERY EDIT</span><span>01 / 04</span></div>
     </div>
     <div className="hc-premium-hero-inset">
      <img src={PHOTO.jewellery} alt="Jewellery finds and delicate details" width={330} height={390} decoding="async"/>
     </div>
     <span className="hc-premium-hero-side-note">DISCOVER · SOURCE · CREATE</span>
    </div>
   </div>
  </section>

  <section className="hc-premium-search-band" aria-label="Search the Herocon catalogue">
   <div className="hc-premium-container hc-premium-search-inner">
    <div className="hc-premium-search-copy"><span>THE NEXT FIND IS YOURS</span><strong>What are you looking for?</strong></div>
    <form className="hc-premium-search-form" action="/search" role="search">
     <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>
     <input name="q" placeholder="Products, suppliers, an idea…" aria-label="Search products or suppliers" required/>
     <button type="submit" aria-label="Search products">Search <span aria-hidden="true">↗</span></button>
    </form>
   </div>
  </section>

  <section className="hc-premium-collections" aria-labelledby="hc-premium-collections-title">
   <div className="hc-premium-container">
    <div className="hc-premium-section-heading">
     <div><p className="hc-premium-kicker"><span>01</span> / THE COLLECTIONS</p><h2 id="hc-premium-collections-title">Follow your <em>curiosity.</em></h2></div>
     <div className="hc-premium-heading-side"><p>From everyday essentials to the little details that make a difference. Start exploring wherever your inspiration takes you.</p><Link href="/search">View all categories <span aria-hidden="true">↗</span></Link></div>
    </div>
    <div className="hc-premium-category-grid">
     {collections.map((collection)=>(
      <Link href={collection.href} key={collection.name} className="hc-premium-category-tile">
       <div className="hc-premium-category-image"><img src={collection.image} alt={collection.alt} loading="lazy" decoding="async" width={570} height={640}/><span className="hc-premium-category-number">{collection.number}</span></div>
       <div className="hc-premium-category-info"><div><h3>{collection.name}</h3><p>{collection.subtitle}</p></div><span className="hc-premium-tile-arrow" aria-hidden="true">↗</span></div>
      </Link>
     ))}
    </div>
   </div>
  </section>

  <section className="hc-premium-edit" aria-labelledby="hc-premium-edit-title">
   <div className="hc-premium-container">
    <div className="hc-premium-section-heading hc-premium-edit-header">
     <div><p className="hc-premium-kicker"><span>02</span> / FRESH FINDS</p><h2 id="hc-premium-edit-title">The discovery <em>edit.</em></h2></div>
     <div className="hc-premium-heading-side"><p>Explore products with saved partner details, including the options and images available from their original marketplaces.</p><Link href="/search">Explore all products <span aria-hidden="true">↗</span></Link></div>
    </div>
    <div className="hc-premium-featured-grid">{featured.map((product,i)=><ProductCard key={product.canonicalId||product.doppelProductId||i} product={product} eager={i<2}/>)}</div>
    <div className="hc-premium-under-grid"><span>GOOD FINDS. BIG POSSIBILITIES.</span><Link href="/search">Browse {total.toLocaleString("en-GB")} products <span aria-hidden="true">↗</span></Link></div>
   </div>
  </section>

  <section className="hc-premium-story" aria-labelledby="hc-premium-story-title">
   <div className="hc-premium-container hc-premium-story-inner">
    <div className="hc-premium-story-lead"><p className="hc-premium-kicker"><span>03</span> / THE HEROCON WAY</p><h2 id="hc-premium-story-title">Your vision.<br/><em>A world of possibility.</em></h2><p>Behind every brilliant idea is a first step. Herocon makes the discovery part feel a little more considered.</p><Link className="hc-premium-button hc-premium-button-light" href="/start-a-business">Start with an idea <span aria-hidden="true">↗</span></Link></div>
    <div className="hc-premium-story-steps">
     <div className="hc-premium-story-step"><span>01 / DISCOVER</span><h3>Find your inspiration.</h3><p>Browse product categories and uncover original marketplace opportunities.</p></div>
     <div className="hc-premium-story-step"><span>02 / COMPARE</span><h3>Explore the detail.</h3><p>Review available partner-sourced options and indicative product prices.</p></div>
     <div className="hc-premium-story-step"><span>03 / CREATE</span><h3>Make it your own.</h3><p>Save the pieces you love and start shaping your next business idea.</p></div>
    </div>
   </div>
  </section>

  <section className="hc-premium-final" aria-labelledby="hc-premium-final-title">
   <div className="hc-premium-container hc-premium-final-inner">
    <p className="hc-premium-kicker"><span>AN OPEN INVITATION</span></p>
    <h2 id="hc-premium-final-title">Already found <em>something special?</em></h2>
    <p>Bring a product link from 1688, Taobao or Weidian. We&apos;ll help you explore it in one place.</p>
    <Link className="hc-premium-button hc-premium-button-dark" href="/find-product">Explore a product link <span aria-hidden="true">↗</span></Link>
   </div>
  </section>
 </main>;
}
