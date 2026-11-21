"use client";
import {ArrowIcon} from "@/components/ArrowIcon";
import Link from "next/link";
import {usePathname} from "next/navigation";
const SUPPORT="aminabdul339@outlook.com";
export default function Footer(){
 const pathname=usePathname();
 const showSourcingGuide=pathname!=="/";
 return <footer className="sc-footer">
  <div className="sc-footer-top">
   <div className="hc-footer-identity"><Link className="sc-footer-brand" href="/">hero<span>con.</span></Link><p>Explore Chinese marketplaces.<br/>Plan sourcing with Herocon.</p></div>
   <div className="sc-footer-links">
    <div><strong>Discover</strong><Link href="/search">All products</Link><Link href="/shop-for-yourself">Shop for yourself</Link><Link href="/search?category=Home%20%26%20Decor">Home &amp; Decor</Link></div>
    <div><strong>Learn</strong><Link href="/start-a-business">Start a business</Link>{showSourcingGuide&&<Link href="/how-it-works">How sourcing works</Link>}<Link href="/membership">Membership</Link><Link href="/cart">Shopping cart</Link></div>
    <div className="hc-footer-support"><strong>Need help?</strong><Link href="/contact">Contact us</Link><a href={`mailto:${SUPPORT}?subject=Herocon%20support%20enquiry`}>Email our support team <span aria-hidden="true"><ArrowIcon/></span></a></div>
   </div>
  </div>
  <div className="hc-footer-legal">
   <nav className="hc-footer-legal-links" aria-label="Legal information and content reporting">
    <Link href="/privacy-policy">Privacy Policy</Link>
    <Link href="/terms-and-conditions">Terms and Conditions</Link>
    <Link href="/cookie-settings">Cookie Settings</Link>
    <Link href="/ip">IP Reporting</Link>
    <Link href="/dsa">DSA Reporting</Link>
    <Link href="/imprint">Imprint</Link>
   </nav>
   <p className="hc-footer-disclosure">Herocon displays product information obtained from submitted marketplace links and imported third-party catalogues. Listing data and images may be provided by suppliers, marketplaces and sourcing partners; we do not independently authenticate products, brand rights or supplier claims. Herocon offers an optional paid £9.99/month early-access membership. Product purchasing, warehouse fulfilment and international shipping payments are not yet available. External seller and purchasing-partner links lead to independently operated services. Trademarks and logos remain the property of their respective owners; their appearance does not imply brand endorsement or affiliation. Report intellectual-property concerns through <Link href="/ip">IP Reporting</Link> and suspected illegal content under applicable EU law through <Link href="/dsa">DSA Reporting</Link>.</p>
  </div>
  <div className="sc-footer-bottom">
   <span>© {new Date().getFullYear()} Herocon. Chinese marketplace sourcing. <Link className="hc-footer-bottom-contact" href="/contact">Contact us for support</Link></span>
   <span>Marketplace prices exclude shipping, duties, VAT and service fees. Herocon does not guarantee third-party supplier quality.</span>
  </div>
 </footer>;
}
