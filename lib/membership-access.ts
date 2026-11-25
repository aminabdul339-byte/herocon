import "server-only";
import {cache} from "react";
import type {Customer} from "@/lib/customer-auth";
import {hasLiveMembership} from "@/lib/membership-billing";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import {activePremiumTrial} from "@/lib/premium-trial";
export const membershipEntitlement=cache(async(customer:Customer):Promise<{premium:boolean;trialEndsAt:string|null}>=>{
 if(isOwnerPremiumCustomer(customer))return {premium:true,trialEndsAt:null};
 try{if(await hasLiveMembership(customer))return {premium:true,trialEndsAt:null};}catch{}
 const trial=await activePremiumTrial(customer);
 return {premium:!!trial,trialEndsAt:trial?.endsAt??null};
});
export async function checkActiveMembership(customer:Customer):Promise<boolean>{return (await membershipEntitlement(customer)).premium;}
