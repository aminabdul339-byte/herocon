import Link from "next/link";
import Header from "@/components/Header";
import type {Metadata} from "next";
export const metadata:Metadata={
 title:"How Herocon sourcing works",
 description:"An illustrated guide to finding products, selecting variants and understanding how sourcing and fulfilment will work on Herocon."
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
const steps:{number:string;title:string;description:string;icon:IconName;status:"available"|"coming";hint:string}[]=[
 {number:"01",title:"Discover a product",description:"Browse our collection or paste an original 1688, Taobao or Weidian product link to explore what a supplier offers.",icon:"search",status:"available",hint:"BROWSE & DISCOVER"},
 {number:"02",title:"Explore the options",description:"Review available images, colours, sizes and supplier-reported prices. Compare selections before deciding what works for you.",icon:"swatches",status:"available",hint:"COMPARE & CHOOSE"},
 {number:"03",title:"Save your selections",description:"Choose quantities, keep interesting products in your saved collection, and build a cart you can return to later.",icon:"cart",status:"available",hint:"BUILD YOUR CART"},
 {number:"04",title:"First, pay for your products",description:"The planned first checkout is for products only. We will disclose the estimated later shipping cost before purchase. Live payments are not available yet.",icon:"shield",status:"coming",hint:"PAYMENT COMING SOON"},
 {number:"05",title:"Warehouse, QC and separate shipping",description:"When goods arrive at the warehouse, inspection and final international delivery will be arranged. The customer will review a separate shipping charge and pay it before dispatch. These features are not active yet.",icon:"truck",status:"coming",hint:"FULFILMENT COMING SOON"}
];
const faqs=[
 ["Can I buy directly through Herocon today?","Not yet. You can browse products, choose seller options and add items to your cart. We are testing product checkout, warehouse inspection and a separate shipping payment before activation."],
 ["Is shipping included when I pay for products?","No. In the planned two-payment journey, you pay the product price first and international shipping after the warehouse confirms the parcel. An estimate and the charging method must be disclosed before the initial purchase. Shipping is not currently payable through Herocon."],
 ["Will Herocon cost £9.99 a month?","A £9.99/month membership is being planned, but no membership subscriptions or charges are active. Browsing and saving products remain free for now."],
 ["What do the CNY and GBP prices mean?","CNY is the seller’s listed product price. GBP is an approximate reference conversion—not the final amount payable. Delivery, sourcing services, VAT and any applicable duties are calculated separately."],
 ["Is there a minimum order quantity?","Some listings have a supplier minimum order. The product page displays it when the marketplace provides it, but availability and conditions may change."],
 ["Who helps fulfil orders?","Herocon works with a China-based sourcing and fulfilment partner for supplier data and shipping quotations. Our planned paid-order handoff will help coordinate sellers, shipping and delivery tracking. An order acknowledgement does not confirm payment or completed fulfilment."],
 ["Can I resell products I find on Herocon?","Only where lawful and suitable. Check the product’s safety, materials, authenticity, brand rights and UK import requirements before committing to stock."]
];
export default function HowItWorks(){
 return <main className="hc-guide-premium">
  <Header/>
  <section className="hc-guide-hero">
   <div className="sc-container hc-guide-hero-inner">
    <div><p className="sc-kicker">THE HEROCON WAY</p><h1>From the first idea <em>to the right find.</em></h1><p>Discover products, explore your options and build a sourcing plan—one clear step at a time.</p>
     <div className="hc-guide-hero-actions"><Link href="/search" className="hc-guide-primary-link">Explore products <span aria-hidden="true">↗</span></Link><Link href="/find-product" className="hc-guide-outline-link">Have a product link? <span aria-hidden="true">↗</span></Link></div>
    </div>
    <div className="hc-guide-hero-art" aria-label="Three connected stages: explore, select and create">
     <div className="hc-guide-big-icon"><GuideIcon name="globe" size={78}/></div>
     <div className="hc-guide-orbit hc-guide-orbit-one"><GuideIcon name="search" size={34}/></div>
     <div className="hc-guide-orbit hc-guide-orbit-two"><GuideIcon name="package" size={39}/></div>
     <div className="hc-guide-orbit hc-guide-orbit-three"><GuideIcon name="cart" size={33}/></div>
     <span className="hc-guide-art-caption">A SIMPLER WAY TO SOURCE</span>
    </div>
   </div>
  </section>
  <section className="hc-guide-process sc-container" aria-labelledby="hc-guide-steps-title">
   <div className="hc-guide-section-heading"><div><p className="sc-kicker">HOW IT WORKS · IN FIVE STEPS</p><h2 id="hc-guide-steps-title">Every step, <em>made simple.</em></h2></div><p>Follow the journey from discovery to delivery. Steps marked “Coming soon” aren't available for customer payments yet.</p></div>
   <ol className="hc-guide-timeline">{steps.map((step,index)=><li key={step.number} className="hc-guide-timeline-item">
    <div className="hc-guide-step-visual">
     <div className="hc-guide-step-icon"><GuideIcon name={step.icon}/></div>
     {index<steps.length-1&&<div className="hc-guide-step-connector" aria-hidden="true"><span/><GuideIcon name="arrow" size={22}/></div>}
    </div>
    <div className="hc-guide-step-copy"><div className="hc-guide-step-topline"><span>STEP {step.number} / {step.hint}</span><span className={step.status==="available"?"hc-guide-status-now":"hc-guide-status-soon"}>{step.status==="available"?"Available now":"Coming soon"}</span></div>
     <h3>{step.title}</h3><p>{step.description}</p>
    </div>
   </li>)}</ol>
  </section>
  <section className="hc-guide-partner">
   <div className="sc-container hc-guide-partner-inner">
    <div className="hc-guide-partner-icon"><GuideIcon name="package" size={64}/></div>
    <div><p className="sc-kicker">SOURCING MADE CLEARER</p><h2>We help connect the dots.</h2><p>Our China-based sourcing partner supports product data, shipping estimates and the planned fulfilment journey. Herocon is preparing direct checkout; it is not yet accepting customer payments or placing supplier orders automatically.</p></div>
    <Link href="/start-a-business">Learn about sourcing <span aria-hidden="true">↗</span></Link>
   </div>
  </section>
  <section className="hc-guide-faq sc-container" aria-labelledby="hc-guide-faq-title">
   <div className="hc-guide-section-heading"><div><p className="sc-kicker">QUESTIONS, ANSWERED</p><h2 id="hc-guide-faq-title">Good to <em>know.</em></h2></div><p>Clear answers before you start your sourcing journey.</p></div>
   <div className="sc-faq">{faqs.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div>
   <p className="sc-resource-note">Before reselling, consult official <a href="https://www.gov.uk/import-goods-into-uk" target="_blank" rel="noopener noreferrer">UK import</a> and <a href="https://www.gov.uk/product-safety-for-manufacturers" target="_blank" rel="noopener noreferrer">product-safety</a> guidance.</p>
   <div className="hc-guide-support-line">Still have a question? <Link href="/contact">Contact our support team <span aria-hidden="true">↗</span></Link></div>
  </section>
 </main>;
}
