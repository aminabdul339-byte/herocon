"use client";

import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {ArrowIcon} from "@/components/ArrowIcon";
import styles from "./sourcing-story.module.css";

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

type JourneyIcon="find"|"cart"|"pay"|"source"|"deliver";
function JourneyIcon({kind,className}:{kind:JourneyIcon;className?:string}){
 return <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
 {kind==="find"?<><rect x="6" y="7" width="27" height="30" rx="3"/><path d="M6 15h27M12 11h1m4 0h1"/><circle cx="29" cy="29" r="9"/><path d="m35.5 35.5 7 7M12 21h7m-7 6h4"/></>:
 kind==="cart"?<><path d="M3 7h6l5 25h24l5-17H11M19 19v9m10-9v9"/><circle cx="18" cy="39" r="3"/><circle cx="35" cy="39" r="3"/></>:
 kind==="pay"?<><rect x="4" y="10" width="40" height="28" rx="5"/><path d="M4 19h40M11 30h9m6 0h5"/><path d="m32 27 3 3 6-6"/></>:
 kind==="source"?<><path d="m24 4 18 10v20L24 44 6 34V14L24 4ZM6 14l18 10 18-10M24 24v20M15 9l18 10v9"/><path d="m29 33 3 3 7-7"/></>:
 <><path d="m4 23 20-17 20 17M10 19v23h28V19M19 42V29h10v13"/><path d="M12 16v-7h7"/><path d="m33 26 3 3 6-6"/></>}
 </svg>;
}
function PlayGlyph({playing}:{playing:boolean}){
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{playing?<><path d="M9 5v14M15 5v14"/></>:<path d="m8 5 12 7-12 7V5Z"/>}</svg>;
}
type Action={label:string;href:string};
type Stage={label:string;title:string;short:string;body:string;details:string;icon:JourneyIcon;actions:Action[]};
const stages:Stage[]=[
 {label:"Find a product",title:"Find what you love.",short:"Find a product",body:"Pick a product from Herocon's catalogue or bring your own link from a supported Chinese marketplace.",details:"Explore Herocon's catalogue of original marketplace listings, or paste a supported 1688, Taobao or Weidian product link. Compare the available options before choosing what you want.",icon:"find",actions:[{label:"Explore the catalogue",href:"/search"},{label:"Paste your own link",href:"/find-product"}]},
 {label:"Add to cart",title:"Make it yours.",short:"Add to cart",body:"Choose your size, colour and quantity, then add everything you want to your Herocon cart.",details:"Select the available product variants and quantities and save them in one cart with a free account. You can review or change your selection before purchasing.",icon:"cart",actions:[{label:"Open your cart",href:"/cart"}]},
 {label:"Pay Herocon",title:"Pay in one place.",short:"Pay Herocon",body:"When checkout launches, pay Herocon directly for your order. You won't need a separate buying-agent account.",details:"Our planned checkout will show the product cost, applicable fees and delivery pricing before you approve payment. Herocon will receive your payment and arrange fulfilment through our sourcing partner. Direct checkout is not available yet.",icon:"pay",actions:[]},
 {label:"We source it",title:"Leave the sourcing to us.",short:"We source it",body:"Our sourcing partner will purchase your items from the original suppliers and receive them at its warehouse in China.",details:"After a confirmed order, our sourcing partner will handle the supplier purchase and warehouse processing. This is the planned Herocon fulfilment service, subject to availability and order checks.",icon:"source",actions:[]},
 {label:"Delivered to you",title:"From China to your door.",short:"Delivered to you",body:"Our partner will arrange international shipping so your products can be delivered to your address.",details:"The partner will prepare your parcel and arrange international delivery. Shipping charges, applicable taxes and duties will be explained before the relevant payment is approved. Integrated delivery is in development.",icon:"deliver",actions:[{label:"Explore shipping estimates",href:"/landed-cost"}]}
];
const positions=[{x:50,y:13},{x:85.19,y:38.57},{x:71.75,y:79.93},{x:28.25,y:79.93},{x:14.81,y:38.57}];

export default function SourcingGuide(){
 const [active,setActive]=useState(0);
 const [playing,setPlaying]=useState(false);
 const [popup,setPopup]=useState(false);
 const dialogRef=useRef<HTMLDialogElement>(null);
 const triggerRef=useRef<HTMLButtonElement>(null);
 const stage=stages[active];

 useEffect(()=>{
  if(!playing)return;
  if(active===stages.length-1){setPlaying(false);return;}
  const timer=window.setTimeout(()=>setActive(index=>Math.min(index+1,stages.length-1)),4200);
  return()=>window.clearTimeout(timer);
 },[active,playing]);
 useEffect(()=>{
  const dialog=dialogRef.current;
  if(!dialog)return;
  if(popup&&!dialog.open)dialog.showModal();
  else if(!popup&&dialog.open)dialog.close();
 },[popup]);
 function choose(index:number){
  setPlaying(false);
  setActive(Math.min(stages.length-1,Math.max(0,index)));
 }
 function togglePlay(){
  if(playing){setPlaying(false);return;}
  if(active===stages.length-1)setActive(0);
  setPlaying(true);
 }
 function openDetails(){setPlaying(false);setPopup(true);}
 return <div className={styles.guide}>
  <section className={styles.wheelHero} aria-labelledby="sourcing-story-heading">
   <div className={styles.wrap+" "+styles.wheelLayout}>
    <div className={styles.wheelIntro}>
     <p className={styles.overline}>How sourcing works</p>
     <h1 id="sourcing-story-heading">Find the source.<br/><em>Make it yours.</em></h1>
     <p className={styles.intro}>Choose the products you love. We'll take care of sourcing them from China and getting them to you once our integrated purchasing service launches.</p>
     <div className={styles.actions}>
      <Link href="/search" className={styles.primary}>Explore products <ArrowIcon direction="right"/></Link>
      <Link href="/find-product" className={styles.secondary}>Bring your own link <ArrowIcon direction="up-right"/></Link>
     </div>
    </div>

    <div className={styles.wheelArea}>
     <div className={styles.wheelBoard} role="group" aria-label="Five steps in Herocon's planned sourcing journey">
      <svg className={styles.wheelTracks} viewBox="0 0 600 600" aria-hidden="true" focusable="false">
       <circle className={styles.wheelTrack} cx="300" cy="300" r="222"/>
       <circle className={styles.wheelInnerTrack} cx="300" cy="300" r="184"/>
       <circle className={styles.wheelProgress} cx="300" cy="300" r="222" pathLength="100" strokeDasharray={(active*20)+" 100"}/>
      </svg>
      <div className={styles.wheelCenter} aria-hidden="true">
       <div className={styles.centerContent} key={active}>
        <div className={styles.centerBrand}>hero<em>con.</em></div>
        <JourneyIcon kind={stage.icon} className={styles.centerIcon}/>
        <div className={styles.centerTitle}>{stage.short}</div>
        <div className={styles.centerCounter}>0{active+1} / 05</div>
       </div>
      </div>
      {stages.map((step,i)=><button key={step.icon} type="button" className={styles.wheelNode}
       style={{left:positions[i].x+"%",top:positions[i].y+"%"}}
       aria-pressed={active===i} aria-label={"Step "+(i+1)+": "+step.label} aria-controls="wheel-step-description"
       onClick={()=>choose(i)}>
       <span className={styles.nodeDisc}><JourneyIcon kind={step.icon}/></span>
       <span className={styles.nodeLabel}>{step.label}</span>
      </button>)}
     </div>
     <p className={styles.wheelCaption}>Select a step, or play the journey from start to finish.</p>
    </div>

    <div className={styles.wheelDetail}>
     <div id="wheel-step-description" key={active} className={styles.stepChange} aria-live={playing?"off":"polite"} aria-atomic="true">
      <p className={styles.stepCount}>STEP 0{active+1} OF 05</p>
      <h2>{stage.title}</h2>
      <p className={styles.stepBody}>{stage.body}</p>
     </div>
     <button ref={triggerRef} type="button" className={styles.wheelMore} onClick={openDetails}>See how it works <ArrowIcon direction="up-right"/></button>
     <div className={styles.wheelControls}>
      <button type="button" className={styles.wheelControl} aria-label="Previous step" disabled={active===0} onClick={()=>choose(active-1)}><ArrowIcon direction="left"/></button>
      <button type="button" className={styles.wheelControl+" "+styles.wheelPlay} onClick={togglePlay}><PlayGlyph playing={playing}/>{playing?"Pause journey":active===4?"Replay journey":"Play journey"}</button>
      <button type="button" className={styles.wheelControl} aria-label="Next step" disabled={active===stages.length-1} onClick={()=>choose(active+1)}><ArrowIcon direction="right"/></button>
     </div>
     <p className={styles.wheelFootnote}><strong>Available now:</strong> discover products and build your cart for free. Herocon-managed payment and delivery are in development.</p>
    </div>
   </div>
   <dialog ref={dialogRef} className={styles.wheelModal} aria-labelledby="wheel-popup-title"
    onClose={()=>{setPopup(false);triggerRef.current?.focus();}} onCancel={()=>setPopup(false)}
    onClick={e=>{if(e.target===e.currentTarget)setPopup(false);}}>
    <div className={styles.wheelModalHeader}><span>STEP 0{active+1} / {stage.label.toUpperCase()}</span><button type="button" className={styles.wheelClose} aria-label="Close step details" onClick={()=>setPopup(false)}><ArrowIcon direction="close"/></button></div>
    <div className={styles.wheelModalBody}>
     <JourneyIcon kind={stage.icon} className={styles.modalArt}/>
     <h2 id="wheel-popup-title">{stage.title}</h2>
     <p>{stage.details}</p>
     <div className={styles.modalLinks}>{stage.actions.map((action,i)=><Link key={action.href} href={action.href} className={i===0?styles.primary:styles.secondary}>{action.label}<ArrowIcon direction="right"/></Link>)}</div>
     {active>=2&&<p className={styles.modalStatus}>Planned service. No product or shipping payment is taken through this guide.</p>}
    </div>
   </dialog>
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
