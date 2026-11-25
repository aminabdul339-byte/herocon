import "server-only";
import {cache} from "react";
import type {Customer} from "@/lib/customer-auth";
import {hasLiveMembership} from "@/lib/membership-billing";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import {activePremiumTrial} from "@/lib/premium-trial";
import {resolvePremiumEntitlement} from "@/lib/premium-trial-model";
export const membershipEntitlement=cache(async(customer:Customer):Promise<{premium:boolean;trialEndsAt:string|null}>=>{
 if(isOwnerPremiumCustomer(customer))return resolvePremiumEntitlement(true,false,null);
 const trial=await activePremiumTrial(customer);
 if(trial)return resolvePremiumEntitlement(false,false,trial);
 try{return resolvePremiumEntitlement(false,await hasLiveMembership(customer),null);}catch{return resolvePremiumEntitlement(false,false,null);}
});
export async function checkActiveMembership(customer:Customer):Promise<boolean>{return (await membershipEntitlement(customer)).premium;}
