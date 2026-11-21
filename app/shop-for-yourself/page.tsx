import type {Metadata} from "next";
import Header from "@/components/Header";
import ShopForYourself from "@/components/ShopForYourself";
import "./shop-for-yourself.css";
import "./personal-shop-v2.css";

export const metadata:Metadata={
 title:"Shop for Yourself — Women's & Men's Edit | Herocon",
 description:"Discover women's handbags, men's fashion, and shared unisex shoes and sunglasses. Browse real item photographs and original Weidian, Taobao and 1688 listings."
};
export const dynamic="force-dynamic";
const PERSONAL_PHOTO="https://images.pexels.com/photos/7679685/pexels-photo-7679685.jpeg?auto=compress&cs=tinysrgb&w=1400&q=85";

export default async function ShopForYourselfPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const params=await searchParams;
 const audience=params.audience==="men"?"men":"women";
 const category=(params.category||"All").slice(0,40);
 const q=(params.q||"").slice(0,120);
 const sort=params.sort==="name"?"name":"featured";
 const requestedPage=Number.parseInt(params.page||"1",10);
 const page=Number.isFinite(requestedPage)?Math.max(1,requestedPage):1;
 return <main className="hc-self hc-self-v2">
  <Header/>
  <section className="hc-self-editorial" aria-labelledby="hc-self-editorial-title">
    <div className="hc-self-editorial-grid">
      <div className="hc-self-editorial-copy">
        <span className="hc-self-editorial-label">THE PERSONAL EDIT / HEROCON</span>
        <h1 id="hc-self-editorial-title">A little<br/>something <em>for you.</em></h1>
        <p>Find the pieces that feel like you. Explore women&apos;s handbags, men&apos;s fashion and shared favourites — including shoes and sunglasses — with direct links to the original marketplaces.</p>
        <div className="hc-self-editorial-actions hc-personal-hero-actions">
          <a href="/shop-for-yourself?audience=women#browse-finds" className={"hc-self-editorial-cta"+(audience==="women"?" is-active":"")}>Shop women <span aria-hidden="true">→</span></a>
          <a href="/shop-for-yourself?audience=men#browse-finds" className={"hc-self-editorial-cta"+(audience==="men"?" is-active":"")}>Shop men <span aria-hidden="true">→</span></a>
        </div>
      </div>
      <div className="hc-self-editorial-image">
        <img src={PERSONAL_PHOTO} alt="Warm brown jackets on a boutique rail in a neutral dressing room" width={800} height={1000} fetchPriority="high"/>
        <span><span>THE PERSONAL EDIT</span><span>WOMEN / MEN / UNISEX</span></span>
      </div>
    </div>
    <div className="hc-self-editorial-strip"><span>WOMEN &amp; MEN</span><span>HANDBAGS · FASHION · UNISEX FAVOURITES</span><span>ORIGINAL MARKETPLACE LINKS</span></div>
  </section>
  <ShopForYourself filters={{audience,category,q,sort,page}}/>
  <section className="hc-self-note">
    <div className="hc-self-wrap hc-self-note-inner"><div><p className="hc-self-eyebrow">SHOP WITH CLARITY</p><h2>Every find has <em>a source.</em></h2></div>
    <div><p>Open each product for its photograph, reference price and original marketplace listing. No buying-agent redirects are used as direct product links.</p>
    <p>Photos and links come from third-party listings. Herocon does not independently authenticate branded goods, guarantee seller availability or verify product safety or fulfilment. Prices exclude shipping, customs and other charges; checkout through Herocon is not yet live.</p></div></div>
  </section>
 </main>;
}
