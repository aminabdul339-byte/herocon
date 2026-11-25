"use client";
import MembershipPlans from "@/components/MembershipPlans";
import {useCart} from "@/components/CartProvider";
export default function HomepageMembership(){const {account}=useCart();return <MembershipPlans member={account.premium===true||account.ownerPremium===true} owner={account.ownerPremium===true} signedIn={account.status==="authenticated"} trialEndsAt={account.trialEndsAt??null}/>;}
