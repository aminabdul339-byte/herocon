import "server-only";
import type {Customer} from "@/lib/customer-auth";
import {hasLiveMembership} from "@/lib/membership-billing";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
/** Public memberships require Stripe; the one verified owner account has a complimentary premium grant. */
export async function checkActiveMembership(customer:Customer):Promise<boolean>{
 if(isOwnerPremiumCustomer(customer))return true;
 try{return await hasLiveMembership(customer);}catch{return false;}
}
