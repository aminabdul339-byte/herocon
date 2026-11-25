import Header from "@/components/Header";
import MembershipPlans from "@/components/MembershipPlans";
import {catalogueAccess} from "@/lib/catalogue-access";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import type {Metadata} from "next";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Herocon Membership — Free and Premium",description:"Compare Free and £9.99 monthly Premium catalogue access. Live sourcing and purchasing are in rollout."};
export default async function Page(){const {customer,premium}=await catalogueAccess();return <main className="hc-member-page hc-membership-clean"><Header/><MembershipPlans standalone member={premium} owner={isOwnerPremiumCustomer(customer)} signedIn={!!customer}/></main>;}
