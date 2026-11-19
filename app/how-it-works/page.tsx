import Link from "next/link";
import Header from "@/components/Header";
import type {Metadata} from "next";
export const metadata:Metadata={
 title:"How Herocon sourcing works",
 description:"Find marketplace products and follow supplier links. Learn about planned sourcing and international shipping."
};
type IconName="search"|"swatches"|"cart"|"shield"|"truck"|"globe"|"package"|"arrow";
function GuideIcon({name,size=35}:{name:IconName;size?:number}){
 const paths:Record<IconName,React.ReactNode>={
  search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5.5 5.5"/><path d="M8 10.5h5M10.5 8v5"/></>,
  swatches:<><rect x="3.5" y="3.5" width="12.5" height="17" rx="2" transform="rotate(-9 9.75 12)"/><path d="m12.5 20.5 4.7-2.4a2.5 2.5 0 0 0 1.3-2.2V7"/><circle cx="9" cy="16" r="1"/></>,
  cart:<><circle cx="9" cy="20" r="1.4"/><circle cx="19" cy="20" r="1.4"/><path d="M2 3.5h2.4l2.4 12.4h12l2.2-9H5.2"/></>,
  shield:<><path d="m12 2 8 4v6.1c0 5.3-3.5 8.8-8 10-4.5-1.2-8-4.7-8-10V6z"/><path d="m8.5 12 2.4 2.5 4.8-5.2"/></>,
  truck:<><path d="M2 5h12v12H2zM14 9h4l4 4v4h-8z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>,
  globe:<><circle cx="12" cy="12" r="9"/><path d="M3.5 12h17M12 3c-3 3-3 15 0 18M12 3c3 3 3 15 0 18"/></>,
  package:<><path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10M7.5 4.5l9 5"/></>,
  arrow:<><path d="M4 12h16m-7-7 7 7-7 7"/></>
 };
 return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
const steps:{number:string;title:string;description:string;icon:IconName;hint:string}[]=[
 {number:"01",title:"Find your product",description:"Browse the catalogue or paste a link from 1688, Taobao, Weidian or another supported marketplace.",icon:"search",hint:"BROWSE"},
 {number:"02",title:"Add to cart",description:"Choose your options and create a free account to keep your cart.",icon:"cart",hint:"SELECT"},
 {number:"03",title:"Visit the supplier",description:"Follow the original marketplace link or use an available buying agent. Transactions outside Herocon are handled by those independent services.",icon:"shield",hint:"SOURCE"},
 {number:"04",title:"Warehouse sourcing (planned)",description:"Once full ordering launches, our sourcing partner will purchase approved items and store them in its warehouse in China.",icon:"package",hint:"PLANNED"},
 {number:"05",title:"Shipping (planned)",description:"When the delivery flow launches, international shipping will be quoted and paid separately before parcels are dispatched.",icon:"truck",hint:"PLANNED"}
];
const faqs=[
 ["Where can I source products?","Browse 1688, Taobao, Weidian and other supported Chinese marketplaces, or paste a product link."],
 ["Is an account free?","Yes. Create an account and add products to your cart without paying for membership."],
 ["When do I need membership?","The optional £9.99/month early-access membership can be bought today through Stripe. You do not need it to browse or save products. Product purchasing through Herocon is not yet available."],
 ["When do I pay for delivery?","When product ordering launches, international shipping will be separately quoted and payable after warehouse receipt; there is no live shipping payment today."],
 ["What does the sourcing partner do?","BuckyDrop provides purchasing, warehousing and international delivery services. Herocon has not yet activated the customer payment, warehouse-release or dispatch flow."],
 ["Are listed prices final?","No. Listed prices are references. Shipping, applicable taxes and other charges are separate."]
];
export default function HowItWorks(){
 return <main className="hc-guide-premium">
  <Header/>
  <section className="hc-guide-hero">
   <div className="sc-container hc-guide-hero-inner">
    <div><p className="sc-kicker">HOW IT WORKS</p><h1>From China<br/><em>to your door.</em></h1><p>Browse products and follow supplier links today. See how Herocon sourcing, warehousing and delivery are planned to work when checkout launches.</p>
     <div className="hc-guide-hero-actions"><Link href="/search" className="hc-guide-primary-link">Browse products <span aria-hidden="true">↗</span></Link><Link href="/find-product" className="hc-guide-outline-link">Paste a product link <span aria-hidden="true">↗</span></Link></div>
    </div>
    <div className="hc-guide-hero-art" aria-label="Product sourcing and delivery">
     <div className="hc-guide-big-icon"><GuideIcon name="globe" size={78}/></div>
     <div className="hc-guide-orbit hc-guide-orbit-one"><GuideIcon name="search" size={34}/></div>
     <div className="hc-guide-orbit hc-guide-orbit-two"><GuideIcon name="package" size={39}/></div>
     <div className="hc-guide-orbit hc-guide-orbit-three"><GuideIcon name="truck" size={33}/></div>
     <span className="hc-guide-art-caption">SOURCE · STORE · SHIP</span>
    </div>
   </div>
  </section>
  <section className="hc-guide-process sc-container" aria-labelledby="hc-guide-steps-title">
   <div className="hc-guide-section-heading"><div><p className="sc-kicker">FIVE SIMPLE STEPS</p><h2 id="hc-guide-steps-title">Your order, <em>made simple.</em></h2></div></div>
   <ol className="hc-guide-timeline">{steps.map((step,index)=><li key={step.number} className="hc-guide-timeline-item">
    <div className="hc-guide-step-visual">
     <div className="hc-guide-step-icon"><GuideIcon name={step.icon}/></div>
     {index<steps.length-1&&<div className="hc-guide-step-connector" aria-hidden="true"><span/><GuideIcon name="arrow" size={22}/></div>}
    </div>
    <div className="hc-guide-step-copy"><div className="hc-guide-step-topline"><span>STEP {step.number} / {step.hint}</span></div>
     <h3>{step.title}</h3><p>{step.description}</p>
    </div>
   </li>)}</ol>
   <p className="sc-resource-note"><strong>Current service:</strong> catalogue, link search, free account, cart and supplier links. <strong>Coming later:</strong> product payment, supplier procurement, warehouse storage, and separate international shipping payment.</p>
  </section>
  <section className="hc-guide-partner">
   <div className="sc-container hc-guide-partner-inner">
    <div className="hc-guide-partner-icon"><GuideIcon name="package" size={64}/></div>
    <div><p className="sc-kicker">SOURCING PARTNER</p><h2>Supplier to doorstep.</h2><p>Our planned checkout connects to BuckyDrop purchasing, warehouse storage and delivery once those services are tested and available.</p></div>
    <Link href="/membership">View membership <span aria-hidden="true">↗</span></Link>
   </div>
  </section>
  <section className="hc-guide-faq sc-container" aria-labelledby="hc-guide-faq-title">
   <div className="hc-guide-section-heading"><div><p className="sc-kicker">THE DETAILS</p><h2 id="hc-guide-faq-title">Frequently asked <em>questions.</em></h2></div></div>
   <div className="sc-faq">{faqs.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div>
   <p className="sc-resource-note">For resale, check applicable <a href="https://www.gov.uk/import-goods-into-uk" target="_blank" rel="noopener noreferrer">import</a> and <a href="https://www.gov.uk/product-safety-for-manufacturers" target="_blank" rel="noopener noreferrer">product-safety</a> requirements.</p>
   <div className="hc-guide-support-line">Questions? <Link href="/contact">Contact support <span aria-hidden="true">↗</span></Link></div>
  </section>
 </main>;
}
