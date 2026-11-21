import Link from "next/link";
import Header from "@/components/Header";
import type {Metadata} from "next";

export const metadata:Metadata={
  title:"Herocon — Discover Products. Explore the Source.",
  description:"Find fashion, accessories and original product listings from 1688, Taobao and Weidian. Discover for yourself or explore sourcing for your business."
};

const PHOTOS={
  personal:"https://images.pexels.com/photos/7679685/pexels-photo-7679685.jpeg?auto=compress&cs=tinysrgb&w=1300&q=85",
  business:"https://images.pexels.com/photos/34221998/pexels-photo-34221998.jpeg?auto=compress&cs=tinysrgb&w=1300&q=85"
};

function Arrow({up=false}:{up?:boolean}){
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" focusable="false">{up?<path d="M5 19 19 5M8 5h11v11"/>:<path d="M4 12h16m-7-7 7 7-7 7"/>}</svg>;
}

export default function Home(){
  return <main className="hm-home">
    <Header/>
    <section className="hm-intro" aria-labelledby="hm-title">
      <div className="hm-shell">
        <div className="hm-eyebrow"><span className="hm-dot"/> WELCOME TO HEROCON <span className="hm-eyebrow-line"/></div>
        <h1 id="hm-title">Discover your next find.<br/><em>Source your next idea.</em></h1>
        <p className="hm-intro-description">Explore products from 1688, Taobao and Weidian. Find something for yourself, or discover original marketplace suppliers for a business.</p>
        <span className="hm-intro-cue">CHOOSE YOUR EXPERIENCE <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 4v16m-6-6 6 6 6-6"/></svg></span>
      </div>
    </section>

    <section className="hm-options hm-shell" aria-label="Explore Herocon">
      <Link className="hm-option hm-option-personal" href="/shop-for-yourself" aria-label="Shop for yourself: browse fashion, accessories and everyday finds">
        <div className="hm-option-photo"><img src={PHOTOS.personal} alt="Warm brown coats and jackets displayed on a boutique clothing rail" width={900} height={1100} fetchPriority="high"/></div>
        <div className="hm-option-content">
          <span className="hm-option-eyebrow">01 / FOR YOURSELF</span>
          <div className="hm-option-bottom"><div><h2>Shop for <em>yourself.</em></h2><p>Fashion, accessories and the little finds you love.</p></div>
          <span className="hm-option-action">Explore the edit <Arrow up/></span></div>
        </div>
      </Link>
      <Link className="hm-option hm-option-business" href="/start-a-business" aria-label="Start a business: explore products and original marketplace suppliers">
        <div className="hm-option-photo"><img src={PHOTOS.business} alt="Real photograph of stacked shipping boxes in a sourcing warehouse" width={900} height={1100} fetchPriority="high"/></div>
        <div className="hm-option-content">
          <span className="hm-option-eyebrow">02 / FOR YOUR BUSINESS</span>
          <div className="hm-option-bottom"><div><h2>Start a <em>business.</em></h2><p>Explore products, suppliers and your next big idea.</p></div>
          <span className="hm-option-action">Explore sourcing <Arrow up/></span></div>
        </div>
      </Link>
    </section>

    <div className="hm-bottom hm-shell">
      <p>Real finds. Original marketplace links. <span>One place to discover more.</span></p>
      <div><Link href="/search">Search all products <Arrow up/></Link><Link href="/how-it-works">How sourcing works <Arrow up/></Link></div>
    </div>
    <p className="hm-disclaimer hm-shell">Herocon helps you discover products and original sources. Purchases are currently handled by external marketplaces or buying agents.</p>
  </main>;
}
