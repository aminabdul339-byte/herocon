import type {Metadata} from "next";
import Link from "next/link";
import LegalPage,{LegalSection,LegalContact} from "@/components/LegalPage";
import LegalReportForm from "@/components/LegalReportForm";
export const metadata:Metadata={title:"DSA Reporting",description:"Report Herocon content you believe to be illegal under applicable EU law."};
export default function DSAReporting(){
 return <LegalPage eyebrow="CONTENT REPORTING" title="DSA Reporting" lead="A route to identify specific content you believe is illegal under applicable European Union law.">
  <LegalSection title="Report suspected illegal content"><p>The EU Digital Services Act provides notice-and-action rules for covered intermediary and hosting services. We provide this reporting route to help visitors flag a specific Herocon listing or piece of content. Whether particular DSA obligations apply to Herocon depends on its service and territorial scope; this page is not a claim of regulatory certification.</p><p>Provide the precise Herocon URL, a clear explanation of the concern and, if known, the relevant law or reason it is unlawful. You may include supporting evidence. Avoid sending unnecessary sensitive personal information.</p></LegalSection>
  <LegalSection title="Prepare a DSA content report"><LegalReportForm kind="dsa"/></LegalSection>
  <LegalSection title="Review and other routes"><p>We may examine reports, request more information and restrict content where appropriate. This email-based process requires the reporter to send the prepared message; it is not an in-site submission or an automated acknowledgement system. Anyone needing to raise an intellectual-property concern can also use <Link href="/ip">IP Reporting</Link>. General enquiries can be sent through <LegalContact subject="Herocon DSA reporting enquiry" label="our contact channel"/>.</p><p>Read the <a href="https://digital-strategy.ec.europa.eu/en/factpages/user-rights-under-digital-services-act" target="_blank" rel="noopener noreferrer">European Commission's DSA user-rights guidance</a> for further information.</p></LegalSection>
 </LegalPage>;
}
