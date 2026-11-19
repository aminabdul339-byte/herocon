import type {Metadata} from "next";
import Link from "next/link";
import LegalPage,{LegalSection,LegalContact} from "@/components/LegalPage";
import LegalReportForm from "@/components/LegalReportForm";
export const metadata:Metadata={title:"IP Reporting",description:"Report a possible copyright, trademark or other intellectual property infringement in a Herocon listing."};
export default function IPReporting(){
 return <LegalPage eyebrow="RIGHTS HOLDERS" title="IP Reporting" lead="Tell us if a listing appears to misuse your copyright, trademark or other intellectual property rights.">
  <LegalSection title="What can be reported?"><p>Herocon indexes and displays product information from external providers and submitted links. We do not independently confirm the authenticity or trademark status of individual items. If a product image, description, name or linked listing appears to infringe your rights, you can ask for review.</p><p>Include the exact Herocon URL, a description of the protected work or mark, your authority to report, and an explanation of the alleged infringement. Please identify the specific material rather than reporting an entire category of products without details.</p></LegalSection>
  <LegalSection title="Prepare an intellectual property report"><LegalReportForm kind="ip"/></LegalSection>
  <LegalSection title="What happens after a report?"><p>We can review the identified listing, request clarification and, where warranted, restrict or remove it. A listing being indexed does not mean Herocon is affiliated with its named brand. You can also <LegalContact subject="Herocon intellectual property concern" label="email our support channel"/> directly. For non-IP content that you believe is unlawful under EU law, see <Link href="/dsa">DSA Reporting</Link>.</p></LegalSection>
 </LegalPage>;
}
