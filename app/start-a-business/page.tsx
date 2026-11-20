import Link from "next/link";
import Header from "@/components/Header";
import type {Metadata} from "next";

export const metadata:Metadata={
 title:"Start a Business — The Founder's Edit",
 description:"Find products, research suppliers, estimate sourcing costs and make a practical plan for your first product business with Herocon."
};

const BUSINESS_PHOTO="https://images.pexels.com/photos/7552578/pexels-photo-7552578.jpeg?auto=compress&cs=tinysrgb&w=1400&q=85";
const WARDROBE_PHOTO="https://images.unsplash.com/photo-1603400521630-9f2de124b33b?auto=format&fit=crop&w=1200&q=85";

const tools=[
 {number:"01",title:"Explore products",description:"Find a niche or compare ideas across the catalogue.",href:"/search"},
 {number:"02",title:"Find a source",description:"Have a supplier URL? Start from the original listing.",href:"/find-product"},
 {number:"03",title:"Estimate your costs",description:"Work out the landed cost before setting a resale price.",href:"/landed-cost"},
 {number:"04",title:"Understand sourcing",description:"Learn what happens now and what comes next.",href:"/how-it-works"}
];
const principles=[
 {number:"01",title:"Discover",description:"Choose a customer, a category and products you genuinely believe in."},
 {number:"02",title:"Validate",description:"Check supplier listings, minimum quantities, samples, safety and real customer demand."},
 {number:"03",title:"Plan",description:"Calculate purchase costs, delivery, taxes and realistic margins before you commit."}
];
const checklist=[
 "Define your audience and a product niche",
 "Look for actual demand and relevant competitors",
 "Check product rules, safety and intellectual-property rights",
 "Research the seller and any minimum order quantities",
 "Ask about samples and available variants",
 "Estimate the full cost, including shipping, duties and fees",
 "Start small, gather feedback and refine your offer"
];

export default function StartBusiness(){
 return <main className="hc-founder">
  <Header/>
  <section className="hc-founder-hero" aria-labelledby="hc-founder-title">
   <div className="hc-founder-container hc-founder-hero-grid">
     <div className="hc-founder-hero-copy">
       <span className="hc-founder-eyebrow">THE FOUNDER&apos;S EDIT / HEROCON 2026</span>
       <h1 id="hc-founder-title">Your next<br/>chapter <em>starts here.</em></h1>
       <p>Every brand begins with a first idea. Explore products, research original suppliers and build a considered sourcing plan — without rushing into a bulk order.</p>
       <div className="hc-founder-hero-actions"><Link className="hc-founder-cta" href="/search">Find products <span aria-hidden="true">↗</span></Link><Link className="hc-founder-quiet-link" href="/landed-cost">Estimate your costs ↗</Link></div>
     </div>
     <div className="hc-founder-photo">
       <img src={BUSINESS_PHOTO} alt="Real photograph of a person carrying an elegant stack of packaged boxes in a neutral indoor setting" width={800} height={1000} fetchPriority="high"/>
       <div className="hc-founder-photo-tag"><span>THE FOUNDER&apos;S EDIT</span><span>02 / SOURCE & BUILD</span></div>
     </div>
   </div>
  </section>
  <div className="hc-founder-trust"><div className="hc-founder-container hc-founder-trust-inner"><span>DISCOVER PRODUCTS</span><span>EXPLORE ORIGINAL SUPPLIERS</span><span>PLAN YOUR FIRST ORDER</span></div></div>

  <section className="hc-founder-section" aria-labelledby="hc-founder-tools-title">
    <div className="hc-founder-container">
      <div className="hc-founder-section-head"><div><span className="hc-founder-eyebrow">01 / YOUR STARTING POINT</span><h2 id="hc-founder-tools-title">The right tools.<br/><em>At the right time.</em></h2></div><p>Turn inspiration into research. Each tool connects to an existing part of Herocon, so you can actually take the next step.</p></div>
      <div className="hc-founder-tools">{tools.map(tool=><Link className="hc-founder-tool" href={tool.href} key={tool.number}><span>{tool.number} / EXPLORE</span><h3>{tool.title}</h3><p>{tool.description}</p><span aria-hidden="true">↗</span></Link>)}</div>
    </div>
  </section>

  <section className="hc-founder-path-section" aria-labelledby="hc-founder-path-title">
    <div className="hc-founder-container">
      <div className="hc-founder-section-head"><div><span className="hc-founder-eyebrow">02 / A THOUGHTFUL BEGINNING</span><h2 id="hc-founder-path-title">Start small.<br/><em>Think bigger.</em></h2></div><p>You don&apos;t need thousands of pounds in inventory to start learning. Focus on proof, not promises.</p></div>
      <div className="hc-founder-steps">{principles.map(step=><article className="hc-founder-step" key={step.number}><span>{step.number} / THE PROCESS</span><h3>{step.title}</h3><p>{step.description}</p></article>)}</div>
    </div>
  </section>

  <section className="hc-founder-section" aria-labelledby="hc-founder-check-title">
    <div className="hc-founder-container hc-founder-list">
      <div className="hc-founder-list-photo"><img src={WARDROBE_PHOTO} alt="Real photograph of neutral garments displayed on clothing rails, suggesting a carefully selected first collection" width={760} height={950} loading="lazy" decoding="async"/></div>
      <div>
        <span className="hc-founder-eyebrow">03 / BEFORE THE FIRST ORDER</span>
        <h2 id="hc-founder-check-title" style={{font:"400 clamp(40px,4.4vw,62px)/1.06 Georgia,serif",letterSpacing:"-.05em",margin:"14px 0 0"}}>A little research.<br/><em style={{color:"#8a9c88"}}>A lot more clarity.</em></h2>
        <ol className="hc-founder-checklist">{checklist.map((item,i)=><li key={item}><span>{String(i+1).padStart(2,"0")}</span>{item}</li>)}</ol>
        <Link href="/landed-cost" className="hc-founder-cta" style={{marginTop:22}}>Calculate a landed cost <span aria-hidden="true">↗</span></Link>
      </div>
    </div>
  </section>

  <section className="hc-founder-note" aria-labelledby="hc-founder-note-title"><div className="hc-founder-container hc-founder-note-grid"><div><span className="hc-founder-eyebrow">BUILD WITH GOOD INFORMATION</span><h2 id="hc-founder-note-title">The idea is yours.<br/><em>The next step is too.</em></h2></div><div><p>Today, Herocon provides product discovery and original marketplace links. Herocon-managed purchasing, warehousing, fulfilment and international shipping checkout are not yet live. Supplier quotes, stock and resale margins need to be confirmed independently before you order.</p><Link href="/how-it-works">Read how sourcing works <span aria-hidden="true">↗</span></Link></div></div></section>
 </main>;
}
