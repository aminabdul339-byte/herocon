import Link from "next/link";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import Header from "@/components/Header";
import {ArrowIcon} from "@/components/ArrowIcon";
import {catalogueAccess} from "@/lib/catalogue-access";
import PendingTrialVerification from "@/components/PendingTrialVerification";
import "@/components/membership-plans.css";
export const dynamic="force-dynamic";
export default async function LegacyTrialPage(){
 const {customer,trialEndsAt}=await catalogueAccess();
 const pending=(await cookies()).get("__Host-hc-trial-signup")?.value;
 if(!trialEndsAt&&!(!customer&&pending))redirect("/membership");
 return <main className="hc-member-page hc-membership-clean"><Header/><section className="hc-billing-shell"><Link href="/membership" className="hc-billing-back"><ArrowIcon direction="left"/> Membership plans</Link><header className="hc-billing-heading"><h1>{trialEndsAt?"Your existing access":"Verify your email"}</h1><p>{trialEndsAt?"Your previously activated promotional access is unchanged.":"Finish setting up your free Herocon account."}</p></header><div className="hc-billing-card">{trialEndsAt?<><p>Your access ends {new Date(trialEndsAt).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/London"})} (UK time). No automatic renewal or payment.</p><p>After expiry your account returns to Free unless you choose Premium. Your saved products remain available.</p><Link className="hc-billing-action hc-billing-primary" href="/search">Browse catalogue <ArrowIcon direction="right"/></Link><Link className="hc-billing-action" href="/membership/activate">Join Premium <ArrowIcon direction="right"/></Link></>:<PendingTrialVerification email={pending!}/>}</div></section></main>;
}
