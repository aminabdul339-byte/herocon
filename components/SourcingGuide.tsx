"use client";

import Link from "next/link";
import {useEffect,useRef,useState} from "react";
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

type ProductKind="earrings"|"shirt";
type DemoItem={kind:ProductKind;option:string};
const products:Record<ProductKind,{name:string;path:string;description:string}>={
 earrings:{name:"Minimalist earrings",path:"/product/link-5a62bac31c63b6ef21f40b21c186",description:"Compare the recorded gold-tone and silver-tone options, then visit the original product page for supplier details."},
 shirt:{name:"Cotton T-shirt",path:"/product/75hQ5VG5QTLdpDC1MluyLg",description:"Explore the product photos and available supplier options on the full catalogue listing."}
};
const marketInfo={
 "1688":"Explore wholesale listings and products for your business.",
 "Taobao":"Discover individual products, fashion and everyday finds.",
 "Weidian":"Explore products from independent marketplace sellers."
};
const kinds:ProductKind[]=["shirt","earrings"];
const earringOptions=["Yellow gold / 925 silver","White gold / 925 silver"];
function PreviewCard({kind,onOpen,lazy=true}:{kind:ProductKind;onOpen:(kind:ProductKind)=>void;lazy?:boolean}){
 return <button type="button" className={styles.previewCard} onClick={()=>onOpen(kind)} aria-label={"Quick view: "+products[kind].name}>
  <span className={styles.previewImage}><ProductPhoto kind={kind} lazy={lazy}/><span className={styles.previewIcon}><ArrowIcon direction="up-right"/></span></span>
  <span className={styles.previewName}>{products[kind].name}</span><span className={styles.previewHint}>Quick view</span>
 </button>;
}
export default function SourcingGuide(){
 const upperRef=useRef<HTMLDivElement>(null);
 const dialogRef=useRef<HTMLDialogElement>(null);
 const triggerRef=useRef<HTMLElement|null>(null);
 const [market,setMarket]=useState<keyof typeof marketInfo>("1688");
 const [search,setSearch]=useState("");
 const [quickProduct,setQuickProduct]=useState<ProductKind>("earrings");
 const [option,setOption]=useState(earringOptions[0]);
 const [shortlist,setShortlist]=useState<DemoItem[]>([]);
 const [notice,setNotice]=useState("");
 const [dialogOpen,setDialogOpen]=useState(false);
 const matching=kinds.filter(kind=>products[kind].name.toLowerCase().includes(search.trim().toLowerCase()));
 const chosen=products[quickProduct];

 useEffect(()=>{
  const root=upperRef.current;
  if(!root||!window.IntersectionObserver||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const observer=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    // Progressive enhancement: content is always readable before JS loads.
    if(typeof entry.target.animate==="function")entry.target.animate(
     [{opacity:.18,transform:"translateY(20px)"},{opacity:1,transform:"translateY(0)"}],
     {duration:580,easing:"cubic-bezier(.2,.72,.25,1)"}
    );
    observer.unobserve(entry.target);
   });
  },{threshold:.12});
  root.querySelectorAll("[data-story-reveal]").forEach(el=>observer.observe(el));
  return()=>observer.disconnect();
 },[]);
 function openPreview(kind:ProductKind){
  triggerRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  setQuickProduct(kind);
  setDialogOpen(true);
 }
 useEffect(()=>{
  const dialog=dialogRef.current;
  if(!dialog)return;
  if(dialogOpen&&!dialog.open)dialog.showModal();
  else if(!dialogOpen&&dialog.open)dialog.close();
 },[dialogOpen]);
 function closePreview(){setDialogOpen(false);}
 function saveExample(kind:ProductKind){
  const selectedOption=kind==="earrings"?option:"Explore available options";
  setShortlist(prev=>prev.some(item=>item.kind===kind&&item.option===selectedOption)?prev:[...prev,{kind,option:selectedOption}]);
  setNotice(products[kind].name+" added to your example shortlist.");
  setDialogOpen(false);
 }
 return <div className={styles.guide}>
  <div ref={upperRef}>
  <section className={styles.hero} aria-labelledby="sourcing-story-heading">
   <div className={styles.wrap+" "+styles.heroGrid}>
    <div data-story-reveal>
     <p className={styles.overline}>How Herocon works</p>
     <h1 id="sourcing-story-heading">Discover products.<br/><em>Find their source.</em></h1>
     <p className={styles.intro}>Herocon brings products from Chinese marketplaces into one place, so you can discover what to buy, compare suppliers and find the original listing.</p>
     <div className={styles.actions}>
      <Link className={styles.primary} href="/search">Explore products <ArrowIcon direction="right"/></Link>
      <Link className={styles.secondary} href="/find-product">Paste a product link <ArrowIcon direction="up-right"/></Link>
     </div>
     <p className={styles.freeNote}>Free to browse. No paid membership required.</p>
     <a className={styles.startDemo} href="#sourcing-demo">Try the interactive guide <ArrowIcon direction="down"/></a>
    </div>
    <div className={styles.interactiveHero} data-story-reveal>
     <div className={styles.marketButtons} role="group" aria-label="Explore marketplace types">
      {(Object.keys(marketInfo) as Array<keyof typeof marketInfo>).map(name=><button key={name} type="button" className={styles.marketButton} aria-pressed={market===name} onClick={()=>setMarket(name)}>{name}</button>)}
     </div>
     <p className={styles.marketExplanation} aria-live="polite">{marketInfo[market]}</p>
     <div className={styles.artArrow}><ArrowIcon direction="down"/></div>
     <div className={styles.demoWindow}>
      <div className={styles.demoHead}><span className={styles.demoBrand}>herocon.</span><span>Explore an example</span></div>
      <div className={styles.previewGrid}>{kinds.map(kind=><PreviewCard key={kind} kind={kind} lazy={false} onOpen={openPreview}/>)}</div>
     </div>
     <p className={styles.heroCaption}>Select a product to see how Herocon makes the source easier to explore.</p>
    </div>
   </div>
  </section>
  <section id="sourcing-demo" className={styles.section+" "+styles.storySteps} aria-labelledby="three-steps-heading">
   <div className={styles.wrap}>
    <div className={styles.sectionIntro} data-story-reveal>
     <h2 id="three-steps-heading">From a find to a <em>shortlist.</em></h2>
     <p>Try these three steps yourself. The examples are interactive, but won't change your real cart or place an order.</p>
    </div>
    <div className={styles.steps}>
     <article className={styles.step} data-story-reveal>
      <span className={styles.number} aria-hidden="true">01</span>
      <div className={styles.stepCopy}>
       <h3>Find something you like.</h3>
       <p>Search for products or paste an original marketplace link. Try searching for earrings or a T-shirt in this little catalogue.</p>
       <Link href="/search" className={styles.textLink}>Browse the full catalogue <ArrowIcon direction="right"/></Link>
      </div>
      <div className={styles.stepVisual}>
       <div className={styles.demoWindow}>
        <div className={styles.demoHead}><strong>Explore products</strong><span>Example catalogue</span></div>
        <label className={styles.searchRow}><Outline kind="search"/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Try earrings or T-shirt" aria-label="Search example catalogue"/></label>
        {matching.length>0?<div className={styles.previewGrid}>{matching.map(kind=><PreviewCard key={kind} kind={kind} onOpen={openPreview}/>)}</div>:<p className={styles.emptyDemo}>No matching examples. Clear the search or explore the full catalogue.</p>}
       </div>
      </div>
     </article>
     <article className={styles.step} data-story-reveal>
      <span className={styles.number} aria-hidden="true">02</span>
      <div className={styles.stepCopy}>
       <h3>Know what you're buying.</h3>
       <p>Compare product photos, sizes, colours and supplier information. Choose a recorded colour option and save this example to see how your shortlist works.</p>
       <Link href={products.earrings.path} className={styles.textLink}>Explore the actual product <ArrowIcon direction="right"/></Link>
      </div>
      <div className={styles.stepVisual}>
       <div className={styles.demoWindow}>
        <div className={styles.demoHead}><strong>Product details</strong><span>Example selection</span></div>
        <div className={styles.detailGrid}>
         <ProductPhoto kind="earrings"/>
         <div className={styles.detailText}><strong>Minimalist earrings</strong><span>Choose a colour</span><div className={styles.choiceRow} role="group" aria-label="Example earring colour">{earringOptions.map(value=><button key={value} type="button" className={styles.choice} aria-pressed={option===value} onClick={()=>setOption(value)}>{value}</button>)}</div>
         <button type="button" className={styles.demoAction} onClick={()=>saveExample("earrings")}><Outline kind="bag"/> {shortlist.some(item=>item.kind==="earrings"&&item.option===option)?"Saved to example shortlist":"Save example"}</button>{shortlist.length>0&&<a href="#example-shortlist" className={styles.textLink}>View example shortlist <ArrowIcon direction="down"/></a>}
         <span className={styles.demoNote}>Saved supplier options; check availability on the actual listing.</span></div>
        </div>
       </div>
      </div>
     </article>
     <article id="example-shortlist" className={styles.step+" "+styles.storySteps} data-story-reveal>
      <span className={styles.number} aria-hidden="true">03</span>
      <div className={styles.stepCopy}>
       <h3>Keep your favourites together.</h3>
       <p>Your shortlist keeps products in one place. In your real Herocon cart, use the original marketplace or available buying-agent links to arrange an external purchase.</p>
       <Link href="/cart" className={styles.textLink}>View your real cart <ArrowIcon direction="right"/></Link>
      </div>
      <div className={styles.stepVisual}>
       <div className={styles.demoWindow}>
        <div className={styles.demoHead}><strong>Your example shortlist</strong><span>{shortlist.length} saved</span></div>
        {shortlist.length===0?<p className={styles.emptyDemo}>Select a product above and save it to see it appear here.</p>:shortlist.map(item=><div className={styles.demoCartRow} key={item.kind+item.option}><ProductPhoto kind={item.kind}/><span><strong>{products[item.kind].name}</strong><br/>{item.option}</span><button type="button" className={styles.removeDemo} aria-label={"Remove "+products[item.kind].name+" "+item.option} onClick={()=>{setShortlist(prev=>prev.filter(x=>x.kind!==item.kind||x.option!==item.option));setNotice("Example removed.");}}><ArrowIcon direction="close"/></button></div>)}
        <div className={styles.demoFooter}><span>Demo only. No real cart changes.</span>{shortlist.length>0&&<button type="button" onClick={()=>{setShortlist([]);setNotice("Example shortlist cleared.");}}>Clear</button>}</div>
        <span role="status" className={styles.demoNote}>{notice}</span>
       </div>
      </div>
     </article>
    </div>
   </div>
  </section>
  <dialog ref={dialogRef} className={styles.modal} aria-labelledby="quick-view-title" onClose={()=>{setDialogOpen(false);triggerRef.current?.focus();}} onCancel={()=>setDialogOpen(false)} onClick={e=>{if(e.target===e.currentTarget)closePreview();}}>
   <div className={styles.modalHeader}><span>Herocon / Product quick view</span><button type="button" className={styles.closeModal} aria-label="Close product preview" onClick={closePreview}><ArrowIcon direction="close"/></button></div>
   <div className={styles.modalBody}>
    <div className={styles.modalPhoto}><ProductPhoto kind={quickProduct}/></div>
    <div className={styles.modalCopy}>
     <h3 id="quick-view-title">{chosen.name}</h3><p>{chosen.description}</p>
     {quickProduct==="earrings"&&<div className={styles.choiceRow} role="group" aria-label="Preview colour options">{earringOptions.map(value=><button key={value} type="button" className={styles.choice} aria-pressed={option===value} onClick={()=>setOption(value)}>{value}</button>)}</div>}
     <button type="button" className={styles.demoAction} onClick={()=>saveExample(quickProduct)}><Outline kind="bag"/> Save to example shortlist</button>
     <Link className={styles.textLink} href={chosen.path}>Open actual product <ArrowIcon direction="up-right"/></Link>
     <p className={styles.demoNote}>Interactive example only. Nothing is purchased or added to your real cart.</p>
    </div>
   </div>
  </dialog>
  </div>
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
