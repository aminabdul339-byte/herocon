import "server-only";
import type {Customer} from "@/lib/customer-auth";
import {hasLiveMembership} from "@/lib/membership-billing";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
/** The cart is free. Only a Stripe-verified LIVE subscription unlocks new buying. */
export async function checkActiveMembership(customer:Customer):Promise<boolean>{
 if(isOwnerPremiumCustomer(customer))return true;
 try{return await hasLiveMembership(customer);}catch{return false;}
}
