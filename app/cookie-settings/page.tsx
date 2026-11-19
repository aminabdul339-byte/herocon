import type {Metadata} from "next";
import LegalPage,{LegalSection} from "@/components/LegalPage";
import CookieSettingsPanel from "@/components/CookieSettingsPanel";
export const metadata:Metadata={title:"Cookie Settings",description:"Review Herocon browser storage and clear your local cart, saved items and privacy preferences."};
export default function CookieSettings(){
 return <LegalPage eyebrow="YOUR CONTROLS" title="Cookie Settings" lead="Choose how local site preferences are stored and see which optional tracking tools are in use.">
  <LegalSection title="Browser storage controls"><p>Herocon uses browser storage to remember saved products and shopping-cart selections. We do not currently run optional advertising or analytics trackers in Herocon's own app code. Hosting infrastructure may use strictly necessary security technologies.</p><CookieSettingsPanel/></LegalSection>
  <LegalSection title="Why does browser storage matter?"><p>Local storage and cookies are ways that a website or service remembers information. Clearing data here removes Herocon's cart and saved-product preferences from this browser; it does not erase any messages already sent to support or listings already saved on the Herocon server.</p><p>If tracking or analytics technologies are added later, we must update this page and implement any legally required consent controls before activating them. See the Privacy Policy for more information.</p></LegalSection>
 </LegalPage>;
}
