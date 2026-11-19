import "server-only";
import type {Customer} from "@/lib/customer-auth";
import {hasLiveMembership} from "@/lib/membership-billing";
/** The cart is free. Only a Stripe-verified LIVE subscription unlocks new buying. */
export async function checkActiveMembership(customer:Customer):Promise<boolean>{
 try{return await hasLiveMembership(customer);}catch{return false;}
}
