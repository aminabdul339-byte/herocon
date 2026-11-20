"use client";

import Link from "next/link";
import {useState} from "react";

type IconName="search"|"link"|"bag"|"box"|"truck"|"arrow"|"arrow-up"|"check"|"calculator"|"shield"|"layers"|"chevron"|"spark"|"globe"|"clipboard"|"user"|"store"|"copy";
type Mode="personal"|"business";

function Icon({name,size=22}:{name:IconName;size?:number}){
 const path:Record<IconName,React.ReactNode>={
  search:<><circle cx="10.8" cy="10.8" r="7"/><path d="m16 16 5 5"/></>,
  link:<><path d="M10.3 13.7a5 5 0 0 0 7.1 0l2.1-2.1a5 5 0 0 0-7.1-7.1L11.3 5.6"/><path d="M13.7 10.3a5 5 0 0 0-7.1 0l-2.1 2.1a5 5 0 0 0 7.1 7.1l1.1-1.1"/></>,
  bag:<><path d="M4 9h16l-1.2 12H5.2L4 9Z"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/></>,
  box:<><path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z"/><path d="m3 7 9 5 9-5M12 12v10M7.5 4.5l9 5"/></>,
  truck:<><path d="M2 5h12v12H2zM14 9h4l4 4v4h-8z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>,
  arrow:<path d="M4 12h16m-7-7 7 7-7 7"/>,
  "arrow-up":<path d="M5 19 19 5M8 5h11v11"/>,
  check:<path d="m4 12 5.1 5.1L20 6"/>,
  calculator:<><rect x="4" y="2.5" width="16" height="19" rx="2.3"/><path d="M8 7h8M8 12h1M12 12h1M16 12h1M8 16h1M12 16h1M16 16h1"/></>,
  shield:<><path d="M12 2 20 6v6c0 5.2-3.5 8.8-8 10-4.5-1.2-8-4.8-8-10V6l8-4Z"/><path d="m8.5 12 2.4 2.5 4.7-5"/></>,
  layers:<><rect x="4" y="3" width="16" height="14" rx="2"/><path d="M7 20h10M8 9h8M8 12h5"/></>,
  chevron:<path d="m9 5 7 7-7 7"/>,
  spark:<><path d="m12 2 1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2Z"/><path d="m19 17 .8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8L19 17Z"/></>,
  globe:<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-3 3-3 15 0 18M12 3c3 3 3 15 0 18"/></>,
  clipboard:<><rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4.5V2h6v2.5M9 11h6M9 15h6"/></>,
  user:<><circle cx="12" cy="8" r="4"/><path d="M4 22c.3-5 2.9-7.5 8-7.5s7.7 2.5 8 7.5"/></>,
  store:<><path d="M4 10h16v11H4zM3 6h18l-2 4H5L3 6ZM7 3h10M9 21v-7h6v7"/></>,
  copy:<><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/></>
 };
 return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} focusable="false">{path[name]}</svg>;
}
const phases=[
 {number:"01",name:"Discover",eyebrow:"FIND YOUR NEXT PRODUCT",icon:"search" as IconName,status:"AVAILABLE NOW",live:true,
   personal:{title:"Find something you love.",body:"Browse the personal edit or search the wider Herocon catalogue for clothing, accessories and everyday finds.",facts:["Curated personal categories","Product photos and reference prices","Search by keyword or collection"],cta:"Explore the personal edit",href:"/shop-for-yourself"},
   business:{title:"Find an idea worth building.",body:"Explore products already indexed in our sourcing catalogue. Compare categories, discover niches and begin researching a potential first collection.",facts:["Browse the sourcing catalogue","Discover original marketplace links","Research your category"],cta:"Explore sourcing products",href:"/start-a-business#sourcing-catalogue"}},
 {number:"02",name:"Check details",eyebrow:"GO BEYOND THE PICTURE",icon:"layers" as IconName,status:"AVAILABLE NOW",live:true,
   personal:{title:"Know what you're looking at.",body:"Open a product to review listed images, prices, variations and its recorded marketplace destination. Double-check details with the seller before buying.",facts:["Compare product options","Follow the original listing","Confirm price and availability"],cta:"Find a product by link",href:"/find-product"},
   business:{title:"Research the original source.",body:"Check the product listing, supplier, sizes and available variants. For resale, independently assess authenticity, safety, demand and minimum order quantities.",facts:["Inspect supplier details","Compare variants and pricing","Check resale and safety requirements"],cta:"Paste a supplier link",href:"/find-product"}},
 {number:"03",name:"Save & source",eyebrow:"CHOOSE YOUR NEXT MOVE",icon:"bag" as IconName,status:"AVAILABLE NOW",live:true,
   personal:{title:"Make your shortlist.",body:"Save items in your Herocon cart. When you're ready, use the original marketplace link or an independent buying agent where a link is available.",facts:["Free Herocon account and cart","Direct marketplace destinations","Independent buying agents"],cta:"Go to your cart",href:"/cart"},
   business:{title:"Plan your first sourcing list.",body:"Save products and compare possible suppliers. Purchases made on external marketplaces or through buying agents are managed independently of Herocon.",facts:["Build a sourcing shortlist","Choose an external seller or agent","Confirm supplier terms yourself"],cta:"View your cart",href:"/cart"}},
 {number:"04",name:"Delivery",eyebrow:"WHAT COMES NEXT",icon:"truck" as IconName,status:"PLANNED SERVICE",live:false,
   personal:{title:"A simpler way to get it home.",body:"Herocon-managed purchasing, warehouse storage and international delivery checkout are planned, but not live. You can review indicative shipping routes in the meantime.",facts:["Herocon checkout is not yet available","Warehouse fulfilment is planned","Shipping costs are separate"],cta:"Explore shipping estimates",href:"/landed-cost"},
   business:{title:"From supplier to your doorstep.",body:"We plan to integrate BuckyDrop purchasing, warehouse services and shipping, but customer checkout and dispatch are not live yet. Plan for freight, import taxes and other charges.",facts:["Procurement and fulfilment are planned","Check indicative delivery costs","Budget for shipping, duties and tax"],cta:"Estimate landed costs",href:"/landed-cost"}}
];
const faq=[
 {q:"Can I order a product through Herocon today?",a:"Not yet. Herocon currently helps you discover products, review available catalogue information, save items and visit original marketplaces or independent buying agents. Herocon-managed product payment, warehouse and delivery checkout are still being developed."},
 {q:"What marketplaces can I search?",a:"The catalogue includes products linked to 1688, Taobao, Weidian and other supported Chinese marketplaces. You can also use Paste a Product Link for supported original marketplace URLs."},
 {q:"Do I need a paid membership to browse?",a:"No. Browsing, creating a free account and saving products to your cart are free. Herocon also offers an optional £9.99/month early-access membership. Purchasing through Herocon is not yet available, whether or not you have membership."},
 {q:"Are listed product prices what I'll actually pay?",a:"Not necessarily. Listed prices are references and may change. International delivery, buying-agent fees, VAT, customs duties and other charges may be extra. Confirm final figures with the seller or agent."},
 {q:"Who handles my order if I use a buying agent?",a:"Any external marketplace or buying-agent transaction is handled by that independent service. Herocon does not control their prices, fulfilment, buyer protection or delivery conditions."},
 {q:"Can I use these products to start my own brand?",a:"You can use the catalogue for research, but check seller reliability, product-safety rules, intellectual-property rights, customs requirements, minimum orders, sample quality and actual customer demand before committing."}
];
const checklistByMode:Record<Mode,string[]>={
 personal:["I have checked the original listing","I have confirmed the variation and price","I know who handles the purchase","I have allowed for delivery and fees"],
 business:["I have researched product demand","I have checked the supplier and samples","I have reviewed product safety and IP rights","I have estimated the full landed cost"]
};

export default function SourcingGuide(){
 const [mode,setMode]=useState<Mode>("business");
 const [active,setActive]=useState(0);
 const [checked,setChecked]=useState<Record<string,boolean>>({});
 const [copied,setCopied]=useState(false);
 const phase=phases[active];
 const data=phase[mode];
 const checks=checklistByMode[mode];
 const complete=checks.filter((_,i)=>checked[mode+":"+i]).length;
 const selectMode=(next:Mode)=>{setMode(next);setActive(0);setCopied(false);};
 const copyChecklist=async()=>{
   const text=checks.map(item=>"- "+item).join("\n");
   try{await navigator.clipboard.writeText(text);setCopied(true);}catch{setCopied(false);}
 };
 return <>
  <section className="sg-hero">
   <div className="sg-wrap sg-hero-grid">
    <div className="sg-hero-copy">
      <span className="sg-kicker"><span className="sg-signal"/> THE HEROCON SOURCING GUIDE</span>
      <h1>Find the source.<br/><em>Make it yours.</em></h1>
      <p className="sg-lead">Discover products from Chinese marketplaces, explore original listings and understand what happens next. Your sourcing journey, made clearer.</p>
      <div className="sg-hero-buttons">
       <a href="#sg-journey" className="sg-btn sg-btn-dark">Explore the journey <Icon name="arrow" size={18}/></a>
       <Link href="/find-product" className="sg-btn sg-btn-secondary">Paste a product link <Icon name="arrow-up" size={17}/></Link>
      </div>
      <div className="sg-hero-caption"><span><Icon name="check" size={15}/> Explore products today</span><span><Icon name="check" size={15}/> No membership required to browse</span></div>
    </div>
    <div className="sg-hero-visual" aria-label="Herocon product discovery to marketplace journey">
      <div className="sg-visual-top"><span>HEROCON / SOURCING PATH</span><span className="sg-visual-status"><span/> LIVE DISCOVERY</span></div>
      <div className="sg-visual-main">
        <div className="sg-route-label">DISCOVER ACROSS MARKETPLACES</div>
        <div className="sg-marketplaces" aria-label="Supported marketplace sources"><span>1688</span><span>TAOBAO</span><span>WEIDIAN</span></div>
        <div className="sg-connector"><span/><div><Icon name="arrow" size={16}/></div><span/></div>
        <div className="sg-hero-result">
          <div className="sg-hero-result-icon"><Icon name="layers" size={27}/></div>
          <div><small>HEROCON / PRODUCT DETAIL</small><strong>Explore the original source.</strong><span>Products · prices · supplier links</span></div>
          <span className="sg-mini-check"><Icon name="check" size={15}/></span>
        </div>
        <div className="sg-route-foot"><div><span className="sg-route-dot"/><strong>DISCOVERY</strong><small>Available today</small></div><div><span className="sg-route-dot sg-route-dot-muted"/><strong>FULFILMENT</strong><small>Planned for later</small></div></div>
      </div>
      <div className="sg-visual-bottom"><Icon name="shield" size={17}/><span>Real listing data. Independent seller verification still required.</span></div>
    </div>
   </div>
  </section>

  <section id="sg-journey" className="sg-journey" aria-labelledby="sg-journey-title">
   <div className="sg-wrap">
    <div className="sg-head">
     <div><span className="sg-kicker">01 / INTERACTIVE GUIDE</span><h2 id="sg-journey-title">See how it <em>works.</em></h2></div>
     <p>Pick how you want to use Herocon, then choose a step to see exactly what you can do.</p>
    </div>
    <div className="sg-mode-switch" role="group" aria-label="Choose a shopping journey">
     <button type="button" className={mode==="personal"?"is-selected":""} aria-pressed={mode==="personal"} onClick={()=>selectMode("personal")}><Icon name="user" size={18}/> Shopping for yourself</button>
     <button type="button" className={mode==="business"?"is-selected":""} aria-pressed={mode==="business"} onClick={()=>selectMode("business")}><Icon name="store" size={18}/> Starting a business</button>
    </div>
    <div className="sg-stepper">
     <nav className="sg-step-nav" aria-label="Sourcing journey steps">
       {phases.map((item,index)=><button key={item.number} type="button" className={active===index?"is-current":""} onClick={()=>{setActive(index);setCopied(false);}} aria-current={active===index?"step":undefined} aria-controls="sg-active-step" aria-label={"Step "+item.number+": "+item.name}>
         <span className="sg-step-num">{item.number}</span><span className="sg-step-nav-copy"><strong>{item.name}</strong><small>{item.live?"Available now":"Coming later"}</small></span><Icon name="chevron" size={17}/>
       </button>)}
       <div className="sg-step-nav-footer">Select any step to explore its details.</div>
     </nav>
     <article className="sg-step-detail" id="sg-active-step" aria-live="polite" aria-atomic="true">
       <div className="sg-step-detail-top"><span className="sg-detail-eyebrow">STEP {phase.number} / {phase.eyebrow}</span><span className={"sg-step-status "+(phase.live?"sg-step-status-live":"sg-step-status-soon")}><span/> {phase.status}</span></div>
       <div className="sg-detail-content">
        <div className="sg-detail-icon"><Icon name={phase.icon} size={41}/><span>0{active+1}</span></div>
        <div className="sg-detail-visual-lines" aria-hidden="true"><i/><i/><i/></div>
       </div>
       <h3>{data.title}</h3><p>{data.body}</p>
       <div className="sg-detail-facts">{data.facts.map(item=><span key={item}><Icon name="check" size={15}/>{item}</span>)}</div>
       <Link href={data.href} className="sg-detail-link">{data.cta}<Icon name="arrow-up" size={18}/></Link>
       <div className="sg-detail-progress" aria-label={"Step "+(active+1)+" of "+phases.length}>
        <span>{phase.number} / 04</span><div>{phases.map((item,index)=><button key={item.number} type="button" className={index<=active?"is-filled":""} aria-label={"Go to step "+item.number} aria-current={index===active?"step":undefined} onClick={()=>setActive(index)}/>)}</div>
       </div>
     </article>
    </div>
   </div>
  </section>

  <section className="sg-tools" aria-labelledby="sg-tools-title">
   <div className="sg-wrap">
     <div className="sg-head"><div><span className="sg-kicker">02 / WHAT'S READY</span><h2 id="sg-tools-title">Your tools, <em>ready to use.</em></h2></div><p>Start with what works now. Explore, compare and build a shortlist at your own pace.</p></div>
     <div className="sg-tools-grid">
       <Link href="/start-a-business#sourcing-catalogue"><span className="sg-tools-icon"><Icon name="search" size={29}/></span><span className="sg-tools-copy"><small>01 / DISCOVER</small><strong>Browse products</strong><span>Explore the sourcing catalogue.</span></span><Icon name="arrow-up" size={19}/></Link>
       <Link href="/find-product"><span className="sg-tools-icon"><Icon name="link" size={29}/></span><span className="sg-tools-copy"><small>02 / EXPLORE</small><strong>Paste a product link</strong><span>Start with a marketplace URL.</span></span><Icon name="arrow-up" size={19}/></Link>
       <Link href="/cart"><span className="sg-tools-icon"><Icon name="bag" size={29}/></span><span className="sg-tools-copy"><small>03 / ORGANISE</small><strong>Your product cart</strong><span>Keep promising finds together.</span></span><Icon name="arrow-up" size={19}/></Link>
       <Link href="/landed-cost"><span className="sg-tools-icon"><Icon name="calculator" size={29}/></span><span className="sg-tools-copy"><small>04 / ESTIMATE</small><strong>Shipping estimates</strong><span>Explore indicative delivery costs.</span></span><Icon name="arrow-up" size={19}/></Link>
     </div>
   </div>
  </section>

  <section className="sg-readiness" aria-labelledby="sg-readiness-title">
   <div className="sg-wrap sg-readiness-grid">
     <div className="sg-readiness-copy">
      <span className="sg-kicker">03 / BEFORE YOU ORDER</span><h2 id="sg-readiness-title">A little checking.<br/><em>A lot more clarity.</em></h2>
      <p>Use this short checklist before making a purchase. It&apos;s yours to tick through, whether you&apos;re shopping personally or exploring products to resell.</p>
      <div className="sg-readiness-state"><span>{complete} OF {checks.length} COMPLETE</span><strong>{Math.round((complete/checks.length)*100)}%</strong></div>
      <div className="sg-readiness-bar"><span style={{width:(complete/checks.length)*100+"%"}}/></div>
      <button type="button" className="sg-copy" onClick={copyChecklist}><Icon name={copied?"check":"copy"} size={17}/>{copied?"Checklist copied":"Copy this checklist"}</button>
     </div>
     <div className="sg-checklist">
      <div className="sg-checklist-title"><Icon name="clipboard" size={21}/><span>{mode==="personal"?"YOUR PERSONAL SHOPPING CHECKLIST":"YOUR BUSINESS SOURCING CHECKLIST"}</span></div>
      {checks.map((item,i)=><label key={mode+":"+i} className={"sg-check-item "+(checked[mode+":"+i]?"is-checked":"")}><input type="checkbox" checked={Boolean(checked[mode+":"+i])} onChange={e=>{setChecked(x=>({...x,[mode+":"+i]:e.target.checked}));setCopied(false);}}/><span className="sg-check-control"><Icon name="check" size={16}/></span><span>{item}</span><small>{String(i+1).padStart(2,"0")}</small></label>)}
      <p>Checklist progress stays on this page and is not saved to your account.</p>
     </div>
   </div>
  </section>

  <section className="sg-next" aria-labelledby="sg-next-title">
    <div className="sg-wrap sg-next-grid">
      <div><span className="sg-kicker">WHAT'S ON THE ROADMAP</span><h2 id="sg-next-title">From discovery<br/><em>to delivery.</em></h2></div>
      <div className="sg-next-copy"><p>Herocon currently supports product discovery, marketplace links, free accounts and carts. Our planned next stage is integrated purchasing, warehouse storage and separate international shipping checkout through sourcing services such as BuckyDrop.</p><div className="sg-next-warning"><Icon name="shield" size={20}/><span><strong>Not live yet.</strong> Herocon does not currently take product or warehouse/shipping payments. External transactions are handled by independent providers.</span></div><Link href="/landed-cost">Explore delivery estimates <Icon name="arrow-up" size={18}/></Link></div>
    </div>
  </section>

  <section className="sg-faq" aria-labelledby="sg-faq-title">
   <div className="sg-wrap sg-faq-grid">
     <div className="sg-faq-aside"><span className="sg-kicker">04 / THE DETAILS</span><h2 id="sg-faq-title">Good questions.<br/><em>Clear answers.</em></h2><p>Still need help with a specific product? Our support page is here when you need it.</p><Link href="/contact">Contact Herocon <Icon name="arrow-up" size={17}/></Link></div>
     <div className="sg-faq-list">{faq.map((item,i)=><details key={item.q}><summary><span className="sg-faq-index">{String(i+1).padStart(2,"0")}</span><strong>{item.q}</strong><span className="sg-faq-toggle" aria-hidden="true"><Icon name="chevron" size={18}/></span></summary><p>{item.a}</p></details>)}</div>
   </div>
  </section>

  <section className="sg-outro"><div className="sg-wrap sg-outro-inner"><span className="sg-kicker">DISCOVER WITH INTENTION</span><h2>Find the product.<br/><em>Explore the possibilities.</em></h2><p>Start sourcing with more confidence and a clearer understanding of the next step.</p><div><Link href="/start-a-business#sourcing-catalogue" className="sg-btn sg-btn-cream">Explore products <Icon name="arrow-up" size={18}/></Link><Link href="/shop-for-yourself" className="sg-btn sg-btn-ghost">Shop for yourself <Icon name="arrow-up" size={18}/></Link></div></div></section>
 </>;
}
