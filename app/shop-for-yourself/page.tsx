import type {Metadata} from "next";
import {catalogueAccess} from "@/lib/catalogue-access";
import Header from "@/components/Header";
import ShopForYourself from "@/components/ShopForYourself";
import {getPersonalShopRates} from "@/lib/personal-shop-fx";
import "./shop-for-yourself.css";
import "./personal-shop-v2.css";

export const metadata:Metadata={
 title:"Shop for Yourself — Women’s & Men’s Collections | Herocon",
 description:"Discover women's handbags, men's fashion, and shared unisex shoes and sunglasses. Browse real item photographs and original Weidian, Taobao and 1688 listings."
};
export const dynamic="force-dynamic";

export default async function ShopForYourselfPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const [params,access]=await Promise.all([searchParams,catalogueAccess()]);
 const audience=params.audience==="men"?"men":"women";
 const category=(params.category||"All").slice(0,40);
 const q=typeof params.q==="string"?params.q.slice(0,120):"";
 const sort=params.sort==="name"?"name":"featured";
 const requestedPage=Number.parseInt(params.page||"1",10);
 const page=Number.isFinite(requestedPage)?Math.max(1,requestedPage):1;
 const rates=await getPersonalShopRates();
 return <main className="hc-self hc-self-v2" data-audience={audience}>
  <Header/>
  <ShopForYourself filters={{audience,category,q,sort,page}} rates={rates} premium={access.premium}/>
  <section className="hc-self-note">
    <div className="hc-self-wrap hc-self-note-inner"><div><p className="hc-self-eyebrow">SHOP WITH CLARITY</p><h2>Every find has <em>a source.</em></h2></div>
    <div><p>Open each product for its photograph, reference price and original marketplace listing. No buying-agent redirects are used as direct product links.</p>
    <p>Photos and links come from third-party listings. Herocon does not independently authenticate branded goods, guarantee seller availability or verify product safety or fulfilment. Prices exclude shipping, customs and other charges; checkout through Herocon is not yet live.</p></div></div>
  </section>
 </main>;
}
