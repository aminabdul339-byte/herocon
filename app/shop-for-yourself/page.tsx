import type {Metadata} from "next";
import Header from "@/components/Header";
import ShopForYourself from "@/components/ShopForYourself";
import {ShopAudienceIcon} from "@/components/ShopIcons";
import {getPersonalShopRates} from "@/lib/personal-shop-fx";
import "./shop-for-yourself.css";
import "./personal-shop-v2.css";

export const metadata:Metadata={
 title:"Shop for Yourself — Women's & Men's Edit | Herocon",
 description:"Discover women's handbags, men's fashion, and shared unisex shoes and sunglasses. Browse real item photographs and original Weidian, Taobao and 1688 listings."
};
export const dynamic="force-dynamic";
const WOMEN_PHOTO="https://images.pexels.com/photos/32487723/pexels-photo-32487723.jpeg?auto=compress&cs=tinysrgb&w=1400&q=85";
const MEN_PHOTO="https://images.pexels.com/photos/7679685/pexels-photo-7679685.jpeg?auto=compress&cs=tinysrgb&w=1400&q=85";

export default async function ShopForYourselfPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const params=await searchParams;
 const audience=params.audience==="men"?"men":"women";
 const category=(params.category||"All").slice(0,40);
 const q=(params.q||"").slice(0,120);
 const sort=params.sort==="name"?"name":"featured";
 const requestedPage=Number.parseInt(params.page||"1",10);
 const page=Number.isFinite(requestedPage)?Math.max(1,requestedPage):1;
 const rates=await getPersonalShopRates();
 return <main className="hc-self hc-self-v2" data-audience={audience}>
  <Header/>
  <section className="hc-self-editorial" aria-labelledby="hc-self-editorial-title">
    <div className="hc-self-editorial-grid">
      <div className="hc-self-editorial-copy">
        <span className="hc-self-editorial-label">{audience==="women"?"THE WOMEN’S EDIT":"THE MEN’S EDIT"} / HEROCON</span>
        <h1 id="hc-self-editorial-title">{audience==="women"?<>Find your <em>signature.</em></>:<>Made to <em>be yours.</em></>}</h1>
        <p>{audience==="women"?"An edit of handbags, accessories and everyday treasures — with footwear and sunglasses worth discovering.":"Thoughtfully chosen clothing, shoes and finishing touches, with original-source details at your fingertips."} Discover the original marketplace behind each piece.</p>
        <div className="hc-self-editorial-actions hc-personal-hero-actions">
          <a href="/shop-for-yourself?audience=women#browse-finds" className={"hc-self-editorial-cta"+(audience==="women"?" is-active":"")}><ShopAudienceIcon audience="women"/> Women <span aria-hidden="true">↗</span></a>
          <a href="/shop-for-yourself?audience=men#browse-finds" className={"hc-self-editorial-cta"+(audience==="men"?" is-active":"")}><ShopAudienceIcon audience="men"/> Men <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      <div className="hc-self-editorial-image">
        <img src={audience==="women"?WOMEN_PHOTO:MEN_PHOTO} alt={audience==="women"?"Warm brown handbag in an elegant neutral wardrobe":"Warm brown jackets on a boutique rail in a neutral dressing room"} width={800} height={1000} fetchPriority="high"/>
        <span><span>{audience==="women"?"THE WOMEN’S EDIT":"THE MEN’S EDIT"}</span><span>STYLED TO DISCOVER</span></span>
      </div>
    </div>
    <div className="hc-self-editorial-strip"><span>{audience==="women"?"THE HANDBAG EDIT":"THE EVERYDAY EDIT"}</span><span>{audience==="women"?"BAGS · JEWELLERY · FOOTWEAR":"CLOTHING · FOOTWEAR · ACCESSORIES"}</span><span>ORIGINAL MARKETPLACE LINKS</span></div>
  </section>
  <ShopForYourself filters={{audience,category,q,sort,page}} rates={rates}/>
  <section className="hc-self-note">
    <div className="hc-self-wrap hc-self-note-inner"><div><p className="hc-self-eyebrow">SHOP WITH CLARITY</p><h2>Every find has <em>a source.</em></h2></div>
    <div><p>Open each product for its photograph, reference price and original marketplace listing. No buying-agent redirects are used as direct product links.</p>
    <p>Photos and links come from third-party listings. Herocon does not independently authenticate branded goods, guarantee seller availability or verify product safety or fulfilment. Prices exclude shipping, customs and other charges; checkout through Herocon is not yet live.</p></div></div>
  </section>
 </main>;
}
