import Header from "@/components/Header";
import Link from "next/link";
import {currentCustomer} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import OwnerTestOrders from "@/components/OwnerTestOrders";
import "../owner-order.css";
export const dynamic="force-dynamic";
export default async function Page(){const owner=isOwnerPremiumCustomer(await currentCustomer());return <main><Header/><section className="hc-owner-order"><p className="sc-kicker">MY HEROCON / ORDER UPDATES</p><h1>My test orders.</h1>{owner?<OwnerTestOrders/>:<p>Owner access only. <Link href="/account?next=%2Fowner%2Forders">Sign in</Link></p>}</section></main>;}
