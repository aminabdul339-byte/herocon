import Link from "next/link";
import Header from "@/components/Header";
import type {Metadata} from "next";
export const metadata:Metadata={title:"How Herocon sourcing works",description:"Explore products, select seller options, and learn how our partner in China supports order fulfilment."};
const steps=[
 {n:"01",title:"Find your product",body:"Explore our catalogue and review original 1688, Taobao and Weidian listings, photographs and supplier options."},
 {n:"02",title:"Choose seller variants",body:"See seller-reported colours, sizes and stock where available. Prices are shown in Chinese yuan and converted into approximate GBP using a reference exchange rate."},
 {n:"03",title:"Add products to your cart",body:"Choose the colours, sizes and quantities you want, then keep your selected products in your Herocon cart."},
 {n:"04",title:"Secure payment and order confirmation (coming soon)",body:"After checkout and verified payment are introduced, Herocon will confirm the selected seller SKUs and submit the paid order to our China fulfilment partner."},
 {n:"05",title:"Fulfilment and tracking",body:"The China fulfilment partner coordinates purchasing and delivery. Customers will be able to view their order and parcel statuses using a private Herocon tracking code once ordering is launched."}
];
const faqs=[
 ["Can I buy directly through Herocon today?","Not yet. You can browse products, choose seller options and add items to your cart. Checkout is coming soon."],
 ["What do the CNY and GBP prices mean?","CNY is the seller’s listed product price. GBP is an approximate reference conversion—not the final amount payable. Delivery, sourcing services, VAT and any applicable duties are calculated separately."],
 ["Is there a minimum order quantity?","Some listings have a supplier minimum order. The product page displays it when the marketplace provides it, but availability and conditions may change."],
 ["Who helps fulfil orders?","Herocon works with a China-based sourcing and fulfilment partner for supplier data and shipping quotations. Our planned paid-order handoff will help coordinate sellers, shipping and delivery tracking. An order acknowledgement does not confirm payment or completed fulfilment."],
 ["Can I resell products I find on Herocon?","Only where lawful and suitable. Check the product’s safety, materials, authenticity, brand rights and UK import requirements before committing to stock."]
];
export default function HowItWorks(){return <main className="sc-guide-page"><Header/>
 <section className="sc-page-hero sc-container"><p className="sc-kicker">HOW HEROCON WORKS</p><h1>Find your next product.<br/><em>Know the next step.</em></h1><p>Search seller products, compare CNY prices and approximate GBP equivalents, and build your sourcing plan. Our partner in China supports order fulfilment. Online ordering on Herocon is coming soon.</p><div className="sc-button-row"><Link className="sc-button sc-button-dark" href="/search">Explore products ↗</Link><Link className="sc-button sc-button-outline" href="/cart">View your cart →</Link></div></section>
 <section className="sc-section sc-container"><p className="sc-kicker">FROM DISCOVERY TO DELIVERY</p><h2>Five stages, one platform.</h2><div className="sc-process-list">{steps.map(step=><article className="sc-process-step" key={step.n}><span>{step.n}</span><h3>{step.title}</h3><p>{step.body}</p></article>)}</div></section>
 <section className="sc-section sc-container"><p className="sc-kicker">OUR PARTNER IN CHINA</p><h2>Support from the seller to delivery.</h2><p>Herocon works with a partner based in China who helps with order fulfilment and coordination with marketplace sellers. The partner supports the journey from finding a supplier to arranging international shipping. Once Herocon checkout is available, customers will see delivery options and costs before paying.</p></section>
 <section className="sc-section sc-container"><p className="sc-kicker">COMMON QUESTIONS</p><h2>What to know before buying.</h2><div className="sc-faq">{faqs.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div><p className="sc-resource-note">Consult official <a href="https://www.gov.uk/import-goods-into-uk" target="_blank" rel="noopener noreferrer">UK import</a> and <a href="https://www.gov.uk/product-safety-for-manufacturers" target="_blank" rel="noopener noreferrer">product-safety</a> guidance before reselling goods.</p></section>
 </main>;}