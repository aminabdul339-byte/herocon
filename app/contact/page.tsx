import {ArrowIcon} from "@/components/ArrowIcon";
import Header from "@/components/Header";
import Link from "next/link";
import type {Metadata} from "next";
export const metadata:Metadata={
 title:"Contact Herocon support",
 description:"Contact Herocon's support team about product discovery, sourcing questions, or website problems."
};
const email="aminabdul339@outlook.com";
export default function ContactPage(){
 return <main className="hc-contact-page">
  <Header/>
  <section className="hc-contact-intro sc-container">
   <p className="sc-kicker">HERE WHEN YOU NEED US</p>
   <h1>How can we <em>help?</em></h1>
   <p>Have a question about a product, finding a supplier or using Herocon? We’d love to hear from you.</p>
   <div className="hc-contact-panel">
    <div className="hc-contact-icon" aria-hidden="true"><svg viewBox="0 0 48 48" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="38" height="29" rx="3"/><path d="m6 14 18 14 18-14"/></svg></div>
    <div><span className="hc-contact-label">EMAIL SUPPORT</span><h2>Talk to the Herocon team</h2><p>Send us a message using your email app. Please include the product link or order reference if your question concerns a particular item.</p>
     <a className="hc-contact-send" href={`mailto:${email}?subject=Herocon%20support%20enquiry`}>Send support email <span aria-hidden="true"><ArrowIcon/></span></a>
    </div>
   </div>
   <p className="hc-contact-privacy">Your email app handles sending the message; Herocon doesn't collect or save your email through this page. Never send passwords, bank details or API keys in a support message.</p>
   <Link className="hc-contact-back" href="/how-it-works">Explore our sourcing guide <span aria-hidden="true"><ArrowIcon/></span></Link>
  </section>
 </main>;
}
