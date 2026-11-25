import Link from "next/link";
import {ArrowIcon} from "@/components/ArrowIcon";
import "./membership-plans.css";
const free=["Selected catalogue products","Original marketplace links","Shopping account and cart"];
const premium=["Full Herocon catalogue","Catalogue keyword search","Saved product link lookup"];
const upcoming=["Live marketplace search by link, keyword or image","Herocon purchasing and warehouse delivery"];
function Mark(){return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg>;}
export default function MembershipPlans({member=false,owner=false,standalone=false,signedIn=false}:{member?:boolean;owner?:boolean;standalone?:boolean;signedIn?:boolean}){
 return <section className={"hc-plan-section"+(standalone?" hc-plan-standalone":"")} aria-labelledby="hc-plan-heading" id="membership-plans">
 <div className="hc-plan-heading"><div>{standalone?<h1 id="hc-plan-heading">Membership</h1>:<h2 id="hc-plan-heading">Membership</h2>}</div><p>Explore for free. Upgrade for more.</p></div>
 <div className="hc-plan-grid">
 <article className="hc-plan-card"><div className="hc-plan-top"><h3>Free</h3>{signedIn&&!member&&<span className="hc-plan-current">Your plan</span>}</div><div className="hc-plan-price"><strong>£0</strong><span>/ month</span></div><ul>{free.map(label=><li key={label}><Mark/><span>{label}</span></li>)}</ul><p className="hc-plan-limits">Search, full catalogue and Herocon purchasing are not included.</p><Link className="hc-plan-cta" href={signedIn?"/search":"/account"}>{signedIn?"Browse catalogue":"Join free"} <ArrowIcon direction="right"/></Link></article>
 <article className="hc-plan-card hc-plan-premium"><div className="hc-plan-top"><h3>Premium</h3>{member&&<span className="hc-plan-current">Your plan</span>}</div><div className="hc-plan-price"><strong>£9.99</strong><span>/ month</span></div><ul>{premium.map(label=><li key={label}><Mark/><span>{label}</span></li>)}</ul><div className="hc-plan-upcoming"><span>In rollout</span><ul>{upcoming.map(label=><li key={label}>{label}</li>)}</ul></div><Link className="hc-plan-cta hc-plan-primary" href={member?"/membership/activate":"/membership/activate?next=%2Fsearch"}>{member?"Manage membership":"Join Premium"} <ArrowIcon direction="right"/></Link></article>
 </div>
 {owner&&<p className="hc-plan-owner">Complimentary owner access. No subscription charge.</p>}
 <p className="hc-plan-note">Premium renews monthly until cancelled. Product and delivery charges are separate. Live marketplace search and purchasing are not yet available to public customers. <Link href="/terms-and-conditions">Terms</Link> · <Link href="/membership/activate">Manage or cancel</Link></p>
 </section>;
}
export function PremiumNotice({feature="the full catalogue"}:{feature?:string}){return <div className="hc-plan-gate"><div><strong>Unlock {feature} with Premium</strong><p>Full catalogue access and catalogue keyword search for £9.99/month.</p></div><Link href="/membership">View membership <ArrowIcon direction="right"/></Link></div>;}
