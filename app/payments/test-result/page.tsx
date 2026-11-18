import Header from "@/components/Header";
import Link from "next/link";
import type {Metadata} from "next";

export const metadata:Metadata={title:"Stripe checkout test",description:"Return page for Herocon's private Stripe payment integration test."};
export default function TestPaymentResult(){
 return <main className="sc-guide-page"><Header/>
  <section className="sc-page-hero sc-container"><p className="sc-kicker">PAYMENT INTEGRATION TEST</p>
   <h1>Test checkout <em>returned.</em></h1>
   <p>This page is for Herocon's internal Stripe sandbox only. No real purchase, supplier order or shipment will be created.</p>
   <p>Returning here does not independently prove payment. The private Stripe webhook confirms the payment and records a minimal test receipt.</p>
   <div className="sc-button-row"><Link className="sc-button sc-button-dark" href="/cart">Back to cart ↗</Link><Link className="sc-button sc-button-outline" href="/landed-cost">Estimate shipping →</Link></div>
  </section>
 </main>;
}
