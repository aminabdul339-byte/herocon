import Link from "next/link";
const SUPPORT="aminabdul339@outlook.com";
export default function Footer(){
 return <footer className="sc-footer">
  <div className="sc-footer-top">
   <div className="hc-footer-identity"><Link className="sc-footer-brand" href="/">hero<span>con.</span></Link><p>Discover products. Understand the process.<br/>Build your business with confidence.</p></div>
   <div className="sc-footer-links">
    <div><strong>Discover</strong><Link href="/search">All products</Link><Link href="/search?category=Home%20%26%20Decor">Home &amp; Decor</Link><Link href="/saved">Saved products</Link></div>
    <div><strong>Learn</strong><Link href="/start-a-business">Start a business</Link><Link href="/how-it-works">How sourcing works</Link><Link href="/cart">Shopping cart</Link></div>
    <div className="hc-footer-support"><strong>Need help?</strong><Link href="/contact">Contact us</Link><a href={`mailto:${SUPPORT}?subject=Herocon%20support%20enquiry`}>Email our support team <span aria-hidden="true">↗</span></a></div>
   </div>
  </div>
  <div className="sc-footer-bottom">
   <span>© {new Date().getFullYear()} Herocon. Product discovery and sourcing education. <Link className="hc-footer-bottom-contact" href="/contact">Contact us for support</Link></span>
   <span>Marketplace prices exclude shipping, duties, VAT and service fees. Herocon does not guarantee third-party supplier quality.</span>
  </div>
 </footer>;
}
