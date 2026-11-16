import Link from "next/link";
export default function Footer(){
  return <footer className="sc-footer">
    <div className="sc-footer-top">
      <div><Link className="sc-footer-brand" href="/">hero<span>con.</span></Link><p>Discover products. Understand the process.<br/>Build your business with confidence.</p></div>
      <div className="sc-footer-links"><div><strong>Discover</strong><Link href="/search">All products</Link><Link href="/search?category=Home%20%26%20Decor">Home &amp; Decor</Link><Link href="/saved">Saved products</Link></div><div><strong>Learn</strong><Link href="/start-a-business">Start a business</Link><Link href="/how-it-works">How sourcing works</Link><Link href="/sourcing">Sourcing brief builder</Link></div></div>
    </div>
    <div className="sc-footer-bottom"><span>© {new Date().getFullYear()} Herocon. Product discovery and sourcing education.</span><span>Marketplace prices exclude shipping, duties, VAT and service fees. Herocon does not guarantee third-party supplier quality.</span></div>
  </footer>;
}