import Link from "next/link";
import {ArrowIcon} from "@/components/ArrowIcon";
import styles from "./sourcing-story.module.css";

// Real catalogue photography, used only to illustrate the shopping journey.
const earrings="https://cbu01.alicdn.com/img/ibank/O1CN01SglckC1TgI37H2bZU_!!3026752411-0-cib.jpg";
const shirt="https://img.alicdn.com/img/ibank/O1CN01R69vNP2IJQToY4OGh_!!2201218109265-0-cib.jpg_720x720q70.jpg_.webp";

function ProductPhoto({kind,lazy=true}:{kind:"earrings"|"shirt";lazy?:boolean}){
 return <img src={kind==="earrings"?earrings:shirt} alt={kind==="earrings"?"Gold-tone earrings from the catalogue":"Cotton T-shirt from the catalogue"} loading={lazy?"lazy":"eager"} decoding="async" referrerPolicy="no-referrer"/>;
}
function Outline({kind}:{kind:"shop"|"warehouse"|"truck"|"home"|"search"|"bag"}){
 const compact=kind==="search"||kind==="bag";
 return <svg viewBox={compact?"0 0 24 24":"0 0 96 76"} fill="none" stroke="currentColor" strokeWidth={compact?1.6:1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
  {kind==="search"?<><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>:
   kind==="bag"?<><path d="M4 9h16l-1 12H5L4 9Z"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/></>:
   kind==="shop"?<><path d="M17 31v36h62V31M12 29 22 10h52l10 19"/><path d="M12 29c0 9 12 12 18 3 6 8 12 8 18 0 6 8 12 8 18 0 6 9 18 6 18-3M29 10l-3 19m22-19v19m19-19 3 19M28 45h19v12H28zM57 67V45h13v22M10 67h76"/></>:
   kind==="warehouse"?<><path d="M9 28 48 8l39 20v39H9V28ZM9 28h78M23 67V39h50v28M23 48h50M23 57h50"/><path d="M41 39v28M57 39v28M5 67h86"/></>:
   kind==="truck"?<><path d="M9 18h49v40H9V18ZM58 30h16l14 16v12H58M62 33h10l10 13H62zM7 58h10M31 58h37M82 58h8"/><circle cx="24" cy="59" r="7" fill="#e9ede3"/><circle cx="75" cy="59" r="7" fill="#e9ede3"/><path d="M2 28h13M3 38h12M35 27h13m-13 8h13"/></>:
   <><path d="m9 35 39-28 39 28M18 29v38h60V29M38 67V44h20v23M25 39h8v10h-8zM63 39h8v10h-8zM8 67h80"/></>}
 </svg>;
}
const questions=[
 ["Can I buy directly from Herocon today?","Not yet. You can browse, save products and follow links to original marketplaces or independent buying agents. Integrated Herocon payments, purchasing and delivery are in development."],
 ["Do I need a membership?","No. Browsing, opening a free account and saving products in your cart are free. The optional £9.99 monthly early-access membership is not required to use these features."],
 ["Is the displayed product price the total I will pay?","No. Catalogue prices are references and may change. Check supplier prices, international shipping, agent charges, VAT and applicable customs duties before purchasing."],
 ["Can I source products for my own business?","Yes, you can use the catalogue to research products and suppliers. Check samples, minimum order quantities, product safety, intellectual-property rights and full landed costs before reselling."],
 ["Who handles my order if I buy through an agent?","The external marketplace or independent buying agent handles that transaction, including its payment, delivery and buyer-protection terms. Herocon does not manage those external orders."]
] as const;

export default function SourcingGuide(){
 return <div className={styles.guide}>
  <section className={styles.hero} aria-labelledby="sourcing-story-heading">
   <div className={styles.wrap+" "+styles.heroGrid}>
    <div>
     <p className={styles.overline}>How Herocon works</p>
     <h1 id="sourcing-story-heading">Discover products.<br/><em>Find their source.</em></h1>
     <p className={styles.intro}>Herocon brings products from Chinese marketplaces into one place, so you can discover what to buy, compare suppliers and find the original listing.</p>
     <div className={styles.actions}>
      <Link className={styles.primary} href="/search">Explore products <ArrowIcon direction="right"/></Link>
      <Link className={styles.secondary} href="/find-product">Paste a product link <ArrowIcon direction="up-right"/></Link>
     </div>
     <p className={styles.freeNote}>Free to browse. No paid membership required.</p>
    </div>
    <figure className={styles.heroArt} aria-label="Products from 1688, Taobao and Weidian brought together in the Herocon catalogue">
     <div className={styles.marketRow}><span>1688</span><span>Taobao</span><span>Weidian</span></div>
     <div className={styles.artArrow}><ArrowIcon direction="down"/></div>
     <div className={styles.artBrand}>herocon.</div>
     <div className={styles.photos}><div className={styles.photo}><ProductPhoto kind="shirt" lazy={false}/></div><div className={styles.photo}><ProductPhoto kind="earrings" lazy={false}/></div></div>
     <figcaption>Original marketplace products, easier to explore.</figcaption>
    </figure>
   </div>
  </section>
  <section className={styles.section} aria-labelledby="three-steps-heading">
   <div className={styles.wrap}>
    <div className={styles.sectionIntro}>
     <h2 id="three-steps-heading">From a find to a <em>shortlist.</em></h2>
     <p>Three simple steps you can use right now, whether you're shopping for yourself or researching a business idea.</p>
    </div>
    <div className={styles.steps}>
     <article className={styles.step}>
      <span className={styles.number} aria-hidden="true">01</span>
      <div className={styles.stepCopy}>
       <h3>Find something you like.</h3>
       <p>Browse the catalogue or paste an original marketplace link. Explore clothing, accessories, homeware and more without searching each marketplace separately.</p>
       <Link href="/search" className={styles.textLink}>Browse the catalogue <ArrowIcon direction="right"/></Link>
      </div>
      <div className={styles.visual} role="img" aria-label="Illustration of the product catalogue with clothing and jewellery search results">
       <div className={styles.browser}>
        <div className={styles.browserHead}><span>Explore products</span><Outline kind="search"/></div>
        <div className={styles.productGrid}>
         <div><ProductPhoto kind="shirt"/><span>Cotton T-shirt</span></div>
         <div><ProductPhoto kind="earrings"/><span>Gold-tone earrings</span></div>
        </div>
       </div>
      </div>
     </article>
     <article className={styles.step}>
      <span className={styles.number} aria-hidden="true">02</span>
      <div className={styles.stepCopy}>
       <h3>Know what you're buying.</h3>
       <p>Open a product to see its available photos, colours, sizes, reference prices and source link. Check current availability, seller terms and minimum orders before committing.</p>
       <Link href="/product/link-5a62bac31c63b6ef21f40b21c186" className={styles.textLink}>Explore an example product <ArrowIcon direction="right"/></Link>
      </div>
      <div className={styles.visual} role="img" aria-label="Example product details for earrings showing two recorded colour options and original marketplace link">
       <div className={styles.browser}>
        <div className={styles.browserHead}><span>Product details</span></div>
        <div className={styles.detailGrid}>
         <ProductPhoto kind="earrings"/>
         <div className={styles.detailText}><strong>Minimalist earrings</strong><span>Colour options</span><span className={styles.option}>Yellow gold / 925 silver</span><span className={styles.option}>White gold / 925 silver</span><span className={styles.source}>Original source link available</span></div>
        </div>
       </div>
      </div>
     </article>
     <article className={styles.step}>
      <span className={styles.number} aria-hidden="true">03</span>
      <div className={styles.stepCopy}>
       <h3>Keep your favourites together.</h3>
       <p>Create a free account and save items in your cart. When you're ready, follow an available original marketplace or buying-agent link to arrange your purchase externally.</p>
       <Link href="/cart" className={styles.textLink}>View your cart <ArrowIcon direction="right"/></Link>
      </div>
      <div className={styles.visual} role="img" aria-label="Illustration of a Herocon cart holding two saved products and their quantities">
       <div className={styles.browser}>
        <div className={styles.browserHead}><span>Your shortlist</span><Outline kind="bag"/></div>
        <div className={styles.cartLine}><ProductPhoto kind="earrings"/><span>Minimalist earrings</span><strong>Qty 1</strong></div>
        <div className={styles.cartLine}><ProductPhoto kind="shirt"/><span>Cotton T-shirt</span><strong>Qty 2</strong></div>
        <div className={styles.cartFoot}><span>2 saved product options</span><span>View sources <ArrowIcon direction="right"/></span></div>
       </div>
      </div>
     </article>
    </div>
   </div>
  </section>
  <section className={styles.delivery} aria-labelledby="delivery-story-heading">
   <div className={styles.wrap}>
    <div className={styles.deliveryHead}>
     <div><p className={styles.overline}>In development</p><h2 id="delivery-story-heading">From the supplier<br/> <em>to your doorstep.</em></h2></div>
     <p>We're building integrated Herocon purchasing and delivery. The intended journey is a partner purchasing from the seller, receiving the goods in China and arranging international shipping to you.</p>
    </div>
    <div className={styles.deliveryFlow} aria-label="Planned delivery journey: marketplace supplier, warehouse in China, international shipping, delivery to your door">
     <div className={styles.node}><Outline kind="shop"/><strong>Marketplace supplier</strong></div>
     <ArrowIcon className={styles.flowArrow} direction="right"/>
     <div className={styles.node}><Outline kind="warehouse"/><strong>Warehouse in China</strong></div>
     <ArrowIcon className={styles.flowArrow} direction="right"/>
     <div className={styles.node}><Outline kind="truck"/><strong>International shipping</strong></div>
     <ArrowIcon className={styles.flowArrow} direction="right"/>
     <div className={styles.node}><Outline kind="home"/><strong>Your doorstep</strong></div>
    </div>
    <div className={styles.status}><p><strong>Not available yet:</strong> Herocon does not currently accept product or delivery payments. External sellers and buying agents handle their own transactions. Budget for shipping, agent fees, VAT and duties separately from the listed product price.</p><Link href="/landed-cost" className={styles.textLink}>Explore shipping estimates <ArrowIcon direction="right"/></Link></div>
   </div>
  </section>
  <section className={styles.faq} aria-labelledby="sourcing-questions">
   <div className={styles.wrap+" "+styles.faqGrid}>
    <div><h2 id="sourcing-questions">A few good <em>questions.</em></h2><p>Everything you need to know before getting started.</p><Link href="/contact" className={styles.textLink}>Contact us <ArrowIcon direction="up-right"/></Link></div>
    <div className={styles.faqList}>{questions.map(([q,a])=><details key={q}><summary>{q}<ArrowIcon direction="down"/></summary><p>{a}</p></details>)}</div>
   </div>
  </section>
  <section className={styles.end}>
   <div className={styles.wrap+" "+styles.endGrid}>
    <div><h2>What are you looking for?</h2><p>Choose where you'd like to start.</p></div>
    <div className={styles.actions}><Link href="/start-a-business" className={styles.primary}>Start a business <ArrowIcon direction="right"/></Link><Link href="/shop-for-yourself" className={styles.secondary}>Shop for yourself <ArrowIcon direction="right"/></Link></div>
   </div>
  </section>
 </div>;
}
