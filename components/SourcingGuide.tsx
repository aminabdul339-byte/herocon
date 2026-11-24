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
// Original dimensional illustrations in Herocon's green and cream palette.
// Layered faces and highlights keep the five objects legible at small sizes.
function JourneyIcon({kind,className}:{kind:JourneyIcon;className?:string}){
 const dark="#284b36",green="#789a7a",light="#c3d6bb",paper="#fff9e9",gold="#c8aa73";
 return <svg className={className} viewBox="0 0 80 80" fill="none" stroke={dark} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
  <ellipse cx="40" cy="71" rx="28" ry="4" fill={dark} opacity=".13" stroke="none"/>
  {kind==="find"?<>
   <path d="M15 12 57 8l7 7v43L22 64l-7-7V12Z" fill={green}/>
   <rect x="12" y="14" width="43" height="45" rx="5" fill={paper}/>
   <path d="M12 25h43V19q0-5-5-5H17q-5 0-5 5v6Z" fill={green}/>
   <circle cx="19" cy="19.5" r="1.6" fill={paper} stroke="none"/><circle cx="25" cy="19.5" r="1.6" fill={paper} stroke="none"/>
   <rect x="19" y="31" width="13" height="15" rx="2" fill={light}/><path d="M38 34h10m-10 7h8M19 51h18" stroke={green}/>
   <path d="m52 53 15 13" stroke={dark} strokeWidth="9"/><path d="m52 53 15 13" stroke={gold} strokeWidth="5"/>
   <circle cx="46" cy="46" r="15" fill={light}/><circle cx="46" cy="46" r="10.5" fill="#eff4e7"/><path d="M40 45q1-6 7-6" stroke="white" strokeWidth="3.3"/>
  </>:kind==="cart"?<>
   <path d="M8 14h10l9 40h34l7-7" stroke={dark} strokeWidth="6"/><path d="M8 12h10l9 40h34" stroke={green} strokeWidth="3"/>
   <path d="m21 23 13-8 39 6-8 9-7 22-31-5Z" fill={green}/>
   <path d="m21 23 44 7-7 22-31-5Z" fill={light}/><path d="m65 30 8-9-6 24-9 7Z" fill="#52765a"/>
   <path d="m33 29 3 16m9-14 1 16m11-14-3 15M26 36l35 5" stroke={dark} strokeWidth="2"/>
   <path d="m33 22 9-12 13 4 4 13" fill={gold}/><path d="M43 12v12" stroke="#9b7b49"/>
   <circle cx="31" cy="61" r="7" fill={dark}/><circle cx="31" cy="61" r="2.8" fill={paper} stroke="none"/><circle cx="57" cy="61" r="7" fill={dark}/><circle cx="57" cy="61" r="2.8" fill={paper} stroke="none"/>
  </>:kind==="pay"?<>
   <path d="m16 16 45-5 8 7v36l-48 7-8-7V22Z" fill="#53775a"/>
   <rect x="10" y="19" width="53" height="40" rx="6" transform="rotate(-6 10 19)" fill={green}/>
   <path d="m12 27 51-5 1 9-51 5Z" fill={dark} stroke="none"/>
   <rect x="18" y="40" width="12" height="9" rx="2" fill={gold}/><path d="m34 47 12-1" stroke={paper} strokeWidth="3"/>
   <circle cx="60" cy="54" r="15" fill={paper}/><circle cx="60" cy="54" r="11" fill={dark} stroke="none"/><path d="m54 54 4 4 8-9" stroke={paper} strokeWidth="3"/>
  </>:kind==="source"?<>
   <path d="m40 10 29 15-29 17L11 25Z" fill={paper}/>
   <path d="M11 25v31l29 16V42Z" fill={gold}/><path d="m40 42 29-17v31L40 72Z" fill={green}/>
   <path d="m23 19 29 16 7-4-29-16Z" fill={light}/><path d="m52 35 7-4v13l-7 4Z" fill={light}/>
   <path d="m20 43 12 6v10l-12-6Z" fill={paper}/><path d="m23 48 6 3" stroke={green}/>
   <circle cx="62" cy="61" r="12" fill={dark}/><path d="m56 61 4 4 7-9" stroke={paper} strokeWidth="3"/>
  </>:<>
   <path d="m40 12 27 16v34L40 74 13 59V28Z" fill={green}/>
   <path d="M13 29 40 44v30L13 59Z" fill={light}/><path d="M40 44l27-16v34L40 74Z" fill={green}/>
   <path d="M7 30 39 7l33 20-5 8L39 18 12 38Z" fill={dark}/><path d="M12 38 39 18v26L13 29Z" fill={paper} stroke="none"/>
   <path d="m21 47 10 6v16l-10-6Z" fill={dark}/><path d="m46 48 12-7v10l-12 7Z" fill={paper}/>
   <path d="m52 61 11-6 10 6-11 7Z" fill={paper}/><path d="m52 61 10 7v11l-10-7Z" fill={gold}/><path d="m62 68 11-7v11l-11 7Z" fill={green}/>
  </>}
 </svg>;
}
function PauseGlyph({paused}:{paused:boolean}){
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paused?<path d="m8 5 12 7-12 7V5Z"/>:<><path d="M9 5v14M15 5v14"/></>}</svg>;
}
type Action={label:string;href:string};
type Stage={label:string;title:string;short:string;center:string;body:string;details:string;icon:JourneyIcon;actions:Action[]};
const stages:Stage[]=[
 {label:"Find a product",title:"Find what you love.",short:"Find a product",center:"Browse our catalogue or paste your own product link.",body:"Pick a product from Herocon's catalogue or bring your own link from a supported Chinese marketplace.",details:"Explore Herocon's catalogue of original marketplace listings, or paste a supported 1688, Taobao or Weidian product link. Compare the available options before choosing what you want.",icon:"find",actions:[{label:"Explore the catalogue",href:"/search"},{label:"Paste your own link",href:"/find-product"}]},
 {label:"Add to cart",title:"Make it yours.",short:"Add to cart",center:"Select your colour, size and quantity.",body:"Choose your size, colour and quantity, then add everything you want to your Herocon cart.",details:"Select the available product variants and quantities and save them in one cart with a free account. You can review or change your selection before purchasing.",icon:"cart",actions:[{label:"Open your cart",href:"/cart"}]},
 {label:"Pay Herocon",title:"Pay in one place.",short:"Pay Herocon",center:"One checkout. Pay us, not the supplier.",body:"When checkout launches, pay Herocon directly for your order. You won't need a separate buying-agent account.",details:"Our planned checkout will show the product cost, applicable fees and delivery pricing before you approve payment. Herocon will receive your payment and arrange fulfilment through our sourcing partner. Direct checkout is not available yet.",icon:"pay",actions:[]},
 {label:"We source it",title:"Leave the sourcing to us.",short:"We source it",center:"Our agent buys your items in China.",body:"Our sourcing partner will purchase your items from the original suppliers and receive them at its warehouse in China.",details:"After a confirmed order, our sourcing partner will handle the supplier purchase and warehouse processing. This is the planned Herocon fulfilment service, subject to availability and order checks.",icon:"source",actions:[]},
 {label:"Delivered to you",title:"From China to your door.",short:"Delivered to you",center:"Our partner ships your parcel to your door.",body:"Our partner will arrange international shipping so your products can be delivered to your address.",details:"The partner will prepare your parcel and arrange international delivery. Shipping charges, applicable taxes and duties will be explained before the relevant payment is approved. Integrated delivery is in development.",icon:"deliver",actions:[{label:"Explore shipping estimates",href:"/landed-cost"}]}
];
const positions=[{x:50,y:13},{x:85.19,y:38.57},{x:71.75,y:79.93},{x:28.25,y:79.93},{x:14.81,y:38.57}];

export default function SourcingGuide(){
 const [active,setActive]=useState(0);
 const [paused,setPaused]=useState(false);
 const [hovered,setHovered]=useState(false);
 const [focused,setFocused]=useState(false);
 const [reducedMotion,setReducedMotion]=useState(false);
 const [visible,setVisible]=useState(true);
 const [popup,setPopup]=useState(false);
 const dialogRef=useRef<HTMLDialogElement>(null);
 const triggerRef=useRef<HTMLButtonElement|null>(null);
 const stage=stages[active];

 useEffect(()=>{
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
  const update=()=>setReducedMotion(motion.matches);
  const visibility=()=>setVisible(!document.hidden);
  update();visibility();
  motion.addEventListener("change",update);
  document.addEventListener("visibilitychange",visibility);
  return()=>{motion.removeEventListener("change",update);document.removeEventListener("visibilitychange",visibility);};
 },[]);
 const autoRunning=!paused&&!hovered&&!focused&&!reducedMotion&&!popup&&visible;
 useEffect(()=>{
  if(!autoRunning)return;
  const timer=window.setTimeout(()=>setActive(index=>(index+1)%stages.length),3000);
  return()=>window.clearTimeout(timer);
 },[active,autoRunning]);
 useEffect(()=>{
  const dialog=dialogRef.current;
  if(!dialog)return;
  if(popup&&!dialog.open)dialog.showModal();
  else if(!popup&&dialog.open)dialog.close();
 },[popup]);
 function openDetails(index:number,trigger:HTMLButtonElement){triggerRef.current=trigger;setActive(index);setPopup(true);}
 return <div className={styles.guide}>
  <section className={styles.wheelHero} aria-labelledby="sourcing-story-heading" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setFocused(false);}}>
   <div className={styles.wrap+" "+styles.wheelLayout}>
    <div className={styles.wheelIntro}>
     <h1 id="sourcing-story-heading">How sourcing works</h1>
     <p className={styles.intro}>Choose a product, add it to your cart and let Herocon arrange the rest when our purchasing service launches.</p>
    </div>

    <div className={styles.wheelArea}>
     <div className={styles.wheelBoard} role="group" aria-label="Five steps in Herocon's planned sourcing journey">
      <svg className={styles.wheelTracks} viewBox="0 0 600 600" aria-hidden="true" focusable="false">
       <circle className={styles.wheelTrack} cx="300" cy="300" r="222"/>
       <circle className={styles.wheelInnerTrack} cx="300" cy="300" r="184"/>
       <circle className={styles.wheelProgress} cx="300" cy="300" r="222" pathLength="100" strokeDasharray={(active*20+4)+" 100"}/>
      </svg>
      <div id="wheel-step-description" className={styles.wheelCenter} aria-live={autoRunning?"off":"polite"} aria-atomic="true">
       <div className={styles.centerContent} key={active}>
        <div className={styles.centerCounter}>STEP 0{active+1} / 05</div>
        <JourneyIcon kind={stage.icon} className={styles.centerIcon}/>
        <div className={styles.centerTitle}>{stage.short}</div>
        <div className={styles.centerDescription}>{stage.center}</div>{active>=2&&<span className={styles.centerPlanned}>Coming soon</span>}
       </div>
      </div>
      {stages.map((step,i)=><button key={step.icon} type="button" className={styles.wheelNode}
       style={{left:positions[i].x+"%",top:positions[i].y+"%"}}
       aria-pressed={active===i} aria-label={"Step "+(i+1)+": "+step.label} aria-controls="wheel-step-description"
       onClick={e=>openDetails(i,e.currentTarget)}>
       <span className={styles.nodeDisc}><JourneyIcon kind={step.icon}/></span>
       <span className={styles.nodeLabel}>{step.label}</span>
      </button>)}
     </div>
     <div className={styles.wheelCaptionRow}>
      <p className={styles.wheelCaption}>Select a step for details.</p>
      {!reducedMotion&&<button type="button" className={styles.wheelAutoPause} aria-label={paused?"Resume automatic rotation":"Pause automatic rotation"} title={paused?"Resume automatic rotation":"Pause automatic rotation"} onClick={()=>setPaused(p=>!p)}><PauseGlyph paused={paused}/></button>}
     </div>
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
