"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {ArrowIcon} from "@/components/ArrowIcon";
import styles from "./sourcing-story.module.css";

// Match the wheel's dimensional, illustrated objects without changing the delivery copy.
function Outline({kind}:{kind:"shop"|"warehouse"|"truck"|"home"}){
 const ink="#284b36",green="#789a7a",sage="#c3d6bb",cream="#fff9e9",gold="#c8aa73",shade="#52765a";
 return <svg viewBox="0 0 96 86" fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
  <ellipse cx="48" cy="77" rx="35" ry="4.5" fill={ink} opacity=".12" stroke="none"/>
  {kind==="shop"?<>
   <path d="m14 29 12-12 43 3 12 9v42l-13 6-54-7Z" fill={shade}/>
   <path d="M14 29h54v48l-54-7Z" fill={cream}/>
   <path d="m68 29 13-8v50l-13 6Z" fill={green}/>
   <path d="m10 29 12-18 51 4 12 14-14 10-61-3Z" fill={sage}/>
   <path d="m10 29 12-18 11 1-7 18Zm31-16 10 1 4 17-15-1Zm21 2 11 0 12 14-15 3Z" fill={green}/>
   <path d="M10 29v7q0 9 8 9 7 0 9-8 6 9 14 1 8 9 15 0 8 10 15 1v-7Z" fill={cream}/>
   <path d="m10 29 17 1v8q-3 10-12 6-5-2-5-8Zm30 1 16 1v7q-8 9-16-1Z" fill={green}/>
   <rect x="21" y="48" width="23" height="14" rx="2" fill={sage}/><path d="M32 49v12" stroke={green}/>
   <path d="M50 74V48h12v27Z" fill={gold}/><path d="M57 62h2" stroke={ink}/>
  </>:kind==="warehouse"?<>
   <path d="m10 31 32-18 42 19v40l-42 7-32-10Z" fill={shade}/>
   <path d="m10 31 32-18 30 20v43l-30 3-32-10Z" fill={cream}/>
   <path d="m72 33 12-1v40l-12 4Z" fill={green}/>
   <path d="m7 32 35-23 45 21-15 9-30-17-29 18Z" fill={green}/>
   <path d="M42 9 87 30l-15 9-30-17Z" fill={sage}/>
   <path d="M20 70V44h43v32Z" fill={sage}/><path d="M21 51h41m-41 8h41m-41 8h41" stroke={green}/>
   <path d="m27 60 11-4 9 4-11 5Z" fill={cream}/><path d="M27 60v11l9 3v-9Z" fill={gold}/><path d="m36 65 11-5v11l-11 3Z" fill={green}/>
   <path d="m48 62 10-4 9 4-10 4Z" fill={cream}/><path d="M48 62v11l9 3V66Z" fill={gold}/><path d="m57 66 10-4v11l-10 3Z" fill={green}/>
  </>:kind==="truck"?<>
   <path d="M8 24 20 14l42 4 9 10-12 9-51-3Z" fill={sage}/>
   <path d="M8 24h51v40H8Z" fill={cream}/>
   <path d="m59 24 12-6v36l-12 10Z" fill={green}/>
   <path d="M59 36h17l13 15v13H59Z" fill={sage}/>
   <path d="m76 36 8-5 10 14v15l-5 4V51Z" fill={shade}/>
   <path d="M64 41h10l9 11H64Z" fill={cream}/>
   <path d="M16 36h29m-29 8h21" stroke={green} strokeWidth="3"/>
   <path d="m21 52 7-4 8 4-8 4Z" fill={gold}/><path d="M21 52v8l7 4v-8Zm7 4 8-4v8l-8 4Z" fill={gold}/>
   <circle cx="24" cy="66" r="9" fill={ink}/><circle cx="24" cy="66" r="3.5" fill={cream} stroke="none"/>
   <circle cx="76" cy="66" r="9" fill={ink}/><circle cx="76" cy="66" r="3.5" fill={cream} stroke="none"/>
   <path d="M3 39h9M3 48h6" stroke={green} strokeWidth="3"/>
  </>:<>
   <path d="m15 32 33-19 33 19v38l-33 9-33-11Z" fill={green}/>
   <path d="M15 32 48 48v31L15 68Z" fill={sage}/><path d="m48 48 33-16v38l-33 9Z" fill={green}/>
   <path d="M8 33 46 6l42 25-7 10L46 18 15 43Z" fill={ink}/><path d="m46 6 42 25-7 10-35-23Z" fill={shade}/>
   <path d="m16 42 30-24 2 30Z" fill={cream} stroke="none"/>
   <path d="m25 47 12 5v10l-12-5Z" fill={cream}/><path d="M31 50v10" stroke={green}/>
   <path d="m53 76 13-5V50l-13 6Z" fill={gold}/><path d="m60 63 2-1" stroke={ink}/>
   <path d="m69 45 7-4v10l-7 4Z" fill={cream}/>
   <path d="m73 66 10-5 10 5-10 6Z" fill={cream}/><path d="M73 66v10l10 6V72Z" fill={gold}/><path d="m83 72 10-6v10l-10 6Z" fill={sage}/>
  </>}
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
type Stage={label:string;short:string;center:string;icon:JourneyIcon};
const stages:Stage[]=[
 {label:"Find a product",short:"Find a product",center:"Browse our catalogue or paste your own product link.",icon:"find"},
 {label:"Add to cart",short:"Add to cart",center:"Select your colour, size and quantity.",icon:"cart"},
 {label:"Pay Herocon",short:"Pay Herocon",center:"One checkout. Pay us, not the supplier.",icon:"pay"},
 {label:"We source it",short:"We source it",center:"Our agent buys your items in China.",icon:"source"},
 {label:"Delivered to you",short:"Delivered to you",center:"Our partner ships your parcel to your door.",icon:"deliver"}
];
const positions=[{x:50,y:15},{x:83.29,y:39.18},{x:70.57,y:78.32},{x:29.43,y:78.32},{x:16.71,y:39.18}];

export default function SourcingGuide(){
 const [active,setActive]=useState(0);
 const [paused,setPaused]=useState(false);
 const [hovered,setHovered]=useState(false);
 const [focused,setFocused]=useState(false);
 const [reducedMotion,setReducedMotion]=useState(false);
 const [visible,setVisible]=useState(true);
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
 const autoRunning=!paused&&!hovered&&!focused&&!reducedMotion&&visible;
 useEffect(()=>{
  if(!autoRunning)return;
  const timer=window.setTimeout(()=>setActive(index=>(index+1)%stages.length),3000);
  return()=>window.clearTimeout(timer);
 },[active,autoRunning]);
 return <div className={styles.guide}>
  <section className={styles.wheelHero} aria-labelledby="sourcing-story-heading" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setFocused(false);}}>
   <div className={styles.wrap+" "+styles.wheelLayout}>
    <div className={styles.wheelIntro}>
     <p className={styles.overline}>THE HEROCON EXPERIENCE</p>
     <h1 id="sourcing-story-heading">How sourcing <em>works.</em></h1>
     <p className={styles.intro}>Choose a product, add it to your cart and let Herocon arrange the rest when our purchasing service launches.</p>
     <div className={styles.heroActions}><Link href="/search" className={styles.primary}>Explore products <ArrowIcon direction="right"/></Link><Link href="/find-product" className={styles.secondary}>Paste a product link</Link></div>
     <div className={styles.heroAvailability}><span aria-hidden="true"/><p>Explore and build your cart today. Integrated purchasing and delivery are coming soon.</p></div>
    </div>

    <div className={styles.wheelArea}>
     <div className={styles.wheelPanel}>
     <div className={styles.wheelPanelHeader}><span>THE SOURCING JOURNEY</span><span>01 — 05</span></div>
     <div className={styles.wheelBoard} role="group" aria-label="Five steps in Herocon's planned sourcing journey">
      <svg className={styles.wheelTracks} viewBox="0 0 600 600" aria-hidden="true" focusable="false">
       <circle className={styles.wheelTrack} cx="300" cy="300" r="210"/>
       <circle className={styles.wheelInnerTrack} cx="300" cy="300" r="178"/>
       <circle className={styles.wheelProgress} cx="300" cy="300" r="210" pathLength="100" strokeDasharray={(active*20+4)+" 100"}/>
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
       onClick={()=>setActive(i)}>
       <span className={styles.nodeDisc}><JourneyIcon kind={step.icon}/><span className={styles.nodeNumber} aria-hidden="true">0{i+1}</span></span>
       <span className={styles.nodeLabel}>{step.label}</span>
      </button>)}
     </div>
     <div className={styles.wheelCaptionRow}>
      <p className={styles.wheelCaption}>Select a step to explore</p>
      {!reducedMotion&&<button type="button" className={styles.wheelAutoPause} aria-label={paused?"Resume automatic rotation":"Pause automatic rotation"} title={paused?"Resume automatic rotation":"Pause automatic rotation"} onClick={()=>setPaused(p=>!p)}><PauseGlyph paused={paused}/></button>}
     </div>
     </div>
    </div>

   </div>
  </section>
  <section className={styles.delivery} aria-labelledby="delivery-story-heading">
   <div className={styles.wrap}>
    <div className={styles.deliveryHead}>
     <div><p className={styles.overline}>The planned delivery journey</p><h2 id="delivery-story-heading">From China, <em>to you.</em></h2></div>
     <p>We're building integrated Herocon purchasing and delivery. The intended journey is a partner purchasing from the seller, receiving the goods in China and arranging international shipping to you.</p>
    </div>
    <div className={styles.flightJourney} aria-hidden="true">
     <svg className={styles.flightPath} viewBox="0 0 800 185" fill="none" focusable="false">
      <path d="M54 153 C240 -30 560 -30 746 153" stroke="currentColor" strokeWidth="1.6" strokeDasharray="5 9" strokeLinecap="round"/>
      <circle cx="54" cy="153" r="12" stroke="#b4c8ae" strokeOpacity=".45"/><circle cx="54" cy="153" r="4.5" fill="#f0e8d5"/>
      <circle cx="746" cy="153" r="12" stroke="#b4c8ae" strokeOpacity=".45"/><circle cx="746" cy="153" r="4.5" fill="#f0e8d5"/>
      <g transform="translate(400 16) rotate(0)">
       <path d="M-32 -4H-6L5 -25H12L7 -4H29Q37 0 29 4H7L12 25H5L-6 4H-25L-32 13H-37L-33 0L-37 -13H-32Z" fill="#f0e8d5" stroke="#294633" strokeWidth="1.4" strokeLinejoin="round"/>
      </g>
     </svg>
     <div className={styles.flightEndpoints}>
      <div><span>China</span><small>Origin</small></div>
      <div><span>Your home</span><small>Destination</small></div>
     </div>
    </div>
    <ol className={styles.deliveryStages} aria-label="Planned delivery journey">
     <li><span className={styles.routeIcon}><Outline kind="shop"/></span><span className={styles.routeStep}>01</span><strong>Marketplace supplier</strong></li>
     <li><span className={styles.routeIcon}><Outline kind="warehouse"/></span><span className={styles.routeStep}>02</span><strong>Warehouse in China</strong></li>
     <li><span className={styles.routeIcon}><svg viewBox="0 0 96 86" fill="none" aria-hidden="true" focusable="false"><path d="M12 39h25L51 13h10l-8 26h25q8 0 8 5t-8 5H53l8 24H51L37 49H20l-7 11H7l5-16-5-16h6Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"/><path d="M13 18h20M5 26h17M17 67h20" stroke="currentColor" strokeOpacity=".6" strokeWidth="2" strokeLinecap="round"/></svg></span><span className={styles.routeStep}>03</span><strong>International shipping</strong></li>
     <li><span className={styles.routeIcon}><Outline kind="home"/></span><span className={styles.routeStep}>04</span><strong>Your doorstep</strong></li>
    </ol>
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
