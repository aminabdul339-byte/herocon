import Header from "@/components/Header";
import Link from "next/link";
import {currentCustomer} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import OwnerTestCheckout from "@/components/OwnerTestCheckout";
import "../owner-order.css";
export const dynamic="force-dynamic";
export default async function Page(){const owner=isOwnerPremiumCustomer(await currentCustomer());return <main><Header/><section className="hc-owner-order"><p className="sc-kicker">HEROCON / CHECKOUT</p><h1>Review your order.</h1>{owner?<OwnerTestCheckout/>:<p>Owner test checkout only. <Link href="/account?next=%2Fowner%2Fcheckout">Sign in</Link></p>}</section></main>;}
