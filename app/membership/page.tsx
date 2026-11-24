import {ArrowIcon} from "@/components/ArrowIcon";
import Link from "next/link";
import Header from "@/components/Header";
import type {Metadata} from "next";
import {currentCustomer} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";

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

export default async function MembershipPage(){
 const ownerPremium=isOwnerPremiumCustomer(await currentCustomer());
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
      <Link className="hc-premium-button hc-premium-button-dark" href="/search">Explore products <span aria-hidden="true"><ArrowIcon/></span></Link>
      <Link className="hc-membership-secondary" href="/account">Create a free account <ArrowIcon/></Link>
     </div>
    </div>
    {ownerPremium?<aside className="hc-membership-price" aria-label="Complimentary owner premium membership">
     <p>OWNER PREMIUM / COMPLIMENTARY</p>
     <div className="hc-membership-amount"><strong>£0</strong><span>/ month</span></div>
     <div className="hc-membership-price-rule"/>
     <h2>Your Premium access is active.</h2>
     <p style={{fontSize:14,lineHeight:1.9,letterSpacing:0,color:"#eef5ee",margin:"16px 0 25px"}}>
      Your verified Herocon owner account has complimentary Premium privileges with no new subscription charge. Owner-only buying is in a protected pilot while real order processing and shipping are being validated.
     </p>
     <Link className="hc-membership-price-link" href="/pilot/buckydrop">Open owner-only Buy Now <span aria-hidden="true"><ArrowIcon/></span></Link>
     <small>You will not be asked to subscribe for £9.99 to use owner Premium. If you already have a paid subscription, manage or cancel it separately in <Link href="/membership/activate">Membership settings</Link>.</small>
    </aside>:<aside className="hc-membership-price" aria-label="Herocon membership pricing">
     <p>THE MEMBERSHIP</p>
     <div className="hc-membership-amount"><strong>£9.99</strong><span>/ month</span></div>
     <div className="hc-membership-price-rule"/>
     <h2>Herocon early-access membership.</h2>
     <ul>{benefits.map(item=><li key={item}><svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L19 7"/></svg>{item}</li>)}</ul>
     <Link className="hc-membership-price-link" href="/membership/activate">Join for £9.99/month <span aria-hidden="true"><ArrowIcon/></span></Link>
     <small>Membership is optional while order checkout is unavailable. £9.99 is charged now and renews monthly until cancelled. The catalogue, account and cart are free; no product orders can currently be placed. Products and shipping are separate charges once launched. Cancel anytime through Stripe: membership ordinarily continues to the end of the paid month, with no next-month charge. Cancellation does not automatically refund unused time; statutory cancellation and refund rights still apply. <Link href="/terms-and-conditions">View terms</Link>.</small>
    </aside>}
   </div>
  </section>
 </main>;
}