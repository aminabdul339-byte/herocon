import Link from "next/link";
import Header from "@/components/Header";
import type {Metadata} from "next";
export const metadata:Metadata={title:"How Herocon sourcing works",description:"Understand product discovery, planned Herocon checkout and BuckyDrop fulfilment."};
const steps=[
 {n:"01",title:"Find your product",body:"Explore our catalogue and review original 1688, Taobao and Weidian listings, photographs and supplier options."},
 {n:"02",title:"Choose seller variants",body:"See seller-reported colours, sizes and stock where available. Prices are shown in Chinese yuan and converted into approximate GBP using a reference exchange rate."},
 {n:"03",title:"Prepare the quantities",body:"Select product variants and quantities. Our current sourcing brief tool helps you plan, but does not submit an order or take payment."},
 {n:"04",title:"Pay on Herocon (coming soon)",body:"We are implementing secure checkout, accurate delivered pricing, order confirmations and cancellations. Until these features are ready, direct payment is not enabled."},
 {n:"05",title:"BuckyDrop fulfilment (planned)",body:"The intended process is for BuckyDrop to purchase items, handle warehouse operations and international shipping, and return parcel tracking to Herocon."}
];
const faqs=[
 ["Can I buy directly through Herocon today?","Not yet. You can browse products, review supplier options and prepare a sourcing brief. We will activate checkout after payment, BuckyDrop order creation, shipping and refund workflows have passed end-to-end tests."],
 ["What do the CNY and GBP prices mean?","CNY is the seller’s listed product price. GBP is an approximate reference conversion—not the final amount payable. Delivery, sourcing services, VAT and any applicable duties are calculated separately."],
 ["Is there a minimum order quantity?","Some listings have a supplier minimum order. The product page displays it when the marketplace provides it, but availability and conditions may change."],
 ["Who fulfils future purchases?","Herocon plans to use BuckyDrop for procurement, warehouse processing and international shipping. We have tested product data access; order and shipping integration are still being developed."],
 ["Can I resell products I find on Herocon?","Only where lawful and suitable. Check the product’s safety, materials, authenticity, brand rights and UK import requirements before committing to stock."]
];
export default function HowItWorks(){return <main className="sc-guide-page"><Header/>
 <section className="sc-page-hero sc-container"><p className="sc-kicker">HOW HEROCON WORKS</p><h1>Find your next product.<br/><em>Know the next step.</em></h1><p>Search seller products, compare CNY prices and approximate GBP equivalents, and build your sourcing plan. Direct checkout with BuckyDrop fulfilment is in development.</p><div className="sc-button-row"><Link className="sc-button sc-button-dark" href="/search">Explore products ↗</Link><Link className="sc-button sc-button-outline" href="/sourcing">Plan a purchase →</Link></div></section>
 <section className="sc-section sc-container"><p className="sc-kicker">FROM DISCOVERY TO DELIVERY</p><h2>Five stages, one platform.</h2><div className="sc-process-list">{steps.map(step=><article className="sc-process-step" key={step.n}><span>{step.n}</span><h3>{step.title}</h3><p>{step.body}</p></article>)}</div></section>
 <section className="sc-section sc-container"><p className="sc-kicker">COMMON QUESTIONS</p><h2>What to know before buying.</h2><div className="sc-faq">{faqs.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div><p className="sc-resource-note">Consult official <a href="https://www.gov.uk/import-goods-into-uk" target="_blank" rel="noopener noreferrer">UK import</a> and <a href="https://www.gov.uk/product-safety-for-manufacturers" target="_blank" rel="noopener noreferrer">product-safety</a> guidance before reselling goods.</p></section>
 </main>;}