import Link from "next/link";
import Header from "@/components/Header";
import type {Metadata} from "next";

export const metadata:Metadata={
 title:"Herocon Membership — £9.99/month",
 description:"£9.99 monthly early-access membership for Herocon. Product orders and shipping checkout are not yet available."
};

const benefits=[
 "Browse products from Chinese marketplaces",
 "Paste links from 1688, Taobao, Weidian and more",
 "Support ongoing development of product sourcing tools",
 "Manage or cancel your subscription through Stripe"
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
     <p className="hc-membership-lead">Discover products across 1688, Taobao, Weidian and other Chinese marketplaces.</p>
     <p className="hc-membership-intro">Our optional monthly early-access membership supports Herocon during its rollout. Browse the catalogue and explore supplier links now; product ordering, warehouse fulfilment and international shipping checkout are not yet available.</p>
     <div className="hc-membership-ctas">
      <Link className="hc-premium-button hc-premium-button-dark" href="/search">Explore products <span aria-hidden="true">↗</span></Link>
      <Link className="hc-membership-secondary" href="/account">Create a free account ↗</Link>
     </div>
    </div>
    <aside className="hc-membership-price" aria-label="Herocon membership pricing">
     <p>THE MEMBERSHIP</p>
     <div className="hc-membership-amount"><strong>£9.99</strong><span>/ month</span></div>
     <div className="hc-membership-price-rule"/>
     <h2>Herocon early-access membership.</h2>
     <ul>{benefits.map(item=><li key={item}><svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L19 7"/></svg>{item}</li>)}</ul>
     <Link className="hc-membership-price-link" href="/membership/activate">Join for £9.99/month <span aria-hidden="true">↗</span></Link>
     <small>Membership is optional while order checkout is unavailable. £9.99 is charged now and renews monthly until cancelled. The catalogue, account and cart are free; no product orders can currently be placed. Products and shipping are separate charges once launched. Cancel anytime through Stripe: membership ordinarily continues to the end of the paid month, with no next-month charge. Cancellation does not automatically refund unused time; statutory cancellation and refund rights still apply. <Link href="/terms-and-conditions">View terms</Link>.</small>
    </aside>
   </div>
  </section>
  <section className="hc-membership-process">
   <div className="hc-premium-container">
    <div className="hc-membership-process-heading"><p className="hc-premium-kicker">HOW IT WORKS</p><h2>From supplier <em>to doorstep.</em></h2></div>
    <div className="hc-membership-steps">{steps.map(step=><div className="hc-membership-step" key={step.no}>
     <span>{step.no}</span><h3>{step.title}</h3><p>{step.copy}</p>
    </div>)}</div>
    <p className="hc-membership-shipping-note">The sourcing and shipping steps above describe the planned ordering service. Purchasing and delivery payments are not yet live. Product prices, international shipping and applicable taxes or duties will be separate from the membership fee.</p>
   </div>
  </section>
 </main>;
}