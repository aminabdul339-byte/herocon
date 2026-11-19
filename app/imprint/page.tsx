import type {Metadata} from "next";
import Link from "next/link";
import LegalPage,{LegalSection,LegalContact} from "@/components/LegalPage";
export const metadata:Metadata={title:"Imprint",description:"Herocon website, legal-operator disclosure status and official reporting contacts."};
export default function Imprint(){
 return <LegalPage eyebrow="SITE INFORMATION" title="Imprint" lead="The website and operator information for Herocon.">
  <LegalSection title="Platform information"><p><strong>Trading/site name:</strong> Herocon</p><p><strong>Website:</strong> <a href="https://herocon.store">https://herocon.store</a></p><p><strong>Service:</strong> product discovery, marketplace-link search, sourcing education and optional £9.99/month early-access membership billed via Stripe. Product ordering, warehouse fulfilment and international shipping payments are not yet available.</p></LegalSection>
  <LegalSection title="Legal operator details — completion required"><p className="hc-legal-alert">The legal operator's full registered or trading name, business/service address, and registration details where applicable have not yet been verified for publication. This Imprint is therefore incomplete and should be completed before Herocon is promoted as a public commercial service.</p><p>These details must be supplied and checked by the operator; we will not publish an invented company name, registration number or address.</p></LegalSection>
  <LegalSection title="Contact and content reporting"><p>For enquiries, <LegalContact subject="Herocon business enquiry" label="contact the Herocon team"/>. For copyright or trademark claims, visit <Link href="/ip">IP Reporting</Link>. For suspected illegal content under applicable EU law, visit <Link href="/dsa">DSA Reporting</Link>. For information about personal-data requests, visit the <Link href="/privacy-policy">Privacy Policy</Link>.</p></LegalSection>
 </LegalPage>;
}
