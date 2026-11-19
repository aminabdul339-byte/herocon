import Link from "next/link";
import Header from "@/components/Header";
import type {Metadata} from "next";

export const metadata:Metadata={
 title:"Herocon Membership — £9.99/month",
 description:"Full sourcing access for £9.99 a month. Browse products and source from 1688, Taobao, Weidian and other supported Chinese marketplaces."
};

const benefits=[
 "Browse products from Chinese marketplaces",
 "Paste links from 1688, Taobao, Weidian and more",
 "Purchase through our sourcing partner",
 "Warehouse storage and international delivery"
];
const steps=[
 {no:"01",title:"Find your product",copy:"Browse the catalogue or paste a supplier link."},
 {no:"02",title:"Pay for your items",copy:"Choose your options and place your order."},
 {no:"03",title:"We source it",copy:"Our partner buys your items and stores them at its warehouse in China."},
 {no:"04",title:"Pay shipping",copy:"Pay the confirmed international shipping cost and receive your parcel."}
];

export default function MembershipPage(){
 return <main className="hc-member-page hc-membership-clean">
  <Header/>
  <section className="hc-membership-hero">
   <div className="hc-premium-container hc-membership-layout">
    <div className="hc-membership-copy">
     <p className="hc-premium-kicker">HEROCON MEMBERSHIP</p>
     <h1>Sourcing from China.<br/><em>Made simple.</em></h1>
     <p className="hc-membership-lead">Full sourcing access across 1688, Taobao, Weidian and other supported Chinese marketplaces.</p>
     <p className="hc-membership-intro">Discover products, paste supplier links and order through our sourcing partner. Your items are purchased and held at the warehouse in China until you pay for international shipping.</p>
     <div className="hc-membership-ctas">
      <Link className="hc-premium-button hc-premium-button-dark" href="/search">Explore products <span aria-hidden="true">↗</span></Link>
      <Link className="hc-membership-secondary" href="/account">Create a free account ↗</Link>
     </div>
    </div>
    <aside className="hc-membership-price" aria-label="Herocon membership pricing">
     <p>THE MEMBERSHIP</p>
     <div className="hc-membership-amount"><strong>£9.99</strong><span>/ month</span></div>
     <div className="hc-membership-price-rule"/>
     <h2>Full sourcing access.</h2>
     <ul>{benefits.map(item=><li key={item}><span aria-hidden="true">✓</span>{item}</li>)}</ul>
     <Link className="hc-membership-price-link" href="/account">Create your free account <span aria-hidden="true">↗</span></Link>
     <small>Membership is required when purchasing, not for creating an account or adding to cart. Subscription payments are not yet available.</small>
    </aside>
   </div>
  </section>
  <section className="hc-membership-process">
   <div className="hc-premium-container">
    <div className="hc-membership-process-heading"><p className="hc-premium-kicker">HOW IT WORKS</p><h2>From supplier <em>to doorstep.</em></h2></div>
    <div className="hc-membership-steps">{steps.map(step=><div className="hc-membership-step" key={step.no}>
     <span>{step.no}</span><h3>{step.title}</h3><p>{step.copy}</p>
    </div>)}</div>
    <p className="hc-membership-shipping-note">Product prices, international shipping and applicable taxes or duties are separate from the membership fee. Shipping is quoted separately before dispatch.</p>
   </div>
  </section>
 </main>;
}