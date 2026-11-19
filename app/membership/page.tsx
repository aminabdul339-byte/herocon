import Link from "next/link";
import Header from "@/components/Header";
import type {Metadata} from "next";
export const metadata:Metadata={
 title:"Herocon Membership — planned £9.99/month",
 description:"Preview the future Herocon account and membership experience. Membership is not available for purchase yet."
};
const benefits=[
 {mark:"01",title:"A place for all your finds",copy:"Keep saved products, favourite variants, past purchases and future shopping lists together."},
 {mark:"02",title:"Your private warehouse",copy:"Follow goods from the original supplier to BuckyDrop's warehouse. QC photo access will depend on confirmed provider support."},
 {mark:"03",title:"Shipping on your terms",copy:"Review a separate final delivery quote after warehouse checks, then explicitly authorise and pay for international shipping."},
 {mark:"04",title:"One clear account",copy:"View purchases, payments, parcel tracking, membership status and support in one place when account services launch."}
];
export default function MembershipPage(){
 return <main className="hc-member-page">
  <Header/>
  <section className="hc-member-hero">
   <div className="hc-premium-container hc-member-hero-grid">
    <div>
     <p className="hc-premium-kicker">A NEW HEROCON EXPERIENCE / IN DEVELOPMENT</p>
     <h1>Find more.<br/><em>Make it yours.</em></h1>
     <p className="hc-member-lead">Your own account, your own warehouse journey and a simpler way to bring incredible finds home. We're building Herocon Membership around the whole buying experience — not just product discovery.</p>
     <div className="hc-member-links"><Link className="hc-premium-button hc-premium-button-dark" href="/search">Explore products <span aria-hidden="true">↗</span></Link><Link className="hc-member-text-link" href="/how-it-works">How buying will work ↗</Link></div>
     <p className="hc-member-availability"><span aria-hidden="true">●</span> Create a free account to add products to your cart once account registration is connected. No membership payment is due until you decide to buy products. Subscriptions are not yet active.</p>
     <Link className="hc-member-text-link" href="/account">Create free account / Sign in ↗</Link>
    </div>
    <aside className="hc-member-price-card" aria-label="Herocon planned membership price">
     <span className="hc-member-price-eyebrow">HEROCON / FUTURE MEMBERSHIP</span>
     <span className="hc-member-price-name">The member experience.</span>
     <div className="hc-member-price"><strong>£9.99</strong><span>/ month</span></div>
     <p>Only required when you try to purchase products, not when you create a free account or add items to your cart. Membership will be a separate recurring subscription once available.</p>
     <div className="hc-member-preview-state">COMING SOON · NOT PAYABLE</div>
     <ul>
      <li>Browse products for free</li>
      <li>Free customer account and cart (no membership charge)</li>
      <li>Warehouse, QC and order history</li>
      <li>Separate international shipping payments</li>
     </ul>
     <p className="hc-member-fine">Product prices and international shipping are separate from the future membership. Secure account registration is being connected; no recurring billing is active.</p>
    </aside>
   </div>
  </section>
  <section className="hc-member-benefits">
   <div className="hc-premium-container">
    <p className="hc-premium-kicker">MADE FOR CURIOUS SHOPPERS</p>
    <h2>Your future account.<br/><em>Everything in one place.</em></h2>
    <div className="hc-member-benefit-grid">{benefits.map(b=><article key={b.mark}>
     <span>{b.mark} / THE HEROCON WAY</span><h3>{b.title}</h3><p>{b.copy}</p>
    </article>)}</div>
   </div>
  </section>
  <section className="hc-member-steps">
   <div className="hc-premium-container hc-member-steps-inner">
    <div><p className="hc-premium-kicker">HOW MEMBERSHIP WILL WORK</p><h2>Join. Find. <em>Bring it home.</em></h2></div>
    <div className="hc-member-step-list">
     <p><strong>01 — Add to cart → free account.</strong> Shoppers are directed to create a free account or sign in when they add a product. Their selected items are kept for the return to their cart. No membership payment is required.</p>
     <p><strong>02 — Try to buy → membership check.</strong> Only when a shopper attempts a new purchase do we check the £9.99/month subscription. If not active, the membership payment stage will appear once billing is ready.</p>
     <p><strong>03 — Pay for products, then pay for shipping.</strong> You'll see the estimated freight charge before buying; after warehouse receipt and QC, you'll review the actual shipping quote before paying it separately.</p>
     <p><strong>04 — Keep access to your own orders.</strong> If a membership later ends, existing order tracking, QC, shipping payments, support and refunds must remain accessible.</p>
    </div>
   </div>
  </section>
  <section className="hc-member-bottom">
   <div className="hc-premium-container">
    <h2>For now, <em>the collection is open.</em></h2>
    <p>You can explore, save products and build your cart while we finish secure accounts, payments and fulfilment.</p>
    <Link className="hc-premium-button hc-premium-button-dark" href="/search">Discover products <span aria-hidden="true">↗</span></Link>
   </div>
  </section>
 </main>;
}
