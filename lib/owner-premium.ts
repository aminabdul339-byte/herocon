import "server-only";
import type {Customer} from "@/lib/customer-auth";

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

/**
 * Complimentary Herocon owner premium. No Stripe subscription is created.
 * Match the immutable verified Supabase Auth user ID, never email, cookies,
 * client-supplied profile data or editable user_metadata.
 * Only the single provisioned account can buy during the private pilot.
 */
export function isOwnerPremiumCustomer(customer:Customer|null|undefined):boolean{
 const ownerId=(process.env.HEROCON_MEMBERSHIP_OWNER_TEST_USER_ID||"").trim();
 return Boolean(customer&&UUID.test(ownerId)&&customer.id===ownerId);
}
