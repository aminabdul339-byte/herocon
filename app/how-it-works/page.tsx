import Link from "next/link";
import Header from "@/components/Header";
import type {Metadata} from "next";
export const metadata:Metadata={title:"How Herocon sourcing works",description:"Explore seller products, choose options, and save products to your cart."};
const steps=[
 {n:"01",title:"Find your product",body:"Explore our catalogue and review original 1688, Taobao and Weidian listings, photographs and supplier options."},
 {n:"02",title:"Choose seller variants",body:"See seller-reported colours, sizes and stock where available. Prices are shown in Chinese yuan and converted into approximate GBP using a reference exchange rate."},
 {n:"03",title:"Prepare the quantities",body:"Select product variants and quantities. Our current sourcing brief tool helps you plan, but does not submit an order or take payment."},
 {n:"04",title:"Checkout (coming soon)",body:"Review your cart and product selections. Online payments are not available on Herocon yet."},
 {n:"05",title:"Delivery and tracking",body:"When ordering launches, available shipping costs and delivery information will be displayed before purchase."}
];
const faqs=[
 ["Can I buy directly through Herocon today?","Not yet. You can browse products, review supplier options and prepare a sourcing brief. Checkout is coming soon."],
 ["What do the CNY and GBP prices mean?","CNY is the seller’s listed product price. GBP is an approximate reference conversion—not the final amount payable. Delivery, sourcing services, VAT and any applicable duties are calculated separately."],
 ["Is there a minimum order quantity?","Some listings have a supplier minimum order. The product page displays it when the marketplace provides it, but availability and conditions may change."],
 ["How will shipping work?","Delivery options and costs will be shared before payments become available. No orders can be placed through Herocon yet."],
 ["Can I resell products I find on Herocon?","Only where lawful and suitable. Check the product’s safety, materials, authenticity, brand rights and UK import requirements before committing to stock."]
];
export default function HowItWorks(){return <main className="sc-guide-page"><Header/>
 <section className="sc-page-hero sc-container"><p className="sc-kicker">HOW HEROCON WORKS</p><h1>Find your next product.<br/><em>Know the next step.</em></h1><p>Search seller products, compare CNY prices and approximate GBP equivalents, and build your sourcing plan. Online ordering is coming soon.</p><div className="sc-button-row"><Link className="sc-button sc-button-dark" href="/search">Explore products ↗</Link><Link className="sc-button sc-button-outline" href="/sourcing">Plan a purchase →</Link></div></section>
 <section className="sc-section sc-container"><p className="sc-kicker">FROM DISCOVERY TO DELIVERY</p><h2>Five stages, one platform.</h2><div className="sc-process-list">{steps.map(step=><article className="sc-process-step" key={step.n}><span>{step.n}</span><h3>{step.title}</h3><p>{step.body}</p></article>)}</div></section>
 <section className="sc-section sc-container"><p className="sc-kicker">COMMON QUESTIONS</p><h2>What to know before buying.</h2><div className="sc-faq">{faqs.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div><p className="sc-resource-note">Consult official <a href="https://www.gov.uk/import-goods-into-uk" target="_blank" rel="noopener noreferrer">UK import</a> and <a href="https://www.gov.uk/product-safety-for-manufacturers" target="_blank" rel="noopener noreferrer">product-safety</a> guidance before reselling goods.</p></section>
 </main>;}