import "server-only";
import {cache} from "react";
import type {Customer} from "@/lib/customer-auth";
import {hasLiveMembership} from "@/lib/membership-billing";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import {activePremiumTrial} from "@/lib/premium-trial";
import {resolvePremiumEntitlement} from "@/lib/premium-trial-model";
export const membershipEntitlement=cache(async(customer:Customer):Promise<{premium:boolean;trialEndsAt:string|null}>=>{
 if(isOwnerPremiumCustomer(customer))return resolvePremiumEntitlement(true,false,null);
 try{if(await hasLiveMembership(customer))return resolvePremiumEntitlement(false,true,null);}catch{}
 const trial=await activePremiumTrial(customer);
 return resolvePremiumEntitlement(false,false,trial);
});
export async function checkActiveMembership(customer:Customer):Promise<boolean>{return (await membershipEntitlement(customer)).premium;}
