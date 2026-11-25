import Header from "@/components/Header";
import Link from "next/link";
import {currentCustomer} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import HiobuyReadiness from "@/components/HiobuyReadiness";
export const dynamic="force-dynamic";
export default async function HioBuyOwnerPage(){
 const owner=isOwnerPremiumCustomer(await currentCustomer());
 return <main><Header/><section style={{maxWidth:900,margin:"0 auto",padding:"42px 24px 70px",color:"#284332"}}><p className="sc-kicker">HEROCON / SOURCING INFRASTRUCTURE</p><h1>HioBuy fulfilment setup.</h1>{owner?<><p>New provider migration. Existing product details and cart selections remain available. No live product payment is enabled.</p><div style={{display:"flex",gap:12,flexWrap:"wrap",margin:"20px 0"}}><Link className="sc-button sc-button-dark" href="/find-product">Product discovery</Link><Link className="sc-button" href="/enrichment">Saved catalogue</Link></div><HiobuyReadiness/><section style={{marginTop:30}}><h2>Before launch</h2><p>Confirm production channel permissions and plan; verify native product and SKU identifiers; test order preview, warehouse procurement, shipping quotes, payments and tracking with approved test credentials. Verify supplier costs and shipping totals before accepting customer payments.</p><a href="https://developers.hiobuy.com/developer/fulfillment" target="_blank" rel="noopener noreferrer">Open HioBuy fulfilment portal</a></section></>:<p>Sign in with your owner account. <Link href="/account?next=%2Fowner%2Fhiobuy">Sign in</Link></p>}</section></main>;
}
