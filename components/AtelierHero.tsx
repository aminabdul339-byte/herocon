import Link from "next/link";
import {ArrowIcon} from "@/components/ArrowIcon";
import {productPrice,productId} from "@/lib/catalogue";
import type {Product} from "@/lib/types";
import DiscoveryMotion from "@/components/DiscoveryMotion";

const edit=[
 {id:"YjXAnN1cosMO1iGVWJw5FA",title:"Ribbed bodycon dress",marketplace:"1688"},
 {id:"HEWCWVJ5M7RL3Y-J_uV0bg",title:"Body-wave wig",marketplace:"1688"},
 {id:"qLiCZEEhOnut6fHdkH-Bow",title:"Moissanite ring",marketplace:"Taobao"},
 {id:"j2R9wzAx7bv39GGzSRkj3Q",title:"Silent Wind Abstract Art",marketplace:"1688"}
] as const;

export default function AtelierHero({products}:{products:Product[]}){
 const cards=edit.flatMap((entry,index)=>{
  const p=products.find(p=>productId(p)===entry.id&&p.imageUrl&&p.originalMarketplaceUrl);
  if(!p||!p.imageUrl)return [];
  return [{id:entry.id,title:entry.title,marketplace:entry.marketplace,image:p.imageUrl,price:productPrice(p),position:index+1}];
 });
 return <section className="hd-studio" aria-labelledby="hd-studio-title">
  <div className="hd-studio-copy">
   <p className="hd-studio-eyebrow"><span aria-hidden="true"/>THE HEROCON MARKETPLACE</p>
   <h1 id="hd-studio-title">Your link<br className="hd-desktop-break"/> to China<span className="hd-brand-dot">.</span></h1>
   <p className="hd-studio-description">Shop for yourself or source for your business. Explore original listings from Chinese marketplaces, all through Herocon.</p>
   <div className="hd-studio-actions">
    <Link href="/search" className="hd-studio-action hd-studio-primary">Source for your business <ArrowIcon direction="right"/></Link>
    <Link href="/shop-for-yourself" className="hd-studio-action hd-studio-secondary">Shop for yourself <ArrowIcon direction="right"/></Link>
   </div>
   <div className="hd-studio-marketplaces" aria-label="Marketplace sources"><span>Explore listings from</span><div><b>1688</b><b>Taobao</b><b>Weidian</b><b>Tmall</b></div></div>
  </div>
  <DiscoveryMotion cards={cards}/>
 </section>;
}
