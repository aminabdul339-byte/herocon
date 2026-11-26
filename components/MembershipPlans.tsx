import Link from "next/link";
import {ArrowIcon} from "@/components/ArrowIcon";
import "./membership-plans.css";
const free=["Curated catalogue preview and keyword search","Original marketplace links","Saved products, collections and cart","3 successful saved link lookups per calendar month","3 introductory live requests with a verified account"];
const premium=["Full Herocon catalogue and keyword search","Unlimited saved link lookups","Up to 50 new live marketplace requests per month","Live 1688 keyword and image search","Supplier comparisons and profit calculator"];
const upcoming=["Herocon purchasing and warehouse delivery"];
function Mark(){return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg>;}
export default function MembershipPlans({member=false,owner=false,standalone=false,signedIn=false,trialEndsAt=null}:{member?:boolean;owner?:boolean;standalone?:boolean;signedIn?:boolean;trialEndsAt?:string|null}){
 return <section className={"hc-plan-section"+(standalone?" hc-plan-standalone":"")} aria-labelledby="hc-plan-heading" id="membership-plans">
 <div className="hc-plan-heading"><div>{standalone?<h1 id="hc-plan-heading">Membership</h1>:<h2 id="hc-plan-heading">Membership</h2>}</div><p>Explore for free. Upgrade whenever you need more sourcing tools.</p></div>
 <div className="hc-plan-grid">
 <article className="hc-plan-card"><div className="hc-plan-top"><h3>Free</h3>{signedIn&&!member&&<span className="hc-plan-current">Your plan</span>}</div><div className="hc-plan-price"><strong>£0</strong><span>/ month</span></div><ul>{free.map(label=><li key={label}><Mark/><span>{label}</span></li>)}</ul><p className="hc-plan-limits">Full catalogue requires Premium. Live requests are subject to shared availability; cached results do not use credits.</p><Link className="hc-plan-cta" href={signedIn?"/search":"/account?next=%2Fsearch"}>{signedIn?"Browse catalogue":"Join free"} <ArrowIcon direction="right"/></Link></article>
 <article className="hc-plan-card hc-plan-premium"><div className="hc-plan-top"><h3>Premium</h3>{member&&<span className="hc-plan-current">{trialEndsAt?"Promotional access":"Your plan"}</span>}</div><div className="hc-plan-price"><strong>£9.99</strong><span>/ month</span></div><ul>{premium.map(label=><li key={label}><Mark/><span>{label}</span></li>)}</ul><div className="hc-plan-upcoming"><span>In rollout</span><ul>{upcoming.map(label=><li key={label}>{label}</li>)}</ul></div><Link className="hc-plan-cta hc-plan-primary" href={trialEndsAt?"/membership/trial":member?"/membership/activate":"/membership/activate?next=%2Fsearch"}>{trialEndsAt?"View existing access":member?"Manage membership":"Join Premium"} <ArrowIcon direction="right"/></Link></article>
 </div>
 {trialEndsAt&&<p className="hc-plan-owner">Your existing promotional access ends {new Date(trialEndsAt).toLocaleDateString("en-GB",{timeZone:"Europe/London"})}. No automatic renewal.</p>}
 {owner&&<p className="hc-plan-owner">Complimentary owner access. No subscription charge.</p>}
 <p className="hc-plan-note">Premium renews monthly until cancelled. Product and delivery charges are separate. Live 1688 searches are subject to plan limits and shared provider availability. Purchasing is not yet available to public customers. <Link href="/terms-and-conditions">Terms</Link> · <Link href="/membership/activate">Manage or cancel</Link></p>
 </section>;
}
export function PremiumNotice({feature="the full catalogue"}:{feature?:string}){return <div className="hc-plan-gate"><div><strong>Unlock {feature} with Premium</strong><p>Full catalogue and more sourcing tools for £9.99/month.</p></div><Link href="/membership">View membership <ArrowIcon direction="right"/></Link></div>;}
