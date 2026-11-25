import Header from "@/components/Header";
import Link from "next/link";
import {currentCustomer} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import HiobuyTestJourney from "@/components/HiobuyTestJourney";
import "./test.css";
export const dynamic="force-dynamic";
export default async function TestPage(){const owner=isOwnerPremiumCustomer(await currentCustomer());return <main><Header/><section className="hio-test-shell"><Link href="/owner/hiobuy">Back to fulfilment setup</Link><p className="sc-kicker">HEROCON / PRIVATE TEST WORKSPACE</p><h1>Test the entire order journey.</h1>{owner?<HiobuyTestJourney/>:<p>Sign in as the Herocon owner. <Link href="/account?next=%2Fowner%2Fhiobuy%2Ftest">Sign in</Link></p>}</section></main>;}
